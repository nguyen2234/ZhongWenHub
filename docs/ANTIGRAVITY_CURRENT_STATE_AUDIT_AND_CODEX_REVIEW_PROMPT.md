# Prompt for Antigravity: audit current structure and functional status, then push for Codex review

## Execution mode

This is an **audit-only pass**. Inspect, execute safe verification, write the requested reports, commit them, and push an audit branch. Do not refactor, fix, rename, delete, generate migrations, update production code, or merge anything during this pass.

### Source and target

- Repository: `nguyen2234/ZhongWenHub`
- Audit source branch: `refactor/simple-feature-backend-multiprovider-fe-fixes`
- Required source commit at start: `bf8c365f10620955df924bfde73c7e9c216e5a4a`
- Layout-plan branch to compare against: `docs/antigravity-study-ai-layout-plan`
- Layout-plan commit: `14b8d91417e303705f6a5a152bb0a06a49a4eb34`
- Audit output branch: `audit/current-structure-functional-status-20261124`
- Draft PR base: `refactor/simple-feature-backend-multiprovider-fe-fixes`
- Database rule: `ZhongWenHub_Dev` is read-only. All write-oriented verification must use `ZhongWenHub_Test` or a disposable database whose name is validated before use.

Read these two plan files without copying them into the implementation branch:

```bash
git show origin/docs/antigravity-study-ai-layout-plan:docs/ANTIGRAVITY_STUDYAI_LAYOUT_FULL_FUNCTIONAL_PLAN.md
git show origin/docs/antigravity-study-ai-layout-plan:.ai-collaboration/tasks/ZWH-STUDYAI-LAYOUT-FULL-FUNCTIONAL.json
```

## Required classification vocabulary

Every structure item and function must receive exactly one status:

- `WORKING`: real implementation exists, relevant automated/manual check passed, real API was used, and mutations were proven persistent after reload/re-query.
- `PARTIAL`: some layers work, but an endpoint, UI state, persistence behavior, role, validation, or test is incomplete.
- `BROKEN`: a reproducible error, failing command/test, incorrect route/schema, or false-success behavior was observed.
- `NOT_IMPLEMENTED`: the production UI or contract exists but the required backend/service/persistence implementation does not.
- `NOT_VERIFIED`: implementation may exist, but the required environment/evidence was unavailable. Never convert this status to `WORKING` based only on code presence.

Do not use vague values such as “probably works,” “completed,” “looks fine,” or “covered” without evidence.

## Evidence rules

1. Record the exact command, working directory, exit code, relevant result counts, and commit SHA.
2. For every defect, include severity (`P0`, `P1`, `P2`, `P3`), file path, line or symbol, reproduction, expected behavior, actual behavior, and affected FE/role flow.
3. A passing build proves compilation only; it does not prove a function is `WORKING`.
4. A unit test using a fake does not prove the production API, SQL persistence, external AI call, email delivery, or video storage works.
5. A frontend mock-fetch test does not prove a live BE–FE flow works.
6. API success must not be claimed when a catch/fallback returns fake data or when data disappears after reload.
7. Mark skipped, filtered, blocked and unexecuted tests separately. Never add them to passed counts.
8. Do not commit secrets, connection strings with credentials, tokens, private user data, database dumps, screenshots containing secrets, build output, or huge raw logs.

## A0 — Git and environment preflight

1. Fetch all branches and verify the source SHA.
2. Confirm the worktree is clean. Do not reset, stash, discard, or overwrite unrelated user work.
3. Create `audit/current-structure-functional-status-20261124` from the source SHA.
4. Record operating system, .NET SDK, Bun/Node versions, SQL Server availability, and whether a browser/Playwright environment is available.
5. Before any database check, resolve and print only the server/database names. Abort writes unless the database is explicitly `ZhongWenHub_Test` or an approved disposable name.
6. Capture read-only safety markers from `ZhongWenHub_Dev` before verification and repeat them at the end.

## A1 — Report the current repository and backend structure

Report the actual tree, not the intended tree:

1. Top-level repository and `Backend`, `Fontend`, `.github`, `scripts`, and active docs/task directories.
2. Every `.sln` and `.csproj`, project references, target frameworks and package references.
3. Current production project path and all test project paths.
4. Backend folders: `Common`, `Data`, `Features`, `Migrations`, `Models`, configuration and static/upload folders.
5. Feature ownership and namespaces. Count and list old `ZhongWenHub.Business.*`, compatibility aliases, duplicated feature ownership, or path/namespace mismatches.
6. Active references to removed paths/projects in CI, scripts, README, AGENTS, API guides and task generators. Exclude historical result documents from the active-reference failure count, but list them separately.
7. Compare current structure with the required STUDY_AI-style target from commit `14b8d91` and provide a mapping table: current path → intended path → migration risk → status.
8. State the exact number of production projects, unit-test projects, integration-test projects and total `.csproj` files.

Required structure verdict: `READY_FOR_LAYOUT_MIGRATION`, `BLOCKED`, or `ALREADY_MATCHES_TARGET`, with evidence.

## A2 — Audit EF Core and database migration health

Without writing to `ZhongWenHub_Dev`:

1. Identify every `DbContext` type, DI registration, Identity store context, runtime `MigrateAsync` context, migration `[DbContext]` metadata and snapshot context.
2. Run `dotnet ef migrations list` for every viable context using safe configuration.
3. Inspect the last migration designer and model snapshot for `AiProviderConfiguration` and all expected indexes.
4. On disposable databases only, verify:
   - fresh database migration from zero;
   - upgrade from the schema immediately before Multi-Provider AI;
   - no unexpected pending model changes after migration.
5. Do not run manual DDL or edit migration history to force a pass. If tooling cannot complete, record `BROKEN` or `NOT_VERIFIED` with the exact error.
6. Verify seed/auto-migrate flags and ensure application startup cannot accidentally seed or migrate `ZhongWenHub_Dev` during audit.

Explicitly validate or reject these known hypotheses:

- runtime uses `AppDbContext` while migrations target `ApplicationDbContext`;
- `AddMultiProviderAiConfigurations.Designer.cs` has an incomplete target model;
- the model snapshot does not contain `AiProviderConfiguration`.

## A3 — Audit routes and API contracts

1. Start the current API only with safe test configuration.
2. Generate a normalized runtime method/path list from Swagger or `EndpointDataSource` without modifying committed baselines.
3. Compare it with the committed baseline and the FE service call inventory.
4. Detect duplicate route prefixes, missing endpoints, conflicting endpoints, incorrect HTTP verbs and casing assumptions.
5. Explicitly verify:
   - teacher submission detail and grade routes;
   - Admin Multi-Provider AI management routes;
   - auth/profile/password-reset routes;
   - content, learning, homework, exams and video routes;
   - health/system routes;
   - support-ticket routes required by the FE.
6. Inspect the Swagger integration test and state whether it compares against an approved baseline or rewrites its own expected file.

## A4 — Run backend verification and report honest counts

Run from a clean audit checkout where tools are available:

```bash
dotnet restore Backend/ZhongWenHub.sln
dotnet build Backend/ZhongWenHub.sln -c Release --no-restore
dotnet test Backend/ZhongWenHub.Tests/ZhongWenHub.Tests.csproj -c Release --no-build
```

Also run filtered unit/integration groups separately and report discovered/passed/failed/skipped counts. Confirm whether SQL tests actually use `ZhongWenHub_Test`.

Audit the current CI workflow:

- Does it run the project paths that exist?
- Does it provision SQL Server?
- Does it apply migrations?
- Does it actually run integration tests on PRs?
- Can an unset environment variable silently skip all integration tests?
- Are TRX/test artifacts uploaded for both groups?

If the current suite reports 479 passed locally, determine how many are unit and integration tests and whether CI enforces both groups.

## A5 — Run frontend verification and inventory real vs mock behavior

Run:

```bash
cd Fontend
bun install --frozen-lockfile
bun run lint
bun test src/tests
bun run build
```

Then search production frontend code, excluding tests and stories, for:

- `mock`, `fake`, `demo`, `fixture`, static stores and hard-coded sample arrays;
- catch blocks returning fabricated data or empty success;
- local-only mutation that is not persisted by an API;
- success toasts shown before/without successful HTTP response;
- services that swallow 401/403/404/5xx;
- views with no loading, empty or error state;
- frontend routes with no backend endpoint.

Classify test mocks separately from production mocks. Test doubles are allowed; production fake-success behavior is not.

## A6 — Functional status matrix by role

Create one row per vertical flow with these columns:

`Area | Role | FE route/view | FE service | HTTP method/path | BE controller/service | Persistence | Automated evidence | Manual evidence | Status | Defects/blockers`

At minimum cover:

### Authentication and shared

- Register, login, refresh, logout, current profile, update profile, forgot/reset password.
- 401, 403, validation, API failure, loading and empty-state behavior.

### Admin

- Dashboard KPIs and analytics.
- Users, roles, teachers, support staff, lock/unlock, password reset, wallet/subscription changes.
- System settings, system health and operational views.
- Multi-Provider AI list/get/create/update/delete, key masking/rotation, enable/disable, test connection, priorities, usage and failover.

### Content Manager

- HSK repository, curriculum, courses/units/lessons, vocabulary, grammar, exercises, question bank, exams, videos, moderation, issues, audit history and quality metrics.
- Draft/review/publish and import flows.

### Teacher

- Dashboard, classes, members, schedules, attendance, assignments, publish/close, submissions, grading and feedback.

### Student

- Dashboard, learning path, lesson, vocabulary/SRS, grammar, four skills, practice, mock exams, videos, classes, homework/results, progress.
- AI tutor, AI exercises, diagnostic, recommendations, speaking and persistence.

### Support

- Support dashboard, ticket list/detail, status changes and replies.
- Explicitly identify static/mock ticket data or missing backend endpoints.

For every create/update/delete/grade/publish operation, verify persistence after a fresh GET or page reload. For ownership-sensitive flows, test at least two users.

## A7 — Required report files

Create exactly these audit outputs:

1. `docs/audit/2026-11-24_CURRENT_STRUCTURE_FUNCTIONAL_STATUS.md`
2. `.ai-collaboration/results/ZWH-CURRENT-STATE-AUDIT_result.json`

The Markdown report must contain:

1. Executive verdict and source SHA.
2. Actual structure tree and target comparison.
3. Build/test/tool availability with exact counts and exit codes.
4. EF/migration health.
5. Runtime route/API contract health.
6. Role-based functional matrix.
7. Working functions.
8. Partial/broken/not-implemented/not-verified functions.
9. Production mock/fake-success inventory.
10. Ordered P0–P3 defect backlog.
11. CI/Docker/developer-workflow gaps.
12. `ZhongWenHub_Dev` zero-write evidence.
13. Merge-readiness verdict: `READY`, `CONDITIONAL`, or `NOT_READY`.
14. Recommended repair order for the implementation task, without performing repairs.

The JSON result must be machine-readable and include:

- task ID, source branch/SHA, audit branch/SHA and timestamp;
- environment/tool versions;
- command results and test counts;
- structure/project counts;
- route and migration findings;
- per-function status records;
- defect records with severity/evidence;
- zero-write markers;
- merge-readiness verdict and blockers.

## A8 — Commit, push and Codex handoff

1. Confirm only the two required audit files are changed. Generated logs/baselines/build artifacts must not be committed.
2. Run JSON validation and `git diff --check`.
3. Commit:

```text
docs(audit): report current structure and functional status
```

4. Push `audit/current-structure-functional-status-20261124`.
5. Open a Draft PR against `refactor/simple-feature-backend-multiprovider-fe-fixes` titled:

```text
docs(audit): current structure and functional status for Codex review
```

6. PR body must contain source SHA, report links, commands executed, pass/fail/blocked summary, zero-write statement, merge-readiness verdict and the exact audit commit SHA.
7. Return the audit branch, commit SHA and Draft PR URL. State “awaiting Codex review”; do not claim that Codex approved it.

## Prohibited actions

- Do not change BE/FE production code, tests, workflows, migrations, configuration or dependency versions during this audit.
- Do not fix findings while auditing; report them with evidence.
- Do not write to `ZhongWenHub_Dev` or production services.
- Do not run manual DDL, seed, cleanup, import or destructive commands against protected data.
- Do not force-push, merge, rebase shared branches or update `main`.
- Do not hide failures by weakening assertions, changing expected routes, filtering tests, rewriting baselines or marking blocked tests passed.
- Do not include secrets or personal data in the report.

Completion means the audit report is truthful, reproducible, pushed, and ready for independent Codex review — not that the application has been fixed.
