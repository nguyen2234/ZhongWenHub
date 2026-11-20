# MA TRẬN PHÂN QUYỀN RBAC (AUTHORIZATION MATRIX)

**Dự án:** ZhongWenHub  
**Chuẩn:** ASP.NET Core Policy-Based Authorization  
**Phiên bản:** BE-2 (v2.0.0)

---

## 1. SÁU VAI TRÒ CHÍNH THỨC VÀ PHẠM VI TRÁCH NHIỆM

| Mã Vai trò | Tên Vai trò | Mô tả Trách nhiệm & Quyền hạn |
| :--- | :--- | :--- |
| `SUPER_ADMIN` | Quản trị viên tối cao | Toàn quyền kiểm soát hệ thống; cấu hình hệ thống; quản lý Super Admin & Admin; quản trị bảo mật; gán và thu hồi mọi vai trò. |
| `ADMIN` | Quản trị viên vận hành | Quản lý người dùng, học viên, giáo viên, nhân viên hỗ trợ; theo dõi dashboard vận hành và thống kê KPI; **không thể** tự nâng quyền hoặc can thiệp Super Admin. |
| `CONTENT_MANAGER`| Quản lý học liệu | Quản lý lộ trình HSK, từ vựng, ngữ pháp, bài tập, video, phụ đề và kiểm duyệt chất lượng nội dung học tập. |
| `TEACHER` | Giáo viên giảng dạy | Quản lý lớp học được phân công, chấm điểm bài tập, giao bài và theo dõi kết quả học viên trong lớp phụ trách. |
| `SUPPORT` | Nhân viên hỗ trợ | Xử lý vé hỗ trợ (tickets), chăm sóc học viên và tiếp nhận báo cáo phản ánh chất lượng nội dung. |
| `STUDENT` | Học viên | Tham gia các khóa học, làm bài tập, làm flashcards SRS, luyện kỹ năng và quản lý hồ sơ cá nhân. |

---

## 2. MA TRẬN AUTHORIZATION POLICY VÀ VAI TRÒ

| Policy Tên | `SUPER_ADMIN` | `ADMIN` | `CONTENT_MANAGER` | `TEACHER` | `SUPPORT` | `STUDENT` | Mô tả Policy |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **SystemSettingsManage** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | Quản lý tham số hệ thống, biến môi trường, bảo mật cấp cao |
| **UserManagementAccess** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Quản lý danh sách người dùng, trạng thái khóa/mở khóa và vai trò |
| **AdminAccess** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Truy cập Admin Dashboard và các công cụ vận hành |
| **ContentManagementAccess** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | Quản lý kho video, từ vựng HSK, ngữ pháp, bài tập |
| **TeacherAccess** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | Quản lý lớp học, bài tập và theo dõi học viên |
| **SupportAccess** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | Quản lý và xử lý ticket phản hồi của học viên |
| **StudentAccess** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Truy cập cổng học viên và các tính năng học tập |

---

## 3. MA TRẬN BẢO MẬT USER MANAGEMENT ENDPOINTS

| Endpoint | Method | Policy yêu cầu | Quy tắc nghiệp vụ & Chống leo quyền |
| :--- | :---: | :--- | :--- |
| `/api/v1/admin/users` | `GET` | `UserManagementAccess` | Lọc, tìm kiếm, phân trang người dùng |
| `/api/v1/admin/users/kpis` | `GET` | `UserManagementAccess` | Lấy số liệu thống kê tổng, hoạt động, bị khóa, mới 30 ngày |
| `/api/v1/admin/users/{id}` | `GET` | `UserManagementAccess` | Xem chi tiết học viên và thông số học tập |
| `/api/v1/admin/users` | `POST` | `UserManagementAccess` | Tạo người dùng. **Chỉ SUPER_ADMIN mới được tạo tài khoản có vai trò SUPER_ADMIN.** |
| `/api/v1/admin/users/{id}` | `PUT` | `UserManagementAccess` | Cập nhật thông tin. **ADMIN không được sửa tài khoản SUPER_ADMIN.** |
| `/api/v1/admin/users/{id}/lock` | `POST` | `UserManagementAccess` | Khóa tài khoản kèm lý do. Thu hồi toàn bộ refresh token. **Không thể khóa Super Admin cuối cùng.** |
| `/api/v1/admin/users/{id}/unlock` | `POST` | `UserManagementAccess` | Mở khóa tài khoản trở lại trạng thái ACTIVE. |
| `/api/v1/admin/users/{id}/status` | `PATCH` | `UserManagementAccess` | Cập nhật trạng thái trực tiếp (`ACTIVE`, `LOCKED`, `INACTIVE`). |
| `/api/v1/admin/users/{id}/roles` | `PUT` | `UserManagementAccess` | Cập nhật vai trò. **Chặn tự leo quyền (Self-escalation), chặn Admin cấp SUPER_ADMIN, bảo vệ Super Admin cuối cùng.** |
