# KIẾN TRÚC BACKEND ZHONGWENHUB (CLEAN ARCHITECTURE)

## 1. Tổng quan Kiến trúc

Backend ZhongWenHub được xây dựng trên nền tảng **ASP.NET Core 8.0 Web API** áp dụng triệt để mô hình **Clean Architecture (Onion Architecture)** nhằm đảm bảo tính độc lập giữa các tầng, khả năng kiểm thử cao và ranh giới bảo mật nghiêm ngặt.

```
┌─────────────────────────────────────────────────────────────┐
│                       ZhongWenHub.Api                       │
│      Controllers, Middleware, OpenAPI/Swagger, Health       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  ZhongWenHub.Application                    │
│    DTOs, Abstractions, Service Contracts, Common Response   │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────┐  ┌────────────────────────────┐
│      ZhongWenHub.Domain     │  │ ZhongWenHub.Infrastructure │
│  Entities, Enums, Constants │  │ EF Core, Identity, Npgsql, │
│   (Zero External Dep)       │  │ JWT Service, Audit Logger  │
└─────────────────────────────┘  └────────────────────────────┘
```

## 2. Chi tiết các tầng

### 2.1. ZhongWenHub.Domain (Lõi Nghiệp Vụ)
- **Mục tiêu:** Định nghĩa các thực thể cốt lõi, enums và hằng số của hệ thống.
- **Ràng buộc:** Hoàn toàn không phụ thuộc vào ASP.NET Core, EF Core hay bất kỳ thư viện bên thứ ba nào.
- **Thành phần chính:**
  - `BaseEntity`: UUID id, CreatedAt, UpdatedAt.
  - `RefreshToken`: Quản lý vòng đời refresh token (token hash, expiration, revocation, reuse detection lineage).
  - `AuthAuditRecord`: Nhật ký kiểm toán bảo mật cho các hành vi xác thực.
  - `RoleConstants`: `SUPER_ADMIN`, `ADMIN`, `CONTENT_MANAGER`, `TEACHER`, `SUPPORT`, `STUDENT`.
  - `PolicyConstants`: Danh mục chính sách ủy quyền (Policy-Based Authorization).
  - `UserStatus`: Enum chuỗi trạng thái (`ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING_VERIFICATION`).

### 2.2. ZhongWenHub.Application (Tầng Ứng Dụng)
- **Mục tiêu:** Khai báo hợp đồng dịch vụ, DTOs, cơ chế phân trang và chuẩn hóa phản hồi lỗi.
- **Thành phần chính:**
  - `IApplicationDbContext`: Interface tương tác dữ liệu.
  - `IJwtTokenService`, `IAuthService`, `ICurrentUserService`, `IDateTimeProvider`.
  - DTOs: `LoginRequestDto`, `LoginResponseDto`, `UserDto`, `AuthResultDto`, `PagedResponse<T>`, `PaginationQuery`, `ApiProblemDetailsDto`, `SystemInfoResponseDto`.

### 2.3. ZhongWenHub.Infrastructure (Tầng Hạ Tầng)
- **Mục tiêu:** Hiện thực hóa các giao tiếp với cơ sở dữ liệu và hệ thống ngoài.
- **Thành phần chính:**
  - `ApplicationDbContext`: Kế thừa `IdentityDbContext<ApplicationUser, ApplicationRole, Guid>` cấu hình PostgreSQL qua Npgsql.
  - `ApplicationUser`: Mở rộng thuộc tính người dùng (DisplayName, AvatarUrl, Status, CreatedAt, LastLoginAt, Soft Delete).
  - `ApplicationRole`: Mở rộng thuộc tính vai trò (Description).
  - `JwtTokenService`: Sinh mã JWT ngắn hạn (15 phút) và Refresh Token ngẫu nhiên bảo mật 64 bytes (SHA-256 hash).
  - `AuthService`: Điều phối xác thực, bảo vệ chống Token Reuse Attack, ghi nhật ký kiểm toán.
  - `DbInitializer`: Tự động áp dụng migration và khởi tạo dữ liệu mẫu an toàn đa luồng.

### 2.4. ZhongWenHub.Api (Tầng Giao Diện Lập Trình Ứng Dụng)
- **Mục tiêu:** Cung cấp HTTP Endpoints tuân thủ RESTful, xử lý pipeline yêu cầu, bảo mật header và tài liệu hóa.
- **Thành phần chính:**
  - `AuthController`: Đăng nhập, gia hạn token, đăng xuất, truy vấn thông tin cá nhân.
  - `SystemController`: Thông tin hệ thống, kiểm tra kết nối cơ sở dữ liệu và các endpoint thử nghiệm quyền hạn.
  - `ProblemDetailsMiddleware`: Chặn và chuẩn hóa toàn bộ lỗi ngoại lệ theo chuẩn RFC 7807 (camelCase).
  - `SecurityHeadersMiddleware`: Thêm các tiêu đề bảo vệ trình duyệt (X-Content-Type-Options, X-Frame-Options, CSP).
