# PHÂN TÍCH CẤU TRÚC DỮ LIỆU PHỤC VỤ AI CÁ NHÂN HÓA (ZHONGWENHUB)

> **Tài liệu**: Kiến trúc dữ liệu AI & Cá nhân hóa trải nghiệm học tập tiếng Trung  
> **Người thực hiện**: Senior Fullstack Developer, Database Architect & AI System Specialist  
> **Căn cứ**: Phân hệ `features/ai`, `features/ai-tutor`, `features/ai-grading`, `features/ai-analytics`, `features/learning` trong `Fontend/src`

---

## 1. PHÂN BIỆT RÕ CÁC CHỨC NĂNG AI TRONG HỆ THỐNG

Để đảm bảo tính trung thực và bám sát mã nguồn, bảng dưới đây phân định rõ chức năng AI đã có giao diện/hợp đồng dữ liệu trong FE và chức năng AI được đề xuất mở rộng:

| Tên chức năng | Hiện trạng trong FE | Căn cứ mã nguồn | Trạng thái kiến trúc CSDL |
| :--- | :--- | :--- | :--- |
| **Trợ lý Gia sư AI (AI Tutor)** | **Đã có trong FE** | `features/ai-tutor/types.ts` | Bắt buộc (`ai_tutor_conversations`, `ai_tutor_messages`) |
| **AI Luyện phản xạ nói (Kippy Live)** | **Đã có trong FE** | `features/ai-live/pages/AILivePage.tsx` | Bắt buộc (`ai_tutor_messages` với audio turns) |
| **AI Chấm bài viết & Sửa ngữ pháp** | **Đã có trong FE** | `features/ai-grading/pages/AIGradingPage.tsx` | Bắt buộc (`ai_writing_submissions`) |
| **Radar năng lực & Chẩn đoán điểm yếu**| **Đã có trong FE**| `features/ai-analytics/pages/AIAnalyticsPage.tsx` | Bắt buộc (`user_competency_scores`, `user_weak_knowledge_points`)|
| **Thuật toán Flashcard ngắt quãng SRS** | **Đã có trong FE** | `features/vocabulary/srsEngine.ts` | Bắt buộc (`user_srs_states`, `srs_review_logs`) |
| **Teacher AI Studio (Soạn bài tập/giáo án)**| **Đã có trong FE**| `features/ai/teacher`, `management/teacher` | Bắt buộc (`ai_task_logs`, `question_bank`) |
| **Quản lý hạn ngạch Token & Feature Tier** | **Đã có trong FE** | `features/ai/usage/types/ai-usage.types.ts` | Bắt buộc (`ai_entitlements`, `ai_task_logs`) |
| *Semantic Prompt Caching* | *Đề xuất bổ sung* | Thiết kế tối ưu chi phí LLM Backend | Tùy chọn nâng cao (`ai_prompt_cache`) |
| *Vector Embeddings tra cứu tri thức ngữ cảnh* | *Đề xuất bổ sung* | Mở rộng RAG (pgvector / Qdrant) | Đề xuất lộ trình tương lai |

---

## 2. DỮ LIỆU CẦN THU THẬP PHỤC VỤ MÔ HÌNH AI

Để hệ thống AI hiểu sâu sắc năng lực và thói quen học tập của từng học viên, CSDL cần thu thập 4 nhóm dữ liệu:

### 2.1. Chuỗi sự kiện hành vi giáo dục (Educational Telemetry Events)
- Định nghĩa chuẩn: `LearningEvent` trong `features/learning/types/learning-event.types.ts`.
- Các loại sự kiện thu thập:
  - `practice_session_started`, `practice_session_completed` (Thời lượng tập trung).
  - `question_answered`, `question_retried` (Số lần thử lại một câu hỏi).
  - `hint_requested` (Học sinh có cần trợ giúp gợi ý hay không).
  - `pronunciation_played` (Tần suất bấm nghe phát âm lại để nhận biết từ khó).
  - `subtitle_repeated`, `pinyin_toggled`, `translation_toggled` (Mức độ phụ thuộc vào phiên âm hoặc tiếng Việt).
  - `durationMs` (Thời gian phản hồi non-negative, đo lường độ trễ suy nghĩ).
- Bảng lưu trữ: `learning_telemetry_events`.

### 2.2. Lịch sử làm bài tập & Tỷ lệ sai sót (Mistake History)
- Ghi nhận chi tiết từng câu hỏi học sinh làm sai, phân loại theo chủ đề (`knowledgePointId`), cấp độ HSK, kỹ năng cụ thể.
- Bảng lưu trữ: `user_exercise_attempts`.

### 2.3. Dữ liệu đánh giá trí nhớ từ vựng (SRS Memory Curve)
- Thuật toán SuperMemo-2 / FSRS ghi nhận:
  - `stability`: Độ bền vững của trí nhớ (tính theo ngày).
  - `difficulty`: Độ khó chủ quan của từ vựng đối với cá nhân học sinh đó (0.00 - 10.00).
  - `repetitions`: Số chu kỳ ghi nhớ liên tiếp thành công.
- Bảng lưu trữ: `user_srs_states`, `srs_review_logs`.

### 2.4. Bản thu âm & Đánh giá phát âm (Speech Assessment Data)
- Đoạn văn thoại học sinh đọc, điểm số thanh điệu (Tones score), tỷ lệ nhầm lẫn giữa thanh 2 (Dấu sắc) và thanh 3 (Dấu hỏi) như được thể hiện trong `AIAnalyticsPage.tsx`: "Tỷ lệ nhầm lẫn 28% khi luyện nói với Kippy".

---

## 3. THIẾT KẾ BẢNG LỊCH SỬ TƯƠNG TÁC & PHẢN HỒI CẤU TRÚC AI

### 3.1. Phiên hội thoại & Snapshot ngữ cảnh (`ai_tutor_conversations`)
- Mô hình AI cần giữ ngữ cảnh mà không làm phình to context window. Bảng này lưu trữ snapshot ngữ cảnh ban đầu:
  ```json
  {
    "source": "lesson",
    "hskLevel": 2,
    "lessonId": "les-8",
    "lessonTitle": "Bài 8: Bạn muốn uống trà hay cà phê?",
    "grammarPoints": ["câu chữ 比", "câu hỏi lựa chọn 还是"],
    "vocabularyWord": {
      "hanzi": "咖啡",
      "pinyin": "kāfēi",
      "meaning": "Cà phê"
    },
    "exerciseContext": {
      "exerciseId": "ex-102",
      "userAnswer": "我比他很忙",
      "correctAnswer": "我比他忙"
    }
  }
  ```

### 3.2. Cấu trúc phản hồi dạng khối (Structured Block Output) (`ai_tutor_messages`)
- Tránh trả về text thô không có cấu trúc. Phản hồi của AI được lưu dưới dạng JSONB `structured_response` khớp với TypeScript interface trong `features/ai-tutor/types.ts`:
  ```json
  {
    "type": "structured",
    "summary": "Phân tích cấu trúc câu chữ 比",
    "blocks": [
      {
        "type": "explanation",
        "title": "Quy tắc ngữ pháp",
        "content": "Trong câu chữ 比, phía sau tính từ tuyệt đối không dùng phó từ mức độ như 很, 非常, 太."
      },
      {
        "type": "correction",
        "originalSentence": "我比他很忙",
        "correctedSentence": "我比他忙",
        "pinyin": "Wǒ bǐ tā máng",
        "vietnamese": "Tôi bận hơn anh ấy",
        "explanation": "Bỏ phó từ 很 để câu văn chuẩn ngữ pháp."
      },
      {
        "type": "chinese_example",
        "hanzi": "他比我大两岁。",
        "pinyin": "Tā bǐ wǒ dà liǎng suì.",
        "vietnamese": "Anh ấy lớn hơn tôi hai tuổi."
      }
    ],
    "suggestedActions": ["Luyện tập 3 câu chữ 比", "Thêm từ 咖啡 vào Flashcard"]
  }
  ```

---

## 4. LƯU TRỮ VÀ CẬP NHẬT CHẨN ĐOÁN LỖ HỔNG KIẾN THỨC (WEAK KNOWLEDGE)

Bảng `user_weak_knowledge_points` hoạt động như một "Hồ sơ bệnh án học thuật" (Academic Diagnostic Profile):
1. **Thuật toán đánh giá độ thành thạo (`mastery_level`)**:
   - Nếu tỷ lệ đúng (`accuracy_rate`) < 60% qua tối thiểu 3 lượt làm: Đánh dấu `'WEAK'`.
   - Nếu học sinh luyện tập lại đạt tỷ lệ đúng từ 60% đến 85%: Đánh dấu `'RECOVERING'`.
   - Nếu đạt tỷ lệ đúng > 85% liên tục trong 5 bài tập: Đánh dấu `'MASTERED'`.
2. **Xu hướng (`trend`)**: So sánh tỷ lệ đúng của 3 bài tập gần nhất với 3 bài tập trước đó để xác định: `'improving'`, `'declining'`, `'stagnant'`.
3. **Đề xuất khắc phục tức thì (`suggested_route`)**: Cung cấp deep link (e.g. `'/grammar?focus=bi'`) để học sinh bấm vào là chuyển ngay tới bài giảng sửa lỗi.

---

## 5. CƠ CHẾ TRÁNH CHẠY LẠI MÔ HÌNH AI KHÔNG CẦN THIẾT (SEMANTIC CACHING & TOKEN OPTIMIZATION)

Chi phí API mô hình ngôn ngữ lớn (LLM) là một trong những khoản chi phí vận hành lớn nhất. Cơ chế tối ưu CSDL bao gồm:

### 5.1. Bảng lưu trữ Cache Prompt (`ai_prompt_cache`)
- Khi người dùng gửi một yêu cầu dạng giải thích ngữ pháp hoặc hỏi nghĩa từ vựng:
  1. Chuẩn hóa chuỗi đầu vào (lowercase, trim whitespace, sort context keys).
  2. Băm chuỗi thành mã SHA-256 làm `prompt_hash`.
  3. Truy vấn bảng `ai_prompt_cache` (hoặc tầng Redis):
     ```sql
     SELECT response_payload FROM ai_prompt_cache 
     WHERE prompt_hash = :hash AND expires_at > CURRENT_TIMESTAMP;
     ```
  4. Nếu tìm thấy (Cache Hit): Tăng `hit_count` lên 1 và trả về kết quả ngay lập tức mà **không tốn 1 token nào**!
  5. Nếu không thấy (Cache Miss): Gọi LLM, lưu kết quả vào bảng kèm TTL 7 ngày.

### 5.2. Kiểm soát hạn ngạch và ngăn chặn lạm dụng (Token Quota Enforcement)
- Trước khi thực thi bất kỳ tác vụ AI nào:
  ```sql
  SELECT tier, monthly_token_quota, tokens_consumed_month, 
         daily_tutor_msg_limit, tutor_msgs_sent_today 
  FROM ai_entitlements 
  WHERE user_id = :userId AND is_active = true;
  ```
- Nếu `tutor_msgs_sent_today >= daily_tutor_msg_limit` (ở tài khoản FREE): Từ chối xử lý, trả về mã lỗi `QUOTA_EXCEEDED` và gợi ý nâng cấp gói `STUDENT_PRO`.

---

## 6. QUY TRÌNH XỬ LÝ NỀN BẰNG BACKGROUND WORKER (ASYNC WORKFLOW)

Các tác vụ AI không được giữ kết nối HTTP mở quá lâu (tránh HTTP 504 Gateway Timeout):

```
+----------------------------------------------------------------------------------------------------+
| LUỒNG XỬ LÝ CHẤM BÀI VIẾT BẰNG AI (AI ESSAY GRADING WORKFLOW)                                     |
+----------------------------------------------------------------------------------------------------+
  1. Học sinh nộp bài văn chữ Hán (Client -> POST /api/v1/ai/grading/essay)
  2. Server lưu bản ghi vào `ai_writing_submissions` với trạng thái `PENDING`
  3. Server đẩy message `{ submissionId, userId, text, targetHsk }` vào hàng đợi RabbitMQ
  4. Server phản hồi ngay cho Client: HTTP 202 Accepted { submissionId }
  5. Background Worker lấy message từ queue -> Gọi LLM kèm Prompt Engineering phân tích chuyên sâu
  6. Worker cập nhật bản ghi trong `ai_writing_submissions`:
     - `score`, `estimated_hsk`, `grammar_fixes`, `vocab_upgrades`, `native_rewrite`, `general_feedback`
  7. Worker trừ hạn mức token trong `ai_entitlements` và ghi log vào `ai_task_logs`
  8. Worker gửi thông báo hoàn tất qua SignalR WebSocket đến Client
  9. Frontend tự động cập nhật kết quả rực rỡ trên giao diện mà không cần học sinh tải lại trang!
+----------------------------------------------------------------------------------------------------+
```
