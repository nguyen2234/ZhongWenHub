# ZhongWenHub — AI Learning Engine V1 API Documentation (`AI_API_DOCUMENTATION.md`)

Tất cả các endpoint dưới đây yêu cầu xác thực JWT Bearer (`[Authorize(Policy = PolicyConstants.StudentAccess)]`), áp dụng rate limit theo `user:{userId}` (`AITutorRateLimit`), kiểm tra quyền sở hữu theo `UserId`, và trả về lỗi chuẩn `application/problem+json`.

---

## 1. AI Tutor
- **`POST /api/v1/ai-tutor/chat`**
  - **Mô tả:** Giải thích từ vựng, ngữ pháp, câu tiếng Trung, Hanzi/Pinyin, sửa lỗi bài tập hoặc trả lời câu hỏi theo bài học đang mở.
  - **Request Body:** `AITutorChatRequestDto` (`conversationId`, `message`, `mode`: `ASK|EXPLAIN|CORRECT|PRACTICE|CONVERSATION`, `context`: `source`, `hskLevel`, `lessonId`, `grammarPointId`, `vocabularyIds`, `vocabularyWord`, `exerciseContext`, `weaknesses`, `learningGoal`, `history`).
  - **Response (`200 OK`):** `AITutorChatResponseDto` (`type`, `summary`, `markdownFallback`, `blocks[]`, `suggestedActions[]`, `meta`: `provider`, `model`, `isMock`, `promptTokens`, `completionTokens`, `totalTokens`, `latencyMs`).

---

## 2. AI Conversation (Hội thoại văn bản HSK 1–4)
- **`GET /api/v1/ai/conversations/scenarios`**: Danh sách tình huống giao tiếp HSK 1–4.
- **`GET /api/v1/ai/conversations`**: Danh sách tối đa 20 phiên hội thoại gần nhất của học viên hiện tại.
- **`GET /api/v1/ai/conversations/{sessionId}`**: Chi tiết phiên hội thoại và danh sách tin nhắn (trả `404` nếu không thuộc `UserId`).
- **`POST /api/v1/ai/conversations/start`**: Tạo phiên mới (`hskLevel`: `1..4`, `scenarioCode`, `showPinyin`, `showVietnamese`).
- **`POST /api/v1/ai/conversations/{sessionId}/messages`**: Gửi câu tiếng Trung (`message`, `requestVietnamese`, `audioMetadata` mở rộng cho STT/TTS tương lai). Trả về phản hồi AI, Pinyin, nghĩa Việt, phát hiện lỗi ngữ pháp/từ vựng (`correction`) và gợi ý diễn đạt tự nhiên hơn.
- **`PUT /api/v1/ai/conversations/{sessionId}/preferences`** (và **`PATCH`**): Cập nhật `showPinyin`, `showVietnamese`.
- **`POST /api/v1/ai/conversations/{sessionId}/end`**: Kết thúc phiên (`Status = COMPLETED`) và lưu tóm tắt `SummaryVi`.

---

## 3. AI Exercise Generator
- **`GET /api/v1/ai/exercises?hskLevel=&lessonId=`**: Danh sách bài tập AI đã tạo của học viên.
- **`POST /api/v1/ai/exercises/generate`**:
  - **Body:** `hskLevel` (`1..4`), `lessonId` (tùy chọn), `sourceType` (`VOCABULARY|GRAMMAR|READING|WEAKNESS`), `exerciseType` (`multiple-choice|fill-blank|sentence-order|meaning-match|pinyin-match|error-correction`), `count` (`1..5`).
  - **Kiểm định:** Đầu ra JSON được validate schema, số đáp án `2..4`, không trùng phương án, `correctIndex` hợp lệ; gắn nhãn `originTag = "AI_GENERATED"` và `academicStatus = "UNAPPROVED_EXPERIMENTAL"`.
- **`POST /api/v1/ai/exercises/{exerciseId}/attempts`**: Nộp đáp án (`selectedIndex` hoặc `userAnswer`), chấm điểm, lưu `ai_exercise_attempts` và cập nhật `learning_skill_statistics`.

---

## 4. AI Error Analysis & Personalized Learning
- **`GET /api/v1/ai/error-analysis`**: Tổng hợp 6 kỹ năng (`vocabulary`, `grammar`, `hanzi`, `pinyin`, `reading`, `listening`) và chủ điểm yếu từ `student_practice_attempts` + `ai_exercise_attempts`. Trả rõ `hasAudioEvaluation = false` (không suy đoán lỗi phát âm).
- **`GET /api/v1/ai/recommendations?explain=false`**:
  - Mặc định (`explain=false`): Thuật toán quy tắc kết hợp SRS (`student_vocabulary_progresses`), tiến độ bài học, thống kê lỗi và thời lượng học 7 ngày (0 lần gọi LLM).
  - Khi `explain=true`: Gọi thêm AI để giải thích lộ trình (`aiCoachingExplanationVi`, `aiFocusTipVi`).
