# BÁO CÁO KHẮC PHỤC CÁC VẤN ĐỀ REVIEW PHASE 3 & PHASE 4

**Dự án:** ZhongWenHub – Hệ thống học tiếng Trung thông minh tích hợp AI  
**Repository:** `nguyen2234/ZhongWenHub`  
**Nhánh làm việc:** `fix/ai-personalization-phase3-phase4` (tạo từ `feature/ai-personalization-phase4`)  
**Ngày thực hiện:** 16/11/2026  
**Trạng thái kiểm thử:** **100% PASS** (272 Unit Tests + 109 Integration Tests + 382 Frontend Tests + 0 Lint Errors + 0 Build Errors)

---

## 1. DANH SÁCH LỖI ĐƯỢC XÁC NHẬN

### Phase 3 – AI Error Analysis & Adaptive Exercises:
1. **Lỗi nộp bài đồng thời (Concurrency Race Condition):**
   - Chỉ phụ thuộc vào `SemaphoreSlim` in-memory. Khi có hai instance backend chạy song song hoặc bypass bộ nhớ in-process, hai request cùng nộp một bài tập sẽ ghi đè hai bản ghi vào `ai_exercise_attempts` do thiếu Unique Index cấp cơ sở dữ liệu.
   - Chưa có cơ chế phục hồi idempotent an toàn khi transaction commit thành công nhưng kết nối mạng bị ngắt trước khi client nhận phản hồi.
2. **Lỗi Cache phân tích lỗi sai (Error Analysis Cache Mixing):**
   - Cache phân tích lỗi `cachedErrorAnalysis` được lưu chung cấp bài tập (`exercise.MetadataJson`) mà không gắn với lần nộp (`attempt`) hoặc đáp án sai cụ thể (`userAnswer`).
   - Dẫn đến tình huống: Nếu học viên chọn đáp án sai B, hệ thống có thể trả về cache giải thích của đáp án sai A đã nộp trước đó.
   - Cache được đọc trước khi kiểm tra dữ liệu nộp thực tế từ database và chưa bảo toàn các metadata khác trong `MetadataJson`.

### Phase 4 – Personalized Learning Path:
3. **Lỗi làm giả kết quả học chính thức khi hoàn thành nhiệm vụ:**
   - Trong `CompleteTaskAsync`, khi người dùng tick hoàn thành nhiệm vụ loại bài học (`lesson`), service tự động ghi vào bảng kết quả chính thức: `StudentLessonProgress.Status = "COMPLETED"` và `QuizScore = 100`.
   - Vi phạm nghiêm trọng tính toàn vẹn dữ liệu: Nhiệm vụ kế hoạch ngày (`DailyLearningTask`) bị đồng nhất với tiến độ bài học chính thức (`StudentLessonProgress`), làm giả điểm thi 100 điểm khi chưa thực sự làm bài kiểm tra.
4. **Lỗi sinh lộ trình sai cấp HSK:**
   - Trong `GenerateLearningPathAsync`, khi không tìm thấy bài học cho cấp HSK mục tiêu (ví dụ HSK 5, HSK 6 chưa xuất bản bài), hệ thống tự động fallback lấy 15 bài học xuất bản bất kỳ (kể cả HSK 1, HSK 2) và gán vào lộ trình HSK mục tiêu.
   - Gây sai lệch sư phạm nghiêm trọng khi người học HSK 5 lại bị gán bài học HSK 1 mà không có thông báo thiếu dữ liệu.
5. **Lỗi mất nhiệm vụ hoặc tạo sai nhiệm vụ khi Replan:**
   - `SeedDailyTasksIfMissingAsync` kiểm tra `if (existingCount > 0) return;`. Khi học viên đã làm xong 1 nhiệm vụ và bấm "Điều chỉnh hôm nay" (Replan), hệ thống xóa các nhiệm vụ pending rồi gọi seed; vì đã có 1 nhiệm vụ completed (`existingCount > 0`), hàm return ngay lập tức khiến học viên bị mất toàn bộ nhiệm vụ còn lại trong ngày.
   - Khi chuyển sang lộ trình mới, các nhiệm vụ pending của lộ trình cũ vẫn tồn tại cho hôm nay và không được cập nhật theo HSK mục tiêu mới.
6. **Thiếu Migration chuẩn EF Core cho Phase 3 & Phase 4:**
   - Các bảng Phase 4 (`student_learning_goals`, `personalized_learning_paths`, `learning_path_milestones`, `daily_learning_tasks`) và Unique Index Phase 3 chưa được đóng gói thành EF Core Migration chính thức trong `Backend/src/Data/Persistence/Migrations/`.

---

## 2. NGUYÊN NHÂN & GIẢI PHÁP CHI TIẾT

| Mã vấn đề | Nguyên nhân gốc rễ | Giải pháp kỹ thuật đã áp dụng |
| :--- | :--- | :--- |
| **P3-1 (Race Condition)** | Thiếu Unique Constraint trên cặp `(UserId, AiExerciseId)`. `SemaphoreSlim` không có tác dụng đa tiến trình (distributed/multi-instance). | 1. Bổ sung Unique Index `idx_ai_exercise_attempts_user_exercise_unique` trên `ai_exercise_attempts`.<br>2. Bắt `DbUpdateException`, clear ChangeTracker và tự động reload attempt đã commit để trả về kết quả idempotent.<br>3. Kiểm tra retry bên trong `ExecutionStrategy` để chống duplicate khi đứt kết nối sau commit. |
| **P3-2 (Cache Mixing)** | Cache được lưu phẳng ở key `cachedErrorAnalysis`, không phân biệt `userAnswer` hoặc `attemptId`. | 1. Chuyển đổi cache thành dictionary đa khóa `cachedErrorAnalyses`: key theo `att_{attemptId}` và `ans_{normalizedAnswer}`.<br>2. Ưu tiên đọc `userAnswer` từ database thực tế, không tin tưởng payload client.<br>3. Khác đáp án tuyệt đối không dùng lại cache của đáp án trước.<br>4. Bảo toàn toàn bộ metadata cũ, bọc try-catch để lỗi ghi cache không làm fail phân tích. |
| **P4-1 (Fake Progress)** | Code tự thêm/cập nhật `StudentLessonProgress` với điểm 100 khi complete task. | 1. Xóa bỏ hoàn toàn việc can thiệp vào `StudentLessonProgress` trong `CompleteTaskAsync`.<br>2. `DailyLearningTask` chỉ cập nhật trạng thái `COMPLETED` của nhiệm vụ ngày.<br>3. Tiến độ bài học và điểm số quiz chỉ được ghi nhận bởi hệ thống học bài/chấm thi chính thức.<br>4. Tiến độ lộ trình chỉ đọc các bài học thực sự `COMPLETED` từ database. |
| **P4-2 (Wrong HSK)** | Fallback tự động lấy 15 bài học bất kỳ khi không có bài học của cấp mục tiêu. | 1. Xóa bỏ fallback tùy tiện.<br>2. Bắt buộc kiểm tra `l.Course.HskLevel == targetHsk`.<br>3. Nếu không có bài học cho cấp HSK mục tiêu, ném `InvalidOperationException` thông báo rõ ràng cho người dùng.<br>4. Tuyệt đối không sinh ResourceId hoặc link ảo. |
| **P4-3 (Replan Bug)** | Kiểm tra `existingCount > 0` ngăn cản việc tái phân bổ nhiệm vụ sau khi đã có bài hoàn thành. | 1. Xây dựng lại `SeedDailyTasksAsync` hỗ trợ `forceSeed: true` và `customAvailableMinutes`.<br>2. Tính toán quỹ thời gian còn lại: `budgetMinutes = targetDailyMinutes - alreadyCompletedMinutes`.<br>3. Kiểm tra các dạng nhiệm vụ và bài học đã làm hôm nay để không tạo lại nhiệm vụ trùng lặp.<br>4. Khi tạo lộ trình mới, dọn dẹp các pending task của lộ trình cũ và tạo task theo HSK mới, giữ nguyên bài đã xong. |
| **P4-4 (Migration)** | Chưa chạy `dotnet ef migrations add` cho schema mới. | Tạo migration chính thức: `20261115170022_AddAiPersonalizationPhase3And4.cs`. |

---

## 3. CÁC FILE ĐÃ SỬA

1. **`Backend/src/Data/Persistence/ApplicationDbContext.cs`:**
   - Cấu hình Unique Index `idx_ai_exercise_attempts_user_exercise_unique` trên `AiExerciseAttempt(UserId, AiExerciseId)`.
   - Cấu hình Unique Index `idx_student_learning_goals_user` trên `StudentLearningGoalEntity(UserId)`.
   - Cấu hình quan hệ và Foreign Key `LearningPathId` trên `DailyLearningTaskEntity`.
2. **`Backend/src/Data/Persistence/Migrations/20261115170022_AddAiPersonalizationPhase3And4.cs`:**
   - EF Core Migration chính thức tạo 4 bảng Phase 4, các foreign keys, indexes và unique index Phase 3.
3. **`Backend/src/Business/AILearning/AIExerciseService.cs`:**
   - Khắc phục lỗi nộp bài đồng thời: xử lý `DbUpdateException`, clear ChangeTracker, reload attempt idempotent, kiểm tra commit retry trong `ExecutionStrategy`.
4. **`Backend/src/Business/AILearning/AIErrorAnalysisService.cs`:**
   - Sửa cache phân tích lỗi theo attempt / normalized answer (`cachedErrorAnalyses`), ưu tiên dữ liệu DB, không tin tưởng đáp án đúng từ client, chống cache mixing giữa các đáp án khác nhau, bảo toàn metadata JSON.
5. **`Backend/src/Business/AILearning/Services/LearningPath/LearningPathService.cs`:**
   - Xóa bỏ việc ghi giả `StudentLessonProgress` và điểm 100 trong `CompleteTaskAsync`.
   - Loại bỏ fallback lấy bài sai cấp HSK trong `GenerateLearningPathAsync`. Ném `InvalidOperationException` nếu thiếu dữ liệu bài học.
   - Thiết kế lại cơ chế lập lịch ngày và `ReplanTodayAsync`: bảo toàn bài đã làm, tính toán thời lượng theo `budgetMinutes`, không tạo lại bài trùng, thay thế pending task cũ khi đổi lộ trình.
6. **`Backend/tests/ZhongWenHub.UnitTests/AIPhase3PersonalizationTests.cs`:**
   - Bổ sung kiểm thử nộp bài đồng thời từ hai `DbContext` độc lập và kiểm tra Unique Index cấp database.
   - Bổ sung kiểm thử cache phân tích lỗi phân biệt theo đáp án, không trả về cache của đáp án khác.
7. **`Backend/tests/ZhongWenHub.UnitTests/AIPhase4LearningPathTests.cs`:**
   - Bổ sung test xác minh `CompleteTaskAsync` không làm giả `StudentLessonProgress` và không gán điểm 100.
   - Bổ sung test xác minh `GenerateLearningPathAsync` từ chối cấp HSK không có bài học thay vì gán bài sai cấp.
   - Bổ sung test xác minh đổi lộ trình thay thế pending task và bảo toàn completed task.

---

## 4. MIGRATION ĐÃ TẠO

- **Tên Migration:** `20261115170022_AddAiPersonalizationPhase3And4`
- **Vị trí:** [20261115170022_AddAiPersonalizationPhase3And4.cs](file:///d:/ZhongWenHub/Backend/src/Data/Persistence/Migrations/20261115170022_AddAiPersonalizationPhase3And4.cs)
- **Nội dung DDL:**
  - `CREATE TABLE student_learning_goals` (UNIQUE trên `UserId`)
  - `CREATE TABLE personalized_learning_paths` (FK tới `student_learning_goals` và `users`)
  - `CREATE TABLE learning_path_milestones` (FK tới `personalized_learning_paths`)
  - `CREATE TABLE daily_learning_tasks` (FK tới `personalized_learning_paths` và `users`, Index trên `(UserId, PlanDate)`)
  - `CREATE UNIQUE INDEX idx_ai_exercise_attempts_user_exercise_unique ON ai_exercise_attempts(UserId, AiExerciseId)`
- **Kiểm thử Database:** Đã áp dụng và xác minh 100% thành công trên `ZhongWenHub_Test`. Tuân thủ nghiêm ngặt **Zero-Write** trên `ZhongWenHub_Dev`.

---

## 5. KẾT QUẢ KIỂM THỬ THỰC TẾ

```
1. Backend Unit Tests (ZhongWenHub.UnitTests.dll):
   Passed! - Failed: 0, Passed: 272, Skipped: 0, Total: 272 (net10.0)

2. Backend Integration Tests (ZhongWenHub.IntegrationTests.dll):
   Passed! - Failed: 0, Passed: 109, Skipped: 0, Total: 109 (net10.0)

3. Frontend Unit & Contract Tests (bun test):
   Passed! - Failed: 0, Passed: 382, Skipped: 0, Total: 382 across 49 files (4,734 assertions)

4. Frontend Static Analysis (bun run lint via oxlint):
   0 errors (153 warnings non-breaking)

5. Frontend Production Bundle (bun run build via tsc + vite):
   0 errors, built in 1.64s
```

---

## 6. CÁC VẤN ĐỀ CHƯA XỬ LÝ & TECHNICAL DEBT

- **Hạn chế dữ liệu HSK 5 & HSK 6:** Hiện tại cơ sở dữ liệu mới xuất bản đầy đủ giáo trình cho HSK 1 - 4 (15 bài HSK 1, 15 bài HSK 2, 20 bài HSK 3, 20 bài HSK 4). HSK 5 và HSK 6 chưa có bài học xuất bản nên hệ thống sẽ thông báo `Chưa có giáo trình xuất bản cho cấp độ HSK này` đúng theo thiết kế an toàn sư phạm mới.
- **Push Notification / Reminder:** Chưa có hệ thống Web Push Notification nhắc nhở học viên hoàn thành daily task; đây là tính năng phù hợp cho giai đoạn mở rộng tiếp theo.

---

## 7. COMMIT SHA & THÔNG TIN GIT

- **Branch:** `fix/ai-personalization-phase3-phase4`
- **Commit SHA:** Sẽ được tạo và đẩy lên remote ngay sau báo cáo này.
- **Cam kết:** Không merge vào `main`, không tự động triển khai Phase 5.

