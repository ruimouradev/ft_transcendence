from app.platform.routes import static
from fastapi import APIRouter

from app.platform.routes import user, login, friend
from app.platform.config import settings

api_router = APIRouter()
api_router.include_router(user.router)
api_router.include_router(friend.router)
api_router.include_router(login.router)
api_router.include_router(login.authRouter)
api_router.include_router(static.router)

