from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)
    budget: float = Field(..., ge=0.1, le=99999.9)
    status: Literal["planning", "active", "completed", "on_hold"] = "planning"
    start_date: date
    end_date: date

    @field_validator("end_date")
    @classmethod
    def end_date_after_start(cls, v: date, info) -> date:
        start = info.data.get("start_date")
        if start and v <= start:
            raise ValueError("end_date must be after start_date")
        return v


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    budget: Optional[float] = Field(None, ge=0.1, le=99999.9)
    status: Optional[Literal["planning", "active", "completed", "on_hold"]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class TaskResponse(BaseModel):
    task_id: str
    title: str
    assignee_id: str
    assignee_name: Optional[str] = None
    man_days: float
    progress: int
    start_date: date
    end_date: date
    sort_order: int
    status: Literal["not_started", "in_progress", "completed"]
    cost: Optional[float] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    budget: float
    status: Literal["planning", "active", "completed", "on_hold"]
    start_date: date
    end_date: date
    tasks: List[TaskResponse] = []
    actual_cost: Optional[float] = None
    progress: Optional[float] = None
    created_at: datetime
    updated_at: datetime
