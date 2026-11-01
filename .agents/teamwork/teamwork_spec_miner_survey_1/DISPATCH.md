# Survey Task: Specification & Benchmark Parity Miner

## Objective
Map the full specification and requirements space for Planify. Examine all existing documentation in `docs/` (`docs/00-tong-quan-du-an.md` through `docs/09_audit_and_bugfix_plan.md`) and map against the benchmark applications (Google Calendar, Outlook Calendar, Microsoft To Do). Extract all core features, parity expectations, UX workflows, and documented audit findings.

## Inputs
- Authoritative user request: `/home/dainguyen1506/Documents/todo-list/.agents/teamwork/ORIGINAL_REQUEST.md`
- Documentation directory: `/home/dainguyen1506/Documents/todo-list/docs/`

## Requirements
1. Read `ORIGINAL_REQUEST.md` first.
2. Investigate `docs/00` through `docs/09_audit_and_bugfix_plan.md`. Note what has been documented, planned, or audited.
3. Enumerate the benchmark capabilities of Google Calendar, Outlook Calendar, and Microsoft To Do across:
   - Calendar views (Month, Week, Day, Agenda/Schedule)
   - Event creation, recurrence patterns (daily, weekly, monthly, yearly, custom rules, exceptions, until/count)
   - To-Do lists, task properties (due dates, reminders, recurrence, subtasks, categories/priorities)
   - Two-way sync between To-Do tasks and Calendar scheduling
   - Natural language AI assistant workflows
4. Document all explicit constraints:
   - Frontend must strictly remain 100% Vanilla HTML, CSS, and JavaScript with SPA hash router and Store pub/sub. Zero external UI libraries or frameworks.
   - Running Docker container stack on ports 3000 (frontend) and 8000 (backend).
5. Produce a comprehensive report in your working directory (`handoff.md`). Include an exhaustive inventory of features, constraints, and dependencies for the orchestrator's `PROJECT.md § Feature Inventory`.

## 2026-11-01T15:41:26Z
Your working directory is /home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_spec_miner_survey_1/.
You are teamwork_spec_miner_survey_1.
Read your instructions in /home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_spec_miner_survey_1/DISPATCH.md.
MANDATORY: Read /home/dainguyen1506/Documents/todo-list/.agents/teamwork/ORIGINAL_REQUEST.md before starting work.

Your task is to thoroughly analyze docs/ (docs/00-tong-quan-du-an.md through docs/09_audit_and_bugfix_plan.md) and map the complete feature, UX, and parity requirements against Google Calendar, Outlook Calendar, and Microsoft To Do.
Extract:
1. Complete Feature Inventory with source references
2. Benchmark parity comparison metrics and gaps
3. All explicit constraints (e.g. 100% Vanilla JS/CSS/HTML for frontend, zero external client UI libraries)
4. Audit points and defect categories noted in docs/09_audit_and_bugfix_plan.md

Write your complete findings and feature inventory to /home/dainguyen1506/Documents/todo-list/.agents/teamwork/teamwork_spec_miner_survey_1/handoff.md.
When done, message orchestrator with a summary of completion and report path.
