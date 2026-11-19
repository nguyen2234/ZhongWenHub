# BÁO CÁO KIỂM KÊ TOÀN DIỆN CHỨC NĂNG HỆ THỐNG ZHONGWENHUB
**Tài liệu:** `docs/audits/FULL_SYSTEM_FUNCTIONAL_INVENTORY.md`  
**Ngày kiểm kê:** 19/11/2026  
**Nhánh kiểm tra:** `feature/teacher-core-phase1`  
**Commit cơ sở:** `f8a8296a62110d09e8b4c9228282408e52223a52`  
**Trạng thái PR:** [#20](https://github.com/nguyen2234/ZhongWenHub/pull/20) (`DRAFT`, `MERGEABLE: true`)  
**Người thực hiện:** Principal Software Architect & Independent QA Engineer  

---

## I. TỔNG QUAN VÀ TIÊU CHÍ ĐÁNH GIÁ

Báo cáo kiểm kê được thực hiện trên toàn bộ 60+ routes có thể truy cập ở Frontend, đối chiếu trực tiếp với Frontend Services, HTTP Endpoints, ASP.NET Core Backend Controllers, Business Services, EF Core Entities / SQL Server Schema, RBAC Policies, và bộ kiểm thử (Unit / Integration / E2E).

### Tiêu chí phân loại chức năng (Zero-Assumption Standards):
* **`REAL_WORKING`**: Chức năng đã kết nối End-to-End từ giao diện qua API thật, xử lý nghiệp vụ trên Business Service, lưu trữ dữ liệu bền vững trên SQL Server (EF Core), kiểm soát quyền (RBAC) nghiêm ngặt, có bằng chứng kiểm thử tự động xác minh được. Không gắn nhãn này chỉ vì frontend build thành công.
* **`PARTIAL`**: Chức năng đã có API và Entity thật nhưng luồng xử lý chưa hoàn thiện (ví dụ: giao diện còn một số tab placeholder, thiếu xử lý lỗi chuẩn fail-closed, hoặc còn trộn lẫn mock fallback).
* **`MOCK_ONLY`**: Chức năng chỉ chạy bằng dữ liệu mẫu trên client-side (in-memory store, localStorage, mock timer), chưa có API hoặc Entity trên Backend.
* **`BROKEN`**: Chức năng có lỗi kỹ thuật xác minh được (lỗi nuốt exception, demo fallback khi API lỗi, rò rỉ dữ liệu).
* **`NOT_IMPLEMENTED`**: Chức năng chưa triển khai ở cả Frontend và Backend, hoặc chỉ là trang thông báo tính năng đang phát triển.
* **`UNKNOWN`**: Chưa đủ bằng chứng để xác minh tính ổn định ở runtime.

---

## II. BẢNG THỐNG KÊ TỔNG HỢP THEO PHÂN HỆ

| Phân hệ chức năng | Tổng Route | REAL_WORKING | PARTIAL | MOCK_ONLY | BROKEN | NOT_IMPLEMENTED | Tỷ lệ thực tế (REAL+PARTIAL) |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1. Authentication & Onboarding** | 4 | 2 | 0 | 0 | 0 | 2 | 50.0% |
| **2. Student Core & Learning State** | 6 | 6 | 0 | 0 | 0 | 0 | 100.0% |
| **3. Skills & Practice** | 8 | 5 | 1 | 2 | 0 | 0 | 75.0% |
| **4. Student Classes & Homework** | 5 | 0 | 0 | 5 | 0 | 0 | 0.0% *(Blocker P1)* |
| **5. Video Learning** | 2 | 0 | 1 | 0 | 1 | 0 | 50.0% *(Blocker P1)* |
| **6. AI Suite (Tutor, Live, Diagnostic...)** | 8 | 6 | 0 | 2 | 0 | 0 | 75.0% |
| **7. Gamification & Personalization** | 6 | 2 | 0 | 3 | 0 | 1 | 33.3% |
| **8. Teacher Portal** | 5 | 2 | 1 | 2 | 0 | 0 | 60.0% *(Blocker P1)* |
| **9. Content Manager Workspace** | 13 | 7 | 1 | 5 | 0 | 0 | 61.5% |
| **10. Admin Management Console** | 11 | 6 | 0 | 5 | 0 | 0 | 54.5% |
| **11. Support Portal** | 2 | 0 | 0 | 2 | 0 | 0 | 0.0% *(P2)* |
| **TỔNG TOÀN HỆ THỐNG** | **70** | **36 (51.4%)** | **4 (5.7%)** | **26 (37.1%)** | **1 (1.4%)** | **3 (4.3%)** | **57.1%** |

---

## III. CHI TIẾT KIỂM KÊ TỪNG PHÂN HỆ

### 1. Phân hệ Authentication & Onboarding (`/login`, `/register`, `/forgot-password`, `/onboarding`)
* `/login` (**`REAL_WORKING`**):
  - Page: `LoginPage.tsx`
  - Service: `authService.login()`
  - Endpoint: `POST /api/v1/auth/login`
  - Backend: `AuthController.Login` -> `AuthService.AuthenticateAsync` -> `ApplicationUser`, `RefreshToken`
  - Tests: `AuthIntegrationTests.cs`, `auth-registration-and-onboarding.test.ts`.
* `/register` (**`REAL_WORKING`**):
  - Page: `RegisterPage.tsx`
  - Service: `authService.register()`
  - Endpoint: `POST /api/v1/auth/register`
  - Backend: `AuthController.Register` -> `AuthService.RegisterAsync` -> `ApplicationUser`, `UserSubscription`, `UserWallet`
  - Tests: `AuthIntegrationTests.cs`, `auth-registration-and-onboarding.test.ts`.
* `/forgot-password` (**`NOT_IMPLEMENTED`**):
  - Page: `ForgotPasswordPage.tsx`
  - Service: `authService.forgotPassword()` ném Error: *"Tính năng tự đặt lại mật khẩu qua email đang được bảo trì..."*
  - Endpoint: Không tồn tại trên `AuthController.cs`.
* `/onboarding` (**`NOT_IMPLEMENTED`**):
  - Page: `OnboardingPage.tsx` tự động redirect về dashboard tương ứng với vai trò qua `ROLE_DEFAULT_PATHS`. Form thiết lập mục tiêu chỉ mang tính trưng bày (interactive mode tắt mặc định).

---

### 2. Phân hệ Student Core & Learning State
* `/dashboard` (**`REAL_WORKING`**):
  - Page: `DashboardPage.tsx`
  - Service: `useLearningState()`, `learningApiService.fetchLearningState()`
  - Endpoint: `GET /api/v1/learning/me`
  - Backend: `LearningController.GetMyLearningState` -> `LearningService` -> `StudentLearningProfile`, `StudentDailyActivity`, `StudentXpTransaction`
  - Tests: `LearningIntegrationTests.cs`, `student-navigation-dashboard.test.ts`.
* `/learning-path` (**`REAL_WORKING`**):
  - Page: `LearningPathPage.tsx`
  - Service: `learning-path.service.ts`
  - Endpoints: `GET /api/v1/learning-path/goals`, `POST /generate`, `GET /current`, `GET /daily-plan`, `POST /tasks/{id}/complete`, `POST /replan`, `GET /progress`
  - Backend: `LearningPathController` -> `LearningPathService` -> `PersonalizedLearningPathEntity`, `LearningPathMilestoneEntity`, `DailyLearningTaskEntity`
  - Tests: `learning-path-phase4.test.ts`, `AIPhase4LearningPathTests.cs`.
* `/lesson`, `/lesson/:lessonId`, `/lesson/focus`, `/lesson/:lessonId/focus` (**`REAL_WORKING`**):
  - Pages: `HskTextbookLessonPage.tsx`, `LessonPage.tsx`
  - Service: `lesson-content.service.ts`, `learningApiService`
  - Endpoints: `GET /api/v1/content/lessons/{id}`, `PUT /api/v1/learning/me/lessons/{id}/progress`, `POST /complete`
  - Backend: `ContentController.GetLessonById`, `LearningController.UpdateLessonProgress` -> `LessonEntity`, `StudentLessonProgress`
  - Tests: `fe-6-textbook-scrollspy.test.ts`, `LessonReleaseGateIntegrationTests.cs`.
* `/vocabulary`, `/srs-review` (**`REAL_WORKING`**):
  - Pages: `VocabularyPage.tsx`, `ReviewSessionPage.tsx`
  - Service: `VocabularyReviewContext`, `learningApiService`
  - Endpoints: `GET /api/v1/learning/me/vocabulary`, `POST /reviews`, `POST /session-complete`
  - Backend: `LearningController.GetVocabularyList`, `RecordSrsReview` -> `StudentVocabularyProgress`, `VocabularyEntity`
  - Tests: `connected-learning.test.ts`, `LearningIntegrationTests.cs`.

---

### 3. Phân hệ Kỹ năng & Luyện tập (Skills & Practice)
* `/grammar` (**`PARTIAL`**):
  - Page: `GrammarPage.tsx`
  - Service: `grammar.service.ts`
  - Endpoint: `GET /api/v1/content/grammar`
  - Backend: `ContentController.GetGrammarPoints` -> `GrammarPointEntity`
  - Vấn đề: Vẫn còn fallback về file ngữ pháp tĩnh khi network lỗi thay vì hiển thị Error State.
* `/skills/listening` (**`REAL_WORKING`**):
  - Page: `SkillListeningPage.tsx`
  - Kết nối: Lấy dữ liệu hội thoại và audio từ `GET /api/v1/content/lessons`.
* `/skills/speaking`, `/speaking` (**`REAL_WORKING`**):
  - Page: `SkillSpeakingPage.tsx`
  - Service: `speaking.service.ts`, `aiLearningEngineService`
  - Endpoints: `GET /api/v1/ai/speaking/items`, `POST /api/v1/ai/speaking/submit`, `POST /submit-json`, `GET /history`, `GET /stats`
  - Backend: `AILearningEngineController` -> `AISpeakingService`, `GeminiSpeechRecognitionService` -> `AiSpeakingAttempt`
  - Tests: `ai-phase5-speaking.test.ts`, `AIPhase5SpeakingTests.cs`.
* `/skills/reading` (**`REAL_WORKING`**):
  - Page: `SkillReadingPage.tsx`
  - Kết nối: Đọc bài đọc từ `GET /api/v1/content/lessons/{id}`.
* `/skills/writing` (**`MOCK_ONLY`**):
  - Page: `SkillWritingPage.tsx`
  - Dữ liệu: Sử dụng `MOCK_WRITING_EXERCISES` từ `mockSkillData.ts`. Chưa có API chấm viết hoặc lưu trữ bài viết.
* `/practice` (**`REAL_WORKING`**):
  - Page: `PracticePage.tsx`
  - Service: `practice-question-bank.service.ts`
  - Endpoints: `GET /api/v1/question-bank/recommendations`, `POST /practice-sessions`, `POST /submit`, `GET /practice-history`
  - Backend: `QuestionBankController` -> `QuestionBankService` -> `QuestionBankPracticeSessionEntity`, `ExerciseEntity`
  - Tests: `question-bank.test.ts`, `QuestionBankIntegrationTests.cs`.
* `/mock-exams` (**`REAL_WORKING`**):
  - Page: `MockExamsPage.tsx`
  - Endpoints: `GET /api/v1/exams`, `GET /api/v1/exams/{id}`
  - Backend: `ExamsController` -> `ExamService` -> `ExamEntity`, `ExamQuestionEntity`
  - Tests: `exam-repository.test.ts`, `ExamServiceTests.cs`.
* `/games` (**`MOCK_ONLY`**):
  - Page: `LearningGamesPage.tsx`
  - Dữ liệu: Mini game lật thẻ từ vựng chạy 100% trên RAM bằng `INITIAL_PAIRS`.

---

### 4. Phân hệ Lớp học & Bài tập của Học viên (Student Classes & Homework) *(BLOCKER P1)*
* `/classes` (**`MOCK_ONLY`**):
  - Page: `StudentClassesPage.tsx`
  - Vấn đề: Đang dùng `const MOCK_ENROLLED_CLASSES = [...]` hardcoded (dòng 23-50) gồm các lớp giả lập `cls-001`, `cls-002`. Không gọi `GET /api/v1/teacher/my-enrolled-classes` dù API backend đã sẵn sàng và đã được kiểm thử.
* `/homework` (**`MOCK_ONLY`**):
  - Page: `StudentHomeworkListPage.tsx`
  - Service: `student-homework.service.ts` -> gọi `assignmentService.getAssignmentsByClass()`
  - Vấn đề: Phụ thuộc vào `assignmentsStore` và `INITIAL_ASSIGNMENTS` in-memory.
* `/homework/:assignmentId` (**`MOCK_ONLY`**):
  - Page: `StudentHomeworkDetailPage.tsx`
  - Service: `assignmentService.getAssignmentById()` (in-memory).
* `/homework/:assignmentId/run` (**`MOCK_ONLY`**):
  - Page: `StudentAssignmentRunnerPage.tsx`
  - Service: `student-attempt.service.ts`
  - Vấn đề: `startAttempt()`, `saveDraftAnswers()`, `submitAttempt()` đều chạy in-memory và localStorage (`zh_attempt_draft_`). ID bài nộp sinh ngẫu nhiên `att-${Date.now()}`, chấm điểm hoàn toàn trên client, không bảo mật đáp án, không lưu SQL Server.
* `/homework/:assignmentId/result/:attemptId` (**`MOCK_ONLY`**):
  - Page: `StudentHomeworkResultPage.tsx`
  - Dữ liệu lấy từ `studentAttemptService.getAttemptById()` (localStorage/in-memory).
* `/learning-results` (**`MOCK_ONLY`**):
  - Page: `LearningResultsPage.tsx`
  - Vấn đề: Render danh sách kết quả mẫu `MOCK_RESULTS = [...]` hardcoded (dòng 18-49).

---

### 5. Phân hệ Học qua Video (Video Learning) *(BLOCKER P1)*
* `/videos` (**`PARTIAL`**):
  - Page: `VideoLibraryPage.tsx`
  - Service: `video-learning.service.ts`
  - Endpoint: `GET /api/v1/videos`, `GET /api/v1/videos/topics`
  - Backend: `VideosController.GetVideos` -> `LearningVideo`
  - Vấn đề: Xử lý tìm kiếm và phân trang tốt, nhưng nuốt lỗi mạng/500 thành danh sách rỗng.
* `/videos/:videoId` (**`BROKEN`**):
  - Page: `VideoDetailPage.tsx`
  - Vấn đề:
    1. `video-learning.service.ts` (dòng 106-129) bắt lỗi HTTP 500 hoặc Network error rồi nuốt lỗi, trả về `null`.
    2. `VideoDetailPage.tsx` (dòng 48-77) khi nhận `null` tự động fallback sang `DEMO_VIDEOS` với metadata giả lập (`durationFormatted: '03:00'`, `transcriptPdfName: 'HSK_BaiDoc_Mau.pdf'`, `viewCount: 100`).

---

### 6. Phân hệ Trợ lý & Trí tuệ Nhân tạo (AI Suite)
* `/ai-tutor` (**`REAL_WORKING`**):
  - Page: `AITutorWorkspacePage.tsx`
  - Service: `AITutorService.ts`
  - Endpoint: `POST /api/v1/ai-tutor/chat`
  - Backend: `AITutorController` -> `AITutorService` -> `GeminiProvider` / `ConfigurableAIProvider`, ghi log `AiUsageLog`, xác minh ngữ cảnh bằng `EfAITutorContextVerifier`.
  - Tests: `ai-tutor-real-api.test.ts`, `AITutorIntegrationTests.cs`, `AITutorServiceTests.cs`.
* `/ai-live`, `/conversation` (**`REAL_WORKING`**):
  - Page: `AILivePage.tsx`
  - Service: `ai-learning-engine.service.ts`
  - Endpoints: `GET /api/v1/ai/conversations`, `POST /start`, `POST /{id}/messages`, `POST /{id}/messages/audio`, `POST /{id}/end`
  - Backend: `AILearningEngineController` -> `AIConversationService` -> `AiConversationSession`, `AiMessage`
  - Tests: `ai-learning-engine-v1.test.ts`, `AILearningEngineIntegrationTests.cs`.
* `/ai-analytics` (**`REAL_WORKING`**):
  - Page: `AIAnalyticsPage.tsx`
  - Endpoint: `GET /api/v1/ai/error-analysis`
  - Backend: `AILearningEngineController.GetErrorAnalysis` -> `AIErrorAnalysisService` -> `LearningSkillStatistic`, `StudentPracticeAttempt`
  - Tests: `ai-phase3-adaptive-and-error-analysis.test.ts`, `AIPhase3PersonalizationTests.cs`.
* `/ai-learning` (**`REAL_WORKING`**):
  - Page: `StudentAIWorkspacePage.tsx`
  - Tích hợp AI Tutor mini drawer và `CompetencyDashboardWidget` (`GET /api/v1/ai/competency-profile`).
* `/ai-exercises` (**`REAL_WORKING`**):
  - Page: `AIExerciseGeneratorPage.tsx`
  - Endpoints: `POST /api/v1/ai/exercises/generate`, `POST /attempts`, `POST /adaptive/session`
  - Backend: `AILearningEngineController` -> `AIExerciseService` -> `AiGeneratedExercise`, `AiExerciseAttempt`
  - Tests: `ai-phase3-adaptive-and-error-analysis.test.ts`, `AILearningEngineTests.cs`.
* `/diagnostic-assessment` (**`REAL_WORKING`**):
  - Page: `DiagnosticAssessmentPage.tsx`
  - Endpoints: `POST /api/v1/ai/diagnostic/start`, `POST /submit`, `GET /latest`, `POST /confirm-target`
  - Backend: `AILearningEngineController` -> `DiagnosticAssessmentService` -> `StudentLearningProfile`
  - Tests: `ai-diagnostic-assessment.test.ts`, `DiagnosticAssessmentServiceTests.cs`.
* `/ai-grading`, `/letter-writing` (**`MOCK_ONLY`**):
  - Page: `AIGradingPage.tsx`
  - Vấn đề: Sử dụng `setTimeout(() => setResult({...}), 1500)` để sinh kết quả giả lập (dòng 40-60). Không gọi API thật.

---

### 7. Phân hệ Thành tích, Hồ sơ & Cài đặt (Gamification, Profile & Settings)
* `/progress` (**`REAL_WORKING`**):
  - Page: `ProgressPage.tsx`
  - Nguồn dữ liệu: `useLearningState()` được đồng bộ từ Backend SQL Server.
* `/leaderboard` (**`NOT_IMPLEMENTED`**):
  - Page: `LeaderboardPage.tsx`
  - Hiển thị thông báo: *"Bảng xếp hạng đang được phát triển. Chúng tôi cam kết không hiển thị thông tin học viên giả lập."*
* `/achievements` (**`MOCK_ONLY`**):
  - Page: `AchievementsPage.tsx`
  - Vấn đề: Render mảng `ACHIEVEMENTS = [...]` hardcoded (dòng 19-70). Chưa có bảng hoặc endpoint quản lý huy hiệu / thành tích.
* `/profile` (**`REAL_WORKING`**):
  - Page: `ProfilePage.tsx`
  - Endpoints: `GET /api/v1/auth/me`, `PUT /api/v1/auth/me`, `PUT /api/v1/learning/me/preferences`
  - Backend: `AuthController`, `LearningController`
  - Tests: `AuthIntegrationTests.cs`.
* `/settings` (**`MOCK_ONLY`**):
  - Page: `SettingsPage.tsx`
  - Vấn đề: Chỉ lưu trong React `useState`, không lưu vào localStorage hay Backend.

---

### 8. Phân hệ Quản lý Giảng dạy (Teacher Management Portal)
* `/management/teacher/dashboard` (**`REAL_WORKING`**):
  - Page: `TeacherDashboardPage.tsx`
  - Endpoint: `GET /api/v1/teacher/dashboard`
  - Backend: `TeacherClassesController.GetDashboard` -> `TeacherClassService`
  - Tests: `teacher-class-management.test.ts`, `TeacherClassServiceTests.cs`.
* `/management/teacher/classes` (**`REAL_WORKING`**):
  - Page: `TeacherClassesPage.tsx`
  - Endpoints: `GET /api/v1/teacher/classes`, `GET /api/v1/teacher/classes/stats`, `POST /api/v1/teacher/classes`
  - Backend: `TeacherClassesController` -> `TeachingClass`, `TeachingClassSchedule`
  - Tests: `teacher-class-management.test.ts`, `TeacherClassServiceTests.cs`.
* `/management/teacher/classes/:classId` (**`PARTIAL`**):
  - Page: `TeacherClassDetailPage.tsx`
  - Các tab Overview, Students, Schedule: **REAL_WORKING** (gọi API members, schedules).
  - Vấn đề: Tab Assignments (`ClassAssignmentsPlaceholderTab`) và Performance (`ClassPerformancePlaceholderTab`) là tab giữ chỗ (placeholder), chưa nối dữ liệu bài tập thật của lớp.
* `/management/teacher/assignments` (**`MOCK_ONLY`**) *(BLOCKER P1)*:
  - Page: `TeacherAssignmentsPage.tsx`
  - Service: `assignment.service.ts`
  - Vấn đề:
    1. Dùng `assignmentsStore = [...INITIAL_ASSIGNMENTS]`, `questionsStore`, `targetsStore` in-memory.
    2. Dùng `CURRENT_TEACHER_ID = 'tch-001'` và `INITIAL_TEACHING_CLASSES` (dòng 89-93).
    3. Backend hoàn toàn chưa có Entity, Controller hay Service cho Teaching Assignment.
* `/management/teacher/ai-workspace` (**`MOCK_ONLY`**):
  - Page: `TeacherAIWorkspacePage.tsx`
  - Service: `teacher-ai.service.ts`
  - Vấn đề: `getPreGradingJobs()` và `generateExerciseDrafts()` trả về mock jobs (`job-01`, `asgn-002`, `Trần Thị Thu Thảo`).

---

### 9. Phân hệ Quản trị Nội dung (Content Manager Workspace)
* `/management/content-manager/dashboard` (**`PARTIAL`**):
  - Page: `ContentManagerDashboardPage.tsx`
  - Vấn đề: Lấy thống kê từ `content-moderation.service.ts` (mock) và `content-audit.service.ts` (mock).
* `/management/content-manager/hsk-repository` (**`REAL_WORKING`**):
  - Page: `AdminHskRepositoryPage.tsx`
  - Service: `hsk-repository.service.ts` -> gọi `ContentController` (vocabularies, characters, grammar).
* `/management/content-manager/curriculum`, `/curriculum/lessons/:lessonId/edit` (**`REAL_WORKING`**):
  - Pages: `AdminCurriculumPage.tsx`, `AdminLessonEditorPage.tsx`
  - Service: `curriculum.service.ts` -> gọi `ContentController` (courses, units, lessons, readiness, batch-review).
* `/management/content-manager/grammar` (**`REAL_WORKING`**):
  - Page: `AdminGrammarManagementPage.tsx` -> gọi `hsk-repository.service.ts` và `ContentController`.
* `/management/content-manager/question-bank` (**`REAL_WORKING`**):
  - Page: `AdminExerciseBankPage.tsx`
  - Service: `question-bank.service.ts` -> gọi `QuestionBankController` (CRUD, check-duplicates, import, export, batch-publish).
* `/management/content-manager/exams` (**`REAL_WORKING`**):
  - Page: `AdminExamRepositoryPage.tsx`
  - Service: `exam-repository.service.ts` -> gọi `ExamsController` (CRUD, questions, stats, review).
* `/management/content-manager/videos` (**`PARTIAL`**):
  - Page: `VideoManagementPage.tsx`
  - Service: `video-management.service.ts` -> gọi `VideosController.manage`
  - Vấn đề: Nuốt lỗi mạng/500 thành `null`, một số tính năng format duration và upload PDF cần chuẩn hóa.
* `/management/content-manager/moderation` (**`MOCK_ONLY`**):
  - Page: `ContentModerationPage.tsx` -> `content-moderation.service.ts` (dùng `INITIAL_MODERATION_ITEMS`).
* `/management/content-manager/issues` (**`MOCK_ONLY`**):
  - Page: `ContentIssuesPage.tsx` -> `content-issues.service.ts` (dùng `INITIAL_CONTENT_ISSUES`).
* `/management/content-manager/audit-history`, `/quality-metrics` (**`MOCK_ONLY`**):
  - Pages: `ContentAuditHistoryPage.tsx`, `ContentQualityMetricsPage.tsx` -> `content-audit.service.ts` (dùng `INITIAL_VERSION_SNAPSHOTS`, `INITIAL_QUALITY_METRICS`).

---

### 10. Phân hệ Quản trị Hệ thống (Admin Management Console)
* `/management/admin/dashboard` (**`REAL_WORKING`**):
  - Page: `AdminDashboardPage.tsx`
  - Service: `admin-dashboard.service.ts` -> gọi `GET /api/v1/admin/dashboard/stats`, `GET /api/v1/admin/users?page=1&pageSize=5`.
* `/management/admin/users`, `/users/:id`, `/users/:id/edit` (**`REAL_WORKING`**):
  - Pages: `AdminUsersPage.tsx`, `AdminUserDetailPage.tsx`, `AdminUserEditPage.tsx`
  - Service: `user.service.ts` -> gọi `AdminUsersController` (CRUD, lock, unlock, status, roles, reset-password, wallet adjust, subscription).
* `/management/admin/teachers` (**`REAL_WORKING`**):
  - Page: `AdminTeachersPage.tsx` -> `teacher.service.ts` gọi `AdminUsersController?role=TEACHER`.
* `/management/admin/support-staff` (**`REAL_WORKING`**):
  - Page: `AdminSupportStaffPage.tsx` -> `support-staff.service.ts` gọi `AdminUsersController?role=SUPPORT`.
* `/management/admin/roles` (**`PARTIAL`**):
  - Page: `AdminRolesPage.tsx`
  - Service: `role-permission.service.ts`
  - Vấn đề: Sửa mô tả vai trò (`PUT /api/v1/admin/users/roles/{role}/description`) là thật. Nhưng hàm `updateRolePermissions()` chỉ sửa trong mảng `INITIAL_ROLES` trên RAM, Backend không có endpoint lưu danh mục permission cho Role.
* `/management/admin/ai-management` (**`MOCK_ONLY`**):
  - Page: `AdminOperationsPage` (`kind="ai-management"`) -> `AdminAIManagementView.tsx` (dùng `INITIAL_AI_SERVICES`).
* `/management/admin/analytics` (**`MOCK_ONLY`**):
  - Page: `AdminOperationsPage` (`kind="analytics"`) -> `AdminAnalyticsView.tsx` (dùng `HSK_DISTRIBUTION`, xuất file CSV demo).
* `/management/admin/support-requests` (**`MOCK_ONLY`**):
  - Page: `AdminOperationsPage` (`kind="support-requests"`) -> `AdminSupportRequestsView.tsx` (dùng `supportTicketService`).
* `/management/admin/settings` (**`MOCK_ONLY`**):
  - Page: `AdminOperationsPage` (`kind="settings"`) -> `AdminSystemSettingsView.tsx` (form mock chính sách tài khoản).

---

### 11. Phân hệ Hỗ trợ Kỹ thuật & Chăm sóc Học viên (Support Portal)
* `/management/support/dashboard`, `/management/support/tickets` (**`MOCK_ONLY`**):
  - Page: `SupportDashboardPage.tsx`
  - Service: `support-ticket.service.ts`
  - Vấn đề: 100% in-memory store (`INITIAL_TICKETS`). Backend chưa có Controller hay Entity cho Support Ticket.

---

## IV. BẰNG CHỨNG CÁC LỖI CRITICAL (P1) CẦN SỬA Ở PHASE B

### 1. Blocker P1-A: Teacher Assignment & Student Homework tách rời Backend
* `Fontend/src/management/teacher/services/assignment.service.ts:35-39, 178-188`:
  Lưu trữ bằng biến in-memory `assignmentsStore`, `questionsStore`, `targetsStore`. Dùng hằng số `CURRENT_TEACHER_ID = 'tch-001'` và hàm `ownsAssignment()` kiểm tra giả lập trên RAM.
* `Fontend/src/management/teacher/pages/TeacherAssignmentsPage.tsx:89-93`:
  Lấy danh sách lớp giáo viên quản lý từ `INITIAL_TEACHING_CLASSES` thay vì gọi API thật.
* `Fontend/src/features/homework/services/student-attempt.service.ts:10-54, 140-160`:
  Lưu bài làm vào localStorage (`zh_attempt_draft_`) và in-memory store. Chấm điểm trắc nghiệm trực tiếp ở client, ID sinh tạm `att-${Date.now()}`.
* `Fontend/src/features/classes/pages/StudentClassesPage.tsx:23-50`:
  Trang danh sách lớp của học viên hiển thị dữ liệu tĩnh `MOCK_ENROLLED_CLASSES` gồm các lớp `cls-001`, `cls-002`, không gọi endpoint `/api/v1/teacher/my-enrolled-classes`.
* **Hậu quả:** Toàn bộ chu trình Giáo viên giao bài -> Học viên làm bài -> Nộp bài -> Chấm điểm -> Thống kê kết quả đều không lưu trên SQL Server, mất hoàn toàn khi refresh trang hoặc đổi thiết bị.

### 2. Blocker P1-B: Video Learning nuốt lỗi và Fallback dữ liệu giả
* `Fontend/src/features/videos/services/video-learning.service.ts:106-129`:
  Khi API trả về 500 hoặc rớt mạng, hàm `fetchVideoById()` dùng `catch (err)` nuốt exception và trả về `null`.
* `Fontend/src/features/videos/pages/VideoDetailPage.tsx:48-77`:
  Khi nhận `null`, component tự động fallback sang `DEMO_VIDEOS` với các giá trị bịa đặt: `durationFormatted: '03:00'`, `transcriptPdfName: 'HSK_BaiDoc_Mau.pdf'`, `viewCount: 100`.
* `Fontend/src/management/content-manager/services/video-management.service.ts:348-369`:
  Tương tự, bắt mọi lỗi và trả về `null` thay vì bắn exception để giao diện hiển thị trạng thái lỗi và nút Thử lại (Retry).

---

## V. KẾT LUẬN & ĐỀ XUẤT CHO PHASE B

1. **Khẳng định tính trung thực:**
   * Hệ thống có **36 / 70 routes (51.4%)** đã hoạt động thực tế với Backend và Database.
   * **26 routes (37.1%)** hoàn toàn là `MOCK_ONLY` chạy trên RAM / localStorage.
   * PR #20 **CHƯA ĐỦ ĐIỀU KIỆN MERGE MAIN** và phải giữ nguyên trạng thái `DRAFT`.
2. **Kế hoạch hành động ưu tiên ở Phase B:**
   * **B1:** Xây dựng Teacher Assignment Backend (Entities: `TeachingAssignment`, `TeachingAssignmentTarget`, `TeachingAssignmentQuestion`; DTOs; `TeacherAssignmentService`; Controller endpoints). Chuyển `assignment.service.ts` sang API thật, loại bỏ `CURRENT_TEACHER_ID` và `INITIAL_ASSIGNMENTS`.
   * **B2:** Xây dựng Student Homework & Attempt Backend (Entities: `StudentAssignmentAttempt`, `StudentAttemptAnswer`; API bắt đầu, lưu nháp, nộp bài, chấm điểm server-authoritative). Chuyển `student-attempt.service.ts` sang API thật, kết nối `StudentClassesPage.tsx` vào `GET /api/v1/teacher/my-enrolled-classes`.
   * **B3:** Sửa chữa triệt để `video-learning.service.ts`, `video-management.service.ts`, và `VideoDetailPage.tsx`: loại bỏ hoàn toàn fallback `DEMO_VIDEOS`, phân biệt rõ ràng HTTP 404 (Không tìm thấy) với 401/403/500/Lỗi mạng, chuẩn hóa `durationFormatted` và tải file PDF transcript.
