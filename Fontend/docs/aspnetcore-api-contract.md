# HỢP ĐỒNG API TOÀN DIỆN (ASP.NET CORE 9/10 WEB API CONTRACT)
**Dự án:** ZhongWenHub  
**Phiên bản:** v13.3 (FE-13.3 Management Frontend Stabilization & ASP.NET Core Integration Readiness)  
**Công nghệ Backend mục tiêu:** ASP.NET Core Web API, C# 13, Entity Framework Core, PostgreSQL (Npgsql), ASP.NET Core Identity.

---

## 1. NGUYÊN TẮC THIẾT KẾ VÀ QUY ƯỚC CHUNG

### 1.1. Chuẩn RESTful & URL Path Naming
* Toàn bộ API được đặt dưới tiền tố phiên bản: `/api/v1/`
* Tài nguyên sử dụng danh từ số nhiều ở dạng `kebab-case` hoặc `lower_case` theo chuẩn REST:
  * `/api/v1/auth`
  * `/api/v1/users`
  * `/api/v1/roles`
  * `/api/v1/teachers`
  * `/api/v1/support/tickets`
  * `/api/v1/content/issues`
  * `/api/v1/content/videos`
  * `/api/v1/content/transcripts`
  * `/api/v1/hsk/levels`
  * `/api/v1/courses`
  * `/api/v1/lessons`
  * `/api/v1/vocabulary`
  * `/api/v1/grammar`
  * `/api/v1/exercises`
  * `/api/v1/learning/progress`
  * `/api/v1/analytics`
  * `/api/v1/ai`

### 1.2. JSON Serialization & DTO Conventions
* **Case Style:** Thuộc tính JSON sử dụng `camelCase` (ví dụ: `studentId`, `targetContentTitle`).
* **Identifiers:** Sử dụng `string` trên Frontend DTOs (Backend ánh xạ sang `Guid` hoặc `long`).
* **Date & Time:** Định dạng chuẩn ISO 8601 UTC kết thúc bằng `Z` (ví dụ: `2026-10-27T08:15:00Z`).
* **Nullable Fields:** Khai báo tường minh `null` thay vì `undefined` khi truyền payload từ server.
* **Enums:** Giá trị chuỗi ổn định (Stable String Enum), tuyệt đối không dùng số nguyên 0, 1, 2.

### 1.3. Cấu trúc phân trang nhất quán (PagedResponse<T>)
Mọi endpoint trả về danh sách phân trang tuân theo cấu trúc:
```json
{
  "items": [ ... ],
  "pageNumber": 1,
  "pageSize": 10,
  "totalItems": 42,
  "totalPages": 5,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

Tham số truy vấn lọc và phân trang (`PaginationQuery`):
* `pageNumber` (int, default = 1)
* `pageSize` (int, default = 10, max = 100)
* `search` (string, optional)
* `sortBy` (string, optional, e.g., `createdAt`)
* `sortDirection` (`asc` | `desc`, default = `desc`)

### 1.4. Xử lý lỗi theo chuẩn RFC 7807 / RFC 9457 (Problem Details)
Tất cả các lỗi mã trạng thái HTTP 4xx và 5xx đều trả về `application/problem+json`:
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "detail": "Dữ liệu gửi lên không vượt qua các kiểm tra tính hợp lệ.",
  "instance": "/api/v1/content/videos",
  "errors": {
    "Title": ["Tiêu đề video không được để trống."],
    "Duration": ["Thời lượng video phải lớn hơn 0 giây."]
  },
  "traceId": "00-9a2c3b4e5f6a7b8c-01"
}
```

Mã HTTP Status chuẩn:
* `200 OK`: Truy vấn hoặc cập nhật thành công có trả về dữ liệu.
* `201 Created`: Tạo mới thành công (kèm header `Location`).
* `204 No Content`: Thao tác thành công không cần dữ liệu phản hồi (xóa hoặc cập nhật không body).
* `400 Bad Request`: Lỗi cú pháp hoặc nghiệp vụ phía client.
* `401 Unauthorized`: Chưa xác thực hoặc Access Token hết hạn.
* `403 Forbidden`: Đã xác thực nhưng không đủ quyền hoặc Role bị từ chối.
* `404 Not Found`: Không tìm thấy tài nguyên theo định danh ID.
* `409 Conflict`: Xung đột dữ liệu (trùng username/email hoặc phiên bản concurrency).
* `422 Unprocessable Entity`: Dữ liệu vi phạm ràng buộc nghiệp vụ miền.
* `429 Too Many Requests`: Vượt quá giới hạn gọi API (Rate Limiting).
* `500 Internal Server Error`: Lỗi máy chủ (tuyệt đối không để lộ stack trace ra ngoài).

---

## 2. QUY TRÌNH BẢO MẬT VÀ PHÂN QUYỀN (JWT & RBAC)

### 2.1. Danh mục vai trò hệ thống (Roles Catalog)
```csharp
public static class Roles
{
    public const string SuperAdmin = "SUPER_ADMIN";
    public const string Admin = "ADMIN";
    public const string ContentManager = "CONTENT_MANAGER";
    public const string Teacher = "TEACHER";
    public const string Support = "SUPPORT";
    public const string Student = "STUDENT";
}
```

### 2.2. Phân chia ranh giới Bảo mật (Boundary Security)
* **Frontend RBAC:** Chỉ là tầng UX hỗ trợ ẩn/hiện điều hướng và thanh menu tương ứng với vai trò đăng nhập.
* **Backend Authorization:** ASP.NET Core áp dụng Policy-Based Authorization (`[Authorize(Policy = "...")]`) kiểm tra quyền hạn độc lập tại từng controller/action.
* **Token Storage:** Access Token được giữ thuần túy trong Memory (JS Runtime). Refresh Token được lưu trong `HttpOnly`, `Secure`, `SameSite=Strict` cookie có path giới hạn tại `/api/v1/auth`.

---

## 3. CHI TIẾT ENDPOINTS VÀ DTOS CỦA CÁC PHÂN HỆ

### 3.1. Phân hệ Xác thực & Người dùng (Auth & Users)

#### `POST /api/v1/auth/login`
* **Quyền:** Public
* **Request Body:**
  ```json
  {
    "usernameOrEmail": "quan.tm@example.com",
    "password": "SecurePassword123!",
    "rememberMe": true
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "usr-101",
      "username": "quantm",
      "email": "quan.tm@example.com",
      "displayName": "Trần Minh Quân",
      "roles": ["STUDENT"],
      "status": "ACTIVE",
      "createdAt": "2026-09-01T08:00:00Z",
      "updatedAt": null,
      "lastLoginAt": "2026-10-27T08:15:00Z"
    }
  }
  ```

#### `POST /api/v1/auth/refresh-token`
* **Quyền:** Public (nhận Refresh Token từ HttpOnly Cookie)
* **Headers:** `X-CSRF-TOKEN`
* **Response (200 OK):** Cấp Access Token mới.

#### `POST /api/v1/auth/logout`
* **Quyền:** Authenticated
* **Response (200 OK):** Thu hồi Refresh Token và xóa cookie.

---

### 3.2. Phân hệ Vé Hỗ Trợ (Support Tickets)

#### `GET /api/v1/support/tickets`
* **Quyền:** `ADMIN`, `SUPPORT`
* **Query Params:** `pageNumber`, `pageSize`, `search`, `status`, `priority`, `category`, `assignee`
* **Response (200 OK):** `PagedResponse<SupportTicketDto>`

#### `GET /api/v1/support/tickets/{id}`
* **Quyền:** `ADMIN`, `SUPPORT`
* **Response (200 OK):** `SupportTicketDto`

#### `POST /api/v1/support/tickets`
* **Quyền:** `STUDENT`, `SUPPORT`, `ADMIN`
* **Request Body:** `CreateSupportTicketDto`
* **Response (201 Created):** `SupportTicketDto`

#### `PATCH /api/v1/support/tickets/{id}/status`
* **Quyền:** `SUPPORT`, `ADMIN`
* **Request Body:**
  ```json
  {
    "status": "IN_PROGRESS",
    "note": "Đã liên hệ giáo viên phụ trách để kiểm tra âm thanh.",
    "actorName": "Trần Thuỳ Trang (Support)"
  }
  ```
* **Response (200 OK):** `SupportTicketDto`

#### `POST /api/v1/support/tickets/{id}/notes`
* **Quyền:** `SUPPORT`, `ADMIN`
* **Request Body:** `AddTicketNoteDto`
* **Response (200 OK):** `SupportTicketDto`

#### `POST /api/v1/support/tickets/{id}/escalate-content`
* **Quyền:** `SUPPORT`, `ADMIN`
* **Mô tả:** Chuyển tiếp phản ánh học liệu từ CSKH sang ban Quản lý học liệu (Content Manager).
* **Request Body:** `EscalateTicketDto`
* **Response (200 OK):**
  ```json
  {
    "ticket": { ... },
    "contentIssueId": "ISS-2026-009"
  }
  ```

---

### 3.3. Phân hệ Báo Cáo Lỗi Học Liệu (Content Issues)

#### `GET /api/v1/content/issues`
* **Quyền:** `ADMIN`, `CONTENT_MANAGER`, `SUPPORT`
* **Query Params:** `pageNumber`, `pageSize`, `search`, `status`, `priority`, `issueType`
* **Response (200 OK):** `PagedResponse<ContentIssueDto>`

#### `GET /api/v1/content/issues/{id}`
* **Quyền:** `ADMIN`, `CONTENT_MANAGER`, `SUPPORT`
* **Response (200 OK):** `ContentIssueDto`

#### `POST /api/v1/content/issues`
* **Quyền:** `SUPPORT`, `CONTENT_MANAGER`, `ADMIN`
* **Request Body:** `CreateContentIssueDto`
* **Response (201 Created):** `ContentIssueDto`

#### `PATCH /api/v1/content/issues/{id}/assign`
* **Quyền:** `ADMIN`, `CONTENT_MANAGER`
* **Request Body:**
  ```json
  {
    "contentManagerId": "cm-001",
    "contentManagerName": "Nguyễn Văn Minh (Content Manager)",
    "actor": "Nguyễn Văn Minh"
  }
  ```
* **Response (200 OK):** `ContentIssueDto`

#### `POST /api/v1/content/issues/{id}/resolve`
* **Quyền:** `CONTENT_MANAGER`
* **Request Body:**
  ```json
  {
    "resolutionNotes": "Đã sửa file audio tại giây thứ 45 và tải lại lên CDN.",
    "feedbackToSupport": "Nhờ CSKH thông báo cho học viên Bách nghe lại bài 5 HSK 3.",
    "actorName": "Nguyễn Văn Minh"
  }
  ```
* **Response (200 OK):** `ContentIssueDto`

#### `POST /api/v1/content/issues/{id}/reopen`
* **Quyền:** `SUPPORT`
* **Request Body:** `{ "reason": "Học viên phản hồi lỗi vẫn còn trên app iOS." }`
* **Response (200 OK):** `ContentIssueDto`

#### `POST /api/v1/content/issues/{id}/close`
* **Quyền:** `SUPPORT`
* **Response (200 OK):** `ContentIssueDto`

---

### 3.4. Phân hệ Video & Phụ Đề Hội Thoại (Video Management)

#### `GET /api/v1/content/videos`
* **Quyền:** `ADMIN`, `CONTENT_MANAGER`
* **Query Params:** `pageNumber`, `pageSize`, `search`, `hskLevel`, `status`, `topic`
* **Response (200 OK):** `PagedResponse<VideoContentDto>`

#### `GET /api/v1/content/videos/{id}`
* **Quyền:** `ADMIN`, `CONTENT_MANAGER`, `STUDENT` (học viên chỉ xem được video `PUBLISHED`)
* **Response (200 OK):** `VideoContentDto`

#### `POST /api/v1/content/videos`
* **Quyền:** `CONTENT_MANAGER`, `ADMIN`
* **Request Body:** `CreateVideoDto`
* **Response (201 Created):** `VideoContentDto`

#### `PUT /api/v1/content/videos/{id}`
* **Quyền:** `CONTENT_MANAGER`, `ADMIN`
* **Request Body:** `UpdateVideoDto`
* **Response (200 OK):** `VideoContentDto`

#### `PUT /api/v1/content/videos/{id}/transcripts`
* **Quyền:** `CONTENT_MANAGER`, `ADMIN`
* **Request Body:** `TranscriptSegmentDto[]`
* **Response (200 OK):** `VideoContentDto`

#### `DELETE /api/v1/content/videos/{id}`
* **Quyền:** `CONTENT_MANAGER`, `ADMIN`
* **Response (204 No Content)`
