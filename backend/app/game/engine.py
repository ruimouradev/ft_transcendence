from dataclasses import dataclass, field

import random

from .contract import (
    Card, Color, ErrorCode, GameSettings, GameState, LastAction,
    PrivateView, PublicPlayer,
)

from .rules import CardEffect, build_deck, effect_of, is_playable, points


@dataclass(frozen=True)
class Plus4:
    # for the +4 challenge, will use this later
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
        self.active_color = None
        self.direction = 1
        self.turn = 0
        self.phase = "lobby"
        self.seq = 0
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
        # target for the 7 swap rule later, unused for now
        self._require_turn(player_id)
        hand = self.hands[self.turn]
        card = _find(hand.cards, card_id)
        if card is None:
            raise GameError(ErrorCode.CARD_NOT_IN_HAND, "card not in your hand")
        if card.color == "wild" and color is None:
            raise GameError(ErrorCode.COLOR_REQUIRED, "a wild needs a color")
        if not is_playable(card, self.active_color, self.discard[-1]):
            raise GameError(ErrorCode.INVALID_CARD, "card does not match")
        hand.cards.remove(card)
        self.discard.append(card)
        if card.color == "wild":
            self.active_color = color
        else:
            self.active_color = card.color
        hand.said_uno = uno
        self.drawn = None
        self.last = LastAction(player=player_id, kind="play", card=card)
        self.seq += 1
        if not hand.cards:
            self.phase = "finished"
            self.winner = player_id
            return
        effect = effect_of(card)
        if effect.reverse:
            self.direction = -self.direction
        victim = (self.turn + self.direction) % len(self.hands)
        if effect.draw:
            for _ in range(effect.draw):
                self.hands[victim].cards.append(self.deck.pop())
        self._step(2 if effect.skip else 1)

    def draw(self, player_id):
        # TODO official rules allow only one draw per turn
        self._require_turn(player_id)
        hand = self.hands[self.turn]
        hand.cards.append(self.deck.pop())  # TODO deck can run out here
        self.last = LastAction(player=player_id, kind="draw")
        self.seq += 1
        card = hand.cards[-1]
        if is_playable(card, self.active_color, self.discard[-1]):
            self.drawn = card  # may play it or pass
        else:
            self.drawn = None
            self._step(1)

    def do_pass(self, player_id):
        self._require_turn(player_id)
        if not self.drawn:
            raise GameError(ErrorCode.INVALID_MESSAGE, "you can only pass after drawing")
        self.drawn = None
        self.last = LastAction(player=player_id, kind="pass")
        self.seq += 1
        self._step(1)

    def catch(self, player_id, target_id):
        if self.phase != "playing":
            raise GameError(ErrorCode.GAME_NOT_STARTED, "no game running")
        target = self._hand(target_id)
        if len(target.cards) != 1 or target.said_uno:
            raise GameError(ErrorCode.INVALID_CATCH, "target said uno or is not at one card")
        target.cards.append(self.deck.pop())
        target.cards.append(self.deck.pop())
        self.last = LastAction(player=player_id, kind="catch")
        self.seq += 1

    def snapshot_for(self, player_id):
        me = self._hand(player_id)
        seats = []
        for h in self.hands:
            seats.append(PublicPlayer(id=h.id, name=h.name, cards=len(h.cards),
                                      connected=h.connected, uno=h.said_uno))
        return GameState(
            seq=self.seq,
            phase=self.phase,
            you=PrivateView(id=me.id, hand=me.cards),
            players=seats,
            top_card=self.discard[-1] if self.discard else None,
            active_color=self.active_color,
            direction=self.direction,
            turn=self.hands[self.turn].id if self.phase == "playing" else None,
            draw_pile=len(self.deck),
            last_action=self.last,
            winner=self.winner,
        )

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

    def _step(self, times):
        self.turn = (self.turn + self.direction * times) % len(self.hands)
