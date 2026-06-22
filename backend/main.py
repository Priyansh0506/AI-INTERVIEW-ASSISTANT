from dotenv import load_dotenv
load_dotenv()

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.question import router as question_router
from routes.evaluate import router as evaluate_router
from routes.session import router as session_router
from routes.auth import router as auth_router
from routes.report import router as report_router
from routes.report_actions import router as report_actions_router
from routes.whisper import router as whisper_router
from database.db import init_db


# create the app
app = FastAPI(title="AI Interview Assistant")

# create database tables on startup
@app.on_event("startup")
def startup():
    init_db()

# allow frontend to talk to backend
# in production, set ALLOWED_ORIGINS in .env (comma-separated, e.g. https://yourapp.com)
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,https://ai-interview-assistant-umber.vercel.app,https://ai-interview-assistant-git-main-priyansh12.vercel.app"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# connect routes
app.include_router(question_router)
app.include_router(session_router)
app.include_router(report_router)
app.include_router(report_actions_router)
app.include_router(evaluate_router)
app.include_router(whisper_router)
app.include_router(auth_router)


# home route
@app.get("/")
def home():
    return {"message": "AI Interview Assistant is running!"}