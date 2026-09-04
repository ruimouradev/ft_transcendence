"""
The Uno game. It owns the whole state (deck, hands, whose turn, the
direction, the active color) and is the only place a move is accepted or
refused. It reads the intents from contract.py, applies the rules from
rules.py, and builds each player's own view of the state. The websocket
layer only carries these messages, it holds no game logic.

A refused move raises GameError, which carries the code the websocket
layer sends back to that one player. An accepted move mutates the state
and bumps seq, so the next snapshot is newer than the last.
"""

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
    """A played +4 waiting for the victim to draw or challenge.

    Whether it was legal is frozen here at play time, so cards dealt
    later (a catch on the player, say) cannot change the verdict.
    """

    by: str
    legal: bool


class GameError(Exception):
    """A refused move, carrying the code sent back to that player."""

    def __init__(self, code: ErrorCode, msg: str) -> None:
        super().__init__(msg)
        self.code = code
        self.msg = msg


@dataclass
class Hand:
    """One seat at the table: the player's cards and their flags."""

    id: str
    name: str
    cards: list[Card] = field(default_factory=list)
    said_uno: bool = False
    connected: bool = True


def _find(cards: list[Card], card_id: str) -> Card | None:
    return next((c for c in cards if c.id == card_id), None)


class Game:
    """One Uno game: the whole state and every rule applied to it."""

    def __init__(self, players: list[tuple[str, str]],
                 seed: int | None = None,
                 settings: GameSettings | None = None) -> None:
        """Seat the players; the game itself starts with start().

        Args:
            players: (id, name) pairs in seating order.
            seed: Seeds the shuffles, making the whole game
                reproducible, which is handy for tests and for
                replaying a bug seen at evaluation.
            settings: The room's house rules, official defaults when
                None.
        """
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
        # the card the current player just drew and may still play, also
        # the proof they already drew this turn
        self.drawn: Card | None = None
        # set while a +4 waits for the victim's draw or challenge
        self.plus4: Plus4 | None = None
        # cards the player on turn owes, grows while +2s stack
        self.stack = 0

    def start(self) -> None:
        """Deal the hands and turn the first card, opening on a number.

        Raises:
            GameError: If the game already started, or the table does not
                have between 2 and 4 players.
        """
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
        while not first.value.isdigit():
            # a number opener avoids the special first-card cases
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
        """Play a card from the current player's hand.

        Args:
            player_id: Who is playing. Must be the player on turn.
            card_id: The card's id in that player's hand.
            color: The chosen color, required when the card is a wild.
            uno: Whether the player calls Uno with this play.
            target: Whose hand to take, required for a 7 under the
                seven-zero rule.

        Raises:
            GameError: If it is not the player's turn, a +4 against them
                is unanswered, a +2 pile awaits and this is not a +2,
                the card is not in their hand or is not the one they
                just drew, a wild came without a color, a seven came
                without a target, or the card matches neither the
                active color nor the top value.
        """
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
            # a last-card 7 just wins, there is no hand left to trade
            if target is None:
                raise GameError(
                    ErrorCode.TARGET_REQUIRED, "a seven needs a target"
                )
            if target == player_id:
                raise GameError(
                    ErrorCode.INVALID_MESSAGE, "cannot swap with yourself"
                )
            swap_with = self._hand(target)
        # a +4 with a card of the active color in hand is a bluff, allowed
        # but challengeable, so remember the verdict before the color
        # changes
        legal = not any(
            c.color == self.active_color for c in hand.cards if c is not card
        )
        hand.cards.remove(card)
        self.discard.append(card)
        self.active_color = color if card.color == "wild" else card.color
        # an uno said just before by say_uno is not erased here, and
        # the flag only counts when the play leaves a single card
        hand.said_uno = hand.said_uno or (uno and len(hand.cards) == 1)
        self.drawn = None
        # who the card lands on and how many cards move now, so the
        # frontend animates without redoing the rules
        effect = effect_of(card)
        victim = self.hands[(self.turn + self.direction)
                            % len(self.hands)].id
        lands_on = None
        moved = None
        if swap_with is not None:
            lands_on = target
        elif card.value in ("+2", "+4") or effect.skip or (
                effect.reverse and len(self.hands) == 2):
            lands_on = victim
        if card.value == "+2" and (not self.settings.stacking
                                   or not hand.cards):
            # a last +2 is never stacked on, the whole pile lands now
            moved = 2 + self.stack
        self.last = LastAction(player=player_id, kind="play", card=card,
                               target=lands_on, count=moved)
        self.seq += 1
        if card.value == "+4":
            # nothing is drawn and a win is not granted until the victim
            # answers, they may still challenge and pay 6 instead of 4
            self.plus4 = Plus4(by=player_id, legal=legal)
            self._step(1)
            return
        if not hand.cards:
            if moved:
                self._deal(self._hand(victim), moved)
                self.stack = 0
            self.phase = "finished"
            self.winner = player_id
            return
        if self.settings.stacking and card.value == "+2":
            # the pile is not drawn now, it passes to the next player
            self.stack += 2
            self._step(1)
            return
        if swap_with is not None:
            hand.cards, swap_with.cards = swap_with.cards, hand.cards
            # both hands changed size, earlier uno calls no longer stand
            hand.said_uno = swap_with.said_uno = False
        elif self.settings.seven_zero and card.value == "0":
            self._rotate()
        self._apply_effect(effect)

    def draw(self, player_id: str) -> None:
        """Draw for the current player.

        Facing a +4 this is how it is accepted: the player draws the 4
        and is skipped. Facing a +2 pile the whole pile is drawn the
        same way. Otherwise one card is drawn; a playable draw must
        be played, an unplayable one passes the turn on its own.

        Args:
            player_id: Who is drawing. Must be the player on turn.

        Raises:
            GameError: If it is not the player's turn, or they already
                drew their one card this turn.
        """
        self._require_turn(player_id)
        hand = self.hands[self.turn]
        if self.plus4:
            plus4 = self.plus4
            self.plus4 = None
            # the +4 still tops the discard, the effect table says how
            # many cards
            owed = effect_of(self.discard[-1]).draw
            self._deal(hand, owed)
            self.last = LastAction(player=player_id, kind="draw",
                                   count=owed)
            self.seq += 1
            self._finish_or_step(plus4.by)
            return
        if self.stack:
            owed, self.stack = self.stack, 0
            self._deal(hand, owed)
            self.last = LastAction(player=player_id, kind="draw",
                                   count=owed)
            self.seq += 1
            self._step(1)
            return
        if self.drawn:
            raise GameError(ErrorCode.INVALID_MESSAGE, "one draw per turn")
        self._deal(hand, 1)
        self.last = LastAction(player=player_id, kind="draw", count=1)
        self.seq += 1
        drawn = hand.cards[-1]
        if is_playable(drawn, self.active_color, self.discard[-1]):
            self.drawn = drawn  # a drawn playable card must be played
        else:
            self.drawn = None
            self._step(1)

    def challenge(self, player_id: str) -> None:
        """Answer a +4 by accusing its player of holding the active color.

        A right call sends the 4 cards to the bluffer and the challenger
        plays on. A wrong one costs the challenger 6 cards, the 4 plus 2
        for doubting, and their turn.

        Args:
            player_id: Who is challenging. Must be the +4's victim, the
                player on turn.

        Raises:
            GameError: If it is not the player's turn, or there is no
                unanswered +4.
        """
        self._require_turn(player_id)
        if not self.plus4:
            raise GameError(ErrorCode.INVALID_CHALLENGE, "no +4 to challenge")
        plus4 = self.plus4
        self.plus4 = None
        penalty = effect_of(self.discard[-1]).draw
        if plus4.legal:
            self.last = LastAction(player=player_id, kind="challenge",
                                   count=penalty + 2)
            self.seq += 1
            self._deal(self.hands[self.turn], penalty + 2)
            self._finish_or_step(plus4.by)
        else:
            # the bluff is exposed, the penalty changes hands and the
            # challenger's own turn still stands
            self.last = LastAction(player=player_id, kind="challenge",
                                   target=plus4.by, count=penalty)
            self.seq += 1
            self._deal(self._hand(plus4.by), penalty)

    def say_uno(self, player_id: str) -> None:
        """Register a player's Uno call, sent as its own message.

        Two moments make it valid: holding two cards on the player's
        own turn with a legal play available, calling before that play,
        or holding one undeclared card, the late call that races the
        opponents' catch. Ties are settled by whichever message reached
        the server first. With two cards and nothing playable the turn
        can only end in a draw, so such a call would always be empty
        and is refused.

        Args:
            player_id: Who is calling Uno.

        Raises:
            GameError: If no game is running, the call was already
                made, or the player is in neither valid moment.
        """
        if self.phase != "playing":
            raise GameError(ErrorCode.GAME_NOT_STARTED, "no game running")
        hand = self._hand(player_id)
        if hand.said_uno:
            raise GameError(ErrorCode.INVALID_UNO, "uno already said")
        # legal_moves already knows the turn, a pending +4 or +2 pile
        # and the drawn card rule, empty means no play can follow
        before = len(hand.cards) == 2 and bool(self.legal_moves(player_id))
        late = len(hand.cards) == 1
        if not (before or late):
            raise GameError(
                ErrorCode.INVALID_UNO, "not the moment to say uno"
            )
        hand.said_uno = True
        self.last = LastAction(player=player_id, kind="uno")
        self.seq += 1

    def catch(self, player_id: str, target_id: str) -> None:
        """Punish a player who reached one card without calling Uno.

        Args:
            player_id: Who is calling out the target.
            target_id: The player being caught, who then draws 2.

        Raises:
            GameError: If no game is running, the catcher targets
                themselves, or the target is not at one card or did
                call Uno.
        """
        if self.phase != "playing":
            raise GameError(ErrorCode.GAME_NOT_STARTED, "no game running")
        if player_id == target_id:
            # catching the forgetful player is the opponents' right, the
            # official game has no self-inflicted penalty
            raise GameError(ErrorCode.INVALID_CATCH, "cannot catch yourself")
        target = self._hand(target_id)
        if len(target.cards) != 1 or target.said_uno:
            raise GameError(
                ErrorCode.INVALID_CATCH,
                "target said uno or is not at one card",
            )
        self._deal(target, 2)
        self.last = LastAction(player=player_id, kind="catch",
                               target=target_id, count=2)
        self.seq += 1

    def snapshot_for(self, player_id: str) -> GameState:
        """Build one player's own view of the game.

        Args:
            player_id: The player the snapshot is for. Only their hand is
                included; the others show a card count.

        Returns:
            The GameState to send to that player.
        """
        me = self._hand(player_id)
        # what a hand is worth only means something once the game is over
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
        """Return the cards a player could legally play right now.

        Both the AI opponent and the frontend read this so they never
        reimplement the playable rule and drift from the server, which is
        the single source of truth. A bluffed +4 is listed too, playing
        it is legal and may be challenged.

        Args:
            player_id: The player asking.

        Returns:
            The playable cards in their hand. Empty when it is not their
            turn, nothing matches, or a +4 awaits their draw or challenge.
        """
        if self.phase != "playing" or self.hands[self.turn].id != player_id:
            return []
        if self.plus4:
            return []
        if self.stack:
            # only a +2 may answer the pile
            return [
                c for c in self._hand(player_id).cards if c.value == "+2"
            ]
        top = self.discard[-1]
        # after drawing, the drawn card is the only one that may be played
        cards = [self.drawn] if self.drawn else self._hand(player_id).cards
        return [
            c for c in cards if is_playable(c, self.active_color, top)
        ]

    def set_connected(self, player_id: str, connected: bool) -> None:
        """Mark a seat as connected or not.

        The realtime layer calls this on a disconnect and on a rejoin.
        The seat itself never leaves the game.
        """
        self._hand(player_id).connected = connected
        self.seq += 1

    def timeout_skip(self, player_id: str) -> None:
        """Close an idle player's turn after the room's clock runs out.

        The realtime layer calls this when the player on turn let the
        time limit pass. A pending +4 or +2 pile is settled on this
        hand first, sleeping through a penalty is accepting it. Either
        way the state records the timeout so everyone sees why the turn
        jumped.

        Args:
            player_id: The player whose time ran out.
        """
        self.last = LastAction(player=player_id, kind="timeout")
        self.seq += 1
        if self.phase == "playing" and self.hands[self.turn].id == player_id:
            self.drawn = None
            hand = self.hands[self.turn]
            # an early uno call only holds for the play that follows it
            if len(hand.cards) == 2:
                hand.said_uno = False
            if self.plus4:
                # the cards land on the sleeper, never on the next player
                plus4, self.plus4 = self.plus4, None
                eaten = effect_of(self.discard[-1]).draw
                self._deal(self.hands[self.turn], eaten)
                self.last.count = eaten
                self._finish_or_step(plus4.by)
                return
            if self.stack:
                owed, self.stack = self.stack, 0
                self._deal(self.hands[self.turn], owed)
                self.last.count = owed
            self._step(1)

    def _rotate(self) -> None:
        """Move every hand one seat in the direction of play."""
        n = len(self.hands)
        cards = [h.cards for h in self.hands]
        for i, h in enumerate(self.hands):
            h.cards = cards[(i - self.direction) % n]
            # hand sizes changed, earlier uno calls no longer stand
            h.said_uno = False

    def _require_turn(self, player_id: str) -> None:
        """Refuse the move unless it is this player's turn in a live game."""
        if self.phase != "playing":
            raise GameError(ErrorCode.GAME_NOT_STARTED, "no game running")
        if self.hands[self.turn].id != player_id:
            raise GameError(ErrorCode.NOT_YOUR_TURN, "wait for your turn")

    def _hand(self, player_id: str) -> Hand:
        """Return the hand with this id, or raise if there is none."""
        for h in self.hands:
            if h.id == player_id:
                return h
        raise GameError(ErrorCode.INVALID_MESSAGE, "no such player")

    def _finish_or_step(self, plus4_by: str) -> None:
        """End the game if the +4 was its player's last card, else move on.

        The win was withheld while the +4 waited for an answer. It is
        granted here, once the penalty went to the victim.
        """
        if not self._hand(plus4_by).cards:
            self.phase = "finished"
            self.winner = plus4_by
            return
        self._step(1)

    def _deal(self, hand: Hand, n: int) -> None:
        """Move n cards from the deck to the hand, reshuffling if needed."""
        # back above one card, so an earlier uno call no longer stands
        hand.said_uno = False
        for _ in range(n):
            if not self.deck:
                self._reshuffle()
            if self.deck:
                hand.cards.append(self.deck.pop())

    def _reshuffle(self) -> None:
        """Put the discard pile back into the deck, minus its top card."""
        if len(self.discard) <= 1:
            return
        top = self.discard.pop()
        self.rng.shuffle(self.discard)
        self.deck = self.discard
        self.discard = [top]

    def _step(self, times: int) -> None:
        """Advance the turn by that many seats in the current direction."""
        self.turn = (self.turn + self.direction * times) % len(self.hands)

    def _apply_effect(self, effect: CardEffect) -> None:
        """Apply a card's turn effect: reverse, next-draws, and/or skip."""
        if effect.reverse and len(self.hands) > 2:
            self.direction = -1 if self.direction == 1 else 1
        victim = (self.turn + self.direction) % len(self.hands)
        if effect.draw:
            self._deal(self.hands[victim], effect.draw)
        # with two players a reverse just skips, like the rules say
        two_player_reverse = effect.reverse and len(self.hands) == 2
        self._step(2 if effect.skip or two_player_reverse else 1)
