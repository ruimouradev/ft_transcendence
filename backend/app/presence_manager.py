from collections import defaultdict
from typing import Any, Dict, Set
from app.models.all import UserOnLineStatus
from fastapi import WebSocket
import logging

logger = logging.getLogger("uvicorn.error")

class InMemoryPresenceManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        self.statuses: Dict[str, str] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id].add(websocket)
        self.statuses[user_id] = "ONLINE"
        logger.info(f"=======================> User {user_id} connected.Current connections: {len(self.active_connections[user_id])}")

    async def disconnect(self, user_id: str, websocket: WebSocket | None=None):
        current_websockets = self.active_connections.get(user_id)
        if websocket is not None and websocket not in current_websockets:
            logger.warning(f"=======================> User {user_id} attempted to disconnect with a different websocket.")
            return
        if current_websockets is not None:
            current_websockets.discard(websocket)
            logger.info(f"=======================> User {user_id} disconnected a websocket. Remaining connections: {len(current_websockets)}")
            if not current_websockets:
                del self.active_connections[user_id]
                self.statuses[user_id] = "OFFLINE"
                logger.info(f"=======================> User {user_id} disconnected.")
        

    def get_status(self, user_id: str) -> str:
        return self.statuses.get(user_id, "OFFLINE")

    def is_online(self, user_id: str) -> bool:
        return self.get_status(user_id) == "ONLINE"

    def get_online_players(self) -> list[UserOnLineStatus]:
        online_players = [UserOnLineStatus(user_id=user_id, online="ONLINE") for user_id, status in self.statuses.items() if status == "ONLINE"]
        logger.info(f"=======================> Online players: {online_players}")
        return online_players

    async def handle_message(self, user_id: str, data: Dict[str, Any]):
        msg_type = data.get("type")

        if msg_type == "PLAY_CARD":
            card = data.get("card")
            logger.info(f"logger=======================>User {user_id} played card: {card}")
            # Handle UNO game logic or broadcast to other players...

        else:
            logger.warning(f"logger=======================>Unknown message type received from {user_id}: {data}")

presence_manager = InMemoryPresenceManager()