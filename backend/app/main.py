import asyncio
import logging

from app.presence_manager import check_heartbeat_timeouts
from app.models.all import APIError, ErrorResponse
from app.platform.service.userservice import get_robot_user_list
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.routing import APIRoute
from fastapi.middleware.cors import CORSMiddleware
from app.models.database import init_db, engine
from sqlmodel import Session
from app.platform.main import api_router
from app.platform.config import settings
from prometheus_fastapi_instrumentator import Instrumentator
from app.realtime.ws import router as game_router
from app.platform.routes.user import user_presence_router
from contextlib import asynccontextmanager
from app.robots_manager import robots_user_manager

def custom_generate_unique_id(route: APIRoute) -> str:
    tag = route.tags[0] if route.tags else "default"
    return f"{tag}-{route.name}"

# logger = logging.getLogger("uvicorn.error")

@asynccontextmanager
async def lifespan(app: FastAPI):
    with Session(engine) as session:
        init_db(session)
        robots_user_manager.set_robots(get_robot_user_list(session=session))

    heartbeat_task = asyncio.create_task(check_heartbeat_timeouts())

    yield

    heartbeat_task.cancel()
    try:
        await heartbeat_task
    except asyncio.CancelledError:
        pass

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json", generate_unique_id_function=custom_generate_unique_id, lifespan=lifespan)

Instrumentator().instrument(app).expose(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.all_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(api_router, prefix=f"{settings.API_V1_STR}")
app.include_router(game_router)
app.include_router(user_presence_router)

# Health check endpoint
@app.get("/", tags=["Root"], include_in_schema=False)
def home():
    return {"status": "Backend is running."}

# filter out health check logs from uvicorn.access
class SuppressHealthCheckFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        return "GET / HTTP/1.1" not in record.getMessage()

logging.getLogger("uvicorn.access").addFilter(SuppressHealthCheckFilter())


async def check_heartbeat_timeouts():
    try:
        while True:
            await asyncio.sleep(10)
            now = time.time()
            for user_id, last_ping in list(presence_manager.last_seen.items()):
                if presence_manager.get_status(user_id) == "ONLINE" and (now - last_ping) > 25:
                    await presence_manager.disconnect(user_id, grace_period=10)
    except asyncio.CancelledError:
        raise

@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError)-> ErrorResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.code, "message": exc.message, "details": exc.details}
    )