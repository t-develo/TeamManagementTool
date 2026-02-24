import re
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class MemberCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    department: str = Field(..., min_length=1, max_length=50)
    role: str = Field(..., min_length=1, max_length=50)
    cost_per_month: float = Field(..., ge=0.1, le=999.9)
    avatar_color: str

    @field_validator("avatar_color")
    @classmethod
    def validate_hex_color(cls, v: str) -> str:
        if not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("avatar_color must be a valid hex color (#XXXXXX)")
        return v.upper()


class MemberUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    department: Optional[str] = Field(None, min_length=1, max_length=50)
    role: Optional[str] = Field(None, min_length=1, max_length=50)
    cost_per_month: Optional[float] = Field(None, ge=0.1, le=999.9)
    avatar_color: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("avatar_color")
    @classmethod
    def validate_hex_color(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("avatar_color must be a valid hex color (#XXXXXX)")
        return v.upper() if v else v


class MemberResponse(BaseModel):
    id: str
    name: str
    email: str
    department: str
    role: str
    cost_per_month: float
    avatar_color: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UtilizationTaskDetail(BaseModel):
    task_id: str
    task_title: str
    project_name: str
    man_days: float
    working_days_in_month: float
    contribution: float


class MemberUtilizationResponse(BaseModel):
    member_id: str
    member_name: str
    year: int
    month: int
    total_working_days: float
    utilization_percent: float
    task_details: List[UtilizationTaskDetail]
