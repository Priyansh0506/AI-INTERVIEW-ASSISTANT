from database.db import get_connection
import hashlib
import secrets
from datetime import date, timedelta

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


# ════════════════════════════════════════
# ── DAILY STREAK ──
# Counts once per calendar day no matter how many times it's called.
# Call this on login AND on completing an interview — either one
# keeps the streak alive for that day.
# ════════════════════════════════════════

def update_streak(user_id: int) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT current_streak, longest_streak, last_active_date FROM users WHERE id = ?",
        (user_id,)
    )
    row = cursor.fetchone()
    if not row:
        conn.close()
        return {"current_streak": 0, "longest_streak": 0}

    today = date.today()
    last_active = row["last_active_date"]
    current = row["current_streak"] or 0
    longest = row["longest_streak"] or 0

    if last_active:
        last_date = date.fromisoformat(last_active)
        if last_date == today:
            conn.close()
            return {"current_streak": current, "longest_streak": longest}
        elif last_date == today - timedelta(days=1):
            current += 1
        else:
            current = 1
    else:
        current = 1

    longest = max(longest, current)

    cursor.execute(
        "UPDATE users SET current_streak = ?, longest_streak = ?, last_active_date = ? WHERE id = ?",
        (current, longest, today.isoformat(), user_id)
    )
    conn.commit()
    conn.close()
    return {"current_streak": current, "longest_streak": longest}


def get_streak(user_id: int) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT current_streak, longest_streak, last_active_date FROM users WHERE id = ?",
        (user_id,)
    )
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"current_streak": 0, "longest_streak": 0, "last_active_date": None}
    return {
        "current_streak": row["current_streak"] or 0,
        "longest_streak": row["longest_streak"] or 0,
        "last_active_date": row["last_active_date"],
    }