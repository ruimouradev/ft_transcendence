import token

import jwt
import httpx
import logging

from datetime import timedelta, datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
    
from app.platform.service import userservice, twofa_service
from app.platform.deps import CurrentUser, SessionDep, TokenDep, get_current_active_superuser
from app.platform import security
from app.platform.config import settings

from app.platform.service.mailservice import send_password_reset_email
from app.models.all import ErrorResponse, Message, OAuthAccountCreate, ProviderType, TokenAndUser, TokenPayload, UserCreate, UserPublic, UserUpdate, User
from app.models.all import APIError, APIErrorCode

from fastapi.responses import RedirectResponse, Response
from jwt.exceptions import InvalidTokenError

router = APIRouter(tags=["login"], include_in_schema=True)
logger = logging.getLogger("uvicorn.error")


def verify_password_reset_token(token: str) -> str | None:
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        return str(decoded_token["sub"])
    except InvalidTokenError:
        return None

def generate_password_reset_token(email: str) -> str:
    delta = timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.now(timezone.utc)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email},
        settings.SECRET_KEY,
        algorithm=security.ALGORITHM,
    )
    return encoded_jwt


@router.post("/login/access-token", response_model=Message, responses={401: {"model": ErrorResponse}})
def login_access_token(session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()],response: Response) -> TokenAndUser:
    """
    OAuth2 compatible token login, get an access token for future requests
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

@router.get("/login/verify-2fa", response_model=Message, responses={401: {"model": ErrorResponse}})
def validate_2fa(session: SessionDep, token: TokenDep, code: str, response: Response) -> Message:
    """
    Validate 2FA and return access token
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise APIError(status_code=403, code=APIErrorCode.INVALID_TOKEN, msg="Could not validate credentials.")
    if token_data.type != "2fa":
        raise APIError(status_code=403, code=APIErrorCode.INVALID_TOKEN, msg="Invalid token type.")
    user = userservice.get_user_by_id(session=session, user_id=token_data.sub)
    if user.use2fa is False:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Two-factor authentication is not enabled for this user")
    else:
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

@router.get("/password-recovery/{email}")
def recover_password(email: str, session: SessionDep, background_tasks: BackgroundTasks):
    """
    Password Recovery
    """
    user = userservice.get_user_by_email(session=session, email=email)
    if user:
        if settings.EMAILS_ENABLED and user.is_active:
            new_password = security.generate_password(8)
            userservice.update_user(session=session, db_user=user, user_in=UserUpdate(password=new_password))
            background_tasks.add_task(send_password_reset_email, email=email, username=user.nick_name, new_password=new_password)
    return RedirectResponse(
        url="/login?info=password reset email sent, please check your email",
        status_code=status.HTTP_307_TEMPORARY_REDIRECT
    )


# @router.post("/reset-password/")
# def reset_password(session: SessionDep, body: NewPassword) -> Message:
#     """
#     Reset password
#     """
#     email = verify_password_reset_token(token=body.token)
#     if not email:
#         raise HTTPException(status_code=400, detail="Invalid token")
#     user = userservice.get_user_by_email(session=session, email=email)
#     if not user:
#         # Don't reveal that the user doesn't exist - use same error as invalid token
#         raise HTTPException(status_code=400, detail="Invalid token")
#     elif not user.is_active:
#         raise HTTPException(status_code=400, detail="Inactive user")
#     user_in_update = UserUpdate(password=body.new_password)
#     userservice.update_user(
#         session=session,
#         db_user=user,
#         user_in=user_in_update,
#     )
#     return Message(message="Password updated successfully")

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
    auth_url = f"https://api.intra.42.fr/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code"
    return RedirectResponse(auth_url)

async def download_image(url: str, filename: str):
    async with httpx.AsyncClient() as client:
        async with client.stream("GET", url) as response:
            response.raise_for_status()

            with open(filename, "wb") as f:
                async for chunk in response.aiter_bytes():
                    f.write(chunk)

@authRouter.get("/auth/42/callback", tags=["auth"])
async def callback_42(code: str, session: SessionDep):
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
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data)
        if response.status_code != 200:
            response=RedirectResponse(
                url="/login?error=oauth2_error",
                status_code=status.HTTP_307_TEMPORARY_REDIRECT,
                
            )
            return response;
        response_data = response.json()
        access_token = response_data.get("access_token")
        if not access_token:
            response=RedirectResponse(
                url="/login?error=oauth2_error",
                status_code=status.HTTP_307_TEMPORARY_REDIRECT
            )
            return response;
        
        # Use the access token to get user info
        user_info_url = "https://api.intra.42.fr/v2/me"
        headers = {"Authorization": f"Bearer {access_token}"}
        user_response = await client.get(user_info_url, headers=headers)
        if user_response.status_code != 200:
            response=RedirectResponse(
				url="/login?error=oauth2_error",
				status_code=status.HTTP_307_TEMPORARY_REDIRECT
			)
            return response;

        user_info = user_response.json()
        user=userservice.get_user_by_email(session=session, email=user_info.get("email"))
        if not user:
            await download_image(user_info.get("image", {}).get("versions", {}).get("small", ""), f"app/static/{user_info['id']}-small.jpg")
            user_create = UserCreate(
                email=user_info.get("email"),
                password=security.generate_password(8),
                is_active=True,
                nick_name=f"{user_info.get('login')}",
                avatar=f"/static/{user_info['id']}-small.jpg"
            )
            userservice.create_user(session=session, user_create=user_create)
            user=userservice.get_user_by_email(session=session, email=user_info.get("email"))

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token=security.create_access_token(user.id, expires_delta=access_token_expires)
        oauth_account = userservice.get_oauth_account_by_provider_and_user_id(session=session, provider=ProviderType.t42, user_id=str(user.id))

        if not oauth_account:
            oauth_account = userservice.create_oauth_account(session=session, oauth_account_create=OAuthAccountCreate(
                provider=(ProviderType.t42.value),
                provider_user_id=str(user_info.get("id")),
                provider_user_email=user_info.get("email"),
                access_token=access_token,
                user_id=str(user.id)
            ))
        response = RedirectResponse(
            url=f"/dashboard",
            status_code=status.HTTP_307_TEMPORARY_REDIRECT
        )
        
        response.set_cookie(
            key="access_token",
            value=f"Bearer {access_token}",
            httponly=True,       # Prevents JS reading the token (XSS protection)
            secure=True,         # Set to True in production (HTTPS)
            samesite="lax",      # Crucial for OAuth redirects across domains
            max_age=1800         # 30 minutes in seconds
        )
        
        return response

# @router.post(
#     "/password-recovery-html-content/{email}",
#     dependencies=[Depends(get_current_active_superuser)],
#     response_class=HTMLResponse,
# )
# def recover_password_html_content(email: str, session: SessionDep) -> Any:
#     """
#     HTML Content for Password Recovery
#     """
#     user = crud.get_user_by_email(session=session, email=email)

#     if not user:
#         raise HTTPException(
#             status_code=404,
#             detail="The user with this username does not exist in the system.",
#         )
#     password_reset_token = generate_password_reset_token(email=email)
#     email_data = generate_reset_password_email(
#         email_to=user.email, email=email, token=password_reset_token
#     )

#     return HTMLResponse(
#         content=email_data.html_content, headers={"subject:": email_data.subject}
#     )
