from dataclasses import dataclass, field

import pydantic
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from app.game.contract import (
    Card, Catch, Color, Draw, Error, ErrorCode, GameState, Join,
    LastAction, Phase, Play, PlayerAction, PrivateView, PublicPlayer,
    Start, parse_action, Pass,
)
from app.game.rules import build_deck, effect_of, is_playable


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
    direction: int = 1
    has_drawn: bool = False


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
        direction=room.direction,
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
        room.deck.insert(0, top)
        top = room.deck.pop()
    room.top = top
    room.active_color = top.color
    room.phase = "playing"
    room.direction = 1
    room.turn = 0
    room.has_drawn = False


def advance_turn(room: Room) -> None:
    room.turn = (room.turn + room.direction) % len(room.players)
    room.has_drawn = False


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
        target = next((p for p in room.players if p.id == action.target), None)
        if target is None:
            return err(ErrorCode.INVALID_CATCH, "no such player")
        if len(room.deck) < 2:
            pass # Simplification: if deck empty, maybe reshuffle? We'll ignore empty deck issues for now
        if len(room.deck) >= 2:
            target.hand += [room.deck.pop(), room.deck.pop()]
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
        if not is_playable(card, room.active_color, room.top):
            return err(ErrorCode.INVALID_CARD, "card cannot be played")

        player.hand.remove(card)
        room.top = card
        room.active_color = action.color if card.color == "wild" else card.color
        player.uno = action.uno
        room.last = LastAction(player=player.id, kind="play", card=card)
        
        if not player.hand:
            room.phase = "finished"
            room.winner = player.id
            return None

        effect = effect_of(card)
        
        if effect.reverse:
            if len(room.players) == 2:
                # In 2-player, reverse acts like skip
                advance_turn(room)
            else:
                room.direction *= -1

        advance_turn(room)

        if effect.draw > 0:
            target = room.players[room.turn]
            for _ in range(effect.draw):
                if room.deck:
                    target.hand.append(room.deck.pop())
            advance_turn(room) # Target loses their turn
            
        elif effect.skip:
            advance_turn(room)

        return None

    elif isinstance(action, Draw):
        if room.has_drawn:
            return err(ErrorCode.INVALID_MESSAGE, "already drawn a card")
        if room.deck:
            player.hand.append(room.deck.pop())
        room.has_drawn = True
        room.last = LastAction(player=player.id, kind="draw")
        # Turn does NOT advance automatically, user can play the card or pass
        return None

    elif isinstance(action, Pass):
        if not room.has_drawn:
            return err(ErrorCode.INVALID_MESSAGE, "must draw before passing")
        room.last = LastAction(player=player.id, kind="pass")
        advance_turn(room)
        return None

    return None


app = FastAPI()


async def seat_player(ws: WebSocket, room: Room, action: Join) -> Player:
    player = Player(id=f"p{len(room.players) + 1}", name=action.name, ws=ws)
    room.players.append(player)
    room.last = LastAction(player=player.id, kind="join")
    await broadcast(room)
    return player


@app.websocket("/ws/game/{room_id}")
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
                
                # Reconnection logic
                existing = next((p for p in room.players if p.name == action.name), None)
                if existing:
                    if existing.connected:
                        await reject(ws, ErrorCode.INVALID_MESSAGE, "player already connected")
                    else:
                        player = existing
                        player.ws = ws
                        player.connected = True
                        await broadcast(room)
                elif room.phase != "lobby" or len(room.players) >= 4:
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
                await broadcast(room)
