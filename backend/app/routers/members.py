from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.auth.dependencies import get_current_user, require_role
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.member import (
    MemberCreate,
    MemberResponse,
    MemberUpdate,
    MemberUtilizationResponse,
)
from app.services.cost_service import calc_member_monthly_utilization
from app.services.member_service import (
    create_member,
    delete_member,
    get_member,
    list_members,
    update_member,
)

router = APIRouter(prefix="/api/members", tags=["members"])


def _member_to_response(member) -> MemberResponse:
    return MemberResponse(
        id=str(member.id),
        name=member.name,
        email=member.email,
        department=member.department,
        role=member.role,
        cost_per_month=member.cost_per_month,
        avatar_color=member.avatar_color,
        is_active=member.is_active,
        created_at=member.created_at,
        updated_at=member.updated_at,
    )


@router.get("", response_model=PaginatedResponse[MemberResponse])
async def list_members_endpoint(
    search: Optional[str] = None,
    department: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    members, total = await list_members(search, department, is_active, page, per_page)
    return PaginatedResponse(
        items=[_member_to_response(m) for m in members],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post("", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
async def create_member_endpoint(
    data: MemberCreate,
    current_user: User = Depends(require_role(["admin"])),
):
    member = await create_member(data)
    return _member_to_response(member)


@router.get("/{member_id}", response_model=MemberResponse)
async def get_member_endpoint(
    member_id: str,
    current_user: User = Depends(get_current_user),
):
    member = await get_member(member_id)
    return _member_to_response(member)


@router.put("/{member_id}", response_model=MemberResponse)
async def update_member_endpoint(
    member_id: str,
    data: MemberUpdate,
    current_user: User = Depends(require_role(["admin"])),
):
    member = await update_member(member_id, data)
    return _member_to_response(member)


@router.delete("/{member_id}", response_model=MemberResponse)
async def delete_member_endpoint(
    member_id: str,
    current_user: User = Depends(require_role(["admin"])),
):
    member = await delete_member(member_id)
    return _member_to_response(member)


@router.get("/{member_id}/utilization", response_model=MemberUtilizationResponse)
async def get_utilization_endpoint(
    member_id: str,
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    current_user: User = Depends(get_current_user),
):
    member = await get_member(member_id)
    return await calc_member_monthly_utilization(member, year, month)
