from dotenv import load_dotenv
load_dotenv()

import os
import io
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from routes.question import router as question_router
from routes.evaluate import router as evaluate_router
from routes.session import router as session_router
from routes.auth import router as auth_router
from database.db import init_db, get_connection
from routes.report import router as report_router
from routes.whisper import router as whisper_router
from routes.deps import get_current_user_id
from utils.pdf_report import generate_pdf


# create the app
app = FastAPI(title="AI Interview Assistant")

# create database tables on startup
@app.on_event("startup")
def startup():
    init_db()

# allow frontend to talk to backend
# in production, set ALLOWED_ORIGINS in .env (comma-separated, e.g. https://yourapp.com)
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
    """Generates the PDF fully in memory — no shared filename, no disk write,
    so two users generating reports at the same time can't overwrite each other."""
    pdf_bytes = generate_pdf(report)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=AI_Interview_Report.pdf"},
    )


@app.delete("/clear-history")
def clear_history(user_id: int = Depends(get_current_user_id)):
    """Deletes interview history for the LOGGED-IN user only (verified via token)."""
    try:
        conn = get_connection()
        conn.execute("DELETE FROM history WHERE user_id = ?", (user_id,))
        conn.commit()
        conn.close()
    except Exception as e:
        return {"message": f"Error: {str(e)}"}
    return {"message": "History cleared"}


# home route
@app.get("/")
def home():
    return {"message": "AI Interview Assistant is running!"}