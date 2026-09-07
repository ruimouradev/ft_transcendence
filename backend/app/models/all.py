from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone

from sqlmodel import SQLModel, Field, Relationship
from pydantic import EmailStr, BaseModel, field_validator
from sqlalchemy import DateTime
from enum import Enum

def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)

def uuid_check(value: str,msg_str: str) -> UUID:
    try:
        return UUID(value)
    except ValueError:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg=msg_str)

def nickname_validator(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("Nickname cannot be empty or whitespace")
    if len(value) < 3 or len(value) > 12:
        raise ValueError("Nickname must be between 3 and 12 characters")
    if value.lower() in ["admin", "root", "system"]:
        raise ValueError("Nickname cannot be a reserved word")
    if value.lower().startswith("bot") and value not in ["Bot1", "Bot2", "Bot3"]:
        raise ValueError("Nickname cannot start with 'bot'")
    if "<" in value or ">" in value:
        raise ValueError("Nickname cannot contain HTML")
    return value

# The fields every user model carries
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = False
    is_superuser: bool = False
    nick_name: str = Field(unique=True, index=True, max_length=12)
    avatar: str | None = Field(default="/static/a00.jpeg", max_length=255)
    card_back: str | None = Field(default="back00", max_length=255)
    use2fa: bool = False

    @field_validator("nick_name")
    @classmethod
    def validate_nick_name(cls, value: str) -> str:
        value = nickname_validator(value)
        return value

# What the signup and the bots hand in to make an account
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=32)


class UserRegister(BaseModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=32)
    nick_name: str = Field(min_length=3, max_length=12)

# This class can not be used for a request body;
class UserUpdate(UserBase):
    nick_name: str | None = Field(default=None, min_length=3, max_length=12)
    email: EmailStr | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=32)
    two_factor_secret: str | None = Field(default=None, max_length=512)


class UserUpdateMe(BaseModel):
    nick_name: str | None = Field(default=None,min_length=3, max_length=12)
    card_back: str | None = Field(default=None, max_length=255)


class UpdatePassword(BaseModel):
    current_password: str = Field(min_length=8, max_length=32)
    new_password: str = Field(min_length=8, max_length=32)


class User(UserBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    hashed_password: str | None = Field(default=None, max_length=255)
    two_factor_secret: str | None = Field(default=None, max_length=512)

    created_at: datetime = Field( default_factory=get_datetime_utc, sa_type=DateTime(timezone=True))
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

    oauth_accounts: list["OAuthAccount"] = Relationship(back_populates="user", cascade_delete=True)

class UserPublic(UserBase):
    id: UUID
    created_at: datetime | None = None

class UserOnLineStatus(SQLModel):
    user_id: UUID
    online: str

class Message(BaseModel):
    status_code: int
    code: str | None = None
    message: str

class TokenPayload(BaseModel):
    sub: str | None = None
    type: str | None = None

class NewPassword(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=32)

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

    created_at: datetime = Field(default_factory=get_datetime_utc, sa_type=DateTime(timezone=True))

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

    created_at: datetime = Field(default_factory=get_datetime_utc,sa_type=DateTime(timezone=True))
    accepted_at: datetime | None = Field(default_factory=None,sa_type=DateTime(timezone=True))

class Game(SQLModel, table=True):

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    status: str = "waiting"  # waiting, in_progress, finished

    created_at: datetime = Field(default_factory=get_datetime_utc,sa_type=DateTime(timezone=True))

    finished_at: datetime | None = Field(default_factory=None,sa_type=DateTime(timezone=True))


class GamePlayer(SQLModel, table=True):

    game_id: UUID = Field(foreign_key="game.id", primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", primary_key=True)
    is_winner: bool = False
    score: int = 0    
    seat: int
    remain_points: int = 0
    cards_left: int = 0
    is_connected: bool = True

class GamePlayerDetail(BaseModel):
    id: UUID
    nick_name: str
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

class UserStatisticLevel(BaseModel):
    current_level: int = 0
    total_xp: int = 0
    xp_in_current_level: int = 0
    xp_required_for_next_level: int = 0
    progress_percentage: float = 0
    total_xp_for_next_level: int = 0
    title: str = "Rookie"

class UserStatisticInfo(BaseModel):
    user: UserPublic
    total_games: int = 0
    wins: int = 0
    losses: int = 0
    total_score: int = 0
    level_info: UserStatisticLevel = Field(default_factory=UserStatisticLevel)

class UserStatisticLeaderboardEntry(BaseModel):
    rank: int
    user_id: UUID
    nick_name: str
    avatar: str | None = None
    level: int
    xp: int
    total_rounds: int
    total_wins: int
    total_losses: int
    win_rate: float

class UserGameDetail(BaseModel):
    game_id: UUID
    is_winner: bool
    score: int
    opponents: str
    finished_at: datetime | None = None

class Friend(BaseModel):
    id: UUID
    nick_name: str
    handle: str
    avatar: str | None = None
    status: FriendshipStatus | None = None
    mutual: int | None = None
    level: int | None = None
    title: str | None = None
    bio: str | None = None
    online: bool | None = None

class Friends(BaseModel):
    friends: list[Friend]
    count: int = 0

class Suggestions(BaseModel):
    suggestions: list[Friend]
    count: int = 0

class Requests(BaseModel):
    requests: list[Friend]
    count: int = 0

class APIKeyContext(BaseModel):
    client_id: UUID
    api_key: str

class APIKeyStatus(BaseModel):
    has_api_key: bool
    client_id: str | None = None

class EmailVerificationType(str, Enum):
    ACCOUNT_ACTIVATION = "account_activation"
    PASSWORD_RESET = "password_reset"

class LoginTokenType(str, Enum):
    ACCESS = "access"
    REFRESH = "refresh"
    TFA = "2fa"

class APIErrorCode(str, Enum):
    #common operation errors
    INVALID_OPERATION = "INVALID_OPERATION"
    BAD_REQUEST = "BAD_REQUEST"

    # business logic errors
    FRIEND_REQUEST_NOT_FOUND = "FRIEND_REQUEST_NOT_FOUND"
    GAME_ALREADY_EXISTS = "GAME_ALREADY_EXISTS"
    INVALID_INPUT = "INVALID_INPUT"
    
    #authentication and authorization errors
    UNAUTHORIZED = "UNAUTHORIZED"
    USER_NOT_FOUND = "USER_NOT_FOUND"
    INVALID_TOKEN = "INVALID_TOKEN"
    INACTIVE_USER = "INACTIVE_USER"

    # api key errors
    API_KEY_MISSING = "API_KEY_MISSING"
    INVALID_API_KEY = "INVALID_API_KEY"
    APIKEY_NOT_EXIST = "APIKEY_NOT_EXIST"

    # permission errors
    REQUEST_NOT_FOUND = "REQUEST_NOT_FOUND"
    FORBIDDEN = "FORBIDDEN"

class APIError(Exception):
    def __init__(self, *, status_code: int, code: APIErrorCode, msg: str, details: dict | None = None):
        super().__init__(msg)

        self.status_code = status_code
        self.code = code
        self.message = msg
        self.details = details

class ErrorResponse(BaseModel):
    code: APIErrorCode
    message: str
    details: dict | None = None

class TwoFactorSetupRequest(BaseModel):
    password: str = Field(min_length=8, max_length=32)
    recovery_code: str | None = None

class TwoFactorSetupResponse(BaseModel):
    otpauth_url: str
    secret: str

class TwoFactorVerifyRequest(BaseModel):
    code: str = Field(min_length=6, max_length=6)

class TwoFADisableRequest(BaseModel):
    code: str = Field(min_length=6, max_length=6)
    password: str = Field(min_length=8, max_length=32)

class TwoFactorVerifyResponse(BaseModel):
    recovery_codes: list[str] | None = None

class RecoveryCode(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    code_hash: str
    used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=get_datetime_utc, sa_type=DateTime(timezone=True))
    used_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))