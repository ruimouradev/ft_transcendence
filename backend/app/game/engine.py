from dataclasses import dataclass, field
from typing import Literal

import random

from .contract import (
    Card, Color, ErrorCode, GameSettings, GameState, LastAction, Phase,
    PrivateView, PublicPlayer,
)

from .rules import CardEffect, build_deck, effect_of, is_playable, points


@dataclass(frozen=True)
class Plus4:
    # a +4 the victim did not answer yet, legal is decided at play time
    by: str
    legal: bool


class GameError(Exception):
    def __init__(self, code: ErrorCode, msg: str) -> None:
        super().__init__(msg)
        self.code = code
        self.msg = msg


@dataclass
class Hand:
    id: str
    name: str
    cards: list[Card] = field(default_factory=list)
    said_uno: bool = False
    connected: bool = True  # flipped by set_connected on disconnect/rejoin


def _find(cards: list[Card], card_id: str) -> Card | None:
    return next((c for c in cards if c.id == card_id), None)


class Game:
    def __init__(self, players: list[tuple[str, str]],
                 seed: int | None = None,
                 settings: GameSettings | None = None) -> None:
        self.hands = [Hand(id=i, name=n) for i, n in players]
        self.settings = settings or GameSettings()
        self.rng = random.Random(seed)
        self.deck: list[Card] = []
        self.discard: list[Card] = []
        self.active_color: Color | None = None
        self.direction: Literal[1, -1] = 1
        self.turn = 0
        self.phase: Phase = "lobby"
        self.seq = 0
        self.last: LastAction | None = None
        self.winner: str | None = None
        # the card just drawn, also means the player drew this turn
        self.drawn: Card | None = None
        # set while a +4 waits for the victim's draw or challenge
        self.plus4: Plus4 | None = None
        self.stack = 0  # cards the player on turn owes while +2s stack

    def start(self) -> None:
        if self.phase != "lobby":
            raise GameError(
                ErrorCode.GAME_ALREADY_STARTED, "game already started"
            )
        if not 2 <= len(self.hands) <= 4:
            raise GameError(ErrorCode.INVALID_MESSAGE, "need 2 to 4 players")
        self.deck = build_deck(self.rng)
        for h in self.hands:
            h.cards = [
                self.deck.pop() for _ in range(self.settings.hand_size)
            ]
        first = self.deck.pop()
        # cant start on an action card, redraw until a number shows
        while not first.value.isdigit():
            self.deck.insert(0, first)
            first = self.deck.pop()
        self.discard = [first]
        self.active_color = first.color
        self.phase = "playing"
        self.last = LastAction(player=self.hands[0].id, kind="start")
        self.seq += 1

    def play(self, player_id: str, card_id: str,
             color: Color | None, uno: bool,
             target: str | None = None) -> None:
        self._require_turn(player_id)
        if self.plus4:
            raise GameError(
                ErrorCode.INVALID_MESSAGE, "draw or challenge the +4 first"
            )
        hand = self.hands[self.turn]
        card = _find(hand.cards, card_id)
        if card is None:
            raise GameError(
                ErrorCode.CARD_NOT_IN_HAND, "card not in your hand"
            )
        if self.stack and card.value != "+2":
            raise GameError(
                ErrorCode.INVALID_CARD, "answer the +2 pile or draw it"
            )
        if self.drawn and card.id != self.drawn.id:
            raise GameError(
                ErrorCode.INVALID_CARD, "after drawing, only the drawn card"
            )
        if card.color == "wild" and color in (None, "wild"):
            raise GameError(ErrorCode.COLOR_REQUIRED, "a wild needs a color")
        if not is_playable(card, self.active_color, self.discard[-1]):
            raise GameError(
                ErrorCode.INVALID_CARD, "card matches neither color nor value"
            )
        swap_with: Hand | None = None
        if (self.settings.seven_zero and card.value == "7"
                and len(hand.cards) > 1):
            # a last card 7 just wins, nothing left to trade
            if target is None:
                raise GameError(
                    ErrorCode.TARGET_REQUIRED, "a seven needs a target"
                )
            if target == player_id:
                raise GameError(
                    ErrorCode.INVALID_MESSAGE, "cannot swap with yourself"
                )
            swap_with = self._hand(target)
        # holding the color makes this a bluff, check it before the
        # color changes
        legal = not any(
            c.color == self.active_color for c in hand.cards if c is not card
        )
        hand.cards.remove(card)
        self.discard.append(card)
        self.active_color = color if card.color == "wild" else card.color
        hand.said_uno = uno
        self.drawn = None
        self.last = LastAction(player=player_id, kind="play", card=card)
        self.seq += 1
        if card.value == "+4":
            # no win yet, the victim may still answer
            self.plus4 = Plus4(by=player_id, legal=legal)
            self._step(1)
            return
        if not hand.cards:
            self.phase = "finished"
            self.winner = player_id
            return
        if self.settings.stacking and card.value == "+2":
            # the pile is not drawn now, it passes on
            self.stack += 2
            self._step(1)
            return
        if swap_with is not None:
            hand.cards, swap_with.cards = swap_with.cards, hand.cards
            # both hands changed size, uno calls reset
            hand.said_uno = swap_with.said_uno = False
        elif self.settings.seven_zero and card.value == "0":
            self._rotate()
        self._apply_effect(effect_of(card))

    def draw(self, player_id: str) -> None:
        self._require_turn(player_id)
        hand = self.hands[self.turn]
        if self.plus4:
            # drawing is how a +4 is accepted, then the turn is skipped
            plus4 = self.plus4
            self.plus4 = None
            self._deal(hand, effect_of(self.discard[-1]).draw)
            self.last = LastAction(player=player_id, kind="draw")
            self.seq += 1
            self._finish_or_step(plus4.by)
            return
        if self.stack:
            # drawing takes the whole pile
            owed, self.stack = self.stack, 0
            self._deal(hand, owed)
            self.last = LastAction(player=player_id, kind="draw")
            self.seq += 1
            self._step(1)
            return
        if self.drawn:
            raise GameError(ErrorCode.INVALID_MESSAGE, "one draw per turn")
        self._deal(hand, 1)
        self.last = LastAction(player=player_id, kind="draw")
        self.seq += 1
        drawn = hand.cards[-1]
        if is_playable(drawn, self.active_color, self.discard[-1]):
            self.drawn = drawn  # may now play it or pass
        else:
            self.drawn = None
            self._step(1)

    def do_pass(self, player_id: str) -> None:
        self._require_turn(player_id)
        if not self.drawn:
            raise GameError(
                ErrorCode.INVALID_MESSAGE, "you can only pass after drawing"
            )
        self.drawn = None
        self.last = LastAction(player=player_id, kind="pass")
        self.seq += 1
        self._step(1)

    def challenge(self, player_id: str) -> None:
        # answer a +4 by accusing its player of holding the color
        self._require_turn(player_id)
        if not self.plus4:
            raise GameError(ErrorCode.INVALID_CHALLENGE, "no +4 to challenge")
        plus4 = self.plus4
        self.plus4 = None
        self.last = LastAction(player=player_id, kind="challenge")
        self.seq += 1
        penalty = effect_of(self.discard[-1]).draw
        if plus4.legal:
            # wrong call, the 4 plus 2 for doubting
            self._deal(self.hands[self.turn], penalty + 2)
            self._finish_or_step(plus4.by)
        else:
            # bluff exposed, the penalty changes hands
            self._deal(self._hand(plus4.by), penalty)

    def catch(self, player_id: str, target_id: str) -> None:
        if self.phase != "playing":
            raise GameError(ErrorCode.GAME_NOT_STARTED, "no game running")
        if player_id == target_id:
            raise GameError(ErrorCode.INVALID_CATCH, "cannot catch yourself")
        target = self._hand(target_id)
        if len(target.cards) != 1 or target.said_uno:
            raise GameError(
                ErrorCode.INVALID_CATCH,
                "target said uno or is not at one card",
            )
        self._deal(target, 2)
        self.last = LastAction(player=player_id, kind="catch")
        self.seq += 1

    def snapshot_for(self, player_id: str) -> GameState:
        me = self._hand(player_id)
        # points only count when the game is over
        finished = self.phase == "finished"
        seats = [
            PublicPlayer(
                id=h.id, name=h.name, cards=len(h.cards),
                connected=h.connected, uno=h.said_uno,
                points=sum(points(c) for c in h.cards) if finished else 0,
            )
            for h in self.hands
        ]
        playing = self.phase == "playing"
        on_turn = playing and self.hands[self.turn] is me
        return GameState(
            seq=self.seq,
            phase=self.phase,
            you=PrivateView(
                id=me.id,
                hand=me.cards,
                playable=[c.id for c in self.legal_moves(player_id)],
                drawn=self.drawn.id if on_turn and self.drawn else None,
            ),
            players=seats,
            top_card=self.discard[-1] if self.discard else None,
            active_color=self.active_color,
            direction=self.direction,
            turn=self.hands[self.turn].id if playing else None,
            draw_pile=len(self.deck),
            stack=self.stack,
            plus4_by=self.plus4.by if self.plus4 else None,
            last_action=self.last,
            winner=self.winner,
            # the winner's own hand is empty, so the total is the others'
            winner_score=sum(s.points for s in seats) if finished else None,
        )

    def legal_moves(self, player_id: str) -> list[Card]:
        # both the AI and the frontend read this, one source of truth
        if self.phase != "playing" or self.hands[self.turn].id != player_id:
            return []
        if self.plus4:
            return []
        if self.stack:
            # only a +2 answers the pile
            return [
                c for c in self._hand(player_id).cards if c.value == "+2"
            ]
        top = self.discard[-1]
        # after drawing, the drawn card is the only one playable
        cards = [self.drawn] if self.drawn else self._hand(player_id).cards
        return [
            c for c in cards if is_playable(c, self.active_color, top)
        ]

    def set_connected(self, player_id: str, connected: bool) -> None:
        # the ws layer calls this on a disconnect and on a rejoin, the
        # seat itself never leaves the game
        self._hand(player_id).connected = connected
        self.seq += 1

    def _rotate(self) -> None:
        # every hand moves one seat in the play direction
        n = len(self.hands)
        cards = [h.cards for h in self.hands]
        for i, h in enumerate(self.hands):
            h.cards = cards[(i - self.direction) % n]
            h.said_uno = False

    def _require_turn(self, player_id: str) -> None:
        if self.phase != "playing":
            raise GameError(ErrorCode.GAME_NOT_STARTED, "no game running")
        if self.hands[self.turn].id != player_id:
            raise GameError(ErrorCode.NOT_YOUR_TURN, "wait for your turn")

    def _hand(self, player_id: str) -> Hand:
        for h in self.hands:
            if h.id == player_id:
                return h
        raise GameError(ErrorCode.INVALID_MESSAGE, "no such player")

    def _finish_or_step(self, plus4_by: str) -> None:
        # a +4 win only counts after the victim answers
        if not self._hand(plus4_by).cards:
            self.phase = "finished"
            self.winner = plus4_by
            return
        self._step(1)

    def _deal(self, hand: Hand, n: int) -> None:
        # hand grew, the uno call resets
        hand.said_uno = False
        for _ in range(n):
            if not self.deck:
                self._reshuffle()
            if self.deck:
                hand.cards.append(self.deck.pop())

    def _reshuffle(self) -> None:
        # the discard goes back into the deck, minus its top card
        if len(self.discard) <= 1:
            return
        top = self.discard.pop()
        self.rng.shuffle(self.discard)
        self.deck = self.discard
        self.discard = [top]

    def _step(self, times: int) -> None:
        self.turn = (self.turn + self.direction * times) % len(self.hands)

    def _apply_effect(self, effect: CardEffect) -> None:
        if effect.reverse and len(self.hands) > 2:
            self.direction = -1 if self.direction == 1 else 1
        victim = (self.turn + self.direction) % len(self.hands)
        if effect.draw:
            self._deal(self.hands[victim], effect.draw)
        # with two players a reverse just skips, like the rules say
        two_player_reverse = effect.reverse and len(self.hands) == 2
        self._step(2 if effect.skip or two_player_reverse else 1)
