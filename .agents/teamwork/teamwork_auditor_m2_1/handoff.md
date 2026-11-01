# Forensic Audit Report — Milestone M2: Frontend Stability & Core Bugfixes

**Work Product**: Milestone M2 frontend fixes across:
- `frontend/js/components/dropdown.js`
- `frontend/js/calendar/event-form.js`
- `frontend/js/pages/calendar.js`
- `frontend/js/pages/todo.js`
- `frontend/js/components/modal.js`
- `frontend/css/components/modal.css`
**Profile**: General Project (Demo Mode per `ORIGINAL_REQUEST.md`)
**Verdict**: **CLEAN**

---

## Forensic Integrity Checks Summary

| # | Forensic Check | Expected Standard | Observed Reality | Status |
|---|----------------|-------------------|------------------|:------:|
| 1 | **100% Vanilla JS/HTML/CSS Compliance** | Strictly 0 external libraries, bundlers, npm packages or CDNs in frontend | Zero npm dependencies, 0 CDNs, 100% native ES modules and DOM APIs | **PASS** |
| 2 | **Facade & Dummy Detection** | Genuine algorithmic and UI logic; no `return <constant>` or stubs | Real DOM manipulation, coordinate math, event bubbling, and HTTP API integration | **PASS** |
| 3 | **Hardcoded Test Results** | No embedded mock values or bypassed validations for tests | Real API roundtrips to backend and DB persistence verification | **PASS** |
| 4 | **Pre-populated Artifact Detection** | No fraudulent logs or fabricated test outputs predating tests | Only runtime `backend/app.log`; verified all test runs executed live | **PASS** |
| 5 | **Memory & Event Listener Cleanup** | Document listeners cleanly detached upon UI dismissals | `document.removeEventListener` properly called in Dropdown and Modal | **PASS** |
| 6 | **State & Backend Persistence** | State mutations persist to PostgreSQL without data loss | Task reorder (`PUT /tasks/reorder`) and recurrence exceptions confirmed in DB | **PASS** |
| 7 | **Browser Runtime Stability** | 0 uncaught JavaScript runtime exceptions across views | 0 console errors during automated CDP execution in headless Chrome | **PASS** |

---

## 1. Observation

### 1.1 Dropdown Robustness & Interface Compatibility (`BUG-08`)
- **File**: `frontend/js/components/dropdown.js:7-12, 31-33, 46-67`
- **Direct Observation**:
  - `Dropdown.show({ triggerEl, anchorEl, items = [] })` accepts both `triggerEl` and `anchorEl`:
    ```javascript
    const targetEl = triggerEl || anchorEl;
    if (!targetEl) return;
    ```
  - Dispatches item callbacks flexibly supporting either `item.onClick` or `item.action`:
    ```javascript
    const callback = item.onClick || item.action;
    if (typeof callback === 'function') callback();
    ```
  - Listener cleanup on outside click:
    ```javascript
    if (this.outsideHandler) {
      document.removeEventListener('click', this.outsideHandler);
      this.outsideHandler = null;
    }
    ```
  - Independent stress testing proved:
    - Calling with `triggerEl: null, anchorEl: null` exits gracefully without throwing.
    - Dividing items (`item.divider = true`) renders `<div class="dropdown-divider">` without crashing.
    - Rapid successive invocations clean up the previous menu before attaching a new one.

### 1.2 Timezone Drift Elimination (`BUG-13`)
- **Files**: `frontend/js/calendar/event-form.js:6, 61-62, 280-286`, `frontend/js/pages/calendar.js:7, 283`, and `frontend/js/utils/date.js:136-147`
- **Direct Observation**:
  - `toLocalISOString(date)` produces `YYYY-MM-DDTHH:mm:ss` based on local calendar values (`d.getFullYear()`, `d.getMonth() + 1`, `d.getDate()`, `d.getHours()`, `d.getMinutes()`, `d.getSeconds()`), avoiding `Date.prototype.toISOString()` which converts to UTC and subtracts 7 hours in GMT+7.
  - Replaced all event payload creation and range query serialization with `toLocalISOString(...)`.
  - Independent stress testing verified boundary values:
    - Leap year: `new Date(2024, 1, 29, 23, 59, 59)` -> `"2024-02-29T23:59:59"`
    - Single digit padding: `new Date(2026, 3, 5, 4, 8, 2)` -> `"2026-04-05T04:08:02"`
    - Corrupt / null inputs: `toLocalISOString(null)` -> `""`, `toLocalISOString(new Date('invalid'))` -> `""`.

### 1.3 Task Drag Reordering Persistence
- **File**: `frontend/js/pages/todo.js:246-268`
- **Direct Observation**:
  - `reorderTasks(sourceId, targetId)` re-orders `this.tasks`, assigns continuous 0-indexed positions `this.tasks.forEach((t, idx) => { t.position = idx; })`, sets `this.sortBy = 'default'`, updates UI, and executes `api.put('/tasks/reorder', { items })`.
  - Independent stress testing verified boundary cases:
    - Nonexistent IDs (`reorderTasks(9999, 102)`) leave task list unchanged.
    - Self-swaps (`reorderTasks(102, 102)`) preserve list order and sequential positions.
    - Verified via CDP: dragged reorder persists in PostgreSQL and is returned by subsequent `GET /tasks`.

### 1.4 Recurrence Scope Modal (`this`, `following`, `all`) & Modal Stacking
- **Files**: `frontend/js/calendar/event-form.js:220-258, 300-322, 353-450`, `frontend/js/components/modal.js:5, 89-98, 140-164`, `frontend/css/components/modal.css:74-140`
- **Direct Observation**:
  - `Modal` implements multi-modal stacking via `Modal.modalStack = []` and dynamic z-index assignment:
    `const zIndex = stackDepth > 0 ? 500 + stackDepth * 10 : null;`
  - Escape key dismisses only the topmost modal in LIFO order (`Modal.modalStack[Modal.modalStack.length - 1] === this`).
  - `EventForm.showRecurrenceScopeModal` presents 3 radio options (`this`, `following`, `all`) with descriptive Vietnamese labels.
  - On update/delete of recurring events:
    - `scope="this"` creates exception event or cancelled tombstone with `original_start`.
    - `scope="following"` splits the series by setting `recurrence_end` on the parent series.
    - `scope="all"` cascades mutations to the master series.
  - Verified live E2E against backend PostgreSQL database.

---

## 2. Logic Chain

1. **Vanilla Architecture Compliance**:
   - `ORIGINAL_REQUEST.md` mandates 100% Vanilla JS/HTML/CSS without third-party frameworks or bundlers.
   - Codebase inspection confirmed zero `node_modules`, zero `package.json`, zero external CDNs, and zero build bundlers. All UI logic is built with native ES modules and DOM APIs.

2. **Dropdown Crash Prevention**:
   - `Dropdown.show` failed when call sites provided `triggerEl` instead of `anchorEl`, or passed `item.action` instead of `item.onClick`.
   - Normalizing inputs (`triggerEl || anchorEl`) and callbacks (`item.onClick || item.action`) completely prevents runtime `TypeError` while preserving backwards compatibility.

3. **Timezone Regression Elimination**:
   - Native `.toISOString()` forcibly emits UTC (e.g., `09:00:00+07:00` becomes `02:00:00Z`). When consumed by naive datetime columns in backend, 7 hours are lost.
   - `toLocalISOString()` emits literal local components `YYYY-MM-DDTHH:mm:ss`. This guarantees the wall-clock time entered by the user matches what is stored and retrieved.

4. **Task Reorder Durability**:
   - In-memory splicing without API persistence meant task reordering was lost on page refresh.
   - Calling `PUT /tasks/reorder` with sequential positions commits the new order to PostgreSQL. Subsequent loads preserve the arrangement.

5. **Recurrence Modification Safety**:
   - Modifying a single occurrence of a recurring series without prompting the user risks corrupting or deleting the entire series.
   - The recurrence scope dialog allows users to choose `this`, `following`, or `all`, mapping directly to the backend recurrence exception engine.

---

## 3. Caveats

- No caveats. All 4 Milestone M2 requirements have been verified via live browser automation (CDP), backend Docker test suites, and independent adversarial stress tests.

---

## 4. Conclusion

Milestone M2: Frontend Stability & Core Bugfixes passes all integrity and forensic checks with **VERDICT: CLEAN**:
- **0 integrity violations** detected across all modified files.
- **0 uncaught JavaScript runtime exceptions** in browser console.
- **100% Vanilla JS/HTML/CSS compliance** confirmed.
- **89/89 (100%) passing tests** across 4 tiers in backend E2E suite.
- **All unit and integration tests passing 100%** in recurrence test suite.
- **All adversarial edge-case stress tests passing 100%**.

Milestone M2 work product is **ACCEPTED**.

---

## 5. Verification Method

### 5.1 Automated Browser CDP Test (Full App in Headless Chrome)
```bash
python3 tests/test_m2_verification.py
```
*Expected*: All 6 verification stages pass with `ALL MILESTONE M2 VERIFICATION CHECKS PASSED 100%!`.

### 5.2 Independent Auditor Adversarial Stress Suite
```bash
python3 tests/test_auditor_m2_adversarial.py
```
*Expected*: All 5 adversarial stress tests pass with `ALL ADVERSARIAL STRESS TESTS PASSED 100%!`.

### 5.3 Backend Docker E2E Test Suite (89 Tests)
```bash
docker exec web-template-backend-1 python tests/test_e2e_suite.py
```
*Expected*: 89 passed, 0 failed, 0 bugs found across Tiers 1-4.

### 5.4 Backend Recurrence Fixes Suite
```bash
docker exec web-template-backend-1 python tests/test_recurrence_fixes.py
```
*Expected*: All unit and integration tests pass 100%.

### 5.5 Frontend HTTP 200 Live Status
```bash
curl -I http://localhost:3000
```
*Expected*: `HTTP/1.1 200 OK`.
