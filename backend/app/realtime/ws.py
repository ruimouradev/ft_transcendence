from dataclasses import dataclass, field
from uuid import uuid4

import jwt
import pydantic
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.game.contract import (
    AddBot, Catch, Challenge, Create, Draw, Error, ErrorCode,
    GameSettings, Join, Pass, Play, PlayerAction, RemoveBot, Start,
    Welcome, parse_action,
)
from app.game.engine import Game, GameError
from app.platform.config import settings
from app.platform.security import ALGORITHM
from app.realtime import metrics


@dataclass
class Player:
    id: str
    name: str
    token: str
    ws: WebSocket | None  # None while the seat belongs to a bot
    connected: bool = True
    bot: bool = False
    user: str | None = None  # account id from the login cookie


@dataclass
class Room:
    players: list[Player] = field(default_factory=list)
    game: Game | None = None
    settings: GameSettings = field(default_factory=GameSettings)
    bots_made: int = 0  # grows forever so bot ids never repeat


rooms: dict[str, Room] = {}


def err(code: ErrorCode, msg: str) -> Error:
    return Error(code=code, msg=msg)


async def reject(ws: WebSocket, code: ErrorCode, msg: str) -> None:
    await ws.send_text(err(code, msg).model_dump_json())


def user_from_cookies(ws: WebSocket) -> str | None:
    # The login cookie identifies the account, guests just get None
    raw = ws.cookies.get("access_token", "")
    if not raw.startswith("Bearer "):
        return None
    try:
        payload = jwt.decode(raw[7:], settings.SECRET_KEY,
                             algorithms=[ALGORITHM])
    except jwt.InvalidTokenError:
        return None
    return str(payload.get("sub"))


async def broadcast(room: Room) -> None:
    # The engine bumps seq itself, here we just send everyone their view
    if room.game is None:
        return
    for p in room.players:
        if p.connected and p.ws:
            await p.ws.send_text(
                room.game.snapshot_for(p.id).model_dump_json()
            )


def reseat(room: Room) -> None:
    # While in the lobby the game is rebuilt to match the seats
    room.game = Game([(p.id, p.name) for p in room.players],
                     settings=room.settings)


def apply(room: Room, player: Player, action: PlayerAction) -> Error | None:
    # The engine is the single source of truth for the rules, here we
    # only translate messages into calls
    if isinstance(action, (Create, Join)):
        return err(ErrorCode.INVALID_MESSAGE, "already joined")

    if isinstance(action, AddBot):
        if player is not room.players[0]:
            return err(ErrorCode.INVALID_MESSAGE, "only the host adds bots")
        if room.game.phase != "lobby":
            return err(ErrorCode.GAME_ALREADY_STARTED, "game already started")
        if len(room.players) >= room.settings.max_players:
            return err(ErrorCode.ROOM_FULL, "no free seat for a bot")
        room.bots_made += 1
        room.players.append(Player(id=f"b{room.bots_made}",
                                   name=f"Bot {room.bots_made}",
                                   token="", ws=None, bot=True))
        reseat(room)
        return None

    if isinstance(action, RemoveBot):
        if player is not room.players[0]:
            return err(ErrorCode.INVALID_MESSAGE, "only the host removes bots")
        if room.game.phase != "lobby":
            return err(ErrorCode.GAME_ALREADY_STARTED, "game already started")
        target = next(
            (p for p in room.players if p.id == action.target and p.bot),
            None,
        )
        if target is None:
            return err(ErrorCode.INVALID_MESSAGE, "no such bot")
        room.players.remove(target)
        reseat(room)
        return None

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
            plus4 = room.game.plus4
            room.game.challenge(player.id)
            if plus4:
                outcome = "wrong" if plus4.legal else "caught"
                metrics.challenges.labels(outcome=outcome).inc()
    except GameError as e:
        return err(e.code, e.msg)

    if room.game.phase == "finished":
        metrics.games_finished.inc()
        pass  # record_match goes here (Bin's stats)

    # the AI loop plays for bot seats when it is their turn (Alexandre)

    return None


router = APIRouter()


@router.get("/api/rooms")
def list_rooms() -> list[dict[str, object]]:
    # The join screen list: public rooms still waiting in their lobby
    out: list[dict[str, object]] = []
    for code, room in rooms.items():
        if not room.settings.public or room.game is None:
            continue
        if room.game.phase != "lobby":
            continue
        out.append({
            "code": code,
            "host": room.players[0].name if room.players else "",
            "players": len(room.players),
            "max_players": room.settings.max_players,
            "settings": room.settings.model_dump(),
        })
    return out


async def seat_player(ws: WebSocket, room: Room, name: str,
                      user: str | None) -> Player:
    player = Player(id=f"p{len(room.players) + 1}", name=name,
                    token=uuid4().hex, ws=ws, user=user)
    room.players.append(player)
    metrics.players_connected.inc()
    reseat(room)
    await ws.send_text(
        Welcome(id=player.id, token=player.token).model_dump_json()
    )
    await broadcast(room)
    return player


@router.websocket("/ws/game/{room_id}")
async def game(ws: WebSocket, room_id: str) -> None:
    await ws.accept()
    user = user_from_cookies(ws)
    room: Room | None = None
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
                if isinstance(action, Create):
                    if room_id in rooms:
                        await reject(ws, ErrorCode.INVALID_MESSAGE,
                                     "room already exists")
                        continue
                    room = Room(settings=action.settings)
                    rooms[room_id] = room
                    metrics.rooms_active.inc()
                    player = await seat_player(ws, room, action.name, user)
                    continue

                if not isinstance(action, Join):
                    await reject(ws, ErrorCode.INVALID_MESSAGE,
                                 "create or join first")
                    continue

                room = rooms.get(room_id)
                if room is None:
                    await reject(ws, ErrorCode.INVALID_MESSAGE,
                                 "no such room")
                    continue

                # Reconnection: the logged in account is enough to get
                # the seat back, the welcome token still works as before
                existing = None
                if user:
                    existing = next(
                        (p for p in room.players if p.user == user
                         and not p.bot),
                        None,
                    )
                if existing is None and action.token:
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
                        metrics.players_connected.inc()
                        room.game.set_connected(player.id, True)
                        await broadcast(room)
                elif ((room.game is not None
                       and room.game.phase != "lobby")
                      or len(room.players) >= room.settings.max_players):
                    await reject(ws, ErrorCode.ROOM_FULL, "cannot join now")
                else:
                    player = await seat_player(ws, room, action.name, user)
                continue

            error = apply(room, player, action)
            if error:
                metrics.rejected.labels(code=error.code.value).inc()
                await ws.send_text(error.model_dump_json())
            else:
                metrics.moves.labels(kind=action.type).inc()
                await broadcast(room)
    except WebSocketDisconnect:
        if player and room:
            player.connected = False
            metrics.players_connected.dec()
            if all(not p.connected for p in room.players if not p.bot):
                rooms.pop(room_id, None)
                metrics.rooms_active.dec()
            else:
                room.game.set_connected(player.id, False)
                await broadcast(room)
