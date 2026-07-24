from dataclasses import dataclass, field

import pydantic
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from app.game.contract import (
    Card, Catch, Color, Draw, Error, ErrorCode, GameState, Join,
    LastAction, Phase, Play, PlayerAction, PrivateView, PublicPlayer,
    Start, parse_action,
)


@dataclass
class Player:
    id: str
    name: str
    ws: WebSocket
    hand: list[Card] = field(default_factory=list)
    uno: bool = False
    connected: bool = True


@dataclass
class Room:
    players: list[Player] = field(default_factory=list)
    deck: list[Card] = field(default_factory=list)
    phase: Phase = "lobby"
    top: Card | None = None
    active_color: Color | None = None
    turn: int = 0
    seq: int = 0
    last: LastAction | None = None
    winner: str | None = None


rooms: dict[str, Room] = {}


def err(code: ErrorCode, msg: str) -> Error:
    return Error(code=code, msg=msg)


async def reject(ws: WebSocket, code: ErrorCode, msg: str) -> None:
    await ws.send_text(err(code, msg).model_dump_json())


def snapshot(room: Room, player: Player) -> GameState:
    seats = [
        PublicPlayer(id=p.id, name=p.name, cards=len(p.hand),
                     connected=p.connected, uno=p.uno)
        for p in room.players
    ]
    playing = room.phase == "playing"
    return GameState(
        seq=room.seq,
        phase=room.phase,
        you=PrivateView(id=player.id, hand=player.hand),
        players=seats,
        top_card=room.top,
        active_color=room.active_color,
        turn=room.players[room.turn].id if playing else None,
        draw_pile=len(room.deck),
        last_action=room.last,
        winner=room.winner,
    )


async def broadcast(room: Room) -> None:
    room.seq += 1
    for p in room.players:
        if p.connected:
            await p.ws.send_text(snapshot(room, p).model_dump_json())


def deal(room: Room) -> None:
    room.deck = build_deck()
    for p in room.players:
        p.hand = [room.deck.pop() for _ in range(7)]
    top = room.deck.pop()
    while not top.value.isdigit():
        # a number as first discard keeps the opening screen simple
        room.deck.insert(0, top)
        top = room.deck.pop()
    room.top = top
    room.active_color = top.color
    room.phase = "playing"


def apply(room: Room, player: Player, action: PlayerAction):
    if isinstance(action, Join):
        return err(ErrorCode.INVALID_MESSAGE, "already joined")

    if isinstance(action):
        if room.phase != "lobby":
            return err(ErrorCode.GAME_ALREADY_STARTED")
        if player is not room.players[0] or len(room.players) < 2:
            return err(ErrorCode.INVALID_MESSAGE)
        deal(room)
        room.last = LastAction(player=player.id, kind="start")
        return None

    if player is not room.players[room.turn]:
        return err(ErrorCode.NOT_YOUR_TURN)