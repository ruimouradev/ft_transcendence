from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from app.platform.api import router as auth_router

app = FastAPI(title="ft_transcendence Uno API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.include_router(auth_router)

@app.get("/")
def home():
    return {"status": "Backend is running..."}
