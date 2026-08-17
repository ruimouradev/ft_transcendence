"""
The message types the server and the client exchange. A player sends
actions (create, join, add_bot, remove_bot, start, play, draw, pass,
catch, challenge), the server sends back the game state after each
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
    name: str
    settings: GameSettings = GameSettings()


class Join(BaseModel):
    type: Literal["join"] = "join"
    name: str
    # Present when reclaiming a seat after a disconnect, from Welcome
    token: str | None = None


class AddBot(BaseModel):
    # Host only, in the lobby: seats an AI player on the next free chair
    type: Literal["add_bot"] = "add_bot"


class RemoveBot(BaseModel):
    # Host only, in the lobby: frees the chair of that bot
    type: Literal["remove_bot"] = "remove_bot"
    target: str


class Start(BaseModel):
    type: Literal["start"] = "start"


class Play(BaseModel):
    type: Literal["play"] = "play"
    card: str
    # Color is required when the card is a wild
    color: Color | None = None
    # Saying uno travels with the play
    uno: bool = False
    # Whose hand you take, required for a 7 under the seven-zero rule
    target: str | None = None


class Draw(BaseModel):
    type: Literal["draw"] = "draw"


class Pass(BaseModel):
    # Can only be played after drawing a playable card
    type: Literal["pass"] = "pass"


class Catch(BaseModel):
    # For a player who has one card remaining but failed to declare UNO
    # The target must draw two cards as a penalty
    type: Literal["catch"] = "catch"
    target: str


class Challenge(BaseModel):
    # For the +4 victim who thinks it was played while holding the
    # active color.
    # Right: the player who bluffed draws the 4.
    # Wrong: you draw 6.
    type: Literal["challenge"] = "challenge"


# the type field tells pydantic which model to build from the raw text
PlayerAction = Annotated[
    Create | Join | AddBot | RemoveBot | Start | Play | Draw | Pass
    | Catch | Challenge,
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
    INVALID_CHALLENGE = "INVALID_CHALLENGE"
    INVALID_MESSAGE = "INVALID_MESSAGE"
    ROOM_FULL = "ROOM_FULL"
    GAME_NOT_STARTED = "GAME_NOT_STARTED"
    GAME_ALREADY_STARTED = "GAME_ALREADY_STARTED"


class Error(BaseModel):
    # Sent to the sender only, the game state did not change
    type: Literal["error"] = "error"
    code: ErrorCode
    msg: str


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
    # the card you just drew, while you may still play it or pass
    drawn: str | None = None


class PublicPlayer(BaseModel):
    # A player as the others see them, no hand here
    id: str
    name: str
    # Count only, the hand itself never leaves the server
    cards: int
    connected: bool = True
    uno: bool = False
    # What the cards still in this hand are worth, 0 until the game ends
    points: int = 0


class LastAction(BaseModel):
    # What just happened, so the frontend knows what to animate
    player: str
    kind: Literal[
        "join", "start", "play", "draw", "pass", "catch", "challenge",
    ]
    card: Card | None = None


class GameState(BaseModel):
    # One player's full view, sent to everyone after each accepted action
    type: Literal["state"] = "state"
    # Grows each update, clients drop anything older than the last seen
    seq: int
    phase: Phase
    you: PrivateView  # the JSON field stays "you" on the wire
    players: list[PublicPlayer]  # in play order
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
