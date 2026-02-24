from datetime import date, datetime
from typing import List, Literal

from beanie import Document
from pydantic import Field, field_validator

from app.models.task import Task


class Project(Document):
    """プロジェクトモデル（タスクを埋め込みで保持）"""

    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)
    budget: float = Field(..., ge=0.1, le=99999.9, description="万円")
    status: Literal["planning", "active", "completed", "on_hold"] = Field(
        default="planning"
    )
    start_date: date
    end_date: date
    tasks: List[Task] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name must not be blank")
        return v.strip()

    @field_validator("end_date")
    @classmethod
    def end_date_after_start_date(cls, v: date, info) -> date:
        start = info.data.get("start_date")
        if start and v <= start:
            raise ValueError("end_date must be after start_date")
        return v

    @field_validator("budget")
    @classmethod
    def round_budget(cls, v: float) -> float:
        return round(v, 1)

    class Settings:
        name = "projects"
