# HSK 1 (15 Lessons) Publication Gate & Two-Person Review Report

## 1. Publication Gate Rules Enforced
Strict HSK 1 quality gates and Segregation of Duties (SoD) rules in [`ContentService.cs`](file:///D:/ZhongWenHub/Backend/src/Business/Content/ContentService.cs) and [`LessonPublicationWorkflowTests.cs`](file:///D:/ZhongWenHub/Backend/tests/ZhongWenHub.UnitTests/LessonPublicationWorkflowTests.cs) were validated and kept intact:
- Pre-publish readiness gate checks every lesson across required sections (vocabularies, grammar points, exercises, intro/dialogue/reading fields) before allowing submission/publication.
- Two-person review / Segregation of Duties (SoD): the user submitting a lesson (`PENDING_REVIEW`) cannot self-publish (`PUBLISHED`); a separate Admin account must approve and publish.

## 2. Backend & CMS Fixes Supporting Publication Workflow
1. **CMS Curriculum Readiness Banner Preservation (`Fontend/src/management/admin/content/pages/AdminCurriculumPage.tsx`):**
   - Added `preserveMessage = false` parameter to `loadReadiness` and passed `true` from `handleBatchSubmitReady` / `handleBatchPublishPending` (with `onClick={() => loadReadiness(false)}` on manual refresh) so batch action status banners (`"Đã gửi duyệt 12 bài"`, `"Đã xuất bản 12 bài"`) remain visible instead of being wiped immediately after refresh.
2. **Live Lesson Editor Hydration & Save Integrity (`Fontend/src/management/admin/content/services/curriculum.service.ts`):**
   - Fixed `fetchLessonEditorData` mapping so live SQL Server API DTOs wrap into the nested `{ id, lessonId, vocabularyId, vocabulary }`, `{ ..., grammarPointId, grammarPoint }`, and `{ ..., exerciseId, section, exercise }` structures expected by `LessonPlayerAdapter` and `AdminLessonEditorPage`.
   - Preserved `dialogue.readingPassage` across round-trip save and fixed `saveLessonDraft` ID mapping (`.vocabularyId || .id`).

## 3. Ephemeral Live Gate Verification (`ZhongWenHub_Ephemeral_QA`)
- **Pre-publish Readiness Snapshot (`/api/v1/content/lessons/readiness?hskLevel=1` on `http://127.0.0.1:5099`):**
  - `totalLessons`: `15`
  - `publishedCount`: `3`
  - `readyToPublishCount`: `12`
  - `pendingReviewCount`: `0`
  - `blockedCount`: `0`
- **Two-Person Workflow Executed via API & UI (`hsk1-published-student-and-cms.spec.ts`):**
  1. Content Manager edited Lesson 4 intro, saved, reloaded, verified persistence, restored summary, ran readiness check (`15 bài`, `Bị chặn: 0`), and batch-submitted `12` ready lessons -> `"Đã gửi duyệt 12 bài"`.
  2. Negative SoD check via `POST /api/v1/content/lessons/batch-review` as the same Content Manager attempting `PUBLISHED` on the `12` `PENDING_REVIEW` lessons returned `processedCount: 0`, `skippedCount: 12`.
  3. Admin logged in via UI and executed batch publish -> `"Đã xuất bản 12 bài"`, bringing total `PUBLISHED` HSK 1 lessons to **`15 / 15` (`Đã xuất bản: 15`)**.
  4. Student API `/api/v1/content/lessons` returned `15` `PUBLISHED` HSK 1 lessons.

## 4. Protected Database Status
- `ZhongWenHub_Test` and `ZhongWenHub_Dev` remain unmodified (`HSK1 PublishedLessons=3`, `ExamTables=0` verified read-only). Ready for controlled rollout once `USER_APPROVAL_TOKEN.signed` is provided.

