import asyncio
import time
from typing import Any, Dict
from app.models.all import UserOnLineStatus
from fastapi import WebSocket
import logging

logger = logging.getLogger("uvicorn.error")

class InMemoryPresenceManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.statuses: Dict[str, str] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        
        self.active_connections[user_id] = websocket
        self.statuses[user_id] = "ONLINE"
        logger.info(f"=======================> User {user_id} connected.")

    async def disconnect(self, user_id: str, websocket: WebSocket | None=None, grace_period: int = 15):
        current_websocket = self.active_connections.get(user_id)
        if websocket is not None and current_websocket is not websocket:
            logger.warning(f"=======================> User {user_id} attempted to disconnect with a different websocket.")
            return
        if current_websocket is not None:
            del self.active_connections[user_id]
        
        self.statuses[user_id] = "OFFLINE"
        logger.info(f"=======================> User {user_id} disconnected.")

    def get_status(self, user_id: str) -> str:
        return self.statuses.get(user_id, "OFFLINE")

    def is_online(self, user_id: str) -> bool:
        return self.get_status(user_id) == "ONLINE"

    def log_user_statuses(self) -> Dict[str, str]:
        for user_id, status in self.statuses.items():
            logger.info(f"log user status=======================> User {user_id} status: {status}")

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

    async def send_personal_message(self, user_id: str, message: Dict[str, Any]):
        websocket = self.active_connections.get(user_id)
        if websocket:
            await websocket.send_json(message)

presence_manager = InMemoryPresenceManager()