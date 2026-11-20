# BÁO CÁO KIỂM THỬ PLAYWRIGHT TRÊN TRÌNH DUYỆT THẬT (REAL E2E REPORT)

## I. MÔI TRƯỜNG & ĐIỀU KIỆN TIÊN QUYẾT KIỂM THỬ

- **Khung kiểm thử**: Playwright Automation Test Suite.
- **Môi trường Cơ sở Dữ liệu**: `ZhongWenHub_Test` (Được xác minh nghiêm ngặt qua pre-flight guard `verifyTestDatabaseOrThrow`).
- **Địa chỉ Dịch vụ**:
  - Backend API: `http://127.0.0.1:5000` (Hosting Environment: `Testing`).
  - Frontend Vite Dev Server: `http://127.0.0.1:5173/ZhongWenHub/`.
- **Độ phân giải thiết bị kiểm thử**:
  - `desktop-1440`: Màn hình máy tính để bàn (1440x900).
  - `mobile-390`: Màn hình điện thoại di động (iPhone 12 / 390x844).

---

## II. KẾT QUẢ THỰC THI KIỂM THỬ E2E HSK 3

Tệp kiểm thử: `Fontend/e2e/hsk3-full-curriculum-e2e.spec.ts`

```text
Running 10 tests using 1 worker

  ok  1 [desktop-1440] › 1. Draft Protection & API RBAC Security: Student blocked (404); Anonymous blocked (401) (560ms)
  ok  2 [desktop-1440] › 2. Content Manager Draft Access: CM can inspect HSK 3 Draft Lesson with 200 OK & full payload (3.5s)
  ok  3 [desktop-1440] › 3. Student Curriculum Discovery: Student views HSK 3 curriculum structure & canonical 5 Units (6.4s)
  ok  4 [desktop-1440] › 4. HSK 3 Reading Passage Interactive Flow: Unit 1 Lesson 4 Reading Passage & Quiz Verification (4.7s)
  ok  5 [desktop-1440] › 5. Audio & Media Verification: HSK 3 audio assets are present and handled gracefully (5.7s)
  ok  6 [mobile-390]   › 1. Draft Protection & API RBAC Security: Student blocked (404); Anonymous blocked (401) (523ms)
  ok  7 [mobile-390]   › 2. Content Manager Draft Access: CM can inspect HSK 3 Draft Lesson with 200 OK & full payload (3.4s)
  ok  8 [mobile-390]   › 3. Student Curriculum Discovery: Student views HSK 3 curriculum structure & canonical 5 Units (7.2s)
  ok  9 [mobile-390]   › 4. HSK 3 Reading Passage Interactive Flow: Unit 1 Lesson 4 Reading Passage & Quiz Verification (4.9s)
  ok 10 [mobile-390]   › 5. Audio & Media Verification: HSK 3 audio assets are present and handled gracefully (4.4s)

  10 passed (44.0s)
```

---

## III. PHÂN TÍCH CHI TIẾT CÁC KỊCH BẢN KIỂM THỬ

1. **Kịch bản 1: Draft Protection & API RBAC Security**
   - Học viên gửi request GET `/api/v1/content/lessons/46ac4a4f-4f6a-4b90-bbbf-37ff149fd73d` (Bài 1 HSK 3 đang Draft). Kết quả: Mã phản hồi chính xác `404 Not Found`.
   - Người dùng chưa đăng nhập gọi POST hoàn thành bài học. Kết quả: Mã phản hồi `401 Unauthorized`.
2. **Kịch bản 2: Quyền truy cập bản nháp của Content Manager**
   - Content Manager đăng nhập, gọi API lấy bài học 1 HSK 3. Kết quả: Mã `200 OK`, `status == 'DRAFT'`, có đủ 25 từ vựng và 4 bài tập.
   - Content Manager lấy bài học 4 HSK 3. Kết quả: Mã `200 OK`, có chứa đối tượng `readingPassage` với tiêu đề `周末的打算` và 2 câu hỏi đọc hiểu.
3. **Kịch bản 3: Khám phá lộ trình học tập của học viên**
   - Học viên mở trang `/ZhongWenHub/learning-path?mode=hsk`, kiểm tra tab và cấu trúc 5 Units của HSK 3.
   - Học viên gõ trực tiếp URL bài học draft `/ZhongWenHub/lesson?id=46ac4a4f-4f6a-4b90-bbbf-37ff149fd73d`, giao diện hiển thị thông báo an toàn `Không tìm thấy nội dung bài học`, không sập ứng dụng.
4. **Kịch bản 4: Tương tác bài đọc hiểu Unit 1 (Bài 4)**
   - Mở bài học qua định danh `les-hsk3-4`, thẻ đọc hiểu hiển thị chữ Hán đoạn văn `周末`.
   - Bấm nút ẩn/hiện phiên âm Pinyin và dịch nghĩa tiếng Việt thành công.
   - Chọn đáp án câu hỏi trắc nghiệm số 1 và nhận kết quả phản hồi sư phạm ngay lập tức.
5. **Kịch bản 5: Kiểm tra âm thanh và xử lý mượt mà**
   - Tải tệp MP3 và kích hoạt nút phát âm thanh trên giao diện, giao diện tiếp tục hoạt động mượt mà không bị treo gián đoạn.
