# KIẾN TRÚC XÁC THỰC (AUTHENTICATION & TOKEN LIFECYCLE)

**Dự án:** ZhongWenHub  
**Chuẩn:** JWT (JSON Web Token) + Refresh Token Rotation + HttpOnly Cookie  
**Mục tiêu bảo mật:** Zero Trust, XSS-resistant, Token-Reuse Proof, RFC 7807 Problem Details.

---

## 1. LUỒNG XÁC THỰC ĐĂNG NHẬP (LOGIN FLOW)

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant FE as React Frontend
    participant API as AuthController (/login)
    participant Auth as AuthService
    participant DB as PostgreSQL (users, refresh_tokens)

    User->>FE: Nhập Email và Mật khẩu
    FE->>API: POST /api/v1/auth/login { email, password, rememberMe }
    API->>Auth: LoginAsync(request, ip, userAgent)
    Auth->>DB: Tìm người dùng theo Email/Username
    alt Người dùng không tồn tại hoặc bị xóa
        Auth-->>API: 401 Unauthorized (ProblemDetails: Sai tài khoản hoặc mật khẩu)
        API-->>FE: 401 Unauthorized
    else Tài khoản bị khóa (Status == LOCKED / SUSPENDED)
        Auth-->>API: 403 Forbidden (ProblemDetails: Tài khoản bị khóa kèm lý do)
        API-->>FE: 403 Forbidden
    else Sai mật khẩu
        Auth->>DB: Tăng AccessFailedCount, kiểm tra lockout
        Auth-->>API: 401 Unauthorized (ProblemDetails: Sai tài khoản hoặc mật khẩu)
        API-->>FE: 401 Unauthorized
    else Xác thực thành công
        Auth->>Auth: Reset AccessFailedCount, cập nhật LastLoginAt
        Auth->>Auth: Sinh Access Token (15 phút) & Refresh Token (7 hoặc 30 ngày)
        Auth->>DB: Lưu SHA-256 hash của Refresh Token
        Auth->>DB: Ghi AuthAuditRecord (LOGIN_SUCCESS)
        Auth-->>API: AuthResult (AccessToken, UserDto, RawRefreshToken, Expiry)
        API->>FE: Set-Cookie: refreshToken=...; HttpOnly; Path=/api/v1/auth
        API-->>FE: HTTP 200 OK { accessToken, expiresIn, tokenType, user }
    end
    FE->>FE: Lưu Access Token trong Memory (Runtime)
    FE->>FE: Điều hướng tới Portal tương ứng với Vai trò
```

---

## 2. VÒNG ĐỜI VÀ XOAY VÒNG TOKEN (REFRESH TOKEN ROTATION)

1. **Access Token:**
   - Thời hạn: 15 phút (900 giây).
   - Lưu trữ: Hoàn toàn trong RAM (JavaScript Memory) của ứng dụng Frontend.
   - Truyền tải: Header `Authorization: Bearer <accessToken>`.
   - Chứa các Claims: `nameid` (UserId), `email`, `unique_name`, `username`, `status`, `role` (các vai trò).

2. **Refresh Token:**
   - Thời hạn: 7 ngày (mặc định) hoặc 30 ngày (khi chọn "Ghi nhớ đăng nhập").
   - Lưu trữ phía Client: **Chỉ duy nhất trong HttpOnly Cookie** (`refreshToken`).
   - Lưu trữ phía Server: **Chỉ lưu chuỗi băm SHA-256** tại bảng `refresh_tokens`.
   - Cơ chế xoay vòng: Mỗi lần gọi `POST /api/v1/auth/refresh`, token cũ lập tức bị thu hồi (`RevokedAt = DateTime.UtcNow`, gán `ReplacedByTokenHash`) và một token mới được sinh ra và gửi lại qua Cookie.

3. **Phát hiện tấn công Token Reuse:**
   - Nếu một token đã từng bị xoay vòng (đã có `RevokedAt`) được gửi lên lần thứ hai, hệ thống xác định có kẻ tấn công đã sao chép được token.
   - Hệ thống ngay lập tức thu hồi **tất cả** các phiên đang hoạt động của người dùng đó (`Revoke(reason: "Reuse Attack")`), ghi log cảnh báo và trả về HTTP 401.

---

## 3. DANH SÁCH ENDPOINTS XÁC THỰC

### 3.1. Đăng nhập
- **Method:** `POST`
- **Endpoint:** `/api/v1/auth/login`
- **Quyền:** Public (`[AllowAnonymous]`)
- **Request Body:**
  ```json
  {
    "email": "student@example.com",
    "password": "ExamplePassword123!",
    "rememberMe": true
  }
  ```
- **Response 200 OK:**
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "19594c13-fe6c-4c51-b223-08e3aaf66786",
      "username": "student_example",
      "email": "student@example.com",
      "displayName": "Học Viên Mẫu (Student Example)",
      "roles": ["STUDENT"],
      "status": "ACTIVE",
      "createdAt": "2026-10-29T15:14:39Z",
      "lastLoginAt": "2026-10-29T15:15:10Z"
    },
    "refreshTokenExpiry": "2026-11-28T15:15:10Z"
  }
  ```
  *Kèm header `Set-Cookie: refreshToken=...; Path=/api/v1/auth; HttpOnly; SameSite=Lax`.*

### 3.2. Làm mới phiên đăng nhập (Refresh Token)
- **Method:** `POST`
- **Endpoint:** `/api/v1/auth/refresh` (hoặc `/api/v1/auth/refresh-token`)
- **Quyền:** Public (đọc token từ Cookie)
- **Response 200 OK:** Cấp Access Token mới và cập nhật Refresh Token Cookie mới.

### 3.3. Đăng xuất (Logout)
- **Method:** `POST`
- **Endpoint:** `/api/v1/auth/logout`
- **Quyền:** Public / Authenticated
- **Thực hiện:** Thu hồi Refresh Token hiện tại trên cơ sở dữ liệu, xóa cookie khỏi trình duyệt và làm sạch session.

### 3.4. Lấy thông tin tài khoản hiện tại (/me)
- **Method:** `GET`
- **Endpoint:** `/api/v1/auth/me`
- **Quyền:** Bắt buộc có Access Token hợp lệ (`[Authorize]`)
- **Response 200 OK:** `UserDto` chứa đầy đủ thông tin tài khoản, danh sách vai trò và trạng thái.
