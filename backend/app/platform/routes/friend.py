from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.platform.deps import CurrentUser, SessionDep
from app.models.all import FriendsSuggested, Friend, FriendshipStatus
from uuid import uuid4


router = APIRouter(prefix="/friends", tags=["friends"])

@router.get("/suggested", response_model=FriendsSuggested)
async def get_suggested_friends(session: SessionDep, current_user: CurrentUser):
    friends=[Friend(id=uuid4(), name="John Doe", handle="johndoe", avatar=None, status=FriendshipStatus.PENDING),
             Friend(id=uuid4(), name="Jane Smith", handle="janesmith", avatar=None, status=FriendshipStatus.ACCEPTED),
             Friend(id=uuid4(), name="Alice Johnson", handle="alicejohnson", avatar=None, status=FriendshipStatus.PENDING)]
    return {"data": friends, "count": len(friends)}
