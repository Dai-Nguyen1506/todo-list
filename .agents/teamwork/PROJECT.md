# Project: Planify Production Audit, Benchmark & Full-Stack Implementation

## Architecture
Planify is a full-stack time management and productivity platform combining Calendar, To-Do task management, and an AI Scheduling Assistant.
- **Frontend**: 100% Vanilla HTML5, CSS3, and JavaScript (ES Modules). Single-Page Application (SPA) with native hash router (`router.js`) and pub/sub state store (`store.js`). Strictly 0 external UI libraries, frameworks, or bundlers. Hosted via Nginx on port 3000.
- **Backend**: Python 3.11 with FastAPI, async SQLAlchemy 2.0, AsyncPG, Pydantic v2 schemas, and Alembic migrations. Runs on port 8000.
- **Database & Cache**: PostgreSQL 15 on port 5432 (mapped to 15432 / 5432) and Redis 7 on port 6379 for rate limiting and session caching.
- **AI Agent**: Bounded productivity assistant utilizing Groq API (`openai/gpt-oss-120b`) with a 12-tool registry for natural language scheduling and task manipulation.
- **Testing & Quality**: Dual-track architecture with parallel E2E Testing Track (4 tiers: Category-Partition, Boundary Value, Pairwise Combinatorial, Real-World Scenarios) and Implementation Track ending with 100% E2E test pass + Tier 5 adversarial hardening.

## Code Layout
- Frontend (Vanilla JS):
  - `frontend/index.html`: Main HTML entry with Anti-FOUC script
  - `frontend/js/app.js`: Application bootstrap
  - `frontend/js/router.js`: SPA hash router with route guards
  - `frontend/js/store.js`: Central Pub/Sub event store
  - `frontend/js/api.js`: Fetch API client with auth and payload unwrapping
  - `frontend/js/calendar/`: Calendar views (Month, Week, Day, Agenda), event card, collision packing, drag-drop, rrule expander, task adapter
  - `frontend/js/todo/`: To-Do smart lists, task item, task detail panel, custom list manager, suggestions
  - `frontend/js/ai/`: AI chat drawer, message stream, tool execution badges
  - `frontend/js/components/`: Dropdown, Modal, Toast, GuideCard, ReminderNotifier, MiniCalendar
  - `frontend/css/`: Modular stylesheets and CSS variables for Light & Dark themes
- Backend (FastAPI async):
  - `backend/app/api/v1/endpoints/`: Route controllers (`auth`, `users`, `calendars`, `events`, `task_lists`, `tasks`, `task_steps`, `categories`, `ai_chat`, `dashboard`, `otp`)
  - `backend/app/models/`: SQLAlchemy models (`User`, `Calendar`, `Event`, `EventReminder`, `TaskList`, `Task`, `TaskStep`, `Category`, `AIConversation`, `AIMessage`)
  - `backend/app/services/`: Business logic (`event_service`, `task_service`, `calendar_service`, `task_list_service`, `ai_service`, `auth_service`, `user_service`)
  - `backend/app/crud/`: Async CRUD database operations
  - `backend/app/schemas/`: Pydantic schemas
  - `backend/tests/`: Integration test suites (`test_phase1_api.py`, `test_phase4_todo.py`, `test_phase5_ai.py`, `test_phase6_cross_module.py`, `test_audit_fixes.py`)
- Documentation:
  - `docs/00-tong-quan-du-an.md` through `docs/09_audit_and_bugfix_plan.md`
  - `docs/10-feature-parity-matrix.md` through `docs/13-production-operations-guide.md`

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Day View (24h Timeline) | Single-day 24h schedule with red current time indicator and collision column packing | M3 | survey (`docs/03` §2.1) |
| 2 | Week View (7 Days) | 7-day schedule grid with current day highlight, all-day bar, and side-by-side event packing | M3 | survey (`docs/03` §2.1) |
| 3 | Month View (Grid) | 7x5-6 grid with date cells, event badges, +N more popup modal, and today indicator | M3 | survey (`docs/03` §2.1) |
| 4 | Agenda / Schedule View | Chronological 30-day list view of all events and timed tasks grouped by date | M3 | survey (`docs/09` §15) |
| 5 | Mini-Calendar Widget | Compact month calendar in sidebar displaying day activity dots and instant view jumping | M3 | survey (`docs/03` §2.7) |
| 6 | Quick Event Creation | Single-click slot popover with prefilled start time and 1-hour duration | M3 | survey (`docs/03` §2.2) |
| 7 | Detailed Event Modal | Modal for title, times, all-day, location, color, reminders, calendar selection | M3 | survey (`docs/03` §2.3) |
| 8 | Custom Recurrence (RRULE) | RFC 5545 rules: DAILY, WEEKLY, MONTHLY, YEARLY, INTERVAL, BYDAY, COUNT, UNTIL | M1 | survey (`docs/03` §2.4) |
| 9 | Recurrence Exception Handling | Scope `this \| following \| all` updates and single-instance deletion without series erasure | M1 | survey (`docs/01` §2.3) |
| 10 | Cross-Week RRULE Expansion | Expands recurring parent events across all months/weeks without disappearance | M1 | survey (`docs/09` BUG-04) |
| 11 | Drag & Drop Move Event | Native HTML5 drag to change hour or date, snapping to 15-minute grid | M3 | survey (`docs/03` §2.6) |
| 12 | Drag & Drop Resize Event | Drag bottom card edge to resize duration in 15-minute increments | M3 | survey (`docs/03` §2.6) |
| 13 | Multiple Calendars | Create, update, toggle visibility, custom colors across user calendars | M1 | survey (`docs/01` §2.2) |
| 14 | Current Time Indicator | Real-time red clock line with pulse dot on Day/Week timeline updating every 60s | M3 | survey (`docs/03` §2.8) |
| 15 | Keyboard Shortcuts | Hotkeys (D, W, M, A, T, C, N, Esc, ?) with input/textarea suppression | M2 | survey (`docs/03` §3) |
| 16 | Tasks on Calendar | Display due-date tasks in all-day bar and timed tasks directly on hourly grid | M4 | survey (`docs/03` §2.9) |
| 17 | Unified Creation Modal | Time-slot modal with tabs for creating either Calendar Event or Time-Blocked Task | M3 | survey (`docs/09` BUG-05) |
| 18 | My Day Smart List | Daily focus list resetting every morning at 00:00 with suggestion drawer | M4 | survey (`docs/04` §3.1) |
| 19 | My Day Suggestions | Drawer suggesting Overdue, Today, Important, and Recent tasks for My Day | M4 | survey (`docs/04` §3.1) |
| 20 | Important Smart List | Filter tasks with `is_important=True` ordered by due date | M4 | survey (`docs/04` §3.1) |
| 21 | Planned Smart List | Tasks with due dates partitioned into Overdue, Today, Tomorrow, This Week, Later | M4 | survey (`docs/04` §3.1) |
| 22 | All Tasks Smart List | Grouped list of all active non-completed tasks under parent task list headers | M4 | survey (`docs/04` §3.1) |
| 23 | Completed Task Section | Collapsible accordion for completed tasks with strikethrough styling | M4 | survey (`docs/04` §3.9) |
| 24 | Custom List Management | Create custom lists with title, 10 palette colors, 12 emoji icons, and cascade delete | M1 | survey (`docs/04` §3.2) |
| 25 | Custom List Reordering | Drag reorder custom lists in sidebar with backend position persistence | M2 | survey (`docs/02` §6) |
| 26 | Quick Task Creation | Fast input bar at top of task lists with Enter-to-create | M4 | survey (`docs/04` §3.3) |
| 27 | Task Detail Panel | Slide-out panel for subtasks, due date, reminder, recurrence, time-blocking, notes | M4 | survey (`docs/04` §3.4) |
| 28 | Task Completion Animation | SVG circular checkmark animation, delayed strikethrough, and smooth section shift | M2 | survey (`docs/04` §3.3) |
| 29 | Subtask Steps Management | Ordered checklist within task with progress ratio ("2/4") and separate checkboxes | M1 | survey (`docs/01` §2.7) |
| 30 | Task Time-Blocking | `start_time`, `end_time`, `duration_minutes`, `is_all_day` scheduled into calendar | M1 | survey (`docs/09` BUG-05) |
| 31 | Recurring Task Auto-Generation | Completing recurring task generates next-cycle task with next due date and reset steps | M1 | survey (`docs/04` §3.7) |
| 32 | Move Task Between Lists | Reassign parent list_id from task detail panel or context menu | M1 | survey (`docs/04` §3.4) |
| 33 | Task Sort & Filter | Sort by Importance, Due Date, Alphabetical, Creation, or Manual; fix dropdown crash | M2 | survey (`docs/04` §3.8) |
| 34 | Background Reminder Engine | 30s polling engine with AudioContext chime, toast alerts, and Notification API | M2 | survey (`docs/09` BUG-16) |
| 35 | Groq Tool-Calling Agent | Vietnamese conversational agent with 12 tools for natural language scheduling | M4 | survey (`docs/05` §1-6) |
| 36 | AI Scope Guardrails | Strict system prompt bounds restricting AI to time management and productivity | M4 | survey (`docs/05` §3) |
| 37 | AI Event Management Tools | `create_event`, `update_event`, `delete_event`, `list_events` with recurrence parsing | M4 | survey (`docs/05` §4.1) |
| 38 | AI Task Management Tools | `create_task`, `update_task`, `complete_task`, `delete_task`, `list_tasks` with time-blocking | M4 | survey (`docs/05` §4.2) |
| 39 | AI Schedule Summary Tool | `get_schedule_summary` aggregating today's events, tasks, and proactive advice | M4 | survey (`docs/05` §4.3) |
| 40 | Multi-Conversation History | Conversation threads in `ai_conversations` and `ai_messages` with tool logging | M4 | survey (`docs/01` §2.9) |
| 41 | Redis Rate Limiting | 30 messages/minute rate limiting per user backed by Redis keys | M1 | survey (`docs/05` §11) |
| 42 | AI Cross-Module Sync | Tool execution dispatches reactive events triggering calendar and to-do updates | M4 | survey (`docs/09` BUG-17) |
| 43 | Landing Page & Route Guard | Public landing page; unauthenticated deep links redirect to login with saved target | M2 | survey (`docs/09` BUG-01) |
| 44 | User Guide Banner | Collapsible guide banner explaining mouse gestures, drag-drop, and shortcuts | M2 | survey (`docs/09` BUG-02) |
| 45 | Dark Mode & Anti-FOUC | 0ms `<head>` inline script reading `planify_theme` with two-way DB sync | M2 | survey (`docs/09` BUG-06) |
| 46 | Rich Layered Color Palette | Slate-Indigo sidebar (`#0F172A`), cool slate canvas (`#F1F5F9`), ambient gradients | M2 | survey (`docs/09` BUG-07) |
| 47 | Timezone Drift Protection | Date serialization preserving local +07:00 offset without 7-hour regression | M2 | survey (`docs/09` BUG-13) |
| 48 | Event Collision Packing | Algorithmic side-by-side column packing (`width: 100/N%`) for concurrent items | M3 | survey (`docs/09` BUG-15) |
| 49 | Default Data Lazy Seeding | Automatic lazy creation of default calendar and task list on initial login | M1 | survey (`docs/09` BUG-20) |
| 50 | Docker Health & CORS Middleware | `/health` healthcheck endpoint and CORS middleware configuration | M1 | survey (`docs/09` BUG-19) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend Core & Recurrence Engine | Fix month-end/leap-year date math overflow; implement robust RFC 5545 RRULE parser with INTERVAL, BYDAY, COUNT, UNTIL; fix recurring event exception handling (`original_start` anchor, `scope="this"` single-instance cancellation on delete, `scope="following"` series split); add task reordering persistence API; verify all 5 test suites pass. | none | DONE |
| M2 | Frontend Stability & Core Bugfixes | Fix fatal `TypeError` in `dropdown.js` on sort menu click; fix 7-hour timezone drift in `event-form.js` using `toLocalISOString()`; connect drag reorder to persist to backend; implement recurrence scope prompt modal (`this`, `following`, `all`) on recurring event update/delete. | M1 | DONE |
| M3 | Calendar UX Parity & Missing Views | Implement missing **Agenda / Schedule View** (`frontend/js/calendar/agenda-view.js`) with 30-day timeline and toolbar button; implement **Event Collision Column Packing** (`BUG-15`) in Week & Day views; implement native **Drag-and-Drop Move & Bottom Edge Resize**; implement **Unified Create Modal** (Event vs Time-Blocked Task). | M2 | DONE |
| M4 | Real-Time Sync & AI Agent Integration | Deduplicate recurring exceptions vs master occurrences in `rrule.js`; enhance Task-Calendar synchronization (`task-adapter.js`) with completion toggle and time updates; verify AI Agent natural language prompt parsing for recurring tasks/events and reactive event dispatch (`planify:data-changed`). | M1, M3 | DONE |
| M5 | Final E2E Test Suite Pass & Adversarial Hardening | Phase 1: Verify 100% pass rate against E2E test suite (Tiers 1-4) published by E2E Testing Track. Phase 2: Adversarial coverage hardening (Tier 5) with Challenger -> Worker -> Reviewer cycle. | M1, M2, M3, M4, TEST_READY | IN_PROGRESS |
| M6 | Comprehensive Project Documentation | Write exhaustive documentation in `docs/`: `10-feature-parity-matrix.md` (Google Calendar, Outlook, MS To Do benchmark), `11-ux-interaction-flow-enhancements.md`, `12-defect-inventory-and-rca.md` (root causes and fixes for BUG-01..20), `13-production-operations-guide.md`, and update `README.md`. | M1, M2, M3, M4, M5 | PLANNED |

## Parallel Track: E2E Testing Track
- **Owner**: E2E Testing Orchestrator (`sub_orch_e2e_testing`)
- **Scope**: Requirements-driven, opaque-box 4-tier test suite covering:
  - Tier 1: Feature Coverage (>=5 test cases per feature across 50 features)
  - Tier 2: Boundary & Corner Cases (>=5 per feature)
  - Tier 3: Cross-Feature Combinations (pairwise interactions)
  - Tier 4: Real-World Application Workloads
- **Deliverable**: `TEST_INFRA.md` and `TEST_READY.md`.

## Interface Contracts

### Backend Recurrence Contract (`backend/app/services/task_service.py`)
- `_calculate_next_due_date(current_due: Optional[date], rrule_str: str) -> date`:
  - Input: Current due date (or today), RFC 5545 RRULE string.
  - Clamping: When incrementing months (e.g. Jan 31 -> Feb), must clamp day to the maximum days in the target month (28 or 29 for Feb, 30 for Apr/Jun/Sep/Nov) using `calendar.monthrange(year, month)[1]`.
  - Leap year: Feb 29 + 1 year -> Feb 28.
  - Returns: Next valid date without raising `ValueError`.

### Event Scope Update & Delete Contract (`backend/app/services/event_service.py`)
- `update_event(db, event_id, user_id, event_in, scope="this") -> Event`:
  - `scope="this"`: Creates an exception event row (`parent_event_id=event_id`, `is_exception=True`, `original_start=event_in.original_start`). Master series remains untouched.
  - `scope="following"`: Sets `recurrence_end=event_in.original_start - timedelta(seconds=1)` on parent series; creates new recurring series starting at `event_in.start_at`.
  - `scope="all"`: Updates master event directly.
- `delete_event(db, event_id, user_id, scope="this", occurrence_date=None) -> None`:
  - `scope="this"`: Inserts a cancelled exception (`is_cancelled=True`, `parent_event_id=event_id`, `original_start=occurrence_date`). Does NOT delete master row.
  - `scope="following"`: Sets `recurrence_end=occurrence_date - timedelta(seconds=1)`.
  - `scope="all"`: Deletes master row and cascades to children.

### Dropdown Parameter Compatibility Contract (`frontend/js/components/dropdown.js`)
- `Dropdown.show({ triggerEl, anchorEl, items })`:
  - Accepts either `triggerEl` OR `anchorEl` interchangeably.
  - Executes item callback via either `item.onClick()` OR `item.action()` interchangeably.

### Timezone Serialization Contract (`frontend/js/calendar/event-form.js`)
- Datetime values submitted to backend must use `toLocalISOString(date)` from `frontend/js/utils/date.js`, formatted as `YYYY-MM-DDTHH:mm:ss`, avoiding unwanted UTC subtraction in GMT+7.
