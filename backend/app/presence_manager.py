import asyncio
import time
from typing import Any, Dict
from fastapi import WebSocket
import logging

logger = logging.getLogger("uvicorn.error")

class InMemoryPresenceManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.statuses: Dict[str, str] = {}
        self.last_seen: Dict[str, float] = {}
        self.cleanup_tasks: Dict[str, asyncio.Task] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id in self.cleanup_tasks:
            self.cleanup_tasks[user_id].cancel()
            del self.cleanup_tasks[user_id]

        self.active_connections[user_id] = websocket
        self.statuses[user_id] = "ONLINE"
        self.last_seen[user_id] = time.time()
        logger.info(f"=======================> User {user_id} connected.")

    def update_heartbeat(self, user_id: str):
        self.last_seen[user_id] = time.time()
        self.statuses[user_id] = "ONLINE"

    async def disconnect(self, user_id: str, grace_period: int = 15):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

        self.statuses[user_id] = "RECONNECTING"
        task = asyncio.create_task(self._wait_and_mark_offline(user_id, grace_period))
        self.cleanup_tasks[user_id] = task
        logger.info(f"=======================> User {user_id} disconnected.")

    async def _wait_and_mark_offline(self, user_id: str, delay: int):
        try:
            await asyncio.sleep(delay)
            self.statuses[user_id] = "OFFLINE"
            if user_id in self.last_seen:
                del self.last_seen[user_id]
        except asyncio.CancelledError:
            pass
        finally:
            self.cleanup_tasks.pop(user_id, None)

    def get_status(self, user_id: str) -> str:
        return self.statuses.get(user_id, "OFFLINE")

    def is_online(self, user_id: str) -> bool:
        return self.get_status(user_id) == "ONLINE"

    def log_user_statuses(self) -> Dict[str, str]:
        for user_id, status in self.statuses.items():
            logger.info(f"log user status=======================> User {user_id} status: {status}")

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