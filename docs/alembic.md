# 🗄️ Hướng Dẫn Sử Dụng Alembic (Database Migration)

## 1. Giới Thiệu
**Alembic** là một công cụ giúp quản lý phiên bản cơ sở dữ liệu (Database Migration) dành riêng cho SQLAlchemy. 
Tương tự như cách Git theo dõi sự thay đổi của Code, Alembic giúp theo dõi và áp dụng sự thay đổi của cấu trúc Database (Schema). 

Thay vì phải tự viết câu lệnh SQL thủ công (như `CREATE TABLE`, `ALTER TABLE`), bạn chỉ cần định nghĩa các Models bằng Python, Alembic sẽ tự động so sánh Models với Database hiện tại để tạo ra các script SQL cập nhật.

---

## 2. Dự Án Này Đang Setup Alembic Như Thế Nào?

Để giúp người mới dễ dàng sử dụng, dự án đã được **cấu hình tự động hóa tối đa**:

1. **Auto-Upgrade khi khởi động**: 
   - File `backend/entrypoint.sh` đã được cài cắm lệnh `alembic upgrade head`. 
   - Nghĩa là **mỗi khi bạn chạy `make dev` (hoặc `docker compose up`)**, hệ thống sẽ tự động kiểm tra xem có bản cập nhật Database nào mới không và tự động apply nó. Bạn hiếm khi phải chạy lệnh upgrade thủ công trừ khi đang code tính năng mới.

2. **Hỗ trợ Makefile**: 
   - Các lệnh phức tạp của Docker và Alembic đã được bọc lại bằng các lệnh gõ cực ngắn gọn trong `Makefile`.
   - Lệnh được thực thi trực tiếp bên trong Container của Backend.

3. **Cấu hình Async**: 
   - Dự án dùng `asyncpg` (PostgreSQL bất đồng bộ). Alembic trong dự án này đã được tinh chỉnh cấu hình (trong file `alembic/env.py` và `alembic.ini`) để hỗ trợ tốt việc đồng bộ bất đồng bộ (Async).

---

## 3. Workflow - Quy Trình Làm Việc Hàng Ngày

Khi bạn cần thêm bảng mới hoặc thêm/sửa cột trong Database, hãy làm theo đúng 4 bước sau:

### Bước 1: Code Model
Khai báo hoặc sửa đổi Models (SQLAlchemy) trong thư mục `backend/app/models/`.

### Bước 2: Đảm bảo Model đã được nhận diện
Để Alembic biết đến Model của bạn, Model đó phải được nạp (import) vào hệ thống `Base.metadata`. 
Hãy chắc chắn rằng bạn đã import Model của mình vào file `backend/alembic/env.py` (hoặc file gom chung như `backend/app/models/__init__.py`).

### Bước 3: Chạy lệnh phát sinh file Migration
Đảm bảo Docker đang chạy (`make dev`), sau đó mở một Terminal mới và gõ:
```bash
make db-migrate msg="Thêm bảng user và product"
```
*(Thay thế nội dung `msg` bằng mô tả về sự thay đổi của bạn).*

**Alembic sẽ làm gì?**
- Nó sẽ so sánh Models trong code và cấu trúc Database hiện tại.
- Nó sẽ sinh ra một file code python mới trong thư mục `backend/alembic/versions/` chứa các lệnh `upgrade()` (thêm) và `downgrade()` (lùi lại).

> ⚠️ **Lưu ý quan trọng**: Mặc dù Alembic rất thông minh (Auto-generate), nó không hoàn hảo 100%. Luôn luôn **mở file migration vừa được tạo ra để đọc lại** xem nó gen code có đúng ý bạn không (đặc biệt là khi đổi tên cột, xoá bảng).

### Bước 4: Cập nhật thay đổi vào Database
Để áp dụng file migration vừa sinh ra vào Database thật, bạn chạy lệnh:
```bash
make db-upgrade
```
*(Nếu bạn lười, việc khởi động lại Docker Compose bằng `make dev-refresh` cũng sẽ tự động làm bước này nhờ `entrypoint.sh`).*

---

## 4. Các Lỗi Thường Gặp (Troubleshooting)

- **Lỗi `Target database is not up to date`**: 
  Xảy ra khi bạn cố tạo migration mới (Bước 3) trong khi Database của bạn chưa được cập nhật các file migration cũ. 
  👉 **Cách sửa**: Chạy `make db-upgrade` trước, sau đó mới chạy lại `make db-migrate`.

- **Sửa sai code trong file Migration**: 
  Nếu bạn vừa `make db-migrate` sinh ra file mới tinh nhưng phát hiện file đó sinh sai và **bạn chưa chạy upgrade**: Hãy xoá phăng file đó đi và chạy lại lệnh `make db-migrate`.
  Nếu đã lỡ `upgrade` rồi thì phải dùng lệnh downgrade (khá phức tạp), hoặc trong môi trường Dev, nhanh nhất là:
  ```bash
  make clean 
  # Lệnh này sẽ xóa sạch Database Dev, hãy dùng khi chắc chắn muốn làm mới hoàn toàn!
  ```

- **Lỗi `make db-migrate` không sinh ra thay đổi nào (No changes in schema detected)**: 
  👉 **Cách sửa**: Kiểm tra lại xem ở Bước 2, bạn đã `import` Model mới tạo vào file mà Alembic quét (`alembic/env.py`) hay chưa. Mặc định nếu file `.py` chứa Model không được chạy lúc Alembic quét, nó sẽ coi như Model đó không tồn tại.
