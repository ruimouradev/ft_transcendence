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


def build_deck(rng: random.Random | None = None):
    shuffler = rng or random.Random()
    deck_specs: list[tuple[Color, Value]] = [(c, v) for c in COLORS for v in VALUES]
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
class Effect:
    draw: int = 0
    skip: bool = False
    reverse: bool = False


_EFFECTS: dict[Value, Effect] = {
    "skip": Effect(skip=True),
    "reverse": Effect(reverse=True),
    "+2": Effect(draw=2, skip=True),
    "+4": Effect(draw=4, skip=True),
}


def is_playable(card: Card, active_color: Color, top: Card):
    return (
        card.color == "wild"
        or card.color == active_color
        or card.value == top.value
    )
