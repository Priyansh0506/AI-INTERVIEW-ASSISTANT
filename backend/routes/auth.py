from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from database.users import create_user, authenticate_user

router = APIRouter()

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup")
def signup(data: SignupRequest):
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user_id = create_user(data.name, data.email, data.password)
    if user_id is None:
        raise HTTPException(status_code=400, detail="Email already registered")

    return {"id": user_id, "name": data.name, "email": data.email}

@router.post("/login")
def login(data: LoginRequest):
    user = authenticate_user(data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return user