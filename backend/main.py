from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.question import router as question_router
from routes.evaluate import router as evaluate_router
from routes.session import router as session_router
from database.db import init_db
from routes.report import router as report_router

# create the app
app = FastAPI(title="AI Interview Assistant")

# create database tables on startup
@app.on_event("startup")
def startup():
    init_db()

# allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# connect routes
app.include_router(question_router)
app.include_router(session_router)
app.include_router(report_router)
app.include_router(evaluate_router)

# home route
@app.get("/")
def home():
    return {"message": "AI Interview Assistant is running!"}