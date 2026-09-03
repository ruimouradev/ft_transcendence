from prometheus_client import Counter, Gauge

# Game metrics for the uno dashboard.
# Anything done in this file shows up there automatically.

rooms_active = Gauge(
    "uno_rooms_active", "Rooms currently open"
)
players_connected = Gauge(
    "uno_players_connected", "Players with a live socket"
)
games_finished = Counter(
    "uno_games_finished_total", "Games that reached a winner"
)
moves = Counter(
    "uno_moves_total", "Accepted moves", ["kind"]
)
challenges = Counter(
    "uno_challenges_total", "+4 challenges answered", ["outcome"]
)
# both outcomes exist from the start, so the panel shows zero and not No data
for outcome in ("caught", "wrong"):
    challenges.labels(outcome=outcome)
rejected = Counter(
    "uno_rejected_total", "Refused moves", ["code"]
)
