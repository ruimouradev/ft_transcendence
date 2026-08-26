from datetime import timedelta

import jwt

from fastapi import APIRouter
from fastapi.responses import Response
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError

from app.models.all import APIError, APIErrorCode, TokenPayload, TwoFactorSetupRequest, TwoFactorSetupResponse, TwoFactorVerifyResponse, TwoFactorVerifyRequest, UserUpdate
from app.platform.deps import CurrentUser, SessionDep, TokenDep
from app.platform.service import twofa_service, userservice
from app.platform.config import settings
from app.platform import security

twofa_router = APIRouter(prefix="/2fa", tags=["Two-Factor Authentication"], include_in_schema=True)

@twofa_router.post("/setup", response_model=TwoFactorSetupResponse)
async def setup_two_factor(request: TwoFactorSetupRequest, current_user: CurrentUser, session: SessionDep):
    """
    Setup Two-Factor Authentication for the current user.
    """
    verified, _ = userservice.verify_password(request.password,current_user.hashed_password)
    if verified is False:
        raise APIError(status_code=401, code=APIErrorCode.UNAUTHORIZED, msg="Invalid password")
    if request.recovery_code is None and current_user.use2fa:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Two-Factor Authentication is already enabled")

    secret = twofa_service.generate_secret()
    otpauth_url = twofa_service.get_otpauth_url(secret=secret, username=current_user.email)

    current_user.two_factor_secret=secret
    userservice.update_user(session=session,db_user=current_user,user_in=UserUpdate(two_factor_secret=secret))

    return TwoFactorSetupResponse(otpauth_url=otpauth_url, secret=secret)

@twofa_router.post("/verify-setup", response_model=TwoFactorVerifyResponse)
async def verify_two_factor_setup(request: TwoFactorVerifyRequest, current_user: CurrentUser, session: SessionDep):
    """
    Verify the two-factor authentication setup for the current user.
    """
    if current_user.use2fa:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Two-Factor Authentication is already enabled for this user")

    if not twofa_service.verify_totp(secret=current_user.two_factor_secret, code=request.code):
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Invalid verification code")

    current_user.use2fa = True
    userservice.update_user(session=session, db_user=current_user, user_in=UserUpdate(use2fa=True))
    recovery_codes = twofa_service.generate_recovery_codes(session=session, user=current_user)

    return TwoFactorVerifyResponse(recovery_codes=recovery_codes)

@twofa_router.post("/reset", response_model=TwoFactorSetupResponse)
async def setup_two_factor(session: SessionDep, request: TwoFactorSetupRequest, token:TokenDep, response: Response):
    """
    Reset Two-Factor Authentication for the current user. This endpoint requires the user's current password and recovery code to reset 2FA.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise APIError(status_code=403, code=APIErrorCode.INVALID_TOKEN, msg="Could not validate credentials.")
    current_user = userservice.get_user_by_id(session=session, user_id=token_data.sub)
    if current_user is None:
        raise APIError(status_code=404, code=APIErrorCode.NOT_FOUND, msg="User not found.")
    
    verified, _ = userservice.verify_password(request.password, current_user.hashed_password)
    if verified is False:
        raise APIError(status_code=401, code=APIErrorCode.UNAUTHORIZED, msg="Invalid password")
    if request.recovery_code is None and current_user.use2fa:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Need recovery code to reset Two-Factor Authentication")

    if not twofa_service.check_recovery_code(session=session, user=current_user, recovery_code=request.recovery_code):
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Invalid recovery code")

    userservice.update_user(session=session, db_user=current_user, user_in=UserUpdate(use2fa=False, two_factor_secret=None))
    
    secret = twofa_service.generate_secret()
    otpauth_url = twofa_service.get_otpauth_url(secret=secret, username=current_user.email)

    current_user.two_factor_secret=secret
    userservice.update_user(session=session,db_user=current_user,user_in=UserUpdate(two_factor_secret=secret))

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token=security.create_access_token(current_user.id, expires_delta=access_token_expires)

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    return TwoFactorSetupResponse(otpauth_url=otpauth_url, secret=secret)