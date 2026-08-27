from app.models.all import APIError, APIErrorCode, EmailVerificationType
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr, BaseModel 
from typing import List 
from pathlib import Path
from datetime import datetime, timedelta, timezone
import jwt
from app.platform.config import settings

BASE_DIR = Path(__file__).resolve().parent

class EmailSchema(BaseModel): 
   email: List[EmailStr]

conf = ConnectionConfig( 
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    TEMPLATE_FOLDER=Path(BASE_DIR,"templates")
)

def create_verification_token(email: str, verifyType: EmailVerificationType, expire_minutes: int = 15) -> str:
    """create JWT Token for email verification with 15 minutes expiration"""
    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    payload = {"sub": email, "exp": expire, "type": verifyType.value}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_token(token: str) -> str:
    """ verify JWT Token for email verification and return the email if valid, otherwise raise APIError """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") not in [EmailVerificationType.ACCOUNT_ACTIVATION.value, EmailVerificationType.PASSWORD_RESET.value]:
            raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Invalid Token Type")
        return payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Verification link has expired. Please request a new one.")
    except jwt.PyJWTError:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Invalid verification link. Please check your email and try again.")

async def send_new_account_activation_email(email: EmailStr, username: str, token: str):
    """Send an account activation email to the user with a verification link."""

    verify_url = f"{settings.FRONTEND_HOST}/api/v1/users/verify-email?token={token}"
    template_data = {
        "username": username,
        "verify_url": verify_url,
        "expire_minutes": 15
    }
    message = MessageSchema(
        subject="[Account Activation] Please Activate Your Email",
        recipients=[email],
        template_body=template_data,
        subtype=MessageType.html
    )
    fm = FastMail(conf)
    await fm.send_message(message, template_name="email_verification.html")

async def send_password_reset_email(email: EmailStr, username: str, token: str):
    """Send a password reset email to the user with a reset link."""
    reset_url = f"{settings.FRONTEND_HOST}/reset-password?token={token}"
    template_data = {
        "username": username,
        "reset_url": reset_url,
        "expire_minutes": 15,
    }
    message = MessageSchema(
        subject="[Password Reset] Reset Your Password",
        recipients=[email],
        template_body=template_data,
        subtype=MessageType.html
    )
    fm = FastMail(conf)
    await fm.send_message(message, template_name="password_reset.html")