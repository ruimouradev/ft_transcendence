from typing import  Literal

from pydantic import BaseModel

from enum import Enum

Color = Literal["red", "yellow", "green", "blue", "wild"]
Value = Literal[
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "+2", "skip", "reverse", "wild", "+4",
]


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
    # For an player who has one card remaining but failed to declare UNO
    # The target must draw two cards as a penalty
    type: Literal["catch"] = "catch"
    target: str


class ErrorCode(str, Enum):
    NOT_YOUR_TURN = "NOT_YOUR_TURN"
    INVALID_CARD = "INVALID_CARD"
    COLOR_REQUIRED = "COLOR_REQUIRED"
    CARD_NOT_IN_HAND = "CARD_NOT_IN_HAND"
    ROOM_FULL = "ROOM_FULL"
    GAME_NOT_STARTED = "GAME_NOT_STARTED"
    GAME_ALREADY_STARTED = "GAME_ALREADY_STARTED"