# PHÂN TÍCH KHOẢNG CÁCH NGHIỆP VỤ PHÂN HỆ GIÁO VIÊN (TEACHER MODULE GAP ANALYSIS)

**Dự án:** ZhongWenHub  
**Thời điểm đánh giá:** 19/11/2026  
**Mục tiêu:** Xác định chi tiết mọi khoảng cách giữa hiện trạng hệ thống và yêu cầu hoàn chỉnh cho 12 phân vùng chức năng của Giáo viên.

---

## 1. MA TRẬN ĐỐI CHIẾU 12 PHÂN VÙNG CHỨC NĂNG

### Vùng 1: Teacher Dashboard
- **Yêu cầu:** Hiển thị 4 chỉ số KPI thực tế, danh sách buổi dạy sắp tới, lớp đang phụ trách, hàng đợi bài nộp cần chấm điểm, dòng thời gian hoạt động.
- **Hiện trạng:**
  - Backend: `GET /api/v1/teacher/dashboard` đã tính 4 KPIs từ cơ sở dữ liệu thật.
  - Frontend: `TeacherDashboardPage` đã gọi API thật cho KPI và lớp học, nhưng `PendingSubmissionsQueue` và `RecentActivityList` đang dùng dữ liệu mock trong `mockTeacherPortalData.ts`.
- **Khoảng cách cần xử lý:** Mở rộng `TeacherDashboardDto` để nạp dữ liệu bài tập có bài nộp đang chờ giáo viên chấm (`PendingSubmissionsCount`, danh sách bài nộp gần nhất).

---

### Vùng 2: Teacher Classes (Quản lý Lớp học)
- **Yêu cầu:** Xem danh sách lớp, tạo lớp, sửa lớp, chuyển vào lưu trữ (`Archive`), lọc theo trạng thái/cấp độ HSK/hình thức đào tạo, tìm kiếm từ khóa, phân trang.
- **Hiện trạng:** ĐÃ HOÀN TẤT trong Phase 1 (kết nối trực tiếp SQL Server qua `TeacherClassesController`).
- **Khoảng cách cần xử lý:** Không có khoảng cách chức năng. Cần duy trì tương thích khi mở rộng.

---

### Vùng 3: Class Members (Thành viên Lớp học)
- **Yêu cầu:** Xem danh sách học viên, thêm học viên vào lớp (kiểm tra sĩ số tối đa, chống trùng lặp), xóa học viên khỏi lớp, cập nhật tỷ lệ chuyên cần và số bài tập hoàn thành.
- **Hiện trạng:**
  - Đã có thêm/xóa học viên trong `TeacherClassesController`.
  - Tuy nhiên, `AttendanceRate` và `CompletedAssignmentsCount` hiện đang mặc định tĩnh khi thêm mới học viên.
- **Khoảng cách cần xử lý:** Cập nhật động hai chỉ số này dựa trên bảng điểm danh thật và bảng nộp bài tập thật của học viên.

---

### Vùng 4: Class Schedules (Thời khóa biểu Lớp học)
- **Yêu cầu:** Cấu hình lịch học các thứ trong tuần, giờ bắt đầu, giờ kết thúc, địa điểm/link học trực tuyến. Validate thời gian hợp lệ (`startTime < endTime`) và chống trùng ca dạy.
- **Hiện trạng:** ĐÃ HOÀN TẤT trong Phase 1 (kết nối trực tiếp SQL Server qua `teaching_class_schedules`).
- **Khoảng cách cần xử lý:** Không có khoảng cách.

---

### Vùng 5: Attendance (Điểm danh Học viên)
- **Yêu cầu:**
  - Giáo viên có thể điểm danh học viên cho từng buổi học theo lịch dạy hoặc ngày cụ thể.
  - Hỗ trợ các trạng thái: Có mặt (`PRESENT`), Vắng mặt (`ABSENT`), Đi muộn (`LATE`), Có phép (`EXCUSED`).
  - Tự động tổng hợp tỷ lệ chuyên cần (`AttendanceRate = (Present + Late * 0.8 + Excused) / TotalSessions * 100`).
- **Hiện trạng:** **HOÀN TOÀN CHƯA CÓ TRÊN BACKEND LẪN FRONTEND.**
- **Khoảng cách cần xử lý:**
  1. Tạo thực thể `TeachingClassAttendance`.
  2. Tạo API `GET /api/v1/teacher/classes/{classId}/attendance` (lọc theo ngày/buổi).
  3. Tạo API `POST /api/v1/teacher/classes/{classId}/attendance` (ghi nhận điểm danh hàng loạt).
  4. Tạo giao diện điểm danh trực quan trong tab Lịch học hoặc modal chuyên dụng.

---

### Vùng 6: Teaching Curriculum (Giáo trình Giảng dạy)
- **Yêu cầu:** Gắn kết lớp học với Giáo trình HSK chuẩn quốc tế (HSK 1–4) và các bài học cụ thể do Quản trị viên/Content Manager đã xuất bản. Giáo viên không thể dùng bài học chưa duyệt bản quyền.
- **Hiện trạng:** `TeachingClass.CourseId` có thể lưu ID giáo trình, nhưng chưa có luồng hiển thị danh sách bài học thuộc giáo trình đó cho lớp.
- **Khoảng cách cần xử lý:**
  1. Endpoint `GET /api/v1/teacher/classes/{classId}/curriculum` trả về cấu trúc giáo trình và các bài học đã xuất bản (`Published`).
  2. Frontend hiển thị tab hoặc danh sách giáo trình được chỉ định cho lớp.

---

### Vùng 7: Assignments (Quản lý Bài tập Về nhà)
- **Yêu cầu:**
  - Tạo, chỉnh sửa, lưu trữ bài tập với các tham số: Tiêu đề, mô tả, cấp độ HSK, thời gian làm bài (`TimeLimitMinutes`), số lần làm bài tối đa (`MaxAttempts`), chính sách tính điểm (`HIGHEST_SCORE`, `LATEST_ATTEMPT`, `AVERAGE_SCORE`), điểm đạt (`PassingPoints`), chính sách nộp muộn (`AllowLateSubmission`, `LatePenaltyPercent`), đảo câu hỏi (`ShuffleQuestions`), hiển thị đáp án sau khi làm (`ShowCorrectAnswers`).
  - Vòng đời trạng thái: Bản nháp (`DRAFT`) → Đã xuất bản (`PUBLISHED`) → Đã đóng (`CLOSED`) → Lưu trữ (`ARCHIVED`).
- **Hiện trạng:**
  - Backend: **CHƯA CÓ GÌ.**
  - Frontend: `TeacherAssignmentsPage` hiển thị giao diện đẹp nhưng lưu vào `assignmentsStore` trong RAM.
- **Khoảng cách cần xử lý:**
  1. Tạo thực thể `TeachingAssignment` trong SQL Server.
  2. Xây dựng `TeacherAssignmentsController` với đầy đủ CRUD và các transition trạng thái an toàn.
  3. Viết lại `assignment.service.ts` để gọi API thật.

---

### Vùng 8: Assignment Questions (Câu hỏi Bài tập)
- **Yêu cầu:**
  - Bài tập gồm nhiều câu hỏi với đa dạng định dạng: Trắc nghiệm đơn, trắc nghiệm nhiều lựa chọn, điền từ vào chỗ trống, đúng/sai, tự luận ngắn.
  - Mỗi câu hỏi có: Tiêu đề/đề bài (`Prompt`), danh sách lựa chọn (`OptionsJson`), đáp án chính xác (`CorrectAnswer`), lời giải thích (`Explanation`), thang điểm (`Points`), thứ tự sắp xếp (`OrderIndex`).
  - Giáo viên có thể tự soạn câu hỏi mới HOẶC chọn câu hỏi đã được kiểm duyệt từ Ngân hàng câu hỏi (`QuestionBankItem`).
- **Hiện trạng:**
  - Backend: Chưa có thực thể `AssignmentQuestion`.
  - Frontend: `AssignmentQuestionPickerModal` đọc 20 câu hỏi tĩnh từ `mockQuestionCatalog.ts`.
- **Khoảng cách cần xử lý:**
  1. Tạo thực thể `AssignmentQuestion` có liên kết tùy chọn `QuestionBankItemId`.
  2. Mở quyền cho giáo viên (`PolicyConstants.TeacherAccess`) tra cứu câu hỏi `Approved` từ `QuestionBankController`.
  3. Cập nhật `AssignmentQuestionPickerModal` gọi trực tiếp API Ngân hàng câu hỏi.

---

### Vùng 9: Assignment Targets (Phân bổ Bài tập tới Lớp học)
- **Yêu cầu:** Một bài tập có thể được giao cho một hoặc nhiều lớp học do chính giáo viên đó phụ trách, mỗi lớp có thể có hạn nộp (`DueDate`) riêng.
- **Hiện trạng:** Chưa có thực thể `AssignmentTarget`.
- **Khoảng cách cần xử lý:**
  1. Tạo bảng quan hệ nhiều-nhiều `assignment_targets` (`AssignmentId`, `ClassId`, `DueDate`, `AssignedAt`).
  2. Kiểm tra quyền sở hữu chặt chẽ: Giáo viên chỉ được chỉ định các lớp có `TeacherId == CurrentUserId`.

---

### Vùng 10: Student Submissions (Học viên Nộp bài)
- **Yêu cầu:**
  - Học viên xem danh sách bài tập được giao từ các lớp mình đã ghi danh (`my-enrolled-classes`).
  - Khi bắt đầu làm bài: Hệ thống sinh lượt làm (`AttemptNumber`), ghi nhận thời điểm bắt đầu (`StartedAt`).
  - Bảo vệ đáp án: Client học viên tuyệt đối không nhận được `CorrectAnswer` và `Explanation` trong quá trình làm bài.
  - Nộp bài: Gửi danh sách câu trả lời của học viên lên server, tính toán thời gian làm bài (`TimeSpentSeconds`).
- **Hiện trạng:** Hoàn toàn thiếu vắng trên Backend.
- **Khoảng cách cần xử lý:**
  1. Tạo thực thể `StudentAssignmentSubmission`.
  2. Xây dựng `StudentHomeworkController` (`GET /api/v1/student/homework`, `POST start`, `POST submit`).
  3. Kết nối `StudentHomeworkListPage` với API Backend thật.

---

### Vùng 11: Grading and Feedback (Chấm điểm & Phản hồi)
- **Yêu cầu:**
  - **Tự động chấm (Auto-Grading):** Khi học viên nộp bài, hệ thống tự động so khớp đáp án các câu trắc nghiệm khách quan (Single Choice, Multiple Choice, Fill Blank, True/False) và tính tổng điểm sơ bộ.
  - Nếu bài tập chỉ chứa câu trắc nghiệm: Chuyển thẳng trạng thái sang `GRADED`.
  - Nếu có câu tự luận: Chuyển trạng thái sang `GRADING` (Chờ chấm).
  - **Giáo viên chấm bài:** Giáo viên xem bài nộp, chấm điểm câu tự luận, điều chỉnh điểm tổng, nhập lời nhận xét sư phạm (`FeedbackNote`).
- **Hiện trạng:** Chưa có logic chấm điểm trên server.
- **Khoảng cách cần xử lý:**
  1. Xây dựng công cụ Auto-grading trong `StudentHomeworkService`.
  2. Xây dựng API `POST /api/v1/teacher/submissions/{id}/grade` cho phép giáo viên nhập điểm và nhận xét.

---

### Vùng 12: Student Progress Reports (Báo cáo Tiến độ Học tập)
- **Yêu cầu:**
  - Thống kê tỷ lệ hoàn thành bài tập của từng học viên trong lớp.
  - Thống kê phân bố điểm số (Giỏi, Khá, Trung bình, Yếu) của cả lớp.
  - Bảng tổng hợp thành tích trong tab Báo cáo (`ClassPerformanceTab`).
- **Hiện trạng:** Tab `ClassPerformancePlaceholderTab.tsx` chỉ là placeholder rỗng.
- **Khoảng cách cần xử lý:**
  1. Endpoint `GET /api/v1/teacher/classes/{classId}/performance` tổng hợp dữ liệu từ bảng điểm danh và bảng nộp bài.
  2. Thay thế placeholder tab bằng component báo cáo biểu đồ trực quan thật.

---

## 2. KẾ HOẠCH BỎ MOCK VÀ LÀM SẠCH CODEBASE

Các file mock cần loại bỏ khỏi luồng production hoặc chuyển hẳn vào thư mục fixtures kiểm thử:
1. `Fontend/src/management/teacher/data/mockAssignmentData.ts` -> Không import trong `assignment.service.ts` nữa.
2. `Fontend/src/management/teacher/data/mockQuestionCatalog.ts` -> Không import trong `AssignmentQuestionPickerModal.tsx` nữa.
3. `Fontend/src/management/teacher/data/mockTeacherPortalData.ts` -> Loại bỏ các biến `INITIAL_CLASS_MEMBERS`, `INITIAL_DEMO_SUBMISSIONS`, `INITIAL_RECENT_ACTIVITIES` khỏi luồng runtime.
4. `CURRENT_TEACHER_ID` -> Thay thế toàn diện bằng `useAuth()` hoặc thông tin lấy từ token.
