# BÁO CÁO BẢO VỆ TIẾN ĐỘ HỌC VIÊN VÀ AN TOÀN DỮ LIỆU ĐỒNG THỜI (STUDENT PROGRESS & DATA CONCURRENCY REPORT)

> **Mục tiêu:** Đảm bảo quá trình nâng cấp học liệu HSK 2 không làm mất mát, sai lệch hoặc ghi đè tiến độ học tập của người dùng cũ.  
> **Phạm vi kiểm tra:** Bảng `student_lesson_progress`, `student_exercise_attempts`, cơ chế locking và tính đồng thời (concurrency).  

---

## 1. PHÂN TÍCH CẤU TRÚC BẢNG TIẾN ĐỘ (`student_lesson_progress`)

Trong cấu trúc cơ sở dữ liệu ZhongWenHub:
- Cột `LessonId` trong bảng `student_lesson_progress` mang kiểu dữ liệu `nvarchar(50)`.
- Giá trị lưu trữ bao gồm cả định dạng GUID chuỗi (như `afe42fe5-7d93-47a6-b77b-447dad1e36f6`) và định dạng mã mềm (như `les-1`, `les-hsk1-1`).
- **Phát hiện quan trọng:** Trong các câu lệnh SQL JOIN hoặc WHERE, nếu sử dụng ép kiểu trực tiếp `CAST(LessonId AS uniqueidentifier)` sẽ gây ra lỗi nghiêm trọng `Conversion failed when converting from a character string to uniqueidentifier` đối với các bản ghi lưu mã mềm.
- **Giải pháp xử lý:** Trong toàn bộ mã nguồn backend và script kiểm toán, chuyển sang sử dụng `TRY_CONVERT(uniqueidentifier, p.LessonId)` hoặc so sánh chuỗi tương thích `LOWER(p.LessonId) = LOWER(CAST(l.Id AS nvarchar(50)))`.

---

## 2. KẾT QUẢ KIỂM TOÁN TIẾN ĐỘ TRÊN DEV VÀ TEST

1. **Trên ZhongWenHub_Dev:**
   - Tổng cộng 14 bản ghi tiến độ học viên hiện có (thuộc về các bài học HSK 1 đã học).
   - Không có bản ghi tiến độ nào của các bài học HSK 2 do các bài học này đang ở trạng thái `DRAFT`.
   - Toàn bộ 14 bản ghi tiến độ HSK 1 được bảo toàn nguyên vẹn 100%, không bị ảnh hưởng.
2. **Trên ZhongWenHub_Test:**
   - Trong quá trình chạy Playwright E2E và bộ kiểm thử integration backend, các bản ghi tiến độ thử nghiệm được tạo và xác nhận tính lũy đẳng (Idempotency):
     - Không cộng trùng lặp XP khi một bài học được hoàn thành nhiều lần (`XP Idempotency & Reward Safety`).
     - Chuỗi ngày học liên tục (Streak) được bảo toàn và cập nhật chính xác theo múi giờ.
     - Dữ liệu lỗi học tập (Weak Knowledge Points) được ghi nhận chính xác theo các câu trả lời sai của bài tập.

---

## 3. KIỂM THỬ XUNG ĐỘT ĐỒNG THỜI (CONCURRENCY & IDEMPOTENCY)

- **Test Case Backend:** `Curriculum_QualityAudit_LegacyLessonPreserved` kiểm tra toàn vẹn cấu trúc 140 bài học và 35 units.
- **Test Case Frontend:** `Phase FE-3: Connected Learning Experience > 3. XP Idempotency & Reward Safety` xác nhận rằng khi học viên hoàn thành lại một bài học đã qua, hệ thống chỉ ghi nhận thời gian ôn tập mà không cộng dồn thêm XP gian lận.
- **Tính an toàn khi Rollback:** Khi script `import_hsk2_staging_to_test.py --mode rollback` được thực thi, chỉ các bài tập và dữ liệu học liệu HSK 2 được làm sạch; toàn bộ bảng người dùng, vai trò, ví tiền và tiến độ học tập của người dùng được giữ nguyên vẹn.
