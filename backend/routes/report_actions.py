from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
import io

from database.db import get_connection
from routes.deps import get_current_user_id
from utils.pdf_report import generate_pdf

router = APIRouter()


@router.post("/generate-report")
async def generate_report(report: dict):
    # builds the pdf fully in memory, no shared filename so no overwrite between users
    pdf_bytes = generate_pdf(report)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=AI_Interview_Report.pdf"},
    )


@router.delete("/clear-history")
def clear_history(user_id: int = Depends(get_current_user_id)):
    # only clears history for the logged-in user, not the whole table
    try:
        conn = get_connection()
        conn.execute("DELETE FROM history WHERE user_id = ?", (user_id,))
        conn.commit()
        conn.close()
    except Exception as e:
        return {"message": f"Error: {str(e)}"}
    return {"message": "History cleared"}