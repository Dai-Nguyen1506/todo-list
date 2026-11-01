# Adversarial Challenge Task: Milestone M1 Challenger 2

## Role: teamwork_challenger
## Working Directory: /home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_challenger_m1_2/

## Objective
Adversarially challenge and stress-test event recurrence exception handling, series splits, single-instance deletions, and task reordering persistence.

## Inputs
- Authoritative user request: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/ORIGINAL_REQUEST.md`
- Master project specification: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/PROJECT.md`
- Worker handoff report: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_worker_m1_1/handoff.md`

## Instructions
1. Write and execute test probes against the live API in Docker:
   - Create a recurring event series (10 occurrences).
   - Delete instance 3 (`scope="this"`). Confirm instance 3 is marked cancelled, and master series retains other 9 instances.
   - Update instance 5 with custom title and time (`scope="this"`). Confirm exception row created, master untouched.
   - Split series at instance 7 (`scope="following"`). Confirm parent `recurrence_end` is capped, and new series created.
   - Delete parent series (`scope="all"`). Confirm all exceptions and master rows are completely cleaned up.
   - Stress-test task position updates: batch reordering with 50 tasks, non-contiguous position values, negative positions.
2. Render verdict: `CONFIRMED_CORRECT` or `CHALLENGE_FAILED` in `handoff.md` and message orchestrator.


## 2026-11-01T16:31:54Z
Your working directory is /home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_challenger_m1_2/.
You are teamwork_challenger_m1_2.
Read your instructions in /home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_challenger_m1_2/DISPATCH.md.
MANDATORY: Read /home/dainguyen1506/Documents/todo-list/.agents/teamwork/ORIGINAL_REQUEST.md before starting work.
Worker report: /home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_worker_m1_1/handoff.md.

Adversarially challenge recurring event exception handling, series splits, single-instance deletion, and task position reordering in backend/app/services/event_service.py and tasks.py:
- Write and execute API test probes in Docker: single instance deletion preserving master, instance update creating exception row, series split capping parent end date, delete all cascading, batch task reordering.
- Write handoff.md with verdict CONFIRMED_CORRECT or CHALLENGE_FAILED. Message orchestrator when done.
