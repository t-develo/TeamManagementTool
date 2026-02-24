from datetime import datetime
from typing import List, Optional, Tuple

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


async def list_projects(
    project_status: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
) -> Tuple[List[Project], int]:
    query = {}
    if project_status:
        query["status"] = project_status
    total = await Project.find(query).count()
    projects = await Project.find(query).skip((page - 1) * per_page).limit(per_page).to_list()
    return projects, total


async def create_project(data: ProjectCreate) -> Project:
    project = Project(
        name=data.name,
        description=data.description,
        budget=data.budget,
        status=data.status,
        start_date=data.start_date,
        end_date=data.end_date,
        tasks=[],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    await project.insert()
    return project


async def get_project(project_id: str) -> Project:
    project = await Project.get(PydanticObjectId(project_id))
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


async def update_project(project_id: str, data: ProjectUpdate) -> Project:
    project = await get_project(project_id)
    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    # Validate dates
    if project.end_date <= project.start_date:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="end_date must be after start_date")
    project.updated_at = datetime.utcnow()
    await project.save()
    return project


async def delete_project(project_id: str) -> None:
    project = await get_project(project_id)
    await project.delete()
