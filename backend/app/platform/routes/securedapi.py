from uuid import UUID

from app.platform.deps import SessionDep, verify_api_key
from app.platform.service import userservice,userStatisticService
from app.models.all import UserStatisticInfo
from fastapi import APIRouter, Depends, HTTPException, status
from app.presence_manager import presence_manager

router = APIRouter(prefix="/secured", tags=["api"])

@router.get("/onlineplayers",dependencies=[Depends(verify_api_key)],summary="An secured API endpoint,get online players", description='''This endpoint requires a valid API key and client ID to access.

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
async def get_online_players(user_id: str = Depends(verify_api_key)):
    online_players = presence_manager.get_online_players()
    return online_players


@router.get("/userinfo/{user_id}", dependencies=[Depends(verify_api_key)], response_model=UserStatisticInfo, summary="An secured API endpoint, get specific user information", description='''Retrieve information about a specific user by their user ID. Requires a valid API key and client ID.
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
async def get_user_info(session: SessionDep, user_id: str, api_key: str = Depends(verify_api_key)):
    try:
        UUID(user_id, version=4)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format. Must be a valid UUID.")

    user_info=userservice.get_user_by_id(session=session, user_id=user_id)
    if not user_info:
        raise HTTPException(status_code=404, detail="User not found")
    userStatisticInfo=userStatisticService.get_user_statistic_info(session=session, current_user=user_info)
    
    return userStatisticInfo