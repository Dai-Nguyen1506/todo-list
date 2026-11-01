# Milestone M1 Adversarial Challenge Report: Recurrence Date-Math Engine

**Agent**: `teamwork_challenger_m1_1`  
**Milestone**: M1 (Backend Core & Recurrence Fixes)  
**Parent Agent**: `40afc6c8-54ce-40db-a75d-a5a3d1574a50`  
**Working Directory**: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_challenger_m1_1/`  
**Date**: 2026-11-01  
**Verdict**: `CHALLENGE_FAILED (Uncaught OverflowError, ValueError, and HTTP 500 Server Crash on unbounded INTERVAL and out-of-range years)`  

---

## 1. Observation

### 1.1 Direct Observations & Test Execution Results Inside Docker
Executed adversarial test suite `backend/tests/test_adversarial_recurrence.py` inside `web-template-backend-1`:
```bash
docker exec web-template-backend-1 python tests/test_adversarial_recurrence.py
```

Output:
```
==================================================================
  ADVERSARIAL RECURRENCE ENGINE & DATE-MATH STRESS TEST SUITE     
==================================================================

--- [Category 1: Century Leap Years & Leap Day Boundaries] ---
  [PASS] Century leap year 2000: Jan 31 -> Feb 29 (clamped to leap day)
  [PASS] Century leap year 2000: Feb 29 -> Feb 28, 2001
  [PASS] Leap year 1996 + 4 years -> Century leap year 2000 (Feb 29 preserved)
  [PASS] Century leap year 2000 + 4 years -> Leap year 2004 (Feb 29 preserved)
  [PASS] Century non-leap year 1900: Jan 31 -> Feb 28
  [PASS] Leap year 1896 + 4 years -> Century non-leap 1900 clamped to Feb 28
  [PASS] Century non-leap year 2100: Jan 31 -> Feb 28
  [PASS] Leap year 2096 + 4 years -> Century non-leap 2100 clamped to Feb 28
  [PASS] Chained 4-year leap cycles (2024 -> 2028 -> 2032) preserve Feb 29
  [PASS] Daily transitions across leap day: Feb 28 -> Feb 29 -> Mar 1

--- [Category 2: Month-End Sequences & Full Year Cascades] ---
  [PASS] All 31-day month boundaries properly clamped in 2026
  [PASS] Leap year 2024: Jan 31 -> Feb 29 -> Mar 29
  [PASS] 12-month sequential cascade from Jan 31 completed without error (2026-01-31 -> 2027-01-28)
  [PASS] Multi-month intervals (INTERVAL=2, 3, 6, 12) calculate and clamp accurately

--- [Category 3: Year-Boundary Crossings & Bi-Weekly Intervals] ---
  [PASS] Bi-weekly crossing year boundary: Dec 25, 2025 -> Jan 8, 2026
  [PASS] Bi-weekly with BYDAY=TH crossing year boundary: Dec 25 -> Jan 8
  [PASS] 4-week interval crossing year boundary: Dec 15, 2025 -> Jan 12, 2026
  [PASS] Year-end transition: Dec 31, 2025 -> Jan 1, 2026

--- [Category 4: BYDAY Combinations & Extreme Sequences] ---
  [PASS] All 7 weekdays (BYDAY=MO,TU,WE,TH,FR,SA,SU) step through full week and wrap to Monday
  [PASS] Bi-weekly all 7 weekdays: Sun wraps with 2-week interval to next alternate Monday
  [PASS] Disordered and duplicate BYDAY list handled correctly
  [PASS] Positional weekday prefixes (+1MO, -1FR) stripped cleanly
  [PASS] Base date outside scheduled days smoothly jumps to first upcoming weekday
  [PASS] Single weekday BYDAY=WE advances 7 days to next Wednesday

--- [Category 5: COUNT Limits & Termination Edge Cases] ---
  [PASS] COUNT=1 returns None
  [PASS] COUNT=0 returns None
  [PASS] Negative COUNT returns None
  [PASS] _decrement_count_in_rrule decrements COUNT accurately
  [PASS] COUNT=3 exact lifecycle: exactly 3 occurrences produced, terminates on 3rd

--- [Category 6: UNTIL Limits & Timezone Variations] ---
  [PASS] Basic date UNTIL permits inclusive date and terminates after
  [PASS] Dashed UNTIL format (YYYY-MM-DD) parsed and enforced
  [PASS] UTC UNTIL timestamp with Z (YYYYMMDDTHHMMSSZ) parsed and enforced
  [PASS] Offset UNTIL timestamp (+07:00) parsed and enforced
  [PASS] Historical UNTIL terminates immediately
  [PASS] UNTIL on leap day (20240229) operates accurately

--- [Category 7: Bounded Input Robustness & Fuzzing] ---
  [PASS] 500 bounded combinatorial fuzzing iterations completed with 0 crashes

--- [Category 8: Live HTTP API & Database Integrity Tests] ---
  [PASS] Live DB: Jan 31 leap year auto-spawned task clamped to 2024-02-29
  [PASS] Live DB: Century 1900 task auto-spawned clamped to 1900-02-28
  [PASS] Live DB: COUNT=2 series generated exactly 2 tasks and terminated with 0 extra records
  [PASS] Live DB: UNTIL limit prevented subsequent task generation
  [PASS] Live DB: Event scope='this' update and delete preserved master series and stored exceptions

--- [Category 9: Adversarial Exploit Probes & Defect Reproduction] ---
  [DEFECT CONFIRMED] Uncaught OverflowError: Python int too large to convert to C int
  [DEFECT CONFIRMED] Uncaught ValueError: year 12025 is out of range
  [DEFECT CONFIRMED] Uncaught ValueError: year 12026 is out of range
  [DEFECT CONFIRMED] Live HTTP 500 Server Crash reproduced on PATCH /tasks/705/complete

==================================================================
ADVERSARIAL STRESS TEST SUMMARY (642 standard assertions verified):
- Categories 1-8 (Leap Century, Month-End, Bi-Weekly, BYDAY, COUNT, UNTIL, DB Integrity): 100% PASSED
- Category 9: 4 DEFECTS EMPIRICALLY CONFIRMED:
    * OverflowError: FREQ=DAILY;INTERVAL=999999999999999999999999999999999999999999 -> timedelta days parameter exceeded: Python int too large to convert to C int
    * ValueError: FREQ=YEARLY;INTERVAL=9999 -> date target_year out of range: year 12025 is out of range
    * ValueError: FREQ=MONTHLY;INTERVAL=120000 -> date target_year out of range: year 12026 is out of range
    * Unhandled 500 SYSTEM_ERROR: PATCH /api/v1/tasks/705/complete -> HTTP 500 returned on task completion due to unhandled OverflowError in task_service.toggle_complete
==================================================================
```

### 1.2 Verbatim Container Traceback from Server Logs
When a task created with `recurrence_rule="FREQ=DAILY;INTERVAL=999999999999999999999999999999999999999999"` is marked complete via `PATCH /api/v1/tasks/{id}/complete`, `web-template-backend-1` crashes with:
```
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 372, in run_endpoint_function
    return await dependant.call(**values)
  File "/app/app/api/v1/endpoints/tasks.py", line 103, in toggle_task_complete
    return await task_service.toggle_complete(
  File "/app/app/services/task_service.py", line 71, in toggle_complete
    next_due_date = self._calculate_next_due_date(task.due_date, task.recurrence_rule)
  File "/app/app/services/task_service.py", line 198, in _calculate_next_due_date
    next_date = base_date + timedelta(days=interval)
OverflowError: Python int too large to convert to C int
```
HTTP Response returned to client:
```json
{"success":false,"error":{"code":"SYSTEM_ERROR","message":"Đã xảy ra lỗi hệ thống nghiêm trọng."}}
```
Status code: `500 Internal Server Error`.

### 1.3 Exact Code Locations in `backend/app/services/task_service.py`
1. Line 177:
   ```python
   interval = max(1, int(params.get("INTERVAL", 1)))
   ```
   Unbounded integer parsing allows arbitrary size integers without upper bound clamping.
2. Line 198 & 220:
   ```python
   next_date = base_date + timedelta(days=interval)
   ```
   Raises `OverflowError: Python int too large to convert to C int` when `interval > sys.maxsize`, or `OverflowError: days=...; must have magnitude <= 999999999` when `interval > 999999999`.
3. Lines 227-233 (`MONTHLY`) & lines 235-239 (`YEARLY`):
   ```python
   target_year = base_date.year + interval
   ...
   next_date = date(target_year, target_month, target_day)
   ```
   When `target_year > 9999`, Python `datetime.date(target_year, ...)` raises `ValueError: year ... is out of range`.
4. Line 71 (`toggle_complete`):
   ```python
   next_due_date = self._calculate_next_due_date(task.due_date, task.recurrence_rule)
   ```
   Lacks `try...except (ValueError, OverflowError)` handling; exceptions bubble up and crash the endpoint with HTTP 500.

---

## 2. Logic Chain

1. **Premise 1 (Dispatched Requirement)**:
   - DISPATCH requires verifying that extreme recurrence cases cause 0 uncaught exceptions (`ValueError`, `OverflowError`, `TypeError`, or unhandled 500).
2. **Premise 2 (Defect Discovery via Stress Test)**:
   - When an RRULE contains an unbounded `INTERVAL` (e.g., from an adversarial user or malformed AI prompt like `INTERVAL=999999999999999999999999999999999999999999` or `FREQ=YEARLY;INTERVAL=9999`), `int(...)` parses the string into an arbitrarily large Python integer.
3. **Premise 3 (Direct Reproduction)**:
   - `timedelta(days=interval)` fails with `OverflowError` (Observation 1.1 & 1.2).
   - `date(target_year, target_month, target_day)` fails with `ValueError: year ... is out of range` for `target_year > 9999` (Observation 1.1).
4. **Premise 4 (Service Impact)**:
   - When calling `PATCH /api/v1/tasks/{id}/complete`, `toggle_complete` invokes `_calculate_next_due_date` without wrapping the call in a `try...except (ValueError, OverflowError)` block.
   - The uncaught exception causes FastAPI to return HTTP 500 (`SYSTEM_ERROR`), directly violating the 0 unhandled 500 exceptions acceptance criterion in `ORIGINAL_REQUEST.md` (§ Acceptance Criteria) and `DISPATCH.md` (§ Instructions 2).

---

## 3. Caveats

- **Standard Ranges Are Sound**: For standard parameters (`INTERVAL <= 1000`, standard century leap years 2000/1900/2100, month-end 31->28/29, bi-weekly cycles, all 7 BYDAY combinations, COUNT=1/0, and UNTIL timestamps), all 642 test assertions passed cleanly without defect.
- **Scope of Defect**: The vulnerability is isolated to unbounded `INTERVAL` values and date arithmetic exceeding Python's datetime representation limits (`year > 9999` and `days > 999,999,999`).

---

## 4. Conclusion

**Verdict: `CHALLENGE_FAILED`**  

The implementation fails the adversarial stress test on unhandled exceptions:
1. `OverflowError: Python int too large to convert to C int` and `OverflowError: days must have magnitude <= 999999999` occur on large `INTERVAL` values.
2. `ValueError: year ... is out of range` occurs when `YEARLY` or `MONTHLY` intervals push `target_year > 9999`.
3. An unhandled `HTTP 500 SYSTEM_ERROR` is produced on `PATCH /api/v1/tasks/{id}/complete` when toggling completion of any task with such an RRULE.

### Actionable Mitigation for Worker
In `backend/app/services/task_service.py`:
1. Clamp `interval` to a safe domain upper bound in `_calculate_next_due_date`:
   ```python
   try:
       interval = max(1, min(10000, int(params.get("INTERVAL", 1))))
   except (ValueError, TypeError):
       interval = 1
   ```
2. Wrap the calculation block inside `_calculate_next_due_date` in a `try...except (ValueError, OverflowError)` block:
   ```python
   try:
       # existing date calculation logic
       ...
       return next_date
   except (ValueError, OverflowError):
       return None
   ```
   Returning `None` terminates the recurrence gracefully without throwing an exception or returning HTTP 500.

---

## 5. Verification Method

To independently reproduce the findings, execute the following commands in the workspace root:

1. **Run Full Adversarial Recurrence Test Suite**:
   ```bash
   docker exec web-template-backend-1 python tests/test_adversarial_recurrence.py
   ```
   *Expected Result*: Exits with code 3, displaying the 4 confirmed defects in Category 9.

2. **Verify Live HTTP 500 Crash via CLI**:
   ```bash
   docker exec web-template-backend-1 python -c "
   import httpx
   client = httpx.Client(base_url='http://localhost:8000/api/v1', timeout=10.0)
   login = client.post('/auth/login', data={'username': 'overflow_test@example.com', 'password': 'Password123!'})
   token = login.json()['access_token']
   headers = {'Authorization': f'Bearer {token}'}

   t = client.post('/tasks', headers=headers, json={'title': 'Overflow Crash', 'recurrence_rule': 'FREQ=DAILY;INTERVAL=999999999999999999999999999999999999999999'}).json()
   res = client.patch(f'/tasks/{t[\"id\"]}/complete', headers=headers, json={'is_completed': True})
   print('Status code:', res.status_code)
   print('Response:', res.text)
   assert res.status_code == 500, 'Expected HTTP 500'
   "
   ```
   *Expected Output*: `Status code: 500` with `SYSTEM_ERROR`.
