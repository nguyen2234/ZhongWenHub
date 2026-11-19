# BÁO CÁO KIỂM KÊ TOÀN DIỆN CHỨC NĂNG HỆ THỐNG ZHONGWENHUB (HIỆU CHỈNH PHASE A.1)
**Tài liệu:** `docs/audits/FULL_SYSTEM_FUNCTIONAL_INVENTORY.md`  
**Ngày cập nhật:** 19/11/2026 (Hiệu chỉnh theo nhận xét Independent Phase A Review)  
**Nhánh kiểm tra:** `feature/teacher-core-phase1` (và nhánh sửa lỗi `fix/phase-a1-ci-stabilization`)  
**Commit cơ sở:** `d5656a9ffc64e68b7c7416c52c6dcd8a3809cf74`  
**Trạng thái PR:** [#20](https://github.com/nguyen2234/ZhongWenHub/pull/20) (`DRAFT`, `MERGEABLE: true`)  
**Người thực hiện:** Principal Software Architect & QA Automation Engineer  

---

## I. NGUYÊN TẮC ĐÁNH GIÁ & TIÊU CHUẨN PHÂN LOẠI MỚI (ZERO-ASSUMPTION)

Theo phản hồi từ đợt Review độc lập Phase A, **sự tồn tại của Controller/Service/Entity và việc build thành công không đồng nghĩa với việc chức năng đã được kiểm chứng ở runtime**. Trong CI GitHub Actions hiện tại, các bài test với SQL Server thật và Playwright E2E đang ở chế độ điều kiện (`.github/workflows/backend-tests.yml:50-53`, `frontend-pr-ci.yml:48-52`). Do đó, hệ thống phân loại được tinh chỉnh nghiêm ngặt như sau:

### Phân loại trạng thái (7 mức độ):
1. **`RUNTIME_VERIFIED`**: Chức năng đã kết nối End-to-End từ giao diện qua API thật, xử lý nghiệp vụ trên Business Service, có bằng chứng kiểm thử tự động (Unit / Integration / Contract) chạy thực tế và PASS trong test suite hiện tại.
2. **`API_WIRED`** *(Runtime Unverified)*: Giao diện đã gọi endpoint thật, Backend đã có Controller, Service và Entity, nhưng **chưa có bài test tích hợp với SQL Server thật hoặc chưa có E2E runtime test** trong CI tự động.
3. **`PARTIAL`**: Chức năng đã nối một phần API thật nhưng luồng xử lý chưa hoàn thiện (còn tab placeholder, thiếu xử lý lỗi chuẩn fail-closed, hoặc chức năng lưu trữ chỉ mới lưu trên RAM như quyền Role).
4. **`MOCK_ONLY`**: Chức năng chỉ chạy bằng dữ liệu mẫu trên client-side (in-memory store, localStorage, mock timer), chưa có API hoặc Entity trên Backend.
5. **`BROKEN`**: Chức năng có lỗi kỹ thuật xác minh được (nuốt lỗi 500/mạng, fallback dữ liệu giả lập).
6. **`NOT_IMPLEMENTED`**: Chức năng chưa triển khai ở cả Frontend và Backend, hoặc chỉ là trang thông báo tính năng đang phát triển.
7. **`UNKNOWN`**: Chưa đủ bằng chứng để xác minh tính ổn định ở runtime.

---

## II. BẢNG THỐNG KÊ TỔNG HỢP TOÀN HỆ THỐNG

| Phân hệ chức năng | Tổng Route | RUNTIME_VERIFIED | API_WIRED (Unverified) | PARTIAL | MOCK_ONLY | BROKEN | NOT_IMPLEMENTED | Tỷ lệ thực tế (RUNTIME+API_WIRED) |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1. Authentication & Onboarding** | 4 | 2 | 0 | 0 | 0 | 0 | 2 | 50.0% |
| **2. Student Core & Learning State** | 6 | 6 | 0 | 0 | 0 | 0 | 0 | 100.0% |
| **3. Skills & Practice** | 8 | 4 | 1 | 1 | 2 | 0 | 0 | 62.5% |
| **4. Student Classes & Homework** | 5 | 0 | 0 | 0 | 5 | 0 | 0 | 0.0% *(Blocker P1)* |
| **5. Video Learning** | 2 | 0 | 1 | 0 | 0 | 1 | 0 | 50.0% *(Blocker P1)* |
| **6. AI Suite (Tutor, Live, Diagnostic...)** | 8 | 5 | 1 | 0 | 2 | 0 | 0 | 75.0% |
| **7. Gamification & Personalization** | 6 | 2 | 0 | 0 | 3 | 0 | 1 | 33.3% |
| **8. Teacher Portal** | 5 | 2 | 0 | 1 | 2 | 0 | 0 | 40.0% *(Blocker P1)* |
| **9. Content Manager Workspace** | 13 | 6 | 1 | 1 | 5 | 0 | 0 | 53.8% |
| **10. Admin Management Console** | 11 | 4 | 2 | 1 | 4 | 0 | 0 | 54.5% |
| **11. Support Portal** | 2 | 0 | 0 | 0 | 2 | 0 | 0 | 0.0% *(P2)* |
| **TỔNG TOÀN HỆ THỐNG** | **70** | **31 (44.3%)** | **6 (8.6%)** | **4 (5.7%)** | **25 (35.7%)** | **1 (1.4%)** | **3 (4.3%)** | **52.9%** |

---

## III. ĐỐI CHIẾU CHI TIẾT TỪNG ROUTE & TRẠNG THÁI TEST RUNTIME

### 1. Phân hệ Authentication & Onboarding
* `/login` (**`RUNTIME_VERIFIED`**): `LoginPage.tsx` ➔ `authService.login()` ➔ `POST /api/v1/auth/login` ➔ `AuthController.Login` ➔ `AuthService.AuthenticateAsync` ➔ `ApplicationUser`, `RefreshToken`. Test: `AuthIntegrationTests.cs`, `auth-registration-and-onboarding.test.ts`.
* `/register` (**`RUNTIME_VERIFIED`**): `RegisterPage.tsx` ➔ `authService.register()` ➔ `POST /api/v1/auth/register` ➔ `AuthController.Register` ➔ `AuthService.RegisterAsync` ➔ `ApplicationUser`, `UserSubscription`, `UserWallet`. Test: `AuthIntegrationTests.cs`, `auth-registration-and-onboarding.test.ts`.
* `/forgot-password` (**`NOT_IMPLEMENTED`**): Ném lỗi explicit, chưa có backend endpoint.
* `/onboarding` (**`NOT_IMPLEMENTED`**): Tự động redirect về dashboard vai trò, form mục tiêu chỉ mang tính trưng bày.

### 2. Phân hệ Student Core & Learning State
* `/dashboard` (**`RUNTIME_VERIFIED`**): `DashboardPage.tsx` ➔ `learningApiService.fetchLearningState()` ➔ `GET /api/v1/learning/me` ➔ `LearningController.GetMyLearningState` ➔ `StudentLearningProfile`, `StudentDailyActivity`, `StudentXpTransaction`. Test: `LearningIntegrationTests.cs`, `student-navigation-dashboard.test.ts`.
* `/learning-path` (**`RUNTIME_VERIFIED`**): `LearningPathPage.tsx` ➔ `learning-path.service.ts` ➔ `GET /api/v1/learning-path/goals`, `POST /generate`, `GET /current`, `GET /daily-plan`. Test: `learning-path-phase4.test.ts`, `AIPhase4LearningPathTests.cs`.
* `/lesson`, `/lesson/:lessonId`, `/lesson/focus`, `/lesson/:lessonId/focus` (**`RUNTIME_VERIFIED`**): `HskTextbookLessonPage.tsx`, `LessonPage.tsx` ➔ `ContentController.GetLessonById`, `LearningController.UpdateLessonProgress`. Test: `fe-6-textbook-scrollspy.test.ts`, `LessonReleaseGateIntegrationTests.cs`.
* `/vocabulary`, `/srs-review` (**`RUNTIME_VERIFIED`**): `VocabularyPage.tsx`, `ReviewSessionPage.tsx` ➔ `LearningController.GetVocabularyList`, `RecordSrsReview`. Test: `connected-learning.test.ts`, `LearningIntegrationTests.cs`.

### 3. Phân hệ Kỹ năng & Luyện tập (Skills & Practice)
* `/grammar` (**`PARTIAL`**): `GrammarPage.tsx` ➔ `GET /api/v1/content/grammar`. Khi lỗi mạng, code vẫn còn fallback file ngữ pháp tĩnh.
* `/skills/listening` (**`RUNTIME_VERIFIED`**): `SkillListeningPage.tsx` ➔ lấy hội thoại và audio từ `GET /api/v1/content/lessons`. Test: `fe-6-textbook-scrollspy.test.ts`.
* `/skills/speaking`, `/speaking` (**`RUNTIME_VERIFIED`**): `SkillSpeakingPage.tsx` ➔ `AILearningEngineController` (`/speaking/items`, `/speaking/submit`). Test: `ai-phase5-speaking.test.ts`, `AIPhase5SpeakingTests.cs`.
* `/skills/reading` (**`API_WIRED`**): `SkillReadingPage.tsx` ➔ gọi `GET /api/v1/content/lessons/{id}`. Chưa có bài integration test độc lập cho reading flow.
* `/skills/writing` (**`MOCK_ONLY`**): `SkillWritingPage.tsx` ➔ dùng `MOCK_WRITING_EXERCISES` từ `mockSkillData.ts`. Chưa có backend API.
* `/practice` (**`RUNTIME_VERIFIED`**): `PracticePage.tsx` ➔ `QuestionBankController` (`/practice-sessions`, `/submit`). Test: `question-bank.test.ts`, `QuestionBankIntegrationTests.cs`.
* `/mock-exams` (**`RUNTIME_VERIFIED`**): `MockExamsPage.tsx` ➔ `ExamsController` (`/exams`, `/exams/{id}`). Test: `exam-repository.test.ts`, `ExamServiceTests.cs`.
* `/games` (**`MOCK_ONLY`**): `LearningGamesPage.tsx` ➔ 100% in-memory thẻ bài từ vựng (`INITIAL_PAIRS`).

### 4. Phân hệ Lớp học & Bài tập của Học viên *(BLOCKER P1)*
* `/classes` (**`MOCK_ONLY`**): `StudentClassesPage.tsx` dùng hardcoded `MOCK_ENROLLED_CLASSES = [...]` (các lớp `cls-001`, `cls-002`), không gọi `GET /api/v1/teacher/my-enrolled-classes`.
* `/homework` (**`MOCK_ONLY`**): `StudentHomeworkListPage.tsx` đọc từ `assignmentsStore` in-memory.
* `/homework/:assignmentId` (**`MOCK_ONLY`**): `StudentHomeworkDetailPage.tsx` đọc `assignmentService` in-memory.
* `/homework/:assignmentId/run` (**`MOCK_ONLY`**): `StudentAssignmentRunnerPage.tsx` lưu nháp localStorage (`zh_attempt_draft_`), chấm điểm trên client-side, ID sinh tạm `att-${Date.now()}`.
* `/homework/:assignmentId/result/:attemptId` (**`MOCK_ONLY`**): `StudentHomeworkResultPage.tsx` đọc in-memory.
* `/learning-results` (**`MOCK_ONLY`**): `LearningResultsPage.tsx` hiển thị mảng tĩnh `MOCK_RESULTS`.

### 5. Phân hệ Học qua Video *(BLOCKER P1)*
* `/videos` (**`API_WIRED`**): `VideoLibraryPage.tsx` gọi `VideosController.GetVideos`. Đã có test DTO nhưng chưa có SQL Server integration test thực tế cho video query.
* `/videos/:videoId` (**`BROKEN`**): `VideoDetailPage.tsx` nuốt lỗi 500/mạng qua `video-learning.service.ts` và tự động fallback sang `DEMO_VIDEOS` với metadata bịa đặt (`durationFormatted: '03:00'`, `transcriptPdfName: 'HSK_BaiDoc_Mau.pdf'`).

### 6. Phân hệ Trợ lý AI (AI Suite)
* `/ai-tutor` (**`RUNTIME_VERIFIED`**): `AITutorWorkspacePage.tsx` ➔ `POST /api/v1/ai-tutor/chat` ➔ `AITutorController` ➔ `GeminiProvider`, log `AiUsageLog`. Test: `ai-tutor-real-api.test.ts`, `AITutorIntegrationTests.cs`, `AITutorServiceTests.cs`.
* `/ai-live`, `/conversation` (**`RUNTIME_VERIFIED`**): `AILivePage.tsx` ➔ `AILearningEngineController` (`/conversations/start`, `/messages`, `/messages/audio`). Test: `ai-learning-engine-v1.test.ts`, `AILearningEngineIntegrationTests.cs`.
* `/ai-analytics` (**`RUNTIME_VERIFIED`**): `AIAnalyticsPage.tsx` ➔ `GET /api/v1/ai/error-analysis`. Test: `ai-phase3-adaptive-and-error-analysis.test.ts`, `AIPhase3PersonalizationTests.cs`.
* `/ai-learning` (**`API_WIRED`**): `StudentAIWorkspacePage.tsx` tích hợp AI Tutor drawer và widget `CompetencyProfile` (`GET /api/v1/ai/competency-profile`).
* `/ai-exercises` (**`RUNTIME_VERIFIED`**): `AIExerciseGeneratorPage.tsx` ➔ `POST /api/v1/ai/exercises/generate`, `POST /attempts`. Test: `ai-phase3-adaptive-and-error-analysis.test.ts`, `AILearningEngineTests.cs`.
* `/diagnostic-assessment` (**`RUNTIME_VERIFIED`**): `DiagnosticAssessmentPage.tsx` ➔ `AILearningEngineController` (`/diagnostic/start`, `/submit`, `/latest`). Test: `ai-diagnostic-assessment.test.ts`, `DiagnosticAssessmentServiceTests.cs`.
* `/ai-grading`, `/letter-writing` (**`MOCK_ONLY`**): `AIGradingPage.tsx` dùng `setTimeout` giả lập chấm bài 1.5s.

### 7. Phân hệ Thành tích, Cá nhân & Cài đặt
* `/progress` (**`RUNTIME_VERIFIED`**): `ProgressPage.tsx` nhận dữ liệu qua `useLearningState()` đồng bộ từ SQL Server.
* `/leaderboard` (**`NOT_IMPLEMENTED`**): Hiển thị thông báo tính năng đang phát triển.
* `/achievements` (**`MOCK_ONLY`**): Render mảng tĩnh `ACHIEVEMENTS = [...]`.
* `/profile` (**`RUNTIME_VERIFIED`**): `ProfilePage.tsx` gọi `GET/PUT /api/v1/auth/me`, `PUT /api/v1/learning/me/preferences`. Test: `AuthIntegrationTests.cs`.
* `/settings` (**`MOCK_ONLY`**): Lưu tạm trên React `useState`, không lưu vào storage hay Backend.
* `/design-system` (**`RUNTIME_VERIFIED`**): Showcase thư viện UI components.

### 8. Phân hệ Quản lý Giảng dạy (Teacher Management Portal)
* `/management/teacher/dashboard` (**`RUNTIME_VERIFIED`**): `TeacherDashboardPage.tsx` ➔ `GET /api/v1/teacher/dashboard`. Test: `teacher-class-management.test.ts`, `TeacherClassServiceTests.cs`.
* `/management/teacher/classes` (**`RUNTIME_VERIFIED`**): `TeacherClassesPage.tsx` ➔ `GET /api/v1/teacher/classes`, `GET /classes/stats`. Test: `teacher-class-management.test.ts`, `TeacherClassServiceTests.cs`.
* `/management/teacher/classes/:classId` (**`PARTIAL`**): Tab Overview, Students, Schedule là thật (`RUNTIME_VERIFIED`). Tab Bài tập và Hiệu suất là component giữ chỗ (`ClassAssignmentsPlaceholderTab`, `ClassPerformancePlaceholderTab`).
* `/management/teacher/assignments` (**`MOCK_ONLY`**) *(Blocker P1)*: `TeacherAssignmentsPage.tsx` 100% in-memory (`CURRENT_TEACHER_ID = 'tch-001'`, `assignmentsStore`). Backend chưa có Entity/Controller.
* `/management/teacher/ai-workspace` (**`MOCK_ONLY`**): `TeacherAIWorkspacePage.tsx` trả về mock grading jobs (`job-01`, `asgn-002`).

### 9. Phân hệ Quản trị Nội dung (Content Manager Workspace)
* `/management/content-manager/dashboard` (**`PARTIAL`**): Thống kê đọc từ mock service.
* `/management/content-manager/hsk-repository` (**`RUNTIME_VERIFIED`**): `AdminHskRepositoryPage.tsx` ➔ `ContentController` (vocabularies, characters). Test: `hsk1-dictionary-verification.test.ts`, `Hsk1ImportIntegrationTests.cs`.
* `/management/content-manager/curriculum`, `/curriculum/lessons/:id/edit` (**`RUNTIME_VERIFIED`**): `AdminCurriculumPage.tsx`, `AdminLessonEditorPage.tsx` ➔ `ContentController` (courses, units, lessons). Test: `curriculum-create-and-counts.test.ts`, `LessonReleaseGateIntegrationTests.cs`.
* `/management/content-manager/grammar` (**`RUNTIME_VERIFIED`**): `AdminGrammarManagementPage.tsx` ➔ `ContentController` (`/content/grammar`). Test: `fe-10-2-content-management.test.ts`, `Hsk30DataAndSecurityIntegrationTests.cs`.
* `/management/content-manager/question-bank` (**`RUNTIME_VERIFIED`**): `AdminExerciseBankPage.tsx` ➔ `QuestionBankController`. Test: `question-bank.test.ts`, `QuestionBankIntegrationTests.cs`.
* `/management/content-manager/exams` (**`RUNTIME_VERIFIED`**): `AdminExamRepositoryPage.tsx` ➔ `ExamsController`. Test: `exam-repository.test.ts`, `ExamServiceTests.cs`.
* `/management/content-manager/videos` (**`API_WIRED`**): `VideoManagementPage.tsx` ➔ `VideosController.manage`. Test unit/API contracts đã có, nhưng upload đám mây thực tế chưa có test live SQL Server.
* `/management/content-manager/moderation` (**`MOCK_ONLY`**): Dùng `INITIAL_MODERATION_ITEMS`.
* `/management/content-manager/issues` (**`MOCK_ONLY`**): Dùng `INITIAL_CONTENT_ISSUES`.
* `/management/content-manager/audit-history`, `/quality-metrics` (**`MOCK_ONLY`**): Dùng `INITIAL_VERSION_SNAPSHOTS`, `INITIAL_QUALITY_METRICS`.

### 10. Phân hệ Quản trị Hệ thống (Admin Console)
* `/management/admin/dashboard` (**`RUNTIME_VERIFIED`**): `AdminDashboardPage.tsx` ➔ `AdminDashboardController`, `AdminUsersController`. Test: `AdminUsersIntegrationTests.cs`, `fe-10-admin-web-console.test.ts`.
* `/management/admin/users`, `/users/:id`, `/users/:id/edit` (**`RUNTIME_VERIFIED`**): `AdminUsersPage.tsx` ➔ `AdminUsersController` (CRUD, lock, unlock, status, roles, reset-password, wallet, subscription). Test: `user-management-redesign-and-isolation.test.ts`, `AdminUsersIntegrationTests.cs`.
* `/management/admin/teachers` (**`API_WIRED`**): Wrapper gọi `AdminUsersController?role=TEACHER`.
* `/management/admin/support-staff` (**`API_WIRED`**): Wrapper gọi `AdminUsersController?role=SUPPORT`.
* `/management/admin/roles` (**`PARTIAL`**): Sửa mô tả vai trò lưu SQL Server (`PUT /roles/{role}/description`). Sửa danh sách quyền chỉ lưu trong biến RAM `INITIAL_ROLES`.
* `/management/admin/ai-management` (**`MOCK_ONLY`**): Giao diện `INITIAL_AI_SERVICES`.
* `/management/admin/analytics` (**`MOCK_ONLY`**): Dữ liệu demo `HSK_DISTRIBUTION`.
* `/management/admin/support-requests` (**`MOCK_ONLY`**): Đọc in-memory `supportTicketService`.
* `/management/admin/settings` (**`MOCK_ONLY`**): Form lưu state cục bộ.

### 11. Phân hệ Hỗ trợ Kỹ thuật (Support Portal)
* `/management/support/dashboard`, `/management/support/tickets` (**`MOCK_ONLY`**): `SupportDashboardPage.tsx` dùng `INITIAL_TICKETS`. Backend chưa có Controller/Entity.

---

## IV. TỔNG KẾT & ĐÁNH GIÁ CHÂM CHƯỚC / BLOCKER CHO PHASE B

1. **Thừa nhận trung thực:** Chỉ có **31 / 70 routes (44.3%)** là thực sự được xác minh runtime bằng automated tests (`RUNTIME_VERIFIED`), thêm **6 routes (8.6%)** đã đấu dây API (`API_WIRED`). Như vậy, hơn **47% chức năng còn lại** là mock hoặc chưa hoàn thiện.
2. **Kế hoạch dọn dẹp các Blocker P1 ở Phase B:**
   * B1: Sửa chữa dứt điểm Video Fail-closed & loại bỏ hoàn toàn fallback `DEMO_VIDEOS`.
   * B2: Nối `StudentClassesPage.tsx` vào API thật `GET /api/v1/teacher/my-enrolled-classes`.
   * B3: Xây dựng Backend + Frontend cho Teacher Assignment (Entity, DTO, Service, Controller).
   * B4: Xây dựng Student Homework Attempts, Submissions & Chấm điểm server-authoritative trên SQL Server.
