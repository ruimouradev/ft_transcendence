from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.routing import APIRoute
from fastapi.middleware.cors import CORSMiddleware
from app.models.database import init_db, engine
from sqlmodel import Session
from app.platform.main import api_router
from app.platform.config import settings
from prometheus_fastapi_instrumentator import Instrumentator

from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr

def custom_generate_unique_id(route: APIRoute) -> str:
    tag = route.tags[0] if route.tags else "default"
    return f"{tag}-{route.name}"

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id
)

Instrumentator().instrument(app).expose(app)

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
    with Session(engine) as session:
        init_db(session)


app.include_router(api_router, prefix=f"{settings.API_V1_STR}")

@app.get("/", tags=["Root"], include_in_schema=False)
def home():
    return {"status": "Backend is running."}

