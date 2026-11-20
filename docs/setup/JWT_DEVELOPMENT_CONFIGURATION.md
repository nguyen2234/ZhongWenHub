# CẤU HÌNH JWT VÀ USER SECRETS TRONG MÔI TRƯỜNG PHÁT TRIỂN (LOCAL DEVELOPMENT)

Tài liệu này hướng dẫn chi tiết cơ chế bảo mật và các bước cấu hình JWT Secret cho các nhà phát triển làm việc trên dự án ZhongWenHub mà **không bao giờ commit secret thật vào Git**.

---

## 1. NGUYÊN NHÂN LỖI THỰC TẾ

Khi khởi động Backend bằng lệnh:
```powershell
dotnet run --project Backend/src/Api
```
Nếu hệ thống gặp lỗi:
```text
System.InvalidOperationException:
Cấu hình 'JwtSettings:Secret' là bắt buộc và phải có độ dài tối thiểu 32 ký tự (256-bit).
Vui lòng cấu hình qua .NET User Secrets (Development) hoặc biến môi trường JwtSettings__Secret (Production/Testing).
Không được đặt secret thật trong appsettings.json.
   at ZhongWenHub.Business.DependencyInjection.AddBusiness(IServiceCollection services, IConfiguration configuration)
   at Program.<Main>$(String[] args)
```

**Nguyên nhân gốc:**
1. Trong `Backend/src/Api/appsettings.json`, giá trị `"JwtSettings:Secret"` được để trống `""` theo chuẩn an ninh DevSecOps để tránh rò rỉ secret lên kho mã nguồn Git public/shared.
2. Mã nguồn tại `Backend/src/Business/DependencyInjection.cs` kiểm tra nghiêm ngặt `string.IsNullOrWhiteSpace(jwtSettings.Secret) || jwtSettings.Secret.Length < 32`.
3. Khi khởi chạy trên máy phát triển mới mà chưa khởi tạo hoặc chưa nạp bí mật qua **.NET User Secrets**, ứng dụng sẽ kích hoạt cơ chế phòng vệ Fail-Fast và dừng lại ngay khi khởi động.

---

## 2. CƠ CHẾ NẠP CẤU HÌNH CỦA ASP.NET CORE

ASP.NET Core nạp cấu hình theo thứ tự ưu tiên tăng dần (nguồn sau ghi đè nguồn trước):
1. `appsettings.json` (Cấu hình chung, secret để trống).
2. `appsettings.{Environment}.json` (Ví dụ: `appsettings.Testing.json` cho kiểm thử tự động).
3. **User Secrets** (Chỉ được nạp tự động khi `ASPNETCORE_ENVIRONMENT = Development` và có `<UserSecretsId>` trong `.csproj`).
4. **Biến môi trường (Environment Variables)** (Ví dụ: `JwtSettings__Secret`).
5. Tham số dòng lệnh (Command-line arguments).

Nhờ thứ tự này, trong môi trường `Development`, lập trình viên cấu hình secret riêng biệt trên máy cá nhân thông qua User Secrets, hoàn toàn độc lập với kho lưu trữ mã nguồn Git.

---

## 3. HƯỚNG DẪN THIẾT LẬP USER SECRETS TỪNG BƯỚC

Mỗi lập trình viên khi bắt đầu làm việc trên máy mới thực hiện các bước sau:

### Bước 1: Di chuyển vào thư mục dự án API
```powershell
cd D:\ZhongWenHub\Backend\src\Api
```

### Bước 2: Kiểm tra UserSecretsId
Đảm bảo tệp `Backend/src/Api/ZhongWenHub.Api.csproj` đã có thẻ `<UserSecretsId>` trong `<PropertyGroup>`:
```xml
<PropertyGroup>
  <TargetFramework>net10.0</TargetFramework>
  <UseAppHost>false</UseAppHost>
  <Nullable>enable</Nullable>
  <ImplicitUsings>enable</ImplicitUsings>
  <UserSecretsId>ff8bb778-9d4d-4411-a24b-a8566cfe8744</UserSecretsId>
</PropertyGroup>
```
*(Nếu chưa có, chạy lệnh `dotnet user-secrets init`)*.

### Bước 3: Tạo và thiết lập chuỗi bí mật an toàn (>= 32 ký tự)
Tạo một chuỗi ngẫu nhiên có độ dài tối thiểu 32 ký tự (256-bit hoặc 384/512-bit) và gán vào User Secrets:
```powershell
# Tạo và thiết lập trực tiếp qua CLI
dotnet user-secrets set "JwtSettings:Secret" "YOUR_LOCAL_SECURE_RANDOM_SECRET_KEY_AT_LEAST_32_CHARS_LONG"
```
*Lưu ý: Tệp bí mật của bạn được lưu an toàn tại `%APPDATA%\Microsoft\UserSecrets\<UserSecretsId>\secrets.json`, hoàn toàn nằm ngoài thư mục repository.*

### Bước 4: Kiểm tra danh sách User Secrets đã thiết lập
```powershell
dotnet user-secrets list
```
Kết quả hiển thị:
```text
JwtSettings:Secret = YOUR_LOCAL_SECURE_RANDOM_SECRET_KEY...
```

---

## 4. CẤU HÌNH LAUNCHSETTINGS.JSON

Tệp `Backend/src/Api/Properties/launchSettings.json` quản lý môi trường khi chạy `dotnet run`:
```json
{
  "profiles": {
    "http": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,
      "launchUrl": "swagger",
      "applicationUrl": "http://127.0.0.1:5000",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```
Khi `ASPNETCORE_ENVIRONMENT` là `Development`, ASP.NET Core sẽ tự động nạp User Secrets từ máy cục bộ của bạn.

---

## 5. CẤU HÌNH CHO MÔI TRƯỜNG TESTING

Đối với chạy kiểm thử tự động (Integration Tests, E2E), môi trường được đặt là `Testing`. Tệp `Backend/src/Api/appsettings.Testing.json` được cấu hình secret kiểm thử riêng biệt:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.\\SQLEXPRESS;Database=ZhongWenHub_Test;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "JwtSettings": {
    "Secret": "ZhongWenHub_IntegrationTest_Super_Secret_Key_32_Bytes_Long_2026!"
  }
}
```
Nhờ đó, test runners có thể khởi chạy và thực thi kiểm thử trên cơ sở dữ liệu `ZhongWenHub_Test` mà không phụ thuộc vào User Secrets cục bộ của từng nhà phát triển.

---

## 6. NGUYÊN TẮC AN TOÀN TUYỆT ĐỐI (SECURITY GUIDELINES)

1. **Tuyệt đối không hardcode secret** vào `appsettings.json`, mã nguồn C#, hay bất kỳ tệp nào được commit lên Git.
2. Tệp `appsettings.json` phải luôn giữ:
   ```json
   "JwtSettings": {
     "Secret": "",
     ...
   }
   ```
3. Secret trong môi trường Production phải được cung cấp qua Secret Store an toàn (như Azure Key Vault, AWS Secrets Manager, GitHub Actions Secrets) hoặc biến môi trường `JwtSettings__Secret`.

---

## 7. CÁCH XỬ LÝ KHI CLONE MÃ NGUỒN SANG MÁY MỚI

Khi bạn clone repository sang máy tính mới:
1. Chạy `git status` và `git pull` để nhận code mới nhất.
2. Di chuyển vào thư mục API: `cd Backend/src/Api`.
3. Chạy lệnh thiết lập User Secrets cho máy mới:
   ```powershell
   dotnet user-secrets set "JwtSettings:Secret" "<chuoibi_mat_ngau_nhien_it_nhat_32_ky_tu>"
   ```
4. Chạy `dotnet run` để bắt đầu làm việc.

---

## 8. PHÂN BIỆT CÁC MÔI TRƯỜNG

| Môi trường | Nguồn cung cấp JWT Secret | Cơ sở dữ liệu mặc định | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **Development** | .NET User Secrets | `ZhongWenHub_Dev` (Read-only khi debug) | Lập trình, phát triển tính năng cục bộ |
| **Testing** | `appsettings.Testing.json` / Test Factory | `ZhongWenHub_Test` | Chạy Unit Tests, Integration Tests, E2E |
| **Production** | Biến môi trường / Cloud Secrets Store | `ZhongWenHub_Prod` | Môi trường triển khai thực tế, mã hóa 256-bit+ |

---

## 9. CÁC LỖI THƯỜNG GẶP VÀ CÁCH KHẮC PHỤC (TROUBLESHOOTING)

### Lỗi 1: `System.InvalidOperationException: Cấu hình 'JwtSettings:Secret' là bắt buộc...`
- **Nguyên nhân:** Chưa thiết lập User Secrets trên máy hoặc chạy với môi trường khác `Development` mà không có biến môi trường.
- **Khắc phục:** Chạy `dotnet user-secrets list` trong thư mục `Backend/src/Api`. Nếu trống, chạy lại lệnh `dotnet user-secrets set "JwtSettings:Secret" "..."`.

### Lỗi 2: Độ dài Secret nhỏ hơn 32 ký tự
- **Nguyên nhân:** Chuỗi bí mật quá ngắn (chưa đạt tiêu chuẩn 256-bit).
- **Khắc phục:** Chọn chuỗi có độ dài từ 32 ký tự trở lên (khuyến nghị 48-64 ký tự).

### Lỗi 3: Chạy `dotnet run` không nhận User Secrets
- **Nguyên nhân:** Biến `ASPNETCORE_ENVIRONMENT` bị ghi đè thành `Production` hoặc `Staging`.
- **Khắc phục:** Kiểm tra `launchSettings.json` hoặc chạy với cờ `--environment Development`:
  ```powershell
  dotnet run --project Backend/src/Api --environment Development
  ```
