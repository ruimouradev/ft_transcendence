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


class Join(BaseModel):
    type: Literal["join"] = "join"
    name: str


class Start(BaseModel):
    type: Literal["start"] = "start"


class Play(BaseModel):
    type: Literal["play"] = "play"
    card: str
    # Color is required when the card is a wild
    color: Color | None = None
    # Saying uno travels with the play
    uno: bool = False


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


# the type field tells pydantic which model to build from the raw text
PlayerAction = Annotated[
    Join | Start | Play | Draw | Pass | Catch,
    Field(discriminator="type"),
]

_action_adapter: TypeAdapter[PlayerAction] = TypeAdapter(PlayerAction)


def parse_action(data: str | bytes) -> PlayerAction:
    return _action_adapter.validate_json(data)


class ErrorCode(str, Enum):
    NOT_YOUR_TURN = "NOT_YOUR_TURN"
    INVALID_CARD = "INVALID_CARD"
    COLOR_REQUIRED = "COLOR_REQUIRED"
    CARD_NOT_IN_HAND = "CARD_NOT_IN_HAND"
    INVALID_CATCH = "INVALID_CATCH"
    INVALID_MESSAGE = "INVALID_MESSAGE"
    ROOM_FULL = "ROOM_FULL"
    GAME_NOT_STARTED = "GAME_NOT_STARTED"
    GAME_ALREADY_STARTED = "GAME_ALREADY_STARTED"


class Error(BaseModel):
    # Sent to the sender only, the game state did not change
    type: Literal["error"] = "error"
    code: ErrorCode
    msg: str


class PrivateView(BaseModel):
    # The only part of a game state the other players must never get
    id: str
    hand: list[Card]


class PublicPlayer(BaseModel):
    # A player as the others see them, no hand here
    id: str
    name: str
    # Count only, the hand itself never leaves the server
    cards: int
    connected: bool = True
    uno: bool = False


class LastAction(BaseModel):
    # What just happened, so the frontend knows what to animate
    player: str
    kind: Literal["join", "start", "play", "draw", "pass", "catch"]
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
    last_action: LastAction | None = None
    winner: str | None = None
