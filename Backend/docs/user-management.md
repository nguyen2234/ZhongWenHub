# QUẢN LÝ NGƯỜI DÙNG VÀ TÀI KHOẢN (USER MANAGEMENT API)

**Dự án:** ZhongWenHub  
**Phân hệ:** Quản trị Người dùng & Phân quyền (Admin Users & RBAC)  
**Phiên bản:** BE-2 (v2.0.0)

---

## 1. TỔNG QUAN PHÂN HỆ

Phân hệ Quản trị Người dùng cung cấp đầy đủ các endpoint phục vụ màn hình Admin Users trên Frontend:
- Thống kê tổng quan KPIs học viên (Tổng số, Đang hoạt động, Bị khóa, Mới 30 ngày qua).
- Tìm kiếm học viên đa tiêu chí (Tên, Email, Tên đăng nhập).
- Lọc theo Trạng thái tài khoản (`ACTIVE`, `INACTIVE`, `LOCKED`, `SUSPENDED`).
- Lọc theo Cấp độ HSK (`HSK 1` đến `HSK 7–9`).
- Lọc theo Vai trò (`SUPER_ADMIN`, `ADMIN`, `CONTENT_MANAGER`, `TEACHER`, `SUPPORT`, `STUDENT`).
- Sắp xếp và phân trang theo chuẩn `PagedResponse<T>`.
- Xem chi tiết học viên bao gồm hồ sơ, ghi chú quản trị và thống kê học tập telemetry.
- Khóa tài khoản kèm lý do kiểm tra và thu hồi tức thì mọi phiên đăng nhập của người dùng bị khóa.
- Mở khóa tài khoản trở lại hoạt động bình thường.
- Cập nhật vai trò với cơ chế bảo vệ phân tầng ngăn chặn leo quyền trái phép.

---

## 2. CHI TIẾT ENDPOINTS VÀ EXAMPLES

### 2.1. Thống kê KPIs học viên
- **Endpoint:** `GET /api/v1/admin/users/kpis`
- **Quyền:** `UserManagementAccess` (`SUPER_ADMIN`, `ADMIN`)
- **Response 200 OK:**
  ```json
  {
    "totalLearners": 42,
    "activeLearners": 38,
    "lockedLearners": 3,
    "newLearners30d": 12
  }
  ```

### 2.2. Lấy danh sách người dùng phân trang
- **Endpoint:** `GET /api/v1/admin/users`
- **Query Parameters:**
  - `search`: Chuỗi tìm kiếm (tên, email, username).
  - `status`: `ALL`, `ACTIVE`, `LOCKED`, `INACTIVE`.
  - `hskLevel`: `ALL`, `HSK 1`, `HSK 2`, `HSK 3`, ...
  - `role`: `STUDENT`, `TEACHER`, `ADMIN`, ...
  - `page`: Số trang (mặc định = 1).
  - `pageSize`: Kích thước trang (mặc định = 20, tối đa = 100).
  - `sortBy`: `joinedDate`, `name`, `lastActive`, `hskLevel`.
  - `sortDirection`: `asc` | `desc`.
- **Response 200 OK:**
  ```json
  {
    "items": [
      {
        "id": "19594c13-fe6c-4c51-b223-08e3aaf66786",
        "name": "Học Viên Mẫu",
        "email": "student@example.com",
        "avatarUrl": null,
        "hskLevel": "HSK 1",
        "status": "ACTIVE",
        "roles": ["STUDENT"],
        "progressPercentage": 0,
        "joinedAt": "29/10/2026",
        "joinedDateRaw": "2026-10-29",
        "lastActiveAt": "29/10/2026 15:15",
        "lastActiveDateRaw": "2026-10-29T15:15:10.5392264Z"
      }
    ],
    "pageNumber": 1,
    "currentPage": 1,
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
  ```

### 2.3. Xem chi tiết người dùng
- **Endpoint:** `GET /api/v1/admin/users/{id}`
- **Response 200 OK:**
  ```json
  {
    "id": "19594c13-fe6c-4c51-b223-08e3aaf66786",
    "name": "Học Viên Mẫu",
    "email": "student@example.com",
    "avatarUrl": null,
    "hskLevel": "HSK 1",
    "status": "ACTIVE",
    "roles": ["STUDENT"],
    "phone": null,
    "notes": "Học viên xuất sắc",
    "lockReason": null,
    "lockedAt": null,
    "learningSummary": {
      "currentHsk": "HSK 1",
      "totalXp": 0,
      "streakDays": 0,
      "completedLessons": 0,
      "totalLessons": 35,
      "progressPercentage": 0,
      "vocabularyMastered": 0,
      "srsReviewDue": 0,
      "lastStudySession": "29/10/2026"
    }
  }
  ```

### 2.4. Khóa tài khoản
- **Endpoint:** `POST /api/v1/admin/users/{id}/lock`
- **Request Body:**
  ```json
  {
    "reason": "Vi phạm quy chế học tập và thi thử"
  }
  ```
- **Response 200 OK:** Trả về `AdminUserDetailDto` đã cập nhật trạng thái `LOCKED`.

### 2.5. Mở khóa tài khoản
- **Endpoint:** `POST /api/v1/admin/users/{id}/unlock`
- **Response 200 OK:** Trả về `AdminUserDetailDto` đã phục hồi trạng thái `ACTIVE`.

### 2.6. Cập nhật vai trò người dùng
- **Endpoint:** `PUT /api/v1/admin/users/{id}/roles`
- **Request Body:**
  ```json
  {
    "roles": ["TEACHER", "CONTENT_MANAGER"]
  }
  ```
- **Quy tắc an toàn:**
  - Chặn Admin thường cấp quyền `SUPER_ADMIN`.
  - Chặn người dùng tự thay đổi vai trò của mình.
  - Chặn gỡ bỏ Super Admin duy nhất của hệ thống.
