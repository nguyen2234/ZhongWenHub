# BÁO CÁO TỔNG HỢP THIẾT KẾ DATABASE SQL ĐỂ PHẢN BIỆN & TỐI ƯU HỆ THỐNG (ZHONGWENHUB)

> **Mục đích tài liệu**: Bộ hồ sơ kiến trúc hoàn chỉnh để gửi cho Senior AI / System Architect đánh giá, phản biện và tối ưu cấu trúc CSDL trước khi tiến hành xây dựng toàn diện tầng Backend & Database Migrations.  
> **Dự án**: ZhongWenHub - Nền tảng Học Tiếng Trung Trực tuyến & Quản trị Giáo dục Đa vai trò  
> **Công nghệ Backend mục tiêu**: ASP.NET Core 9 (C#), Entity Framework Core 9, PostgreSQL 16+ (hoặc SQL Server)  
> **Người lập hồ sơ**: Senior Fullstack Developer, Database Architect & System Analyst

---

## 1. TỔNG QUAN HỆ THỐNG & CÔNG NGHỆ FRONTEND

ZhongWenHub là hệ thống học tiếng Trung toàn diện kết hợp giữa **Giáo trình số Chuẩn HSK 1-6**, **Thuật toán ôn tập ngắt quãng (SRS Flashcard)**, **Quản lý lớp học & bài tập về nhà** và **Hệ sinh thái Trợ lý Trí tuệ Nhân tạo (AI Tutor, AI Live Voice, AI Essay Grading, AI Diagnostic Radar)**.

### Công nghệ Frontend đang vận hành:
- **Core**: React 19 (`react@19.2.8`), TypeScript 6, Vite 8.
- **Routing**: `react-router-dom@7.18.4` chia tách theo vai trò: `authRoutes`, `studentRoutes`, `managementRoutes` (Admin, Teacher, Content Manager, Support).
- **Styling**: Vanilla CSS Design System dựa trên hệ biến token CSS (`var(--...)`), tối ưu trải nghiệm tương tác (Micro-animations, Dark/Light modes, Responsive).
- **State Management**: Context-based Providers (`LearningStateProvider`, `AITutorProvider`, `VocabularyReviewProvider`).
- **Telemetry & Event Logging**: Tích hợp sẵn `learningEventStore` thu thập sự kiện tương tác học thuật theo thời gian thực.

---

## 2. ĐỐI CHIẾU VỚI BACKEND VÀ DATABASE HIỆN TẠI (CRITICAL AUDIT)

Kiểm tra trực tiếp mã nguồn thư mục `Backend/src`:
- **Kiến trúc Backend**: Clean Architecture gồm `ZhongWenHub.Domain`, `ZhongWenHub.Application`, `ZhongWenHub.Infrastructure`, `ZhongWenHub.Api`.
- **Hệ quản trị CSDL đang dùng**: PostgreSQL (`Npgsql.EntityFrameworkCore.PostgreSQL`) thông qua `ApplicationDbContext`.

### 2.1. Phân loại hiện trạng các bảng:
1. **Các bảng ĐÃ TỒN TẠI trong Database Backend**:
   - `users` (Kế thừa từ `ApplicationUser`)
   - `roles` (Kế thừa từ `ApplicationRole`)
   - `user_roles`, `user_claims`, `user_logins`, `role_claims`, `user_tokens` (ASP.NET Identity chuẩn)
   - `refresh_tokens` (Đã được cấu hình index và ánh xạ trong DbContext)
   - `auth_audit_records` (Đã được cấu hình index `idx_audit_records_user_id`, `idx_audit_records_created_at`)
2. **Các bảng CẦN ĐIỀU CHỈNH trong Backend hiện tại**:
   - Bảng `users`: Cần bổ sung thêm cột `lock_reason VARCHAR(255)` và `locked_at TIMESTAMPTZ` để phục vụ chức năng khóa tài khoản học viên/giáo viên từ giao diện Admin (`AdminUsersPage.tsx`).
3. **Các bảng CẦN BỔ SUNG MỚI (46 bảng nghiệp vụ)**:
   - Toàn bộ nhóm bảng Chuẩn HSK, Khung chương trình (Course, Unit, Lesson), Ngân hàng câu hỏi (Question Bank), Bài tập về nhà (Assignment), Lớp học (TeachingClass, ClassMember, ClassSchedule), Video học tập, Gamification (Achievement, Game), Phân hệ AI (AI Tutor, Writing Grading, Weak Knowledge), và Phân hệ Hỗ trợ/Kiểm duyệt (SupportTicket, ContentIssue, Moderation, VersionSnapshot).
4. **Các bảng có nguy cơ trùng lặp dữ liệu (Cần lưu ý)**:
   - Tuyệt đối **không** tạo bảng `lesson_content_backup` hoặc sao chép trường dữ liệu từ `vocabularies` vào `lessons`. Mọi liên kết từ vựng và ngữ pháp vào bài học đều phải thông qua bảng trung gian chuẩn hóa `lesson_vocabularies` và `lesson_grammars`.

---

## 3. DANH SÁCH TOÀN BỘ 55 BẢNG SQL ĐỀ XUẤT (THEO 10 NHÓM NGHIỆP VỤ)

| STT | Tên bảng SQL | Nhóm nghiệp vụ | Trạng thái | Cột khóa chính (PK) | Khóa ngoại chính (FK) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **I** | **QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN** | | | | |
| 1 | `users` | Người dùng & Xác thực | Bắt buộc (Đã có) | `id UUID` | - |
| 2 | `roles` | Phân quyền RBAC | Bắt buộc (Đã có) | `id UUID` | - |
| 3 | `user_roles` | Gán vai trò (N:N) | Bắt buộc (Đã có) | `(user_id, role_id)` | -> `users`, `roles` |
| 4 | `permissions` | Danh mục quyền theo 9 module | Bắt buộc (Tạo mới) | `id UUID` | - |
| 5 | `role_permissions` | Gán quyền cho vai trò (N:N) | Bắt buộc (Tạo mới) | `(role_id, permission_id)` | -> `roles`, `permissions` |
| 6 | `user_profiles` | Hồ sơ cá nhân học viên | Bắt buộc (Tạo mới) | `user_id UUID` | -> `users` |
| 7 | `teacher_profiles` | Hồ sơ chuyên môn giáo viên | Bắt buộc (Tạo mới) | `user_id UUID` | -> `users` |
| 8 | `user_settings` | Cài đặt hiển thị & giao diện | Bắt buộc (Tạo mới) | `user_id UUID` | -> `users` |
| 9 | `refresh_tokens` | Phiên làm việc JWT | Bắt buộc (Đã có) | `id UUID` | -> `users` |
| 10 | `auth_audit_records` | Nhật ký đăng nhập & an ninh | Bắt buộc (Đã có) | `id UUID` | -> `users` |
| **II** | **CHUẨN HSK & TRI THỨC NGÔN NGỮ GỐC** | | | | |
| 11 | `hsk_levels` | Danh mục cấp độ HSK 1-6 | Bắt buộc (Tạo mới) | `id VARCHAR(20)` | - |
| 12 | `chinese_characters` | Kho Hán tự chuẩn & Bộ thủ | Bắt buộc (Tạo mới) | `id UUID` | -> `hsk_levels` |
| 13 | `vocabularies` | Từ vựng chuẩn tiếng Trung | Bắt buộc (Tạo mới) | `id UUID` | -> `hsk_levels` |
| 14 | `vocabulary_meanings`| Các nét nghĩa bổ sung | Bắt buộc (Tạo mới) | `id UUID` | -> `vocabularies` |
| 15 | `vocabulary_examples`| Câu ví dụ mẫu song ngữ | Bắt buộc (Tạo mới) | `id UUID` | -> `vocabularies` |
| 16 | `grammar_points` | Điểm ngữ pháp chuẩn | Bắt buộc (Tạo mới) | `id UUID` | -> `hsk_levels` |
| 17 | `grammar_examples` | Câu ví dụ & lỗi sai ngữ pháp | Bắt buộc (Tạo mới) | `id UUID` | -> `grammar_points` |
| **III**| **KHUNG CHƯƠNG TRÌNH & BÀI HỌC (CURRICULUM)** | | | | |
| 18 | `courses` | Khóa học tổng quát | Bắt buộc (Tạo mới) | `id UUID` | - |
| 19 | `course_levels` | Cấp độ thuộc khóa học | Bắt buộc (Tạo mới) | `id UUID` | -> `courses`, `hsk_levels` |
| 20 | `units` | Chủ đề bài học lớn (Unit) | Bắt buộc (Tạo mới) | `id UUID` | -> `course_levels` |
| 21 | `lessons` | Bài học số chuẩn hóa (Lesson) | Bắt buộc (Tạo mới) | `id UUID` | -> `units` |
| 22 | `lesson_vocabularies`| Liên kết từ vựng vào bài học (N:N)| Bắt buộc (Tạo mới) | `id UUID` | -> `lessons`, `vocabularies` |
| 23 | `lesson_grammars` | Liên kết ngữ pháp vào bài học (N:N)| Bắt buộc (Tạo mới) | `id UUID` | -> `lessons`, `grammar_points` |
| 24 | `lesson_dialogues` | Đoạn hội thoại ngữ cảnh bài học | Bắt buộc (Tạo mới) | `id UUID` | -> `lessons` |
| 25 | `dialogue_lines` | Từng dòng câu thoại nhân vật | Bắt buộc (Tạo mới) | `id UUID` | -> `lesson_dialogues` |
| 26 | `lesson_listenings` | Bài tập luyện nghe trong bài | Bắt buộc (Tạo mới) | `id UUID` | -> `lessons` |
| **IV** | **NGÂN HÀNG CÂU HỎI & ĐỀ THI (QUESTION BANK & EXAMS)** | | | | |
| 27 | `question_bank` | Kho câu hỏi độc lập (10 dạng) | Bắt buộc (Tạo mới) | `id UUID` | -> `hsk_levels`, `grammar_points` |
| 28 | `question_options` | Phương án lựa chọn A, B, C, D | Bắt buộc (Tạo mới) | `id UUID` | -> `question_bank` |
| 29 | `question_matching_pairs`| Cặp thẻ nối Hanzi - Meaning | Bắt buộc (Tạo mới) | `id UUID` | -> `question_bank` |
| 30 | `mock_exams` | Đề thi thử HSK chuẩn hóa | Bắt buộc (Tạo mới) | `id UUID` | -> `hsk_levels` |
| 31 | `mock_exam_sections` | Các phần thi (Nghe, Đọc, Viết) | Bắt buộc (Tạo mới) | `id UUID` | -> `mock_exams` |
| 32 | `mock_exam_questions`| Câu hỏi trong đề thi thử | Bắt buộc (Tạo mới) | `id UUID` | -> `mock_exam_sections` |
| **V** | **TIẾN ĐỘ HỌC TẬP & THUẬT TOÁN SRS** | | | | |
| 33 | `user_lesson_progress`| Tiến độ từng bước bài học | Bắt buộc (Tạo mới) | `id UUID` | -> `users`, `lessons` |
| 34 | `user_vocabulary_states`| Trạng thái học từ vựng cá nhân | Bắt buộc (Tạo mới) | `id UUID` | -> `users`, `vocabularies` |
| 35 | `user_srs_states` | Tham số thuật toán SM-2/FSRS | Bắt buộc (Tạo mới) | `(user_id, vocabulary_id)`| -> `users`, `vocabularies` |
| 36 | `srs_review_logs` | Lịch sử đánh giá Flashcard | Bắt buộc (Tạo mới) | `id UUID` | -> `users`, `vocabularies` |
| 37 | `user_exercise_attempts`| Lượt trả lời bài tập của học sinh | Bắt buộc (Tạo mới) | `id UUID` | -> `users`, `question_bank` |
| **VI** | **LỚP HỌC & BÀI TẬP VỀ NHÀ (TEACHER & HOMEWORK)** | | | | |
| 38 | `teaching_classes` | Lớp học do giáo viên phụ trách | Bắt buộc (Tạo mới) | `id UUID` | -> `users`, `hsk_levels`, `courses` |
| 39 | `class_members` | Học viên ghi danh vào lớp (N:N)| Bắt buộc (Tạo mới) | `id UUID` | -> `teaching_classes`, `users` |
| 40 | `class_schedules` | Lịch học trong tuần của lớp | Bắt buộc (Tạo mới) | `id UUID` | -> `teaching_classes` |
| 41 | `class_announcements`| Bảng tin thông báo lớp học | Bắt buộc (Tạo mới) | `id UUID` | -> `teaching_classes`, `users` |
| 42 | `assignments` | Bài tập về nhà do giáo viên tạo | Bắt buộc (Tạo mới) | `id UUID` | -> `users`, `hsk_levels` |
| 43 | `assignment_targets` | Phân phối bài tập đến từng lớp | Bắt buộc (Tạo mới) | `id UUID` | -> `assignments`, `teaching_classes` |
| 44 | `assignment_questions`| Câu hỏi kèm Snapshot bất biến | Bắt buộc (Tạo mới) | `id UUID` | -> `assignments`, `question_bank` |
| 45 | `assignment_attempts` | Lượt nộp bài tập của học viên | Bắt buộc (Tạo mới) | `id UUID` | -> `assignments`, `teaching_classes`, `users` |
| 46 | `student_answers` | Đáp án học sinh cho từng câu | Bắt buộc (Tạo mới) | `id UUID` | -> `assignment_attempts`, `assignment_questions` |
| **VII**| **VIDEO HỌC TẬP & ĐA PHƯƠNG TIỆN** | | | | |
| 47 | `videos` | Video bài giảng & phụ đề | Bắt buộc (Tạo mới) | `id UUID` | -> `hsk_levels`, `lessons` |
| 48 | `video_tags` | Thẻ tag video | Bắt buộc (Tạo mới) | `(video_id, tag)` | -> `videos` |
| 49 | `video_transcripts` | Phụ đề chạy theo timeline | Bắt buộc (Tạo mới) | `id UUID` | -> `videos` |
| 50 | `video_tokens` | Từ vựng tách sẵn trong phụ đề | Tùy chọn (Tạo mới)| `id UUID` | -> `video_transcripts`, `vocabularies` |
| 51 | `user_saved_videos` | Bookmark video yêu thích | Bắt buộc (Tạo mới) | `(user_id, video_id)` | -> `users`, `videos` |
| **VIII**| **GAMIFICATION & BẢNG XẾP HẠNG** | | | | |
| 52 | `user_stats` | Tổng tích lũy XP & chuỗi Streak | Bắt buộc (Tạo mới) | `user_id UUID` | -> `users` |
| 53 | `user_daily_activities`| Hoạt động theo từng ngày | Bắt buộc (Tạo mới) | `id UUID` | -> `users` |
| 54 | `achievements` | Danh mục huy hiệu danh giá | Bắt buộc (Tạo mới) | `id VARCHAR(50)` | - |
| 55 | `user_achievements` | Huy hiệu học viên đã mở khóa | Bắt buộc (Tạo mới) | `id UUID` | -> `users`, `achievements` |
| 56 | `game_records` | Điểm kỷ lục mini-game ghép thẻ | Bắt buộc (Tạo mới) | `id UUID` | -> `users` |
| 57 | `weekly_leaderboard_snapshots`| Snapshot bảng xếp hạng tuần | Tùy chọn (Tạo mới)| `id UUID` | -> `users` |
| **IX** | **TRÍ TUỆ NHÂN TẠO (AI) & CÁ NHÂN HÓA** | | | | |
| 58 | `ai_tutor_conversations`| Phiên hội thoại Trợ lý AI | Bắt buộc (Tạo mới) | `id UUID` | -> `users` |
| 59 | `ai_tutor_messages` | Khối tin nhắn phản hồi AI | Bắt buộc (Tạo mới) | `id UUID` | -> `ai_tutor_conversations` |
| 60 | `ai_writing_submissions`| Bài luận nộp cho AI chấm điểm | Bắt buộc (Tạo mới) | `id UUID` | -> `users` |
| 61 | `user_weak_knowledge_points`| Chẩn đoán lỗ hổng kiến thức | Bắt buộc (Tạo mới) | `id UUID` | -> `users` |
| 62 | `user_competency_scores`| Điểm số Radar 6 kỹ năng cốt lõi | Bắt buộc (Tạo mới) | `user_id UUID` | -> `users` |
| 63 | `ai_entitlements` | Định mức Token & Hạn ngạch gói | Bắt buộc (Tạo mới) | `user_id UUID` | -> `users` |
| 64 | `ai_task_logs` | Log kiểm toán gọi mô hình LLM | Bắt buộc (Tạo mới) | `id UUID` | -> `users` |
| 65 | `ai_prompt_cache` | Cache phản hồi LLM theo Hash | Tùy chọn (Tạo mới)| `prompt_hash` | - |
| 66 | `learning_telemetry_events`| Nhật ký sự kiện hành vi học tập| Bắt buộc (Tạo mới) | `id UUID` | -> `users` |
| **X** | **HỖ TRỢ HỌC VIÊN & KIỂM DUYỆT HỌC LIỆU** | | | | |
| 67 | `support_tickets` | Phiếu yêu cầu trợ giúp học viên | Bắt buộc (Tạo mới) | `id VARCHAR(30)` | -> `users` (student & assignee) |
| 68 | `ticket_notes` | Ghi chú trao đổi trên phiếu | Bắt buộc (Tạo mới) | `id UUID` | -> `support_tickets`, `users` |
| 69 | `ticket_activities` | Lịch sử luân chuyển ticket | Bắt buộc (Tạo mới) | `id UUID` | -> `support_tickets`, `users` |
| 70 | `content_issues` | Báo cáo lỗi nội dung học thuật | Bắt buộc (Tạo mới) | `id VARCHAR(30)` | -> `users` (support & content_mgr) |
| 71 | `content_issue_activities`| Lịch sử xử lý lỗi nội dung | Bắt buộc (Tạo mới) | `id UUID` | -> `content_issues`, `users` |
| 72 | `content_moderation_items`| Hàng đợi kiểm duyệt bài học | Bắt buộc (Tạo mới) | `id UUID` | -> `users`, `hsk_levels` |
| 73 | `content_version_snapshots`| Bản sao lưu phiên bản để Rollback| Bắt buộc (Tạo mới) | `id UUID` | -> `users` |

*(Lưu ý: Bảng tổng hợp đã chi tiết hóa toàn bộ các bảng quan hệ 1:N và bảng trung gian chuẩn hóa, nâng tổng số lên 73 bảng bao quát toàn bộ ngóc ngách của hệ thống).*

---

## 4. TOP CÁC TRUY VẤN SQL QUAN TRỌNG NHẤT (CRITICAL QUERIES)

### 4.1. Truy vấn lấy Hàng đợi Flashcard SRS cần ôn hôm nay
```sql
-- P95 Latency mục tiêu: < 15ms
SELECT 
    v.id AS vocabulary_id,
    v.hanzi,
    v.pinyin,
    v.primary_meaning,
    v.word_type,
    v.audio_url,
    s.stability,
    s.difficulty,
    s.interval_days,
    s.repetitions,
    s.ease_factor
FROM user_vocabulary_states uvs
JOIN vocabularies v ON v.id = uvs.vocabulary_id
JOIN user_srs_states s ON s.user_id = uvs.user_id AND s.vocabulary_id = uvs.vocabulary_id
WHERE uvs.user_id = :userId 
  AND uvs.next_review_at <= CURRENT_TIMESTAMP
ORDER BY uvs.next_review_at ASC
LIMIT :batchSize;
```
*Index hỗ trợ*: `idx_uvs_due_today ON user_vocabulary_states(user_id, next_review_at)`.

### 4.2. Truy vấn phòng làm bài tập đã làm sạch (Sanitized Assignment Runner)
```sql
-- Đảm bảo KHÔNG lộ đáp án trước khi hết hạn
SELECT 
    aq.id,
    aq.order_index,
    aq.points,
    aq.question_snapshot - '_correctOptionIndex' - '_correctSentence' - 'explanation' AS sanitized_question
FROM assignment_questions aq
WHERE aq.assignment_id = :assignmentId
ORDER BY aq.order_index ASC;
```

### 4.3. Truy vấn tổng hợp Dashboard học sinh (Single Aggregation Read)
```sql
SELECT 
    us.xp_total,
    us.streak_days,
    us.last_activity_date,
    (SELECT COUNT(*) FROM user_vocabulary_states WHERE user_id = :userId AND next_review_at <= CURRENT_TIMESTAMP) AS due_vocab_count,
    (
        SELECT jsonb_build_object(
            'lesson_id', l.id,
            'title_vi', l.title_vi,
            'current_step', ulp.current_step_index,
            'status', ulp.status
        )
        FROM user_lesson_progress ulp
        JOIN lessons l ON l.id = ulp.lesson_id
        WHERE ulp.user_id = :userId AND ulp.status = 'IN_PROGRESS'
        ORDER BY ulp.updated_at DESC
        LIMIT 1
    ) AS current_lesson
FROM user_stats us
WHERE us.user_id = :userId;
```

---

## 5. NHỮNG VẤN ĐỀ HIỆU SUẤT TIỀM ẨN & GIẢI PHÁP TỔNG THỂ

1. **Vấn đề bùng nổ bản ghi Telemetry (`learning_telemetry_events`)**:
   - *Nguy cơ*: Học sinh học bài, nghe audio, dừng video sẽ sinh ra hàng chục triệu events sau vài tháng.
   - *Giải pháp*: Bắt buộc áp dụng **Range Partitioning theo tháng (Monthly Partition)** trên PostgreSQL. Sự kiện trên 90 ngày được export sang Cold Storage (Parquet trên S3).
2. **Vấn đề N+1 khi hiển thị danh sách lớp và sĩ số**:
   - *Nguy cơ*: Lấy 10 lớp học -> Lặp 10 lần đếm `COUNT(class_members)` để hiển thị sĩ số.
   - *Giải pháp*: Tính toán bằng CTE gom nhóm 1 lần duy nhất hoặc lưu cache sĩ số trên Redis `class:{id}:active_count`.
3. **Vấn đề nghẽn cổ chai khi học sinh đồng loạt nộp bài thi thử**:
   - *Nguy cơ*: Hàng ngàn học sinh cùng nộp bài một lúc gây lock bảng `student_answers` và `assignment_attempts`.
   - *Giải pháp*: Nộp bài theo cơ chế **Bulk Insert (Copy Batch)**, xử lý chấm điểm bằng **Background Worker** qua hàng đợi RabbitMQ, trả về kết quả qua SignalR WebSocket.

---

## 6. ĐỀ XUẤT CẤU TRÚC REDIS CACHING

```
Key Pattern                               | Kiểu dữ liệu | TTL      | Mục đích
------------------------------------------+--------------+----------+--------------------------------------
content:lesson:{lessonId}                 | String(JSON) | 24 Hours | Cache toàn bộ nội dung tĩnh bài học
content:curriculum:tree                   | String(JSON) | 24 Hours | Cây khung chương trình khóa học
user:{userId}:srs_due_count               | String(Int)  | 15 Mins  | Số lượng từ vựng cần ôn hôm nay
leaderboard:weekly:{year}:{week}          | ZSET         | 7 Days   | Bảng xếp hạng tuần (Realtime score)
ai:prompt_cache:{sha256}                  | String(JSON) | 7 Days   | Cache câu trả lời giải thích của AI
user:{userId}:auth_permissions            | Set(String)  | 1 Hour   | Danh sách quyền hạn phục vụ Authz
```

---

## 7. CÁC QUYẾT ĐỊNH THIẾT KẾ CẦN AI KHÁC ĐÁNH GIÁ & PHẢN BIỆN (PEER REVIEW TOPICS)

Kính đề nghị Senior AI / System Architect đối tác xem xét và phản biện sâu 5 quyết định kiến trúc sau:

1. **Lưu trữ Snapshot câu hỏi trong `assignment_questions.question_snapshot` dạng JSONB**:
   - *Ưu điểm*: Bất biến (Immutable), không bị ảnh hưởng khi ngân hàng câu hỏi bị biên tập lại, tốc độ truy xuất cực nhanh.
   - *Cần phản biện*: Dung lượng lưu trữ JSONB có bị phình to nếu số lượng bài tập lên đến hàng trăm ngàn bài? Có nên tách thành bảng quan hệ riêng hay giữ nguyên JSONB?
2. **Thiết kế phân tách giữa `vocabularies` và `chinese_characters`**:
   - *Lý do*: Một chữ Hán đơn (Character) có bộ thủ, số nét, âm Hán Việt riêng; còn một từ vựng (Vocabulary) có thể là từ ghép (2-4 chữ Hán) với nét nghĩa hoàn toàn mới.
   - *Cần phản biện*: Liệu có cần bảng trung gian `vocabulary_characters` để liên kết từ vựng với các chữ Hán cấu thành hay việc tra cứu qua hàm cắt chuỗi đã đủ đáp ứng?
3. **Cơ chế phân vùng `learning_telemetry_events`**:
   - *Cần phản biện*: Nên phân vùng theo Tháng (Monthly Partition) ngay trong PostgreSQL hay nên chuyển hẳn phần Telemetry này sang một cơ sở dữ liệu chuyên dụng dạng Time-series / NoSQL (như ClickHouse, TimescaleDB hoặc MongoDB)?
4. **Denormalization trên bảng `user_stats`**:
   - *Lý do*: Tránh quét hàng triệu dòng `user_daily_activities` và `user_lesson_progress` trên mỗi lượt mở Dashboard.
   - *Cần phản biện*: Cơ chế đồng bộ (Reconciliation) dữ liệu giữa bảng giao dịch và bảng denormalized nên dùng Database Trigger, EF Core Interceptor hay Scheduled Background Job?
5. **Cơ chế gán nhãn `is_core_word` trong `lesson_vocabularies`**:
   - *Lý do*: Giúp hệ thống lọc ra các từ vựng bắt buộc phải thuộc trong bài học, phục vụ việc phân loại SRS ưu tiên cho học viên yếu.

---

## 8. DANH MỤC CÁC TÀI LIỆU CHI TIẾT TRONG BỘ BÁO CÁO

Bộ tài liệu thiết kế CSDL hoàn chỉnh được lưu trữ tại thư mục `docs/database-analysis/`:
1. **[frontend-analysis.md](file:///d:/ZhongWenHub/docs/database-analysis/frontend-analysis.md)**: Phân tích toàn bộ 58 chức năng chi tiết, components, modals, forms và luồng dữ liệu FE.
2. **[database-tables.md](file:///d:/ZhongWenHub/docs/database-analysis/database-tables.md)**: Bảng đặc tả chi tiết 55+ bảng SQL, kiểu dữ liệu, ràng buộc PK/FK, chỉ mục Index, căn cứ FE và phân loại Bắt buộc / Tùy chọn.
3. **[database-relationships.md](file:///d:/ZhongWenHub/docs/database-analysis/database-relationships.md)**: Ma trận quan hệ 1:1, 1:N, N:N, quy tắc toàn vẹn ON DELETE và 5 biểu đồ Mermaid ERD chi tiết.
4. **[database-performance.md](file:///d:/ZhongWenHub/docs/database-analysis/database-performance.md)**: Đánh giá 10 bài toán hiệu năng, kỹ thuật triệt tiêu N+1, Indexing, Keyset Pagination, Redis Caching, SignalR Realtime và Table Partitioning.
5. **[ai-personalization.md](file:///d:/ZhongWenHub/docs/database-analysis/ai-personalization.md)**: Cấu trúc dữ liệu phục vụ AI, Telemetry events, chẩn đoán lỗ hổng kiến thức, cơ chế Prompt Caching và Token Quota.
6. **[database-review.md](file:///d:/ZhongWenHub/docs/database-analysis/database-review.md)**: Báo cáo tổng hợp trung tâm dành cho Senior AI phản biện và tối ưu hệ thống.
