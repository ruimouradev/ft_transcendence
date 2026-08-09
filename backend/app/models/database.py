import os

from sqlmodel import Session, create_engine, SQLModel, select

from app.platform.service import userservice
from app.models.all import User, UserCreate
from app.platform.config import settings

if settings.DMODE == "dev":
    engine = create_engine(settings.DATABASE_URL, echo=False)
else:
    engine = create_engine(settings.DATABASE_URL)

def init_db(session: Session)-> None:
    SQLModel.metadata.create_all(engine)

    user = session.exec(select(User).where(User.email == settings.FIRST_SUPERUSER)).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
            is_active=True
        )
        user = userservice.create_user(session=session, user_create=user_in)