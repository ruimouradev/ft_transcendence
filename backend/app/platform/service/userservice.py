import logging
from typing import Any
from sqlmodel import Session, select
from app.models.all import OAuthAccount, OAuthAccountCreate, OAuthAccountRead, ProviderType, User, UserCreate, UserUpdate, get_datetime_utc
from app.platform.security import get_password_hash, verify_password

logger = logging.getLogger("uvicorn.error")

def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data.pop("password")
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

def get_user_by_id(*, session: Session, user_id: str) -> User | None:
    statement = select(User).where(User.id == user_id)
    session_user = session.exec(statement).first()
    return session_user

def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user

def get_user_by_nick_name(*, session: Session, nick_name: str) -> User | None:
    statement = select(User).where(User.nick_name == nick_name)
    session_user = session.exec(statement).first()
    return session_user

def get_oauth_account_by_provider_and_user_id(*, session: Session, provider: ProviderType, user_id: str) -> OAuthAccount | None:
    statement = select(OAuthAccount).where(OAuthAccount.provider == provider, OAuthAccount.user_id == user_id)
    oauth_account = session.exec(statement).first()
    return oauth_account

def get_oauth_account_by_provider_and_provider_user_id(*, session: Session, provider: ProviderType, provider_user_id: str) -> OAuthAccount | None:
    statement = select(OAuthAccount).where(OAuthAccount.provider == provider, OAuthAccount.provider_user_id == provider_user_id)
    oauth_account = session.exec(statement).first()
    return oauth_account

def update_oauth_api_key(*, session: Session, db_oauth_account: OAuthAccount, api_key: str) -> OAuthAccount:
    db_oauth_account.sqlmodel_update({"access_token": api_key,"created_at": get_datetime_utc()})
    session.add(db_oauth_account)
    session.commit()
    session.refresh(db_oauth_account)
    return db_oauth_account

def create_oauth_account(*, session: Session, oauth_account_create: OAuthAccountCreate) -> OAuthAccount:
    db_obj = OAuthAccount.model_validate(oauth_account_create)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj

def get_robot_user_list(*, session: Session) -> list[User]:
    statement = select(User).where(User.is_active == False , User.email.like("iamrobot%")).order_by(User.email)
    robot_users = session.exec(statement).all()
    return robot_users

def authenticate_user(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if db_user is None:
        verify_password(password, "$argon2id$v=19$m=65536,t=3,p=4$NVsSTp6CMmyqltNGT35QZw$Q5BBgx1XsZMjBEEqEuzkfkg1nnj/M8U82gn9u0rkdqo")
        return None
    verified, updated_password_hash = verify_password(password, db_user.hashed_password)
    if not verified:
        return None
    if updated_password_hash:
        db_user.hashed_password = updated_password_hash
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
    return db_user