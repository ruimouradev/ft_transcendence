from fastapi import FastAPI
from fastapi.routing import APIRoute
from fastapi.middleware.cors import CORSMiddleware
from app.models.database import init_db, engine
from sqlmodel import Session
from app.platform.main import api_router

def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"

app = FastAPI(
    title="Uno API",
    openapi_url="/api/v1/openapi.json",
    # generate_unique_id_function=custom_generate_unique_id
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    with Session(engine) as session:
        init_db(session)
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def home():
    return {"status": "Backend is running."}
