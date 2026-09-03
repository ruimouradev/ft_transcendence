"""
The message types the server and the client exchange. A player sends
actions (create, join, add_bot, kick, leave, start, play, draw,
say_uno, catch, challenge), the server sends back the game state after each
move, or an error when a move is refused.
"""

from enum import Enum

from typing import Annotated, Literal

from pydantic import BaseModel, Field, TypeAdapter

Color = Literal["red", "yellow", "green", "blue", "wild"]
Value = Literal[
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "+2", "skip", "reverse", "wild", "+4",
]
Phase = Literal["lobby", "playing", "finished"]


class Card(BaseModel):
    # players only ever see the ids of their own cards
    id: str
    color: Color
    value: Value


class GameSettings(BaseModel):
    # Chosen once when a room is created. The defaults are the official
    # game, every house rule starts off.
    hand_size: int = Field(default=7, ge=3, le=10)
    # A +2 may be answered with another +2, the pile grows
    stacking: bool = False
    # A 7 swaps hands with a player of your choice, a 0 rotates all
    # hands in the direction of play
    seven_zero: bool = False
    # How many seats the room has, humans and bots included
    max_players: int = Field(default=4, ge=2, le=4)
    # Public rooms show up in the room list, private ones only by code
    public: bool = False


class Create(BaseModel):
    # Opens a new room and takes the first seat. The settings are fixed
    # here for the whole game, omitted means the official rules.
    type: Literal["create"] = "create"
    # Same ceiling as the account nick, the seat shows what the profile shows
    name: str = Field(min_length=1, max_length=20)
    settings: GameSettings = GameSettings()


class Join(BaseModel):
    type: Literal["join"] = "join"
    name: str = Field(min_length=1, max_length=20)
    # Present when reclaiming a seat after a disconnect, from Welcome
    token: str | None = None


class AddBot(BaseModel):
    # Host only, in the lobby: seats an AI player on the next free chair
    type: Literal["add_bot"] = "add_bot"
    # Difficulty the host picked, read by the AI. The engine treats
    # every seat alike
    level: Literal["easy", "medium", "hard"] = "medium"


class Kick(BaseModel):
    # Host only, in the lobby: frees any other chair, bot or human.
    # Not a ban, the same player may join again with the code
    type: Literal["kick"] = "kick"
    target: str


class Leave(BaseModel):
    # Frees your own chair, where kick frees someone else's. The chair
    # goes at once instead of waiting out the reconnect grace
    type: Literal["leave"] = "leave"


class Start(BaseModel):
    type: Literal["start"] = "start"


class Play(BaseModel):
    type: Literal["play"] = "play"
    card: str
    # Color is required when the card is a wild
    color: Color | None = None
    # Saying uno may travel with the play; say_uno is the richer way
    # and also works right after, until someone catches you
    uno: bool = False
    # Whose hand you take, required for a 7 under the seven-zero rule
    target: str | None = None


class Draw(BaseModel):
    type: Literal["draw"] = "draw"


class SayUno(BaseModel):
    # The Uno call as its own message, so it can race the catch, both
    # before the play with two cards and after it with one undeclared
    type: Literal["say_uno"] = "say_uno"


class Catch(BaseModel):
    # For a player who has one card remaining but failed to declare UNO
    # The target must draw two cards as a penalty
    type: Literal["catch"] = "catch"
    target: str


class Challenge(BaseModel):
    # For the +4 victim who thinks it was played while holding the
    # active color. Right, the bluffer draws the 4, wrong, you draw 6
    type: Literal["challenge"] = "challenge"


class Emote(BaseModel):
    # A reaction the player sends to the table, only for show. It never
    # touches the game, the server passes it on to everyone as a Notice
    type: Literal["emote"] = "emote"
    # the id of the reaction, the frontend maps it to a picture. Kept a
    # small number so nothing odd travels, an id with no picture on the
    # frontend shows nothing
    icon: int = Field(ge=1, le=9)


# the type field tells pydantic which model to build from the raw text
PlayerAction = Annotated[
    Create | Join | AddBot | Kick | Leave | Start | Play | Draw
    | SayUno | Catch | Challenge | Emote,
    Field(discriminator="type"),
]

_action_adapter: TypeAdapter[PlayerAction] = TypeAdapter(PlayerAction)


def parse_action(data: str | bytes) -> PlayerAction:
    return _action_adapter.validate_json(data)


class ErrorCode(str, Enum):
    NOT_YOUR_TURN = "NOT_YOUR_TURN"
    INVALID_CARD = "INVALID_CARD"
    COLOR_REQUIRED = "COLOR_REQUIRED"
    TARGET_REQUIRED = "TARGET_REQUIRED"
    CARD_NOT_IN_HAND = "CARD_NOT_IN_HAND"
    INVALID_CATCH = "INVALID_CATCH"
    INVALID_UNO = "INVALID_UNO"
    INVALID_CHALLENGE = "INVALID_CHALLENGE"
    INVALID_MESSAGE = "INVALID_MESSAGE"
    AUTH_REQUIRED = "AUTH_REQUIRED"
    ALREADY_IN_ROOM = "ALREADY_IN_ROOM"
    KICKED = "KICKED"
    ROOM_FULL = "ROOM_FULL"
    ROOM_NOT_FOUND = "ROOM_NOT_FOUND"
    GAME_NOT_STARTED = "GAME_NOT_STARTED"
    GAME_ALREADY_STARTED = "GAME_ALREADY_STARTED"


class Error(BaseModel):
    # Sent to the sender only, the game state did not change
    type: Literal["error"] = "error"
    code: ErrorCode
    msg: str
    # Only on ALREADY_IN_ROOM: the code of the room holding the seat,
    # so the frontend can offer the way back to it
    room: str | None = None


class Notice(BaseModel):
    # A short notice the server sends to everyone, an uno, a catch or a
    # player's emote. It carries no game state and does not move the
    # seq, the frontend just shows it
    type: Literal["notice"] = "notice"
    sender: str
    kind: Literal["uno", "catch", "emote"]
    target: str | None = None  # on a catch, who was caught
    icon: int | None = None    # on an emote, the reaction id


class Welcome(BaseModel):
    # Sent once when a seat is taken. Join again with the token to get
    # the same seat back after a disconnect.
    type: Literal["welcome"] = "welcome"
    id: str
    token: str


class PrivateView(BaseModel):
    # The only part of a game state the other players must never get
    id: str
    hand: list[Card]
    # ids of the cards you may play right now, straight from the engine,
    # so the frontend never has to know the rules
    playable: list[str] = []
    # the card you just drew, the only one you may play now
    drawn: str | None = None


class PublicPlayer(BaseModel):
    # A player as the others see them, no hand here
    id: str
    name: str
    # Count only, the hand itself never leaves the server
    cards: int
    connected: bool = True
    uno: bool = False
    # An AI seat. The room fills this in, the engine treats all alike
    bot: bool = False
    # Difficulty of an AI seat, None on humans. The room fills this in
    bot_level: Literal["easy", "medium", "hard"] | None = None
    # Avatar URL of the account in this seat. The room fills this in
    # like the bot flag, empty for guests and bots
    avatar: str = ""
    # What the cards still in this hand are worth, 0 until the game ends
    points: int = 0
    # False while still on the result screen, the host deals when all are back
    ready: bool = True


class LastAction(BaseModel):
    # What just happened, so the frontend knows what to animate.
    # "timeout" is the server closing an idle turn, never a player act
    player: str
    kind: Literal[
        "join", "start", "play", "draw", "catch", "challenge",
        "timeout", "uno",
    ]
    card: Card | None = None
    # Who the action lands on: the victim of an action card, the swap
    # target of a seven, the caught player, the exposed bluffer
    target: str | None = None
    # How many cards moved, on draws, catches and settled penalties
    count: int | None = None


class GameState(BaseModel):
    # One player's full view, sent to everyone after each accepted action
    type: Literal["state"] = "state"
    # Grows each update, clients drop anything older than the last seen
    seq: int
    phase: Phase
    you: PrivateView  # the JSON field stays "you" on the wire
    players: list[PublicPlayer]  # in play order
    # Who may start the game and manage bots, always a human
    host_id: str | None = None
    # The room's rules, so joining by code tells you the same as the list
    settings: GameSettings | None = None
    top_card: Card | None = None
    # Differs from top_card.color after a wild
    active_color: Color | None = None
    direction: Literal[1, -1] = 1
    turn: str | None = None  # player id, None outside play
    draw_pile: int = 0  # count only
    # cards the player on turn must draw, grows while +2s stack
    stack: int = 0
    # set while a played +4 waits for the next player to draw or challenge
    plus4_by: str | None = None
    last_action: LastAction | None = None
    winner: str | None = None
    # The winner scores every card left in the other hands
    winner_score: int | None = None
