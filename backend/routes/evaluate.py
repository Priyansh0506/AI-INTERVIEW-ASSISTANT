from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional

from services.gemini_service import evaluate_answer
from services.scoring import parse_score, get_communication_score
from services.nlp_scorer import score_answer
from database.model import save_interview_result
from routes.deps import get_current_user_id

router = APIRouter()


class AnswerRequest(BaseModel):
    question: str
    answer: str
    role: str = "Software Engineer"
    expected_answer: str = ""


@router.post("/evaluate")
def evaluate(request: AnswerRequest):
    raw_result = evaluate_answer(
        question=request.question,
        answer=request.answer,
        role=request.role
    )
    parsed = parse_score(raw_result)
    comm = get_communication_score(request.answer)
    nlp = score_answer(
        expected_answer=request.expected_answer or request.question,
        user_answer=request.answer
    )
    return {
        "score": parsed["score"],
        "feedback": parsed["feedback"],
        "improve": parsed["improve"],
        "good": parsed["good"],
        "role": request.role,
        "communication_score": comm["communication_score"],
        "filler_count": comm["filler_count"],
        "vocab_score": comm["vocab_score"],
        "nlp_score": nlp["nlp_score"],
        "similarity": nlp["similarity"],
        "keyword_match": nlp["keyword_match"],
        "matched_keywords": nlp["matched_keywords"],
        "nlp_feedback": nlp["feedback"]
    }


# ── Final Interview Evaluation ─────────────────────────────

class InterviewAnswer(BaseModel):
    question: str
    answer: str


class InterviewRequest(BaseModel):
    role: str
    difficulty: Optional[str] = "Easy"
    session_id: Optional[str] = None
    answers: List[InterviewAnswer]
    integrity_score: int = 100
    eye_contact_score: int = 100


@router.post("/evaluate-interview")
def evaluate_interview(request: InterviewRequest, user_id: int = Depends(get_current_user_id)):
    scores, feedbacks, improves, goods = [], [], [], []

    for item in request.answers:
        raw = evaluate_answer(
            question=item.question,
            answer=item.answer,
            role=request.role
        )
        parsed = parse_score(raw)
        scores.append(parsed["score"])
        feedbacks.append({"question": item.question, "feedback": parsed["feedback"]})
        improves.append(parsed.get("improve", ""))
        goods.append(parsed.get("good", ""))

    final_score = round(sum(scores) / len(scores), 2) if scores else 0

    # NLP on last answer
    nlp = {}
    if request.answers:
        try:
            nlp = score_answer(
                expected_answer=request.answers[-1].question,
                user_answer=request.answers[-1].answer
            )
        except Exception:
            nlp = {}

    result = {
        "score": final_score,
        "final_score": final_score,
        "role": request.role,
        "difficulty": request.difficulty or "Easy",
        "integrity_score": request.integrity_score,
        "eye_contact_score": request.eye_contact_score,
        "feedbacks": feedbacks,
        "feedback": feedbacks[0]["feedback"] if feedbacks else "Good effort!",
        "improve": improves[0] if improves else "Practice more specific examples.",
        "good": goods[0] if goods else "You gave a confident attempt.",
        "nlp_score": nlp.get("nlp_score"),
        "similarity": nlp.get("similarity"),
        "keyword_match": nlp.get("keyword_match"),
        "matched_keywords": nlp.get("matched_keywords", []),
        "nlp_feedback": nlp.get("feedback", ""),
    }

    # ── Save to DB ──
    try:
        history_id = save_interview_result({
            **result,
            "session_id": request.session_id,
            "user_id": user_id,
        })
        result["history_id"] = history_id   # frontend ko milega PDF ke liye
    except Exception as e:
        print(f"DB save error: {e}")
        result["history_id"] = None

    return result


# ── History endpoints ──────────────────────────────────────
@router.get("/history")
def get_history(user_id: int = Depends(get_current_user_id)):
    from database.model import get_history_by_user
    return {"history": get_history_by_user(user_id)}


@router.get("/history/{history_id}/pdf")
def download_history_pdf(history_id: int):
    """Generate and download PDF for a specific past interview."""
    from database.model import get_history_by_id
    from fastapi.responses import StreamingResponse
    import io

    record = get_history_by_id(history_id)
    if not record:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="History record not found")

    try:
        from utils.pdf_report import generate_pdf
        pdf_bytes = generate_pdf(record)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Interview_Report_{history_id}.pdf"}
        )
    except ImportError:
        from fastapi.responses import JSONResponse
        return JSONResponse({"record": record, "message": "Use /generate-report endpoint with this data"})


# ── Direct report generation (used by Report.jsx) ──────────

@router.post("/generate-report")
def generate_report(data: dict):
    from utils.pdf_report import generate_pdf
    from fastapi.responses import StreamingResponse
    import io

    pdf_bytes = generate_pdf(data)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=AI_Interview_Report.pdf"}
    )