import secrets

import httpx
import logging

from datetime import timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, status, BackgroundTasks, Body, Request
from fastapi.security import OAuth2PasswordRequestForm

    
from app.platform.service import userservice, twofa_service
from app.platform.deps import SessionDep, TokenDep
from app.platform import security
from app.platform.config import settings

from app.platform.service.mailservice import create_verification_token_used_in_mail, send_password_reset_email, verify_token_in_email
from app.models.all import EmailVerificationType, ErrorResponse, Message, OAuthAccountCreate, ProviderType, UserCreate, UserUpdate, APIError, APIErrorCode, nickname_validator

from fastapi.responses import RedirectResponse, Response

router = APIRouter(tags=["login"], include_in_schema=False)
logger = logging.getLogger("uvicorn.error")


@router.post("/login/access-token", response_model=Message, responses={401: {"model": ErrorResponse}})
def login_access_token(session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()],response: Response) -> Message:
    """
    User login with email and password. If the user has 2FA enabled, a temporary access token is returned and the user must validate 2FA to get a full access token. If the user does not have 2FA enabled, a full access token is returned.
    """

    user = userservice.authenticate_user(session=session, email=form_data.username, password=form_data.password)

    if user is None:
        raise APIError(status_code=401, code=APIErrorCode.UNAUTHORIZED, msg="Incorrect email or password")
    elif not user.is_active:
        raise APIError(status_code=401, code=APIErrorCode.INACTIVE_USER, msg="Inactive user")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    if user.use2fa:
        response.set_cookie(
            key="access_token",
            value=f"Bearer {security.create_temporary_access_token(user.id, expires_delta=timedelta(minutes=5))}",
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=5 * 60
        )
        return Message(status_code=200, code="2fa_required", message="Two-factor authentication required")

    access_token=security.create_access_token(user.id, expires_delta=access_token_expires)

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    return Message(status_code=200, code="success", message="Login successful")

@router.post("/login/verify-2fa", response_model=Message, responses={400: {"model": ErrorResponse},403: {"model": ErrorResponse}})
def validate_2fa(session: SessionDep, token: TokenDep, response: Response, code: str = Body(..., embed=True)) -> Message:
    """
    Validate 2FA and return access token
    """
    user = twofa_service.get_user_from_tfa_token(session=session, token=token)

    if user.use2fa is False:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Two-factor authentication is not enabled for this user")
    else:
        if user.two_factor_secret is None:
            raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Two-factor authentication secret is not set for this user")
        if not twofa_service.verify_totp(secret=user.two_factor_secret, code=code):
            raise APIError(status_code=400, code=APIErrorCode.UNAUTHORIZED, msg="Invalid two-factor authentication code")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(user.id, expires_delta=access_token_expires)

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    return Message(status_code=200, code="success", message="Two-factor authentication validated successfully")

@router.post("/request-password-reset", response_model=Message)
def recover_password(session: SessionDep, background_tasks: BackgroundTasks, email: str = Body(..., embed=True)):
    """
    Password reset request. If the user exists and is active, send a password reset email with a temporary password.
    """
    user = userservice.get_user_by_email(session=session, email=email)
    if user:
        if settings.EMAILS_ENABLED and user.is_active:
            expire_minutes = 10
            token = create_verification_token_used_in_mail(email, EmailVerificationType.PASSWORD_RESET, expire_minutes=expire_minutes)
            background_tasks.add_task(send_password_reset_email, email=email, username=user.nick_name, token=token, expire_minutes=expire_minutes)

    return Message(status_code=200, code="success", message="Check your email and reset your password.")

@router.post("/set-password", response_model=Message, responses={400: {"model": ErrorResponse}})
async def reset_password_me(*, session: SessionDep, password: str = Body(..., embed=True), token: str = Body(..., embed=True)) -> Any:
    """
    Use a verification token to set a new password.
    """
    if len(password) < 8:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Password must be at least 8 characters long.")
    if len(password) > 32:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Password must be at most 32 characters long.")

    email = verify_token_in_email(token, EmailVerificationType.PASSWORD_RESET)
    current_user = userservice.get_user_by_email(session=session, email=email)
    if not current_user:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="The user with this email does not exist in the system.")
    await security.consume_verification_token(token, EmailVerificationType.PASSWORD_RESET)
    userservice.update_user(session=session, db_user=current_user, user_in=UserUpdate(password=password))
    return Message(status_code=200, code="success", message="Password reset successfully")

# authRouter is used for routes OAuth2 login
authRouter = APIRouter(tags=["auth"], include_in_schema=False)

@authRouter.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
    )
    return {"message": "Logged out successfully"}

@authRouter.get("/auth/42/login", tags=["auth"])
async def login_42():
    # Redirect the user to the 42 OAuth2 authorization URL
    client_id = settings.O42_CLIENT_ID
    redirect_uri = settings.O42_REDIRECT_URI
    state = secrets.token_urlsafe(16)
    session_id = secrets.token_urlsafe(16)
    await security.cache_state(state, session_id)
    auth_url = f"https://api.intra.42.fr/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&state={state}"
    response = RedirectResponse(auth_url)
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=300  # 5 minutes
    )
    return response

async def download_image(url: str, filename: str):
    async with httpx.AsyncClient() as client:
        async with client.stream("GET", url) as response:
            response.raise_for_status()

            with open(filename, "wb") as f:
                async for chunk in response.aiter_bytes():
                    f.write(chunk)

@authRouter.get("/auth/42/callback", tags=["auth"])
async def callback_42(session: SessionDep, request: Request, code: str | None = None, state: str | None = None, error: str | None = None):
    """
    Handle the callback from 42 OAuth2 login. Exchange the authorization code for an access token, then use the access token to get user info. If the user does not exist, create a new user. Finally, return a redirect response with the access token set in a cookie.
    """
    if error:
        logger.error(f"42 Oauth Error: {error}")
        response=RedirectResponse(url="/login?error=oauth2_error", status_code=status.HTTP_303_SEE_OTHER)
        return response;
    if not code or not state:
        logger.error("42 Oauth Missing code or state")
        response=RedirectResponse(url="/login?error=oauth2_error", status_code=status.HTTP_303_SEE_OTHER)
        return response;

    session_id = request.cookies.get("session_id")
    if not session_id:
        logger.error("42 Oauth Session ID not found")
        response=RedirectResponse(url="/login?error=oauth2_error", status_code=status.HTTP_303_SEE_OTHER)
        return response;
    
    # Verify the state parameter
    try:
        await security.verify_state(state, session_id)
    except APIError as e:
        logger.error(f"42 Oauth State verification failed: {e}")
        response=RedirectResponse(url="/login?error=oauth2_error", status_code=status.HTTP_303_SEE_OTHER)
        return response;

    # Exchange the authorization code for an access token
    client_id = settings.O42_CLIENT_ID
    client_secret = settings.O42_CLIENT_SECRET
    token_url = settings.O42_TOKEN_URL
    data = {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": f"{settings.O42_REDIRECT_URI}"
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(token_url, data=data)
            if response.status_code != 200:
                logger.error(f"42 Oauth Token request failed: {response.text}")
                response=RedirectResponse(url="/login?error=oauth2_error", status_code=status.HTTP_303_SEE_OTHER)
                return response;
            response_data = response.json()
            access_token42 = response_data.get("access_token")
            if not access_token42:
                response=RedirectResponse(url="/login?error=oauth2_error", status_code=status.HTTP_303_SEE_OTHER)
                return response;
            
            # Use the access token to get user info
            user_info_url = "https://api.intra.42.fr/v2/me"
            headers = {"Authorization": f"Bearer {access_token42}"}
            user_response = await client.get(user_info_url, headers=headers)
            if user_response.status_code != 200:
                logger.error(f"42 Oauth User info request failed: {user_response.text}")
                response=RedirectResponse(url="/login?error=oauth2_error", status_code=status.HTTP_303_SEE_OTHER)
                return response;

            user_info = user_response.json()
            user42_email = user_info.get("email")
            user42_id = user_info.get("id")
            user42_login = user_info.get("login")
            user42_image = user_info.get("image", {}).get("versions", {}).get("small", "")

            if not user42_email or not user42_id or not user42_login:
                logger.error(f"42 Oauth User info incomplete: {user_info}")
                response=RedirectResponse(url="/login?error=oauth2_error", status_code=status.HTTP_303_SEE_OTHER)
                return response;

            user = userservice.get_user_by_email(session=session, email=user42_email)
            nick_user = userservice.get_user_by_nick_name(session=session, nick_name=user42_login)

            # The 42 login proves the email, so an account that never got
            # its activation mail is activated here, otherwise the cookie
            # would be issued for a user every request refuses
            if user and not user.is_active:
                userservice.update_user(session=session, db_user=user, user_in=UserUpdate(is_active=True))

            if not user:
                # Download the user's avatar image and save it to the static folder
                try:
                    if not user42_image:
                        avatar_path = "/static/a00.jpeg"
                    else:
                        avatar_path = f"/static/{user42_id}-small.jpg"
                        await download_image(user42_image, f"app{avatar_path}")
                except Exception as e:
                    logger.error(f"Failed to download avatar image for user {user42_login}: {e}")
                    avatar_path = "/static/a00.jpeg"
                if nick_user:
                    # If the nick_name is already taken, append a random string to it
                    user42_login = f"{user42_login[:3]}_{secrets.token_hex(4)}"
                nick_name = user42_login[:12]  # Truncate to 12 characters
                try:
                    nick_name = nickname_validator(nick_name)
                except ValueError:
                    # A 42 login can break the nickname rules, a bot prefix or
                    # a reserved word, so fall back to a generated one
                    nick_name = f"player_{secrets.token_hex(2)}"
                    while userservice.get_user_by_nick_name(session=session, nick_name=nick_name):
                        nick_name = f"player_{secrets.token_hex(2)}"
                user_create = UserCreate(
                    email=user42_email,
                    password=security.generate_password(8),
                    is_active=True,
                    nick_name=nick_name,
                    avatar=avatar_path
                )
                user = userservice.create_user(session=session, user_create=user_create)

            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token=security.create_access_token(user.id, expires_delta=access_token_expires)
            oauth_account = userservice.get_oauth_account_by_provider_and_provider_user_id(session=session, provider=ProviderType.t42, provider_user_id=str(user42_id))

            if not oauth_account:
                oauth_account = userservice.create_oauth_account(session=session, oauth_account_create=OAuthAccountCreate(
                    provider=(ProviderType.t42.value),
                    provider_user_id=str(user42_id),
                    provider_user_email=user42_email,
                    user_id=str(user.id)
                ))
            response = RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
            
            response.set_cookie(
                key="access_token",
                value=f"Bearer {access_token}",
                httponly=True,       # Prevents JS reading the token (XSS protection)
                secure=True,         # Set to True in production (HTTPS)
                samesite="lax",      # Crucial for OAuth redirects across domains
                max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            )
            
            return response
    except httpx.TimeoutException as e:
        logger.error(f"42 Oauth HTTP Request timed out: {e}")
        response=RedirectResponse(url="/login?error=oauth2_error", status_code=status.HTTP_303_SEE_OTHER)
        return response;
    except httpx.RequestError as e:
        logger.error(f"42 Oauth HTTP Request failed: {e}")
        response=RedirectResponse(url="/login?error=oauth2_error", status_code=status.HTTP_303_SEE_OTHER)
        return response;

