import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile
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
    Message,
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

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UsersPublic,
)
def read_users(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve users.
    """

    count_statement = select(func.count()).select_from(User)
    count = session.exec(count_statement).one()

    statement = (
        select(User).order_by(col(User.created_at).desc()).offset(skip).limit(limit)
    )
    users = session.exec(statement).all()

    users_public = [UserPublic.model_validate(user) for user in users]
    return UsersPublic(data=users_public, count=count)


@router.post(
    "/", dependencies=[Depends(get_current_active_superuser)], response_model=UserPublic
)
def create_user(*, session: SessionDep, user_in: UserCreate) -> Any:
    """
    Create new user.
    """
    user = userservice.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    user = userservice.create_user(session=session, user_create=user_in)
    if settings.EMAILS_ENABLED and user_in.email:
        token = create_verification_token(user_in.email)
        background_tasks.add_task(send_new_account_activation_email, user_in.email, user_in.username, token)
    return user


@router.patch("/me", response_model=UserPublic)
def update_user_me(
    *, session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
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
def update_password_me(
    *, session: SessionDep, body: UpdatePassword, current_user: CurrentUser
) -> Any:
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
    return Message(message="Password updated successfully")


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> Any:
    """
    Get current user.
    """
    return current_user


@router.delete("/me", response_model=Message)
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Delete own user.
    """
    if current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    session.delete(current_user)
    session.commit()
    return Message(message="User deleted successfully")


@router.post("/signup", response_model=UserPublic)
def register_user(session: SessionDep, user_in: UserRegister, background_tasks: BackgroundTasks) -> Any:
    """
    Create new user without the need to be logged in.
    """
    user = userservice.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    user_create = UserCreate.model_validate(user_in)
    user = userservice.create_user(session=session, user_create=user_create)
    if settings.EMAILS_ENABLED and user_in.email:
        token = create_verification_token(user_in.email)
        background_tasks.add_task(send_new_account_activation_email, user_in.email, user_in.full_name, token)
    return user

@router.get("/verify-email")
def verify_email(session: SessionDep, token: str):
    """
    Verify the user's email address using the provided token.
    If the token is valid, the user's account will be activated.
    """

    email = verify_token(token)
    user = userservice.get_user_by_email(session=session, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_active:
        return {"message": "Email already verified. No action needed."}

    user.is_active = True
    session.add(user)
    session.commit()

    return {"message": "Email verification successful! Account has been activated."}

@router.get("/{user_id}", response_model=UserPublic)
def read_user_by_id(
    user_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
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


@router.patch(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
)
def update_user(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    user_in: UserUpdate,
) -> Any:
    """
    Update a user.
    """

    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    if user_in.email:
        existing_user = userservice.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )

    db_user = userservice.update_user(session=session, db_user=db_user, user_in=user_in)
    return db_user


@router.delete("/{user_id}", dependencies=[Depends(get_current_active_superuser)])
def delete_user(
    session: SessionDep, current_user: CurrentUser, user_id: uuid.UUID
) -> Message:
    """
    Delete a user.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    # statement = delete(Item).where(col(Item.owner_id) == user_id)
    # session.exec(statement)
    session.delete(user)
    session.commit()
    return Message(message="User deleted successfully")

#UploadFile
@router.post("/uploadfile")
async def upload_file(file: UploadFile, session: SessionDep, current_user: CurrentUser):
    if file.content_type not in ["image/jpeg", "image/png"]:
        return {"error": "Invalid file type. Only JPEG and PNG are allowed."}

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
            return {"error": "File size exceeds the limit of 3MB."}
    
    await file.seek(0)
    content = await file.read()
    
    with open(uploaddir / file.filename, "wb") as f:
        f.write(content)

    userservice.update_user(session=session, db_user=current_user, user_in=UserUpdate(avatar=f"/static/{current_user.id.hex}/{file.filename}"))
    return {"filename": file.filename, "file_size": len(content), "url": f"https://localhost:8443/static/{current_user.id.hex}/{file.filename}"}
