from datetime import datetime
from typing import Literal

from beanie import Document, Indexed
from pydantic import EmailStr, Field, field_validator


class User(Document):
    """ユーザー認証・認可モデル"""

    email: Indexed(EmailStr, unique=True)
    hashed_password: str
    name: str = Field(..., min_length=1, max_length=100)
    role: Literal["admin", "manager", "member"] = Field(default="member")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name must not be blank")
        return v.strip()

    class Settings:
        name = "users"
