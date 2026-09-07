"""Demo data for a local stack, never for a real database.

    docker compose exec backend python -m app.scripts.seed_friends
    docker compose exec backend python -m app.scripts.seed_friends --delete

Accounts live on @ex.pt and --delete never touches anything else.
"""

import random
import sys
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlmodel import Session, select, delete, or_

from app.models.all import (
    User,
    Game,
    GamePlayer,
    UserStatistic,
    Friendship,
    FriendshipStatus,
)
from app.models.database import engine
from app.platform.security import get_password_hash


DOMAIN = "@ex.pt"


NUM_USERS = 200
NUM_GAMES = 100

MIN_PLAYERS = 2
MAX_PLAYERS = 4


def create_users(session: Session) -> list[User]:
    """Create the accounts, all active and sharing the same password."""
    users = []

    for i in range(NUM_USERS):
        user = User(
            id=uuid4(),
            email=f"user_{i + 1}{DOMAIN}",

            # unique and within the twelve characters a nick allows
            nick_name=f"player{i + 1}",

            avatar="/static/a00.jpeg",
            is_active=True,
            hashed_password=get_password_hash("11111111"),
        )

        session.add(user)
        users.append(user)

    session.flush()

    return users


def create_friendships(
    session: Session,
    users: list[User],
) -> int:
    """Link every account to its neighbours, accepted and pending."""
    friendships_created = 0
    total_users = len(users)

    # each account befriends the next twelve, and a friendship counts
    # for both sides, so everyone ends up with twenty four
    accepted_pairs = set()

    for i, user in enumerate(users):
        for offset in range(1, 13):
            friend = users[(i + offset) % total_users]

            pair = frozenset((user.id, friend.id))

            if pair in accepted_pairs:
                continue

            friendship = Friendship(
                requester_id=user.id,
                addressee_id=friend.id,
                status=FriendshipStatus.ACCEPTED,
            )

            session.add(friendship)
            accepted_pairs.add(pair)
            friendships_created += 1

    # requests go further around the circle, out of reach of the
    # friendships above, so nobody has the same pair twice
    for i, user in enumerate(users):
        for offset in range(20, 40):
            addressee = users[(i + offset) % total_users]

            friendship = Friendship(
                requester_id=user.id,
                addressee_id=addressee.id,
                status=FriendshipStatus.PENDING,
            )

            session.add(friendship)
            friendships_created += 1

    session.flush()

    return friendships_created


def create_games(
    session: Session,
    users: list[User],
) -> list[Game]:
    """Write finished games with a random winner and a random table."""
    games = []

    for _ in range(NUM_GAMES):

        # a table of two to four, nobody sitting twice
        players = random.sample(
            users,
            random.randint(MIN_PLAYERS, MAX_PLAYERS),
        )

        # somewhere in the last three months
        created_at = datetime.now(timezone.utc) - timedelta(
            days=random.randint(0, 90),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
        )

        finished_at = created_at + timedelta(
            minutes=random.randint(5, 30)
        )

        winner = random.choice(players)

        winner_score = random.randint(100, 500)

        game = Game(
            id=uuid4(),
            status="finished",
            created_at=created_at,
            finished_at=finished_at,
        )

        session.add(game)
        session.flush()

        # the seats come out in any order
        shuffled_players = players.copy()
        random.shuffle(shuffled_players)

        for rank, user in enumerate(shuffled_players, start=1):

            is_winner = user.id == winner.id

            player = GamePlayer(
                game_id=game.id,
                user_id=user.id,
                is_winner=is_winner,
                seat=rank - 1,
                score=winner_score if is_winner else 0,
                remain_points=(
                    0
                    if is_winner
                    else random.randint(10, 100)
                ),
                cards_left=(
                    0
                    if is_winner
                    else random.randint(1, 10)
                ),
                is_connected=True,
            )

            session.add(player)

        games.append(game)

    session.flush()

    return games


def create_statistics(
    session: Session,
    users: list[User],
):
    """Add up each account's games into the row the leaderboards read."""
    for user in users:

        game_players = session.exec(
            select(GamePlayer)
            .where(GamePlayer.user_id == user.id)
        ).all()

        total_games = len(game_players)

        wins = sum(
            1
            for player in game_players
            if player.is_winner
        )

        losses = total_games - wins

        total_score = sum(
            player.score
            for player in game_players
        )

        statistic = UserStatistic(
            user_id=user.id,
            total_games=total_games,
            wins=wins,
            losses=losses,
            total_score=total_score,
        )

        session.add(statistic)


def seed_database():
    """Fill an empty stack with accounts, friendships, games and totals."""
    with Session(engine) as session:
        already = session.exec(
            select(User).where(User.email.like("%" + DOMAIN))
        ).first()

        if already:
            print("The demo accounts are already there, "
                  "run it with --delete first")
            return


        users = create_users(session)
        friendships = create_friendships(session, users)
        games = create_games(session, users)
        create_statistics(session, users)

        session.commit()

        print(f"Created {len(users)} users")
        print(f"Created {friendships} friendships")
        print(f"Created {len(games)} games")
        print("Created game players and user statistics")


def delete_seed():
    """Remove every account of this seed and everything it touched."""
    with Session(engine) as session:
        users = session.exec(
            select(User).where(User.email.like("%" + DOMAIN))
        ).all()

        ids = [user.id for user in users]
        games_seen = set()

        for user_id in ids:
            session.exec(
                delete(Friendship).where(
                    or_(
                        Friendship.requester_id == user_id,
                        Friendship.addressee_id == user_id,
                    )
                )
            )

            rows = session.exec(
                select(GamePlayer).where(GamePlayer.user_id == user_id)
            ).all()

            for row in rows:
                games_seen.add(row.game_id)

            session.exec(
                delete(GamePlayer).where(GamePlayer.user_id == user_id)
            )

            statistic = session.get(UserStatistic, user_id)
            if statistic:
                session.delete(statistic)

        session.commit()

        removed_games = 0
        for game_id in games_seen:
            left = session.exec(
                select(GamePlayer).where(GamePlayer.game_id == game_id)
            ).first()
            if left:
                continue  # someone outside the seed also played it
            game = session.get(Game, game_id)
            if game:
                session.delete(game)
                removed_games += 1

        for user in users:
            session.delete(user)

        session.commit()

        print(f"Deleted {len(users)} users")
        print(f"Deleted {removed_games} games with their players")
        print("Deleted their friendships and statistics")


if __name__ == "__main__":
    if "--delete" in sys.argv:
        delete_seed()
    else:
        seed_database()
