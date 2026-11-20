# M1 — BIG PHASE FULLSTACK FUNCTIONAL RECOVERY PLAN
**Date:** 2026-11-20. **Repo:** nguyen2234/ZhongWenHub. **Execution agent:** Antigravity. **Source:** Issue #27, user product requirements, GitHub code-tree audit and selected implementation inspection.

> CHANGE OF EXECUTION STRATEGY. User requests a **large, end-to-end functional phase** rather than small isolated patches. M1 is one integrated delivery wave, split into internal workstreams with end-to-end acceptance, not a succession of tiny UI-only tasks. This plan supersedes the P00-first execution queue in the historical 2026-11-20 PLAN and the old handoff, but DOES NOT supersede AGENTS.md or require automatically merging anything.

## 0. Current Git reality (re-check at start, never trust frozen SHAs)
- P00 PR #28 **MERGED** into main; main at last audit `f96da34877c4695bd08b505ffbfa09670282b17f`; Backend CI and Frontend deploy succeeded after merge.
- F01 PR #29 is **OPEN DRAFT**, remote head at last audit `fde4c6c5a5ab3cadf42512ac590589d7fcdabe32`. FE and BE CI passed, but SQL integration and Playwright are skipped/blocked in GitHub Actions. Important F01 identity/mocks/cross-account isolation P0 findings are still open on the remote code.
- Antigravity previously reported **11 local uncommitted F01 files**; GitHub cannot see them. Inspect local git and preserve ALL of them before updating, cherry-picking or switching worktrees.
- Open unmerged teacher/video PRs #21 (base feat/teacher-module-completion), #23 (base feat/teacher-module-completion), #24 (base fix/anti-full-fe-be-functionality), #25 (base feature/teacher-core-phase1): **not included in main**. Inspect diffs and coordinate file ownership via Issue #22.
- Current branch/document planning is independent of app execution. Saving this prompt is NOT proof that functionality has been coded.

## 1. Audit coverage and evidence quality
- Repository main recursive tree contains **1,965 tracked blobs**, non-truncated at audit time. Examined route definitions, controllers, selected app/service implementations, prior audit/plan and PR/CI evidence; did **not** execute every button, review every source line, or run local SQL/browser. All uninspected functions are UNVERIFIED.
- Stack verified: `Fontend/` (intentional spelling), React 19 + React Router 7 + TypeScript + Vite/Bun, ASP.NET Core/.NET 10 + EF Core SQL Server, Swashbuckle Swagger/OpenAPI in Backend/src/Api/Program.cs. Existing workflows: backend-tests.yml, frontend-pr-ci.yml, deploy.yml.
- Required exhaustive execution-time audit must inventory all routes, menu items, buttons, handlers, HTTP contracts, BE service, EF entity/table, SQL persistence and real test evidence. Do NOT infer complete system operation from one green unit suite.

### Verified representative risk matrix
| Role / surface | Observed file / implementation | Current evidence | Required M1 resolution |
| --- | --- | --- | --- |
| All roles / auth | PR #29; Fontend/src/features/auth/services/student-identity.adapter.ts; authService.ts; core/api/client/api-config.ts | F01 remote PR Draft; current main still has demo student fallback and browser mock toggle | Finish F01 safe identity, auth RBAC, no production mock login, A→B cache isolation, verify CI & live E2E |
| Student / learning state | Fontend/src/features/learning/services/learning-state.service.ts; context/LearningStateContext.tsx | Constructor defaults to `usr-st-01`; async state updates can race with account switch | Null/guest state, ownership-scoped cache, generation guard for async writes |
| Support / reports | Fontend/src/management/support/services/support-ticket.service.ts | `INITIAL_TICKETS` + `this.tickets` in-memory; no dedicated ticket controller found in controller inventory | ALL roles create/view own tickets; Support inbox/assignment/reply/escalation, Admin global view, SQL trail |
| Content / issue queue | Fontend/src/management/content-manager/services/content-issues.service.ts | `INITIAL_CONTENT_ISSUES` + in-memory mutations | SQL-backed linked content issues and Support workflow |
| Content / moderation | Fontend/src/management/content-manager/services/content-moderation.service.ts | `INITIAL_MODERATION_ITEMS` and in-memory updates | Real review/approve/reject/publish with RBAC and persisted audit |
| Content / audit | Fontend/src/management/content-manager/services/content-audit.service.ts | `INITIAL_VERSION_SNAPSHOTS`, `INITIAL_QUALITY_METRICS` and synthetic snapshot IDs | Real version history, quality metrics and review logs |
| Admin / user CRUD | Backend/src/Api/Controllers/AdminUsersController.cs | Existing GET/POST/PUT/lock/unlock/status/roles APIs; runtime FE/DB behavior unverified | Reuse, fix FE wiring and live CRUD/role checks |
| Admin / roles | Fontend/src/management/admin/roles/services/role-permission.service.ts | `INITIAL_ROLES` and local permission edits coexist with limited BE role endpoints | SQL-backed role/permission management, server-enforced claims, audited grants |
| Admin / AI & APIs | Fontend/src/management/admin/pages/operations/AdminAIManagementView.tsx; Backend/src/Api/Controllers/AdminOperationsController.cs | `INITIAL_AI_SERVICES` client list; BE stats/settings but no confirmed provider secret CRUD/inventory API | Genuine provider/model CRUD, credential security, quotas, spend, OpenAPI endpoint catalog |
| Student / practice | Fontend/src/features/practice/PracticeCenter.tsx; services/practice-question-bank.service.ts | Imports `MOCK_RECOMMENDATION`, `MOCK_MISTAKE_RECORDS`, `PRACTICE_EXERCISE_POOL`; real question bank service also exists | Distinct Basic vs AI Weakness, persisted attempts, deterministic evidence-driven recommendations |
| Student / dashboard | Fontend/src/features/dashboard/pages/DashboardPage.tsx | Imports/renders `DEMO_VIDEOS`; actual learning-state recommendation code also exists | Today 1–3 user-specific weak lessons + real videos/KPI, cold start |
| Teacher / class & homework | Backend TeacherClassesController, TeacherAssignmentsController, StudentHomeworkController; FE management/teacher | BE lifecycle APIs found; overlapping unmerged PR #21/#23/#24; E2E unverified | Classroom, enrollment, attendance, assignment, submission, grading, real results all SQL durable |
| Content / HSK CMS | Backend ContentController, QuestionBankController, VideosController, ExamsController | Significant BE routes and SQL migrations already exist; FE review/publish E2E unverified | Reuse real CRUD, provenance and approval/version workflow; no fake release |
| Student / writing | Fontend/src/features/skills/pages/SkillWritingPage.tsx | `MOCK_WRITING_EXERCISES` production import | Published prompts + response/grade/history persisted or honest unavailable |
| Student / games | Fontend/src/features/games/pages/LearningGamesPage.tsx | `INITIAL_PAIRS` and randomized local gameplay | Real published question content, saved attempts/scoring or honest unavailable |
| Student / results | Fontend/src/features/results/pages/LearningResultsPage.tsx | `MOCK_RESULTS` rendered | Real student-scoped results and filters/pagination |
| Other menus | StudentLayout, ManagementLayout, app/router/*.routes.tsx | Existence of route does not prove functionality | Full menu/button matrix incl. AI Tutor, all 4 skills, tests, profile/settings, notifications, achievements, progress, feedback |
| Backend AI personalization | AILearningEngineController, RecommendationEngineV2 and related DTOs | Existing JWT-protected controllers/services, not full user-journey proof | Reuse competence/diagnostics and validate real SQL/AI flow; fail-closed for provider failures |

**Classification**: CONFIRMED_MOCK, CONFIRMED_BROKEN, API_PRESENT_UNVERIFIED, IMPLEMENTED_UNVERIFIED, VERIFIED_UNIT, VERIFIED_API_SQL, VERIFIED_BROWSER_SQL, BLOCKED, NOT_IMPLEMENTED. Every row contains exact path, line, role, action, backend endpoint, database table, evidence and owner. Never call UNVERIFIED "PASS".

## 2. Product contract for the ONE M1 BIG PHASE
Deliver fully usable flows across ADMIN, SUPPORT, TEACHER, CONTENT_MANAGER, STUDENT, all backed by real FE↔ASP.NET API↔EF Core↔SQL. M1 is a coherent functional-release wave, not visual snippets. The required workstreams form internal checklists, executed to completion in batches without asking approval for each tiny fix.

**W0 — Secure identity foundation (entry gate / finish existing PR #29 without losing local 11-file patch).** Guest cannot access learning/admin. No demo/default identity in production (including learning-state constructor/provider), mock auth cannot turn on in production, refresh/logout/session permissions safe. Reject delayed async response from User A after switching to B. RBAC + IDOR in backend, cold-load and A→B E2E. Do not merge PR #29 without explicit approval.

**W1 — Unified Support Reports & Complaints (all roles).** Global visible "Báo cáo sự cố" + "Báo cáo của tôi" (Student, Teacher, Content Manager, Admin, Support where appropriate); ticket creation with type, module/context, description, priority, safe attachment metadata, actor, timestamp; my report list/detail/timeline/messages/reopen; Support SQL inbox/filter/search/paginate/assign/respond/status/escalate/resolve/close; Admin full review/audit/analytics; Content Manager linked issue resolution and feedback; unread state and audit. Single persisted source of truth. Authorize reporter/assigned staff/admin per row. UI states and notifications real, no in-memory tickets. Attachment upload only if safe infrastructure exists; otherwise truthful unsupported UI, not fake success.

**W2 — Admin Real CRUD, RBAC & Organization.** User/Teacher/Support/Content Manager profiles create/list/detail/edit/status/lock/unlock/role grant/revoke; validation, pagination, password/reset/invite secure, concurrency, audit; role-permission matrix stored and checked server-side (not local cache). No hardcoded password or client-assigned privilege. Verify actual existing AdminUsersController routes before creating more.

**W3 — Admin API Registry + AI Provider Control.** View all internal ASP.NET API routes via authenticated Swagger/OpenAPI inventory: method/path, role/policy, DTOs, status; searchable and read-only (not arbitrary route creation). Independently create/update/disable external AI/API provider configurations with allowlisted base URL/models, safe test connection, masked secret reference, key rotation, encrypted/vault credentials, usage/cost/quotas/budgets/rate limits, health/errors/audit. Restrict arbitrary URLs/SSRF and credential exposure. Safe provider abstraction must be used by runtime AI, not only Admin UI.

**W4 — Teacher Classes, Homework & Feedback.** Teacher creates/edits classes, manages members/schedules/attendance, builds assignment using real published question bank, sets target/due dates, drafts/publishes/closes, grades and comments. Student sees correct assigned class/homework, starts/submits, receives actual grade and feedback. Admin sees management overview. E2E with two teachers/two students, ownership, idempotent submit and persistence after reload/restart. Reconcile PR #21/#23/#24; never copy stale overlapping code blindly.

**W5 — Basic & AI Adaptive Practice + Daily Dashboard.** Split practice menu into "Bài tập cơ bản" (approved HSK/lesson/skill/format/level filters + deterministic grading, stored attempts) and "Luyện điểm yếu với AI" (student-specific error analysis and actual weak knowledge / spaced repetition / personalized templates; AI if available and budget-safe, deterministic fallback must not fabricate weak topics). Dashboard must show "Hôm nay nên ôn gì?" with 1–3 genuine weak lessons, explanation, actionable deep links, dynamic daily data and cold-start diagnostic if no evidence. Remove DEMO_VIDEOS, synthetic KPIs and cross-user cache leakage. Practice, recommendation and Dashboard must remain coherent on refresh.

**W6 — Content HSK & Publishing Workflow.** Content Manager/Admin real course-unit-lesson, grammar, vocab, character, question bank, exams, videos CRUD; import/export if control exists; review/approve/reject/publish/unpublish, provenance/licensing, version restore and content issue moderation. Publish visibility to student only after actual approval. Audit trail SQL. Do not discard working existing HSK data, controllers or migrations.

**W7 — All remaining menu functionality & honest empty states.** Enumerate every Student/Teacher/Support/Content/Admin route, tab, button, filter, modal, CRUD and action. Writing/listening/speaking/reading, SRS, AI Tutor/AI conversation, tests, games, learning-results/progress, leaderboard/achievements, profile/settings, videos, notifications and role dashboards must either complete real FE→BE→SQL functionality or present an explicit "Chưa hỗ trợ/Chưa có dữ liệu" disabled state without a success toast. No clickable fake functions or mock data in production. Track every exception in matrix.

**W8 — Unified UI, API contracts, quality & release.** Use `Fontend/.agents/skills/ui-ux/SKILL.md` and follow its `dựng luôn` / reuse-brand workflow because owner explicitly asks to implement without pausing for per-screen wireframe selection; use existing StudentLayout and ManagementLayout. Uniform Vietnamese labels/forms/tables, loading/empty/error/success, accessibility, responsive 360/768/1440. Preserve feature behavior. OpenAPI DTO mapping, TypeScript typed clients where appropriate, security/role matrix and browser/SQL E2E.

## 3. Fast execution plan (macro batches, NO small-stop pattern)
**Batch A (foundation + contracts)**: inspect git/open PRs/local 11 files, preserve changes; read all routes and UI actions, produce in-chat audit matrix; lock SQL isolation; finish F01 P0 and shared auth/DTO errors. Build/reuse common API services; define migrations, typed DTOs and cross-workstream ownership.
**Batch B (core operational roles)**: complete W1 + W2 + W3 together as end-to-end FE–BE–SQL working modules, not UI placeholders. Commit only with explicit approval; keep changes local until then.
**Batch C (learning loop)**: complete W4 + W5, including Teacher→Student→Dashboard practice feedback full E2E.
**Batch D (publishing + residual modules + UX)**: complete W6 + W7 + W8, UI harmonization and regression sweep.
**Batch E (integrated QA and acceptance)**: walk through all roles + SQL restart persistence, security and API contract, fix bugs until green; provide one consolidated review and request commit/push approval. Favor one long-lived integrated M1 workstream with internal batches rather than one PR per button. Keep existing PR #29 unmerged and isolate overlapping work in coordinated worktrees; do not mix unrelated local work or create a misleading PR that hides F01 history. If blocked by PR dependency, code independent submodules on separate integration worktree and reconcile safely before opening the M1 Draft PR.

**Concurrency**: at most 2–3 agents with EXCLUSIVE file/DB migration ownership: (A) Auth/architecture/QA; (B) Backend+SQL contracts; (C) FE wiring/UI/tests. One integrator owns route/DI/shared contracts. No simultaneous SQL writes to same test DB; separate disposable test DBs or serial migrations. Do NOT merge generated patches until code review and tests pass.

## 4. Acceptance gates per user-visible feature, inside the M1 wave
1. UI action triggers actual service, HTTP request, controller, authorized business logic and committed SQL change/read. Refresh & API restart preserve results. Otherwise BLOCKED/FAIL, not DONE.
2. Negative testing: guest 401, wrong role 403, cross-account 404/403, validation 400, conflict 409, rate 429, provider/network 5xx, retry/error UI, duplicate/race/idempotency. No fake success, no leaked answers, no secrets in FE/PR/log.
3. Database migrations and seed ONLY on approved isolated `ZhongWenHub_Test`, with pre-flight DB_NAME verification; `ZhongWenHub_Dev` strictly READ-ONLY and prod never touched. COUNT/MAX(UpdatedAt) of users do NOT prove zero writes on all tables.
4. Frontend: `cd Fontend && bun run lint && bun test src/tests && bun run build`; Backend: `dotnet build Backend/ZhongWenHub.sln -c Release`, unit + isolated integration tests; Playwright/browser E2E with actual live API+SQL, no fake mocked network for final acceptance. Inspect existing workflow commands instead of inventing projects.
5. Unified full E2E journeys: (i) Student registers/logs in, runs Basic practice, sees weakness in dashboard, runs adaptive, persists; (ii) any role reports incident, Support resolves, reporter sees reply, Content Manager resolves linked issue; (iii) Admin creates staff, grants/revokes permission, actual endpoint enforces; (iv) Admin safely updates AI provider and sees usage without exposing key; (v) Teacher class→assignment→student submit→grade→result; (vi) Content drafts/reviews/publishes HSK item→student sees it. Also logout/A→B isolation, reload and restart.
6. One release QA matrix of PASS/FAIL/BLOCKED for each module; no numeric PASS claims without executed logs; independent review and owner sign-off before merge.

## 5. Non-negotiable git/data controls
- Read `AGENTS.md`: user must explicitly approve commit/push; user request for this PLAN authorizes plan-doc writing, **not automatic code push/merge or unsafe data writes**.
- NEVER `reset --hard`, `clean -fd`, force push/rewrite main, destructively cherry-pick, discard uncommitted work, overwrite overlapping agents' files, auto-merge, or run database writes on Dev/production.
- Before coding inspect `git status --short`, `git diff`, `git diff --cached`, local branches and `origin/main`; check PR #29 local 11-file patch, PR #21/#23/#24/#25, Issue #22. GitHub view is not the same as uncommitted local workspace.
- Preserve old PR #29 as Draft until independently approved; M1 must be on an explicit, isolated integration worktree/branch if running in parallel. M1 Draft PR only when it reflects real code, correct base and user-approved push. Never quietly change PR #29 base or merge.
- No mass Markdown reports each micro step; report concise evidence at macro batch boundaries in chat, update exactly this plan/matrix at final if needed.
- If a hard blocker requires secrets, database permission or protected approval, stop only that unsafe action and complete independent tasks; never invent successful test results.

## 6. Authoritative Antigravity handoff
Read and obey:
- `docs/implementation/2026-11-20-ANTIGRAVITY-MASTER-EXECUTION-PROMPT.md` (latest detailed executable instructions)
- `AGENTS.md`
- Issue https://github.com/nguyen2234/ZhongWenHub/issues/27
- Coordination https://github.com/nguyen2234/ZhongWenHub/issues/22
- PR https://github.com/nguyen2234/ZhongWenHub/pull/29

**Status of this document: planning/audit only. No M1 FE/BE/SQL feature code has been implemented or executed by writing the plan.**