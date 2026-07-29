from uuid import UUID, uuid4
from datetime import datetime, timezone

from sqlmodel import SQLModel, Field, Relationship
from pydantic import EmailStr
from sqlalchemy import DateTime
from enum import Enum

def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)

# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = False
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    avatar: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore[assignment]
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    hashed_password: str | None = Field(default=None, max_length=255)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    # items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    sent_requests: list["Friendship"] = Relationship(
        sa_relationship_kwargs={
            "foreign_keys": "[Friendship.requester_id]"
        }
    )

    received_requests: list["Friendship"] = Relationship(
        sa_relationship_kwargs={
            "foreign_keys": "[Friendship.addressee_id]"
        }
    )

# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str



# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"

class TokenAndUser(Token):
    user: UserPublic


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)

class ProviderType(str, Enum):
    t42 = "42"
    local = "local"

class OAuthAccount(SQLModel, table=True):

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    provider: ProviderType
    provider_user_id: str
    provider_user_email: str | None = None

    access_token: str | None = None
    refresh_token: str | None = None

    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )

    user_id: UUID = Field(foreign_key="user.id")

class FriendshipStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    BLOCKED = "blocked"

class Friendship(SQLModel, table=True):
    __tablename__ = "friendships"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    requester_id: UUID = Field(foreign_key="user.id")
    addressee_id: UUID = Field(foreign_key="user.id")

    status: FriendshipStatus

    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )
    accepted_at: datetime | None = None

class Game(SQLModel, table=True):

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    status: str

    created_at: datetime = Field(default_factory=get_datetime_utc,sa_type=DateTime(timezone=True))

    finished_at: datetime | None = None

    winner_id: UUID | None = Field(default=None, foreign_key="user.id")
    winner_score: int | None = None

class GamePlayer(SQLModel, table=True):

    game_id: UUID = Field(foreign_key="game.id", primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", primary_key=True)
    is_winner: bool = False
    
    seat: int
    rank: int | None = None
    remain_points: int = 0
    cards_left: int = 0
    is_connected: bool = True

class UserStatistic(SQLModel, table=True):

    user_id: UUID = Field(primary_key=True, foreign_key="user.id")

    total_games: int = 0

    wins: int = 0

    losses: int = 0

    total_score: int = 0

    updated_at: datetime = Field(default_factory=get_datetime_utc,sa_type=DateTime(timezone=True))