# 🌟 Planify — Time Management, Scheduling & AI Productivity Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?style=flat-square&logo=redis)](https://redis.io)
[![Frontend](https://img.shields.io/badge/Frontend-100%25%20Vanilla%20JS-F7DF1E?style=flat-square&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Groq%20LPU%20(GPT--OSS--120B)-F55036?style=flat-square)](https://groq.com)
[![E2E Test Suite](https://img.shields.io/badge/E2E%20Tests-114%2F114%20Passing%20(100%25)-brightgreen?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)]()

> **Planify** unifies the scheduling capabilities of **Google Calendar** and **Outlook Calendar** with the task execution power of **Microsoft To Do** and an intelligent **Conversational AI Scheduling Agent** powered by Groq LPU hardware (`openai/gpt-oss-120b`).
>
> Built on a strict **100% Vanilla HTML5, CSS3, and JavaScript ES Modules** client architecture with **zero third-party UI libraries or bundlers**, paired with an asynchronous **Python 3.11 / FastAPI / PostgreSQL 15 / Redis 7** production backend.

---

## 🎯 Benchmark Parity & Competitive Advantage

| Feature Area | Google Calendar | Outlook Calendar | Microsoft To Do | Planify Advantage |
|---|:---:|:---:|:---:|---|
| **Multi-View Calendar** | Day, Week, Month, Schedule | Day, Week, Month, Work Week | ❌ (No Calendar) | **Unified Day, Week, Month, and 30-day Agenda views** with auto-scrolling to working hours (07:00). |
| **Task Time-Blocking** | 🟡 Isolated Sidebar | 🟡 Isolated Sidebar | ❌ Due date only | **First-class Time-Blocks directly on the 24h grid** with 15-minute drag-and-drop & bottom-edge duration resizing. |
| **Recurrence Handling** | RFC 5545 (This / All) | RFC 5545 (This / Series) | Basic daily/weekly | **Full RFC 5545 engine with 3-way Scope Modal (`this`, `following`, `all`)** and automated series splitting. |
| **Smart Lists & Tasks** | Basic checklist | To Do Integration | My Day, Important, Planned, All | **Full Microsoft To Do Smart Lists** with SVG completion animation and Web Audio API completion chimes. |
| **Conversational AI** | Gemini (Workspace add-on) | Copilot ($30/user/mo) | ❌ None | **Built-in Vietnamese Tool-Calling Agent (12 tools)** with under 600ms latency and real-time reactive sync. |
| **Client Overhead** | 5–15 MB bundle | 8–20 MB bundle | 4–10 MB bundle | **0 KB bundle overhead** (100% Vanilla JS ES Modules, `<1ms` Anti-FOUC, `<180ms` cold start). |

*For the complete 50-feature audit and benchmark matrix, consult [docs/10-feature-parity-matrix.md](docs/10-feature-parity-matrix.md).*

---

## 🏗️ System Architecture & Code Layout

```
planify/
├── backend/                             # Python 3.11 / FastAPI Async Service
│   ├── app/
│   │   ├── api/v1/endpoints/            # Controllers: auth, users, calendars, events, tasks, task_lists, ai_chat
│   │   ├── ai/                          # Groq Agent runtime, 12-tool registry, system prompt guardrails
│   │   ├── core/                        # Database sessions, Redis connection, exceptions, rate limiting
│   │   ├── crud/                        # High-performance async CRUD queries
│   │   ├── models/                      # SQLAlchemy 2.0 ORM models (Event, Task, User, etc.)
│   │   ├── schemas/                     # Pydantic v2 validation contracts
│   │   └── services/                    # Business logic: RFC 5545 recurrence, time-blocking, series splitting
│   ├── alembic/                         # Database schema migration revisions
│   └── tests/                           # 4-Tier E2E Suite, Tier 5 Adversarial Suite, Recurrence unit tests
├── frontend/                            # 100% Vanilla HTML5, CSS3 & JavaScript (SPA)
│   ├── index.html                       # Entry HTML with 0ms Anti-FOUC theme script
│   ├── nginx.conf                       # Production Nginx reverse-proxy configuration
│   ├── js/
│   │   ├── app.js                       # Bootstrap & global session initialization
│   │   ├── router.js                    # Native SPA hash router with route guards
│   │   ├── store.js                     # Central Pub/Sub state store
│   │   ├── api.js                       # Native Fetch HTTP client with unwrapping interceptor
│   │   ├── calendar/                    # DayView, WeekView, MonthView, AgendaView, RRule expander, Collision packing
│   │   ├── todo/                        # Smart lists (My Day, Important, Planned), custom lists, task detail panel
│   │   ├── ai/                          # Conversational chat drawer, message stream, tool execution badges
│   │   └── components/                  # Modal (stacked LIFO), Dropdown, Toast, GuideCard, ReminderNotifier
│   └── css/                             # Modular stylesheets and light/dark theme variables
├── docs/                                # Comprehensive project specifications (docs/00 through docs/13)
├── docker-compose.yml                   # Production container orchestration
└── README.md
```

---

## ⚡ Core Highlights & Capabilities

### 1. 📅 Calendar Scheduling & Missing Views Parity
- **Four Standard Views**: Day (24h timeline with red current time bar), Week (7-day grid with all-day banner), Month (7x6 matrix with `+N more` popover), and **Agenda View** (30-day chronological feed with inline completion).
- **Collision Packing (`BUG-15`)**: Algorithmic greedy interval packing calculates non-overlapping columns (`width: calc(100/N% - 4px)`), eliminating visual occlusion.
- **Direct Manipulation**: Native HTML5 drag-and-drop to reschedule; grab handle at card bottom edge to resize duration in 15-minute increments.
- **Unified Creation Modal**: Single dialog on timeslot click allowing creation of either a **Calendar Event** or a **Time-Blocked Task**.

### 2. ✅ Microsoft To Do Smart Lists & Task Management
- **Smart Lists**: *My Day* (daily focus list resetting at 00:00 with smart suggestions), *Important* (starred priorities), *Planned* (partitioned into Overdue, Today, Tomorrow, This Week, Later), and *All Tasks*.
- **Subtask Steps & Progress**: Unlimited subtask checklist with live counter (`"2/4 bước"`) on task cards.
- **Recurring Task Auto-Generation**: Completing a recurring task atomically calculates the next cycle's due date (with month-end and leap-year clamping) and resets subtasks.
- **Custom Lists**: Create lists with custom palette colors and emoji icons (📝, 🛒, 💼, 🏠...).

### 3. 🤖 Groq LLM Conversational Productivity Agent
- **Powered by Groq LPU Hardware**: Operates on `openai/gpt-oss-120b` with sub-600ms latency.
- **12 Tool Registry**: Autonomously invokes tools for creating, updating, rescheduling, and listing both events and time-blocked tasks in response to natural Vietnamese prompts.
- **Scope Guardrails**: Strictly bounded to time management and productivity; rejects trivia, coding, and general chatter.
- **Reactive State Sync (`planify:data-changed`)**: When the AI schedules or mutates an item, open Calendar and To-Do views update instantly without page refresh (F5).

---

## 🚀 Quickstart & Docker Deployment

### 1. Prerequisites
- [Docker](https://docs.docker.com/engine/install/) (v24.0+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.20+)

### 2. Clone and Configure
```bash
git clone https://github.com/dainguyen1506/todo-list.git
cd todo-list

# Create environment configuration
cp .env.example .env
```

Open `.env` and configure:
```ini
AI_API_KEY=your_groq_api_key_here
POSTGRES_PASSWORD=your_secure_db_password
SECRET_KEY=your_64_character_hex_jwt_secret
```

### 3. Build & Launch Containers
```bash
docker compose up -d --build
```

### 4. Run Database Migrations
```bash
docker compose exec backend alembic upgrade head
```

### 5. Access Application
- **Planify Web App (Frontend)**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Interactive Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Healthcheck Probe**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🧪 Comprehensive Automated Test Suites

Planify includes a dual-track verification architecture spanning unit tests, 4-tier opaque-box E2E tests, browser CDP automation, and Tier 5 adversarial hardening:

```bash
# 1. Authoritative 4-Tier E2E Test Suite (89 test cases - 100% pass)
docker compose exec backend python tests/test_e2e_suite.py

# 2. Tier 5 White-Box Adversarial Hardening Suite (25 stress tests - 100% pass)
docker compose exec backend python tests/test_tier5_adversarial_hardening.py

# 3. Recurrence Unit & Integration Fixes Suite
docker compose exec backend python tests/test_recurrence_fixes.py

# 4. Phase-Specific Integration Suites
docker compose exec backend python tests/test_phase1_api.py
docker compose exec backend python tests/test_phase4_todo.py
docker compose exec backend python tests/test_phase5_ai.py
docker compose exec backend python tests/test_phase6_cross_module.py

# 5. Headless Chrome CDP Verification (Frontend UX & Interactions)
python3 tests/test_m2_verification.py
python3 tests/test_m3_verification.py
python3 tests/test_m4_verification.py
```

---

## 📚 Complete Project Documentation Index

| File | Title | Description |
|---|---|---|
| [docs/00-tong-quan-du-an.md](docs/00-tong-quan-du-an.md) | Tổng quan dự án | Original project charter, vision, and core requirements. |
| [docs/01-database-schema.md](docs/01-database-schema.md) | Thiết kế Cơ sở Dữ liệu | Relational schema specifications, indexes, and foreign keys. |
| [docs/02-api-design.md](docs/02-api-design.md) | Thiết kế RESTful API | API contracts, request/response models, and error codes. |
| [docs/03-calendar-features.md](docs/03-calendar-features.md) | Chi tiết Tính năng Calendar | Calendar visualization layouts, RRULE rules, and interactions. |
| [docs/04-todo-features.md](docs/04-todo-features.md) | Chi tiết Tính năng To-Do | Smart lists, subtasks, recurrence chaining, and reordering. |
| [docs/05-ai-agent-design.md](docs/05-ai-agent-design.md) | Thiết kế AI Agent & Tools | Groq integration, 12-tool registry, system prompt, and rate limits. |
| [docs/06-frontend-architecture.md](docs/06-frontend-architecture.md) | Kiến trúc Frontend Vanilla JS | SPA hash router, store pub/sub, DOM utilities, and CSS variables. |
| [docs/07-implementation-plan.md](docs/07-implementation-plan.md) | Kế hoạch Triển khai | Multi-phase development roadmap. |
| [docs/09_audit_and_bugfix_plan.md](docs/09_audit_and_bugfix_plan.md) | Kế hoạch Rà soát Lỗi | Initial 20-defect audit and resolution strategy. |
| **[docs/10-feature-parity-matrix.md](docs/10-feature-parity-matrix.md)** | **50-Feature Parity Matrix** | **Exhaustive benchmark matrix vs Google Calendar, Outlook, and MS To Do.** |
| **[docs/11-ux-interaction-flow-enhancements.md](docs/11-ux-interaction-flow-enhancements.md)** | **UX Interaction Flows** | **Agenda view, collision packing, D&D / duration resize, and reactive sync.** |
| **[docs/12-defect-inventory-and-rca.md](docs/12-defect-inventory-and-rca.md)** | **Defect Inventory & RCA** | **Complete catalog (BUG-01..20 + M1..M5) with root cause analyses and diffs.** |
| **[docs/13-production-operations-guide.md](docs/13-production-operations-guide.md)** | **Production Operations Guide** | **Docker architecture, env reference, health monitoring, zero-downtime, backup/restore.** |

---

## 📄 License
This project is licensed under the MIT License — see the LICENSE file for details.
