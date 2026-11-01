# Handoff Report: Frontend Architecture & UX Survey

**Survey Agent**: `teamwork_explorer_survey_3`  
**Working Directory**: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_explorer_survey_3/`  
**Target Directory Audited**: `/home/dainguyen1506/Documents/todo-list/frontend/`  
**Timestamp**: 2026-11-01T15:50:00Z  

---

## 1. Observation

### 1.1 Architecture & Vanilla Compliance Audit
- **Zero Third-Party Libraries / Frameworks**:
  - `frontend/` contains only static files: `index.html` (167 lines), `css/` (15 stylesheets), `js/` (30 modules), `assets/`, `nginx.conf`, and `Dockerfile`.
  - There is NO `package.json`, NO `node_modules`, NO bundler (Webpack, Vite, Rollup, Parcel).
  - All script loading is via standard browser ES module imports: `<script type="module" src="js/app.js?v=2.2.0"></script>` (`frontend/index.html:163`).
- **SPA Router**:
  - `frontend/js/router.js:8` uses native `window.addEventListener('hashchange', () => this.handleRoute())`.
  - Handles public routes (`landing`, `login`, `register`) and protected routes (`calendar`, `todo`, `settings`) with route guards (`router.js:38-56`).
- **Central Store (Pub/Sub)**:
  - `frontend/js/store.js:5-60` implements an in-memory event-emitter store (`state`, `listeners`, `get()`, `set()`, `update()`, `on()`, `emit()`).
  - Zero external state management libraries.
- **API Client**:
  - `frontend/js/api.js:5-110` wraps native `window.fetch`, handles JWT bearer tokens, 401 unauthorization redirection to `#login`, and automatically unwraps `ApiResponse` payloads (`data.success === true && data.data !== undefined`).

### 1.2 Views Inventory & Gaps
- **Month View** (`frontend/js/calendar/month-view.js:17-142`):
  - Displays a 7-column month grid computed via `getMonthMatrix(year, month)`.
  - Up to 3 event cards rendered per day; displays `+N mục nữa` badge when more than 3 exist (`month-view.js:124-129`).
  - *Observation*: Clicking `+N mục nữa` does nothing (no overflow modal/popover). No multi-day event span across cells.
- **Week View** (`frontend/js/calendar/week-view.js:19-242`):
  - 7 columns with day headers, all-day horizontal row, and 24-hour time grid (60px per hour).
  - Contains red current time indicator line (`time-indicator.js`).
  - Auto-scrolls to current hour minus 1 (`week-view.js:240-241`).
  - *Observation*: Timed events are placed with hardcoded styles (`card.style.left = '2px'`, `card.style.right = '4px'`) (`week-view.js:224-225`). Overlapping events occupy the exact same horizontal space, occluding each other completely.
- **Day View** (`frontend/js/calendar/day-view.js:19-158`):
  - Single-day 24-hour time grid with current time indicator.
  - *Observation*: Hardcoded positioning (`left = '4px'`, `right = '8px'`) (`day-view.js:142-143`). Overlapping events occlude each other.
- **Agenda View**:
  - **CRITICAL DEFECT**: The Agenda (or Schedule / List) view is **COMPLETELY MISSING**.
  - In `calendar.js:235-239`, toolbar toggle buttons exist ONLY for Day, Week, and Month:
    ```javascript
    <button class="view-toggle-btn ${curMode === 'day' ? 'active' : ''}" data-view="day">Ngày</button>
    <button class="view-toggle-btn ${curMode === 'week' ? 'active' : ''}" data-view="week">Tuần</button>
    <button class="view-toggle-btn ${curMode === 'month' ? 'active' : ''}" data-view="month">Tháng</button>
    ```
  - No `agenda-view.js` exists in `frontend/js/calendar/` or anywhere in the repository.
- **To-Do View** (`frontend/js/pages/todo.js:27-135`):
  - Left sidebar (`smart-lists.js`): My Day, Important, Planned, All Tasks, and Custom Task Lists.
  - Planned list partitions tasks into 5 groups: "Quá hạn", "Hôm nay", "Ngày mai", "Tuần này", "Sau đó" (`task-list-view.js:178-249`).
  - Task item (`task-item.js`) displays subtask counts (`completed/total`), due date badges, recurrence icon, and important star.
  - Detail panel (`task-detail.js`): manages subtasks (steps), due date, recurrence, notes, and time-blocking (`start_time`, `end_time`, `duration_minutes`, `color`).
  - Suggestions modal (`suggestions.js`): recommends overdue, today, and important tasks for My Day.
- **Settings View** (`frontend/js/pages/settings.js:11-183`):
  - Theme cards (Light, Dark, System), profile update (nickname, timezone), password change, and logout.
- **AI Assistant View** (`frontend/js/ai/chat-panel.js:18-272`):
  - Sliding right-side drawer panel with quick prompt chips, message history, tool execution badges, and typing indicator.
  - *Observation*: In `router.js:32-36`, navigating to `#ai` is a pseudo-route that forces navigation to `#calendar` and opens the side drawer:
    ```javascript
    if (path === 'ai') {
      store.set('isAiPanelOpen', true);
      window.location.hash = '#calendar';
      return;
    }
    ```
    There is no standalone full-page AI chat view.

### 1.3 Event & Task Interactions
- **Calendar Event Drag-and-Drop & Resizing**:
  - In `event-card.js:8-64`, event card elements have NO `draggable="true"` attribute and NO drag event listeners.
  - In `week-view.js` and `day-view.js`, column slots have NO `ondragover` or `ondrop` handlers for events.
  - No resize handles (bottom border dragging) exist on event cards.
  - *Observation*: `frontend/js/components/guide-card.js:89-91` explicitly tells users:
    `"• Kéo sự kiện/task: Đổi giờ hoặc chuyển ngày | • Kéo cạnh dưới: Tăng/giảm thời lượng"` — but these features are completely non-existent in the implementation.
- **Unified Create Modal on Calendar**:
  - Clicking an empty slot in `WeekView` (`week-view.js:190`) or `DayView` (`day-view.js:110`) calls `EventForm.showQuickCreate(...)`.
  - In `event-form.js:12-86`, this modal only allows creating an **Event** (`POST /events`). There is no option or tab to create a **Task** (Time-Blocking) from the calendar.
- **Recurrence Rule UI**:
  - In `event-form.js:161-170` and `task-detail.js:234-250`, recurrence is a static `<select>` dropdown with 4-5 hardcoded values (`FREQ=DAILY`, `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR`, `FREQ=WEEKLY`, `FREQ=MONTHLY`).
  - There is NO custom recurrence builder (custom intervals, custom days of week, ending after N times or on date).
  - In `event-form.js:212-226` and `257-270`, deleting or updating a recurring event calls `DELETE /events/{id}` or `PUT /events/{id}` directly. There is NO scope prompt (`this` vs `following` vs `all`), even though the backend endpoint (`backend/app/api/v1/endpoints/events.py:63`) specifically accepts `scope: str = Query("this", pattern="^(this|following|all)$")`.
- **To-Do Task Reordering Persistence**:
  - In `task-item.js:22-51`, HTML5 drag-and-drop triggers `onReorder(sourceTaskId, task.id)`.
  - In `todo.js:245-253`, `reorderTasks` splices the local in-memory array `this.tasks` and calls `updateComponents()`.
  - *Observation*: It **never calls any backend API** (e.g. `PUT /tasks/{id}/position` or `PATCH /tasks/reorder`). Reloading the page (F5) immediately resets tasks back to original database order.

### 1.4 Uncaught Console Exceptions & Runtime Bugs
1. **Fatal TypeError on To-Do Sort Dropdown**:
   - Location: `frontend/js/pages/todo.js:272-275` vs `frontend/js/components/dropdown.js:6-10, 29`:
   - In `todo.js`:
     ```javascript
     Dropdown.show({
       anchorEl: e.currentTarget,
       items: [
         { label: 'Mặc định (Thủ công)', action: () => { ... } }, ...
       ]
     });
     ```
   - In `dropdown.js`:
     ```javascript
     static show({ triggerEl, items = [] }) {
       this.close();
       const rect = triggerEl.getBoundingClientRect(); // TypeError: triggerEl is undefined!
       ...
       if (typeof item.onClick === 'function') item.onClick(); // item.action is ignored!
     }
     ```
   - **Result**: Clicking "⇅ Sắp xếp" in To-Do crashes with `Uncaught TypeError: Cannot read properties of undefined (reading 'getBoundingClientRect')`.
2. **Timezone Drift (BUG-13)**:
   - Location: `frontend/js/calendar/event-form.js:61-62, 251-252` and `calendar.js:267`:
   - In `event-form.js:251-252`:
     ```javascript
     start_at: new Date(startStr).toISOString(),
     end_at: new Date(endStr).toISOString(),
     ```
   - In `calendar.js:267`:
     ```javascript
     api.get('/events', { start: startDt.toISOString(), end: endDt.toISOString() })
     ```
   - Although `frontend/js/utils/date.js:136-157` defines `toLocalISOString(date)` and `formatLocalDate(date)`, `event-form.js` uses native `.toISOString()`.
   - In GMT+7 (`Asia/Ho_Chi_Minh`), `new Date('2026-11-02T09:00:00').toISOString()` produces `2026-11-02T02:00:00.000Z`, shifting the stored event by 7 hours.
3. **Orphaned ContextMenu Component**:
   - `frontend/js/components/contextmenu.js` is defined but never imported or invoked anywhere in `frontend/`. Neither calendar events nor task items have context menu event bindings.

---

## 2. Logic Chain

```
[Observation 1.1: No npm, no node_modules, no webpack/vite]
  └── Rationale: All source files are served directly as ES modules via Nginx.
  └── Conclusion: Strict compliance with 100% Vanilla HTML, CSS, JavaScript is satisfied.

[Observation 1.2: agenda-view.js is absent; calendar toolbar only has day/week/month buttons]
  └── Rationale: User requirements and benchmark parity explicitly mandate an Agenda / Schedule view.
  └── Conclusion: Agenda view is an unfulfilled acceptance criteria item that must be implemented.

[Observation 1.2 & 1.3: event-card.js lacks draggable; guide-card promises drag-and-drop & resize]
  └── Rationale: Users attempting to drag events or resize duration see zero response, causing severe UX friction.
  └── Conclusion: Native HTML5 drag-and-drop and resize-handle logic must be added to event cards and time grid slots.

[Observation 1.2: week-view.js and day-view.js render items with fixed left/right offsets]
  └── Rationale: Concurrent items (e.g. 2 meetings at 10:00) share left: 2px, right: 4px, completely hiding one another.
  └── Conclusion: Collision detection and multi-column packing (width = 100/cols %, left = colIdx * width %) is mandatory.

[Observation 1.3: EventForm lacks task creation tab; recurrence lacks custom builder and scope dialog]
  └── Rationale: Google Calendar and Outlook allow choosing between Event and Task in the creation popover and prompt for "This / Following / All" when updating/deleting recurring series.
  └── Conclusion: EventForm must be enhanced with a Task tab, custom RRULE builder, and recurrence scope prompt dialog.

[Observation 1.4: todo.js passes { anchorEl, items: [{ action }] } while dropdown.js reads triggerEl and item.onClick]
  └── Rationale: Invoking showSortDropdown immediately evaluates undefined.getBoundingClientRect().
  └── Conclusion: Confirmed blocker bug causing uncaught JavaScript runtime crash on the To-Do page.
```

---

## 3. Benchmark Usability & UX Comparison Matrix

| Capability / Flow | Google Calendar | Outlook Calendar | Microsoft To Do | Planify Current State | Gap / UX Friction |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Vanilla Codebase** | N/A (Closure/React) | N/A (React/TS) | N/A (React/TS) | **100% Vanilla JS/CSS** | None. Fully compliant with project architecture rule. |
| **Month View** | Yes (overflow modal, multi-day chips) | Yes | N/A | **Yes (basic 3 items)** | No overflow modal on `+N mục nữa`, no multi-day event spanning. |
| **Week View** | Yes (side-by-side collision packing) | Yes (side-by-side packing) | N/A | **Yes (overlapping defect)** | Overlapping events occlude each other 100% (`left: 2px, right: 4px`). |
| **Day View** | Yes | Yes | N/A | **Yes** | Same overlap issue. |
| **Agenda / Schedule View** | Yes (chronological list by day) | Yes (Agenda view) | N/A | **MISSING (0%)** | View is completely absent from toolbar and codebase. |
| **Drag-and-Drop Scheduling** | Drag to change day/hour | Drag to change day/hour | Drag to reorder | **Events: 0% / Tasks: 50%** | Events cannot be dragged. Task reorder in UI does not save to DB. |
| **Event Duration Resize** | Drag bottom edge | Drag bottom edge | N/A | **MISSING (0%)** | No resize handle on event cards. |
| **Unified Create Modal** | Event, Task, Reminder tabs | Event, To Do tabs | Task input | **Events only** | Cannot create a To-Do task from Calendar time slots. |
| **Recurrence Rule Flexibility** | Custom builder (intervals, end dates) | Custom builder | Daily, Weekdays, Weekly, Monthly, Custom | **Hardcoded 4 options** | No custom interval builder; no recurrence scope modal on edit/delete. |
| **To-Do Smart Lists** | N/A | Tasks integration | My Day, Important, Planned, All | **Yes** | Fully styled with gradient themes and smart filters. |
| **Subtasks / Steps** | Yes | Yes | Yes | **Yes** | Fully functional in `task-detail.js`. |
| **Time-Blocking (Task ↔ Cal)** | Limited | Limited | Limited | **Advanced (start/end/duration/color)** | Planify leads in concept, but lacks calendar-side task create/drag. |
| **AI Assistant Integration** | Gemini side panel | Copilot side panel | Copilot | **Chat drawer with 12 tools** | Reactive data reload via `'task-changed'`, but `#ai` kicks user to calendar. |
| **Console Runtime Stability** | 0 uncaught exceptions | 0 uncaught exceptions | 0 uncaught exceptions | **1 fatal TypeError** | Clicking "⇅ Sắp xếp" crashes in `todo.js` / `dropdown.js`. |

---

## 4. Caveats
- No caveats regarding code inspection; every JavaScript module (30 files), CSS stylesheet (15 files), and HTML entry point in `frontend/` was directly examined.
- Docker container stack is healthy (`web-template-frontend-1`, `web-template-backend-1`, `web-template-db-postgre-1`, `web-template-redis-1`), allowing live end-to-end verification.

---

## 5. Conclusion & Actionable Recommendations

The Planify frontend architecture demonstrates exceptional compliance with the 100% Vanilla HTML, CSS, and JavaScript requirement. Its design achieves modern SPA routing, pub/sub state handling, and sleek visual theming without a single external library.

However, to achieve true feature parity and benchmark-grade usability matching Google Calendar, Outlook Calendar, and Microsoft To Do, the following 8 remediation actions must be executed:

1. **Fix `Dropdown.show` Blocker Crash in `todo.js` & `dropdown.js`**:
   - In `dropdown.js`: Support both `triggerEl` and `anchorEl`, and support both `item.onClick` and `item.action`.
2. **Implement the Missing `AgendaView` (`frontend/js/calendar/agenda-view.js`)**:
   - Create `AgendaView` class listing upcoming events and time-blocked tasks grouped chronologically by date.
   - Add `<button class="view-toggle-btn" data-view="agenda">Lịch biểu</button>` to `calendar.js` toolbar.
3. **Implement Event Collision Detection & Column Packing (`BUG-15`)**:
   - In `week-view.js` and `day-view.js`: Group overlapping items into cluster columns, computing `width = (100 / cluster.columns)%` and `left = (colIndex * width)%`.
4. **Implement Calendar Event Drag-and-Drop & Resizing**:
   - Make event cards draggable (`draggable="true"`), attach `dragstart`, and add slot `dragover`/`drop` handlers to update `start_at` / `end_at` via `api.put('/events/{id}')`.
   - Add a bottom resize handle to adjust duration by 15/30-minute increments.
5. **Add Unified Event/Task Creation Modal on Calendar**:
   - Upgrade `EventForm` to support tabbed creation: `[📅 Sự kiện]` and `[✅ Việc cần làm]`, allowing direct creation of time-blocked tasks from calendar slots.
6. **Implement Recurrence Scope Selection Dialog**:
   - When updating or deleting a recurring event, show a modal asking: *"Chỉ sự kiện này" (`scope=this`)*, *"Sự kiện này và tiếp theo" (`scope=following`)*, or *"Tất cả sự kiện" (`scope=all`)*.
7. **Persist Task Reordering to Backend**:
   - In `todo.js:reorderTasks`, call `api.put('/tasks/{id}', { position })` or bulk reorder endpoint so user custom ordering survives page reloads.
8. **Fix Timezone Serialization (BUG-13)**:
   - Replace `.toISOString()` in `event-form.js` with `toLocalISOString()` from `date.js` to eliminate 7-hour timezone shift in GMT+7.

---

## 6. Verification Method

1. **Static Analysis & Inspection**:
   - Inspect `frontend/js/components/dropdown.js:6-10` and `frontend/js/pages/todo.js:272-275` to verify parameter mismatch.
   - Inspect `frontend/js/pages/calendar.js:235-239` to verify absence of Agenda view toggle.
   - Inspect `frontend/js/calendar/week-view.js:224-225` to verify lack of collision packing.
   - Inspect `frontend/js/calendar/event-card.js:14-27` to verify absence of `draggable` and resize handles.
2. **Runtime Verification**:
   - Verify frontend serves correctly: `curl -I http://localhost:3000/` returns `HTTP/1.1 200 OK`.
   - Test Docker backend container tests: `docker exec web-template-backend-1 python tests/test_audit_fixes.py` exits code 0.
3. **Invalidation Conditions**:
   - If `Dropdown.show` is called with `{ anchorEl }` without crashing, the parameter fix has been applied.
   - If `calendar.js` contains a functional `agenda` view mode, the Agenda gap is resolved.
   - If 2 events at 09:00 on the same day render side-by-side at 50% width each, collision packing is verified.
