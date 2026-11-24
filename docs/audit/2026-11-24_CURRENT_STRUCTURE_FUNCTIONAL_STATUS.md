# ZhongWenHub Current State Audit & Structural/Functional Verification Report

- **Audit Date:** 2026-11-24
- **Audit Source Commit:** `bf8c365f10620955df924bfde73c7e9c216e5a4a`
- **Audit Source Branch:** `refactor/simple-feature-backend-multiprovider-fe-fixes`
- **Audit Output Branch:** `audit/current-structure-functional-status-20261124`
- **Reference Plan Commit:** `14b8d91417e303705f6a5a152bb0a06a49a4eb34` (from `docs/antigravity-study-ai-layout-plan`)
- **Reviewer:** Codex
- **Executor:** Antigravity (Audit Mode - Zero production modifications)

---

## 1. Executive Verdict & Summary

| Audit Area | Status / Verdict | Summary Evidence |
| :--- | :--- | :--- |
| **Backend Project Layout** | `READY_FOR_LAYOUT_MIGRATION` | Solution currently has exactly 2 projects: `Backend/ZhongWenHub/ZhongWenHub.csproj` and `Backend/ZhongWenHub.Tests/ZhongWenHub.Tests.csproj`. Target layout (`Backend/src/ZhongWenHub.Api` and `Backend/tests/*`) is not yet created. |
| **Namespace & Feature Ownership** | `PARTIAL` / `MIGRATION_REQUIRED` | While files are grouped under `Features/admin` and `Features/users`, over 40 C# source files still declare legacy namespaces `namespace ZhongWenHub.Business.*`. |
| **EF Core & Database Migrations** | `BROKEN` (P0 Blocker) | 1. Runtime migrates `AppDbContext` (finds 0 migrations), while all migrations target `ApplicationDbContext`.<br>2. `AddMultiProviderAiConfigurations.Designer.cs` has empty `BuildTargetModel`.<br>3. `ApplicationDbContextModelSnapshot.cs` lacks `AiProviderConfiguration`.<br>4. Fresh/upgrade migrations fail with `PendingModelChangesWarning`. |
| **Runtime Routes & API Contracts** | `PARTIAL` (P0 Blocker) | 1. Teacher submission detail and grade routes contain duplicated route prefixes (`/api/v1/teacher/assignments/api/v1/teacher/submissions/{id}`).<br>2. `SwaggerIntegrationTests.cs` rewrites its own baseline files rather than asserting.<br>3. Support ticket backend is completely missing (`NOT_IMPLEMENTED`). |
| **Backend Test Suites** | `WORKING` (In Local Test Container) | All 479 tests pass locally (335 Unit + 144 Integration). However, integration tests were silently skipped on GitHub Actions CI due to missing SQL container and unset environment variable. |
| **Frontend Quality & Build** | `WORKING` | `bun run lint`: 0 errors (164 warnings); `bun test src/tests`: 513 passed across 55 test files; `tsc -b && vite build`: Success in 2.78s. |
| **Production Mock & Fake Inventory** | `PARTIAL` | Support ticket module uses hard-coded in-memory array `INITIAL_TICKETS` without API calls. Dead mock files (`mockCurriculumData.ts`, `mock-grammar.repository.ts`, `mock-exercise.repository.ts`) remain in production tree. |
| **Database Safety (`ZhongWenHub_Dev`)** | `VERIFIED` (Zero-Write) | 40 users, 40 tables, 18 migrations, Max `UpdatedAt` frozen at `2026-11-23 07:22:15.6746177`. |
| **Merge-Readiness Verdict** | **`NOT_READY`** | Branch `bf8c365` cannot be merged into `main` until the P0 blockers (EF migrations, teacher submission routes, Swagger baseline assertion, and CI integration test runner) are repaired in implementation phase. |

---

## 2. Actual Structure Tree vs Target Layout Comparison

### A. Current Project Inventory at `bf8c365`

- **Total Solutions:** 1 (`Backend/ZhongWenHub.sln`)
- **Total `.csproj` Files:** 2
  - Production Web API: `Backend/ZhongWenHub/ZhongWenHub.csproj` (Target: `net10.0`)
  - Combined Test Suite: `Backend/ZhongWenHub.Tests/ZhongWenHub.Tests.csproj` (Target: `net10.0`)
- **Production Projects in `Backend/src`:** 0 (currently at root of `Backend/ZhongWenHub`)
- **Unit Test Projects in `Backend/tests`:** 0 (currently lumped inside `ZhongWenHub.Tests`)
- **Integration Test Projects in `Backend/tests`:** 0 (currently lumped inside `ZhongWenHub.Tests`)

### B. Target vs Actual Path Mapping

| Current Path (`bf8c365`) | Target Path (`14b8d91`) | Migration Risk | Status |
| :--- | :--- | :--- | :--- |
| `Backend/ZhongWenHub/ZhongWenHub.csproj` | `Backend/src/ZhongWenHub.Api/ZhongWenHub.Api.csproj` | Medium (Project move, solution update, CI paths) | `READY_FOR_LAYOUT_MIGRATION` |
| `Backend/ZhongWenHub/Features/admin/Accounts` | `Backend/src/ZhongWenHub.Api/Features/Admin/Accounts` | Low | `READY_FOR_LAYOUT_MIGRATION` |
| `Backend/ZhongWenHub/Features/admin/AiProviders` | `Backend/src/ZhongWenHub.Api/Features/Admin/AiProviders` | Low | `READY_FOR_LAYOUT_MIGRATION` |
| `Backend/ZhongWenHub/Features/admin/Analytics` | `Backend/src/ZhongWenHub.Api/Features/Admin/Analytics` | Low | `READY_FOR_LAYOUT_MIGRATION` |
| `Backend/ZhongWenHub/Features/admin/Content` | `Backend/src/ZhongWenHub.Api/Features/Content` | Medium (Move content to dedicated feature folder) | `READY_FOR_LAYOUT_MIGRATION` |
| `Backend/ZhongWenHub/Features/admin/Operations` | `Backend/src/ZhongWenHub.Api/Features/Admin/Operations` | Low | `READY_FOR_LAYOUT_MIGRATION` |
| `Backend/ZhongWenHub/Features/users/Auth` | `Backend/src/ZhongWenHub.Api/Features/Auth` | Low | `READY_FOR_LAYOUT_MIGRATION` |
| `Backend/ZhongWenHub/Features/users/AITutor` | `Backend/src/ZhongWenHub.Api/Features/AI` | Medium (Consolidate AI Tutor & Learning Engine under `Features/AI`) | `READY_FOR_LAYOUT_MIGRATION` |
| `Backend/ZhongWenHub/Features/users/Learning` | `Backend/src/ZhongWenHub.Api/Features/Student/Learning` | Low | `READY_FOR_LAYOUT_MIGRATION` |
| `Backend/ZhongWenHub/Features/users/Teacher` | `Backend/src/ZhongWenHub.Api/Features/Teacher` | Medium (Fix duplicated route prefix in controller) | `READY_FOR_LAYOUT_MIGRATION` |
| `Backend/ZhongWenHub/Features/users/Videos` | `Backend/src/ZhongWenHub.Api/Features/Content/Videos` | Low | `READY_FOR_LAYOUT_MIGRATION` |
| `Backend/ZhongWenHub/Features/users/Exams` | `Backend/src/ZhongWenHub.Api/Features/Content/Exams` | Low | `READY_FOR_LAYOUT_MIGRATION` |
| `Backend/ZhongWenHub/Features/users/Homework` | `Backend/src/ZhongWenHub.Api/Features/Student/Homework` | Low | `READY_FOR_LAYOUT_MIGRATION` |
| *None* (Missing) | `Backend/src/ZhongWenHub.Api/Features/Support` | High (Need real controller and ticket service) | `NOT_IMPLEMENTED` |
| `Backend/ZhongWenHub.Tests/ZhongWenHub.Tests.csproj` | `Backend/tests/ZhongWenHub.UnitTests/` & `Backend/tests/ZhongWenHub.IntegrationTests/` | High (Test project split, CI workflow separation) | `READY_FOR_LAYOUT_MIGRATION` |

---

## 3. Environment & Verification Tooling Status

- **Operating System:** Microsoft Windows 11 Pro for Workstations (Build 26300, x64)
- **.NET SDK:** 10.0.404
- **Bun:** 1.4.3
- **Node.js:** v24.20.0
- **SQL Server:** Microsoft SQL Server 2025 (RTM-GDR) Express Edition (`.\SQLEXPRESS`)
- **Playwright:** v1.64.1 installed

### Exact Command Execution Summary

| Command | Working Directory | Exit Code | Result Summary |
| :--- | :--- | :---: | :--- |
| `dotnet restore Backend/ZhongWenHub.sln` | Repository root | `0` | Restored 2 projects in 1.31s |
| `dotnet build Backend/ZhongWenHub.sln -c Release --no-restore` | Repository root | `0` | Succeeded: 0 errors, 8 warnings in 23.69s |
| `dotnet test Backend/ZhongWenHub.Tests -c Release --no-build` | Repository root | `0` | Passed: 479, Failed: 0, Skipped: 0 in 52s |
| `dotnet test --filter "Category!=Integration"` | Repository root | `0` | Passed: 335, Failed: 0, Skipped: 0 in 10s |
| `dotnet test --filter "Category=Integration"` | Repository root | `0` | Passed: 144, Failed: 0, Skipped: 0 in 1m 13s |
| `bun install --frozen-lockfile` | `Fontend/` | `0` | 0 packages changed in 759ms |
| `bun run lint` | `Fontend/` | `0` | 0 errors, 164 warnings in 1.5s (626 files) |
| `bun test src/tests` | `Fontend/` | `0` | Passed: 513, Failed: 0 (55 files, 5,174 expects) in 11.68s |
| `bun run build` (`tsc -b && vite build`) | `Fontend/` | `0` | Built production bundle in 2.78s |

---

## 4. EF Core & Database Migration Health Audit

### A. Context Registration & Migration Target Discrepancy
- **Runtime `Program.cs`:**
  - Registers `AppDbContext` in DI.
  - Calls `await db.Database.MigrateAsync();` on `AppDbContext`.
- **Migration Metadata:**
  - All 25 migrations in `Backend/ZhongWenHub/Migrations` declare `[DbContext(typeof(ApplicationDbContext))]`.
  - `ApplicationDbContextModelSnapshot` declares `[DbContext(typeof(ApplicationDbContext))]`.
- **Discovered Failure:**
  - `dotnet ef migrations list --context AppDbContext` reports: `No migrations were found.`
  - Therefore, at runtime, `MigrateAsync()` finds zero migrations and never applies any database changes.

### B. Validation of Hypothesis 1, 2, and 3
1. **Hypothesis 1 (Runtime vs Migration Context):** **CONFIRMED (VALIDATED)**. Runtime invokes `MigrateAsync` on `AppDbContext`, whereas migrations are compiled against `ApplicationDbContext`.
2. **Hypothesis 2 (Incomplete Migration Designer):** **CONFIRMED (VALIDATED)**. `20261122150000_AddMultiProviderAiConfigurations.Designer.cs` is only 25 lines long and its `BuildTargetModel` method contains zero entities.
3. **Hypothesis 3 (Missing Entity in Snapshot):** **CONFIRMED (VALIDATED)**. `ApplicationDbContextModelSnapshot.cs` contains zero definitions for `AiProviderConfiguration`.

### C. Migration Execution on Disposable Database
- When attempting `dotnet ef database update --context ApplicationDbContext` against a disposable test database (`ZhongWenHub_FreshTest`), EF Core 10 throws:
  ```
  System.InvalidOperationException: An error was generated for warning 'Microsoft.EntityFrameworkCore.Migrations.PendingModelChangesWarning':
  The model for context 'ApplicationDbContext' has pending changes. Add a new migration before updating the database.
  ```
- **Conclusion:** Fresh database migration from zero and upgrade migration are currently **`BROKEN`** until the snapshot and designer are synchronized.

---

## 5. Runtime Routes & API Contract Audit

- **Baseline Total Operations:** 263 operations recorded in `Backend/docs/RUNTIME_OPENAPI_ROUTES_BASELINE.txt`.
- **Teacher Route Prefix Duplication (P0 Defect):**
  - In `TeacherAssignmentsController.cs`:
    - `[HttpGet("api/v1/teacher/submissions/{id:guid}")]` (Missing leading `/`)
    - `[HttpPost("api/v1/teacher/submissions/{id:guid}/grade")]` (Missing leading `/`)
  - Evaluated route at runtime:
    - `GET /api/v1/teacher/assignments/api/v1/teacher/submissions/{id}`
    - `POST /api/v1/teacher/assignments/api/v1/teacher/submissions/{id}/grade`
  - Frontend `assignment.service.ts` calls:
    - `GET /api/v1/teacher/submissions/{id}` -> Returns **404 Not Found**.
    - `POST /api/v1/teacher/submissions/{id}/grade` -> Returns **404 Not Found**.
- **Swagger Integration Test Flaw:**
  - In `SwaggerIntegrationTests.cs: AnalyzeSwaggerEndpointsMetadata()`:
    ```csharp
    var jsonPath = Path.Combine(docsDir, "RUNTIME_OPENAPI_ROUTES_BASELINE.json");
    await File.WriteAllTextAsync(jsonPath, json);
    ```
  - The test actively overwrites the committed baseline file on every execution instead of asserting read-only equality. This hides route regressions.
- **Support Module Routes:**
  - Zero endpoints exist for `/api/v1/support/tickets`. The only route matching `support` is `GET /api/v1/system/support-test`.

---

## 6. Functional Status Matrix by Role

| Area | Role | FE Route / View | FE Service | HTTP Method / Path | BE Controller / Service | Persistence | Automated Evidence | Manual Evidence | Status | Defects / Blockers |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **Auth** | All | `/login` | `auth.service.ts` | `POST /api/v1/auth/login` | `AuthController` / `AuthenticationService` | `Users`, `UserRefreshTokens` in SQL Server | `AuthIntegrationTests` (6 passed) | Login with admin/student returns JWT & claims | `WORKING` | None |
| **Auth** | All | `/register` | `auth.service.ts` | `POST /api/v1/auth/register` | `AuthController` / `AuthenticationService` | `Users`, `StudentLearningProfiles` | `AuthIntegrationTests` | Register creates account and profile | `WORKING` | None |
| **Auth** | All | `/forgot-password` | `auth.service.ts` | `POST /api/v1/auth/forgot-password` | `AuthController` / `AuthenticationService` | `PasswordResetTokens` in SQL Server | `PasswordResetIntegrationTests` (7 passed) | Token generated and validated | `WORKING` | Smtp socket requires RFC CRLF |
| **Admin** | Admin | `/management/admin/dashboard` | `admin-dashboard.service.ts` | `GET /api/v1/admin/dashboard/stats` | `AdminDashboardController` | SQL Server aggregate queries | `admin-fullstack-real-data.test.ts` | Displays real KPIs | `WORKING` | None |
| **Admin** | Admin | `/management/admin/users` | `admin-users.service.ts` | `GET /api/v1/admin/users`, `PATCH .../lock` | `AdminUsersController` / `AdminUserService` | `Users`, `UserRoles` in SQL Server | `AdminUsersIntegrationTests` (12 passed) | Lock/unlock persists across reload | `WORKING` | None |
| **Admin** | Admin | `/management/admin/ai-providers` | `admin-ai-providers.service.ts` | `GET/POST/PUT/DELETE /api/v1/admin/ai-providers` | `AdminAiProvidersController` / `AiProviderManagementService` | `AiProviderConfigurations` table | `AiProviderManagementIntegrationTests` | Key masking and failover functional | `PARTIAL` | EF Core migration pending model warning blocks clean DB update |
| **Content** | Content Mgr | `/management/content-manager/curriculum` | `curriculum.service.ts` | `GET/POST /api/v1/content/courses` | `ContentController` / `ContentService` | `Courses`, `Units` in SQL Server | `ContentManagementIntegrationTests` (14 passed) | Course and unit creation verified | `WORKING` | None |
| **Content** | Content Mgr | `/management/content-manager/lessons` | `lesson-management.service.ts` | `GET/POST/PUT /api/v1/content/lessons` | `ContentController` / `ContentService` | `Lessons` table with audit trail | `LessonPublicationWorkflowTests` | Draft to Published state machine enforced | `WORKING` | None |
| **Content** | Content Mgr | `/management/content-manager/vocabulary` | `vocabulary.service.ts` | `GET/POST /api/v1/content/vocabularies` | `ContentController` / `ContentService` | `Vocabularies` with canonical keys | `vocabulary-dedup.test.ts`, `ContentManagementIntegrationTests` | Duplicate words prevented | `WORKING` | None |
| **Content** | Content Mgr | `/management/content-manager/videos` | `video-management.service.ts` | `GET/POST /api/v1/videos/manage` | `LearningVideoController` / `LearningVideoService` | `LearningVideos`, `VideoStorageOutbox` | `video-management-phase2.test.ts` | YouTube metadata & cloud storage verified | `WORKING` | None |
| **Teacher** | Teacher | `/teacher/classes` | `teacher-portal.service.ts` | `GET/POST /api/v1/teacher/classes` | `TeacherClassesController` / `TeacherClassService` | `TeachingClasses`, `TeachingClassMembers` | `TeacherClassIntegrationTests` (8 passed) | Create class, join code functional | `WORKING` | None |
| **Teacher** | Teacher | `/teacher/assignments` | `assignment.service.ts` | `GET/POST /api/v1/teacher/assignments` | `TeacherAssignmentsController` / `TeacherAssignmentService` | `TeacherAssignments` in SQL Server | `TeacherAssignmentIntegrationTests` (6 passed) | Homework creation & status update | `WORKING` | None |
| **Teacher** | Teacher | `/teacher/assignments/:id/submissions` | `assignment.service.ts` | `GET /api/v1/teacher/assignments/:id/submissions` | `TeacherAssignmentsController` | `StudentHomeworkSubmissions` | `TeacherAssignmentIntegrationTests` | Submissions list returned | `WORKING` | None |
| **Teacher** | Teacher | `/teacher/submissions/:id/grade` | `assignment.service.ts` | `POST /teacher/submissions/:id/grade` | `TeacherAssignmentsController` | `StudentHomeworkSubmissions` | `teacher-and-student-homework-flow.test.ts` | **BROKEN at runtime** | `BROKEN` | Route attribute lacks leading slash `/`, generating `/api/v1/teacher/assignments/api/v1/teacher/submissions/{id}/grade` (HTTP 404) |
| **Student** | Student | `/dashboard` | `learning-api.service.ts` | `GET /api/v1/learning/me` | `LearningController` / `LearningService` | `StudentLearningProfiles`, `StudentLessonProgress` | `LearningIntegrationTests` (15 passed) | Real streak, XP and goals persisted | `WORKING` | None |
| **Student** | Student | `/lesson/:id` | `learning-api.service.ts` | `PUT /api/v1/learning/me/lessons/:id/progress` | `LearningController` / `LearningService` | `StudentLessonProgress`, `StudentXpTransactions` | `LearningIntegrationTests` | Step completion & idempotent XP verified | `WORKING` | None |
| **Student** | Student | `/homework/:id` | `assignment.service.ts` | `POST /api/v1/student/homework/submissions/:id/submit` | `StudentHomeworkController` | `StudentHomeworkSubmissions` | `StudentHomeworkIntegrationTests` (7 passed) | Student submits answers, auto-grades | `WORKING` | None |
| **Student** | Student | `/ai-tutor` | `ai-tutor.service.ts` | `POST /api/v1/ai/tutor/chat` | `AITutorController` / `AITutorService` | `AiConversationSessions`, `AiConversationMessages` | `ai-tutor-workspace.test.ts` | Session creation and chat | `PARTIAL` | External Gemini calls depend on live provider config; token governance not yet connected at commit `bf8c365` |
| **Support** | Support | `/management/support/tickets` | `support-ticket.service.ts` | *None* | *None* | In-memory `INITIAL_TICKETS` only (Zero DB persistence) | None (UI tests only) | Tickets disappear on page refresh | `NOT_IMPLEMENTED` | Missing backend support controller, entity and database table |

---

## 7. Production Mock & False-Success Inventory

1. **Support Ticket Module (`support-ticket.service.ts`):**
   - Contains 5 hard-coded tickets in `INITIAL_TICKETS`.
   - All mutations (`updateStatus`, `assignTicket`, `addNote`) operate solely in client JavaScript memory.
   - Zero HTTP `fetch` calls are made.
2. **Dead Curriculum Mock File (`mockCurriculumData.ts`):**
   - Located at `Fontend/src/management/admin/content/data/mockCurriculumData.ts`.
   - Exports `MOCK_COURSES`, `MOCK_COURSE_LEVELS`, `MOCK_UNITS` (dead code, unreferenced by production views).
3. **Legacy Repository Mock Adapters:**
   - Located at `Fontend/src/core/repositories/adapters/mock-grammar.repository.ts` and `mock-exercise.repository.ts`.
   - Wired to `repository-container.ts` via `defaultApiConfig.useMock` flag.
4. **Backend AI Providers:**
   - No `MockAIProvider` exists in backend production code.
   - `MultiProviderAiRouter` fails closed with `AiRouterUnavailableException` when all providers are unavailable.

---

## 8. Ordered Defect Backlog (P0 – P3)

| ID | Severity | File Path & Symbol | Reproduction Steps | Expected Behavior | Actual Observed Behavior | Affected Role |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| **DEF-01** | **P0** | `Backend/ZhongWenHub/Program.cs:129,140` | Start API with `Database:AutoMigrate=true`. | `MigrateAsync` runs pending migrations. | Discovers 0 migrations because `AppDbContext` is checked instead of `ApplicationDbContext`. | System startup / All roles |
| **DEF-02** | **P0** | `Backend/ZhongWenHub/Migrations/20261122150000_AddMultiProviderAiConfigurations.Designer.cs` | Run `dotnet ef database update --context ApplicationDbContext`. | Database updates successfully to latest schema. | Fails with `PendingModelChangesWarning` because `BuildTargetModel` is empty and snapshot lacks `AiProviderConfiguration`. | Admin / All roles |
| **DEF-03** | **P0** | `Backend/ZhongWenHub/Features/users/Teacher/TeacherAssignmentsController.cs:268,296` | Make GET/POST request to teacher submission detail or grade endpoint. | Route responds at `/api/v1/teacher/submissions/{id}` and `/grade`. | Route responds at `/api/v1/teacher/assignments/api/v1/teacher/submissions/{id}` resulting in 404 for frontend clients. | Teacher |
| **DEF-04** | **P0** | `Backend/ZhongWenHub.Tests/Integration/SwaggerIntegrationTests.cs:240` | Execute `dotnet test --filter AnalyzeSwaggerEndpointsMetadata`. | Compares generated OpenAPI document against committed baseline. | Actively rewrites `RUNTIME_OPENAPI_ROUTES_BASELINE.json` and `.txt`, masking route changes. | Developer / CI |
| **DEF-05** | **P1** | `.github/workflows/backend-tests.yml:47` | Open a PR and inspect GitHub Actions run. | Integration tests run against isolated SQL Server container. | Step `Optional SQL Server Integration Tests` is skipped because `RUN_SQLSERVER_INTEGRATION` is unset; no SQL container is provisioned. | CI / QA |
| **DEF-06** | **P1** | `Fontend/src/management/support/services/support-ticket.service.ts` | Navigate to Support ticket queue, update ticket status, refresh page. | Ticket update persists in database. | Mutates client-side memory array only; state resets on refresh; backend controller does not exist. | Support |
| **DEF-07** | **P2** | `Backend/ZhongWenHub/Features/**` | Inspect namespaces of C# source files. | Classes declare namespace matching their folder path (`ZhongWenHub.Features.*`). | Over 40 classes declare legacy `ZhongWenHub.Business.*`. | Developer maintainability |
| **DEF-08** | **P3** | `Fontend/src/management/admin/content/data/mockCurriculumData.ts` | Inspect production bundle imports. | No unused mock data files in production tree. | File remains in tree although unreferenced. | Code cleanliness |

---

## 9. CI/CD & Developer Workflow Gaps

1. **No SQL Server Container in Workflow:**
   - `.github/workflows/backend-tests.yml` uses `ubuntu-latest` without a `services: mssql` container block.
2. **Silent Skipping of Integration Tests:**
   - Line 48: `if: env.RUN_SQLSERVER_INTEGRATION == 'true'` ensures that on PR runs, all 144 integration tests are never executed.
3. **No Migration Execution Gate:**
   - CI never runs `dotnet ef database update` or validates migration scripts against a fresh database.
4. **Missing Separate TRX Artifacts:**
   - Integration tests do not produce or upload a distinct test results file on CI.

---

## 10. `ZhongWenHub_Dev` Zero-Write Evidence

Read-only markers captured before and after verification:

| Marker Attribute | Pre-Verification Value | Post-Verification Value | Result |
| :--- | :--- | :--- | :---: |
| **Database Name** | `ZhongWenHub_Dev` | `ZhongWenHub_Dev` | Confirmed |
| **Total Table Count** | 40 | 40 | **Unchanged** |
| **Total User Count** | 40 | 40 | **Unchanged** |
| **Max User UpdatedAt** | `2026-11-23 07:22:15.6746177` | `2026-11-23 07:22:15.6746177` | **Frozen (Zero-Write)** |
| **EF Migrations Count** | 18 | 18 | **Unchanged** |
| **Latest Applied Migration** | `20261113105123_AddLearningVideosTable` | `20261113105123_AddLearningVideosTable` | **Unchanged** |

---

## 11. Recommended Repair Sequence for Implementation Task

1. **Phase 1 (Preflight & Contract Repair):**
   - Fix `TeacherAssignmentsController` route attributes by adding leading slash `/`.
   - Update `SwaggerIntegrationTests` to assert baseline equality rather than overwrite.
   - Synchronize `ApplicationDbContextModelSnapshot` and `AddMultiProviderAiConfigurations.Designer.cs` with `AiProviderConfiguration`.
   - Standardize on `ApplicationDbContext` in `Program.cs` and DI.
2. **Phase 2 (Layout Migration):**
   - Move `Backend/ZhongWenHub` to `Backend/src/ZhongWenHub.Api`.
   - Split `Backend/ZhongWenHub.Tests` into `Backend/tests/ZhongWenHub.UnitTests` and `Backend/tests/ZhongWenHub.IntegrationTests`.
   - Update `Backend/ZhongWenHub.sln` to reference the 3 projects.
3. **Phase 3 (Namespace Normalization):**
   - Clean up all `ZhongWenHub.Business.*` namespaces to match `ZhongWenHub.Features.*`.
4. **Phase 4 (Support Module Implementation):**
   - Add `SupportTicket` EF entity, migrations, controller and repository.
   - Connect frontend `support-ticket.service.ts` to real HTTP endpoints.
5. **Phase 5 (CI Pipeline Modernization):**
   - Add SQL Server 2022 service container to `backend-tests.yml`.
   - Execute both Unit and Integration test steps on every PR.
