from dataclasses import dataclass, field

import random

from .contract import (
    Card, Color, ErrorCode, GameSettings, GameState, LastAction,
    PrivateView, PublicPlayer,
)

from .rules import CardEffect, build_deck, effect_of, is_playable, points


@dataclass(frozen=True)
class Plus4:
    # a +4 the victim did not answer yet, if it's usable it will be decided at play time
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
    said_uno = False
    connected = True  # TODO the ws layer needs a hook to flip this on rejoin


def _find(cards: list[Card], card_id: str) -> Card | None:
    return next((c for c in cards if c.id == card_id), None)


class Game:
    def __init__(self, players: list[tuple[str, str]],
                 seed=None, settings=None):
        self.hands = [Hand(id=i, name=n) for i, n in players]
        self.settings = settings or GameSettings()
        self.rng = random.Random(seed)
        self.deck = []
        self.discard = []
        self.active_color = None
        self.direction = 1
        self.turn = 0
        self.phase = "lobby"
        self.seq = 0
        self.last = None
        self.winner = None
        # the card just drawn, also means the player drew this turn
        self.drawn = None
        # set while a +4 waits for the victim's draw or challenge
        self.plus4 = None
        self.stack = 0

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

    def play(self, player_id, card_id, color, uno, target=None):
        # the seven-zero house rule will use target
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
        self._apply_effect(effect_of(card))

    def draw(self, player_id):
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

    def do_pass(self, player_id):
        self._require_turn(player_id)
        if not self.drawn:
            raise GameError(
                ErrorCode.INVALID_MESSAGE, "you can only pass after drawing"
            )
        self.drawn = None
        self.last = LastAction(player=player_id, kind="pass")
        self.seq += 1
        self._step(1)

    def challenge(self, player_id):
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

    def catch(self, player_id, target_id):
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

    def snapshot_for(self, player_id):
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
            plus4_by=self.plus4.by if self.plus4 else None,
            last_action=self.last,
            winner=self.winner,
            # the winner's own hand is empty, so the total is the others'
            winner_score=sum(s.points for s in seats) if finished else None,
        )

    def legal_moves(self, player_id):
        # is the base source so both the AI and the frontend can read this
        if self.phase != "playing" or self.hands[self.turn].id != player_id:
            return []
        if self.plus4:
            return []
        top = self.discard[-1]
        # after drawing, the drawn card is the only one playable
        cards = [self.drawn] if self.drawn else self._hand(player_id).cards
        return [
            c for c in cards if is_playable(c, self.active_color, top)
        ]

    def _require_turn(self, player_id):
        if self.phase != "playing":
            raise GameError(ErrorCode.GAME_NOT_STARTED, "no game running")
        if self.hands[self.turn].id != player_id:
            raise GameError(ErrorCode.NOT_YOUR_TURN, "wait for your turn")

    def _hand(self, player_id):
        for h in self.hands:
            if h.id == player_id:
                return h
        raise GameError(ErrorCode.INVALID_MESSAGE, "no such player")

    def _finish_or_step(self, plus4_by):
        # a +4 win only counts after the victim answers
        if not self._hand(plus4_by).cards:
            self.phase = "finished"
            self.winner = plus4_by
            return
        self._step(1)

    def _deal(self, hand, n):
        # hand grew, the uno call resets
        hand.said_uno = False
        for _ in range(n):
            if not self.deck:
                self._reshuffle()
            if self.deck:
                hand.cards.append(self.deck.pop())

    def _reshuffle(self):
        # the discard goes back into the deck, minus its top card
        if len(self.discard) <= 1:
            return
        top = self.discard.pop()
        self.rng.shuffle(self.discard)
        self.deck = self.discard
        self.discard = [top]

    def _step(self, times):
        self.turn = (self.turn + self.direction * times) % len(self.hands)

    def _apply_effect(self, effect):
        if effect.reverse and len(self.hands) > 2:
            self.direction = -self.direction
        victim = (self.turn + self.direction) % len(self.hands)
        if effect.draw:
            self._deal(self.hands[victim], effect.draw)
        # with two players a reverse just skips, like the rules say
        two_player_reverse = effect.reverse and len(self.hands) == 2
        self._step(2 if effect.skip or two_player_reverse else 1)