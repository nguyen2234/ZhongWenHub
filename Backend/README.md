# ZhongWenHub Backend — Consolidated Feature Architecture

ASP.NET Core Web API 10.0 + Microsoft SQL Server + Entity Framework Core 10 + ASP.NET Core Identity + JWT + RBAC.

## 1. Yêu Cầu Môi Trường
* .NET SDK 10.0 (`dotnet --version`)
* Microsoft SQL Server (`.\SQLEXPRESS` hoặc Docker SQL Server 2022)
* Công cụ EF Core CLI (`dotnet tool install --global dotnet-ef` hoặc `dotnet ef`)

## 2. Cấu Trúc Solution (Consolidated 2-Project Architecture)
```text
Backend/
├── ZhongWenHub.sln                    # Solution gồm chính xác 2 projects
├── ZhongWenHub/                       # Web API project duy nhất theo cấu trúc Feature
│   ├── Common/                        # AI router, security, database context, middleware
│   ├── Features/
│   │   ├── admin/                     # Admin, Content, Support, System features
│   │   └── users/                     # Auth, AILearning, AITutor, Learning, Exams, Videos
│   ├── Migrations/                    # EF Core Migrations
│   ├── Program.cs                     # Startup, DI container, Route configuration
│   └── ZhongWenHub.csproj
├── ZhongWenHub.Tests/                 # Test project duy nhất gom Unit, SQL & Integration
│   ├── Features/                      # Feature unit tests
│   ├── Integration/                   # WebApplicationFactory integration test suites
│   ├── Support/                       # Test doubles & helpers
│   └── ZhongWenHub.Tests.csproj
├── docs/                              # API guides, baselines, security docs
└── docker-compose.yml                 # SQL Server 2022 container orchestration
```

## 3. Khởi Chạy Database
Kết nối SQL Server cục bộ (`.\SQLEXPRESS` hoặc Docker SQL Server 2022 qua `Backend/docker-compose.yml`).
- Test database cô lập: `ZhongWenHub_Test`.
- Quy tắc an toàn: Không ghi vào `ZhongWenHub_Dev`.

## 4. Chạy Migrations
Áp dụng migrations vào SQL Server:
```bash
dotnet ef database update --project Backend/ZhongWenHub/ZhongWenHub.csproj --startup-project Backend/ZhongWenHub/ZhongWenHub.csproj --context ApplicationDbContext
```

## 5. Chạy API
```bash
dotnet run --project Backend/ZhongWenHub/ZhongWenHub.csproj
```
Truy cập:
* Swagger UI: `http://localhost:5000/swagger`
* Health check: `http://localhost:5000/health`
* System health: `http://localhost:5000/api/v1/system/health`

## 6. Chạy Kiểm Thử
```bash
dotnet test Backend/ZhongWenHub.Tests/ZhongWenHub.Tests.csproj
```

## 7. Tài Khoản Seed Mặc Định (Môi trường Dev/Test)
* **Super Admin:** `superadmin@zhongwenhub.edu.vn` / `SuperAdmin123!` (Role: `SUPER_ADMIN`)
* **Admin:** `admin@zhongwenhub.edu.vn` / `AdminPassword123!` (Role: `ADMIN`)
* **Content Manager:** `contentmanager@zhongwenhub.edu.vn` / `ContentManager123!` (Role: `CONTENT_MANAGER`)
* **Teacher:** `teacher@zhongwenhub.edu.vn` / `TeacherPassword123!` (Role: `TEACHER`)
* **Support:** `support@zhongwenhub.edu.vn` / `SupportPassword123!` (Role: `SUPPORT`)
* **Student:** `student@zhongwenhub.edu.vn` / `StudentPassword123!` (Role: `STUDENT`)
