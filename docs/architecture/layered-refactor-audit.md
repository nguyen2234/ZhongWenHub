# BÁO CÁO CHI TIẾT & KẾ HOẠCH REFACTOR SANG LAYERED ARCHITECTURE (PHIÊN BẢN HIỆU CHỈNH)

> **Dự án:** ZhongWenHub — Đồ án tốt nghiệp CNTT  
> **Tài liệu:** Kế hoạch Tái cấu trúc Kiến trúc Phân tầng (Layered Architecture) Toàn diện  
> **Phiên bản:** 2.0 (Cập nhật theo yêu cầu kiến trúc chuyên sâu)  
> **Ngày cập nhật:** 29/10/2026  
> **Người lập:** Senior Software Architect & Full-Stack Engineer  
> **Trạng thái:** Chờ phê duyệt lần cuối (Chưa sửa mã nguồn, chưa đổi branch, chưa tác động database)

---

## 1. PHÂN LOẠI THỰC THỂ: PERSISTENCE ENTITIES VS BUSINESS ENTITIES & MODELS

Một sai lầm phổ biến khi áp dụng Clean Architecture/DDD một cách máy móc là **tạo ra 2 bộ thực thể song song**: một bộ "Domain Entity" thuần túy và một bộ "Persistence Entity" cho EF Core, rồi sử dụng mapper (AutoMapper) để sao chép qua lại từng thuộc tính. Trong đồ án tốt nghiệp và các hệ thống thực tế quy mô vừa, cách làm này dẫn đến:
- Nhân đôi số lượng class mà không có giá trị nghiệp vụ thực chất.
- Phá vỡ tính năng `ChangeTracker` mạnh mẽ của EF Core.
- Gây chậm hiệu năng và phát sinh lỗi mapping ngầm.

### 1.1. Phân định rõ ràng giữa hai khái niệm

| Tiêu chí | Persistence Entities (Thực thể Dữ liệu) | Business Models / DTOs (Mô hình Nghiệp vụ) |
| :--- | :--- | :--- |
| **Vị trí** | `ZhongWenHub.Data/Entities/` | `ZhongWenHub.Business/{Module}/DTOs/` hoặc `Models/` |
| **Bản chất** | Đại diện 1-1 cho các bảng (tables) trong PostgreSQL. Là các POCO được EF Core quản lý trạng thái (`State`). | Đại diện cho dữ liệu đầu vào (Request), đầu ra (Response) hoặc trạng thái tính toán nghiệp vụ trong bộ nhớ. |
| **Nhiệm vụ** | Lưu trữ dữ liệu, định nghĩa khóa chính, quan hệ (1-N, N-N), kiểu dữ liệu SQL (`timestamptz`, `text`), index. | Đảm bảo tính toàn vẹn nghiệp vụ, validation, lọc dữ liệu nhạy cảm (không lộ PasswordHash, SecurityStamp), định dạng theo API contract. |
| **Ví dụ cụ thể** | `ApplicationUser`, `ApplicationRole`, `RefreshToken`, `AuthAuditRecord`, `BaseEntity`, `UserStatus`. | `LoginRequestDto`, `LoginResponseDto`, `UserDto`, `AdminUserListItemDto`, `AdminUserDetailDto`, `LockUserRequestDto`, `UpdateUserRolesDto`. |

### 1.2. Logic Nghiệp vụ (Business/Domain Logic) nằm ở đâu?
- Các quy tắc nghiệp vụ bất biến không nằm rải rác trong Database Entities mà được tập trung tại **Business Services** (`AuthService`, `AdminUserService`, `JwtTokenService`):
  - Quy tắc khóa tài khoản: Khi khóa (`LOCKED`), tự động ghi nhận `LockReason`, thời điểm `LockedAt`, và **thu hồi toàn bộ Refresh Tokens** của người dùng đó.
  - Quy tắc phân quyền: Chỉ người có quyền `SUPER_ADMIN` mới được phân quyền `SUPER_ADMIN`; không được phép khóa hoặc hạ quyền tài khoản `SUPER_ADMIN` cuối cùng.
  - Quy tắc luân chuyển Token: Phát hiện token reuse, kiểm tra hạn sử dụng, ký JWT theo đúng chuẩn HMAC-SHA256.
- **Kết luận:** `ZhongWenHub.Data` chứa các Persistence Entities. `ZhongWenHub.Business` tham chiếu `ZhongWenHub.Data` để thao tác trực tiếp trên các Entity này, đồng thời chịu trách nhiệm kiểm soát toàn bộ nghiệp vụ và chuyển đổi thành Business DTOs. **Không tạo lớp Entity trùng lặp.**

---

## 2. RANH GIỚI GIỮA BUSINESS LOGIC VÀ EF CORE / ASP.NET IDENTITY

Khi chuyển `AuthService` và `AdminUserService` từ `Infrastructure` sang `ZhongWenHub.Business`, chúng ta cần xác định ranh giới phụ thuộc mạch lạc:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                     ZhongWenHub.Business                               │
│                                                                        │
│  [Business Logic]                                                      │
│  - Kiểm tra mật khẩu & chính sách lockout                              │
│  - Kiểm tra trạng thái tài khoản (ACTIVE, LOCKED, SUSPENDED)          │
│  - Chống leo quyền (Anti-Privilege Escalation Rules)                   │
│  - Chính sách Token Rotation & Reuse Detection                         │
│  - Sinh JWT Claims & Audit Log payload                                 │
│                                                                        │
│  Gọi thông qua Interface / Framework Abstraction:                      │
│  ├── UserManager<ApplicationUser>  ───┐                                │
│  ├── RoleManager<ApplicationRole>  ───┼── (Được cung cấp từ            │
│  └── ApplicationDbContext          ───┘    ZhongWenHub.Data)           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ References
┌───────────────────────────────────▼────────────────────────────────────┐
│                       ZhongWenHub.Data                                 │
│                                                                        │
│  [Data Persistence & Mapping]                                          │
│  - Identity Store (EF Core Implementation)                             │
│  - PostgreSQL DbContext & Model Configuration (Fluent API)             │
│  - Database Migrations & Version History                               │
│  - Database Seeding (DbInitializer)                                    │
│  - Entity Definitions & Constraints (Foreign Keys, Indexes)            │
└────────────────────────────────────────────────────────────────────────┘
```

### Tại sao không tạo thêm `IUserRepository` hay `IRefreshTokenRepository`?
- **KISS & YAGNI:** Microsoft đã thiết kế `UserManager<TUser>` và `RoleManager<TRole>` chính là lớp quản lý truy cập và bảo mật tài khoản chuẩn mực của ASP.NET Core. Việc viết thêm `UserRepository` chỉ để bọc lại `_userManager.FindByEmailAsync()` hoặc `_userManager.CreateAsync()` là hoàn toàn dư thừa (anti-pattern "Repository on top of Repository").
- EF Core `ApplicationDbContext` đã là một **Unit of Work**, và các `DbSet<T>` đã là các **Repository**. Tầng Business sử dụng trực tiếp các đối tượng này để thực hiện truy vấn LINQ bất đồng bộ (`ToListAsync`, `FirstOrDefaultAsync`, `AsNoTracking`), đảm bảo code ngắn gọn, dễ đọc và tối ưu truy vấn SQL.
- **Loại bỏ `IApplicationDbContext`:** Trong Clean Architecture cũ, interface này chỉ khai báo các `DbSet` một cách máy móc. Trong Layered Architecture, Business tham chiếu trực tiếp Data nên có thể sử dụng `ApplicationDbContext` trực tiếp, giảm bớt 1 interface không cần thiết.

---

## 3. FRONTEND: SO SÁNH PURE LAYERED VS HYBRID (LAYERED + FEATURE-BASED)

Frontend hiện tại có **26 features** ở phân hệ học viên (`auth`, `learning`, `vocabulary`, `dashboard`, `classes`, `ai-tutor`, v.v.) và **4 phân hệ quản trị** (`admin`, `teacher`, `content-manager`, `support`).

### 3.1. Bảng so sánh 2 phương án tổ chức Frontend

| Tiêu chí | Phương án A: Pure Layered Architecture (Phân tầng thuần túy) | Phương án B: Hybrid (Layered bên trong Feature Modules) |
| :--- | :--- | :--- |
| **Mô tả cấu trúc** | Tách toàn bộ dự án thành 3 thư mục khổng lồ cấp cao nhất:<br>`src/presentation/`<br>`src/application/`<br>`src/data/` | Phân tầng ở cấp hạ tầng dùng chung (`core/` & `shared/`), kết hợp đóng gói phân tầng bên trong từng Feature Module (`features/` & `management/`). |
| **Trải nghiệm phát triển (DX)** | **Rất kém (Shotgun Surgery):** Khi muốn sửa 1 màn hình Từ vựng, lập trình viên phải mở đồng thời 4 thư mục cách xa nhau: `presentation/pages/`, `presentation/components/`, `application/services/`, `data/api/`. | **Rất cao (High Cohesion):** Mọi thứ liên quan đến tính năng Từ vựng nằm gọn trong thư mục tính năng đó (`pages`, `components`, `services`, `types`). |
| **Khả năng làm việc nhóm đồ án** | Dễ xung đột Git (Merge conflicts) do tất cả thành viên cùng sửa vào các thư mục `presentation/` hoặc `data/`. | Từng thành viên phụ trách từng feature độc lập mà không đụng chạm đến code của người khác. |
| **Ảnh hưởng đến mã nguồn hiện tại** | Phải di chuyển hàng trăm file, thay đổi toàn bộ import paths, nguy cơ phá vỡ 262 bài test hiện có là cực cao. | Tái cấu trúc chuẩn hóa, tái sử dụng cấu trúc `features/` và `management/` hiện tại, **rủi ro gần như bằng 0**. |
| **Phù hợp với hệ sinh thái React** | Đi ngược lại nguyên lý Co-location và Best Practices của React/Vite hiện đại. | Đúng chuẩn Best Practice khuyến nghị của React, Redux Styleguide và Next.js. |

### 3.2. Cấu trúc Frontend đề xuất (Phương án B - Hybrid)

```text
Fontend/src/
│
├── app/                                    # 1. Ứng dụng & Cấu hình gốc
│   ├── router/                             # Routing hệ thống (AppRouter, route guards)
│   ├── providers/                          # AppProviders, SessionRestore
│   └── App.tsx
│
├── core/                                   # 2. Tầng Dữ liệu & Hạ tầng Kỹ thuật Dùng chung (Data Access)
│   ├── api/                                # HTTP Client, ApiConfig, Error Handling (ProblemDetails)
│   ├── storage/                            # Quản lý Cookie, LocalStorage adapter
│   └── types/                              # DTOs chuẩn hệ thống (ApiProblemDetails, PagedResponse)
│
├── features/                               # 3. Các Module Nghiệp vụ Học viên (Mỗi module tự phân tầng)
│   ├── auth/                               # Module Xác thực
│   │   ├── pages/                          # [Presentation] LoginPage.tsx
│   │   ├── components/                     # [Presentation] LoginForm, SocialButtons
│   │   ├── services/                       # [Application] authService.ts, sessionLogic
│   │   └── types/                          # [Data/Contract] auth.types.ts
│   ├── learning/                           # Module Học tập & Lộ trình
│   │   ├── pages/                          # [Presentation]
│   │   ├── components/                     # [Presentation]
│   │   └── services/                       # [Application] learning-srs.service.ts
│   └── vocabulary/                         # Module Từ vựng (tương tự)
│
├── management/                             # 4. Các Phân hệ Quản trị (Admin, Teacher, Content, Support)
│   ├── admin/
│   │   └── users/                          # Quản lý người dùng
│   │       ├── pages/                      # [Presentation] AdminUsersPage.tsx
│   │       ├── components/                 # [Presentation] UserTable, LockModal
│   │       ├── services/                   # [Application] user.service.ts
│   │       └── types/                      # [Data/Contract] user.types.ts
│   ├── teacher/                            # Phân hệ Giáo viên
│   ├── content-manager/                    # Phân hệ Quản lý Nội dung
│   └── shared/                             # Layouts & Guards dùng chung cho Management
│
├── layouts/                                # 5. Layouts Hệ thống (StudentLayout, ManagementLayout, AuthLayout)
└── shared/                                 # 6. Thành phần UI Dùng chung (Design System Components, Utils, Assets)
```

---

## 4. KẾ HOẠCH SAO LƯU & PHỤC HỒI POSTGRESQL (DATABASE BACKUP PLAN)

> ⚠️ **NGUYÊN TẮC:** Git chỉ quản lý mã nguồn tệp tin, **không quản lý dữ liệu trong PostgreSQL**. Do đó, việc chuyển đổi Git branch không thể khôi phục database nếu xảy ra lỗi làm thay đổi hoặc mất dữ liệu.

### 4.1. Thông tin Database hiện tại
- **Hệ quản trị:** PostgreSQL 18 (chạy local trên port 5432).
- **Đường dẫn công cụ:** `C:\Program Files\PostgreSQL\18\bin\pg_dump.exe` và `psql.exe`.
- **Database phát triển:** `zhongwenhub_dev` (chứa dữ liệu phân quyền, user đã seed).
- **Database kiểm thử:** `zhongwenhub_test` (chứa dữ liệu kiểm thử integration tests).
- **Thư mục lưu bản sao lưu:** `D:\ZhongWenHub\docs\backups\` (được thêm vào `.gitignore` để không đẩy lên GitHub).

### 4.2. Quy trình Thực hiện Sao lưu (Thực thi TRƯỚC KHI refactor)
Chạy script PowerShell sau với quyền truy cập PostgreSQL:

```powershell
# 1. Tạo thư mục chứa backup nếu chưa có
New-Item -ItemType Directory -Force -Path "D:\ZhongWenHub\docs\backups"

# 2. Thiết lập mật khẩu môi trường
$env:PGPASSWORD = "postgres"
$dumpExe = "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"

# 3. Xuất file backup dạng SQL plain text và custom archive cho zhongwenhub_dev
& $dumpExe -h localhost -p 5432 -U postgres -d zhongwenhub_dev -F c -b -v -f "D:\ZhongWenHub\docs\backups\zhongwenhub_dev_pre_refactor.dump"
& $dumpExe -h localhost -p 5432 -U postgres -d zhongwenhub_dev -f "D:\ZhongWenHub\docs\backups\zhongwenhub_dev_pre_refactor.sql"

# 4. Xuất file backup cho zhongwenhub_test
& $dumpExe -h localhost -p 5432 -U postgres -d zhongwenhub_test -f "D:\ZhongWenHub\docs\backups\zhongwenhub_test_pre_refactor.sql"

# 5. Kiểm tra kích thước file sao lưu
Get-ChildItem "D:\ZhongWenHub\docs\backups"
```

### 4.3. Quy trình Phục hồi Database khi có sự cố (Rollback Plan)
Nếu trong quá trình refactor phát sinh bất kỳ lỗi schema hoặc mất dữ liệu nào, thực hiện phục hồi ngay lập tức:

```powershell
$env:PGPASSWORD = "postgres"
$psqlExe = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$restoreExe = "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe"

# 1. Đóng toàn bộ kết nối hiện tại tới database
& $psqlExe -h localhost -p 5432 -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'zhongwenhub_dev' AND pid <> pg_backend_pid();"

# 2. Xóa và tạo lại database rỗng
& $psqlExe -h localhost -p 5432 -U postgres -d postgres -c "DROP DATABASE IF EXISTS zhongwenhub_dev;"
& $psqlExe -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE zhongwenhub_dev;"

# 3. Phục hồi nguyên trạng từ bản dump
& $restoreExe -h localhost -p 5432 -U postgres -d zhongwenhub_dev -v "D:\ZhongWenHub\docs\backups\zhongwenhub_dev_pre_refactor.dump"
```

---

## 5. KIỂM SOÁT EF CORE MIGRATIONS KHI ĐỔI TÊN PROJECT & NAMESPACE

### 5.1. Cơ chế hoạt động của `__EFMigrationsHistory`
Trong PostgreSQL, EF Core chỉ duy trì một bảng duy nhất là `__EFMigrationsHistory` với cấu trúc:
```sql
CREATE TABLE "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);
```
- Bảng này **KHÔNG LƯU** tên project C# (`ZhongWenHub.Infrastructure` hay `ZhongWenHub.Data`).
- Bảng này **KHÔNG LƯU** namespace của C#.
- Do đó, việc di chuyển các file migration sang `ZhongWenHub.Data` **hoàn toàn không làm ảnh hưởng đến lịch sử migration của database**.

### 5.2. Nguy cơ tiềm ẩn & Cách kiểm soát
- **Nguy cơ:** Khi đổi namespace của các Entity (`ApplicationUser`, `RefreshToken`, v.v.), nếu cấu hình Fluent API trong `ApplicationDbContext.OnModelCreating` bị thiếu sót hoặc class `ApplicationDbContextModelSnapshot` bị sai lệch, EF Core sẽ phát hiện "Model changes" và tự động sinh ra migration mới làm thay đổi cấu trúc bảng hoặc drop cột.
- **Biện pháp kiểm soát bắt buộc:**
  1. Giữ nguyên toàn bộ cấu hình Fluent API trong `ApplicationDbContext.cs` (tên bảng `users`, `roles`, `refresh_tokens`, `auth_audit_records`; tên cột; kiểu `timestamptz`).
  2. Cập nhật `MigrationsAssembly` trong chuỗi đăng ký DbContext trỏ chính xác về assembly `ZhongWenHub.Data`.
  3. Sau khi di chuyển code, chạy lệnh kiểm tra:
     ```powershell
     dotnet ef migrations has-pending-model-changes --project src/ZhongWenHub.Data --startup-project src/ZhongWenHub.Api
     ```
     Lệnh này **phải trả về `No model changes have been detected`**.
  4. **Cam kết tuyệt đối:** Không tự động tạo thêm migration mới và không chạy lệnh thay đổi database.

---

## 6. DANH SÁCH CHÍNH XÁC CÁC FILE DI CHUYỂN, THAY ĐỔI VÀ GIỮ NGUYÊN

### 6.1. Danh sách File Di chuyển (Source $\rightarrow$ Destination)

#### A. Sang `ZhongWenHub.Data` (Data Access Layer):
1. `Backend/src/ZhongWenHub.Domain/Common/BaseEntity.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Data/Entities/BaseEntity.cs`
2. `Backend/src/ZhongWenHub.Domain/Enums/UserStatus.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Data/Entities/UserStatus.cs`
3. `Backend/src/ZhongWenHub.Domain/Entities/RefreshToken.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Data/Entities/RefreshToken.cs`
4. `Backend/src/ZhongWenHub.Domain/Entities/AuthAuditRecord.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Data/Entities/AuthAuditRecord.cs`
5. `Backend/src/ZhongWenHub.Infrastructure/Identity/ApplicationUser.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Data/Entities/ApplicationUser.cs`
6. `Backend/src/ZhongWenHub.Infrastructure/Identity/ApplicationRole.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Data/Entities/ApplicationRole.cs`
7. `Backend/src/ZhongWenHub.Infrastructure/Persistence/ApplicationDbContext.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Data/Persistence/ApplicationDbContext.cs`
8. `Backend/src/ZhongWenHub.Infrastructure/Persistence/ApplicationDbContextFactory.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Data/Persistence/ApplicationDbContextFactory.cs`
9. `Backend/src/ZhongWenHub.Infrastructure/Persistence/DbInitializer.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Data/Persistence/DbInitializer.cs`
10. `Backend/src/ZhongWenHub.Infrastructure/Persistence/Migrations/*` $\rightarrow$ `Backend/src/ZhongWenHub.Data/Persistence/Migrations/*` (toàn bộ 5 files migration và snapshot)

#### B. Sang `ZhongWenHub.Business` (Business Logic Layer):
1. `Backend/src/ZhongWenHub.Domain/Constants/RoleConstants.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Business/Authorization/RoleConstants.cs`
2. `Backend/src/ZhongWenHub.Domain/Constants/PolicyConstants.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Business/Authorization/PolicyConstants.cs`
3. `Backend/src/ZhongWenHub.Application/Abstractions/IAuthService.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Business/Authentication/IAuthService.cs`
4. `Backend/src/ZhongWenHub.Infrastructure/Services/AuthService.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Business/Authentication/AuthService.cs`
5. `Backend/src/ZhongWenHub.Application/Abstractions/IJwtTokenService.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Business/Authentication/IJwtTokenService.cs`
6. `Backend/src/ZhongWenHub.Infrastructure/Authentication/JwtTokenService.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Business/Authentication/JwtTokenService.cs`
7. `Backend/src/ZhongWenHub.Infrastructure/Authentication/JwtSettings.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Business/Authentication/JwtSettings.cs`
8. `Backend/src/ZhongWenHub.Application/DTOs/Auth/*` $\rightarrow$ `Backend/src/ZhongWenHub.Business/Authentication/DTOs/*` (4 files)
9. `Backend/src/ZhongWenHub.Application/Abstractions/IAdminUserService.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Business/Users/IAdminUserService.cs`
10. `Backend/src/ZhongWenHub.Infrastructure/Services/AdminUserService.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Business/Users/AdminUserService.cs`
11. `Backend/src/ZhongWenHub.Application/Abstractions/ICurrentUserService.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Business/Users/ICurrentUserService.cs`
12. `Backend/src/ZhongWenHub.Infrastructure/Services/CurrentUserService.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Business/Users/CurrentUserService.cs`
13. `Backend/src/ZhongWenHub.Application/DTOs/Users/*` $\rightarrow$ `Backend/src/ZhongWenHub.Business/Users/DTOs/*` (9 files)
14. `Backend/src/ZhongWenHub.Application/Abstractions/IDateTimeProvider.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Business/Common/IDateTimeProvider.cs`
15. `Backend/src/ZhongWenHub.Application/Services/DateTimeProvider.cs` $\rightarrow$ `Backend/src/ZhongWenHub.Business/Common/DateTimeProvider.cs`
16. `Backend/src/ZhongWenHub.Application/DTOs/Common/*` $\rightarrow$ `Backend/src/ZhongWenHub.Business/Common/DTOs/*` (4 files)

### 6.2. Thay đổi Project References

| Project | References cũ (Trước) | References mới (Sau) |
| :--- | :--- | :--- |
| **ZhongWenHub.Api** | `ZhongWenHub.Application.csproj`<br>`ZhongWenHub.Infrastructure.csproj` | `ZhongWenHub.Business.csproj`<br>`ZhongWenHub.Data.csproj` (cho composition root) |
| **ZhongWenHub.Business** | *(Project mới)* | `ZhongWenHub.Data.csproj` |
| **ZhongWenHub.Data** | *(Project mới)* | *(Không phụ thuộc project nào khác)* |
| **ZhongWenHub.UnitTests** | `Domain`, `Application`, `Infrastructure` | `ZhongWenHub.Business.csproj`<br>`ZhongWenHub.Data.csproj` |
| **ZhongWenHub.IntegrationTests** | `ZhongWenHub.Api.csproj` | `ZhongWenHub.Api.csproj` (Giữ nguyên) |

### 6.3. Những file và thư mục GIỮ NGUYÊN TUYỆT ĐỐI (Không thay đổi)
- `Backend/src/ZhongWenHub.Api/Controllers/*` (Tất cả Controller giữ nguyên tên, HTTP route, status code).
- `Backend/src/ZhongWenHub.Api/Middleware/*` (`ProblemDetailsMiddleware`, `SecurityHeadersMiddleware`).
- `Backend/src/ZhongWenHub.Api/appsettings.json` và `appsettings.Development.json`.
- `Fontend/src/app/router/*` (Tất cả đường dẫn routes `/student/*`, `/management/*`, `/auth/*`).
- `Fontend/src/layouts/*` (Giao diện layout, sidebar, sticky pinning).
- `Fontend/src/design-system/*` (Tokens CSS `#E60012`, components atom).
- Thư mục `Fontend/` giữ nguyên tên (không đổi thành `Frontend`).
- Toàn bộ 26 files tests trong `Fontend/src/tests/`.

---

## 7. SO SÁNH ĐỘ PHỨC TẠP TRƯỚC VÀ SAU REFACTOR

### 7.1. Bảng so sánh chỉ số kiến trúc

| Tiêu chí | Trước Refactor (Clean Architecture cũ) | Sau Refactor (3-Tier Layered Architecture) | Đánh giá mức độ cải thiện |
| :--- | :--- | :--- | :--- |
| **Số lượng Project Backend** | 4 projects (`Domain`, `Application`, `Infrastructure`, `Api`) | **3 projects** (`Api`, `Business`, `Data`) | **Giảm 25%** số project, solution gọn gàng hơn |
| **Số lớp trung gian (Abstractions)** | Nhiều interface bao bọc máy móc (`IApplicationDbContext`) | Chỉ giữ interface có giá trị kiểm thử (`IAuthService`, `IAdminUserService`) | Giảm các interface rỗng không dùng đến |
| **Ranh giới logic nghiệp vụ** | Bị đảo lộn (`AuthService` bị đẩy sang `Infrastructure/Services`) | Nằm đúng vị trí nghiệp vụ tại `ZhongWenHub.Business` | Đúng bản chất trách nhiệm từng tầng |
| **Frontend Feature Cohesion** | Một số feature gọi trực tiếp client, một số dùng repository rời rạc | Chuẩn hóa theo mô hình Hybrid: Hạ tầng `core/`, nghiệp vụ `features/` | Giữ nguyên tính năng, tăng tốc phát triển |

### 7.2. So sánh thực tế: Số bước cần thực hiện để thêm 1 chức năng CRUD mới (Ví dụ: Module Quản lý Từ vựng HSK)

#### Quy trình CŨ (Clean Architecture - 10 bước qua 4 projects):
1. Mở `ZhongWenHub.Domain` $\rightarrow$ Tạo `Entities/VocabularyWord.cs`.
2. Mở `ZhongWenHub.Application` $\rightarrow$ Tạo `Abstractions/IVocabularyRepository.cs`.
3. Mở `ZhongWenHub.Application` $\rightarrow$ Tạo `DTOs/Vocabulary/VocabularyDto.cs`.
4. Mở `ZhongWenHub.Application` $\rightarrow$ Tạo `Abstractions/IVocabularyService.cs`.
5. Mở `ZhongWenHub.Infrastructure` $\rightarrow$ Cập nhật `ApplicationDbContext.cs` thêm `DbSet<VocabularyWord>`.
6. Mở `ZhongWenHub.Infrastructure` $\rightarrow$ Tạo `Repositories/VocabularyRepository.cs`.
7. Mở `ZhongWenHub.Infrastructure` $\rightarrow$ Đăng ký DI cho Repository.
8. Mở `ZhongWenHub.Application` $\rightarrow$ Tạo `Services/VocabularyService.cs`.
9. Mở `ZhongWenHub.Application` $\rightarrow$ Đăng ký DI cho Service.
10. Mở `ZhongWenHub.Api` $\rightarrow$ Tạo `Controllers/VocabularyController.cs`.
*$\Longrightarrow$ Phải nhảy qua 4 project, tạo 8 file và sửa 2 file cấu hình.*

#### Quy trình MỚI (Layered Architecture - 4 bước qua 3 projects):
1. **Tầng Data:** Tạo `Data/Entities/VocabularyWord.cs` và khai báo `DbSet<VocabularyWord>` trong `ApplicationDbContext.cs`.
2. **Tầng Business:** Tạo thư mục `Business/Vocabulary/` gồm DTOs, `IVocabularyService.cs` và `VocabularyService.cs` (gọi trực tiếp `ApplicationDbContext`).
3. **Đăng ký DI:** Thêm 1 dòng `services.AddScoped<IVocabularyService, VocabularyService>()` trong `Business/DependencyInjection.cs`.
4. **Tầng Presentation:** Tạo `Api/Controllers/VocabularyController.cs` tiêm `IVocabularyService`.
*$\Longrightarrow$ **Chỉ 4 bước ngắn gọn, giảm hơn 60% thao tác thừa, tăng tốc phát triển các giai đoạn BE-3 đến BE-10 lên gấp đôi!***

---

## 8. NGUYÊN TẮC THIẾT KẾ: ƯU TIÊN KISS, DRY & YAGNI

1. **KISS (Keep It Simple, Stupid):**
   - Loại bỏ các abstraction giả lập không có mục đích rõ ràng.
   - Luồng dữ liệu 1 chiều rõ ràng: Controller nhận HTTP $\rightarrow$ Business xử lý và kiểm tra quyền $\rightarrow$ Data truy vấn/lưu PostgreSQL.
2. **DRY (Don't Repeat Yourself):**
   - Không tạo 2 bộ Entity trùng lặp giữa Domain và Persistence.
   - Tái sử dụng `UserManager` của ASP.NET Core Identity thay vì tự viết lại logic hash password hoặc quản lý lockout.
3. **YAGNI (You Aren't Gonna Need It):**
   - Không áp dụng CQRS, MediatR, Event Sourcing, Generic Repository hay Unit of Work wrapper khi dự án là Monolith REST API.
   - **Tuyệt đối không tạo thư mục rỗng** cho các chức năng chưa triển khai (Lessons, Courses, Exercises, AI). Mỗi thư mục chỉ được tạo khi tính năng tương ứng (BE-3 đến BE-10) bắt đầu thực hiện.

---

## 9. BẢO TOÀN TOÀN BỘ CHỨC NĂNG VÀ KIỂM THỬ HIỆN CÓ

Hệ thống cam kết bảo toàn nguyên vẹn sau khi refactor:
1. **Authentication:** Đăng nhập, Đăng xuất, Lưu Refresh Token HttpOnly Cookie SHA-256, Token Rotation, chống Token Reuse.
2. **RBAC:** 6 vai trò chính thức (`SUPER_ADMIN`, `ADMIN`, `CONTENT_MANAGER`, `TEACHER`, `SUPPORT`, `STUDENT`) và 7 policies.
3. **User Management:** Xem danh sách, tìm kiếm, lọc theo vai trò/trạng thái, phân trang, khóa tài khoản (thu hồi token), mở khóa tài khoản, phân vai trò kèm chống leo quyền.
4. **Routing & UI Frontend:** 100% routes và portal điều hướng giữ nguyên.
5. **Kiểm thử:**
   - Backend `dotnet build` đạt 0 lỗi.
   - Script `verify_be2.ps1` đạt **6/6 test suites PASS**.
   - `bun run build` đạt 0 lỗi.
   - `bun test src/tests` đạt **262/262 tests PASS**.
   - Playwright E2E tests đạt **100% PASS**.

---

## 10. KẾ HOẠCH HÀNH ĐỘNG CỤ THỂ KHI ĐƯỢC PHÊ DUYỆT

Ngay sau khi nhận được sự phê duyệt chính thức từ bạn, tôi sẽ tiến hành theo đúng trình tự an toàn sau:

- **Bước 1 (Sao lưu):** Chạy lệnh sao lưu database ra `docs/backups/zhongwenhub_dev_pre_refactor.dump` và file `.sql`.
- **Bước 2 (Tạo nhánh Git):** Tạo branch riêng `refactor/layered-architecture-fe-be` từ `feat/be-2-authentication-rbac`.
- **Bước 3 (Refactor Backend):** 
  - Khởi tạo `ZhongWenHub.Data` và `ZhongWenHub.Business`.
  - Di chuyển các file theo danh sách mục 6.1.
  - Cập nhật references và Dependency Injection.
  - Kiểm tra `dotnet ef migrations has-pending-model-changes` (đảm bảo 0 pending changes).
  - Kiểm tra `dotnet build` và chạy `dotnet test`.
- **Bước 4 (Refactor Frontend):**
  - Chuẩn hóa hạ tầng `core/` và dọn dẹp các đường dẫn import theo mô hình Hybrid.
  - Chạy `bun run build` và `bun test src/tests` đảm bảo 262 bài test vượt qua 100%.
- **Bước 5 (Kiểm thử tích hợp & Nghiệm thu):**
  - Chạy backend daemon và chạy lại `verify_be2.ps1` (6/6 suites pass).
  - Chạy Playwright E2E.
- **Bước 6 (Tài liệu & Commit):**
  - Hoàn tất `docs/architecture/layered-architecture.md` và `docs/architecture/layered-refactor-report.md`.
  - Tạo các commit theo đúng chuẩn Conventional Commits.

---

> 🛑 **XÁC NHẬN TUÂN THỦ:**  
> Tôi xác nhận rằng **không có bất kỳ tệp mã nguồn nào bị thay đổi**, **không có branch mới nào được tạo**, **không có thao tác database nào được thực hiện**, và **không có commit nào được tạo ra** trong lượt phản hồi này.  
> Toàn bộ nội dung trên đã được cập nhật vào tệp kế hoạch [`docs/architecture/layered-refactor-audit.md`](file:///d:/ZhongWenHub/docs/architecture/layered-refactor-audit.md) để bạn xem xét và phê duyệt lần cuối.
