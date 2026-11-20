# ZhongWenHub — FULLSTACK FUNCTIONAL RECOVERY PLAN
**Date:** 2026-11-20 (Asia/Bangkok)  
**Baseline:** main @ 4bc89de4beaa668627c8c7f94b2cc210be92abb2  
**Target:** React/TypeScript (Fontend), ASP.NET Core .NET 10 (Backend), EF Core + SQL Server, existing HSK content/AI stack.  
**Execution agent:** Antigravity. **Planning/audit only in this branch; no production feature has been implemented or accepted by this document.**

## 0. Audit scope, facts, limitations
Static audit of GitHub default branch file tree (1,965 blob entries), selected FE routes/services/UI, BE controllers, existing audits, PRs and live GitHub Actions logs. **This is not a claim that every source line or UI button was executed.** Treat remaining uninspected controls as UNVERIFIED, not PASS. No local SQL Server, .NET SDK, Bun runtime or real browser was available for execution during this review. Existing docs/audits from feature branches may predate PR #26; verify main HEAD before implementation.

Confirmed evidence:
1. **main CI is RED:** Backend GitHub Actions run 44652481981: build passes, 327/328 unit tests pass, SMTP sandbox socket test times out. Frontend deploy run 44652481962: lint passes with 162 warnings, test step fails with "Cannot use describe outside of the test runner", build/deploy skipped. Workflow .github/workflows/deploy.yml wrongly uses "bun run src/tests/..." for several test files instead of "bun test ...". Correct the test invocation; then rerun full suite and investigate any remaining failures. Run logs are more current than PR #26's previously recorded green tests.
2. **Support Ticket is MEMORY ONLY:** Fontend/src/management/support/services/support-ticket.service.ts creates INITIAL_TICKETS and modifies in-memory this.tickets, shared by SupportDashboardPage and AdminSupportRequestsView. No dedicated Support Ticket Controller/Entity was found in the current Backend API/Entities inventory.
3. **Content Issues + Moderation + Audit are MEMORY ONLY:** content-issues.service.ts, content-moderation.service.ts, content-audit.service.ts use mockContentManagerData and in-memory arrays. Changes cannot be considered persisted SQL CRUD.
4. **Role permission editor is not persisted RBAC:** role-permission.service.ts provides INITIAL_ROLES, local updateRolePermissions; BE AdminUsersController supports user roles and role description but no confirmed persistent role-permission matrix CRUD. FE permissions must not define BE authorization.
5. **AI API controls partial:** AdminAIManagementView initializes predefined INITIAL_AI_SERVICES and local quotaThreshold slider. AdminOperationsController supplies GET ai-stats/analytics/settings and PUT settings but no verified safe provider credential CRUD, endpoint inventory, budget/quotas or dynamic routing policy.
6. **Student Dashboard demo leak:** DashboardPage.tsx imports DEMO_VIDEOS and renders demo video cards and demo text, even though video library uses real API. Remove demo surfaces in production.
7. **Other visible mocks:** SkillWritingPage uses MOCK_WRITING_EXERCISES; LearningGamesPage has INITIAL_PAIRS; LearningResultsPage maps MOCK_RESULTS; some video admin service still contains INITIAL_VIDEOS and mixed real/in-memory methods; grammar/exercise repository abstraction supports explicit useMock, which is only acceptable in isolated test/dev fixtures.
8. **Existing real assets to REUSE, not rewrite blindly:** QuestionBankController has authenticated recommendations, practice sessions, submission, history and report endpoints; TeacherAssignmentsController and StudentHomeworkController have teacher/student assignment lifecycle endpoints; AdminUsersController implements user CRUD/role assignment; TeacherClassesController includes student-scoped enrolled class API; AI competence/recommendation and learning-path engines exist. These are API-WIRED, not automatically end-to-end accepted.
9. **Auth gap at FE routing:** management.routes.tsx uses ManagementRouteGuard, but student.routes.tsx exports learning/work routes in StudentLayout without a route-level authentication guard. StudentLayout has guest/auth UI; user wants account-required learning. Preserve explicitly public Login/Register/Forgot/Reset routes and configure public landing only if needed. BE [Authorize] remains source of truth.
10. **main branch currently unprotected** by GitHub branch metadata. Recommend enabling GitHub branch protections and required review/checks before accepting feature merges; no auto-merge.

Current PR coordination: merged #26 on main; open #21 (Teacher lifecycle), #23 (FE wiring), #24 (PR #23 fix), #25 (Video), plus older PRs with different bases. Audit their changed-file lists before touching overlapping paths. Link project work to existing issue #22, avoid blind cherry-picks or overwriting current main.

**Status taxonomy:** CONFIRMED_MOCK, CONFIRMED_BROKEN, API_WIRED_UNVERIFIED, VERIFIED_IN_CI, NOT_IMPLEMENTED, UNVERIFIED. Every functional row must show route/menu/button → FE handler → service → HTTP method/path → BE action → authorization → business service → EF entity/table → test evidence → status/owner/priority.

## 1. Mandatory non-negotiable engineering rules
- **One vertical user-visible feature at a time.** Every feature has its own feature/* branch forked from up-to-date main, one scoped PR to main, dedicated SQL migration when needed, FE/BE/tests and a QA acceptance record. Do not merge incomplete functionality. Do not describe static wiring, mocks, unit-only runs or UI screenshots as full E2E.
- No automatic merges, no force push, no direct commits to main. Do not merge when CI is red, migrations fail, RBAC leaks, persistence is unverified or QA evidence missing. Independent review + user acceptance gate; mark READY only after proof. Cross-cutting shared changes require file ownership and coordination via issue #22.
- No fake production: no INITIAL_*, MOCK_*, hardcoded users, synthetic metrics, demo content, timeouts simulating calls, local-only CRUD, fake success toasts. Fixtures remain only under tests/fixtures or explicit isolated test mode. No offline fallback that silently pretends durable DB writes.
- BE authorization derives from authenticated identity and database permissions; enforce 401, 403, scoped resources, anti-IDOR, bounded pagination, optimistic concurrency where needed, server-side validation, audit logging. FE controls only improve UX, never security.
- Database safety: **ZhongWenHub_Dev is strictly read-only; no migrations/writes/reset/seeding there.** Only isolated ZhongWenHub_Test or a newly created disposable named test DB is writable, checked by DB_NAME()/DatabaseSafetyGuard; no destructive operations beyond allowlisted isolated DB; keep rollback proof. Do not put secrets, PII dumps, access tokens or credential values in repo, logs or PR.
- Keep .NET 10 / current React architecture, paths **Fontend/** (intentional spelling), existing UI tokens and layout. Use already installed evondevKit skill at Fontend/.agents/skills/ui-ux/SKILL.md via /ui-ux for wireframe/implementation; minimalist Vietnamese interface, simple forms/navigation, familiar spacing/typography, low decoration, mobile/desktop accessibility; avoid generic AI gradients/glassmorphism/overdraw.
- Handle no-data, loading, 401/403/404/409/429/5xx and retry explicitly. Never suppress failures with empty arrays/default fake objects. Do not introduce unrelated dependencies or duplicate services.
- Before modifications: capture baseline SHA, git status, current CI result, pending PR conflicts, DB target, migration plan, route/API inventory and regression tests.

## 2. Delivery roadmap and vertical-slice acceptance order
### P00 — Make main independently testable (P0 blocking)
Scope: .github/workflows/deploy.yml, backend-tests.yml, flakey SMTP sandbox test or reliable stub/test isolation, baseline audit matrix.
- Fix Bun test invocations, run targeted + complete suite, compile build, retry Actions. Diagnose SMTP sandbox timeout robustly (bounded time, deterministic socket handshake; choose test-safe in-process SMTP server or move flaky network test to explicitly marked integration with bounded timeout; **do not disable security behavior**).
- Verify SQL integration CI is genuinely executed in disposable DB or clearly marked QA_BLOCKED, not reported as PASS from skipped jobs.
- Acceptance: all mandatory Actions checks green; compile/test logs and run IDs recorded; no unexamined skipped critical checks; lock in CI status prior to features.

### F01 — Auth-first learning and staff access (P0)
Routes: all student work routes incl. focus lesson, practice, homework, AI, achievements, dashboards, class, profile/settings and management portals.
- Add central authenticated route guard to protected student subtree and standalone focus routes; keep Login/Register/Forgot/Reset reachable, optional public landing only with no learning operations. Preserve returnTo state and real account-based navigation. Correct hydration/loading after refresh, expired token, logout and cross-user cache purge.
- Backend audit [Authorize] on every data-mutating and user-scoped API. Test anonymous 401, wrong-role 403, user A vs B and direct deep links. Avoid 302-to-login in JSON endpoints.
- Acceptance: anonymous cannot use any learning feature or access another user's data by direct URL/API; authenticated route/back navigation behaves consistently.

### F02 — Support reports/tickets across ALL roles (P0)
Independent complete function: Student/Teacher/Content Manager/Admin can submit report; Support can triage/respond/assign/escalate; reporter can view own tickets and conversation; Admin sees all; Content Manager can resolve linked learning-material issue.
- Propose SQL entities SupportTicket, SupportTicketMessage, SupportTicketEvent, SupportTicketAttachmentMetadata, ContentIssueLink (reuse existing entity if found), assigned staff, actorId/role, module/sourceEntityId, type, priority, status, timestamps, rowversion; lifecycle NEW→TRIAGED→IN_PROGRESS→WAITING_REPORTER→RESOLVED→CLOSED / REOPENED with explicit guards. Restrict content issue transitions to authorized staff.
- Proposed API, not existing: POST/GET /api/v1/reports; GET /reports/{id}, POST /reports/{id}/messages, POST /reports/{id}/attachments (safe), GET /api/v1/support/tickets, PATCH /support/tickets/{id}, POST /support/tickets/{id}/assign, /escalate, /resolve, /reopen; GET admin support overview; content issue linkage endpoints. First check for existing endpoints and reuse contracts.
- FE add reusable Report Issue modal accessible on every role, My Reports list/detail, real Support inbox/filter/search, admin cross-role overview, content issue queue and reply/timeline. Implement real unread counts and optional notifications; no fake canned staff or CSV demo labels.
- Tests: create→persist→reload/restart→Support reply→reporter sees reply→escalate→Content resolves→Support closes; tenant/role isolation, attachment security, concurrency/idempotency and audit tests.

### F03 — Persistent role permissions + Admin/Staff CRUD (P1)
- Reuse existing AdminUsers CRUD. Add persistent RolePermission/PermissionGrant matrix with DB migration only if lacking; server-side policy/requirement handler reads authoritative grants; fine-grained permissions cannot override immutable Admin safety rules. Separate user role assignment from role permission catalogue. Support/Teacher status, specialty/availability and performance fields must be backed by real records, not client arrays.
- FE Admin Users/Teachers/Support Staff/Roles list/detail/create/edit/soft-delete/lock/unlock/assign role and permission grant; all operations return server DTO with optimistic updates only after success. Remove hardcoded generated passwords (current support-staff service contains a static default password), use secure invitation/one-time setup flow or server-generated one-time credentials never logged.
- Tests cover CRUD roundtrip DB, user A role revoked immediately (security stamp/JWT checks), admin protected from self-lockout, invalid fields, duplicate email, audit trail, pagination.

### F04 — Admin API & AI provider control plane (P1)
**Interpretation:** Admin manages configured **external AI/API providers, credentials, model routing, quotas and an internal API endpoint catalogue**, not arbitrary creation of ASP.NET routes at runtime. Arbitrary URL/API execution is disallowed (SSRF/security).
- Proposed models: ApiProvider, ApiProviderConfiguration, CredentialSecretReference (value encrypted using supported vault/Data Protection at rest), ModelRoutePolicy, ApiUsageRecord, QuotaPolicy, AuditLog. Predefined allowlisted provider adapters; configurable vetted base URLs only, URL validation, secret redaction. Endpoint catalogue auto-generated from OpenAPI/Swagger (method/path/policy/status/owner) and searchable by Admin; not editable into executable controllers.
- Admin UI: list/add/edit/disable provider, configure model, set masked credential and rotate/revoke, connectivity test server-side with timeout/rate limiting, default/fallback policy, quota and budget, usage/error/latency monitoring with truthful no-data state and logs. No client-side token/key exposure, unbounded provider calls or synthetic uptime.
- Tests: credential never returned in GET/log, reject unsafe URLs, RBAC Admin only, rotation/disable immediately enforced, quotas/failover, restart persistence, negative API tests.

### F05 — Practice: Basic vs AI-personalized (P1)
- Preserve existing QuestionBankController endpoints and backend question grading. Add explicit Basic Practice and My Weak Points (AI/adaptive) tabs / cards, HSK/skill/type/difficulty filters, published-question-only checks, resume/submit/history; no answer key disclosure before submit.
- Basic: deterministic selection from approved published question bank by level/skill/lesson. Adaptive: derive last-N attempts, accuracy, mistake recurrence, spaced repetition and competencies from DB; prioritize weaknesses while maintaining mixed review (e.g. configurable 60–70% weak, remainder spaced/new), explain recommendation reason, level and provenance. Cold-start uses assessed basic placement, NEVER invents weaknesses.
- Test role and user isolation, weighted selection rules, depletion/empty question bank, anti-repeat, multiple submissions, concurrent submissions, saved real attempts and before/after improvement. Avoid calling an external LLM for every question if rule-based adaptive selection of approved bank suffices.

### F06 — Student Dashboard: TODAY weakness recommendation (P1)
- A personalized card "Hôm nay nên ôn gì?" grounded in current student's DB error evidence with 1–3 prioritized items, accuracy/evidence/reason, estimated time, one-click deep-link into specific weak practice mode. Acknowledge no-data/new user explicitly with initial placement suggestion; recommend next lesson and due SRS using real data.
- Existing DashboardPage has a weakKnowledge reference yet hardcoded suggestion copy and DEMO_VIDEOS; remove static defaults and demo tiles. Fetch through existing recommendation/competency endpoints or a new tightly scoped GET /api/v1/me/today-recommendations. Cache by user/date with invalidation after submissions.
- Test two users with disjoint mistakes, new user, repeated login, timezone day rollover (user timezone), completed recommendation and API failure.

### F07 — Teacher classes, attendance, assignments, student homework (P1)
- First reconcile existing PR #21/#23/#24 and current BE APIs. Reuse TeacherClassesController, TeacherAssignmentsController, StudentHomeworkController and existing related SQL entities.
- Validate Teacher dashboard data, classroom CRUD, schedules, membership, attendance history, assignments (draft/edit/question picker/target/publish/close), student list/detail/start/draft/submit/result, teacher grading/feedback, reporting; owner checks and class membership, no direct ID spoofing; durable submission/grade with idempotency.
- Delete mock fallback from **production path** only after verification; keep isolated test fixtures. Typed DTO contracts and E2E must not silently convert API errors to [] / fake success.
- E2E: Admin creates Teacher + Student → Teacher creates class → Student enrolled → Teacher publishes assignment to class → Student submits → Teacher grades → student receives real result → dashboard updates → reload/BE restart persists.

### F08 — Content Manager complete live workflow (P1/P2)
- Content CRUD for HSK course/unit/lesson/grammar/vocab/character/question/exam/video already has substantial BE; audit all FE buttons, publish/review/rollback/import approval. Replace separate fake content moderation, issue, audit history and quality metrics services with persisted BE + SQL queries and immutable audit.
- Ensure draft/review/publish requires gates incl. academic approval where configured; data source and content license; avoid fake published video or lesson stats. Error/empty states explicit.
- Test create/edit/review/publish/unpublish/restore versions, cross-role permissions, SQL persistence, student visibility after publication, rollback and content integrity.

### F09 — Remaining learner menu & mock elimination (P2)
- Writing, learning games, result summaries, achievements, leaderboard, grammar fallback, video dashboard, practice UI and any unused buttons. For each build one honest complete FE→BE→SQL vertical slice; derive gamification/metrics from actual learning events. If no source/content yet, show clearly unavailable/no-content instead of fake cards. Move demo data to tests/fixtures and remove production imports; keep explicitly allowed demo examples only behind isolated fixtures.
- Inventory scan must additionally include Profile/Settings, AI Tutor live & grading, subscriptions/wallet, notifications, import/export, admin analytics, report viewing, teacher AI tools, all menu entries and disabled controls.

### F10 — Consistent minimalist interface (progressively per feature)
- Invoke repository-installed evondevKit /ui-ux skill and read skill rules, project tokens and existing design system. Build concise wireframe(s) and implement simple visual consistency, not a site-wide speculative rewrite. Keep forms understandable, hierarchy intuitive, color neutral with restrained accents, no "AI-like" gradients/glows/glass, accessible Vietnamese labels, meaningful feedback, responsive layout 360/768/1440 and keyboard/tab flow.
- Include before/after images and Playwright accessibility/responsive snapshots in each feature PR. No unrelated design overhaul until underlying feature works.

## 3. Suggested API/data contract baseline
Existing routes to verify before introducing new ones:
- POST /api/v1/question-bank/practice-sessions; GET /api/v1/question-bank/recommendations and /practice-history; POST /api/v1/question-bank/practice-sessions/{id}/submit.
- Teacher assignment GET/POST/PUT/DELETE, publish/close, submissions and grading under /api/v1/teacher/*.
- Student homework under /api/v1/student/homework* (confirm exact Controller paths).
- Admin user CRUD /api/v1/admin/users plus roles/description; operations ai-stats, analytics, settings.
For all **proposed** endpoints, create/update OpenAPI contract before FE wiring; typed request/response, validation, error ProblemDetails, JWT Bearer, required policy, migration, Swagger examples, tests. Prefer using TypeScript client codegen if it fits the existing project (avoid breaking imports).

## 4. Per-feature definition of done (must meet ALL)
1. Single feature scope traceable to this plan, baseline SHA, issue and draft PR; no unresolved collisions with open PRs.
2. Real migrations applied to allowlisted isolated SQL test DB; rollback safety and persistence on restart demonstrated. Protected DB zero writes.
3. FE user interaction fully mapped through API auth → domain/business service → EF SQL → reloaded UI; no production mock, default fixtures, false success messages or local-only state as source of truth.
4. Core path plus negative-path tests: 401, 403, 404, validation, 409, 500, network outage, wrong user ID, concurrency/idempotency, secret hygiene as applicable.
5. dotnet build, full backend unit/integration, frontend oxlint, tsc + Vite build, Bun unit, Playwright E2E in 360/768/1440 all with actual command/exit code/test counts; do not report tests as passed when skipped/not run.
6. Human-readable QA record: screenshots (sanitized), API req/res samples (masked), DB row assertions, source-path/line evidence, open issues, rollback. Independent review and explicit user acceptance.
7. Merge only this **finished feature PR** into main after required checks green, reviewer approval and user acceptance; rebase cleanly, verify main CI post-merge. If any gate FAILS: keep PR draft, fix, rerun. No automatic bulk merge at end.

## 5. GitHub execution organization
- Keep this PLAN and companion Antigravity prompt on planning branch; **do not merge the planning branch merely to claim function acceptance**.
- Master tracking issue and issue #22 coordinate ownership; create child issues F01–F10 only when executing/assigning. One PR per complete feature, base main, squash after acceptance. Project board columns: Backlog → Auditing → Implementing → Testing → Independent QA → User Acceptance → Merged.
- Include GitHub Actions check names as required branch protections; current main is not protected, repository admin must enable protection/ruleset requiring checks and review. No direct push to main.
- Order: P00 first; then F01, F02, F03, F04, F05, F06, F07, F08, F09; F10 accompanies each feature. Parallel work only on non-overlapping files/migrations, coordinated via issue #22.
- If the user changes scope, update this plan and the tracker, don't improvise silent extra modules.

## 6. Evidence URLs
- Main: https://github.com/nguyen2234/ZhongWenHub/tree/main
- Main backend CI failure: https://github.com/nguyen2234/ZhongWenHub/actions/runs/44652481981
- Main frontend deploy failure: https://github.com/nguyen2234/ZhongWenHub/actions/runs/44652481962
- PR #26 merged: https://github.com/nguyen2234/ZhongWenHub/pull/26
- Existing coordination: https://github.com/nguyen2234/ZhongWenHub/issues/22
- Existing historical inventory: docs/audits/FULL_SYSTEM_FUNCTIONAL_INVENTORY.md (baseline from other branches; reverify).
