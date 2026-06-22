from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import secrets

from database.db import get_connection
from database.users import create_user, authenticate_user, hash_password, update_streak, get_streak
from database.sessions import create_login_session, delete_login_session
from routes.deps import get_current_user_id

from utils.email_service import send_reset_email

router = APIRouter()


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/signup")
def signup(data: SignupRequest):
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user_id = create_user(data.name, data.email, data.password)
    if user_id is None:
        raise HTTPException(status_code=400, detail="Email already registered")

    token = create_login_session(user_id)
    streak = update_streak(user_id)
    return {"id": user_id, "name": data.name, "email": data.email, "token": token, **streak}


@router.post("/login")
def login(data: LoginRequest):
    user = authenticate_user(data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_login_session(user["id"])
    streak = update_streak(user["id"])
    return {**user, "token": token, **streak}


@router.get("/streak")
def streak(user_id: int = Depends(get_current_user_id)):
    """Current logged-in user's daily streak — updated on login or on
    finishing an interview, whichever happens first each day."""
    return get_streak(user_id)


@router.post("/logout")
def logout(authorization: str = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        delete_login_session(authorization.replace("Bearer ", "", 1))
    return {"message": "Logged out"}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (data.email,))
    user = cursor.fetchone()

    if not user:
        conn.close()
        # Don't reveal whether email exists — just say success
        return {"message": "If that email is registered, a reset link has been sent."}

    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=30)

    cursor.execute(
        "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)",
        (user["id"], token, expires_at)
    )
    conn.commit()
    conn.close()

    try:
        send_reset_email(data.email, token)
    except Exception as e:
        print(f"Email send error: {e}")
        raise HTTPException(status_code=500, detail="Could not send reset email. Try again later.")

    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest):
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM password_resets WHERE token = ?", (data.token,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    if row["used"]:
        conn.close()
        raise HTTPException(status_code=400, detail="This reset link has already been used")

    expires_at = datetime.fromisoformat(row["expires_at"])
    if datetime.utcnow() > expires_at:
        conn.close()
        raise HTTPException(status_code=400, detail="This reset link has expired")

    new_hash = hash_password(data.new_password)
    cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, row["user_id"]))
    cursor.execute("UPDATE password_resets SET used = 1 WHERE id = ?", (row["id"],))
    conn.commit()
    conn.close()

    return {"message": "Password reset successful. You can now sign in."}