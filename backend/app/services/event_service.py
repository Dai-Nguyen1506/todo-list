from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.crud.event_crud import event_crud
from app.crud.calendar_crud import calendar_crud
from app.models.event_model import Event
from app.schemas.event_schema import EventCreate, EventUpdate

class EventService:
    async def get_events_in_range(
        self,
        db: AsyncSession,
        user_id: int,
        start_at: datetime,
        end_at: datetime,
        calendar_id: Optional[int] = None
    ) -> List[Event]:
        return await event_crud.get_by_range(
            db,
            user_id=user_id,
            start_at=start_at,
            end_at=end_at,
            calendar_id=calendar_id
        )

    async def get_event_by_id(self, db: AsyncSession, event_id: int, user_id: int) -> Event:
        event = await event_crud.get_with_reminders(db, event_id=event_id)
        if not event or event.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy sự kiện này.")
        return event

    async def create_event(self, db: AsyncSession, user_id: int, event_in: EventCreate) -> Event:
        # If calendar_id not specified, assign default calendar
        if not event_in.calendar_id:
            default_cal = await calendar_crud.get_default(db, user_id)
            if default_cal:
                event_in.calendar_id = default_cal.id
            else:
                cals = await calendar_crud.get_by_user(db, user_id)
                if cals:
                    event_in.calendar_id = cals[0].id
                else:
                    # Create default calendar on the fly
                    from app.schemas.calendar_schema import CalendarCreate
                    new_cal = await calendar_crud.create(
                        db, user_id=user_id,
                        obj_in=CalendarCreate(name="Lịch của tôi", color="#4285F4"),
                        is_default=True
                    )
                    event_in.calendar_id = new_cal.id

        if event_in.end_at <= event_in.start_at:
            # Auto adjust end_at to 1 hour after start_at
            event_in.end_at = event_in.start_at + timedelta(hours=1)

        return await event_crud.create(db, user_id=user_id, obj_in=event_in)

    async def update_event(
        self,
        db: AsyncSession,
        event_id: int,
        user_id: int,
        event_in: EventUpdate
    ) -> Event:
        event = await self.get_event_by_id(db, event_id, user_id)
        scope = event_in.scope or "this"

        # If it's a recurring event and scope is 'this', create an exception event
        if event.recurrence_rule and scope == "this":
            exception_event = Event(
                user_id=user_id,
                calendar_id=event_in.calendar_id or event.calendar_id,
                title=event_in.title or event.title,
                description=event_in.description if event_in.description is not None else event.description,
                location=event_in.location if event_in.location is not None else event.location,
                start_at=event_in.start_at or event.start_at,
                end_at=event_in.end_at or event.end_at,
                is_all_day=event_in.is_all_day if event_in.is_all_day is not None else event.is_all_day,
                color=event_in.color or event.color,
                parent_event_id=event.id,
                is_exception=True,
                original_start=event.start_at
            )
            db.add(exception_event)
            await db.commit()
            return await event_crud.get_with_reminders(db, exception_event.id)

        # Update all or normal event
        return await event_crud.update(db, db_obj=event, obj_in=event_in)

    async def delete_event(
        self,
        db: AsyncSession,
        event_id: int,
        user_id: int,
        scope: str = "this"
    ) -> None:
        event = await self.get_event_by_id(db, event_id, user_id)
        await event_crud.delete(db, db_obj=event)

event_service = EventService()

