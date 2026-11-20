# ZhongWenHub — AI Learning Engine V1 Architecture (`AI_ARCHITECTURE.md`)

- **Ngày lập tài liệu:** 2026-11-12
- **Nhánh:** `integration/zhongwenhub-sqlserver`
- **Mục tiêu:** Mô tả kiến trúc thực tế hiện có và các thành phần bổ sung cho **AI Learning Engine V1** tận dụng bộ dữ liệu HSK 1–4 đã chuẩn hóa (`70` bài, `210` `sentences[]`, `1.199` liên kết từ vựng, `146` điểm ngữ pháp, `3.003` bài tập).

---

## 1. Kiến trúc hiện có trước V1

### 1.1. Backend (`Backend/src/`)
- **AI Provider & Tutor (`Backend/src/Business/AITutor/`):**
  - `IAIProvider` & `GeminiProvider`: gọi Gemini `generateContent` qua HTTP header `x-goog-api-key`, hỗ trợ `SystemInstruction`, `UserPrompt`, `History`, `ExpectJson`, `Temperature`, `MaxOutputTokens`, timeout.
  - `GeminiOptions`: đọc từ section `Gemini` (User Secrets / Environment Variables).
  - `AITutorService` & `EfAITutorContextVerifier`: xác thực người dùng, xác minh `LessonId`, `VocabularyIds`, `ExerciseContext` từ `ApplicationDbContext` (`ZhongWenHub_Dev`), chống prompt injection cơ bản.
  - `AITutorController` (`POST /api/v1/ai-tutor/chat`): bảo vệ bởi `[Authorize(Policy = PolicyConstants.StudentAccess)]` và `[EnableRateLimiting("AITutorRateLimit")]`.
- **Learning & SRS (`Backend/src/Business/Learning/` & `LearningController.cs`):**
  - Đã có các bảng `student_learning_profiles`, `student_lesson_progresses`, `student_practice_attempts`, `student_daily_activities`, `student_vocabulary_progresses`, `student_xp_transactions`.
- **Auth & Rate Limiting (`Program.cs`, `DependencyInjection.cs`):**
  - JWT Bearer authentication, policy-based authorization (`StudentAccess`), `ProblemDetailsMiddleware` (chuẩn `application/problem+json`), fixed-window rate limiter theo `user:{userId}`.

### 1.2. Frontend (`Fontend/src/`)
- **AI Tutor (`Fontend/src/features/ai-tutor/`):**
  - `AITutorContext`, `AITutorDrawer`, `AITutorWorkspacePage`, `ContextBuilder`, `AITutorService` gọi `POST /api/v1/ai-tutor/chat` qua `httpClient` (kèm JWT).
  - **Lỗi TypeScript hiện hữu:** `VocabularyDetailDrawer.tsx:275` truyền `vocabulary.id` (`string`) vào `ContextBuilder.build(..., { vocabularyIds: [...] })` trong khi `AITutorContext.vocabularyIds` đang khai báo `number[]` (cần mở rộng thành `(string | number)[]` và `lessonId?: string | number`).
- **Các trang AI hiện có nhưng chưa nối dữ liệu thật:**
  - `AIAnalyticsPage.tsx` (`/ai-analytics`): đang dùng dữ liệu tĩnh (`SKILL_SCORES`, `WEAK_POINTS`).
  - `AILivePage.tsx` (`/ai-live`, `/conversation`): giao diện live/mock, chưa có phòng hội thoại lưu DB theo phiên HSK 1–4.
  - `StudentAIWorkspacePage.tsx` (`/ai-learning`): khung tính năng AI học viên, chưa nối API sinh bài tập & cá nhân hóa từ SQL Server.

---

## 2. Kiến trúc AI Learning Engine V1 bổ sung

```text
[React/TypeScript Frontend (Fontend/)]
  ├── AI Tutor Drawer / Workspace (/ai-tutor)  ──> POST /api/v1/ai-tutor/chat
  ├── AI Conversation Room (/conversation)     ──> /api/v1/ai/conversations/*
  ├── AI Exercise Generator (/ai-exercises)    ──> /api/v1/ai/exercises/*
  ├── AI Error Analysis (/ai-analytics)        ──> GET  /api/v1/ai/error-analysis
  └── Personalized Learning (/ai-learning)     ──> GET  /api/v1/ai/recommendations
           │  (JWT Bearer, không chứa API key, không gọi Gemini trực tiếp)
           ▼
[ASP.NET Core Web API (Backend/src/Api/)]
  ├── Rate Limiting (user-scoped) + [Authorize(Policy = StudentAccess)]
  ├── Input Validation + Prompt Injection Guard + UserId Ownership Check
  └── Controllers: AITutorController, AILearningEngineController
           │
           ▼
[Business Layer (Backend/src/Business/)]
  ├── AI Provider Layer: IAIProvider, GeminiProvider (retry/backoff/usage), MockAIProvider, AIProviderSelector
  ├── AI Tutor: AITutorService + EfAITutorContextVerifier (bổ sung GrammarPointId, ReadingPassage, LearningGoal)
  ├── AI Conversation: AIConversationService (HSK 1-4, Pinyin/Vi toggle, error detection, session history)
  ├── AI Exercise Generator: AIExerciseService (6 types, strict JSON schema & content validator, AI_GENERATED tag)
  ├── Error Analysis Engine: AIErrorAnalysisService (rule-based từ attempts + AI attempts, 6 kỹ năng)
  └── Personalized Learning Engine: PersonalizedLearningService (rule-based + SRS + optional LLM explain)
           │
           ▼
[SQL Server (ZhongWenHub_Dev)]
  ├── Dữ liệu có sẵn: lessons (70 HSK 1-4), vocabularies, grammar_points, exercises,
  │                   student_practice_attempts, student_vocabulary_progresses, student_lesson_progresses
  └── Bảng mới (Migration có rollback):
      ├── ai_conversation_sessions
      ├── ai_messages
      ├── ai_generated_exercises
      ├── ai_exercise_attempts
      ├── learning_skill_statistics
      └── ai_usage_logs
```

---

## 3. Nguyên tắc an toàn & Quản lý dữ liệu chưa duyệt

1. **Quản lý nội dung HSK chưa duyệt (`64/70` bài `academicApproved = false`, `110` câu hỏi HSK 2–4 thiếu `questionZh`):**
   - Không tự động đổi `academicApproved`, không sửa bảng nội dung gốc `lessons`/`exercises`.
   - Không dùng `110` câu hỏi thiếu `questionZh` để sinh câu hỏi chữ Hán chuẩn.
   - Bài tập do AI tạo được lưu tách biệt ở `ai_generated_exercises` với `OriginTag = "AI_GENERATED"` và `AcademicStatus = "UNAPPROVED_EXPERIMENTAL"`.
2. **Bảo mật & Chống Prompt Injection:**
   - API key chỉ nằm ở Backend (`Gemini:ApiKey` / `GEMINI_API_KEY`).
   - Mọi dữ liệu từ học viên và DB được bọc trong khối dữ liệu có ranh giới rõ ràng và lọc các mẫu chỉ thị hệ thống trước khi đưa vào prompt.
3. **Không suy đoán dữ liệu không có:**
   - Không suy đoán lỗi phát âm khi chưa có dữ liệu âm thanh được chấm điểm.
   - Khi chưa có API key hợp lệ hoặc cấu hình `AI:Provider = "Mock"`, hệ thống dùng `MockAIProvider` và đánh dấu `IsMock = true` trong `ai_usage_logs` và response metadata.
