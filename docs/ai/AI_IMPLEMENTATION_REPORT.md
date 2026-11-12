# ZhongWenHub — AI Learning Engine V1 Implementation Report (`AI_IMPLEMENTATION_REPORT.md`)

- **Ngày hoàn thành:** 2026-11-12
- **Nhánh:** `integration/zhongwenhub-sqlserver`
- **Database:** `ZhongWenHub_Dev` (đã áp dụng migration `20261112150501_AddAiLearningEngineTables`)

---

## 1. Chức năng đã hoạt động thực tế
1. **AI Provider Layer (`GeminiProvider`, `MockAIProvider`, `ConfigurableAIProvider`, `EfAIUsageLogger`):**
   - Hỗ trợ đổi provider qua cấu hình (`Gemini` hoặc `Mock`), **không tự động fallback** nếu thiếu cấu hình.
   - Hỗ trợ timeout, cancellation, retry có giới hạn với exponential backoff + jitter (`MaxRetries`), giới hạn input/output tokens, ngân sách token theo ngày/người dùng (`DailyTokenBudgetPerUser`), và ghi log vào `ai_usage_logs`.
2. **AI Tutor (`AITutorService`, `EfAITutorContextVerifier`, `PromptSanitizer`):**
   - Đã bổ sung `GrammarPointId`, `LearningGoal`, `LessonReadingPreview`, `LessonAcademicNote` và lọc prompt injection trên đầu vào.
   - Đã sửa lỗi TypeScript tại `VocabularyDetailDrawer.tsx:275` (`AITutorContext.vocabularyIds` hỗ trợ `(number | string)[]`).
3. **AI Conversation (`AIConversationService`, `AILivePage.tsx`):**
   - Chọn cấp HSK 1–4, 6 tình huống hội thoại, chat tiếng Trung, bật/tắt Pinyin & nghĩa tiếng Việt, phát hiện lỗi ngữ pháp/từ vựng, gợi ý diễn đạt tự nhiên hơn, bắt đầu/kết thúc/xem lại lịch sử phiên trong `ai_conversation_sessions` & `ai_messages`.
   - API hỗ trợ mở rộng `AudioMetadata` cho STT/TTS tương lai, không giả lập chấm điểm phát âm.
4. **AI Exercise Generator (`AIExerciseService`, `AIExerciseGeneratorPage.tsx`):**
   - Tạo 6 dạng bài (`multiple-choice`, `fill-blank`, `sentence-order`, `meaning-match`, `pinyin-match`, `error-correction`) từ 4 nguồn (`VOCABULARY`, `GRAMMAR`, `READING`, `WEAKNESS`).
   - Validate JSON schema, số đáp án (`2..4`), không trùng đáp án, `correctIndex` hợp lệ; lưu tách biệt ở `ai_generated_exercises` với `OriginTag = AI_GENERATED`, `AcademicStatus = UNAPPROVED_EXPERIMENTAL` (không ghi đè bài tập chính thức, không dùng 110 câu hỏi thiếu `questionZh` HSK 2–4).
5. **AI Error Analysis (`AIErrorAnalysisService`, `AIAnalyticsPage.tsx`):**
   - Tổng hợp dữ liệu thực tế từ `student_practice_attempts` và `ai_exercise_attempts` theo 6 kỹ năng, lưu `learning_skill_statistics`, thay thế hoàn toàn mock data tĩnh trên `AIAnalyticsPage.tsx`.
6. **Personalized Learning (`PersonalizedLearningService`, `StudentAIWorkspacePage.tsx`):**
   - Kết hợp SRS (`student_vocabulary_progresses`), tiến độ bài học, thống kê lỗi và thời lượng học 7 ngày bằng thuật toán quy tắc (0 LLM call mặc định), kèm nút tùy chọn gọi LLM giải thích lộ trình (`?explain=true`).

---

## 2. Chức năng mới chỉ có Mock / Giới hạn V1
- **Kiểm thử tự động & E2E offline:** Đã xác minh luồng đầy đủ qua `MockAIProvider` (`IsMock = true`). Luồng live Gemini sẵn sàng khi chạy với `Gemini:Provider = "Gemini"` và `Gemini:ApiKey` hợp lệ trong User Secrets / Environment.
- **Giọng nói (STT/TTS) & Chấm phát âm:** V1 ưu tiên hội thoại văn bản; có contract `AudioMetadata` để mở rộng STT/TTS sau này và **chưa hỗ trợ đánh giá phát âm**.
- **Dữ liệu học thuật HSK 1–4:** Vẫn giữ nguyên `64/70` bài `academicApproved = false` và `110` câu hỏi HSK 2–4 thiếu `questionZh` theo đúng quy định an toàn dữ liệu.

---

## 3. Bảng Database đã bổ sung (`ZhongWenHub_Dev`)
- `ai_conversation_sessions`
- `ai_messages`
- `ai_generated_exercises`
- `ai_exercise_attempts`
- `learning_skill_statistics`
- `ai_usage_logs`
