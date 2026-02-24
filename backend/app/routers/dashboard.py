from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.models.member import Member
from app.models.project import Project
from app.models.user import User
from app.schemas.cost import DashboardSummaryResponse, ProjectSummaryItem
from app.services.cost_service import calc_project_cost

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(current_user: User = Depends(get_current_user)):
    projects = await Project.find_all().to_list()
    members = await Member.find_all().to_list()

    total_budget = 0.0
    total_actual_cost = 0.0
    active_projects = 0
    project_summaries = []

    for project in projects:
        cost_data = await calc_project_cost(project)
        total_budget += project.budget
        total_actual_cost += cost_data.actual_cost
        if project.status == "active":
            active_projects += 1

        total_man_days = sum(t.man_days for t in project.tasks) if project.tasks else 0
        progress = 0.0
        if total_man_days > 0:
            progress = round(
                sum(t.man_days * t.progress for t in project.tasks) / total_man_days, 1
            )
        rate = round((cost_data.actual_cost / project.budget) * 100, 1) if project.budget > 0 else 0

        project_summaries.append(
            ProjectSummaryItem(
                project_id=str(project.id),
                project_name=project.name,
                status=project.status,
                progress=progress,
                budget=project.budget,
                actual_cost=cost_data.actual_cost,
                budget_consumption_rate=rate,
            )
        )

    budget_rate = round((total_actual_cost / total_budget) * 100, 1) if total_budget > 0 else 0
    active_members = len([m for m in members if m.is_active])

    return DashboardSummaryResponse(
        total_projects=len(projects),
        active_projects=active_projects,
        total_members=len(members),
        active_members=active_members,
        total_budget=round(total_budget, 1),
        total_actual_cost=round(total_actual_cost, 2),
        budget_consumption_rate=budget_rate,
        project_summaries=project_summaries,
    )
