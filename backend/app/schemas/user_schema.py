from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List
from app.core.exceptions import ErrorDetail

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    nickname: str
    password: str
    theme_preference: Optional[str] = "light"
    timezone: Optional[str] = "Asia/Ho_Chi_Minh"

class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    theme_preference: Optional[str] = None
    timezone: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class UserResponse(UserBase):
    id: int
    nickname: str
    is_activate: Optional[bool] = True
    is_developer: Optional[bool] = False
    theme_preference: Optional[str] = "light"
    timezone: Optional[str] = "Asia/Ho_Chi_Minh"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    page: int
    limit: int
    items: List[UserResponse]

    class Config:
        from_attributes = True

class UserErrors:
    EMAIL_ALREADY_EXISTS = ErrorDetail("EMAIL_ALREADY_EXISTS", 400, "Email này đã tồn tại.")
    USER_NOT_FOUND = ErrorDetail("USER_NOT_FOUND", 404, "Không tìm thấy người dùng này.")
    INVALID_CURRENT_PASSWORD = ErrorDetail("INVALID_CURRENT_PASSWORD", 400, "Mật khẩu hiện tại không đúng.")
