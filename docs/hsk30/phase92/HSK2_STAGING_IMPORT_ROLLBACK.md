# BÁO CÁO ĐƯỜNG ỐNG NẠP DỮ LIỆU STAGING VÀ KIỂM ĐỊNH ROLLBACK HSK 2 (STAGING IMPORT & ROLLBACK REPORT)

> **Mục tiêu:** Thử nghiệm đường ống nạp dữ liệu từ các file staging JSON vào cơ sở dữ liệu `ZhongWenHub_Test`, kiểm tra cơ chế rollback giao dịch và tính lũy đẳng (idempotency).  
> **Nguyên tắc an toàn:** Chỉ kết nối và tác động lên `ZhongWenHub_Test`. Cơ sở dữ liệu `ZhongWenHub_Dev` là bất khả xâm phạm.  

---

## 1. THIẾT KẾ ĐƯỜNG ỐNG NẠP DỮ LIỆU (`import_hsk2_staging_to_test.py`)

Đường ống được xây dựng với cơ chế kiểm tra an toàn đa tầng thông qua `db_safety_guard.py`:
1. **Pre-flight Database Check:** Gọi lệnh `SELECT DB_NAME()`. Nếu tên database khác `ZhongWenHub_Test` hoặc server chứa từ khóa nhạy cảm mà không phải local instance được chỉ định, script lập tức throw Exception và hủy tiến trình.
2. **Dynamic Foreign Key Resolution:** Truy vấn ID thực tế của 15 bài học HSK 2 trên database đích dựa vào `l.OrderIndex` (1 đến 15), từ đó gán chính xác `LessonId` cho từ vựng, bài tập và bài đọc hiểu.
3. **Ba chế độ vận hành (Modes):**
   - `--mode dry-run`: Thực thi trọn vẹn toàn bộ các lệnh INSERT và UPDATE trong một transaction rồi chủ động gọi `ROLLBACK`. Không lưu lại bất kỳ dữ liệu nào.
   - `--mode commit`: Thực thi toàn bộ quá trình nạp và gọi `COMMIT` transaction.
   - `--mode rollback`: Xóa toàn bộ dữ liệu staging đã nạp (xóa bài tập staging, khôi phục `DialogueJson` nguyên trạng, xóa từ vựng staging) và gọi `COMMIT`.

---

## 2. KẾT QUẢ THỰC THI THỬ NGHIỆM ĐA CHẾ ĐỘ

### 2.1. Thử nghiệm Chế độ DRY-RUN
- Lệnh: `python scripts/hsk30/import_hsk2_staging_to_test.py --mode dry-run`
- **Kết quả:**
  - Nhận diện an toàn: `Database='ZhongWenHub_Test'`
  - Nạp thử nghiệm 200 từ vựng có ví dụ.
  - Nạp thử nghiệm 60 bài tập.
  - Nhúng thử nghiệm 5 bài đọc hiểu vào `DialogueJson`.
  - Transaction được rollback sạch sẽ.
  - Cơ sở dữ liệu không bị thay đổi.

### 2.2. Thử nghiệm Chế độ COMMIT lần 1
- Lệnh: `python scripts/hsk30/import_hsk2_staging_to_test.py --mode commit`
- **Kết quả:**
  - Nạp thành công 200 từ vựng (`vocabularies`).
  - Nạp thành công 60 bài tập (`exercises`).
  - Nhúng 5 bài đọc hiểu vào các bài học 3, 6, 9, 12, 15.
  - Gọi `conn.commit()` thành công.

### 2.3. Thử nghiệm Chế độ ROLLBACK
- Lệnh: `python scripts/hsk30/import_hsk2_staging_to_test.py --mode rollback`
- **Kết quả:**
  - Xóa chính xác 60 bài tập staging (`DELETE FROM exercises WHERE Id IN (...)`).
  - Làm sạch trường `readingPassage` trong `DialogueJson` của 5 bài học về trạng thái ban đầu.
  - Xóa 200 từ vựng staging đã nạp.
  - Số lượng bản ghi trên `ZhongWenHub_Test` trở về đúng trạng thái ban đầu:
    - Từ vựng HSK 2: 19 bản ghi (các từ test cũ).
    - Bài tập HSK 2: 30 bản ghi (các bài tập khung cũ).
    - Bài đọc hiểu: 0 bài.

### 2.4. Thử nghiệm Chế độ COMMIT lần 2 (Tính lũy đẳng)
- Lệnh: `python scripts/hsk30/import_hsk2_staging_to_test.py --mode commit`
- **Kết quả:**
  - Tái nạp hoàn chỉnh toàn bộ dữ liệu staging lên `ZhongWenHub_Test`.
  - Toàn bộ các chỉ số được xác nhận: 200 từ vựng đầy đủ ví dụ, 60 bài tập chất lượng cao, 5 bài đọc hiểu.

---

## 3. KIỂM ĐỊNH BẢO VỆ TUYỆT ĐỐI ZHONGWENHUB_DEV

Sau khi hoàn tất toàn bộ chu trình nạp và rollback trên `ZhongWenHub_Test`, truy vấn độc lập kiểm tra `ZhongWenHub_Dev` xác nhận:
- Users: 39 (không đổi)
- Courses: 6 (không đổi)
- Units: 35 (không đổi)
- Lessons: 140 (không đổi)
- HSK 2 Vocab: 200 (không đổi)
- HSK 2 Exercises: 30 (không đổi)
- **Tác động bẩn trên Dev DB: 0% (HOÀN TOÀN KHÔNG BỊ TÁC ĐỘNG)**.
