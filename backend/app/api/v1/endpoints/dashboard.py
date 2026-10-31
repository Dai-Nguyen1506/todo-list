from datetime import datetime, date, time
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user_model import User
from app.models.task_model import Task
from app.models.event_model import Event
from app.schemas.dashboard_schema import DashboardTodayResponse
from app.services.event_service import event_service
from app.services.task_service import task_service

router = APIRouter()

@router.get("/today", response_model=DashboardTodayResponse)
async def get_today_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy thông tin tổng hợp lịch và công việc trong ngày hôm nay"""
    today = date.today()
    start_of_day = datetime.combine(today, time.min)
    end_of_day = datetime.combine(today, time.max)

    # 1. Events today
    events_today = await event_service.get_events_in_range(
        db, user_id=current_user.id, start_at=start_of_day, end_at=end_of_day
    )

    # 2. Tasks in My Day
    tasks_my_day = await task_service.get_tasks(
        db, user_id=current_user.id, view="my_day"
    )

    # 3. Overdue tasks count
    overdue_stmt = select(func.count(Task.id)).where(
        Task.user_id == current_user.id,
        Task.is_completed == False,
        Task.due_date < today
    )
    overdue_count = (await db.execute(overdue_stmt)).scalar() or 0

    # 4. Tasks due today count
    due_today_stmt = select(func.count(Task.id)).where(
        Task.user_id == current_user.id,
        Task.is_completed == False,
        Task.due_date == today
    )
    due_today_count = (await db.execute(due_today_stmt)).scalar() or 0

    # 5. Completed today count
    completed_today_stmt = select(func.count(Task.id)).where(
        Task.user_id == current_user.id,
        Task.is_completed == True,
        Task.completed_at >= start_of_day,
        Task.completed_at <= end_of_day
    )
    completed_today_count = (await db.execute(completed_today_stmt)).scalar() or 0

    return DashboardTodayResponse(
        date=today,
        events_today=events_today,
        events_count=len(events_today),
        tasks_my_day=tasks_my_day,
        tasks_overdue_count=overdue_count,
        tasks_due_today_count=due_today_count,
        tasks_completed_today_count=completed_today_count
    )

