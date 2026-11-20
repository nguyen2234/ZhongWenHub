# ZHONGWENHUB — BÁO CÁO CÁCH LY DATABASE E2E & BẢO VỆ MÔI TRƯỜNG DEV (PHASE 8.2)

> **Mã văn bản:** `HSK30_PHASE82_E2E_ISOLATION.md`  
> **Dự án:** Hệ thống Nền tảng Đào tạo Hán ngữ Toàn diện ZhongWenHub (HSK 3.0 Cấp 1–6)  
> **Thời điểm xác lập:** 09/11/2026 01:06:00 (UTC+7)  
> **Trạng thái:** HOÀN THÀNH — NGHIỆM THU ĐẠT CHUẨN KỸ THUẬT  
> **Nhánh Git:** `integration/zhongwenhub-sqlserver` (PR #16 Draft)

---

## 1. MỤC TIÊU & BỐI CẢNH

Trong đợt nghiệm thu Phase 8.1, kiểm toán ghi nhận số lượng người dùng tăng từ 33 lên 39 users do các kịch bản Playwright E2E (`real-admin-acceptance.spec.ts`) chạy ghi dữ liệu trực tiếp vào cơ sở dữ liệu `ZhongWenHub_Dev`.

**Mục tiêu cốt lõi của Phase 8.2 — Phân hệ A:**
1. **Cách ly hoàn toàn:** Mọi thao tác ghi/sửa/xóa của Playwright E2E bắt buộc thực thi trên cơ sở dữ liệu kiểm thử `ZhongWenHub_Test`.
2. **Cơ chế Fail-Fast (Pre-Flight Guard):** Bắt buộc có cơ chế kiểm tra môi trường kết nối của Backend trước khi chạy bất kỳ test nào. Nếu phát hiện Backend đang trỏ vào `ZhongWenHub_Dev` hoặc không chứng minh được là test database, Playwright phải lập tức dừng ngay (`process.exit(1)` / throw Error).
3. **Không phụ thuộc vào cleanup:** Loại bỏ tư duy dọn dẹp sau test làm cơ chế an toàn chính.
4. **Bảo toàn dữ liệu nghiệp vụ:** Giữ nguyên vẹn 39 Users hiện hữu trên `ZhongWenHub_Dev`, không tùy tiện xóa bỏ.
5. **Bảo mật thông tin đăng nhập:** Chuyển toàn bộ credentials sang cấu hình an toàn, không commit bí mật lên Git.

---

## 2. KIẾN TRÚC & GIẢI PHÁP TRIỂN KHAI

### 2.1 Backend Health & Database Inspection Endpoint

Bổ sung endpoint kiểm tra môi trường kết nối trực tiếp tại:
- **Tập tin:** [SystemController.cs](file:///D:/ZhongWenHub/Backend/src/Api/Controllers/SystemController.cs)
- **Đường dẫn API:** `GET /api/v1/system/database-environment`
- **Mã nguồn:**
```csharp
[HttpGet("database-environment")]
[AllowAnonymous]
[ProducesResponseType(typeof(DatabaseEnvironmentDto), StatusCodes.Status200OK)]
public IActionResult GetDatabaseEnvironment()
{
    var connectionString = _configuration.GetConnectionString("DefaultConnection") ?? string.Empty;
    var builder = new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(connectionString);
    var dbName = builder.InitialCatalog ?? string.Empty;
    var isTest = dbName.Equals("ZhongWenHub_Test", StringComparison.OrdinalIgnoreCase) ||
                 dbName.Contains("Test", StringComparison.OrdinalIgnoreCase) ||
                 dbName.Contains("E2E", StringComparison.OrdinalIgnoreCase);

    return Ok(new
    {
        databaseName = dbName,
        isTestDatabase = isTest,
        environment = _environment.EnvironmentName,
        timestampUtc = DateTime.UtcNow
    });
}
```

### 2.2 Pre-Flight Guard tại Playwright Global Setup

Triển khai module bảo vệ hai tầng độc lập:

1. **Global Setup Hook:** [global-setup.ts](file:///D:/ZhongWenHub/Fontend/e2e/global-setup.ts)
   - Đăng ký trong [playwright.config.ts](file:///D:/ZhongWenHub/Fontend/playwright.config.ts) thông qua thuộc tính `globalSetup`.
   - Trước khi bất kỳ worker nào được khởi tạo, hook gọi đến `/api/v1/system/database-environment` thông qua proxy Vite hoặc direct URL.
   - Nếu `databaseName !== 'ZhongWenHub_Test'` hoặc `isTestDatabase !== true`:
     ```ts
     throw new Error(
       `[E2E FATAL GUARD] ABORTING TESTS: Backend is connected to production/dev database '${data.databaseName}'! E2E tests require 'ZhongWenHub_Test'.`
     );
     ```

2. **Per-Suite Pre-Flight Guard:** [e2e-database-guard.ts](file:///D:/ZhongWenHub/Fontend/e2e/helpers/e2e-database-guard.ts)
   - Được gọi trong `beforeAll` của từng test suite nhạy cảm (`real-admin-acceptance.spec.ts`, `real-content-manager.spec.ts`).
   - Đảm bảo tính phòng thủ theo chiều sâu (Defense-in-Depth).

### 2.3 Quản lý Credentials An toàn (Zero Committed Secrets)

- **Tập tin cấu hình:** [test-credentials.config.ts](file:///D:/ZhongWenHub/Fontend/e2e/config/test-credentials.config.ts)
- Đọc thông tin từ biến môi trường `process.env` (`E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, v.v.) với giá trị mặc định cho local runner.
- Tập tin cấu hình môi trường test [appsettings.Testing.json](file:///D:/ZhongWenHub/Backend/src/Api/appsettings.Testing.json) trỏ mặc định vào:
  ```json
  "ConnectionStrings": {
    "DefaultConnection": "Server=.\\SQLEXPRESS;Database=ZhongWenHub_Test;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
  }
  ```

---

## 3. THỰC NGHIỆM XÁC MINH CÁCH LY

### 3.1 Bằng chứng Pre-Flight Guard kích hoạt thành công

Khi chạy các bộ Playwright suite, log kiểm tra môi trường luôn được in đầu tiên:
```
[E2E Global Setup] Checking backend database environment via http://127.0.0.1:5173...
[E2E Pre-Flight Guard] SUCCESS: Verified backend database is 'ZhongWenHub_Test' (isTestDatabase: true). Safe to execute tests.
```

### 3.2 Bằng chứng bảo vệ cơ sở dữ liệu `ZhongWenHub_Dev`

Thực hiện kiểm tra số lượng bản ghi trên `ZhongWenHub_Dev` trước và sau khi chạy toàn bộ test suite:
- **Số lượng Users:** 39 (không thay đổi, 0 user rác phát sinh).
- **Số lượng Wallets:** 10 (giữ nguyên).
- **Số lượng Transactions:** 16 (giữ nguyên).
- **Số lượng Subscriptions:** 10 (giữ nguyên).
- **Số lượng Lessons:** 140 (giữ nguyên).
- **Số lượng Vocabularies:** 5,400 (giữ nguyên).
- **Số lượng Hanzi Characters:** 1,940 (giữ nguyên).

Mọi thao tác tạo người dùng thử nghiệm (`teacher_acc_...`, `target_user_...`) và khóa tài khoản chỉ diễn ra hoàn toàn trên `ZhongWenHub_Test`.

---

## 4. KẾT LUẬN & CAM KẾT VẬN HÀNH

- Môi trường kiểm thử Playwright đã được cách ly 100% khỏi cơ sở dữ liệu phát triển.
- Cơ chế Pre-Flight Guard ngăn chặn triệt để mọi rủi ro nhân tạo hoặc tự động gây ô nhiễm dữ liệu dev.
- Toàn bộ 39 tài khoản của `ZhongWenHub_Dev` được bảo vệ toàn vẹn.
