from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user_model import User
from app.schemas.task_schema import TaskCreate, TaskUpdate, TaskResponse, ReorderRequest
from app.services.task_service import task_service

router = APIRouter()

class ToggleCompleteBody(BaseModel):
    is_completed: bool

class ToggleImportantBody(BaseModel):
    is_important: bool

class ToggleMyDayBody(BaseModel):
    is_in_my_day: bool

class UpdatePositionBody(BaseModel):
    position: int

@router.get("", response_model=List[TaskResponse])
async def get_tasks(
    list_id: Optional[int] = Query(None, description="Lọc theo ID danh sách"),
    view: Optional[str] = Query(None, description="Smart list: my_day, important, planned, all"),
    is_completed: Optional[bool] = Query(None, description="Lọc theo trạng thái hoàn thành"),
    due_before: Optional[date] = Query(None, description="Hạn chót trước ngày"),
    due_after: Optional[date] = Query(None, description="Hạn chót sau ngày"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách công việc theo bộ lọc hoặc smart list"""
    return await task_service.get_tasks(
        db,
        user_id=current_user.id,
        list_id=list_id,
        view=view,
        is_completed=is_completed,
        due_before=due_before,
        due_after=due_after
    )

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tạo công việc mới"""
    return await task_service.create_task(db, user_id=current_user.id, task_in=task_in)

@router.put("/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_tasks(
    req: ReorderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Sắp xếp lại thứ tự công việc"""
    await task_service.reorder_tasks(db, user_id=current_user.id, items=req.items)

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy chi tiết công việc kèm các steps con"""
    return await task_service.get_task_by_id(db, task_id=task_id, user_id=current_user.id)

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_in: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cập nhật thông tin công việc"""
    return await task_service.update_task(
        db, task_id=task_id, user_id=current_user.id, task_in=task_in
    )

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Xóa công việc"""
    await task_service.delete_task(db, task_id=task_id, user_id=current_user.id)

@router.patch("/{task_id}/complete", response_model=TaskResponse)
async def toggle_task_complete(
    task_id: int,
    body: ToggleCompleteBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Đánh dấu hoàn thành hoặc bỏ hoàn thành công việc"""
    return await task_service.toggle_complete(
        db, task_id=task_id, user_id=current_user.id, is_completed=body.is_completed
    )

@router.patch("/{task_id}/important", response_model=TaskResponse)
async def toggle_task_important(
    task_id: int,
    body: ToggleImportantBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Đánh dấu sao quan trọng"""
    return await task_service.toggle_important(
        db, task_id=task_id, user_id=current_user.id, is_important=body.is_important
    )

@router.patch("/{task_id}/my-day", response_model=TaskResponse)
async def toggle_task_my_day(
    task_id: int,
    body: ToggleMyDayBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Thêm vào hoặc xóa khỏi My Day"""
    return await task_service.toggle_my_day(
        db, task_id=task_id, user_id=current_user.id, is_in_my_day=body.is_in_my_day
    )

@router.patch("/{task_id}/position", response_model=TaskResponse)
async def update_task_position(
    task_id: int,
    body: UpdatePositionBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cập nhật vị trí sắp xếp công việc"""
    return await task_service.update_task(
        db, task_id=task_id, user_id=current_user.id, task_in=TaskUpdate(position=body.position)
    )


