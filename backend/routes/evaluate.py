from fastapi import APIRouter
from pydantic import BaseModel
from services.gemini_service import evaluate_answer
from services.scoring import parse_score

router = APIRouter()

#this class is used to define the structure of the incoming request for evaluation
class AnswerRequest(BaseModel):
    question: str
    answer: str
    role: str = "Software Engineer"

@router.post("/evaluate")
def evaluate(request: AnswerRequest):
    # step 1 - gemini se raw evaluation lo
    raw_result = evaluate_answer(
        question=request.question,
        answer=request.answer,
        role=request.role
    )
    
    # step 2 - divide the raw result into clean parts using scoring service
    parsed = parse_score(raw_result)
    
    # step 3 - send clean respond
    return {
        "score": parsed["score"],
        "feedback": parsed["feedback"],
        "improve": parsed["improve"],
        "good": parsed["good"],
        "role": request.role
    }