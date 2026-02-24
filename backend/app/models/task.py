from datetime import date
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator


class Task(BaseModel):
    """タスク（Projectドキュメントに埋め込み）"""

    task_id: str = Field(default_factory=lambda: str(uuid4()))
    title: str = Field(..., min_length=1, max_length=100)
    assignee_id: str = Field(..., description="Member._id への参照文字列")
    man_days: float = Field(..., ge=0.5, le=999.0)
    progress: int = Field(default=0, ge=0, le=100)
    start_date: date
    end_date: date
    sort_order: int = Field(default=0, ge=0)
    status: Literal["not_started", "in_progress", "completed"] = Field(
        default="not_started"
    )

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("title must not be blank")
        return v.strip()

    @field_validator("end_date")
    @classmethod
    def end_date_after_start_date(cls, v: date, info) -> date:
        start = info.data.get("start_date")
        if start and v <= start:
            raise ValueError("end_date must be after start_date")
        return v

    @field_validator("man_days")
    @classmethod
    def round_man_days(cls, v: float) -> float:
        return round(v, 1)
