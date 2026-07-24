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


def draw_card(room: Room) -> Card:
    if not room.deck:
        # no discard pile is tracked here, so a spent deck is just rebuilt
        room.deck = build_deck()
    return room.deck.pop()


def deal(room: Room) -> None:
    room.deck = build_deck()
    for p in room.players:
        p.hand = [draw_card(room) for _ in range(7)]
    top = draw_card(room)
    while not top.value.isdigit():
        # a number as first discard keeps the opening screen simple
        room.deck.insert(0, top)
        top = draw_card(room)
    room.top = top
    room.active_color = top.color
    room.phase = "playing"


def apply(room: Room, player: Player, action: PlayerAction) -> Error | None:
    if isinstance(action, Join):
        return err(ErrorCode.INVALID_MESSAGE, "already joined")

    if isinstance(action, Start):
        if room.phase != "lobby":
            return err(ErrorCode.GAME_ALREADY_STARTED, "game already started")
        if player is not room.players[0] or len(room.players) < 2:
            return err(ErrorCode.INVALID_MESSAGE, "need 2 to 4 players")
        deal(room)
        room.last = LastAction(player=player.id, kind="start")
        return None

    if room.phase != "playing":
        return err(ErrorCode.GAME_NOT_STARTED, "no game running")

    if isinstance(action, Catch):
        target = next(
            (p for p in room.players if p.id == action.target), None
        )
        if target is None:
            return err(ErrorCode.INVALID_CATCH, "no such player")
        target.hand += [draw_card(room), draw_card(room)]
        room.last = LastAction(player=player.id, kind="catch")
        return None

    if player is not room.players[room.turn]:
        return err(ErrorCode.NOT_YOUR_TURN, "wait for your turn")

    if isinstance(action, Play):
        card = next((c for c in player.hand if c.id == action.card), None)
        if card is None:
            return err(ErrorCode.CARD_NOT_IN_HAND, "not in your hand")
        if card.color == "wild" and action.color in (None, "wild"):
            return err(ErrorCode.COLOR_REQUIRED, "a wild needs a color")
        player.hand.remove(card)
        room.top = card
        if card.color == "wild":
            room.active_color = action.color
        else:
            room.active_color = card.color
        player.uno = action.uno
        room.last = LastAction(player=player.id, kind="play", card=card)
        if not player.hand:
            room.phase = "finished"
            room.winner = player.id
            return None
    elif isinstance(action, Draw):
        player.hand.append(draw_card(room))
        room.last = LastAction(player=player.id, kind="draw")
    else:
        # nothing left in the action union but Pass
        room.last = LastAction(player=player.id, kind="pass")

    room.turn = (room.turn + 1) % len(room.players)
    return None