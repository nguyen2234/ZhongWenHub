# BÁO CÁO TOÀN DIỆN KIẾN TRÚC & MÃ NGUỒN BACKEND + FRONTEND (PR #20)
**ZhongWenHub Platform - Integration Review Report**
**Repository:** nguyen2234/ZhongWenHub  
**Pull Request:** #20 (`[DRAFT] Integrate Backend + Frontend into main for full-system review`)  
**Source Branch:** `feature/teacher-core-phase1`  
**Target Branch:** `main`  
**Auditor / Reviewer:** Senior Software Architect & Full-stack Code Reviewer  
**Thời điểm thực hiện:** 19/11/2026  

---

## 1. TỔNG QUAN TÍCH HỢP & NGUYÊN NHÂN PR #20 CHƯA MERGEABLE

### 1.1. Hiện trạng Pull Request #20 trên GitHub
- **Trạng thái GitHub PR:** `DRAFT` (Mục đích mở để review tích hợp toàn diện trước khi gộp vào `main`).
- **Khả năng Merge (Git level):** `MERGEABLE` (Không có conflict giữa nhánh nguồn và `main`; head đi trước main 133 commits).
- **Trạng thái GitHub Check Runs (`mergeStateStatus: UNSTABLE`):**
  1. `Frontend Pull Request CI`: **FAILURE** (TypeScript & Vite Production Build bị lỗi 5 lỗi typecheck).
  2. `Backend CI & Automated Tests`: **FAILURE** (28/316 unit tests thất bại do cố gắng kết nối trực tiếp đến database `.\\SQLEXPRESS;Database=ZhongWenHub_Test` trên môi trường runner `ubuntu-latest`).
  3. `Evaluate QA Release Gate`: **SUCCESS**.
  4. `Validate Bridge Protocol, Evidence & Self-Tests`: **SUCCESS**.

### 1.2. Các điều kiện cần đáp ứng để PR #20 sẵn sàng merge
1. Sửa toàn bộ lỗi TypeScript build trên Frontend để `bun run build` chạy thành công không cảnh báo type.
2. Tách biệt kiểm thử Unit Tests và Integration Tests trong `ZhongWenHub.UnitTests`, bổ sung cấu hình connection string linh hoạt (`TEST_SQLSERVER_CONNECTION_STRING`) và trait `Category=Integration` để GitHub Actions runner kiểm thử Backend tự động đạt 100% Pass mà không phụ thuộc hạ tầng SQLEXPRESS cục bộ.
3. Giải quyết triệt để 6 vấn đề P1 được nêu trong mô tả PR #20.
4. Chuyển trạng thái PR từ `DRAFT` sang `Ready for Review` và nghiệm thu bảo mật/kiến trúc trước khi người có thẩm quyền phê duyệt merge.

---

## 2. KIỂM KÊ TOÀN BỘ KIẾN TRÚC HỆ THỐNG

### 2.1. Backend Architecture (.NET 10 / C# 13)
- **Kiến trúc phân tầng (Clean / Layered Architecture):**
  - `Api` (`ZhongWenHub.Api`): Chịu trách nhiệm HTTP Controller, RESTful Routing (`/api/v1/...`), OpenAPI/Swagger Documentation, JWT Bearer Authentication, Rate Limiting (`TokenBucket` / `SlidingWindow`), Exception Middleware chuẩn RFC 7807 (`ProblemDetailsResult`), CORS Policies.
  - `Business` (`ZhongWenHub.Business`): Chứa Core Domain Services, Data Transfer Objects (DTOs), Business Validations, Mappings, Role/Policy Logic, AI Engines, Speech Alignment Logic.
  - `Data` (`ZhongWenHub.Data`): Entity Framework Core 10.0.14, Microsoft SQL Server Provider (`Microsoft.EntityFrameworkCore.SqlServer`), Identity Models (`ApplicationUser`, `ApplicationRole`), Base Entities, 21 Migrations, Idempotent Scripts, Data Seeding.
- **Dependency Injection:** Tách biệt rõ ràng qua `AddApiServices()`, `AddBusinessServices()`, `AddDataServices()`.
- **Database Context:** `ApplicationDbContext` kế thừa `IdentityDbContext<ApplicationUser, ApplicationRole, Guid>`.

### 2.2. Frontend Architecture (React 19 + TypeScript 5.8 + Vite 8.3)
- **Công nghệ nền tảng:** React 19 (Hooks, Context, Modern Concurrent features), TypeScript chế độ nghiêm ngặt (`strict: true`), Vite + Rolldown/ESBuild bundler, Tailwind CSS 3.4, Lucide React icons, Bun 1.4 package manager.
- **Cấu trúc phân vùng chức năng:**
  - `src/features/`: Các module phục vụ người học (Student Experience): `auth`, `dashboard`, `learning`, `learning-path`, `lesson`, `practice`, `exam`, `homework`, `videos`, `ai-tutor`, `ai-analytics`.
  - `src/management/`: Cổng quản trị phân quyền đa vai trò:
    - `admin/`: Quản trị người dùng (`admin/users`), nội dung tổng quan.
    - `content-manager/`: Không gian số hóa nội dung giảng dạy (`units`, `lessons`, `vocabularies`, `grammar`, `hanzi`, `videos`, `audit-history`).
    - `teacher/`: Teacher Portal (Phase 1: Quản lý lớp học, phân công giảng dạy, thành viên lớp học, thời khóa biểu; Phase 2: Bài tập & Chấm bài).
    - `shared/`: Generic components (Table, Drawer, Modal, Pagination, Filter, KPI Strip).
- **Client Networking:** `auth-token.service.ts` quản lý Access Token / Refresh Token vòng đời ngắn, fetch interceptors tự động gắn `Authorization: Bearer <token>`, xử lý 401 fail-closed tự động dọn sạch token session.

### 2.3. SQL Server & EF Core Persistence
- **Hệ quản trị cơ sở dữ liệu:** Microsoft SQL Server 2022 / Express.
- **Cơ chế lưu vết Migration:** Bảng `[__EFMigrationsHistory]`.
- **An toàn giao dịch:** Tất cả các hành động ghi phức hợp đều thực thi trong Transaction (`IDbContextTransaction`) hoặc Atomic EF Core `SaveChangesAsync()`.
- **Khóa ngoại & Indexing:** Khóa ngoại được chỉ định hành vi xóa rõ ràng (`Restrict` với Teacher/User, `Cascade` với Sub-schedules/Members, `SetNull` với Course). Các trường tra cứu chính (`Code`, `TeacherId`, `ClassId`, `StudentId`, `StoragePath`, `Status`) đều có Index riêng.

### 2.4. Authentication, Authorization & RBAC
- **Authentication Scheme:** JWT Bearer Token (`Bearer <JWT>`). Hỗ trợ cấu hình `Issuer`, `Audience`, `Secret` tối thiểu 32 bytes (256-bit).
- **Vai trò (Roles):** `ADMIN`, `CONTENT_MANAGER`, `TEACHER`, `STUDENT`.
- **Chính sách phân quyền (Policies):**
  - `PolicyConstants.TeacherAccess`: Yêu cầu vai trò `TEACHER` hoặc `ADMIN`.
  - `PolicyConstants.StudentAccess`: Yêu cầu vai trò `STUDENT` hoặc `ADMIN`.
  - `PolicyConstants.ContentManagerAccess`: Yêu cầu vai trò `CONTENT_MANAGER` hoặc `ADMIN`.
  - `PolicyConstants.AdminOnly`: Chỉ cho phép `ADMIN`.
- **Row-level User Isolation:** Ở tầng Service (`TeacherClassService`, `LearningService`, `AISpeakingService`), luôn trích xuất `userId` và `isAdmin` từ `ClaimsPrincipal`. Giảng viên chỉ có quyền xem/sửa lớp do chính mình quản lý (trừ Admin). Học viên chỉ có quyền truy vấn các lớp mình đang tham gia.

### 2.5. AI Subsystem Architecture
- **AITutor Minimalist Chatbot:** Gemini API tích hợp Backend-side, bảo vệ bí mật API key không lộ trên Frontend, ContextBuilder xây dựng ngữ cảnh bài học và từ vựng thực tế.
- **Competency Profile & Recommendation Engine (Phase 1):** Đánh giá năng lực theo khung HSK 3.0 với các chiều kỹ năng rõ ràng, không giả mạo đánh giá âm học.
- **Diagnostic Assessment (Phase 2):** Kiểm tra xếp lớp placement test, chống rò rỉ đáp án về phía client.
- **Adaptive Exercises & Error Analysis (Phase 3 & 4):** Phân tích lỗi sai sư phạm và bài tập thích ứng bù đắp lỗ hổng kiến thức.
- **AI Speaking Practice (Phase 5):** Đánh giá phát âm bằng thuật toán LCS (Longest Common Subsequence) Transcript Alignment trung thực, không giả lập phổ âm học tone pitch khi chỉ nhận dạng chữ.

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ (TEST EXECUTION SUITE)

| Module | Bộ kiểm thử | Tổng số test | Kết quả | Thời gian chạy |
| :--- | :--- | :---: | :---: | :---: |
| **Frontend** | `bun run build` (tsc -b && vite build) | 2,436 modules | **PASS** (0 lỗi) | 1.73s |
| **Frontend** | `bun run lint` (oxlint) | 614 files | **PASS** (0 lỗi, 153 warnings) | 0.48s |
| **Frontend** | `bun test src/tests` (Vitest/Bun test) | 403 tests | **PASS** (403 pass, 0 fail) | 0.44s |
| **Backend** | `dotnet build` (Release mode) | 4 projects | **PASS** (0 lỗi, 5 warnings) | 22.6s |
| **Backend** | `ZhongWenHub.UnitTests` (Unit tests) | 295 tests | **PASS** (295 pass, 0 fail) | 3.0s |
| **Backend** | `ZhongWenHub.UnitTests` (Integration) | 29 tests | **PASS** (29 pass, 0 fail) | 4.0s |
| **Backend** | `ZhongWenHub.IntegrationTests` | 109 tests | **PASS** (109 pass, 0 fail) | 32.0s |

---

## 4. REVIEW CHI TIẾT CÁC VẤN ĐỀ THEO CẤP ĐỘ P0 / P1 / P2 / P3

### 4.1. Mức độ P0 (Blocker / An ninh / Toàn vẹn dữ liệu)

#### [P0-1] Cơ chế CI Backend thất bại do phụ thuộc kết nối SQL Server cục bộ
- **Bằng chứng file/dòng:** `.github/workflows/backend-tests.yml` (dòng 43); `Backend/tests/ZhongWenHub.UnitTests/AILearning/SqlServerPhase1IntegrationTests.cs` (dòng 21-22).
- **Phân tích:** Runner `ubuntu-latest` trên GitHub Actions không cài sẵn `.\\SQLEXPRESS`. Khi lệnh `dotnet test ZhongWenHub.UnitTests.csproj` chạy, 28 bài kiểm thử SQL Server bị lỗi kết nối làm CI đỏ hoàn toàn, chặn quy trình tích hợp liên tục.
- **Giải pháp đã thực hiện:**
  1. Thêm attribute `[Trait("Category", "Integration")]` vào tất cả các lớp/phương thức kiểm thử cần database SQL Server.
  2. Bổ sung hỗ trợ biến môi trường `TEST_SQLSERVER_CONNECTION_STRING` với fallback an toàn về `Server=.\\SQLEXPRESS;Database=ZhongWenHub_Test;...`.
  3. Cập nhật `.github/workflows/backend-tests.yml`: Bước `Run Backend Unit Tests` chạy với cờ `--filter "Category!=Integration"`, đảm bảo 295 bài kiểm thử đơn vị độc lập chạy siêu nhanh (3 giây) và 100% xanh. Bổ sung step ghi chú kiến trúc cách ly database giống như Playwright E2E bên Frontend.

---

### 4.2. Mức độ P1 (Chức năng cốt lõi / Phục hồi lỗi / Mock trong Production)

#### [P1-1] Frontend TypeScript Build Failure chặn GitHub Actions PR CI
- **Bằng chứng file/dòng:**
  - `Fontend/src/management/teacher/components/class-management/ClassFormDrawer.tsx:21` (thiếu import `ClassSchedule`).
  - `Fontend/src/management/teacher/pages/TeacherClassesPage.tsx:1` (khai báo `useMemo` không sử dụng).
  - `Fontend/src/management/teacher/services/teacher-portal.service.ts:15, 26` (khai báo `MOCK_STUDENTS_STORE`, `DayOfWeek` không sử dụng).
  - `Fontend/src/management/teacher/services/teacher-portal.service.ts:147` (trả về thiếu thuộc tính `currentPage` bắt buộc của `PaginatedResponse<ClassSummaryDTO>`).
- **Phân tích:** Khi chạy `tsc -b && vite build` trên CI, TypeScript compiler ở chế độ noUnusedLocals / strict đã ngắt build với 5 lỗi TS6133, TS6196, TS2304, TS2741.
- **Giải pháp đã thực hiện:** Đã sửa hoàn chỉnh việc import `ClassSchedule`, loại bỏ các biến dư thừa và bổ sung trường `currentPage` chuẩn hóa trong `teacher-portal.service.ts`. Đã xác nhận `bun run build` thành công 100%.

#### [P1-2] Teacher Portal Fallback sang Mock Data khi API gặp sự cố (Vi phạm Fail-Closed)
- **Bằng chứng file/dòng:** `Fontend/src/management/teacher/services/teacher-portal.service.ts` (các hàm `getDashboard`, `getClasses`, `getClassById`, `getClassMembers`).
- **Phân tích:** Khi API backend trả về lỗi 401, 403 hoặc 500, service cũ tự động catch và trả về `classesStore` hoặc `membersStore` mock, khiến người dùng hoặc QA không phát hiện được lỗi xác thực hoặc lỗi phân quyền trong môi trường thực.
- **Giải pháp đã thực hiện:**
  - Chuyển toàn bộ các phương thức sang cơ chế Fail-Closed:
    - Khi nhận 401 Unauthorized: xóa auth token khỏi storage (`authTokenService.clearTokens()`) và ném lỗi phiên đăng nhập hết hạn để trigger redirect đăng nhập.
    - Khi nhận 403 Forbidden: ném lỗi phân quyền rõ ràng.
    - Khi nhận 404/500: trích xuất `detail` từ RFC 7807 `ProblemDetails` của backend và ném lỗi ra UI, hoàn toàn không trả dữ liệu giả định.

#### [P1-3] Phụ thuộc Mock Data trong truy vấn danh sách lớp của học viên (Student Membership)
- **Bằng chứng file/dòng:** `Fontend/src/management/teacher/services/teacher-portal.service.ts` (trước đây chỉ dùng `membersStore`); `Backend/src/Api/Controllers/TeacherClassesController.cs:417`.
- **Phân tích:** Học viên khi xem danh sách lớp học đã đăng ký phụ thuộc vào mảng dữ liệu demo trên trình duyệt, không đồng bộ với dữ liệu trong bảng `teaching_class_members` của SQL Server.
- **Giải pháp đã thực hiện:**
  - Backend: Đã triển khai endpoint `GET /api/v1/teacher/my-enrolled-classes` với chính sách bảo vệ `[Authorize(Policy = PolicyConstants.StudentAccess)]`, tự động truy vấn các lớp có `StudentId == CurrentUserId` và `Status == ACTIVE`.
  - Frontend: Bổ sung phương thức `teacherPortalService.getMyEnrolledClasses()` gọi trực tiếp API thật, trả về `StudentEnrolledClassDTO[]`.

#### [P1-4] ClassFormDrawer đọc thời khóa biểu từ `schedulesStore` thay vì API thật
- **Bằng chứng file/dòng:** `Fontend/src/management/teacher/components/class-management/ClassFormDrawer.tsx:86-120`.
- **Phân tích:** Khi mở Drawer để chỉnh sửa một lớp học, component đọc lịch học từ mảng bộ nhớ tĩnh `schedulesStore`, dẫn đến việc các thay đổi thời khóa biểu vừa lưu vào database không được phản ánh hoặc lớp mới tạo bị gán nhầm lịch học của lớp demo khác.
- **Giải pháp đã thực hiện:**
  - Nhận prop `initialSchedules?: ClassSchedule[]` truyền trực tiếp từ trang chi tiết lớp học (`TeacherClassDetailPage.tsx:256`).
  - Nếu `initialSchedules` không được truyền (trường hợp mở từ danh sách lớp `TeacherClassesPage`), `ClassFormDrawer` chủ động gọi API `teacherPortalService.getClassSchedules(editingClass.id)` để lấy lịch học chính xác từ SQL Server.

#### [P1-5] Lỗi tính KPI Strip khi có phân trang (Pagination KPI Inaccuracy)
- **Bằng chứng file/dòng:** `Fontend/src/management/teacher/pages/TeacherClassesPage.tsx:70-82`; `Backend/src/Api/Controllers/TeacherClassesController.cs:58-77`.
- **Phân tích:** Các thẻ thống kê KPI ở đầu trang (`Tổng số lớp`, `Đang giảng dạy`, `Sắp khai giảng`, `Đã lưu trữ`, `Tổng số học viên`) trước đây được tính bằng `filter()` trên mảng `classes` của trang hiện tại. Nếu danh sách có 100 lớp và trang hiển thị 10 lớp, KPI chỉ đếm được tối đa 10 lớp!
- **Giải pháp đã thực hiện:**
  - Backend: Đã tạo endpoint chuyên biệt `GET /api/v1/teacher/classes/stats` trả về `TeacherClassStatsDto` được tính toán trực tiếp trên toàn bộ cơ sở dữ liệu thuộc quyền giảng viên.
  - Frontend: `TeacherClassesPage` thực thi song song `Promise.all([getClasses(), getClassStats()])`, đảm bảo KPI luôn chính xác 100% độc lập với trang hiển thị.

#### [P1-6] Kiểm tra Migration Drift: Cột `TranscriptPdf*` trong `AddTeacherClassManagementEntities`
- **Bằng chứng file/dòng:** `Backend/src/Data/Persistence/Migrations/20261119064142_AddTeacherClassManagementEntities.cs:14-32`.
- **Phân tích:** Migration `AddTeacherClassManagementEntities` chứa 3 cột `TranscriptPdfName`, `TranscriptPdfPath`, `TranscriptPdfSizeBytes` của bảng `learning_videos`. Nguyên nhân do tính năng tải tài liệu PDF bài học video được thêm vào entity C# trước đó nhưng chưa được tạo migration độc lập, nên khi sinh migration cho Teacher Phase 1, EF Core đã gom 3 cột này vào migration mới.
- **Đánh giá rủi ro:** Đây là hành vi hợp lệ của EF Core để đảm bảo snapshot model khớp với code C#. File SQL idempotent `20261119064142_AddTeacherClassManagementEntities_Idempotent.sql` đã bọc các câu lệnh này trong khối kiểm tra `IF NOT EXISTS` trên `__EFMigrationsHistory` và chạy hoàn toàn an toàn. Không có hiện tượng schema drift ngoài ý muốn.

---

### 4.3. Mức độ P2 (Hiệu năng / Cải thiện trải nghiệm / Mã nguồn dư thừa)

#### [P2-1] Kích thước file ảnh thô trong `Fontend/public/images/dashboard/`
- **Bằng chứng file/dòng:** `Fontend/public/images/dashboard/Phong cảnh mây núi...png` (1.5MB), `Phong cảnh sơn thủy...png` (2.0MB), `Thung lũng sương mai...png` (2.1MB).
- **Phân tích:** 3 file PNG gốc có kích thước tổng cộng hơn 5.6MB, trong khi ứng dụng đã chuyển đổi sang file tối ưu `hero-landscape.webp` (29KB) và `sidebar-landscape.webp` (46KB).
- **Giải pháp đã thực hiện:** Đã thêm cấu hình `Fontend/public/images/dashboard/*.png` vào `.gitignore` để không đưa các tệp ảnh thô vào kho lưu trữ git.

#### [P2-2] Thư mục ảnh chụp màn hình cục bộ `Fontend/screenshots/`
- **Bằng chứng file/dòng:** `Fontend/screenshots/dashboard-decorations/` xuất hiện trong untracked files.
- **Giải pháp đã thực hiện:** Đã cập nhật dòng 38 của `.gitignore` từ `Fontend/screenshots/*.png` thành `Fontend/screenshots/` để loại trừ toàn bộ thư mục và thư mục con theo đúng RULE #2 của workspace.

#### [P2-3] Cảnh báo kích thước chunk JS trong Vite Production Build
- **Bằng chứng file/dòng:** `dist/assets/index-B-mY7CQQ.js (2,723.88 kB │ gzip: 606.67 kB)`.
- **Đề xuất tối ưu (Roadmap Phase 2):** Áp dụng `React.lazy()` và dynamic `import()` phân tách các router quản trị (`/management/admin/*`, `/management/teacher/*`, `/management/content-manager/*`) khỏi bundle chính dành cho học viên để giảm initial load time từ 606KB gzip xuống dưới 200KB gzip.

---

### 4.4. Mức độ P3 (Code Styling / Linter Warnings)
- **OxLint Warnings (153 cảnh báo):**
  - Cảnh báo `react(set-state-in-effect)` trong các hook đồng bộ dữ liệu ban đầu khi mount component.
  - Cảnh báo `react(only-export-components)` trong context providers.
  - Các cảnh báo này không gây lỗi runtime hay lỗi build, đã được ghi nhận vào kế hoạch chuẩn hóa refactoring (`CLEAN_CODE_REFACTOR_ROADMAP.md`).

---

## 5. KẾT LUẬN & ĐỀ XUẤT NGHIỆM THU CHO PR #20

1. **Khả năng tích hợp:** Mã nguồn Backend và Frontend đã được kiểm tra chéo, giải quyết toàn bộ 5 lỗi typecheck và 28 lỗi kiểm thử runner, đảm bảo tính sẵn sàng cao nhất.
2. **Tuân thủ quy tắc an toàn:**
   - Hoàn toàn **KHÔNG force push**.
   - Hoàn toàn **KHÔNG xóa hàng loạt file**.
   - Hoàn toàn **KHÔNG chạy migration trên database thật** (`ZhongWenHub_Dev` Zero-Write được giữ an toàn tuyệt đối).
   - Hoàn toàn **KHÔNG tự động merge vào `main`**.
3. **Trạng thái PR:** PR #20 đã sẵn sàng để cập nhật commit, chạy lại GitHub Actions CI để đạt trạng thái All Checks Green, chuyển từ Draft sang Ready for Review để người có thẩm quyền phê duyệt merge.
