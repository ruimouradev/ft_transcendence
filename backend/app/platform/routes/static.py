from app.platform.deps import CurrentUser, SessionDep
from fastapi import APIRouter
import logging

router = APIRouter(prefix="/static", tags=["static"])
logger = logging.getLogger("uvicorn.error")

@router.get("/maininfo")
async def get_main_info(session: SessionDep, current_user: CurrentUser):
    return {"user": {"id": current_user.id, "full_name": current_user.full_name, "email": current_user.email, "avatar": current_user.avatar},
            "staticinfo":{"level":8, "xp": 1000, "next_level_xp": 2000, "total_rounds":42, "total_wins": 21, "total_losses": 21, "win_rate": 50.0}}


@router.get("/staticdetails/")
async def get_static_details(session: SessionDep, current_user: CurrentUser):
    return {"allrounds": [{"game_id": 1, "opponent": "tom,alice,joao", "result": "win", "score": "42", "date": "2023-01-01"},
                         {"game_id": 2, "opponent": "jerry,iron_man", "result": "loss", "score": "0", "date": "2023-01-02"},
                         {"game_id": 3, "opponent": "bruse,spider_man,sor", "result": "win", "score": "84", "date": "2023-01-03"}],
            }

@router.get("/leaderboard/friends")
async def get_friend_leaderboard(session: SessionDep, current_user: CurrentUser):
    friend_leaderboard={
        "friends": [
            {"rank":1,"id": 1, "full_name": "Alice", "avatar": "https://example.com/avatar1.png", "level": 10, "xp": 1500, "total_rounds": 30, "total_wins": 20, "total_losses": 10, "win_rate": 66.7},
            {"rank":2,"id": 2, "full_name": "Bob", "avatar": "https://example.com/avatar2.png", "level": 8, "xp": 1200, "total_rounds": 25, "total_wins": 15, "total_losses": 10, "win_rate": 60.0},
            {"rank":3,"id": 3, "full_name": "Charlie", "avatar": "https://example.com/avatar3.png", "level": 7, "xp": 1000, "total_rounds": 20, "total_wins": 12, "total_losses": 8, "win_rate": 60.0},
            {"rank":4,"id": 4, "full_name": "David", "avatar": "https://example.com/avatar4.png", "level": 6, "xp": 800, "total_rounds": 15, "total_wins": 10, "total_losses": 5, "win_rate": 66.7},
            {"rank":5,"id": 5, "full_name": "Eve", "avatar": "https://example.com/avatar5.png", "level": 5, "xp": 600, "total_rounds": 10, "total_wins": 6, "total_losses": 4, "win_rate": 60.0},
            {"rank":6,"id": 6, "full_name": "Frank", "avatar": "https://example.com/avatar6.png", "level": 4, "xp": 400, "total_rounds": 8, "total_wins": 5, "total_losses": 3, "win_rate": 62.5},
            {"rank":7,"id": 7, "full_name": "Grace", "avatar": "https://example.com/avatar7.png", "level": 3, "xp": 200, "total_rounds": 5, "total_wins": 3, "total_losses": 2, "win_rate": 60.0},
            {"rank":8,"id": 8, "full_name": "Heidi", "avatar": "https://example.com/avatar8.png", "level": 2, "xp": 100, "total_rounds": 3, "total_wins": 2, "total_losses": 1, "win_rate": 66.7},
            {"rank":9,"id": 9, "full_name": "Ivan", "avatar": "https://example.com/avatar9.png", "level": 1, "xp": 50, "total_rounds": 2, "total_wins": 1, "total_losses": 1, "win_rate": 50.0},
            {"rank":10,"id": 10, "full_name": "Judy", "avatar": "https://example.com/avatar10.png", "level": 1, "xp": 25, "total_rounds": 1, "total_wins": 0, "total_losses": 1, "win_rate": 0.0},
            {"rank":42,"id": 11, "full_name": "Kevin", "avatar": "https://example.com/avatar11.png", "level": 1, "xp": 10, "total_rounds": 1, "total_wins": 0, "total_losses": 1, "win_rate": 0.0},
        ]
    }
    return friend_leaderboard


@router.get("/leaderboard/global")
async def get_global_leaderboard(session: SessionDep, current_user: CurrentUser):
    global_leaderboard={
        "global": [
            {"rank":1,"id": 1, "full_name": "Alice", "avatar": "https://example.com/avatar1.png", "level": 10, "xp": 1500, "total_rounds": 30, "total_wins": 20, "total_losses": 10, "win_rate": 66.7},
            {"rank":2,"id": 2, "full_name": "Bob", "avatar": "https://example.com/avatar2.png", "level": 8, "xp": 1200, "total_rounds": 25, "total_wins": 15, "total_losses": 10, "win_rate": 60.0},
            {"rank":3,"id": 3, "full_name": "Charlie", "avatar": "https://example.com/avatar3.png", "level": 7, "xp": 1000, "total_rounds": 20, "total_wins": 12, "total_losses": 8, "win_rate": 60.0},
            {"rank":4,"id": 4, "full_name": "David", "avatar": "https://example.com/avatar4.png", "level": 6, "xp": 800, "total_rounds": 15, "total_wins": 10, "total_losses": 5, "win_rate": 66.7},
            {"rank":5,"id": 5, "full_name": "Eve", "avatar": "https://example.com/avatar5.png", "level": 5, "xp": 600, "total_rounds": 10, "total_wins": 6, "total_losses": 4, "win_rate": 60.0},
            {"rank":6,"id": 6, "full_name": "Frank", "avatar": "https://example.com/avatar6.png", "level": 4, "xp": 400, "total_rounds": 8, "total_wins": 5, "total_losses": 3, "win_rate": 62.5},
            {"rank":7,"id": 7, "full_name": "Grace", "avatar": "https://example.com/avatar7.png", "level": 3, "xp": 200, "total_rounds": 5, "total_wins": 3, "total_losses": 2, "win_rate": 60.0},
            {"rank":8,"id": 8, "full_name": "Heidi", "avatar": "https://example.com/avatar8.png", "level": 2, "xp": 100, "total_rounds": 3, "total_wins": 2, "total_losses": 1, "win_rate": 66.7},
            {"rank":9,"id": 9, "full_name": "Ivan", "avatar": "https://example.com/avatar9.png", "level": 1, "xp": 50, "total_rounds": 2, "total_wins": 1, "total_losses": 1, "win_rate": 50.0},
            {"rank":10,"id": 10, "full_name": "Judy", "avatar": "https://example.com/avatar10.png", "level": 1, "xp": 25, "total_rounds": 1, "total_wins": 0, "total_losses": 1, "win_rate": 0.0},
            {"rank":142,"id": 11, "full_name": "Kevin", "avatar": "https://example.com/avatar11.png", "level": 1, "xp": 10, "total_rounds": 1, "total_wins": 0, "total_losses": 1, "win_rate": 0.0},
        ]
    }
    return global_leaderboard
