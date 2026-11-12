# DANH SÁCH LỖI VÀ TỒN ĐỌNG CẦN XỬ LÝ CHO PHASE 9.1B
## HSK1_PHASE91B_FIX_BACKLOG.md

**Dự án:** ZhongWenHub  
**Thời điểm lập:** 09/11/2026 (Sau kiểm toán Phase 9.1A)  
**Phân loại ưu tiên:** P0 (Blocker) | P1 (High) | P2 (Medium) | P3 (Low)  

---

## 1. TỔNG HỢP SỐ LƯỢNG ISSUES THEO MỨC ĐỘ ƯU TIÊN

- **P0 — BLOCKER (0 issues):** 0 lỗi. Không có lỗi sai kiến thức nghiêm trọng, không có bài học bị hỏng cấu trúc.
- **P1 — HIGH (3 issues):**
  - `ISSUE-P1-01`: 291/300 từ vựng thiếu câu ví dụ (`ExamplesJson`) trong cơ sở dữ liệu.
  - `ISSUE-P1-02`: Bảng `vocabularies` có trường `AudioUrl` là NULL (đang dựa vào TTS trình duyệt).
  - `ISSUE-P1-03`: Bảng `student_lesson_progress` có 13 bản ghi chứa `LessonId = 'les-1'` kiểu chuỗi cũ, gây lỗi chuyển đổi kiểu khi JOIN với `lessons.Id` (uniqueidentifier).
- **P2 — MEDIUM (3 issues):**
  - `ISSUE-P2-01`: Mật độ bài tập HSK 1 còn thấp (mỗi bài chỉ có 1–2 bài tập, tổng 28 bài). Cần bổ sung lên 60 bài (4 bài/lesson).
  - `ISSUE-P2-02`: Thiếu bài đọc đoạn văn dài độc lập (Reading Passage) ở bài tổng kết của mỗi Unit.
  - `ISSUE-P2-03`: Tiêu đề tiếng Việt của Bài 4 trong DB vẫn còn chữ "(Bản thảo)" cần được chuẩn hóa sạch sẽ trước khi xuất bản.
- **P3 — LOW (2 issues):**
  - `ISSUE-P3-01`: Trong `lesson-content.service.ts` còn sót logic fallback mock `les-8`.
  - `ISSUE-P3-02`: Thêm nhãn chứng chỉ HSK 1 ghi rõ: "HSK 1 Foundation (300 từ vựng cốt lõi)".

---

## 2. BẢNG BACKLOG CHI TIẾT

| IssueId | Priority | Unit | Lesson | ContentType | EntityId | Description | Evidence | ProposedFix | HumanReviewRequired |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| `ISSUE-P1-01` | **P1** | Tất cả | 1–15 | `Vocabulary` | `vocabularies` | 291/300 từ vựng thiếu `ExamplesJson` trong database | Query kiểm toán `ExamplesJson IS NULL` trả về 291 dòng | Biên soạn 291 câu ví dụ song ngữ ngắn gọn (5–8 chữ) và nạp qua script Phase 9.1B | Có |
| `ISSUE-P1-02` | **P1** | Tất cả | 1–15 | `Vocabulary` | `vocabularies` | `AudioUrl` trong `vocabularies` là NULL | Cột `AudioUrl` trống 300/300 dòng | Cấu hình liên kết audio hoặc chỉ định đường dẫn TTS chuẩn hóa giọng Bắc Kinh | Có |
| `ISSUE-P1-03` | **P1** | Unit 1 | Bài 1 | `StudentProgress` | `student_lesson_progress` | 13 bản ghi tiến độ chứa chuỗi 'les-1' không phải GUID, gây crash `0x8169` khi JOIN với `lessons.Id` | Database query `SELECT DISTINCT LessonId FROM student_lesson_progress` trả về `['les-1', 'aaaaaaaa-...']` | Chuẩn hóa ánh xạ hoặc xử lý an toàn bằng CAST trong tầng nghiệp vụ Backend | Có |
| `ISSUE-P2-01` | **P2** | Tất cả | 1–15 | `Exercise` | `exercises` | Mật độ bài tập hiện tại mỏng (1–2 bài/lesson, tổng 28 bài) | Bảng `exercises` chỉ có 28 bản ghi cho 15 bài | Biên soạn bổ sung 32 bài tập trắc nghiệm mới, nâng tổng số lên 60 bài (4 bài/lesson) | Có |
| `ISSUE-P2-02` | **P2** | Tất cả | 2,4,7,10,13,15 | `Reading` | `lessons` | Thiếu đoạn văn đọc hiểu độc lập (Paragraph Reading) | `DialogueJson` chỉ có các câu thoại ngắn A-B | Bổ sung đoạn văn đọc hiểu 20–30 chữ Hán tại các bài tổng kết của mỗi Unit | Có |
| `ISSUE-P2-03` | **P2** | Unit 2 | Bài 4 | `Lesson` | `AAAAAAAA-4444-...` | Tiêu đề tiếng Việt là "Thầy ấy là giáo viên tiếng Trung của tôi (Bản thảo)" | `TitleVi` trong DB có chữ "(Bản thảo)" | Bỏ chữ "(Bản thảo)", đổi thành "Thầy ấy là giáo viên tiếng Trung của tôi" | Không |
| `ISSUE-P3-01` | **P3** | N/A | N/A | `FrontendService` | `lesson-content.service.ts` | Logic fallback mock `les-8` còn sót trong frontend | Dòng 33–35 `lesson-content.service.ts` | Loại bỏ chuỗi fallback mock cứng | Không |
| `ISSUE-P3-02` | **P3** | N/A | N/A | `FrontendUI` | `CurriculumMap` | Cần nhãn hiển thị rõ "HSK 1 Foundation" để minh bạch học thuật | Đối chiếu Phase 9.0.1 Gap Analysis | Cập nhật nhãn khóa học trên giao diện Student Portal | Không |
