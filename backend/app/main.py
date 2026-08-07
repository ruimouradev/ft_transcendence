import asyncio
import logging
import time

from app.presence_manager import presence_manager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.routing import APIRoute
from fastapi.middleware.cors import CORSMiddleware
from app.models.database import init_db, engine
from sqlmodel import Session
from app.platform.main import api_router
from app.platform.config import settings

def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0] if route.tags else 'default'}-{route.name}"

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.all_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.on_event("startup")
def on_startup():
    asyncio.create_task(check_heartbeat_timeouts())
    with Session(engine) as session:
        init_db(session)
    


app.include_router(api_router, prefix=f"{settings.API_V1_STR}")

@app.get("/", tags=["Root"], include_in_schema=False)
def home():
    return {"status": "Backend is running."}

class SuppressHealthCheckFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        return "GET / HTTP/1.1" not in record.getMessage()

# Attach the filter to Uvicorn's access logger
logging.getLogger("uvicorn.access").addFilter(SuppressHealthCheckFilter())
logger = logging.getLogger("uvicorn.error")

async def check_heartbeat_timeouts():
    while True:
        await asyncio.sleep(10)
        now = time.time()
        for user_id, last_ping in list(presence_manager.last_seen.items()):
            if presence_manager.get_status(user_id) == "ONLINE" and (now - last_ping) > 25:
                await presence_manager.disconnect(user_id, grace_period=10)

@app.websocket("/ws/game/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await presence_manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "PING":
                presence_manager.update_heartbeat(user_id)
                logger.info(f"=======================> Received PING from user {user_id}.")
                await websocket.send_json({"type": "PONG", "user_id": user_id})
            else:
                await presence_manager.handle_message(user_id, data)

    except WebSocketDisconnect:
        # Standard client disconnect (closed tab, navigate away, etc.)
        logger.info(f"=======================> User {user_id} disconnected.")

    except Exception as e:
        # Unexpected server or message processing error
        logger.error(f"=======================> Error in WebSocket connection for user {user_id}: {e}")

    finally:
        # Guaranteed cleanup regardless of how the loop exited
        await presence_manager.disconnect(user_id)
        logger.info(
            f"=======================> User {user_id} disconnected. "
            f"Current status: {presence_manager.get_status(user_id)}"
        )