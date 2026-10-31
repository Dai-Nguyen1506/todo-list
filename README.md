# 🌟 Planify - Ứng dụng Quản lý Thời gian & Công việc Toàn diện

> **Planify** kết hợp sức mạnh của **Google Calendar**, **Microsoft Outlook Calendar**, **Microsoft To Do** và **Trợ lý AI Agent thông minh** chạy trên mô hình `openai/gpt-oss-120b` (Groq API) với khả năng gọi 12 tools tự động.
> Giao diện frontend thuần **100% Vanilla HTML, CSS, JavaScript** không phụ thuộc framework, siêu nhẹ, hỗ trợ cả giao diện Sáng (Light) và Tối (Dark).

---

## 🎯 Tính năng nổi bật

### 1. 📅 Calendar Module (Lịch biểu chuyên nghiệp)
- **Đa dạng chế độ xem**:
  - **Day View**: Trục thời gian 24 giờ, khu vực all-day, hiển thị task đến hạn trong ngày, vạch đỏ chỉ báo thời gian hiện tại (`time-indicator`).
  - **Week View**: Lưới 7 ngày trực quan, phân chia theo từng khung giờ.
  - **Month View**: Ma trận ngày trong tháng, hiển thị sự kiện và badge `+N xem thêm`.
- **Mini Calendar**: Lịch nhỏ bên sidebar hỗ trợ duyệt nhanh giữa các tháng/ngày.
- **Sự kiện lặp lại (Recurring Events)**: Chuẩn hóa theo chuẩn RFC 5545 (RRULE), hỗ trợ lặp hàng ngày, hàng tuần, hàng tháng, hàng năm.
- **Tùy chỉnh lịch**: Quản lý nhiều bộ lịch độc lập (công việc, cá nhân, học tập...) với mã màu sắc riêng biệt và checkbox ẩn/hiện.
- **Phím tắt**: `D` (Day), `W` (Week), `M` (Month), `T` (Today), `N` (Tạo sự kiện mới).

### 2. ✅ To Do Module (Quản lý việc cần làm thông minh)
- **Smart Lists chuẩn Microsoft To Do**:
  - ☀️ **My Day**: Tập trung vào mục tiêu trong ngày, tự động làm mới mỗi sáng kèm nút 💡 **Gợi ý** thông minh.
  - ⭐ **Important**: Bộ lọc công việc ưu tiên gắn sao.
  - 📅 **Planned**: Phân nhóm trực quan theo tiến độ: Quá hạn (đỏ), Hôm nay (xanh), Ngày mai, Tuần này, Sau đó.
  - 📋 **All Tasks**: Tổng hợp toàn bộ công việc phân loại theo danh sách.
- **Custom Lists**: Tạo danh sách công việc tùy biến kèm icon emoji và bảng màu sắc.
- **Subtasks (Steps)**: Chia nhỏ công việc thành nhiều bước con với thanh tiến độ hoàn thành.
- **Recurrence Chaining**: Khi hoàn thành task lặp lại, hệ thống tự động sinh chu kỳ tiếp theo với các subtasks nguyên vẹn.
- **Kéo thả sắp xếp (Drag & Drop)**: Reorder thứ tự công việc dễ dàng.
- **Phím tắt**: `Space` (Toggle hoàn thành), `S` (Toggle quan trọng), `Delete` (Xóa task), `Esc` (Đóng chi tiết).

### 3. 🤖 AI Agent (Trợ lý thời gian thông minh)
- Tích hợp mô hình `openai/gpt-oss-120b` thông qua Groq API siêu tốc.
- **12 Tools tự động**:
  - Sự kiện: `create_event`, `get_events`, `update_event`, `delete_event`, `check_availability`.
  - Công việc: `create_task`, `get_tasks`, `update_task`, `complete_task`, `delete_task`, `add_task_step`.
  - Lời khuyên & Tổng quan: `get_day_summary`.
- **Guardrails nghiêm ngặt**: Chỉ hỗ trợ các vấn đề về quản lý thời gian, lịch trình, to-do list và lời khuyên sắp xếp năng suất; kiên quyết từ chối các câu hỏi ngoài phạm vi (toán học, code, trò chuyện phiếm).
- **Rate Limiting**: Giới hạn an toàn 30 tin nhắn/phút/user bằng Redis counter.
- **Lịch sử hội thoại**: Hỗ trợ lưu trữ nhiều cuộc hội thoại độc lập.

### 4. 🎨 Giao diện & Trải nghiệm người dùng (UX)
- Hỗ trợ đầy đủ **Light Mode** & **Dark Mode**, tự động đồng bộ theo tùy chọn người dùng và lưu trên DB/localStorage.
- 100% Vanilla JS, tối ưu tốc độ tải trang, không cồng kềnh, mượt mà trên cả máy tính và di động.

---

## 🏗️ Kiến trúc Công nghệ

- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0 (Async), Alembic, Pydantic v2.
- **Frontend**: Vanilla HTML5, CSS3 Variables, JavaScript ES Modules, Nginx Alpine container.
- **Database**: PostgreSQL 15 (Asyncpg).
- **Cache & Rate Limit**: Redis 7.
- **DevOps**: Docker, Docker Compose, Makefile.

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### 1. Yêu cầu hệ thống
- Đã cài đặt **Docker** và **Docker Compose**.

### 2. Cấu hình biến môi trường
Tạo file `.env` từ file mẫu:
```bash
cp .env.example .env
```
Cập nhật `AI_API_KEY` (Groq API Key) trong file `.env` để kích hoạt tính năng AI Agent.

### 3. Khởi động ứng dụng
Chạy lệnh:
```bash
docker compose up -d --build
```
Chạy migrations cơ sở dữ liệu:
```bash
docker compose exec backend alembic upgrade head
```

### 4. Truy cập ứng dụng
- **Web App (Frontend)**: [http://localhost:3000](http://localhost:3000)
- **API Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🧪 Kiểm thử Tự động (Automated Test Suites)

Tất cả các phase đều có bộ test tự động xác thực:
```bash
# Test Phase 1: REST API & DB CRUD
docker compose exec backend python tests/test_phase1_api.py

# Test Phase 4: To-Do Module & Recurring Tasks
docker compose exec backend python tests/test_phase4_todo.py

# Test Phase 5: AI Agent, Guardrails & Rate Limiting
docker compose exec backend python tests/test_phase5_ai.py

# Test Phase 6: Cross-Module Integration & Sync
docker compose exec backend python tests/test_phase6_cross_module.py
```
