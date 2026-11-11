# BÁO CÁO TRIỂN KHAI KHO ĐỀ THI (EXAM REPOSITORY)

**Task ID:** `ZWH-HSK1-PUBLISH-15-LESSONS-AND-EXAM-REPOSITORY`  
**Commit liên quan:** `a4a6574` (`feat(exams): implement exam repository management`)  
**Trạng thái:** `IMPLEMENTED` & `TESTED` (Database migration code đã tạo, **chưa apply** lên `ZhongWenHub_Test` do chưa có `USER_APPROVAL_TOKEN.signed`)

---

## 1. Thiết kế Database & EF Core Migration

Đã bổ sung các entity mới trong `Backend/src/Data/`:
- `ExamEntity` (`exams`): `Code` (unique index `idx_exams_code`), `Title`, `HskLevel` (HSK 2.0: 1–6), `ExamType` (`MOCK`, `PRACTICE`, `PLACEMENT`, `MIDTERM`, `FINAL`), `Description`, `Instructions`, `DurationMinutes`, `PassingScore`, `TotalPoints`, `Status` (`DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `ARCHIVED`), `IsDeleted`, `CreatedByUserId`, `UpdatedByUserId`, `ReviewedByUserId`, `ReviewedAt`, `ReviewNotes`.
- `ExamQuestionEntity` (`exam_questions`): FK tới `ExamEntity` (Cascade delete) và `ExerciseEntity` trong Ngân hàng câu hỏi (`OnDelete(DeleteBehavior.Restrict)`), `SectionName` (`Nghe hiểu`, `Đọc hiểu`, `Viết`), `OrderIndex`, `Points`.
- `StudentExamAttempt` (`student_exam_attempts`): lưu lịch sử làm bài của học viên gắn FK `Restrict` tới `ExamEntity` để bảo vệ dữ liệu thi cử.
- Đã cấu hình DbSet và Fluent API trong `ApplicationDbContext.cs` và tạo EF Core migration sạch tại `Backend/src/Data/Persistence/Migrations/20261111060000_AddExamRepositoryTables.cs` (chỉ tạo `exams`, `exam_questions`, `student_exam_attempts`).

---

## 2. Backend APIs & Bảo mật RBAC

- Business Service: `Backend/src/Business/Exams/IExamService.cs`, `ExamService.cs`, `ExamDtos.cs`, đăng ký DI tại `Backend/src/Business/DependencyInjection.cs`.
- Controller: `Backend/src/Api/Controllers/ExamsController.cs` (`/api/v1/exams`):
  - `GET /api/v1/exams` & `GET /api/v1/exams/{id}`: `[AllowAnonymous]`, tự động lọc `Status == "PUBLISHED"` nếu không phải `ADMIN`/`CONTENT_MANAGER`.
  - `GET /api/v1/exams/stats`, `POST /api/v1/exams`, `PUT /api/v1/exams/{id}`, `PUT /api/v1/exams/{id}/questions`, `POST /api/v1/exams/{id}/review`, `DELETE /api/v1/exams/{id}`: bảo vệ bằng `[Authorize(Policy = PolicyConstants.ContentManagementAccess)]`.
- Rule bảo vệ dữ liệu:
  - Chỉ chấp nhận HSK 2.0 cấp độ 1–6 (từ chối HSK 7–9 hoặc cấp độ không hợp lệ).
  - Workflow `DRAFT -> PENDING_REVIEW -> PUBLISHED` và `ARCHIVED`; cấm xuất bản đề có 0 câu hỏi; cấm người biên tập tự duyệt (Segregation of Duties: `UpdatedByUserId != currentUserId`).
  - `DeleteExamAsync` **chặn xóa vĩnh viễn** đề đã có `StudentExamAttempt` hoặc đang ở trạng thái `PUBLISHED`, yêu cầu chuyển sang `ARCHIVED`.
  - `ContentService.DeleteExerciseAsync` được gia cố để chặn xóa câu hỏi đang gắn trong `ExamQuestions`.

---

## 3. Frontend Content Manager UI (`Kho đề thi`)

- `Fontend/src/management/admin/content/pages/AdminExamRepositoryPage.tsx` (route `/management/content-manager/exams`):
  - Thống kê theo trạng thái, tìm kiếm theo mã/tên đề, lọc theo HSK 1–6, loại đề, trạng thái.
  - `ExamFormModal.tsx`: tạo / sửa đề thi, cấu hình thời gian làm bài, điểm đạt, mô tả, hướng dẫn.
  - `ExamQuestionsModal.tsx`: thêm/xóa/sắp xếp thứ tự câu hỏi liên kết trực tiếp Ngân hàng câu hỏi (`adminExerciseService.getAllAsync`), chỉnh phần thi và điểm từng câu.
  - `ExamPreviewModal.tsx`: xem trước cấu trúc đề thi và câu hỏi trước khi xuất bản.
- Frontend service & types: `exam-repository.service.ts`, `exam-repository.types.ts`.
