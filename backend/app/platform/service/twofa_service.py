import secrets

import jwt

from pydantic import ValidationError
from app.platform import security
from app.platform.service import userservice
from sqlmodel import delete, select, Session

from app.models.all import APIError, APIErrorCode, RecoveryCode, TokenPayload, User, get_datetime_utc, LoginTokenType
from app.platform.config import settings
import pyotp


def generate_secret() -> str:
    """
    Generate a random secret key for two-factor authentication.
    """
    return pyotp.random_base32()

def get_otpauth_url(secret: str, username: str, issuer_name: str = settings.PROJECT_NAME) -> str:
    """
    Generate the otpauth URL for two-factor authentication.
    """
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=username, issuer_name=issuer_name)

def verify_totp(secret: str, code: str) -> bool:
    """
    Verify the provided TOTP code against the secret key.
    """
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)

def store_secret(session, user, secret: str):
    """
    Store the secret key for the user in the database.
    """
    user.two_factor_secret = secret
    session.add(user)
    session.commit()

def generate_recovery_codes(session, user, num_codes: int = 8) -> list[str]:
    """
    Generate a list of recovery codes for the user.
    """
    recovery_codes = [secrets.token_hex(10).upper() for _ in range(num_codes)]
    statement = delete(RecoveryCode).where(RecoveryCode.user_id == user.id)
    session.exec(statement)

    for code in recovery_codes:
        recovery_code = RecoveryCode(user_id=user.id, code_hash=security.get_password_hash(code))
        session.add(recovery_code)
    session.commit()
    return recovery_codes

def check_recovery_code(session, user, recovery_code: str) -> bool:
    """
    Check if the provided recovery code is valid for the user.
    """
    statement = select(RecoveryCode).where(RecoveryCode.user_id == user.id, RecoveryCode.used == False)
    recovery_codes = session.exec(statement).all()

    for code in recovery_codes:
        verified, _ = security.verify_password(recovery_code, code.code_hash)
        if verified:
            code.used = True
            code.used_at = get_datetime_utc()
            session.add(code)
            session.commit()
            return True
    return False


def get_user_from_tfa_token(session: Session, token: str) -> User:
    """
    Get the user associated with the provided two-factor authentication token.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        token_data = TokenPayload(**payload)
    except (jwt.InvalidTokenError, ValidationError):
        raise APIError(status_code=403, code=APIErrorCode.INVALID_TOKEN, msg="Could not validate credentials.")
    
    if token_data.type != LoginTokenType.TFA.value:
        raise APIError(status_code=403, code=APIErrorCode.INVALID_TOKEN, msg="Invalid token type.")

    current_user = userservice.get_user_by_id(session=session, user_id=token_data.sub)
    if current_user is None:
        raise APIError(status_code=404, code=APIErrorCode.NOT_FOUND, msg="User not found.")
    
    return current_user

def check_user_password(user: User, password: str) -> bool:
    """
    Check if the provided password matches the user's password.
    """
    verified, _ = userservice.verify_password(password, user.hashed_password)
    return verified
