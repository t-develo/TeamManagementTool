import re
from datetime import datetime

from beanie import Document, Indexed
from pydantic import EmailStr, Field, field_validator


class Member(Document):
    """チームメンバー（コスト管理対象）モデル"""

    name: str = Field(..., min_length=1, max_length=100)
    email: Indexed(EmailStr, unique=True)
    department: str = Field(..., min_length=1, max_length=50)
    role: str = Field(..., min_length=1, max_length=50)
    cost_per_month: float = Field(..., ge=0.1, le=999.9, description="万円/月")
    avatar_color: str = Field(..., description="HEXカラーコード (#XXXXXX)")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name must not be blank")
        return v.strip()

    @field_validator("avatar_color")
    @classmethod
    def validate_hex_color(cls, v: str) -> str:
        if not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("avatar_color must be a valid hex color (#XXXXXX)")
        return v.upper()

    @field_validator("cost_per_month")
    @classmethod
    def round_cost(cls, v: float) -> float:
        return round(v, 1)

    class Settings:
        name = "members"
