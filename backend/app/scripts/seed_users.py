"""Test data for local development, never for the real database.

Run it inside the backend container:

    docker compose exec backend python seed_users.py           creates it
    docker compose exec backend python seed_users.py --delete  removes it

Creates four active accounts (ana, joana, vinicius and maria, all
@teste.pt, password Teste123!), a few friendships in both states so
the Friends screen has content, and six finished games recorded
through the platform's own save_game_result, so statistics, level and
leaderboard come out exactly as real play would leave them. Two games
have bot seats at the table. With --delete everything they touched is
removed: friendships, game rows, games and statistics. Accounts
outside @teste.pt are never touched.
"""

import sys
from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select, or_

from app.models.all import (
    Friendship, FriendshipStatus, Game, GamePlayer, User, UserStatistic,
)
from app.models.database import engine
from app.platform.security import get_password_hash
from app.platform.service.userStatisticService import save_game_result
from app.robots_manager import robots_user_manager

# email local part -> nick name shown on the site
NAMES = {"ana": "ana", "joana": "joana", "vinicius": "Vinicius",
         "maria": "Maria João do Porto"}
DOMAIN = "@test.pt"
PASSWORD = "11111111"

# who played, who won, and how many points each loser held at the end;
# days is how long ago the game finished. Winner score is the sum of
# the losers' points, the official rule
GAMES = [
    {"days": 4, "winner": "ana", "losers": {"joana": 31}},
    {"days": 3, "winner": "vinicius", "losers": {"ana": 18, "maria": 44}},
    {"days": 2, "winner": "joana", "losers": {"vinicius": 27}},
    {"days": 2, "winner": "ana", "losers": {"maria": 15, "bot1": 52}},
    {"days": 1, "winner": "ana",
     "losers": {"joana": 9, "vinicius": 33, "maria": 21}},
    {"days": 1, "winner": "maria", "losers": {"bot1": 40, "bot2": 12}},
]

FRIENDSHIPS = [
    ("ana", "joana", FriendshipStatus.ACCEPTED),
    ("vinicius", "maria", FriendshipStatus.ACCEPTED),
    ("ana", "vinicius", FriendshipStatus.ACCEPTED),
    ("joana", "maria", FriendshipStatus.PENDING),
]


def robots(session: Session) -> dict[str, User]:
    found = session.exec(select(User).where(
        User.email.like("iamrobot%"))).all()
    return {f"bot{i}": u for i, u in enumerate(sorted(
        found, key=lambda u: u.email), start=1)}


def create(session: Session) -> None:
    users: dict[str, User] = {}
    added = 0
    for name, nick in NAMES.items():
        email = name + DOMAIN
        user = session.exec(select(User).where(User.email == email)).first()
        if user is None:
            user = User(email=email, nick_name=nick, is_active=True,
                        is_superuser=False,
                        hashed_password=get_password_hash(PASSWORD))
            session.add(user)
            added += 1
        users[name] = user
    session.commit()
    for user in users.values():
        session.refresh(user)

    friends = 0
    for a, b, status in FRIENDSHIPS:
        exists = session.exec(select(Friendship).where(or_(
            (Friendship.requester_id == users[a].id)
            & (Friendship.addressee_id == users[b].id),
            (Friendship.requester_id == users[b].id)
            & (Friendship.addressee_id == users[a].id)))).first()
        if exists:
            continue
        session.add(Friendship(requester_id=users[a].id,
                               addressee_id=users[b].id, status=status))
        friends += 1
    session.commit()

    ids = [u.id for u in users.values()]
    played = session.exec(select(GamePlayer).where(
        GamePlayer.user_id.in_(ids))).first()
    if played:
        print(f"{added} accounts created, {friends} friendships added, "
              "games already there, none added")
        return

    bots = robots(session)
    everyone = {**users, **bots}
    # the statistics skip for bot seats only works with the robot list
    # loaded, which normally happens at application startup
    robots_user_manager.set_robots(list(bots.values()))

    for spec in GAMES:
        finished = (datetime.now(timezone.utc)
                    - timedelta(days=spec["days"], hours=2))
        game = Game(status="finished",
                    created_at=finished - timedelta(minutes=9),
                    finished_at=finished)
        score = sum(spec["losers"].values())
        players = [GamePlayer(user_id=everyone[spec["winner"]].id, seat=0,
                              is_winner=True, score=score, remain_points=0,
                              cards_left=0, is_connected=True)]
        for seat, (name, remain) in enumerate(spec["losers"].items(),
                                              start=1):
            players.append(GamePlayer(
                user_id=everyone[name].id, seat=seat, is_winner=False,
                score=0, remain_points=remain,
                cards_left=1 + remain % 5, is_connected=True))
        save_game_result(session=session, game=game, game_players=players)

    print(f"{added} accounts created, {friends} friendships added, "
          f"{len(GAMES)} games recorded, password for all accounts: "
          f"{PASSWORD}")


def delete(session: Session) -> None:
    accounts = session.exec(select(User).where(
        User.email.like("%" + DOMAIN))).all()
    ids = [u.id for u in accounts]
    robot_ids = [u.id for u in robots(session).values()]

    friendships = session.exec(select(Friendship).where(or_(
        Friendship.requester_id.in_(ids),
        Friendship.addressee_id.in_(ids)))).all()
    for f in friendships:
        session.delete(f)

    rows = session.exec(select(GamePlayer).where(
        GamePlayer.user_id.in_(ids))).all()
    games = {row.game_id for row in rows}
    for row in rows:
        session.delete(row)
    # a game left with no human rows outside the test accounts is
    # noise: its remaining bot rows go with it
    for gid in games:
        others = session.exec(select(GamePlayer).where(
            GamePlayer.game_id == gid,
            GamePlayer.user_id.not_in(ids))).all()
        humans = [o for o in others if o.user_id not in robot_ids]
        if humans:
            continue
        for o in others:
            session.delete(o)
        game = session.get(Game, gid)
        if game:
            session.delete(game)

    stats = session.exec(select(UserStatistic).where(
        UserStatistic.user_id.in_(ids))).all()
    for st in stats:
        session.delete(st)

    for u in accounts:
        session.delete(u)
    session.commit()
    print(f"deleted {len(accounts)} accounts, {len(friendships)} "
          f"friendships, {len(rows)} game rows, {len(stats)} statistics")


if __name__ == "__main__":
    with Session(engine) as session:
        if "--delete" in sys.argv:
            delete(session)
        else:
            create(session)
