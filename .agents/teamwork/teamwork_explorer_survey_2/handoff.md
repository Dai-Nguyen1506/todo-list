# Backend & Systems Survey Report

**Explorer**: `teamwork_explorer_survey_2`  
**Milestone**: Survey & Investigation Phase  
**Target Environment**: Docker Container Stack (`web-template-backend-1`, `web-template-db-postgre-1`, `web-template-redis-1`, `web-template-frontend-1`)  
**Working Directory**: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_explorer_survey_2/`

---

## 1. Observation

### 1.1 Docker Container Stack Status & Environment
Executing `docker ps` outputs:
```
CONTAINER ID   IMAGE                   COMMAND                  CREATED        STATUS                  PORTS                                         NAMES
da134cd3b28c   web-template-frontend   "/docker-entrypoint.…"   10 hours ago   Up 10 hours             0.0.0.0:3000->80/tcp, [::]:3000->80/tcp       web-template-frontend-1
51db090886f4   web-template-backend    "sh /app/entrypoint.…"   10 hours ago   Up 10 hours (healthy)   0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp   web-template-backend-1
f43094d18922   postgres:15-alpine      "docker-entrypoint.s…"   10 hours ago   Up 10 hours (healthy)   0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp   web-template-db-postgre-1
a0736fdede74   redis:7-alpine          "docker-entrypoint.s…"   10 hours ago   Up 10 hours (healthy)   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp   web-template-redis-1
```
- Docker Compose configuration (`docker-compose.yml:1-77`):
  - Backend runs `uvicorn main:app --host 0.0.0.0 --port 8000 --reload` mounted to `./backend:/app`.
  - Database URL: `postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db-postgre:5432/${POSTGRES_DB}`.
  - Redis URL: `redis://:${REDIS_PASSWORD}@redis:6379/0`.
  - Healthcheck: `python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"` (interval 10s, timeout 5s, retries 3).
- Alembic database migration status (`docker exec web-template-backend-1 alembic current`):
  - Current revision: `fe8fe70309cc (head)`.
  - Database tables verified: `['alembic_version', 'users', 'ai_conversations', 'calendars', 'categories', 'task_lists', 'ai_messages', 'events', 'tasks', 'event_reminders', 'task_steps']`.
- Backend logs (`docker logs web-template-backend-1`):
  - 0 unhandled `HTTP 500 Internal Server Error` exceptions.
  - Groq rate limiting: Warnings and errors recorded when calling `https://api.groq.com/openai/v1/chat/completions`:
    - `[WARNING] agent.py:129 - Groq API 429 rate limit hit, retry attempt 1...`
    - `[ERROR] agent.py:54 - Error calling Groq API: Client error '429 Too Many Requests'`
    - Gracefully caught and handled via retry attempts and fallback messages.

### 1.2 Test Suite Execution & Results
Direct command `docker exec web-template-backend-1 pytest` failed with:
`OCI runtime exec failed: exec failed: unable to start container process: exec: "pytest": executable file not found in $PATH`
Inspection of `backend/requirements.txt:1-26` confirms `pytest` is not included in the container dependencies. However, tests are written as standalone async/sync test scripts hitting `http://localhost:8000/api/v1` via `httpx`.

All 5 existing test scripts were executed directly inside `web-template-backend-1`:
1. `python tests/test_phase1_api.py`:
   - 10 integration stages: User registration, login, auto-seeded calendar & task list, profile update, calendar CRUD, events CRUD & recurrence, tasks CRUD & steps, categories, dashboard today, AI conversations.
   - Result: `🎉 ALL PHASE 1 INTEGRATION TESTS PASSED 100%!`, Exit code: 0.
2. `python tests/test_audit_fixes.py`:
   - 4 verification checks: Custom list creation, task time-blocking (`start_time`, `end_time`, `duration_minutes`, `is_all_day`), recurring task completion & cycle generation, AI Agent tool execution.
   - Result: `🎉 ALL AUDIT & BUGFIX VERIFICATION TESTS PASSED 100%!`, Exit code: 0.
3. `python tests/test_phase4_todo.py`:
   - To-Do features: Custom lists, task steps, task completion, smart lists (`my_day`, `important`, `planned`), step deletion.
   - Result: `🎉 ALL PHASE 4 BACKEND & TO-DO AUTOMATED TESTS PASSED 100%!`, Exit code: 0.
4. `python tests/test_phase5_ai.py`:
   - AI Agent features: AI conversation management, guardrails (refusing math equations), advisory advice, quick chat, Redis rate limiting (>30 requests/minute).
   - Result: `🎉 ALL PHASE 5 AI AGENT AUTOMATED TESTS PASSED 100%!`, Exit code: 0.
5. `python tests/test_phase6_cross_module.py`:
   - Cross-module scenarios: AI creates event -> calendar checks; AI creates task -> To Do checks; task completion from calendar; cascade list deletion.
   - Result: `🎉 ALL PHASE 6 CROSS-MODULE TESTS PASSED 100%!`, Exit code: 0.

### 1.3 Backend Architecture, Models, and APIs
- Framework: `FastAPI` with `async/await` throughout, `SQLAlchemy 2.0 (asyncio)` with `asyncpg`, `Pydantic v2` schemas, and `aioredis` (Redis 7).
- Layered Architecture:
  - `app/api/v1/endpoints/`: Route controllers (`auth.py`, `users.py`, `calendars.py`, `events.py`, `task_lists.py`, `tasks.py`, `task_steps.py`, `categories.py`, `dashboard.py`, `ai_chat.py`, `otp.py`, `dev.py`).
  - `app/services/`: Business logic services (`event_service.py`, `task_service.py`, `calendar_service.py`, `task_list_service.py`, `ai_service.py`, `auth_service.py`, `user_service.py`, `dev_service.py`).
  - `app/crud/`: Async database operations extending `CRUDBase[T]` (`event_crud.py`, `task_crud.py`, `calendar_crud.py`, `task_list_crud.py`, `ai_crud.py`, `user_crud.py`).
  - `app/models/`: SQLAlchemy declarative models:
    - `User`: `id`, `email`, `nickname`, `password_hashed`, `theme_preference`, `timezone`.
    - `Calendar`: `id`, `user_id`, `name`, `color`, `is_default`, `is_visible`.
    - `Event`: `id`, `user_id`, `calendar_id`, `title`, `description`, `location`, `start_at`, `end_at`, `is_all_day`, `color`, `recurrence_rule`, `recurrence_end`, `parent_event_id`, `is_exception`, `is_cancelled`, `original_start`.
    - `EventReminder`: `id`, `event_id`, `minutes_before`, `is_sent`.
    - `TaskList`: `id`, `user_id`, `name`, `color`, `icon`, `position`, `is_default`.
    - `Task`: `id`, `user_id`, `list_id`, `title`, `note`, `is_completed`, `is_important`, `is_in_my_day`, `my_day_date`, `due_date`, `due_time`, `start_time`, `end_time`, `duration_minutes`, `is_all_day`, `color`, `reminder_at`, `recurrence_rule`, `position`, `completed_at`.
    - `TaskStep`: `id`, `task_id`, `title`, `is_completed`, `position`.
    - `Category`: `id`, `user_id`, `name`, `color`.
    - `AIConversation`: `id`, `user_id`, `title`, `created_at`, `updated_at`.
    - `AIMessage`: `id`, `conversation_id`, `role`, `content`, `tool_calls` (JSON Text), `tool_results` (JSON Text).

### 1.4 Recurrence Implementation Details & Concrete Code Defects
1. **Task Recurrence in `backend/app/services/task_service.py:125-143`**:
   ```python
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
   ```
   - **Month-end Date Overflow Crash**: If `base_date` is on the 29th, 30th, or 31st (e.g. Jan 31 -> Feb 31, March 31 -> April 31, Aug 31 -> Sept 31), `base_date.replace(...)` raises an uncaught `ValueError: day is out of range for month`.
   - **Leap-Year Overflow Crash**: If `base_date` is Feb 29 (leap year), `base_date.replace(year=base_date.year + 1)` crashes with `ValueError: day is out of range for month`.
   - **Ignored Parameters**:
     - `INTERVAL` (e.g., `FREQ=WEEKLY;INTERVAL=2` for bi-weekly) is ignored; always increments by 1 period.
     - `BYDAY` (e.g., `FREQ=WEEKLY;BYDAY=MO,WE,FR`) is ignored; always adds 7 days.
     - `COUNT` and `UNTIL` are ignored; completing recurring tasks generates infinite cycles regardless of termination rules.
     - Overdue tasks: Uses `current_due` as base date; completing an overdue task due 3 weeks ago creates a task due 2 weeks in the past rather than the next valid future occurrence.

2. **Event Exception Creation in `backend/app/services/event_service.py:69-87`**:
   ```python
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
   ```
   - `original_start=event.start_at` sets the exception anchor to the master event's initial start time instead of the occurrence instance being updated.
   - `EventUpdate` schema (`backend/app/schemas/event_schema.py:34-48`) does not declare `original_start: Optional[datetime] = None`, making it impossible for the client to specify which instance was changed.
   - `scope == "following"` is unhandled; lines 89-90 fall through to updating the entire master event series.
   - In `delete_event` (`event_service.py:92-100`):
     ```python
     async def delete_event(self, db: AsyncSession, event_id: int, user_id: int, scope: str = "this") -> None:
         event = await self.get_event_by_id(db, event_id, user_id)
         await event_crud.delete(db, db_obj=event)
     ```
     `scope` is completely ignored. Deleting a recurring occurrence (`scope="this"`) deletes the entire master event row in the database, erasing all historical and future occurrences.

3. **Frontend Occurrence Expander in `frontend/js/calendar/rrule.js:200-209`**:
   ```javascript
   static expandAll(events, rangeStart, rangeEnd) {
     const list = [];
     for (const ev of events) {
       if (ev.is_cancelled) continue;
       const occs = this.expand(ev, rangeStart, rangeEnd);
       list.push(...occs);
     }
     return list;
   }
   ```
   - `expandAll` does not correlate master events with exception events (`is_exception: true, parent_event_id: master.id`).
   - Consequently, both the generated occurrence from the master event AND the modified exception card are rendered on the calendar grid, causing duplicate entries on the day of the modification.
   - When an exception is cancelled (`is_cancelled: true`), the master event still expands that occurrence because neither `EXDATE` nor exception date exclusions are checked during expansion.

### 1.5 Task <-> Calendar Synchronization Mechanisms
- **Data Model**: Two independent database tables (`tasks` and `events`).
- **Calendar Time-Blocking Properties**:
  - `Task` model has `due_date`, `due_time`, `start_time`, `end_time`, `duration_minutes`, `is_all_day`, `color`.
- **Query & Transformation Flow**:
  - When the calendar page renders (`frontend/js/pages/calendar.js:268-278`), it executes:
    `Promise.all([api.get('/events', { start, end }), api.get('/tasks', { is_completed: false })])`.
  - `adaptTasksForCalendar()` (`frontend/js/calendar/task-adapter.js`) maps tasks with `due_date` into calendar items (`is_task: true`):
    - All-day tasks (`is_all_day: true` or no `start_time`): Displayed in the All-Day slot.
    - Time-blocked tasks: Displayed at `start_time` with height corresponding to `duration_minutes`.
- **Interactive Sync**:
  - Checking a task complete in the Calendar view calls `PATCH /tasks/{id}/complete` (`frontend/js/calendar/event-card.js:41`), triggering a local `task-changed` custom event to refresh views.
  - Cross-module test (`test_phase6_cross_module.py:61-66`) verifies that task completion via `PATCH /tasks/{id}/complete` reflects across views.
- **Sync Limitations**:
  - Only uncompleted tasks are loaded into Calendar (`is_completed: false`). Historical completed tasks cannot be reviewed on past days in Calendar.
  - Recurring tasks (`recurrence_rule`) do not expand future occurrences on Calendar until the current cycle is completed.
  - No WebSockets, SSE, or Redis Pub/Sub for cross-tab or multi-device push synchronization. Sync is pull-based upon view navigation or local DOM event dispatching.

### 1.6 AI Agent Architecture & Capabilities
- **LLM Integration**:
  - Service: Groq API (`https://api.groq.com/openai/v1/chat/completions`).
  - Model: `openai/gpt-oss-120b` (`backend/app/core/config.py:36`).
  - Temperature: `0.2`, Max Tokens: `1024`.
- **Tool Calling System** (12 tools registered in `backend/app/ai/tools.py`):
  1. `create_event`: Creates calendar event (supports `start_at`, `end_at`, `recurrence_rule`, `is_all_day`).
  2. `update_event`: Updates title, time, recurrence, location.
  3. `delete_event`: Deletes event by ID.
  4. `list_events`: Lists events between dates.
  5. `create_task`: Creates To-Do task with time-blocking (`start_time`, `end_time`, `duration_minutes`), recurrence (`recurrence_rule`), `steps`, `due_date`, `is_important`, `is_in_my_day`.
  6. `update_task`: Modifies existing task attributes.
  7. `complete_task`: Marks task completed / uncompleted.
  8. `delete_task`: Removes task by ID.
  9. `list_tasks`: Traverses tasks with smart list views (`my_day`, `important`, `planned`, `all`).
  10. `get_schedule_summary`: Aggregates events, My Day tasks, and overdue tasks for a target date.
  11. `list_task_lists`: Retrieves user's task lists.
  12. `list_calendars`: Retrieves user's calendars.
- **Prompt Engineering & Guardrails (`backend/app/ai/prompts.py`)**:
  - Strict scope limitation: Restricts assistant strictly to calendar, tasks, productivity, and scheduling. Rejects general programming, mathematics, politics, and general trivia.
  - RFC 5545 RRULE instructions embedded: `FREQ=DAILY`, `FREQ=WEEKLY`, `FREQ=WEEKLY;BYDAY=MO,WE,FR`, `FREQ=MONTHLY`, `FREQ=YEARLY`.
  - Context injection: Injects `{current_time}` and `{user_timezone}` dynamically into system prompt.
  - Multi-turn execution loop (`backend/app/ai/agent.py`): Tool executor runs tools, appends tool results, and invokes a second LLM turn to generate user-friendly confirmations.
- **Resilience & Rate Limiting**:
  - Redis fixed-window rate limiter: Enforces 30 messages/minute per user (`backend/app/core/rate_limit.py`).
  - Upstream Groq 429 handler: Automatically retries up to 3 attempts with exponential backoff (2s, 4s); falls back gracefully if rate limit persists.

---

## 2. Logic Chain

1. **Premise 1 (Test Suites)**:
   - Direct execution of all 5 test scripts (`test_phase1_api.py`, `test_audit_fixes.py`, `test_phase4_todo.py`, `test_phase5_ai.py`, `test_phase6_cross_module.py`) inside `web-template-backend-1` completed with exit code 0.
   - Inference: Current implemented endpoints function properly under their specified test cases, and the existing automated test suite is fully passing.

2. **Premise 2 (Container Stack Health)**:
   - All 4 containers (`web-template-frontend-1`, `web-template-backend-1`, `web-template-db-postgre-1`, `web-template-redis-1`) have status `Up 10 hours (healthy)`.
   - Inspection of backend logs showed 0 HTTP 500 unhandled exceptions.
   - Inference: The FastAPI runtime, PostgreSQL database, and Redis cache layer are stable and correctly networked in the Docker environment.

3. **Premise 3 (Recurrence Mechanics Gap)**:
   - Observation 1.4 reveals `_calculate_next_due_date` in `task_service.py:139` uses `base_date.replace(month=month)`. In Python's standard `datetime.date`, attempting `.replace(month=2)` on January 31 raises `ValueError: day is out of range for month`.
   - Observation 1.4 reveals `event_service.py:83` sets `original_start=event.start_at` on recurring exceptions, and `event_service.py:97-100` deletes the entire master event when `scope="this"`.
   - Observation 1.4 reveals `rrule.js:200-209` does not suppress master occurrences when an exception event exists.
   - Inference: While basic happy-path recurrence tests pass for simple weekly tasks, edge-case calculations (end-of-month, leap-year, bi-weekly, recurring event exception updates, single-instance deletion) will cause data loss, crashes, or duplicate visual cards.

4. **Premise 4 (Task-Calendar Synchronization Gap)**:
   - Tasks and events are maintained in separate tables (`tasks` and `events`).
   - Time-blocking is bridged client-side in `task-adapter.js`.
   - Completed tasks are excluded from Calendar loading (`is_completed: false`), and future recurring task cycles are not projected onto Calendar until the current cycle is completed.
   - Inference: While task-calendar integration works for active single tasks, it lacks multi-occurrence projection, historical task viewing on calendar, and bi-directional drag-and-drop rescheduling.

5. **Premise 5 (AI Agent Readiness)**:
   - AI Agent properly utilizes 12 tools and enforces guardrails.
   - Groq API rate limits (HTTP 429) occur during high-frequency calling (e.g. batch automated testing) but are caught by retry loops and Redis rate limiting.
   - Inference: The AI service is functional and resilient, but requires awareness of Groq tier rate limits during concurrent user interactions.

---

## 3. Caveats

- **No Caveats on Local Stack Investigation**: All containers, database tables, service logs, and test suites were directly inspected and verified.
- **Third-Party Groq API Quota**: AI Agent performance and latency depend on the upstream Groq endpoint quota and response time.
- **Frontend Drag-and-Drop Implementation**: Calendar drag-and-drop for tasks and events is specified in the benchmark requirements (`docs/03-calendar-features.md`) but was observed to be absent in the current JavaScript client code. Backend endpoints support update operations, but drag interaction logic belongs to the frontend scope.

---

## 4. Conclusion

1. **System & Architecture Health**:
   - The Planify backend architecture (`FastAPI`, `SQLAlchemy async`, `PostgreSQL 15`, `Redis 7`) is structurally solid, properly containerized, and passes 100% of the existing 5 test suites with 0 unhandled 500 exceptions in Docker logs.
   - Database schema and Alembic migrations (`fe8fe70309cc`) are fully up to date and consistent across models.

2. **Priority Defects & Gaps Identified for Remediation**:
   - **Critical Defect 1 (Task Recurrence Math Bug)**: In `backend/app/services/task_service.py:125-143`, monthly/yearly calculation will crash on day 29-31 (`ValueError`). Must use `calendar.monthrange` or a robust date-math library/utility to clamp days to month boundaries, and parse `INTERVAL`, `BYDAY`, `UNTIL`, and `COUNT`.
   - **Critical Defect 2 (Recurring Event Exception & Deletion Bug)**: In `backend/app/services/event_service.py:70-100`, `original_start` must be passed from the client for the specific occurrence, `scope="following"` must split the series (set `recurrence_end` on the parent), and deleting an instance (`scope="this"`) must create a cancelled exception (`is_cancelled=True, parent_event_id=..., original_start=...`) rather than deleting the master event.
   - **High Defect 3 (Occurrence Deduplication)**: In `frontend/js/calendar/rrule.js:200-209`, `expandAll()` must exclude occurrences where a corresponding exception event (by `parent_event_id` and `original_start` / `recurrence_instance_date`) already exists.
   - **Usability Gap 4 (Task-Calendar Parity)**: Recurring tasks do not project future cycles onto calendar views, completed tasks are hidden, and drag-and-drop rescheduling is not yet implemented.

---

## 5. Verification Method

To independently verify the observations, test results, and system state, execute the following commands in the workspace root:

1. **Inspect Docker Stack Status**:
   ```bash
   docker ps
   docker logs --tail 50 web-template-backend-1
   docker exec web-template-backend-1 alembic current
   ```

2. **Execute Full Backend Test Suites in Docker**:
   ```bash
   docker exec web-template-backend-1 python tests/test_phase1_api.py
   docker exec web-template-backend-1 python tests/test_audit_fixes.py
   docker exec web-template-backend-1 python tests/test_phase4_todo.py
   docker exec web-template-backend-1 python tests/test_phase5_ai.py
   docker exec web-template-backend-1 python tests/test_phase6_cross_module.py
   ```

3. **Verify Recurrence Month-End Overflow Bug**:
   ```bash
   docker exec web-template-backend-1 python -c "
   from datetime import date
   from app.services.task_service import task_service
   try:
       next_due = task_service._calculate_next_due_date(date(2026, 1, 31), 'FREQ=MONTHLY')
       print('Next due:', next_due)
   except ValueError as e:
       print('Confirmed Defect: ValueError caught:', e)
   "
   ```
   *Expected output*: `Confirmed Defect: ValueError caught: day is out of range for month`.

4. **Verify Single-Instance Event Deletion Deletes Master Event**:
   Inspect `backend/app/services/event_service.py:92-100` and confirm that `scope` is unused and `await event_crud.delete(db, db_obj=event)` deletes the entire master row.
