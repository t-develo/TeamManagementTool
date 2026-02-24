from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=1, max_length=100)
    role: Literal["admin", "manager", "member"] = Field(default="member")


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: Literal["admin", "manager", "member"]
    is_active: bool
    created_at: datetime
    updated_at: datetime
