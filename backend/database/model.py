from database.db import get_connection
import uuid
import hashlib
import secrets

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

# get all interview sessions
def get_all_sessions() -> list:
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, role, created_at, total_score, status
        FROM sessions
        ORDER BY created_at DESC
    """)
    
    sessions = cursor.fetchall()
    conn.close()
    
    return [dict(s) for s in sessions]


# ── Save final interview result (used by evaluate-interview) ──
def save_interview_result(data: dict) -> int:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO history (
            session_id, role, difficulty, final_score,
            integrity_score, eye_contact_score,
            feedback, improve, good,
            nlp_score, similarity, keyword_match,
            matched_keywords, nlp_feedback, feedbacks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get("session_id"),
        data.get("role"),
        data.get("difficulty"),
        data.get("final_score"),
        data.get("integrity_score"),
        data.get("eye_contact_score"),
        data.get("feedback"),
        data.get("improve"),
        data.get("good"),
        data.get("nlp_score"),
        data.get("similarity"),
        data.get("keyword_match"),
        str(data.get("matched_keywords")),
        data.get("nlp_feedback"),
        str(data.get("feedbacks")),
    ))

    history_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return history_id


# ── Get all history records ──
def get_all_history() -> list:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM history ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Get single history record by id ──
def get_history_by_id(history_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM history WHERE id = ?", (history_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


# ════════════════════════════════════════
# ── USER AUTH (Login / Signup) ──
# ════════════════════════════════════════

def hash_password(password: str, salt: str = None) -> str:
    """Simple secure hash using PBKDF2 (no external deps needed)."""
    if salt is None:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt.encode(), 100_000
    ).hex()
    return f"{salt}${hashed}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, hashed = stored_hash.split("$")
        check = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), salt.encode(), 100_000
        ).hex()
        return check == hashed
    except Exception:
        return False


def create_user(name: str, email: str, password: str):
    conn = get_connection()
    cursor = conn.cursor()

    # check if email already exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        return None  # email already used

    password_hash = hash_password(password)
    cursor.execute(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        (name, email, password_hash)
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    return user_id


def authenticate_user(email: str, password: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None
    user = dict(row)
    if not verify_password(password, user["password_hash"]):
        return None

    user.pop("password_hash")  # never send hash to frontend
    return user


def get_user_by_id(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, created_at FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None