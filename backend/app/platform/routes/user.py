import uuid
from typing import Any
import logging
from datetime import datetime, timezone
from pydantic import ValidationError
from PIL import Image, UnidentifiedImageError
from PIL.Image import DecompressionBombError
from io import BytesIO

from app.presence_manager import presence_manager
from app.platform import security
from fastapi import APIRouter, HTTPException, status, BackgroundTasks, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import RedirectResponse
from sqlmodel import Session
from app.models.database import engine
from pathlib import Path

from app.platform.deps import (CurrentUser, SessionDep,)
from app.platform.config import settings
from app.platform.security import get_password_hash, verify_password
from app.models.all import (APIError, APIErrorCode,APIKeyContext,APIKeyStatus,EmailVerificationType,Message,OAuthAccountCreate,ProviderType,UpdatePassword,User,UserCreate,UserPublic,UserRegister,UserUpdate,UserUpdateMe, nickname_validator,)

from app.platform.service import userservice
from app.platform.service.mailservice import (
    verify_token_in_email,
    create_verification_token_used_in_mail,
    send_new_account_activation_email,
)
from app.platform.deps import get_current_user

router = APIRouter(prefix="/users", tags=["users"], include_in_schema=False)

@router.patch("/me", response_model=UserPublic)
def update_user_me(*, session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser) -> Any:
    """
    Update own user. only nickname and card back can be updated. Email update is not allowed.
    """
    if user_in.nick_name is not None:
        try:
            user_in.nick_name = nickname_validator(user_in.nick_name)
        except ValueError as e:
            raise HTTPException(
                status_code=400, detail=str(e)
            )
        existing_user = userservice.get_user_by_nick_name(session=session, nick_name=user_in.nick_name)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=409, detail="User with this nick name already exists"
            )
    if user_in.card_back is not None:
        if user_in.card_back not in ["back00", "back01", "back02", "back03", "back04"]:
            raise HTTPException(
                status_code=400, detail="Invalid card back URL"
            )
        
    user_data = user_in.model_dump(exclude_unset=True, exclude_none=True)

    if user_data is None or len(user_data) == 0:
        raise HTTPException(status_code=400, detail="No data provided for update")
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
    hashed_password = security.get_password_hash(body.new_password)
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

@router.post("/signup", response_model=Message)
def register_user(session: SessionDep, user_in: UserRegister, background_tasks: BackgroundTasks) -> Message:
    """
    Create new user without the need to be logged in.
    """
    user_in.nick_name = user_in.nick_name.strip()
    same_nick_name_user = userservice.get_user_by_nick_name(session=session, nick_name=user_in.nick_name)
    if same_nick_name_user:
        raise APIError(status_code=400, code="NICKNAME_EXISTS", msg="This nick name is already taken. Please try a different one.")
    
    same_email_user = userservice.get_user_by_email(session=session, email=user_in.email)
    if same_email_user:
        raise APIError(status_code=400, code="USER_EXISTS", msg="This email is already registered. Please try a different one.")

    try:
        user_create = UserCreate.model_validate(user_in)
    except ValidationError as e:
        messages = [
            str(error.get("ctx", {}).get("error", error["msg"]))
            for error in e.errors()
        ]

        raise APIError(
            status_code=400,
            code=APIErrorCode.BAD_REQUEST,
            msg="; ".join(messages),
        )

    user_create.avatar = "/static/a00.jpeg"
    userservice.create_user(session=session, user_create=user_create)
    if settings.EMAILS_ENABLED and user_in.email:
        expire_minutes = 30
        token = create_verification_token_used_in_mail(user_in.email, EmailVerificationType.ACCOUNT_ACTIVATION, expire_minutes=expire_minutes)
        background_tasks.add_task(send_new_account_activation_email, user_in.email, user_in.nick_name, token, expire_minutes=expire_minutes)

    return Message(status_code=200, code="success", message="User created successfully")

@router.post("/resend-activation-email", response_model=Message)
def resend_activation_email(session: SessionDep, user_in: UserRegister, background_tasks: BackgroundTasks):
    """
    Resend the activation email to the user.
    """
    user = userservice.get_user_by_email(session=session, email=user_in.email)
    if user:
        verifyed, _ = verify_password(user_in.password, user.hashed_password)
        if verifyed and user.nick_name == user_in.nick_name:
            expire_minutes = 30
            token = create_verification_token_used_in_mail(user_in.email, EmailVerificationType.ACCOUNT_ACTIVATION, expire_minutes=expire_minutes)
            background_tasks.add_task(send_new_account_activation_email, user_in.email, user.nick_name, token, expire_minutes=expire_minutes)
            return Message(status_code=200, code="success", message="Activation email has already been sent. Please check your inbox.")

    raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Requested information is not correct.")

@router.get("/verify-email")
def verify_email(session: SessionDep, token: str):
    """
    Verify the user's email address using the provided token.
    If the token is valid, the user's account will be activated.
    """
    try:
        email = verify_token_in_email(token, EmailVerificationType.ACCOUNT_ACTIVATION)
    except APIError as e:
        return RedirectResponse(
                url=f"/login?error={e.message}",
                status_code=status.HTTP_307_TEMPORARY_REDIRECT
            )
    user = userservice.get_user_by_email(session=session, email=email)
    if user is None:
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
    api_key = security.generate_password(32)
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

#UploadFile
@router.post("/uploadfile")
async def upload_file(file: UploadFile, session: SessionDep, current_user: CurrentUser):
    """
    Upload a file (avatar) for the current user.
    """
    uploaddir = Path("app/static/"+current_user.id.hex+"/")
    uploaddir.mkdir(parents=True, exist_ok=True)

    MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB
    MAX_WIDTH = 4096
    MAX_HEIGHT = 4096
    AVATAR_SIZE = (512, 512)

    content = await file.read(MAX_FILE_SIZE + 1)

    if not content:
        raise HTTPException( status_code=400, detail="File is empty." )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException( status_code=400, detail="File size exceeds the limit of 2MB." )
    try:
        image = Image.open(BytesIO(content))

        if image.format not in ["JPEG", "PNG"]:
            raise HTTPException(status_code=400, detail="Only JPEG and PNG are allowed.")
        
        if image.width > MAX_WIDTH or image.height > MAX_HEIGHT:
            raise HTTPException(status_code=400, detail=f"Image dimensions exceed the limit of {MAX_WIDTH}x{MAX_HEIGHT} pixels.")
        
        image.verify()        

        image = Image.open(BytesIO(content))        
        
        image.load()
        if image.mode != "RGB":
            background = Image.new("RGB", image.size, (255, 255, 255))
            if "A" in image.getbands():
                background.paste(image, mask=image.getchannel("A"))
            else:
                background.paste(image)
            image = background
        image.thumbnail(AVATAR_SIZE,Image.Resampling.LANCZOS)
        output = BytesIO()
        image.save(output, format="JPEG",quality=90,optimize=True)
        output.seek(0)

    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, DecompressionBombError) as exc:
        raise HTTPException( status_code=400, detail="Invalid or corrupted image file." ) from exc

    avatar_filename = "avatar.jpg"
    avatar_path = uploaddir / avatar_filename
    avatar_path.write_bytes(output.getvalue())

    userservice.update_user(session=session, db_user=current_user, user_in=UserUpdate(nick_name=current_user.nick_name, avatar=f"/static/{current_user.id.hex}/{avatar_filename}"))
    return {"filename": avatar_filename, "file_size": len(content), "url": f"/static/{current_user.id.hex}/{avatar_filename}"}

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

@user_presence_router.websocket("/ws/presence")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for user presence management.
    """
    logger.info(f"===> New WebSocket connection attempt from {websocket.client.host}:{websocket.client.port}")
    try:
        token = websocket.cookies.get("access_token")
        if not token or not token.startswith("Bearer "):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.warning(f"===> WebSocket authentication failed for {websocket.client.host}:{websocket.client.port}: Missing or invalid token")
            return
    
        with Session(engine) as session:
            current_user = get_current_user(session=session, token=str(websocket.cookies.get("access_token")).replace("Bearer ", ""))
            user_id = current_user.id
    except Exception as e:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        logger.warning(f"===> WebSocket authentication failed for {websocket.client.host}:{websocket.client.port}: {e}")
        return
    logger.info(f"===> User {user_id} connected to WebSocket.")
    try:
        await presence_manager.connect(str(user_id), websocket)

        while True:
            data = await websocket.receive_json()
            logger.info(f"===> Received message from user {user_id}: {data}")
            await presence_manager.handle_message(str(user_id), data)

    except WebSocketDisconnect:
        logger.info(f"===> User {user_id} disconnected.")

    except Exception as e:
        logger.error(f"===> Error in WebSocket connection for user {user_id}: {e}")

    finally:
        await presence_manager.disconnect(str(user_id), websocket)
        logger.info(f"===> User {user_id} disconnected. " f"Current status: {presence_manager.get_status(str(user_id))}")


