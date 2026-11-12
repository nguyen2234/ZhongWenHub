# BÁO CÁO KIỂM THỬ HỒI QUY XUYÊN CẤP ĐỘ HSK 1, HSK 2, HSK 3 VÀ HSK 4

## I. MỤC TIÊU KIỂM TOÁN

Đảm bảo việc bổ sung 1,000 từ vựng, 80 bài tập và 5 bài đọc hiểu cho cấp độ HSK 4 không gây ra bất kỳ hiệu ứng phụ hoặc hồi quy tiêu cực nào đến hệ thống học tập của các cấp độ HSK 1, HSK 2 và HSK 3 đã bàn giao.

---

## II. KẾT QUẢ ĐỐI SOÁT HỒI QUY

1. **Bộ kiểm thử tự động Playwright (Regression Suite)**:
   - Kịch bản HSK 1 (5 tests x 2 thiết bị = 10 tests): **10/10 PASS**.
   - Kịch bản HSK 2 (5 tests x 2 thiết bị = 10 tests): **10/10 PASS**.
   - Kịch bản HSK 3 (5 tests x 2 thiết bị = 10 tests): **10/10 PASS**.
   - Kịch bản HSK 4 (5 tests x 2 thiết bị = 10 tests): **10/10 PASS**.
   - **Tổng cộng**: **40/40 Playwright tests PASSED 100%**.
2. **Bộ kiểm thử đơn vị Frontend (Bun Unit Tests)**:
   - Chạy 288 tests qua 30 tệp kiểm thử trong thư mục `src/tests/`: **288/288 PASS (100%)**.
3. **Bộ kiểm thử Backend (.NET 10 xUnit)**:
   - Unit Tests (`ZhongWenHub.UnitTests`): **38/38 PASS**.
   - Integration Tests (`ZhongWenHub.IntegrationTests`): **84/84 PASS** (bao gồm kiểm toán số lượng bài tập 490).
   - **Tổng cộng**: **122/122 Backend tests PASSED 100%**.
