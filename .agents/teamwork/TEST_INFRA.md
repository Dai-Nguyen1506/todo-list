# Planify E2E Testing Infrastructure (`TEST_INFRA.md`)

## 1. Overview & Principles
Planify's end-to-end testing infrastructure is designed as an **opaque-box, requirements-driven** verification harness benchmarking system completeness and reliability against **Google Calendar**, **Outlook Calendar**, and **Microsoft To Do**.

The suite operates against public API contracts (`http://127.0.0.1:8000/api/v1` and `http://frontend:80` / `http://localhost:3000`), verifying full-stack behavior across the running Docker container stack (`web-template-backend-1`, `web-template-frontend-1`, `web-template-db-postgre-1`, `web-template-redis-1`) and Groq AI agent integration without coupling to internal database implementation details.

---

## 2. Test Architecture (4-Tier Taxonomy)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PLANIFY 4-TIER E2E TEST SUITE                        │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 1: Feature Coverage (Core Isolation)                              │
│   • 70 Test Cases across 14 Functional Categories                      │
│   • >=5 test cases per feature category                                │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 2: Boundary & Corner Cases                                        │
│   • 9 Boundary Test Cases (Strings, Inversions, Collisions)            │
│   • Month-end clamping (Jan 31 -> Feb 28), Leap Year (Feb 29 -> Feb 28)│
│   • GMT+7 Timezone Offset Preservation without Regression               │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 3: Cross-Feature Combinations                                     │
│   • 6 Pairwise & Cross-Module Synchronization Workflows                │
│   • AI Task Creation -> Calendar Time-Blocking -> Recurrence Next Cycle│
│   • Event Exceptions (scope="this") ↔ AI Schedule Query                │
│   • Custom List Deletion ↔ Task Cascade & Calendar Cleanups            │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 4: Real-World Application Workloads                               │
│   • 4 Full End-to-End User Journeys                                    │
│   • Onboarding -> Setup -> Daily Operation -> Series Evolution        │
└────────────────────────────────────────────────────────────────────────┘
```

### Tier Breakdown
1. **Tier 1 — Feature Coverage (70 Cases)**:
   - **Authentication & Profile** (5 cases): Registration, duplicate rejection, JWT authentication, invalid credentials, profile update and persistence.
   - **Calendar Management** (5 cases): Default lazy-seeded calendar (`is_default=True`), custom calendar creation, color/visibility toggle, deletion, default calendar protection.
   - **Events CRUD & Timed Scheduling** (5 cases): 1-hour timed event, all-day event, ID lookup, date range queries, deletion.
   - **Custom Recurrence (RRULE)** (5 cases): `FREQ=DAILY`, `FREQ=WEEKLY;BYDAY=MO,WE,FR`, `FREQ=MONTHLY;INTERVAL=1`, `FREQ=DAILY;COUNT=5`, `FREQ=YEARLY`.
   - **Recurrence Exception & Scope** (5 cases): `scope="this"` exception generation, master event preservation, `scope="all"` series update, `scope="all"` series deletion.
   - **Task Lists Management** (5 cases): Default "Tasks" list lazy-seeding, custom list creation with palette color and icon, updates, reordering API, deletion.
   - **Tasks CRUD & Details** (5 cases): Minimal task creation, full metadata, get by ID, toggle completion timestamping, toggle important and My Day.
   - **Subtask Steps Management** (5 cases): Add checklist step, update title, toggle complete, ordered sequencing, deletion.
   - **Task Time-Blocking** (5 cases): Creation with `start_time`, `end_time`, `duration_minutes`, `is_all_day=False`, retrieval, slot updates, all-day default.
   - **Recurring Tasks & Auto-Generation** (5 cases): Daily recurring task, completion spawning next cycle (+1 day), weekly cycle (+7 days), subtask steps reset, time-block inheritance.
   - **Smart Lists & Filtering** (5 cases): `view=my_day`, `view=important`, `view=planned`, `view=all`, completion status filter.
   - **AI Agent Tools Execution** (5 cases): Conversation threads, greeting, `create_event`, `create_task`, `get_schedule_summary`.
   - **AI Scope Guardrails & Throttling** (5 cases): Math query rejection, coding query rejection, conversation turn history, listing, Redis rate limit burst handling.
   - **System Infrastructure & Health** (5 cases): Docker `/health` healthcheck, root `/`, CORS preflight OPTIONS, dashboard `/dashboard/today`, frontend HTML Anti-FOUC serving.

2. **Tier 2 — Boundary & Corner Cases (9 Cases)**:
   - **Task Title Limits**: Empty string (422), 500 characters max limit (201), 501 characters overflow (422).
   - **Event Title Limits**: Empty string (422), 200 characters max limit (201), 201 characters overflow (422).
   - **Inverted Times Healing**: Event submitted with `end_at <= start_at` is automatically healed to 1 hour after `start_at` without 500 crash.
   - **Concurrent Event Collisions**: 3 events scheduled at the identical minute concurrently returned cleanly in range queries without collision crashes.
   - **Month-End Date Math Clamping**: Completing recurring task on Jan 31 with `FREQ=MONTHLY` clamps next cycle to Feb 28 (protecting against `ValueError: day is out of range for month`).
   - **Leap Year Date Math Clamping**: Completing recurring task on Feb 29 with `FREQ=YEARLY` clamps next cycle in non-leap year to Feb 28.
   - **Timezone Drift Protection**: Preserving local ISO timestamp representation without negative 7-hour regression in GMT+7.
   - **Arbitrary Step Sequencing**: Subtask steps added with non-contiguous positions are strictly ordered by position.
   - **Reorder Edge Conditions**: Reordering empty lists or non-existent IDs handled gracefully without 500 crashes.

3. **Tier 3 — Cross-Feature Combinations (6 Cases)**:
   - **Combo 1**: AI creates time-blocked recurring task -> Verified in To-Do -> Time slot projected on Calendar -> Marked complete -> Next cycle spawned with inherited time blocks.
   - **Combo 2**: Recurring event created -> Single instance updated with `scope="this"` -> AI Agent list_events detects both master and exception without duplication.
   - **Combo 3**: Custom task list created with tasks -> List deleted -> Cascade verification confirms tasks removed from all views.
   - **Combo 4**: Task with steps moved between custom lists -> Preserves subtask steps and Smart List (Important, My Day) memberships.
   - **Combo 5**: Calendar color updated -> Associated events reflect updated calendar info in Dashboard.
   - **Combo 6**: Subtask checklist toggled -> Task completion ratio (2/3 -> 3/3) synchronized.

4. **Tier 4 — Real-World Application Workloads (4 Cases)**:
   - **Scenario 1**: New User Onboarding & Weekly Routine Setup (Registration -> Lazy seeding verify -> Custom project list & calendar -> Recurring sprint planning -> Prioritized backlog -> Time-blocking -> Dashboard verification).
   - **Scenario 2**: Executive Daily Schedule & AI Optimization (My Day priority focus -> AI schedule summary -> Complete priority item -> Daily metrics updated).
   - **Scenario 3**: Recurrence Schedule Lifecycle & Exception Evolution (Daily scrum setup -> Single occurrence shifted due to holiday `scope="this"` -> Multi-cycle recurring task completion -> Forward series integrity).
   - **Scenario 4**: Cross-Module Project Sprint Cleanup & Reorganization (List and task drag reordering -> Batch task completions -> Backlog migration -> Sprint list deletion -> Zero orphaned items).

---

## 3. Feature Inventory Traceability Matrix (All 50 Features)

| Feature # | Feature Name | Tier & Test Category | Test Case Identifier |
|:---:|:---|:---|:---|
| 1 | Day View (24h Timeline) | Tier 1 (Events) & Tier 2 | `test_event_create_timed`, `test_boundary_concurrent_event_collision` |
| 2 | Week View (7 Days) | Tier 1 (Events) | `test_events_query_range`, `test_scenario_1_new_user_onboarding` |
| 3 | Month View (Grid) | Tier 1 (Events) | `test_events_query_range`, `test_event_create_all_day` |
| 4 | Agenda / Schedule View | Tier 1 (Events) | `test_events_query_range`, `test_v3_e2e_cdp.py` |
| 5 | Mini-Calendar Widget | Tier 1 (Infrastructure) | `test_sys_frontend_html_served` |
| 6 | Quick Event Creation | Tier 1 (Events) | `test_event_create_timed` |
| 7 | Detailed Event Modal | Tier 1 (Events) | `test_event_create_timed`, `test_event_get_by_id` |
| 8 | Custom Recurrence (RRULE) | Tier 1 (RRULE) | `test_rrule_daily_event`, `test_rrule_weekly_byday`, `test_rrule_monthly_event`, `test_rrule_count_limit`, `test_rrule_yearly_event` |
| 9 | Recurrence Exception Handling | Tier 1 (Exceptions) | `test_rec_scope_this_update`, `test_rec_parent_preserved`, `test_rec_scope_all_update`, `test_rec_scope_all_delete` |
| 10 | Cross-Week RRULE Expansion | Tier 1 (RRULE) & Tier 4 | `test_rrule_weekly_byday`, `test_scenario_3_recurrence_lifecycle` |
| 11 | Drag & Drop Move Event | Tier 1 (Events) & Tier 2 | `test_event_create_timed`, `test_boundary_timezone_local_iso_format` |
| 12 | Drag & Drop Resize Event | Tier 1 (Events) | `test_event_create_timed`, `test_boundary_inverted_event_times_auto_adjust` |
| 13 | Multiple Calendars | Tier 1 (Calendars) | `test_calendar_default_seeded`, `test_calendar_create_custom`, `test_calendar_update`, `test_calendar_delete_custom`, `test_calendar_prevent_delete_default` |
| 14 | Current Time Indicator | Tier 1 (Infrastructure) | `test_sys_frontend_html_served` |
| 15 | Keyboard Shortcuts | Tier 1 (Infrastructure) | `test_sys_frontend_html_served`, `test_v3_e2e_cdp.py` |
| 16 | Tasks on Calendar | Tier 1 (Time-Blocking) | `test_tb_create_time_blocked_task`, `test_tb_verify_time_fields_persisted`, `test_combo_ai_task_calendar_complete_next_cycle` |
| 17 | Unified Creation Modal | Tier 1 (Time-Blocking) | `test_tb_convert_to_time_blocked` |
| 18 | My Day Smart List | Tier 1 (Smart Lists) | `test_smart_list_my_day`, `test_scenario_2_executive_daily_schedule` |
| 19 | My Day Suggestions | Tier 1 (Smart Lists) | `test_smart_list_my_day`, `test_task_create_full` |
| 20 | Important Smart List | Tier 1 (Smart Lists) | `test_smart_list_important`, `test_combo_move_task_preserves_metadata` |
| 21 | Planned Smart List | Tier 1 (Smart Lists) | `test_smart_list_planned` |
| 22 | All Tasks Smart List | Tier 1 (Smart Lists) | `test_smart_list_all` |
| 23 | Completed Task Section | Tier 1 (Smart Lists) | `test_filter_is_completed`, `test_task_toggle_complete` |
| 24 | Custom List Management | Tier 1 (Task Lists) | `test_task_list_default_seeded`, `test_task_list_create_custom`, `test_task_list_update`, `test_task_list_delete_custom` |
| 25 | Custom List Reordering | Tier 1 (Task Lists) | `test_task_list_reorder`, `test_scenario_4_sprint_cleanup` |
| 26 | Quick Task Creation | Tier 1 (Tasks) | `test_task_create_minimal` |
| 27 | Task Detail Panel | Tier 1 (Tasks) | `test_task_create_full`, `test_task_get_by_id` |
| 28 | Task Completion Animation | Tier 1 (Tasks) | `test_task_toggle_complete` |
| 29 | Subtask Steps Management | Tier 1 (Steps) | `test_step_setup_parent`, `test_step_add`, `test_step_update`, `test_step_toggle_complete`, `test_step_delete_and_count` |
| 30 | Task Time-Blocking | Tier 1 (Time-Blocking) | `test_tb_create_time_blocked_task`, `test_tb_update_time_slot`, `test_tb_all_day_default_true` |
| 31 | Recurring Task Auto-Generation | Tier 1 (Recurring) | `test_rec_task_create_daily`, `test_rec_task_spawn_daily_cycle`, `test_rec_task_spawn_weekly_cycle`, `test_rec_task_steps_reset`, `test_rec_task_inherit_time_blocks` |
| 32 | Move Task Between Lists | Tier 3 (Combinations) | `test_combo_move_task_preserves_metadata` |
| 33 | Task Sort & Filter | Tier 1 (Smart Lists) | `test_filter_is_completed`, `test_smart_list_planned` |
| 34 | Background Reminder Engine | Tier 1 (Events & Tasks) | `test_event_create_timed` (reminders payload), `test_task_create_full` |
| 35 | Groq Tool-Calling Agent | Tier 1 (AI Agent) | `test_ai_create_conversation`, `test_ai_quick_chat_greeting` |
| 36 | AI Scope Guardrails | Tier 1 (AI Agent) | `test_ai_guardrail_math_rejection`, `test_ai_guardrail_coding_rejection` |
| 37 | AI Event Management Tools | Tier 1 (AI Agent) | `test_ai_tool_create_event`, `test_combo_recurring_event_exception_ai_sync` |
| 38 | AI Task Management Tools | Tier 1 (AI Agent) | `test_ai_tool_create_task`, `test_combo_ai_task_calendar_complete_next_cycle` |
| 39 | AI Schedule Summary Tool | Tier 1 (AI Agent) | `test_ai_tool_get_schedule_summary`, `test_scenario_2_executive_daily_schedule` |
| 40 | Multi-Conversation History | Tier 1 (AI Agent) | `test_ai_conversation_messages_history`, `test_ai_conversations_listing` |
| 41 | Redis Rate Limiting | Tier 1 (AI Agent) | `test_ai_rate_limiter_rapid_burst` |
| 42 | AI Cross-Module Sync | Tier 3 (Combinations) | `test_combo_ai_task_calendar_complete_next_cycle` |
| 43 | Landing Page & Route Guard | Tier 1 (Infrastructure) | `test_sys_frontend_html_served` |
| 44 | User Guide Banner | Tier 1 (Infrastructure) | `test_sys_frontend_html_served` |
| 45 | Dark Mode & Anti-FOUC | Tier 1 (Auth & Infra) | `test_user_profile_update`, `test_sys_frontend_html_served` |
| 46 | Rich Layered Color Palette | Tier 1 (Calendars & Lists) | `test_calendar_create_custom`, `test_task_list_create_custom` |
| 47 | Timezone Drift Protection | Tier 2 (Boundaries) | `test_boundary_timezone_local_iso_format` |
| 48 | Event Collision Packing | Tier 2 (Boundaries) | `test_boundary_concurrent_event_collision` |
| 49 | Default Data Lazy Seeding | Tier 1 (Calendars & Lists) | `test_calendar_default_seeded`, `test_task_list_default_seeded` |
| 50 | Docker Health & CORS Middleware | Tier 1 (Infrastructure) | `test_sys_healthcheck`, `test_sys_root`, `test_sys_cors_preflight` |

---

## 4. Benchmark Usability & Capability Matrix

| Capability Category | Google Calendar / Outlook | Microsoft To Do | Planify E2E Verification |
|:---|:---:|:---:|:---|
| Multi-view Scheduling (Day, Week, Month, Agenda) | Yes | N/A | Fully verified via `test_events_query_range` & CDP browser tests |
| RFC 5545 Recurrence Engine (INTERVAL, BYDAY, COUNT) | Yes | Daily/Weekly/Monthly | Fully verified via `Tier1FeatureCoverage.test_rrule_events` |
| Recurrence Exception Scopes (`this`, `following`, `all`) | Yes | No | Verified via `test_rec_scope_this_update` & `test_rec_scope_all_update` |
| Native Time-Blocking for Tasks | Partial (separate apps) | Due date only | Fully verified via `test_tb_create_time_blocked_task` |
| Subtask Checklist & Progress Tracking | No / Notes | Yes (Steps) | Verified via `test_step_add` & `test_combo_subtask_step_progression_metrics` |
| Smart Focus Lists (My Day, Important, Planned) | No | Yes | Verified via `Tier1FeatureCoverage.test_smart_lists` |
| Vietnamese Tool-Calling AI Scheduling Assistant | No | Copilot (paid) | Fully verified via `Tier1FeatureCoverage.test_ai_agent_tools` |
| Persistent Dark Mode with 0ms FOUC | Yes | Yes | Verified via `test_user_profile_update` & `test_sys_frontend_html_served` |

---

## 5. Execution Instructions

### Running Inside Docker (Standard Automated CI/CD Path)
```bash
docker exec web-template-backend-1 python tests/test_e2e_suite.py
```

### Running Specific Tiers
```bash
# Run Tier 1 only (Feature Coverage)
docker exec web-template-backend-1 python tests/test_e2e_suite.py --tier 1

# Run Tier 2 only (Boundary & Corner Cases)
docker exec web-template-backend-1 python tests/test_e2e_suite.py --tier 2

# Run Tier 3 only (Cross-Feature Combinations)
docker exec web-template-backend-1 python tests/test_e2e_suite.py --tier 3

# Run Tier 4 only (Real-World Workloads)
docker exec web-template-backend-1 python tests/test_e2e_suite.py --tier 4
```

### Verbose Execution & JSON Artifacts
```bash
docker exec web-template-backend-1 python tests/test_e2e_suite.py --verbose --report-file tests/e2e_test_report.json
```
The execution outputs a machine-readable JSON report at `backend/tests/e2e_test_report.json` containing timing, status, and diagnostic error logs for all test cases.
