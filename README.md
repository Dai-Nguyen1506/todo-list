# Web Template (FastAPI + React + PostgreSQL + Redis)

> 💡 **DÀNH CHO NGƯỜI MỚI**: Bạn thắc mắc dự án này đang có những công cụ gì, kiến trúc thư mục ra sao và tích hợp sẵn những tính năng nào? Hãy bấm xem ngay [📖 Thông Tin Chi Tiết Dự Án](docs/informations.md) để dễ dàng làm quen nhé!

Đây là mẫu dự án thiết kế web (Boilerplate) nhằm rút ngắn thời gian khởi tạo, cấu hình và xây dựng kiến trúc thư mục cho các ứng dụng Web hiện đại. Mẫu này tích hợp sẵn các công cụ mạnh mẽ và cấu hình Docker chuẩn để dễ dàng bắt đầu lập trình ngay lập tức.

## 🚀 Công nghệ sử dụng
- **Backend**: Python 3.11, FastAPI, SQLAlchemy, Alembic, Pydantic
- **Frontend**: React 18, Vite, TypeScript
- **Database**: PostgreSQL 15 (sử dụng asyncpg)
- **Cache / OTP**: Redis 7
- **Quản lý môi trường**: Docker & Docker Compose
- **Tiện ích**: Hỗ trợ Makefile giúp chạy lệnh nhanh chóng

## 📁 Cấu trúc thư mục
```text
web-template/
├── backend/            # Code Backend (FastAPI)
│   ├── app/            # Source code chính của Backend
│   ├── alembic/        # Quản lý Database Migrations
│   ├── tests/          # Unit tests
│   └── Dockerfile
├── frontend/           # Code Frontend (React + Vite)
│   ├── src/            # Source code chính của Frontend
│   └── Dockerfile
├── docker-compose.yml  # Cấu hình Docker để chạy toàn bộ môi trường Dev
├── Makefile            # Chứa các phím tắt (alias) thao tác hệ thống
└── .env.example        # File mẫu cấu hình biến môi trường
```

## ⚙️ Hướng dẫn cài đặt (Setup)

### 1. Chuẩn bị môi trường
Hãy đảm bảo máy tính của bạn đã cài đặt sẵn:
- **Docker** và **Docker Compose**
- **Git** (khuyên dùng)
- (Tùy chọn) `make` (Có sẵn trên Linux/Mac. Trên Windows, bạn có thể cài thông qua MSYS2, Chocolatey hoặc chạy trực tiếp lệnh `docker compose`).

### 2. Cấu hình biến môi trường
Mở Terminal tại thư mục gốc của dự án và tạo file `.env` từ file mẫu `.env.example`:
```bash
cp .env.example .env
```
*(Lưu ý: Mở file `.env` và cập nhật lại các thông tin như `ADMIN_EMAIL`, mật khẩu db, mật khẩu redis,... nếu cần thiết phù hợp với config mới của bạn).*

### 3. Khởi chạy dự án
Chạy lệnh sau để build và khởi động toàn bộ hệ thống (Frontend, Backend, DB, Redis):
```bash
make dev
```
*(Nếu bạn không có lệnh `make` trên Windows, hãy chạy: `docker compose up -d --build`)*

### 4. Truy cập ứng dụng
Sau khi hệ thống khởi chạy thành công:
- **Frontend (Web App):** http://127.0.0.1:3000
- **Backend API (Swagger UI):** http://127.0.0.1:8000/docs
- **Admin/Redoc:** http://127.0.0.1:8000/redoc

---

## 🛠 Các lệnh quản lý thường dùng (Makefile)

Dưới đây là một số lệnh hữu ích được định nghĩa sẵn trong `Makefile`:

- `make dev-down`: Tắt toàn bộ hệ thống.
- `make logs-backend`: Xem log của riêng Backend.
- `make logs-frontend`: Xem log của riêng Frontend.
- `make db-migrate msg="tên_migration"`: Tự động tạo file migration cho Database sau khi sửa models.
- `make db-upgrade`: Cập nhật cấu trúc (schema) Database lên phiên bản mới nhất.
- `make clean`: Dọn dẹp sạch sẽ toàn bộ project (bao gồm xoá cả Database volume của môi trường Dev, hãy cẩn thận!).