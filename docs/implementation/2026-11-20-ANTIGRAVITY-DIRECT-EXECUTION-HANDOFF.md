# ANTIGRAVITY — DIRECT EXECUTION HANDOFF (ZHONGWENHUB)
Updated: 2026-11-20. Repository: nguyen2234/ZhongWenHub.
Read first:
- https://github.com/nguyen2234/ZhongWenHub/issues/27
- docs/implementation/2026-11-20-FULLSTACK-FUNCTIONAL-RECOVERY-PLAN.md
- docs/implementation/2026-11-20-ANTIGRAVITY-MASTER-EXECUTION-PROMPT.md
- AGENTS.md and collaboration/database safety rules.
This handoff supplements—not replaces—the authoritative PLAN and MASTER PROMPT.

## IMMEDIATE EXECUTION ORDER — DO NOT RESET EXISTING WORK
1. Inspect current workspace git status, current branch, latest main HEAD, local staged/unstaged changes, active processes, test output, and any existing Phase P00 report or implementation. Preserve all work. Check whether P00 has already been coded locally, even if GitHub has no P00 PR/branch.
2. Inspect latest GitHub Actions, Issue #27, Issue #22, and open overlapping PRs #21/#23/#24/#25; identify what is merged versus merely proposed. Do not overwrite other agents' work, cherry-pick blindly, or reset/rebase with data loss.
3. FIRST finish **P00 CI and test reliability** (or verify its already completed local implementation). Fix workflow test runner invocation; investigate SMTP timeout deterministically; execute actual lint, typecheck, build, unit, backend integration and E2E where environment supports them. If checks cannot run, mark BLOCKED and provide reproduction commands, not PASS. No feature expansion before P00 acceptance.
4. Work on an isolated branch (or continue existing P00 branch), create a scoped DRAFT PR only after checking AGENTS.md and the user's commit/push approval. Never push to main, auto-merge, force-push, or merge without explicit user acceptance.
5. Report in chat the exact current phase, files changed, git SHA, command, test counts, log/run IDs, blockers and next ONE atomic action. Do not generate redundant Markdown reports after every minor action. If writing documents, update the already requested plan/matrix when appropriate.

## REQUIRED COMPLETE AUDIT (AFTER P00, AND UPDATED PER FEATURE)
Build an evidence-based matrix for EVERY ADMIN, SUPPORT, TEACHER, CONTENT_MANAGER and STUDENT route, menu, button, tab, dialog, search, filter, pagination, table, CRUD action, import/export and API operation:
UI element → event handler → FE service → HTTP method/path + request/response DTO → BE controller → authorization policy/resource owner → business service → EF entity/table/migration → test/run evidence.
Statuses: CONFIRMED_BROKEN, CONFIRMED_MOCK, API_WIRED_UNVERIFIED, VERIFIED_IN_CI, VERIFIED_E2E_SQL, NOT_IMPLEMENTED, UNVERIFIED. Never label VERIFIED_E2E_SQL from code inspection, screenshots or unit tests alone.
Scan production imports of MOCK_*, INITIAL_*, DEMO_*, Math.random, setTimeout fake requests, localStorage/arrays as CRUD stores, empty handler, silent catch, false success toast, hardcoded KPI, seeded examples and disabled buttons. Preserve valid test fixtures. Avoid scanning build/backup directories and historical giant datasets without reason.
Prioritize bugs with severity, user impact, exact file/line, repro steps, owner and verified test coverage. Do not mark a feature completed if just one of its buttons works.

## SEQUENTIAL FEATURE CONTRACTS
**F01 Auth**: Login required for all learning, teacher, content, support, admin, AI, profile and reporting workflows; allow only explicitly public landing/login/register/password recovery. FE route guard + BE authorization + per-resource ownership + session expiry/logout/cross-account cache purge; test direct deep links, 401, 403 and IDOR.
**F02 Support/Reports**: Every role can submit issue, attach safe evidence if supported, track “Báo cáo của tôi”, read staff responses and reopen as authorized; Support has actual SQL-backed inbox, assignment, statuses, replies, escalation, resolution; Admin can see all; Content Manager can resolve linked content issues. Persist message timeline, audit and unread state. No in-memory tickets, canned replies or cross-user leakage.
**F03 Admin CRUD/RBAC**: Real user/teacher/support/content manager CRUD, lifecycle, role grants, account lock/unlock, secure invite/reset, permission rules stored and enforced by BE; optimistic concurrency, validation, errors and audit. No static default passwords or local-only role editor.
**F04 Admin API control**: Provide internal OpenAPI/Swagger endpoint inventory (search, view owner/auth policy and status); separately manage allowlisted external providers/models: create/edit/disable, masked encrypted key refs, rotation, connection checks, rate limits/quotas, budget, usage/errors, safe routing and audit. “Add API” means register vetted external provider configuration, NOT arbitrary ASP.NET route creation, arbitrary HTTP execution, frontend secrets or SSRF.
**F05 Practice menu**: Clearly separate “Bài tập cơ bản” (approved published question bank, filters HSK/lesson/skill/level) and “Luyện điểm yếu với AI” (persisted student mistakes/accuracy/competency, spaced repetition, configurable recommendations). Distinguish teacher-assigned homework. Validate grading, retries, saved attempts, correct answers not leaked before submission, and no fabricated weak topics for new learners. Prefer reuse of real question bank and deterministic selection before expensive LLM calls.
**F06 Dashboard**: “Hôm nay nên ôn gì?” gives 1–3 actionable specific weak topics for signed-in student with real rationale and direct working practice links; update on attempts, show cold-start evaluation when no evidence, real date/user isolation, no DEMO_VIDEOS or synthetic KPI.
**F07 Teacher**: Real class and enrollment, schedules, attendance, assignment draft/create/edit/publish/close, question picker, submission, teacher grading, feedback, student result and dashboard refresh. Reconcile PR #21/#23/#24 first; correct client/server DTOs, double-start idempotency and false success on grading failures.
**F08 Content**: SQL-backed HSK course/unit/lesson/grammar/vocabulary/question/video/exam review, draft/publish/unpublish/versioning, moderation and content issue resolution with provenance/licensing and role-based approval. Do not publish AI text without review.
**F09 Missing menus**: Writing, listening, speaking, reading, learning games, progress/results, profile/settings, achievements, notifications and other actual navigable modules: each action real FE→BE→SQL or explicitly honest unavailable state; never a clickable fake.
**F10 UI**: Before FE edits read and use Fontend/.agents/skills/ui-ux/SKILL.md (evondevKit /ui-ux). Keep existing StudentLayout/ManagementLayout; minimalist human-designed Vietnamese UI, calm typography, clear navigation, no excessive cards/glow/gradient/glass, accessible controls; visual QA at 360/768/1440. No cosmetic rewrite that breaks functional flows.

## NONNEGOTIABLE DATA/SECURITY CONDITIONS
- Architecture of current repo is authoritative; confirm actual SDK and package versions, do not invent paths (folder is `Fontend/`). Reuse existing endpoints, controllers, entities, services and FE components before creating new ones; avoid duplicate files/services.
- ZhongWenHub_Dev is READ-ONLY. No migrations, writes, seeding, resets or destructive commands against Dev/Prod. Only approved disposable SQL test database with database-name safety guard; record persistence across reload/backend restart and rollback checks.
- Protect secrets and PII; no raw API keys in FE/response/SQL plaintext/log/PR. Server-enforce RBAC + entity-level authorization. Handle 401/403/404/409/429/5xx, validation, network failures without hiding them or showing fake success.
- Use OpenAPI and typed contracts; tests must cover DTO compatibility and all consumers. If dependent PRs conflict, document ownership in Issue #22 before edits.
- No claims of 100% operational without real browser/API/SQL runs; skipped E2E is BLOCKED, not PASS.

## ONE FEATURE = ONE ACCEPTANCE GATE
For each separately usable vertical feature, use one branch and one DRAFT PR into up-to-date main; include FE interaction, BE business logic, SQL persistence/migration where necessary, RBAC, migration safety and unit/integration/E2E tests. Check negative paths and persistence across reload/restart. Include concrete test command, exit code, passing/failing/skipped counts, screenshots and sanitized DB assertions. Obtain independent review AND explicit owner acceptance BEFORE any merge. If incomplete, keep PR draft; do not bulk merge or move to next phase.
Suggested order: P00 → F01 → F02 → F03 → F04 → F05 → F06 → F07 → F08 → F09; F10 accompanies each feature.

## YOUR NEXT RESPONSE TO THE USER (DO THIS FIRST)
Give: (1) local git current branch and main SHA; (2) whether P00 code already exists locally and exactly what it changed; (3) current GitHub Actions status; (4) exact failures and test evidence; (5) only the next safe implementation step. Then execute/finish P00 if safe. Do NOT respond by merely rewriting this plan or asking for the prompt again. Do not commit/push without user's approval per AGENTS.md; if ready, provide diff and draft PR instructions.
