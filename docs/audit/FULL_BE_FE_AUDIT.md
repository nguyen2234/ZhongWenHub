# BÁO CÁO KIỂM TOÁN TOÀN DIỆN HỆ THỐNG BACKEND & FRONTEND (FULL BE/FE AUDIT)

**Hệ thống:** ZhongWenHub (Nền tảng Học tiếng Trung & Luyện thi HSK Tích hợp AI)  
**Repository:** `nguyen2234/ZhongWenHub`  
**Nhánh kiểm toán:** `feat/teacher-module-completion` (baseline: `audit/full-codebase-clean-code-20261119`)  
**Ngày thực hiện:** 19/11/2026  
**Vai trò:** Senior Full-Stack Architect, ASP.NET Core Engineer, React/TypeScript Engineer, Database Architect, Security Reviewer, QA Engineer  

---

## MỤC LỤC
1. [Tổng quan Kiến trúc và Trạng thái Baseline](#1-tổng-quan-kiến-trúc-và-trạng-thái-baseline)
2. [Kiểm toán Phân hệ Backend (ASP.NET Core & EF Core)](#2-kiểm-toán-phân-hệ-backend-aspnet-core--ef-core)
3. [Kiểm toán Phân hệ Frontend (React 19 & TypeScript)](#3-kiểm-toán-phân-hệ-frontend-react-19--typescript)
4. [Kiểm toán Chuyên sâu Phân hệ Giáo viên (Teacher Module Gap Analysis)](#4-kiểm-toán-chuyên-sâu-phân-hệ-giáo-viên-teacher-module-gap-analysis)
5. [Kiểm toán An toàn Bảo mật & Phân quyền (RBAC & Data Ownership)](#5-kiểm-toán-an-toàn-bảo-mật--phân-quyền-rbac--data-ownership)
6. [Bảng Phân loại Khiếm khuyết & Lỗ hổng (Defect Classification Matrix)](#6-bảng-phân-loại-khiếm-khuyết--lỗ-hổng-defect-classification-matrix)
7. [Kế hoạch Thực thi & Lộ trình Khắc phục (Execution Roadmap)](#7-kế-hoạch-thực-thi--lộ-trình-khắc-phục-execution-roadmap)

---

## 1. TỔNG QUAN KIẾN TRÚC VÀ TRẠNG THÁI BASELINE

### 1.1. Hạ tầng Công nghệ
- **Backend**:
  - ASP.NET Core trên nền tảng **.NET 10** (`net10.0`).
  - Entity Framework Core 10 với Microsoft SQL Server Provider.
  - Kiến trúc phân lớp chuẩn mực: `ZhongWenHub.Api` (Presentation), `ZhongWenHub.Business` (Application & Domain Services), `ZhongWenHub.Data` (Persistence & Entities).
  - JWT Bearer Authentication (`Microsoft.AspNetCore.Authentication.JwtBearer 10.0.14`) với ASP.NET Core Identity.
- **Frontend**:
  - React 19.3.0, React Router DOM 7.18.4, Vite 8.3.2, TypeScript 6.0.3, Bun Test Runner, Oxlint.
  - Cấu trúc module rõ ràng theo miền nghiệp vụ: `features/` (học viên, AI, video, từ vựng), `management/` (quản trị admin, giáo viên, nội dung).
- **Cơ sở Dữ liệu**:
  - Microsoft SQL Server 2022 (sử dụng Docker container và LocalDB cho kiểm thử E2E).
  - 100% migrations quản lý qua EF Core Code-First.

### 1.2. Trạng thái Sức khỏe Kỹ thuật Hiện thời (Baseline Health)
- **Backend Build**: Thành công (0 lỗi, 5 cảnh báo CS8601/CS8604 về nullability annotations).
- **Backend Unit Tests**: **325/325 tests PASS** (`ZhongWenHub.UnitTests.dll`).
- **Backend Integration Tests**: **109/109 tests PASS** (`ZhongWenHub.IntegrationTests.dll` chạy trên SQL Server thực tế).
- **Frontend Linter (Oxlint)**: **0 lỗi**, 153 cảnh báo (chủ yếu là React compiler recommendations về `set-state-in-effect`).
- **Frontend Unit Tests**: **404/404 tests PASS** trên 51 file kiểm thử.
- **Frontend Build (Vite & tsc)**: Thành công (1.30s).

---

## 2. KIỂM TOÁN PHÂN HỆ BACKEND (ASP.NET CORE & EF CORE)

### 2.1. Dependency Injection & Cấu trúc Dịch vụ
- **Hiện trạng:** Các dịch vụ được đăng ký tập trung tại `Backend/src/Business/DependencyInjection.cs`.
- **Đánh giá:**
  - `ICurrentUserService` được tiêm chuẩn mực dưới dạng `Scoped`, trích xuất thông tin người dùng từ `IHttpContextAccessor.HttpContext.User`.
  - Tuy nhiên, các phân hệ nghiệp vụ bài tập (`Assignments`), điểm danh (`Attendance`), và nộp bài (`Submissions`) của Giáo viên **hoàn toàn chưa có dịch vụ đăng ký** trong container.
- **Rủi ro:** Khi phát triển phân hệ Teacher hoàn chỉnh, nếu không tuân thủ mẫu thiết kế tách biệt Interface/Implementation (`ITeacherAssignmentService`, `ITeacherAttendanceService`, `IStudentHomeworkService`) sẽ gây coupling cao và khó khăn cho Unit Test.

### 2.2. EF Core Entities & Cơ sở Dữ liệu Quan hệ
- **Các thực thể Giáo viên đã có trong Phase 1:**
  1. `TeachingClass`: Lớp học, mã lớp (Unique), sức chứa, hình thức (Online/Offline/Hybrid), trạng thái (`DRAFT`, `UPCOMING`, `ACTIVE`, `COMPLETED`, `ARCHIVED`).
  2. `TeachingClassMember`: Ghi danh học viên với Unique Index `[ClassId, StudentId]`.
  3. `TeachingClassSchedule`: Thời khóa biểu tuần (`DayOfWeek`, `StartTime`, `EndTime`).
- **Các thực thể còn THIẾU HOÀN TOÀN trong EF Core:**
  1. `TeachingClassAttendance`: Điểm danh từng buổi học theo lịch dạy.
  2. `TeachingAssignment`: Bài tập về nhà được tạo bởi Giáo viên.
  3. `AssignmentQuestion`: Các câu hỏi thuộc bài tập (hỗ trợ trắc nghiệm, điền từ, đúng/sai, tự luận, trích xuất từ Ngân hàng câu hỏi).
  4. `AssignmentTarget`: Liên kết giao bài tập cho một hoặc nhiều lớp học cụ thể kèm hạn nộp (`DueDate`).
  5. `StudentAssignmentSubmission`: Bản nộp bài của học viên, lưu lượt làm (`AttemptNumber`), thời gian làm bài, trạng thái chấm điểm, điểm số.
  6. `SubmissionGradeItem`: Điểm và phản hồi chi tiết cho từng câu hỏi tự luận/viết.

### 2.3. Quản lý Giao dịch (Transactions & Concurrency)
- **Điểm mạnh:** Thao tác thêm học viên trong `TeacherClassService.AddMemberAsync` đã có kiểm tra sĩ số động (`Dynamic Derived Enrollment`) và bắt lỗi trùng lặp bằng Unique Constraint.
- **Khiếm khuyết cần lưu ý:**
  - Quy trình nộp bài tập (`SubmitHomeworkAsync`) và chấm bài (`GradeSubmissionAsync`) cần thay đổi trạng thái và cập nhật nhiều bảng đồng thời (`StudentAssignmentSubmission`, `TeachingClassMember.CompletedAssignmentsCount`, `StudentXpTransaction`). Cần bắt buộc bọc trong `IDbContextTransaction` để đảm bảo tính toàn vẹn ACID.
  - Nguy cơ race-condition khi học viên nộp bài đồng thời: Cần có Optimistic Concurrency hoặc Unique Index trên `[AssignmentId, StudentId, AttemptNumber]`.

---

## 3. KIỂM TOÁN PHÂN HỆ FRONTEND (REACT 19 & TYPESCRIPT)

### 3.1. Rò rỉ Dữ liệu Giả định (Mock Data Leaks) vào Luồng Production
- **Vị trí 1: `Fontend/src/management/teacher/data/mockTeacherPortalData.ts`**
  - Khai báo: `CURRENT_TEACHER_ID = 'tch-001'`.
  - Dù `TeacherClassesPage` và `TeacherClassDetailPage` đã được nối API thực tế, các phương thức liên quan đến `submissionsStore` và `activitiesStore` vẫn đọc từ mảng giả lập in-memory.
- **Vị trí 2: `Fontend/src/management/teacher/data/mockAssignmentData.ts`**
  - Khai báo: `INITIAL_ASSIGNMENTS` với 4 bài tập mẫu và `INITIAL_QUESTIONS`.
  - Trang [TeacherAssignmentsPage.tsx](file:///d:/TN/Fontend/src/management/teacher/pages/TeacherAssignmentsPage.tsx) và [AssignmentFormDrawer.tsx](file:///d:/TN/Fontend/src/management/teacher/components/assignment-management/AssignmentFormDrawer.tsx) hiện tại 100% đọc và ghi vào `assignment.service.ts` (lưu trong biến RAM `assignmentsStore`). Dữ liệu mất sạch khi người dùng ấn F5!
- **Vị trí 3: `Fontend/src/management/teacher/data/mockQuestionCatalog.ts`**
  - Component [AssignmentQuestionPickerModal.tsx](file:///d:/TN/Fontend/src/management/teacher/components/assignment-management/AssignmentQuestionPickerModal.tsx) lấy danh sách câu hỏi từ mảng tĩnh `MOCK_QUESTION_CATALOG` thay vì gọi API Ngân hàng câu hỏi thật (`GET /api/v1/question-bank`).

### 3.2. Thành phần Giao diện Chưa Hoàn Thiện (Placeholder Components)
- `ClassAssignmentsPlaceholderTab.tsx`: Tab bài tập trong màn hình Chi tiết lớp học chỉ hiển thị một banner thông báo "Chức năng đang được kết nối với Ngân hàng bài tập".
- `ClassPerformancePlaceholderTab.tsx`: Tab báo cáo tiến độ học tập chỉ hiển thị biểu đồ rỗng và nhãn "Sắp ra mắt".
- `UpcomingSessionsCard.tsx` / `PendingSubmissionsQueue.tsx` trên Teacher Dashboard: Hàng đợi bài nộp cần chấm điểm đang hiển thị các mục cố định của học viên giả lập.

---

## 4. KIỂM TOÁN CHUYÊN SÂU PHÂN HỆ GIÁO VIÊN (TEACHER MODULE GAP ANALYSIS)

Dưới đây là bảng đối soát chi tiết 12 hạng mục nghiệp vụ phân hệ Giáo viên theo yêu cầu:

| STT | Hạng mục nghiệp vụ | Hiện trạng Backend (API & DB) | Hiện trạng Frontend (UI & Service) | Đánh giá khoảng cách (Gap) & Giải pháp |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Teacher Dashboard** | **ĐÃ CÓ:** `GET /api/v1/teacher/dashboard` tính 4 KPIs thực tế, danh sách buổi dạy sắp tới. | **ĐÃ KẾT NỐI:** `TeacherDashboardPage` gọi API thật cho KPI & lớp học. Queue bài nộp còn mock. | **Cần hoàn thiện:** Kết nối `PendingSubmissionsQueue` và `RecentActivityList` với dữ liệu bài nộp thật. |
| **2** | **Teacher Classes** | **ĐÃ CÓ:** Đầy đủ CRUD, Archive, lọc, phân trang, check trùng mã lớp, Derived Enrollment. | **ĐÃ KẾT NỐI:** `TeacherClassesPage` gọi API thật 100%, có phân trang, tìm kiếm, drawer tạo lớp. | **HOÀN THÀNH.** Bảo đảm giữ nguyên thiết kế UI. |
| **3** | **Class Members** | **ĐÃ CÓ:** `GET/POST/DELETE` thành viên, chống trùng lặp, chống vượt sĩ số tối đa. | **ĐÃ KẾT NỐI:** `ClassStudentsTab` hiển thị danh sách học viên thật, thêm và xóa học viên. | **HOÀN THÀNH.** Cần bổ sung cột/tab hiển thị tiến độ học tập chi tiết từng học viên. |
| **4** | **Class Schedules** | **ĐÃ CÓ:** `GET/PUT /api/v1/teacher/classes/{id}/schedules`, validate `startTime < endTime`, chống trùng giờ. | **ĐÃ KẾT NỐI:** `ClassScheduleTab` xem và cập nhật thời khóa biểu tuần lên SQL Server. | **HOÀN THÀNH.** |
| **5** | **Attendance (Điểm danh)** | **CHƯA CÓ.** Chưa có bảng `TeachingClassAttendance` và Controller endpoints. | **CHƯA CÓ.** Chưa có giao diện điểm danh theo buổi học và ngày học. | **CẦN XÂY MỚI:** Tạo entity, migration, API lưu điểm danh (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`), UI điểm danh trong tab Lịch học. |
| **6** | **Teaching Curriculum** | **MỘT PHẦN:** `TeachingClass` có cột `CourseId` nhưng chưa có API liên kết chi tiết với các bài học HSK. | **CHƯA KẾT NỐI:** Giáo viên chưa thể chỉ định bài giảng cụ thể từ giáo trình đã duyệt cho lớp. | **CẦN BỔ SUNG:** Endpoint tra cứu giáo trình lớp và gắn bài học vào tiến độ giảng dạy. |
| **7** | **Assignments** | **CHƯA CÓ TRÊN BACKEND.** Hoàn toàn chạy bằng `INITIAL_ASSIGNMENTS` trong RAM. | **GIAO DIỆN CÓ SẴN:** `TeacherAssignmentsPage` có bảng danh sách, bộ lọc, drawer tạo bài tập nhưng chỉ lưu tạm. | **CẦN XÂY MỚI TOÀN DIỆN:** Tạo entity `TeachingAssignment`, API CRUD, xuất bản (`Publish`), đóng bài (`Close`), lưu SQL Server. |
| **8** | **Assignment Questions** | **CHƯA CÓ TRÊN BACKEND.** Chưa có quan hệ câu hỏi - bài tập. | **MOCK DATA:** `AssignmentQuestionPickerModal` đọc từ file mock tĩnh 20 câu. | **CẦN XÂY MỚI:** Entity `AssignmentQuestion`, API chọn câu hỏi từ Ngân hàng câu hỏi thật hoặc tạo câu hỏi mới. |
| **9** | **Assignment Targets** | **CHƯA CÓ TRÊN BACKEND.** Chưa có cơ chế phân bổ bài tập đến các lớp cụ thể. | **MOCK:** Chọn checkbox các lớp trong drawer và lưu vào mảng in-memory. | **CẦN XÂY MỚI:** Entity `AssignmentTarget`, đảm bảo chỉ giao được cho các lớp do chính giáo viên đó sở hữu. |
| **10**| **Student Submissions** | **CHƯA CÓ TRÊN BACKEND.** Không có bảng lưu lượt nộp bài của học viên. | **CHƯA KẾT NỐI:** `StudentHomeworkListPage` chưa hiển thị bài tập được giao thật từ lớp học. | **CẦN XÂY MỚI:** Entity `StudentAssignmentSubmission`, API học viên nộp bài (`POST /api/v1/student/homework/{id}/submit`). |
| **11**| **Grading & Feedback** | **CHƯA CÓ TRÊN BACKEND.** | **MOCK:** Chưa có form cho giáo viên nhập nhận xét và chấm điểm bài nộp. | **CẦN XÂY MỚI:** Logic tự động chấm câu trắc nghiệm khách quan, API cho giáo viên chấm câu tự luận và gửi feedback. |
| **12**| **Student Progress Reports**| **CHƯA CÓ TRÊN BACKEND.** `ClassPerformancePlaceholderTab` là component rỗng. | **PLACEHOLDER:** Hiển thị thẻ rỗng. | **CẦN XÂY MỚI:** Endpoint tổng hợp tỷ lệ hoàn thành bài tập, điểm trung bình lớp và biểu đồ phân bổ điểm số. |

---

## 5. KIỂM TOÁN AN TOÀN BẢO MẬT & PHÂN QUYỀN (RBAC & DATA OWNERSHIP)

### 5.1. Cơ chế Xác thực và Nhận diện Danh tính (Identity Derivation)
- **Quy tắc cốt lõi:** Tuyệt đối không tin cậy `teacherId` hoặc `role` gửi từ trình duyệt qua Request Body hoặc Query String.
- **Hiện trạng:**
  - `TeacherClassService` đã thực thi nghiêm ngặt: `var currentUserId = _currentUserService.UserId;` và so sánh `cls.TeacherId == currentUserId`. Nếu không khớp, lập tức quăng `UnauthorizedAccessException` trả về `403 Forbidden`.
  - Phân hệ Bài tập và Điểm danh mới bắt buộc phải kế thừa 100% mô hình bảo mật này:
    - Giáo viên chỉ được xem/sửa/xóa bài tập do chính mình tạo ra (`assignment.TeacherId == currentUserId`).
    - Giáo viên chỉ được giao bài tập cho các lớp học do mình phụ trách (`target.Class.TeacherId == currentUserId`).
    - Giáo viên chỉ được chấm bài nộp của học viên trong các lớp mình dạy.

### 5.2. Chống Rò rỉ Đáp án cho Học viên (Answer Key Leak Prevention)
- **Lỗ hổng tiềm ẩn:** Nếu DTO trả về danh sách câu hỏi cho học viên (`StudentHomeworkDto`) chứa trường `CorrectAnswer` hoặc `Explanation` trước khi nộp bài, học viên có thể F12 (Inspect Network Tab) để lấy đáp án chuẩn.
- **Giải pháp bắt buộc:**
  - Tách biệt hai DTO:
    1. `TeacherAssignmentDetailDto`: Đầy đủ `CorrectAnswer`, `Explanation`, ma trận điểm.
    2. `StudentAssignmentTakingDto`: Chỉ chứa `Id`, `Prompt`, `QuestionType`, `OptionsJson`, `Points`. Loại bỏ hoàn toàn `CorrectAnswer` và `Explanation`.
  - Chỉ trả về `CorrectAnswer` và `Explanation` cho học viên sau khi bài làm đã được nộp (`status == 'SUBMITTED'` hoặc `'GRADED'`) VÀ bài tập có cờ `ShowCorrectAnswers == true`.

### 5.3. Quyền Truy cập Ngân hàng Câu hỏi (Question Bank Cross-Role Access)
- **Lỗ hổng hiện hữu:** `QuestionBankController` hiện đặt `[Authorize(Policy = PolicyConstants.ContentManagementAccess)]`. Giáo viên có vai trò `TEACHER` khi mở modal chọn câu hỏi cho bài tập sẽ bị chặn lỗi `403 Forbidden`.
- **Giải pháp:** Cập nhật chính sách hoặc phân quyền endpoint tra cứu câu hỏi đã duyệt: Cho phép `TeacherAccess` được gọi `GET /api/v1/question-bank` với điều kiện chỉ xem các câu hỏi ở trạng thái `Approved` / `Published`.

---

## 6. BẢNG PHÂN LOẠI KHIẾM KHUYẾT & LỖ HỔNG (DEFECT CLASSIFICATION MATRIX)

| Mã lỗi | Phân loại | Mức độ | Vị trí file & Dòng mã | Nguyên nhân gốc (Root Cause) | Giải pháp đề xuất |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **DEF-01** | **Missing Feature** | **CRITICAL** | `Backend/src/Data/Context` | Thiếu toàn bộ thực thể Bài tập (`TeachingAssignment`), Câu hỏi (`AssignmentQuestion`), Mục tiêu giao bài (`AssignmentTarget`), Nộp bài (`StudentAssignmentSubmission`). | Tạo các Entity EF Core, cấu hình Fluent API, tạo Migration SQL Server. |
| **DEF-02** | **Mock Leaking** | **CRITICAL** | `Fontend/src/management/teacher/services/assignment.service.ts:18` | `assignmentsStore` lưu mảng RAM tĩnh; `INITIAL_ASSIGNMENTS` khiến dữ liệu mất sạch khi reload trang. | Viết lại `assignment.service.ts` gọi trực tiếp HTTP API Backend qua `apiClient`. |
| **DEF-03** | **Security / RBAC** | **HIGH** | `Backend/src/Api/Controllers/QuestionBankController.cs:34` | Endpoint `GET /api/v1/question-bank` chặn vai trò `TEACHER` bằng policy `ContentManagementAccess`. | Cho phép `PolicyConstants.TeacherAccess` tra cứu câu hỏi đã được phê duyệt bản quyền. |
| **DEF-04** | **Missing Feature** | **HIGH** | `Fontend/.../AssignmentQuestionPickerModal.tsx:45` | Modal chọn câu hỏi đọc từ `MOCK_QUESTION_CATALOG` tĩnh thay vì gọi API Ngân hàng câu hỏi thật. | Kết nối component với `questionBankService.getQuestions()` thật. |
| **DEF-05** | **Security / Leak** | **HIGH** | `Backend/.../StudentHomeworkDto` | Nguy cơ lộ đáp án `CorrectAnswer` khi học viên làm bài tập trực tuyến. | Tạo DTO riêng cho học viên (`StudentTakingDto`) tước bỏ toàn bộ trường đáp án. |
| **DEF-06** | **Missing Feature** | **HIGH** | `Backend/.../Attendance` | Thiếu cơ chế điểm danh học viên theo thời khóa biểu buổi học. | Bổ sung entity `TeachingClassAttendance` và API điểm danh theo ngày/buổi. |
| **DEF-07** | **Disconnected FE**| **MEDIUM** | `Fontend/.../StudentHomeworkListPage.tsx` | Học viên chưa xem được bài tập do giáo viên lớp mình giao. | Kết nối với endpoint `GET /api/v1/student/homework`. |
| **DEF-08** | **UI Placeholder** | **MEDIUM** | `ClassAssignmentsPlaceholderTab.tsx` & `ClassPerformancePlaceholderTab.tsx` | Hai tab trong chi tiết lớp học đang là placeholder tĩnh. | Thay thế bằng component danh sách bài tập thật của lớp và biểu đồ điểm số/chuyên cần thật. |
| **DEF-09** | **Data Integrity** | **MEDIUM** | `TeacherAssignmentService.PublishAssignmentAsync` | Nếu bài tập đã giao có học viên nộp bài nhưng giáo viên sửa đổi cấu trúc câu hỏi sẽ gây sai lệch điểm. | Khóa chỉnh sửa câu hỏi sau khi bài tập đã chuyển trạng thái `PUBLISHED` hoặc có ít nhất 1 bài nộp. |
| **DEF-10** | **Mock Leaking** | **LOW** | `mockTeacherPortalData.ts:16` | Hằng số `CURRENT_TEACHER_ID = 'tch-001'` còn tồn tại trong codebase. | Loại bỏ việc tham chiếu trực tiếp, thay bằng `useAuth()` hoặc token context. |

---

## 7. KẾ HOẠCH THỰC THI & LỘ TRÌNH KHẮC PHỤC (EXECUTION ROADMAP)

Quá trình triển khai được chia làm 4 giai đoạn kỹ thuật tiếp nối:

### Giai đoạn 1: Xây dựng Nền tảng Backend cho Bài tập & Điểm danh (Phase 3 Backend)
1. Tạo các thực thể EF Core: `TeachingAssignment`, `AssignmentQuestion`, `AssignmentTarget`, `StudentAssignmentSubmission`, `TeachingClassAttendance`.
2. Thiết lập quan hệ khóa ngoại, Composite Unique Constraints, Cascade Rules trong `ApplicationDbContext.OnModelCreating`.
3. Tạo và kiểm tra Migration `AddTeacherAssignmentAndAttendanceEntities` với script SQL Idempotent an toàn.
4. Xây dựng DTOs và Services: `TeacherAssignmentService`, `TeacherAttendanceService`, `StudentHomeworkService`.
5. Xây dựng Controllers: `TeacherAssignmentsController`, `TeacherAttendanceController`, `StudentHomeworkController`.
6. Cập nhật quyền hạn cho Teacher truy cập câu hỏi đã duyệt trong `QuestionBankController`.
7. Viết trọn bộ Unit Tests & Integration Tests cho Backend.

### Giai đoạn 2: Hoàn thiện Frontend Phân hệ Giáo viên (Phase 4 Frontend)
1. Viết lại `assignment.service.ts` chuyển 100% sang HTTP calls thật với Bearer Token.
2. Nối `TeacherAssignmentsPage` và `AssignmentFormDrawer` với API Backend.
3. Nối `AssignmentQuestionPickerModal` với API Ngân hàng câu hỏi thật.
4. Thay thế `ClassAssignmentsPlaceholderTab` bằng danh sách bài tập thật của lớp.
5. Triển khai giao diện Điểm danh (`Attendance`) trong tab Lịch học hoặc tab chuyên dụng.
6. Thay thế `ClassPerformancePlaceholderTab` bằng dữ liệu chuyên cần và điểm số thật.
7. Xóa bỏ hoàn toàn phụ thuộc vào `CURRENT_TEACHER_ID` và các in-memory mock stores.

### Giai đoạn 3: Kết nối Luồng Học viên (Cross-Role Integration)
1. Kết nối `StudentHomeworkListPage` để học viên xem danh sách bài tập được giao từ các lớp đang tham gia (`my-enrolled-classes`).
2. Xây dựng modal/màn hình làm bài tập cho học viên: hiển thị câu hỏi không lộ đáp án, gửi câu trả lời lên server, nhận kết quả tự động chấm điểm.

### Giai đoạn 4: Kiểm thử Toàn diện & Bàn giao (Phase 6 & 7)
1. Chạy toàn bộ test suites: `dotnet test` (Unit + Integration), `bun run test`, `bun run lint`, `bun run build`.
2. Kiểm tra các kịch bản an toàn bảo mật (Negative Security Tests).
3. Biên soạn các tài liệu bàn giao theo yêu cầu:
   - `docs/audit/FULL_BE_FE_AUDIT.md` (tài liệu này)
   - `docs/audit/TEACHER_MODULE_GAP_ANALYSIS.md`
   - `docs/audit/TEACHER_IMPLEMENTATION_REPORT.md`
   - `docs/audit/TEACHER_ACCEPTANCE_CHECKLIST.md`
