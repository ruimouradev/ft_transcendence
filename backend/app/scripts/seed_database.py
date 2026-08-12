import random
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from faker import Faker
from sqlmodel import Session, select

from app.models.all import User, Game, GamePlayer, UserStatistic
from app.models.database import engine
from app.platform.security import get_password_hash


fake = Faker()


NUM_USERS = 100
NUM_GAMES = 100

MIN_PLAYERS = 2
MAX_PLAYERS = 4


def create_users(session: Session) -> list[User]:
    users = []

    for i in range(NUM_USERS):
        user = User(
            id=uuid4(),
            # full_name=f"user_{i + 1}",
            email=f"user_{i + 1}@example.com",
            full_name=fake.name(),
            avatar="/static/a00.jpeg",
            is_active=True,
            is_verified=True,
            hashed_password=get_password_hash("11111111"),
        )

        session.add(user)
        users.append(user)

    session.flush()

    return users


def create_games(
    session: Session,
    users: list[User],
) -> list[Game]:

    games = []

    for _ in range(NUM_GAMES):
        # Select 2–4 different players
        players = random.sample(
            users,
            random.randint(MIN_PLAYERS, MAX_PLAYERS),
        )

        # Generate a finished game
        created_at = datetime.now(timezone.utc) - timedelta(
            days=random.randint(0, 90),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
        )

        finished_at = created_at + timedelta(
            minutes=random.randint(5, 30)
        )

        # Randomly select the winner
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

        # Randomize player order
        shuffled_players = players.copy()
        random.shuffle(shuffled_players)

        # Create rankings
        for rank, user in enumerate(shuffled_players, start=1):

            is_winner = user.id == winner.id

            player = GamePlayer(
                game_id=game.id,
                user_id=user.id,
                is_winner=is_winner,
                seat=rank - 1,
                score=winner_score if is_winner else 0,
                remain_points=0 if is_winner else random.randint(10, 100),
                cards_left=0 if is_winner else random.randint(1, 10),
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
    with Session(engine) as session:

        # Create users
        users = create_users(session)

        # Create games and game players
        games = create_games(session, users)

        # Create user statistics
        create_statistics(session, users)

        session.commit()

        print(f"Created {len(users)} users")
        print(f"Created {len(games)} games")
        print("Created game players and user statistics")


if __name__ == "__main__":
    seed_database()