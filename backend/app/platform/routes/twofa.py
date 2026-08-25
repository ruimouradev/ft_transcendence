from fastapi import APIRouter

from app.models.all import APIError, APIErrorCode, TwoFactorSetupRequest, TwoFactorSetupResponse, TwoFactorVerifyResponse, TwoFactorVerifyRequest, UserUpdate
from app.platform.deps import CurrentUser, SessionDep
from app.platform.service import twofa_service, userservice

twofa_router = APIRouter(prefix="/2fa", tags=["Two-Factor Authentication"], include_in_schema=True)

@twofa_router.post("/setup", response_model=TwoFactorSetupResponse)
async def setup_two_factor(request: TwoFactorSetupRequest, current_user: CurrentUser, session: SessionDep):
    """
    Setup Two-Factor Authentication for the current user.
    """
    verified, _ = userservice.verify_password(request.password,current_user.hashed_password)
    if verified is False:
        raise APIError(status_code=401, code=APIErrorCode.UNAUTHORIZED, msg="Invalid password")
    if current_user.use2fa:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Two-Factor Authentication is already enabled")
    
    secret = twofa_service.generate_secret()
    otpauth_url = twofa_service.get_otpauth_url(secret=secret, username=current_user.email)

    # twofa_service.store_secret(session=session, user=current_user, secret=secret)
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