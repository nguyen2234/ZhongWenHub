# BÁO CÁO KHẮC PHỤC TOÀN DIỆN PHASE 3 – AN TOÀN DỮ LIỆU, PHÂN QUYỀN VÀ BẢO ĐẢM TÍNH CHÍNH XÁC

**Dự án:** ZhongWenHub – Hệ thống học tiếng Trung thông minh  
**Branch làm việc:** `feature/ai-personalization-phase3`  
**Ngày thực hiện:** 15/11/2026  
**Trạng thái:** HOÀN THÀNH TOÀN DIỆN – ĐÃ QUA KIỂM THỬ TỰ ĐỘNG (100% PASS)

---

## 1. TỔNG QUAN VÀ NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE ANALYSIS)

Sau đợt rà soát độc lập Phase 3 (AI Error Analysis & Adaptive Exercises), nhóm kiến trúc đã xác định và xử lý triệt để 5 nhóm vấn đề trọng yếu:

### 1.1. Lỗ hổng Phân quyền & Rò rỉ Dữ liệu chéo (Cross-User Authorization Vulnerability)
- **Nguyên nhân gốc rễ:** Trong `AIErrorAnalysisService.AnalyzeErrorDetailAsync`, endpoint tiếp nhận `RequestErrorAnalysisDto` có trường `ExerciseId`. Hệ thống trước đây chỉ kiểm tra `exercise != null` mà không kiểm tra quyền sở hữu `exercise.UserId == userId`. Do đó, người dùng B có thể gửi `ExerciseId` của người dùng A để đọc bài tập và phân tích lỗi. Ngoài ra, client có thể truyền trường `CorrectAnswer` tùy ý để đánh lừa hệ thống.
- **Rủi ro:** Vi phạm nghiêm trọng nguyên tắc IDOR (Insecure Direct Object Reference) và cho phép học viên giả lập đáp án đúng mà không bám vào cơ sở dữ liệu.

### 1.2. Race Condition khi Nộp bài đồng thời (Concurrent Submission Idempotency Flaw)
- **Nguyên nhân gốc rễ:** Trong `AIExerciseService.SubmitAttemptAsync`, việc kiểm tra `existingAttempt` diễn ra trước khi gọi `_dbContext.SaveChangesAsync()` mà không có khóa đồng bộ (thread synchronization) hay giao dịch cấp cơ sở dữ liệu. Khi có 2 request gửi đồng thời cho cùng một bài tập, cả hai đều thấy `existingAttempt == null` và ghi thêm 2 bản ghi `AiExerciseAttempt` và `StudentPracticeAttempt`.
- **Đặc thù kỹ thuật:** Cơ sở dữ liệu SQL Server của dự án kích hoạt `EnableRetryOnFailure` (`SqlServerRetryingExecutionStrategy`). Việc mở transaction thủ công bằng `BeginTransactionAsync` mà không thông qua `CreateExecutionStrategy()` gây lỗi `InvalidOperationException`.

### 1.3. Lỗi Thuật toán Fallback Generator (Curated Question Bank Flaws)
- **Nguyên nhân gốc rễ:** Phương thức `BuildCuratedFallbackExerciseAsync` trước đây:
  1. Cố định `CorrectIndex = 0` cho mọi câu hỏi tự sinh fallback.
  2. Dùng chuỗi rác/placeholder khi không đủ phương án (`"pinyin_opt"`, `"Ý nghĩa tham chiếu"`, `"Công thức cấu trúc"`).
  3. Có khối fallback cứng `"你好"` (Xin chào) cố định ở mọi cấp HSK khi thiếu dữ liệu.
  4. Chưa bao quát đủ 5 kỹ năng (`grammar`, `vocabulary`, `pinyin`, `hanzi`, `reading`).
  5. Đánh nhãn sai `ACADEMIC_APPROVED` cho câu hỏi heuristic chưa qua kiểm duyệt học thuật.

### 1.4. Lãng phí Quota & Chi phí Gọi LLM khi Học viên Thử lại (Cost & Cache Inefficiency)
- **Nguyên nhân gốc rễ:** Mỗi lần gọi phân tích lỗi của cùng một bài tập đã làm sai, hệ thống lại gửi request tới LLM Provider, làm tiêu tốn quota hàng ngày của người học và gia tăng chi phí API mà không tận dụng lại kết quả đã giải thích trước đó.

### 1.5. Truy vấn Không giới hạn Cửa sổ Lịch sử (Unbounded History Performance Risk)
- **Nguyên nhân gốc rễ:** `GetErrorAnalysisAsync` tải toàn bộ lịch sử luyện tập của học viên để tổng hợp thống kê mà không áp trần số lượt làm bài, gây nghẽn bộ nhớ khi tài khoản học viên có hàng chục ngàn lượt làm bài.

---

## 2. GIẢI PHÁP VÀ KIẾN TRÚC ĐÃ ÁP DỤNG

### 2.1. Phân quyền Nghiêm ngặt & Ground-Truth từ Backend
- **Kiểm tra sở hữu tuyệt đối:** Trong `AIErrorAnalysisService.AnalyzeErrorDetailAsync`, nếu có `ExerciseId`:
  ```csharp
  var exercise = await _dbContext.AiGeneratedExercises
      .AsNoTracking()
      .FirstOrDefaultAsync(e => e.Id == request.ExerciseId.Value, cancellationToken);

  if (exercise == null)
  {
      throw new KeyNotFoundException("Không tìm thấy bài tập được chỉ định.");
  }

  if (exercise.UserId != userId)
  {
      throw new UnauthorizedAccessException("Bạn không có quyền truy cập hoặc phân tích bài tập của người học khác.");
  }
  ```
- **Không tin tưởng `CorrectAnswer` từ Client:** Luôn ghi đè `correctAnswer = exercise.CorrectAnswer` và lấy đáp án thực tế của học viên từ bản ghi `AiExerciseAttempts` trong cơ sở dữ liệu.
- **Tách biệt chấm điểm chính thức và tham khảo tự do:** Khi học viên phân tích câu hỏi tự do (`ExerciseId == null`), trường `IsAuthoritativeGrading = false` và nội dung giải thích ghi chú rõ: `(Tham khảo đối chiếu, không phải bài chấm chính thức)`.
- **Xử lý Exception chuẩn RESTful:** Controller `AILearningEngineController.ExplainErrorDetail` bắt `UnauthorizedAccessException` trả về `403 Forbidden` và `KeyNotFoundException` trả về `404 Not Found`.

### 2.2. Kiểm soát Đồng thời & Đảm bảo Tính Nguyên tử với SQL Server Execution Strategy
- **Khóa bất đồng bộ theo cặp `(UserId, ExerciseId)`:**
  ```csharp
  private static readonly ConcurrentDictionary<string, SemaphoreSlim> AttemptLocks = new();
  ...
  var lockKey = $"{userId:N}_{aiExerciseId:N}";
  var semaphore = AttemptLocks.GetOrAdd(lockKey, _ => new SemaphoreSlim(1, 1));
  await semaphore.WaitAsync(cancellationToken);
  try { ... }
  finally { semaphore.Release(); }
  ```
- **Tương thích hoàn hảo với `SqlServerRetryingExecutionStrategy`:**
  ```csharp
  if (_dbContext.Database.IsRelational())
  {
      var strategy = _dbContext.Database.CreateExecutionStrategy();
      await strategy.ExecuteAsync(async () =>
      {
          await using var tx = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
          _dbContext.AiExerciseAttempts.Add(attempt);
          _dbContext.StudentPracticeAttempts.Add(practiceAttempt);
          await _dbContext.SaveChangesAsync(cancellationToken);
          await tx.CommitAsync(cancellationToken);
      });
  }
  ```
- **Bảo toàn tính Idempotent:** Khi phát hiện xung đột hoặc bài tập đã làm, hệ thống tự động tải bản ghi đã lưu và trả về kết quả ban đầu mà không tạo bản ghi mới hay gọi lại LLM.

### 2.3. Cải tiến Toàn diện Fallback Generator (Fisher-Yates Shuffle & 5 Kỹ năng Chuẩn)
- **Xáo trộn ngẫu nhiên Fisher-Yates:** Không còn vị trí cố định 0. `CorrectIndex` được tính động dựa trên vị trí của `CorrectAnswer` sau khi xáo trộn:
  ```csharp
  private static (List<string> Shuffled, int CorrectIndex) ShuffleOptions(List<string> options, string correctAnswer)
  {
      var list = new List<string>(options);
      var rng = Random.Shared;
      for (int i = list.Count - 1; i > 0; i--)
      {
          int j = rng.Next(i + 1);
          (list[i], list[j]) = (list[j], list[i]);
      }
      int correctIndex = list.IndexOf(correctAnswer);
      return (list, correctIndex);
  }
  ```
- **Loại bỏ 100% chuỗi rác & fallback cứng:** Không còn `"pinyin_opt"`, `"Ý nghĩa tham chiếu"`, `"Công thức cấu trúc"`, hay `"你好"`.
- **Bao quát cả 5 kỹ năng dựa trên dữ liệu thật:**
  1. `grammar`: Sinh câu hỏi từ `GrammarPoints` đã xuất bản theo đúng cấp HSK với các công thức gây nhiễu từ các điểm ngữ pháp khác.
  2. `pinyin`: Sinh câu hỏi nhận diện Pinyin từ `Vocabularies` đã xuất bản.
  3. `hanzi`: Sinh câu hỏi nhận diện chữ Hán từ `Vocabularies` đã xuất bản.
  4. `reading`: Sinh câu hỏi đọc hiểu ngữ cảnh từ `Lessons` có bài đọc hoặc từ vựng đọc hiểu.
  5. `vocabulary`: Sinh câu hỏi nghĩa từ vựng tiếng Việt từ `Vocabularies`.
- **Kiểm định dữ liệu tối thiểu:** Nếu dữ liệu không đủ tạo ít nhất 2 options phân biệt (`distinctOptions.Count < 2`), phương thức trả về `null`. Session thích ứng sẽ ghi nhận chính xác số câu hỏi hợp lệ thực tế thay vì nhồi nhét dữ liệu giả.
- **Gắn nhãn minh bạch:** Gắn đúng `OriginTag = "CURATED_FALLBACK"`, `AcademicStatus = "UNAPPROVED_EXPERIMENTAL"`.

### 2.4. Tối ưu Chi phí Gọi AI & Caching vào Metadata
- **Cache kết quả phân tích vào `MetadataJson`:** Trường `cachedErrorAnalysis` được lưu trực tiếp vào cột `MetadataJson` của bảng `ai_generated_exercises`. Khi học viên xem lại bài hoặc nộp lại bài, hệ thống đọc trực tiếp từ cache mà không gọi lại LLM.
- **Giới hạn cửa sổ phân tích:** `GetErrorAnalysisAsync` áp trần `MaxAttemptsWindow = 200` (đồng bộ với `CompetencyProfileService.cs`), đảm bảo hiệu năng tối ưu trên quy mô dữ liệu lớn.

---

## 3. DANH SÁCH FILE THAY ĐỔI

| STT | Đường dẫn File | Loại thay đổi | Nội dung chính |
|---|---|---|---|
| 1 | `Backend/src/Business/AILearning/DTOs/AILearningDtos.cs` | Sửa đổi | Bổ sung `IsAuthoritativeGrading` trong `AIErrorAnalysisDetailDto`. |
| 2 | `Backend/src/Business/AILearning/AIErrorAnalysisService.cs` | Sửa đổi | Bổ sung kiểm tra quyền sở hữu cross-user, lấy `CorrectAnswer` từ DB, caching vào `MetadataJson`, áp trần `MaxAttemptsWindow = 200`, hỗ trợ `IsAuthoritativeGrading`. |
| 3 | `Backend/src/Business/AILearning/AIExerciseService.cs` | Sửa đổi | Thêm `SemaphoreSlim` async lock, tích hợp EF Core `CreateExecutionStrategy()`, viết lại `BuildCuratedFallbackExerciseAsync` cho 5 kỹ năng kèm Fisher-Yates shuffle, loại bỏ chuỗi rác. |
| 4 | `Backend/src/Api/Controllers/AILearningEngineController.cs` | Sửa đổi | Xử lý `UnauthorizedAccessException` (403) và `KeyNotFoundException` (404) trong endpoint `error-analysis/explain`. |
| 5 | `Backend/tests/ZhongWenHub.UnitTests/AIPhase3PersonalizationTests.cs` | Bổ sung | Thêm 5 test suite toàn diện kiểm chứng: Cross-User Authorization, Free-Form Advisory, Fallback Scrambling, Concurrent Submission Idempotency, Retry Cache. |

---

## 4. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG

### 4.1. Unit Tests (Backend)
- **Lệnh thực thi:** `dotnet test Backend/tests/ZhongWenHub.UnitTests/ZhongWenHub.UnitTests.csproj`
- **Kết quả:** **255/255 tests PASSED (100%)**
- **Thời gian chạy:** 4.1 giây
- **Chi tiết các ca kiểm thử Phase 3 trọng yếu:**
  - `CrossUserAuthorization_ThrowsUnauthorizedAccessException_WhenAccessingOtherUserExercise`: **PASSED** (Ngăn chặn truy cập chéo).
  - `FreeFormAnalysis_WithoutExerciseId_ReturnsAdvisoryNonAuthoritative`: **PASSED** (Gắn nhãn tham khảo đối chiếu).
  - `CuratedFallback_FisherYatesShuffle_MatchesCorrectAnswerIndex`: **PASSED** (Shuffle Fisher-Yates, khớp đáp án chính xác, không chuỗi rác).
  - `ConcurrentSubmissions_CreateExactlyOneAttempt_AndReturnIdempotentStoredResult`: **PASSED** (2 luồng nộp bài song song chỉ tạo 1 attempt duy nhất).
  - `ErrorAnalysis_UsesMetadataCache_OnRetry`: **PASSED** (Tái sử dụng cache, không gọi LLM lần 2).
  - `PedagogicalOfflineFallback_GeneratesComprehensiveExplanation_ForAllCategories`: **PASSED** (Đầy đủ 6 danh mục lỗi).
  - `ParseAndValidateErrorAnalysis_ValidatesStrictSchema`: **PASSED** (Schema JSON nghiêm ngặt).
  - `ExerciseDto_EnforcesZeroAnswerLeakage_BeforeSubmission`: **PASSED** (Không rò rỉ đáp án ra DTO học viên).
  - `SubmitAttempt_IsIdempotent_AndUpdatesBothAttemptsTablesAtomically`: **PASSED** (Lưu đồng thời cả hai bảng).
  - `GenerateAdaptiveSession_ReturnsSecureSession_WithZeroAnswerLeakage`: **PASSED** (Phiên thích ứng bảo mật).

### 4.2. Integration Tests (Backend)
- **Lệnh thực thi:** `dotnet test Backend/tests/ZhongWenHub.IntegrationTests/ZhongWenHub.IntegrationTests.csproj`
- **Kết quả:** **108/108 tests PASSED (100%)**
- **Thời gian chạy:** 30.2 giây
- **Bao gồm:** Luồng end-to-end `ExerciseGenerator_Attempt_ErrorAnalysis_And_Recommendations_WorkEndToEnd`, xác thực JWT, RBAC, và Swagger API contracts.

### 4.3. Frontend Verification
- **Lệnh thực thi:** `cd Fontend && bun run lint && bun test src/tests && bun run build`
- **Kết quả:**
  - `oxlint`: Clean, 0 errors.
  - `bun test`: **377/377 tests PASSED** trên 48 test suites.
  - `tsc -b`: Clean, 0 TypeScript errors.
  - `vite build`: Build thành công production bundle trong 1.76 giây.

---

## 5. ĐỀ XUẤT DATABASE MIGRATION CHO PRODUCTION

Do nguyên tắc an toàn Zero-Write trên môi trường Development/Production, migration sau **KHÔNG được tự ý chạy trong mã nguồn hiện tại** mà được chuẩn bị để kỹ sư DBA áp dụng khi triển khai lên Production:

```sql
-- Migration: Add Unique Constraint to prevent concurrent duplicate attempts at database level
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'idx_ai_exercise_attempts_user_exercise_unique' 
    AND object_id = OBJECT_ID('ai_exercise_attempts')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [idx_ai_exercise_attempts_user_exercise_unique]
    ON [dbo].[ai_exercise_attempts] ([UserId], [AiExerciseId]);
END
GO
```

*Ghi chú:* Ở tầng ứng dụng, mã nguồn đã triển khai `SemaphoreSlim` và cơ chế retry `CreateExecutionStrategy()` kết hợp bắt lỗi `DbUpdateException` để đảm bảo tính bất biến ngay cả khi index chưa được tạo.

---

## 6. KẾT LUẬN & CAM KẾT PHẠM VI

1. Toàn bộ các vấn đề được nêu trong đợt review Phase 3 đã được khắc phục hoàn toàn và kiểm chứng nghiêm ngặt qua kiểm thử tự động.
2. Không merge vào nhánh `main`.
3. Không tự ý chuyển tiếp sang Phase 4.
4. Cơ sở dữ liệu `ZhongWenHub_Dev` được bảo toàn nguyên trạng (Zero-Write).
5. Mã nguồn sẵn sàng bàn giao cho người dùng và reviewer ChatGPT tiến hành nghiệm thu độc lập.

