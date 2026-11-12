# HSK 1 Full Student Learning, Exam Repository & CMS E2E Verification Report

## 1. Ephemeral Test Harness
- **Config:** [`playwright.ephemeral.config.ts`](file:///D:/ZhongWenHub/Fontend/playwright.ephemeral.config.ts) (`workers: 1`, Vite proxy on `http://localhost:5179` -> ASP.NET Core Release API on `http://127.0.0.1:5099`).
- **Fail-Closed DB Guard:** Both E2E specs verify `/api/v1/system/database-environment` starts with `zhongwenhub_ephemeral_` before running any step (`ZhongWenHub_Ephemeral_QA`). Protected DBs (`ZhongWenHub_Test`, `ZhongWenHub_Dev`) were untouched and verified afterward via `ApplicationIntent=ReadOnly` (`HSK1 PublishedLessons=3`, `ExamTables=0`).

## 2. Frontend Fixes Verified by E2E
- [`curriculum.service.ts`](file:///D:/ZhongWenHub/Fontend/src/management/admin/content/services/curriculum.service.ts): Fixed live lesson editor hydration for vocabularies/grammars/exercises and `readingPassage` round-trip persistence.
- [`AdminCurriculumPage.tsx`](file:///D:/ZhongWenHub/Fontend/src/management/admin/content/pages/AdminCurriculumPage.tsx): Added `preserveMessage` handling so batch review banners remain visible.
- [`authService.ts`](file:///D:/ZhongWenHub/Fontend/src/features/auth/services/authService.ts): Added single-flight `inFlightRefreshPromise` deduplication in `refreshSession()` to eliminate concurrent `/api/v1/auth/refresh` rotation `401` races on reload.
- [`auth-token.service.ts`](file:///D:/ZhongWenHub/Fontend/src/core/api/client/auth-token.service.ts) & [`LearningStateContext.tsx`](file:///D:/ZhongWenHub/Fontend/src/features/learning/context/LearningStateContext.tsx): Dispatched `zwh_auth_session_ready` upon `setSession()` and triggered `learningStateService.syncWithServer()` in `LearningStateProvider` so authenticated student progress hydrates reliably after `page.reload()`.

## 3. Playwright E2E Results (`bunx playwright test --config=playwright.ephemeral.config.ts`)
Latest clean execution against `ZhongWenHub_Ephemeral_QA`: **3 passed (44.5s), 0 failed**.

1. **Exam Repository E2E (`16.7s`)** — [`exam-repository-e2e.spec.ts`](file:///D:/ZhongWenHub/Fontend/e2e/exam-repository-e2e.spec.ts)
   - Content Manager creates draft exam (`HSK1`), persists across reload, links 2 Question Bank exercises, reorders up, previews, updates title, submits for review (`Chờ duyệt`).
   - Negative SoD check: same Content Manager blocked (`400`) from self-publishing.
   - Admin UI publishes (`Đã xuất bản`), verifies deletion of `PUBLISHED` exam is blocked in UI and API (`400`), archives (`Lưu trữ`), creates & deletes a clean draft exam via `ConfirmDialog`.
2. **CMS Curriculum & Batch Publication E2E (`12.7s`)** — [`hsk1-published-student-and-cms.spec.ts`](file:///D:/ZhongWenHub/Fontend/e2e/hsk1-published-student-and-cms.spec.ts)
   - Confirms `"Trình biên tập bài học"` is removed from sidebar and lesson editing opens from **Giáo trình** (`AdminLessonEditorPage`).
   - Edits Lesson 4 intro, saves, reloads & verifies persistence, restores summary, runs readiness check (`15` lessons, `Bị chặn: 0`), batch-submits 12 ready lessons (`"Đã gửi duyệt 12 bài"`).
   - Verifies CM SoD self-publish skip (`processedCount: 0, skippedCount: 12`), followed by Admin UI batch publish (`"Đã xuất bản 12 bài"`, `"Đã xuất bản: 15"`).
3. **Student 15-Lesson HSK 1 Experience & Progress Persistence E2E (`13.7s`)** — [`hsk1-published-student-and-cms.spec.ts`](file:///D:/ZhongWenHub/Fontend/e2e/hsk1-published-student-and-cms.spec.ts)
   - Student API & Learning Path confirm **15 published HSK 1 lessons** live (`Tổng bài: 15`), while HSK 5/6 stay `Sắp ra mắt` / Coming Soon.
   - Opens Lesson 4 (`他是我的汉语老师`) and Lesson 8 (`我想喝茶`), confirming live SQL Server content, `reading-passage-card`, and absence of `(Bản thảo)` / template placeholders.
   - Walks through Practice Modal, completes Lesson 4 via `/api/v1/learning/me/lessons/{id}/complete`, verifies zero duplicate XP on repeat completion, and verifies `#complete` shows `"Bạn đã hoàn thành bài học này!"` across `page.reload()`.

