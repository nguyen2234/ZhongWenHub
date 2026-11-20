# TÀI LIỆU KIẾN TRÚC PHÂN TẦNG: ZHONGWENHUB LAYERED ARCHITECTURE

> **Dự án:** ZhongWenHub  
> **Phiên bản kiến trúc:** 3.0 (Layered Architecture)  
> **Ngày hoàn thành:** 29/10/2026  
> **Tác giả:** ZhongWenHub Architecture Team  

---

## 1. TỔNG QUAN HỆ THỐNG

ZhongWenHub được xây dựng theo mô hình **Monolith REST API** phân tầng rõ ràng (Layered Architecture), tuân thủ các nguyên tắc thiết kế phần mềm cốt lõi: **Separation of Concerns, KISS (Keep It Simple, Stupid), DRY (Don't Repeat Yourself) và YAGNI (You Aren't Gonna Need It)**.

Hệ thống bao gồm 2 phân hệ chính:
1. **Backend:** ASP.NET Core Web API (.NET 8) tổ chức theo **3 tầng**:
   - `ZhongWenHub.Api` (Presentation Layer)
   - `ZhongWenHub.Business` (Business Logic Layer)
   - `ZhongWenHub.Data` (Data Access Layer)
2. **Frontend:** React 19 + TypeScript + Vite + Bun tổ chức theo mô hình **Hybrid (Layered Architecture kết hợp Feature-Based Organization)**.

---

## 2. KIẾN TRÚC BACKEND (3 TẦNG)

### 2.1. Sơ đồ Quan hệ Phụ thuộc (Dependency Graph)

```text
┌────────────────────────────────────────────────────────┐
│               ZhongWenHub.Api                          │
│               (Presentation Layer)                     │
└──────────────────────────┬─────────────────────────────┘
                           │ References
                           ▼
┌────────────────────────────────────────────────────────┐
│               ZhongWenHub.Business                     │
│               (Business Logic Layer)                   │
└──────────────────────────┬─────────────────────────────┘
                           │ References
                           ▼
┌────────────────────────────────────────────────────────┐
│               ZhongWenHub.Data                         │
│               (Data Access Layer)                      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
                     PostgreSQL 18
```

> **Lưu ý tại Composition Root:** `ZhongWenHub.Api` là điểm khởi động (Entrypoint) của ứng dụng (`Program.cs`), do đó tham chiếu `ZhongWenHub.Data` chỉ để cấu hình chuỗi kết nối và gọi phương thức mở rộng `builder.Services.AddData(configuration)`. Controllers tuyệt đối không được truy cập trực tiếp `ZhongWenHub.Data`.

---

### 2.2. Trách nhiệm Chi tiết của Từng Tầng

#### 1. Presentation Layer (`ZhongWenHub.Api`)
- **Trách nhiệm:**
  - Nhận và xử lý các HTTP Requests.
  - Điều hướng và liên kết model (`[FromBody]`, `[FromQuery]`, `[FromRoute]`).
  - Thiết lập HTTP Status Codes và ProblemDetails chuẩn RFC 7807 (`400`, `401`, `403`, `404`, `500`).
  - Đăng ký và cấu hình Middleware (`SecurityHeadersMiddleware`, `ProblemDetailsMiddleware`, CORS).
  - Cấu hình Swagger/OpenAPI.
- **Ràng buộc:** Không chứa bất kỳ logic nghiệp vụ phức tạp nào, không truy vấn database hoặc gọi EF Core trực tiếp.

#### 2. Business Logic Layer (`ZhongWenHub.Business`)
- **Trách nhiệm:**
  - Chứa toàn bộ các Business Services: `AuthService`, `AdminUserService`, `JwtTokenService`, `CurrentUserService`.
  - Thực thi quy tắc bảo mật & RBAC: Chính sách Token Rotation, phát hiện Token Reuse, quy tắc chống leo quyền (Anti-Privilege Escalation), chính sách khóa tài khoản và thu hồi token tức thời.
  - Quản lý các Business Models & DTOs (Request/Response contracts).
  - Đăng ký các dịch vụ nghiệp vụ, JWT Bearer Authentication và 7 Authorization Policies trong `DependencyInjection.cs`.
- **Ràng buộc:** Phụ thuộc vào `ZhongWenHub.Data` để truy xuất thực thể và lưu trữ, nhưng không phụ thuộc vào tầng Presentation.

#### 3. Data Access Layer (`ZhongWenHub.Data`)
- **Trách nhiệm:**
  - Định nghĩa các Persistence Entities: `ApplicationUser`, `ApplicationRole`, `RefreshToken`, `AuthAuditRecord`, `BaseEntity`, `UserStatus`.
  - Quản lý `ApplicationDbContext` (cấu hình Fluent API bảng, quan hệ, kiểu dữ liệu PostgreSQL, query filters).
  - Quản trị ASP.NET Core Identity store (`AddIdentity<ApplicationUser, ApplicationRole>`).
  - Quản lý các file EF Core Migrations và Model Snapshot.
  - Khởi tạo và nạp dữ liệu hạt giống ban đầu (`DbInitializer`).
- **Ràng buộc:** Hoàn toàn độc lập, không tham chiếu bất kỳ project nội bộ nào khác trong Solution.

---

### 2.3. Cây Thư mục Thực tế Backend (Tối ưu hóa Thư mục Vật lý)

> **Quy ước Tên gọi & Phân biệt Rõ ràng:**
> - **Tên thư mục vật lý (Physical Folders):** `src/Api/`, `src/Business/`, `src/Data/` (ngắn gọn, trực quan, loại bỏ tiền tố dư thừa).
> - **Tên Project (.csproj & Assembly):** `ZhongWenHub.Api.csproj`, `ZhongWenHub.Business.csproj`, `ZhongWenHub.Data.csproj` (định danh toàn cục trong solution).
> - **Namespaces C#:** Giữ nguyên chuẩn hóa `ZhongWenHub.Api.*`, `ZhongWenHub.Business.*`, `ZhongWenHub.Data.*`.

```text
Backend/
├── ZhongWenHub.sln
│
├── src/
│   ├── Api/                               # ZhongWenHub.Api.csproj
│   │   ├── Controllers/
│   │   │   ├── AdminUsersController.cs
│   │   │   ├── AuthController.cs
│   │   │   ├── BaseApiController.cs
│   │   │   └── SystemController.cs
│   │   ├── Middleware/
│   │   │   ├── ProblemDetailsMiddleware.cs
│   │   │   └── SecurityHeadersMiddleware.cs
│   │   ├── Program.cs
│   │   ├── appsettings.json
│   │   └── appsettings.Development.json
│   │
│   ├── Business/                          # ZhongWenHub.Business.csproj
│   │   ├── Authentication/
│   │   │   ├── DTOs/
│   │   │   │   ├── AuthResultDto.cs
│   │   │   │   ├── LoginRequestDto.cs
│   │   │   │   ├── LoginResponseDto.cs
│   │   │   │   └── UserDto.cs
│   │   │   ├── AuthService.cs
│   │   │   ├── IAuthService.cs
│   │   │   ├── IJwtTokenService.cs
│   │   │   ├── JwtSettings.cs
│   │   │   └── JwtTokenService.cs
│   │   ├── Authorization/
│   │   │   └── PolicyConstants.cs
│   │   ├── Common/
│   │   │   ├── DTOs/
│   │   │   │   ├── ApiProblemDetailsDto.cs
│   │   │   │   ├── PagedResponse.cs
│   │   │   │   ├── PaginationQuery.cs
│   │   │   │   └── SystemInfoResponseDto.cs
│   │   │   ├── DateTimeProvider.cs
│   │   │   └── IDateTimeProvider.cs
│   │   ├── Users/
│   │   │   ├── DTOs/
│   │   │   │   ├── AdminUserDetailDto.cs
│   │   │   │   ├── AdminUserFilterDto.cs
│   │   │   │   ├── AdminUserKpisDto.cs
│   │   │   │   ├── AdminUserListItemDto.cs
│   │   │   │   ├── CreateAdminUserDto.cs
│   │   │   │   ├── LockUserRequestDto.cs
│   │   │   │   ├── UpdateAdminUserDto.cs
│   │   │   │   ├── UpdateUserRolesDto.cs
│   │   │   │   └── UserLearningSummaryDto.cs
│   │   │   ├── AdminUserService.cs
│   │   │   ├── CurrentUserService.cs
│   │   │   ├── IAdminUserService.cs
│   │   │   └── ICurrentUserService.cs
│   │   └── DependencyInjection.cs
│   │
│   └── Data/                              # ZhongWenHub.Data.csproj
│       ├── Constants/
│       │   └── RoleConstants.cs
│       ├── Entities/
│       │   ├── ApplicationRole.cs
│       │   ├── ApplicationUser.cs
│       │   ├── AuthAuditRecord.cs
│       │   ├── BaseEntity.cs
│       │   ├── RefreshToken.cs
│       │   └── UserStatus.cs
│       ├── Persistence/
│       │   ├── Migrations/
│       │   │   ├── 20261028134736_InitialCreate.cs
│       │   │   ├── 20261028134736_InitialCreate.Designer.cs
│       │   │   ├── 20261029220000_AddUserLockFields.cs
│       │   │   ├── 20261029220000_AddUserLockFields.Designer.cs
│       │   │   └── ApplicationDbContextModelSnapshot.cs
│       │   ├── ApplicationDbContext.cs
│       │   ├── ApplicationDbContextFactory.cs
│       │   └── DbInitializer.cs
│       └── DependencyInjection.cs
│
└── tests/
    ├── ZhongWenHub.UnitTests/
    │   ├── JwtTokenServiceTests.cs
    │   ├── PagedResponseTests.cs
    │   ├── PolicyConstantsTests.cs
    │   └── RefreshTokenEntityTests.cs
    └── ZhongWenHub.IntegrationTests/
        ├── AdminUsersIntegrationTests.cs
        ├── AuthIntegrationTests.cs
        ├── CustomWebApplicationFactory.cs
        ├── RbacAuthorizationIntegrationTests.cs
        └── SystemEndpointsIntegrationTests.cs
```

---

## 3. KIẾN TRÚC FRONTEND (HYBRID LAYERED + FEATURE-BASED)

### 3.1. Triết lý Tổ chức
Frontend áp dụng mô hình **Hybrid**:
- Tầng hạ tầng dùng chung (`core/` và `shared/`) chịu trách nhiệm cung cấp Data Access Client, Error Handling chuẩn, Design Tokens và Layouts.
- Các phân hệ nghiệp vụ (`features/` và `management/`) được đóng gói theo từng module. Mỗi module tự phân tầng nội bộ (`pages/`, `components/`, `services/`, `types/`).
- Điều này loại bỏ tình trạng **Shotgun Surgery** (sửa 1 chức năng phải mở 4 thư mục rời rạc), bảo toàn tính độc lập của từng nhóm chức năng, và bảo vệ 100% các bài test và UI hiện có.

```text
Fontend/src/
├── app/                  # Application Root: AppRouter, AppProviders, App.tsx
├── core/                 # Shared Data Access: HTTP Client, API Config, Error Handling
├── features/             # Student Features: auth, learning, vocabulary, dashboard, etc.
│   └── auth/             # LoginPage, LoginForm, authService, SessionRestore
├── management/           # Management Workspaces: admin, teacher, content-manager, support
│   └── admin/users/      # AdminUsersPage, UserTable, UserModals, userService
├── layouts/              # System Layouts: StudentLayout, ManagementLayout, AuthLayout
├── design-system/        # Design Tokens & UI Atoms (#E60012, Buttons, Badges)
├── types/                # System Roles & DTOs
└── shared/               # Utils & Assets
```

---

## 4. LUỒNG XỬ LÝ MỘT REQUEST ĐIỂN HÌNH (Ví dụ: Khóa tài khoản người dùng)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Quản Trị Viên (FE)
    participant API as AdminUsersController (Presentation)
    participant BUS as AdminUserService (Business)
    participant IDN as UserManager / EF Core (Data)
    participant DB as PostgreSQL 18

    Admin->>API: POST /api/v1/admin/users/{id}/lock (Reason: "Vi phạm quy chế")
    Note over API: Kiểm tra Bearer Token & Policy UserManagementAccess
    API->>BUS: LockUserAsync(id, reason, currentUserId, ip)
    Note over BUS: 1. Kiểm tra không được khóa SUPER_ADMIN trái phép<br/>2. Kiểm tra không khóa tài khoản chính mình<br/>3. Kiểm tra không khóa SUPER_ADMIN cuối cùng
    BUS->>IDN: user.Status = LOCKED; user.LockReason = reason
    BUS->>IDN: Revoke toàn bộ active Refresh Tokens của user
    BUS->>IDN: Ghi AuthAuditRecord ("LOCK_USER")
    IDN->>DB: UPDATE users; UPDATE refresh_tokens; INSERT auth_audit_records
    DB-->>IDN: Succeeded
    IDN-->>BUS: Succeeded
    BUS-->>API: (Success: true, AdminUserDetailDto)
    API-->>Admin: HTTP 200 OK (Chi tiết người dùng trạng thái LOCKED)
```

---

## 5. HƯỚNG DẪN THÊM CHỨC NĂNG CRUD MỚI (Ví dụ: Module Từ vựng HSK)

Nhờ kiến trúc 3 tầng tinh gọn, để thêm một module mới, chỉ cần thực hiện đúng **4 bước**:

### Bước 1: Tầng Data (`ZhongWenHub.Data`)
1. Tạo Entity tại `ZhongWenHub.Data/Entities/VocabularyWord.cs` kế thừa `BaseEntity`.
2. Khai báo `public DbSet<VocabularyWord> VocabularyWords => Set<VocabularyWord>();` trong `ApplicationDbContext.cs`.

### Bước 2: Tầng Business (`ZhongWenHub.Business`)
1. Tạo thư mục `ZhongWenHub.Business/Vocabulary/`.
2. Định nghĩa các DTOs: `VocabularyDto.cs`, `CreateVocabularyDto.cs`.
3. Định nghĩa Interface: `IVocabularyService.cs`.
4. Viết Service: `VocabularyService.cs` (tiêm `ApplicationDbContext` để truy vấn LINQ và thực hiện các business rules).

### Bước 3: Đăng ký Dependency Injection
- Mở `ZhongWenHub.Business/DependencyInjection.cs`, thêm dòng:
  ```csharp
  services.AddScoped<IVocabularyService, VocabularyService>();
  ```

### Bước 4: Tầng Presentation (`ZhongWenHub.Api`)
- Tạo Controller tại `ZhongWenHub.Api/Controllers/VocabularyController.cs` kế thừa `BaseApiController`, tiêm `IVocabularyService` và định nghĩa các HTTP Actions (`[HttpGet]`, `[HttpPost]`, `[HttpPut]`, `[HttpDelete]`).
