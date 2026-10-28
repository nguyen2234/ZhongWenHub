# MA TRẬN PHÂN QUYỀN HỆ THỐNG (RBAC & POLICY MATRIX)

## 1. Danh Mục Vai Trò (System Roles)

| Mã Vai Trò | Tên Hiển Thị | Quyền Hạn Trọng Tâm |
| :--- | :--- | :--- |
| `SUPER_ADMIN` | Quản trị viên tối cao | Toàn quyền kiểm soát hệ thống, thiết lập cấp cao, quản trị người dùng và vai trò |
| `ADMIN` | Quản trị viên vận hành | Vận hành toàn diện, duyệt nội dung, giải quyết khiếu nại, xem thống kê |
| `CONTENT_MANAGER`| Quản lý học liệu | Quản lý lộ trình HSK, từ vựng, ngữ pháp, bài tập, video, phụ đề và lỗi học liệu |
| `TEACHER` | Giáo viên | Quản lý lớp học, chấm bài tập, giao bài và tương tác học viên |
| `SUPPORT` | Chăm sóc khách hàng | Tiếp nhận vé hỗ trợ (tickets), phản ánh học liệu từ học viên và chuyển tiếp liên phòng ban |
| `STUDENT` | Học viên | Học bài theo lộ trình, làm bài tập, xem video, gửi vé hỗ trợ |

---

## 2. Ma Trận Chính Sách Ủy Quyền (Policy-Based Authorization Matrix)

| Chính Sách (Policy) | `SUPER_ADMIN` | `ADMIN` | `CONTENT_MANAGER` | `TEACHER` | `SUPPORT` | `STUDENT` | Mô Tả Nghiệp Vụ |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **SystemSettingsManage** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | Cấu hình tham số hệ thống, bảo mật nâng cao |
| **UserManagementAccess** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Quản lý danh sách tài khoản, khóa/mở tài khoản |
| **AdminAccess** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Truy cập phân hệ điều hành quản trị |
| **ContentManagementAccess** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | Quản lý kho video, từ vựng HSK, ngữ pháp, lỗi nội dung |
| **TeacherAccess** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | Nghiệp vụ sư phạm, lớp học và chấm bài |
| **SupportAccess** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | Xử lý vé hỗ trợ, CSKH và tiếp nhận phản ánh |
| **StudentAccess** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Quyền truy cập các tiện ích nền tảng học tập |

---

## 3. Ranh Giới Kiểm Soát Bảo Mật
1. **Phía Client (Frontend):** Phân quyền chỉ nhằm phục vụ tối ưu hóa trải nghiệm người dùng (UX: ẩn/hiện menu, bảo vệ router).
2. **Phía Server (Backend):** Mọi request đều được thẩm định độc lập tại tầng middleware và Controller qua thuộc tính `[Authorize(Policy = "...")]`.
3. **Phòng chống giả mạo:** Máy chủ **tuyệt đối không** tin cậy vai trò gửi từ client. Vai trò được trích xuất trực tiếp từ chữ ký số của JWT Token đã được xác minh bằng khóa bí mật máy chủ.
