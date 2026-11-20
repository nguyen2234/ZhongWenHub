# ANTIGRAVITY — MASTER EXECUTION PROMPT: BIG PHASE M1
**Version:** 2026-11-20 M1. **Repository:** nguyen2234/ZhongWenHub. **Primary plan:** docs/implementation/2026-11-20-M1-FULLSTACK-RECOVERY-PLAN.md. **Do not use the historical P00-first handoff as an execution command.**

## SYSTEM ROLE & USER ORDER
Bạn là **ANTIGRAVITY / autonomous Senior Full-Stack Engineer + Backend/SQL Integrator + QA Security Reviewer**. Người dùng yêu cầu làm **NHANH THEO MỘT PHASE LỚN**, hoàn thành CHỨC NĂNG THẬT theo FE → BE → SQL, KHÔNG vá một nút rồi hỏi tiếp, KHÔNG tạo một loạt báo cáo hay PR lặt vặt. Chủ động đọc Git, khám phá code, viết code, chạy test, tự sửa regression, tiếp tục các nhóm việc còn lại trong M1. Cần đọc `AGENTS.md`; quy định an toàn và phê duyệt vẫn áp dụng.

### Product result REQUIRED
Hoàn thiện website tiếng Trung với 5 role STUDENT / TEACHER / CONTENT_MANAGER / SUPPORT / ADMIN, chức năng hoạt động có dữ liệu thật:
1. Mọi chức năng yêu cầu login; bảo vệ route+API, RBAC, IDOR, logout/refresh và **không còn danh tính demo/mocked token production**.
2. **Báo cáo sự cố ở mọi role**, "Báo cáo của tôi", Support inbox xử lý/tư vấn/trả lời/assign/escalate/resolve, Admin tổng quan, Content xử lý báo cáo lỗi học liệu, tất cả SQL.
3. **Admin thật:** User/Teacher/Support/Content CRUD, trạng thái, role/permission grant, API inventory Swagger, thêm/quản lý cấu hình external AI API/providers/models/quota/budget/secret/health/usage/audit (không tạo endpoint server động từ web).
4. **Student luyện tập:** tách "Bài tập cơ bản" và "Luyện điểm yếu với AI", bài AI dựa trên sai sót và năng lực của đúng user, lưu SQL; Dashboard "Hôm nay nên ôn gì?" gợi ý điểm yếu riêng ngày hôm nay và deep links vào bài học/bài tập.
5. **Teacher thật:** lớp, học viên, lịch, điểm danh, tạo/giao/đóng/chấm/nhận xét bài tập, Student làm/nộp/xem kết quả, data SQL.
6. **Content Manager thật:** HSK course/unit/lesson, grammar, vocab/hanzi, question bank/exam/video, moderation/review/publish/versioning/audit/linked reports.
7. Tất cả menu Student/Admin/Teacher/Support/Content không mock, không fake toast, không danh sách giả; đặc biệt writing, reading, speaking, listening, video, game, results, AI Tutor, progress, notifications, profile/settings, achievement nếu đã hiển thị. Nếu chức năng thiếu tài nguyên hợp lệ, UI trung thực "chưa có" và không cho bấm giả.
8. Đồng bộ giao diện minimalist theo hệ thống, dùng UI skill có sẵn; không tái thiết kế tách khỏi logic.

## A. BẮT ĐẦU TỰ ĐỘNG — GIT FIRST, KHÔNG HỎI LẠI
Thực thi ngay trong workspace terminal:
~~~bash
pwd
git remote -v
git status --short --branch
git branch --show-current
git diff --name-status
git diff --cached --name-status
git branch -vv
git fetch origin --prune
git log -1 --format="%H %s" origin/main
git log --oneline --decorate -n 15
git diff --stat origin/main...HEAD
~~~
Đối chiếu trực tiếp GitHub PR #29, #21, #23, #24, #25; Issue #22/#27; đọc `AGENTS.md`, plan M1, current master prompt và source control. Nếu `gh` có sẵn dùng `gh pr view 29` / `gh pr list`; nếu không, sử dụng API GitHub/connectors/remote metadata mà môi trường thực sự hỗ trợ. ĐỪNG nói là đã xem GitHub nếu chỉ đọc file local.

**STOP destructive operations:** có local uncommitted files thì GIỮ NGUYÊN, xác định ownership, chụp git diff/status, không reset/clean/rebase/cherry-pick mù. F01 Draft PR #29 có bản vá 11 file chưa push được báo cáo trước đó: phải kiểm tra tồn tại thực tế, không giả định. Không sửa trên main. Dùng worktree/branch integration M1 riêng khi cần, giữ patch an toàn. Nếu một file trùng agent khác thì ghi owner trên Issue #22 và chỉ một agent được sửa.

**Baseline:** P00 PR #28 đã merge; main từng ở `f96da34877c4695bd08b505ffbfa09670282b17f`. F01 PR #29 remote `fde4c6c5a5ab3cadf42512ac590589d7fcdabe32`, Draft. SHAs chỉ là chứng cứ lịch sử, phải re-fetch current trước mọi thao tác.

## B. QUÉT CODEBASE CÓ KIỂM SOÁT + LẬP MA TRẬN TRONG CHAT
Mã nguồn tập trung tại `Fontend/src`, `Backend/src`, `Fontend/e2e`, `Backend/tests`, `Backend/src/Data/Persistence`. KHÔNG quét `node_modules`/`dist`/`obj`/`bin`/`backups`/dataset HSK lịch sử khổng lồ, theo AGENTS.md.

Các lệnh kiểm toán gợi ý:
~~~bash
rg --files Fontend/src Backend/src | sort
rg -n "MOCK_|INITIAL_|DEMO_|DEFAULT_DEMO_STUDENT_ID|usr-st-01|useMock|localStorage|Math.random|setTimeout" Fontend/src Backend/src
rg -n "AllowAnonymous|Authorize|HttpGet|HttpPost|HttpPut|HttpPatch|HttpDelete" Backend/src/Api/Controllers
rg -n "onClick|onSubmit|disabled|TODO|FIXME|catch[[:space:]]*\\{" Fontend/src/app Fontend/src/features Fontend/src/management
~~~
Nếu không có `rg`, dùng lệnh tìm kiếm khả dụng. Đọc các route `Fontend/src/app/router/{AppRouter,auth.routes,student.routes,management.routes}.tsx`, menu layouts, handlers/services, API HTTP client, Swagger, controllers, Business layer, EF entities/migrations, DI/policies, các test hiện có. Truy vết từng menu, nút, CRUD, báo cáo, filter/search/pagination, import/export, modal/tabs, không chỉ kiểm tra route tồn tại.

**Ma trận bắt buộc:** Role | Page/route | Action/button | FE handler/service | HTTP method+path+DTO | BE Controller/service | authorization/owner | SQL table/migration | test/runtime evidence | status | severity. Trạng thái chuẩn: CONFIRMED_MOCK, CONFIRMED_BROKEN, API_PRESENT_UNVERIFIED, NOT_IMPLEMENTED, VERIFIED_UNIT, VERIFIED_API_SQL, VERIFIED_BROWSER_SQL, BLOCKED. Trả bảng tổng hợp trong chat và phát triển code ngay; đừng chỉ liệt kê TODO.

**Đã tìm thấy để ưu tiên:** Support `support-ticket.service.ts` in-memory; Content issues/moderation/audit in-memory; Role permission `INITIAL_ROLES`; Admin AI Management `INITIAL_AI_SERVICES`; Dashboard `DEMO_VIDEOS`; PracticeCenter imports mock recommendations/attempt pool but real question-bank API; Writing `MOCK_WRITING_EXERCISES`, Games `INITIAL_PAIRS`, Results `MOCK_RESULTS`. Backend existing AdminUsersController, QuestionBankController, AILearningEngineController, TeacherClassesController, TeacherAssignmentsController, StudentHomeworkController, ContentController, VideosController, ExamsController; reuse before building duplicate. Swagger already configured in Program.cs.

## C. M1 TRIỂN KHAI THEO 4 BATCH LỚN, TỰ CHẠY LIỀN MẠCH
Không chia 1 task = 1 nút = 1 PR. **Một chức năng được tính DONE chỉ sau toàn bộ FE-BE-SQL và tests**, nhưng tiếp tục sang workstream độc lập trong cùng macro batch mà không yêu cầu "tiếp tục" liên tục.

**BATCH 1 — Auth + shared contracts + SQL safety (W0):**
- Đọc và hoàn tất local P0 patch F01 / PR #29, không ghi đè thay đổi chưa push. `student-identity.adapter.ts` trả null khi không có phiên hợp lệ, không tin localStorage. `LearningStateContext` không `switchStudent(studentId || 'usr-st-01')`. `LearningStateService` không khởi tạo dữ liệu demo, không lưu tiến trình khi guest. Ngăn async A→B stale result cho `syncWithServer`, `completeLesson`, `recordPracticeSession` và các callback tương tự bằng session epoch/captured identity; test delayed response.
- Production `defaultApiConfig.useMock=false` kể cả khi env sai; `authService` không suy luận admin role từ email hoặc cấp mock token, production Google/login/register/reset qua BE/explicit not configured. BE luôn enforce RBAC/IDOR; auth hydration, logout/refresh failure và cache isolation.
- Xác minh JWT bearer policy, Swagger, CSRF where cookie, DTO contracts, startup migration guard và DB_NAME. SQL Test only. Không tự merge PR #29.
- Chuẩn hóa shared errors, DTO typed clients, API contracts. Thêm regression tests.

**BATCH 2 — Admin + Support + Content interaction (W1/W2/W3):**
- Thiết kế **một bộ SQL ticket/report models** và migration an toàn; endpoints reporter create/list own/detail/message/reopen; staff Support inbox/filter/assign/notes/resolve/escalate; Content linked issues; Admin full monitoring. Entity row ownership from authenticated claims, audit timestamps, status transitions, concurrency, safe attachments/limits or explicit unsupported. FE menus and report buttons ở cả 5 role cùng hoạt động, refresh/restart persists.
- Admin Staff/User CRUD/roles: reuse real AdminUsersController; đồng bộ service+forms, nhân sự/cấp quyền/khóa/mở; hoàn thiện Backend persisted role permissions and authorization. Chưa cập nhật DB quyền thì đừng render fake success.
- Admin "Quản lý API": map internal OpenAPI endpoint list read-only/search/filter. External provider/model registry CRUD + encrypted references/secret masking, allowlisted origins, prevent SSRF, test connection, enable/disable, budgets/usage/health/errors + audit. Integrate runtime provider router; avoid only UI-side state.
- Content Manager issue linked workflow from ticket integrated; additional CMS tasks in Batch 4.

**BATCH 3 — Teacher + Student Basic/Adaptive + Dashboard (W4/W5):**
- Reconcile open #21/#23/#24/#25 and origin/main before changing overlap; never assume code in unmerged PR already exists on main. Reuse existing class/assignment/submission/grade BE and video service.
- Teacher class creation, enrollment, teacher roles, attendance, assignment create/edit/publish/close, question picker, deadline, submissions and grading; Student homework list/start/submit/result; Admin overview; refresh/restart SQL persists.
- Practice menu explicitly separates Basic (approved published questions + HSK/skill/lesson/format/difficulty filters) from adaptive AI weak-topic practice (verified attempts, competency, SRS and error evidence). No synthetic recommendations, answer leaks, fake exercise pools or fake point gains.
- Dashboard "Hôm nay nên ôn gì?" 1–3 live personal weak areas with reason+one-click exercise/lesson; correct cold start if new user, remove DEMO_VIDEOS and fake metrics. Ensure results reflect submitted/graded events. AI unavailable -> truthful state or safe deterministic use of real questions, no fabricated AI result.

**BATCH 4 — Full HSK Content + remaining menus + unified UX (W6/W7/W8):**
- Content Manager real CRUD HSK course/units/lessons/grammar/vocab/hanzi/questions/exams/videos; moderation, review, approved publish, audit/version restore, linked ticket resolution and source/licensing. Published-only student visibility.
- Complete or honestly disable all navigable menus of all roles: writing, reading, listening, speaking, games, SRS, exam, AI Tutor/conversations/grading, profile/settings, progress/results/leaderboard/achievements, notification, analytics, support access, content import/export.
- No fake success toast, mock data in production, invisible broken API; real empty/loading/error/403/404 states. Use `Fontend/.agents/skills/ui-ux/SKILL.md` and its direct build/keep-brand path for owner's "dựng luôn" order; keep existing layout and tokens, 360/768/1440 accessibility. No gratuitous gradients, glass or duplicate components.

**BATCH 5 — ONE INTEGRATED E2E/QA/REPAIR LOOP:**
- All role workflows browser+HTTP+SQL, persistence across reload and Backend restart, cross-account data isolation, migrations/rollback, HTTP negative tests, rate limiting, secrets, idempotency, concurrent writes, visual responsive screenshots.
- For failures: read precise logs → reproduce → locate source → fix root cause → add regression test → rerun targeted tests → full suite. Repeat within the current batch without requesting another instruction for each failure. Never turn failed tests into fake passes or delete them just to make CI green.
- Report one macro-phase QA matrix after integrated work; one planned integration Draft PR for M1 only when changes are correctly rebased and user has authorized commit/push. Preserve PR #29 independently until user approves resolution. Request explicit owner approval before merge. No auto merge.

## D. AGENT DISTRIBUTION TO BE FAST, NOT CHAOTIC
If 2–3 Antigravity agents available: A = auth/QA/integration/route ownership; B = ASP.NET/EF migrations/contracts; C = React wiring/UI/tests. Record exclusive file ownership in Issue #22. ONE owner of shared AuthContext, common DTOs, DI/routes; others propose patches instead of overwriting. SQL schema migrations serial, separate test DB per worker or single serialized SQL tests. Integrator reviews all work and merges safely only within feature/integration branch after checking status/sha and conflicts. No massive auto-generated duplicate files.

## E. NON-NEGOTIABLE SAFETY
- `ZhongWenHub_Dev` STRICT READ-ONLY. Never write/migrate/reset/seed/drop any dev/prod DB. Only approved `ZhongWenHub_Test` or explicitly disposable per-worker test DB with DB_NAME() fail-closed guard; verify runtime environment and connection before write. COUNT/MAX users alone cannot prove whole-DB Zero Write.
- No secrets/PII in repository, logs, request dumps, screenshots or JS. Use backend secret store/encryption, masked responses. No unrestricted arbitrary external URLs/API registration, key leaks or cross-user data.
- No direct main push, force push, hard reset, clean, mass revert, overwriting uncommitted local edits, auto-merge. `AGENTS.md` requires USER EXPLICIT APPROVAL BEFORE COMMIT/PUSH. User asks for this prompt/plan to be written but that is not blanket authorization to push app code.
- If no local server/SQL/browser supported, report that E2E is BLOCKED; do not call PASS. Do not fabricate "100% completed". If schema or dependency requires approval, continue independent code and report one clear blocker at macro boundary.

## F. CHECKPOINT COMMANDS — USE ACTUAL PROJECT SCRIPTS
~~~bash
dotnet restore Backend/ZhongWenHub.sln
dotnet build Backend/ZhongWenHub.sln -c Release
dotnet test Backend/tests/ZhongWenHub.UnitTests/ZhongWenHub.UnitTests.csproj -c Release
dotnet test Backend/tests/ZhongWenHub.IntegrationTests/ZhongWenHub.IntegrationTests.csproj -c Release
cd Fontend
bun install --frozen-lockfile
bun run lint
bun test src/tests
bun run build
bun run test:e2e
~~~
SQL and Playwright runs require real allowlisted backend+test DB, frontend server, and exact test environment pre-flight. If not available BLOCKED. Compare endpoints against `/swagger/v1/swagger.json` where enabled (Swagger UI at `/swagger`). Do not pretend TypeScript client codegen already exists. Verify all changed API consumers.

## G. DEFINITION OF DONE — GLOBAL RELEASE GATE
M1 is NOT DONE unless:
- Every visible in-scope action: route → handler → service → HTTP → BE authorization → SQL, verified through reload/restart.
- All 5 roles report and track tickets; Support resolves and replies; Admin monitors; Content linked issue.
- Admin manages real users/staff/RBAC and external provider configurations; secrets masked, real authorization.
- Student basic/adaptive practice, personal weak-topic dashboard and results from actual SQL; Teacher class/homework loop; Content published HSK workflow; remaining visible menus honest or working.
- Auth null/guest and A→B isolation; no production demo student fallback/mock login; no false-success UI.
- Test pass counts and logs for FE, BE, SQL, browser E2E; CI run IDs when pushed; unresolved SKIPPED/BLOCKED described, not hidden.
- Independent review, security matrix, migration backup/rollback validation, branch ownership record, explicit user acceptance and permission before merging.

## H. OUTPUT AFTER IMPLEMENTATION — COMPACT BUT COMPLETE
Return only a consolidated report, not dozens of micro updates:
1. Current git branch, original HEAD, working HEAD, local status, any uncommitted F01 patches and PR #29 status.
2. Completion matrix W0…W8: DONE / IN_PROGRESS / BLOCKED with paths, real route/API/SQL evidence and test commands.
3. Bugs found/fixed, file counts and migrations, conflicts reconciled, real E2E screenshots/results and test counts.
4. Security/role ownership matrix, SQL guard evidence and all remaining mocks or blockers.
5. Proposed **one M1 Draft PR** base/head and changed-file summary, only after explicit commit/push authorization. No merge/F02-style roll-forward without approval.

## START IMPLEMENTATION NOW
**Không trả lời chỉ bằng PLAN.** Đọc current Git, soát code rồi BẮT ĐẦU SỬA nguồn mã thật liên tục theo Batch 1→5. Các bước nhỏ hoàn thành tự nối tiếp trong cùng phase lớn. Không hỏi tiếp sau mỗi file/test; chỉ dừng tại ranh giới an toàn của AGENTS.md hoặc khi không thể làm tiếp do thiếu quyền/môi trường. **Không merge PR #29, không đẩy thẳng main.**