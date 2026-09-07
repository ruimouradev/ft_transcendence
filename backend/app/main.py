import logging

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

logger = logging.getLogger("uvicorn.error")

@asynccontextmanager
async def lifespan(app: FastAPI):
    with Session(engine) as session:
        init_db(session)
        robots_user_manager.set_robots(get_robot_user_list(session=session))

    yield

    logger.info("!!!!!!!!!!Shutting down the application!!!!!!!!!!!")

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json", generate_unique_id_function=custom_generate_unique_id, lifespan=lifespan, 
              description="""
## UNO Online Game API

This API provides functionality for:

- get all online users
- get user information
- get all friends of a user with rankings
- get global leaderboard
- get history of all games played by a user

### Authentication

#### Every endpoint requires a valid API key and client ID.

To obtain an API key and client ID, get the apikey through the [API key] page. Include the following headers in your request:
- `X-API-Key`: Your API key (get from apikey request page)
- `X-Client-ID`: Your client ID (get from apikey request page)

#### Example:
``` shell
curl -X 'GET' \
  'https://localhost:8443/api/v1/secured/onlineplayers' \
  -H 'accept: application/json' \
  -H 'X-Client-ID: your_client_id_here' \
  -H 'X-API-Key: your_api_key_here'
```

""",)

Instrumentator().instrument(app).expose(app, include_in_schema=False)

# the browser talks to us through nginx, the cookie must travel with it
cors = dict(allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.add_middleware(CORSMiddleware, allow_origins=settings.all_cors_origins, **cors)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(api_router, prefix=f"{settings.API_V1_STR}")
app.include_router(game_router, include_in_schema=False)
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

@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError)-> ErrorResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.code, "message": exc.message, "details": exc.details}
    )