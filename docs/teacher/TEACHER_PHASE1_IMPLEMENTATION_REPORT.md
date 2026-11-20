# Báo Cáo Triển Khai: Phân Hệ Giáo Viên - Giai Đoạn 1 (Teacher Module Phase 1)
**Hệ thống:** ZhongWenHub  
**Chi nhánh làm việc:** `feature/teacher-core-phase1`  
**Ngày hoàn thành:** 19/11/2026  
**Trạng thái:** Hoàn thành toàn diện, sẵn sàng kiểm tra độc lập (ChatGPT Independent Review)

---

## 1. Tổng Quan Kiến Trúc (Architecture Overview)

Phase 1 chuyển đổi Teacher Portal từ kiến trúc phụ thuộc dữ liệu mô phỏng (Mock Data / In-memory Store) sang hệ thống Backend thực thi trên nền tảng **ASP.NET Core (.NET 10)**, ánh xạ quan hệ qua **Entity Framework Core**, và lưu trữ bền vững trên **SQL Server**.

### Luồng Xử Lý (End-to-End Flow)
```
[Frontend (React + TS)]
      │
      ▼  (HTTP + Bearer JWT Token)
[Api: TeacherClassesController (/api/v1/teacher/*)]
      │  [Authorize(Policy = PolicyConstants.TeacherAccess)]
      ▼
[Business: TeacherClassService]
      ├── ICurrentUserService (Fail-closed authentication & Data ownership enforcement)
      ├── Dynamic Derived Enrollment Calculation (Không lưu cột đếm tĩnh)
      └── Schedule Validation (startTime < endTime, không trùng lịch)
      │
      ▼
[Data: ApplicationDbContext]
      ├── teaching_classes (Bảng lớp học)
      ├── teaching_class_members (Bảng ghi danh thành viên, Composite Index [ClassId, StudentId])
      └── teaching_class_schedules (Bảng thời khóa biểu tuần)
      │
      ▼
[SQL Server / Database] (Tuân thủ nghiêm ngặt Zero-Write DB Rule - Chỉ tạo migration file)
```

---

## 2. Thiết Kế Cơ Sở Dữ Liệu (Database Schema)

### 2.1. Thực Thể Lớp Giảng Dạy (`teaching_classes`)
- `Id` (Guid, PK): Định danh duy nhất của lớp học.
- `TeacherId` (Guid, FK -> `AspNetUsers.Id`): Khóa ngoại bắt buộc xác định giáo viên phụ trách (Data Ownership).
- `Name` (NVARCHAR(200), Required): Tên lớp học (vd: "HSK 3 Giao Tiếp K24").
- `Code` (NVARCHAR(50), Required, Unique Index): Mã lớp học duy nhất (vd: "CLS-HSK3-024").
- `Description` (NVARCHAR(2000)): Mô tả tóm tắt nội dung và mục tiêu lớp học.
- `HskLevelId` (NVARCHAR(50), Required): Cấp độ HSK mục tiêu (vd: "level-hsk-3").
- `CourseId` (Guid?, FK -> `Courses.Id`, Nullable): Khóa ngoại tùy chọn liên kết với giáo trình hệ thống.
- `Status` (NVARCHAR(20), Required): Trạng thái vòng đời (`DRAFT`, `UPCOMING`, `ACTIVE`, `COMPLETED`, `ARCHIVED`).
- `Capacity` (INT): Sĩ số tối đa của lớp học.
- `StartDate` (DATETIME2, Required): Ngày khai giảng.
- `EndDate` (DATETIME2, Nullable): Ngày bế giảng dự kiến.
- `LocationType` (NVARCHAR(20), Required): Hình thức đào tạo (`ONLINE`, `OFFLINE`, `HYBRID`).
- `MeetingUrl` (NVARCHAR(500), Nullable): Đường dẫn phòng học trực tuyến (Google Meet/Zoom).
- `RoomLocation` (NVARCHAR(200), Nullable): Phòng học thực tế (dành cho Offline/Hybrid).
- `IsArchived` (BIT, Default 0): Cờ đánh dấu lớp đã được chuyển vào lưu trữ.
- `ArchivedAt` (DATETIME2, Nullable): Thời điểm lưu trữ.
- `CreatedAt`, `UpdatedAt` (DATETIME2): Dấu vết thời gian chuẩn từ `BaseEntity`.

### 2.2. Thực Thể Thành Viên Lớp Học (`teaching_class_members`)
- `Id` (Guid, PK): Định danh bản ghi ghi danh.
- `ClassId` (Guid, FK -> `teaching_classes.Id`, Cascade Delete): Khóa ngoại lớp học.
- `StudentId` (Guid, FK -> `AspNetUsers.Id`, Restrict Delete): Khóa ngoại trỏ đến tài khoản học viên.
- `EnrolledAt` (DATETIME2): Thời điểm ghi danh vào lớp.
- `Status` (NVARCHAR(20)): Trạng thái thành viên (`ACTIVE`, `PAUSED`, `DROPPED`, `COMPLETED`).
- `AttendanceRate` (FLOAT, Default 100.0): Tỷ lệ chuyên cần (%).
- `CompletedAssignmentsCount` (INT, Default 0): Số lượng bài tập đã hoàn thành.
- `Notes` (NVARCHAR(500), Nullable): Ghi chú dành cho giáo viên.
- **Ràng buộc:** Unique Index trên cặp `[ClassId, StudentId]` ngăn chặn triệt để học viên bị ghi danh trùng lặp trong cùng một lớp.

### 2.3. Thực Thể Thời Khóa Biểu Tuần (`teaching_class_schedules`)
- `Id` (Guid, PK): Định danh buổi học cố định.
- `ClassId` (Guid, FK -> `teaching_classes.Id`, Cascade Delete): Khóa ngoại lớp học.
- `DayOfWeek` (NVARCHAR(20)): Thứ trong tuần (`MONDAY`, `TUESDAY`, ..., `SUNDAY`).
- `StartTime` (NVARCHAR(10)): Giờ bắt đầu (định dạng `HH:mm`).
- `EndTime` (NVARCHAR(10)): Giờ kết thúc (định dạng `HH:mm`).
- `Timezone` (NVARCHAR(50)): Múi giờ chuẩn (mặc định `"Asia/Ho_Chi_Minh"`).
- `LocationType` (NVARCHAR(20)): Hình thức đào tạo buổi học (`ONLINE`, `OFFLINE`, `HYBRID`).
- `MeetingUrl` (NVARCHAR(500), Nullable): Link phòng học riêng của buổi học.
- `RoomLocation` (NVARCHAR(200), Nullable): Phòng học riêng của buổi học.

### 2.4. EF Core Migration
- Đã sinh migration file: `20261119064142_AddTeacherClassManagementEntities.cs`
- **Zero-Write DB Rule:** Không áp dụng migration lên cơ sở dữ liệu `ZhongWenHub_Dev` hoặc Production khi chưa có phê duyệt từ cấp quản trị.

---

## 3. Danh Sách Endpoint RESTful API

Tất cả các endpoint đặt tại prefix `/api/v1/teacher/`, yêu cầu xác thực JWT với chính sách `PolicyConstants.TeacherAccess` (chấp nhận role `TEACHER` hoặc `ADMIN`).

| STT | Phương thức | Đường dẫn API | Mô tả nghiệp vụ |
|---|---|---|---|
| 1 | `GET` | `/api/v1/teacher/classes` | Lấy danh sách lớp học (hỗ trợ phân trang, tìm kiếm, lọc HSK, trạng thái, hình thức học, sắp xếp). |
| 2 | `GET` | `/api/v1/teacher/classes/{classId}` | Lấy chi tiết đầy đủ của lớp (kèm HSK, thời khóa biểu, tổng hợp thành viên). |
| 3 | `POST` | `/api/v1/teacher/classes` | Tạo lớp học mới (tự động gán TeacherId từ JWT context, kiểm tra mã lớp duy nhất, validate lịch học). |
| 4 | `PUT` | `/api/v1/teacher/classes/{classId}` | Cập nhật thông tin lớp học và cập nhật nguyên khối thời khóa biểu tuần. |
| 5 | `DELETE` | `/api/v1/teacher/classes/{classId}` | Lưu trữ lớp học (Archive class), chuyển `Status = "ARCHIVED"` và ẩn khỏi danh sách lớp đang dạy. |
| 6 | `POST` | `/api/v1/teacher/classes/{classId}/archive` | Alias endpoint cho chức năng lưu trữ lớp học. |
| 7 | `GET` | `/api/v1/teacher/classes/{classId}/members` | Lấy danh sách học viên trong lớp (kèm tìm kiếm tên/email, lọc trạng thái). |
| 8 | `POST` | `/api/v1/teacher/classes/{classId}/members` | Ghi danh học viên vào lớp (kiểm tra sĩ số tối đa, chống trùng lặp, hỗ trợ kích hoạt lại học viên DROPPED/PAUSED). |
| 9 | `DELETE` | `/api/v1/teacher/classes/{classId}/members/{studentId}` | Xóa học viên khỏi lớp học. |
| 10 | `GET` | `/api/v1/teacher/classes/{classId}/schedules` | Lấy thời khóa biểu tuần của lớp. |
| 11 | `PUT` | `/api/v1/teacher/classes/{classId}/schedules` | Thay thế toàn bộ thời khóa biểu tuần của lớp học (có validate thời gian hợp lệ). |
| 12 | `GET` | `/api/v1/teacher/dashboard` | Lấy dữ liệu bảng điều khiển: 4 chỉ số KPI thực tế, danh sách buổi dạy sắp tới, lớp đang phụ trách. |

---

## 4. Quyết Định Kỹ Thuật & Tính Bảo Mật

1. **Bảo Mật Quyền Sở Hữu (Fail-Closed Data Ownership):**
   - Trích xuất định danh giáo viên từ `ICurrentUserService.UserId`. Nếu người dùng chưa xác thực hoặc thiếu token, hệ thống lập tức từ chối với `UnauthorizedAccessException` (HTTP 401/403).
   - Giáo viên (`TEACHER`) chỉ có thể truy vấn và thao tác trên các lớp có `TeacherId == CurrentUserId`. Nếu truy cập lớp của giáo viên khác, hệ thống chặn với mã lỗi HTTP 403 Forbidden.
   - Quản trị viên (`ADMIN`) có quyền xem và can thiệp trên toàn bộ hệ thống lớp.
   - Không cho phép người dùng truyền hoặc giả mạo `TeacherId` hay `Code` trong payload update.
2. **Không Lưu Sĩ Số Tĩnh (Dynamic Derived Enrollment Count):**
   - Tuân thủ nguyên tắc thiết kế: Sĩ số thực tế của lớp không được lưu thành cột tĩnh trong bảng `teaching_classes` để tránh lệch pha dữ liệu do race conditions.
   - Sĩ số lớp được tính toán động (derived) từ số lượng bản ghi `teaching_class_members` có `Status == "ACTIVE"`.
3. **Validate Lịch Học Chặt Chẽ:**
   - Bắt buộc kiểm tra `StartTime < EndTime` cho từng buổi học.
   - Ngăn chặn trùng lặp ca dạy trên cùng một ngày trong tuần và cùng giờ bắt đầu.
4. **Tương Thích Ngược Tuyệt Đối (Zero Regression):**
   - Các phương thức tích hợp chéo phục vụ phân hệ làm bài tập của học viên (`getActiveClassIdsForStudent`, `getClassBasicInfo`) trong `teacherPortalService` được duy trì nguyên vẹn, đảm bảo không ảnh hưởng đến `assignment.service.ts` và `student-identity.adapter.ts`.
   - Cơ chế fallback linh hoạt trong `TeacherPortalService` giúp giao diện vận hành ổn định trong cả môi trường offline/mock testing lẫn môi trường production kết nối backend thật.

---

## 5. Kết Quả Kiểm Chứng & Thử Nghiệm

### 5.1. Backend Unit Tests (`ZhongWenHub.UnitTests`)
- Toàn bộ **316/316** unit tests chạy thành công (0 thất bại):
  - `GetClassesAsync_UnauthenticatedUser_ThrowsUnauthorizedAccessException`: Kiểm tra fail-closed khi thiếu ngữ cảnh xác thực.
  - `CreateClassAsync_ValidDto_CreatesClassWithTeacherIdAndSchedules`: Kiểm tra tạo lớp, gán tự động `TeacherId` và ánh xạ schedules.
  - `CreateClassAsync_DuplicateCode_ThrowsInvalidOperationException`: Kiểm tra bắt lỗi trùng mã lớp (case-insensitive).
  - `CreateClassAsync_InvalidScheduleTimeRange_ThrowsArgumentException`: Kiểm tra bắt lỗi giờ bắt đầu >= giờ kết thúc.
  - `TeacherOwnership_TeacherCannotAccessOrModifyAnotherTeachersClass`: Kiểm tra bảo vệ quyền sở hữu, ngăn chặn giáo viên khác truy cập/chỉnh sửa lớp.
  - `ClassMembers_AddAndRemoveStudent_UpdatesDynamicEnrollmentCorrectly`: Kiểm tra ghi danh, chống trùng học viên, chặn vượt sĩ số tối đa và cập nhật sĩ số động khi xóa học viên.
  - `Dashboard_CalculatesRealKpiMetricsAccurately`: Kiểm tra tính toán chính xác 4 chỉ số KPI thực tế từ cơ sở dữ liệu.

### 5.2. Backend Integration Tests (`ZhongWenHub.IntegrationTests`)
- Toàn bộ **109/109** integration tests chạy thành công (0 thất bại).

### 5.3. Frontend Unit Tests & Linter
- Linter (`bun run lint`): **0 lỗi** (0 errors).
- Frontend tests (`bun test src/tests`): **397/397 tests passed** (51 files, 0 thất bại), bao gồm file kiểm thử hợp đồng mới `teacher-class-management.test.ts`.

---

## 6. Định Hướng Cho Phase 2 (Teacher Portal Phase 2 Roadmap)

1. **Quản Lý Bài Tập Về Nhà (Assignment Lifecycle):**
   - Kết nối `assignment.service.ts` với SQL Server (`teaching_class_assignments`, `assignment_submissions`).
   - Hỗ trợ giáo viên giao bài theo lớp, theo bài học trong giáo trình hoặc đề luyện thi từ Ngân hàng đề thi.
2. **Quy Trình Chấm Điểm & Phản Hồi:**
   - Giao diện chấm bài viết/nói cho giáo viên kèm ghi âm nhận xét và chấm điểm chi tiết theo tiêu chí.
3. **Thống Kê Hiệu Suất Học Tập (Analytics & Attendance):**
   - Điểm danh theo từng buổi học dựa trên thời khóa biểu.
   - Biểu đồ phân tích độ chuyên cần và phân bố điểm số học viên trong từng lớp.
