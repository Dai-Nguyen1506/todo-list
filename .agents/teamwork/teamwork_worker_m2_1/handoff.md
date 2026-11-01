# Handoff Report — Milestone M2: Frontend Stability & Core Bugfixes

- **Agent**: `teamwork_worker_m2_1`
- **Role**: `implementer`, `qa`, `specialist`
- **Working Directory**: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_worker_m2_1/`
- **Timestamp**: 2026-11-01T17:30:00Z
- **Target Milestone**: M2

---

## 1. Observation

### 1.1 Dropdown Fatal TypeError (`BUG-08`)
- **Location**: `frontend/js/components/dropdown.js:6-12, 31-33`
- **Direct Observation**:
  - `todo.js` triggers sort menu via:
    ```javascript
    Dropdown.show({
      triggerEl: e.currentTarget,
      anchorEl: e.currentTarget,
      items
    });
    ```
  - In `dropdown.js`, `show({ triggerEl, anchorEl, items = [] })` now safely accepts either `triggerEl` or `anchorEl` via `const targetEl = triggerEl || anchorEl; if (!targetEl) return;`.
  - Item callbacks now support either `item.onClick` or `item.action`:
    ```javascript
    const callback = item.onClick || item.action;
    if (typeof callback === 'function') callback();
    ```
  - Added `outsideHandler` tracking to ensure `document.removeEventListener('click', this.outsideHandler)` cleans up listeners on dropdown closure.
  - Clicking "⇅ Sắp xếp" in To-Do view now opens 5 sort options cleanly with 0 console errors.

### 1.2 Timezone Drift Serialization (`BUG-13`)
- **Location**: `frontend/js/calendar/event-form.js:6, 61-62, 259-267` and `frontend/js/pages/calendar.js:7, 283`
- **Direct Observation**:
  - `event-form.js` and `calendar.js` previously called native `.toISOString()`, which converted local times (GMT+7) to UTC, shifting stored events back by 7 hours (e.g. 09:00 -> 02:00Z).
  - Imported `toLocalISOString` from `../utils/date.js` into both `event-form.js` and `calendar.js`.
  - Replaced native `.toISOString()` with `toLocalISOString(date)`:
    - Quick event creation (`showQuickCreate`): `start_at: toLocalISOString(startAt)`, `end_at: toLocalISOString(endAt)`.
    - Detailed event modal (`showFullModal`):
      `startAtIso = toLocalISOString(new Date(...))`
      `endAtIso = toLocalISOString(new Date(...))`
    - Range queries in `calendar.js`:
      `api.get('/events', { start: toLocalISOString(startDt), end: toLocalISOString(endDt) })`.
  - Verified local date representation preserves identical hour/minute strings (`2026-11-05T09:30:00`).

### 1.3 Task Drag Reordering Persistence to Backend
- **Location**: `frontend/js/pages/todo.js:246-270`
- **Direct Observation**:
  - Previously, `reorderTasks(sourceId, targetId)` spliced `this.tasks` locally without persisting positions to the backend. Page reloads (F5) discarded user ordering.
  - Updated `reorderTasks` to:
    1. Splice `this.tasks` with the moved task.
    2. Re-assign sequential positions: `this.tasks.forEach((t, idx) => { t.position = idx; })`.
    3. Switch sort mode: `this.sortBy = 'default'` so the manual ordering is rendered immediately.
    4. Call `PUT /tasks/reorder` with payload `{"items": [{"id": t.id, "position": idx}, ...]}`.
  - Verified via CDP: Moving bottom task to top persists to PostgreSQL, and subsequent `api.get('/tasks')` returns tasks in the exact reordered sequence.

### 1.4 Recurrence Scope Selection Modal
- **Location**: `frontend/js/calendar/event-form.js:220-250, 275-310, 315-405`, `frontend/js/components/modal.js:80-160`, `frontend/css/components/modal.css:74-140`
- **Direct Observation**:
  - Implemented `EventForm.showRecurrenceScopeModal({ action: 'update' | 'delete', onConfirm: (scope) => ... })`.
  - Added 3 RFC 5545 recurrence scope options:
    1. `"this"`: "Chỉ sự kiện này"
    2. `"following"`: "Sự kiện này và các sự kiện tiếp theo"
    3. `"all"`: "Tất cả sự kiện trong chuỗi"
  - In `Modal.js`:
    - Added `modalStack = []` and dynamic z-index stacking (`500 + stackDepth * 10`) so recurrence scope dialog cleanly overlays the underlying event modal.
    - Added Esc-key top-of-stack dismissal (`Modal.modalStack[Modal.modalStack.length - 1] === this`).
  - Styled dialog in `modal.css` with responsive, theme-aware CSS variables for both light and dark themes.
  - When updating a recurring event (`isEdit && (event.recurrence_rule || event.parent_event_id || event.is_occurrence)`):
    - Submits `PUT /events/{targetId}` with `scope` and `original_start: toLocalISOString(initialStart)`.
  - When deleting a recurring event:
    - Submits `DELETE /events/{targetId}?scope={scope}&occurrence_date={toLocalISOString(initialStart)}`.
  - Verified live E2E:
    - Updating occurrence with `scope="this"` creates exception event (`is_exception: true`, `parent_event_id`) in DB.
    - Deleting occurrence with `scope="this"` creates cancelled tombstone (`is_cancelled: true`) in DB.

### 1.5 Strict Vanilla Compliance
- **Direct Observation**:
  - 0 external libraries, frameworks, or npm bundlers added.
  - 100% native ES modules and DOM APIs (`createElement`, `URLSearchParams`, `fetch`, CSS variables).

---

## 2. Logic Chain

1. **Dropdown Crash Root Cause & Fix**:
   - `todo.js` passes `{ triggerEl, anchorEl, items: [{ action }] }`.
   - `dropdown.js` had a vulnerability if either argument or item callback convention was missing.
   - Normalizing `targetEl = triggerEl || anchorEl` and `callback = item.onClick || item.action` eliminates all undefined property accesses and ensures complete compatibility across all call sites.

2. **Timezone Offset Root Cause & Fix**:
   - In GMT+7 (`Asia/Ho_Chi_Minh`), `Date.prototype.toISOString()` converts timestamps to UTC (`Z`), subtracting 7 hours.
   - When the backend receives naive datetimes or stores them without offset adjustments, the event regresses from 09:00 to 02:00.
   - `toLocalISOString()` extracts `getFullYear()`, `getMonth()`, `getDate()`, `getHours()`, `getMinutes()`, `getSeconds()` in the client's local timezone, generating `YYYY-MM-DDTHH:mm:ss`. This guarantees the exact wall-clock time entered by the user is preserved in the database.

3. **Task Ordering Persistence Root Cause & Fix**:
   - The backend already supported batch reordering via `PUT /tasks/reorder` (`ReorderRequest` with `List[ItemReorder]`).
   - Splicing local tasks array and assigning sequential integer positions (`0, 1, 2...`) matching display order, then invoking `api.put('/tasks/reorder', { items })`, updates `Task.position` in PostgreSQL.
   - Because `task_crud.py` orders queries by `Task.position.asc(), Task.id.desc()`, subsequent page loads reproduce the exact dragged arrangement.

4. **Recurrence Series Exception & Split UX**:
   - Recurring events in RFC 5545 can be altered either as a single instance (exception), series split (following), or entire series (all).
   - The backend `events.py` and `event_service.py` require `scope` and anchor datetime (`original_start` or `occurrence_date`).
   - Prompting the user with `showRecurrenceScopeModal` upon clicking Edit/Delete provides parity with Google Calendar and Outlook Calendar, cleanly executing the correct backend mutation without accidental series erasure.

---

## 3. Caveats

- No caveats. All 4 Milestone M2 requirements have been fully implemented in vanilla JS/CSS and verified through automated end-to-end browser execution and backend test suites.

---

## 4. Conclusion

Milestone M2: Frontend Stability & Core Bugfixes is **100% COMPLETE**:
- Fatal TypeError in `dropdown.js` fixed; sort dropdown opens cleanly with 0 errors.
- 7-hour timezone drift resolved via `toLocalISOString()`.
- Task drag reordering persists to PostgreSQL via `PUT /tasks/reorder`.
- Recurrence scope modal (`this`, `following`, `all`) operational on recurring event update/delete.
- Strict 100% Vanilla JS/HTML/CSS compliance maintained.
- All backend test suites and automated browser tests pass with 0 errors.

---

## 5. Verification Method

### 5.1 Automated Browser CDP Test
Execute:
```bash
python3 tests/test_m2_verification.py
```
Expected output:
```
[*] 1. Registering & authenticating test user...
   [OK] Authenticated and navigated to To-Do page
[*] 2. Testing Dropdown Sort Menu (BUG-08 fix)...
   [OK] Dropdown opened cleanly with 5 items
[*] 3. Testing Task Drag Reordering Persistence (PUT /tasks/reorder)...
   [OK] Task drag reorder persisted to DB
[*] 4. Testing Timezone Serialization (toLocalISOString)...
   [OK] Local ISO string correctly preserved
[*] 5. Testing Recurrence Scope Selection Modal...
   [OK] Scope dialog rendered with title 'Chỉnh sửa sự kiện định kỳ' and options
   [OK] Scope selection 'following' executed cleanly
   [OK] Delete scope dialog confirmed with scope='this'
[*] 6. Testing End-to-End Recurring Event Scope Flows...
   [OK] Live recurring event edit modal opened scope dialog and created exception event in DB
   [OK] Live recurring event delete modal opened scope dialog and recorded cancelled tombstone in DB

🎉 ALL MILESTONE M2 VERIFICATION CHECKS PASSED 100%!
```

### 5.2 Frontend HTTP 200 Check
Execute:
```bash
curl -I http://localhost:3000
```
Expected output: `HTTP/1.1 200 OK`

### 5.3 Backend E2E Test Suite in Docker
Execute:
```bash
docker exec web-template-backend-1 python tests/test_e2e_suite.py
```
Expected output:
```
=====================================================================
   E2E TEST EXECUTION SUMMARY
=====================================================================
   Total Test Cases Executed : 89
   Passed                    : 89
   Failed (Test Errors)      : 0
   Implementation Bugs Found : 0
```

### 5.4 Backend Recurrence Fixes Suite in Docker
Execute:
```bash
docker exec web-template-backend-1 python tests/test_recurrence_fixes.py
```
Expected output:
```
🎉 All Unit Tests Passed 100%!
🎉 ALL INTEGRATION TESTS PASSED 100%!
```
