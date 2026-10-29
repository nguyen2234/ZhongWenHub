# ZhongWenHub Backend — BE-1 Foundation

ASP.NET Core Web API 8.0 + PostgreSQL + Entity Framework Core + ASP.NET Core Identity + JWT + RBAC.

## 1. Yêu Cầu Môi Trường
* .NET SDK 8.0 LTS (`dotnet --version`)
* PostgreSQL 16+ hoặc Docker Compose
* Công cụ EF Core CLI (`dotnet tool install --global dotnet-ef` hoặc đã có sẵn)

## 2. Cấu Trúc Solution & 3-Tier Layered Architecture
```text
ZhongWenHub.sln
├── src/
│   ├── Api/                           # ZhongWenHub.Api: Controllers, Middleware, Auth/Health Endpoints, OpenAPI/Swagger
│   ├── Business/                      # ZhongWenHub.Business: Authentication, Services, Authorization Policies, DTOs
│   └── Data/                          # ZhongWenHub.Data: PostgreSQL EF DbContext, Identity Entities, Migrations, Seeding
├── tests/
│   ├── ZhongWenHub.UnitTests/         # Unit Tests (JWT, Token, Pagination, Policies)
│   └── ZhongWenHub.IntegrationTests/  # Integration Tests (PostgreSQL, Identity, Login, Refresh, RBAC)
├── docs/                              # Kiến trúc, Bảo mật, Ma trận phân quyền, Báo cáo
├── docker-compose.yml                 # PostgreSQL container orchestration
├── .env.example                       # Biến môi trường mẫu an toàn
└── README.md
```

## 3. Khởi Chạy Database
Sử dụng Docker Compose:
```bash
docker compose up -d
```
Hoặc kết nối trực tiếp PostgreSQL cục bộ (port 5432).

## 4. Chạy Migrations
Áp dụng migrations vào PostgreSQL:
```bash
dotnet ef database update --project src/Data/ZhongWenHub.Data.csproj --startup-project src/Api/ZhongWenHub.Api.csproj
```

## 5. Chạy API
```bash
dotnet run --project src/Api/ZhongWenHub.Api.csproj
```
Truy cập Swagger UI tại:
* `http://localhost:5000/swagger` (hoặc cổng cấu hình)
* Health check: `http://localhost:5000/health`
* System info: `http://localhost:5000/api/v1/system/info`

## 6. Chạy Kiểm Thử
```bash
dotnet test
```

## 7. Tài Khoản Seed Mặc Định (Môi trường Dev/Test)
* **Super Admin:** `superadmin@zhongwenhub.edu.vn` / `SuperAdmin123!` (Role: `SUPER_ADMIN`)
* **Admin:** `admin@zhongwenhub.edu.vn` / `AdminPassword123!` (Role: `ADMIN`)
* **Content Manager:** `contentmanager@zhongwenhub.edu.vn` / `ContentManager123!` (Role: `CONTENT_MANAGER`)
* **Teacher:** `teacher@zhongwenhub.edu.vn` / `TeacherPassword123!` (Role: `TEACHER`)
* **Support:** `support@zhongwenhub.edu.vn` / `SupportPassword123!` (Role: `SUPPORT`)
* **Student:** `student@zhongwenhub.edu.vn` / `StudentPassword123!` (Role: `STUDENT`)
