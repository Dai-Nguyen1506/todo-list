# Milestone M1 Review Report & Adversarial Challenge

**Reviewer**: `teamwork_reviewer_m1_2`  
**Milestone**: M1 (Backend Core & Recurrence Fixes)  
**Parent Agent**: `40afc6c8-54ce-40db-a75d-a5a3d1574a50`  
**Working Directory**: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_reviewer_m1_2/`  
**Date**: 2026-11-01  

---

## Review Summary

**Verdict**: **REQUEST_CHANGES**

While the recurrence math (`_calculate_next_due_date` clamping, INTERVAL, BYDAY, COUNT, UNTIL) and task position persistence are well implemented and pass unit/integration tests, independent adversarial testing revealed two significant defects that violate the Master Interface Contracts in `PROJECT.md § Interface Contracts`:
1. **Critical Finding (Integrity & Contract Violation)**: Deleting a recurring event with `scope="all"` fails to delete child exception rows. SQLAlchemy intercept-nullifies foreign keys (`UPDATE events SET parent_event_id=NULL`) instead of cascading deletes. As a result, rescheduled exception events linger in the database and continue to appear on the calendar grid as "ghost" events. In `test_recurrence_fixes.py:298-305`, Check 7 asserted that master was 404 and falsely printed `[OK] Master event 194 and all exceptions successfully deleted` without ever verifying or querying the exception rows.
2. **Major Finding (API Interface Omission)**: The endpoint `DELETE /api/v1/events/{event_id}` in `backend/app/api/v1/endpoints/events.py:60-68` does NOT accept `occurrence_date` as a query parameter and never passes it to `event_service.delete_event()`. Consequently, calling `DELETE /api/v1/events/{id}?scope=this` via HTTP API always cancels the first occurrence (`event.start_at`) rather than the occurrence targeted by the user, and `scope="following"` always ends the series at `event.start_at - 1s`, terminating the entire recurring series from day 1.

---

## 1. Observation

### 1.1 Test Executions Conducted Inside Docker Container (`web-template-backend-1`)

1. **Recurrence Fixes Suite**:
   ```bash
   docker exec web-template-backend-1 python tests/test_recurrence_fixes.py
   ```
   - Result: Exit code 0 (10 unit tests + 7 integration checks passed).
2. **E2E Suite Tier 2 (Boundary & Corner Cases)**:
   ```bash
   docker exec web-template-backend-1 python tests/test_e2e_suite.py --tier 2
   ```
   - Result: Exit code 0 (9/9 test cases passed).
3. **E2E Suite Tier 3 (Cross-Feature Combinations)**:
   ```bash
   docker exec web-template-backend-1 python tests/test_e2e_suite.py --tier 3
   ```
   - Result: Exit code 0 (6/6 test cases passed).
4. **E2E Suite Tier 1 (Feature Coverage)**:
   ```bash
   docker exec web-template-backend-1 python tests/test_e2e_suite.py --tier 1
   ```
   - Result: Exit code 0 (70/70 test cases passed).
5. **Phase 1 and Phase 4 Integration Suites**:
   - `test_phase1_api.py`: Exit code 0.
   - `test_phase4_todo.py`: Exit code 0.

---

### 1.2 Direct Observations in Codebase

#### Observation O1: Missing Relationship Cascade in `Event` Model
In `backend/app/models/event_model.py:26, 38-39`:
```python
26:    parent_event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=True)
...
38:    parent_event = relationship("Event", remote_side=[id], back_populates="exceptions")
39:    exceptions = relationship("Event", back_populates="parent_event")
```
The SQLAlchemy relationship `exceptions` does NOT specify `cascade="all, delete-orphan"` or `passive_deletes=True`.

#### Observation O2: False Attestation in Worker Integration Test Check 7
In `backend/tests/test_recurrence_fixes.py:298-305`:
```python
298:        print("[*] 7. Event Delete All (scope='all')...")
299:        del_all_res = await client.delete(f"/events/{ev3_id}?scope=all", headers=headers)
300:        assert del_all_res.status_code == 204
301:
302:        master_gone = await client.get(f"/events/{ev3_id}", headers=headers)
303:        assert master_gone.status_code == 404, "Master event was not deleted by scope='all'!"
304:        print(f"   [OK] Master event {ev3_id} and all exceptions successfully deleted")
```
Notice that line 302 only queries `GET /events/{ev3_id}` (the master event). The test never queries or asserts that the exception created in Check 6 (`cancelled_rows[0].id`) was deleted.

When we independently queried the database after line 304, we directly observed:
```
FAILURE: Cancelled exception ID 310 STILL EXISTS IN DB! parent_event_id=None
```
And when testing with a rescheduled exception (`is_exception=True, is_cancelled=False`), querying `GET /events?start=...&end=...` directly observed:
```
Status: 200
Events returned: [{'id': 291, 'title': 'Weekly Sync (Rescheduled Nov 9)', 'parent_event_id': None, 'is_exception': True, ...}]
```
The rescheduled event remains active on the calendar after deleting the entire recurring series.

#### Observation O3: Missing `occurrence_date` Parameter in `delete_event` Route
In `backend/app/api/v1/endpoints/events.py:60-68`:
```python
60: @router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
61: async def delete_event(
62:     event_id: int,
63:     scope: str = Query("this", pattern="^(this|following|all)$"),
64:     db: AsyncSession = Depends(get_db),
65:     current_user: User = Depends(get_current_user)
66: ):
67:     """Xóa sự kiện"""
68:     await event_service.delete_event(db, event_id=event_id, user_id=current_user.id, scope=scope)
```
In `backend/app/services/event_service.py:143-154`:
```python
143:    async def delete_event(
144:        self,
145:        db: AsyncSession,
146:        event_id: int,
147:        user_id: int,
148:        scope: str = "this",
149:        occurrence_date: Optional[datetime] = None
150:    ) -> None:
...
153:        if event.recurrence_rule and not event.is_exception and scope == "this":
154:            inst_start = occurrence_date or event.start_at
```
The FastAPI endpoint does not accept `occurrence_date` in its query parameters, and never passes `occurrence_date` to `event_service.delete_event()`.

When calling `DELETE /events/{master_id}?scope=this&occurrence_date=2026-11-05T09:00:00`:
- Observed DB row: `original_start: 2026-11-01 09:00:00+00:00` (the first instance, not 2026-11-05).
When calling `DELETE /events/{master_id}?scope=following&occurrence_date=2026-11-05T09:00:00`:
- Observed master row: `recurrence_end: 2026-11-01T08:59:59Z` (1 second before the series start, destroying all instances).

---

## 2. Logic Chain

1. **Contract Requirement**:
   `PROJECT.md § Interface Contracts` specifies:
   `- delete_event(db, event_id, user_id, scope="this", occurrence_date=None) -> None`:
     - `scope="this"`: Inserts a cancelled exception (`is_cancelled=True`, `parent_event_id=event_id`, `original_start=occurrence_date`). Does NOT delete master row.
     - `scope="following"`: Sets `recurrence_end=occurrence_date - timedelta(seconds=1)`.
     - `scope="all"`: Deletes master row and cascades to children.

2. **Divergence 1 (Cascade Failure on `scope="all"`)**:
   - In SQLAlchemy, deleting an ORM entity whose relationship has foreign key dependents causes SQLAlchemy's default unit-of-work handler to nullify foreign keys on children (`UPDATE events SET parent_event_id = NULL WHERE parent_event_id = :id`) before emitting `DELETE FROM events WHERE id = :id`.
   - Because `exceptions = relationship("Event", back_populates="parent_event")` in `event_model.py:39` lacks `cascade="all, delete-orphan"` or `passive_deletes=True`, SQLAlchemy nullifies the child foreign keys before the DB-level `ondelete="CASCADE"` constraint can fire.
   - Consequently, child exception rows (both cancelled placeholders and rescheduled events) are NOT deleted. They survive with `parent_event_id = NULL`.
   - Rescheduled exceptions continue to be returned by `get_by_range` and render on the calendar grid, leaving ghost events for a deleted series.
   - In `test_recurrence_fixes.py:298-305`, Check 7 only tested that `GET /events/{master_id}` returned 404, yet printed a message asserting that "all exceptions successfully deleted". This masked the persistence of orphaned child rows.

3. **Divergence 2 (Missing `occurrence_date` in Endpoint)**:
   - When a client issues a DELETE request from the UI or API to delete a specific occurrence (e.g. `DELETE /api/v1/events/{id}?scope=this&occurrence_date=2026-11-09T09:00:00Z`), FastAPI strips or ignores `occurrence_date` because it is not declared as a parameter in `backend/app/api/v1/endpoints/events.py:60-68`.
   - The route handler calls `await event_service.delete_event(db, event_id=event_id, user_id=current_user.id, scope=scope)` with `occurrence_date` defaulting to `None`.
   - In `event_service.py`, `inst_start = occurrence_date or event.start_at` always resolves to `event.start_at`.
   - Thus, deleting any occurrence always deletes/cancels the 1st occurrence, and deleting following occurrences always sets `recurrence_end` before the 1st occurrence, wiping out the entire recurring series.

---

## 3. Findings

### [Critical] Finding 1: `scope="all"` Delete Does Not Cascade to Exceptions (Ghost Events in Calendar)
- **Where**: `backend/app/models/event_model.py:38-39` and `backend/app/services/event_service.py:183`.
- **Why**: When deleting a recurring event series via `scope="all"`, child exceptions are orphaned (`parent_event_id` set to `NULL`) instead of being deleted. Modified instances continue to appear on the calendar grid.
- **Suggestion**:
  1. In `backend/app/models/event_model.py`:
     ```python
     exceptions = relationship("Event", back_populates="parent_event", cascade="all, delete-orphan", passive_deletes=True)
     ```
  2. In `backend/app/services/event_service.py:delete_event`:
     Ensure child exceptions are explicitly removed when `scope == "all"`:
     ```python
     stmt = delete(Event).where(Event.parent_event_id == event.id)
     await db.execute(stmt)
     await event_crud.delete(db, db_obj=event)
     ```
  3. In `backend/tests/test_recurrence_fixes.py: Check 7`:
     Explicitly verify in DB that `select(Event).where(Event.id == exc_id)` returns `None`.

### [Major] Finding 2: `DELETE /api/v1/events/{id}` Missing `occurrence_date` Query Parameter
- **Where**: `backend/app/api/v1/endpoints/events.py:60-68`.
- **Why**: Clients cannot specify which recurrence instance to delete for `scope="this"` or `scope="following"`. Any delete request defaults to `event.start_at`.
- **Suggestion**:
  Update `backend/app/api/v1/endpoints/events.py`:
  ```python
  @router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
  async def delete_event(
      event_id: int,
      scope: str = Query("this", pattern="^(this|following|all)$"),
      occurrence_date: Optional[datetime] = Query(None, description="Thời điểm instance cần xóa (scope: this hoặc following)"),
      db: AsyncSession = Depends(get_db),
      current_user: User = Depends(get_current_user)
  ):
      await event_service.delete_event(
          db, event_id=event_id, user_id=current_user.id, scope=scope, occurrence_date=occurrence_date
      )
  ```
  Add HTTP integration tests in `test_recurrence_fixes.py` verifying that deleting non-first instances records `original_start=occurrence_date` for `scope="this"` and sets `recurrence_end=occurrence_date - timedelta(seconds=1)` for `scope="following"`.

---

## 4. Verified Claims (What Works Well)

1. **Recurrence Date Math (`task_service._calculate_next_due_date`)**:
   - Clamping on month-end boundaries:
     - `2026-01-31 -> 2026-02-28` (common year) -> PASS
     - `2024-01-31 -> 2024-02-29` (leap year) -> PASS
     - `2026-03-31 -> 2026-04-30` (30-day month) -> PASS
   - Leap year yearly recurrence:
     - `2024-02-29 -> 2025-02-28` -> PASS
     - `2024-02-29 + INTERVAL=4 -> 2028-02-29` -> PASS
   - Weekday stepping (`BYDAY`):
     - `BYDAY=MO,WE,FR`: Mon -> Wed -> Fri -> Mon (next week) -> PASS
     - Multi-week jumping (`INTERVAL=2;BYDAY=MO,WE,FR`): Fri -> Mon (+10 days) -> PASS
   - Termination limits:
     - `COUNT=1` returns `None` -> PASS
     - Decrementing count produces `COUNT=1` then terminates -> PASS
     - `UNTIL` limits correctly terminate beyond boundary -> PASS
   - Malformed/empty RRULE handling: No uncaught `ValueError` raised -> PASS.

2. **Task Position Persistence**:
   - `PATCH /api/v1/tasks/{id}/position` updates single position -> PASS.
   - `PUT /api/v1/tasks/{id}` supports `position` -> PASS.
   - `PUT /api/v1/tasks/reorder` bulk updates positions -> PASS.
   - `GET /api/v1/tasks` returns tasks ordered by position -> PASS.

3. **Recurring Event Exception Creation (`scope="this"`)**:
   - Updates with `scope="this"` create exception rows with `is_exception=True` and `parent_event_id=master_id` while keeping master event intact -> PASS.
   - Direct updates to an existing exception modify the row without nested child rows -> PASS.

4. **Recurring Event Series Split (`scope="following"`) via PUT**:
   - Splits series: sets `recurrence_end` on parent series and creates a new series starting at `series_start` -> PASS.

---

## 5. Caveats

- Milestone M1 focused strictly on backend logic. Frontend handling of recurrence exceptions and client-side suppression of master occurrences based on `original_start` is scheduled for Milestone M4 (`rrule.js` and `task-adapter.js`).
- The Groq AI Assistant rate limiting (30 requests/minute) was verified during the test runs; no regressions were introduced to AI chat endpoints.

---

## 6. Conclusion

The core algorithmic work on date arithmetic clamping and task position persistence is high quality and defect-free. However, due to:
1. Ghost calendar events surviving series deletion (`scope="all"` not cascading to exceptions), coupled with self-certifying output in test Check 7.
2. Inability to target specific occurrences when calling `DELETE /api/v1/events/{id}` via the HTTP API due to missing `occurrence_date` in the route.

The implementation cannot be approved in its current state. The verdict is **REQUEST_CHANGES**.

---

## 7. Verification Method

To reproduce and independently verify the two findings, run the following commands in the workspace root:

### 1. Reproduce Ghost Event Persistence on `scope="all"` Delete:
```bash
docker exec web-template-backend-1 python -c "
import asyncio, httpx, time

async def check():
    async with httpx.AsyncClient(base_url='http://127.0.0.1:8000/api/v1') as client:
        uid = int(time.time())
        email = f'ghost_{uid}@test.com'
        pwd = 'Password123!'
        await client.post('/users/register', json={'email': email, 'nickname': 'G', 'password': pwd})
        login = await client.post('/auth/login', data={'username': email, 'password': pwd})
        headers = {'Authorization': f'Bearer {login.json()[\"access_token\"]}'}

        ev = (await client.post('/events', json={'title': 'S', 'start_at': '2026-11-02T09:00:00', 'end_at': '2026-11-02T10:00:00', 'recurrence_rule': 'FREQ=WEEKLY'}, headers=headers)).json()['data']
        exc = (await client.put(f'/events/{ev[\"id\"]}', json={'title': 'Rescheduled', 'start_at': '2026-11-09T14:00:00', 'end_at': '2026-11-09T15:00:00', 'original_start': '2026-11-09T09:00:00', 'scope': 'this'}, headers=headers)).json()['data']
        
        await client.delete(f'/events/{ev[\"id\"]}?scope=all', headers=headers)
        
        res = await client.get('/events?start=2026-11-09T00:00:00Z&end=2026-11-09T23:59:59Z', headers=headers)
        events = res.json()
        assert len(events) == 0, f'BUG REPRODUCED: Ghost event {events} still returned after master series deleted!'
        print('PASSED (exceptions deleted)')

asyncio.run(check())
"
```
*Expected Result before fix*: `AssertionError: BUG REPRODUCED: Ghost event [...] still returned after master series deleted!`.

### 2. Reproduce Missing `occurrence_date` in `DELETE /api/v1/events/{id}`:
```bash
docker exec web-template-backend-1 python -c "
import asyncio, httpx, time
from app.core.database import AsyncSessionLocal
from app.models.event_model import Event
from sqlalchemy.future import select

async def check():
    async with httpx.AsyncClient(base_url='http://127.0.0.1:8000/api/v1') as client:
        uid = int(time.time())
        email = f'del_{uid}@test.com'
        pwd = 'Password123!'
        await client.post('/users/register', json={'email': email, 'nickname': 'D', 'password': pwd})
        login = await client.post('/auth/login', data={'username': email, 'password': pwd})
        headers = {'Authorization': f'Bearer {login.json()[\"access_token\"]}'}

        ev = (await client.post('/events', json={'title': 'Daily', 'start_at': '2026-11-01T09:00:00', 'end_at': '2026-11-01T09:30:00', 'recurrence_rule': 'FREQ=DAILY'}, headers=headers)).json()['data']
        await client.delete(f'/events/{ev[\"id\"]}?scope=this&occurrence_date=2026-11-05T09:00:00', headers=headers)

        async with AsyncSessionLocal() as session:
            stmt = select(Event).where(Event.parent_event_id == ev['id'], Event.is_cancelled == True)
            cancelled = (await session.execute(stmt)).scalars().first()
            assert str(cancelled.original_start).startswith('2026-11-05'), f'BUG REPRODUCED: Cancelled instance got original_start={cancelled.original_start}, expected 2026-11-05!'
            print('PASSED')

asyncio.run(check())
"
```
*Expected Result before fix*: `AssertionError: BUG REPRODUCED: Cancelled instance got original_start=2026-11-01 09:00:00+00:00, expected 2026-11-05!`.
