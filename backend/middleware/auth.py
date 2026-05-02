"""
JWT-based authentication helpers.

For development you can disable auth by setting JWT_SECRET_KEY="" in .env.
POST /api/v1/auth/token   →  exchange username+password for a JWT
All protected routes use: Depends(get_current_user)
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

logger = logging.getLogger(__name__)

SECRET_KEY      = os.getenv("JWT_SECRET_KEY", "")
ALGORITHM       = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRE_MINUTES  = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

pwd_context    = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme  = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token", auto_error=False)

# ── Demo users — replace with a real database in production ──────────────────
# Passwords are bcrypt hashes. Generate with: python -c "from passlib.context import CryptContext; print(CryptContext(['bcrypt']).hash('yourpassword'))"
FAKE_USERS: dict[str, dict] = {
    "farmer": {
        "username": "farmer",
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "secret"
        "role": "user",
    },
    "admin": {
        "username": "admin",
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
        "role": "admin",
    },
}


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"


class User(BaseModel):
    username: str
    role:     str


def _auth_disabled() -> bool:
    return not SECRET_KEY


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    payload = data.copy()
    expire  = datetime.utcnow() + (expires_delta or timedelta(minutes=EXPIRE_MINUTES))
    payload["exp"] = expire
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def authenticate_user(username: str, password: str) -> Optional[dict]:
    user = FAKE_USERS.get(username)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[User]:
    """
    If auth is disabled (empty JWT_SECRET_KEY), returns a guest user.
    Otherwise validates the JWT and returns the user.
    """
    if _auth_disabled():
        return User(username="guest", role="user")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub", "")
        if not username:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = FAKE_USERS.get(username)
    if not user:
        raise credentials_exception

    return User(username=user["username"], role=user["role"])


def create_token_response(form_data: OAuth2PasswordRequestForm) -> TokenResponse:
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": user["username"]})
    return TokenResponse(access_token=token)
