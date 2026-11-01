from typing import List, Optional
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.crud.task_crud import task_crud
from app.crud.task_list_crud import task_list_crud
from app.models.task_model import Task, TaskStep
from app.schemas.task_schema import (
    TaskCreate, TaskUpdate, TaskStepCreate, TaskStepUpdate, ItemReorder
)

class TaskService:
    async def get_tasks(
        self,
        db: AsyncSession,
        user_id: int,
        list_id: Optional[int] = None,
        view: Optional[str] = None,
        is_completed: Optional[bool] = None,
        due_before: Optional[date] = None,
        due_after: Optional[date] = None
    ) -> List[Task]:
        return await task_crud.get_by_filters(
            db,
            user_id=user_id,
            list_id=list_id,
            view=view,
            is_completed=is_completed,
            due_before=due_before,
            due_after=due_after
        )

    async def get_task_by_id(self, db: AsyncSession, task_id: int, user_id: int) -> Task:
        task = await task_crud.get_with_steps(db, task_id=task_id)
        if not task or task.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy công việc này.")
        return task

    async def create_task(self, db: AsyncSession, user_id: int, task_in: TaskCreate) -> Task:
        if not task_in.list_id:
            default_list = await task_list_crud.get_default(db, user_id)
            if default_list:
                task_in.list_id = default_list.id
            else:
                user_lists = await task_list_crud.get_by_user(db, user_id)
                if user_lists:
                    task_in.list_id = user_lists[0]["id"]
                else:
                    from app.schemas.task_schema import TaskListCreate
                    new_list = await task_list_crud.create(
                        db, user_id=user_id,
                        obj_in=TaskListCreate(name="Tasks", color="#4285F4"),
                        is_default=True
                    )
                    task_in.list_id = new_list.id

        return await task_crud.create(db, user_id=user_id, obj_in=task_in)

    async def update_task(self, db: AsyncSession, task_id: int, user_id: int, task_in: TaskUpdate) -> Task:
        task = await self.get_task_by_id(db, task_id, user_id)
        return await task_crud.update(db, db_obj=task, obj_in=task_in)

    async def toggle_complete(self, db: AsyncSession, task_id: int, user_id: int, is_completed: bool) -> Task:
        task = await self.get_task_by_id(db, task_id, user_id)
        updated_task = await task_crud.set_complete(db, db_obj=task, is_completed=is_completed)

        # If completed and task has recurrence, generate the next cycle task!
        if is_completed and task.recurrence_rule:
            next_due_date = self._calculate_next_due_date(task.due_date, task.recurrence_rule)
            new_task_in = TaskCreate(
                title=task.title,
                note=task.note,
                list_id=task.list_id,
                is_important=task.is_important,
                is_in_my_day=False,
                due_date=next_due_date,
                due_time=task.due_time,
                start_time=task.start_time,
                end_time=task.end_time,
                duration_minutes=task.duration_minutes,
                is_all_day=task.is_all_day,
                color=task.color,
                reminder_at=None,
                recurrence_rule=task.recurrence_rule,
                steps=[TaskStepCreate(title=s.title, position=s.position) for s in task.steps]
            )
            await task_crud.create(db, user_id=user_id, obj_in=new_task_in)

        return updated_task

    async def toggle_important(self, db: AsyncSession, task_id: int, user_id: int, is_important: bool) -> Task:
        task = await self.get_task_by_id(db, task_id, user_id)
        return await task_crud.set_important(db, db_obj=task, is_important=is_important)

    async def toggle_my_day(self, db: AsyncSession, task_id: int, user_id: int, is_in_my_day: bool) -> Task:
        task = await self.get_task_by_id(db, task_id, user_id)
        return await task_crud.set_my_day(db, db_obj=task, is_in_my_day=is_in_my_day)

    async def delete_task(self, db: AsyncSession, task_id: int, user_id: int) -> None:
        task = await self.get_task_by_id(db, task_id, user_id)
        await task_crud.delete(db, db_obj=task)

    async def reorder_tasks(self, db: AsyncSession, user_id: int, items: List[ItemReorder]) -> None:
        await task_crud.reorder(db, user_id=user_id, items=items)

    # --- Steps ---
    async def add_step(self, db: AsyncSession, task_id: int, user_id: int, step_in: TaskStepCreate) -> TaskStep:
        await self.get_task_by_id(db, task_id, user_id)
        return await task_crud.add_step(db, task_id=task_id, obj_in=step_in)

    async def update_step(self, db: AsyncSession, task_id: int, step_id: int, user_id: int, step_in: TaskStepUpdate) -> TaskStep:
        task = await self.get_task_by_id(db, task_id, user_id)
        step = next((s for s in task.steps if s.id == step_id), None)
        if not step:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bước này.")
        return await task_crud.update_step(db, step_obj=step, obj_in=step_in)

    async def delete_step(self, db: AsyncSession, task_id: int, step_id: int, user_id: int) -> None:
        task = await self.get_task_by_id(db, task_id, user_id)
        step = next((s for s in task.steps if s.id == step_id), None)
        if not step:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bước này.")
        await task_crud.delete_step(db, step_obj=step)

    def _calculate_next_due_date(self, current_due: Optional[date], rrule_str: str) -> date:
        base_date = current_due or date.today()
        upper = rrule_str.upper()
        if "FREQ=DAILY" in upper:
            return base_date + timedelta(days=1)
        elif "FREQ=WEEKLY" in upper:
            return base_date + timedelta(days=7)
        elif "FREQ=MONTHLY" in upper:
            # Approximate next month
            month = base_date.month + 1
            year = base_date.year
            if month > 12:
                month = 1
                year += 1
            return base_date.replace(year=year, month=month)
        elif "FREQ=YEARLY" in upper:
            return base_date.replace(year=base_date.year + 1)
        return base_date + timedelta(days=1)

task_service = TaskService()

