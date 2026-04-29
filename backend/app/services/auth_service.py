import re
from datetime import datetime
from typing import List, Optional, Tuple

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.auth.jwt_handler import decode_access_token
from app.auth.password import hash_password, verify_password
from app.models.user import User
from app.schemas.auth import UserCreate, UserUpdate


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
    user = await User.get(PydanticObjectId(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is inactive")
    return user


async def list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
) -> Tuple[List[User], int]:
    query = {}
    if search:
        pattern = re.escape(search)
        query["$or"] = [
            {"name": {"$regex": pattern, "$options": "i"}},
            {"email": {"$regex": pattern, "$options": "i"}},
        ]
    if role:
        query["role"] = role
    total = await User.find(query).count()
    users = await User.find(query).skip((page - 1) * per_page).limit(per_page).to_list()
    return users, total


async def get_user(user_id: str) -> User:
    try:
        user = await User.get(PydanticObjectId(user_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


async def update_user(user_id: str, data: UserUpdate) -> User:
    user = await get_user(user_id)
    update_data = data.model_dump(exclude_none=True)
    if "password" in update_data:
        user.hashed_password = hash_password(update_data.pop("password"))
    for field, value in update_data.items():
        setattr(user, field, value)
    user.updated_at = datetime.utcnow()
    await user.save()
    return user


async def delete_user(user_id: str) -> User:
    user = await get_user(user_id)
    user.is_active = False
    user.updated_at = datetime.utcnow()
    await user.save()
    return user
