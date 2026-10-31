import json
from datetime import datetime, date, time, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.event_service import event_service
from app.services.task_service import task_service
from app.services.calendar_service import calendar_service
from app.services.task_list_service import task_list_service
from app.schemas.event_schema import EventCreate, EventUpdate
from app.schemas.task_schema import TaskCreate, TaskUpdate, TaskStepCreate

class ToolExecutor:
    def __init__(self, user_id: int, db: AsyncSession):
        self.user_id = user_id
        self.db = db

    async def execute(self, tool_name: str, arguments: dict) -> dict:
        tool_map = {
            "create_event": self._create_event,
            "update_event": self._update_event,
            "delete_event": self._delete_event,
            "list_events": self._list_events,
            "create_task": self._create_task,
            "update_task": self._update_task,
            "complete_task": self._complete_task,
            "delete_task": self._delete_task,
            "list_tasks": self._list_tasks,
            "get_schedule_summary": self._get_schedule_summary,
            "list_task_lists": self._list_task_lists,
            "list_calendars": self._list_calendars,
        }

        handler = tool_map.get(tool_name)
        if not handler:
            return {"success": False, "error": f"Tool '{tool_name}' không tồn tại."}

        try:
            result = await handler(**arguments)
            return {"success": True, "data": result}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # --- Tool Implementations ---

    async def _create_event(self, title: str, start_at: str, end_at: str = None, **kwargs):
        start_dt = datetime.fromisoformat(start_at)
        end_dt = datetime.fromisoformat(end_at) if end_at else start_dt + timedelta(hours=1)
        
        event_in = EventCreate(
            title=title,
            start_at=start_dt,
            end_at=end_dt,
            description=kwargs.get("description"),
            location=kwargs.get("location"),
            is_all_day=kwargs.get("is_all_day", False),
            recurrence_rule=kwargs.get("recurrence_rule"),
            calendar_id=kwargs.get("calendar_id")
        )
        created = await event_service.create_event(self.db, user_id=self.user_id, event_in=event_in)
        return {
            "id": created.id,
            "title": created.title,
            "start_at": created.start_at.isoformat(),
            "end_at": created.end_at.isoformat(),
            "calendar_id": created.calendar_id
        }

    async def _update_event(self, event_id: int, **kwargs):
        event_in = EventUpdate(**kwargs)
        updated = await event_service.update_event(self.db, event_id=event_id, user_id=self.user_id, event_in=event_in)
        return {"id": updated.id, "title": updated.title}

    async def _delete_event(self, event_id: int, **kwargs):
        await event_service.delete_event(self.db, event_id=event_id, user_id=self.user_id)
        return {"deleted_event_id": event_id}

    async def _list_events(self, start_date: str = None, end_date: str = None, calendar_id: int = None, **kwargs):
        today = date.today()
        start_dt = datetime.fromisoformat(start_date) if start_date else datetime.combine(today, time.min)
        end_dt = datetime.fromisoformat(end_date) if end_date else start_dt + timedelta(days=7)
        
        events = await event_service.get_events_in_range(
            self.db, user_id=self.user_id, start_at=start_dt, end_at=end_dt, calendar_id=calendar_id
        )
        return [
            {
                "id": e.id,
                "title": e.title,
                "start_at": e.start_at.isoformat(),
                "end_at": e.end_at.isoformat(),
                "location": e.location
            }
            for e in events
        ]

    async def _create_task(self, title: str, steps: list = None, **kwargs):
        task_in = TaskCreate(
            title=title,
            note=kwargs.get("note"),
            list_id=kwargs.get("list_id"),
            due_date=date.fromisoformat(kwargs["due_date"]) if kwargs.get("due_date") else None,
            due_time=time.fromisoformat(kwargs["due_time"]) if kwargs.get("due_time") else None,
            is_important=kwargs.get("is_important", False),
            is_in_my_day=kwargs.get("is_in_my_day", False),
            steps=[TaskStepCreate(title=s) for s in steps] if steps else None
        )
        created = await task_service.create_task(self.db, user_id=self.user_id, task_in=task_in)
        return {
            "id": created.id,
            "title": created.title,
            "is_important": created.is_important,
            "is_in_my_day": created.is_in_my_day,
            "due_date": str(created.due_date) if created.due_date else None
        }

    async def _update_task(self, task_id: int, **kwargs):
        if "due_date" in kwargs and kwargs["due_date"]:
            kwargs["due_date"] = date.fromisoformat(kwargs["due_date"])
        if "due_time" in kwargs and kwargs["due_time"]:
            kwargs["due_time"] = time.fromisoformat(kwargs["due_time"])

        task_in = TaskUpdate(**kwargs)
        updated = await task_service.update_task(self.db, task_id=task_id, user_id=self.user_id, task_in=task_in)
        return {"id": updated.id, "title": updated.title}

    async def _complete_task(self, task_id: int, is_completed: bool, **kwargs):
        updated = await task_service.toggle_complete(self.db, task_id=task_id, user_id=self.user_id, is_completed=is_completed)
        return {"id": updated.id, "title": updated.title, "is_completed": updated.is_completed}

    async def _delete_task(self, task_id: int, **kwargs):
        await task_service.delete_task(self.db, task_id=task_id, user_id=self.user_id)
        return {"deleted_task_id": task_id}

    async def _list_tasks(self, view: str = None, list_id: int = None, is_completed: bool = None, **kwargs):
        tasks = await task_service.get_tasks(
            self.db, user_id=self.user_id, view=view, list_id=list_id, is_completed=is_completed
        )
        return [
            {
                "id": t.id,
                "title": t.title,
                "is_completed": t.is_completed,
                "is_important": t.is_important,
                "is_in_my_day": t.is_in_my_day,
                "due_date": str(t.due_date) if t.due_date else None
            }
            for t in tasks
        ]

    async def _get_schedule_summary(self, date_str: str = None, **kwargs):
        target_date = date.fromisoformat(date_str) if date_str else date.today()
        start_dt = datetime.combine(target_date, time.min)
        end_dt = datetime.combine(target_date, time.max)

        events = await event_service.get_events_in_range(self.db, user_id=self.user_id, start_at=start_dt, end_at=end_dt)
        my_day_tasks = await task_service.get_tasks(self.db, user_id=self.user_id, view="my_day")
        overdue_tasks = await task_service.get_tasks(self.db, user_id=self.user_id, due_before=target_date, is_completed=False)

        return {
            "date": str(target_date),
            "events": [{"title": e.title, "time": f"{e.start_at.strftime('%H:%M')} - {e.end_at.strftime('%H:%M')}"} for e in events],
            "my_day_tasks": [{"title": t.title, "is_completed": t.is_completed, "is_important": t.is_important} for t in my_day_tasks],
            "overdue_tasks": [{"title": t.title, "due_date": str(t.due_date)} for t in overdue_tasks]
        }

    async def _list_task_lists(self, **kwargs):
        return await task_list_service.get_task_lists(self.db, user_id=self.user_id)

    async def _list_calendars(self, **kwargs):
        cals = await calendar_service.get_calendars(self.db, user_id=self.user_id)
        return [{"id": c.id, "name": c.name, "color": c.color, "is_default": c.is_default} for c in cals]

