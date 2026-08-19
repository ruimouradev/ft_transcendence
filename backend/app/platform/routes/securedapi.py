from uuid import UUID

from app.platform.deps import SessionDep, verify_api_key
from app.platform.service import userservice,userStatisticService
from app.models.all import APIError, APIErrorCode, UserGameDetail, UserOnLineStatus, UserStatisticInfo, UserStatisticLeaderboardEntry
from fastapi import APIRouter, Depends, HTTPException, status
from app.presence_manager import presence_manager

router = APIRouter(prefix="/secured", tags=["api"], dependencies=[Depends(verify_api_key)])

@router.get("/onlineplayers", response_model=list[UserOnLineStatus], summary="An secured API endpoint,get online players", description='''This endpoint requires a valid API key and client ID to access.

To obtain an API key and client ID, use the `/users/apikey` endpoint. Include the following headers in your request:
- `X-API-Key`: Your API key
- `X-Client-ID`: Your client ID
Example:
```
curl -X 'GET' \n
  'https://localhost:8443/api/v1/secured/onlineplayers' \n
  -H 'accept: application/json' \n
  -H 'X-Client-ID: your_client_id_here' \n
  -H 'X-API-Key: your_api_key_here\'''')
async def get_online_players():
    online_players = presence_manager.get_online_players()
    return online_players


@router.get("/userinfo/{user_id}", response_model=UserStatisticInfo, summary="An secured API endpoint, get specific user information", description='''Retrieve information about a specific user by their user ID. Requires a valid API key and client ID.
To obtain an API key and client ID, use the `/users/apikey` endpoint. Include the following headers in your request:
- `X-API-Key`: Your API key
- `X-Client-ID`: Your client ID
Example:
```
curl -X 'GET' \n
  'https://localhost:8443/api/v1/secured/userinfo/{user_id}' \n
  -H 'accept: application/json' \n
  -H 'X-Client-ID: your_client_id_here' \n
  -H 'X-API-Key: your_api_key_here'
''')
async def get_user_info(session: SessionDep, user_id: str):
    try:
        UUID(user_id, version=4)
    except ValueError:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Invalid user ID format. Must be a valid UUID.")
        # raise HTTPException(status_code=400, detail="Invalid user ID format. Must be a valid UUID.")

    user_info=userservice.get_user_by_id(session=session, user_id=user_id)
    if not user_info:
        raise APIError(status_code=404, code=APIErrorCode.USER_NOT_FOUND, msg="User not found")
        # raise HTTPException(status_code=404, detail="User not found")
    userStatisticInfo=userStatisticService.get_user_statistic_info(session=session, current_user=user_info)
    
    return userStatisticInfo

@router.get("/{user_id}/friendlistwithrank", response_model=list[UserStatisticLeaderboardEntry], summary="An secured API endpoint, get specific user friend list with rank", description='''Retrieve the friend list of a specific user along with their ranks. Requires a valid API key and client ID.
To obtain an API key and client ID, use the `/users/apikey` endpoint. Include the following headers in your request:
- `X-API-Key`: Your API key
- `X-Client-ID`: Your client ID
Example:
```
curl -X 'GET' \n
  'https://localhost:8443/api/v1/secured/{user_id}/friendlistwithrank' \n
  -H 'accept: application/json' \n
  -H 'X-Client-ID: your_client_id_here' \n
  -H 'X-API-Key: your_api_key_here'
''')
async def get_friend_list_with_rank(session: SessionDep, user_id: str):
    try:
        UUID(user_id, version=4)
    except ValueError:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Invalid user ID format. Must be a valid UUID.")

    user_info=userservice.get_user_by_id(session=session, user_id=user_id)
    if not user_info:
        raise APIError(status_code=404, code=APIErrorCode.USER_NOT_FOUND, msg="User not found")
    
    friend_list_with_rank=userStatisticService.get_friend_leaderboard(session=session, current_user=user_info)
    
    return friend_list_with_rank


@router.get("/globalrank", response_model=list[UserStatisticLeaderboardEntry], summary="An secured API endpoint, get global rank leaderboard", description='''Retrieve the global rank leaderboard. Requires a valid API key and client ID..
To obtain an API key and client ID, use the `/users/apikey` endpoint. Include the following headers in your request:
- `X-API-Key`: Your API key
- `X-Client-ID`: Your client ID
Example:
```
curl -X 'GET' \n
  'https://localhost:8443/api/v1/secured/globalrank' \n
  -H 'accept: application/json' \n
  -H 'X-Client-ID: your_client_id_here' \n
  -H 'X-API-Key: your_api_key_here'
''')
async def get_global_rank(session: SessionDep):
    global_rank=userStatisticService.get_global_leaderboard(session=session, current_user=None)
    return global_rank


@router.get("/gamehistory/{user_id}", response_model=list[UserGameDetail], summary="An secured API endpoint, get specific user game history", description='''Retrieve the game history of a specific user. Requires a valid API key and client ID.
To obtain an API key and client ID, use the `/users/apikey` endpoint. Include the following headers in your request:
- `X-API-Key`: Your API key
- `X-Client-ID`: Your client ID
Example:
```
curl -X 'GET' \n
  'https://localhost:8443/api/v1/secured/gamehistory/{user_id}' \n
  -H 'accept: application/json' \n
  -H 'X-Client-ID: your_client_id_here' \n
  -H 'X-API-Key: your_api_key_here'
''')
async def get_game_history(session: SessionDep, user_id: str):
    try:
        UUID(user_id, version=4)
    except ValueError:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Invalid user ID format. Must be a valid UUID.")

    user_info=userservice.get_user_by_id(session=session, user_id=user_id)
    if not user_info:
        raise APIError(status_code=404, code=APIErrorCode.USER_NOT_FOUND, msg="User not found")
    
    game_history=userStatisticService.get_user_all_game_detail_records(session=session, current_user=user_info)
    
    return game_history