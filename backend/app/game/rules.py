"""
The deck and the play rules. build_deck makes a full shuffled deck,
effect_of gives a card's effect (draw, skip, reverse), is_playable
says whether a card matches the active color or the top value, and
points says what a card left in a hand is worth to the winner.
"""

from dataclasses import dataclass

import random

from .contract import Card, Color, Value


COLORS: tuple[Color, ...] = ("red", "yellow", "green", "blue")
# Each color has:
# one zero card
# two cards of each number from 1-9
# two cards from +2, skip and reverse
VALUES: list[Value] = [
    "0",
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "+2", "skip", "reverse",
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "+2", "skip", "reverse",
]


def build_deck(rng: random.Random | None = None) -> list[Card]:
    shuffler = rng or random.Random()
    deck_specs: list[tuple[Color, Value]] = [
        (c, v) for c in COLORS for v in VALUES
    ]
    for _ in range(4):
        # adding 4 cards wild (official name for changing color)
        # adding 4 cards +4 wild
        deck_specs.append(("wild", "wild"))
        deck_specs.append(("wild", "+4"))
    shuffler.shuffle(deck_specs)
    return [
        Card(id=f"c{i}", color=c, value=v)
        for i, (c, v) in enumerate(deck_specs)
    ]


@dataclass(frozen=True)
class CardEffect:
    draw: int = 0
    skip: bool = False
    reverse: bool = False


_CARD_EFFECTS: dict[Value, CardEffect] = {
    "skip": CardEffect(skip=True),
    "reverse": CardEffect(reverse=True),
    "+2": CardEffect(draw=2, skip=True),
    # applied by the engine only once the victim answers the challenge
    "+4": CardEffect(draw=4, skip=True),
}


def effect_of(card: Card) -> CardEffect:
    return _CARD_EFFECTS.get(card.value, CardEffect())


def is_playable(card: Card, active_color: Color | None, top: Card) -> bool:
    return (
        card.color == "wild"
        or card.color == active_color
        or card.value == top.value
    )


def points(card: Card) -> int:
    # official scoring: numbers at face value, actions 20, wilds 50
    if card.value.isdigit():
        return int(card.value)
    if card.color == "wild":
        return 50
    return 20
