import logging

from app.platform.service import friendservice
from fastapi import APIRouter, Query
from app.platform.deps import CurrentUser, SessionDep
from app.models.all import APIError, APIErrorCode, Friends, Suggestions, Requests, FriendshipStatus, Friendship, uuid_check

router = APIRouter(prefix="/friends", tags=["friends"] ,include_in_schema=False)
logger = logging.getLogger("uvicorn.error")

@router.get("/suggested", response_model=Suggestions)
async def get_suggested_friends(session: SessionDep, current_user: CurrentUser):
    '''
    Get a list of suggested friends for the current user.
    A suggested friend is a user who is not the current user, is not a superuser, is active, and is not already a friend or has a pending friend request with the current user
    '''

    friends = friendservice.get_suggested_friends(session=session, current_user=current_user)

    return {"suggestions": friends, "count": len(friends)}


@router.get("/all", response_model=Friends)
async def get_all_friends(session: SessionDep, current_user: CurrentUser, skip: int = Query(default=0, ge=0), limit: int = Query(default=10, ge=1, le=100)):
    '''
    Get a list of all friends for the current user.
    '''
    
    friends = friendservice.get_all_friends(session=session, current_user=current_user, skip=skip, limit=limit)

    return {"friends": friends, "count": len(friends)}

@router.get("/pending", response_model=Requests)
async def get_pending_friends(session: SessionDep, current_user: CurrentUser, skip: int = Query(default=0, ge=0), limit: int = Query(default=10, ge=1, le=100)):
    '''
    Get a list of all pending friend requests for the current user.
    '''

    friends = friendservice.get_pending_friends(session=session, current_user=current_user, skip=skip, limit=limit)

    return {"requests": friends, "count": len(friends)}

@router.post("/add/{friend_id}", response_model=Friendship)
async def add_friend(friend_id: str, session: SessionDep, current_user: CurrentUser):
    '''
    Send a friend request to another user.
    the logic is as follows:
    1. Check if the friend_id is a valid UUID.
    2. Check if the friend_id is the same as the current user's id. If so, raise an error.
    3. Check if there is an existing friendship requested by the current user. If so, raise an error.
    4. Check if there is an existing friendship requested by the other user. If not, create a new friendship with status pending. If yes, accept the friendship and set the status to accepted.
    5. Return the friendship object.
    '''
    uuid_friend_id=uuid_check(friend_id, msg_str="Invalid friend ID format. Must be a valid UUID.")

    friendship = friendservice.add_friend(friend_id=uuid_friend_id, session=session, current_user=current_user)

    return friendship

@router.post("/{friend_id}/{status}")
async def accept_friend(friend_id: str, status: FriendshipStatus, session: SessionDep, current_user: CurrentUser):
    '''
    Accept, block, or reject a friend request from another user.
    the logic is as follows:
    1. Check if the friend_id is a valid UUID.
    2. Check if the status is one of the valid statuses (ACCEPTED, BLOCKED, REJECTED). If not, raise an error.
    3. Call the friendservice.accept_friend function to update the friendship status.
    4. Return the updated friendship object
    '''
    uuid_friend_id=uuid_check(friend_id, msg_str="Invalid friend ID format. Must be a valid UUID.")
    
    if status not in [FriendshipStatus.ACCEPTED, FriendshipStatus.BLOCKED, FriendshipStatus.REJECTED]:
        raise APIError(status_code=400, code=APIErrorCode.BAD_REQUEST, msg="Invalid friendship status.")

    friendship = friendservice.accept_friend(friend_id=uuid_friend_id, status=status, session=session, current_user=current_user)
    
    return friendship