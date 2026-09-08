from collections.abc import Generator
from typing import Annotated, Optional

import jwt
from app.platform.service import userservice
from fastapi import Depends, HTTPException, status, Request, Header
from fastapi.security import OAuth2, APIKeyHeader
from fastapi.security.oauth2 import OAuthFlowsModel
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlmodel import Session

from app.platform import security
from app.platform.config import settings
from app.models.database import engine
from app.models.all import APIError, APIErrorCode, ProviderType, TokenPayload, User, LoginTokenType, uuid_check


class OAuth2PasswordBearerWithCookie(OAuth2):
    def __init__(
        self,
        tokenUrl: str,
        scheme_name: Optional[str] = None,
        scopes: Optional[dict[str, str]] = None,
        auto_error: bool = True,
    ):
        flows = OAuthFlowsModel(password={"tokenUrl": tokenUrl, "scopes": scopes or {}})
        super().__init__(flows=flows, scheme_name=scheme_name, auto_error=auto_error)

    async def __call__(self, request: Request) -> Optional[str]:
        token = request.cookies.get("access_token")
        if token and token.startswith("Bearer "):
            token = token[7:]

        if not token:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            else:
                return None
        return token

reusable_oauth2 = OAuth2PasswordBearerWithCookie(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)

def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise APIError(status_code=403, code=APIErrorCode.INVALID_TOKEN, msg="Could not validate credentials.")
    if token_data.type != LoginTokenType.ACCESS.value:
        raise APIError(status_code=403, code=APIErrorCode.INVALID_TOKEN, msg="Invalid token type.")
    
    user = session.get(User, token_data.sub)
    if not user:
        raise APIError(status_code=404, code=APIErrorCode.USER_NOT_FOUND, msg="User not found")
    if not user.is_active:
        raise APIError(status_code=400, code=APIErrorCode.INACTIVE_USER, msg="Inactive user")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]

optional_oauth2 = OAuth2PasswordBearerWithCookie(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token", auto_error=False
)

OptionalTokenDep = Annotated[Optional[str], Depends(optional_oauth2)]


def get_user_or_none(session: SessionDep, token: OptionalTokenDep) -> Optional[User]:
    """The signed in user, or nobody.

    A first visit carries no cookie. Answering with an empty body
    instead of a 401 keeps the browser console clean on the pages
    anyone is allowed to open.
    """
    if not token:
        return None
    try:
        return get_current_user(session, token)
    except (APIError, HTTPException):
        return None


OptionalUser = Annotated[Optional[User], Depends(get_user_or_none)]


def get_current_active_superuser(current_user: CurrentUser) -> User:
    if not current_user.is_superuser:
        raise APIError(status_code=403, code=APIErrorCode.FORBIDDEN, msg="The user doesn't have enough privileges")
    return current_user

api_key_header = APIKeyHeader(
    name="X-API-Key",
    auto_error=False,
)


def verify_api_key( session: SessionDep, api_key: str | None = Depends(api_key_header), client_id: str = Header(..., alias="X-Client-ID"),) -> str:

    if api_key is None:
        raise APIError(status_code=401, code=APIErrorCode.API_KEY_MISSING, msg="API key is missing")
    uuid_check(client_id, msg_str="Invalid client ID format. Must be a valid UUID.")
    oauth_account = userservice.get_oauth_account_by_provider_and_user_id(session=session, provider=ProviderType.api_key, user_id=client_id)
    if oauth_account is None:
        raise APIError(status_code=401, code=APIErrorCode.APIKEY_NOT_EXIST, msg="API key does not exist for the provided client ID")
    verify_result = security.verify_password(api_key, oauth_account.access_token)
    if not verify_result[0]:
        raise APIError(status_code=401, code=APIErrorCode.INVALID_API_KEY, msg="Invalid API key")

    return oauth_account.user_id