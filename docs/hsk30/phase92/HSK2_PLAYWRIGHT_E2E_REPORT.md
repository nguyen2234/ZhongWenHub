# BÁO CÁO KIỂM THỬ TRÌNH DUYỆT THỰC TẾ PLAYWRIGHT E2E HSK 2 (HSK 2 PLAYWRIGHT E2E REPORT)

> **Môi trường thực thi:**  
> - Backend: ASP.NET Core .NET 10 (`ASPNETCORE_ENVIRONMENT=Testing`, CSDL `ZhongWenHub_Test`, cổng 5000)  
> - Frontend: Vite Dev Server (cổng 5173, proxy `/api` sang cổng 5000)  
> - Trình duyệt: Chromium thực tế qua Playwright  
> - Viewport: Desktop 1440x900 & Mobile 390x844  

---

## 1. TỔNG HỢP KẾT QUẢ KIỂM THỬ E2E

| Dự án kiểm thử (Project) | Tệp kiểm thử | Số kịch bản | Kết quả | Thời gian |
| :--- | :--- | :---: | :---: | :---: |
| **desktop-1440** | `e2e/hsk2-full-curriculum-e2e.spec.ts` | 5/5 | **PASS (100%)** | 27.4s |
| **mobile-390** | `e2e/hsk2-full-curriculum-e2e.spec.ts` | 5/5 | **PASS (100%)** | 17.5s |
| **desktop-1440 (Regression)** | `e2e/hsk1-full-curriculum-e2e.spec.ts` | 5/5 | **PASS (100%)** | 21.3s |
| **Tổng cộng** | **Tất cả các kịch bản E2E** | **15/15** | **100% PASS** | **66.2s** |

---

## 2. CHI TIẾT CÁC KỊCH BẢN KIỂM THỬ HSK 2

### Kịch bản 1: Draft Protection & API RBAC Security
- **Mục tiêu:** Kiểm tra học viên không thể truy cập bài học HSK 2 chưa xuất bản (trạng thái DRAFT); người dùng ẩn danh không thể gian lận điểm thưởng.
- **Thực thi:**
  - Đăng nhập học viên qua API lấy JWT token.
  - Gọi `GET /api/v1/content/lessons/afe42fe5-7d93-47a6-b77b-447dad1e36f6` (Bài 1 HSK 2 - DRAFT).
  - Phản hồi nhận được: **404 Not Found** (Release Gate chặn truy cập).
  - Gửi yêu cầu hoàn thành bài học không có xác thực (`POST /api/v1/learning/me/lessons/.../complete`).
  - Phản hồi nhận được: **401 Unauthorized**.
- **Kết luận:** **PASS**.

### Kịch bản 2: Content Manager Draft Access
- **Mục tiêu:** Kiểm tra quyền của Content Manager khi xem trước và quản lý bài học DRAFT.
- **Thực thi:**
  - Đăng nhập Content Manager qua API.
  - Gọi `GET /api/v1/content/lessons/afe42fe5-7d93-47a6-b77b-447dad1e36f6` (Bài 1 HSK 2).
  - Phản hồi nhận được: **200 OK**, trạng thái `DRAFT`, có đầy đủ 14 từ vựng và 4 bài tập.
  - Gọi `GET /api/v1/content/lessons/9ce302e9-87fe-4705-9836-74e75e2bfe70` (Bài 3 HSK 2).
  - Phản hồi nhận được: **200 OK**, `dialogueJson` chứa bài đọc hiểu *我的新房间*.
  - Đăng nhập Content Manager trên giao diện Web UI và truy cập thành công Content Studio `/management`.
- **Kết luận:** **PASS**.

### Kịch bản 3: Student Curriculum Discovery
- **Mục tiêu:** Kiểm tra giao diện người học khám phá lộ trình HSK 2 và thông báo bảo vệ bản Draft.
- **Thực thi:**
  - Học viên đăng nhập Web UI và chuyển tới trang `/learning-path?mode=hsk`.
  - Khám phá cấu trúc giáo trình HSK 2 gồm 5 Units.
  - Thử truy cập trực tiếp bài học DRAFT qua URL: `/lesson?id=afe42fe5-7d93-47a6-b77b-447dad1e36f6`.
  - Màn hình hiển thị thông báo an toàn: *"Không tìm thấy nội dung bài học. Không thể tải bài học. Vui lòng thử lại sau"*, có nút *"Quay lại giáo trình"*, không phát sinh lỗi sập trang (White Screen of Death).
- **Kết luận:** **PASS**.

### Kịch bản 4: Reading Passage Interactive Flow
- **Mục tiêu:** Kiểm tra tương tác bài đọc hiểu tại Bài 3 (Unit 1): *我的新房间*.
- **Thực thi:**
  - Truy cập bài học qua route học tập.
  - Thẻ `ReadingPassageCard` hiển thị văn bản chữ Hán chứa các từ mục tiêu (`房间`, `左边`, `右边`).
  - Bật/tắt nút hiển thị phiên âm Pinyin: Pinyin ẩn/hiện mượt mà.
  - Bật/tắt nút bản dịch tiếng Việt: Bản dịch ẩn/hiện mượt mà.
  - Chọn đáp án trắc nghiệm câu hỏi số 1 và nhấn *"Kiểm tra"*: Hệ thống hiển thị câu trả lời và phần giải thích chi tiết.
- **Kết luận:** **PASS**.

### Kịch bản 5: Audio & Media Verification
- **Mục tiêu:** Kiểm tra tương tác âm thanh và khả năng xử lý an toàn không sinh lỗi khi phát âm.
- **Thực thi:**
  - Nhấp vào nút phát âm hội thoại/từ vựng trong bài học.
  - Hệ thống gọi trình phát âm thanh mượt mà, không gặp lỗi unhandled rejection.
- **Kết luận:** **PASS**.

---

## 3. KIỂM THỬ HỒI QUY HSK 1 (HSK 1 REGRESSION VALIDATION)

Để đảm bảo việc cấu hình và nạp dữ liệu cho HSK 2 không làm gián đoạn hay phá vỡ bất kỳ tính năng nào của HSK 1 đã phát hành trong Phase 9.1:
- Thực thi toàn bộ `e2e/hsk1-full-curriculum-e2e.spec.ts`:
  - 1. Student Learning Journey (HSK 1 Lesson 1): **PASS**
  - 2. Draft Protection & API RBAC Security: **PASS**
  - 3. Content Manager Draft Preview: **PASS**
  - 4. Reading Passage Integration (Lesson 2): **PASS**
  - 5. Audio Fallback & Web Speech API: **PASS**
- **Kết luận:** **100% ZERO REGRESSION TRÊN HSK 1**.
