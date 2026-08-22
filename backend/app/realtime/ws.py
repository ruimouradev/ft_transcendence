import asyncio
import time
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
    humans_made: int = 0  # same idea, seats freed in the lobby come back


rooms: dict[str, Room] = {}

TURN_TIMEOUT = 60  # seconds an idle turn is allowed to sit
TIMER_TICK = 5  # how often each room looks at its clock


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


def snapshot_json(room: Room, player_id: str) -> str:
    # The engine only knows the rules; the facts that belong to the
    # room (its settings, who hosts, which seats are bots) ride on top
    snap = room.game.snapshot_for(player_id)
    snap.settings = room.settings
    host = host_of(room)
    snap.host_id = host.id if host else None
    bots = {p.id for p in room.players if p.bot}
    for seat in snap.players:
        seat.bot = seat.id in bots
    return snap.model_dump_json()


async def broadcast(room: Room) -> None:
    # The engine bumps seq itself, here we just send everyone their view
    if room.game is None:
        return
    for p in room.players:
        if p.connected and p.ws:
            try:
                await p.ws.send_text(snapshot_json(room, p.id))
            except Exception:
                # died mid send; its own handler deals with the goodbye
                continue


def host_of(room: Room) -> Player | None:
    # The crown never lands on a bot, and a ghost cannot hold it either
    return next(
        (p for p in room.players if not p.bot and p.connected), None
    )


async def room_timer(room_id: str, room: Room) -> None:
    # One clock per room, so a sleeping or gone player never freezes
    # the table: an untouched turn is closed for them after the limit.
    # Bot seats ride the same clock while the AI does not exist yet
    mark: tuple[int, float] | None = None
    while rooms.get(room_id) is room:
        await asyncio.sleep(TIMER_TICK)
        game = room.game
        if game is None or game.phase != "playing":
            mark = None
            continue
        if mark is None or mark[0] != game.seq:
            mark = (game.seq, time.monotonic())
            continue
        if time.monotonic() - mark[1] < TURN_TIMEOUT:
            continue
        pid = game.hands[game.turn].id
        # Owing cards (a +4 or a +2 pile) or holding nothing playable
        # means the forced move is the draw they were avoiding
        if game.plus4 or game.stack or not game.legal_moves(pid):
            try:
                game.draw(pid)
            except GameError:
                pass
            else:
                metrics.moves.labels(kind="draw").inc()
                
        game.timeout_skip(pid)
        metrics.moves.labels(kind="timeout").inc()
        await broadcast(room)
        mark = None


def reseat(room: Room) -> None:
    # While in the lobby the game is rebuilt to match the seats.
    # The seq belongs to the room: it survives every rebuild, so
    # clients can trust it from the first lobby state to a rematch
    prev = room.game.seq if room.game else 0
    room.game = Game([(p.id, p.name) for p in room.players],
                     settings=room.settings)
    room.game.seq = prev + 1


def apply(room: Room, player: Player, action: PlayerAction) -> Error | None:
    # The engine is the single source of truth for the rules, here we
    # only translate messages into calls
    if isinstance(action, (Create, Join)):
        return err(ErrorCode.INVALID_MESSAGE, "already joined")

    if isinstance(action, AddBot):
        if player is not host_of(room):
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
        if player is not host_of(room):
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
            if player is not host_of(room):
                return err(ErrorCode.INVALID_MESSAGE, "only the host starts")
            if room.game.phase == "finished":
                # Play again: the ended game turns back into a lobby.
                # Whoever left for good loses the seat now; if seats
                # are missing the room just waits there, no error
                room.players = [p for p in room.players
                                if p.connected or p.bot]
                reseat(room)
                if len(room.players) < room.settings.max_players:
                    return None
            elif len(room.players) < room.settings.max_players:
                return err(ErrorCode.INVALID_MESSAGE, "the room is not full")
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
        if len(room.players) >= room.settings.max_players:
            continue  # full rooms are not joinable, so not listed
        host = host_of(room)
        out.append({
            "code": code,
            "host": host.name if host else "",
            "players": [p.name for p in room.players],
            "max_players": room.settings.max_players,
            "settings": room.settings.model_dump(),
        })
    return out


async def seat_player(ws: WebSocket, room: Room, name: str,
                      user: str | None) -> Player:
    room.humans_made += 1
    player = Player(id=f"p{room.humans_made}", name=name,
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
                    asyncio.create_task(room_timer(room_id, room))
                    player = await seat_player(ws, room, action.name, user)
                    continue

                if not isinstance(action, Join):
                    await reject(ws, ErrorCode.INVALID_MESSAGE,
                                 "create or join first")
                    continue

                room = rooms.get(room_id)
                if room is None:
                    await reject(ws, ErrorCode.ROOM_NOT_FOUND,
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
                elif room.game is not None and room.game.phase != "lobby":
                    await reject(ws, ErrorCode.GAME_ALREADY_STARTED,
                                 "game already started")
                elif len(room.players) >= room.settings.max_players:
                    await reject(ws, ErrorCode.ROOM_FULL, "room is full")
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
            if room.game is not None and room.game.phase == "lobby":
                # Leaving the lobby really frees the seat, ghosts are
                # only worth keeping once there is a hand to come back to
                room.players.remove(player)
                if any(not p.bot for p in room.players):
                    reseat(room)
                    await broadcast(room)
                else:
                    rooms.pop(room_id, None)
                    metrics.rooms_active.dec()
            elif all(not p.connected for p in room.players if not p.bot):
                rooms.pop(room_id, None)
                metrics.rooms_active.dec()
            else:
                room.game.set_connected(player.id, False)
                await broadcast(room)
