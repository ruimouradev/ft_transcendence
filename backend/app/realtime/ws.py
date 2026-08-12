from dataclasses import dataclass, field
from uuid import uuid4

import pydantic
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.game.contract import (
    Catch, Challenge, Draw, Error, ErrorCode, Join, Pass, Play,
    PlayerAction, Start, Welcome, parse_action,
)
from app.game.engine import Game, GameError


@dataclass
class Player:
    id: str
    name: str
    token: str
    ws: WebSocket
    connected: bool = True


@dataclass
class Room:
    players: list[Player] = field(default_factory=list)
    game: Game | None = None


rooms: dict[str, Room] = {}


def err(code: ErrorCode, msg: str) -> Error:
    return Error(code=code, msg=msg)


async def reject(ws: WebSocket, code: ErrorCode, msg: str) -> None:
    await ws.send_text(err(code, msg).model_dump_json())


async def broadcast(room: Room) -> None:
    # The engine bumps seq itself, here we just send everyone their view
    if room.game is None:
        return
    for p in room.players:
        if p.connected:
            await p.ws.send_text(
                room.game.snapshot_for(p.id).model_dump_json()
            )


def apply(room: Room, player: Player, action: PlayerAction) -> Error | None:
    # The engine is the single source of truth for the rules, here we
    # only translate messages into calls
    if isinstance(action, Join):
        return err(ErrorCode.INVALID_MESSAGE, "already joined")

    try:
        if isinstance(action, Start):
            if player is not room.players[0]:
                return err(ErrorCode.INVALID_MESSAGE, "only the host starts")
            room.game.start()
        elif isinstance(action, Play):
            room.game.play(player.id, action.card, action.color,
                           action.uno, action.target)
        elif isinstance(action, Draw):
            room.game.draw(player.id)
        elif isinstance(action, Pass):
            room.game.do_pass(player.id)
        elif isinstance(action, Catch):
            room.game.catch(player.id, action.target)
        elif isinstance(action, Challenge):
            room.game.challenge(player.id)
    except GameError as e:
        return err(e.code, e.msg)

    if room.game.phase == "finished":
        pass  # record_match goes here (Bin's stats)

    return None


router = APIRouter()


async def seat_player(ws: WebSocket, room: Room, action: Join) -> Player:
    player = Player(id=f"p{len(room.players) + 1}", name=action.name,
                    token=uuid4().hex, ws=ws)
    room.players.append(player)
    # While in the lobby the game is rebuilt so it includes the new seat
    room.game = Game([(p.id, p.name) for p in room.players])
    await ws.send_text(
        Welcome(id=player.id, token=player.token).model_dump_json()
    )
    await broadcast(room)
    return player


@router.websocket("/ws/game/{room_id}")
async def game(ws: WebSocket, room_id: str) -> None:
    await ws.accept()
    room = rooms.setdefault(room_id, Room())
    player: Player | None = None
    try:
        while True:
            text = await ws.receive_text()
            try:
                action = parse_action(text)
            except pydantic.ValidationError:
                await reject(
                    ws, ErrorCode.INVALID_MESSAGE, "not a valid message"
                )
                continue

            if player is None:
                if not isinstance(action, Join):
                    await reject(ws, ErrorCode.INVALID_MESSAGE, "join first")
                    continue

                # Reconnection logic, the token from Welcome keeps the seat
                existing = None
                if action.token:
                    existing = next(
                        (p for p in room.players if p.token == action.token),
                        None,
                    )
                if existing:
                    if existing.connected:
                        await reject(ws, ErrorCode.INVALID_MESSAGE,
                                     "player already connected")
                    else:
                        player = existing
                        player.ws = ws
                        player.connected = True
                        room.game.set_connected(player.id, True)
                        await broadcast(room)
                elif ((room.game is not None
                       and room.game.phase != "lobby")
                      or len(room.players) >= 4):
                    await reject(ws, ErrorCode.ROOM_FULL, "cannot join now")
                else:
                    player = await seat_player(ws, room, action)
                continue

            error = apply(room, player, action)
            if error:
                await ws.send_text(error.model_dump_json())
            else:
                await broadcast(room)
    except WebSocketDisconnect:
        if player:
            player.connected = False
            if all(not p.connected for p in room.players):
                rooms.pop(room_id, None)
            else:
                room.game.set_connected(player.id, False)
                await broadcast(room)
