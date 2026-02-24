from datetime import date, timedelta
from typing import List

from beanie import PydanticObjectId

from app.models.member import Member
from app.models.project import Project
from app.models.task import Task
from app.schemas.cost import (
    BudgetVsActualResponse,
    ProjectCostResponse,
    TaskCostDetail,
)
from app.schemas.member import MemberUtilizationResponse, UtilizationTaskDetail


def count_working_days(start: date, end: date) -> int:
    if start > end:
        return 0
    count = 0
    current = start
    while current <= end:
        if current.weekday() < 5:  # Mon-Fri
            count += 1
        current += timedelta(days=1)
    return count


async def calc_task_cost(task: Task, member: Member) -> float:
    daily_rate = member.cost_per_month / 20
    return round(daily_rate * task.man_days, 2)


async def calc_project_cost(project: Project) -> ProjectCostResponse:
    task_costs: List[TaskCostDetail] = []
    total_cost = 0.0

    for task in project.tasks:
        try:
            member = await Member.get(PydanticObjectId(task.assignee_id))
        except Exception:
            member = None
        if member:
            daily_rate = member.cost_per_month / 20
            cost = round(daily_rate * task.man_days, 2)
            task_costs.append(
                TaskCostDetail(
                    task_id=task.task_id,
                    task_title=task.title,
                    assignee_id=task.assignee_id,
                    assignee_name=member.name,
                    man_days=task.man_days,
                    daily_rate=round(daily_rate, 2),
                    cost=cost,
                )
            )
            total_cost += cost

    return ProjectCostResponse(
        project_id=str(project.id),
        project_name=project.name,
        budget=project.budget,
        actual_cost=round(total_cost, 2),
        remaining_budget=round(project.budget - total_cost, 2),
        task_costs=task_costs,
    )


async def calc_budget_vs_actual(project: Project) -> BudgetVsActualResponse:
    cost_data = await calc_project_cost(project)
    rate = round((cost_data.actual_cost / project.budget) * 100, 1) if project.budget > 0 else 0
    if rate >= 100:
        budget_status = "over_budget"
    elif rate >= 80:
        budget_status = "warning"
    else:
        budget_status = "on_track"

    return BudgetVsActualResponse(
        project_id=str(project.id),
        project_name=project.name,
        budget=project.budget,
        actual_cost=cost_data.actual_cost,
        budget_consumption_rate=rate,
        remaining_budget=cost_data.remaining_budget,
        status=budget_status,
    )


async def calc_member_monthly_utilization(
    member: Member, year: int, month: int
) -> MemberUtilizationResponse:
    from calendar import monthrange

    _, last_day = monthrange(year, month)
    month_start = date(year, month, 1)
    month_end = date(year, month, last_day)

    all_projects = await Project.find_all().to_list()
    task_details: List[UtilizationTaskDetail] = []
    total_contribution = 0.0
    member_id_str = str(member.id)

    for project in all_projects:
        for task in project.tasks:
            if task.assignee_id != member_id_str:
                continue

            total_task_working_days = count_working_days(task.start_date, task.end_date)
            if total_task_working_days == 0:
                continue

            overlap_start = max(task.start_date, month_start)
            overlap_end = min(task.end_date, month_end)
            if overlap_start > overlap_end:
                continue

            working_days_in_month = count_working_days(overlap_start, overlap_end)
            task_daily_rate = task.man_days / total_task_working_days
            contribution = round(task_daily_rate * working_days_in_month, 2)

            task_details.append(
                UtilizationTaskDetail(
                    task_id=task.task_id,
                    task_title=task.title,
                    project_name=project.name,
                    man_days=task.man_days,
                    working_days_in_month=working_days_in_month,
                    contribution=contribution,
                )
            )
            total_contribution += contribution

    utilization = round((total_contribution / 20) * 100, 1)

    return MemberUtilizationResponse(
        member_id=member_id_str,
        member_name=member.name,
        year=year,
        month=month,
        total_working_days=round(total_contribution, 2),
        utilization_percent=utilization,
        task_details=task_details,
    )
