# Antigravity plan: finish backend consolidation and remove legacy duplicates

## Execution contract

- Source branch: `refactor/simple-feature-backend-multiprovider-fe-fixes`
- Source commit: `e67f402dcc0090d444541f38eba6f59f0c7f88be`
- Existing review: Draft PR #34
- Executor: Antigravity
- Goal: make `Backend/ZhongWenHub` the only production backend project and `Backend/ZhongWenHub.Tests` the only backend test project, without losing routes, migrations, tests, or runtime behavior.
- Database rule: `ZhongWenHub_Dev` is read-only. Never run migrations, seeders, cleanup jobs, or test writes against it.

Do not delete `Backend/src` or `Backend/tests` first. Migrate the missing tests, switch every active build/runtime reference, prove parity, and only then remove the legacy trees.

## Verified findings at the source commit

| Finding | Evidence | Consequence |
|---|---:|---|
| The solution still contains seven projects | Three legacy production projects, two legacy test projects, plus the new production and test projects | The claimed one-project consolidation is incomplete |
| Legacy and new source coexist | `Backend/src` has 276 tracked files; `Backend/ZhongWenHub` has 288; 259 legacy blobs are byte-identical to blobs in the new tree | Most backend code is duplicated |
| Tests coexist and are incomplete in the new project | `Backend/tests` has 55 tracked files; `Backend/ZhongWenHub.Tests` has 31; only 27 blobs overlap | Deleting legacy tests now would lose coverage |
| Six legacy unit/SQL test files were not moved | `BktAlgorithmTests`, `CompetencyProfileServiceTests`, `DiagnosticAssessmentServiceTests`, `RecommendationEngineV2Tests`, `SqlServerPhase1IntegrationTests`, `SqlServerPhase2ConcurrencyIntegrationTests` | The new project's reported 323 tests are not the full suite |
| Integration tests were not moved | 18 C# files remain in `Backend/tests/ZhongWenHub.IntegrationTests`, including `CustomWebApplicationFactory` and 115 discovered test cases | The reported 797 total double-counts duplicated tests and relies on the old projects |
| CI still executes the legacy projects | `.github/workflows/backend-tests.yml` runs both projects under `Backend/tests` | CI does not prove that the consolidated project is self-sufficient |
| Active documentation and scripts still use old paths | `AGENTS.md`, `API_GUIDE.md`, `Backend/README.md`, AI bridge scripts, and a video worker message reference `Backend/src` or `Backend/tests` | Removing legacy directories without updating these references breaks developer workflows |
| A runtime mock remains wired into production DI | `Program.cs` registers `MockAIProvider`; `ConfigurableAIProvider` accepts it; `MockAIProvider.cs` is under the production project | Production can still return fake AI output when configured as `Mock` |
| Placeholder test remains | `Backend/ZhongWenHub.Tests/UnitTest1.cs` | Dead scaffold should be removed |
| Docker database does not match the application | `Backend/docker-compose.yml` starts PostgreSQL while the application uses EF Core SQL Server | Local setup is misleading and cannot validate the real backend |

Historical result files under `.ai-collaboration/results` and old audit documents may mention legacy paths. Treat them as immutable history; do not rewrite them merely to make a grep pass. Only active instructions, automation, runtime messages, and current task definitions must be updated.

## Required target tree

```text
Backend/
├── ZhongWenHub.sln
├── ZhongWenHub/
│   ├── Common/
│   ├── Data/
│   ├── Features/
│   │   ├── admin/
│   │   └── users/
│   ├── Migrations/
│   ├── Models/
│   ├── Program.cs
│   └── ZhongWenHub.csproj
├── ZhongWenHub.Tests/
│   ├── Features/
│   ├── Integration/
│   ├── Support/
│   └── ZhongWenHub.Tests.csproj
├── docs/
├── README.md
└── docker-compose.yml
```

The final solution must list exactly these two projects:

1. `Backend/ZhongWenHub/ZhongWenHub.csproj`
2. `Backend/ZhongWenHub.Tests/ZhongWenHub.Tests.csproj`

The following directories must not exist at completion:

- `Backend/src`
- `Backend/tests`

## Implementation phases

### C0 — Freeze a truthful baseline

1. Continue from source commit `e67f402`; do not restart from `main` and do not overwrite unrelated commits.
2. Record the current solution project list, new-project test count, legacy unit/integration test manifests, runtime OpenAPI operations, route names, and EF migration identifiers.
3. Build and start only `Backend/ZhongWenHub/ZhongWenHub.csproj` with safe test configuration. Generate the route baseline from that running project, not from the legacy API.
4. Verify that all migration files and the model snapshot in the new project match the legacy history plus `AddMultiProviderAiConfigurations`.
5. Confirm all database-backed checks use an isolated `ZhongWenHub_Test` database. If an isolated database is unavailable, mark those tests as blocked; never redirect them to `ZhongWenHub_Dev`.

Exit gate: a machine-readable inventory distinguishes unique tests from duplicated copies and identifies every active old-path reference.

### C1 — Consolidate the complete test suite

1. Move and adapt the six missing unit/SQL test files into `Backend/ZhongWenHub.Tests/Features`.
2. Move all integration tests and `CustomWebApplicationFactory` into `Backend/ZhongWenHub.Tests/Integration` and `Support` as appropriate.
3. Make the test factory boot `ZhongWenHub.Program` from the new production project. Remove every project reference to the legacy API, Business, or Data projects.
4. Preserve test categories/traits so ordinary unit tests can run without SQL Server and integration tests can run against an explicitly configured isolated test database.
5. Port the tests to current public services and extensions. Update `JwtConfigurationTests` to test the current authentication registration instead of keeping `BusinessCompatibilityExtensions` solely for old test compatibility.
6. Keep the Multi-Provider router tests and add coverage proving that runtime AI failure returns a typed/sanitized error rather than mock content.
7. Delete `Backend/ZhongWenHub.Tests/UnitTest1.cs`.

Exit gate: the single test project contains the union of all unique legacy tests and new Multi-Provider tests. Report one real discovered/passed/skipped count; never add counts from duplicate projects.

### C2 — Remove production mock and compatibility scaffolding

1. Remove `MockAIProvider.cs` from the production project and remove its DI registration and constructor dependency.
2. Remove the runtime `Provider=Mock` branch. Tests may define fakes inside `Backend/ZhongWenHub.Tests`; production must not silently manufacture successful AI responses.
3. Keep real routing behavior: use `IMultiProviderAiRouter`; if no managed provider is available, use the explicitly configured real Gemini fallback only when valid; otherwise return a sanitized typed unavailable error.
4. Remove `BusinessCompatibilityExtensions.cs` after callers and tests use the current extension methods directly.
5. Update the stale EF command in `VideoStorageCleanupWorker` to target `Backend/ZhongWenHub/ZhongWenHub.csproj`.
6. Do not perform a repository-wide namespace rename in this cleanup. Old namespace names may remain where they are public/API-compatible; eliminate obsolete project/path dependencies, not working code merely for cosmetic reasons.

Exit gate: no production file or DI registration references `MockAIProvider`, and no fake-success fallback is reachable at runtime.

### C3 — Cut over solution, CI, local setup, and active documentation

1. Rewrite `Backend/ZhongWenHub.sln` so it contains exactly the new production project and the new test project.
2. Update `.github/workflows/backend-tests.yml` to restore/build the two-project solution and execute only `Backend/ZhongWenHub.Tests/ZhongWenHub.Tests.csproj`.
3. Run fast tests by category, and run database integration tests only when an isolated SQL Server connection is explicitly supplied. Upload the resulting TRX files.
4. Update active references in `AGENTS.md`, `API_GUIDE.md`, `Backend/README.md`, and current AI bridge scripts/task definitions to the new project and test paths.
5. Replace the stale PostgreSQL service in `Backend/docker-compose.yml` with a minimal SQL Server 2022 service intended for `ZhongWenHub_Test`. Use environment variables for credentials, add a health check, and do not encode a connection to `ZhongWenHub_Dev`.
6. Document the three canonical commands: restore/build, run API, and run tests. Document the EF command with the new project as both project and startup project.

Exit gate: a fresh clone following `Backend/README.md` never needs anything under `Backend/src` or `Backend/tests`.

### C4 — Delete the legacy trees

Only after C0–C3 pass:

1. Delete all of `Backend/src`.
2. Delete all of `Backend/tests`.
3. Confirm no old `.csproj` remains and there is only one copy of each migration and production source file.
4. Do not delete `Backend/docs`, the new migrations/model snapshot, current task files, frontend tests, or historical evidence files.
5. Search active code/configuration for `Backend/src`, `Backend/tests`, `src\\Api`, `src\\Business`, `src\\Data`, and the five legacy project names. Resolve every active hit.

Exit gate: the repository builds and tests with both legacy directories physically absent.

### C5 — Small, evidence-based optimization

1. Remove unused package references from the two remaining `.csproj` files only after a clean restore/build proves they are unnecessary.
2. Keep `Program.cs` simple. If service registration remains difficult to scan, extract one small `AddApplicationFeatures` extension grouped by feature; do not introduce MediatR, CQRS, generic repositories, microservices, or new architectural layers.
3. Remove duplicate usings, obsolete aliases, dead scaffold, and comments/messages that describe the old layout.
4. Preserve API routes, JSON contracts, authorization policies, CORS behavior, upload behavior, migrations, and frontend expectations.
5. Avoid broad formatting or namespace churn unrelated to deletion of the legacy structure.

Exit gate: optimization reduces duplication without expanding architecture or changing public behavior.

### C6 — Final independent verification

Run and report all of the following from a clean checkout of the cleanup branch:

```bash
dotnet restore Backend/ZhongWenHub.sln
dotnet build Backend/ZhongWenHub.sln -c Release --no-restore
dotnet test Backend/ZhongWenHub.Tests/ZhongWenHub.Tests.csproj -c Release --no-build
```

Then verify:

1. `Backend/ZhongWenHub.sln` lists exactly two projects.
2. Exactly two `.csproj` files exist under `Backend`.
3. `Backend/src` and `Backend/tests` do not exist.
4. Unit tests pass; isolated SQL integration tests pass or are explicitly reported as blocked, never silently skipped and called passed.
5. Runtime OpenAPI parity is preserved. The fixed teacher assignment route remains `/api/v1/teacher/assignments`; no duplicated route prefix returns.
6. The full EF migration chain is discoverable from the new project and no applied migration was edited.
7. Frontend `bun run lint`, `bun test src/tests`, and `bun run build` pass because this cleanup must not regress API contracts.
8. A production search finds no registered runtime mock provider and no fake admin/AI success fallback.
9. A zero-write audit confirms `ZhongWenHub_Dev` was not modified.
10. Active old-path references are zero. Historical audit/result documents are listed separately and are not treated as active blockers.

## Commit and PR requirements

Use small reviewable commits in this order:

1. `test(cleanup): migrate missing unit and integration coverage`
2. `refactor(cleanup): remove runtime mock and compatibility scaffold`
3. `build(cleanup): cut solution ci docs and local sql setup to new project`
4. `refactor(cleanup): remove legacy backend source and test trees`
5. `test(cleanup): verify consolidated backend and frontend contracts`

Update Draft PR #34, or open a cleanup PR based on it if branch policy prevents updating it. Do not merge to `main`, force-push, squash away the P0–P6 history, or claim completion while old projects are still required by any build/test command.

## Definition of done

- One production backend project and one backend test project exist.
- The solution and CI use only those projects.
- All unique legacy tests plus new tests live in the single test project.
- Legacy production/test directories are deleted only after parity gates pass.
- Runtime production has no mock AI provider or fake-success fallback.
- SQL Server local/test setup matches the actual EF provider.
- Runtime routes, migrations, FE contracts, and role behavior do not regress.
- The final report contains actual commands, exit codes, test counts, route count, migration count, and any honest blockers.
