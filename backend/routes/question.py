from fastapi import APIRouter
from services.gemini_service import generate_question

router = APIRouter()

@router.get("/question")
def get_question(role: str = "Software Engineer", difficulty: str = "Easy"):
    question = generate_question(role, difficulty)
    return {
        "question": question,
        "role": role,
        "difficulty": difficulty
    }