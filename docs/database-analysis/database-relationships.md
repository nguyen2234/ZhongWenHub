# PHÂN TÍCH MỐI QUAN HỆ & SƠ ĐỒ ERD (ZHONGWENHUB)

> **Tài liệu**: Phân tích quan hệ liên kết dữ liệu, Ràng buộc toàn vẹn & Sơ đồ Thực thể - Mối quan hệ (ERD)  
> **Người thực hiện**: Senior Database Architect & System Analyst  
> **Căn cứ**: Đề xuất CSDL tại `database-tables.md` và mã nguồn Frontend `Fontend/src`

---

## 1. PHÂN LOẠI MỐI QUAN HỆ GIỮA CÁC THỰC THỂ

### 1.1. Mối quan hệ Một - Một (One-to-One: 1:1)
Mối quan hệ 1:1 được sử dụng để tách biệt các trường dữ liệu ít dùng hoặc mang tính chuyên môn hóa, giúp giữ cho bảng lõi `users` luôn gọn gàng và truy vấn nhanh:

| Thực thể A | Thực thể B | Khóa ngoại | Mục đích & Ràng buộc |
| :--- | :--- | :--- | :--- |
| `users` | `user_profiles` | `user_profiles.user_id` -> `users.id` | Hồ sơ mở rộng của học sinh (mã HV, mục tiêu HSK, cam kết học) |
| `users` | `teacher_profiles` | `teacher_profiles.user_id` -> `users.id` | Hồ sơ chuyên môn giảng dạy dành riêng cho tài khoản giáo viên |
| `users` | `user_settings` | `user_settings.user_id` -> `users.id` | Tùy biến giao diện (hiển thị Pinyin, Giản/Phồn thể, tốc độ âm thanh) |
| `users` | `user_stats` | `user_stats.user_id` -> `users.id` | Bảng tích lũy chỉ số tổng thể (Tổng XP, chuỗi ngày Streak) |
| `users` | `ai_entitlements` | `ai_entitlements.user_id` -> `users.id` | Hạn ngạch token AI và gói dịch vụ (Free/Pro) |
| `users` | `user_competency_scores`| `user_competency_scores.user_id` -> `users.id` | Điểm radar 6 kỹ năng phục vụ AI Analytics |
| `users` + `vocabularies` | `user_srs_states` | `(user_id, vocabulary_id)` | Trạng thái thuật toán SM-2/FSRS cho từng từ vựng của từng học sinh |

### 1.2. Mối quan hệ Một - Nhiều (One-to-Many: 1:N)
Chiếm phần lớn trong các luồng dữ liệu phân cấp và lịch sử hoạt động:

| Thực thể Cha (1) | Thực thể Con (N) | Khóa ngoại | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `hsk_levels` | `chinese_characters` | `chinese_characters.hsk_level_id` | Chữ Hán thuộc cấp độ HSK chuẩn |
| `hsk_levels` | `vocabularies` | `vocabularies.hsk_level_id` | Từ vựng thuộc cấp độ HSK chuẩn |
| `hsk_levels` | `grammar_points` | `grammar_points.hsk_level_id` | Điểm ngữ pháp phân theo cấp độ HSK |
| `courses` | `course_levels` | `course_levels.course_id` | Cấp độ thuộc khóa học tổng quát |
| `course_levels` | `units` | `units.course_level_id` | Chủ đề (Unit) thuộc một cấp độ khóa học |
| `units` | `lessons` | `lessons.unit_id` | Các bài học tuần tự trong một Unit |
| `lessons` | `lesson_dialogues` | `lesson_dialogues.lesson_id` | Đoạn hội thoại ngữ cảnh của bài học |
| `lesson_dialogues` | `dialogue_lines` | `dialogue_lines.dialogue_id` | Từng câu thoại của các nhân vật |
| `lessons` | `lesson_listenings` | `lesson_listenings.lesson_id` | Phần bài tập nghe trong bài học |
| `vocabularies` | `vocabulary_meanings` | `vocabulary_meanings.vocabulary_id` | Các nét nghĩa bổ sung của từ vựng |
| `vocabularies` | `vocabulary_examples` | `vocabulary_examples.vocabulary_id` | Các câu ví dụ mẫu của từ vựng |
| `grammar_points` | `grammar_examples` | `grammar_examples.grammar_point_id` | Các câu ví dụ và trường hợp lỗi sai |
| `question_bank` | `question_options` | `question_options.question_id` | Các phương án lựa chọn A, B, C, D |
| `question_bank` | `question_matching_pairs`| `question_matching_pairs.question_id` | Các cặp thẻ nối Hanzi - Meaning |
| `mock_exams` | `mock_exam_sections` | `mock_exam_sections.exam_id` | Các phần thi (Nghe, Đọc, Viết) |
| `mock_exam_sections`| `mock_exam_questions` | `mock_exam_questions.section_id` | Các câu hỏi trong từng phần thi |
| `teaching_classes` | `class_schedules` | `class_schedules.class_id` | Lịch học các ngày trong tuần của lớp |
| `teaching_classes` | `class_announcements` | `class_announcements.class_id` | Bảng tin thông báo của lớp học |
| `assignments` | `assignment_questions` | `assignment_questions.assignment_id` | Danh sách câu hỏi trong bài tập về nhà |
| `assignments` | `assignment_targets` | `assignment_targets.assignment_id` | Phân phối bài tập đến nhiều lớp học |
| `assignment_attempts`| `student_answers` | `student_answers.attempt_id` | Chi tiết câu trả lời cho từng câu hỏi |
| `videos` | `video_transcripts` | `video_transcripts.video_id` | Từng dòng phụ đề chạy theo timeline video |
| `video_transcripts` | `video_tokens` | `video_tokens.transcript_id` | Các từ vựng được tách trong câu phụ đề |
| `ai_tutor_conversations`| `ai_tutor_messages` | `ai_tutor_messages.conversation_id` | Lịch sử các lượt chat trong phiên AI |
| `support_tickets` | `ticket_notes` | `ticket_notes.ticket_id` | Ghi chú trao đổi trên phiếu hỗ trợ |
| `support_tickets` | `ticket_activities` | `ticket_activities.ticket_id` | Lịch sử xử lý ticket |
| `content_issues` | `content_issue_activities`| `content_issue_activities.issue_id` | Lịch sử xử lý lỗi nội dung |

### 1.3. Mối quan hệ Nhiều - Nhiều (Many-to-Many: N:N) & Bảng trung gian
Hệ thống sử dụng các bảng trung gian chuẩn hóa để kết nối N:N, đi kèm các thuộc tính bổ sung (Payload) trên mối quan hệ:

| Thực thể A | Thực thể B | Bảng trung gian | Các cột bổ sung trên bảng trung gian |
| :--- | :--- | :--- | :--- |
| `users` | `roles` | `user_roles` | Gán vai trò cho người dùng |
| `roles` | `permissions` | `role_permissions` | Gán quyền hạn chi tiết cho từng vai trò |
| `lessons` | `vocabularies` | `lesson_vocabularies` | `display_order`, `is_core_word`, `custom_example_zh/vi` |
| `lessons` | `grammar_points`| `lesson_grammars` | `display_order`, `lesson_notes` |
| `teaching_classes` | `users` (Học viên) | `class_members` | `enrolled_at`, `status`, `attendance_rate`, `notes` |
| `assignments` | `teaching_classes` | `assignment_targets` | `due_date`, `close_date` |
| `users` | `vocabularies` | `user_vocabulary_states` | `status`, `review_count`, `correct_count`, `next_review_at` |
| `users` | `achievements` | `user_achievements` | `progress_percent`, `is_unlocked`, `unlocked_at` |
| `users` | `videos` | `user_saved_videos` | `saved_at` (Bookmark video) |

---

## 2. MA TRẬN RÀNG BUỘC TOÀN VẸN DỮ LIỆU & QUY TẮC XÓA (ON DELETE)

Quy tắc xử lý xóa dữ liệu liên quan được thiết kế để bảo vệ tính toàn vẹn dữ liệu tài chính, học thuật và quyền riêng tư:

```
+-----------------------------------------------------------------------------------------------------+
| LOẠI QUY TẮC   | ĐỐI TƯỢNG ÁP DỤNG                                        | Ý NGHĨA BẢO VỆ          |
+-----------------------------------------------------------------------------------------------------+
| CASCADE        | Dữ liệu phụ thuộc nội tại của một thực thể cha:           | Xóa cha thì các thành   |
|                | - `lessons` -> `lesson_vocabularies`, `lesson_grammars`   | phần con đi kèm tự động |
|                | - `lesson_dialogues` -> `dialogue_lines`                  | được dọn sạch, không để |
|                | - `teaching_classes` -> `class_schedules`, `class_members`| lại rác dữ liệu mồ côi  |
|                | - `assignments` -> `assignment_questions`, `targets`      | (orphaned records).     |
|                | - `assignment_attempts` -> `student_answers`              |                         |
|                | - `support_tickets` -> `ticket_notes`, `activities`       |                         |
|                | - `ai_tutor_conversations` -> `ai_tutor_messages`         |                         |
+-----------------------------------------------------------------------------------------------------+
| RESTRICT /     | Dữ liệu tri thức cốt lõi và giao dịch lịch sử:            | Ngăn chặn xóa nhầm dữ   |
| NO ACTION      | - `vocabularies` đang được liên kết trong `lesson_vocab`  | liệu học thuật đang có  |
|                | - `grammar_points` đang được liên kết trong `lessons`     | người học tham chiếu.   |
|                | - `question_bank` đang được bài tập phát hành sử dụng     | Muốn xóa phải gỡ liên   |
|                | - `users` (Giáo viên) đang chủ nhiệm `teaching_classes`   | kết trước.              |
+-----------------------------------------------------------------------------------------------------+
| SET NULL       | Dữ liệu kiểm toán và người thực hiện:                     | Giữ lại lịch sử thao tác|
|                | - `auth_audit_records.user_id` khi User bị xóa vĩnh viễn  | để kiểm toán an ninh dù |
|                | - `support_tickets.assignee_id` khi Staff nghỉ việc       | tài khoản nhân sự đã bị |
|                | - `content_issues.support_staff_id` khi nhân viên bị xóa  | xóa khỏi hệ thống.      |
+-----------------------------------------------------------------------------------------------------+
| SOFT DELETE    | Thực thể cốt lõi người dùng:                              | Không bao giờ xóa vật   |
| (`is_deleted`) | - `users` (`is_deleted = true`, `deleted_at`)             | lý (Hard delete) để bảo |
|                |                                                           | toàn lịch sử học tập.   |
+-----------------------------------------------------------------------------------------------------+
```

---

## 3. SƠ ĐỒ THỰC THỂ - MỐI QUAN HỆ (MERMAID ERD)

### 3.1. Phân hệ 1: Người dùng, Phân quyền & Quản lý Giáo dục

```mermaid
erDiagram
    users ||--o| user_profiles : "has profile"
    users ||--o| teacher_profiles : "has professional info"
    users ||--o| user_settings : "has preferences"
    users ||--o| user_stats : "accumulates"
    users ||--o| ai_entitlements : "holds quota"
    users ||--o| user_competency_scores : "evaluated radar"
    users ||--o{ refresh_tokens : "authenticates"
    users ||--o{ auth_audit_records : "logs"

    users ||--o{ user_roles : "assigned"
    roles ||--o{ user_roles : "belongs to"
    roles ||--o{ role_permissions : "contains"
    permissions ||--o{ role_permissions : "granted to"

    users ||--o{ teaching_classes : "teaches"
    teaching_classes ||--o{ class_members : "enrolls"
    users ||--o{ class_members : "learns in"
    teaching_classes ||--o{ class_schedules : "scheduled at"
    teaching_classes ||--o{ class_announcements : "posts"

    users {
        uuid id PK
        string username UK
        string email UK
        string display_name
        string status
        boolean is_deleted
    }
    user_profiles {
        uuid user_id PK, FK
        string student_code UK
        smallint target_hsk_level
        smallint daily_goal_minutes
        int daily_goal_xp
    }
    teacher_profiles {
        uuid user_id PK, FK
        string teaching_status
        string qualifications
        smallint experience_years
    }
    teaching_classes {
        uuid id PK
        uuid teacher_id FK
        string code UK
        string name
        string status
        smallint capacity
    }
    class_members {
        uuid id PK
        uuid class_id FK
        uuid student_id FK
        string status
        numeric attendance_rate
    }
```

### 3.2. Phân hệ 2: Khung Chương trình HSK & Cấu trúc Bài học

```mermaid
erDiagram
    hsk_levels ||--o{ chinese_characters : "categorizes"
    hsk_levels ||--o{ vocabularies : "classifies"
    hsk_levels ||--o{ grammar_points : "standardizes"
    hsk_levels ||--o{ course_levels : "maps to"

    courses ||--o{ course_levels : "divides into"
    course_levels ||--o{ units : "contains"
    units ||--o{ lessons : "organizes"

    vocabularies ||--o{ vocabulary_meanings : "defines"
    vocabularies ||--o{ vocabulary_examples : "exemplifies"
    grammar_points ||--o{ grammar_examples : "demonstrates"

    lessons ||--o{ lesson_vocabularies : "links N:N"
    vocabularies ||--o{ lesson_vocabularies : "appears in"

    lessons ||--o{ lesson_grammars : "links N:N"
    grammar_points ||--o{ lesson_grammars : "taught in"

    lessons ||--o{ lesson_dialogues : "features"
    lesson_dialogues ||--o{ dialogue_lines : "composed of"
    lessons ||--o{ lesson_listenings : "trains"

    lessons {
        uuid id PK
        uuid unit_id FK
        smallint lesson_number
        string title_zh
        string title_vi
        smallint duration_minutes
        int xp_reward
        string status
    }
    vocabularies {
        uuid id PK
        string hanzi
        string pinyin
        string word_type
        string primary_meaning
        string hsk_level_id FK
    }
    grammar_points {
        uuid id PK
        string title
        string structure
        string category
        string hsk_level_id FK
    }
    lesson_vocabularies {
        uuid id PK
        uuid lesson_id FK
        uuid vocabulary_id FK
        smallint display_order
        boolean is_core_word
    }
    lesson_grammars {
        uuid id PK
        uuid lesson_id FK
        uuid grammar_point_id FK
        smallint display_order
    }
```

### 3.3. Phân hệ 3: Tiến độ Học sinh, Thuật toán SRS & Ngân hàng Bài tập

```mermaid
erDiagram
    users ||--o{ user_lesson_progress : "tracks"
    lessons ||--o{ user_lesson_progress : "completed by"

    users ||--o{ user_vocabulary_states : "memorizes"
    vocabularies ||--o{ user_vocabulary_states : "learned by"

    users ||--o{ user_srs_states : "schedules"
    vocabularies ||--o{ user_srs_states : "reviewed via"

    user_srs_states ||--o{ srs_review_logs : "records log"

    question_bank ||--o{ question_options : "has options"
    question_bank ||--o{ question_matching_pairs : "has pairs"
    users ||--o{ user_exercise_attempts : "answers"
    question_bank ||--o{ user_exercise_attempts : "evaluated on"

    user_lesson_progress {
        uuid id PK
        uuid user_id FK
        uuid lesson_id FK
        string status
        smallint current_step_index
        smallint quiz_score
        int xp_earned
    }
    user_vocabulary_states {
        uuid id PK
        uuid user_id FK
        uuid vocabulary_id FK
        string status
        int review_count
        timestamptz next_review_at
    }
    user_srs_states {
        uuid user_id PK, FK
        uuid vocabulary_id PK, FK
        numeric stability
        numeric difficulty
        numeric interval_days
        numeric ease_factor
    }
    question_bank {
        uuid id PK
        string exercise_type
        string title
        string hsk_level_id FK
        string skill_category
        text explanation
    }
```

### 3.4. Phân hệ 4: Bài tập Về nhà, Thi thử & Chấm điểm

```mermaid
erDiagram
    users ||--o{ assignments : "teacher creates"
    assignments ||--o{ assignment_targets : "assigned to"
    teaching_classes ||--o{ assignment_targets : "receives"

    assignments ||--o{ assignment_questions : "includes"
    question_bank ||--o{ assignment_questions : "source question"

    assignments ||--o{ assignment_attempts : "attempted via"
    users ||--o{ assignment_attempts : "student submits"
    assignment_attempts ||--o{ student_answers : "contains"
    assignment_questions ||--o{ student_answers : "answers question"

    mock_exams ||--o{ mock_exam_sections : "divided into"
    mock_exam_sections ||--o{ mock_exam_questions : "comprises"

    assignments {
        uuid id PK
        uuid teacher_id FK
        string title
        string status
        smallint time_limit_minutes
        smallint max_attempts
        numeric passing_points
    }
    assignment_questions {
        uuid id PK
        uuid assignment_id FK
        uuid question_bank_id FK
        smallint order_index
        numeric points
        jsonb question_snapshot
    }
    assignment_attempts {
        uuid id PK
        uuid assignment_id FK
        uuid student_id FK
        smallint attempt_number
        string status
        numeric total_score
        boolean is_passed
    }
    student_answers {
        uuid id PK
        uuid attempt_id FK
        uuid assignment_question_id FK
        text user_answer
        boolean is_correct
        numeric score_earned
    }
```

### 3.5. Phân hệ 5: Trợ lý AI, Video, Gamification & Hỗ trợ Kiểm duyệt

```mermaid
erDiagram
    users ||--o{ ai_tutor_conversations : "chats with"
    ai_tutor_conversations ||--o{ ai_tutor_messages : "records turns"
    users ||--o{ ai_writing_submissions : "submits essay"
    users ||--o{ user_weak_knowledge_points : "diagnosed"
    users ||--o{ learning_telemetry_events : "emits telemetry"

    videos ||--o{ video_transcripts : "synchronized"
    video_transcripts ||--o{ video_tokens : "tokenized"
    users ||--o{ user_saved_videos : "bookmarks"

    achievements ||--o{ user_achievements : "unlocked by"
    users ||--o{ user_achievements : "earns"
    users ||--o{ game_records : "plays"
    users ||--o{ user_daily_activities : "logs daily"

    users ||--o{ support_tickets : "files ticket"
    support_tickets ||--o{ ticket_notes : "annotated"
    support_tickets ||--o{ ticket_activities : "audited"
    support_tickets ||--o| content_issues : "escalates to"
    content_issues ||--o{ content_issue_activities : "resolved via"

    content_moderation_items ||--o{ content_version_snapshots : "snapshots"

    ai_tutor_conversations {
        uuid id PK
        uuid user_id FK
        string mode
        jsonb context_metadata
    }
    ai_tutor_messages {
        uuid id PK
        uuid conversation_id FK
        string role
        text content
        jsonb structured_response
        string feedback
    }
    user_weak_knowledge_points {
        uuid id PK
        uuid user_id FK
        string knowledge_point_id
        string topic_title
        numeric accuracy_rate
        string mastery_level
    }
    support_tickets {
        string id PK
        uuid student_id FK
        string subject
        string category
        string priority
        string status
        timestamptz sla_deadline
        string content_issue_id
    }
    content_issues {
        string id PK
        string target_content_id
        string target_content_type
        string issue_type
        string status
        uuid support_staff_id FK
        uuid content_manager_id FK
    }
```
