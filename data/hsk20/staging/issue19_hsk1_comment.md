## 🚀 [PHASE UPDATE] HSK 1 FULL-STACK LEARNING & CONTENT CRUD IMPLEMENTATION

- **Task ID:** `ZWH-HSK1-LEARNING-AND-CONTENT-CRUD`
- **Executor:** Antigravity (Senior Full-Stack & Independent QA Engineer)
- **Reviewer:** ChatGPT / Lead Architect
- **Branch:** `integration/zhongwenhub-sqlserver`
- **Commit SHA:** `58c48ab7fd065bbd742a5ba390330d2c5d58d17f`
- **PR #16 Status:** STRICTLY OPEN / DRAFT (No merge, no force-push)
- **Database Status:** 100% READ-ONLY (Dev untouched; Test locked at Approval Gate)

---

### 1. HOÀN THIỆN CÁC MỤC TIÊU CỐT LÕI HSK 1
1. **Xóa bỏ hoàn toàn Mock Fallback trong Runtime Học viên (Lỗi A):**
   - Đặt Backend API là nguồn dữ liệu chính thức duy nhất (`Single Source of Truth`).
   - Ưu tiên 100% từ vựng từ Backend API, không dùng `INITIAL_VOCABULARY_LIST` tĩnh khi API có dữ liệu.
   - Điểm ngữ pháp ánh xạ trực tiếp từ `detailDto.grammars`, không dùng `MOCK_GRAMMAR_POINTS`.
   - Lời thoại và bài nghe được giải mã trực tiếp từ `DialogueJson` và `ListeningJson` thật; không tạo lời thoại giả ("Người A / B") khi thiếu nội dung mà hiển thị khối Empty State trung thực.
2. **Xác minh Bền vững Aggregate CRUD (Lỗi B):**
   - Đảm bảo Backend nhận và lưu đầy đủ: `TitleZh`, `TitleVi`, `Pinyin`, `Summary`, `DurationMinutes`, `XpReward`, `DialogueJson`, `ListeningJson`, `LinkedVocabularyIds`, `LinkedGrammarPointIds`, `LinkedExerciseIds`.
   - Bảo vệ toàn vẹn: Phương thức `ContentService.DeleteLessonAsync` tự động kiểm tra `student_lesson_progress` và chặn đứng mọi thao tác xóa cứng bài học nếu học viên đã có tiến độ (HTTP 400 `CANNOT_DELETE_ACTIVE_LESSON`).
3. **Cấu trúc 15 Bài học HSK 1 Chuẩn hóa:**
   - Mở rộng `curriculumData.ts` từ 6 bài lên đầy đủ 15 bài theo 5 chủ đề sư phạm HSK 2.0 Standard Course.
   - Ánh xạ đầy đủ ID bài học thực tế từ SQL Server Express (`AAAAAAAA-1111-1111-1111-111111111111`...).
4. **Đối soát Nguồn DrKameleon HSK 1:**
   - Đối chiếu nhánh `wordlists/exclusive/old/1.json` (MIT License) với 150 từ vựng HSK 1: Đạt **150 / 150 trùng khớp 100% Chữ Hán**, không lệch mục nào.
5. **Nâng cấp Snapshot & Rollback Thực tế (Lỗi C):**
   - `snapshot_and_rollback.py` đã dump toàn bộ dữ liệu ở cấp độ từng bản ghi (2.022 từ vựng, 461 điểm ngữ pháp, 140 bài học) vào `pre_import_test_db_snapshot.json`.
   - Triển khai thành công cờ `--rollback` có giao dịch ACID, cho phép phục hồi từng dòng dữ liệu về trạng thái snapshot.

---

### 2. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG
- **Backend Unit Tests (.NET 10 xUnit):** **38 / 38 PASSED** (0 failed, 280 ms).
- **Frontend Unit Tests (Bun Test Suite):** **288 / 288 PASSED** (0 failed, 4,249 expect assertions across 30 files, 505 ms).
- **Data QA Suite:** **11 / 11 PASSED** (7 positive + 4 negative).
- **AI Bridge Protocols:** **25 / 25 files PASSED** schema validation.

---

### 3. TÀI LIỆU ĐÃ XUẤT BẢN TRONG `docs/hsk20/`
1. [`docs/hsk20/HSK1_END_TO_END_IMPLEMENTATION_REPORT.md`](docs/hsk20/HSK1_END_TO_END_IMPLEMENTATION_REPORT.md)
2. [`docs/hsk20/HSK1_CONTENT_SOURCE_AND_QA_REPORT.md`](docs/hsk20/HSK1_CONTENT_SOURCE_AND_QA_REPORT.md)
3. [`docs/hsk20/HSK1_STUDENT_LEARNING_E2E_REPORT.md`](docs/hsk20/HSK1_STUDENT_LEARNING_E2E_REPORT.md)
4. [`docs/hsk20/HSK1_ADMIN_CRUD_E2E_REPORT.md`](docs/hsk20/HSK1_ADMIN_CRUD_E2E_REPORT.md)
5. [`docs/hsk20/HSK1_DATABASE_APPROVAL_AND_ROLLBACK_PLAN.md`](docs/hsk20/HSK1_DATABASE_APPROVAL_AND_ROLLBACK_PLAN.md)

