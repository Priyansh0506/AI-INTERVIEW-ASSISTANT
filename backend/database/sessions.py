import secrets
from datetime import datetime, timedelta
from database.db import get_connection

SESSION_DAYS_VALID = 7  # how long a login stays valid


def create_login_session(user_id: int) -> str:
    """Creates a new login token for a user and stores it in the DB."""
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=SESSION_DAYS_VALID)

    conn = get_connection()
    conn.execute(
        "INSERT INTO login_sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
        (token, user_id, expires_at.isoformat()),
    )
    conn.commit()
    conn.close()
    return token


def get_user_id_from_token(token: str):
    """Returns the user_id for a valid, non-expired token. None if invalid/expired."""
    if not token:
        return None

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT user_id, expires_at FROM login_sessions WHERE token = ?",
        (token,),
    )
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    expires_at = datetime.fromisoformat(row["expires_at"])
    if expires_at < datetime.utcnow():
        return None  # expired

    return row["user_id"]


def delete_login_session(token: str):
    """Logs out — removes the token so it can't be used again."""
    conn = get_connection()
    conn.execute("DELETE FROM login_sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()