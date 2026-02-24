from datetime import date
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    assignee_id: str
    man_days: float = Field(..., ge=0.5, le=999.0)
    start_date: date
    end_date: date
    status: Literal["not_started", "in_progress", "completed"] = "not_started"
    progress: int = Field(default=0, ge=0, le=100)
    sort_order: int = Field(default=0, ge=0)

    @field_validator("end_date")
    @classmethod
    def end_date_after_start(cls, v: date, info) -> date:
        start = info.data.get("start_date")
        if start and v <= start:
            raise ValueError("end_date must be after start_date")
        return v


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    assignee_id: Optional[str] = None
    man_days: Optional[float] = Field(None, ge=0.5, le=999.0)
    progress: Optional[int] = Field(None, ge=0, le=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    sort_order: Optional[int] = Field(None, ge=0)
    status: Optional[Literal["not_started", "in_progress", "completed"]] = None


class TaskReorderRequest(BaseModel):
    task_orders: List["TaskOrderItem"]


class TaskOrderItem(BaseModel):
    task_id: str
    sort_order: int = Field(..., ge=0)


class TaskAssignRequest(BaseModel):
    assignee_id: str
