# BÁO CÁO KỸ THUẬT GIAI ĐOẠN 3: AI ERROR ANALYSIS & ADAPTIVE EXERCISES

**Repository:** `nguyen2234/ZhongWenHub`  
**Branch:** `feature/ai-personalization-phase3`  
**Base Branch:** `feature/ai-personalization-phase2` (`70ade32`)  
**Ngày thực hiện:** 14/11/2026  
**Trạng thái:** HOÀN THÀNH 100% – SẴN SÀNG REVIEW ĐỘC LẬP  

---

## 1. TỔNG QUAN MỤC TIÊU & PHẠM VI GIAI ĐOẠN 3

Giai đoạn 3 hiện thực hóa vòng lặp phản hồi sư phạm thích ứng (Adaptive Pedagogical Feedback Loop) và hệ thống phân tích lỗi sai sâu sắc tích hợp AI, kết nối chặt chẽ với Hồ sơ năng lực BKT (Phase 1) và Đánh giá xếp lớp chẩn đoán (Phase 2):

1. **AI Error Analysis (Phân tích lỗi sai đa chiều):**
   - Phân loại lỗi theo 6 nhóm kỹ năng HSK: `vocabulary`, `grammar`, `pinyin`, `hanzi`, `reading`, `listening`.
   - Phân tích nguyên nhân nhầm lẫn phổ biến của người học Việt Nam (trật tự từ, định ngữ - trung tâm ngữ, lượng từ, thanh điệu Pinyin, chuyển di ngôn ngữ tiêu cực).
   - Giải thích căn cứ vì sao đáp án chuẩn là đúng.
   - Trích xuất quy tắc / kiến thức cốt lõi cần nhớ.
   - Cung cấp ví dụ minh họa kèm Chữ Hán, Pinyin và Dịch nghĩa tiếng Việt.
   - Gợi ý hành động và lộ trình luyện tập tiếp theo (`recommendedPracticeAction`, `recommendedRoute`).
   - **Bảo mật & Tính khách quan:** Chấm điểm hoàn toàn dựa trên ground-truth của Backend; LLM tuyệt đối không có quyền sửa điểm hay phán quyết đúng/sai. Prompt không chứa thông tin định danh cá nhân (PII).
   - **Pedagogical Offline Fallback:** Khi LLM hết quota, timeout hoặc phản hồi không đạt schema, hệ thống tự động kích hoạt bộ giải thích sư phạm ngoại tuyến tiếng Việt chuẩn xác theo từng kỹ năng, không làm gián đoạn trải nghiệm học viên.

2. **Adaptive Exercise Generator (Sinh bài tập thích ứng):**
   - Tự động xác định cấp độ HSK mục tiêu dựa trên `EstimatedHskLevel` và `SelectedHskLevel` từ Competency Profile.
   - Thuật toán lên kế hoạch slot câu hỏi: Ưu tiên điểm yếu kiến thức (`TopWeakConcepts` từ BKT Algorithm), đan xen từ vựng SRS sắp quên (`StudentVocabularyProgresses` đến hạn review).
   - Cơ chế chống trùng lặp câu hỏi (Anti-duplication) dựa trên lịch sử làm bài gần nhất của học viên.
   - Fallback ngân hàng câu hỏi kiểm duyệt (`CURATED_QUESTION_BANK` / `ACADEMIC_APPROVED`) từ dữ liệu `Vocabularies` và `GrammarPoints` đã công bố khi AI không khả dụng.
   - **Bảo vệ tính toàn vẹn dữ liệu đề thi (Zero Answer Leakage):** Trước khi nộp bài, client chỉ nhận câu hỏi, hướng dẫn và các phương án xáo trộn (`options`). Tuyệt đối KHÔNG gửi `correctIndex`, `correctAnswer` hay `explanationVi` trong payload của đề thi.

3. **Adaptive Feedback Loop & Idempotency (Vòng lặp phản hồi nguyên tử):**
   - Học viên nộp bài -> Backend thẩm định đáp án khách quan -> Ghi nhận đồng thời `AiExerciseAttempt` và `StudentPracticeAttempt` (được gắn tiền tố `ai_` để các module phân tích tiến trình khác có thể đọc mà không gây double-counting trong thuật toán BKT).
   - Cập nhật thống kê kỹ năng `LearningSkillStatistic` và kích hoạt tái tính toán BKT Profile.
   - Chống nộp bài trùng lặp (Idempotency): Nếu học viên gửi nhiều request cho cùng một bài tập, hệ thống trả về kết quả đã chấm mà không tạo thêm attempt thừa hay gọi lại LLM.
   - Tự động sinh phân tích lỗi chi tiết và gợi ý luyện tập tiếp theo ngay trong kết quả nộp bài.

---

## 2. CHI TIẾT THAY ĐỔI MÃ NGUỒN

### 2.1 Backend (ASP.NET Core 10 & Entity Framework Core)

1. **`Backend/src/Business/AILearning/DTOs/AILearningDtos.cs`:**
   - Bổ sung `AIErrorExampleDto`: Chữ Hán, Pinyin, Dịch nghĩa tiếng Việt.
   - Bổ sung `AIErrorAnalysisDetailDto`: Phân loại lỗi, lý do sai, lý do đúng, quy tắc cần nhớ, ví dụ, hành động tiếp theo, cờ nhận diện `IsAiGenerated` / `IsFallback`.
   - Bổ sung `RequestErrorAnalysisDto`: Hỗ trợ yêu cầu phân tích lỗi độc lập hoặc theo `ExerciseId`.
   - Bổ sung `NextPracticeSuggestionDto`: Gợi ý bước học tiếp theo theo kỹ năng và HSK.
   - Cập nhật `AiExerciseAttemptResultDto`: Tích hợp `ErrorAnalysis` và `NextSuggestion`.
   - Bổ sung `AdaptiveExerciseDto` & `AdaptiveSessionDto`: Đóng gói đề bài thích ứng với nguyên tắc 0% rò rỉ đáp án.
   - Bổ sung `GenerateAdaptiveSessionRequestDto`: Tham số cấu hình phiên thích ứng.

2. **`Backend/src/Business/AILearning/AIErrorAnalysisService.cs`:**
   - Chuẩn hóa hàm `NormalizeSkill`: Bảo tồn dữ liệu chưa phân loại dưới dạng `unclassified:xxx` (đồng bộ với Phase 1).
   - Cập nhật `GetErrorAnalysisAsync`: Lọc bỏ các attempt có `ExerciseId.StartsWith("ai_")` trong `StudentPracticeAttempts` để tránh đếm trùng với `AiExerciseAttempts`.
   - Cài đặt `AnalyzeErrorDetailAsync`:
     + Truy vấn đáp án chuẩn từ database nếu có `ExerciseId` (chống client can thiệp đáp án).
     + Kiểm tra ground-truth: nếu câu trả lời đã đúng, trả về phản hồi xác nhận thành công.
     + Kiểm tra ngân sách quota thông qua `IAIUsageLogger.EnsureWithinDailyBudgetAsync`.
     + Gọi `IAIProvider` với feature `"AI_ERROR_ANALYSIS"`, prompt sư phạm HSK và kiểm định schema JSON nghiêm ngặt.
     + Fallback sư phạm ngoại tuyến `BuildPedagogicalOfflineFallback` khi LLM lỗi hoặc vượt quota.

3. **`Backend/src/Business/AILearning/AIExerciseService.cs`:**
   - Cài đặt `GenerateAdaptiveSessionAsync`:
     + Tự động suy luận HSK từ `ICompetencyProfileService`.
     + Điều phối câu hỏi từ BKT weak concepts và SRS due vocabulary.
     + Chống lặp câu hỏi dựa trên lịch sử `AiExerciseAttempts`.
     + Tạo câu hỏi từ AI với prompt chuẩn hoặc lấy từ ngân hàng kiểm duyệt (`CURATED_QUESTION_BANK`).
     + Trả về `AdaptiveSessionDto` và `AdaptiveExerciseDto` không chứa đáp án hay giải thích.
   - Cập nhật `SubmitAttemptAsync`:
     + Hỗ trợ Idempotency: Kiểm tra attempt đã tồn tại trước đó để tránh ghi đè hoặc gọi lại LLM.
     + Chấm điểm độc lập bằng ground-truth.
     + Lưu đồng thời `AiExerciseAttempt` và `StudentPracticeAttempt` (`ExerciseId = $"ai_{exercise.Id}"`).
     + Kích hoạt tính toán lại `LearningSkillStatistic`.
     + Tự động sinh `ErrorAnalysis` nếu học viên trả lời sai.
     + Trả về gợi ý bước học kế tiếp `NextSuggestion`.
   - Cập nhật `MapDto`: Che giấu hoàn toàn `CorrectIndex`, `CorrectAnswer`, `ExplanationVi` đối với các bài tập chưa được học viên làm bài (`isAttempted: false`).

4. **`Backend/src/Business/AILearning/Services/Competency/CompetencyProfileService.cs`:**
   - Bổ sung điều kiện `!a.ExerciseId.StartsWith("ai_")` khi tải `practiceAttempts` để đảm bảo các bản ghi AI không bị tính hai lần trong chuỗi BKT.

5. **`Backend/src/Business/AITutor/MockAIProvider.cs`:**
   - Bổ sung `BuildErrorAnalysisMockJson`: Trả về dữ liệu mock chuẩn schema cho feature `"AI_ERROR_ANALYSIS"`, hỗ trợ chạy unit/integration test độc lập, không phụ thuộc vào kết nối mạng bên ngoài.

6. **`Backend/src/Api/Controllers/AILearningEngineController.cs`:**
   - Thêm endpoint `POST api/v1/ai/exercises/adaptive/session`: Bắt đầu phiên luyện tập thích ứng.
   - Thêm endpoint `POST api/v1/ai/error-analysis/explain`: Yêu cầu phân tích lỗi sai theo ngữ cảnh.

---

### 2.2 Frontend (React + TypeScript)

1. **`Fontend/src/features/ai/services/ai-learning-engine.service.ts`:**
   - Bổ sung đầy đủ interfaces TypeScript: `AIErrorExample`, `AIErrorAnalysisDetail`, `NextPracticeSuggestion`, `AdaptiveExercise`, `AdaptiveSession`, `GenerateAdaptiveSessionPayload`, `RequestErrorAnalysisPayload`.
   - Mở rộng `AiExerciseAttemptResult` với `errorAnalysis` và `nextSuggestion`.
   - Bổ sung 2 API methods: `generateAdaptiveSession` và `explainErrorDetail`.

2. **`Fontend/src/features/ai/student/pages/AIExerciseGeneratorPage.tsx`:**
   - Tích hợp 2 chế độ học tập mượt mà:
     + **Luyện tập thích ứng (Adaptive Mode):** Tự động đề xuất HSK theo hồ sơ năng lực BKT, bộ lọc kỹ năng (Từ vựng, Ngữ pháp, Pinyin, Đọc hiểu, Nhận diện chữ Hán), đan xen SRS, tóm tắt chiến lược phiên.
     + **Tạo bài tập tự chọn (Custom Mode):** Giữ nguyên tính năng tạo bài tập thủ công với bảo vệ che giấu đáp án.
   - Gắn nhãn nhận diện nguồn gốc minh bạch: `AI_GENERATED` (thử nghiệm) vs `Nội dung kiểm duyệt` (chuẩn học thuật).
   - Che giấu hoàn toàn đáp án trước khi học viên nộp bài.
   - Sau khi nộp bài:
     + Nếu đúng: Hiển thị thanh trạng thái xanh, lời giải thích và gợi ý bước tiếp theo.
     + Nếu sai: Hiển thị khối **Phân tích lỗi sai AI**:
       * Tiêu đề phân loại lỗi và nhãn nguồn gốc (AI Phân tích / Sư phạm chuẩn).
       * Mục "Tại sao bạn chọn chưa đúng" (phân tích chi tiết chuyển di ngôn ngữ).
       * Mục "Tại sao đáp án chuẩn là đúng".
       * Mục "Kiến thức cốt lõi cần nhớ".
       * Thẻ "Ví dụ minh họa" (Chữ Hán + Pinyin + Tiếng Việt).
       * Nút hành động "Luyện tập chuyên đề này" chuyển hướng trực tiếp đến bài tập liên quan.
       * Nút "Phân tích sâu bằng AI" theo nhu cầu học viên.

---

## 3. KẾT QUẢ KIỂM THỬ TOÀN DIỆN

### 3.1 Backend Unit & Integration Tests (xUnit + SQL Server Test DB)
- **Tập tin test mới:** `Backend/tests/ZhongWenHub.UnitTests/AIPhase3PersonalizationTests.cs`
- **Số lượng test:** 250 tests passed (237 test cũ + 13 test mới Phase 3).
- **Kết quả chi tiết:**
  + `PedagogicalOfflineFallback_GeneratesComprehensiveExplanation_ForAllCategories`: PASS (Kiểm chứng đủ 6 kỹ năng).
  + `ParseAndValidateErrorAnalysis_ValidatesStrictSchema`: PASS (Kiểm tra schema JSON).
  + `ParseAndValidateErrorAnalysis_RejectsMalformedOrMissingFields`: PASS (Chống lỗi format).
  + `ExerciseDto_EnforcesZeroAnswerLeakage_BeforeSubmission`: PASS (Kiểm chứng bảo mật đáp án).
  + `MockAIProvider_ReturnsValidErrorAnalysisJson`: PASS (Kiểm chứng mock generator).
  + `EvaluateAttempt_AccuratelyEvaluatesChoiceAndText`: PASS (Chấm điểm ground-truth).
  + `SubmitAttempt_IsIdempotent_AndUpdatesBothAttemptsTablesAtomically` (SQL Server Integration Test trên `ZhongWenHub_Test`): PASS (Kiểm chứng ghi nhận nguyên tử cả 2 bảng `AiExerciseAttempts` và `StudentPracticeAttempts`, kiểm tra tính lũy kế idempotency không sinh attempt trùng).
  + `GenerateAdaptiveSession_ReturnsSecureSession_WithZeroAnswerLeakage` (SQL Server Integration Test): PASS (Kiểm chứng sinh phiên thích ứng, không lộ đáp án).

### 3.2 Frontend Tests & Build (Bun Test, TypeScript, Linter, Vite)
- **Tập tin test mới:** `Fontend/src/tests/ai-phase3-adaptive-and-error-analysis.test.ts`
- **Bun Test:** 377 passed (48 test files, 4696 expect assertions).
- **TypeScript Typecheck (`bunx tsc -b --noEmit`):** 0 errors.
- **Linter (`bunx oxlint --quiet`):** 0 errors.
- **Production Build (`bun run build`):** Succeeded trong 2.25s.

---

## 4. CAM KẾT AN TOÀN VÀ NGUYÊN TẮC TUÂN THỦ

1. **Database Safety:** Cơ sở dữ liệu phát triển `ZhongWenHub_Dev` được bảo vệ tuyệt đối ở trạng thái Zero-Write. Không chạy migration hay thay đổi cấu trúc bảng. Toàn bộ integration test chạy trên database riêng `ZhongWenHub_Test` với transient user và dọn dẹp sạch sẽ sau test.
2. **Không rò rỉ đáp án:** Đáp án đúng và giải thích chi tiết chỉ được trả về sau khi học viên nộp bài.
3. **Độc lập chấm điểm:** LLM không được quyền chấm điểm hay sửa điểm. Điểm số được định đoạt hoàn toàn bởi logic ground-truth trên Backend.
4. **Không tự ý chuyển Phase:** Dừng lại đúng yêu cầu của Phase 3 trên branch `feature/ai-personalization-phase3` để ChatGPT review độc lập.
