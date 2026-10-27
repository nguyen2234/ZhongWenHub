# MÔ HÌNH THỰC THỂ DỮ LIỆU POSTGRESQL & EF CORE (POSTGRESQL DOMAIN MODEL)
**Dự án:** ZhongWenHub  
**Phiên bản:** v13.3 (FE-13.3 Readiness)  
**Công nghệ cơ sở dữ liệu:** PostgreSQL 16+, Npgsql.EntityFrameworkCore.PostgreSQL  
**Quy chuẩn kiến trúc:** Clean Architecture, Domain-Driven Design (DDD), Auditable Entities.

---

## 1. NGUYÊN TẮC THIẾT KẾ CƠ SỞ DỮ LIỆU POSTGRESQL

1. **Khóa chính (Primary Keys):**
   * Sử dụng kiểu `uuid` mặc định (`gen_random_uuid()` trong PostgreSQL) cho các bảng giao dịch phân tán và các bảng học liệu người dùng (Users, SupportTickets, ContentIssues, Videos).
   * Hoặc `bigint GENERATED ALWAYS AS IDENTITY` cho bảng tra cứu hoặc bảng log số lượng lớn (AuditLogs, AIUsageRecords).
2. **Thời gian (Timestamps):**
   * Tuyệt đối sử dụng `timestamptz` (timestamp with time zone) cho mọi trường lưu ngày giờ. Luôn lưu chuẩn UTC `+00:00`.
3. **Dữ liệu linh hoạt (JSONB):**
   * Sử dụng `jsonb` một cách thận trọng cho cấu trúc linh hoạt hoặc mở rộng có chọn lọc (ví dụ: `diff_payload`, `settings`, `metadata`, `transcripts`), không lạm dụng thay thế cho quan hệ thực thể quan hệ chuẩn hóa.
4. **Xóa mềm (Soft Delete):**
   * Áp dụng cờ `is_deleted boolean DEFAULT false` và `deleted_at timestamptz NULL` cho các thực thể người dùng và học liệu quan trọng (Users, Videos, Lessons).
5. **Đánh chỉ mục (Indexing Strategy):**
   * Đánh chỉ mục B-Tree trên các cột Foreign Key để tối ưu JOIN.
   * Tạo Composite Indexes cho các bộ lọc truy vấn thường xuyên (ví dụ: `(status, priority, created_at)` trên vé hỗ trợ; `(hsk_level, status)` trên video).
   * Chỉ mục Partial Index cho các bản ghi chưa xóa (`WHERE is_deleted = false`).

---

## 2. DANH MỤC THỰC THỂ MIỀN (DOMAIN ENTITIES)

### 2.1. Phân hệ Người dùng & Phân quyền (Identity & RBAC)

#### Bảng `users`
* `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
* `username`: `varchar(50) NOT NULL UNIQUE`
* `email`: `varchar(256) NOT NULL UNIQUE`
* `normalized_email`: `varchar(256) NOT NULL` (Index B-Tree)
* `password_hash`: `text NOT NULL`
* `display_name`: `varchar(100) NOT NULL`
* `avatar_url`: `text NULL`
* `status`: `varchar(30) NOT NULL DEFAULT 'ACTIVE'`
* `created_at`: `timestamptz NOT NULL DEFAULT clock_timestamp()`
* `updated_at`: `timestamptz NULL`
* `last_login_at`: `timestamptz NULL`
* `is_deleted`: `boolean NOT NULL DEFAULT false`
* `concurrency_stamp`: `varchar(64) NOT NULL DEFAULT gen_random_uuid()::text`

#### Bảng `roles`
* `id`: `varchar(50) PRIMARY KEY` (ví dụ: `SUPER_ADMIN`, `ADMIN`, `CONTENT_MANAGER`, `TEACHER`, `SUPPORT`, `STUDENT`)
* `name`: `varchar(100) NOT NULL`
* `description`: `text NULL`

#### Bảng `user_roles`
* `user_id`: `uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
* `role_id`: `varchar(50) NOT NULL REFERENCES roles(id) ON DELETE CASCADE`
* `assigned_at`: `timestamptz NOT NULL DEFAULT clock_timestamp()`
* `PRIMARY KEY (user_id, role_id)`

---

### 2.2. Phân hệ Chăm sóc Khách hàng & Hỗ trợ (Support Tickets)

#### Bảng `support_tickets`
* `id`: `varchar(50) PRIMARY KEY` (ví dụ: `TICK-2041`)
* `student_id`: `uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT`
* `student_name`: `varchar(100) NOT NULL`
* `student_email`: `varchar(256) NOT NULL`
* `subject`: `varchar(255) NOT NULL`
* `description`: `text NOT NULL`
* `category`: `varchar(50) NOT NULL` (`CONTENT`, `TECHNICAL`, `BILLING`, `ACCOUNT`, `OTHER`)
* `priority`: `varchar(20) NOT NULL` (`URGENT`, `HIGH`, `MEDIUM`, `LOW`)
* `status`: `varchar(30) NOT NULL DEFAULT 'NEW'` (`NEW`, `IN_PROGRESS`, `WAITING_STUDENT`, `RESOLVED`, `CLOSED`)
* `assignee_id`: `uuid NULL REFERENCES users(id) ON DELETE SET NULL`
* `assignee_name`: `varchar(100) NOT NULL DEFAULT 'Chưa phân công'`
* `sla_deadline`: `timestamptz NOT NULL`
* `is_overdue`: `boolean NOT NULL DEFAULT false`
* `content_issue_id`: `varchar(50) NULL` (Khóa ngoại logic liên kết với bảng `content_issues`)
* `created_at`: `timestamptz NOT NULL DEFAULT clock_timestamp()`
* `updated_at`: `timestamptz NOT NULL DEFAULT clock_timestamp()`
* **Indexes:**
  * `idx_support_tickets_status_priority_created`: `(status, priority, created_at DESC)`
  * `idx_support_tickets_student`: `(student_id)`
  * `idx_support_tickets_assignee`: `(assignee_id) WHERE assignee_id IS NOT NULL`
  * `idx_support_tickets_sla`: `(sla_deadline) WHERE status NOT IN ('RESOLVED', 'CLOSED')`

#### Bảng `support_ticket_notes`
* `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
* `ticket_id`: `varchar(50) NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE`
* `author_id`: `uuid NULL REFERENCES users(id) ON DELETE SET NULL`
* `author_name`: `varchar(100) NOT NULL`
* `content`: `text NOT NULL`
* `is_internal`: `boolean NOT NULL DEFAULT true`
* `created_at`: `timestamptz NOT NULL DEFAULT clock_timestamp()`
* **Index:** `idx_support_ticket_notes_ticket`: `(ticket_id, created_at ASC)`

#### Bảng `support_ticket_history`
* `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
* `ticket_id`: `varchar(50) NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE`
* `actor_name`: `varchar(100) NOT NULL`
* `actor_role`: `varchar(30) NOT NULL`
* `action`: `text NOT NULL`
* `timestamp`: `timestamptz NOT NULL DEFAULT clock_timestamp()`

---

### 2.3. Phân hệ Báo cáo Lỗi Học liệu (Content Issues)

#### Bảng `content_issues`
* `id`: `varchar(50) PRIMARY KEY` (ví dụ: `ISS-2026-001`)
* `target_content_id`: `varchar(100) NOT NULL`
* `target_content_type`: `varchar(50) NOT NULL` (`VOCABULARY`, `GRAMMAR`, `LESSON`, `EXERCISE`, `VIDEO`, `OTHER`)
* `target_content_title`: `varchar(255) NOT NULL`
* `target_content_route`: `varchar(255) NULL`
* `title`: `varchar(255) NOT NULL`
* `description`: `text NOT NULL`
* `issue_type`: `varchar(50) NOT NULL` (`TYPO`, `AUDIO_ERROR`, `TRANSLATION_WRONG`, `GRAMMAR_EXPLANATION`, `BROKEN_MEDIA`, `OTHER`)
* `priority`: `varchar(20) NOT NULL` (`URGENT`, `HIGH`, `MEDIUM`, `LOW`)
* `status`: `varchar(30) NOT NULL DEFAULT 'NEW'` (`NEW`, `TRIAGED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REOPENED`)
* `reported_by`: `varchar(150) NOT NULL`
* `support_staff_id`: `uuid NULL REFERENCES users(id) ON DELETE SET NULL`
* `support_staff_name`: `varchar(100) NOT NULL`
* `content_manager_id`: `uuid NULL REFERENCES users(id) ON DELETE SET NULL`
* `content_manager_name`: `varchar(100) NULL`
* `resolution_notes`: `text NULL`
* `feedback_to_support`: `text NULL`
* `resolution_version`: `integer NOT NULL DEFAULT 1`
* `is_overdue`: `boolean NOT NULL DEFAULT false`
* `created_at`: `timestamptz NOT NULL DEFAULT clock_timestamp()`
* `updated_at`: `timestamptz NOT NULL DEFAULT clock_timestamp()`
* `resolved_at`: `timestamptz NULL`
* `closed_at`: `timestamptz NULL`
* **Indexes:**
  * `idx_content_issues_status_priority`: `(status, priority, created_at DESC)`
  * `idx_content_issues_target`: `(target_content_type, target_content_id)`
  * `idx_content_issues_cm`: `(content_manager_id) WHERE content_manager_id IS NOT NULL`

---

### 2.4. Phân hệ Học liệu Video & Phụ đề Hội thoại (Video Management)

#### Bảng `content_videos`
* `id`: `varchar(50) PRIMARY KEY` (ví dụ: `VID-101`)
* `title`: `varchar(255) NOT NULL`
* `description`: `text NOT NULL`
* `hsk_level`: `smallint NOT NULL` (1 đến 6)
* `topic`: `varchar(100) NOT NULL`
* `duration_seconds`: `integer NOT NULL`
* `duration_formatted`: `varchar(20) NOT NULL` (ví dụ: `03:00`)
* `thumbnail_url`: `text NOT NULL`
* `video_url`: `text NOT NULL`
* `lesson_id`: `varchar(100) NULL`
* `lesson_title`: `varchar(255) NULL`
* `status`: `varchar(30) NOT NULL DEFAULT 'DRAFT'` (`DRAFT`, `REVIEW`, `PUBLISHED`, `ARCHIVED`)
* `tags`: `text[] NOT NULL DEFAULT '{}'` (PostgreSQL Native Text Array)
* `view_count`: `integer NOT NULL DEFAULT 0`
* `created_at`: `timestamptz NOT NULL DEFAULT clock_timestamp()`
* `updated_at`: `timestamptz NOT NULL DEFAULT clock_timestamp()`
* `is_deleted`: `boolean NOT NULL DEFAULT false`
* **Indexes:**
  * `idx_content_videos_hsk_status`: `(hsk_level, status) WHERE is_deleted = false`
  * `idx_content_videos_tags`: `USING GIN (tags)`

#### Bảng `video_transcripts`
* `id`: `varchar(50) PRIMARY KEY` (ví dụ: `ts-1`)
* `video_id`: `varchar(50) NOT NULL REFERENCES content_videos(id) ON DELETE CASCADE`
* `start_time`: `numeric(8, 3) NOT NULL`
* `end_time`: `numeric(8, 3) NOT NULL`
* `start_formatted`: `varchar(15) NOT NULL`
* `end_formatted`: `varchar(15) NOT NULL`
* `text_zh`: `text NOT NULL`
* `pinyin`: `text NOT NULL`
* `text_vi`: `text NOT NULL`
* `order_index`: `integer NOT NULL DEFAULT 0`
* **Index:** `idx_video_transcripts_video`: `(video_id, start_time ASC)`

---

## 3. KHUYẾN NGHỊ THIẾT KẾ ENTITY FRAMEWORK CORE (EF CORE GUIDELINES)

1. **Truy vấn Đọc (Read-Only Queries):**
   * Luôn sử dụng `.AsNoTracking()` cho các truy vấn GET hiển thị danh sách hoặc báo cáo.
2. **Tránh N+1 Queries:**
   * Sử dụng `.Include()` hoặc trực tiếp `.Select()` chiếu sang DTO (Projections) để chỉ nạp các cột cần thiết.
3. **Async / Await:**
   * 100% các phương thức truy cập cơ sở dữ liệu phải dùng `await dbContext.SaveChangesAsync(cancellationToken)`.
4. **Xử lý đồng thời (Optimistic Concurrency):**
   * Đặt thuộc tính `[Timestamp]` hoặc `.IsConcurrencyToken()` trên `concurrency_stamp` hoặc `updated_at` để bảo vệ cập nhật vé hỗ trợ và trạng thái duyệt video.
