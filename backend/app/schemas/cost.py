from typing import List

from pydantic import BaseModel, Field


class TaskCostDetail(BaseModel):
    task_id: str
    task_title: str
    assignee_id: str
    assignee_name: str
    man_days: float
    daily_rate: float
    cost: float


class ProjectCostResponse(BaseModel):
    project_id: str
    project_name: str
    budget: float
    actual_cost: float
    remaining_budget: float
    task_costs: List[TaskCostDetail]


class BudgetVsActualResponse(BaseModel):
    project_id: str
    project_name: str
    budget: float
    actual_cost: float
    budget_consumption_rate: float
    remaining_budget: float
    status: str


class ProjectSummaryItem(BaseModel):
    project_id: str
    project_name: str
    status: str
    progress: float
    budget: float
    actual_cost: float
    budget_consumption_rate: float


class DashboardSummaryResponse(BaseModel):
    total_projects: int
    active_projects: int
    total_members: int
    active_members: int
    total_budget: float
    total_actual_cost: float
    budget_consumption_rate: float
    project_summaries: List[ProjectSummaryItem]
