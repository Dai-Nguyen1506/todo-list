# Dispatch: Worker 1 for Milestone M3 (Calendar UX Parity & Missing Views)

- **Agent**: `teamwork_worker_m3_1`
- **Role**: `implementer`, `qa`, `specialist`
- **Milestone**: M3: Calendar UX Parity & Missing Views
- **Working Directory**: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_worker_m3_1/`

## Context & Objectives
You are responsible for implementing core UX parity and interaction capabilities in Planify's Calendar module, matching benchmark apps (Google Calendar, Outlook Calendar, MS To Do):

1. **Agenda / Schedule View (`frontend/js/calendar/agenda-view.js`)**:
   - Implement `AgendaView` class with `render(container, events, currentDate)`.
   - Chronological list of upcoming events and tasks grouped by date across a 30-day window.
   - Badge indicator for Today, time ranges (or 'Cả ngày'), event category color pill, click to edit/view details.
   - Empty state when no events are scheduled.
   - Wire `agenda` into `frontend/js/pages/calendar.js` view switcher (add `Lịch biểu` / `Agenda` button in the view toggle group).

2. **Event Collision Column Packing (`BUG-15`) in `frontend/js/calendar/week-view.js` and `day-view.js`**:
   - In week and day hourly grids, calculate overlapping event clusters.
   - Assign concurrent overlapping events to columns (`width = 100 / numCols %`, `left = colIndex * width %`).
   - Eliminate occlusion where overlapping events completely cover each other.

3. **Native Drag-and-Drop Move & Bottom-Edge Resize**:
   - Make event cards `draggable="true"` in Week and Day views.
   - Handle `dragstart`, `dragover`, `drop` on hourly slots to reschedule events (update `start_at` and `end_at` via `api.put('/events/' + id, ...)`).
   - Add bottom-edge resize handle (`.event-resize-handle`) allowing user to drag the bottom edge down/up to adjust event duration in 15-minute increments.

4. **Unified Creation Modal in `frontend/js/calendar/event-form.js`**:
   - Add a tab switcher at the top of the creation modal: `[📅 Sự kiện]` and `[✅ Việc cần làm]`.
   - If `[✅ Việc cần làm]` is selected, allow creating a Task with title, due date, time, list, and priority, saving via `POST /tasks`.

5. **Strict Constraint**:
   - 100% Vanilla HTML, CSS, JavaScript (zero external UI libraries or bundlers).
   - Use `toLocalISOString()` for all datetime serializations to avoid timezone drift.

## Mandatory Verification
- Verify 0 console errors in headless Chrome via CDP.
- Run `tests/test_e2e_suite.py` in Docker to ensure 0 regressions.
- Write verification script `tests/test_m3_verification.py` demonstrating all 4 features.
- Provide detailed handoff report in `handoff.md`.

## 2026-11-01T17:40:21Z
You are Worker 1 for Milestone M3: Calendar UX Parity & Missing Views.
Working directory: /home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_worker_m3_1/

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INSTRUCTIONS:
1. Read the authoritative user request at `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/ORIGINAL_REQUEST.md`.
2. Read the master project plan at `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/PROJECT.md`.
3. Read your task dispatch at `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_worker_m3_1/DISPATCH.md`.
4. You own and will modify:
   - `frontend/js/calendar/agenda-view.js` (NEW file: implement Agenda / Schedule View)
   - `frontend/js/pages/calendar.js` (integrate Agenda view into view switcher and toolbar)
   - `frontend/js/calendar/week-view.js` (implement event collision column packing, drag-and-drop, and bottom-edge resize)
   - `frontend/js/calendar/day-view.js` (implement event collision column packing, drag-and-drop, and bottom-edge resize)
   - `frontend/js/calendar/event-form.js` (implement Unified Creation Modal: tabs for Event vs Task)
   - `frontend/css/pages/calendar.css` and `frontend/css/components/modal.css` (styling for Agenda view, resize handles, column packing, and tabs)
5. Architecture & Coding Constraints:
   - Strictly 100% Vanilla HTML, CSS, JavaScript (no external libraries, bundlers, npm packages, or frameworks).
   - Use `toLocalISOString()` from `frontend/js/utils/date.js` for all datetime conversions.
   - Maintain 0 console errors.
6. Verification:
   - Test in live Docker stack with headless Chrome (CDP) or automated test script.
   - Verify backend E2E suite (`docker exec web-template-backend-1 python tests/test_e2e_suite.py`) passes 100%.
   - Author `tests/test_m3_verification.py` verifying all 4 features.
7. Write your detailed handoff report in `handoff.md` and send a completion message to your orchestrator.

