from fastapi import APIRouter
from services.gemini_service import generate_question

router = APIRouter()

@router.get("/question")
def get_question(role: str = "Software Engineer"):
    question = generate_question(role)
    return {
        "question": question,
        "role": role
    }