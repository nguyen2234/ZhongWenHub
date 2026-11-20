# KIẾN TRÚC HỆ THỐNG CÁ NHÂN HÓA HỌC TẬP TÍCH HỢP TRÍ TUỆ NHÂN TẠO
**AI-Powered Personalized Learning & Competency Architecture (Phase 1)**

> **Tài liệu kiểm toán hiện trạng & Thiết kế kiến trúc nâng cấp**  
> **Dự án:** ZhongWenHub – Nền tảng học tiếng Trung trực tuyến tích hợp AI  
> **Tác giả:** Senior AI Engineer & ASP.NET Core Architect  
> **Ngày lập:** 14/11/2026  
> **Trạng thái tài liệu:** Sẵn sàng thẩm định kỹ thuật (Ready for Review)  
> **Nguyên tắc cốt lõi:** Dữ liệu thật trước (Real-Data First) · Tính giải thích được (Explainability) · Tính toán năng lực tất định (Deterministic Competency Analytics) · LLM làm gia sư sư phạm (LLM as Pedagogical Scaffolding).

---

## 1. TỔNG QUAN HIỆN TRẠNG MÃ NGUỒN (CURRENT SOURCE CODE BASELINE)

Qua quá trình kiểm toán toàn diện mã nguồn Backend ASP.NET Core (.NET 10), Frontend React/TypeScript và Cơ sở dữ liệu SQL Server (`ZhongWenHub_Dev`), hiện trạng các thành phần liên quan đến AI Personalization được phân định rõ ràng như sau:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  HIỆN TRẠNG KỸ THUẬT ZHONGWENHUB                                 │
├────────────────────────────────┬───────────────────────────────┬────────────────────────────────┤
│    DỮ LIỆU THẬT & API HOẠT ĐỘNG │    LƯU TRỮ TẠM / LOCALSTORAGE │       GIẢ LẬP (MOCK) / GAPS    │
├────────────────────────────────┼───────────────────────────────┼────────────────────────────────┤
│ • AI Conversation & Sessions   │ • Tiến độ chi tiết một số bài │ • AI Speaking Pronunciation    │
│   (SQL Server + Gemini API)    │   học tại PracticeCenter      │   Assessment (Mock timer 2.5s, │
│ • AI Generated Exercises       │   (zwh_learning_state_v1_...) │   hardcode điểm 88/100)        │
│   (Tạo từ DB Vocab/Grammar thật│ • Cache lịch sử ôn tập cục bộ │ • Trạng thái năng lực ban đầu  │
│ • AI Exercise Attempts         │   trên trình duyệt khi mạng   │   tự gán "HSK 1" mặc định,     │
│   (Chấm điểm & lưu DB)         │   chập chờn                   │   chưa có Diagnostic Test      │
│ • Learning Skill Statistics    │                               │ • Khuyến nghị đề xuất học tập  │
│   (Ghi nhận 6 kỹ năng cốt lõi) │                               │   chỉ dùng 4 quy tắc tĩnh,     │
│ • SRS SuperMemo SM-2           │                               │   chưa có Utility Function     │
│   (EF, Interval, NextReviewAt) │                               │ • Chưa có Knowledge Graph theo │
│ • Student Practice Attempts    │                               │   từng vi khái niệm (Topic)    │
│ • Daily Token Usage & Guard    │                               │                                │
└────────────────────────────────┴───────────────────────────────┴────────────────────────────────┘
```

### 1.1 Các thành phần đã chạy API thật và lưu trữ Cơ sở dữ liệu
1. **Dịch vụ AI Tutor & Gemini Integration:**
   - Mã nguồn: `Backend/src/Business/AITutor/AITutorService.cs`, `GeminiProvider.cs`, `ConfigurableAIProvider.cs`.
   - Kết nối trực tiếp mô hình Google Gemini `gemini-3-flash-preview` qua HTTPS API Key tại server.
   - Kiểm tra hạn mức tiêu thụ token hàng ngày (`AiUsageLog` - trần 60,000 tokens/ngày/học viên) và làm sạch câu hỏi (`PromptSanitizer`).
2. **Hệ thống Hội thoại Tình huống AI (AI Conversation Rooms):**
   - Mã nguồn: `Backend/src/Business/AILearning/AIConversationService.cs`, `AIConversationController.cs`.
   - Lưu trữ đầy đủ phiên hội thoại (`AiConversationSession`) và từng lượt tin nhắn (`AiMessage`), hỗ trợ sửa lỗi ngữ pháp và gợi ý câu thoại tự nhiên.
3. **Sinh bài tập thông minh từ nguồn chuẩn hóa (AI Exercise Generator):**
   - Mã nguồn: `Backend/src/Business/AILearning/AIExerciseService.cs`.
   - Đọc ngữ liệu từ DB (`VocabularyEntity`, `GrammarPointEntity`), yêu cầu Gemini sinh bài tập theo cấu trúc JSON nghiêm ngặt, lưu vào bảng `ai_generated_exercises` với cờ `OriginTag = "AI_GENERATED"`.
4. **Chấm điểm bài tập AI & Tái tính toán kỹ năng tức thì:**
   - Phương thức: `SubmitAttemptAsync` trong `AIExerciseService.cs`.
   - Chấm điểm đáp án của học sinh, lưu vào `ai_exercise_attempts` và kích hoạt ngay lập tức `AIErrorAnalysisService.RecomputeAndPersistSkillStatsAsync` để cập nhật bảng `learning_skill_statistics`.
5. **Thuật toán Lặp lại Ngắt quãng SRS (SuperMemo SM-2):**
   - Mã nguồn: `Backend/src/Business/Learning/LearningService.cs`.
   - Quản lý trạng thái từ vựng trong bảng `student_vocabulary_progresses`, tính toán độ khó $EF \in [1.3, 2.5]$, số ngày ngắt quãng $I$, và mốc thời gian ôn tập tiếp theo `NextReviewAt`.

### 1.2 Các thành phần còn phụ thuộc LocalStorage hoặc Mock
1. **Chấm điểm phát âm tiếng Trung (AI Speaking Assessment):**
   - File: `Fontend/src/features/skills/pages/SkillSpeakingPage.tsx`.
   - Hiện trạng: Giao diện thu âm qua Web Audio API hoạt động, nhưng backend chưa có dịch vụ Speech-to-Text (STT) và phân tích thanh điệu (Tones 1–4). Giao diện đang giả lập bộ đếm 2.5 giây và trả về điểm số `88/100` kèm nhận xét cố định.
   - Tại `AIErrorAnalysisService.cs`, hệ thống đã khai báo minh bạch: `HasAudioEvaluation = false`, `AudioEvaluationNote = "Chưa có dữ liệu âm thanh được chấm điểm; hệ thống không suy đoán lỗi phát âm."`
2. **Khởi tạo trình độ mặc định (Initial HSK Assumption):**
   - Khi học viên đăng ký mới, `ApplicationUser.CurrentHskLevel` được gán mặc định `"HSK 1"` trong DB và `StudentLearningProfile.SelectedHskLevel` gán `1`.
   - Hệ thống thiếu quy trình đánh giá năng lực ban đầu (Diagnostic Assessment), dẫn đến việc người học đã có trình độ HSK 3 hoặc 4 vẫn bị gợi ý bài học và từ vựng HSK 1 nếu không chủ động tự chỉnh tay trong cài đặt.
3. **Sự ngắt quãng giữa Bài tập SGK và Thống kê Kỹ năng:**
   - Khi học viên làm bài tập trong sách giáo khoa điện tử (`HskTextbookLessonPage.tsx`), kết quả được lưu vào `StudentPracticeAttempt` nhưng nhiều câu hỏi không có `KnowledgePointId` hoặc `TopicTitle` cụ thể, dẫn đến việc `AIErrorAnalysisService` phải gom vào nhóm "Kiến thức tổng hợp".

---

## 2. DANH MỤC FILE & API ĐÃ ĐƯỢC XÁC MINH (VERIFIED ASSETS CATALOG)

### 2.1 Backend Controllers & Endpoints

| HTTP Method | API Endpoint | Controller | Service đảm nhiệm | Thực thể Database liên quan | Trạng thái xác minh |
|---|---|---|---|---|---|
| `POST` | `/api/v1/ai-tutor/chat` | `AITutorController` | `AITutorService` | `ai_usage_logs` | **REAL DATA (Gemini)** |
| `GET` | `/api/v1/ai/conversations/scenarios` | `AILearningEngineController` | `AIConversationService` | `In-memory definitions` | **REAL DATA** |
| `POST` | `/api/v1/ai/conversations/start` | `AILearningEngineController` | `AIConversationService` | `ai_conversation_sessions` | **REAL DATA (SQL Server)** |
| `POST` | `/api/v1/ai/conversations/{id}/messages` | `AILearningEngineController` | `AIConversationService` | `ai_messages`, `ai_usage_logs` | **REAL DATA (Gemini + DB)** |
| `GET` | `/api/v1/ai/exercises` | `AILearningEngineController` | `AIExerciseService` | `ai_generated_exercises` | **REAL DATA (SQL Server)** |
| `POST` | `/api/v1/ai/exercises/generate` | `AILearningEngineController` | `AIExerciseService` | `vocabularies`, `grammar_points` | **REAL DATA (Gemini + DB)** |
| `POST` | `/api/v1/ai/exercises/{id}/attempts` | `AILearningEngineController` | `AIExerciseService` | `ai_exercise_attempts`, `learning_skill_statistics` | **REAL DATA (SQL Server)** |
| `GET` | `/api/v1/ai/error-analysis` | `AILearningEngineController` | `AIErrorAnalysisService` | `student_practice_attempts`, `learning_skill_statistics` | **REAL DATA (SQL Server)** |
| `GET` | `/api/v1/ai/recommendations` | `AILearningEngineController` | `PersonalizedLearningService` | `student_learning_profiles`, `student_vocabulary_progresses` | **REAL DATA (Rule + LLM)** |
| `POST` | `/api/v1/learning/me/practice-attempts` | `LearningController` | `LearningService` | `student_practice_attempts` | **REAL DATA (SQL Server)** |
| `POST` | `/api/v1/learning/me/vocabulary/reviews` | `LearningController` | `LearningService` | `student_vocabulary_progresses` | **REAL DATA (SM-2 Algorithm)** |

### 2.2 Frontend Services & Components

| File Frontend | Chức năng chính | Kết nối Backend / Logic | Trạng thái xác minh |
|---|---|---|---|
| `Fontend/src/features/ai/services/ai-learning-engine.service.ts` | Client HTTP gọi toàn bộ API AI Learning Engine | `httpClient` gọi `/api/v1/ai/*` kèm Bearer Token | **VERIFIED (Active)** |
| `Fontend/src/features/ai-analytics/pages/AIAnalyticsPage.tsx` | Màn hình hiển thị 6 kỹ năng và các điểm yếu | `aiLearningEngineService.getErrorAnalysis()` | **VERIFIED (Active)** |
| `Fontend/src/features/ai/student/pages/StudentAIWorkspacePage.tsx` | Không gian học tập AI & Lộ trình đề xuất | `aiLearningEngineService.getPersonalizedPlan()` | **VERIFIED (Active)** |
| `Fontend/src/features/ai/student/pages/AIExerciseGeneratorPage.tsx` | Bộ sinh đề bài tập AI theo điểm yếu | `aiLearningEngineService.generateAiExercises()` | **VERIFIED (Active)** |
| `Fontend/src/features/learning/services/learning-state.service.ts` | Quản lý state học tập, SRS, streak, tiến độ bài | Đồng bộ 2 chiều giữa `localStorage` và `LearningApiService` | **VERIFIED (Active)** |
| `Fontend/src/features/skills/pages/SkillSpeakingPage.tsx` | Trang luyện nói & phát âm | Ghi âm client, kết quả điểm 88 đang giả lập | **MOCK UI** |

---

## 3. TRUY VẾT LUỒNG DỮ LIỆU ĐẦU CUỐI (END-TO-END DATA FLOW TRACING)

```
[ BƯỚC 1: HỌC VIÊN LÀM BÀI TẬP ]
Học viên nộp đáp án tại Bài tập SGK, Question Bank hoặc Bài tập AI
       │
       ├──► (A) Bài tập SGK / Luyện tập thường:
       │    Frontend PracticeSession.tsx gọi recordPracticeAttempt()
       │    └──► POST /api/v1/learning/me/practice-attempts
       │         └──► Ghi bản ghi vào bảng [student_practice_attempts]
       │
       └──► (B) Bài tập AI (AI Generated Exercise):
            Frontend AIExerciseGeneratorPage.tsx gọi submitAiExerciseAttempt()
            └──► POST /api/v1/ai/exercises/{id}/attempts
                 └──► Ghi bản ghi vào bảng [ai_exercise_attempts]
                 └──► Gọi tức thì RecomputeAndPersistSkillStatsAsync()
       │
       ▼
[ BƯỚC 2: TỔNG HỢP & PHÂN TÍCH LỖI SAI (AIErrorAnalysisService) ]
Khi học viên mở màn hình AI Analytics hoặc khi sinh khuyến nghị học tập:
       ├── 1. Truy vấn hợp nhất: [student_practice_attempts] + [ai_exercise_attempts]
       ├── 2. Chuẩn hóa về 6 kỹ năng: vocabulary, grammar, hanzi, pinyin, reading, listening
       ├── 3. Tính toán độ chính xác: Accuracy% = (Correct / Total) * 100
       ├── 4. Lọc điểm yếu (WeakPoints): Các chủ đề có Incorrect > 0 & (Accuracy < 75% HOẶC Incorrect >= 2)
       └── 5. Ghi đè chỉ số kỹ năng mới nhất vào bảng [learning_skill_statistics]
       │
       ▼
[ BƯỚC 3: ĐỘNG CƠ ĐỀ XUẤT HỌC TẬP (PersonalizedLearningService) ]
Tổng hợp đa nguồn dữ liệu để sinh lộ trình:
       ├── Nguồn 1: Đọc [student_vocabulary_progresses] ──► Đếm từ đến hạn SRS (NextReviewAt <= UtcNow)
       ├── Nguồn 2: Đọc kết quả từ BƯỚC 2             ──► Lấy điểm yếu trầm trọng nhất (Top Weak Point)
       ├── Nguồn 3: Đọc [student_lesson_progresses]    ──► Kiểm tra bài học đang dang dở (IN_PROGRESS)
       └── Nguồn 4: Đọc [student_daily_activities]      ──► Đánh giá thời gian học 7 ngày qua & Streak
       │
       ▼
[ BƯỚC 4: SINH GIẢI THÍCH SƯ PHẠM QUA LLM (Tùy chọn explain = true) ]
Hệ thống gom tóm tắt số liệu thật gửi lên Gemini API (gemini-3-flash-preview):
       ├── Prompt chứa: Cấp HSK, số từ SRS đến hạn, % chính xác tổng quan, danh sách đề xuất
       ├── Gemini trả về JSON: {"explanationVi": "...", "focusTipVi": "..."}
       └── Ghi nhật ký token vào bảng [ai_usage_logs]
       │
       ▼
[ BƯỚC 5: HIỂN THỊ LÊN GIAO DIỆN HỌC VIÊN ]
Học viên nhận được 4 thẻ hành động rõ ràng:
       ├── Thẻ 1: Ôn tập N từ SRS đến hạn ──────► Chuyển tới /srs-review
       ├── Thẻ 2: Củng cố điểm yếu ngữ pháp ────► Chuyển tới /ai-exercises?source=WEAKNESS
       ├── Thẻ 3: Học tiếp bài học dở dang ─────► Chuyển tới /lesson?id=...
       └── Thẻ 4: Luyện phản xạ hội thoại AI ───► Chuyển tới /conversation
```

---

## 4. THIẾT KẾ HỒ SƠ NĂNG LỰC ĐA CHIỀU (MULTI-DIMENSIONAL COMPETENCY PROFILE)

### 4.1 Giải quyết bài toán "Không tự gán HSK 1 là trình độ thực tế"
Hiện tại hệ thống tự động gán `HSK 1` cho người dùng mới khi đăng ký. Để khắc phục:
1. **Bổ sung trạng thái đánh giá năng lực ban đầu (`CompetencyAssessmentStatus`):**
   - `NOT_ASSESSED`: Học viên mới đăng ký, chưa trải qua khảo sát hoặc bài kiểm tra năng lực.
   - `DIAGNOSTIC_PENDING`: Đang thực hiện bài kiểm tra phân loại đầu vào.
   - `DIAGNOSTIC_COMPLETED`: Đã hoàn thành bài kiểm tra phân loại; năng lực được định vị chính xác từ dữ liệu kiểm tra.
   - `SELF_DECLARED`: Học viên chủ động tự chọn cấp độ bắt đầu (bỏ qua bài test).
   - `CONTINUOUS_CALIBRATED`: Năng lực được cập nhật liên tục qua lịch sử học tập thực tế.
2. **Quy trình Kiểm tra Phân loại Thích ứng (Diagnostic Placement Test):**
   - Bài kiểm tra ngắn gọn gồm 15–20 câu hỏi trắc nghiệm/nghe hiểu đa tầng (Multi-stage adaptive testing).
   - Bắt đầu ở độ khó HSK 2:
     - Nếu trả lời đúng $\ge 80\%$ ➔ nhảy lên cụm câu hỏi HSK 3–4.
     - Nếu trả lời đúng $< 50\%$ ➔ chuyển xuống cụm câu hỏi HSK 1.
   - Kết quả trả về điểm năng lực khởi điểm thực tế (ví dụ: `HSK 3 - Emerging`), không ép học viên học lại từ đầu nếu đã có nền tảng.

### 4.2 Cấu trúc Hồ sơ Năng lực (Competency Breakdown)
Hồ sơ năng lực được biểu diễn dưới dạng cây phân cấp (Hierarchical Competency Graph):

```
HỒ SƠ NĂNG LỰC HỌC VIÊN (Student Competency Profile)
├── 1. KỸ NĂNG VĨ MÔ (Macro-Skills) [0.0 - 100.0%]
│    ├── Listening (Nghe hiểu)
│    ├── Speaking (Nói & Ngữ điệu)
│    ├── Reading (Đọc hiểu đoạn văn)
│    ├── Writing (Viết câu & Hanzi)
│    ├── Grammar (Ngữ pháp & Cấu trúc câu)
│    └── Vocabulary (Vốn từ vựng & Nhận diện)
│
├── 2. CHỦ ĐỀ HSK & ĐIỂM KIẾN THỨC VI MÔ (Micro-Concept Nodes)
│    ├── [HSK1-GR-01] Câu chữ 是 (Phán đoán) ──────────► Mastery: 92% (MASTERED)
│    ├── [HSK1-GR-05] Câu hỏi dùng 吗 (Nghi vấn) ──────► Mastery: 88% (MASTERED)
│    ├── [HSK2-GR-08] Câu chữ 比 (So sánh) ────────────► Mastery: 64% (EMERGING)
│    ├── [HSK3-GR-12] Câu chữ 把 (Xử lý đối tượng) ────► Mastery: 38% (NOVICE - CRITICAL WEAKNESS)
│    └── [HSK3-GR-15] Bổ ngữ kết quả (好, 完, 见, 懂) ──► Mastery: 45% (NOVICE)
│
└── 3. MỨC ĐỘ THÀNH THẠO PHÂN TẦNG (Mastery Tiers)
     ├── NOVICE (0% - 49%): Hay nhầm lẫn, cần hướng dẫn chi tiết và bài tập có giàn giáo (Scaffolding).
     ├── EMERGING (50% - 74%): Đã hiểu khái niệm cơ bản nhưng dễ sai ở các biến thể phủ định/nghi vấn.
     ├── COMPETENT (75% - 89%): Sử dụng chính xác trong ngữ cảnh tiêu chuẩn, phản xạ tốt.
     └── MASTERED (90% - 100%): Sử dụng nhuần nhuyễn, hoàn thành bài tập không cần gợi ý, duy trì qua SRS.
```

### 4.3 Công thức tính Mức độ Thành thạo (Bayesian Knowledge Tracing Rút gọn)
Thay vì sử dụng tỷ lệ đúng sai đơn giản $Correct / Total$ (vốn dễ bị nhiễu khi số lượng câu hỏi ít), hệ thống áp dụng mô hình cập nhật xác suất thành thạo sau mỗi lượt làm bài:

$$P(L_{t}) = P(L_{t-1} \mid \text{Observation}) + (1 - P(L_{t-1} \mid \text{Observation})) \cdot P(T)$$

Trong đó:
- $P(L_t)$: Xác suất học viên đã thực sự làm chủ kiến thức tại thời điểm $t$.
- $P(T)$: Xác suất chuyển đổi từ chưa hiểu sang hiểu sau một lượt học (mặc định $0.15$).
- Khi học viên trả lời đúng:
  $$P(L_{t-1} \mid \text{Correct}) = \frac{P(L_{t-1}) \cdot (1 - P(S))}{P(L_{t-1}) \cdot (1 - P(S)) + (1 - P(L_{t-1})) \cdot P(G)}$$
  *(với $P(S) = 0.1$ là xác suất sơ suất/trượt tay, $P(G) = 0.25$ là xác suất đoán mò đúng trong trắc nghiệm 4 đáp án)*.
- Khi học viên trả lời sai:
  $$P(L_{t-1} \mid \text{Incorrect}) = \frac{P(L_{t-1}) \cdot P(S)}{P(L_{t-1}) \cdot P(S) + (1 - P(L_{t-1})) \cdot (1 - P(G))}$$

*Ý nghĩa:* Một học viên đã thành thạo $90\%$ nếu lỡ làm sai 1 câu do sơ suất sẽ không bị tụt điểm nghiêm trọng về $0\%$, và một học viên mới làm đúng 1 câu ngẫu nhiên sẽ không bị coi là đã nắm vững $100\%$.

---

## 5. THIẾT KẾ ĐỘNG CƠ ĐỀ XUẤT GIẢI THÍCH ĐƯỢC (EXPLAINABLE RECOMMENDATION ENGINE)

### 5.1 Hàm Đánh giá Tiện ích Đa nhân tố (Multi-Factor Utility Function)
Động cơ đề xuất không sử dụng danh sách tĩnh cố định mà chấm điểm từng ứng viên học tập (Bài học mới, Bài ôn SRS, Bài tập củng cố điểm yếu, Phiên hội thoại) theo hàm tiện ích:

$$\text{Utility}(Candidate) = w_{\text{srs}} \cdot U_{\text{srs}} + w_{\text{weak}} \cdot U_{\text{weak}} + w_{\text{prog}} \cdot U_{\text{prog}} + w_{\text{goal}} \cdot U_{\text{goal}}$$

Các thành phần tiện ích thành phần ($U \in [0, 1]$):
1. **$U_{\text{srs}}$ (Độ khẩn cấp lặp lại ngắt quãng):**
   $$U_{\text{srs}} = \min\left(1.0, \frac{\text{DueSrsWordsCount}}{15}\right) \times \left(1 + \frac{\text{DaysOverdue}}{3}\right)$$
   *Ưu tiên cao nhất khi học viên có từ vựng chạm ngưỡng quên.*
2. **$U_{\text{weak}}$ (Mức độ nghiêm trọng của lỗ hổng kiến thức):**
   $$U_{\text{weak}} = (1.0 - \text{MasteryScore}) \times \frac{\text{ErrorCount}}{\text{TotalAttempts}} \times \text{ConceptPrerequisiteWeight}$$
   *Tập trung vào các điểm ngữ pháp nền tảng mà học viên đang làm sai liên tiếp.*
3. **$U_{\text{prog}}$ (Tính liên tục của mạch học):**
   Đạt $1.0$ nếu là bài học đang học dở (`IN_PROGRESS`); đạt $0.7$ nếu là bài học kế tiếp trong lộ trình HSK chuẩn; đạt $0.3$ nếu là bài học nhảy cóc.
4. **$U_{\text{goal}}$ (Tương thích với thời gian biểu học tập hôm nay):**
   Nếu học viên chỉ có 10 phút rảnh rỗi hôm nay, hệ thống ưu tiên Flashcards SRS hoặc 1 bài tập AI ngắn thay vì mở cả bài đọc dài 45 phút.

Hệ số trọng số mặc định: $w_{\text{srs}} = 0.35$, $w_{\text{weak}} = 0.30$, $w_{\text{prog}} = 0.20$, $w_{\text{goal}} = 0.15$ (Tổng bằng $1.0$).

### 5.2 Mô hình Dữ liệu Giải thích Minh bạch (Explainable Contract)
Mỗi đề xuất gửi về Frontend bắt buộc chứa 4 trường dữ liệu giải thích:
- `TriggerReasonVi`: Căn cứ dữ liệu kích hoạt (VD: *"Có 8 từ vựng đã đến hạn ôn tập sau 3 ngày theo thuật toán SuperMemo SM-2"*).
- `PedagogicalGoalVi`: Mục tiêu sư phạm (VD: *"Củng cố phản xạ nhận diện chữ Hán trước khi học cấu trúc câu nâng cao của Bài 5"*).
- `EvidenceData`: Dữ liệu số liệu minh chứng (VD: `{ "errorCount": 3, "lastScore": 40, "srsIntervalDays": 3 }`).
- `EstimatedMinutes`: Thời gian cần thiết ước tính (VD: `8 phút`).

---

## 6. MÔ HÌNH TÍCH HỢP TRÍ TUỆ NHÂN TẠO (LLM INTEGRATION STRATEGY)

### 6.1 Nguyên tắc Phân định Ranh giới (Separation of Concerns)

> [!IMPORTANT]
> **Nguyên tắc "Deterministic Analytics, Generative Scaffolding":**
> 1. **MÁY TÍNH TOÁN & CHẤM ĐIỂM (Deterministic Engine):** Toàn bộ việc chấm trắc nghiệm, tính toán độ thành thạo BKT, xếp hạng ưu tiên đề xuất và cấp chứng nhận hoàn thành bài học do mã nguồn C# và SQL Server thực thi 100%. Tuyệt đối không dùng LLM để chấm điểm đúng/sai hay tính toán điểm năng lực.
> 2. **LLM ĐÓNG VAI TRÒ GIA SƯ (Pedagogical Scaffolding):** LLM chỉ được kích hoạt cho 2 tác vụ:
>    - **Phân tích nguyên nhân lỗi sai (Diagnostic Error Explanation):** Chỉ ra tại sao người học chọn đáp án sai (ví dụ: nhầm lẫn giữa chữ "买" - mua và "卖" - bán; hoặc nhầm trật tự từ tiếng Việt khi dùng trợ từ kết cấu "的").
>    - **Sinh đề bài tập cá nhân hóa (Targeted Exercise Generation):** Tạo câu hỏi mới xoay quanh đúng ngữ cảnh và từ vựng mà học viên vừa làm sai, lấy ngữ liệu từ cơ sở dữ liệu đã thẩm định.

### 6.2 Luồng Phân tích Lỗi sai Chuyên sâu (Distractor Analysis Prompt)
Khi học sinh trả lời sai, hệ thống cung cấp phản hồi có cấu trúc theo chuẩn JSON:

```json
{
  "isCorrect": false,
  "misconceptionCategory": "WORD_ORDER_TRANSFER",
  "rootCauseVi": "Học viên bị ảnh hưởng bởi ngữ pháp tiếng Việt (đặt thời gian sau hành động).",
  "explanationVi": "Trong tiếng Trung, trạng từ chỉ thời gian '昨天' (hôm qua) bắt buộc phải đứng trước động từ '去' hoặc đứng đầu câu, không được đặt ở cuối câu như tiếng Việt.",
  "correctSentenceZh": "我昨天去超市了。",
  "pinyin": "Wǒ zuótiān qù chāoshì le.",
  "followUpMicroTask": {
    "type": "sentence-order",
    "promptVi": "Sắp xếp lại câu đúng trật tự thời gian:",
    "words": ["去", "他们", "明天", "北京"]
  }
}
```

---

## 7. THIẾT KẾ CƠ SỞ DỮ LIỆU & ENTITY MODELS (SQL SERVER)

Tuân thủ nguyên tắc **Zero-Write & Không gây xung đột Schema**: Không sửa đổi hoặc xóa các bảng hiện có (`student_learning_profiles`, `learning_skill_statistics`, `student_practice_attempts`, `ai_generated_exercises`). Thiết kế 3 bảng mới độc lập phục vụ Phase 1:

```
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│       student_learning_profiles      │       │     student_competency_nodes         │
├──────────────────────────────────────┤       ├──────────────────────────────────────┤
│ PK  Id                  (Guid)       │       │ PK  Id                  (Guid)       │
│ FK  UserId              (Guid)       │◄──┐   │ FK  UserId              (Guid)       │
│     AssessmentStatus    (nvarchar)   │   │   │     ConceptCode         (nvarchar)   │
│     EstimatedHskLevel   (int)        │   │   │     SkillCategory       (nvarchar)   │
│     SelectedHskLevel    (int)        │   └───┼──   HskLevel            (int)        │
│     TargetDailyMinutes  (int)        │       │     MasteryProbability  (float)      │
│     UpdatedAt           (datetime2)  │       │     MasteryTier         (nvarchar)   │
└──────────────────────────────────────┘       │     TotalAttempts       (int)        │
                                               │     LastAssessedAt      (datetime2)  │
                                               └──────────────────────────────────────┘
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│    student_diagnostic_assessments    │       │   learning_recommendation_histories  │
├──────────────────────────────────────┤       ├──────────────────────────────────────┤
│ PK  Id                  (Guid)       │       │ PK  Id                  (Guid)       │
│ FK  UserId              (Guid)       │◄──┐   │ FK  UserId              (Guid)       │
│     AssessedHskLevel    (int)        │   │   │     RecommendationCategory (nvarchar)│
│     ConfidenceScore     (float)      │   │   │     TargetId            (nvarchar)   │
│     SkillBreakdownJson  (nvarchar)   │   └───┼──   UtilityScore        (float)      │
│     StartedAt           (datetime2)  │       │     TriggerReasonVi     (nvarchar)   │
│     CompletedAt         (datetime2)  │       │     UserAction          (nvarchar)   │
└──────────────────────────────────────┘       │     GeneratedAt         (datetime2)  │
                                               └──────────────────────────────────────┘
```

### 7.1 Entity C# Models Đề xuất

#### 1. `StudentCompetencyNode.cs` (Bảng `student_competency_nodes`)
Lưu trữ mức độ thành thạo của học viên theo từng vi khái niệm / chủ đề ngữ pháp:
```csharp
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZhongWenHub.Data.Entities.Learning;

[Table("student_competency_nodes")]
public class StudentCompetencyNode : BaseEntity
{
    [Required]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(64)]
    public string ConceptCode { get; set; } = string.Empty; // Ví dụ: "HSK2-GR-BA", "HSK1-VOC-GREETING"

    [Required]
    [MaxLength(32)]
    public string SkillCategory { get; set; } = "grammar"; // vocabulary, grammar, reading, listening, hanzi, pinyin

    public int HskLevel { get; set; } = 1;

    public double MasteryProbability { get; set; } = 0.1; // P(L) theo Bayesian Knowledge Tracing [0.0 - 1.0]

    [Required]
    [MaxLength(20)]
    public string MasteryTier { get; set; } = "NOVICE"; // NOVICE, EMERGING, COMPETENT, MASTERED

    public int TotalAttempts { get; set; } = 0;
    public int CorrectAttempts { get; set; } = 0;

    public DateTime LastAssessedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(UserId))]
    public virtual ApplicationUser? User { get; set; }
}
```

#### 2. `StudentDiagnosticAssessment.cs` (Bảng `student_diagnostic_assessments`)
Lưu kết quả các bài kiểm tra phân loại năng lực đầu vào:
```csharp
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZhongWenHub.Data.Entities.Learning;

[Table("student_diagnostic_assessments")]
public class StudentDiagnosticAssessment : BaseEntity
{
    [Required]
    public Guid UserId { get; set; }

    public int AssessedHskLevel { get; set; } = 1; // 1 đến 6
    public double ConfidenceScore { get; set; } = 0.85; // Độ tin cậy của thuật toán phân loại [0.0 - 1.0]

    public int TotalQuestions { get; set; } = 15;
    public int CorrectQuestions { get; set; } = 0;

    [MaxLength(4000)]
    public string? SkillBreakdownJson { get; set; } // Điểm số từng kỹ năng dạng JSON

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    [ForeignKey(nameof(UserId))]
    public virtual ApplicationUser? User { get; set; }
}
```

#### 3. `LearningRecommendationHistory.cs` (Bảng `learning_recommendation_histories`)
Lưu vết các đề xuất hệ thống đã sinh ra để làm cơ sở tối ưu hóa trọng số (Feedback Loop):
```csharp
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZhongWenHub.Data.Entities.Learning;

[Table("learning_recommendation_histories")]
public class LearningRecommendationHistory : BaseEntity
{
    [Required]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(32)]
    public string RecommendationCategory { get; set; } = string.Empty; // srs-due, weak-skill, resume-lesson, ai-conversation

    [Required]
    [MaxLength(128)]
    public string TargetId { get; set; } = string.Empty; // ID bài học, từ vựng hoặc điểm ngữ pháp

    public double UtilityScore { get; set; } = 0.0;

    [Required]
    [MaxLength(500)]
    public string TriggerReasonVi { get; set; } = string.Empty;

    [MaxLength(20)]
    public string UserAction { get; set; } = "PENDING"; // PENDING, ACCEPTED, DISMISSED, COMPLETED

    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ActionTakenAt { get; set; }

    [ForeignKey(nameof(UserId))]
    public virtual ApplicationUser? User { get; set; }
}
```

---

## 8. THIẾT KẾ ĐẶC TẢ GIAO DIỆN LẬP TRÌNH (API CONTRACTS & DTOS)

### 8.1 API 1: Lấy Hồ sơ Năng lực Chi tiết Học viên
- **Endpoint:** `GET /api/v1/ai/competency-profile`
- **Quyền truy cập:** `StudentAccess` (JWT Bearer Token)
- **Response Model (`CompetencyProfileDto`):**
```json
{
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "assessmentStatus": "DIAGNOSTIC_COMPLETED",
  "estimatedHskLevel": 2,
  "confidenceScore": 0.88,
  "overallMasteryPercent": 68.5,
  "macroSkills": [
    {
      "category": "vocabulary",
      "labelVi": "Từ vựng (Vocabulary)",
      "masteryPercent": 75.2,
      "tier": "COMPETENT",
      "wordsLearnedCount": 240,
      "wordsDueSrsCount": 12
    },
    {
      "category": "grammar",
      "labelVi": "Ngữ pháp (Grammar)",
      "masteryPercent": 54.0,
      "tier": "EMERGING",
      "weakestConcepts": ["Câu chữ 把", "Bổ ngữ kết quả"]
    }
  ],
  "topWeakConcepts": [
    {
      "conceptCode": "HSK2-GR-BA",
      "titleVi": "Cấu trúc câu chữ 把",
      "hskLevel": 2,
      "masteryProbability": 0.38,
      "tier": "NOVICE",
      "mistakeCount": 4,
      "recommendedActionRoute": "/ai-exercises?concept=HSK2-GR-BA"
    }
  ],
  "lastEvaluatedAt": "2026-11-14T20:30:00Z"
}
```

### 8.2 API 2: Bắt đầu Bài Kiểm tra Năng lực Phân loại Đầu vào
- **Endpoint:** `POST /api/v1/ai/diagnostic/start`
- **Response Model (`DiagnosticSessionDto`):**
```json
{
  "diagnosticId": "a1b2c3d4-0000-0000-0000-000000000001",
  "totalStages": 3,
  "initialHskLevel": 2,
  "questions": [
    {
      "questionId": "diag-q-01",
      "stage": 1,
      "hskLevel": 2,
      "skillCategory": "grammar",
      "promptZh": "这本书你______完了吗？",
      "promptPinyin": "Zhè běn shū nǐ ______ wán le ma?",
      "options": ["看", "听", "吃", "走"],
      "explanationVi": "Câu kiểm tra bổ ngữ kết quả 看完 (đọc xong)."
    }
  ]
}
```

### 8.3 API 3: Nộp Bài Kiểm tra Năng lực & Cập nhật Hồ sơ Khởi điểm
- **Endpoint:** `POST /api/v1/ai/diagnostic/submit`
- **Request Body (`SubmitDiagnosticDto`):**
```json
{
  "diagnosticId": "a1b2c3d4-0000-0000-0000-000000000001",
  "answers": [
    { "questionId": "diag-q-01", "selectedIndex": 0, "timeSpentSeconds": 14 }
  ]
}
```
- **Response Model (`DiagnosticResultDto`):**
```json
{
  "diagnosticId": "a1b2c3d4-0000-0000-0000-000000000001",
  "recommendedHskLevel": 2,
  "confidenceScore": 0.91,
  "summaryVi": "Bạn đã nắm vững kiến thức HSK 1 và đạt mức độ Khởi động (Emerging) ở HSK 2. Hệ thống đã tùy chỉnh giáo trình và thẻ từ vựng bắt đầu từ HSK 2 Bài 1.",
  "recommendedStartLessonId": "les-hsk2-01",
  "calibratedAt": "2026-11-14T20:35:00Z"
}
```

### 8.4 API 4: Đề xuất Lộ trình Cá nhân hóa V2 (Explainable Recommendations)
- **Endpoint:** `GET /api/v1/ai/recommendations/v2`
- **Query Params:** `?availableMinutes=20&explain=true`
- **Response Model (`ExplainablePersonalizedPlanDto`):**
```json
{
  "currentHskLevel": 2,
  "dailyGoalMinutes": 20,
  "streakDays": 4,
  "topPriorityAction": {
    "id": "rec-srs-01",
    "category": "srs-due",
    "title": "Ôn tập 12 thẻ từ vựng SRS đến hạn",
    "utilityScore": 0.89,
    "triggerReasonVi": "12 từ vựng đã chạm ngưỡng quên theo chu kỳ SuperMemo SM-2.",
    "pedagogicalGoalVi": "Khôi phục trí nhớ dài hạn trước khi nạp thêm ngữ pháp mới.",
    "evidenceData": { "dueCount": 12, "oldestDaysOverdue": 2 },
    "estimatedMinutes": 6,
    "destinationRoute": "/srs-review"
  },
  "secondaryActions": [
    {
      "id": "rec-weak-02",
      "category": "weak-skill",
      "title": "Củng cố Cấu trúc câu chữ 把",
      "utilityScore": 0.82,
      "triggerReasonVi": "Tỷ lệ trả lời sai đạt 62% trong 5 lần làm bài gần nhất.",
      "pedagogicalGoalVi": "Sửa lỗi nhầm lẫn trật tự từ giữa tân ngữ và động từ.",
      "evidenceData": { "errorCount": 4, "accuracyPercent": 38.0 },
      "estimatedMinutes": 10,
      "destinationRoute": "/ai-exercises?concept=HSK2-GR-BA"
    }
  ],
  "aiCoachingExplanationVi": "Chào bạn, hôm nay bạn có 20 phút. Trọng tâm quan trọng nhất là giải quyết 12 thẻ từ vựng đang có nguy cơ quên trong 6 phút, sau đó luyện 1 bài tập củng cố câu chữ 把 để khắc phục triệt để lỗi sai hôm qua.",
  "generatedAt": "2026-11-14T20:40:00Z"
}
```

---

## 9. KẾ HOẠCH TRIỂN KHAI THEO TỪNG GIAI ĐOẠN (PHASED ROADMAP)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              LỘ TRÌNH TRIỂN KHAI PHASE 1                               │
├────────────────────┬────────────────────┬────────────────────┬────────────────────────┤
│ GIAI ĐOẠN 1A       │ GIAI ĐOẠN 1B       │ GIAI ĐOẠN 1C       │ GIAI ĐOẠN 1D           │
│ (Tuần 1: Ngày 1-4) │ (Tuần 1: Ngày 5-8) │ (Tuần 2: Ngày 9-13)│ (Tuần 2: Ngày 14-17)   │
├────────────────────┼────────────────────┼────────────────────┼────────────────────────┤
│ • Entity & Schema  │ • Bài test phân    │ • Tích hợp LLM     │ • Vòng phản hồi đề xuất│
│   Competency Nodes │   loại Diagnostic  │   phân tích lỗi    │   (Feedback Loop &     │
│ • Thuật toán BKT   │   Placement Test   │   (Distractor      │   Utility Weight       │
│   tính Mastery %   │ • Xóa bỏ tự gán    │   Rationale)       │   Tuning)              │
│ • Động cơ đề xuất  │   HSK 1 mặc định   │ • Sinh đề bài tập  │ • Hoàn thiện Dashboard │
│   Utility Function │ • Màn hình định vị │   AI theo đúng biến│   Học tập Thích ứng    │
│   đa nhân tố       │   trình độ đầu vào │   thể lỗi sai      │   trên Frontend        │
└────────────────────┴────────────────────┴────────────────────┴────────────────────────┘
```

### Chi tiết các gói công việc:
1. **Giai đoạn 1A: Nền tảng Hồ sơ Năng lực & Động cơ Đề xuất Đa nhân tố**
   - Tạo Migration an toàn cho 3 bảng: `student_competency_nodes`, `student_diagnostic_assessments`, `learning_recommendation_histories`.
   - Triển khai `CompetencyProfileService.cs` với thuật toán cập nhật Bayesian Knowledge Tracing.
   - Viết `ExplainableRecommendationEngine.cs` tính điểm Utility Score.
2. **Giai đoạn 1B: Đánh giá Phân loại Đầu vào (Diagnostic Assessment)**
   - Xây dựng ngân hàng 40 câu hỏi phân loại HSK 1–4 chuẩn mực.
   - Thêm trạng thái `NOT_ASSESSED` cho học viên mới; hiển thị banner gợi ý làm bài test 10 phút.
   - Tự động điều chỉnh lộ trình học theo kết quả bài test phân loại.
3. **Giai đoạn 1C: Tích hợp LLM Phân tích Lỗi sai Chuyên sâu & Giàn giáo Sư phạm**
   - Viết Prompt chuyên biệt phân tích nguyên nhân nhầm lẫn tâm lý học ngôn ngữ (L1 Transfer Errors).
   - Nối bài tập sai vào bộ sinh bài tập AI mục tiêu (`/ai-exercises?source=WEAKNESS`).
4. **Giai đoạn 1D: Tối ưu hóa & Hoàn thiện Trải nghiệm Học viên**
   - Cung cấp API ghi nhận phản hồi đề xuất (`POST /recommendations/{id}/feedback`).
   - Tối ưu hóa thời gian sinh đề xuất dưới $500\text{ms}$ thông qua Memory Cache cho Competency Nodes.
   - Viết bộ kiểm thử hồi quy toàn diện.

---

## 10. MA TRẬN TEST CASES & TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)

| Mã Test | Phân hệ | Mục tiêu kiểm thử | Đầu vào giả định | Kết quả kỳ vọng (Expected Output) |
|---|---|---|---|---|
| **TC-AI-01** | Assessment | Học viên mới đăng ký không bị ép gán HSK 1 thực tế | Đăng ký tài khoản mới thành công | Trạng thái `AssessmentStatus == "NOT_ASSESSED"`. Hệ thống hiển thị tùy chọn làm bài test phân loại hoặc tự chọn trình độ. |
| **TC-AI-02** | Diagnostic | Phân loại chính xác trình độ học viên có kiến thức HSK 2 | Hoàn thành bài test phân loại với 13/15 câu đúng | Cấp độ định vị trả về `HSK 2`, `ConfidenceScore >= 0.85`, giáo trình tự động chuyển sang HSK 2 Bài 1. |
| **TC-AI-03** | BKT Mastery | Xác suất thành thạo không biến động đột ngột do 1 câu sai | Học viên có Mastery 90% trả lời sai 1 câu do sơ suất | Điểm thành thạo cập nhật giảm về khoảng 80–82%, không bị rơi về 0% (khắc phục nhược điểm của tỷ lệ đúng sai thô). |
| **TC-AI-04** | Engine | Đề xuất SRS luôn được ưu tiên khi có từ vựng đến hạn | Có 15 từ vựng `NextReviewAt <= UtcNow` | Đề xuất vị trí số 1 là Ôn tập SRS với $U_{\text{srs}} \ge 0.85$, ActionLabel = "Ôn tập SRS ngay". |
| **TC-AI-05** | Engine | Đề xuất bài học dở dang khi không có từ SRS quá hạn | 0 từ SRS đến hạn, có bài học HSK 2 Bài 3 trạng thái `IN_PROGRESS` | Đề xuất ưu tiên là tiếp tục bài học đang dở, giải thích rõ duy trì mạch kiến thức. |
| **TC-AI-06** | Explainability| Toàn bộ đề xuất trả về bắt buộc có lý do minh bạch | Gọi `GET /api/v1/ai/recommendations/v2` | 100% các đề xuất có `TriggerReasonVi` và `PedagogicalGoalVi` không rỗng, không chứa placeholder vô nghĩa. |
| **TC-AI-07** | LLM Safety | LLM giải thích lỗi sai không làm thay đổi điểm số gốc | Nộp bài tập trắc nghiệm sai đáp án | Điểm kiểm tra tính toán bởi C# ($0$ điểm câu đó), LLM chỉ cung cấp đoạn văn giải thích lý do sai không can thiệp logic chấm. |
| **TC-AI-08** | Performance | Thời gian phản hồi của đề xuất không gọi LLM | Gọi API đề xuất chuẩn (explain = false) | Độ trễ phản hồi (Response Latency) $\le 350\text{ms}$. |
