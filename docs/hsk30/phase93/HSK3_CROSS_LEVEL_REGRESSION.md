# BÁO CÁO KIỂM THỬ HỒI QUY ĐA CẤP ĐỘ (CROSS-LEVEL REGRESSION REPORT)

## I. MỤC TIÊU VÀ PHẠM VI HỒI QUY

Khi tích hợp cấp độ HSK 3, hệ thống phải bảo đảm tuyệt đối không gây suy thoái (zero regression) lên 2 cấp độ đã được tích hợp trước đó:
- **HSK 1**: 6 Units, 15 Bài học, 300 từ vựng, 6 bài đọc hiểu, 60 bài tập, 30 tệp MP3.
- **HSK 2**: 5 Units, 15 Bài học, 200 từ vựng, 5 bài đọc hiểu, 60 bài tập, 30 tệp MP3.

---

## II. BẰNG CHỨNG KIỂM THỬ HỒI QUY THỰC TẾ

### 1. Kiểm thử Playwright E2E HSK 1 & HSK 2
Lệnh chạy: `bunx playwright test e2e/hsk1-full-curriculum-e2e.spec.ts e2e/hsk2-full-curriculum-e2e.spec.ts --workers=1`

Kết quả:
- **Tổng số test**: 20/20 passed (100% thành công trên cả 2 viewports Desktop 1440px và Mobile 390px).
- Thời gian chạy: 1.3 phút.
- Chi tiết:
  * HSK 1 Desktop: 5/5 passed.
  * HSK 1 Mobile: 5/5 passed.
  * HSK 2 Desktop: 5/5 passed.
  * HSK 2 Mobile: 5/5 passed.

### 2. Kiểm thử Tích hợp Backend .NET 10
Lệnh chạy: `dotnet test Backend/ZhongWenHub.sln`
- `ZhongWenHub.UnitTests`: 38/38 passed (152 ms).
- `ZhongWenHub.IntegrationTests`: 84/84 passed (19 s).
- Tổng cộng: **122/122 backend tests passed**.
- Kiểm tra số lượng thực thể tổng:
  * Courses: 6 khóa học (HSK 1–6).
  * Units: 35 units.
  * Lessons: 140 bài học (bảo toàn trọn vẹn).
  * Exercises: 450 bài tập (278 baseline + 32 Phase 9.1 + 60 Phase 9.2 + 80 Phase 9.3).

### 3. Kiểm thử Đơn vị Frontend Bun Test
Lệnh chạy: `bun test src/tests/`
- Kết quả: **288/288 passed** (0 fail, 4139 assertions).

---

## III. KẾT LUẬN

Hệ thống hoạt động ổn định tuyệt đối, không có bất kỳ xung đột định danh, vỡ layout, hoặc suy thoái API nào trên cả 3 cấp độ HSK 1, HSK 2 và HSK 3.
