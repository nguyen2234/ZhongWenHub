# BÁO CÁO NGHIỆM THU GIAI ĐOẠN BE-1 (BE-1 ACCEPTANCE REPORT)

**Dự án:** ZhongWenHub  
**Giai đoạn:** BE-1 (ASP.NET Core Web API + PostgreSQL + EF Core + Identity + JWT + RBAC)  
**Thời gian hoàn thành:** 28/10/2026  
**Trạng thái nghiệm thu:** ✅ **ĐẠT TOÀN DIỆN (READY FOR BE-2)**

---

## 1. Xác Nhận Workspace & Ranh Giới Độc Lập
- **Frontend Directory:** `D:\ZhongWenHub\Fontend`  
  *Cam kết tuân thủ:* **Không chỉnh sửa, không xóa mock data, không thay đổi router hay UI/UX của Frontend.** Toàn bộ mã nguồn Frontend được bảo toàn nguyên vẹn 100%.
- **Backend Directory:** `D:\ZhongWenHub\Backend`  
  Toàn bộ solution, projects, migrations, tests, docker-compose và tài liệu được triển khai bên trong thư mục Backend do người dùng chỉ định.
- **Git Repository:** Sử dụng chung repository `D:\ZhongWenHub` trên branch `feat/be-1-aspnetcore-foundation` theo đúng xác nhận từ người dùng.

---

## 2. Kiến Trúc Solution & Projects
- **Solution File:** `D:\ZhongWenHub\Backend\ZhongWenHub.sln`
- **Mô hình kiến trúc:** Clean Architecture (Onion Architecture).
  - `src/ZhongWenHub.Domain`: Thực thể miền, enums, hằng số, không phụ thuộc framework ngoài.
  - `src/ZhongWenHub.Application`: Hợp đồng dịch vụ, DTOs, phân trang, problem details.
  - `src/ZhongWenHub.Infrastructure`: EF Core, PostgreSQL Npgsql, ASP.NET Core Identity, JWT Service, Audit Logging, Seeder.
  - `src/ZhongWenHub.Api`: Web API Controllers, Exception Handling Middleware, Security Headers Middleware, Health Checks, OpenAPI/Swagger.

---

## 3. Cơ Sở Dữ Liệu PostgreSQL
- **Hệ thống CSDL:** PostgreSQL 18 cục bộ (port 5432) và Docker Compose (`postgres:16-alpine`).
- **Migrations:** Migration `20261028134736_InitialCreate` đã được tạo và áp dụng thành công trên cả hai cơ sở dữ liệu `zhongwenhub_dev` và `zhongwenhub_test`.
- **Cấu trúc bảng chuẩn hóa:**
  1. `users` (UUID PK, timestamptz, soft-delete, UserStatus enum)
  2. `roles` (6 vai trò hệ thống)
  3. `user_roles`
  4. `user_claims`
  5. `user_logins`
  6. `role_claims`
  7. `user_tokens`
  8. `refresh_tokens` (UUID PK, TokenHash SHA-256, timestamptz, index)
  9. `auth_audit_records` (UUID PK, action, IP, timestamptz, index)
  10. `__EFMigrationsHistory`

---

## 4. ASP.NET Core Identity & Bảo Mật JWT + RBAC
- **Identity:** Khóa tài khoản sau 5 lần nhập sai (`Lockout`), chính sách mật khẩu an toàn, email duy nhất.
- **Access Token:** Ký HMAC-SHA256, thời hạn 15 phút, chứa các claims `sub`, `email`, `name`, `username`, `role`, `roles`, `status`, `jti`.
- **Refresh Token:** Sinh số ngẫu nhiên 64 bytes bảo mật mật mã, chỉ lưu mã băm SHA-256 trong PostgreSQL, truyền qua `HttpOnly` Cookie (`SameSite=Lax`, `Path=/api/v1/auth`).
- **Token Rotation & Reuse Detection:**
  - Tự động xoay vòng token khi gia hạn.
  - Tự động thu hồi khẩn cấp toàn bộ các phiên làm việc của tài khoản nếu phát hiện refresh token cũ đã bị thu hồi được tái sử dụng (chống Replay Attack).
- **Phân quyền Role-Based & Policy-Based:**
  - 6 vai trò: `SUPER_ADMIN`, `ADMIN`, `CONTENT_MANAGER`, `TEACHER`, `SUPPORT`, `STUDENT`.
  - 7 chính sách: `SystemSettingsManage`, `UserManagementAccess`, `AdminAccess`, `ContentManagementAccess`, `TeacherAccess`, `SupportAccess`, `StudentAccess`.

---

## 5. Kết Quả Kiểm Thử (Test Execution Results)

Tổng cộng **29 tests** (14 Unit Tests + 15 Integration Tests) đều đạt **100% Pass**:

```text
Test run for ZhongWenHub.UnitTests.dll (.NETCoreApp,Version=v8.0)
Passed!  - Failed: 0, Passed: 14, Skipped: 0, Total: 14 (Duration: 71 ms)

Test run for ZhongWenHub.IntegrationTests.dll (.NETCoreApp,Version=v8.0)
Passed!  - Failed: 0, Passed: 15, Skipped: 0, Total: 15 (Duration: 1 s)
```

### Chi tiết các kịch bản kiểm thử:
- **Unit Tests:**
  - Sinh mã JWT hợp lệ và đầy đủ claims người dùng.
  - Sinh chuỗi Refresh Token ngẫu nhiên URL-safe và kiểm tra thời hạn.
  - Băm SHA-256 đồng nhất và bảo mật.
  - Trích xuất thông tin người dùng từ token đã hết hạn nhưng đúng chữ ký.
  - Vòng đời RefreshToken (`IsActive`, `IsExpired`, `IsRevoked`, `Revoke`).
  - Tính toán phân trang và cờ `hasPreviousPage`, `hasNextPage`.
  - Kiểm tra tính đầy đủ của 6 Roles và 7 Policies.
- **Integration Tests (Chạy trên PostgreSQL thật `zhongwenhub_test`):**
  - Đăng nhập thành công trả về JWT và thiết lập HttpOnly cookie.
  - Đăng nhập sai mật khẩu trả về 401 Problem Details.
  - Truy cập `/api/v1/auth/me` với Bearer token trả về 200 OK với profile.
  - Truy cập `/api/v1/auth/me` không có token trả về 401 Unauthorized Problem Details.
  - Xoay vòng Refresh Token thành công, sinh token mới và thu hồi token cũ.
  - Phát hiện hành vi tái sử dụng token đã thu hồi (Reuse Attack) -> trả về 401 cảnh báo bảo mật và vô hiệu hóa toàn bộ phiên.
  - Đăng xuất thành công, thu hồi token và xóa cookie.
  - Kiểm tra ma trận phân quyền: Học viên bị chặn 403 Forbidden khi vào API Admin.
  - Admin truy cập API Admin thành công nhưng bị chặn 403 khi vào API SuperAdmin.
  - SuperAdmin truy cập API SuperAdmin thành công.
  - Teacher, Support, ContentManager truy cập đúng API nghiệp vụ tương ứng.
  - Health check `/health` và `/api/v1/system/info` hoạt động chính xác.

---

## 6. Đánh Giá Bảo Mật (Security Review)
- Không có bất kỳ bí mật (secret/password) nào bị lộ trong mã nguồn Git (toàn bộ cấu hình mẫu an toàn đặt trong `.env.example`).
- Refresh Token không bao giờ lưu trữ dạng văn bản thuần trong cơ sở dữ liệu.
- Phản hồi lỗi không để lộ stack trace ra ngoài cho môi trường production.
- Middleware Security Headers được kích hoạt trên toàn bộ luồng HTTP.

---

## 7. Kết Luận
Giai đoạn BE-1 đã được triển khai hoàn chỉnh, sạch sẽ, đạt chuẩn kiến trúc doanh nghiệp và sẵn sàng cho các giai đoạn tiếp theo:

**READY FOR BE-2**
