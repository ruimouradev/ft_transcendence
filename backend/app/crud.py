from sqlmodel import Session, select

from app.platform.security import get_password_hash, verify_password
from app.models.all import User, UserCreate, UserUpdate
from app.platform.service.userservice import get_user_by_email

# Dummy hash to use for timing attack prevention when user is not found
# This is an Argon2 hash of a random password, used to ensure constant-time comparison
DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$NVsSTp6CMmyqltNGT35QZw$Q5BBgx1XsZMjBEEqEuzkfkg1nnj/M8U82gn9u0rkdqo"

def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        # Prevent timing attacks by running password verification even when user doesn't exist
        # This ensures the response time is similar whether or not the email exists
        verify_password(password, DUMMY_HASH)
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

