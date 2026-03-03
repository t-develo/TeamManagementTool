from fastapi import APIRouter, Depends, Query, status

from app.auth.dependencies import get_current_user, require_role
from app.auth.jwt_handler import create_access_token
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    UserCreate,
    UserListResponse,
    UserResponse,
    UserUpdate,
)
from app.services.auth_service import (
    authenticate_user,
    create_user,
    delete_user,
    get_user,
    list_users,
    update_user,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _to_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    user = await authenticate_user(data.email, data.password)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return LoginResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return _to_response(current_user)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, current_user: User = Depends(require_role(["admin"]))):
    user = await create_user(data)
    return _to_response(user)


# ---------------------------------------------------------------------------
# ユーザー管理 (admin only)
# ---------------------------------------------------------------------------

@router.get("/users", response_model=UserListResponse)
async def list_users_endpoint(
    search: str = Query(None),
    role: str = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    _: User = Depends(require_role(["admin"])),
):
    users, total = await list_users(search=search, role=role, page=page, per_page=per_page)
    return UserListResponse(
        items=[_to_response(u) for u in users],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_endpoint(
    user_id: str,
    data: UserUpdate,
    _: User = Depends(require_role(["admin"])),
):
    user = await update_user(user_id, data)
    return _to_response(user)


@router.delete("/users/{user_id}", response_model=UserResponse)
async def delete_user_endpoint(
    user_id: str,
    _: User = Depends(require_role(["admin"])),
):
    user = await delete_user(user_id)
    return _to_response(user)
