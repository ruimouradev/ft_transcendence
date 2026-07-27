from fastapi import FastAPI
from fastapi.routing import APIRoute
from fastapi.middleware.cors import CORSMiddleware
from app.models.database import init_db, engine
from sqlmodel import Session
from app.platform.main import api_router
from app.platform.config import settings

from app.platform.service.mailservice import send_email
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr

def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    with Session(engine) as session:
        init_db(session)


app.include_router(api_router, prefix=f"{settings.API_V1_STR}")

@app.get("/", tags=["Root"], include_in_schema=False)
def home():
    return {"status": "Backend is running."}

@app.get("/api/v1/send_mail", tags=["Mail"], include_in_schema=True)
async def send_mail(email: EmailStr):
    template = """
        <html>
        <body>
        <p>Hi !!!
        <br>Thanks for using fastapi mail, keep using it..!!!</p>
        </body>
        </html>
        """
    await send_email(email, template)
    return JSONResponse(status_code=200, content={"message": "email has been sent"})

