from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.token_schema import Token
from app.schemas.user_schema import UserCreate, UserResponse
from app.schemas.common import ApiResponse
from app.services.auth_service import auth_service
from app.services.user_service import user_service

router = APIRouter()


@router.post("/login", response_model=Token)
async def login_access_token(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Đăng nhập và nhận về Access Token.
    Hỗ trợ cả application/json ({email, password}) lẫn application/x-www-form-urlencoded (OAuth2 form).
    """
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        body = await request.json()
        email = body.get("email") or body.get("username")
        password = body.get("password")
    else:
        form = await request.form()
        email = form.get("username") or form.get("email")
        password = form.get("password")

    return await auth_service.authenticate_by_credentials(db, email=email, password=password)


@router.post("/register", response_model=ApiResponse[UserResponse], status_code=status.HTTP_201_CREATED)
async def register_user_via_auth(
    user_in: UserCreate, 
    db: AsyncSession = Depends(get_db)
):
    """Đăng ký người dùng mới (alias cho /users/register)"""
    user = await user_service.register_new_user(db, user_in=user_in)
    return ApiResponse(
        message="Đăng ký tài khoản thành công",
        data=user
    )
