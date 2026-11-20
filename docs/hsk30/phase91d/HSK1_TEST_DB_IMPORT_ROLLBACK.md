# BÁO CÁO THỬ NGHIỆM PIPELINE IMPORT VÀ ROLLBACK TRÊN TEST DATABASE

**Dự án:** ZhongWenHub  
**Cơ sở dữ liệu thực nghiệm:** `ZhongWenHub_Test`  
**Script thực thi:** `scripts/hsk30/import_staging_to_test.py`  
**Bộ dữ liệu nguồn Staging:**
- `data/hsk30/staging/hsk1_vocabulary_examples.json` (291 câu ví dụ)
- `data/hsk30/staging/hsk1_exercises.json` (32 bài tập mới)
- `data/hsk30/staging/hsk1_reading_passages.json` (6 bài đọc hiểu)
- `data/hsk30/staging/hsk1_existing_exercise_fixes.json` (14 bài tập sửa lỗi)

---

## 1. MỤC TIÊU VÀ NGUYÊN TẮC AN TOÀN

Trước khi bất kỳ dữ liệu nào được phép triển khai vào môi trường Development hoặc Production, toàn bộ quy trình Import, Xác thực tính toàn vẹn và Rollback (thu hồi dữ liệu sạch sẽ) bắt buộc phải được kiểm nghiệm trên môi trường cơ sở dữ liệu thử nghiệm `ZhongWenHub_Test`.

**Nguyên tắc bảo vệ:**
1. Khóa an toàn `db_safety_guard.py` tự động ngắt kết nối nếu tên database không phải `ZhongWenHub_Test`.
2. Hỗ trợ 3 chế độ chạy độc lập: `--mode dry-run`, `--mode rollback`, `--mode commit`.
3. Tính toàn vẹn quan hệ khóa ngoại (Foreign Keys) được duy trì 100%, không sinh bản ghi mồ côi (orphaned rows).
4. Không làm ảnh hưởng hay xóa dữ liệu người dùng (`users`, `student_lesson_progress`, `user_vocab_states`).

---

## 2. KẾT QUẢ THỬ NGHIỆM 3 CHẾ ĐỘ

### A. Chế độ 1: Thử nghiệm không ghi dữ liệu (Dry-run Mode)
- **Lệnh thực hiện:** `python scripts/hsk30/import_staging_to_test.py --mode dry-run`
- **Kết quả:**
  + Kết nối an toàn được xác nhận: Database `ZhongWenHub_Test`.
  + Giả lập cập nhật 291 câu ví dụ từ vựng.
  + Giả lập chèn 32 bài tập mới.
  + Giả lập nhúng 6 bài đọc hiểu vào `DialogueJson`.
  + Giao dịch (Transaction) được `ROLLBACK` sạch sẽ, không ghi đè bất kỳ byte nào vào đĩa.

### B. Chế độ 2: Kiểm tra khả năng Rollback hoàn trả (Rollback Mode)
- **Lệnh thực hiện:** `python scripts/hsk30/import_staging_to_test.py --mode rollback`
- **Kết quả đo lường:**
  + Thu hồi chính xác 32 bài tập staging bằng danh sách ID cụ thể.
  + Làm sạch trường `readingPassage` khỏi `DialogueJson` trên 6 bài học liên quan.
  + Số lượng bài tập HSK 1 trong database trở về đúng: **28 bài tập** (snapshot ban đầu).
  + Toàn bộ dữ liệu người dùng và tiến độ học tập được giữ nguyên 100%.

### C. Chế độ 3: Nhập dữ liệu chính thức và xác nhận (Commit Mode)
- **Lệnh thực hiện:** `python scripts/hsk30/import_staging_to_test.py --mode commit`
- **Kết quả đo lường:**
  + Bước 1: Cập nhật thành công 291 câu ví dụ từ vựng vào trường `ExamplesJson` trong bảng `vocabularies`.
  + Bước 2: Chèn thành công 32 bài tập mới vào bảng `exercises`.
  + Bước 3: Nhúng thành công 6 bài đọc hiểu vào trường `DialogueJson` của các bài học:
    * Lesson 2: *你好，朋友！*
    * Lesson 4: *我的汉语老师*
    * Lesson 7: *星期天的一天*
    * Lesson 10: *去北京看朋友*
    * Lesson 13: *学校附近*
    * Lesson 15: *坐飞机来中国*
  + Số lượng bài tập HSK 1 trong database đạt đúng: **60 bài tập** (28 bài ban đầu + 32 bài staging).
  + Lệnh `apply_exercise_fixes_to_test.py` xác nhận: **14 bài tập placeholder đã được vá sạch, 0 placeholder còn lại**.

---

## 3. BẢNG ĐỐI CHIẾU SỐ LƯỢNG BẢN GHI (SNAPSHOT COMPARISON)

| Bảng dữ liệu | Trước Import (Snapshot) | Sau Rollback | Sau Commit hoàn thiện | Trạng thái bảo toàn |
| :--- | :---: | :---: | :---: | :---: |
| `courses` (HSK 1) | 1 | 1 | 1 | 100% Nguyên vẹn |
| `units` (HSK 1) | 6 | 6 | 6 | 100% Nguyên vẹn |
| `lessons` (HSK 1) | 15 | 15 | 15 | 100% Nguyên vẹn |
| `vocabularies` (HSK 1) | 300 (10 có ví dụ) | 300 | 300 (300 có ví dụ) | Nâng cao chất lượng |
| `grammar_points` (HSK 1) | 72 | 72 | 72 | 100% Nguyên vẹn |
| `exercises` (HSK 1) | 28 (14 lỗi placeholder) | 28 | **60 (0 lỗi placeholder)** | Hoàn thiện định ngạch |
| `student_lesson_progress` | 14 | 14 | 14 | 100% Nguyên vẹn |
| `users` | 208 | 208 | 208 | 100% Nguyên vẹn |

---

## 4. KẾT LUẬN

Pipeline Import và Rollback đã chứng minh được tính ổn định, độ tin cậy và khả năng kiểm soát giao dịch an toàn cao. Quy trình này đủ điều kiện kỹ thuật để áp dụng triển khai cho cơ sở dữ liệu `ZhongWenHub_Dev` ngay sau khi có sự chấp thuận của Hội đồng Thẩm định.
