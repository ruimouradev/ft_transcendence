from sqlmodel import Session, create_engine, SQLModel, select

from app.platform.service import userservice
from app.models.all import User, UserCreate
from app.platform.config import settings
from app.platform.security import generate_password

if settings.DMODE == "dev":
    engine = create_engine(settings.DATABASE_URL, echo=True)
else:
    engine = create_engine(settings.DATABASE_URL)

def init_db(session: Session)-> None:
    SQLModel.metadata.create_all(engine)

    bot_user_email = [{"email": "iamrobot1@localhost.com", "password": generate_password(), "nick_name": "Bot1", "is_superuser": False, "is_active": False},
                      {"email": "iamrobot2@localhost.com", "password": generate_password(), "nick_name": "Bot2", "is_superuser": False, "is_active": False},
                      {"email": "iamrobot3@localhost.com", "password": generate_password(), "nick_name": "Bot3", "is_superuser": False, "is_active": False}]
    for bot_user_data in bot_user_email:
        bot_user = session.exec(select(User).where(User.email == bot_user_data["email"])).first()
        if bot_user is None:
            bot_user_in = UserCreate(
                email=bot_user_data["email"],
                password=bot_user_data["password"],
                nick_name=bot_user_data["nick_name"],
                is_superuser=bot_user_data["is_superuser"],
                is_active=bot_user_data["is_active"]
            )
            bot_user = userservice.create_user(session=session, user_create=bot_user_in)