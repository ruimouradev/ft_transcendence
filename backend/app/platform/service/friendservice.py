from sqlmodel import Session, select, and_, or_
from datetime import datetime, timezone
from uuid import UUID

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
        )).join(UserStatistic, User.id == UserStatistic.user_id, isouter=True
            ).where(or_(Friendship.status == FriendshipStatus.ACCEPTED, Friendship.status == FriendshipStatus.BLOCKED)).offset(skip).limit(limit)
    result = session.exec(statement).all()
    friends = []
    if result:
        for user, friendship, user_statistic in result:
            blocked = False
            if friendship.status == FriendshipStatus.BLOCKED:
                if friendship.requester_id == current_user.id and friendship.blocked_by_req:
                    blocked = True
                elif friendship.addressee_id == current_user.id and friendship.blocked_by_add:
                    blocked = True
                # else:
                #     continue  # Skip this friend if the current user is not the one who blocked the friendship
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


def add_friend(friend_id: UUID, session: Session, current_user: CurrentUser)-> Friendship:
    '''
    Add a friend by sending a friend request to another user.
    '''
    if friend_id == current_user.id:
        raise APIError(status_code=400, code=APIErrorCode.INVALID_OPERATION, msg="Cannot add yourself as a friend.")
    friendship = session.exec(
        select(Friendship).where((Friendship.addressee_id == friend_id) , (Friendship.requester_id == current_user.id))
    ).first()

    # if there is an existing friendship requested by the current user, cannot send another friend request
    if friendship:
        if friendship.status == FriendshipStatus.PENDING or friendship.status == FriendshipStatus.ACCEPTED:
            raise APIError(status_code=400, code=APIErrorCode.INVALID_OPERATION, msg="Friend request already sent or you are already friends.")
        elif friendship.status == FriendshipStatus.REJECTED or friendship.status == FriendshipStatus.BLOCKED:
            raise APIError(status_code=400, code=APIErrorCode.INVALID_OPERATION, msg="Cannot send friend request. The user has blocked or rejected your previous request.")

    friendship= session.exec(
        select(Friendship).where(Friendship.addressee_id == current_user.id , Friendship.requester_id == friend_id)
    ).first()
    # check if there is an existing friendship requested by the other user: if not, create a new friendship with status pending;
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
    # if yes, accept the friendship and set the status to accepted
    elif friendship.status in [FriendshipStatus.PENDING, FriendshipStatus.REJECTED, FriendshipStatus.BLOCKED]:
        if friendship.status==FriendshipStatus.BLOCKED and friendship.blocked_by_req:
            raise APIError(status_code=400, code=APIErrorCode.INVALID_OPERATION, msg="Cannot accept friend request. The user has blocked you.")
        friendship.status = FriendshipStatus.ACCEPTED
        session.add(friendship)
        session.commit()
        session.refresh(friendship)
        return friendship

    return friendship

def accept_friend(friend_id: str, status: FriendshipStatus, session: Session, current_user: CurrentUser)-> Friendship:
    '''
    Accept block/reject a friend request from another user.
    The logic is as follows:
    1. Only the accepted status can be blocked by the requester or addressee. If the status is not accepted, the block operation will not be allowed.
    2. If the status is accepted, the requester or addressee can block the friendship by setting the blocked_by_req or blocked_by_add flag to True.
    3. If want to set another status(ACCEPTED, REJECTED), the addressee can only set the status to ACCEPTED or REJECTED. The requester cannot set the status to ACCEPTED or REJECTED.
    4. If the status is ACCEPTED, the accepted_at field will be set to the current datetime in UTC.
    5. If the status is REJECTED, the friendship will be deleted from the database.
    6. If the status is BLOCKED, the friendship will remain in the database, but the blocked_by_req or blocked_by_add flag will be set to True.
    7. The function will return the updated friendship object.
    '''
    friendship = session.exec(select(Friendship).where(or_(
                                (Friendship.addressee_id == current_user.id) & (Friendship.requester_id == friend_id),
                                (Friendship.requester_id == current_user.id) & (Friendship.addressee_id == friend_id)
                            ))
                        ).first()
    if not friendship:
        raise APIError(status_code=404, code=APIErrorCode.FRIEND_REQUEST_NOT_FOUND, msg="No friendship request found.")
    new_status = None
    if status == FriendshipStatus.BLOCKED:
        if friendship.status == FriendshipStatus.REJECTED:
            raise APIError(status_code=400, code=APIErrorCode.INVALID_OPERATION, msg="Cannot block a rejected friendship.")
        if friendship.requester_id == current_user.id:
            friendship.blocked_by_req = True
        elif friendship.addressee_id == current_user.id:
            friendship.blocked_by_add = True
    else:   #status is ACCEPTED or REJECTED
        if friendship.status == FriendshipStatus.BLOCKED:
            if status != FriendshipStatus.ACCEPTED:
                raise APIError(status_code=400, code=APIErrorCode.INVALID_OPERATION, msg="Only accepted status can be applied to a blocked friendship.")            
            if friendship.requester_id == current_user.id and friendship.blocked_by_req:
                friendship.blocked_by_req = False
            elif friendship.addressee_id == current_user.id and friendship.blocked_by_add:
                friendship.blocked_by_add = False
            if friendship.blocked_by_req or friendship.blocked_by_add:
                new_status = FriendshipStatus.BLOCKED
        elif friendship.status == FriendshipStatus.PENDING:
            if friendship.addressee_id != current_user.id:
                raise APIError(status_code=400, code=APIErrorCode.INVALID_OPERATION, msg="Only the addressee can accept or reject a pending friend request.")
        elif friendship.status == FriendshipStatus.ACCEPTED:
            if friendship.addressee_id != current_user.id:
                raise APIError(status_code=400, code=APIErrorCode.INVALID_OPERATION, msg="Only the addressee can change the status of an accepted friendship.")
        elif friendship.status == FriendshipStatus.REJECTED:
            if friendship.addressee_id != current_user.id:
                raise APIError(status_code=400, code=APIErrorCode.INVALID_OPERATION, msg="Only the addressee can change the status of a rejected friendship.")
    friendship.status = new_status if new_status else status
    if friendship.status == FriendshipStatus.ACCEPTED:
        friendship.accepted_at = datetime.now(timezone.utc)
    session.add(friendship)
    session.commit()
    session.refresh(friendship)
    return friendship