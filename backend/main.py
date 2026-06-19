from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.question import router as question_router
from routes.evaluate import router as evaluate_router
from routes.session import router as session_router
from routes.auth import router as auth_router
from database.db import init_db
from routes.report import router as report_router
from routes.whisper import router as whisper_router
from fastapi.responses import FileResponse
from utils.pdf_report import generate_pdf


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
app.include_router(whisper_router)
app.include_router(auth_router)

@app.post("/generate-report")
async def generate_report(report: dict):

    filename = "interview_report.pdf"

    generate_pdf(report, filename)

    return FileResponse(
        filename,
        media_type="application/pdf",
        filename="AI_Interview_Report.pdf"
    )

@app.delete("/clear-history")
def clear_history():
    try:
        import sqlite3
        import os
        db_path = os.path.join(os.path.dirname(__file__), "database", "interview.db")
        conn = sqlite3.connect(db_path)
        conn.execute("DELETE FROM history")
        conn.commit()
        conn.close()
    except Exception as e:
        return {"message": f"Error: {str(e)}"}
    return {"message": "History cleared"}
# home route
@app.get("/")
def home():
    return {"message": "AI Interview Assistant is running!"}