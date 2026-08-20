import jwt
import httpx
import logging

from datetime import timedelta, datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app import crud
from app.platform.service import userservice
from app.platform.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.platform import security
from app.platform.config import settings
from app.models.all import ErrorResponse, Message, NewPassword, OAuthAccountCreate, ProviderType, Token, TokenAndUser, UserCreate, UserPublic, UserUpdate, User
from app.models.all import APIError, APIErrorCode

from fastapi.responses import RedirectResponse, Response
from jwt.exceptions import InvalidTokenError

# from app.utils import (
#     # generate_password_reset_token,
#     # generate_reset_password_email,
#     # send_email,
#     verify_password_reset_token,
# )

router = APIRouter(tags=["login"])
logger = logging.getLogger("uvicorn.error")


def verify_password_reset_token(token: str) -> str | None:
    try:
        decoded_token = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
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

@router.post("/login/access-token", response_model=TokenAndUser, responses={401: {"model": ErrorResponse}})
def login_access_token(session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()],response: Response) -> TokenAndUser:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = crud.authenticate(session=session, email=form_data.username, password=form_data.password)
    
    if not user:
        raise APIError(status_code=401, code=APIErrorCode.UNAUTHORIZED, msg="Incorrect email or password")
    elif not user.is_active:
        raise APIError(status_code=401, code=APIErrorCode.INACTIVE_USER, msg="Inactive user")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    access_token=security.create_access_token(user.id, expires_delta=access_token_expires)

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=1800
    )
    public_user = UserPublic.model_validate(user)

    return TokenAndUser(access_token=access_token, user=public_user)

@router.post("/login/test-token", response_model=UserPublic)
def test_token(current_user: CurrentUser) -> Any:
    """
    Test access token
    """
    return current_user


@router.post("/password-recovery/{email}")
def recover_password(email: str, session: SessionDep) -> Message:
    """
    Password Recovery
    """
    user = userservice.get_user_by_email(session=session, email=email)
    if user:
        password_reset_token = generate_password_reset_token(email=email)
        # email_data = generate_reset_password_email(
        #     email_to=user.email, email=email, token=password_reset_token
        # )
        # send_email(
        #     email_to=user.email,
        #     subject=email_data.subject,
        #     html_content=email_data.html_content,
        # )
    return Message(
        message="If that email is registered, we sent a password recovery link"
    )


@router.post("/reset-password/")
def reset_password(session: SessionDep, body: NewPassword) -> Message:
    """
    Reset password
    """
    email = verify_password_reset_token(token=body.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")
    user = userservice.get_user_by_email(session=session, email=email)
    if not user:
        # Don't reveal that the user doesn't exist - use same error as invalid token
        raise HTTPException(status_code=400, detail="Invalid token")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    user_in_update = UserUpdate(password=body.new_password)
    userservice.update_user(
        session=session,
        db_user=user,
        user_in=user_in_update,
    )
    return Message(message="Password updated successfully")

authRouter = APIRouter(tags=["auth"])

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
        logger.info(f"------------42 OAuth2 callback response: {response.status_code}, {response.text}")
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
                password=code,
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
