from datetime import datetime, timedelta, timezone
import secrets
import string
from typing import Any
import redis.asyncio as redis
from app.platform.config import settings

import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher
from app.models.all import LoginTokenType, APIError, APIErrorCode, EmailVerificationType

# argon2 for every new hash, bcrypt still accepted for the old ones
password_hash = PasswordHash((Argon2Hasher(), BcryptHasher()))

ALGORITHM = "HS256"

redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

def generate_password(length: int = 16) -> str:
    characters = string.ascii_letters + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

def create_access_token(subject: str | Any, expires_delta: timedelta) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = {"exp": expire, "sub": str(subject), "type": LoginTokenType.ACCESS.value}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_temporary_access_token(subject: str | Any, expires_delta: timedelta) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = {"exp": expire, "sub": str(subject), "type": LoginTokenType.TFA.value}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_password_hash(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> tuple[bool, str | None]:
    # the second value is a fresh hash when the stored one uses older
    # parameters, the caller stores it
    return password_hash.verify_and_update(plain_password, hashed_password)

async def consume_verification_token(token: str, verifyType: EmailVerificationType) -> None:
    """Verify the token and return the email if valid, otherwise raise APIError."""
    key = f"used:password_reset:{token}" if verifyType == EmailVerificationType.PASSWORD_RESET else f"used:account_activation:{token}"
    expire = get_verify_token_expiration_time(token)
    remaining_time = expire - datetime.now(timezone.utc)
    remaining_seconds = int(remaining_time.total_seconds())
    if remaining_seconds <= 0:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Verification link has expired. Please request a new one.")
    try:
        created = await redis_client.set(key, "true", ex=remaining_seconds, nx=True)
    except redis.RedisError:
        raise APIError(status_code=503, code=APIErrorCode.BAD_REQUEST, msg="Error occurred while consuming verification token. Please try again later.")
    if not created:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="This verification link has already been used. Please request a new one.")

def get_verify_token_expiration_time(token: str) -> datetime:
    """Get the expiration time of a verification token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") not in [EmailVerificationType.ACCOUNT_ACTIVATION.value, EmailVerificationType.PASSWORD_RESET.value]:
            raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Invalid Token Type")
        expiretime = payload.get("exp")
        if expiretime is None:
            raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Invalid Token: Missing expiration time")
        return datetime.fromtimestamp(expiretime, tz=timezone.utc)
    except jwt.PyJWTError:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Invalid verification link. Please check your email and try again.")

async def cache_state(state: str, session_id: str, expires_in: int = 300) -> None:
    """Cache the state parameter for CSRF protection."""
    try:
        await redis_client.set(f"oauth_state:{session_id}", state, ex=expires_in, nx=True)
    except redis.RedisError:
        raise APIError(status_code=503, code=APIErrorCode.BAD_REQUEST, msg="Error occurred while caching state. Please try logging in again.")

async def verify_state(state: str, session_id: str) -> None:
    """Verify the state parameter for CSRF protection."""
    key = f"oauth_state:{session_id}"
    try:
        value = await redis_client.getdel(key)
    except redis.RedisError:
        raise APIError(status_code=503, code=APIErrorCode.BAD_REQUEST, msg="Error occurred while verifying state. Please try logging in again.")
    if value is None:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Invalid or expired state parameter. Please try logging in again.")
    if value != state:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="State parameter mismatch. Possible CSRF attack. Please try logging in again.")
