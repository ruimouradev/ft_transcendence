import secrets

from app.platform import security
from sqlmodel import delete, select

from app.models.all import RecoveryCode, get_datetime_utc
import pyotp


def generate_secret() -> str:
    """
    Generate a random secret key for two-factor authentication.
    """
    return pyotp.random_base32()

def get_otpauth_url(secret: str, username: str, issuer_name: str = "UNOpposed") -> str:
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