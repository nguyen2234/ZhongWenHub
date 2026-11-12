# THIẾT KẾ CƠ SỞ DỮ LIỆU POSTGRESQL (DATABASE SCHEMA & EF CORE)

## 1. Công Nghệ & Tiêu Chuẩn Thiết Kế
- **Hệ quản trị CSDL:** PostgreSQL 16+ (tương thích PostgreSQL 18).
- **ORM:** Entity Framework Core 8.0 với provider `Npgsql.EntityFrameworkCore.PostgreSQL`.
- **Quy ước đặt tên:** Tên bảng và tên cột tuân thủ chuẩn `snake_case` / chữ thường PostgreSQL.
- **Kiểu khóa chính (PK):** `uuid` ngẫu nhiên cho tất cả các bảng.
- **Thời gian (Timestamps):** `timestamptz` (Timestamp with time zone), luôn lưu trữ giá trị UTC chuẩn.
- **Xóa mềm (Soft Delete):** Cờ `is_deleted boolean DEFAULT false` và `deleted_at timestamptz NULL` kèm EF Core Global Query Filter.

---

## 2. Danh Mục Các Bảng (Schema Details)

### 2.1. Bảng `users`
Lưu trữ thông tin người dùng kế thừa ASP.NET Core Identity.
```sql
CREATE TABLE public.users (
    id uuid PRIMARY KEY,
    user_name varchar(256) NULL,
    normalized_user_name varchar(256) NULL,
    email varchar(256) NULL,
    normalized_email varchar(256) NULL,
    email_confirmed boolean NOT NULL,
    password_hash text NULL,
    security_stamp text NULL,
    concurrency_stamp text NULL,
    phone_number text NULL,
    phone_number_confirmed boolean NOT NULL,
    two_factor_enabled boolean NOT NULL,
    lockout_end timestamptz NULL,
    lockout_enabled boolean NOT NULL,
    access_failed_count integer NOT NULL,
    display_name varchar(100) NOT NULL,
    avatar_url text NULL,
    status varchar(30) NOT NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NULL,
    last_login_at timestamptz NULL,
    is_deleted boolean NOT NULL DEFAULT false,
    deleted_at timestamptz NULL
);
```
**Chỉ mục:**
- `EmailIndex` trên `(normalized_email)`
- `UserNameIndex` UNIQUE trên `(normalized_user_name)`

### 2.2. Bảng `roles`
Lưu trữ định nghĩa vai trò hệ thống.
```sql
CREATE TABLE public.roles (
    id uuid PRIMARY KEY,
    name varchar(256) NULL,
    normalized_name varchar(256) NULL,
    concurrency_stamp text NULL,
    description varchar(255) NULL
);
```
**Chỉ mục:** `RoleNameIndex` UNIQUE trên `(normalized_name)`.

### 2.3. Bảng `user_roles`
Quan hệ nhiều-nhiều giữa người dùng và vai trò.
```sql
CREATE TABLE public.user_roles (
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);
```

### 2.4. Bảng `refresh_tokens`
Quản lý các phiên đăng nhập và mã gia hạn.
```sql
CREATE TABLE public.refresh_tokens (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL,
    token_hash varchar(128) NOT NULL,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz NULL,
    replaced_by_token_hash varchar(128) NULL,
    created_by_ip varchar(50) NULL,
    revoked_by_ip varchar(50) NULL,
    revocation_reason varchar(255) NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NULL
);
```
**Chỉ mục tối ưu:**
- `idx_refresh_tokens_hash` trên `(token_hash)`
- `idx_refresh_tokens_user_id` trên `(user_id)`
- `idx_refresh_tokens_user_expiry` trên `(user_id, expires_at)`

### 2.5. Bảng `auth_audit_records`
Nhật ký bảo mật kiểm toán thao tác xác thực.
```sql
CREATE TABLE public.auth_audit_records (
    id uuid PRIMARY KEY,
    user_id uuid NULL,
    username varchar(100) NULL,
    action varchar(50) NOT NULL,
    ip_address varchar(50) NULL,
    user_agent varchar(500) NULL,
    success boolean NOT NULL,
    details varchar(1000) NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NULL
);
```
**Chỉ mục:**
- `idx_audit_records_user_id` trên `(user_id)`
- `idx_audit_records_created_at` trên `(created_at)`

---

## 3. Lịch Sử Migrations
- **`20261028134736_InitialCreate`:** Khởi tạo cấu trúc các bảng Identity, RefreshTokens và AuthAuditRecords.
- Được áp dụng thành công trên cả 2 cơ sở dữ liệu:
  - `zhongwenhub_dev` (Môi trường phát triển cục bộ)
  - `zhongwenhub_test` (Môi trường kiểm thử tự động)
