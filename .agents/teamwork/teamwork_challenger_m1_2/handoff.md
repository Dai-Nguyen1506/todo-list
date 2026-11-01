# Milestone M1 Adversarial Challenge Report: Event Recurrence & Task Position Ordering

**Agent**: `teamwork_challenger_m1_2`  
**Milestone**: M1 (Backend Core & Recurrence Fixes)  
**Parent Agent**: `40afc6c8-54ce-40db-a75d-a5a3d1574a50`  
**Working Directory**: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_challenger_m1_2/`  
**Date**: 2026-11-01  
**Verdict**: **`CHALLENGE_FAILED`**  

---

## 1. Observation

### 1.1 Empirical Probe Execution Inside Live Docker Backend
Test harness authored at `backend/tests/test_challenger_probes.py` was executed directly against the live backend container (`web-template-backend-1`):
```bash
docker exec -e PYTHONPATH=. web-template-backend-1 python tests/test_challenger_probes.py
```

#### Verbatim Execution Output:
```
======================================================================
EMPIRICAL CHALLENGER PROBES: EVENT RECURRENCE & TASK POSITION ORDERING
======================================================================
[*] Authenticated as challenger_b1f544d2@example.com

--- PROBE 1: Create Recurring Event (10 occurrences) ---
[+] Master event created: ID=292, start_at=2026-11-01T10:00:00, recurrence=FREQ=DAILY;COUNT=10

--- PROBE 2: Delete Instance 3 (scope='this') ---
[DEBUG] DELETE /events/292?scope=this&occurrence_date=2026-11-03T10:00:00 -> status 204
[DEBUG] Found 1 exception rows in DB for parent 292
       Exception row: id=293, is_cancelled=True, is_exception=True, start_at=2026-11-01 10:00:00+00:00, original_start=2026-11-01 10:00:00+00:00
[+] Target cancelled row original_start: 2026-11-01T10:00:00+00:00
   [FAIL] PROBE 2 BUG: DELETE /events/292?scope=this&occurrence_date=2026-11-03T10:00:00 failed to pass occurrence_date to backend logic! Exception row was created for original_start=2026-11-01T10:00:00+00:00 (Instance 1) instead of Instance 3 (2026-11-03).
[DEBUG] DELETE /events/292?scope=this&original_start=2026-11-03T10:00:00 -> status 204
[DEBUG] Now found 2 exception rows in DB for parent 292
       Exception row: id=293, is_cancelled=True, original_start=2026-11-01 10:00:00+00:00
       Exception row: id=294, is_cancelled=True, original_start=2026-11-01 10:00:00+00:00

[*] Comparing DELETE behavior with PUT /events/{id} with is_cancelled=True...
[DEBUG] PUT /events/292 with is_cancelled=True -> status 200
       PUT created exception: id=296, is_cancelled=True, original_start=2026-11-03T10:00:00
   [NOTE] PUT /events/{id} correctly accepts original_start, but DELETE /events/{id} fails to accept occurrence_date/original_start!
   [PASS] Master series preserved.

--- PROBE 3: Update Instance 5 (scope='this') ---
[+] Update instance 5 returned: ID=298, title='Instance 5 Rescheduled Afternoon', start_at=2026-11-05T14:30:00, orig=2026-11-05T10:00:00
   [PASS] Instance 5 exception created, master event untouched.

--- PROBE 4: Series Split at Instance 7 (scope='following') ---
[+] New series returned: ID=299, title='Standup Day 7 onwards (delayed)', start_at=2026-11-07T11:00:00
[+] Parent series recurrence_end: 2026-11-07T09:59:59Z
   [PASS] Series split capped parent recurrence_end and created new series.

--- PROBE 4B: Series Cutoff via DELETE (scope='following') ---
[DEBUG] DELETE /events/300?scope=following&occurrence_date=2026-11-05T08:00:00 -> status 204
[DEBUG] recurrence_end after DELETE following: 2026-11-01T07:59:59Z
   [FAIL] PROBE 4B BUG: DELETE /events/300?scope=following&occurrence_date=2026-11-05T08:00:00 did not receive cutoff_date (it was ignored by FastAPI router) and capped recurrence_end at 2026-11-01T07:59:59Z (event start_at minus 1s), wiping out the entire series!

--- PROBE 5: Delete Parent Series (scope='all') Cascading ---
   [PASS] Master 292 and all associated exception rows cleanly deleted.

--- PROBE 6: Task Position Updates & Reordering Stress Test ---
[*] Creating 50 tasks in batch...
[+] Successfully created 50 tasks (IDs: 639..688)
[*] Testing Batch Reorder of 50 tasks (Reversed: pos 0..49 inverted)...
   [PASS] 50-task batch reordering persisted and verified successfully.
[*] Testing Non-Contiguous Positions (e.g. 10, 50, 100, 9999, 100000)...
   [PASS] Non-contiguous position values correctly persisted.
[*] Testing Negative Positions (e.g. -500, -100, -50, -10, -5)...
[DEBUG] Top 5 tasks positions: [-500, -100, -50, -10, -5]
   [PASS] Negative positions accepted, persisted, and ordered correctly in ascending order.
[*] Testing Single Task Position Updates via PATCH and PUT...
   [PASS] Single task position updates via PATCH and PUT verified.
```

### 1.2 Code Inspection Observations
1. **`backend/app/api/v1/endpoints/events.py:60-68`**:
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
   - The route parameter list defines **only** `event_id`, `scope`, `db`, and `current_user`.
   - `occurrence_date` (or `original_start`) is **omitted** from the endpoint query parameters.
   - When any HTTP client passes `?scope=this&occurrence_date=...` or `?scope=this&original_start=...`, FastAPI ignores it because it is not declared.
   - `event_service.delete_event` is called without `occurrence_date`.

2. **`backend/app/services/event_service.py:143-180`**:
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
               ...
               parent_event_id=event.id,
               is_exception=True,
               is_cancelled=True,
               original_start=inst_start
           )
           db.add(cancelled_event)
           await db.commit()
           return

       if event.recurrence_rule and not event.is_exception and scope == "following":
           cutoff = occurrence_date or event.start_at
           event.recurrence_end = cutoff - timedelta(seconds=1)
           db.add(event)
           await db.commit()
           return
   ```
   - Because `occurrence_date` is always `None` when invoked via HTTP, `inst_start` evaluates to `occurrence_date or event.start_at` -> `event.start_at`.
   - In `scope="following"`, `cutoff` evaluates to `event.start_at`.

3. **`backend/tests/test_recurrence_fixes.py:276-293`**:
   - Worker 1 tested: `await client.delete(f"/events/{ev3_id}?scope=this", headers=headers)` without specifying an occurrence timestamp.
   - The assertion checked `assert len(cancelled_rows) >= 1` without verifying `original_start`.
   - As a result, Worker 1 passed their own test while missing that deleting instance 3 (or any instance other than instance 1) is impossible over HTTP.

---

## 2. Logic Chain

1. **Premise 1 (HTTP Contract for Deleting Recurrence Occurrences)**:
   - Recurring events exist as a single master row in PostgreSQL with an RFC 5545 RRULE.
   - Specific occurrences (e.g. Instance 3 on Nov 3) do not have their own primary key `id` until modified or cancelled.
   - Therefore, to delete or cancel Instance 3, the client must identify the master `event_id` AND the specific occurrence date (`occurrence_date` or `original_start`).
2. **Premise 2 (FastAPI Parameter Binding)**:
   - FastAPI inspects path operation parameters to parse query arguments.
   - `backend/app/api/v1/endpoints/events.py:61-68` does not define `occurrence_date` or `original_start`.
   - FastAPI silently drops undeclared query parameters.
3. **Premise 3 (Fallback Behavior to `event.start_at`)**:
   - `event_service.delete_event` defaults `occurrence_date` to `None`.
   - Lines 154 and 176 use `inst_start = occurrence_date or event.start_at` and `cutoff = occurrence_date or event.start_at`.
4. **Conclusion from Premises**:
   - Under `scope="this"`, calling `DELETE /events/{id}?scope=this&occurrence_date=...` ALWAYS creates an exception row for `event.start_at` (Instance 1), never for Instance 3. Instance 3 remains active, while Instance 1 is unintentionally cancelled.
   - Under `scope="following"`, calling `DELETE /events/{id}?scope=following&occurrence_date=...` sets `recurrence_end` to `event.start_at - 1 second`, which caps the series before the first occurrence, destroying the entire recurring series.

---

## 3. Caveats

- **Alternative Workaround via `PUT`**: As proven in Probe 2, a client can theoretically cancel an instance by calling `PUT /api/v1/events/{master_id}` with `{"is_cancelled": true, "original_start": "2026-11-03T10:00:00", "scope": "this"}` because `EventUpdate` schema includes `original_start` and `is_cancelled`. However, the RESTful `DELETE /api/v1/events/{id}` endpoint is the primary deletion contract specified in the project requirements and survey docs, and its `occurrence_date` functionality is completely severed at the controller layer.
- **Groq LLM Rate Limits**: Upstream daily token limits for `openai/gpt-oss-120b` do not impact these backend recurrence and task database operations.

---

## 4. Conclusion

**VERDICT: `CHALLENGE_FAILED`**

While task reordering, `PUT` single-instance updates, series splits via `PUT`, and `DELETE scope="all"` cascade deletion are verified correct, **two critical bugs in `DELETE /api/v1/events/{id}` prevent milestone completion**:

1. **Bug 1 (High Severity)**: Single instance deletion via `DELETE /api/v1/events/{event_id}?scope=this` cannot cancel Instance 3 (or any instance other than the very first occurrence). It always cancels Instance 1 due to missing query parameter extraction in `backend/app/api/v1/endpoints/events.py`.
2. **Bug 2 (Critical Severity)**: Series cutoff via `DELETE /api/v1/events/{event_id}?scope=following` caps `recurrence_end` at `event.start_at - 1s`, effectively erasing the entire event series rather than cutting it off from the specified date.

### Required Worker Fix:
In `backend/app/api/v1/endpoints/events.py`:
```python
@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    scope: str = Query("this", pattern="^(this|following|all)$"),
    occurrence_date: Optional[datetime] = Query(None, description="Thời điểm của lần lặp cụ thể"),
    original_start: Optional[datetime] = Query(None, description="Alias cho occurrence_date"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Xóa sự kiện"""
    target_date = occurrence_date or original_start
    await event_service.delete_event(
        db, event_id=event_id, user_id=current_user.id, scope=scope, occurrence_date=target_date
    )
```

---

## 5. Verification Method

To independently reproduce and verify this challenge failure, run the authored probe test suite in the running Docker backend container:

```bash
docker exec -e PYTHONPATH=. web-template-backend-1 python tests/test_challenger_probes.py
```

### Invalidation Condition:
Once `backend/app/api/v1/endpoints/events.py` is updated by a worker to expose and forward `occurrence_date` / `original_start`, re-executing `test_challenger_probes.py` will output:
```
✅ ALL PROBES PASSED WITH ZERO FAILURES!
```
and exit with return code `0`.
