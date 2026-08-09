
from dataclasses import dataclass, field

import random

from .contract import (
    Card, Color, ErrorCode, GameSettings, GameState,
)

from .rules import CardEffect, build_deck, effect_of, is_playable, points


@dataclass(frozen=True)
class Plus4:
    by
    legal


class GameError(Exception):
    def __init__(self, code: ErrorCode, msg: str) -> None:
        super().__init__(msg)
        self.code = code
        self.msg = msg


@dataclass
class Hand:
    id
    name
    cards: list[Card] = field(default_factory=list)
    said_uno = False
    connected = True


def _find(cards: list[Card], card_id: str) -> Card:
    return next((c for c in cards if c.id == card_id))


class Game:
    def __init__(self, players: list[tuple[str, str]],
                 seed,settings= None):
        self.hands = [Hand(id=i, name=n) for i, n in players]
        self.settings = settings or GameSettings()
        self.rng = random.Random(seed)
        self.deck = []
        self.discard = []
        self.phase = "lobby"
        self.last = None
        self.winner = None
        self.drawn = None
        self.stack = 0

    def start(self) -> None:
        if not 2 <= len(self.hands) <= 4:
            raise GameError(ErrorCode.INVALID_MESSAGE, "need 2 to 4 players")
        self.deck = build_deck(self.rng)
        for h in self.hands:
            h.cards = [
                self.deck.pop() for _ in range(self.settings.hand_size)
            ]
        first = self.deck.pop()
        while not first.value.isdigit():
            self.deck.insert(0, first)
            first = self.deck.pop()
        self.last = LastAction(player=self.hands[0].id, kind="start")
        self.seq += 1

    def play(self, player_id, card_id, color, uno, target: = None):
        pass