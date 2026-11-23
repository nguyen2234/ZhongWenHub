# Antigravity plan: STUDY_AI-style modular monolith layout and full functional recovery

## 1. Execution contract

- Implementation source branch: `refactor/simple-feature-backend-multiprovider-fe-fixes`
- Required source commit: `bf8c365f10620955df924bfde73c7e9c216e5a4a`
- Existing review: Draft PR #34
- Layout reference only: `hthuyngan/STUDY_AI-`, branch `feature/backend-redesign-modular-monolith`, inspected at commit `16593c0`
- Executor: Antigravity
- Goal: reorganize ZhongWenHub into the same easy-to-navigate modular-monolith shape as the reference repository, repair all known backend/frontend blockers, and demonstrate that every supported role flow uses real APIs and persists correctly.
- Database rule: `ZhongWenHub_Dev` is read-only. All migrations, seeds, CRUD tests, imports, uploads, grading, AI-provider tests, and E2E writes must use `ZhongWenHub_Test` or a disposable database.

The reference repository is a naming and folder-layout guide, not a source-code donor. Do not copy its domain classes, fake LLM behavior, custom password stack, or unrelated services into ZhongWenHub.

Do not merge PR #34 into `main` before this plan is complete and independently reviewed.

## 2. Required target layout

```text
Backend/
├── ZhongWenHub.sln
├── src/
│   └── ZhongWenHub.Api/
│       ├── Common/
│       │   ├── Authorization/
│       │   ├── Exceptions/
│       │   ├── Middleware/
│       │   └── Utilities/
│       ├── Data/
│       │   ├── ApplicationDbContext.cs
│       │   └── DbInitializer.cs
│       ├── Features/
│       │   ├── Admin/
│       │   ├── AI/
│       │   ├── Auth/
│       │   ├── Content/
│       │   ├── Public/
│       │   ├── Student/
│       │   ├── Support/
│       │   └── Teacher/
│       ├── Migrations/
│       ├── Models/
│       ├── Properties/
│       ├── Program.cs
│       ├── appsettings.json
│       └── ZhongWenHub.Api.csproj
├── tests/
│   ├── ZhongWenHub.UnitTests/
│   │   └── ZhongWenHub.UnitTests.csproj
│   └── ZhongWenHub.IntegrationTests/
│       └── ZhongWenHub.IntegrationTests.csproj
├── docs/
├── README.md
└── docker-compose.yml
```

Final project count under `Backend`: exactly three `.csproj` files — one production API, one unit-test project, and one integration-test project.

## 3. Feature mapping

Move by feature with `git mv`; do not duplicate files and delete later.

| Current area | Target area |
|---|---|
| `Features/admin/Accounts`, `Analytics`, `Operations` | `Features/Admin` |
| Admin AI-provider controller and management UI contract | `Features/Admin/AiProviders` |
| AI tutor, learning engine, speech, personalization | `Features/AI` |
| Provider adapters, router and provider capability contracts | `Features/AI/Providers` |
| Authentication, JWT, password-reset delivery | `Features/Auth` |
| Curriculum, lessons, vocabularies, grammar, question bank, exams and video content management | `Features/Content` |
| Health/system-readiness endpoints | `Features/Public` |
| Learning progress, practice, exams, homework and enrolled-class views | `Features/Student` |
| Teacher classes, attendance, assignments, submissions and grading | `Features/Teacher` |
| Support dashboard, tickets and request lifecycle used by the frontend | `Features/Support` |
| Shared API result, pagination, clock, roles and middleware only | `Common` |
| EF context, initialization and persistence-only helpers | `Data` |
| Entities only | `Models` |

Controllers, service/interface pairs, validators and DTOs should be co-located inside their feature. Do not move domain-specific code into `Common` merely to avoid deciding its owner.

Normalize namespaces to the physical layout (`ZhongWenHub.Features.*`, `ZhongWenHub.Common.*`, `ZhongWenHub.Data`, `ZhongWenHub.Models.*`) one feature at a time. Build after each feature move. Preserve public JSON names and HTTP routes; folder and namespace changes must not break the frontend contract.

## 4. Verified blockers that must be repaired

1. `AddMultiProviderAiConfigurations.Designer.cs` has an almost empty target model and `ApplicationDbContextModelSnapshot` does not contain `AiProviderConfiguration`.
2. Migrations target `ApplicationDbContext`, while runtime auto-migration resolves and calls `AppDbContext`. Antigravity previously resorted to manual DDL on the test database; this is not acceptable.
3. Teacher submission endpoints still resolve to malformed paths under `/api/v1/teacher/assignments/api/v1/teacher/submissions/...`.
4. The Swagger route test rewrites its committed baseline and timestamp instead of failing on route regression.
5. Active `scripts/ai_bridge` files still reference deleted `Backend/src/Api`, `Backend/src/Business`, or old `Backend/tests` projects.
6. Backend CI does not provision SQL Server or execute integration tests by default, so the reported 479-test result is not independently enforced.
7. Frontend routes include admin, content-manager, teacher, support and student screens. Each production screen must be audited for static mock stores, fake success, silent catch/fallback, non-persistent mutation, or missing backend endpoint.

## 5. Implementation phases

### R0 — Truthful baseline and safety preflight

1. Start from `bf8c365`; do not restart from `main`, overwrite unrelated commits, or force-push.
2. Record the current solution/project list, unique test manifest, runtime OpenAPI operation list, controller routes, EF migration identifiers, and active frontend routes/services.
3. Record read-only `ZhongWenHub_Dev` safety markers: database name, selected table counts, and maximum created/updated timestamps. Never print credentials or private user data.
4. Create or verify an isolated `ZhongWenHub_Test` connection. Add a fail-closed guard so tests abort unless the database name is exactly an approved test name.
5. Produce a machine-readable FE-to-API contract inventory: screen, service method, HTTP method/path, required role, mutation/persistence expectation, backend controller, and automated test.

Exit gate: all pre-existing failures and unimplemented FE flows are listed before structural work begins. Do not relabel an existing failure as a refactor regression.

### R1 — Repair migrations, routes and regression gates first

1. Consolidate to one real EF context type: `ApplicationDbContext`. Move the full model configuration into it, register it with `AddDbContext<ApplicationDbContext>`, use it for Identity and runtime migration, and remove the `AppDbContext` compatibility context after all callers are migrated.
2. Keep applied migration `Up`/`Down` operations immutable. Repair context metadata, the last designer target model and `ApplicationDbContextModelSnapshot` using EF tooling. If an already-applied database differs, create a forward-only corrective migration; never execute ad-hoc DDL and never edit migration history manually.
3. Prove both database paths on disposable SQL Server databases:
   - fresh database: apply the entire migration chain from zero;
   - upgrade database: start from the pre-Multi-Provider schema and apply pending migrations.
4. Verify `AiProviderConfigurations` and its indexes exist exactly once, and a subsequent `dotnet ef migrations add` dry-run produces no unexpected schema changes. Remove the dry-run migration afterward.
5. Fix teacher submission routes with absolute templates:
   - `GET /api/v1/teacher/submissions/{id}`;
   - `POST /api/v1/teacher/submissions/{id}/grade`.
6. Convert the OpenAPI test into a read-only comparison against an approved normalized method/path list. Move baseline generation to an explicit opt-in script; exclude timestamps and volatile descriptions from equality checks.
7. Update active AI-bridge scripts away from deleted paths. Historical result/audit files may retain their original paths as immutable evidence.

Exit gate: EF commands work without manual SQL, no malformed route exists, and adding/removing a route makes the contract test fail.

### R2 — Move the production project into `Backend/src`

1. Use `git mv Backend/ZhongWenHub Backend/src/ZhongWenHub.Api`.
2. Rename `ZhongWenHub.csproj` to `ZhongWenHub.Api.csproj`; keep the root namespace/API contracts compatible unless a feature is being normalized deliberately.
3. Update `Backend/ZhongWenHub.sln`, project references, EF commands, launch settings, Docker paths, scripts, workflow paths, README, AGENTS and API guides.
4. Ensure only one production project exists. Do not recreate separate Business/Data projects.
5. Build the API immediately before proceeding to feature moves.

Exit gate: `dotnet build Backend/src/ZhongWenHub.Api/ZhongWenHub.Api.csproj` passes from a clean checkout and no active reference points to `Backend/ZhongWenHub`.

### R3 — Normalize feature ownership and namespaces

Process in this order: `Auth` → `Public` → `Admin` → `Content` → `Student` → `Teacher` → `AI` → `Support`.

For each feature:

1. Move controller, service, interface, DTO, validator and feature-specific helper together.
2. Normalize namespace/usings and DI registrations.
3. Keep existing method/path, role authorization, request/response JSON and status codes.
4. Build the API and run that feature's focused unit tests before moving the next feature.
5. Remove obsolete aliases or compatibility extensions only after no caller uses them.

Do not introduce MediatR, CQRS, microservices, generic repositories, a custom `IUnitOfWork`, event buses, or enterprise permission infrastructure.

Exit gate: no `ZhongWenHub.Business.*` or old folder-derived compatibility namespace remains unless documented as a public compatibility exception with a test.

### R4 — Split the tests into two projects

1. Create `Backend/tests/ZhongWenHub.UnitTests/ZhongWenHub.UnitTests.csproj` referencing only the API project. Move deterministic service/model/controller-contract tests here.
2. Create `Backend/tests/ZhongWenHub.IntegrationTests/ZhongWenHub.IntegrationTests.csproj` referencing the API and containing `WebApplicationFactory`, SQL tests, route/OpenAPI tests, migrations, auth/RBAC, storage and end-to-end API tests.
3. Move `SqlServerPhase1IntegrationTests` and `SqlServerPhase2ConcurrencyIntegrationTests` into the integration project.
4. Keep fakes/test doubles under the owning test project. Production must contain no `MockAIProvider`, fake success provider, mock repository, or demo data fallback.
5. Do not add project references between the two test projects. Shared helpers should be tiny linked files only when unavoidable; prefer independent support folders.
6. Retain or increase the unique test inventory. The current consolidated suite reported 479 tests; final totals must be reported separately for unit and integration projects without double-counting.

Exit gate: unit tests run without SQL Server, integration tests fail closed without an approved isolated connection, and both projects pass with the test SQL Server available.

### R5 — Keep local security simple but real

Use the minimum security needed for a local multi-role application:

1. Keep ASP.NET Core Identity, JWT authentication and role authorization for `ADMIN`, `CONTENT_MANAGER`, `TEACHER`, `SUPPORT`, and `STUDENT`.
2. Use the built-in Identity password hasher and simple password rules. Do not copy custom Argon2 or enterprise permission mapping from the reference project.
3. Permit a documented development-only JWT fallback secret for local startup. Production must fail closed when the secret is absent; never commit real credentials.
4. CORS may allow only documented localhost frontend origins in development.
5. Keep ownership checks: users cannot read or mutate another user's progress, AI conversations, homework, submissions or uploads.
6. Keep admin/provider API keys encrypted or protected locally, masked in every response and absent from logs. “Local” does not authorize plaintext secrets in Git or API responses.
7. Keep real AI provider routing/failover. Missing providers return a typed unavailable error, never a fake successful lesson or chat response.
8. Do not add complex security work that has no functional requirement. Do not remove behavior required by existing RBAC/ownership tests merely to shorten code.

Exit gate: simple login and role flows work locally, and 401/403/ownership tests still pass.

### R6 — Complete every real API-backed feature

Audit and repair the following vertical slices. For every mutation, prove success survives reload and is stored in SQL Server or the configured storage provider.

#### Authentication

- Register, login, refresh, logout, current profile, update profile, forgot password and reset password.
- Loading/validation/error states on FE; no success message when email delivery or API mutation fails.

#### Admin

- Dashboard KPIs, accounts, roles, teachers/support staff, lock/unlock, password reset, wallet/subscription adjustments.
- Analytics, system settings/health and operational views use real APIs.
- Multi-Provider AI: list/get/create/update/delete, enable/disable, connection test, priority ordering and usage metrics.
- Provider key rotation preserves the existing key when an edit submits a masked/blank value.

#### Content manager

- Curriculum, courses, units, lessons, vocabulary, grammar, exercises, question bank, exams, videos, moderation, issues, audit history and quality metrics.
- Create/edit/publish/review flows persist and return typed failures; imports are validated and transactional.

#### Teacher

- Dashboard, classes, members, schedules, attendance, assignments, publish/close, student submissions, grading and feedback.
- Repair the two submission routes and add controller/integration/FE service tests for them.

#### Student

- Dashboard, learning path, lessons, vocabulary/SRS, grammar, listening/speaking/reading/writing, practice, mock exams, videos, enrolled classes, homework and results.
- AI tutor, AI exercises, diagnostic assessment, recommendations, speaking and progress persistence use real providers/APIs or show an explicit unavailable state.

#### Support

- Support dashboard and ticket list/detail/status/reply flows require real backend endpoints. If a frontend page currently uses static ticket data, implement the minimal SQL-backed feature or mark the UI unavailable; never present mock tickets as real.

#### Shared behavior

- Correct loading, empty, error, unauthorized and forbidden states.
- No `catch` block converts API failure into fake data or success.
- Video upload/view/thumbnail cleanup and storage failure paths remain functional.

Exit gate: the FE-to-API contract inventory has no unresolved production mock/fake-success row.

### R7 — CI, Docker and developer workflow

1. Update CI to restore/build the three-project solution and run unit tests on every backend PR.
2. Provision SQL Server 2022 in the integration job, wait for health, create only `ZhongWenHub_Test`, apply migrations with `ApplicationDbContext`, and run integration tests with an explicit test connection string.
3. Keep `Backend/docker-compose.yml` aligned with SQL Server. Add a documented command/script to create the local test database; do not point Docker test commands at `ZhongWenHub_Dev`.
4. Update all current README, AGENTS, API guide, AI-bridge task generators and verification scripts to the new paths.
5. Add guards that fail when active files reference removed project paths or when more/less than the expected three `.csproj` files exist.

Exit gate: a fresh clone can follow README commands without knowing the previous layout.

### R8 — Final full-stack acceptance

Required backend commands:

```bash
dotnet restore Backend/ZhongWenHub.sln
dotnet build Backend/ZhongWenHub.sln -c Release --no-restore
dotnet test Backend/tests/ZhongWenHub.UnitTests/ZhongWenHub.UnitTests.csproj -c Release --no-build
dotnet test Backend/tests/ZhongWenHub.IntegrationTests/ZhongWenHub.IntegrationTests.csproj -c Release --no-build
```

Required frontend commands:

```bash
cd Fontend
bun install --frozen-lockfile
bun run lint
bun test src/tests
bun run build
```

Required additional acceptance:

1. Fresh and upgrade SQL Server migrations pass without manual DDL.
2. Runtime OpenAPI normalized method/path list matches the approved baseline and contains no duplicated route prefix.
3. Playwright role flows cover Admin, Content Manager, Teacher, Support and Student: happy path, 401, 403, API failure, empty state, reload persistence and one two-user isolation case.
4. AI provider failover is tested for timeout, 408, 429 and 5xx; all-provider failure returns sanitized 503.
5. Video viewing and management are exercised with real API responses.
6. `ZhongWenHub_Dev` read-only markers remain unchanged.
7. The final report includes commands, exit codes, unit/integration/FE/E2E counts, route count, migration count, project tree, blockers and skipped tests. Do not call a blocked or skipped test passed.

## 6. Commit sequence

Use reviewable commits in this order:

1. `fix(preflight): repair ef context migrations routes and contract gates`
2. `refactor(layout): move api into backend src modular monolith`
3. `refactor(features): normalize feature ownership and namespaces`
4. `test(layout): split unit and integration test projects`
5. `fix(fullstack): complete real api role flows and remove mock fallbacks`
6. `build(ci): align sql integration docker scripts and documentation`
7. `test(acceptance): verify backend frontend migrations and role e2e`

Update Draft PR #34 with these commits. Do not force-push, merge to `main`, squash away the existing P0–C6 history, or create a second parallel implementation containing the same source files.

## 7. Definition of done

- The target `src/ZhongWenHub.Api` plus split `tests` tree is exact and contains only three backend projects.
- A single `ApplicationDbContext` owns runtime, Identity, EF migrations and test migration execution.
- No manual SQL is needed for fresh or upgrade databases.
- All API routes and JSON contracts used by the frontend remain compatible; known malformed routes are fixed.
- All role portals use real APIs with persistent data and honest loading/empty/error states.
- Production contains no mock data provider or fake-success fallback.
- Simple local Identity/JWT/RBAC and ownership checks work without enterprise security additions.
- Backend unit/integration tests, frontend lint/tests/build, and role E2E pass in CI or are honestly reported as blocked.
- `ZhongWenHub_Dev` remains unchanged.
