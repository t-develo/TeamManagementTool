from datetime import datetime

from fastapi import HTTPException, status

from app.auth.jwt_handler import decode_access_token
from app.auth.password import hash_password, verify_password
from app.models.user import User
from app.schemas.auth import UserCreate


async def authenticate_user(email: str, password: str) -> User:
    user = await User.find_one(User.email == email)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is inactive")
    return user


async def create_user(data: UserCreate) -> User:
    existing = await User.find_one(User.email == data.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        name=data.name,
        role=data.role,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    await user.insert()
    return user


async def get_current_user_by_token(token: str) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = await User.find_one(User.email == user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is inactive")
    return user
