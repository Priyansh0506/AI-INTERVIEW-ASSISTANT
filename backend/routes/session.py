from fastapi import APIRouter
from database.model import create_session
from services.gemini_service import generate_question

router = APIRouter()

@router.post("/start-session")
def start_session(role: str = "Software Engineer"):
    # create a new session in database
    session_id = create_session(role)
    
    # generate first question using gemini
    question = generate_question(role)
    
    return {
        "session_id": session_id,
        "role": role,
        "question": question,
        "message": "Session started successfully"
    }