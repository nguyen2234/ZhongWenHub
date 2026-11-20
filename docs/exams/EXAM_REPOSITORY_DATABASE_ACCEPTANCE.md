# Exam Repository (`Kho đề thi`) Database & API Acceptance Report

## 1. EF Core Migration & SQL Server Schema
Verified migration [`20261111060000_AddExamRepositoryTables.cs`](file:///D:/ZhongWenHub/Backend/src/Data/Persistence/Migrations/20261111060000_AddExamRepositoryTables.cs) applied cleanly against `ZhongWenHub_Ephemeral_QA` and created all three tables with expected columns, indexes, and foreign-key constraints:

### Tables & Columns
- `exams`: `Id`, `Code`, `Title`, `HskLevel`, `ExamType`, `Description`, `Instructions`, `DurationMinutes`, `PassingScore`, `TotalPoints`, `Status`, `IsDeleted`, `CreatedByUserId`, `UpdatedByUserId`, `ReviewedByUserId`, `ReviewedAt`, `ReviewNotes`, `CreatedAt`, `UpdatedAt`
- `exam_questions`: `Id`, `ExamId`, `ExerciseId`, `SectionName`, `OrderIndex`, `Points`, `CreatedAt`, `UpdatedAt`
- `student_exam_attempts`: `Id`, `UserId`, `ExamId`, `Score`, `MaxScore`, `IsPassed`, `TimeSpentSeconds`, `AnswersJson`, `StartedAt`, `SubmittedAt`, `CreatedAt`, `UpdatedAt`

### Indexes & Foreign Keys Observed (`sys.indexes` & `sys.foreign_keys`)
- **Indexes:**
  - `exams`: `PK_exams` (`unique=True`), `idx_exams_code` (`unique=True`), `idx_exams_hsk_status` (`unique=False`)
  - `exam_questions`: `PK_exam_questions` (`unique=True`), `idx_exam_questions_exam_exercise` (`unique=True`), `idx_exam_questions_exam_order` (`unique=False`), `IX_exam_questions_ExerciseId` (`unique=False`)
  - `student_exam_attempts`: `PK_student_exam_attempts` (`unique=True`), `idx_student_exam_attempts_exam_user` (`unique=False`), `IX_student_exam_attempts_UserId` (`unique=False`)
- **Foreign Keys:**
  - `FK_exam_questions_exams_ExamId` -> `exams` (`CASCADE`)
  - `FK_exam_questions_exercises_ExerciseId` -> `exercises` (`NO_ACTION`)
  - `FK_student_exam_attempts_exams_ExamId` -> `exams` (`NO_ACTION`)
  - `FK_student_exam_attempts_users_UserId` -> `users` (`CASCADE`)

## 2. Backend Service, Endpoints & Deletion / SoD Guards
Implemented across [`ExamsController.cs`](file:///D:/ZhongWenHub/Backend/src/Api/Controllers/ExamsController.cs) and [`ExamService.cs`](file:///D:/ZhongWenHub/Backend/src/Business/Exams/ExamService.cs) and verified end-to-end against SQL Server (`ZhongWenHub_Ephemeral_QA`):
1. **CRUD + Question Bank Linking & Reordering:** Creating draft exams, linking Question Bank items, reordering questions, previewing, updating metadata, and computing scores persist in SQL Server across page reloads.
2. **Two-Person Review Workflow:** Submitting a draft (`PENDING_REVIEW`) by Content Manager blocks self-publishing (`400 BadRequest`), while Admin successfully transitions the exam to `PUBLISHED` and `ARCHIVED`.
3. **Published Exam Deletion Guard:** Deleting a `PUBLISHED` exam via UI (`ConfirmDialog`) or `DELETE /api/v1/exams/{id}` is rejected with `HTTP 400`.
4. **Student Attempt History Deletion Guard:** Deleting an `ARCHIVED` exam with an existing row in `student_exam_attempts` via `DELETE /api/v1/exams/{id}` returned `HTTP 400` (`{"message":"Không thể xóa vĩnh viễn đề thi đã có lịch sử làm bài của học viên. Vui lòng chuyển sang trạng thái ARCHIVED."}`).
5. **Draft Exam Deletion:** Draft exams without attempt history delete cleanly via UI `ConfirmDialog`.

## 3. Protected Environment Note
`ZhongWenHub_Test` and `ZhongWenHub_Dev` remain untouched (`ExamTables=0`) because `USER_APPROVAL_TOKEN.signed` was not present; migration `20261111060000_AddExamRepositoryTables` has not yet been applied to those protected instances.

