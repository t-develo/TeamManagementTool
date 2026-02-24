import re
from datetime import datetime
from typing import List, Optional, Tuple

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.models.member import Member
from app.schemas.member import MemberCreate, MemberUpdate


async def list_members(
    search: Optional[str] = None,
    department: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    per_page: int = 20,
) -> Tuple[List[Member], int]:
    query = {}
    if search:
        pattern = re.escape(search)
        query["$or"] = [
            {"name": {"$regex": pattern, "$options": "i"}},
            {"email": {"$regex": pattern, "$options": "i"}},
        ]
    if department:
        query["department"] = department
    if is_active is not None:
        query["is_active"] = is_active

    total = await Member.find(query).count()
    members = await Member.find(query).skip((page - 1) * per_page).limit(per_page).to_list()
    return members, total


async def create_member(data: MemberCreate) -> Member:
    existing = await Member.find_one(Member.email == data.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    member = Member(
        name=data.name,
        email=data.email,
        department=data.department,
        role=data.role,
        cost_per_month=data.cost_per_month,
        avatar_color=data.avatar_color,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    await member.insert()
    return member


async def get_member(member_id: str) -> Member:
    member = await Member.get(PydanticObjectId(member_id))
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return member


async def update_member(member_id: str, data: MemberUpdate) -> Member:
    member = await get_member(member_id)
    update_data = data.model_dump(exclude_none=True)
    if "email" in update_data and update_data["email"] != member.email:
        existing = await Member.find_one(Member.email == update_data["email"])
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    for field, value in update_data.items():
        setattr(member, field, value)
    member.updated_at = datetime.utcnow()
    await member.save()
    return member


async def delete_member(member_id: str) -> Member:
    member = await get_member(member_id)
    member.is_active = False
    member.updated_at = datetime.utcnow()
    await member.save()
    return member
