import logging
from fastapi import APIRouter

from app.platform.service import userStatisticService
from app.platform.deps import CurrentUser, SessionDep
from app.models.all import Game, GamePlayer, GamePlayerDetail, UserGameDetail, UserStatisticInfo, UserStatisticLeaderboardEntry

router = APIRouter(prefix="/static", tags=["static"])
logger = logging.getLogger("uvicorn.error")

@router.get("/maininfo", response_model=UserStatisticInfo)
async def get_main_info(session: SessionDep, current_user: CurrentUser) -> UserStatisticInfo:
    return userStatisticService.get_user_statistic_info(session=session, current_user=current_user)


@router.get("/staticdetails",response_model=list[UserGameDetail])
async def get_static_details(session: SessionDep, current_user: CurrentUser):
    return userStatisticService.get_user_all_game_detail_records(session=session, current_user=current_user)


@router.get("/game/{game_id}/players",response_model=list[GamePlayerDetail])
async def get_game_players(session: SessionDep, current_user: CurrentUser, game_id: str):
    return userStatisticService.get_game_player_records(session=session, current_user=current_user, game_id=game_id)


@router.get("/leaderboard/friends", response_model=list[UserStatisticLeaderboardEntry])
async def get_friend_leaderboard(session: SessionDep, current_user: CurrentUser):
    friend_leaderboard = userStatisticService.get_friend_leaderboard(session=session, current_user=current_user)
    return friend_leaderboard


@router.get("/leaderboard/global", response_model=list[UserStatisticLeaderboardEntry])
async def get_global_leaderboard(session: SessionDep, current_user: CurrentUser):
    global_leaderboard = userStatisticService.get_global_leaderboard(session=session, current_user=current_user)
    return global_leaderboard

@router.post("/save_game_result")
async def save_game_result(session: SessionDep, current_user: CurrentUser, game:Game, game_players: list[GamePlayer]):
    userStatisticService.save_game_result(session=session, game=game, game_players=game_players)
    return {"message": "Game result saved successfully."}