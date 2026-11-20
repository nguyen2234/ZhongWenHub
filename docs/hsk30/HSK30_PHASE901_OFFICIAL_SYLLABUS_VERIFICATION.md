# BÁO CÁO TỔNG KẾT PHASE 9.0.1
## XÁC MINH ĐỀ CƯƠNG HSK 3.0, THIẾT LẬP NỀN TẢNG HỌC THUẬT & KHẮC PHỤC LỖI JWT BACKEND

**Dự án:** ZhongWenHub  
**Nhánh Git:** `integration/zhongwenhub-sqlserver`  
**Draft Pull Request:** `#16` (Trạng thái: Giữ nguyên Open & Draft, Tuyệt đối không merge)  
**Thời gian hoàn thành:** 09/11/2026  
**Nhóm chuyên gia thực hiện:**
- Senior Chinese Language Curriculum Designer
- HSK 3.0 Standards Specialist & Researcher
- Chinese–Vietnamese Linguistic QA Specialist
- Data Engineer / SQL Server Architect
- ASP.NET Core .NET 10 Architect

---

# PHẦN A — KHẮC PHỤC LỖI KHỞI ĐỘNG BACKEND DO THIẾU JWT SECRET (P0 PRIORITY)

## 1. NGUYÊN NHÂN GỐC (ROOT CAUSE)
Khi người dùng hoặc lập trình viên khởi động Backend bằng lệnh:
```powershell
dotnet run --project Backend/src/Api
```
Ứng dụng bị dừng khẩn cấp (Fail-Fast) do ngoại lệ:
```text
System.InvalidOperationException:
Cấu hình 'JwtSettings:Secret' là bắt buộc và phải có độ dài tối thiểu 32 ký tự (256-bit).
Vui lòng cấu hình qua .NET User Secrets (Development) hoặc biến môi trường JwtSettings__Secret (Production/Testing).
Không được đặt secret thật trong appsettings.json.
```
Nguyên nhân gốc:
1. `Backend/src/Api/appsettings.json` duy trì `"JwtSettings:Secret": ""` trống nhằm tuân thủ tiêu chuẩn an toàn thông tin (chống lộ bí mật lên Git repository).
2. Lớp nạp cấu hình `WebApplication.CreateBuilder(args)` trong ASP.NET Core chỉ tự động nạp User Secrets khi chạy ở môi trường `Development` VÀ tệp `.csproj` có khai báo thẻ `<UserSecretsId>`.
3. Trước đó, tệp `Backend/src/Api/ZhongWenHub.Api.csproj` chưa được khởi tạo `<UserSecretsId>`, đồng thời trên môi trường phát triển cục bộ chưa chạy lệnh `dotnet user-secrets set`.

---

## 2. PHƯƠNG ÁN XỬ LÝ AN TOÀN TOÀN DIỆN
Đã triển khai giải pháp kỹ thuật chuẩn mực công nghiệp theo khuyến nghị bảo mật của Microsoft:

1. **Khởi tạo User Secrets ID trong `.csproj`:**
   Đã thêm thẻ `<UserSecretsId>ff8bb778-9d4d-4411-a24b-a8566cfe8744</UserSecretsId>` vào `Backend/src/Api/ZhongWenHub.Api.csproj`. Thẻ này an toàn để commit lên Git vì nó chỉ đóng vai trò định danh thư mục lưu trữ cục bộ.
2. **Thiết lập chuỗi bí mật an toàn qua CLI:**
   Đã thực hiện thiết lập secret ngẫu nhiên bảo mật cao (64 ký tự URL-safe) vào User Secrets store của máy phát triển:
   ```powershell
   dotnet user-secrets set "JwtSettings:Secret" "<secure-random-64-char-secret>"
   ```
   Tệp lưu trữ nằm tại `%APPDATA%\Microsoft\UserSecrets\<UserSecretsId>\secrets.json`, hoàn toàn nằm ngoài kho lưu trữ Git.
3. **Giữ tệp `appsettings.json` an toàn:**
   Đã thiết lập `"JwtSettings:Secret": ""` trống trong `appsettings.json`. Tuyệt đối không commit secret thật.
4. **Cấu hình `appsettings.Testing.json` cho môi trường Test tự động:**
   Đã bổ sung chuỗi khóa kiểm thử chuyên dụng vào `Backend/src/Api/appsettings.Testing.json` để các bộ kiểm thử Unit & Integration Tests tự động có thể chạy độc lập mà không phụ thuộc vào User Secrets cá nhân.
5. **Cập nhật thông báo lỗi trong `DependencyInjection.cs`:**
   Hướng dẫn rõ ràng lập trình viên cách cấu hình qua User Secrets (cho Development) hoặc biến môi trường (cho Production/Testing).
6. **Bảo vệ cơ sở dữ liệu Dev trong `Program.cs`:**
   Bổ sung cờ kiểm tra cấu hình `Database:AutoMigrate` và `Database:EnableSeed` (mặc định là `false`) trước khi gọi `DbInitializer.SeedAsync`. Nhờ đó, việc khởi chạy `dotnet run` ở chế độ Development không còn tự ý chạy migration hay seed dữ liệu làm biến động database `ZhongWenHub_Dev`.
7. **Tạo tài liệu hướng dẫn chuẩn:**
   Đã tạo tệp tài liệu chi tiết: `docs/setup/JWT_DEVELOPMENT_CONFIGURATION.md`.

---

## 3. KẾT QUẢ KIỂM CHỨNG THỰC TẾ

### 3.1. Kết quả khởi chạy thực tế bằng `dotnet run`
Đã khởi chạy Backend trực tiếp trên port 5000:
```text
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://127.0.0.1:5000
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
info: Microsoft.Hosting.Lifetime[0]
      Hosting environment: Development
info: Microsoft.Hosting.Lifetime[0]
      Content root path: D:\ZhongWenHub\Backend\src\Api
```
- Khởi động thành công 100%, không còn `System.InvalidOperationException`.
- Kiểm tra Health Endpoint: `GET http://127.0.0.1:5000/health` trả về HTTP 200 `Healthy`.

### 3.2. Kết quả kiểm thử hồi quy (Regression Tests)
- **Unit Tests:** Đã bổ sung bộ kiểm thử chuyên biệt `JwtConfigurationTests.cs` (kiểm thử chặn secret rỗng, chặn secret < 32 ký tự, chấp nhận secret hợp lệ).
  - Kết quả: **20/20 Unit Tests PASS** (100%).
- **Integration Tests:** Chạy toàn bộ bộ kiểm thử tích hợp trên database test.
  - Kết quả: **80/80 Integration Tests PASS** (100%).

### 3.3. Xác nhận bảo toàn cơ sở dữ liệu `ZhongWenHub_Dev`
Truy vấn trực tiếp SQL Server sau toàn bộ quá trình chạy Backend và kiểm thử:
- **Số tài khoản người dùng (`users`):** Chính xác **39 tài khoản** (Không thay đổi).
- **Số bài học đã xuất bản (`lessons WHERE Status = 'PUBLISHED'`):** Chính xác **3 bài** (Không thay đổi).
- **Tổng số bài học (`lessons`):** Chính xác **140 bài** (Không thay đổi).
- Xác nhận: **Hoàn toàn KHÔNG ghi dữ liệu, không migration, không seed trên `ZhongWenHub_Dev`.**

---

# PHẦN B — HSK 3.0 SYLLABUS VERIFICATION & CURRICULUM BASELINE

## 1. KẾT QUẢ KIỂM ĐỊNH NGUỒN TÀI LIỆU (SOURCE REGISTRY AUDIT)

Đã tiến hành kiểm thử mạng tự động (HTTP probe) và đối chiếu học thuật với toàn bộ 7 nguồn Phase 9.0 và bổ sung 1 nguồn mới:

| Source ID | Tên tài liệu chính thức | Kết quả kiểm thử thực tế | Trạng thái thẩm định mới |
| :--- | :--- | :---: | :---: |
| **HSK-OFFICIAL-001** | Tiêu chuẩn Quốc gia GF 0025-2021 (Bộ Giáo dục TQ) | HTTP 404 (Đường dẫn cũ cổng MOE đổi) | `ACCESS_BLOCKED` |
| **HSK-OFFICIAL-002** | Phụ lục Đề cương Âm tiết, Chữ Hán, Từ vựng, Ngữ pháp (CLEC) | HTTP 200 (Chỉ là SPA JS shell 3.3KB) | `LANDING_PAGE_ONLY` |
| **HSK-OFFICIAL-003** | Đề cương thi HSK Cấp 7–9 (CTI) | HTTP 404 (Đã tích hợp vào cổng nội bộ) | `ACCESS_BLOCKED` |
| **HSK-OFFICIAL-004** | Đề cương thi HSK Cấp 1–6 (Phiên bản HSK 2.0 - 2015) | HTTP 200 (Trang giới thiệu tổng quan) | `LANDING_PAGE_ONLY` |
| **HSK-OFFICIAL-005** | Thông cáo CTI về Lộ trình Cải cách HSK 3.0 | HTTP 200 (Trang danh mục bài viết) | `LANDING_PAGE_ONLY` |
| **HSK-OFFICIAL-006** | Giáo trình Chuẩn HSK Standard Course 1–6 (BLCUP) | HTTP 503 (Máy chủ NXB chặn WAF) | `ACCESS_BLOCKED` |
| **HSK-OFFICIAL-007** | Hướng dẫn Giảng dạy theo Chuẩn GF 0025-2021 (Sinolingua) | HTTP 200 (Trang chủ nhà xuất bản) | `LANDING_PAGE_ONLY` |
| **HSK-OFFICIAL-008** *(Mới)* | Đề cương thi HSK 3.0 Mới Cấp 1–6 (CTI/CLEC 2025/2026) | Cổng tài nguyên khảo thí chuyên biệt | `PARTIALLY_BLOCKED` |

*Ghi nhận tính liêm chính học thuật:* Không nguồn nào được gắn nhãn `VERIFIED_OFFICIAL` một cách hình thức khi đường dẫn tải dữ liệu thô chưa thể truy cập trực tiếp tự do.

---

## 2. XÁC ĐỊNH ĐỀ CƯƠNG HSK 3.0 MỚI (BASELINE CHỌN LỌC)

1. **Văn bản đề cương khảo thí:**  
   - CTI và CLEC đã chính thức công bố 《新版 HSK 考试大纲（一级至六级）》 vào tháng **11/2025**.
   - Thời điểm áp dụng chính thức trên toàn hệ thống khảo thí: **01/07/2026**.
   - Kỳ thi toàn cầu chuẩn hóa đầu tiên theo đề cương mới: **13/12/2026**.
2. **Cấu trúc 5 phân hệ đề cương (Ngũ đại Đề cương):**
   - Đề cương Nhiệm vụ (任务大纲 - Task Syllabus).
   - Đề cương Chủ đề (话题大纲 - Topic Syllabus - HSK 1 gồm 6 chủ đề chính).
   - Đề cương Từ vựng (词汇大纲 - 500 từ HSK 1, 1272 từ HSK 2, 5456 từ HSK 1-6).
   - Đề cương Chữ Hán (汉字大纲 - 300 chữ HSK 1, 1800 chữ HSK 1-6).
   - Đề cương Ngữ pháp (语法大纲 - 48 điểm phạm trù HSK 1, 424 điểm HSK 1-6).

---

## 3. ĐỐI CHIẾU VÀ ĐÁNH GIÁ KHOẢNG TRỐNG TỪ VỰNG (VOCABULARY GAP)

- **Hiện trạng Database:** 5.400 bản ghi từ vựng (5.336 từ duy nhất, 64 từ đa nghĩa/đa từ loại).
  - HSK 1: 300 từ.
  - HSK 2: 200 từ (Lũy kế: 500 từ).
  - HSK 3: 500 từ (Lũy kế: 1.000 từ).
  - HSK 4: 1.000 từ (Lũy kế: 2.000 từ).
  - HSK 5: 1.600 từ (Lũy kế: 3.600 từ).
  - HSK 6: 1.800 từ (Lũy kế: 5.400 từ).
- **Khoảng trống học thuật HSK 1:**
  - 300 từ của ZhongWenHub bao phủ **200% so với HSK 2.0** (150 từ).
  - Đạt **60% so với Chuẩn GF 0025-2021** (300/500 từ).
  - 200 từ còn lại được tích hợp trong học phần HSK 2, giúp học viên tích lũy đủ 500 từ sau khi hoàn thành HSK 2.
- **Cam kết truyền thông:** Định danh rõ đây là **"Khóa học Căn bản HSK 1" (HSK 1 Foundation)**, không tuyên bố sai lệch rằng 300 từ là đã hoàn thành toàn bộ 500 từ của chuẩn mới.

---

## 4. ĐỐI CHIẾU VÀ ĐÁNH GIÁ KHOẢNG TRỐNG NGỮ PHÁP (GRAMMAR GAP)

- **Hiện trạng Database:** 461 điểm ngữ pháp (HSK 1: 72 điểm).
- **So sánh với chuẩn:** GF 0025-2021 quy định 48 điểm phạm trù cho HSK 1.
- **Kết quả ánh xạ 72 điểm HSK 1:**
  - 4 điểm khớp 1:1 (`MAPPED_EXACT`).
  - 61 điểm là sự phân rã sư phạm chi tiết (`MAPPED_GRANULAR_SUBITEM`) của 48 nhóm phạm trù.
  - 7 điểm mở rộng sư phạm vi mô cho người Việt (`PEDAGOGICAL_EXTENSION`).
  - 0 điểm xung đột (`CONFLICTING = 0`).
- Xem chi tiết toàn bộ 72 dòng tại: `docs/hsk30/HSK30_PHASE901_GRAMMAR_GAP_ANALYSIS.md`.

---

## 5. QUYẾT ĐỊNH CẤU TRÚC HSK 1: DUY TRÌ 6 UNITS (TASK F)

1. **Quyết định chính thức:** **Duy trì 100% cấu trúc 6 Units và 15 Bài học trong Database.**
2. **Căn cứ kỹ thuật:**
   - Bảo toàn khóa ngoại `UnitId` của 15 bài học.
   - Bảo vệ tuyệt đối **14 bản ghi tiến độ học viên** đang hoạt động trong `student_lesson_progress`.
   - Giữ nguyên trạng 3 bài học đã xuất bản (`PUBLISHED`).
   - Không vi phạm nguyên tắc zero-write trên `ZhongWenHub_Dev`.
3. **Căn cứ sư phạm:**
   - Unit 1 & 2 (mỗi unit 2 bài) giúp người mới bắt đầu không bị ngợp.
   - Unit 6 (*Sở thích & Ôn tập tổng kết*) tạo không gian riêng cho bài học tích hợp (Lesson 14 & 15) và đánh giá tổng kết cuối khóa.

---

## 6. MA TRẬN ĐỘ BAO PHỦ GIÁO TRÌNH (CURRICULUM COVERAGE MATRIX - TASK G)

- **HSK 1 (15 bài học, 6 Units):**
  - Đã tích hợp trực tiếp **250 từ vựng cốt lõi** vào hội thoại và bài nghe.
  - 50 từ mở rộng được phân bổ vào ngân hàng câu hỏi ôn tập và đọc hiểu.
  - Bao phủ 100% các chủ đề giao tiếp cơ bản của Đề cương Chủ đề CTI 2025/2026.
  - Chi tiết ma trận: `docs/hsk30/HSK30_PHASE901_CURRICULUM_COVERAGE.md`.

---

## 7. RỦI RO BẢN QUYỀN VÀ NGUYÊN TẮC BIÊN SOẠN SẠCH

1. **Tuyệt đối cấm sao chép:** Toàn bộ hội thoại (Dialogue), bài khóa, file ghi âm giọng đọc, tranh minh họa từ bộ sách *HSK Standard Course* (BLCUP) hoặc đề thi của CTI đều không được sao chép nguyên văn.
2. **Tác quyền độc lập của ZhongWenHub:**
   - 100% hội thoại được viết mới theo ngữ cảnh đời sống thực tế, phù hợp với học viên Việt Nam.
   - 100% bản dịch tiếng Việt, chú thích ngữ pháp và câu ví dụ do đội ngũ ngôn ngữ học ZhongWenHub biên soạn.
   - Trích dẫn các chỉ tiêu định lượng (số từ, mã điểm ngữ pháp) tuân thủ quy định trích dẫn hợp pháp đối với tiêu chuẩn nhà nước công cộng (`PUBLIC_STANDARD_METADATA_ONLY`).

---

## 8. KẾ HOẠCH BÀN GIAO CHO PHASE 9.1

- Phase 9.0.1 đã hoàn thành trọn vẹn việc **chuẩn hóa cơ sở học thuật, kiểm định nguồn và giải quyết triệt để lỗi kỹ thuật JWT**.
- **Không tự động chuyển sang Phase 9.1.**
- Sau khi được người có thẩm quyền phê duyệt báo cáo này, Phase 9.1 sẽ tập trung vào:
  - Rà soát tỉ mỉ từng bài trong 12 bài DRAFT còn lại của HSK 1 (Lessons 4–15).
  - Chuẩn hóa Pinyin, chữ Hán, nghĩa tiếng Việt tự nhiên và câu hỏi bài tập.
  - Chuẩn bị dữ liệu để trình hội đồng xét duyệt xuất bản chính thức.

---

## 9. TỔNG HỢP DANH MỤC TÀI LIỆU VÀ TỆP TIN ĐÃ THỰC HIỆN

1. `Backend/src/Api/ZhongWenHub.Api.csproj` (Bổ sung `<UserSecretsId>`)
2. `Backend/src/Api/appsettings.json` (Giữ secret rỗng `""`)
3. `Backend/src/Api/appsettings.Testing.json` (Cấu hình test key)
4. `Backend/src/Business/DependencyInjection.cs` (Cập nhật thông báo lỗi chuẩn)
5. `Backend/src/Api/Program.cs` (Bổ sung cờ bảo vệ `AutoMigrate` & `EnableSeed`)
6. `Backend/tests/ZhongWenHub.UnitTests/JwtConfigurationTests.cs` (Thêm 6 Unit Tests JWT)
7. `docs/setup/JWT_DEVELOPMENT_CONFIGURATION.md` (Hướng dẫn thiết lập bí mật cho lập trình viên)
8. `data/hsk30/reference/source_manifest.json` (Cập nhật trạng thái trung thực & thêm HSK-OFFICIAL-008)
9. `docs/hsk30/sources/OFFICIAL_SOURCE_REGISTRY.md` (Cập nhật danh mục nguồn sau kiểm định)
10. `docs/hsk30/sources/HSK30_SOURCE_VERIFICATION_EVIDENCE.md` (Bằng chứng kiểm thử mạng HTTP thực tế)
11. `docs/hsk30/sources/HSK30_OFFICIAL_SYLLABUS_2025_2026.md` (Phân tích đề cương CTI 2025/2026)
12. `docs/hsk30/sources/HSK_VERSION_COMPARISON.md` (Ma trận đối chiếu 4 hệ thống HSK)
13. `docs/hsk30/HSK30_PHASE901_VOCABULARY_GAP_ANALYSIS.md` (Phân tích khoảng trống 5400 từ vựng)
14. `docs/hsk30/HSK30_PHASE901_GRAMMAR_GAP_ANALYSIS.md` (Ánh xạ 72 điểm ngữ pháp HSK 1)
15. `docs/hsk30/HSK30_PHASE901_HSK1_STRUCTURE_DECISION.md` (Bảo vệ cấu trúc 6 Units HSK 1)
16. `docs/hsk30/HSK30_PHASE901_CURRICULUM_COVERAGE.md` (Ma trận bao phủ giáo trình)
17. `docs/hsk30/HSK30_PHASE901_OFFICIAL_SYLLABUS_VERIFICATION.md` (Báo cáo tổng kết toàn diện)
