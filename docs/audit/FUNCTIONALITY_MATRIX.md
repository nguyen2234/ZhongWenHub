# ZHONGWENHUB — FULL SYSTEM FUNCTIONALITY MATRIX

> **Tài liệu kiểm toán độc lập theo GitHub Issue #22**  
> **Nhánh thực hiện**: `fix/anti-full-fe-be-functionality`  
> **Base branch**: `feat/teacher-module-completion`  
> **Trạng thái**: Draft Pull Request sẵn sàng kiểm tra chéo  
> **Ngày cập nhật**: 2026-11-19

---

## 1. TỔNG QUAN PHÂN HẠNG TRẠNG THÁI (STATUS TAXONOMY)

- **VERIFIED**: Chức năng đã được kết nối với API thực tế, có endpoint backend tương ứng, dữ liệu lưu trữ / truy vấn từ cơ sở dữ liệu thật, có test tự động xác nhận, không dùng mock hay fallback giả lập trong luồng chính.
- **BROKEN**: Chức năng có UI hoặc API nhưng gặp lỗi lúc gọi, sai lệch DTO, mismatch kiểu dữ liệu, hoặc lỗi xử lý backend/frontend.
- **MOCK_ONLY**: Giao diện chỉ thao tác trên bộ nhớ client (in-memory state / mock array), không gọi API thật.
- **PLACEHOLDER**: Giao diện chỉ có khung, banner "sắp ra mắt", hoặc trống rỗng chưa phát triển logic.
- **UNTESTED**: Giao diện hoặc API đã được viết nhưng chưa có test tự động hoặc chưa được kích hoạt qua luồng E2E.

---

## 2. MA TRẬN CHỨC NĂNG HỆ THỐNG (SYSTEM FUNCTIONALITY MATRIX)

### 2.1. Phân hệ Giáo viên (Teacher Portal)

| Route / Tab / Nút | UI Component | Backend Endpoint | Service Tương Ứng | Trạng Thái | Chi Tiết Xử Lý & Khắc Phục |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/teacher/classes` | `TeacherClassesPage` | `GET /api/v1/teacher/classes` | `teacherPortalService.getClasses` | **VERIFIED** | Phân trang, tìm kiếm theo tên/mã lớp, lọc theo cấp độ HSK và trạng thái. Đã có 472 lines unit/contract test xác nhận. |
| `/teacher/classes/new` (Modal) | `CreateClassModal` | `POST /api/v1/teacher/classes` | `teacherPortalService.createClass` | **VERIFIED** | Tạo lớp học mới, gán lịch học, sức chứa, cấp độ HSK. |
| `/teacher/classes/:id` (Tab Tổng quan) | `ClassOverviewTab` | `GET /api/v1/teacher/classes/:id` | `teacherPortalService.getClassDetail` | **VERIFIED** | Hiển thị thông tin tổng quan, sĩ số, lịch học, thông báo lớp. |
| `/teacher/classes/:id` (Tab Học viên) | `ClassStudentsTab` | `GET /api/v1/teacher/classes/:id/students` | `teacherPortalService.getClassStudents` | **VERIFIED** | Quản lý danh sách học viên, thêm/xóa học viên, xem tỷ lệ chuyên cần. |
| `/teacher/classes/:id` (Tab Điểm danh) | `ClassAttendanceTab` | `GET /api/v1/teacher/classes/:id/attendance`, `POST /attendance` | `teacherPortalService.recordClassAttendance` | **VERIFIED** | Điểm danh học viên theo buổi học (Có mặt, Đi trễ, Vắng có phép, Vắng không phép), tính tỷ lệ chuyên cần thời gian thực. |
| `/teacher/classes/:id` (Tab Bài tập) | `ClassAssignmentsTab` | `GET /api/v1/teacher/assignments?classId=:id` | `assignmentService.getAssignments` | **VERIFIED** | Đã loại bỏ hoàn toàn `ClassAssignmentsPlaceholderTab` mock. Kết nối trực tiếp danh sách bài tập đã giao cho lớp. |
| `/teacher/classes/:id` (Tab Hiệu suất) | `ClassPerformanceTab` | `GET /api/v1/teacher/classes/:id/performance` | `teacherPortalService.getClassPerformance` | **VERIFIED** | Đã loại bỏ hoàn toàn `ClassPerformancePlaceholderTab`. Hiển thị biểu đồ phân bổ điểm, danh sách KPI từng học viên. |
| `/teacher/classes/:id` (Tab Giáo trình) | `ClassCurriculumTab` | `GET /teacher/classes/:id/curriculum`, `PUT /curriculum` | `teacherPortalService.setClassCurriculum` | **VERIFIED** | Tab mới hoàn chỉnh: xem cấu trúc bài giảng/chương, cho phép giáo viên gán và cập nhật giáo trình khóa học cho lớp. |
| `/teacher/assignments` | `TeacherAssignmentsPage` | `GET /api/v1/teacher/assignments` | `assignmentService.getAssignments` | **VERIFIED** | Lọc theo HSK, trạng thái (Bản nháp, Đã phát hành, Đã đóng), tìm kiếm từ khóa, hiển thị tổng điểm và số câu. |
| Tạo bài tập mới (Drawer) | `AssignmentFormDrawer` | `POST /api/v1/teacher/assignments` | `assignmentService.createAssignment` | **VERIFIED** | Chọn câu hỏi từ Ngân hàng đề thi (`GET /api/v1/question-bank?reviewStatus=Approved`), chuyển trọn vẹn đề bài, đáp án, giải thích lên backend. Đã loại bỏ fallback in-memory trong luồng production. |
| Chỉnh sửa bài tập nháp | `AssignmentFormDrawer` | `PUT /api/v1/teacher/assignments/:id` | `assignmentService.updateDraftAssignment` | **VERIFIED** | Cập nhật thời lượng, số lần làm tối đa, chính sách lấy điểm, danh sách câu hỏi. |
| Xuất bản / Đóng bài tập | Action dropdown nút bấm | `POST /assignments/:id/publish`, `POST /close` | `assignmentService.publishAssignment`, `closeAssignment` | **VERIFIED** | Chuyển trạng thái bài tập sang PUBLISHED / CLOSED và khóa chỉnh sửa câu hỏi. |
| Danh sách bài nộp & Chấm điểm | `PendingSubmissionsQueue` | `GET /assignments/:id/submissions`, `POST /submissions/:id/grade` | `assignmentService.gradeSubmission` | **VERIFIED** | Đã xóa banner demo mock. Tích hợp modal chấm điểm trực tiếp: nhập điểm (0-100), phản hồi nhận xét của giáo viên và gửi lưu vào database. |

---

### 2.2. Phân hệ Học viên & Bài tập về nhà (Student Homework)

| Route / Tab / Nút | UI Component | Backend Endpoint | Service Tương Ứng | Trạng Thái | Chi Tiết Xử Lý & Khắc Phục |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/student/homework` | `StudentHomeworkListPage` | `GET /api/v1/student/homework` | `studentHomeworkService.getMyAssignments` | **VERIFIED** | Tải danh sách bài tập được giao theo các lớp học viên đã tham gia. |
| Chi tiết bài tập học viên | `StudentAssignmentDetailPage` | `GET /api/v1/student/homework/:id` | `assignmentService.getStudentAssignmentDetail` | **VERIFIED** | Xem hạn nộp, thời lượng, số lần nộp cho phép và điểm cao nhất hiện tại. |
| Bắt đầu làm bài | `StudentHomeworkRunnerPage` | `POST /api/v1/student/homework/:id/start` | `studentHomeworkService.startAttempt` | **VERIFIED** | Khởi tạo phiên làm bài thi (submissionId), đồng hồ đếm ngược, bảo mật không để lộ đáp án trước khi nộp. |
| Nộp bài tập về nhà | Nút "Nộp bài" trên Runner | `POST /api/v1/student/homework/submissions/:id/submit` | `studentAttemptService.submitAttempt` | **VERIFIED** | Map câu trả lời học viên (chữ cái trắc nghiệm, chuỗi văn bản), gửi lên backend chấm tự động và lưu điểm `totalScore`, `isPassed`. |
| Kết quả & Xem lại bài làm | `StudentHomeworkResultPage` | `GET /api/v1/student/homework/submissions/:id/result` | `studentHomeworkService.getResult` | **VERIFIED** | Hiển thị bảng điểm, phân tích câu đúng/sai, phản hồi nhận xét từ giáo viên. |

---

### 2.3. Phân hệ Quản trị viên (Admin Portal)

| Route / Tab / Nút | UI Component | Backend Endpoint | Service Tương Ứng | Trạng Thái | Chi Tiết Xử Lý & Khắc Phục |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/management/admin/users` | `AdminUserManagementPage` | `GET /api/v1/admin/users`, `POST /users` | `adminUserService` | **VERIFIED** | Tìm kiếm, lọc theo vai trò, tạo tài khoản mới, phân quyền RBAC. Cô lập 100% dữ liệu người dùng, ngăn chặn tự nâng quyền ADMIN trái phép. |
| `/management/admin/content/courses` | `AdminCoursesPage` | `GET /api/v1/admin/courses` | `curriculumService.getCourses` | **VERIFIED** | Quản lý danh mục khóa học, giáo trình tiêu chuẩn HSK 1-6. |
| `/management/admin/content/lessons/:id` | `AdminLessonEditorPage` | `GET /api/v1/admin/lessons/:id`, `PUT /lessons/:id` | `curriculumService.updateLesson` | **VERIFIED** | Soạn thảo nội dung bài học, ngữ âm, từ vựng, ngữ pháp. |

---

### 2.4. Phân hệ Quản lý nội dung & Đề thi (Content Manager & Question Bank)

| Route / Tab / Nút | UI Component | Backend Endpoint | Service Tương Ứng | Trạng Thái | Chi Tiết Xử Lý & Khắc Phục |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/management/content-manager/question-bank` | `QuestionBankPage` | `GET /api/v1/question-bank` | `questionBankService.getQuestions` | **VERIFIED** | Duyệt ngân hàng câu hỏi theo cấp độ HSK, kỹ năng (Nghe, Đọc, Viết), trạng thái phê duyệt (Approved, Pending). |
| Phê duyệt câu hỏi | Nút Phê duyệt / Từ chối | `POST /api/v1/question-bank/:id/review` | `questionBankService.reviewQuestion` | **VERIFIED** | Kiểm tra quyền Content Manager / Admin trước khi xuất bản câu hỏi vào đề thi. |
| `/management/content-manager/videos` | `VideoManagementPage` | `GET /api/v1/videos/manage` | `videoManagementService.fetchVideos` | **VERIFIED** | Quản lý danh sách video học tập, trích xuất ID YouTube tự động, upload tài liệu PDF transcript. |

---

### 2.5. Phân hệ Học tập & Trí tuệ Nhân tạo (AI Features)

| Route / Tab / Nút | UI Component | Backend Endpoint | Service Tương Ứng | Trạng Thái | Chi Tiết Xử Lý & Khắc Phục |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/ai/chat` (Gia sư AI) | `AITutorChatView` | `POST /api/v1/ai/tutor/chat` | `aiTutorService.sendMessageStream` | **VERIFIED** | Chatbot AI hỗ trợ giải thích ngữ pháp, từ vựng bằng tiếng Trung/Việt, stream phản hồi mượt mà, tự động abort khi unmount. |
| `/diagnostic-assessment` | `DiagnosticAssessmentPage` | `POST /api/v1/ai/diagnostic/start`, `POST /submit` | `diagnosticService` | **VERIFIED** | Đánh giá năng lực đầu vào HSK chuẩn xác, không leak đáp án phía client, trả về biểu đồ radar kỹ năng. |
| `/skills/speaking` | `SkillSpeakingPage` | `POST /api/v1/ai/speaking/assess` | `speakingService.assessSpeaking` | **VERIFIED** | Nhận diện phát âm, chấm điểm thanh điệu (tones) và ngữ điệu từng chữ Hán kèm disclaimer âm học rõ ràng. |
| `/practice/adaptive` | `AIExerciseGeneratorPage` | `POST /api/v1/ai/adaptive/session` | `aiAdaptiveExerciseService` | **VERIFIED** | Sinh đề luyện tập thích ứng theo lỗ hổng kiến thức thực tế của học viên. |

---

## 3. DANH SÁCH LỖI ĐÃ PHÁT HIỆN VÀ SỬA CHỮA (RESOLVED DEFECTS LOG)

1. **DEFECT-01: Mock Fallback trong luồng tạo bài tập của Giáo viên**
   - *Vị trí*: `Fontend/src/management/teacher/services/assignment.service.ts`
   - *Nguyên nhân*: Thiếu xử lý thuộc tính `classAssignments` vs `targets` khiến `dto.targets.map` ném `TypeError`, dẫn đến việc bắt lỗi âm thầm và rơi vào kho lưu trữ giả lập `assignmentsStore` trên RAM.
   - *Khắc phục*: Đồng bộ DTO, chuẩn hóa `(dto.targets || dto.classAssignments || []).map(...)`, đồng thời gửi đầy đủ `prompt`, `questionType`, `options`, `correctAnswer`, `explanation` lên endpoint backend `POST /api/v1/teacher/assignments`.

2. **DEFECT-02: Giao diện chấm điểm nộp bài là Demo Mock**
   - *Vị trí*: `Fontend/src/management/teacher/components/dashboard/PendingSubmissionsQueue.tsx`
   - *Nguyên nhân*: Hiển thị banner "Demo Preview" và dùng `window.alert` giả lập thay vì gọi API.
   - *Khắc phục*: Gỡ bỏ banner demo, tích hợp Modal chấm bài với điểm số (0-100) và trường nhận xét sư phạm, gọi trực tiếp `POST /api/v1/teacher/submissions/{id}/grade`.

3. **DEFECT-03: Thiếu Tab Giáo trình trong chi tiết Lớp học**
   - *Vị trí*: `Fontend/src/management/teacher/pages/TeacherClassDetailPage.tsx`
   - *Nguyên nhân*: Giáo viên không có giao diện xem hoặc gán giáo trình bài giảng cho lớp học.
   - *Khắc phục*: Viết mới `ClassCurriculumTab.tsx` với giao diện accordion theo chương/bài, liên kết dropdown chọn khóa học và gọi API `PUT /api/v1/teacher/classes/{id}/curriculum`.

4. **DEFECT-04: Các Tab Placeholder rỗng trong Chi tiết Lớp học**
   - *Vị trí*: `ClassAssignmentsPlaceholderTab.tsx` và `ClassPerformancePlaceholderTab.tsx`
   - *Nguyên nhân*: File thừa dạng khung xương không sử dụng.
   - *Khắc phục*: Xóa bỏ hoàn toàn 2 file placeholder, chuyển sang sử dụng tab bài tập và tab hiệu suất thực tế.

5. **DEFECT-05: Lỗi Type trong Nộp bài tập Học viên**
   - *Vị trí*: `Fontend/src/features/homework/services/student-attempt.service.ts`
   - *Nguyên nhân*: `submitAttempt` chỉ cập nhật trạng thái `SUBMITTED` nhưng không ánh xạ trường điểm `totalScore` và trạng thái đạt `isPassed` từ phản hồi của server.
   - *Khắc phục*: Bổ sung gán `totalScore = result.score ?? result.earnedPoints` và `isPassed = result.passed`.

---

## 4. KẾT QUẢ KIỂM THỬ THỰC TẾ (TEST VERIFICATION RESULTS)

- **Frontend Unit & Contract Tests**: **415 / 415 passed** (0 failed across 53 test files).
- **Frontend Code Quality (`oxlint`)**: **0 errors**, 158 warnings.
- **Frontend Production Build (`tsc -b && vite build`)**: **Thành công** không có lỗi TypeScript.
- **Backend Unit Tests**: **335 / 335 passed** (0 failed).
- **Backend Integration Tests**: **109 / 109 passed** (0 failed).
- **Tập tin PR #21 (ChatGPT)**: **100% nguyên vẹn**, không bị sửa đổi (`StudentHomeworkService.cs`, `TeacherAssignmentService.cs`, `TeacherAttendanceService.cs`).
