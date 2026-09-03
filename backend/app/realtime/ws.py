import asyncio
import re
import time
from dataclasses import dataclass, field
from uuid import uuid4
from datetime import datetime, timezone

import logging
from uuid import UUID

from app.models.database import engine
from sqlmodel import Session
from app.models.all import Game as DBGame, GamePlayer, LoginTokenType, User
from app.platform.service.userStatisticService import save_game_result
from app.robots_manager import robots_user_manager
from app.game.rules import points

import jwt
import pydantic
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.game.contract import (
    AddBot, Catch, Challenge, Create, Draw, Error, ErrorCode,
    Emote, GameSettings, Join, Kick, Leave, Notice, Play, PlayerAction,
    SayUno, Start, Welcome, parse_action,
)
from app.game.engine import Game, GameError
from app.platform.config import settings
from app.platform.deps import CurrentUser
from app.platform.security import ALGORITHM
from app.realtime import metrics
from app.game.ai import decide_bot_action


@dataclass
class Player:
    id: str
    name: str
    token: str
    ws: WebSocket | None  # None while the seat belongs to a bot
    connected: bool = True
    bot: bool = False
    user: str | None = None  # account id from the login cookie
    avatar: str = ""  # the account's picture, empty for guests and bots
    bot_level: str | None = None  # difficulty of an AI seat, None on humans
    last_emote: float = 0.0  # monotonic time of the last emote, to space them
    ready: bool = True  # back from the result screen, the deal waits for it


@dataclass
class Room:
    players: list[Player] = field(default_factory=list)
    game: Game | None = None
    settings: GameSettings = field(default_factory=GameSettings)
    bots_made: int = 0  # grows forever so bot ids never repeat
    humans_made: int = 0  # same idea, seats freed in the lobby come back
    # account that opened the room, so a reload does not cost the host
    owner: str | None = None
    # the room's own clock, held here so it is not collected mid game
    timer: asyncio.Task | None = None
    # the background task driving AI bots, kept here to prevent GC collection
    ai_timer_task: asyncio.Task | None = None
    recorded: bool = False  # the finished game already went to the database
    # when a hand last dropped to one undeclared card, for the grace
    solo_at: float = 0.0
    started_at: datetime | None = None  # when the cards were dealt


rooms: dict[str, Room] = {}

TURN_TIMEOUT = 60  # seconds an idle turn is allowed to sit
TIMER_TICK = 5  # how often each room looks at its clock
UNO_GRACE = 0.5  # seconds a fresh one-card hand is safe from the catch
SEAT_GRACE = 5  # seconds a lobby chair waits for its player to come back
EMOTE_COOLDOWN = 1.0  # seconds a player must wait between emotes
ROOM_GRACE = 5  # seconds an empty room waits before it is dropped
ROOM_CODE = re.compile(r"[A-Z0-9]{5}")  # the shape of every room code


def err(code: ErrorCode, msg: str, room: str | None = None) -> Error:
    return Error(code=code, msg=msg, room=room)


async def tell(ws: WebSocket, code: ErrorCode, msg: str, room: str | None = None) -> None:
    # an error the game did not refuse, a kick or a lost chair. Best
    # effort, the peer may already be gone
    try:
        await ws.send_text(err(code, msg, room).model_dump_json())
    except Exception:
        pass


async def reject(ws: WebSocket, code: ErrorCode, msg: str, room: str | None = None) -> None:
    # a refusal outside the game counts like one inside, so the alert
    # sees garbage arriving
    metrics.rejected.labels(code=code.value).inc()
    await tell(ws, code, msg, room)


async def hang_up(ws: WebSocket) -> None:
    # closing a socket the peer already dropped raises, and the goodbye
    # is done either way
    try:
        await ws.close()
    except Exception:
        pass


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
    # the short token issued before the 2FA code opens no table
    if payload.get("type") != LoginTokenType.ACCESS.value:
        return None
    sub = payload.get("sub")
    return str(sub) if sub else None


def load_account(user: str) -> tuple[str, str] | None:
    # the nick and the avatar ride in every state update, so they are
    # read once per socket. None when the account cannot play
    try:
        uid = UUID(user)
    except ValueError:
        return None
    with Session(engine) as session:
        account = session.get(User, uid)
    if account is None or not account.is_active:
        return None
    return account.nick_name or "player", account.avatar or ""


def turn_key(game: Game) -> tuple[int, int]:
    # changes when the turn passes, by a play or by a seat moving on,
    # never on a reconnect or on a call by someone else
    return game.turn, len(game.discard)


def opens_solo(game: Game, before: dict[str, int]) -> bool:
    # a hand that just came down to one undeclared card, by the play
    # itself or by a seven swap or a zero rotation landing on someone
    return any(len(h.cards) == 1 and not h.said_uno and before.get(h.id) != 1
               for h in game.hands)


def snapshot_json(room: Room, player_id: str) -> str:
    # The engine only knows the rules; the facts that belong to the
    # room (its settings, who hosts, which seats are bots) ride on top
    snap = room.game.snapshot_for(player_id)
    snap.settings = room.settings
    host = host_of(room)
    snap.host_id = host.id if host else None
    bots = {p.id for p in room.players if p.bot}
    avatars = {p.id: p.avatar for p in room.players}
    levels = {p.id: p.bot_level for p in room.players if p.bot}
    ready = {p.id: p.ready for p in room.players}
    for seat in snap.players:
        seat.bot = seat.id in bots
        seat.avatar = avatars.get(seat.id, "")
        seat.bot_level = levels.get(seat.id)
        seat.ready = ready.get(seat.id, True)
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


async def relay(room: Room, notice: Notice) -> None:
    # A notice carries no game state, it is sent to everyone as is, for
    # an uno, a catch or an emote. The frontend shows it and drops it
    payload = notice.model_dump_json()
    for p in room.players:
        if p.connected and p.ws:
            try:
                await p.ws.send_text(payload)
            except Exception:
                continue


def host_of(room: Room) -> Player | None:
    # Whoever opened the room hosts it while they hold a chair there.
    # In the lobby that includes the few seconds a chair waits after a
    # reload, so the buttons do not blink away and come back on the
    # other screens. Once the game is running a chair is kept for good,
    # so a vanished owner must not hold the room hostage: there the
    # host follows whoever is actually connected. Never a bot
    seated = [p for p in room.players if not p.bot]
    waiting = room.game is not None and room.game.phase == "lobby"
    owner = next(
        (p for p in seated if room.owner and p.user == room.owner
         and (p.connected or waiting)),
        None,
    )
    return owner or next((p for p in seated if p.connected), None)


async def room_timer(room_id: str, room: Room) -> None:
    # One clock per room, so a sleeping or gone player never freezes
    # the table: an untouched turn is closed for them after the limit.
    # Bot seats ride the same clock while the AI does not exist yet
    mark: tuple[tuple[int, int], float] | None = None
    while rooms.get(room_id) is room:
        await asyncio.sleep(TIMER_TICK)
        game = room.game
        if game is None or game.phase != "playing":
            mark = None
            continue
        if mark is None or mark[0] != turn_key(game):
            mark = (turn_key(game), time.monotonic())
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
        # the forced draw can end the game, and a game that ends here
        # deserves the same row in the database as any other
        await record_finished_game(room)
        mark = None


def reseat(room: Room) -> None:
    # While in the lobby the game is rebuilt to match the seats.
    # The seq belongs to the room: it survives every rebuild, so
    # clients can trust it from the first lobby state to a rematch
    prev = room.game.seq if room.game else 0
    # bots are named by their place, the order the record uses
    seated_bots = 0
    for p in room.players:
        if p.bot:
            seated_bots += 1
            p.name = f"Bot{seated_bots}"
    room.game = Game([(p.id, p.name) for p in room.players],
                     settings=room.settings)
    room.game.seq = prev + 1


async def async_save_game_result(db_game: DBGame, game_players: list[GamePlayer]) -> None:
    def _sync_save():
        with Session(engine) as session:
            try:
                save_game_result(session=session, game=db_game, game_players=game_players)
                session.commit()
            except Exception as e:
                logging.error(f"Failed to save game result: {e}")
                metrics.rejected.labels(code="RECORD_FAILED").inc()
    
    await asyncio.to_thread(_sync_save)


async def record_finished_game(room: Room) -> None:
    """Write a finished game to the database, once, from wherever it
    ended. A game can also end on the turn clock, not only on a move,
    so this lives apart from apply()."""
    if room.game is None or room.game.phase != "finished":
        return
    if room.recorded:
        return  # a game is written down once, whoever noticed it ended
    room.recorded = True
    metrics.games_finished.inc()
    has_guests = any(not p.bot and p.user is None for p in room.players)
    if not has_guests:
        now = datetime.now(timezone.utc)
        db_game = DBGame(status="finished", created_at=room.started_at or now,
                         finished_at=now)
        game_players = []
        bot_count = 0
        
        total_remain_points = sum(
            sum(points(c) for c in h.cards) for h in room.game.hands
        )
        
        for i, p in enumerate(room.players):
            user_id = None
            if p.bot:
                bot_count += 1
                if bot_count == 1:
                    user_id = robots_user_manager.get_robot1_id()
                elif bot_count == 2:
                    user_id = robots_user_manager.get_robot2_id()
                elif bot_count == 3:
                    user_id = robots_user_manager.get_robot3_id()
            elif p.user:
                try:
                    user_id = UUID(p.user)
                except ValueError:
                    pass
            
            if user_id is None:
                continue
                
            hand = next((h for h in room.game.hands if h.id == p.id), None)
            if not hand:
                continue
                
            remain_points = sum(points(card) for card in hand.cards)
            is_winner = (p.id == room.game.winner)
            score = total_remain_points if is_winner else 0
            
            gp = GamePlayer(
                game_id=db_game.id,
                user_id=user_id,
                is_winner=is_winner,
                score=score,
                seat=i,
                remain_points=remain_points,
                cards_left=len(hand.cards),
                is_connected=p.connected
            )
            game_players.append(gp)
            
        if len(game_players) == len(room.players):
            await async_save_game_result(db_game, game_players)
        else:
            # a seat without an account id sinks the whole record, so
            # say it out loud instead of losing the game in silence
            logging.warning(
                "game not recorded: %d seats but only %d rows",
                len(room.players), len(game_players))
            metrics.rejected.labels(code="RECORD_FAILED").inc()


async def ai_timer(room_id: str, room: Room) -> None:
    """Background task that plays for bot seats when it is their turn."""
    last_turn: tuple[int, int] | None = None
    turn_started_at = 0.0

    while rooms.get(room_id) is room:
        await asyncio.sleep(0.5)
        if room.game is None or room.game.phase != "playing":
            continue

        # the thinking delay starts when the turn passes, not on every
        # state change, or a reconnect would buy the bot more time
        if turn_key(room.game) != last_turn:
            last_turn = turn_key(room.game)
            turn_started_at = time.monotonic()

        current_pid = room.game.hands[room.game.turn].id

        # We process every bot to allow for out-of-turn Catch opportunities
        for bot in [p for p in room.players if p.bot]:
            # Construct GameState snapshot for the bot. Guarded so a
            # stray error building it or deciding does not kill the loop
            try:
                bot_state = room.game.snapshot_for(bot.id)
                bot_state.settings = room.settings
                for seat in bot_state.players:
                    seat.bot = next((p.bot for p in room.players if p.id == seat.id), False)
                    seat.bot_level = next((p.bot_level for p in room.players if p.id == seat.id), None)
                bot_action = decide_bot_action(bot_state, bot.id)
            except Exception:
                logging.exception("ai_timer failed to decide a bot move")
                continue
            if not bot_action:
                continue

            if not isinstance(bot_action, Catch):
                # Normal moves (Play, Draw, Challenge, SayUno) must be strictly on their turn
                if bot.id != current_pid:
                    continue
                # Human-like delay for normal moves
                if time.monotonic() - turn_started_at < 1.5:
                    continue
            else:
                # Catch can be out-of-turn, but must respect UNO_GRACE
                if time.monotonic() - room.solo_at < UNO_GRACE:
                    continue

            # Apply action directly
            try:
                if isinstance(bot_action, Play):
                    before = {h.id: len(h.cards) for h in room.game.hands}
                    room.game.play(bot.id, bot_action.card, bot_action.color, bot_action.uno, bot_action.target)
                    if opens_solo(room.game, before):
                        room.solo_at = time.monotonic()
                elif isinstance(bot_action, Catch):
                    room.game.catch(bot.id, bot_action.target)
                elif isinstance(bot_action, Challenge):
                    room.game.challenge(bot.id)
                elif isinstance(bot_action, Draw):
                    room.game.draw(bot.id)
                elif isinstance(bot_action, SayUno):
                    room.game.say_uno(bot.id)
                    
                metrics.moves.labels(kind=bot_action.type).inc()
                await broadcast(room)

                # bots announce their uno and catch too, so the frontend
                # pops the same bubble for them as for players
                if isinstance(bot_action, Play) and bot_action.uno:
                    hand = next((h for h in room.game.hands if h.id == bot.id), None)
                    if hand and hand.said_uno and len(hand.cards) == 1:
                        await relay(room, Notice(sender=bot.id, kind="uno"))
                elif isinstance(bot_action, SayUno):
                    await relay(room, Notice(sender=bot.id, kind="uno"))
                elif isinstance(bot_action, Catch):
                    await relay(room, Notice(sender=bot.id, kind="catch",
                                             target=bot_action.target))

                await record_finished_game(room)
                break  # Apply max one bot action per tick to avoid race conditions
            except GameError as e:
                logging.error(f"AI attempted illegal move: {e.msg}")
            except Exception:
                logging.exception("ai_timer failed to apply a bot move")


async def apply(room: Room, player: Player, action: PlayerAction) -> Error | None:
    # The engine is the single source of truth for the rules, here we
    # only translate messages into calls
    if isinstance(action, (Create, Join)):
        return err(ErrorCode.INVALID_MESSAGE, "already joined")

    if isinstance(action, AddBot):
        if player is not host_of(room):
            return err(ErrorCode.INVALID_MESSAGE, "only the host adds bots")
        # a refused move never carries a code the frontend reads as
        # losing the seat, those stay with the join
        if room.game.phase != "lobby":
            return err(ErrorCode.INVALID_MESSAGE, "game already started")
        if len(room.players) >= room.settings.max_players:
            return err(ErrorCode.INVALID_MESSAGE, "no free seat for a bot")
        room.bots_made += 1
        # the id never repeats, the name comes from reseat
        room.players.append(Player(id=f"b{room.bots_made}", name="",
                                   token="", ws=None, bot=True,
                                   bot_level=action.level))
        reseat(room)
        return None

    if isinstance(action, Kick):
        if player is not host_of(room):
            return err(ErrorCode.INVALID_MESSAGE, "only the host kicks")
        if room.game.phase != "lobby":
            return err(ErrorCode.INVALID_MESSAGE, "game already started")
        target = next(
            (p for p in room.players if p.id == action.target),
            None,
        )
        if target is None:
            return err(ErrorCode.INVALID_MESSAGE, "no such player")
        if target is player:
            return err(ErrorCode.INVALID_MESSAGE, "the host stays")
        # free the chair first, then say goodbye; closing the socket
        # wakes the target's own handler, which finds the seat gone.
        # A bot has no socket, so for bots this is the whole trip
        room.players.remove(target)
        reseat(room)
        if target.ws:
            await tell(target.ws, ErrorCode.KICKED,
                       "the host removed you from the room")
            await hang_up(target.ws)
        return None

    if isinstance(action, Leave):
        if room.game.phase == "playing":
            return err(ErrorCode.INVALID_MESSAGE, "the game is running")
        # the grace is there for a reload, this is a goodbye
        room.players.remove(player)
        # after a finished game the seats are only rebuilt by the next
        # start, so the winner stays on everyone's screen
        if room.game.phase == "lobby":
            reseat(room)
        await hang_up(player.ws)
        return None

    try:
        if isinstance(action, Start):
            if room.game.phase == "finished":
                # Back to the lobby, and anyone may ask for it since the
                # game is already over. A second start from the lobby deals
                # the cards, and that one is the host's. Whoever left for
                # good loses the seat now
                room.recorded = False
                room.players = [p for p in room.players
                                if p.connected or p.bot]
                # the others come back with a start of their own
                for p in room.players:
                    p.ready = p.bot or p is player
                reseat(room)
                return None
            if room.game.phase == "lobby" and not player.ready:
                # the way out of the result screen, not a deal
                player.ready = True
                return None
            if player is not host_of(room):
                return err(ErrorCode.INVALID_MESSAGE, "only the host starts")
            if len(room.players) < room.settings.max_players:
                return err(ErrorCode.INVALID_MESSAGE, "the room is not full")
            elif any(not p.bot and not p.connected for p in room.players):
                # a chair still waiting for its player is not a chair
                # anyone can deal to yet
                return err(ErrorCode.INVALID_MESSAGE,
                           "someone is reconnecting")
            elif any(not p.bot and not p.ready for p in room.players):
                return err(ErrorCode.INVALID_MESSAGE,
                           "someone is still on the result screen")
            elif room.game.phase != "lobby":
                # a second click on start, the engine's own refusal
                # carries the code the frontend reads as losing the seat
                return err(ErrorCode.INVALID_MESSAGE, "game already started")
            room.game.start()
            room.started_at = datetime.now(timezone.utc)
        elif isinstance(action, Play):
            before = {h.id: len(h.cards) for h in room.game.hands}
            room.game.play(player.id, action.card, action.color,
                           action.uno, action.target)
            if opens_solo(room.game, before):
                # the race is on, but the player gets half a second of
                # air before anyone may catch them
                room.solo_at = time.monotonic()
        elif isinstance(action, SayUno):
            room.game.say_uno(player.id)
        elif isinstance(action, Draw):
            room.game.draw(player.id)
        elif isinstance(action, Catch):
            if time.monotonic() - room.solo_at < UNO_GRACE:
                return err(ErrorCode.INVALID_CATCH,
                           "too soon, the call is still open")
            room.game.catch(player.id, action.target)
        elif isinstance(action, Challenge):
            plus4 = room.game.plus4
            room.game.challenge(player.id)
            if plus4:
                outcome = "wrong" if plus4.legal else "caught"
                metrics.challenges.labels(outcome=outcome).inc()
    except GameError as e:
        return err(e.code, e.msg)

    await record_finished_game(room)

    return None


router = APIRouter()


@router.get("/api/rooms")
def list_rooms(current_user: CurrentUser) -> list[dict[str, object]]:
    # The join screen list: public rooms still waiting in their lobby.
    # Playing needs an account, so reading the table does too
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


async def seat_player(ws: WebSocket, room: Room, name: str, avatar: str,
                      user: str) -> Player:
    room.humans_made += 1
    player = Player(id=f"p{room.humans_made}", name=name,
                    token=uuid4().hex, ws=ws, user=user, avatar=avatar)
    # the welcome goes first, a socket that dies here takes no chair
    await ws.send_text(
        Welcome(id=player.id, token=player.token).model_dump_json()
    )
    room.players.append(player)
    metrics.players_connected.inc()
    reseat(room)
    await broadcast(room)
    return player


@router.websocket("/ws/game/{room_id}")
async def game(ws: WebSocket, room_id: str) -> None:
    await ws.accept()
    if not ROOM_CODE.fullmatch(room_id):
        await reject(ws, ErrorCode.ROOM_NOT_FOUND, "no such room")
        await hang_up(ws)
        return
    user = user_from_cookies(ws)
    # registration is required to play, the rule holds on the server
    # too, not only behind the frontend's login gate. The read is off
    # the loop, a busy database must not stop every other socket
    account = await asyncio.to_thread(load_account, user) if user else None
    if account is None:
        await reject(ws, ErrorCode.AUTH_REQUIRED, "login required to play")
        await hang_up(ws)
        return
    name, avatar = account
    room: Room | None = None
    player: Player | None = None
    try:
        while True:
            try:
                text = await ws.receive_text()
            except KeyError:
                # a binary frame, nothing the table understands
                await reject(ws, ErrorCode.INVALID_MESSAGE, "text only")
                continue
            try:
                action = parse_action(text)
            except pydantic.ValidationError:
                await reject(
                    ws, ErrorCode.INVALID_MESSAGE, "not a valid message"
                )
                continue

            if player is None:
                if isinstance(action, (Create, Join)):
                    other_room_id = next(
                        (rid for rid, r in rooms.items()
                         if rid != room_id and any(p.user == user and not p.bot
                                                   and p.connected
                                                   for p in r.players)),
                        None
                    )
                    if other_room_id:
                        await reject(
                            ws, ErrorCode.ALREADY_IN_ROOM,
                            "already in another room", other_room_id
                        )
                        continue

                if isinstance(action, Create):
                    if room_id in rooms:
                        # no seat to give, close so the client cannot
                        # keep a dead socket that blocks its next join
                        await reject(ws, ErrorCode.INVALID_MESSAGE,
                                     "room already exists")
                        await hang_up(ws)
                        return
                    room = Room(settings=action.settings, owner=user)
                    rooms[room_id] = room
                    metrics.rooms_active.inc()
                    try:
                        player = await seat_player(ws, room, name, avatar,
                                                   user)
                    except Exception:
                        # a chair never taken leaves no room behind
                        rooms.pop(room_id, None)
                        metrics.rooms_active.dec()
                        raise
                    room.timer = asyncio.create_task(room_timer(room_id, room))
                    room.ai_timer_task = asyncio.create_task(ai_timer(room_id, room))
                    continue

                if not isinstance(action, Join):
                    await reject(ws, ErrorCode.INVALID_MESSAGE,
                                 "create or join first")
                    continue

                room = rooms.get(room_id)
                if room is None:
                    await reject(ws, ErrorCode.ROOM_NOT_FOUND,
                                 "no such room")
                    await hang_up(ws)
                    return

                # Reconnection: the logged in account is enough to get
                # the seat back, the welcome token still works as before
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
                    # the newest window wins the chair, the old socket
                    # is closed only after the handover
                    old = existing.ws if existing.connected else None
                    if not existing.connected:
                        metrics.players_connected.inc()
                    player = existing
                    player.ws = ws
                    player.connected = True
                    # a reload never lands on the result screen
                    player.ready = True
                    room.game.set_connected(player.id, True)
                    await ws.send_text(
                        Welcome(id=player.id, token=player.token).model_dump_json()
                    )
                    await broadcast(room)
                    if old is not None:
                        # the old window learns why it lost the chair, a
                        # bare close would look like a network drop
                        await tell(old, ErrorCode.SEAT_TAKEN,
                                   "your seat moved to a newer window")
                        await hang_up(old)
                elif room.game is not None and room.game.phase != "lobby":
                    await reject(ws, ErrorCode.GAME_ALREADY_STARTED,
                                 "game already started")
                    await hang_up(ws)
                    return
                elif len(room.players) >= room.settings.max_players:
                    await reject(ws, ErrorCode.ROOM_FULL, "room is full")
                    await hang_up(ws)
                    return
                else:
                    player = await seat_player(ws, room, name, avatar, user)
                continue

            if isinstance(action, Emote):
                # a reaction, not a move, passed on without touching the
                # game. Spaced out so no one can flood the table with them
                now = time.monotonic()
                if now - player.last_emote < EMOTE_COOLDOWN:
                    continue
                player.last_emote = now
                await relay(room, Notice(sender=player.id, kind="emote",
                                         icon=action.icon))
                continue

            error = await apply(room, player, action)
            if error:
                metrics.rejected.labels(code=error.code.value).inc()
                await ws.send_text(error.model_dump_json())
            else:
                metrics.moves.labels(kind=action.type).inc()
                await broadcast(room)
                if isinstance(action, Leave):
                    return  # the chair is free and the socket closed
                # an uno and a catch also go out as their own notice, so
                # the frontend can show them apart from the board
                if isinstance(action, SayUno):
                    await relay(room, Notice(sender=player.id, kind="uno"))
                elif isinstance(action, Catch):
                    await relay(room, Notice(sender=player.id, kind="catch",
                                             target=action.target))
    except WebSocketDisconnect:
        pass
    finally:
        # the goodbye runs whatever went wrong, otherwise a stray error
        # would leave the seat marked as connected and the player
        # locked out of their own room until the server restarts.
        # A taken over chair is not ours to touch
        if player and room and player.ws is ws:
            player.connected = False
            metrics.players_connected.dec()
            if room.game is not None and room.game.phase == "lobby":
                # The seat is held for a few seconds so a reload keeps
                # the same chair, the same host and the same order on
                # everyone's screen. A kicked player is already gone
                if player in room.players:
                    room.game.set_connected(player.id, False)
                    await broadcast(room)
                    await asyncio.sleep(SEAT_GRACE)
                    # only the socket that lost the chair may drop it, a
                    # second reload inside the grace hands it to a newer
                    # one, and a kick during the wait already freed it
                    if (rooms.get(room_id) is room and not player.connected
                            and player.ws is ws and player in room.players):
                        room.players.remove(player)
                        reseat(room)
                        await broadcast(room)
                if not any(not p.bot and p.connected for p in room.players):
                    # nobody left to come back to, the room can go
                    await asyncio.sleep(ROOM_GRACE)
                    if (rooms.get(room_id) is room
                            and not any(not p.bot and p.connected
                                        for p in room.players)):
                        rooms.pop(room_id, None)
                        metrics.rooms_active.dec()
            else:
                room.game.set_connected(player.id, False)
                await broadcast(room)
                if all(not p.connected for p in room.players if not p.bot):
                    # a running game waits a whole turn for its last
                    # human, a network blip must not cost the game
                    playing = room.game.phase == "playing"
                    await asyncio.sleep(TURN_TIMEOUT if playing else ROOM_GRACE)
                    if (rooms.get(room_id) is room
                            and all(not p.connected
                                    for p in room.players if not p.bot)):
                        rooms.pop(room_id, None)
                        metrics.rooms_active.dec()
