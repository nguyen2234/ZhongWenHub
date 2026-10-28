# TƯƠNG THÍCH HỢP ĐỒNG API VỚI FRONTEND (API CONTRACT COMPATIBILITY)

## 1. Tiêu Chuẩn Kết Nối
- **API Base Prefix:** `/api/v1/`
- **Quy tắc đặt tên thuộc tính JSON:** `camelCase` (ví dụ: `accessToken`, `expiresIn`, `displayName`).
- **Chuẩn hóa ngày giờ:** ISO 8601 UTC kết thúc bằng `Z` (`yyyy-MM-ddTHH:mm:ssZ`).
- **Chuẩn hóa lỗi:** RFC 7807 / RFC 9457 `application/problem+json`.

---

## 2. Đối Chiếu Hợp Đồng Xác Thực (Auth DTOs)

### 2.1. Đăng Nhập (`POST /api/v1/auth/login`)
- **Frontend DTO (`LoginRequestDto`):**
  ```typescript
  export interface LoginRequestDto {
    usernameOrEmail: string;
    password?: string;
    rememberMe?: boolean;
  }
  ```
- **Backend Model (`LoginRequestDto.cs`):**
  ```csharp
  public class LoginRequestDto {
      public string UsernameOrEmail { get; set; }
      public string Password { get; set; }
      public bool RememberMe { get; set; }
  }
  ```
- **Trạng thái:** ✅ **Hoàn toàn tương thích 100%**. Hỗ trợ cả tên đăng nhập lẫn email.

### 2.2. Phản Hồi Đăng Nhập (`LoginResponseDto`)
- **Frontend DTO (`LoginResponseDto`):**
  ```typescript
  export interface LoginResponseDto {
    accessToken: string;
    expiresIn: number;
    tokenType: 'Bearer';
    user: UserDto;
    refreshTokenExpiry?: string;
  }
  ```
- **Backend Model (`LoginResponseDto.cs`):**
  ```csharp
  public class LoginResponseDto {
      public string AccessToken { get; set; }
      public int ExpiresIn { get; set; }
      public string TokenType { get; set; } = "Bearer";
      public UserDto User { get; set; }
      public DateTime? RefreshTokenExpiry { get; set; }
  }
  ```
- **Trạng thái:** ✅ **Hoàn toàn tương thích 100%**.

### 2.3. Dữ Liệu Người Dùng (`UserDto`)
- **Frontend DTO (`UserDto`):**
  ```typescript
  export interface UserDto {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    roles: UserRole[];
    status: UserStatus;
    createdAt: string;
    updatedAt: string | null;
    lastLoginAt: string | null;
  }
  ```
- **Backend Model (`UserDto.cs`):** Ánh xạ đầy đủ các thuộc tính với id dạng chuỗi và timestamps chuẩn ISO 8601.
- **Trạng thái:** ✅ **Hoàn toàn tương thích 100%**.

### 2.4. Gia Hạn Token (`POST /api/v1/auth/refresh` & `/api/v1/auth/refresh-token`)
- **Frontend hỗ trợ:** Gửi Refresh Token qua HttpOnly Cookie hoặc request body `{ "refreshToken": "..." }`.
- **Backend:** Hỗ trợ đồng thời cả hai URL (`/api/v1/auth/refresh` và `/api/v1/auth/refresh-token`) và đọc từ cả Cookie lẫn Body.
- **Trạng thái:** ✅ **Hoàn toàn tương thích 100%**.

---

## 3. Cấu Trúc Phân Trang (`PagedResponse<T>`)
- **Frontend Contract:**
  ```json
  {
    "items": [],
    "pageNumber": 1,
    "pageSize": 20,
    "totalItems": 0,
    "totalPages": 0,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
  ```
- **Backend DTO (`PagedResponse<T>`):** Khai báo các thuộc tính trùng khớp hoàn toàn, tự động tính toán `totalPages`, `hasPreviousPage`, `hasNextPage`.
- **Trạng thái:** ✅ **Hoàn toàn tương thích 100%**.

---

## 4. Chuẩn Hóa Lỗi (Problem Details)
- Khi gặp lỗi 400, 401, 403, 404, 500: Toàn bộ trả về `application/problem+json` với:
  - `type`: Đường dẫn định danh loại lỗi.
  - `title`: Tiêu đề tóm tắt lỗi.
  - `status`: Mã trạng thái HTTP (int).
  - `detail`: Chi tiết lỗi.
  - `instance`: Đường dẫn API gây ra lỗi.
  - `errors`: Từ điển danh sách lỗi kiểm tra form validation theo từng trường (`Record<string, string[]>`).
  - `traceId`: Mã vết luồng xử lý.
- **Trạng thái:** ✅ **Hoàn toàn tương thích 100%**.
