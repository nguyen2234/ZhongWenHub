# BÁO CÁO CƠ CHẾ BẢO VỆ DATABASE & QUY TRÌNH ROLLBACK
## DATABASE SAFETY GUARD & AUTOMATED ROLLBACK PROTOCOL

- **Dự án**: ZhongWenHub Data Engineering & Reliability
- **Cơ chế bảo vệ**: Hai tầng (Pre-Connection Check & Live Session Check)
- **Module mã nguồn**: `scripts/hsk30/db_safety_guard.py`
- **Bộ kiểm thử bảo vệ**: `scripts/hsk30/test_db_safety_guard.py` (3/3 Tests Passed)
- **Kịch bản nhập liệu & Rollback**: `scripts/hsk30/import_staging_to_test.py`

---

## 1. MỤC TIÊU BẢO VỆ TỐI THƯỢNG (ZERO-WRITE POLICY)

Theo quy định nghiêm ngặt của Phase 9.1C:
1. Cơ sở dữ liệu phát triển (`ZhongWenHub_Dev`) là **bất khả xâm phạm (Read-Only / SELECT only)**. Tuyệt đối không được thực hiện bất kỳ lệnh `INSERT`, `UPDATE`, `DELETE`, `ALTER` hoặc `DROP` nào trong giai đoạn staging và kiểm định.
2. Mọi hoạt động ghi thử nghiệm, kiểm tra ràng buộc khóa ngoại, đo đạc hiệu năng và kiểm thử tự động phải được cô lập hoàn toàn trên cơ sở dữ liệu kiểm thử (`ZhongWenHub_Test`).

---

## 2. CƠ CHẾ BẢO VỆ HAI TẦNG CỦA DATABASE SAFETY GUARD

### Tầng 1: Kiểm tra trước kết nối (Pre-Connection Inspection)
- Phân tích chuỗi kết nối (`connection string`) được truyền vào.
- Nếu chuỗi kết nối chứa từ khóa `ZhongWenHub_Dev` (không phân biệt hoa thường): Ngắt lệnh ngay lập tức trước khi thiết lập kết nối socket tới SQL Server, ném ngoại lệ:
  ```
  RuntimeError("PRE-CONNECTION REJECTED: Connection string targets 'ZhongWenHub_Dev'. Writing to Dev database is strictly forbidden.")
  ```

### Tầng 2: Kiểm tra phiên trực tiếp trên máy chủ (Live Session Enforcement)
- Ngay sau khi kết nối thành công, module thực hiện câu lệnh SQL trực tiếp:
  ```sql
  SELECT DB_NAME() AS CurrentDatabase, @@SERVERNAME AS ServerName
  ```
- Lấy tên database thực tế do chính máy chủ SQL Server trả về:
  - Nếu tên database thực tế là `ZhongWenHub_Dev`: Lập tức ngắt kết nối và dừng chương trình với mã lỗi an ninh:
    ```
    RuntimeError("FATAL SECURITY VIOLATION: Connected directly to protected Dev database 'ZhongWenHub_Dev'! Zero-write policy strictly enforced. Operation aborted.")
    ```
  - Chỉ cho phép tiếp tục nếu tên database thực tế chính xác là `ZhongWenHub_Test`.

### Kết quả Kiểm thử An ninh (`test_db_safety_guard.py`):
- `[TEST 1]` Kết nối hợp lệ tới `ZhongWenHub_Test`: **PASSED** (autocommit = False).
- `[TEST 2]` Chặn đứng chuỗi kết nối nhắm vào `ZhongWenHub_Dev`: **PASSED**.
- `[TEST 3]` Chặn đứng phiên truy vấn trực tiếp nếu phát hiện `DB_NAME() == 'ZhongWenHub_Dev'`: **PASSED**.

---

## 3. THIẾT KẾ QUY TRÌNH NHẬP LIỆU & HOÀN NGUYÊN (ROLLBACK READINESS)

Kịch bản `scripts/hsk30/import_staging_to_test.py` được thiết kế có thể vận hành ở 3 chế độ độc lập:

### Chế độ 1: Thử nghiệm không ghi (`--mode dry-run`)
- Khởi tạo giao dịch (transaction) trên `ZhongWenHub_Test`.
- Thực hiện cập nhật 291 ví dụ từ vựng, nạp 32 bài tập mới và nhúng 6 bài đọc hiểu.
- Cuối quy trình, gọi lệnh `conn.rollback()`: Cơ sở dữ liệu trở về trạng thái sạch 100%, không để lại bất kỳ dữ liệu rác nào.

### Chế độ 2: Cam kết tích hợp (`--mode commit`)
- Sau khi kiểm định dry-run không phát sinh lỗi ràng buộc khóa ngoại (foreign key) hoặc độ dài trường dữ liệu:
- Gọi lệnh `conn.commit()` để lưu dữ liệu vào `ZhongWenHub_Test` phục vụ kiểm thử tích hợp toàn diện.

### Chế độ 3: Hoàn nguyên tự động (`--mode rollback`)
- Khi cần đưa `ZhongWenHub_Test` trở lại trạng thái ban đầu:
- Xóa sạch 32 bài tập staging theo danh sách GUID cụ thể.
- Xóa bỏ trường nhúng `readingPassage` trong `lessons.DialogueJson` của 6 bài học liên quan.
- Xác nhận hoàn nguyên sạch sẽ thông qua giao dịch an toàn.
