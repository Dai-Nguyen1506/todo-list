from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from app.schemas.event_schema import EventResponse
from app.schemas.task_schema import TaskResponse

class DashboardTodayResponse(BaseModel):
    date: date
    events_today: List[EventResponse] = []
    events_count: int = 0
    tasks_my_day: List[TaskResponse] = []
    tasks_overdue_count: int = 0
    tasks_due_today_count: int = 0
    tasks_completed_today_count: int = 0

