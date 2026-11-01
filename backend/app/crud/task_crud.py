from typing import List, Optional
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.crud.base import CRUDBase
from app.models.task_model import Task, TaskStep
from app.schemas.task_schema import TaskCreate, TaskUpdate, TaskStepCreate, TaskStepUpdate, ItemReorder

class CRUDTask(CRUDBase[Task]):
    async def get_with_steps(self, db: AsyncSession, task_id: int) -> Optional[Task]:
        stmt = (
            select(Task)
            .options(selectinload(Task.steps))
            .where(Task.id == task_id)
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_by_filters(
        self,
        db: AsyncSession,
        user_id: int,
        list_id: Optional[int] = None,
        view: Optional[str] = None,
        is_completed: Optional[bool] = None,
        due_before: Optional[date] = None,
        due_after: Optional[date] = None
    ) -> List[Task]:
        stmt = (
            select(Task)
            .options(selectinload(Task.steps))
            .where(Task.user_id == user_id)
        )

        today = date.today()

        if view == "my_day":
            stmt = stmt.where(Task.is_in_my_day == True, Task.my_day_date == today)
        elif view == "important":
            stmt = stmt.where(Task.is_important == True)
        elif view == "planned":
            stmt = stmt.where(Task.due_date.isnot(None))
        elif view == "all":
            pass  # return all
        elif list_id is not None:
            stmt = stmt.where(Task.list_id == list_id)

        if is_completed is not None:
            stmt = stmt.where(Task.is_completed == is_completed)

        if due_before is not None:
            stmt = stmt.where(Task.due_date <= due_before)

        if due_after is not None:
            stmt = stmt.where(Task.due_date >= due_after)

        stmt = stmt.order_by(Task.position.asc(), Task.id.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, user_id: int, obj_in: TaskCreate) -> Task:
        today = date.today()
        db_obj = Task(
            user_id=user_id,
            list_id=obj_in.list_id,
            title=obj_in.title,
            note=obj_in.note,
            is_important=obj_in.is_important,
            is_in_my_day=obj_in.is_in_my_day,
            my_day_date=today if obj_in.is_in_my_day else None,
            due_date=obj_in.due_date,
            due_time=obj_in.due_time,
            start_time=obj_in.start_time,
            end_time=obj_in.end_time,
            duration_minutes=obj_in.duration_minutes if obj_in.duration_minutes is not None else 60,
            is_all_day=obj_in.is_all_day if obj_in.is_all_day is not None else True,
            color=obj_in.color,
            reminder_at=obj_in.reminder_at,
            recurrence_rule=obj_in.recurrence_rule,
            position=getattr(obj_in, "position", 0) or 0
        )
        db.add(db_obj)
        await db.flush()

        if obj_in.steps:
            for idx, step in enumerate(obj_in.steps):
                step_obj = TaskStep(
                    task_id=db_obj.id,
                    title=step.title,
                    position=step.position or idx
                )
                db.add(step_obj)

        await db.commit()
        return await self.get_with_steps(db, db_obj.id)

    async def update(self, db: AsyncSession, db_obj: Task, obj_in: TaskUpdate) -> Task:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "is_in_my_day" and value is True:
                db_obj.my_day_date = date.today()
            elif field == "is_in_my_day" and value is False:
                db_obj.my_day_date = None
            setattr(db_obj, field, value)

        await db.commit()
        return await self.get_with_steps(db, db_obj.id)

    async def set_complete(self, db: AsyncSession, db_obj: Task, is_completed: bool) -> Task:
        db_obj.is_completed = is_completed
        db_obj.completed_at = datetime.now() if is_completed else None
        await db.commit()
        return await self.get_with_steps(db, db_obj.id)

    async def set_important(self, db: AsyncSession, db_obj: Task, is_important: bool) -> Task:
        db_obj.is_important = is_important
        await db.commit()
        return await self.get_with_steps(db, db_obj.id)

    async def set_my_day(self, db: AsyncSession, db_obj: Task, is_in_my_day: bool) -> Task:
        db_obj.is_in_my_day = is_in_my_day
        db_obj.my_day_date = date.today() if is_in_my_day else None
        await db.commit()
        return await self.get_with_steps(db, db_obj.id)

    async def delete(self, db: AsyncSession, db_obj: Task) -> None:
        await db.delete(db_obj)
        await db.commit()

    async def reorder(self, db: AsyncSession, user_id: int, items: List[ItemReorder]) -> None:
        for item in items:
            stmt = select(Task).where(Task.id == item.id, Task.user_id == user_id)
            obj = (await db.execute(stmt)).scalars().first()
            if obj:
                obj.position = item.position
        await db.commit()

    # --- Step Management ---
    async def add_step(self, db: AsyncSession, task_id: int, obj_in: TaskStepCreate) -> TaskStep:
        step_obj = TaskStep(
            task_id=task_id,
            title=obj_in.title,
            position=obj_in.position or 0
        )
        db.add(step_obj)
        await db.commit()
        await db.refresh(step_obj)
        return step_obj

    async def update_step(self, db: AsyncSession, step_obj: TaskStep, obj_in: TaskStepUpdate) -> TaskStep:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(step_obj, field, value)
        await db.commit()
        await db.refresh(step_obj)
        return step_obj

    async def delete_step(self, db: AsyncSession, step_obj: TaskStep) -> None:
        await db.delete(step_obj)
        await db.commit()

task_crud = CRUDTask(Task)

