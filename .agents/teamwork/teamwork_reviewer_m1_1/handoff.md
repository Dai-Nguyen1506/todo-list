# Milestone M1 Independent Review & Adversarial Challenge Report

**Reviewer Agent**: `teamwork_reviewer_m1_1`  
**Roles**: Reviewer, Critic  
**Parent Agent**: `40afc6c8-54ce-40db-a75d-a5a3d1574a50`  
**Working Directory**: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_reviewer_m1_1/`  
**Verdict**: **`REQUEST_CHANGES`**  
**Integrity Audit**: Clean (0 integrity violations, 0 dummy facades, 0 hardcoded test results)  
**Date**: 2026-11-01  

---

## 1. Observation

### 1.1 Docker Test Suite Executions
All commands executed directly against the live Docker stack via `docker exec web-template-backend-1`:

1. `python tests/test_recurrence_fixes.py`:
   - Unit tests: 10/10 passed (Jan 31 non-leap -> Feb 28, Jan 31 leap 2024 -> Feb 29, Mar 31 -> Apr 30, Feb 29 leap -> Feb 28, Feb 29 + INTERVAL=4 -> Feb 29 2028, FREQ=WEEKLY;INTERVAL=2 -> 14 days, BYDAY=MO,WE,FR intra-week & inter-week jumps, COUNT=1 termination, UNTIL boundary).
   - Integration tests: 7/7 passed. Exit code: 0.

2. `python tests/test_phase1_api.py`:
   - 10 integration stages passed 100%. Exit code: 0.

3. `python tests/test_phase4_todo.py`:
   - Custom lists, task steps, task completion, smart lists (`my_day`, `important`, `planned`), step deletion passed 100%. Exit code: 0.

4. `python tests/test_e2e_suite.py --tier 1`:
   - 70/70 test cases passed. Exit code: 0. Duration: 82.58s.

5. `python tests/test_e2e_suite.py --tier 2`:
   - 9/9 test cases passed (boundaries, title limits, inverted times, concurrent collisions, month-end clamping, leap year clamping, timezone, subtask positions, invalid reorders). Exit code: 0. Duration: 0.66s.

### 1.2 Custom Adversarial Stress Test Script Executions
Executed custom adversarial test suite inside Docker testing 13 corner cases:
- Century year leap-year math: `2096-02-29` + `FREQ=YEARLY;INTERVAL=4` correctly clamped to `2100-02-28` (2100 is not a leap year).
- Negative & string intervals: `INTERVAL=-5` and `INTERVAL=invalid` clamped safely to `1` without raising exceptions.
- Dec 31 to Jan 31 year wrap-around: passed.
- Bi-weekly Thursday to Tuesday jump (`BYDAY=TU,TH;INTERVAL=2`): passed.
- Lowercase and messy whitespace in RRULE: passed.
- Result: 13/13 passed.

### 1.3 Inspection of Code Implementation and Direct Discrepancies Observed

#### Observation A: Defect in `DELETE /api/v1/events/{event_id}` Controller Layer
- In `backend/app/services/event_service.py` (lines 143-155):
  ```python
  async def delete_event(
      self,
      db: AsyncSession,
      event_id: int,
      user_id: int,
      scope: str = "this",
      occurrence_date: Optional[datetime] = None
  ) -> None:
      event = await self.get_event_by_id(db, event_id, user_id)

      if event.recurrence_rule and not event.is_exception and scope == "this":
          inst_start = occurrence_date or event.start_at
          ...
          cancelled_event = Event(
              ...
              start_at=inst_start,
              end_at=inst_start + duration,
              is_exception=True,
              is_cancelled=True,
              original_start=inst_start
          )
  ```
- In `backend/app/api/v1/endpoints/events.py` (lines 60-68):
  ```python
  @router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
  async def delete_event(
      event_id: int,
      scope: str = Query("this", pattern="^(this|following|all)$"),
      db: AsyncSession = Depends(get_db),
      current_user: User = Depends(get_current_user)
  ):
      """Xóa sự kiện"""
      await event_service.delete_event(db, event_id=event_id, user_id=current_user.id, scope=scope)
  ```
- **Observed Behavior via Live API Test**:
  Executed a live test against Docker FastAPI:
  - Created weekly recurring event starting on `2026-11-01T09:00:00`.
  - Sent HTTP request: `DELETE /api/v1/events/{id}?scope=this&occurrence_date=2026-11-15T09:00:00` (aiming to delete occurrence on Nov 15, week 3).
  - Queried PostgreSQL for the created cancelled exception:
    `cancelled_row.original_start` was verbatim `2026-11-01 09:00:00+00:00`!
  - The endpoint did not accept or forward `occurrence_date`, causing the backend to cancel the 1st occurrence (`start_at`) instead of the requested 3rd occurrence (`2026-11-15`).
  - Similarly, when calling `DELETE /events/{id}?scope=following`, `cutoff = occurrence_date or event.start_at` evaluates to `event.start_at`, setting `event.recurrence_end = 2026-11-01T08:59:59Z`, which terminates the entire series immediately rather than splitting at the requested occurrence.

#### Observation B: Filtering of Cancelled Exceptions in `get_by_range`
- In `backend/app/crud/event_crud.py` (lines 27-40):
  ```python
  async def get_by_range(...):
      stmt = (
          select(Event)
          .options(selectinload(Event.reminders))
          .where(
              Event.user_id == user_id,
              Event.is_cancelled == False,
              (
                  ((Event.start_at <= end_at) & (Event.end_at >= start_at)) |
                  (Event.recurrence_rule.isnot(None) & (Event.start_at <= end_at))
              )
          )
      )
  ```
- Cancelled recurrence exceptions (`is_exception=True, is_cancelled=True, parent_event_id=123`) have `is_cancelled == True`.
- Therefore, `get_by_range` unconditionally excludes them from any query results.
- In `tests/test_recurrence_fixes.py` (lines 288-294), the worker verified Check 6 by querying the database directly with `select(Event).where(Event.parent_event_id == ev3_id, Event.is_cancelled == True)` rather than via `GET /events?start=...&end=...`, obscuring the fact that API clients never receive the cancellation tombstone.

#### Observation C: Monthly Recurring Task Day Clamping Drift
- In `backend/app/services/task_service.py` (lines 227-232):
  ```python
  elif freq == "MONTHLY":
      total_months = (base_date.year * 12 + (base_date.month - 1)) + interval
      target_year = total_months // 12
      target_month = (total_months % 12) + 1
      max_days = calendar.monthrange(target_year, target_month)[1]
      target_day = min(base_date.day, max_days)
      next_date = date(target_year, target_month, target_day)
  ```
- A task starting on `2026-01-31` advances to `2026-02-28`. When completed on Feb 28, the subsequent task cycle calculates from `base_date.day == 28`, producing `2026-03-28` instead of reverting to the original 31st day of the month.

---

## 2. Logic Chain

1. **Premise 1**: The goal of Milestone M1 and RFC 5545 recurrence exception handling is to allow modifying or deleting single occurrences (`scope="this"`) without destroying the master recurring series or altering unrelated instances.
2. **Premise 2**: A recurring series is identified by a master `Event` record (with `recurrence_rule`) that starts at `start_at` (e.g. Nov 1). Individual occurrences on later dates (e.g. Nov 15) do not have separate database rows until an exception is created.
3. **Premise 3**: To delete the occurrence on Nov 15, the client must transmit the timestamp of that occurrence (`occurrence_date="2026-11-15T09:00:00"`).
4. **Premise 4**: In `backend/app/services/event_service.py`, `delete_event` accepts `occurrence_date: Optional[datetime] = None`. If provided, it sets `inst_start = occurrence_date`.
5. **Premise 5**: However, in `backend/app/api/v1/endpoints/events.py`, the HTTP controller `delete_event` only declares `scope: str = Query(...)`. It neither declares `occurrence_date` as a query parameter nor passes it into `event_service.delete_event`.
6. **Premise 6**: FastAPI discards undeclared query parameters. Consequently, `occurrence_date` is always `None` when called over HTTP.
7. **Premise 7**: When `occurrence_date` is `None`, `inst_start` evaluates to `event.start_at`.
8. **Conclusion**: Any API or frontend call to `DELETE /events/{id}?scope=this` will invariably cancel instance #1 (the first occurrence at `event.start_at`) rather than the instance the user targeted. For `scope="following"`, `recurrence_end` is capped at `event.start_at - 1s`, terminating the entire series retroactively.
9. **Verdict Rationale**: Because this is a critical functional gap in the public API contract for recurrence deletion, changes must be requested before M1 can be approved.

---

## 3. Caveats

1. **Third-Party Groq AI Quota**: `python tests/test_audit_fixes.py` Check 4 experienced an AI connection/quota error (`[AI Agent Response]: Xin lỗi, hiện tại tôi gặp sự cố kết nối tới dịch vụ AI...`). As noted in both worker and test documentation, the free/on-demand Groq tier has rolling token limits (200k TPD). This is an external LLM rate limit and does not affect the core backend recurrence, CRUD, or database operations tested here.
2. **Frontend Recurrence Expansion (M4 Dependency)**: Client-side expansion of recurring events using `rrule.js` is scheduled for Milestone M4. However, backend range queries in `event_crud.get_by_range` currently drop `is_cancelled=True` rows, which would prevent M4 from receiving tombstones to suppress deleted instances.

---

## 4. Conclusion & Required Changes

**Verdict**: **`REQUEST_CHANGES`**

Milestone M1 has implemented strong, mathematically sound recurrence arithmetic for month-end and leap-year clamping, RFC 5545 parameter support, and task position persistence. No integrity violations were detected. However, changes are required to fix the API contract for recurring event deletion before approval.

### Action Items for `teamwork_worker_m1_1`:

1. **Fix `backend/app/api/v1/endpoints/events.py`**:
   Update `delete_event` endpoint to accept `occurrence_date: Optional[datetime] = Query(None, description="Thời điểm của lần lặp cần xóa")` and pass it to `event_service.delete_event`:
   ```python
   @router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
   async def delete_event(
       event_id: int,
       scope: str = Query("this", pattern="^(this|following|all)$"),
       occurrence_date: Optional[datetime] = Query(None, description="Thời điểm của lần lặp cần xóa"),
       db: AsyncSession = Depends(get_db),
       current_user: User = Depends(get_current_user)
   ):
       """Xóa sự kiện"""
       await event_service.delete_event(
           db,
           event_id=event_id,
           user_id=current_user.id,
           scope=scope,
           occurrence_date=occurrence_date
       )
   ```

2. **Fix `backend/app/crud/event_crud.py`**:
   In `get_by_range` (line 33), adjust the query filter so that cancelled recurrence exceptions are returned to callers:
   ```python
   ((Event.is_cancelled == False) | (Event.is_exception == True))
   ```
   This ensures clients receive the cancellation tombstone with `is_cancelled=True` and `original_start` to suppress the occurrence during calendar rendering.

3. **Update `backend/tests/test_recurrence_fixes.py`**:
   In Check 6:
   - Call `await client.delete(f"/events/{ev3_id}?scope=this&occurrence_date=2026-11-12T18:00:00", headers=headers)`.
   - Assert `cancelled_rows[0].original_start` equals `2026-11-12 18:00:00+00:00` (verifying that the requested occurrence, not `start_at`, was cancelled).

---

## 5. Verification Method

To verify the fixes independently:

1. **Verify HTTP API Deletion with `occurrence_date`**:
   ```bash
   docker exec web-template-backend-1 python -c "
   import asyncio, httpx
   from datetime import datetime

   async def check():
       async with httpx.AsyncClient(base_url='http://localhost:8000/api/v1') as client:
           email = f'verif_{int(datetime.now().timestamp())}@test.com'
           await client.post('/users/register', json={'email': email, 'nickname': 'V', 'password': 'Password123!'})
           token = (await client.post('/auth/login', data={'username': email, 'password': 'Password123!'})).json()['access_token']
           h = {'Authorization': f'Bearer {token}'}

           ev = (await client.post('/events', json={
               'title': 'Weekly Standup',
               'start_at': '2026-11-01T09:00:00',
               'end_at': '2026-11-01T10:00:00',
               'recurrence_rule': 'FREQ=WEEKLY'
           }, headers=h)).json()

           # Delete 3rd occurrence
           target_occ = '2026-11-15T09:00:00'
           res = await client.delete(f'/events/{ev[\"id\"]}?scope=this&occurrence_date={target_occ}', headers=h)
           assert res.status_code == 204

           from app.core.database import AsyncSessionLocal
           from app.models.event_model import Event
           from sqlalchemy.future import select
           async with AsyncSessionLocal() as db:
               stmt = select(Event).where(Event.parent_event_id == ev['id'], Event.is_cancelled == True)
               rows = (await db.execute(stmt)).scalars().all()
               assert len(rows) == 1
               assert '2026-11-15' in str(rows[0].original_start), f'Expected 2026-11-15, got {rows[0].original_start}'
               print('Occurrence deletion verified successfully!')

   asyncio.run(check())
   "
   ```
   *Expected Output*: `Occurrence deletion verified successfully!` with exit code 0.

2. **Verify Recurrence Fixes Test Suite**:
   ```bash
   docker exec web-template-backend-1 python tests/test_recurrence_fixes.py
   ```
   *Expected Output*: Exit code 0, all unit and integration tests passing.

3. **Verify Regression Test Suites**:
   ```bash
   docker exec web-template-backend-1 python tests/test_phase1_api.py
   docker exec web-template-backend-1 python tests/test_phase4_todo.py
   docker exec web-template-backend-1 python tests/test_e2e_suite.py --tier 1
   docker exec web-template-backend-1 python tests/test_e2e_suite.py --tier 2
   ```
   *Expected Output*: Exit code 0 for all suites.
