# ĐỀ XUẤT CẤU TRÚC DATABASE SQL CHI TIẾT (ZHONGWENHUB)

> **Hệ quản trị CSDL đề xuất**: PostgreSQL 16+ (hoặc tương thích SQL Server / Cloud Relational Database)  
> **Quy ước đặt tên**: Bảng và cột sử dụng `snake_case`, Khóa chính chuẩn `id UUID DEFAULT gen_random_uuid()`, Thời gian sử dụng `TIMESTAMPTZ`.  
> **Chuẩn hóa**: Tối thiểu 3NF; chỉ áp dụng Denormalization có kiểm soát tại các điểm tối ưu hiệu suất truy vấn.  
> **Căn cứ**: Trích xuất trực tiếp từ TypeScript interfaces, mock services và components trong `Fontend/src`.

---

## MỤC LỤC CÁC NHÓM BẢNG

1. [NHÓM 1: QUẢN LÝ NGƯỜI DÙNG, XÁC THỰC & PHÂN QUYỀN (RBAC)](#nhom-1)
2. [NHÓM 2: CHUẨN HSK & KHO KIẾN THỨC NGÔN NGỮ GỐC](#nhom-2)
3. [NHÓM 3: KHUNG CHƯƠNG TRÌNH & CẤU TRÚC BÀI HỌC (CURRICULUM & LESSONS)](#nhom-3)
4. [NHÓM 4: NGÂN HÀNG CÂU HỎI & ĐỀ THI CHUẨN HÓA (QUESTION BANK & EXAMS)](#nhom-4)
5. [NHÓM 5: TIẾN ĐỘ HỌC TẬP & THUẬT TOÁN GIÃN CÁCH (SRS ENGINE)](#nhom-5)
6. [NHÓM 6: KHÔNG GIAN LỚP HỌC & BÀI TẬP VỀ NHÀ (TEACHING & ASSIGNMENTS)](#nhom-6)
7. [NHÓM 7: VIDEO HỌC TẬP & ĐA PHƯƠNG TIỆN TƯƠNG TÁC](#nhom-7)
8. [NHÓM 8: GAMIFICATION, BẢNG XẾP HẠNG & NHẬT KÝ HOẠT ĐỘNG](#nhom-8)
9. [NHÓM 9: TRÍ TUỆ NHÂN TẠO (AI), CHẨN ĐOÁN & ĐỊNH MỨC TOKEN](#nhom-9)
10. [NHÓM 10: HỖ TRỢ KHÁCH HÀNG, KIỂM DUYỆT & LỊCH SỬ PHIÊN BẢN (AUDIT)](#nhom-10)

---

<a name="nhom-1"></a>
## NHÓM 1: QUẢN LÝ NGƯỜI DÙNG, XÁC THỰC & PHÂN QUYỀN (RBAC)

### 1.1. Bảng `users` (Bắt buộc - Hiện đã có trong Backend)
- **Mục đích**: Lưu trữ thông tin tài khoản cốt lõi của người dùng toàn hệ thống.
- **Căn cứ FE / Backend**: `Fontend/src/types/api/auth.dto.ts`, `Backend/.../Identity/ApplicationUser.cs`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` | Khóa chính |
  | `username` | VARCHAR(100) | NOT NULL, UNIQUE | | Tên đăng nhập |
  | `email` | VARCHAR(256) | NOT NULL, UNIQUE | | Email liên lạc & xác thực |
  | `normalized_email` | VARCHAR(256) | NOT NULL, UNIQUE | | Email viết hoa phục vụ tìm kiếm nhanh |
  | `password_hash` | TEXT | NOT NULL | | Mật khẩu đã hash (Argon2 / PBKDF2) |
  | `security_stamp` | VARCHAR(128) | NOT NULL | | Chuỗi dấu hiệu bảo mật |
  | `display_name` | VARCHAR(100) | NOT NULL | | Tên hiển thị người dùng |
  | `status` | VARCHAR(30) | NOT NULL | `'ACTIVE'` | `ACTIVE`, `INACTIVE`, `LOCKED`, `PENDING_VERIFICATION` |
  | `lock_reason` | VARCHAR(255) | NULL | NULL | Lý do khóa tài khoản |
  | `locked_at` | TIMESTAMPTZ | NULL | NULL | Thời điểm khóa tài khoản |
  | `created_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | Thời điểm tạo |
  | `updated_at` | TIMESTAMPTZ | NULL | NULL | Thời điểm cập nhật |
  | `last_login_at` | TIMESTAMPTZ | NULL | NULL | Thời điểm đăng nhập gần nhất |
  | `is_deleted` | BOOLEAN | NOT NULL | `FALSE` | Đánh dấu xóa mềm (Soft delete) |
  | `deleted_at` | TIMESTAMPTZ | NULL | NULL | Thời điểm xóa mềm |
- **Indexes**:
  - `CREATE UNIQUE INDEX idx_users_username ON users(username) WHERE is_deleted = false;`
  - `CREATE UNIQUE INDEX idx_users_email ON users(normalized_email) WHERE is_deleted = false;`
  - `CREATE INDEX idx_users_status ON users(status);`

### 1.2. Bảng `roles` (Bắt buộc - Hiện đã có trong Backend)
- **Mục đích**: Lưu danh mục vai trò hệ thống (`STUDENT`, `TEACHER`, `CONTENT_MANAGER`, `SUPPORT`, `ADMIN`).
- **Căn cứ FE**: `Fontend/src/types/roles.ts`, `Fontend/src/management/admin/roles/types/role-permission.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` | Khóa chính |
  | `name` | VARCHAR(50) | NOT NULL, UNIQUE | | Tên vai trò e.g. `ADMIN` |
  | `normalized_name` | VARCHAR(50) | NOT NULL, UNIQUE | | Tên vai trò chuẩn hóa |
  | `description` | VARCHAR(255) | NULL | NULL | Mô tả chi tiết vai trò |
  | `is_system_role` | BOOLEAN | NOT NULL | `TRUE` | Vai trò hệ thống không được xóa |
  | `created_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | Thời điểm tạo |
  | `updated_at` | TIMESTAMPTZ | NULL | NULL | Thời điểm cập nhật |

### 1.3. Bảng `user_roles` (Bắt buộc - Hiện đã có trong Backend)
- **Mục đích**: Bảng trung gian gán vai trò cho người dùng (N:N).
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `user_id` | UUID | PK, FK -> `users(id)` ON DELETE CASCADE | ID người dùng |
  | `role_id` | UUID | PK, FK -> `roles(id)` ON DELETE CASCADE | ID vai trò |
- **Indexes**:
  - `CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);`

### 1.4. Bảng `permissions` (Bắt buộc - Đề xuất bổ sung để hỗ trợ `AdminRolesPage`)
- **Mục đích**: Lưu danh sách quyền hạn chi tiết theo 9 module (`USER_MANAGEMENT`, `TEACHER_MANAGEMENT`, `LEARNING_CONTENT`, `QUESTION_BANK`, `ASSIGNMENTS`, `SUPPORT_TICKETS`, `REPORTS`, `SYSTEM`...).
- **Căn cứ FE**: `Fontend/src/management/admin/roles/types/role-permission.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `code` | VARCHAR(100) | NOT NULL, UNIQUE | Mã quyền e.g. `USER_VIEW`, `CONTENT_PUBLISH` |
  | `name` | VARCHAR(150) | NOT NULL | Tên quyền hiển thị |
  | `module` | VARCHAR(50) | NOT NULL | Nhóm module e.g. `LEARNING_CONTENT` |
  | `description` | VARCHAR(255) | NULL | Mô tả chi tiết quyền |
- **Indexes**:
  - `CREATE INDEX idx_permissions_module ON permissions(module);`

### 1.5. Bảng `role_permissions` (Bắt buộc - Đề xuất bổ sung)
- **Mục đích**: Bảng trung gian gán quyền hạn cho từng vai trò (N:N).
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `role_id` | UUID | PK, FK -> `roles(id)` ON DELETE CASCADE | ID vai trò |
  | `permission_id` | UUID | PK, FK -> `permissions(id)` ON DELETE CASCADE | ID quyền hạn |

### 1.6. Bảng `user_profiles` (Bắt buộc - Đề xuất tách chuẩn hóa từ User)
- **Mục đích**: Lưu thông tin hồ sơ cá nhân và học tập mở rộng của học viên/giáo viên.
- **Căn cứ FE**: `Fontend/src/features/profile/pages/ProfilePage.tsx`, `Fontend/src/features/auth/pages/OnboardingPage.tsx`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `user_id` | UUID | PK, FK -> `users(id)` ON DELETE CASCADE | 1:1 với `users` |
  | `student_code` | VARCHAR(30) | UNIQUE, NULL | NULL | Mã học viên e.g. `ZWH-2026-8942` |
  | `phone_number` | VARCHAR(20) | NULL | NULL | Số điện thoại liên hệ |
  | `avatar_url` | TEXT | NULL | NULL | Đường dẫn ảnh đại diện |
  | `target_hsk_level` | SMALLINT | NOT NULL | `1` | Mục tiêu HSK (1 đến 6) |
  | `daily_goal_minutes` | SMALLINT | NOT NULL | `15` | Cam kết học mỗi ngày (phút) |
  | `daily_goal_xp` | INT | NOT NULL | `50` | Mục tiêu XP mỗi ngày |
  | `bio` | VARCHAR(500) | NULL | NULL | Giới thiệu ngắn |
  | `created_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | |
  | `updated_at` | TIMESTAMPTZ | NULL | NULL | |

### 1.7. Bảng `teacher_profiles` (Bắt buộc - Đề xuất bổ sung)
- **Mục đích**: Lưu thông tin chuyên môn, bằng cấp, số năm kinh nghiệm giảng dạy của giáo viên.
- **Căn cứ FE**: `Fontend/src/management/admin/teachers/types/teacher.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `user_id` | UUID | PK, FK -> `users(id)` ON DELETE CASCADE | 1:1 với `users` |
  | `teaching_status` | VARCHAR(30) | NOT NULL | `'ACTIVE'` | `ACTIVE`, `ON_LEAVE`, `INACTIVE` |
  | `qualifications` | VARCHAR(255) | NOT NULL | | Bằng cấp chuyên môn |
  | `experience_years` | SMALLINT | NOT NULL | `0` | Số năm kinh nghiệm |
  | `teaching_levels` | VARCHAR(20)[] | NOT NULL | `'{}'` | Mảng các cấp độ dạy: `{"HSK 1", "HSK 2"}` |
  | `specializations` | VARCHAR(50)[] | NOT NULL | `'{}'` | Chuyên môn: `{"GRAMMAR", "HSKK"}` |
  | `bio` | TEXT | NULL | NULL | Giới thiệu chi tiết giáo viên |
  | `notes` | TEXT | NULL | NULL | Ghi chú nội bộ của Admin |

### 1.8. Bảng `user_settings` (Bắt buộc - Đề xuất bổ sung)
- **Mục đích**: Lưu tùy chọn giao diện và hiển thị ngôn ngữ của người dùng.
- **Căn cứ FE**: `Fontend/src/features/settings/pages/SettingsPage.tsx`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `user_id` | UUID | PK, FK -> `users(id)` ON DELETE CASCADE | 1:1 với `users` |
  | `pinyin_default` | BOOLEAN | NOT NULL | `TRUE` | Luôn hiện Pinyin mặc định |
  | `character_style` | VARCHAR(20) | NOT NULL | `'simplified'` | `simplified` (Giản thể), `traditional` (Phồn thể) |
  | `audio_speed` | NUMERIC(3,2) | NOT NULL | `1.00` | Tốc độ phát audio (0.75, 0.85, 1.00) |
  | `sound_effects` | BOOLEAN | NOT NULL | `TRUE` | Bật âm thanh tương tác |
  | `daily_reminder` | BOOLEAN | NOT NULL | `TRUE` | Nhắc nhở học tập hàng ngày |
  | `updated_at` | TIMESTAMPTZ | NULL | NULL | |

### 1.9. Bảng `refresh_tokens` (Bắt buộc - Hiện đã có trong Backend)
- **Mục đích**: Quản lý phiên làm việc JWT và cơ chế xoay vòng Refresh Token.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `user_id` | UUID | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | |
  | `token_hash` | VARCHAR(128) | NOT NULL, UNIQUE | Hash chuỗi token |
  | `expires_at` | TIMESTAMPTZ | NOT NULL | Thời điểm hết hạn |
  | `created_at` | TIMESTAMPTZ | NOT NULL | Thời điểm tạo |
  | `revoked_at` | TIMESTAMPTZ | NULL | Thời điểm thu hồi |
  | `created_by_ip` | VARCHAR(50) | NULL | IP tạo token |
  | `revoked_by_ip` | VARCHAR(50) | NULL | IP thu hồi |
  | `revocation_reason` | VARCHAR(255) | NULL | Lý do thu hồi |
  | `replaced_by_token_hash`| VARCHAR(128) | NULL | Hash token kế nhiệm |
- **Indexes**:
  - `CREATE INDEX idx_refresh_tokens_user_expiry ON refresh_tokens(user_id, expires_at);`

### 1.10. Bảng `auth_audit_records` (Bắt buộc - Hiện đã có trong Backend)
- **Mục đích**: Ghi vết nhật ký đăng nhập, đăng xuất, đổi mật khẩu và đổi quyền người dùng.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `user_id` | UUID | NULL, FK -> `users(id)` ON DELETE SET NULL | |
  | `username` | VARCHAR(100) | NULL | Username lúc thực hiện |
  | `action` | VARCHAR(50) | NOT NULL | `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT` |
  | `ip_address` | VARCHAR(50) | NULL | Địa chỉ IP |
  | `user_agent` | VARCHAR(500) | NULL | Thiết bị/Trình duyệt |
  | `details` | VARCHAR(1000) | NULL | Chi tiết kết quả |
  | `created_at` | TIMESTAMPTZ | NOT NULL | Thời điểm ghi log |
- **Indexes**:
  - `CREATE INDEX idx_auth_audit_user_created ON auth_audit_records(user_id, created_at DESC);`

---

<a name="nhom-2"></a>
## NHÓM 2: CHUẨN HSK & KHO KIẾN THỨC NGÔN NGỮ GỐC

### 2.1. Bảng `hsk_levels` (Bắt buộc)
- **Mục đích**: Bảng danh mục 6 cấp độ chuẩn hóa (HSK 1 đến HSK 6, dự phòng HSK 7-9).
- **Căn cứ FE**: `Fontend/src/management/admin/content/types/hsk-standard.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | VARCHAR(20) | PK | Mã cấp e.g. `'HSK_1'`, `'HSK_2'` |
  | `level_number` | SMALLINT | NOT NULL, UNIQUE | 1, 2, 3, 4, 5, 6 |
  | `name` | VARCHAR(50) | NOT NULL | Tên chuẩn hóa e.g. `'HSK 1'` |
  | `stage` | VARCHAR(30) | NOT NULL | `'Sơ cấp'`, `'Trung cấp'`, `'Cao cấp'` |
  | `required_vocab_count` | INT | NOT NULL | Số từ vựng yêu cầu chuẩn (e.g. 150, 300) |
  | `required_character_count` | INT | NOT NULL | Số chữ Hán yêu cầu chuẩn |
  | `color_hex` | VARCHAR(10) | NOT NULL | Mã màu nhận diện e.g. `'#4338ca'` |

### 2.2. Bảng `chinese_characters` (Bắt buộc)
- **Mục đích**: Kho lưu trữ từng chữ Hán độc lập (Single Chinese Character) với thông tin Hán Việt, bộ thủ, số nét.
- **Căn cứ FE**: `Fontend/src/management/admin/content/types/character.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `character` | VARCHAR(10) | NOT NULL, UNIQUE | Chữ Hán e.g. `'你'` |
  | `pinyin` | VARCHAR(50) | NOT NULL | Phiên âm Pinyin có dấu thanh |
  | `sino_vietnamese` | VARCHAR(100) | NOT NULL | Âm Hán Việt e.g. `'Nhĩ'` |
  | `meaning_vi` | TEXT | NOT NULL | Nghĩa giải thích tiếng Việt |
  | `radical` | VARCHAR(50) | NOT NULL | Bộ thủ e.g. `'亻 Nhân đứng'` |
  | `stroke_count` | SMALLINT | NOT NULL | Tổng số nét |
  | `stroke_order_url` | TEXT | NULL | Link ảnh động/SVG thứ tự nét |
  | `frequency_rank` | INT | NULL | Tần suất xuất hiện chuẩn |
  | `hsk_level_id` | VARCHAR(20) | NOT NULL, FK -> `hsk_levels(id)` | Cấp độ HSK |
  | `status` | VARCHAR(30) | NOT NULL, DEFAULT `'PUBLISHED'` | `'DRAFT'`, `'PUBLISHED'` |
  | `created_at` | TIMESTAMPTZ | NOT NULL | |
  | `updated_at` | TIMESTAMPTZ | NULL | |
- **Indexes**:
  - `CREATE INDEX idx_characters_hsk ON chinese_characters(hsk_level_id);`
  - `CREATE INDEX idx_characters_radical ON chinese_characters(radical);`

### 2.3. Bảng `vocabularies` (Bắt buộc)
- **Mục đích**: Từ vựng chuẩn tiếng Trung (từ đơn hoặc từ ghép), là đối tượng trung tâm của Sổ từ vựng và Thuật toán Flashcard SRS.
- **Căn cứ FE**: `Fontend/src/features/vocabulary/types.ts`, `Fontend/src/management/admin/content/types/vocabulary.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `hanzi` | VARCHAR(100) | NOT NULL | Từ chữ Hán e.g. `'苹果'` |
  | `pinyin` | VARCHAR(150) | NOT NULL | Pinyin e.g. `'píngguǒ'` |
  | `word_type` | VARCHAR(50) | NOT NULL | Loại từ: Danh từ, Động từ, Tính từ, Lượng từ... |
  | `primary_meaning` | TEXT | NOT NULL | Nghĩa chính tiếng Việt |
  | `radical` | VARCHAR(50) | NULL | Bộ thủ đại diện |
  | `stroke_count` | SMALLINT | NULL | Số nét |
  | `audio_url` | TEXT | NULL | File âm thanh phát âm mẫu |
  | `hsk_level_id` | VARCHAR(20) | NOT NULL, FK -> `hsk_levels(id)` | Thuộc cấp HSK |
  | `status` | VARCHAR(30) | NOT NULL, DEFAULT `'PUBLISHED'` | `DRAFT`, `PUBLISHED` |
  | `created_at` | TIMESTAMPTZ | NOT NULL | |
  | `updated_at` | TIMESTAMPTZ | NULL | |
- **Indexes**:
  - `CREATE INDEX idx_vocabularies_hanzi ON vocabularies(hanzi);`
  - `CREATE INDEX idx_vocabularies_hsk ON vocabularies(hsk_level_id);`

### 2.4. Bảng `vocabulary_meanings` (Bắt buộc - Chuẩn hóa 1:N)
- **Mục đích**: Lưu trữ các nét nghĩa bổ sung của một từ vựng (`meanings: string[]`).
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `vocabulary_id` | UUID | NOT NULL, FK -> `vocabularies(id)` ON DELETE CASCADE | |
  | `meaning_text` | VARCHAR(255) | NOT NULL | Nét nghĩa cụ thể |
  | `order_index` | SMALLINT | NOT NULL, DEFAULT 0 | Thứ tự hiển thị |

### 2.5. Bảng `vocabulary_examples` (Bắt buộc - Chuẩn hóa 1:N)
- **Mục đích**: Lưu các câu ví dụ mẫu cho từ vựng.
- **Căn cứ FE**: `Fontend/src/features/vocabulary/types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `vocabulary_id` | UUID | NOT NULL, FK -> `vocabularies(id)` ON DELETE CASCADE | |
  | `hanzi` | TEXT | NOT NULL | Câu ví dụ chữ Hán |
  | `pinyin` | TEXT | NOT NULL | Phiên âm câu ví dụ |
  | `meaning` | TEXT | NOT NULL | Dịch nghĩa tiếng Việt |
  | `audio_url` | TEXT | NULL | Audio phát âm câu |

### 2.6. Bảng `grammar_points` (Bắt buộc)
- **Mục đích**: Kho lưu trữ các điểm ngữ pháp chuẩn toàn hệ thống.
- **Căn cứ FE**: `Fontend/src/features/grammar/types/grammar.types.ts`, `Fontend/src/management/admin/content/types/grammar.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `title` | VARCHAR(200) | NOT NULL | Tên điểm ngữ pháp e.g. `'Câu chữ 比'` |
  | `pinyin_title` | VARCHAR(255) | NOT NULL | Phiên âm tiêu đề |
  | `structure` | VARCHAR(255) | NOT NULL | Công thức ngữ pháp e.g. `'A + 比 + B + Adj'` |
  | `category` | VARCHAR(50) | NOT NULL | `'cơ bản'`, `'câu chữ'`, `'trợ từ'`, `'liên từ'`, `'bổ ngữ'` |
  | `explanation` | TEXT | NOT NULL | Giải thích chi tiết quy tắc |
  | `usage_note` | TEXT | NULL | Lưu ý đặc biệt khi sử dụng |
  | `difficulty` | VARCHAR(30) | NOT NULL | `'Dễ'`, `'Trung bình'`, `'Khá'` |
  | `hsk_level_id` | VARCHAR(20) | NOT NULL, FK -> `hsk_levels(id)` | Cấp độ HSK |
  | `status` | VARCHAR(30) | NOT NULL, DEFAULT `'PUBLISHED'` | |
  | `created_at` | TIMESTAMPTZ | NOT NULL | |
  | `updated_at` | TIMESTAMPTZ | NULL | |
- **Indexes**:
  - `CREATE INDEX idx_grammar_hsk ON grammar_points(hsk_level_id);`
  - `CREATE INDEX idx_grammar_category ON grammar_points(category);`

### 2.7. Bảng `grammar_examples` (Bắt buộc - Chuẩn hóa 1:N)
- **Mục đích**: Lưu các câu ví dụ minh họa và trường hợp lỗi sai điển hình của điểm ngữ pháp.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `grammar_point_id`| UUID | NOT NULL, FK -> `grammar_points(id)` ON DELETE CASCADE | |
  | `chinese` | TEXT | NOT NULL | Câu ví dụ chữ Hán |
  | `pinyin` | TEXT | NOT NULL | Phiên âm Pinyin |
  | `vietnamese` | TEXT | NOT NULL | Dịch nghĩa tiếng Việt |
  | `is_common_mistake`| BOOLEAN| NOT NULL, DEFAULT `FALSE` | Cờ đánh dấu câu ví dụ lỗi sai |
  | `mistake_correction`| TEXT | NULL | Cách sửa đúng nếu là lỗi sai |
  | `mistake_reason` | TEXT | NULL | Giải thích nguyên nhân sai |

---

<a name="nhom-3"></a>
## NHÓM 3: KHUNG CHƯƠNG TRÌNH & CẤU TRÚC BÀI HỌC (CURRICULUM & LESSONS)

### 3.1. Bảng `courses` (Bắt buộc)
- **Mục đích**: Quản lý các khóa học lớn (e.g. "Giáo trình Chuẩn HSK ZhongWenHub", "Tiếng Trung Giao tiếp Cấp tốc").
- **Căn cứ FE**: `Fontend/src/management/admin/content/types/curriculum.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `code` | VARCHAR(50) | NOT NULL, UNIQUE | Mã khóa học e.g. `'HSK_STANDARD'` |
  | `name` | VARCHAR(200) | NOT NULL | Tên khóa học |
  | `description` | TEXT | NULL | Mô tả tổng quan |
  | `status` | VARCHAR(30) | NOT NULL, DEFAULT `'PUBLISHED'` | `'DRAFT'`, `'PUBLISHED'`, `'ARCHIVED'` |
  | `created_at` | TIMESTAMPTZ | NOT NULL | |
  | `updated_at` | TIMESTAMPTZ | NULL | |

### 3.2. Bảng `course_levels` (Bắt buộc)
- **Mục đích**: Phân nhánh cấp độ trong khóa học liên kết với chuẩn `hsk_levels`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `course_id` | UUID | NOT NULL, FK -> `courses(id)` ON DELETE CASCADE | |
  | `hsk_level_id` | VARCHAR(20) | NOT NULL, FK -> `hsk_levels(id)` | |
  | `name` | VARCHAR(100) | NOT NULL | Tên cấp độ e.g. `'HSK 1'` |
  | `order_index` | SMALLINT | NOT NULL | Thứ tự cấp độ |

### 3.3. Bảng `units` (Bắt buộc)
- **Mục đích**: Đơn vị bài học lớn / Chủ đề (Unit) trong một cấp độ khóa học.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `course_level_id`| UUID | NOT NULL, FK -> `course_levels(id)` ON DELETE CASCADE | |
  | `unit_number` | SMALLINT | NOT NULL | Số thứ tự Unit (1, 2, 3...) |
  | `title_zh` | VARCHAR(200) | NOT NULL | Tên Unit tiếng Trung |
  | `title_vi` | VARCHAR(200) | NOT NULL | Tên Unit tiếng Việt |
  | `description` | TEXT | NULL | Mô tả chủ đề |
  | `order_index` | SMALLINT | NOT NULL | Thứ tự hiển thị |
  | `status` | VARCHAR(30) | NOT NULL, DEFAULT `'PUBLISHED'` | |
  | `created_at` | TIMESTAMPTZ | NOT NULL | |
  | `updated_at` | TIMESTAMPTZ | NULL | |
- **Indexes**:
  - `CREATE INDEX idx_units_course_level ON units(course_level_id);`

### 3.4. Bảng `lessons` (Bắt buộc)
- **Mục đích**: Bài học chi tiết kỹ thuật số (Lesson).
- **Căn cứ FE**: `Fontend/src/features/lesson/types.ts`, `Fontend/src/management/admin/content/types/curriculum.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` | |
  | `unit_id` | UUID | NOT NULL, FK -> `units(id)` ON DELETE CASCADE | | Đơn vị Unit |
  | `lesson_number` | SMALLINT | NOT NULL | | Thứ tự bài học |
  | `title_zh` | VARCHAR(200) | NOT NULL | | Tên bài chữ Hán |
  | `title_pinyin` | VARCHAR(255) | NOT NULL | | Phiên âm Pinyin |
  | `title_vi` | VARCHAR(200) | NOT NULL | | Tên bài tiếng Việt |
  | `duration_minutes` | SMALLINT | NOT NULL | `25` | Thời lượng dự kiến học |
  | `xp_reward` | INT | NOT NULL | `50` | Điểm kinh nghiệm thưởng khi hoàn thành |
  | `order_index` | SMALLINT | NOT NULL | `0` | Thứ tự sắp xếp |
  | `status` | VARCHAR(30) | NOT NULL | `'PUBLISHED'` | `'DRAFT'`, `'PUBLISHED'`, `'ARCHIVED'` |
  | `summary` | TEXT | NULL | NULL | Tóm tắt bài học |
  | `objectives` | JSONB | NOT NULL | `'[]'` | Danh sách mục tiêu bài học (string array) |
  | `created_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | |
  | `updated_at` | TIMESTAMPTZ | NULL | NULL | |
- **Indexes**:
  - `CREATE INDEX idx_lessons_unit_id ON lessons(unit_id);`
  - `CREATE INDEX idx_lessons_status ON lessons(status);`

### 3.5. Bảng `lesson_vocabularies` (Bắt buộc - Bảng trung gian N:N)
- **Mục đích**: Liên kết từ vựng chuẩn từ kho HSK vào bài học cụ thể mà **không sao chép dữ liệu** từ vựng.
- **Căn cứ FE**: `curriculum.types.ts`: "Bảng liên kết N:N giữa Bài học và Từ vựng chuẩn: Không sao chép toàn bộ object Vocabulary vào Lesson!".
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `lesson_id` | UUID | NOT NULL, FK -> `lessons(id)` ON DELETE CASCADE | |
  | `vocabulary_id` | UUID | NOT NULL, FK -> `vocabularies(id)` ON DELETE RESTRICT | |
  | `display_order` | SMALLINT | NOT NULL, DEFAULT 0 | Thứ tự xuất hiện trong bài |
  | `is_core_word` | BOOLEAN | NOT NULL, DEFAULT `TRUE` | Từ vựng trọng tâm |
  | `custom_example_zh` | TEXT | NULL | Ví dụ đặc thù theo ngữ cảnh bài học |
  | `custom_example_pinyin`| TEXT | NULL | |
  | `custom_example_vi` | TEXT | NULL | |
- **Indexes**:
  - `CREATE UNIQUE INDEX uq_lesson_vocab ON lesson_vocabularies(lesson_id, vocabulary_id);`

### 3.6. Bảng `lesson_grammars` (Bắt buộc - Bảng trung gian N:N)
- **Mục đích**: Liên kết điểm ngữ pháp chuẩn từ kho HSK vào bài học cụ thể.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `lesson_id` | UUID | NOT NULL, FK -> `lessons(id)` ON DELETE CASCADE | |
  | `grammar_point_id` | UUID | NOT NULL, FK -> `grammar_points(id)` ON DELETE RESTRICT | |
  | `display_order` | SMALLINT | NOT NULL, DEFAULT 0 | Thứ tự xuất hiện |
  | `lesson_notes` | TEXT | NULL | Ghi chú áp dụng trong bài |
- **Indexes**:
  - `CREATE UNIQUE INDEX uq_lesson_grammar ON lesson_grammars(lesson_id, grammar_point_id);`

### 3.7. Bảng `lesson_dialogues` (Bắt buộc)
- **Mục đích**: Quản lý đoạn hội thoại theo tình huống thực tế của bài học.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `lesson_id` | UUID | NOT NULL, FK -> `lessons(id)` ON DELETE CASCADE | |
  | `title` | VARCHAR(200) | NOT NULL | Tiêu đề đoạn thoại e.g. `'Tại quán cà phê'` |
  | `situation_zh` | TEXT | NULL | Ngữ cảnh hội thoại chữ Hán |
  | `situation_vi` | TEXT | NULL | Ngữ cảnh hội thoại tiếng Việt |
  | `audio_url` | TEXT | NULL | File âm thanh toàn bộ đoạn thoại |
  | `display_order` | SMALLINT | NOT NULL, DEFAULT 0 | |

### 3.8. Bảng `dialogue_lines` (Bắt buộc - 1:N với `lesson_dialogues`)
- **Mục đích**: Lưu từng câu thoại tương tác của từng nhân vật.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `dialogue_id` | UUID | NOT NULL, FK -> `lesson_dialogues(id)` ON DELETE CASCADE | |
  | `speaker_name` | VARCHAR(100) | NOT NULL | Tên nhân vật thoại e.g. `'Lý Minh'` |
  | `speaker_role` | VARCHAR(50) | NULL | Vai trò e.g. `'Nhân viên phục vụ'` |
  | `hanzi` | TEXT | NOT NULL | Câu thoại chữ Hán |
  | `pinyin` | TEXT | NOT NULL | Phiên âm Pinyin |
  | `meaning_vi` | TEXT | NOT NULL | Dịch nghĩa câu thoại |
  | `audio_url` | TEXT | NULL | File âm thanh riêng từng câu |
  | `display_order` | SMALLINT | NOT NULL | Thứ tự dòng thoại |

### 3.9. Bảng `lesson_listenings` (Bắt buộc)
- **Mục đích**: Dữ liệu phần luyện nghe tích hợp trong bài học chuẩn.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `lesson_id` | UUID | NOT NULL, FK -> `lessons(id)` ON DELETE CASCADE | |
  | `audio_hanzi` | TEXT | NOT NULL | Nội dung thoại chữ Hán |
  | `audio_pinyin` | TEXT | NOT NULL | Pinyin |
  | `audio_meaning` | TEXT | NOT NULL | Nghĩa tiếng Việt |
  | `audio_url` | TEXT | NULL | Link audio |
  | `prompt` | TEXT | NOT NULL | Câu hỏi yêu cầu học sinh nghe |
  | `explanation` | TEXT | NOT NULL | Lời giải chi tiết |

---

<a name="nhom-4"></a>
## NHÓM 4: NGÂN HÀNG CÂU HỎI & ĐỀ THI CHUẨN HÓA (QUESTION BANK & EXAMS)

### 4.1. Bảng `question_bank` (Bắt buộc)
- **Mục đích**: Kho câu hỏi độc lập tái sử dụng đa năng (Lesson Exercise, Homework Assignment, Mock Exam). Hỗ trợ 10 loại hình câu hỏi.
- **Căn cứ FE**: `Fontend/src/features/exercise-engine/types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `exercise_type` | VARCHAR(50) | NOT NULL | `multiple-choice`, `fill-blank`, `sentence-order`, `matching`, `listen-choice`... |
  | `title` | VARCHAR(255) | NOT NULL | Tiêu đề câu hỏi |
  | `instruction` | TEXT | NOT NULL | Hướng dẫn làm bài |
  | `hsk_level_id` | VARCHAR(20) | NOT NULL, FK -> `hsk_levels(id)` | Phân cấp HSK |
  | `skill_category`| VARCHAR(50) | NOT NULL | `vocabulary`, `grammar`, `listening`, `reading`, `sentence` |
  | `difficulty` | VARCHAR(20) | NOT NULL, DEFAULT `'medium'` | `easy`, `medium`, `hard` |
  | `prompt_hanzi` | TEXT | NULL | Đề bài chữ Hán |
  | `prompt_pinyin`| TEXT | NULL | Đề bài Pinyin |
  | `prompt_vi` | TEXT | NULL | Đề bài tiếng Việt |
  | `audio_url` | TEXT | NULL | Audio đính kèm |
  | `sentence_tokens`| JSONB | NULL | Mảng từ ngữ xáo trộn để sắp xếp câu |
  | `correct_sentence`| TEXT | NULL | Câu hoàn chỉnh đúng |
  | `correct_option_index`| SMALLINT| NULL | Chỉ số đáp án trắc nghiệm đúng |
  | `explanation` | TEXT | NOT NULL | Lời giải thích cặn kẽ |
  | `grammar_point_id`| UUID | NULL, FK -> `grammar_points(id)` | Liên kết điểm ngữ pháp |
  | `xp_reward` | INT | NOT NULL, DEFAULT 10 | Điểm thưởng |
  | `status` | VARCHAR(30) | NOT NULL, DEFAULT `'PUBLISHED'` | |
  | `created_at` | TIMESTAMPTZ | NOT NULL | |
  | `updated_at` | TIMESTAMPTZ | NULL | |
- **Indexes**:
  - `CREATE INDEX idx_qb_hsk_skill ON question_bank(hsk_level_id, skill_category);`
  - `CREATE INDEX idx_qb_type ON question_bank(exercise_type);`

### 4.2. Bảng `question_options` (Bắt buộc - Chuẩn hóa 1:N cho câu trắc nghiệm)
- **Mục đích**: Các phương án lựa chọn A, B, C, D của câu hỏi trắc nghiệm.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `question_id` | UUID | NOT NULL, FK -> `question_bank(id)` ON DELETE CASCADE | |
  | `option_text` | TEXT | NOT NULL | Nội dung lựa chọn |
  | `is_correct` | BOOLEAN | NOT NULL, DEFAULT `FALSE` | Đánh dấu đáp án đúng |
  | `order_index` | SMALLINT | NOT NULL | Thứ tự lựa chọn (0, 1, 2, 3) |

### 4.3. Bảng `question_matching_pairs` (Bắt buộc - Chuẩn hóa 1:N cho bài ghép cặp)
- **Mục đích**: Các cặp ghép đôi Hanzi - Meaning trong bài tập nối từ.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `question_id` | UUID | NOT NULL, FK -> `question_bank(id)` ON DELETE CASCADE | |
  | `hanzi` | VARCHAR(100) | NOT NULL | Vế trái chữ Hán |
  | `meaning` | VARCHAR(255) | NOT NULL | Vế phải nghĩa tiếng Việt |

### 4.4. Bảng `mock_exams` (Bắt buộc)
- **Mục đích**: Đề thi thử HSK chuẩn hóa quốc tế.
- **Căn cứ FE**: `Fontend/src/features/mock-exams/types/exam.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `title` | VARCHAR(255) | NOT NULL | Tên đề thi e.g. `'Đề thi thử HSK 2 - Đề số 01'` |
  | `hsk_level_id` | VARCHAR(20) | NOT NULL, FK -> `hsk_levels(id)` | Cấp độ HSK |
  | `duration_minutes`| SMALLINT | NOT NULL | Thời gian thi (phút) |
  | `total_questions` | SMALLINT | NOT NULL | Tổng số câu hỏi |
  | `passing_score` | SMALLINT | NOT NULL | Điểm chuẩn đạt (e.g. 120/200 hoặc 180/300) |
  | `created_at` | TIMESTAMPTZ | NOT NULL | |
  | `updated_at` | TIMESTAMPTZ | NULL | |

### 4.5. Bảng `mock_exam_sections` (Bắt buộc)
- **Mục đích**: Các phần thi độc lập trong đề thi (Nghe hiểu, Đọc hiểu, Viết).
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `exam_id` | UUID | NOT NULL, FK -> `mock_exams(id)` ON DELETE CASCADE | |
  | `name` | VARCHAR(50) | NOT NULL | `'Nghe hiểu'`, `'Đọc hiểu'`, `'Viết'` |
  | `question_count` | SMALLINT | NOT NULL | Số câu trong phần |
  | `duration_minutes`| SMALLINT | NOT NULL | Thời gian làm phần này |
  | `order_index` | SMALLINT | NOT NULL | Thứ tự phần thi |

### 4.6. Bảng `mock_exam_questions` (Bắt buộc)
- **Mục đích**: Câu hỏi thuộc đề thi thử, liên kết câu hỏi từ Question Bank hoặc câu độc lập.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `section_id` | UUID | NOT NULL, FK -> `mock_exam_sections(id)` ON DELETE CASCADE | |
  | `question_number`| SMALLINT | NOT NULL | Số thứ tự câu hỏi trong đề |
  | `question_bank_id`| UUID | NULL, FK -> `question_bank(id)` | Khóa ngoại tham chiếu |
  | `prompt` | TEXT | NOT NULL | Đề bài câu hỏi |
  | `pinyin` | TEXT | NULL | Pinyin |
  | `audio_url` | TEXT | NULL | Audio phần thi nghe |
  | `options` | JSONB | NOT NULL | Mảng các lựa chọn đáp án |
  | `correct_option_index`| SMALLINT| NOT NULL | Đáp án đúng |
  | `points` | NUMERIC(5,2)| NOT NULL, DEFAULT 2.0 | Điểm câu hỏi |

---

<a name="nhom-5"></a>
## NHÓM 5: TIẾN ĐỘ HỌC TẬP & THUẬT TOÁN GIÃN CÁCH (SRS ENGINE)

### 5.1. Bảng `user_lesson_progress` (Bắt buộc)
- **Mục đích**: Ghi nhận tiến độ làm bài học của từng học viên theo từng bước (Step-by-step progress).
- **Căn cứ FE**: `Fontend/src/features/lesson/types/lesson-progress.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` | |
  | `user_id` | UUID | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | | Học viên |
  | `lesson_id` | UUID | NOT NULL, FK -> `lessons(id)` ON DELETE CASCADE | | Bài học |
  | `status` | VARCHAR(30) | NOT NULL | `'IN_PROGRESS'` | `'NOT_STARTED'`, `'IN_PROGRESS'`, `'COMPLETED'` |
  | `current_step_index`| SMALLINT | NOT NULL | `0` | Bước hiện tại (0 -> 7) |
  | `max_unlocked_step_index`| SMALLINT| NOT NULL | `0` | Bước mở khóa cao nhất |
  | `quiz_score` | SMALLINT | NULL | NULL | Điểm Quiz cuối bài |
  | `total_quiz_questions`| SMALLINT | NULL | NULL | Tổng số câu Quiz |
  | `xp_earned` | INT | NOT NULL | `0` | XP nhận từ bài học này |
  | `completed_at` | TIMESTAMPTZ | NULL | NULL | Thời điểm hoàn thành bài |
  | `updated_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | |
- **Indexes**:
  - `CREATE UNIQUE INDEX uq_user_lesson ON user_lesson_progress(user_id, lesson_id);`
  - `CREATE INDEX idx_ulp_user_status ON user_lesson_progress(user_id, status);`

### 5.2. Bảng `user_vocabulary_states` (Bắt buộc)
- **Mục đích**: Trạng thái làm chủ từ vựng của học viên (Mới, Đang học, Cần ôn, Đã thuộc).
- **Căn cứ FE**: `Fontend/src/features/vocabulary/types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` | |
  | `user_id` | UUID | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | | |
  | `vocabulary_id` | UUID | NOT NULL, FK -> `vocabularies(id)` ON DELETE CASCADE | | |
  | `status` | VARCHAR(30) | NOT NULL | `'learning'` | `'new'`, `'learning'`, `'reviewing'`, `'mastered'` |
  | `review_count` | INT | NOT NULL | `0` | Tổng số lần đã ôn tập |
  | `correct_count` | INT | NOT NULL | `0` | Số lần trả lời đúng |
  | `first_learned_at`| TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | Ngày học lần đầu |
  | `last_reviewed_at`| TIMESTAMPTZ | NULL | NULL | Ngày ôn tập gần nhất |
  | `next_review_at` | TIMESTAMPTZ | NOT NULL | | Ngày đến hạn ôn tiếp theo |
- **Indexes**:
  - `CREATE UNIQUE INDEX uq_user_vocab ON user_vocabulary_states(user_id, vocabulary_id);`
  - `CREATE INDEX idx_uvs_due_today ON user_vocabulary_states(user_id, next_review_at);`

### 5.3. Bảng `user_srs_states` (Bắt buộc)
- **Mục đích**: Lưu trữ các tham số tính toán của thuật toán lặp lại ngắt quãng (Spaced Repetition System - SM-2/FSRS).
- **Căn cứ FE**: `Fontend/src/features/vocabulary/srsEngine.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `user_id` | UUID | PK, FK -> `users(id)` ON DELETE CASCADE | | 1:1 với cặp (User, Vocab) |
  | `vocabulary_id` | UUID | PK, FK -> `vocabularies(id)` ON DELETE CASCADE | | |
  | `stability` | NUMERIC(8,3) | NOT NULL | `1.000` | Độ ổn định ghi nhớ (ngày) |
  | `difficulty` | NUMERIC(4,2) | NOT NULL | `5.00` | Độ khó từ vựng (thang 0-10) |
  | `interval_days` | NUMERIC(8,3) | NOT NULL | `1.000` | Khoảng cách ngày đến lần ôn sau |
  | `repetitions` | INT | NOT NULL | `0` | Số chu kỳ lặp lại liên tiếp thành công |
  | `ease_factor` | NUMERIC(4,2) | NOT NULL | `2.50` | Hệ số dễ nhớ (Ease Factor) |
  | `updated_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | |

### 5.4. Bảng `srs_review_logs` (Bắt buộc - Phục vụ thống kê & tối ưu AI)
- **Mục đích**: Lưu vết lịch sử từng lượt đánh giá thẻ từ vựng (`again`, `hard`, `good`, `easy`).
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `user_id` | UUID | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | |
  | `vocabulary_id` | UUID | NOT NULL, FK -> `vocabularies(id)` ON DELETE CASCADE | |
  | `rating` | VARCHAR(20) | NOT NULL | `'again'`, `'hard'`, `'good'`, `'easy'` |
  | `previous_interval`| NUMERIC(8,3)| NOT NULL | Khoảng cách cũ |
  | `new_interval` | NUMERIC(8,3)| NOT NULL | Khoảng cách mới được gán |
  | `reviewed_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Thời điểm đánh giá |
- **Indexes**:
  - `CREATE INDEX idx_srs_log_user_time ON srs_review_logs(user_id, reviewed_at DESC);`

### 5.5. Bảng `user_exercise_attempts` (Bắt buộc)
- **Mục đích**: Ghi nhận mọi lượt làm bài tập trắc nghiệm / câu hỏi của học sinh. Dữ liệu vàng để chẩn đoán điểm yếu.
- **Căn cứ FE**: `Fontend/src/features/learning/types/learning-state.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `user_id` | UUID | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | |
  | `question_id` | UUID | NOT NULL, FK -> `question_bank(id)` ON DELETE CASCADE | |
  | `user_answer` | TEXT | NOT NULL | Đáp án người dùng nhập/chọn |
  | `is_correct` | BOOLEAN | NOT NULL | Kết quả Đúng / Sai |
  | `response_time_ms`| INT | NOT NULL | Thời gian suy nghĩ và trả lời (mili-giây) |
  | `attempted_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | |
- **Indexes**:
  - `CREATE INDEX idx_uea_user_question ON user_exercise_attempts(user_id, question_id);`
  - `CREATE INDEX idx_uea_user_correct ON user_exercise_attempts(user_id, is_correct);`

---

<a name="nhom-6"></a>
## NHÓM 6: KHÔNG GIAN LỚP HỌC & BÀI TẬP VỀ NHÀ (TEACHING & ASSIGNMENTS)

### 6.1. Bảng `teaching_classes` (Bắt buộc)
- **Mục đích**: Quản lý lớp học do giáo viên phụ trách. **Không lưu sĩ số cứng**; sĩ số được tính toán động (derived) từ `class_members` có trạng thái `'ACTIVE'`.
- **Căn cứ FE**: `Fontend/src/management/teacher/types/class.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` | |
  | `teacher_id` | UUID | NOT NULL, FK -> `users(id)` ON DELETE RESTRICT | | Giáo viên chủ nhiệm lớp |
  | `name` | VARCHAR(255) | NOT NULL | | Tên lớp e.g. `'Lớp HSK 2 Cấp tốc - K14'` |
  | `code` | VARCHAR(50) | NOT NULL, UNIQUE | | Mã lớp duy nhất e.g. `'ZWH-HSK2-K14'` |
  | `description` | TEXT | NULL | NULL | Mô tả lộ trình học |
  | `hsk_level_id` | VARCHAR(20) | NOT NULL, FK -> `hsk_levels(id)` | | Cấp HSK mục tiêu |
  | `course_id` | UUID | NULL, FK -> `courses(id)` | | Khóa học liên kết |
  | `status` | VARCHAR(30) | NOT NULL | `'ACTIVE'` | `'DRAFT'`, `'UPCOMING'`, `'ACTIVE'`, `'COMPLETED'`, `'ARCHIVED'` |
  | `capacity` | SMALLINT | NOT NULL | `30` | Sĩ số tối đa |
  | `start_date` | DATE | NOT NULL | | Ngày khai giảng |
  | `end_date` | DATE | NULL | NULL | Ngày bế giảng |
  | `location_type` | VARCHAR(20) | NOT NULL | `'ONLINE'` | `'ONLINE'`, `'OFFLINE'`, `'HYBRID'` |
  | `meeting_url` | TEXT | NULL | NULL | Link phòng Zoom/Google Meet |
  | `room_location` | VARCHAR(100) | NULL | NULL | Phòng học thực tế nếu offline |
  | `created_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | |
  | `updated_at` | TIMESTAMPTZ | NULL | NULL | |
- **Indexes**:
  - `CREATE INDEX idx_classes_teacher ON teaching_classes(teacher_id);`
  - `CREATE INDEX idx_classes_status ON teaching_classes(status);`

### 6.2. Bảng `class_members` (Bắt buộc - N:N giữa Lớp và Học viên)
- **Mục đích**: Quản lý danh sách học viên ghi danh vào từng lớp học.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` | |
  | `class_id` | UUID | NOT NULL, FK -> `teaching_classes(id)` ON DELETE CASCADE | | |
  | `student_id` | UUID | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | | Học viên tham gia |
  | `status` | VARCHAR(30) | NOT NULL | `'ACTIVE'` | `'ACTIVE'`, `'PAUSED'`, `'DROPPED'`, `'COMPLETED'` |
  | `attendance_rate` | NUMERIC(5,2) | NOT NULL | `100.00` | Tỷ lệ điểm danh chuyên cần (%) |
  | `enrolled_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | Ngày vào lớp |
  | `notes` | TEXT | NULL | NULL | Nhận xét riêng của giáo viên |
- **Indexes**:
  - `CREATE UNIQUE INDEX uq_class_student ON class_members(class_id, student_id);`
  - `CREATE INDEX idx_cm_student ON class_members(student_id);`

### 6.3. Bảng `class_schedules` (Bắt buộc)
- **Mục đích**: Lịch học hàng tuần của lớp (Thứ 2 đến Chủ nhật, giờ học).
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `class_id` | UUID | NOT NULL, FK -> `teaching_classes(id)` ON DELETE CASCADE | |
  | `day_of_week` | VARCHAR(20) | NOT NULL | `'MONDAY'`, `'TUESDAY'`, `'WEDNESDAY'`, `'THURSDAY'`, `'FRIDAY'`, `'SATURDAY'`, `'SUNDAY'` |
  | `start_time` | TIME | NOT NULL | Giờ bắt đầu e.g. `'19:30:00'` |
  | `end_time` | TIME | NOT NULL | Giờ kết thúc e.g. `'21:00:00'` |
  | `timezone` | VARCHAR(50) | NOT NULL, DEFAULT `'Asia/Ho_Chi_Minh'` | Múi giờ |
  | `meeting_url` | TEXT | NULL | Link phòng học riêng cho buổi này |

### 6.4. Bảng `class_announcements` (Bắt buộc)
- **Mục đích**: Bảng tin và thông báo của giáo viên đăng trên không gian lớp học.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `class_id` | UUID | NOT NULL, FK -> `teaching_classes(id)` ON DELETE CASCADE | |
  | `teacher_id` | UUID | NOT NULL, FK -> `users(id)` | Giáo viên đăng bài |
  | `title` | VARCHAR(255) | NOT NULL | Tiêu đề thông báo |
  | `content` | TEXT | NOT NULL | Nội dung thông báo |
  | `is_pinned` | BOOLEAN | NOT NULL, DEFAULT `FALSE` | Ghim lên đầu bảng tin |
  | `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | |

### 6.5. Bảng `assignments` (Bắt buộc)
- **Mục đích**: Quản lý bài tập về nhà do giáo viên khởi tạo.
- **Căn cứ FE**: `Fontend/src/management/teacher/types/assignment.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` | |
  | `teacher_id` | UUID | NOT NULL, FK -> `users(id)` ON DELETE RESTRICT | | Giáo viên tạo bài |
  | `title` | VARCHAR(255) | NOT NULL | | Tên bài tập e.g. `'Bài tập 03: Ngữ pháp 比'` |
  | `description` | TEXT | NULL | NULL | Hướng dẫn yêu cầu làm bài |
  | `hsk_level_id` | VARCHAR(20) | NOT NULL, FK -> `hsk_levels(id)` | | Cấp HSK của bài |
  | `status` | VARCHAR(30) | NOT NULL | `'DRAFT'` | `'DRAFT'`, `'PUBLISHED'`, `'CLOSED'`, `'ARCHIVED'` |
  | `time_limit_minutes`| SMALLINT| NULL | NULL | Giới hạn thời gian (phút), NULL nếu không giới hạn |
  | `max_attempts` | SMALLINT | NOT NULL | `1` | Số lần được phép làm |
  | `retake_policy` | VARCHAR(30) | NOT NULL | `'HIGHEST_SCORE'` | `'HIGHEST_SCORE'`, `'LATEST_ATTEMPT'` |
  | `passing_points` | NUMERIC(5,2)| NOT NULL | `5.00` | Điểm chuẩn đạt |
  | `allow_late_submission`| BOOLEAN| NOT NULL | `TRUE` | Cho phép nộp muộn |
  | `late_penalty_percent` | SMALLINT| NOT NULL | `10` | Phần trăm trừ điểm khi nộp muộn |
  | `shuffle_questions` | BOOLEAN | NOT NULL | `FALSE` | Xáo trộn thứ tự câu hỏi khi học sinh làm |
  | `show_correct_answers` | BOOLEAN | NOT NULL | `TRUE` | Hiện đáp án sau khi đóng bài |
  | `created_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | |
  | `updated_at` | TIMESTAMPTZ | NULL | NULL | |
  | `published_at` | TIMESTAMPTZ | NULL | NULL | Thời điểm xuất bản |
  | `closed_at` | TIMESTAMPTZ | NULL | NULL | Thời điểm đóng nộp bài |

### 6.6. Bảng `assignment_targets` (Bắt buộc - Phân phối bài tập đến từng lớp)
- **Mục đích**: Gán bài tập cho một hoặc nhiều lớp học với thời hạn (deadline) riêng biệt.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `assignment_id` | UUID | NOT NULL, FK -> `assignments(id)` ON DELETE CASCADE | |
  | `class_id` | UUID | NOT NULL, FK -> `teaching_classes(id)` ON DELETE CASCADE | |
  | `due_date` | TIMESTAMPTZ | NOT NULL | Hạn nộp chính thức |
  | `close_date` | TIMESTAMPTZ | NULL | Ngày đóng hoàn toàn không cho nộp thêm |
- **Indexes**:
  - `CREATE UNIQUE INDEX uq_assignment_class ON assignment_targets(assignment_id, class_id);`
  - `CREATE INDEX idx_at_due_date ON assignment_targets(due_date);`

### 6.7. Bảng `assignment_questions` (Bắt buộc)
- **Mục đích**: Danh sách các câu hỏi trong bài tập. Lưu trữ **Snapshot câu hỏi bất biến** để khi ngân hàng câu hỏi gốc bị sửa/xóa thì bài thi đã phát hành không bị ảnh hưởng.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `assignment_id` | UUID | NOT NULL, FK -> `assignments(id)` ON DELETE CASCADE | |
  | `question_bank_id`| UUID | NOT NULL, FK -> `question_bank(id)` ON DELETE RESTRICT | |
  | `order_index` | SMALLINT | NOT NULL | Thứ tự câu |
  | `points` | NUMERIC(5,2)| NOT NULL, DEFAULT 1.0 | Điểm của câu |
  | `question_snapshot`| JSONB | NOT NULL | Bản sao chép toàn bộ nội dung câu hỏi và đáp án đúng tại thời điểm phát hành |
- **Indexes**:
  - `CREATE INDEX idx_aq_assignment ON assignment_questions(assignment_id);`

### 6.8. Bảng `assignment_attempts` (Bắt buộc)
- **Mục đích**: Ghi nhận một lần làm bài tập của học sinh.
- **Căn cứ FE**: `Fontend/src/features/homework/types/student-homework.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` | |
  | `assignment_id` | UUID | NOT NULL, FK -> `assignments(id)` ON DELETE CASCADE | | |
  | `class_id` | UUID | NOT NULL, FK -> `teaching_classes(id)` | | |
  | `student_id` | UUID | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | | Học viên |
  | `attempt_number` | SMALLINT | NOT NULL | `1` | Lần thử thứ 1, 2... |
  | `status` | VARCHAR(30) | NOT NULL | `'IN_PROGRESS'` | `'IN_PROGRESS'`, `'SUBMITTED'`, `'EXPIRED'`, `'GRADED'` |
  | `started_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | Giờ bắt đầu làm |
  | `submitted_at` | TIMESTAMPTZ | NULL | NULL | Giờ nộp bài |
  | `expires_at` | TIMESTAMPTZ | NULL | NULL | Giờ hết hạn (nếu có giới hạn phút) |
  | `time_spent_seconds`| INT | NOT NULL | `0` | Tổng giây làm bài |
  | `total_score` | NUMERIC(5,2)| NULL | NULL | Tổng điểm đạt được |
  | `is_passed` | BOOLEAN | NULL | NULL | Đạt / Trượt |
  | `is_late` | BOOLEAN | NOT NULL | `FALSE` | Cờ nộp muộn |
  | `teacher_feedback` | TEXT | NULL | NULL | Nhận xét của giáo viên |
- **Indexes**:
  - `CREATE INDEX idx_att_student_assignment ON assignment_attempts(student_id, assignment_id);`
  - `CREATE INDEX idx_att_class ON assignment_attempts(class_id);`

### 6.9. Bảng `student_answers` (Bắt buộc - 1:N với `assignment_attempts`)
- **Mục đích**: Lưu câu trả lời cụ thể của học sinh cho từng câu hỏi trong lần làm bài.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `attempt_id` | UUID | NOT NULL, FK -> `assignment_attempts(id)` ON DELETE CASCADE | |
  | `assignment_question_id`| UUID| NOT NULL, FK -> `assignment_questions(id)` | |
  | `user_answer` | TEXT | NOT NULL | Đáp án học sinh chọn hoặc nhập (chuỗi JSON nếu là ghép cặp) |
  | `is_correct` | BOOLEAN | NULL | Đúng / Sai |
  | `score_earned` | NUMERIC(5,2)| NULL | Điểm đạt được câu này |
  | `is_flagged` | BOOLEAN | NOT NULL, DEFAULT `FALSE` | Đánh dấu xem lại lúc làm bài |
  | `answered_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | |

---

<a name="nhom-7"></a>
## NHÓM 7: VIDEO HỌC TẬP & ĐA PHƯƠNG TIỆN TƯƠNG TÁC

### 7.1. Bảng `videos` (Bắt buộc)
- **Mục đích**: Kho video bài giảng, phim tài liệu, bài hát tiếng Trung.
- **Căn cứ FE**: `Fontend/src/types/api/video.dto.ts`, `Fontend/src/features/videos/pages/VideoDetailPage.tsx`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` | |
  | `title` | VARCHAR(255) | NOT NULL | | Tiêu đề video |
  | `description` | TEXT | NULL | NULL | Mô tả nội dung |
  | `hsk_level_id` | VARCHAR(20) | NOT NULL, FK -> `hsk_levels(id)` | | Cấp HSK phù hợp |
  | `topic` | VARCHAR(100) | NOT NULL | | Chủ đề e.g. `'Ẩm thực'`, `'Giao tiếp'` |
  | `duration_seconds`| INT | NOT NULL | | Thời lượng video (giây) |
  | `thumbnail_url` | TEXT | NOT NULL | | Ảnh đại diện |
  | `video_url` | TEXT | NOT NULL | | URL video (MP4/HLS hoặc link YouTube) |
  | `lesson_id` | UUID | NULL, FK -> `lessons(id)` | | Liên kết bài học nếu có |
  | `status` | VARCHAR(30) | NOT NULL | `'PUBLISHED'` | `'DRAFT'`, `'REVIEW'`, `'PUBLISHED'`, `'ARCHIVED'` |
  | `view_count` | INT | NOT NULL | `0` | Lượt xem |
  | `created_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | |
  | `updated_at` | TIMESTAMPTZ | NULL | NULL | |
- **Indexes**:
  - `CREATE INDEX idx_videos_hsk ON videos(hsk_level_id);`
  - `CREATE INDEX idx_videos_topic ON videos(topic);`

### 7.2. Bảng `video_tags` (Bắt buộc - Chuẩn hóa N:N)
- **Mục đích**: Gắn thẻ nhãn phân loại cho video (`tags: string[]`).
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `video_id` | UUID | PK, FK -> `videos(id)` ON DELETE CASCADE | |
  | `tag` | VARCHAR(50) | PK | Nhãn tag e.g. `'ẩm thực'`, `'khẩu ngữ'` |

### 7.3. Bảng `video_transcripts` (Bắt buộc - Đồng bộ phụ đề theo thời gian)
- **Mục đích**: Lưu phụ đề từng câu chạy khớp theo timeline video (Synchronized Transcript).
- **Căn cứ FE**: `TranscriptSegmentDto` trong `video.dto.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `video_id` | UUID | NOT NULL, FK -> `videos(id)` ON DELETE CASCADE | |
  | `start_time` | NUMERIC(8,3) | NOT NULL | Giây bắt đầu e.g. `12.500` |
  | `end_time` | NUMERIC(8,3) | NOT NULL | Giây kết thúc e.g. `15.800` |
  | `text_zh` | TEXT | NOT NULL | Câu phụ đề chữ Hán |
  | `pinyin` | TEXT | NOT NULL | Pinyin |
  | `text_vi` | TEXT | NOT NULL | Dịch nghĩa tiếng Việt |
  | `order_index` | INT | NOT NULL | Thứ tự xuất hiện |
- **Indexes**:
  - `CREATE INDEX idx_vt_video_time ON video_transcripts(video_id, start_time);`

### 7.4. Bảng `video_tokens` (Tùy chọn - Tối ưu click tra từ vựng trong video)
- **Mục đích**: Lưu các từ vựng đã được tách từ (tokenized) trong từng câu phụ đề để học sinh click là xem được nghĩa ngay mà không cần chạy model NLP thời gian thực trên server.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `transcript_id` | UUID | NOT NULL, FK -> `video_transcripts(id)` ON DELETE CASCADE | |
  | `vocabulary_id` | UUID | NULL, FK -> `vocabularies(id)` | Liên kết từ điển chuẩn |
  | `hanzi` | VARCHAR(50) | NOT NULL | Từ ngữ e.g. `'北京'` |
  | `pinyin` | VARCHAR(100) | NOT NULL | |
  | `meaning` | VARCHAR(255) | NOT NULL | |

### 7.5. Bảng `user_saved_videos` (Bắt buộc)
- **Mục đích**: Học viên đánh dấu bookmark video yêu thích.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `user_id` | UUID | PK, FK -> `users(id)` ON DELETE CASCADE | |
  | `video_id` | UUID | PK, FK -> `videos(id)` ON DELETE CASCADE | |
  | `saved_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | |

---

<a name="nhom-8"></a>
## NHÓM 8: GAMIFICATION, BẢNG XẾP HẠNG & NHẬT KÝ HOẠT ĐỘNG

### 8.1. Bảng `user_stats` (Bắt buộc - Denormalization có kiểm soát)
- **Mục đích**: Bảng tích lũy chỉ số tổng quát của học sinh (Tổng XP, chuỗi ngày liên tục Streak, cấp độ học). Tối ưu truy vấn Dashboard không phải quét bảng lịch sử.
- **Căn cứ FE**: `Fontend/src/features/learning/types/learning-state.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `user_id` | UUID | PK, FK -> `users(id)` ON DELETE CASCADE | | 1:1 với học viên |
  | `xp_total` | INT | NOT NULL | `0` | Tổng XP tích lũy |
  | `streak_days` | INT | NOT NULL | `0` | Số ngày học liên tiếp hiện tại |
  | `longest_streak` | INT | NOT NULL | `0` | Kỷ lục chuỗi ngày dài nhất |
  | `last_activity_date`| DATE | NULL | NULL | Ngày hoạt động gần nhất (YYYY-MM-DD) |
  | `updated_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | |
- **Indexes**:
  - `CREATE INDEX idx_user_stats_xp ON user_stats(xp_total DESC);`

### 8.2. Bảng `user_daily_activities` (Bắt buộc)
- **Mục đích**: Ghi nhận hoạt động theo từng ngày (số phút học, XP kiếm được, số bài hoàn thành, số từ vựng ôn tập). Dùng vẽ biểu đồ tuần tại Dashboard và ProgressPage.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` | |
  | `user_id` | UUID | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | | |
  | `activity_date` | DATE | NOT NULL | | Ngày ghi nhận (YYYY-MM-DD) |
  | `minutes_spent` | SMALLINT | NOT NULL | `0` | Số phút học thực tế trong ngày |
  | `xp_earned` | INT | NOT NULL | `0` | XP nhận trong ngày |
  | `lessons_completed`| SMALLINT| NOT NULL | `0` | Số bài học hoàn thành |
  | `exercises_completed`| SMALLINT| NOT NULL | `0` | Số bài tập đã nộp |
  | `reviews_completed`| SMALLINT| NOT NULL | `0` | Số thẻ từ vựng đã ôn tập |
- **Indexes**:
  - `CREATE UNIQUE INDEX uq_user_daily ON user_daily_activities(user_id, activity_date);`

### 8.3. Bảng `achievements` (Bắt buộc)
- **Mục đích**: Danh mục huy hiệu danh giá trong hệ thống.
- **Căn cứ FE**: `Fontend/src/features/achievements/pages/AchievementsPage.tsx`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | VARCHAR(50) | PK | Mã huy hiệu e.g. `'STREAK_7'`, `'FLASHCARD_100'` |
  | `title` | VARCHAR(100) | NOT NULL | Tiêu đề huy hiệu |
  | `description` | VARCHAR(255) | NOT NULL | Điều kiện đạt được |
  | `icon` | VARCHAR(20) | NOT NULL | Icon e.g. `'🔥'`, `'🌱'`, `'👑'` |
  | `rarity` | VARCHAR(30) | NOT NULL | `'Đồng'`, `'Bạc'`, `'Vàng'`, `'Kim cương'` |
  | `criteria_type` | VARCHAR(50) | NOT NULL | `'STREAK_DAYS'`, `'VOCAB_MASTERED'`, `'LESSON_COMPLETE'` |
  | `criteria_threshold`| INT | NOT NULL | Giá trị ngưỡng đạt được (e.g. 7, 100, 30) |
  | `xp_reward` | INT | NOT NULL | Thưởng XP khi mở khóa |

### 8.4. Bảng `user_achievements` (Bắt buộc)
- **Mục đích**: Huy hiệu học viên đã mở khóa.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `user_id` | UUID | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | |
  | `achievement_id` | VARCHAR(50) | NOT NULL, FK -> `achievements(id)` ON DELETE CASCADE | |
  | `is_unlocked` | BOOLEAN | NOT NULL, DEFAULT `FALSE` | Đã mở khóa hay chưa |
  | `progress_percent`| SMALLINT | NOT NULL, DEFAULT 0 | Tiến độ hoàn thành (%) |
  | `unlocked_at` | TIMESTAMPTZ | NULL | Thời điểm mở khóa |
- **Indexes**:
  - `CREATE UNIQUE INDEX uq_user_achievement ON user_achievements(user_id, achievement_id);`

### 8.5. Bảng `game_records` (Bắt buộc)
- **Mục đích**: Lưu điểm số trò chơi mini-game ghép thẻ Hanzi - Meaning (`LearningGamesPage.tsx`).
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `user_id` | UUID | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | |
  | `game_type` | VARCHAR(50) | NOT NULL | `'MATCH_CARD'` |
  | `score` | INT | NOT NULL | Điểm đạt được |
  | `max_combo` | SMALLINT | NOT NULL | Chuỗi combo cao nhất |
  | `time_spent_seconds`| SMALLINT| NOT NULL | Thời gian chơi |
  | `xp_earned` | INT | NOT NULL | XP nhận được |
  | `played_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | |

### 8.6. Bảng `weekly_leaderboard_snapshots` (Bắt buộc - Tối ưu bảng xếp hạng tuần)
- **Mục đích**: Snapshot điểm số xếp hạng theo tuần (Year-Week) để hiển thị lịch sử BXH mà không cần tính toán động hàng triệu bản ghi.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `year` | SMALLINT | NOT NULL | Năm e.g. `2026` |
  | `week_number` | SMALLINT | NOT NULL | Tuần thứ trong năm (1-52) |
  | `user_id` | UUID | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | |
  | `rank` | INT | NOT NULL | Thứ hạng |
  | `weekly_xp` | INT | NOT NULL | Điểm XP kiếm được trong tuần |
  | `streak_days` | INT | NOT NULL | Chuỗi ngày |
- **Indexes**:
  - `CREATE UNIQUE INDEX uq_leaderboard_week ON weekly_leaderboard_snapshots(year, week_number, user_id);`

---

<a name="nhom-9"></a>
## NHÓM 9: TRÍ TUỆ NHÂN TẠO (AI), CHẨN ĐOÁN & ĐỊNH MỨC TOKEN

### 9.1. Bảng `ai_tutor_conversations` (Bắt buộc)
- **Mục đích**: Lưu phiên hội thoại giữa học sinh và Trợ lý Gia sư AI.
- **Căn cứ FE**: `Fontend/src/features/ai-tutor/types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` | |
  | `user_id` | UUID | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | | Học viên |
  | `mode` | VARCHAR(30) | NOT NULL | `'ASK'` | `'ASK'`, `'EXPLAIN'`, `'CORRECT'`, `'PRACTICE'`, `'CONVERSATION'` |
  | `context_metadata` | JSONB | NOT NULL | `'{}'` | Snapshot ngữ cảnh: `hskLevel`, `lessonId`, `exerciseId`, `weakness` |
  | `created_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | |
  | `updated_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | |
- **Indexes**:
  - `CREATE INDEX idx_atc_user_updated ON ai_tutor_conversations(user_id, updated_at DESC);`

### 9.2. Bảng `ai_tutor_messages` (Bắt buộc - 1:N với `ai_tutor_conversations`)
- **Mục đích**: Từng tin nhắn trong cuộc trò chuyện AI, hỗ trợ cấu trúc dữ liệu phản hồi dạng khối (Explanation, Example, Pattern, Correction Diff, Quick Practice).
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `conversation_id`| UUID | NOT NULL, FK -> `ai_tutor_conversations(id)` ON DELETE CASCADE | |
  | `role` | VARCHAR(20) | NOT NULL | `'user'`, `'assistant'`, `'system'` |
  | `content` | TEXT | NULL | Nội dung văn bản thường |
  | `structured_response`| JSONB | NULL | Cấu trúc khối phản hồi giáo dục (JSON) |
  | `feedback` | VARCHAR(10) | NULL | `'like'`, `'dislike'` |
  | `tokens_consumed`| INT | NULL | Lượng token cho câu trả lời này |
  | `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | |

### 9.3. Bảng `ai_writing_submissions` (Bắt buộc)
- **Mục đích**: Lưu bài viết học viên nộp cho AI chấm điểm và sửa lỗi ngữ pháp (`AIGradingPage.tsx`).
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `user_id` | UUID | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | |
  | `target_hsk_level`| SMALLINT | NOT NULL | Cấp HSK người dùng chọn |
  | `input_text` | TEXT | NOT NULL | Bài viết tiếng Trung người dùng nhập |
  | `score` | NUMERIC(5,2)| NOT NULL | Điểm số do AI chấm (0-100) |
  | `estimated_hsk` | VARCHAR(50) | NOT NULL | Cấp độ HSK tương đương do AI đánh giá |
  | `grammar_fixes` | JSONB | NOT NULL | Mảng lỗi ngữ pháp: `{original, correction, reason}` |
  | `vocab_upgrades` | JSONB | NOT NULL | Mảng từ vựng nâng cấp: `{simple, advanced, pinyin}` |
  | `native_rewrite` | TEXT | NOT NULL | Bản viết lại chuẩn bản xứ |
  | `general_feedback`| TEXT | NOT NULL | Nhận xét tổng quát |
  | `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | |

### 9.4. Bảng `user_weak_knowledge_points` (Bắt buộc)
- **Mục đích**: Bảng chẩn đoán lỗ hổng kiến thức cá nhân hóa của học sinh. Dữ liệu phục vụ Radar năng lực (`AIAnalyticsPage.tsx`) và gợi ý bài tập khắc phục.
- **Căn cứ FE**: `Fontend/src/features/learning/types/learning-state.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` | |
  | `user_id` | UUID | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | | |
  | `knowledge_point_id`| VARCHAR(100)| NOT NULL | | Mã điểm kiến thức e.g. `'grammar-bi'`, `'vocab-fangxiang'` |
  | `topic_title` | VARCHAR(255) | NOT NULL | | Tên chủ đề e.g. `'Cấu trúc câu so sánh 比'` |
  | `category` | VARCHAR(30) | NOT NULL | | `'grammar'`, `'vocabulary'`, `'listening'`, `'reading'`, `'sentence'` |
  | `hsk_level` | SMALLINT | NOT NULL | | Cấp HSK |
  | `total_attempts` | INT | NOT NULL | `0` | Tổng số lần làm bài tập chủ đề này |
  | `correct_attempts` | INT | NOT NULL | `0` | Số lần làm đúng |
  | `incorrect_attempts`| INT | NOT NULL | `0` | Số lần làm sai |
  | `accuracy_rate` | NUMERIC(5,2)| NOT NULL | `0.00` | Tỷ lệ chính xác (%) |
  | `mastery_level` | VARCHAR(30) | NOT NULL | `'WEAK'` | `'WEAK'`, `'RECOVERING'`, `'MASTERED'` |
  | `trend` | VARCHAR(20) | NOT NULL | `'stagnant'` | `'improving'`, `'declining'`, `'stagnant'` |
  | `evidence` | TEXT | NULL | NULL | Dẫn chứng lỗi sai e.g. `'Sai 2/5 câu trong bài tập gần đây'` |
  | `suggested_route`| VARCHAR(255) | NULL | NULL | Đường dẫn học lại e.g. `'/grammar'` |
  | `last_evaluated_at`| TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | Lần AI đánh giá gần nhất |
- **Indexes**:
  - `CREATE UNIQUE INDEX uq_user_kp ON user_weak_knowledge_points(user_id, knowledge_point_id);`
  - `CREATE INDEX idx_uwk_mastery ON user_weak_knowledge_points(user_id, mastery_level);`

### 9.5. Bảng `user_competency_scores` (Bắt buộc)
- **Mục đích**: Điểm số định lượng 6 kỹ năng cốt lõi cho biểu đồ Radar năng lực AI (`AIAnalyticsPage.tsx`).
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `user_id` | UUID | PK, FK -> `users(id)` ON DELETE CASCADE | | 1:1 với học viên |
  | `overall_ai_index`| NUMERIC(5,2)| NOT NULL | `0.00` | Chỉ số năng lực AI chung (0-100) |
  | `listening_score` | NUMERIC(5,2)| NOT NULL | `0.00` | Nghe hiểu |
  | `speaking_score` | NUMERIC(5,2)| NOT NULL | `0.00` | Hội thoại phản xạ |
  | `reading_score` | NUMERIC(5,2)| NOT NULL | `0.00` | Đọc hiểu |
  | `writing_score` | NUMERIC(5,2)| NOT NULL | `0.00` | Viết & Ngữ pháp |
  | `vocabulary_score`| NUMERIC(5,2)| NOT NULL | `0.00` | Vốn từ vựng |
  | `tones_score` | NUMERIC(5,2)| NOT NULL | `0.00` | Phản xạ thanh điệu |
  | `updated_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | |

### 9.6. Bảng `ai_entitlements` (Bắt buộc)
- **Mục đích**: Quản lý hạn ngạch token và quyền sử dụng tính năng AI theo hạng tài khoản (Free, Student Pro, Teacher Pro).
- **Căn cứ FE**: `Fontend/src/features/ai/usage/types/ai-usage.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `user_id` | UUID | PK, FK -> `users(id)` ON DELETE CASCADE | | |
  | `tier` | VARCHAR(30) | NOT NULL | `'FREE'` | `'FREE'`, `'STUDENT_PRO'`, `'TEACHER_PRO'`, `'INSTITUTIONAL'` |
  | `monthly_token_quota` | INT | NOT NULL | `50000` | Hạn mức token mỗi tháng |
  | `tokens_consumed_month`| INT | NOT NULL | `0` | Token đã dùng trong tháng |
  | `daily_tutor_msg_limit`| INT | NOT NULL | `20` | Giới hạn tin nhắn AI Tutor mỗi ngày |
  | `tutor_msgs_sent_today`| INT | NOT NULL | `0` | Tin nhắn đã gửi hôm nay |
  | `expires_at` | TIMESTAMPTZ | NULL | NULL | Hạn nâng cấp gói |
  | `is_active` | BOOLEAN | NOT NULL | `TRUE` | |
  | `last_reset_date` | DATE | NOT NULL | `CURRENT_DATE` | Ngày reset hạn mức hàng ngày |

### 9.7. Bảng `ai_task_logs` (Bắt buộc)
- **Mục đích**: Ghi vết chi tiết từng yêu cầu gọi mô hình AI (OpenAI, Gemini, Anthropic) để kiểm toán chi phí và theo dõi lỗi.
- **Căn cứ FE**: `Fontend/src/features/ai/core/types/ai-task.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `task_id` | VARCHAR(100) | NOT NULL, UNIQUE | Mã task ID client/server |
  | `task_type` | VARCHAR(50) | NOT NULL | `STUDENT_TUTOR_CHAT`, `STUDENT_GRADING_ANALYSIS`, `TEACHER_LESSON_PLANNING`... |
  | `actor_id` | UUID | NOT NULL, FK -> `users(id)` | Người thực hiện |
  | `model_used` | VARCHAR(100) | NOT NULL | e.g. `'gpt-4o'`, `'gemini-1.5-pro'` |
  | `prompt_tokens` | INT | NOT NULL | Số token đầu vào |
  | `completion_tokens` | INT | NOT NULL | Số token sinh ra |
  | `total_tokens` | INT | NOT NULL | Tổng token tiêu thụ |
  | `duration_ms` | INT | NOT NULL | Thời gian phản hồi (ms) |
  | `status` | VARCHAR(30) | NOT NULL | `'SUCCESS'`, `'ERROR'`, `'RATE_LIMITED'` |
  | `error_code` | VARCHAR(50) | NULL | Mã lỗi nếu thất bại |
  | `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | |
- **Indexes**:
  - `CREATE INDEX idx_ai_logs_actor_time ON ai_task_logs(actor_id, created_at DESC);`
  - `CREATE INDEX idx_ai_logs_task_type ON ai_task_logs(task_type);`

### 9.8. Bảng `ai_prompt_cache` (Tùy chọn - Tối ưu chi phí & thời gian phản hồi)
- **Mục đích**: Lưu cache kết quả các câu hỏi/yêu cầu giải thích ngữ pháp phổ biến tránh gọi lặp lại LLM tốn token.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `prompt_hash` | VARCHAR(64) | PK | Chuỗi băm SHA-256 của prompt + context |
  | `task_type` | VARCHAR(50) | NOT NULL | Loại tác vụ |
  | `model_version` | VARCHAR(50) | NOT NULL | Phiên bản model tạo ra |
  | `response_payload`| JSONB | NOT NULL | Dữ liệu phản hồi đã định dạng |
  | `hit_count` | INT | NOT NULL, DEFAULT 1 | Số lần tái sử dụng |
  | `created_at` | TIMESTAMPTZ | NOT NULL | |
  | `expires_at` | TIMESTAMPTZ | NOT NULL | Thời điểm hết hạn cache |
- **Indexes**:
  - `CREATE INDEX idx_prompt_cache_expiry ON ai_prompt_cache(expires_at);`

### 9.9. Bảng `learning_telemetry_events` (Bắt buộc - Phục vụ Event Streaming & AI Engine)
- **Mục đích**: Ghi nhận toàn bộ sự kiện hành vi giáo dục theo thời gian thực (start session, pause video, click subtitle, repeat audio, answer question...).
- **Căn cứ FE**: `Fontend/src/features/learning/types/learning-event.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `event_id` | VARCHAR(100) | NOT NULL, UNIQUE | Mã định danh sự kiện client gửi lên |
  | `session_id` | VARCHAR(100) | NOT NULL | Mã phiên học tập liên tục |
  | `student_id` | UUID | NOT NULL, FK -> `users(id)` ON DELETE CASCADE | |
  | `lesson_id` | VARCHAR(50) | NULL | Bài học liên quan |
  | `hsk_level` | SMALLINT | NULL | Cấp HSK |
  | `event_type` | VARCHAR(60) | NOT NULL | `practice_session_started`, `video_played`, `subtitle_repeated`... |
  | `duration_ms` | INT | NOT NULL, DEFAULT 0 | Thời gian tương tác thực (ms) |
  | `attempt_number` | SMALLINT | NULL | Số lần thử |
  | `correctness` | BOOLEAN | NULL | Đúng / Sai nếu có |
  | `metadata` | JSONB | NULL | Dữ liệu phi cấu trúc an toàn đi kèm |
  | `timestamp` | TIMESTAMPTZ | NOT NULL | Thời điểm xảy ra sự kiện |
- **Indexes**:
  - `CREATE INDEX idx_telemetry_student_time ON learning_telemetry_events(student_id, timestamp DESC);`
  - `CREATE INDEX idx_telemetry_event_type ON learning_telemetry_events(event_type);`

---

<a name="nhom-10"></a>
## NHÓM 10: HỖ TRỢ KHÁCH HÀNG, KIỂM DUYỆT & LỊCH SỬ PHIÊN BẢN (AUDIT)

### 10.1. Bảng `support_tickets` (Bắt buộc)
- **Mục đích**: Quản lý yêu cầu hỗ trợ của học viên gửi đến bộ phận Support.
- **Căn cứ FE**: `Fontend/src/types/api/support.dto.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `id` | VARCHAR(30) | PK | | Mã ticket e.g. `'TCK-2026-001'` |
  | `student_id` | UUID | NOT NULL, FK -> `users(id)` | | Học viên gửi yêu cầu |
  | `subject` | VARCHAR(255) | NOT NULL | | Tiêu đề ticket |
  | `description` | TEXT | NOT NULL | | Chi tiết vấn đề gặp phải |
  | `category` | VARCHAR(30) | NOT NULL | | `'CONTENT'`, `'TECHNICAL'`, `'ACCOUNT'`, `'BILLING'`, `'OTHER'` |
  | `priority` | VARCHAR(20) | NOT NULL | `'MEDIUM'` | `'URGENT'`, `'HIGH'`, `'MEDIUM'`, `'LOW'` |
  | `status` | VARCHAR(30) | NOT NULL | `'NEW'` | `'NEW'`, `'IN_PROGRESS'`, `'WAITING_STUDENT'`, `'RESOLVED'`, `'CLOSED'` |
  | `assignee_id` | UUID | NULL, FK -> `users(id)` | | Nhân viên Support thụ lý |
  | `sla_deadline` | TIMESTAMPTZ | NOT NULL | | Hạn cam kết phản hồi (SLA) |
  | `content_issue_id`| VARCHAR(30) | NULL | NULL | Mã liên kết nếu chuyển tiếp lỗi sang Content Manager |
  | `created_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | |
  | `updated_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | |
- **Indexes**:
  - `CREATE INDEX idx_tickets_status ON support_tickets(status);`
  - `CREATE INDEX idx_tickets_assignee ON support_tickets(assignee_id);`
  - `CREATE INDEX idx_tickets_sla ON support_tickets(sla_deadline) WHERE status NOT IN ('RESOLVED', 'CLOSED');`

### 10.2. Bảng `ticket_notes` (Bắt buộc - 1:N với `support_tickets`)
- **Mục đích**: Ghi chú nội bộ giữa các nhân viên hỗ trợ hoặc phản hồi cho học sinh.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `ticket_id` | VARCHAR(30) | NOT NULL, FK -> `support_tickets(id)` ON DELETE CASCADE | |
  | `author_id` | UUID | NOT NULL, FK -> `users(id)` | Người viết ghi chú |
  | `content` | TEXT | NOT NULL | Nội dung ghi chú |
  | `is_internal` | BOOLEAN | NOT NULL, DEFAULT `TRUE` | Ghi chú nội bộ hay gửi cho học viên |
  | `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | |

### 10.3. Bảng `ticket_activities` (Bắt buộc)
- **Mục đích**: Ghi vết hoạt động luân chuyển ticket (Assign, Change Status, Escalate).
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `ticket_id` | VARCHAR(30) | NOT NULL, FK -> `support_tickets(id)` ON DELETE CASCADE | |
  | `actor_id` | UUID | NOT NULL, FK -> `users(id)` | |
  | `action` | VARCHAR(100) | NOT NULL | Mô tả hành động e.g. `'Giao cho Support Nguyễn Văn A'` |
  | `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | |

### 10.4. Bảng `content_issues` (Bắt buộc)
- **Mục đích**: Quản lý các sự cố lỗi nội dung học liệu được Support chuyển tiếp sang hoặc do Content Manager ghi nhận.
- **Căn cứ FE**: `Fontend/src/types/api/content-issue.dto.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `id` | VARCHAR(30) | PK | | Mã sự cố e.g. `'ISS-2026-001'` |
  | `target_content_id` | VARCHAR(100)| NOT NULL | | ID mục nội dung bị lỗi |
  | `target_content_type`| VARCHAR(30) | NOT NULL | | `'VOCABULARY'`, `'GRAMMAR'`, `'LESSON'`, `'EXERCISE'`, `'VIDEO'` |
  | `target_content_title`| VARCHAR(255)| NOT NULL | | Tiêu đề mục nội dung |
  | `target_content_route`| VARCHAR(255)| NULL | NULL | Deep link mở trang sửa nội dung |
  | `title` | VARCHAR(255) | NOT NULL | | Tiêu đề tóm tắt lỗi |
  | `description` | TEXT | NOT NULL | | Mô tả chi tiết lỗi sai |
  | `issue_type` | VARCHAR(30) | NOT NULL | | `'TYPO'`, `'AUDIO_ERROR'`, `'TRANSLATION_WRONG'`, `'GRAMMAR_EXPLANATION'` |
  | `priority` | VARCHAR(20) | NOT NULL | `'MEDIUM'` | `'URGENT'`, `'HIGH'`, `'MEDIUM'`, `'LOW'` |
  | `status` | VARCHAR(30) | NOT NULL | `'NEW'` | `'NEW'`, `'TRIAGED'`, `'IN_PROGRESS'`, `'RESOLVED'`, `'CLOSED'`, `'REOPENED'` |
  | `reported_by` | VARCHAR(100) | NOT NULL | | Người phát hiện lỗi |
  | `support_staff_id` | UUID | NULL, FK -> `users(id)` | | Nhân viên Support chuyển tiếp |
  | `content_manager_id`| UUID | NULL, FK -> `users(id)` | | Content Manager thụ lý xử lý |
  | `resolution_notes` | TEXT | NULL | NULL | Ghi chú giải trình cách sửa lỗi |
  | `feedback_to_support`| TEXT | NULL | NULL | Phản hồi lại cho Support để trả lời học sinh |
  | `resolution_version` | INT | NULL | NULL | Phiên bản nội dung sau khi fix lỗi |
  | `created_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | |
  | `updated_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | |
  | `resolved_at` | TIMESTAMPTZ | NULL | NULL | |
- **Indexes**:
  - `CREATE INDEX idx_ci_status ON content_issues(status);`
  - `CREATE INDEX idx_ci_content ON content_issues(target_content_type, target_content_id);`

### 10.5. Bảng `content_issue_activities` (Bắt buộc)
- **Mục đích**: Lịch sử thao tác xử lý lỗi nội dung.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `issue_id` | VARCHAR(30) | NOT NULL, FK -> `content_issues(id)` ON DELETE CASCADE | |
  | `actor_id` | UUID | NOT NULL, FK -> `users(id)` | Người thực hiện |
  | `action` | VARCHAR(100) | NOT NULL | e.g. `'Content Manager nhận xử lý'` |
  | `timestamp` | TIMESTAMPTZ | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | |

### 10.6. Bảng `content_moderation_items` (Bắt buộc)
- **Mục đích**: Quản lý hàng đợi duyệt nội dung bài học/ngữ pháp/từ vựng trước khi phát hành (`ContentModerationPage.tsx`).
- **Căn cứ FE**: `Fontend/src/management/content-manager/types/content-manager.types.ts`.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Mô tả |
  | :--- | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` | |
  | `content_id` | VARCHAR(100) | NOT NULL | | ID bài học/từ vựng/ngữ pháp |
  | `content_type` | VARCHAR(40) | NOT NULL | | `'CURRICULUM_LESSON'`, `'GRAMMAR_POINT'`, `'EXERCISE_QUESTION'` |
  | `title` | VARCHAR(255) | NOT NULL | | Tiêu đề |
  | `hsk_level_id` | VARCHAR(20) | NOT NULL, FK -> `hsk_levels(id)` | | |
  | `author_id` | UUID | NOT NULL, FK -> `users(id)` | | Giáo viên / Biên tập viên soạn thảo |
  | `status` | VARCHAR(30) | NOT NULL | `'PENDING_REVIEW'`| `'DRAFT'`, `'PENDING_REVIEW'`, `'PUBLISHED'`, `'ARCHIVED'` |
  | `priority` | VARCHAR(20) | NOT NULL | `'MEDIUM'` | |
  | `version` | INT | NOT NULL | `1` | Số phiên bản biên tập |
  | `submitted_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | |
  | `reviewed_by` | UUID | NULL, FK -> `users(id)` | | Người duyệt |
  | `review_notes` | TEXT | NULL | NULL | Nhận xét duyệt |
  | `rejection_reason` | TEXT | NULL | NULL | Lý do từ chối nếu bị trả về |
  | `changes_summary` | TEXT | NOT NULL | | Tóm tắt các thay đổi |
  | `diff_summary` | JSONB | NULL | NULL | Mảng chi tiết khác biệt (field, old, new) |
- **Indexes**:
  - `CREATE INDEX idx_cmi_status ON content_moderation_items(status);`

### 10.7. Bảng `content_version_snapshots` (Bắt buộc - Phục vụ Rollback & Audit History)
- **Mục đích**: Lưu trữ snapshot JSON nguyên trạng của từng phiên bản bài học/từ vựng/ngữ pháp khi được xuất bản hoặc chỉnh sửa, cho phép xem lại và khôi phục (Rollback) bất cứ lúc nào.
- **Cấu trúc cột**:
  | Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `id` | UUID | PK | `gen_random_uuid()` |
  | `content_id` | VARCHAR(100) | NOT NULL | ID nội dung gốc |
  | `content_type` | VARCHAR(40) | NOT NULL | Loại nội dung |
  | `version` | INT | NOT NULL | Số phiên bản (1, 2, 3...) |
  | `status` | VARCHAR(30) | NOT NULL | Trạng thái phiên bản lúc lưu |
  | `changed_by` | UUID | NOT NULL, FK -> `users(id)` | Người thực hiện thay đổi |
  | `change_type` | VARCHAR(30) | NOT NULL | `'CREATE'`, `'UPDATE'`, `'PUBLISH'`, `'RESTORE'` |
  | `summary` | VARCHAR(500) | NOT NULL | Tóm tắt thay đổi |
  | `snapshot_payload`| JSONB | NOT NULL | Toàn bộ dữ liệu của đối tượng dạng JSON |
  | `timestamp` | TIMESTAMPTZ | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | |
- **Indexes**:
  - `CREATE INDEX idx_cvs_content_ver ON content_version_snapshots(content_type, content_id, version DESC);`

---

## 3. THỐNG KÊ TỔNG HỢP DANH MỤC BẢNG ĐỀ XUẤT

- **Tổng số bảng SQL đề xuất**: **55 bảng**.
- **Số bảng Bắt buộc (Mandatory)**: **52 bảng** (Được trích xuất trực tiếp từ giao diện, DTOs và luồng dữ liệu FE).
- **Số bảng Tùy chọn / Tối ưu mở rộng (Optional)**: **3 bảng** (`ai_prompt_cache`, `video_tokens`, `weekly_leaderboard_snapshots` - Đề xuất nhằm tối ưu triệt để chi phí gọi LLM, tăng tốc độ tra cứu phụ đề video và giảm tải truy vấn bảng xếp hạng).
