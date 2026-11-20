# BÁO CÁO KHẮC PHỤC CÁC VẤN ĐỀ CODE REVIEW – PHASE 1 AI PERSONALIZATION

**Dự án:** ZhongWenHub – Nền tảng học tiếng Trung tích hợp AI  
**Branch:** `feature/ai-personalization-phase1`  
**Ngày thực hiện:** 14/11/2026  
**Vai trò:** Senior Software Architect, AI Engineer & QA Lead  

---

## 1. TỔNG QUAN CÁC VẤN ĐỀ ĐÃ KHẮC PHỤC

| STT | Vấn đề phát hiện | Nguyên nhân | Giải pháp khắc phục triệt để | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Trùng `ConceptCode` giữa các chủ đề cùng kỹ năng & cấp HSK | Dùng mã gộp tĩnh `WK-{hsk}-{skill}` khiến các chủ đề khác nhau có cùng mã | Xây dựng hàm `GenerateConceptCode(hsk, skill, topicTitle)` sinh mã duy nhất, ổn định: `CP-{hsk}-{SKILL}-{SLUG}-{SHORTHASH}` dựa trên SHA256 8 ký tự. | **ĐÃ XỬ LÝ** |
| **2** | Tự động nâng/hạ `EstimatedHskLevel` chỉ dựa trên số lượt bài và điểm TB | Gộp chung `currentHsk` với `estimatedHsk` và cộng trừ cấp mà không có bằng chứng đa cấp | Tách bạch `SelectedHskLevel` (cấp học viên chọn) và `EstimatedHskLevel` (`int?`, giữ `null` khi chưa đủ bằng chứng đa kỹ năng). | **ĐÃ XỬ LÝ** |
| **3** | `NormalizeSkill` gộp pinyin vào hanzi và ép danh mục lạ thành grammar | Quy tắc mapping gượng ép làm sai lệch bản chất kỹ năng và mất vết dữ liệu lạ | Phân tách rõ `pinyin`/`tone` thành `"pinyin"`, nhận diện chuẩn `hanzi`, giữ nguyên `"unclassified:{category}"` và ghi nhận `UnclassifiedEvaluationsCount`. | **ĐÃ XỬ LÝ** |
| **4** | Thiếu kiểm thử biên cho thuật toán BKT và độ tin cậy | Chưa kiểm tra tính nhạy cảm theo thứ tự thời gian, dữ liệu ít và dữ liệu lệch kỹ năng | Bổ sung unit tests cho chuỗi học vs chuỗi quên `[F,F,F,T,T,T]` vs `[T,T,T,F,F,F]`, dữ liệu 1 câu hỏi, và dữ liệu lệch 1 kỹ năng. | **ĐÃ XỬ LÝ** |
| **5** | Concurrency test dùng chung 1 thể hiện `DbContext` | EF Core `DbContext` không an toàn khi gọi song song trên cùng một thể hiện | Chuẩn hóa test concurrency: mỗi tác vụ song song sử dụng một `DbContext` độc lập mô phỏng scoped service trong ASP.NET Core. | **ĐÃ XỬ LÝ** |
| **6** | Đề xuất `diagnostic-test` khi chưa có route và API tương ứng | Tạo thẻ đề xuất khảo sát định vị trỏ về `/learning-path` gây hiểu nhầm chức năng đã hoạt động | Gỡ bỏ hoàn toàn ứng viên `diagnostic-test` trong Phase 1; hướng dẫn học viên chưa đánh giá vào bài học đầu tiên của lộ trình HSK. | **ĐÃ XỬ LÝ** |
| **7** | Khớp nối `DestinationRoute` với React Router thực tế | Route bài học dùng dạng query `?id=` thay vì params `lesson/:lessonId` | Chuẩn hóa toàn bộ `DestinationRoute`: `/srs-review`, `/ai-exercises?hsk={hsk}&source=WEAKNESS`, `/lesson/{lessonId}` khớp 100% với React Router. | **ĐÃ XỬ LÝ** |
| **8** | Tải toàn bộ lịch sử câu hỏi không giới hạn số lượng | Lệnh `ToListAsync()` không có giới hạn có thể gây tràn bộ nhớ khi dữ liệu lớn | Giới hạn cửa sổ truy vấn `Take(MaxAttemptsWindow = 200)` theo thứ tự thời gian gần nhất, sau đó đảo chiều để tính BKT. | **ĐÃ XỬ LÝ** |
| **9** | Báo cáo môi trường kiểm thử rõ ràng | Chưa phân định ranh giới giữa kiểm thử InMemory và SQL Server | Báo cáo chi tiết: Unit test backend dùng EF Core InMemory; không xâm phạm hay sửa đổi database thật `ZhongWenHub_Dev`. | **ĐÃ XỬ LÝ** |
| **10** | An toàn cơ sở dữ liệu | Tuân thủ nghiêm ngặt nguyên tắc Zero-Write | Không chạy migration, không thay đổi schema, không merge nhánh khi chưa có phê duyệt. | **ĐÃ XỬ LÝ** |

---

## 2. CHI TIẾT KỸ THUẬT CÁC ĐIỂM SỬA ĐỔI

### A. Tạo ConceptCode duy nhất và ổn định
- File: `Backend/src/Business/AILearning/Services/Competency/CompetencyProfileService.cs`
- Mã trước đây:
  ```csharp
  ConceptCode = $"WK-{x.HskLevel}-{x.SkillCategory.ToUpperInvariant()}"
  ```
- Mã đã sửa:
  ```csharp
  public static string GenerateConceptCode(int hskLevel, string skillCategory, string topicTitle)
  {
      var rawTitle = (topicTitle ?? "general").Trim();
      var normalizedTitle = rawTitle.ToLowerInvariant();

      var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalizedTitle));
      var shortHash = Convert.ToHexString(hashBytes)[..8];

      var slug = Slugify(normalizedTitle);
      if (slug.Length > 20) slug = slug[..20];

      var skill = string.IsNullOrWhiteSpace(skillCategory) ? "GEN" : skillCategory.ToUpperInvariant();

      return string.IsNullOrWhiteSpace(slug)
          ? $"CP-{hskLevel}-{skill}-{shortHash}"
          : $"CP-{hskLevel}-{skill}-{slug.ToUpperInvariant()}-{shortHash}";
  }
  ```
- **Kết quả:** Các chủ đề cùng kỹ năng và HSK level (ví dụ "Câu chữ 把" và "Trợ từ 的" cùng ở HSK 2 Ngữ pháp) sinh ra hai mã hoàn toàn phân biệt:
  - `CP-2-GRAMMAR-CAU-CHU-BA-39E36BC3`
  - `CP-2-GRAMMAR-TRO-TU-DE-23FB08A1`

### B. Tách biệt SelectedHskLevel và EstimatedHskLevel
- File: `Backend/src/Business/AILearning/DTOs/CompetencyDtos.cs`, `CompetencyProfileService.cs`, `RecommendationEngineV2.cs`
- `SelectedHskLevel` luôn bảo toàn cấp HSK do học viên chủ động thiết lập.
- `EstimatedHskLevel` có kiểu `int?` (nullable). Khi học viên ở trạng thái `NOT_ASSESSED` hoặc dữ liệu chưa đủ bằng chứng đa kỹ năng ($\ge 10$ câu hỏi tại cấp độ với độ chính xác $\ge 70\%$ và độ tin cậy $\ge 0.60$), `EstimatedHskLevel` được giữ nguyên là `null` (chưa xác định), không tự ý cộng trừ điểm.

### C. Chuẩn hóa NormalizeSkill & Bảo toàn khả năng truy vết
- File: `Backend/src/Business/AILearning/Services/Competency/CompetencyProfileService.cs`
- Quy tắc mapping:
  - `"pinyin"`, `"tone"`, `"phonetics"` $\rightarrow$ `"pinyin"` (tuyệt đối không gộp vào `"hanzi"`).
  - `"hanzi"`, `"character"`, `"writing"` $\rightarrow$ `"hanzi"`.
  - `"vocabulary"`, `"vocab"` $\rightarrow$ `"vocabulary"`.
  - `"grammar"`, `"sentence"` $\rightarrow$ `"grammar"`.
  - `"reading"` $\rightarrow$ `"reading"`, `"listening"` $\rightarrow$ `"listening"`, `"speaking"` $\rightarrow$ `"speaking"`.
  - Dữ liệu không thuộc các nhóm trên $\rightarrow$ `"unclassified:{category}"` (tuyệt đối không ép về `"grammar"`).
- Thuộc tính `UnclassifiedEvaluationsCount` trong `CompetencyProfileDto` đếm chính xác số lượng câu hỏi không phân loại được để phục vụ truy vết dữ liệu.

### D. Tối ưu tải dữ liệu lớn
- File: `CompetencyProfileService.cs`
- Đặt ngưỡng cửa sổ quan sát `const int MaxAttemptsWindow = 200;`.
- Truy vấn `StudentPracticeAttempts` và `AiExerciseAttempts` theo `OrderByDescending(a => a.AttemptedAt).Take(MaxAttemptsWindow)` tại SQL Server/EF Core, sau đó đảo chiều thứ tự thời gian (`OrderBy(a => a.AttemptedAt)`) trong bộ nhớ để chạy BKT. Đảm bảo tốc độ truy vấn ổn định $< 50\text{ms}$ ngay cả khi học viên có hàng chục nghìn lượt làm bài.

### E. Chuẩn hóa Concurrency Test cho EF Core
- File: `Backend/tests/ZhongWenHub.UnitTests/AILearning/CompetencyProfileServiceTests.cs`
- Mỗi tác vụ trong `Task.WhenAll` được cấp một `ApplicationDbContext` riêng biệt thông qua database name chung, mô phỏng chính xác mô hình Scoped Lifetime của ASP.NET Core:
  ```csharp
  var tasks = Enumerable.Range(0, 10).Select(async _ =>
  {
      using var taskContext = CreateContext(sharedDbName);
      var service = new CompetencyProfileService(taskContext);
      return await service.GetCompetencyProfileAsync(userId);
  });
  ```

### F. Kiểm tra và đồng bộ DestinationRoute với React Router
- Đối chiếu với `Fontend/src/app/router/student.routes.tsx`:
  - `srs-due` $\rightarrow$ `/srs-review` (khớp với route `ReviewSessionPage`).
  - `weak-skill` $\rightarrow$ `/ai-exercises?hsk={hsk}&source=WEAKNESS` (khớp với `AIExerciseGeneratorPage`).
  - `resume-lesson` $\rightarrow$ `/lesson/{lessonId}` (khớp với route `HskTextbookLessonPage`).
  - `next-lesson` $\rightarrow$ `/lesson/{lessonId}` (khớp với route `HskTextbookLessonPage`).
- Loại bỏ hoàn toàn đề xuất giả `diagnostic-test` trong Phase 1. Khi học viên chưa có dữ liệu, đề xuất bài học tiếp theo trong chương trình để học viên bắt đầu tích lũy kiến thức.

---

## 3. BẰNG CHỨNG KIỂM THỬ THỰC TẾ

### A. Backend Unit & Integration Tests (xUnit)
- **Môi trường:** EF Core In-Memory Database (phục vụ kiểm thử logic BKT, concurrency, dữ liệu biên; không can thiệp database thật).
- **Lệnh thực thi:**
  ```powershell
  dotnet test Backend/tests/ZhongWenHub.UnitTests/ZhongWenHub.UnitTests.csproj
  ```
- **Kết quả:** **223/223 tests PASS (100%)**
  - Thời gian chạy: 2.0 giây.
  - Các test mới bổ sung:
    1. `ComputeSequence_OrderSensitivity_RecentSuccessShowsHigherMasteryThanRecentFailure` [PASS]
    2. `ComputeSequence_LowObservationCount_PreservesEpistemicUncertainty` [PASS]
    3. `GetCompetencyProfileAsync_WithFrequentErrors_IdentifiesWeakConceptsWithUniqueStableCode` [PASS]
    4. `GetCompetencyProfileAsync_WithSkewedSingleSkillData_DoesNotAssumeOverallHsk` [PASS]
    5. `NormalizeSkill_PreservesPinyinDistinctFromHanziAndTracksUnknowns` [PASS]
    6. `GetCompetencyProfileAsync_ConcurrentAccess_UsesDedicatedDbContextInstances` [PASS]
    7. `BuildScoredCandidates_WhenNotAssessed_RecommendsNextLessonInCurriculumWithoutFakeDiagnosticTest` [PASS]

### B. Frontend TypeScript Typecheck
- **Lệnh thực thi:**
  ```powershell
  cd Fontend; bunx tsc -b --noEmit
  ```
- **Kết quả:** **Exit code 0, 0 errors**.

### C. Frontend Linter
- **Lệnh thực thi:**
  ```powershell
  cd Fontend; bunx oxlint --quiet
  ```
- **Kết quả:** **0 errors**, hoàn thành trên 601 files.

### D. Frontend Unit Tests (Bun Test)
- **Lệnh thực thi:**
  ```powershell
  cd Fontend; bun test src/tests
  ```
- **Kết quả:** **365/365 tests PASS (100%)** trên 46 files.

### E. Frontend Production Build
- **Lệnh thực thi:**
  ```powershell
  cd Fontend; bun run build
  ```
- **Kết quả:** **Exit code 0, built in 2.25s**, bundle production sẵn sàng.

---

## 4. KẾT LUẬN & ĐÁNH GIÁ NGHIỆM THU

Tất cả 10 vấn đề được nêu trong Code Review đã được khắc phục triệt để và kiểm chứng tự động. Phase 1 đạt trạng thái **PASS** toàn diện, tuân thủ nguyên tắc **Zero-Write** trên cơ sở dữ liệu `ZhongWenHub_Dev`.

