from fastapi import APIRouter
from database.model import create_session, get_all_sessions
from services.gemini_service import generate_question

router = APIRouter()

@router.post("/start-session")
def start_session(role: str = "Software Engineer", difficulty: str = "Easy"):
    # create a new session in database
    session_id = create_session(role)
    
    # generate first question using gemini
    question = generate_question(role, difficulty)
    
    return {
        "session_id": session_id,
        "role": role,
        "difficulty": difficulty,
        "question": question,
        "message": "Session started successfully"
    }

@router.get("/sessions")
def get_sessions():
    sessions = get_all_sessions()
    return {
        "sessions": sessions,
        "count": len(sessions)
    }
