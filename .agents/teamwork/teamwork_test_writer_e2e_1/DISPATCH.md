# Task: E2E Test Suite Creation & Infrastructure

## Role: teamwork_test_writer
## Working Directory: /home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_test_writer_e2e_1/

## Objective
Design and implement a comprehensive, requirements-driven, opaque-box E2E test suite for Planify covering all 50 features cataloged in `PROJECT.md § Feature Inventory` and benchmark expectations vs Google Calendar, Outlook Calendar, and Microsoft To Do.

## Inputs
- Authoritative user request: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/ORIGINAL_REQUEST.md`
- Master project specification: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/PROJECT.md`
- Existing backend test scripts: `/home/dainguyen1506/Documents/todo-list/backend/tests/`

## Requirements & Methodology
Derive test cases directly from user requirements and public interfaces (ports 3000 and 8000), NOT internal implementation design.
Follow the 4-tier test case methodology:
- **Tier 1 - Feature Coverage**: Happy-path tests for each of the core features in isolation (Calendar views, Quick create, Detailed modal, Recurrence, Custom lists, Task time-blocking, AI Agent tools, Theme, Reminders).
- **Tier 2 - Boundary & Corner Cases**: Limits, zero/empty inputs, month boundaries (Jan 31 -> Feb 28), leap year (Feb 29), multi-event collision clustering, scope `this` vs `following` vs `all`, timezone GMT+7 serialization.
- **Tier 3 - Cross-Feature Combinations**: Pairwise feature interactions (Task created via AI -> Time-blocked on calendar -> Checked complete on calendar -> Verifies next cycle spawned in To-Do).
- **Tier 4 - Real-World Application Workloads**: End-to-end user journeys (New user onboarding -> Setting up weekly routine -> AI schedule optimization -> Dark mode toggle -> Shift reschedule).

## Deliverables
1. Write executable E2E test runner script in `backend/tests/test_e2e_suite.py` that can be run directly inside `web-template-backend-1` via `python tests/test_e2e_suite.py`.
2. Generate `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/TEST_INFRA.md` following the template in `PROJECT.md`.
3. Publish `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/TEST_READY.md` once the test suite is implemented and ready.
4. Write handoff report in your working directory (`handoff.md`).

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-11-01T15:52:30Z
Your working directory is /home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_test_writer_e2e_1/.
You are teamwork_test_writer_e2e_1.
Read your instructions in /home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_test_writer_e2e_1/DISPATCH.md.
MANDATORY: Read /home/dainguyen1506/Documents/todo-list/.agents/teamwork/ORIGINAL_REQUEST.md before starting work.
Master project plan is at /home/dainguyen1506/Documents/todo-list/.agents/teamwork/PROJECT.md.

Design and create the comprehensive, requirements-driven 4-tier E2E test suite:
- Tier 1: Feature Coverage (>=5 test cases per feature across core features)
- Tier 2: Boundary & Corner Cases (limits, empty inputs, month boundaries, leap years, timezone offsets)
- Tier 3: Cross-Feature Combinations (pairwise interactions across Calendar, To-Do, AI Agent)
- Tier 4: Real-World Application Scenarios (end-to-end user workflows)

Deliverables:
1. Implement executable test script in backend/tests/test_e2e_suite.py (runnable via docker exec web-template-backend-1 python tests/test_e2e_suite.py).
2. Write /home/dainguyen1506/Documents/todo-list/.agents/teamwork/TEST_INFRA.md.
3. Write /home/dainguyen1506/Documents/todo-list/.agents/teamwork/TEST_READY.md when test suite is ready.
4. Write handoff.md in your working directory and message orchestrator when done.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

