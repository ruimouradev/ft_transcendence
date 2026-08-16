from datetime import datetime, timezone
import logging

from app.platform.service.userStatisticService import calculate_level_data
from app.platform.service import friendservice
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, and_, or_
from app.platform.deps import CurrentUser, SessionDep
from app.models.all import Friends, Suggestions, Requests, Friend, FriendshipStatus, Friendship, User, UserStatistic
from uuid import UUID, uuid4
from app.presence_manager import presence_manager


router = APIRouter(prefix="/friends", tags=["friends"])
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
async def get_all_friends(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 10):
    '''
    Get a list of all friends for the current user.
    '''
    
    friends = friendservice.get_all_friends(session=session, current_user=current_user, skip=skip, limit=limit)
    return {"friends": friends, "count": len(friends)}

@router.get("/pending", response_model=Requests)
async def get_pending_friends(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 10):
    '''
    Get a list of all pending friend requests for the current user.
    '''
    friends = friendservice.get_pending_friends(session=session, current_user=current_user, skip=skip, limit=limit)
    return {"requests": friends, "count": len(friends)}

@router.post("/add/{friend_id}", response_model=Friendship)
async def add_friend(friend_id: str, session: SessionDep, current_user: CurrentUser):
    '''
    Send a friend request to another user.
    '''
    friendship = friendservice.add_friend(friend_id=friend_id, session=session, current_user=current_user)

    return friendship

@router.post("/{friend_id}/{status}")
async def accept_friend(friend_id: str, status: FriendshipStatus, session: SessionDep, current_user: CurrentUser):
    '''
    Accept, block, or reject a friend request from another user.
    '''
    friendship = friendservice.accept_friend(friend_id=friend_id, status=status, session=session, current_user=current_user)
    
    return friendship