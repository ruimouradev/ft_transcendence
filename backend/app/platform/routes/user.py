import uuid
from typing import Any
import logging
from datetime import datetime, timezone

import jwt

from app.presence_manager import presence_manager
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import RedirectResponse
from sqlmodel import col, delete, func, select
from pathlib import Path

from app.platform.deps import (
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
)
from app.platform.config import settings
from app.platform.security import get_password_hash, verify_password
from app.models.all import (
    APIError,
    APIKeyContext,
    APIKeyStatus,
    Message,
    OAuthAccountCreate,
    ProviderType,
    UpdatePassword,
    User,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)

from app.platform.service import userservice
from app.platform.service.mailservice import (
    verify_token,
    create_verification_token,
    send_new_account_activation_email,
)
from app.platform.deps import get_current_user

router = APIRouter(prefix="/users", tags=["users"], include_in_schema=False)

# @router.get("/", dependencies=[Depends(get_current_active_superuser)], response_model=UsersPublic)
# def read_users(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
#     """
#     Retrieve users."""

#     count_statement = select(func.count()).select_from(User)
#     count = session.exec(count_statement).one()

#     statement = (
#         select(User).order_by(col(User.created_at).desc()).offset(skip).limit(limit)
#     )
#     users = session.exec(statement).all()

#     users_public = [UserPublic.model_validate(user) for user in users]
#     return UsersPublic(data=users_public, count=count)


# @router.post("/", dependencies=[Depends(get_current_active_superuser)], response_model=UserPublic)
# def create_user(*, session: SessionDep, user_in: UserCreate) -> Any:
#     """
#     Create new user.
#     """
#     user = userservice.get_user_by_email(session=session, email=user_in.email)
#     if user:
#         raise HTTPException(
#             status_code=400,
#             detail="The user with this email already exists in the system.",
#         )

#     user = userservice.create_user(session=session, user_create=user_in)
#     if settings.EMAILS_ENABLED and user_in.email:
#         token = create_verification_token(user_in.email, expire_minutes=0)
#         background_tasks.add_task(send_new_account_activation_email, user_in.email, user_in.username, token)
#     return user


@router.patch("/me", response_model=UserPublic)
def update_user_me(*, session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser) -> Any:
    """
    Update own user.
    """

    if user_in.email:
        existing_user = userservice.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )
    user_data = user_in.model_dump(exclude_unset=True)
    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


@router.patch("/me/password", response_model=Message)
def update_password_me( *, session: SessionDep, body: UpdatePassword, current_user: CurrentUser) -> Any:
    """
    Update own password.
    """
    verified, _ = verify_password(body.current_password, current_user.hashed_password)
    if not verified:
        raise HTTPException(status_code=400, detail="Incorrect password")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400, detail="New password cannot be the same as the current one"
        )
    hashed_password = get_password_hash(body.new_password)
    current_user.hashed_password = hashed_password
    session.add(current_user)
    session.commit()
    return Message(status_code=200, code="success", message="Password updated successfully")


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> Any:
    """
    Get current user.
    """
    return current_user


# @router.delete("/me", response_model=Message)
# def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
#     """
#     Delete own user.
#     """
#     if current_user.is_superuser:
#         raise HTTPException(
#             status_code=403, detail="Super users are not allowed to delete themselves"
#         )
#     session.delete(current_user)
#     session.commit()
#     return Message(message="User deleted successfully")


@router.post("/signup", response_model=Message)
def register_user(session: SessionDep, user_in: UserRegister, background_tasks: BackgroundTasks) -> Message:
    """
    Create new user without the need to be logged in.
    """
    same_nick_name_user = userservice.get_user_by_nick_name(session=session, nick_name=user_in.nick_name)
    if same_nick_name_user:
        raise APIError(status_code=400, code="NICKNAME_EXISTS", msg="This nick name is already taken. Please try a different one.")
    
    user = userservice.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise APIError(status_code=400, code="USER_EXISTS", msg="This email is already registered. Please try a different one.")
    user_create = UserCreate.model_validate(user_in)
    user_create.avatar = "/static/a00.jpeg"
    user = userservice.create_user(session=session, user_create=user_create)
    if settings.EMAILS_ENABLED and user_in.email:
        token = create_verification_token(user_in.email, expire_minutes=0)
        background_tasks.add_task(send_new_account_activation_email, user_in.email, user_in.nick_name, token)
    return Message(status_code=200, code="success", message="User created successfully")

@router.get("/verify-email")
def verify_email(session: SessionDep, token: str):
    """
    Verify the user's email address using the provided token.
    If the token is valid, the user's account will be activated.
    """

    email = verify_token(token)
    user = userservice.get_user_by_email(session=session, email=email)
    if not user:
        return RedirectResponse(
                url="/login?error=Email verification failed. User not found.",
                status_code=status.HTTP_307_TEMPORARY_REDIRECT
            )

    if user.is_active:
        return RedirectResponse(
                url="/login?info=Email already verified. Now you can log in.",
                status_code=status.HTTP_307_TEMPORARY_REDIRECT
            )

    user.is_active = True
    session.add(user)
    session.commit()

    return RedirectResponse(
				url="/login?info=Email verified successfully.Now You can log in.",
				status_code=status.HTTP_307_TEMPORARY_REDIRECT
			)


@router.get("/apikey", response_model=APIKeyStatus)
def get_api_key(session: SessionDep, current_user: CurrentUser) -> APIKeyStatus:
    """
    Retrieve API key for the current user.
    """
    oauth_account = userservice.get_oauth_account_by_provider_and_user_id(session=session, provider=ProviderType.api_key, user_id=current_user.id)
    hash_api_key = True if oauth_account else False

    return APIKeyStatus(has_api_key=hash_api_key, client_id=str(current_user.id) if hash_api_key else None)


@router.post("/apikey", response_model=APIKeyContext)
def regenerate_api_key(session: SessionDep, current_user: CurrentUser) -> APIKeyContext:
    """
    Regenerate API key for the current user.
    """
    api_key = jwt.encode({"sub": str(current_user.id)}, settings.SECRET_KEY, algorithm="HS256")
    api_key_hash = get_password_hash(api_key)
    oauth_account = userservice.get_oauth_account_by_provider_and_user_id(session=session, provider=ProviderType.api_key, user_id=current_user.id)

    if not oauth_account:
        oauth_account = OAuthAccountCreate(user_id=current_user.id, provider=ProviderType.api_key.value, access_token=api_key_hash, provider_user_id="api_key", created_at=datetime.now(timezone.utc))
        userservice.create_oauth_account(session=session, oauth_account_create=oauth_account)
    else:
        userservice.update_oauth_api_key(session=session, db_oauth_account=oauth_account, api_key=api_key_hash)

    return APIKeyContext(client_id=current_user.id, api_key=api_key)


@router.get("/{user_id}", response_model=UserPublic)
def read_user_by_id(user_id: uuid.UUID, session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Get a specific user by id.
    """
    user = session.get(User, user_id)
    if user == current_user:
        return user
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# @router.patch( "/{user_id}", dependencies=[Depends(get_current_active_superuser)], response_model=UserPublic,)
# def update_user( *, session: SessionDep, user_id: uuid.UUID, user_in: UserUpdate, ) -> Any:
#     """
#     Update a user.
#     """

#     db_user = session.get(User, user_id)
#     if not db_user:
#         raise HTTPException(
#             status_code=404,
#             detail="The user with this id does not exist in the system",
#         )
#     if user_in.email:
#         existing_user = userservice.get_user_by_email(session=session, email=user_in.email)
#         if existing_user and existing_user.id != user_id:
#             raise HTTPException(
#                 status_code=409, detail="User with this email already exists"
#             )

#     db_user = userservice.update_user(session=session, db_user=db_user, user_in=user_in)
#     return db_user

# @router.delete("/{user_id}", dependencies=[Depends(get_current_active_superuser)])
# def delete_user(session: SessionDep, current_user: CurrentUser, user_id: uuid.UUID) -> Message:
#     """
#     Delete a user.
#     """
#     user = session.get(User, user_id)
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
#     if user == current_user:
#         raise HTTPException(
#             status_code=403, detail="Super users are not allowed to delete themselves"
#         )
#     # statement = delete(Item).where(col(Item.owner_id) == user_id)
#     # session.exec(statement)
#     session.delete(user)
#     session.commit()
#     return Message(message="User deleted successfully")

#UploadFile
@router.post("/uploadfile")
async def upload_file(file: UploadFile, session: SessionDep, current_user: CurrentUser):
    """
    Upload a file (avatar) for the current user.
    """

    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG and PNG are allowed.")
        # return {"error": "Invalid file type. Only JPEG and PNG are allowed."}
    if file.content_type == "image/jpeg":
        avatar_filename = f"avatar.jpg"
    if file.content_type == "image/png" :
        avatar_filename = f"avatar.png"

    uploaddir = Path("app/static/"+current_user.id.hex+"/")
    uploaddir.mkdir(parents=True, exist_ok=True)

    MAX_SIZE = 3 * 1024 * 1024  # 3MB
    size = 0
    
    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break
        size += len(chunk)
        if size > MAX_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds the limit of 3MB.")
            # return {"error": "File size exceeds the limit of 3MB."}
    
    await file.seek(0)
    content = await file.read()
    
    with open(uploaddir / avatar_filename, "wb") as f:
        f.write(content)

    userservice.update_user(session=session, db_user=current_user, user_in=UserUpdate(avatar=f"/static/{current_user.id.hex}/{avatar_filename}"))
    return {"filename": avatar_filename, "file_size": len(content), "url": f"/static/{current_user.id.hex}/{avatar_filename}"}


@router.get("/online", response_model=UsersPublic)
def get_online_users(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Retrieve online users.
    """
    statement = select(User).where(User.is_active == True)
    users = session.exec(statement).all()

    users_public = [UserPublic.model_validate(user) for user in users]
    return UsersPublic(data=users_public, count=len(users_public))


user_presence_router = APIRouter()

logger = logging.getLogger("uvicorn.error")
if not logger.handlers:
    logger.propagate = False
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s - %(levelname)s - %(message)s"
        )
    )
    logger.addHandler(handler)
else:
    for handler in logger.handlers:
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s - %(levelname)s - %(message)s"
            )
        )

@user_presence_router.websocket("/ws/presence/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, session: SessionDep):
    """
    WebSocket endpoint for user presence management.
    """

    current_user = get_current_user(session=session, token=str(websocket.cookies.get("access_token")).replace("Bearer ", ""))
    
    if str(current_user.id) != user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        logger.warning(f"===> User {user_id} attempted to connect with invalid token.")
        return

    await presence_manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "PING":
                presence_manager.update_heartbeat(user_id)
                logger.info(f"===> Received PING from user {user_id}.")
                await websocket.send_json({"type": "PONG", "user_id": user_id})
            else:
                await presence_manager.handle_message(user_id, data)

    except WebSocketDisconnect:
        logger.info(f"===> User {user_id} disconnected.")

    except Exception as e:
        logger.error(f"===> Error in WebSocket connection for user {user_id}: {e}")

    finally:
        await presence_manager.disconnect(user_id)
        logger.info(
            f"===> User {user_id} disconnected. "
            f"Current status: {presence_manager.get_status(user_id)}"
        )


