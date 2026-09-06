from app.platform.deps import SessionDep, verify_api_key
from app.platform.service import userservice,userStatisticService
from app.models.all import APIError, APIErrorCode, UserGameDetail, UserOnLineStatus, UserStatisticInfo, UserStatisticLeaderboardEntry, uuid_check
from fastapi import APIRouter, Depends
from app.presence_manager import presence_manager

router = APIRouter(prefix="/secured", tags=["api"], dependencies=[Depends(verify_api_key)])

@router.get("/onlineplayers", response_model=list[UserOnLineStatus], summary="Get the online players", description=''' ## Retrieve a list of online players. Requires a valid API key and client ID.''')
def get_online_players():
    online_players = presence_manager.get_online_players()
    return online_players


@router.get("/userinfo/{user_id}", response_model=UserStatisticInfo, summary="Get the information of one user", description=''' ## Retrieve information about a specific user by their user ID. Requires a valid API key and client ID.''')
def get_user_info(session: SessionDep, user_id: str):
    uuid_check(user_id, msg_str="Invalid user ID format. Must be a valid UUID.")

    user_info=userservice.get_user_by_id(session=session, user_id=user_id)
    if not user_info:
        raise APIError(status_code=404, code=APIErrorCode.USER_NOT_FOUND, msg="User not found")
    userStatisticInfo=userStatisticService.get_user_statistic_info(session=session, current_user=user_info)
    # Clear the email field to avoid exposing sensitive information
    userStatisticInfo.user.email="";
    
    return userStatisticInfo

@router.get("/{user_id}/friendlistwithrank", response_model=list[UserStatisticLeaderboardEntry], summary="Get the friend list of one user with their rank", description=''' ## Retrieve the friend list of a specific user along with their ranks. Requires a valid API key and client ID.''')
def get_friend_list_with_rank(session: SessionDep, user_id: str):
    uuid_check(user_id, msg_str="Invalid user ID format. Must be a valid UUID.")

    user_info=userservice.get_user_by_id(session=session, user_id=user_id)
    if not user_info:
        raise APIError(status_code=404, code=APIErrorCode.USER_NOT_FOUND, msg="User not found")
    
    friend_list_with_rank=userStatisticService.get_friend_leaderboard(session=session, current_user=user_info)
    
    return friend_list_with_rank


@router.get("/globalrank", response_model=list[UserStatisticLeaderboardEntry], summary="Get the global leaderboard", description=''' ## Retrieve the global rank leaderboard. Requires a valid API key and client ID.''')
def get_global_rank(session: SessionDep):
    global_rank=userStatisticService.get_global_leaderboard(session=session, current_user=None)
    return global_rank


@router.get("/gamehistory/{user_id}", response_model=list[UserGameDetail], summary="Get the game history of one user", description=''' ## Retrieve the game history of a specific user. Requires a valid API key and client ID.''')
def get_game_history(session: SessionDep, user_id: str):
    uuid_check(user_id, msg_str="Invalid user ID format. Must be a valid UUID.")

    user_info=userservice.get_user_by_id(session=session, user_id=user_id)
    if not user_info:
        raise APIError(status_code=404, code=APIErrorCode.USER_NOT_FOUND, msg="User not found")
    
    game_history=userStatisticService.get_user_all_game_detail_records(session=session, current_user=user_info)
    
    return game_history