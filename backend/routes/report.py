from fastapi import APIRouter
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.model import get_session_report

router = APIRouter()

@router.get("/get-report/{session_id}")
def get_report(session_id: str):
    # fetch complete session report from database
    report = get_session_report(session_id)
    
    if not report:
        return {"error": "Session not found"}
    
    return report