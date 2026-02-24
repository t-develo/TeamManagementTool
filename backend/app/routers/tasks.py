from typing import List

from fastapi import APIRouter, Depends, status

from app.auth.dependencies import get_current_user, require_role
from app.models.member import Member
from app.models.user import User
from app.schemas.project import TaskResponse
from app.schemas.task import TaskAssignRequest, TaskCreate, TaskReorderRequest, TaskUpdate
from app.services.task_service import add_task, assign_task, delete_task, reorder_tasks, update_task

router = APIRouter(prefix="/api/projects/{project_id}/tasks", tags=["tasks"])


async def _task_to_response(task) -> TaskResponse:
    member = None
    try:
        from beanie import PydanticObjectId
        member = await Member.get(PydanticObjectId(task.assignee_id))
    except Exception:
        pass
    cost = None
    if member:
        daily_rate = member.cost_per_month / 20
        cost = round(daily_rate * task.man_days, 2)
    return TaskResponse(
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
        cost=cost,
    )


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task_endpoint(
    project_id: str,
    data: TaskCreate,
    current_user: User = Depends(require_role(["admin", "manager"])),
):
    task = await add_task(project_id, data)
    return await _task_to_response(task)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task_endpoint(
    project_id: str,
    task_id: str,
    data: TaskUpdate,
    current_user: User = Depends(require_role(["admin", "manager"])),
):
    task = await update_task(project_id, task_id, data)
    return await _task_to_response(task)


@router.delete("/{task_id}")
async def delete_task_endpoint(
    project_id: str,
    task_id: str,
    current_user: User = Depends(require_role(["admin", "manager"])),
):
    await delete_task(project_id, task_id)
    return {"message": "deleted"}


@router.put("/reorder", response_model=List[TaskResponse])
async def reorder_tasks_endpoint(
    project_id: str,
    data: TaskReorderRequest,
    current_user: User = Depends(require_role(["admin", "manager"])),
):
    tasks = await reorder_tasks(project_id, data.task_orders)
    return [await _task_to_response(t) for t in tasks]


@router.put("/{task_id}/assign", response_model=TaskResponse)
async def assign_task_endpoint(
    project_id: str,
    task_id: str,
    data: TaskAssignRequest,
    current_user: User = Depends(require_role(["admin", "manager"])),
):
    task = await assign_task(project_id, task_id, data)
    return await _task_to_response(task)
