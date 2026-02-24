from fastapi import APIRouter, Depends, status

from app.auth.dependencies import get_current_user, require_role
from app.auth.jwt_handler import create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, UserCreate, UserResponse
from app.services.auth_service import authenticate_user, create_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    user = await authenticate_user(data.email, data.password)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return LoginResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, current_user: User = Depends(require_role(["admin"]))):
    user = await create_user(data)
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )
