from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.auth.dependencies import get_current_user, require_role
from app.models.member import Member
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.cost import (
    BudgetVsActualResponse,
    DashboardSummaryResponse,
    ProjectCostResponse,
    ProjectSummaryItem,
)
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    TaskResponse,
)
from app.services.cost_service import calc_budget_vs_actual, calc_project_cost
from app.services.project_service import (
    create_project,
    delete_project,
    get_project,
    list_projects,
    update_project,
)

router = APIRouter(prefix="/api/projects", tags=["projects"])


async def _project_to_response(project) -> ProjectResponse:
    cost_data = await calc_project_cost(project)
    tasks_response = []
    for task in project.tasks:
        member = None
        try:
            from beanie import PydanticObjectId
            member = await Member.get(PydanticObjectId(task.assignee_id))
        except Exception:
            pass
        task_cost = None
        if member:
            daily_rate = member.cost_per_month / 20
            task_cost = round(daily_rate * task.man_days, 2)
        tasks_response.append(
            TaskResponse(
                task_id=task.task_id,
                title=task.title,
                assignee_id=task.assignee_id,
                assignee_name=member.name if member else None,
                man_days=task.man_days,
                progress=task.progress,
                start_date=task.start_date,
                end_date=task.end_date,
                sort_order=task.sort_order,
                status=task.status,
                cost=task_cost,
            )
        )

    total_man_days = sum(t.man_days for t in project.tasks) if project.tasks else 0
    progress = 0.0
    if total_man_days > 0:
        progress = round(
            sum(t.man_days * t.progress for t in project.tasks) / total_man_days, 1
        )

    return ProjectResponse(
        id=str(project.id),
        name=project.name,
        description=project.description,
        budget=project.budget,
        status=project.status,
        start_date=project.start_date,
        end_date=project.end_date,
        tasks=tasks_response,
        actual_cost=cost_data.actual_cost,
        progress=progress,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.get("", response_model=PaginatedResponse[ProjectResponse])
async def list_projects_endpoint(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    projects, total = await list_projects(status_filter, page, per_page)
    items = [await _project_to_response(p) for p in projects]
    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project_endpoint(
    data: ProjectCreate,
    current_user: User = Depends(require_role(["admin", "manager"])),
):
    project = await create_project(data)
    return await _project_to_response(project)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project_endpoint(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    project = await get_project(project_id)
    return await _project_to_response(project)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project_endpoint(
    project_id: str,
    data: ProjectUpdate,
    current_user: User = Depends(require_role(["admin", "manager"])),
):
    project = await update_project(project_id, data)
    return await _project_to_response(project)


@router.delete("/{project_id}")
async def delete_project_endpoint(
    project_id: str,
    current_user: User = Depends(require_role(["admin"])),
):
    await delete_project(project_id)
    return {"message": "deleted"}


@router.get("/{project_id}/cost", response_model=ProjectCostResponse)
async def get_project_cost_endpoint(
    project_id: str,
    current_user: User = Depends(require_role(["admin", "manager"])),
):
    project = await get_project(project_id)
    return await calc_project_cost(project)


@router.get("/{project_id}/budget-vs-actual", response_model=BudgetVsActualResponse)
async def get_budget_vs_actual_endpoint(
    project_id: str,
    current_user: User = Depends(require_role(["admin", "manager"])),
):
    project = await get_project(project_id)
    return await calc_budget_vs_actual(project)
