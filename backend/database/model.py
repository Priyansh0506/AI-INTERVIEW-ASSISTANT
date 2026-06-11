from database.db import get_connection
import uuid

# create a new interview session and save it to database
def create_session(role: str) -> str:
    # generate a unique session id — like a ticket number
    session_id = str(uuid.uuid4())[:8]
    
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "INSERT INTO sessions (id, role) VALUES (?, ?)",
        (session_id, role)
    )
    
    conn.commit()
    conn.close()
    
    return session_id

# save a question and its answer to database
def save_answer(session_id: str, question: str, answer: str, score: int, feedback: str, improve: str, good: str):
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO answers (session_id, question, answer, score, feedback, improve, good)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (session_id, question, answer, score, feedback, improve, good))
    
    conn.commit()
    conn.close()

# get all answers for a session — used in final report
def get_session_report(session_id: str) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    
    # get session info
    cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    session = cursor.fetchone()
    
    # get all answers for this session
    cursor.execute("SELECT * FROM answers WHERE session_id = ?", (session_id,))
    answers = cursor.fetchall()
    
    conn.close()
    
    if not session:
        return None
    
    # calculate average score
    scores = [a["score"] for a in answers]
    avg = round(sum(scores) / len(scores), 1) if scores else 0
    
    return {
        "session_id": session_id,
        "role": session["role"],
        "total_questions": len(answers),
        "average_score": avg,
        "answers": [dict(a) for a in answers]
    }