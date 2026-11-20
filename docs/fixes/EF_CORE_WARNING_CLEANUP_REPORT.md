# EF CORE WARNING CLEANUP & DATABASE HEALTH REPORT

**Branch:** `feature/ai-personalization-phase5`  
**Date:** 2026-11-16  
**Status:** PASS (0 EF Core Warnings, Zero-Write Safety Enforced)

---

## 1. Danh sách 18 Warning EF Core (Event ID 10622)

Trong quá trình khởi tạo mô hình quan hệ của `ApplicationDbContext`, EF Core Model Validation đã phát ra chính xác 18 cảnh báo `Microsoft.EntityFrameworkCore.Model.Validation[10622]` (`PossibleIncorrectRequiredNavigationWithQueryFilterWarning`):

1. `AiConversationSession`
2. `AiGeneratedExercise`
3. `AiSpeakingAttempt`
4. `LearningSkillStatistic`
5. `QuestionBankPracticeSessionEntity`
6. `DailyLearningTaskEntity`
7. `PersonalizedLearningPathEntity`
8. `StudentDailyActivity`
9. `StudentExamAttempt`
10. `StudentLearningGoalEntity`
11. `StudentLearningProfile`
12. `StudentLessonProgress`
13. `StudentPracticeAttempt`
14. `StudentVocabularyProgress`
15. `StudentXpTransaction`
16. `UserSubscription`
17. `UserWallet`
18. `WalletTransaction`

---

## 2. Nguyên nhân gốc

- Thực thể principal `ApplicationUser` được cấu hình Global Query Filter cho cơ chế soft delete:
  ```csharp
  b.HasQueryFilter(u => !u.IsDeleted);
  ```
- Cả 18 thực thể con (dependent entities) đều có khóa ngoại `UserId` kiểu `Guid` (non-nullable).
- Theo convention của EF Core, khi một quan hệ có khóa ngoại non-nullable, navigation property trỏ tới principal (`User`) được ngầm định coi là **Required Navigation**.
- Khi một **Required Navigation** trỏ tới một thực thể có Global Query Filter, EF Core phát hiện nguy cơ bất nhất truy vấn:
  - Nếu truy vấn thực thể con **kèm theo navigation** (ví dụ `.Include(x => x.User)` hoặc truy cập thuộc tính con), EF Core sinh ra câu lệnh `INNER JOIN users`. Nếu user bị soft-delete (`IsDeleted == true`), `INNER JOIN` sẽ **âm thầm loại bỏ (drop)** toàn bộ bản ghi con đó.
  - Nhưng nếu truy vấn thực thể con **trực tiếp** (không join `users`), bản ghi con vẫn tồn tại và được trả về bình thường.
  - Nguy cơ đặc biệt nghiêm trọng với dữ liệu tài chính (`WalletTransaction`, `UserWallet`) và lịch sử học tập (`StudentPracticeAttempt`): khi user bị soft-deleted, các phép tính tổng số dư hệ thống, báo cáo doanh thu hay kiểm toán giao dịch có thể bị mất dữ liệu âm thầm nếu thực hiện join `users`.

---

## 3. Cách xử lý từng nhóm thực thể

Tuân thủ nghiêm ngặt các nguyên tắc nghiệp vụ của dự án:
- **KHÔNG** đổi kiểu `UserId` thành nullable trong database schema (giữ toàn vẹn ràng buộc `NOT NULL` và Foreign Key ở tầng SQL Server).
- **KHÔNG** xóa bỏ Global Query Filter của `ApplicationUser`.
- **KHÔNG** dùng `ConfigureWarnings(...Ignore(...))` để che giấu cảnh báo.
- **KHÔNG** dùng `IgnoreQueryFilters()` đại trà.

### Giải pháp áp dụng:
Cấu hình Navigation property là Optional ở tầng mô hình EF Core bằng Fluent API:
```csharp
b.Navigation(x => x.User).IsRequired(false);
```

### Phân tích hành vi theo từng nhóm:

| Nhóm thực thể | Các thực thể | Đánh giá nghiệp vụ & Hành vi sau khi sửa |
|---|---|---|
| **A. Tài chính & Giao dịch** | `UserWallet`, `WalletTransaction` | Khi user bị soft-delete, lịch sử dòng tiền và số dư ví phục vụ kiểm toán kế toán **không bị xóa hay ẩn âm thầm**. Khi join `User`, EF Core dùng `LEFT JOIN`; nếu user đã xóa, trường `User` là `null` nhưng giao dịch và số tiền vẫn hiển thị chính xác. |
| **B. Tiến độ & Lịch sử học tập** | `StudentLearningProfile`, `StudentLessonProgress`, `StudentPracticeAttempt`, `StudentDailyActivity`, `StudentVocabularyProgress`, `StudentXpTransaction`, `StudentExamAttempt`, `QuestionBankPracticeSessionEntity` | Bản ghi luyện tập, làm bài thi và điểm XP được bảo toàn. Các báo cáo phân tích độ khó câu hỏi, tỷ lệ đúng/sai toàn hệ thống không bị sai lệch khi một học viên xóa tài khoản. |
| **C. AI Learning Engine & Lộ trình** | `AiConversationSession`, `AiGeneratedExercise`, `AiSpeakingAttempt`, `LearningSkillStatistic`, `StudentLearningGoalEntity`, `PersonalizedLearningPathEntity`, `DailyLearningTaskEntity` | Các bài tập adaptive đã sinh, lịch sử hội thoại AI và thống kê năng lực duy trì tính toàn vẹn dữ liệu, truy vấn qua `LEFT JOIN` mượt mà, không drop bản ghi. |
| **D. Thuê bao người dùng** | `UserSubscription` | Thông tin gói đăng ký của tài khoản được giữ nguyên vẹn liên kết với user. |

---

## 4. File thay đổi

1. `Backend/src/Data/Persistence/ApplicationDbContext.cs`:
   - Bổ sung cấu hình `b.Navigation(...).IsRequired(false);` cho toàn bộ 18 thực thể.
2. `Backend/tests/ZhongWenHub.UnitTests/EfCoreModelValidationTests.cs`:
   - Test suite tự động bắt sự kiện `10622` trong `LogTo`.
   - Test case xác minh:
     * `ApplicationDbContext_ModelValidation_HasZeroWarning10622`: PASS (0 warnings).
     * `SoftDelete_ActiveUser_LoadsUserAndChildEntities`: PASS.
     * `SoftDelete_DeletedUser_PreservesChildDataAndNullsNavigationWithoutInnerJoinDrop`: PASS.
     * `All18Entities_CanBeQueriedWithOptionalNavigation`: PASS.

---

## 5. Migration mới nếu có

- **Không cần tạo migration mới.**
- Lệnh kiểm tra:
  ```bash
  dotnet ef migrations has-pending-model-changes --project Backend/src/Data --startup-project Backend/src/Api
  ```
- **Kết quả:** `No changes have been made to the model since the last migration.`
- Lý do: `Navigation.IsRequired(false)` chỉ thay đổi hành vi join trong execution pipeline của EF Core (chuyển `INNER JOIN` thành `LEFT JOIN` cho navigation). Ràng buộc `NOT NULL` và Foreign Key trên các cột `user_id` trong SQL Server hoàn toàn được giữ nguyên 100%.

---

## 6. Kết quả kiểm thử thực tế

1. **Model Validation Unit Tests:**
   - `EfCoreModelValidationTests`: 4/4 tests PASSED.
   - Số lượng warning 10622 ghi nhận: **0**.
2. **Toàn bộ Backend Unit Tests:**
   - Total: 289 tests.
   - Passed: **289**.
   - Failed: **0**.
3. **Toàn bộ Backend Integration Tests:**
   - Total: 109 tests.
   - Passed: **109**.
   - Failed: **0**.
   - Bao gồm: `SwaggerIntegrationTests` (4/4 PASS), `AdminUsersIntegrationTests`, `ContentIntegrationTests`, `LearningIntegrationTests`.
4. **Toàn bộ Frontend Tests:**
   - 388 tests across 50 files: **388 PASSED**, 0 failed.
5. **Frontend Build (`bun run build`):**
   - Succeeded with 0 errors.

---

## 7. Số lượng Warning trước và sau

| Loại cảnh báo | Trước khi sửa | Sau khi sửa |
|---|---|---|
| EF Core Warning 10622 (`PossibleIncorrectRequiredNavigationWithQueryFilterWarning`) | **18** | **0** |
| Build Errors (.NET) | 0 | 0 |
| Backend Unit Tests Failed | 0 | 0 |
| Backend Integration Tests Failed | 0 | 0 |

---

## 8. Những vấn đề về Database & Hướng dẫn cho Developer

### Tình trạng SQL Server Error 208 (`video_storage_cleanup_jobs`):
1. **Mã nguồn đã được bảo vệ (Resilient):**
   - `StorageCleanupService` đã được trang bị `CleanupTableMissingException` bắt chuẩn lỗi SQL `208`.
   - `VideoStorageCleanupWorker` ghi nhận cảnh báo **1 lần duy nhất**, tự động backoff 5 phút, không spam log, không crash ứng dụng.
2. **Database `ZhongWenHub_Dev` (Zero-Write Compliance):**
   - Do tuân thủ chính sách Zero-Write, agent không tự ý chạy DDL/migration lên database `ZhongWenHub_Dev`.
   - Developer có thể áp dụng 3 pending migrations lên môi trường dev local bằng lệnh:
     ```bash
     dotnet ef database update --project Backend/src/Data --startup-project Backend/src/Api -- --environment Development
     ```
   - 3 migration sẽ được áp dụng:
     - `20261113151257_AddVideoStorageOutboxAndUploadAssets` (Tạo bảng `video_storage_cleanup_jobs`)
     - `20261115170022_AddAiPersonalizationPhase3And4`
     - `20261115173345_AddAiPersonalizationPhase5Speaking`
