from sqlmodel import Session, select
from app.models.all import OAuthAccount, OAuthAccountCreate, ProviderType, User, UserCreate, UserUpdate, get_datetime_utc
from app.platform.security import get_password_hash, verify_password


def save_row(session: Session, row):
    # one commit and refresh for every write in this file
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def _first_user(session: Session, *conditions) -> User | None:
    return session.exec(select(User).where(*conditions)).first()


def create_user(*, session: Session, user_create: UserCreate) -> User:
    fields = user_create.model_dump(exclude={"password"})
    fields["hashed_password"] = get_password_hash(user_create.password)
    return save_row(session, User(**fields))


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> User:
    changes = user_in.model_dump(exclude_unset=True)
    # the plain password never reaches the row, only its hash does
    if (password := changes.pop("password", None)) is not None:
        changes["hashed_password"] = get_password_hash(password)
    for name, value in changes.items():
        setattr(db_user, name, value)
    return save_row(session, db_user)

def get_user_by_id(*, session: Session, user_id: str) -> User | None:
    return _first_user(session, User.id == user_id)

def get_user_by_email(*, session: Session, email: str) -> User | None:
    return _first_user(session, User.email == email)

def get_user_by_nick_name(*, session: Session, nick_name: str) -> User | None:
    return _first_user(session, User.nick_name == nick_name)

def get_oauth_account_by_provider_and_user_id(*, session: Session, provider: ProviderType, user_id: str) -> OAuthAccount | None:
    statement = select(OAuthAccount).where(OAuthAccount.provider == provider, OAuthAccount.user_id == user_id)
    oauth_account = session.exec(statement).first()
    return oauth_account

def get_oauth_account_by_provider_and_provider_user_id(*, session: Session, provider: ProviderType, provider_user_id: str) -> OAuthAccount | None:
    statement = select(OAuthAccount).where(OAuthAccount.provider == provider, OAuthAccount.provider_user_id == provider_user_id)
    oauth_account = session.exec(statement).first()
    return oauth_account

def update_oauth_api_key(*, session: Session, db_oauth_account: OAuthAccount, api_key: str) -> OAuthAccount:
    db_oauth_account.access_token = api_key
    db_oauth_account.created_at = get_datetime_utc()
    return save_row(session, db_oauth_account)

def create_oauth_account(*, session: Session, oauth_account_create: OAuthAccountCreate) -> OAuthAccount:
    return save_row(session, OAuthAccount.model_validate(oauth_account_create))

def get_robot_user_list(*, session: Session) -> list[User]:
    statement = select(User).where(User.is_active == False , User.email.like("iamrobot%")).order_by(User.email)
    robot_users = session.exec(statement).all()
    return robot_users

# a hash to check against when the email is unknown, so a wrong email
# takes as long as a wrong password and the two cannot be told apart
_UNKNOWN_USER_HASH = get_password_hash("unknown user")

def authenticate_user(*, session: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(session=session, email=email)
    verified, newer_hash = verify_password(
        password, user.hashed_password if user else _UNKNOWN_USER_HASH
    )
    if user is None or not verified:
        return None
    if newer_hash:
        # argon2 parameters moved on, the row is rehashed on this login
        user.hashed_password = newer_hash
        save_row(session, user)
    return user
