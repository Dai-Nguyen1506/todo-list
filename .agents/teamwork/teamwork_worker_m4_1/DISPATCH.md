# Dispatch: Worker 1 for Milestone M4 (Real-Time Sync & AI Agent Integration)

- **Agent**: `teamwork_worker_m4_1`
- **Role**: `implementer`, `qa`, `specialist`
- **Milestone**: M4: Real-Time Sync & AI Agent Integration
- **Working Directory**: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_worker_m4_1/`

## Context & Objectives
You are responsible for implementing real-time synchronization between To-Do tasks and Calendar, recurring event deduplication, and AI Agent end-to-end integration:

1. **Recurring Event Exception Deduplication (`frontend/js/calendar/rrule.js` or calendar view loaders)**:
   - When expanding a recurring master event series, check the list of child exceptions (`parent_event_id == master.id`).
   - If an exception exists for an `original_start` date:
     - If `is_cancelled === true`, suppress that occurrence completely (do not render ghost or duplicate).
     - If `is_exception === true && !is_cancelled`, render the modified exception event, but suppress the synthetic recurrence instance from the master expansion.
   - Verify that recurring events with exceptions display exactly once per timeslot.

2. **Bidirectional Task-Calendar Synchronization (`frontend/js/calendar/task-adapter.js`, `frontend/js/pages/calendar.js`, `frontend/js/pages/todo.js`)**:
   - When a task is toggled complete in Calendar (Agenda view, day view, or quick details), call `PATCH /tasks/{id}/complete` and update local task store.
   - When tasks or events are created/updated in either To-Do or Calendar or AI Assistant:
     - Dispatch `window.dispatchEvent(new CustomEvent('planify:data-changed', { detail: { source, action, type } }))`.
     - In `calendar.js` and `todo.js`, listen for `planify:data-changed` and reactively reload data without requiring a manual page refresh (F5).

3. **AI Agent Natural Language Recurring Plans & Real-Time Updates**:
   - Inspect backend AI assistant endpoints (`backend/app/api/v1/agent.py` or `assistant.py`) and tool implementations (`backend/app/services/ai/` or `tools/`).
   - Verify AI Agent can parse natural language prompts for recurring tasks and recurring events (e.g., "Lên lịch họp hàng tuần vào thứ Hai lúc 9h sáng", "Tạo việc định kỳ mỗi ngày").
   - Ensure the AI assistant frontend (`frontend/js/pages/ai-assistant.js` or component) dispatches `planify:data-changed` after AI tools execute mutations, so Calendar and To-Do update immediately.
   - Eliminate any unhandled exceptions in backend AI agent execution.

4. **Strict Constraint**:
   - 100% Vanilla HTML, CSS, JavaScript (no external libraries, bundlers, npm packages).
   - Use `toLocalISOString()` for datetime serialization.

## Mandatory Verification
- Verify 0 console errors via CDP in headless Chrome.
- Verify AI Agent generates and schedules recurring items via natural language prompt.
- Verify reactive synchronization: creating or completing an item in one view immediately updates the other view without browser refresh (F5).
- Run full backend 4-Tier E2E test suite in Docker (`docker exec web-template-backend-1 python tests/test_e2e_suite.py`) ensuring 89/89 tests pass.
- Author `tests/test_m4_verification.py` verifying all M4 capabilities.
- Write detailed handoff report in `handoff.md`.

## 2026-11-01T18:11:33Z
You are Worker 1 for Milestone M4: Real-Time Sync & AI Agent Integration.
Working directory: /home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_worker_m4_1/

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INSTRUCTIONS:
1. Read the authoritative user request at `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/ORIGINAL_REQUEST.md`.
2. Read the master project plan at `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/PROJECT.md`.
3. Read your task dispatch at `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_worker_m4_1/DISPATCH.md`.
4. Your objectives:
   - Deduplicate recurring event exceptions vs master occurrences in `frontend/js/calendar/rrule.js` or calendar view loaders (suppress cancelled tombstones; suppress master occurrences matching modified exceptions).
   - Bidirectional real-time / reactive sync: ensure `planify:data-changed` event is dispatched on any task/event mutation (in To-Do, Calendar, or AI Assistant) and that Calendar and To-Do listen and re-render without F5 page refresh.
   - AI Agent capability: verify AI Agent parses natural language prompts to create and schedule recurring tasks/events and that executed tool actions dispatch `planify:data-changed`.
   - Maintain 0 console errors and 100% Vanilla HTML, CSS, JavaScript (zero external libraries or bundlers).
5. Verification:
   - Author `tests/test_m4_verification.py` verifying reactive sync and AI recurring creation.
   - Run backend 4-Tier E2E test suite in Docker (`docker exec web-template-backend-1 python tests/test_e2e_suite.py`) to confirm 100% pass (89/89).
   - Write comprehensive handoff report in `handoff.md` and send a completion message to your orchestrator.

