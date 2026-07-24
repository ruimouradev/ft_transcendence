from fastapi import APIRouter

from app.platform.routes import user, login
from app.platform.config import settings

api_router = APIRouter()
api_router.include_router(user.router)
api_router.include_router(login.router)

