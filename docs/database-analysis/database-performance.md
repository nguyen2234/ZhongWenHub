# PHÂN TÍCH TỐI ƯU HIỆU SUẤT TRUY VẤN SQL & HỆ THỐNG CACHE (ZHONGWENHUB)

> **Tài liệu**: Đánh giá rủi ro hiệu năng, chiến lược Indexing, Caching Redis, Tác vụ Bất đồng bộ & Phân vùng dữ liệu  
> **Người thực hiện**: Senior Database Architect & System Analyst  
> **Nguyên tắc cốt lõi**: **"Không thiết kế theo hướng mỗi lần người dùng mở trang đều phải truy xuất toàn bộ dữ liệu SQL thô"**. Đảm bảo độ trễ phản hồi (P95 latency) dưới 100ms cho các API học tập.

---

## 1. ĐÁNH GIÁ CÁC TRANG CÓ NGUY CƠ TRUY VẤN NẶNG (HOTSPOTS)

Qua rà soát mã nguồn Frontend, phát hiện 5 màn hình có khối lượng dữ liệu lớn và tần suất tải cao nhất:

### 1.1. Học viên Dashboard (`/dashboard`)
- **Vấn đề**: Màn hình này cần hiển thị đồng thời: (1) Bài học đang học dở và % tiến độ; (2) Số lượng từ vựng đến hạn ôn hôm nay; (3) Chuỗi ngày Streak và tổng XP; (4) Lịch sử hoạt động 7 ngày gần nhất; (5) Tiến độ hoàn thành HSK 1 đến 6; (6) Từ vựng nổi bật trong ngày kèm âm thanh; (7) Video đề xuất.
- **Nguy cơ**: Nếu thực hiện bằng cách JOIN nhiều bảng (`lessons`, `user_lesson_progress`, `user_vocabulary_states`, `user_daily_activities`, `videos`) trên mỗi lượt tải trang sẽ gây sụp đổ Database khi có hàng chục ngàn học sinh cùng online vào các khung giờ cao điểm (19:00 - 22:00).
- **Giải pháp**:
  - Tách thành **Aggregated Summary Endpoint**: `GET /api/v1/student/dashboard-summary`.
  - Chỉ số tổng hợp (`xp_total`, `streak_days`, `last_activity_date`) đọc trực tiếp từ bảng denormalized `user_stats` (1 read duy nhất theo PK `user_id`).
  - Hàng đợi từ vựng đến hạn hôm nay: Đọc từ Redis Cache `user:{id}:srs_due_count`. Nếu cache miss, query bằng Partial Index:
    ```sql
    SELECT COUNT(*) FROM user_vocabulary_states 
    WHERE user_id = :userId AND next_review_at <= CURRENT_TIMESTAMP;
    ```
  - Biểu đồ tuần: Query phạm vi giới hạn chính xác 7 ngày:
    ```sql
    SELECT activity_date, minutes_spent, xp_earned, lessons_completed, reviews_completed 
    FROM user_daily_activities 
    WHERE user_id = :userId AND activity_date >= CURRENT_DATE - INTERVAL '6 days'
    ORDER BY activity_date ASC;
    ```

### 1.2. Giáo trình Chuẩn HSK Digital Textbook (`/lesson/:lessonId`)
- **Vấn đề**: Một bài học kỹ thuật số chứa 7 phân đoạn cấu trúc bài học độc lập: Intro, Vocabulary List, Grammar Points, Dialogue Lines, Listening Data, Exercises, Quiz.
- **Nguy cơ**: Trả về một JSON đồ sộ chứa toàn bộ dữ liệu sẽ làm chậm thời gian First Contentful Paint (FCP) trên thiết bị di động.
- **Giải pháp**:
  - Dữ liệu tĩnh của bài học (Lesson Content) được cache trên **Redis** theo key `content:lesson:{lessonId}` với TTL 24 giờ (vô hiệu hóa cache khi Content Manager xuất bản bản sửa đổi).
  - Phân tách API:
    - API 1: `GET /api/v1/lessons/{id}/metadata` (Tiêu đề, tóm tắt, danh sách bước để render khung sườn giao diện).
    - API 2: `GET /api/v1/lessons/{id}/progress` (Tiến độ riêng của học sinh từ `user_lesson_progress`).
    - API 3: Tải nội dung từng tab (Dialogue, Listening, Quiz) theo phương thức **Lazy Loading / Prefetching**.

### 1.3. Chi tiết Video & Phụ đề chạy đồng bộ (`/videos/:videoId`)
- **Vấn đề**: Video dài từ 5 - 15 phút có thể chứa từ 100 đến 300 câu phụ đề chạy theo timestamp (`video_transcripts`), mỗi câu lại chứa danh sách từ vựng bóc tách (`video_tokens`).
- **Nguy cơ**: Query `SELECT * FROM video_transcripts JOIN video_tokens` sinh ra hàng ngàn dòng dữ liệu trên mỗi lượt xem video.
- **Giải pháp**:
  - Phụ đề video là dữ liệu tĩnh đọc nhiều ghi ít: Đóng gói toàn bộ transcript thành một file JSON tĩnh được nén Brotli/Gzip và phục vụ qua **CDN** hoặc lưu trữ trường `transcripts_cache JSONB` ngay trên Redis `video:{id}:transcripts`.
  - Database SQL chỉ đảm nhận việc ghi nhận lượt xem (`view_count`) và nhật ký sự kiện học tập (`learning_telemetry_events`).

### 1.4. Quản lý người dùng Admin (`/management/admin/users`)
- **Vấn đề**: Bảng `users` kèm `learningSummary` (tổng XP, chuỗi ngày, bài hoàn thành, từ vựng đã thuộc, từ vựng cần ôn).
- **Nguy cơ N+1**: Với 20 người dùng trên 1 trang danh sách, nếu với mỗi người dùng lại chạy các câu query `COUNT(*)` từ vựng và bài học thì sẽ tốn `1 + 20 * 4 = 81` câu lệnh SQL!
- **Giải pháp**:
  - Tuyệt đối không chạy query tính toán động trong vòng lặp!
  - Sử dụng bảng chiếu `user_stats` và câu lệnh gom nhóm duy nhất với CTE (Common Table Expression) hoặc Window Function.

---

## 2. NHẬN DIỆN NGUY CƠ N+1 QUERY & GIẢI PHÁP TRIỆT ĐỂ

### 2.1. Tình huống 1: Lấy danh mục Cây Khung chương trình (Curriculum Tree)
- **Hành vi sai lầm**:
  - Query 1: Lấy danh sách CourseLevels (`SELECT * FROM course_levels WHERE course_id = ...`)
  - Vòng lặp N CourseLevels: Lấy danh sách Units (`SELECT * FROM units WHERE course_level_id = ...`)
  - Vòng lặp M Units: Lấy danh sách Lessons (`SELECT * FROM lessons WHERE unit_id = ...`)
  - Tổng số queries: `1 + N + N*M`.
- **Giải pháp**:
  - Thực hiện một câu lệnh SQL duy nhất kết hợp `LEFT JOIN` và gom nhóm `JSONB` hoặc sử dụng EF Core `.Include().ThenInclude()` với projection:
  ```sql
  SELECT 
      cl.id AS level_id, cl.name AS level_name,
      jsonb_agg(
          jsonb_build_object(
              'unit_id', u.id,
              'unit_number', u.unit_number,
              'title_vi', u.title_vi,
              'lessons', (
                  SELECT jsonb_agg(
                      jsonb_build_object(
                          'lesson_id', l.id,
                          'lesson_number', l.lesson_number,
                          'title_vi', l.title_vi,
                          'duration_minutes', l.duration_minutes,
                          'xp_reward', l.xp_reward,
                          'status', l.status
                      ) ORDER BY l.order_index
                  )
                  FROM lessons l WHERE l.unit_id = u.id
              )
          ) ORDER BY u.order_index
      ) AS units
  FROM course_levels cl
  LEFT JOIN units u ON u.course_level_id = cl.id
  WHERE cl.course_id = :courseId
  GROUP BY cl.id, cl.name, cl.order_index
  ORDER BY cl.order_index;
  ```

### 2.2. Tình huống 2: Trình làm bài tập học sinh (Assignment Runner)
- **Hành vi sai lầm**: Lấy bài tập -> Lặp từng câu hỏi -> Query riêng lẻ các phương án `question_options` và `question_matching_pairs`.
- **Giải pháp**:
  - Sử dụng trường **`question_snapshot JSONB`** đã được đóng gói sẵn trong bảng `assignment_questions` tại thời điểm giáo viên bấm xuất bản (Publish).
  - Khi học sinh tải phòng làm bài tập, Backend chỉ cần thực hiện 1 câu query duy nhất:
  ```sql
  SELECT aq.id, aq.order_index, aq.points, aq.question_snapshot
  FROM assignment_questions aq
  WHERE aq.assignment_id = :assignmentId
  ORDER BY aq.order_index ASC;
  ```
  - Backend lọc bỏ (sanitize) các trường `_correctOptionIndex`, `_correctSentence`, `explanation` từ JSON Snapshot trong bộ nhớ trước khi stream về client. **Zero Extra Queries!**

---

## 3. CHIẾN LƯỢC THIẾT KẾ INDEXING TỐI ƯU

Để đạt tốc độ truy xuất mili-giây, các loại Index chuyên biệt được áp dụng:

```
+---------------------------------------------------------------------------------------------------------+
| LOẠI INDEX       | BẢNG & CỘT ÁP DỤNG                                | LÝ DO KỸ THUẬT & TRUY VẤN MỤC TIÊU|
+---------------------------------------------------------------------------------------------------------+
| B-Tree Composite | `user_vocabulary_states(user_id, next_review_at)`  | Tối ưu query lấy hàng đợi SRS     |
| (Covering)       |                                                   | học sinh cần ôn hôm nay.          |
+---------------------------------------------------------------------------------------------------------+
| B-Tree Composite | `user_lesson_progress(user_id, status)`           | Lọc nhanh bài học hoàn thành hoặc |
|                  |                                                   | đang học dở của học viên.         |
+---------------------------------------------------------------------------------------------------------+
| Partial Index    | `support_tickets(sla_deadline)`                   | Chỉ đánh index trên các ticket    |
| (Chỉ mục một phần)| `WHERE status NOT IN ('RESOLVED', 'CLOSED')`      | ĐANG MỞ để phát hiện cảnh báo quá |
|                  |                                                   | hạn SLA mà không tốn dung lượng.  |
+---------------------------------------------------------------------------------------------------------+
| Partial Index    | `users(normalized_email)`                         | Đảm bảo tính duy nhất và tìm kiếm |
|                  | `WHERE is_deleted = false`                        | nhanh trên các tài khoản hợp lệ.  |
+---------------------------------------------------------------------------------------------------------+
| GIN Index        | `question_bank USING gin(sentence_tokens)`        | Tìm kiếm nhanh các câu bài tập có |
| (JSONB / FullText| `ai_tutor_messages USING gin(structured_response)`| chứa từ vựng hoặc cấu trúc cụ thể.|
|                  | `learning_telemetry_events USING gin(metadata)`   |                                   |
+---------------------------------------------------------------------------------------------------------+
| B-Tree Composite | `assignment_attempts(student_id, assignment_id,   | Lấy lịch sử lần thử gần nhất hoặc |
|                  | attempt_number DESC)`                             | điểm cao nhất của học sinh.       |
+---------------------------------------------------------------------------------------------------------+
| B-Tree Composite | `learning_telemetry_events(student_id,            | Quét chuỗi sự kiện học tập theo   |
|                  | timestamp DESC)`                                  | thời gian để chẩn đoán AI.        |
+---------------------------------------------------------------------------------------------------------+
```

---

## 4. CHIẾN LƯỢC PHÂN TRANG (PAGINATION)

Hệ thống triển khai 2 chiến lược phân trang rõ ràng theo chuẩn ASP.NET Core `PagedResponse<T>`:

### 4.1. Phân trang Offset (Offset-based Pagination)
- **Áp dụng cho**: Màn hình Quản trị Admin, Giáo viên, Content Manager (nơi có nhu cầu nhảy trang tùy ý: trang 1, 2, 5, 10).
- **Quy chuẩn**: Bắt buộc có `pageSize` tối đa là 50 (mặc định 20 items theo thiết kế `AdminUsersPage.tsx`).
- **Tối ưu**: Luôn đi kèm `ORDER BY` trên cột có Index (e.g. `created_at DESC` hoặc `id ASC`) để tránh thao tác sắp xếp tốn kém trên đĩa (Disk Spill).

### 4.2. Phân trang Keyset / Con trỏ (Cursor-based Pagination)
- **Áp dụng cho**:
  - Hàng đợi tin nhắn Trợ lý AI (`ai_tutor_messages`).
  - Dòng thời gian sự kiện học tập (`learning_telemetry_events`).
  - Sổ từ vựng cuộn vô tận trên Mobile (`VocabularyPage.tsx`).
- **Nguyên lý**: Sử dụng giá trị của dòng cuối cùng làm con trỏ:
  ```sql
  SELECT * FROM ai_tutor_messages 
  WHERE conversation_id = :conversationId AND created_at < :cursorTimestamp 
  ORDER BY created_at DESC 
  LIMIT 20;
  ```
  - **Lợi ích**: Tránh hiện tượng suy giảm hiệu năng khi `OFFSET` lớn (e.g. `OFFSET 50000`) và không bị trượt dòng khi có bản ghi mới chèn vào.

---

## 5. MÔ HÌNH BỘ NHỚ ĐỆM REDIS (REDIS CACHING ARCHITECTURE)

Redis đóng vai trò là tầng đệm bảo vệ cơ sở dữ liệu SQL khỏi các truy vấn đọc tần số cao:

```
[ FRONTEND CLIENT ]
        │
        ▼ (HTTPS / WSS)
[ ASP.NET CORE API GATEWAY ]
        │
        ├──▶ [ REDIS CLUSTER ] (RAM Cache)
        │       ├── Key 1: "content:lesson:{id}" ─────────── TTL: 24 Hours
        │       ├── Key 2: "user:{id}:srs_due_queue" ─────── TTL: 15 Mins
        │       ├── Key 3: "leaderboard:weekly:{year_week}" ─ Data Type: ZSET
        │       ├── Key 4: "user:{id}:permissions" ───────── TTL: 1 Hour
        │       └── Key 5: "ai:prompt_cache:{sha256}" ────── TTL: 7 Days
        │
        └──▶ [ POSTGRESQL PRIMARY ] (Persistent Storage)
```

### Chi tiết các cụm Cache chính:
1. **Curriculum & Lesson Cache (`content:lesson:{id}`)**: Lưu toàn bộ JSON bài học đã hydrate. Khi Content Manager duyệt bài hoặc sửa nội dung, gửi thông điệp Redis `PUBLISH content_invalidated lesson:{id}` để xóa cache tức thì.
2. **Weekly Leaderboard (`leaderboard:weekly:{year}:{week}`)**:
   - Sử dụng kiểu dữ liệu **Sorted Set (ZSET)** của Redis.
   - Khi học sinh hoàn thành bài học kiếm được 50 XP: `ZINCRBY leaderboard:weekly:2026:42 50 "student_uuid"`.
   - Lấy Top 10 bảng vàng thần tốc: `ZREVRANGEBYSCORE leaderboard:weekly:2026:42 +inf -inf WITHSCORES LIMIT 0 10`. Thời gian xử lý: **< 1 mili-giây**!
3. **User Permissions Cache (`user:{id}:roles_permissions`)**: Tránh query database phân quyền trên mỗi request API gửi kèm Bearer Token.

---

## 6. DỮ LIỆU THỜI GIAN THỰC (REALTIME STREAMS)

1. **Hội thoại AI Live giọng nói với Kippy (`AILivePage.tsx`)**:
   - Giao thức: **WebSocket (WSS)** hoặc WebRTC.
   - Luồng âm thanh và transcript stream 2 chiều trực tiếp trong bộ nhớ (In-memory audio streaming buffer), không ghi từng mili-giây vào SQL.
   - Chỉ khi kết thúc phiên nói chuyện (Speech turn / Session end), bản tóm tắt phiên và điểm đánh giá mới được lưu bất đồng bộ vào `ai_tutor_messages` và `learning_telemetry_events`.
2. **Cảnh báo Vi phạm SLA Ticket (`SupportDashboardPage.tsx`)**:
   - Sử dụng **SignalR Hub** trên ASP.NET Core để đẩy thông báo thời gian thực khi có ticket khẩn cấp mới (`priority = 'URGENT'`) hoặc sắp quá hạn SLA đến dashboard của nhân viên Support.

---

## 7. XỬ LÝ TÁC VỤ BẤT ĐỒNG BỘ (ASYNC BACKGROUND WORKERS)

Các tác vụ tốn thời gian tính toán và tài nguyên I/O được đẩy ra khỏi chu kỳ Request-Response của Web API:

```
[ Web Request ] ──▶ [ Push Job to RabbitMQ / Redis Queue ] ──▶ [ Response 202 Accepted ]
                                      │
                                      ▼
                        [ BACKGROUND WORKER POOL ]
                                      │
               ┌──────────────────────┼──────────────────────┐
               ▼                      ▼                      ▼
       [ Worker 1 ]              [ Worker 2 ]           [ Worker 3 ]
       AI Essay Grading          Telemetry Event        Weekly Snapshot
       & Grammar Correction      Processor & Radar      Leaderboard Consolidation
```

1. **Chấm bài viết tiếng Trung bằng AI (`AIGradingPage.tsx`)**:
   - Bài văn gửi lên được lưu trạng thái `PENDING` và đẩy vào hàng đợi xử lý.
   - Worker gọi mô hình LLM, phân tích ngữ pháp, sinh bản dịch chuẩn, lưu vào `ai_writing_submissions` và thông báo cho client qua WebSocket/Polling.
2. **Xử lý Telemetry học tập & Chẩn đoán điểm yếu (`AIAnalyticsPage.tsx`)**:
   - Hàng triệu sự kiện click, nghe, phát âm không được phân tích tức thời trong luồng chính.
   - Background Worker gom nhóm (Batch processing) mỗi 5 phút để tính toán lại tỷ lệ sai của từng chủ đề kiến thức và cập nhật bảng `user_weak_knowledge_points`.

---

## 8. CHIẾN LƯỢC PHÂN VÙNG DỮ LIỆU (DATABASE PARTITIONING) & LƯU TRỮ

Những bảng có nguy cơ tăng trưởng dữ liệu nóng (vượt ngưỡng 10 triệu bản ghi mỗi năm):
1. **`learning_telemetry_events`** (Sự kiện hành vi học tập).
2. **`user_exercise_attempts`** (Lượt làm bài tập).
3. **`srs_review_logs`** (Nhật ký ôn tập thẻ flashcard).
4. **`ai_task_logs`** (Log gọi AI).

### Chiến lược triển khai trên PostgreSQL:
- Áp dụng **Range Partitioning theo tháng (Monthly Partitioning)** trên cột thời gian:
  ```sql
  CREATE TABLE learning_telemetry_events (
      id UUID NOT NULL,
      student_id UUID NOT NULL,
      event_type VARCHAR(60) NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL,
      metadata JSONB,
      PRIMARY KEY (id, timestamp)
  ) PARTITION BY RANGE (timestamp);

  -- Phân vùng tháng 10/2026
  CREATE TABLE telemetry_events_2026_10 PARTITION OF learning_telemetry_events
      FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');
  ```
- **Chính sách lưu trữ (Data Retention & Cold Storage)**:
  - Dữ liệu sự kiện chi tiết trên 90 ngày: Chuyển phân vùng (Detach partition) sang kho dữ liệu phân tích lạnh (Data Lake / S3 / Parquet) hoặc nén lưu trữ (ZSTD storage) để giải phóng dung lượng cho cụm CSDL Transactional chính (OLTP).
