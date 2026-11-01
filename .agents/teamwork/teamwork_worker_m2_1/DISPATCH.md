# Milestone M2 Task: Frontend Stability & Core Bugfixes

## Role: teamwork_worker
## Working Directory: /home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_worker_m2_1/

## Objective
Implement genuine fixes for frontend runtime exceptions, timezone serialization drift, task reorder persistence, and the recurrence scope selection dialog, strictly adhering to the 100% Vanilla HTML, CSS, and JavaScript constraint (zero external UI libraries or bundlers).

## Exclusive Write Ownership
You exclusively own and may modify:
- `frontend/js/components/dropdown.js`
- `frontend/js/calendar/event-form.js`
- `frontend/js/pages/todo.js`
- `frontend/js/pages/calendar.js`
- `frontend/js/components/modal.js`
- `frontend/css/` (any relevant styling for recurrence scope dialog)
- Any frontend test verification script

## Inputs & Survey Findings
- Authoritative user request: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/ORIGINAL_REQUEST.md`
- Master project specification: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/PROJECT.md`
- Frontend survey report: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_explorer_survey_3/handoff.md`

## Concrete Technical Requirements
1. **Fix Fatal `TypeError` in `frontend/js/components/dropdown.js`** (`BUG-08` / Survey §1.4):
   - In `dropdown.js:6-10, 29`:
     Support both `triggerEl` and `anchorEl`:
     ```javascript
     const trigger = triggerEl || anchorEl;
     const rect = trigger.getBoundingClientRect();
     ```
     Support both `item.onClick` and `item.action`:
     ```javascript
     if (typeof item.onClick === 'function') item.onClick();
     else if (typeof item.action === 'function') item.action();
     ```
   - Verify clicking "⇅ Sắp xếp" in To-Do view opens the sort dropdown cleanly with 0 console errors.
2. **Fix Timezone Serialization Drift (`BUG-13`)**:
   - In `frontend/js/calendar/event-form.js:251-252` and `calendar.js:267`:
     Import `toLocalISOString` from `../utils/date.js`.
     Replace native `.toISOString()` when sending event `start_at` and `end_at` with `toLocalISOString(date)` so dates do not shift back by 7 hours in GMT+7.
3. **Persist Task Drag Reordering to Backend**:
   - In `frontend/js/pages/todo.js:245-253` (`reorderTasks`):
     After updating the in-memory array, call the backend persistence endpoint (`api.patch('/tasks/' + taskId + '/position', { position })` or `api.put('/tasks/reorder', { task_ids })`).
     Ensure custom task order survives page refresh (F5).
4. **Implement Recurrence Scope Selection Dialog**:
   - In `frontend/js/calendar/event-form.js`:
     When user edits or deletes an event that has `recurrence_rule`:
     Instead of calling API directly, display a recurrence scope dialog asking:
     - 1. "Chỉ sự kiện này" (`scope="this"`, sending `occurrence_date`)
     - 2. "Sự kiện này và các sự kiện tiếp theo" (`scope="following"`, sending `occurrence_date`)
     - 3. "Tất cả sự kiện trong chuỗi" (`scope="all"`)
     Execute the API call with the chosen `scope` and `occurrence_date`.
5. **Strict Vanilla Constraint**:
   - MUST NOT introduce any npm package, external library (no React, Vue, jQuery, Bootstrap, etc.), or bundler. 100% native ES modules and DOM APIs.
6. **Automated Verification**:
   - Verify frontend serves HTTP 200 via `curl -I http://localhost:3000`.
   - Run CDP or browser console check / test script to confirm 0 uncaught JavaScript runtime exceptions.
   - Run backend test suites in Docker to confirm zero regressions:
     `docker exec web-template-backend-1 python tests/test_e2e_suite.py`
   - Write handoff report in `handoff.md` and message orchestrator when complete.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.


## 2026-11-01T17:13:26Z
Implement Milestone M2: Frontend Stability & Core Bugfixes:
1. Fix fatal TypeError in frontend/js/components/dropdown.js (support triggerEl/anchorEl and onClick/action).
2. Fix 7-hour timezone serialization drift in frontend/js/calendar/event-form.js using toLocalISOString() from utils/date.js.
3. Connect task drag reordering in frontend/js/pages/todo.js to persist to backend via API.
4. Implement recurrence scope modal (this, following, all) on recurring event update/delete in event-form.js.
5. Strictly adhere to 100% Vanilla HTML, CSS, JavaScript (zero external UI libraries or bundlers).
6. Verify 0 console runtime errors, test HTTP 200 on port 3000, verify backend test suites pass in Docker.
7. Write handoff report in handoff.md and message orchestrator when done.
