from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, and_, or_
from app.platform.deps import CurrentUser, SessionDep
from app.models.all import Friends, Suggestions, Requests, Friend, FriendshipStatus, Friendship, User
from uuid import uuid4


router = APIRouter(prefix="/friends", tags=["friends"])

@router.get("/suggested", response_model=Suggestions)
async def get_suggested_friends(session: SessionDep, current_user: CurrentUser):
    statement = select(User).where(User.id != current_user.id,User.is_superuser == False,User.is_active == True,
                                    User.id.not_in(
                                        select(Friendship.addressee_id).where(Friendship.requester_id == current_user.id)
                                    ),
                                    User.id.not_in(
                                        select(Friendship.requester_id).where(Friendship.addressee_id == current_user.id)
                                    )).limit(10)
    users = session.exec(statement).all()
    user_requested = session.exec(
        select(User).join(Friendship, and_(User.id == Friendship.addressee_id, Friendship.status == FriendshipStatus.PENDING,Friendship.requester_id == current_user.id))
    ).all()

    friends = []
    if user_requested:
        friends.extend([Friend(id=user.id, name=user.full_name, handle=user.full_name, avatar=user.avatar, status=FriendshipStatus.PENDING) for user in user_requested])
    if users:
        friends.extend([Friend(id=user.id, name=user.full_name, handle=user.full_name, avatar=user.avatar, status=None) for user in users])

    return {"suggestions": friends, "count": len(friends)}


@router.get("/all", response_model=Friends)
async def get_all_friends(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 10):
    statement = select(User).join(Friendship, or_(
        (Friendship.requester_id == current_user.id) & (Friendship.addressee_id == User.id),
        (Friendship.addressee_id == current_user.id) & (Friendship.requester_id == User.id)
    )).where(Friendship.status == FriendshipStatus.ACCEPTED).offset(skip).limit(limit)
    users = session.exec(statement).all()
    friends = []
    if users:
        friends = [Friend(id=user.id, name=user.full_name, handle=user.full_name, avatar=user.avatar, status=FriendshipStatus.ACCEPTED) for user in users]

    return {"friends": friends, "count": len(friends)}

@router.get("/pending", response_model=Requests)
async def get_pending_friends(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 10):
    statement = select(User).join(Friendship, and_(Friendship.addressee_id == current_user.id,Friendship.requester_id == User.id)
        ).where(Friendship.status == FriendshipStatus.PENDING, User.is_superuser == False,User.is_active == True).offset(skip).limit(limit)
    users = session.exec(statement).all()
    friends = []
    if users:
        friends = [Friend(id=user.id, name=user.full_name, handle=user.full_name, avatar=user.avatar, status=FriendshipStatus.PENDING) for user in users]
    return {"requests": friends, "count": len(friends)}

@router.post("/add/{friend_id}")
async def add_friend(friend_id: str, session: SessionDep, current_user: CurrentUser):
    '''
    Add a friend by sending a friend request to another user.
    '''
    if friend_id == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot add yourself as a friend.")
    friendship = session.exec(
        select(Friendship).where((Friendship.addressee_id == friend_id) , (Friendship.requester_id == current_user.id))
    ).first()
    print("1================>",friendship)
    if friendship:
        if friendship.status == FriendshipStatus.PENDING or friendship.status == FriendshipStatus.ACCEPTED:
            raise HTTPException(status_code=400, detail="Friend request already sent or you are already friends.")
        elif friendship.status == FriendshipStatus.REJECTED or friendship.status == FriendshipStatus.BLOCKED:
            raise HTTPException(status_code=400, detail="Cannot send friend request. The user has blocked or rejected your previous request.")
        
    friendship= session.exec(
        select(Friendship).where(Friendship.addressee_id == current_user.id , Friendship.requester_id == friend_id)
    ).first()
    print("2================>",friendship)
    if friendship is None:
        new_friend = Friendship(
            requester_id=current_user.id,
            addressee_id=friend_id,
            status=FriendshipStatus.PENDING
        )
        session.add(new_friend)
        session.commit()
        session.refresh(new_friend)
        return new_friend
    elif friendship.status in [FriendshipStatus.PENDING, FriendshipStatus.REJECTED, FriendshipStatus.BLOCKED]:
        friendship.status = FriendshipStatus.ACCEPTED
        session.add(friendship)
        session.commit()
        session.refresh(friendship)
        return friendship

    return friendship

@router.post("/{friend_id}/{status}")
async def accept_friend(friend_id: str, status: FriendshipStatus, session: SessionDep, current_user: CurrentUser):
    '''
    Accept block/reject a friend request from another user.
    '''
    friendship = session.exec(
        select(Friendship).where(
            (Friendship.addressee_id == current_user.id) & (Friendship.requester_id == friend_id)
        )
    ).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found.")

    friendship.status = status
    session.add(friendship)
    session.commit()
    session.refresh(friendship)
    return friendship