import logging
import math
from fastapi import APIRouter
from sqlmodel import select

from app.platform.service import userStatisticService
from app.platform.deps import CurrentUser, SessionDep
from app.models.all import UserPublic, UserStatistic, UserStatisticInfo, UserStatisticLevel

router = APIRouter(prefix="/static", tags=["static"])
logger = logging.getLogger("uvicorn.error")

@router.get("/maininfo")
async def get_main_info(session: SessionDep, current_user: CurrentUser) -> UserStatisticInfo:
    return userStatisticService.get_user_statistic_info(session=session, current_user=current_user)


@router.get("/staticdetails/")
async def get_static_details(session: SessionDep, current_user: CurrentUser):
    return userStatisticService.get_user_all_game_detail_records(session=session, current_user=current_user)

@router.get("/game/{game_id}/gameplayers")
async def get_game_players(session: SessionDep, current_user: CurrentUser, game_id: str):
    return userStatisticService.get_game_player_records(session=session, current_user=current_user, game_id=game_id)

@router.get("/leaderboard/friends")
async def get_friend_leaderboard(session: SessionDep, current_user: CurrentUser):
    friend_leaderboard = userStatisticService.get_friend_leaderboard(session=session, current_user=current_user)
    return friend_leaderboard


@router.get("/leaderboard/global")
async def get_global_leaderboard(session: SessionDep, current_user: CurrentUser):
    global_leaderboard = userStatisticService.get_global_leaderboard(session=session, current_user=current_user)
    return global_leaderboard
