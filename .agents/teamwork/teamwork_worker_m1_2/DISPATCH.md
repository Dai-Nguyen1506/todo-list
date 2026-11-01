# Milestone M1 (Iteration 2) Task: Backend Recurrence & Event Exceptions Remediation

## Role: teamwork_worker
## Working Directory: /home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_worker_m1_2/

## Objective
Remediate the interface contract violations identified during the Milestone M1 Verification Gate by Reviewer 1, Reviewer 2, and Challenger 2.

## Exclusive Write Ownership
You exclusively own and may modify:
- `backend/app/api/v1/endpoints/events.py`
- `backend/app/services/event_service.py`
- `backend/app/models/event_model.py`
- `backend/app/crud/event_crud.py`
- `backend/tests/test_recurrence_fixes.py`

## Gate Feedback & Defect Inventory
1. **Defect 1 (`DELETE /api/v1/events/{event_id}` Query Parameter Omission)**:
   - In `backend/app/api/v1/endpoints/events.py:60-68`:
     Add query parameters:
     ```python
     occurrence_date: Optional[datetime] = Query(None, description="Anchor start time of the specific occurrence being cancelled/split"),
     original_start: Optional[datetime] = Query(None, description="Alternative alias for occurrence_date"),
     ```
     Pass `occurrence_date=occurrence_date or original_start` to `await event_service.delete_event(...)`.
   - In `backend/app/services/event_service.py:delete_event`:
     Ensure `occurrence_date` is utilized when `scope == "this"` or `scope == "following"` so instance #3 is cancelled rather than instance #1 (`event.start_at`).
2. **Defect 2 (Ghost Events on `scope="all"` Delete / Missing Relationship Cascade)**:
   - In `backend/app/models/event_model.py:38-39`:
     Update the `exceptions` relationship:
     ```python
     exceptions = relationship("Event", back_populates="parent_event", cascade="all, delete-orphan", passive_deletes=True)
     ```
   - In `backend/app/services/event_service.py:delete_event`:
     When `scope == "all"`, delete all child exceptions where `parent_event_id == event.id` to guarantee zero ghost exceptions remain in PostgreSQL.
3. **Defect 3 (Cancellation Tombstones Excluded from `get_by_range`)**:
   - In `backend/app/crud/event_crud.py:get_by_range`:
     Adjust filter so that cancelled exceptions (`Event.is_cancelled == True & Event.is_exception == True & Event.parent_event_id.isnot(None)`) are included in range queries so calendar clients can suppress cancelled instances during RRULE expansion.
4. **Verification**:
   - Author integration tests in `backend/tests/test_recurrence_fixes.py` proving:
     - `DELETE /events/{id}?scope=this&occurrence_date=2026-11-15T09:00:00` records a cancelled exception with `original_start == 2026-11-15T09:00:00` while preserving master event.
     - `DELETE /events/{id}?scope=all` deletes the master and queries confirm 0 lingering exception rows in DB.
     - `GET /events?start=...&end=...` returns the cancelled exception tombstone.
   - Run:
     - `docker exec web-template-backend-1 python tests/test_recurrence_fixes.py`
     - `docker exec web-template-backend-1 python tests/test_phase1_api.py`
     - `docker exec web-template-backend-1 python tests/test_e2e_suite.py --tier 1`
     - `docker exec web-template-backend-1 python tests/test_e2e_suite.py --tier 2`
   - Write `handoff.md` and message orchestrator when complete.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.


## 2026-11-01T16:40:27Z
**Context**: Milestone M1 Iteration 2 Remediation
**Content**: In addition to the Reviewer 1/2 and Challenger 2 findings regarding DELETE occurrence_date query param and cascade deletes, Challenger 1 discovered an adversarial finding in `task_service.py:_calculate_next_due_date`:
Extreme astronomical intervals (e.g. `INTERVAL=9999999999999999999999999` or pushing year > 9999) cause `OverflowError` or `ValueError: year > 9999` which leads to HTTP 500 on task completion.
**Action**:
1. Clamp `interval = min(max(1, parsed_interval), 1000)`.
2. Ensure target year <= 9999, and wrap date addition / construction in `try...except (ValueError, OverflowError): return None` to guarantee zero uncaught 500 errors on extreme inputs.
3. Include this alongside your other fixes for DELETE occurrence_date, cascade delete on Event.exceptions, and get_by_range tombstones.
