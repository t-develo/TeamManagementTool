from datetime import datetime
from typing import List

from fastapi import HTTPException, status

from app.models.project import Project
from app.models.task import Task
from app.schemas.task import TaskAssignRequest, TaskCreate, TaskOrderItem, TaskUpdate
from app.services.member_service import get_member
from app.services.project_service import get_project


async def add_task(project_id: str, data: TaskCreate) -> Task:
    project = await get_project(project_id)
    await get_member(data.assignee_id)  # validate member exists
    sort_order = data.sort_order
    if sort_order == 0 and project.tasks:
        sort_order = max(t.sort_order for t in project.tasks) + 1
    task = Task(
        title=data.title,
        assignee_id=data.assignee_id,
        man_days=data.man_days,
        progress=data.progress,
        start_date=data.start_date,
        end_date=data.end_date,
        sort_order=sort_order,
        status=data.status,
    )
    project.tasks.append(task)
    project.updated_at = datetime.utcnow()
    await project.save()
    return task


async def update_task(project_id: str, task_id: str, data: TaskUpdate) -> Task:
    project = await get_project(project_id)
    task = next((t for t in project.tasks if t.task_id == task_id), None)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    update_data = data.model_dump(exclude_none=True)
    if "assignee_id" in update_data:
        await get_member(update_data["assignee_id"])

    for field, value in update_data.items():
        setattr(task, field, value)

    # Validate dates
    if task.end_date <= task.start_date:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="end_date must be after start_date")

    project.updated_at = datetime.utcnow()
    await project.save()
    return task


async def delete_task(project_id: str, task_id: str) -> None:
    project = await get_project(project_id)
    task = next((t for t in project.tasks if t.task_id == task_id), None)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    project.tasks = [t for t in project.tasks if t.task_id != task_id]
    project.updated_at = datetime.utcnow()
    await project.save()


async def reorder_tasks(project_id: str, task_orders: List[TaskOrderItem]) -> List[Task]:
    project = await get_project(project_id)
    order_map = {item.task_id: item.sort_order for item in task_orders}
    for task in project.tasks:
        if task.task_id in order_map:
            task.sort_order = order_map[task.task_id]
    project.tasks.sort(key=lambda t: t.sort_order)
    project.updated_at = datetime.utcnow()
    await project.save()
    return project.tasks


async def assign_task(project_id: str, task_id: str, data: TaskAssignRequest) -> Task:
    project = await get_project(project_id)
    task = next((t for t in project.tasks if t.task_id == task_id), None)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    await get_member(data.assignee_id)
    task.assignee_id = data.assignee_id
    project.updated_at = datetime.utcnow()
    await project.save()
    return task
