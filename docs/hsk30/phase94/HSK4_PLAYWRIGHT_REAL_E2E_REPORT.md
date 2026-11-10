# BÁO CÁO KẾT QUẢ KIỂM THỬ PLAYWRIGHT E2E THỰC TẾ HSK 4

## I. MÔI TRƯỜNG VÀ THÔNG SỐ KIỂM THỬ

- **Công cụ kiểm thử**: Playwright Automation Framework (v1.4x).
- **Trình duyệt**: Chromium Headless.
- **Thiết bị kiểm thử**:
  - Desktop: 1440 x 900.
  - Mobile: iPhone 13 (390 x 844).
- **Môi trường Backend**: `ASPNETCORE_ENVIRONMENT=Testing` kết nối `ZhongWenHub_Test`.
- **Cơ sở dữ liệu**: Đã xác thực qua `verifyTestDatabaseOrThrow` trước khi chạy test.

---

## II. KẾT QUẢ CHI TIẾT 10/10 TEST KỊCH BẢN (PASSED 100%)

1. **Test 1 — Draft Protection & RBAC (Desktop & Mobile)**:
   - Học viên (`STUDENT`) cố truy cập bài học HSK 4 Lesson 1 (`DRAFT`) $ightarrow$ Backend trả về `404 Not Found`.
   - Người dùng ẩn danh cố gọi API hoàn thành bài học $ightarrow$ Backend trả về `401 Unauthorized`.
   - Kết quả: **PASS**.
2. **Test 2 — Content Manager Preview (Desktop & Mobile)**:
   - Content Manager đăng nhập và gọi API xem chi tiết bài học HSK 4 Lesson 1 (`DRAFT`) $ightarrow$ Backend trả về `200 OK` với đầy đủ từ vựng và bài tập.
   - Kết quả: **PASS**.
3. **Test 3 — Student Curriculum Discovery (Desktop & Mobile)**:
   - Học viên duyệt trang giáo trình HSK 4 $ightarrow$ Hiển thị cấu trúc chuẩn 5 Units và các bài học tương ứng.
   - Kết quả: **PASS**.
4. **Test 4 — Reading Passage Interactive Flow (Desktop & Mobile)**:
   - Truy cập giao diện bài học Unit 1 Lesson 4 $ightarrow$ Bài đọc hiểu được hiển thị, hỗ trợ bật/tắt Pinyin, bản dịch và tương tác với bài tập đọc hiểu.
   - Kết quả: **PASS**.
5. **Test 5 — Media & Audio Reachability (Desktop & Mobile)**:
   - Kiểm tra khả năng tải và phát tệp âm thanh hội thoại và nghe hiểu của HSK 4 $ightarrow$ Trả về HTTP 200, xử lý mượt mà.
   - Kết quả: **PASS**.
