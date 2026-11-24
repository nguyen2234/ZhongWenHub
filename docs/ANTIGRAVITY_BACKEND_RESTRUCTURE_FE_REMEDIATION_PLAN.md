# Antigravity Plan — Simple Feature-First Backend, FE Remediation & Multi-Provider API Management

## 1. Metadata

- Repository: `nguyen2234/ZhongWenHub`
- Plan owner/reviewer: Codex
- Executor: Antigravity
- Source baseline: `main` at `2ff648a8a7234fbd0bd4fb3b191ab9f91f395f9a`
- Reference repository: `nguyendz2k4/DuAnTuyenDung` at `19998ad7703644d4882934806981d3e8b2e4cb3b`
- Target branch: `refactor/simple-feature-backend-multiprovider-fe-fixes`
- Deployment profile: local-first, single machine
- Protected database: `ZhongWenHub_Dev` (strict zero-write during automated work)
- Test database: `ZhongWenHub_Test`

## 2. Revised architecture decision

The owner explicitly prefers the structure of `DuAnTuyenDung`. Replace the current three production projects (`Api`, `Business`, `Data`) with one ASP.NET Core Web API project organized by feature, plus one test project.

Target layout:

```text
Backend/
├── docs/
├── ZhongWenHub.sln
├── ZhongWenHub/
│   ├── Common/
│   │   ├── Api/
│   │   ├── Auth/
│   │   ├── Exceptions/
│   │   ├── Extensions/
│   │   └── AI/
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   ├── DbSeeder.cs
│   │   └── Configurations/
│   ├── Features/
│   │   ├── admin/
│   │   │   ├── Accounts/
│   │   │   ├── AiProviders/
│   │   │   ├── Analytics/
│   │   │   ├── Content/
│   │   │   ├── Operations/
│   │   │   ├── Support/
│   │   │   └── Teachers/
│   │   └── users/
│   │       ├── Auth/
│   │       ├── AITutor/
│   │       ├── Curriculum/
│   │       ├── Exams/
│   │       ├── Homework/
│   │       ├── Learning/
│   │       ├── Practice/
│   │       ├── Teacher/
│   │       └── Videos/
│   ├── Migrations/
│   ├── Models/
│   │   ├── AI/
│   │   ├── Content/
│   │   ├── Learning/
│   │   ├── Teacher/
│   │   └── Users/
│   ├── Properties/
│   ├── Program.cs
│   ├── appsettings.json
│   ├── appsettings.Development.json
│   └── ZhongWenHub.csproj
└── ZhongWenHub.Tests/
    ├── Features/
    ├── Integration/
    ├── Contracts/
    └── ZhongWenHub.Tests.csproj
```

Inside each feature, co-locate the controller, service, interface and DTOs, following the reference repository:

```text
Features/admin/AiProviders/
├── AiProvidersController.cs
├── IAiProviderManagementService.cs
├── AiProviderManagementService.cs
├── DTO/
│   ├── AiProviderRequest.cs
│   └── AiProviderResponse.cs
└── Validation/
```

This is intentionally a simple modular monolith. Do not introduce Clean Architecture projects, MediatR, CQRS, a generic repository, a message bus, Kubernetes, distributed cache or secret-vault infrastructure.

## 3. Simple local security profile

The application runs locally. Keep security understandable and minimal:

- ASP.NET Core Identity for users and password hashing.
- JWT bearer authentication and ordinary role checks (`Admin`, `Teacher`, `ContentManager`, `Student`, `Support`).
- Local CORS origins only.
- Password minimum length 6; uppercase, digit and special-character requirements may be disabled for local development.
- One configured JWT secret through `.env`, user-secrets or local configuration. Never commit a real secret.
- No mandatory 2FA, WAF integration, distributed rate limiter, per-request security-stamp database lookup or enterprise key vault.
- Keep existing working refresh-token and account-lock behavior unless removing it is required for consolidation; do not spend a phase expanding it.
- Never log passwords, JWTs or provider API keys.
- API keys managed by the Admin UI must be masked in responses and encrypted locally with ASP.NET Core Data Protection before database storage.

Simple does not mean placing live API keys in Git, returning them to the browser, or allowing non-admin users to edit providers.

## 4. Current findings to address

### Backend hotspots

| File | Size | Target split |
|---|---:|---|
| `Business/Content/ContentService.cs` | 3,822 lines | Feature services under `Features/admin/Content` and `Features/users/Curriculum` |
| `Business/QuestionBank/QuestionBankService.cs` | 2,271 lines | `Features/admin/Content` and `Features/users/Practice` |
| `Business/Users/AdminUserService.cs` | 1,965 lines | `Features/admin/Accounts` |
| `Business/Teacher/Services/TeacherClassService.cs` | 1,415 lines | `Features/users/Teacher` |
| `Data/Persistence/ApplicationDbContext.cs` | 1,300 lines | `Data/AppDbContext.cs` plus configurations |
| `Business/Learning/LearningService.cs` | 1,117 lines | `Features/users/Learning` |
| `Api/Controllers/ContentController.cs` | 1,068 lines | Feature controllers |
| `Api/Program.cs` | 333 lines | Simple composition root plus extension methods |

Also fix backend CI: its optional SQL Server step currently targets the unit-test project instead of the integration-test project.

### Frontend hotspots

- 16 production files call `fetch` directly.
- 115 production files contain explicit `any`.
- 146 production files mention mock/demo/fallback behavior.
- Admin AI still has hard-coded `INITIAL_AI_SERVICES` and a non-persistent quota slider.
- Admin operations APIs convert failures into `null`.
- Results, dashboard videos, writing skills and several management flows still use mock/demo records.
- Mock authentication paths must not activate accidentally in normal local real-API mode.
- Large pages mix network calls, business rules and rendering.

## 5. Multi-Provider API Management

### 5.1 Supported provider types

Initial scope:

1. `GEMINI`
2. `OPENAI`
3. `OPENAI_COMPATIBLE` for DeepSeek, Groq, OpenRouter, LM Studio, Ollama gateways and other compatible endpoints

Do not add separate hard-coded implementations for every compatible vendor. Use the generic OpenAI-compatible adapter when protocol-compatible.

### 5.2 Data model

Add `AiProviderConfiguration`:

```text
Id                    Guid
Name                  string, unique
ProviderType          GEMINI | OPENAI | OPENAI_COMPATIBLE
BaseUrl               string
EncryptedApiKey       string, nullable for local providers without a key
DefaultModel          string
CapabilitiesJson      JSON array: TUTOR, GRADING, EXERCISE, SPEECH, EMBEDDING
IsEnabled             bool
Priority              int, lower value wins
TimeoutSeconds        int, default 60
MaxRetries            int, default 1
MaxTokens             int?, optional
Temperature           decimal?, optional
LastHealthStatus      UNKNOWN | ONLINE | DEGRADED | OFFLINE
LastHealthMessage     string?, sanitized
LastCheckedAt         DateTime?
CreatedAt             DateTime
UpdatedAt             DateTime?
```

Extend AI usage logs with provider ID/name, model, capability, latency, success, HTTP status/error category and token counts. Never store the raw API key or full sensitive response body in logs.

Use a new forward-only EF migration. Do not edit an already applied migration.

### 5.3 Backend services

Create under `Common/AI` and `Features/admin/AiProviders`:

- `IAiProviderAdapter`
- `GeminiProviderAdapter`
- `OpenAiProviderAdapter`
- `OpenAiCompatibleProviderAdapter`
- `IMultiProviderAiRouter`
- `MultiProviderAiRouter`
- `IAiProviderSecretProtector`
- `DataProtectionAiProviderSecretProtector`
- `IAiProviderManagementService`
- `AiProviderManagementService`

Routing rules:

1. Select enabled providers that support the requested capability.
2. Sort by priority.
3. Try the first provider with its configured model and timeout.
4. Fail over on timeout, connection failure, HTTP 408, 429 and 5xx.
5. Do not fail over on request validation errors or most other 4xx responses.
6. Stop after all eligible providers fail and return a sanitized service-unavailable error.
7. Record one usage event per attempt, including failed attempts.

Keep retry count small. Do not multiply retries inside the adapter and router.

### 5.4 Admin API

All endpoints require the `Admin` role:

```text
GET    /api/v1/admin/ai-providers
GET    /api/v1/admin/ai-providers/{id}
POST   /api/v1/admin/ai-providers
PUT    /api/v1/admin/ai-providers/{id}
DELETE /api/v1/admin/ai-providers/{id}
PATCH  /api/v1/admin/ai-providers/{id}/enabled
POST   /api/v1/admin/ai-providers/{id}/test
PUT    /api/v1/admin/ai-providers/priorities
GET    /api/v1/admin/ai-providers/usage
```

API-key behavior:

- Create accepts `apiKey`.
- Update treats an omitted/blank `apiKey` as “keep current key”.
- Responses return only `hasApiKey` and a short mask such as `****abcd`; never return the stored key.
- Test-connection responses contain provider, model, latency and sanitized status only.

Validation:

- `BaseUrl` must be absolute.
- Allow HTTPS remote URLs and HTTP only for localhost/127.0.0.1 local providers.
- Timeout range: 5–180 seconds.
- Retry range: 0–3.
- Priority must be non-negative and deterministic.
- Provider name must be unique.

### 5.5 Admin frontend

Create an Admin page at `/admin/operations/ai-providers` containing:

- provider table/cards with provider type, model, capabilities, priority and health;
- create/edit drawer;
- masked API-key input with “replace key” behavior;
- enable/disable switch persisted through the backend;
- connection-test action with loading and result states;
- priority reorder controls;
- usage and latency summary based only on real logs;
- explicit loading, empty, error and retry states.

Replace `INITIAL_AI_SERVICES` and the local-only quota slider. No mock provider or fake health status may appear when the API fails.

### 5.6 Provider acceptance tests

- CRUD and role authorization.
- API key is encrypted at rest and never serialized in responses/logs.
- Disabled provider and capability mismatch are skipped.
- Lowest priority enabled provider is selected first.
- Timeout/429/5xx fails over to the next provider.
- 400 validation error does not fan out to every provider.
- All-provider failure returns a sanitized 503.
- Health test updates status without exposing secrets.
- Gemini and OpenAI-compatible mappings use fake HTTP handlers, not paid APIs.
- Admin FE mutation survives page reload and re-fetch.

## 6. Detailed file-by-file implementation backlog

### 6.1 Backend moves and corrections

| Current location | Target location | Required result |
|---|---|---|
| `Backend/src/Api/Program.cs` | `Backend/ZhongWenHub/Program.cs` and `Common/Extensions` | One readable composition root; local CORS, Identity/JWT, Swagger, health checks and DI still work |
| `Backend/src/Business/DependencyInjection.cs` and `Data/DependencyInjection.cs` | `Program.cs` plus feature registration extensions | Remove cross-project registration after consolidation; registrations remain explicit and searchable |
| `Backend/src/Api/Controllers/AuthController.cs` and `Business/Authentication/**` | `Features/users/Auth/**` | Login, register, refresh, logout, current-user, forgot/reset password remain compatible |
| `Api/Controllers/AdminUsersController.cs` and `Business/Users/AdminUserService.cs` | `Features/admin/Accounts/**` | User CRUD, roles, status, lock/unlock, password reset, wallet and subscription persist correctly |
| `Api/Controllers/ContentController.cs` and `Business/Content/**` | `Features/admin/Content/**` plus `Features/users/Curriculum/**` | Split course, unit, lesson, vocabulary, grammar, exercise, review and import/export services without route changes |
| `QuestionBankController.cs` and `QuestionBankService.cs` | `Features/admin/Content/QuestionBank` and `Features/users/Practice` | CRUD/review/import/export/generation and student practice sessions remain functional |
| Teacher controllers and services | `Features/users/Teacher/**` | Class, member, schedule, curriculum, assignment, submission, grade and attendance flows persist |
| Learning controllers/services | `Features/users/Learning/**` | Progress, lesson completion, SRS, goals, daily plan, recommendations and results use real DB data |
| Exam/Homework controllers/services | `Features/users/Exams` and `Features/users/Homework` | Exam CRUD/review and student homework start/submit/result flows remain compatible |
| Video controller/storage services | `Features/users/Videos/**` and `Common/Storage` | Listing, playback, upload, update, publish, delete and cleanup remain fail-closed |
| AI Tutor/AI Learning services | `Features/users/AITutor/**` and `Common/AI` | Existing AI use cases route through Multi-Provider without provider logic in controllers |
| `ApplicationDbContext.cs` and entities | `Data/AppDbContext.cs`, `Models/**`, `Data/Configurations/**` | Preserve table/column names and relationships; use `ApplyConfigurationsFromAssembly` |
| Existing migrations | `Backend/ZhongWenHub/Migrations` | Preserve migration IDs and order exactly; never rewrite an applied migration |
| Unit and integration test projects | `Backend/ZhongWenHub.Tests` | Preserve all tests and categories in one project; SQL integration tests remain isolated |

Backend defects that must be corrected during the move:

1. Replace the static-regex route inventory with a runtime `EndpointDataSource` or Swagger snapshot. Resolve `[controller]`, normalize leading `/`, and capture method, route, action and authorization metadata.
2. Compare `GetMigrations`, `GetAppliedMigrations` and `GetPendingMigrations`; explain any history entry not present in code. Do not silently delete migration history.
3. Fix CI to run the actual consolidated test project and enable a reproducible SQL Server integration job.
4. Keep SMTP and external provider calls bounded by configured timeouts.
5. Return consistent ProblemDetails for validation, conflict, forbidden, not-found, throttled and unavailable failures.
6. Avoid returning EF entities or secret configuration values from controllers.

### 6.2 Frontend files and functional corrections

API foundation:

- `core/api/client/http-client.ts`: one typed JSON client, ProblemDetails parsing, cancellation and auth handling.
- Replace ordinary raw `fetch` usage in Auth, Learning, Videos, Admin, Teacher and Content Manager services. Raw fetch is allowed only for documented streaming/upload cases.
- A failed request must throw a typed error; never return `null`, an empty success object or mock records as if the server succeeded.

Admin:

- `management/admin/services/admin-operations.service.ts`: stop swallowing HTTP/network errors.
- `AdminAIManagementView.tsx`: remove `INITIAL_AI_SERVICES`, fake incident data and the local-only quota slider.
- Add `AdminAIProviderManagementView.tsx` with real CRUD/test/enable/priority/usage APIs.
- User, role, teacher, support-staff and content pages must re-fetch persisted state after mutation.
- System settings must either persist through the backend or be visibly read-only; no pretend-save behavior.
- Curriculum, vocabulary, grammar, exercise, exam and question-bank editors must show server validation errors and survive reload.

Student:

- `features/auth/services/authService.ts`: real API is the normal mode; mock auth only under an explicit demo/test flag.
- Remove production dependency on `student-identity.adapter.ts` and teacher mock stores.
- `LearningResultsPage.tsx`: replace `MOCK_RESULTS` with real learning/result endpoints.
- `DashboardPage.tsx`: replace `DEMO_VIDEOS` and demo counters with real endpoints and honest empty states.
- `SkillWritingPage.tsx`: replace mock-only exercises with backend data.
- Reading/listening/speaking fixtures may remain only in isolated tests or visibly labeled demo mode.
- Curriculum, lesson progress, SRS, practice, homework, exams and videos must use persisted backend state.

Teacher and support:

- Replace client-only stores in `teacher-portal.service.ts`, `assignment.service.ts` and related management services.
- Class/member/schedule, assignment/submission/grade and attendance mutations must persist and survive refresh.
- Support tickets/replies/exports must use real endpoints or be removed from production navigation until implemented.

UI quality:

- Every async page gets loading, empty, error and retry states.
- Prevent stale responses after navigation with `AbortSignal` or request identity.
- Split oversized pages into data hooks, container components and presentation components.
- Remove `any` from every touched API boundary.
- Preserve accessibility fallbacks such as speech synthesis, but never present fallback scoring as genuine AI output.

### 6.3 End-to-end functional matrix

All rows must pass before completion:

| Role/domain | Required working functions |
|---|---|
| Public/Auth | Register, login, refresh, logout, current profile, forgot/reset password, invalid-token errors |
| Student | Curriculum, lesson content/progress/completion, vocabulary/SRS, practice, exams, homework, videos, results and AI tutor |
| Teacher | Classes, members, schedules, curriculum assignment, homework creation/publication, submissions, grading and attendance |
| Content Manager | Course/unit/lesson, vocabulary, grammar, exercises, question bank, exams and video CRUD/review/publication |
| Admin | Dashboard, users, roles, teachers, settings behavior, analytics, AI providers, provider usage and provider health |
| Multi-Provider | Gemini/OpenAI/compatible adapters, capability routing, priority, timeout, failover, sanitized 503 and real telemetry |
| Storage | Upload, download/playback, replacement, deletion and cleanup without demo fallback |

## 7. One-execution delivery phases

Antigravity must complete all phases in one execution on one umbrella branch. Phases remain internal checkpoints and separate commits, but Antigravity does not pause for Codex review between them. Run the relevant tests after every checkpoint and create one Draft PR at the end.

### P0 — Baseline and branch safety

1. Start from latest `main` and include accepted pending fixes.
2. Capture backend build/tests, frontend lint/tests/build and runtime OpenAPI routes. Do not reuse the incomplete 215-route regex snapshot from PR #33.
3. Fix the SQL Server CI project path.
4. Verify fresh and upgrade migration scenarios on `ZhongWenHub_Test`, and reconcile code/applied/pending migration sets.
5. Prove no write to `ZhongWenHub_Dev` with before/after evidence.

### P1 — Create the single feature-first backend project

1. Create `Backend/ZhongWenHub/ZhongWenHub.csproj` as the single Web SDK project.
2. Merge required package references from Api, Business and Data.
3. Create `Common`, `Data`, `Features`, `Models`, `Migrations` and `Properties`.
4. Move the composition root and make the new project build before moving features.
5. Create `Backend/ZhongWenHub.Tests` and preserve test categories.
6. Update solution, Docker, CI, launch settings and documentation paths.
7. Do not delete old projects until the new application passes all baseline tests.

### P2 — Move shared data and authentication

1. Move entities into `Models` grouped by domain.
2. Move DbContext/configurations/seeders into `Data`.
3. Preserve table names, relationships and migration IDs.
4. Move Auth into `Features/users/Auth`.
5. Apply the simple local security profile; do not expand enterprise security.
6. Verify login, refresh, role authorization and account status behavior.

### P3 — Move feature modules

Move one module per commit: Admin Accounts/Operations; Curriculum/Content; Practice/Question Bank; Teacher/Class/Assignment/Attendance; Learning/Progress/Results; Homework/Exams; Videos/storage; AI Tutor/AI Learning; Support.

For each module, co-locate controller/service/interface/DTO, preserve routes, run affected tests and remove old files only after reference search returns zero.

### P4 — Multi-Provider API Management

Implement section 5, migrate existing AI tutor/grading calls through `IMultiProviderAiRouter`, and keep provider-specific code out of controllers.

### P5 — Frontend API and functional fixes

1. Standardize normal JSON calls on the core HTTP client.
2. Replace swallowed `null` errors with typed errors and honest UI states.
3. Implement the Admin provider-management page.
4. Remove production mock fallbacks from Admin AI, Results, Dashboard videos, Skills, Teacher and Support flows.
5. Keep fixtures only in tests or an explicit local demo mode visibly labeled to the user.
6. Split the largest pages into hooks/containers/presentation components.
7. Remove `any` from every touched API contract.

### P6 — Final local release gate

```bash
dotnet restore Backend/ZhongWenHub.sln
dotnet build Backend/ZhongWenHub.sln --configuration Release --no-restore
dotnet test Backend/ZhongWenHub.Tests/ZhongWenHub.Tests.csproj --configuration Release --no-build

cd Fontend
bun install --frozen-lockfile
bun run lint
bun test src/tests
bun run build
bunx playwright test --project=desktop-1440
```

Required flows: Admin provider CRUD/test/priority; provider failover with fake adapters; student learning flows; teacher class/assignment/attendance/grading; content/video management; mutations survive reload.

## 8. Non-goals

- No microservices or separate Domain/Application/Infrastructure projects.
- No MediatR/CQRS or generic repository.
- No 2FA, WAF, Kubernetes, Redis or distributed vault.
- No real paid-provider calls in CI.
- No redesign of the whole frontend visual system.

## 9. Branch and commit policy

- Umbrella branch: `refactor/simple-feature-backend-multiprovider-fe-fixes`.
- Use one implementation branch: `refactor/simple-feature-backend-multiprovider-fe-fixes`.
- Use separate commits for P0, P1, P2, P3, P4, P5 and P6 so a faulty phase can be reviewed or reverted independently.
- Never force-push or merge directly to `main`.
- Do not mix a directory move, migration and unrelated behavior change in one commit.
- Do not rewrite applied migrations.
- Every PR includes commands, pass counts, database name and zero-write evidence.

## 10. Definition of done

1. One production ASP.NET Core project and one test project remain.
2. Features follow the reference repository's co-located controller/service/interface/DTO style.
3. Existing `/api/v1` contracts remain compatible or have an explicit migration note.
4. Multi-provider management and failover work without exposing API keys.
5. Production FE does not silently fabricate successful data or actions.
6. All mutations survive reload.
7. Fresh/upgrade SQL Server scenarios pass.
8. Backend, FE and Playwright gates pass.
9. `ZhongWenHub_Dev` remains unchanged during automated work.

## 11. Antigravity instruction

Read this plan completely, then execute P0 through P6 in one continuous run. Do not stop after P0 and do not request review between phases. Preserve phase boundaries as separate commits, run tests after each phase, push only the umbrella branch, create one Draft PR, attach all reproducible evidence, and never merge `main` yourself. If a paid/external provider is unavailable, use fake HTTP handlers and continue; do not fabricate a passing live-provider result.

