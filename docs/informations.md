# 📖 Thông Tin Chi Tiết Dự Án (Web Template)

Chào mừng bạn đến với Web Template! File này sẽ giải thích chi tiết dự án này **đã có sẵn những gì**, **sử dụng công cụ gì**, và **cấu trúc chi tiết** ra sao để bạn dễ dàng nắm bắt và phát triển tiếp.

## 🛠️ 1. Các Công Cụ & Công Nghệ Đã Tích Hợp

Dự án này là một boilerplate hoàn chỉnh, được tích hợp sẵn các công nghệ hiện đại nhất:

- **Backend (API)**:
  - **FastAPI**: Framework web siêu tốc độ để xây dựng API.
  - **SQLAlchemy (Async)**: ORM tương tác với Database bằng chế độ bất đồng bộ, giúp tăng hiệu suất.
  - **Alembic**: Công cụ tự động theo dõi và cập nhật thay đổi cấu trúc bảng (Database Migrations).
  - **Pydantic (v2)**: Validate dữ liệu đầu vào và quản lý cấu hình (biến môi trường).
  - **JWT (JSON Web Tokens)**: Cơ chế bảo mật thông dụng.

- **Frontend (Web App)**:
  - **React 18 & Vite**: Khởi tạo project frontend nhanh, load siêu mượt.
  - **TypeScript**: Giúp viết code chặt chẽ và bắt lỗi ngay trong lúc code.

- **Hạ tầng & Dữ liệu**:
  - **PostgreSQL 15**: Hệ quản trị CSDL quan hệ ổn định và mạnh mẽ.
  - **Redis 7**: Dùng để lưu trữ Cache hoặc xử lý OTP/Session siêu tốc.
  - **Docker & Docker Compose**: Đóng gói mọi thứ. Bạn không cần cài cắm phức tạp lên máy tính thật, chỉ cần Docker là chạy được tất cả (kể cả Database).

## 📂 2. Khám Phá Cấu Trúc Thư Mục

Dưới đây là kiến trúc chi tiết bên trong các thư mục chính:

### 🐍 Thư mục `backend/`
Đây là nơi chứa toàn bộ code xử lý logic API:
- `app/core/`: Chứa các cấu hình cốt lõi (config, database connect, logger, security JWT).
- `app/models/`: Định nghĩa các bảng trong Database (dùng SQLAlchemy).
- `app/schemas/`: Định nghĩa các kiểu dữ liệu vào/ra (Pydantic models) để validate thông số từ Client gửi lên.
- `app/api/`: Nơi định nghĩa các Routes/Endpoints (ví dụ: `/api/v1/users`).
- `app/helper/`: Chứa các hàm tiện ích dùng chung (ví dụ: mã hóa mật khẩu, gửi Email/OTP).
- `alembic/`: Cấu hình cho việc tracking thay đổi Database. Chi tiết xem tại file `docs/alembic.md`.
- `main.py`: Điểm đầu vào (entry point) của ứng dụng FastAPI. Nơi gộp tất cả routes lại.
- `entrypoint.sh`: Kịch bản tự động chạy trước khi start server (tự động chạy lệnh update database lên phiên bản mới nhất).

### ⚛️ Thư mục `frontend/`
Nơi chứa giao diện người dùng:
- `src/`: Nơi bạn viết các Components React, Hooks, Context, Pages...
- `Dockerfile`: File chứa kịch bản đóng gói Frontend.
- `vite.config.ts`: Cấu hình bộ build Vite. Điểm đáng lưu ý: đã được setup sẵn Proxy để tự động chuyển tiếp API gọi tới `/api` xuống Backend qua cổng nội bộ, nhờ vậy bạn không bao giờ lo bị lỗi CORS lúc code Dev.

### 🐳 Các file ở thư mục gốc (Root)
- `docker-compose.yml`: Kịch bản điều phối 4 container (Backend, Frontend, PostgreSQL, Redis) chạy cùng nhau và tự động thiết lập mạng nội bộ cho chúng giao tiếp.
- `Makefile`: Chứa các lệnh viết tắt (ví dụ gõ `make dev` sẽ tương đương với việc phải gõ lệnh Docker dài ngoằng).
- `.env`: File (được nhân bản từ `.env.example`) chứa tất cả các tham số cấu hình riêng tư (như mật khẩu DB, khóa bảo mật JWT).

## 💡 3. Các Tính Năng / Cơ Chế Đã Setup Sẵn
Ngay khi bạn khởi chạy (lệnh `make dev`), hệ thống đã sẵn sàng với:
1. **Môi trường cách ly (Isolated)**: Không lo xung đột thư viện hay máy này chạy được mà máy kia lại lỗi.
2. **Tự động nạp lại (Hot-Reload)**: Bạn sửa code ở Backend hay Frontend, ứng dụng sẽ tự khởi động/cập nhật ngay lập tức mà không cần bấm stop/start lại.
3. **Cấu trúc Database hoàn chỉnh**: Setup sẵn Session Async tối ưu hiệu năng kết nối tới PostgreSQL.
4. **Tự động hóa Migration**: Mỗi lần bật lên, nó tự đối chiếu xem có cập nhật bảng Database nào không để apply (nhờ `entrypoint.sh`).
5. **Cơ chế OTP/Email**: Trong `app/helper/otp.py` đã có sẵn logic gửi mã.

Bây giờ, bạn đã có một bộ khung vững chắc và sẵn sàng để lập trình thêm các API và giao diện mới rồi đấy! Chúc bạn code vui vẻ! 🎉
