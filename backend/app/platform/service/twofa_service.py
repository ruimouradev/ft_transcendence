

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

    # return f"otpauth://totp/{issuer_name}:{username}?secret={secret}&issuer={issuer_name}"

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