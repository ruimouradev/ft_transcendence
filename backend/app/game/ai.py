import random
from app.game.contract import (
    Card, Color, GameState, PlayerAction,
    Play, Draw, Catch, Challenge, SayUno
)

NON_WILD_COLORS: list[Color] = ["red", "yellow", "green", "blue"]

def decide_bot_action(state: GameState, bot_id: str) -> PlayerAction | None:
    """
    Evaluates the GameState and returns a valid PlayerAction.
    """
    # Identify bot's assigned difficulty level
    me = next((p for p in state.players if p.id == bot_id), None)
    difficulty = me.bot_level if me and me.bot_level else "medium"

    # 1. Catch Opportunism
    catch_action = _check_catch_opportunity(state, bot_id, difficulty)
    if catch_action:
        return catch_action

    # 2. Handle Wild +4 Challenge 
    if state.plus4_by and state.turn == bot_id:
        return _handle_plus4_challenge(difficulty)

    # 3. Post-Draw Phase (Pass is removed; force play if playable to avoid timeout)
    if state.you.drawn:
        if state.you.drawn in state.you.playable:
            drawn_card = next((c for c in state.you.hand if c.id == state.you.drawn), None)
            if drawn_card:
                return _build_play_action(drawn_card, state, bot_id, difficulty)
        return None 

    # 4. Normal Turn
    if state.turn != bot_id:
        return None

    playable_ids = set(state.you.playable)
    playable_cards = [c for c in state.you.hand if c.id in playable_ids]

    if not playable_cards:
        return Draw()

    chosen_card = _select_card_by_difficulty(playable_cards, state, bot_id, difficulty)
    return _build_play_action(chosen_card, state, bot_id, difficulty)


# ------------------ Strategy Helpers ------------------ #

def _check_catch_opportunity(state: GameState, bot_id: str, difficulty: str) -> Catch | None:
    catch_prob = {"easy": 0.2, "medium": 0.6, "hard": 0.95}.get(difficulty, 0.6)
    if random.random() > catch_prob:
        return None

    for p in state.players:
        if p.id != bot_id and p.cards == 1 and not p.uno:
            return Catch(target=p.id)
    return None

def _handle_plus4_challenge(difficulty: str) -> PlayerAction:
    if difficulty == "hard" and random.random() < 0.4:
        return Challenge()
    if difficulty == "medium" and random.random() < 0.2:
        return Challenge()
    return Draw()

def _select_card_by_difficulty(cards: list[Card], state: GameState, bot_id: str, difficulty: str) -> Card:
    if difficulty == "easy":
        return random.choice(cards)

    if difficulty == "hard":
        # Check next player in rotation
        p_ids = [p.id for p in state.players]
        idx = p_ids.index(bot_id)
        next_p = state.players[(idx + state.direction) % len(p_ids)]
        
        if next_p.cards <= 2:
            attacks = [c for c in cards if c.value in ["+2", "skip", "reverse", "+4"]]
            if attacks:
                return random.choice(attacks)
                
        if state.settings and state.settings.seven_zero:
            sevens = [c for c in cards if c.value == "7"]
            if sevens and any(p.cards < len(state.you.hand) for p in state.players if p.id != bot_id):
                return sevens[0]

    numbers = [c for c in cards if c.value.isdigit()]
    return random.choice(numbers) if numbers else random.choice(cards)

def _build_play_action(card: Card, state: GameState, bot_id: str, difficulty: str) -> Play:
    will_have_one_card = (len(state.you.hand) - 1 == 1)
    uno_call = will_have_one_card
    
    if difficulty == "easy" and will_have_one_card and random.random() < 0.3:
        uno_call = False

    chosen_color: Color | None = None
    if card.color == "wild" or card.value in ["wild", "+4"]:
        colors = [c.color for c in state.you.hand if c.color in NON_WILD_COLORS]
        chosen_color = max(set(colors), key=colors.count) if colors else "red"

    target_player: str | None = None
    if state.settings and state.settings.seven_zero and card.value == "7":
        opponents = [p for p in state.players if p.id != bot_id]
        if opponents:
            target_player = min(opponents, key=lambda p: p.cards).id

    return Play(
        card=card.id,
        color=chosen_color,
        uno=uno_call,
        target=target_player
    )