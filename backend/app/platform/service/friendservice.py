from sqlmodel import Session, select, and_, or_
from datetime import datetime, timezone

from app.models.all import APIError, APIErrorCode, Friend, Friendship, FriendshipStatus, User, UserStatistic
from app.platform.deps import CurrentUser, SessionDep
from app.platform.service.userStatisticService import calculate_level_data
from app.presence_manager import presence_manager

    
def get_suggested_friends(session: Session, current_user: CurrentUser)-> list[Friend]:
    '''
    Get a list of suggested friends for the current user.
    A suggested friend is a user who is not the current user, is not a superuser, is active, and is not already a friend or has a pending friend request with the current user
    '''
    statement = select(User,UserStatistic).join(UserStatistic, User.id == UserStatistic.user_id, isouter=True).where(User.id != current_user.id,User.is_superuser == False,User.is_active == True,
                                    User.id.not_in(
                                        select(Friendship.addressee_id).where(Friendship.requester_id == current_user.id)
                                    ),
                                    User.id.not_in(
                                        select(Friendship.requester_id).where(Friendship.addressee_id == current_user.id)
                                    )).limit(42)
    users_result = session.exec(statement).all()
    user_requested_result = session.exec(
        select(User, UserStatistic).join(Friendship, and_(User.id == Friendship.addressee_id, Friendship.status == FriendshipStatus.PENDING,Friendship.requester_id == current_user.id)).join(UserStatistic, User.id == UserStatistic.user_id, isouter=True).where(User.is_superuser == False,User.is_active == True)
    ).all()

    friends = []
    if user_requested_result:
        friends.extend([Friend(id=user.id, nick_name=user.nick_name, handle=user.nick_name, avatar=user.avatar, status=FriendshipStatus.PENDING, level=calculate_level_data(user_statistic.total_score if user_statistic and user_statistic.total_score is not None else 0).current_level, title=calculate_level_data(user_statistic.total_score if user_statistic and user_statistic.total_score is not None else 0).title) for user, user_statistic in user_requested_result])
    if users_result:
        friends.extend([Friend(id=user.id, nick_name=user.nick_name, handle=user.nick_name, avatar=user.avatar, status=None, level=calculate_level_data(user_statistic.total_score if user_statistic and user_statistic.total_score is not None else 0).current_level, title=calculate_level_data(user_statistic.total_score if user_statistic and user_statistic.total_score is not None else 0).title) for user, user_statistic in users_result])

    return friends


def get_all_friends(session: Session, current_user: CurrentUser, skip: int = 0, limit: int = 10)-> list[Friend]:
    '''
    Get a list of all friends for the current user.
    A friend is a user who has an accepted friendship with the current user.
    '''
    statement = select(User, Friendship, UserStatistic).join(Friendship, or_(
        (Friendship.requester_id == current_user.id) & (Friendship.addressee_id == User.id),
        (Friendship.addressee_id == current_user.id) & (Friendship.requester_id == User.id)
    )).join(UserStatistic, User.id == UserStatistic.user_id, isouter=True).where(Friendship.status == FriendshipStatus.ACCEPTED).offset(skip).limit(limit)
    result = session.exec(statement).all()
    friends = []
    if result:
        for user, friendship, user_statistic in result:
            blocked = False
            if friendship.requester_id == current_user.id:
                blocked = bool(friendship.blocked_by_req)
            elif friendship.addressee_id == current_user.id:
                blocked = bool(friendship.blocked_by_add)
            friends.append(Friend(id=user.id, nick_name=user.nick_name, handle=user.nick_name, avatar=user.avatar, level=calculate_level_data(user_statistic.total_score if user_statistic and user_statistic.total_score is not None else 0).current_level, title=calculate_level_data(user_statistic.total_score if user_statistic and user_statistic.total_score is not None else 0).title, status=(FriendshipStatus.BLOCKED if blocked else FriendshipStatus.ACCEPTED), online=presence_manager.is_online(str(user.id))))

    return friends


def get_pending_friends(session: Session, current_user: CurrentUser, skip: int = 0, limit: int = 10)-> list[Friend]:
    '''
    Get a list of all pending friend requests for the current user.
    A pending friend request is a user who has sent a friend request to the current user, and the current user has not yet accepted or rejected the request.
    '''
    statement = select(User,UserStatistic).join(Friendship, and_(Friendship.addressee_id == current_user.id,Friendship.requester_id == User.id)
        ).join(UserStatistic, User.id == UserStatistic.user_id, isouter=True).where(Friendship.status == FriendshipStatus.PENDING, User.is_superuser == False,User.is_active == True).offset(skip).limit(limit)
    result = session.exec(statement).all()
    friends = []
    if result:
        for user, user_statistic in result:
            friends.append(Friend(id=user.id, nick_name=user.nick_name, handle=user.nick_name, avatar=user.avatar, level=calculate_level_data(user_statistic.total_score if user_statistic and user_statistic.total_score is not None else 0).current_level, title=calculate_level_data(user_statistic.total_score if user_statistic and user_statistic.total_score is not None else 0).title, status=FriendshipStatus.PENDING))

    return friends


def add_friend(friend_id: str, session: Session, current_user: CurrentUser)-> Friendship:
    '''
    Add a friend by sending a friend request to another user.
    '''
    if friend_id == str(current_user.id):
        raise APIError(status_code=400, code=APIErrorCode.INVALID_OPERATION, msg="Cannot add yourself as a friend.")
    friendship = session.exec(
        select(Friendship).where((Friendship.addressee_id == friend_id) , (Friendship.requester_id == current_user.id))
    ).first()

    if friendship:
        if friendship.status == FriendshipStatus.PENDING or friendship.status == FriendshipStatus.ACCEPTED:
            raise APIError(status_code=400, code=APIErrorCode.INVALID_OPERATION, msg="Friend request already sent or you are already friends.")
        elif friendship.status == FriendshipStatus.REJECTED or friendship.status == FriendshipStatus.BLOCKED:
            raise APIError(status_code=400, code=APIErrorCode.INVALID_OPERATION, msg="Cannot send friend request. The user has blocked or rejected your previous request.")

    friendship= session.exec(
        select(Friendship).where(Friendship.addressee_id == current_user.id , Friendship.requester_id == friend_id)
    ).first()

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

def accept_friend(friend_id: str, status: FriendshipStatus, session: Session, current_user: CurrentUser)-> Friendship:
    '''
    Accept block/reject a friend request from another user.
    '''
    if status == FriendshipStatus.BLOCKED:
        friendship = session.exec(
                select(Friendship).where(or_(
                    (Friendship.addressee_id == current_user.id) & (Friendship.requester_id == friend_id),
                    (Friendship.requester_id == current_user.id) & (Friendship.addressee_id == friend_id)
                ),Friendship.status == FriendshipStatus.ACCEPTED)
            ).first()
        if not friendship:
            raise APIError(status_code=404, code=APIErrorCode.FRIEND_REQUEST_NOT_FOUND, msg="No friendship request found.")
        if friendship.requester_id == current_user.id:
            friendship.blocked_by_req = not friendship.blocked_by_req
        elif friendship.addressee_id == current_user.id:
            friendship.blocked_by_add = not friendship.blocked_by_add
    else:
        friendship = session.exec(
                select(Friendship).where(
                    (Friendship.addressee_id == current_user.id) & (Friendship.requester_id == friend_id)
                )
            ).first()
        if not friendship:
            raise APIError(status_code=404, code=APIErrorCode.FRIEND_REQUEST_NOT_FOUND, msg="No friendship request found.")
        friendship.status = status
        if status == FriendshipStatus.ACCEPTED:
            friendship.accepted_at = datetime.now(timezone.utc)
    session.add(friendship)
    session.commit()
    session.refresh(friendship)
    return friendship