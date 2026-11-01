# Milestone M1 Task: Backend Core & Recurrence Fixes

## Role: teamwork_worker
## Working Directory: /home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_worker_m1_1/

## Objective
Implement genuine fixes for all recurrence engine bugs, event exception handling, series splitting, single-instance deletion, and task reordering persistence on the Planify backend.

## Exclusive Write Ownership
You exclusively own and may modify:
- `backend/app/services/task_service.py`
- `backend/app/services/event_service.py`
- `backend/app/schemas/event_schema.py`
- `backend/app/api/v1/endpoints/tasks.py`
- `backend/app/crud/task_crud.py`
- `backend/tests/test_recurrence_fixes.py` (new test suite)

## Inputs & Explorer Findings
- Authoritative user request: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/ORIGINAL_REQUEST.md`
- Master project specification: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/PROJECT.md`
- Backend survey report: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_explorer_survey_2/handoff.md`

## Concrete Technical Requirements
1. **Fix Month-End Date Overflow in Task Recurrence** (`backend/app/services/task_service.py:125-143`):
   - In `_calculate_next_due_date`:
     - When calculating monthly recurrence (`FREQ=MONTHLY`), calculate target month and clamp day using `calendar.monthrange(year, month)[1]`. (e.g. Jan 31 -> Feb 28 or 29; Mar 31 -> Apr 30).
     - When calculating yearly recurrence (`FREQ=YEARLY`), clamp Feb 29 in non-leap year to Feb 28.
     - Parse `INTERVAL` (e.g. `INTERVAL=2` advances by 2 intervals).
     - Parse `BYDAY` (e.g. `BYDAY=MO,WE,FR`).
     - Support `COUNT` and `UNTIL` limits.
2. **Fix Recurring Event Exception & Deletion Handling** (`backend/app/services/event_service.py:69-100`):
   - Update `EventUpdate` schema in `backend/app/schemas/event_schema.py` to include `original_start: Optional[datetime] = None`.
   - In `update_event`:
     - When `event.recurrence_rule` and `scope == "this"`:
       - Use `event_in.original_start or event.start_at` as `original_start`.
       - Create an exception row with `parent_event_id=event.id, is_exception=True, original_start=...`.
     - When `event.recurrence_rule` and `scope == "following"`:
       - Set `recurrence_end = (event_in.original_start or event_in.start_at) - timedelta(seconds=1)` on parent event.
       - Create new recurring event series starting from `event_in.start_at`.
     - When `scope == "all"`:
       - Update master event series directly.
   - In `delete_event`:
     - When `scope == "this"` and event is recurring:
       - Do NOT delete the master event!
       - Create a cancelled exception event (`is_cancelled=True, parent_event_id=event.id, original_start=occurrence_date or event.start_at, is_exception=True`).
     - When `scope == "following"` and event is recurring:
       - Set `recurrence_end = occurrence_date - timedelta(seconds=1)` on parent series.
     - When `scope == "all"` or non-recurring:
       - Delete the master event and cascade.
3. **Task Position / Reorder Persistence**:
   - Ensure `PUT /api/v1/tasks/{id}` or a dedicated endpoint updates and persists `position: int` in PostgreSQL.
4. **Automated Verification**:
   - Create `backend/tests/test_recurrence_fixes.py` testing:
     - Jan 31 + FREQ=MONTHLY produces Feb 28 (or 29).
     - Feb 29 + FREQ=YEARLY produces Feb 28 next year.
     - Recurring task with INTERVAL=2.
     - Event update with scope="this" creates exception without altering master start.
     - Event delete with scope="this" creates is_cancelled=True exception and preserves master event.
   - Run existing test suites in Docker to verify zero regressions:
     - `docker exec web-template-backend-1 python tests/test_phase1_api.py`
     - `docker exec web-template-backend-1 python tests/test_audit_fixes.py`
     - `docker exec web-template-backend-1 python tests/test_phase4_todo.py`
     - `docker exec web-template-backend-1 python tests/test_phase5_ai.py`
     - `docker exec web-template-backend-1 python tests/test_phase6_cross_module.py`
     - `docker exec web-template-backend-1 python tests/test_recurrence_fixes.py`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
