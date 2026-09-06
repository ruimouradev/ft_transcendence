from datetime import timedelta

from fastapi import APIRouter
from fastapi.responses import Response

from app.models.all import APIError, APIErrorCode, Message, TwoFADisableRequest, TwoFactorSetupRequest, TwoFactorSetupResponse, TwoFactorVerifyResponse, TwoFactorVerifyRequest, UserUpdate
from app.platform.deps import CurrentUser, SessionDep, TokenDep
from app.platform.service import twofa_service, userservice
from app.platform.config import settings
from app.platform import security

twofa_router = APIRouter(prefix="/2fa", tags=["Two-Factor Authentication"], include_in_schema=False)

@twofa_router.post("/setup", response_model=TwoFactorSetupResponse)
async def setup_two_factor(request: TwoFactorSetupRequest, current_user: CurrentUser, session: SessionDep):
    """
    Setup Two-Factor Authentication for the current user.
    """
    verified, _ = userservice.verify_password(request.password,current_user.hashed_password)
    if verified is False:
        raise APIError(status_code=400, code=APIErrorCode.UNAUTHORIZED, msg="Invalid password")
    if current_user.use2fa:
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

    if current_user.two_factor_secret is None:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Follow the setup process first to generate a secret before verifying the two-factor authentication setup")

    if not twofa_service.verify_totp(secret=current_user.two_factor_secret, code=request.code):
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Invalid verification code")

    current_user.use2fa = True
    userservice.update_user(session=session, db_user=current_user, user_in=UserUpdate(use2fa=True))
    recovery_codes = twofa_service.generate_recovery_codes(session=session, user=current_user)

    return TwoFactorVerifyResponse(recovery_codes=recovery_codes)

@twofa_router.post("/reset", response_model=TwoFactorSetupResponse)
async def reset_two_factor(session: SessionDep, request: TwoFactorSetupRequest, token:TokenDep, response: Response):
    """
    Reset Two-Factor Authentication for the current user. This endpoint requires the user's current password and recovery code to reset 2FA.
    """
    current_user = twofa_service.get_user_from_tfa_token(session=session, token=token)

    if not request.recovery_code:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Recovery code is required to reset Two-Factor Authentication.")

    if not twofa_service.check_user_password(current_user, request.password):
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Invalid password")

    if not current_user.use2fa:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Two-Factor Authentication is not enabled for this user.")

    if current_user.two_factor_secret is None:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Two-Factor Authentication secret is not set for this user.")

    if not twofa_service.check_recovery_code(session=session, user=current_user, recovery_code=request.recovery_code):
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Invalid recovery code")
    
    secret = twofa_service.generate_secret()
    otpauth_url = twofa_service.get_otpauth_url(secret=secret, username=current_user.email)

    userservice.update_user(session=session, db_user=current_user, user_in=UserUpdate(use2fa=False, two_factor_secret=secret))

    access_token=security.create_access_token(current_user.id, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return TwoFactorSetupResponse(otpauth_url=otpauth_url, secret=secret)

@twofa_router.post("/disable", response_model=Message)
async def disable_two_factor(request: TwoFADisableRequest, current_user: CurrentUser, session: SessionDep):
    """
    Disable Two-Factor Authentication for the current user. This endpoint requires the user's current password and a valid 2FA code to disable 2FA.
    """
    verified, _ = userservice.verify_password(request.password, current_user.hashed_password)
    if verified is False:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Invalid password")

    if current_user.use2fa is False:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Two-Factor Authentication is not enabled")

    if not twofa_service.verify_totp(secret=current_user.two_factor_secret, code=request.code):
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Invalid verification code")

    userservice.update_user(session=session, db_user=current_user, user_in=UserUpdate(use2fa=False, two_factor_secret=None))

    return Message(code="success", status_code="200", message="Two-Factor Authentication has been disabled successfully.")