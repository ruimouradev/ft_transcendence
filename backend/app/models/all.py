from typing import Optional
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
    use2fa: bool = False


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
        sa_type=DateTime(timezone=True),
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

    oauth_accounts: list["OAuthAccount"] = Relationship(
        back_populates="user",
        cascade_delete=True
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
    t42 = "t42"
    local = "local"
    api_key = "api_key"

class OAuthAccountBase(SQLModel):
    provider: ProviderType
    provider_user_id: str
    provider_user_email: str | None = None

    user_id: UUID | None

class OAuthAccountRead(OAuthAccountBase):
    id: UUID
    created_at: datetime | None = None

class OAuthAccountCreate(OAuthAccountBase):
    access_token: str | None = None
    refresh_token: str | None = None

class OAuthAccount(OAuthAccountCreate, table=True):

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )

    user_id: UUID = Field(foreign_key="user.id",ondelete="CASCADE")
    user: Optional[User] = Relationship(back_populates="oauth_accounts")

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

    blocked_by_req: bool = Field(default=False)
    blocked_by_add: bool = Field(default=False)

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

class GamePlayer(SQLModel, table=True):

    game_id: UUID = Field(foreign_key="game.id", primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", primary_key=True)
    is_winner: bool = False
    score: int = 0
    
    seat: int
    remain_points: int = 0
    cards_left: int = 0
    is_connected: bool = True

class GamePlayerDetail(SQLModel):
    id: UUID
    name: str
    avatar: str | None = None
    is_winner: bool
    score: int
    seat: int
    remain_points: int
    cards_left: int
    is_connected: bool

class UserStatistic(SQLModel, table=True):

    user_id: UUID = Field(primary_key=True, foreign_key="user.id")

    total_games: int = 0

    wins: int = 0

    losses: int = 0

    total_score: int = 0

    updated_at: datetime = Field(default_factory=get_datetime_utc,sa_type=DateTime(timezone=True))

class UserStatisticLevel(SQLModel):
    current_level: int = 0
    total_xp: int = 0
    xp_in_current_level: int = 0
    xp_required_for_next_level: int = 0
    progress_percentage: float = 0
    total_xp_for_next_level: int = 0
    title: str = "Novice"

class UserStatisticInfo(SQLModel):
    user: UserPublic
    total_games: int = 0
    wins: int = 0
    losses: int = 0
    total_score: int = 0
    level_info: UserStatisticLevel = UserStatisticLevel()

class UserStatisticLeaderboardEntry(SQLModel):
    rank: int
    user_id: UUID
    full_name: str
    avatar: str | None = None
    level: int
    xp: int
    total_rounds: int
    total_wins: int
    total_losses: int
    win_rate: float

class UserGameDetail(SQLModel):
    game_id: UUID
    is_winner: bool
    score: int
    finished_at: datetime | None = None

class Friend(SQLModel):
    id: UUID
    name: str
    handle: str
    avatar: str | None = None
    status: FriendshipStatus | None = None
    mutual: int | None = None
    bio: str | None = None
    online: bool | None = None

class Friends(SQLModel):
    friends: list[Friend]
    count: int = 0

class Suggestions(SQLModel):
    suggestions: list[Friend]
    count: int = 0

class Requests(SQLModel):
    requests: list[Friend]
    count: int = 0

class APIKeyContext:
    user_id: UUID
    api_key: str