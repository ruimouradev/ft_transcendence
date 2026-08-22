import math
import logging

from sqlmodel import select, func, or_
from app.platform.deps import CurrentUser, SessionDep
from app.models.all import APIError, APIErrorCode, GamePlayerDetail, User, UserGameDetail, UserPublic, UserStatistic, UserStatisticInfo, UserStatisticLeaderboardEntry, UserStatisticLevel, Game, GamePlayer, Friendship, FriendshipStatus

logger=logging.getLogger("uvicorn.error")

def calculate_level_data(total_xp: int) -> UserStatisticLevel:
    """
    Calculates level, progress, and thresholds based on total XP using
    the quadratic formula: Total XP = 50 * N^2 + 100 * N
    
    Args:
        total_xp (int): The total accumulated experience points of the player.
        
    Returns:
        UserStatisticLevel: An instance of UserStatisticLevel containing the calculated level data.
    """
    if total_xp < 0:
        total_xp = 0

    a, b, c = 50, 100, -total_xp
    
    discriminant = (b ** 2) - (4 * a * c)
    exact_level = (-b + math.sqrt(discriminant)) / (2 * a)
    
    current_level = int(exact_level)
    if current_level <= 5:
        title = "Rookie"
    elif current_level <= 10:
        title = "Challenger"
    elif current_level <= 20:
        title = "Contender"
    elif current_level <= 35:
        title = "Elite"
    elif current_level <= 50:
        title = "Master"
    elif current_level <= 75:
        title = "Grandmaster"
    else:
        title = "Legend"
    
    xp_for_current_level = 50 * (current_level ** 2) + 100 * current_level
    xp_for_next_level = 50 * ((current_level + 1) ** 2) + 100 * (current_level + 1)
    
    xp_in_current_level = total_xp - xp_for_current_level
    xp_needed_for_next_level = xp_for_next_level - xp_for_current_level
    
    progress_percentage = round((xp_in_current_level / xp_needed_for_next_level) * 100, 2)

    return UserStatisticLevel(
        current_level=current_level,
        total_xp=total_xp,
        xp_in_current_level=xp_in_current_level,
        xp_required_for_next_level=xp_needed_for_next_level,
        progress_percentage=progress_percentage,
        total_xp_for_next_level=xp_for_next_level,
        title=title
    )


def get_user_statistic_info_by_user_id(session: SessionDep, user_id: str) -> UserStatisticInfo:
    '''
    gets the user statistic info for a specific user by their user_id, including total games, wins, losses, total score, and level information.
    If the user statistic info does not exist, it creates a new entry with default values.
    '''
    userstatement = select(User).where(User.id == user_id)
    user = session.exec(userstatement).first()
    if not user:
        return None
    
    statement = select(UserStatistic).where(UserStatistic.user_id == user_id)
    user_xp_info = session.exec(statement).first()
    if not user_xp_info:
        user_xp_info = UserStatistic(user_id=user_id, total_games=0, wins=0, losses=0, total_score=0)
        session.add(user_xp_info)
        session.commit()
        session.refresh(user_xp_info)
    
    total_xp = user_xp_info.total_score
    level_data = calculate_level_data(int(total_xp))

    user = session.get(User, user_id)

    return UserStatisticInfo(
        user=UserPublic.model_validate(user),
        total_games=user_xp_info.total_games,
        wins=user_xp_info.wins,
        losses=user_xp_info.losses,
        total_score=total_xp,
        level_info=level_data
    )


def get_user_statistic_info(session: SessionDep, current_user: CurrentUser) -> UserStatisticInfo:
    '''
    gets the user statistic info for the current user, including total games, wins, losses, total score, and level information.
    If the user statistic info does not exist, it creates a new entry with default values.
    '''
    statement = select(UserStatistic).where(UserStatistic.user_id == current_user.id)
    user_xp_info = session.exec(statement).first()
    if not user_xp_info:
        user_xp_info = UserStatistic(user_id=current_user.id, total_games=0, wins=0, losses=0, total_score=0)
        session.add(user_xp_info)
        session.commit()
        session.refresh(user_xp_info)
    
    total_xp = user_xp_info.total_score
    level_data = calculate_level_data(int(total_xp))

    return UserStatisticInfo(
        user=UserPublic.model_validate(current_user),
        total_games=user_xp_info.total_games,
        wins=user_xp_info.wins,
        losses=user_xp_info.losses,
        total_score=total_xp,
        level_info=level_data
    )

def get_user_all_game_detail_records(session: SessionDep, current_user: CurrentUser):
    '''
    gets all the game detail records for the current user.
    '''
    statement = select(Game.id.label("game_id"),GamePlayer.is_winner,GamePlayer.score,Game.finished_at
        ).join(
            GamePlayer, GamePlayer.game_id == Game.id
        ).where(
            GamePlayer.user_id == current_user.id
        ).order_by(Game.created_at.desc())
    game_records = session.exec(statement).all()
    gameDetails = []
    for record in game_records:
        gameDetails.append(UserGameDetail(
            game_id=record.game_id,
            is_winner=record.is_winner,
            score=record.score,
            finished_at=record.finished_at
        ))
    return gameDetails


def get_game_player_records(session: SessionDep, current_user: CurrentUser, game_id: str):
    '''
    gets all the player records for a specific game.
    '''
    statement = select(User,GamePlayer).join(GamePlayer, GamePlayer.user_id == User.id).where(GamePlayer.game_id == game_id)
    game_player_records = session.exec(statement).all()
    game_player_details = []
    for user, game_player in game_player_records:
        game_player_details.append(GamePlayerDetail(
            id=user.id,
            nick_name=user.nick_name,
            avatar=user.avatar,
            is_winner=game_player.is_winner,
            score=game_player.score,
            seat=game_player.seat,
            remain_points=game_player.remain_points,
            cards_left=game_player.cards_left,
            is_connected=game_player.is_connected
        ))
    return game_player_details


def get_global_leaderboard(session: SessionDep, current_user: CurrentUser):
    '''
    gets the global leaderboard for all users.
    '''
    statement = select(User, UserStatistic
                       ).join(UserStatistic, User.id == UserStatistic.user_id
                              ).where(User.is_superuser == False,User.is_active == True
                                      ).order_by(UserStatistic.total_score.desc()
                                                 ).limit(42)
    leaderboard_records = session.exec(statement).all()
    leaderboard = []
    rank = 1
    for user, user_statistic in leaderboard_records:
        level_data = calculate_level_data(int(user_statistic.total_score))
        win_rate = (user_statistic.wins / user_statistic.total_games * 100) if user_statistic.total_games > 0 else 0.0
        leaderboard.append(UserStatisticLeaderboardEntry(
            rank=rank,
            user_id=user.id,
            nick_name=user.nick_name,
            avatar=user.avatar,
            level=level_data.current_level,
            xp=user_statistic.total_score,
            total_rounds=user_statistic.total_games,
            total_wins=user_statistic.wins,
            total_losses=user_statistic.losses,
            win_rate=round(win_rate, 2)
        ))
        rank += 1
        
    if current_user and current_user.id not in [entry.user_id for entry in leaderboard]:
        # Fetch the current user's statistics
        user_statistic = session.exec(select(UserStatistic).where(UserStatistic.user_id == current_user.id)).first()
        if user_statistic:
            level_data = calculate_level_data(int(user_statistic.total_score))
            win_rate = (user_statistic.wins / user_statistic.total_games * 100) if user_statistic.total_games > 0 else 0.0
            # Calculate the rank of the current user
            rank_statement = select(func.count()).select_from(UserStatistic).where(UserStatistic.total_score > user_statistic.total_score)
            rank = session.exec(rank_statement).one() + 1
            leaderboard.append(UserStatisticLeaderboardEntry(
                rank=rank,
                user_id=current_user.id,
                nick_name=current_user.nick_name,
                avatar=current_user.avatar,
                level=level_data.current_level,
                xp=user_statistic.total_score,
                total_rounds=user_statistic.total_games,
                total_wins=user_statistic.wins,
                total_losses=user_statistic.losses,
                win_rate=round(win_rate, 2)
            ))
    return leaderboard

def get_friend_leaderboard(session: SessionDep, current_user: CurrentUser):
    '''
    gets the friend leaderboard for the current user.
    '''
    statement = select(User, UserStatistic
                       ).join(UserStatistic, User.id == UserStatistic.user_id
                              ).where(
                                        User.is_superuser == False,
                                        User.is_active == True,
                                        # User.id != current_user.id,
                                        or_(
                                            User.id == current_user.id,
                                        User.id.in_(
                                            select(User.id).join(Friendship, or_(
                                                (Friendship.requester_id == current_user.id) & (Friendship.addressee_id == User.id),
                                                (Friendship.addressee_id == current_user.id) & (Friendship.requester_id == User.id)
                                            )).where(Friendship.status == FriendshipStatus.ACCEPTED)
                                        ))
                                    ).order_by(UserStatistic.total_score.desc())
    leaderboard_records = session.exec(statement).all()
    leaderboard = []
    rank = 1
    for user, user_statistic in leaderboard_records:
        level_data = calculate_level_data(int(user_statistic.total_score))
        win_rate = (user_statistic.wins / user_statistic.total_games * 100) if user_statistic.total_games > 0 else 0.0
        leaderboard.append(UserStatisticLeaderboardEntry(
            rank=rank,
            user_id=user.id,
            nick_name=user.nick_name,
            avatar=user.avatar,
            level=level_data.current_level,
            xp=user_statistic.total_score,
            total_rounds=user_statistic.total_games,
            total_wins=user_statistic.wins,
            total_losses=user_statistic.losses,
            win_rate=round(win_rate, 2)
        ))
        rank += 1
    return leaderboard

def save_game_result(session:SessionDep, game:Game, game_players: list[GamePlayer]):
    '''
    saves the game result for all players in the game.
    Game need with the state of finished and the created_at and finished_at timestamp set.
    GamePlayers need to have all other fields set except the game_id field.
    '''

    game_in_db=session.exec(select(Game).where(Game.id == game.id)).first()
    if game_in_db:
        raise APIError(status_code=500,code=APIErrorCode.GAME_ALREADY_EXISTS, msg="Game already exists.")

    session.add(game)

    for player in game_players:
        player.game_id = game.id
        session.add(player)
        user_statistic = session.exec(select(UserStatistic).where(UserStatistic.user_id == player.user_id)).first()
        if user_statistic is None:
            user_statistic = UserStatistic(user_id=player.user_id)
        
        user_statistic.total_games += 1
        user_statistic.total_score += player.score

        if player.is_winner:
            user_statistic.wins += 1
        else:
            user_statistic.losses += 1
        
        session.add(user_statistic)
    
    session.commit()