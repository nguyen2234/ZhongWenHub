# Antigravity Plan — Backend Feature-Slice Restructure & Frontend Remediation

## 1. Metadata

- Repository: `nguyen2234/ZhongWenHub`
- Plan owner/reviewer: Codex
- Executor: Antigravity
- Source baseline: `main` at `2ff648a8a7234fbd0bd4fb3b191ab9f91f395f9a`
- Reference repository: `nguyendz2k4/DuAnTuyenDung` at `19998ad7703644d4882934806981d3e8b2e4cb3b`
- Target implementation branch: `refactor/backend-feature-slices-fe-remediation`
- Protected database: `ZhongWenHub_Dev` (strict zero-write)
- Test database: `ZhongWenHub_Test`

## 2. Executive decision

ZhongWenHub already has the requested three-project skeleton:

```text
Backend/
├── docs/
├── src/
│   ├── Api/
│   ├── Business/
│   └── Data/
└── tests/
```

Do **not** replace this with the reference repository's single-project monolith. The useful pattern from `DuAnTuyenDung` is its feature-first grouping (`Features/admin/...`, `Features/users/...`). Apply that pattern inside ZhongWenHub's existing `Api`, `Business`, `Data`, and `tests` layers.

Do not copy reference-repository security choices such as a hard-coded JWT fallback, weak password requirements, or configuration embedded in `Program.cs`.

The migration strategy is incremental. Preserve public routes, JSON contracts, authorization policies, EF table mappings, and migration history while moving one feature at a time.

## 3. Current-system findings

### 3.1 Backend

The physical layers are correct, but several files have become feature monoliths:

| File | Current size | Problem |
|---|---:|---|
| `Business/Content/ContentService.cs` | 3,822 lines | Courses, units, lessons, vocabulary, grammar, exercises, reviews, import/export in one service |
| `Business/QuestionBank/QuestionBankService.cs` | 2,271 lines | Query, commands, practice sessions, validation and analytics mixed together |
| `Business/Users/AdminUserService.cs` | 1,965 lines | User lifecycle, role operations, reports and exports mixed together |
| `Business/Teacher/Services/TeacherClassService.cs` | 1,415 lines | Class CRUD, membership, schedules and dashboards mixed together |
| `Data/Persistence/ApplicationDbContext.cs` | 1,300 lines | Entity configuration embedded in one method |
| `Business/Learning/LearningService.cs` | 1,117 lines | Progress, goals, dashboard and activity concerns mixed together |
| `Api/Controllers/ContentController.cs` | 1,068 lines | Multiple resources exposed by one controller |
| `Business/Content/DTOs/ContentDtos.cs` | 766 lines | Unrelated contracts coupled in one file |
| `Data/Persistence/DbInitializer.cs` | 645 lines | Infrastructure initialization and multiple seed domains coupled |
| `Api/Program.cs` | 333 lines | Composition, middleware and configuration validation are too centralized |

Other issues:

- CI's optional SQL Server step targets `ZhongWenHub.UnitTests.csproj` instead of `ZhongWenHub.IntegrationTests.csproj`.
- Integration and migration gates are optional, so schema regressions can reach `main` without a live SQL Server check.
- Feature tests are not consistently mirrored by feature folders.
- Applied migrations have previously been edited. From this plan onward, applied migrations are immutable; corrections must use a new forward-only migration.

### 3.2 Frontend

Current inventory:

- 319 `.tsx` files and 263 `.ts` files.
- 16 production files call `fetch` directly instead of consistently using the core client.
- 115 production files contain explicit `any`.
- 146 production files mention mock/demo/fallback behavior.
- Several components exceed 40–55 KB and mix data fetching, domain rules and presentation.

Confirmed remediation targets:

1. `admin-operations.service.ts` converts HTTP/network failures into `null`, hiding 401/403/500 errors.
2. `AdminAIManagementView.tsx` still initializes from `INITIAL_AI_SERVICES` and keeps a local-only quota slider that is not persisted.
3. `LearningResultsPage.tsx` renders `MOCK_RESULTS`.
4. `DashboardPage.tsx` imports and renders `DEMO_VIDEOS` in the product flow.
5. `SkillWritingPage.tsx` remains mock-only; other skill pages still contain test/demo data paths.
6. Authentication still contains mock login/register/Google/reset flows. They must never activate in a production build.
7. Teacher, support and some admin services maintain client-side mock stores or local-only actions.
8. API access is fragmented across raw `fetch`, the core `HttpClient`, and feature-specific error handling.
9. Large pages such as `DashboardPage`, `SkillSpeakingPage`, `HskCurriculumView`, and admin editor pages need container/presentation separation.

Not every fallback is invalid. Accessibility fallbacks such as speech synthesis, offline draft recovery, and clearly labeled test fixtures may remain when they do not fabricate successful server operations.

## 4. Target architecture

```text
Backend/
├── docs/
├── src/
│   ├── Api/
│   │   ├── Features/
│   │   │   ├── Authentication/
│   │   │   ├── Administration/
│   │   │   ├── Curriculum/
│   │   │   ├── QuestionBank/
│   │   │   ├── Exams/
│   │   │   ├── Learning/
│   │   │   ├── Teacher/
│   │   │   ├── AI/
│   │   │   └── Videos/
│   │   ├── Configuration/
│   │   ├── Middleware/
│   │   └── Program.cs
│   ├── Business/
│   │   ├── Features/
│   │   │   └── <Feature>/
│   │   │       ├── Contracts/
│   │   │       ├── DTOs/
│   │   │       ├── Services/
│   │   │       ├── Validation/
│   │   │       └── Mapping/
│   │   └── Common/
│   └── Data/
│       ├── Entities/<Feature>/
│       ├── Persistence/
│       │   ├── Configurations/<Feature>/
│       │   ├── Seeders/<Feature>/
│       │   ├── Migrations/
│       │   └── ApplicationDbContext.cs
│       └── Storage/
└── tests/
    ├── ZhongWenHub.UnitTests/Features/<Feature>/
    ├── ZhongWenHub.IntegrationTests/Features/<Feature>/
    ├── Contracts/
    └── Architecture/
```

Dependency rules:

- `Api` is the HTTP/composition layer and may reference `Business` and `Data` only for composition.
- `Business` contains use-case rules and may use the current `Data` abstractions during this refactor; do not introduce a repository wrapper that merely mirrors EF Core.
- `Data` must not reference `Api` or `Business`.
- Controllers must not contain EF queries or business calculations.
- DTOs must not expose EF entities.
- Cross-feature calls go through explicit interfaces, not another feature's concrete service.
- Preserve `/api/v1/**` routes and JSON property names unless a separately reviewed versioned contract change is approved.

Size objectives after extraction (guidelines, not reasons to create meaningless files):

- `Program.cs` <= 150 lines.
- Controllers <= 250 lines each.
- Services <= 500 lines each.
- DTO files <= 300 lines.
- `ApplicationDbContext.cs` <= 350 lines by using `IEntityTypeConfiguration<T>`.

## 5. Delivery phases

Every phase is a separate PR. Do not mix mass moves with behavior changes in the same commit.

### Phase P0 — Baseline, safety and contracts

1. Start from the latest `main`; include the accepted PR #32 fixes if not already merged.
2. Capture baseline commands and counts in the PR description:
   - backend build and unit tests;
   - frontend lint, unit tests and production build;
   - SQL Server integration/migration tests;
   - OpenAPI route snapshot.
3. Fix `.github/workflows/backend-tests.yml` so integration mode runs `ZhongWenHub.IntegrationTests.csproj`.
4. Add architecture tests for project references and controller-to-DbContext violations.
5. Add contract tests for route, status-code and JSON compatibility around Auth, Content, Videos, Admin, Teacher and Homework.
6. Establish `ZhongWenHub_Test` from a fresh migration and an upgrade-from-previous-schema scenario.

Acceptance:

- No production source move yet.
- Baseline is reproducible in CI.
- `ZhongWenHub_Dev` before/after evidence proves zero-write.
- Contract snapshots and database backup/restore instructions exist.

### Phase P1 — Composition root and data configuration

1. Extract configuration extensions from `Program.cs`:
   - authentication/authorization;
   - CORS and rate limiting;
   - OpenAPI;
   - health checks;
   - middleware pipeline;
   - startup configuration validation.
2. Keep `Program.cs` as a readable composition root.
3. Move EF fluent mappings from `ApplicationDbContext` into `Persistence/Configurations/<Feature>` and call `ApplyConfigurationsFromAssembly`.
4. Split `DbInitializer` into idempotent feature seeders.
5. Do not change table/column names and do not generate a migration for a pure configuration move.

Acceptance:

- Empty EF migration diff for pure moves.
- Fresh/upgrade SQL Server tests pass.
- Existing API contract snapshot is unchanged.

### Phase P2 — Curriculum/content vertical slice

Replace `ContentController` and `ContentService` incrementally with:

- `CoursesController` / `CourseService`
- `UnitsController` / `UnitService`
- `LessonsController` / `LessonService`
- `VocabularyController` / `VocabularyService`
- `GrammarController` / `GrammarService`
- `ExercisesController` / `ExerciseService`
- `ContentReviewController` / `ContentReviewService`
- `ContentImportExportController` / `ContentImportExportService`

Keep route templates compatible by using explicit `[Route]` attributes. Move DTOs and validation beside each feature. Preserve transactions for lesson aggregates, exercise presentation metadata, review gates and import operations.

Acceptance:

- All Content contract tests pass without FE changes.
- Lesson create/edit/publish, exercise link/unlink, vocabulary/grammar linking, video playback and HSK curriculum flows pass against SQL Server.
- Old monoliths are deleted only after no callers remain.

### Phase P3 — Remaining backend feature slices

Order:

1. Question Bank: queries, commands, practice sessions, import and analytics.
2. Administration/Users: lifecycle, roles, exports, operations and analytics.
3. Teacher: classes, schedules, members, assignments, attendance and dashboard.
4. Learning: progress, goals, daily activity, recommendations and dashboard.
5. Exams and Homework.
6. AI Tutor/AI Learning/Speaking.
7. Videos and storage/outbox processing.

For each slice:

- first add characterization/contract tests;
- move one use case group;
- keep route and authorization behavior stable;
- run unit, integration and affected FE tests;
- remove the old path only when references are zero.

### Phase P4 — Frontend API and error-state foundation

1. Route all normal JSON calls through `core/api/client/http-client.ts`.
2. Permit raw `fetch` only for documented streaming/upload cases and wrap them in typed adapters.
3. Standardize `ApiClientError`, ProblemDetails parsing, cancellation and retry rules.
4. Replace `Promise<T | null>` error swallowing with typed success or thrown typed error.
5. Add shared `LoadingState`, `ErrorState`, `EmptyState`, retry and unauthorized handling.
6. Separate API DTOs from UI view models; remove `any` from touched files.
7. Add OpenAPI contract generation or a checked-in typed-contract verification step.

Acceptance:

- 401, 403, 404, 409, 422, 429 and 500 are visibly distinguishable.
- No failed write is reported as successful.
- No production page silently substitutes mock data after an API failure.

### Phase P5 — Frontend functional remediation

Priority P0:

1. Admin operations:
   - remove `INITIAL_AI_SERVICES` as runtime fallback;
   - remove or implement the local-only quota slider through a real backend contract;
   - display telemetry loading/error/empty states;
   - propagate API errors instead of returning `null`.
2. Authentication:
   - ensure production builds cannot activate mock login/register/Google/reset flows;
   - preserve mock identities only under explicit test fixtures.
3. Learning results and dashboard:
   - replace `MOCK_RESULTS` and `DEMO_VIDEOS` with real endpoints;
   - show honest empty/error states when data does not exist.
4. Skills:
   - replace mock-only writing flow;
   - confine reading/listening/speaking fixtures to isolated tests;
   - retain accessibility speech fallback, clearly separated from grading truth.
5. Teacher/support/admin actions:
   - remove local-only state mutations that pretend persistence;
   - verify refresh after mutation reads the persisted backend state.

Priority P1:

- Split large page components into feature hooks, containers and presentation components.
- Add request cancellation on unmount and stale-response protection.
- Normalize pagination and filters.
- Remove duplicate token/header construction from feature services.
- Replace touched-file `any` with schemas/type guards.

Priority P2:

- Lazy-load heavy routes and reduce the oversized main bundle.
- Fix unresolved dashboard asset warnings.
- Remove unused imports and reduce lint warnings without blanket disables.

### Phase P6 — End-to-end release gate

Required role flows:

- student: register/login, curriculum, lesson, video, practice, homework, results;
- teacher: class/member/schedule, assignment, attendance and grading;
- content manager: curriculum and video CRUD, review and publication;
- admin: user/role lifecycle, settings behavior, analytics and AI telemetry;
- AI: success, 429, timeout, invalid payload and missing-key behavior.

Required gates:

```bash
dotnet restore Backend/ZhongWenHub.sln
dotnet build Backend/ZhongWenHub.sln --configuration Release --no-restore
dotnet test Backend/tests/ZhongWenHub.UnitTests/ZhongWenHub.UnitTests.csproj --configuration Release --no-build --filter "Category!=Integration"
dotnet test Backend/tests/ZhongWenHub.IntegrationTests/ZhongWenHub.IntegrationTests.csproj --configuration Release

cd Fontend
bun install --frozen-lockfile
bun run lint
bun test src/tests
bun run build
bunx playwright test --project=desktop-1440
```

Release is blocked by any failed gate, API contract regression, unexpected EF migration, production mock fallback, or write to `ZhongWenHub_Dev`.

## 6. Branch and PR policy

- Umbrella branch: `refactor/backend-feature-slices-fe-remediation`.
- Implementation PRs should be smaller branches rebased on latest `main`, for example:
  - `refactor/p0-contract-safety`
  - `refactor/p1-composition-data-config`
  - `refactor/p2-content-slice`
  - `fix/fe-api-error-foundation`
  - `fix/fe-remove-production-mocks`
- Never force-push `main`.
- Do not combine generated migrations, source moves and unrelated UI changes in one commit.
- Commit messages must describe the bounded feature and behavior.
- Each PR description must include commands, pass counts, SQL database name and before/after zero-write evidence.

## 7. Definition of done

The program is complete only when:

1. Target feature-first three-layer structure is present and old monoliths have no callers.
2. Public API and authorization contracts are preserved or explicitly versioned.
3. No production page fabricates a successful operation or silently falls back to mock data.
4. All supported admin, teacher, student and content-manager operations persist and survive reload.
5. Fresh and upgrade SQL Server migration scenarios pass.
6. Unit, integration, FE unit, build and Playwright role flows pass in CI.
7. Architecture tests prevent regression to cross-layer or controller-DbContext coupling.
8. `ZhongWenHub_Dev` remains unchanged.

## 8. Antigravity execution instruction

Antigravity must read this entire plan before editing. Start with Phase P0 only. Do not claim the whole plan complete after scaffolding. Stop after each phase, push a draft PR, attach reproducible evidence and wait for Codex review before starting the next phase.

