
from typing import  Literal

from pydantic import BaseModel


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

