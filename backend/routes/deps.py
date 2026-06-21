from fastapi import Header, HTTPException
from database.sessions import get_user_id_from_token


def get_current_user_id(authorization: str = Header(None)) -> int:
    """
    Reads the 'Authorization: Bearer <token>' header, validates it,
    and returns the real logged-in user's id.
    Any route that uses this can trust the user_id completely —
    no more relying on whatever the frontend claims.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not logged in")

    token = authorization.replace("Bearer ", "", 1)
    user_id = get_user_id_from_token(token)

    if user_id is None:
        raise HTTPException(status_code=401, detail="Session expired, please log in again")

    return user_id
