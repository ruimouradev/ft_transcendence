from dataclasses import dataclass, field

from fastapi import WebSocket

from app.game.contract import (
    Card, Color, LastAction, Phase
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
    top: Card = None
    active_color: Color = None
    turn: int = 0
    seq: int = 0
    last: LastAction = None
    winner: str = None


rooms: dict[str, Room] = {}