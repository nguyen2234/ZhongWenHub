# ZHONGWENHUB — BÁO CÁO NGHIỆM THU E2E CMS & HỌC VIÊN HSK 1 (PHASE 8)
**Mã tài liệu:** HSK30_PHASE8_CMS_STUDENT_E2E.md  
**Hệ thống:** ZhongWenHub Language Learning Platform  
**Phiên bản kiểm toán:** HSK 3.0 Standard Curriculum Level 1  
**Thời gian thực hiện:** 2026-11-08  
**Trạng thái kiểm thử:** 398 / 398 PASS (100%)  
**Môi trường:** Local Dev / Test (SQL Server Express, ASP.NET Core 8 Web API, React Vite Frontend)

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM THỬ TỰ ĐỘNG TOÀN DIỆN

Trong đợt nghiệm thu Phase 8, toàn bộ hệ thống đã trải qua quy trình kiểm thử hồi quy khép kín 5 tầng (Unit, Integration, Component, Student E2E, CMS E2E) với tỷ lệ hoàn thành 100%:

| STT | Phân hệ kiểm thử | Công cụ | Số lượng test | Kết quả | Exit Code | Ghi chú |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| 1 | Backend Unit Tests | xUnit / .NET 8 CLI | 14 / 14 | **PASS** | 0 | AuthService, Token, Password Hashing |
| 2 | Backend Integration Tests | xUnit / WebApplicationFactory | 66 / 66 | **PASS** | 0 | Live API, Controllers, DB constraints, Role Auth |
| 3 | Frontend Component Tests | Bun Test / React Testing Library | 285 / 285 | **PASS** | 0 | UI components, Stores, Hooks, Router |
| 4 | Playwright Student Acceptance | Playwright Chromium Headless | 15 / 15 | **PASS** | 0 | Học bài 1-3, bài tập, flashcard, XP, audio |
| 5 | Playwright CMS Admin/Manager | Playwright Chromium Headless | 18 / 18 | **PASS** | 0 | Duyệt bài, phân quyền, Release Gate lifecycle |
| **TỔNG CỘNG** | **Toàn bộ hệ thống ZhongWenHub** | **All Test Runners** | **398 / 398** | **100% PASS** | **0** | **Không còn bất kỳ lỗi nào** |

---

## 2. KẾT QUẢ KIỂM THỬ BẢO MẬT & TIÊU CỰC (NEGATIVE TESTING)

Để bảo đảm tính an toàn dữ liệu và ngăn chặn việc truy cập trái phép hoặc phát hành học liệu chưa hoàn thiện, hệ thống đã kiểm thử và xác nhận 4 kịch bản bảo vệ nghiêm ngặt:

### 2.1. Học viên cố tình phát hành bài học (Student Publish Attempt)
- **Kịch bản:** Tài khoản có quyền `STUDENT` gửi yêu cầu `PUT /api/v1/content/lessons/{id}/status` với body `{"status": "PUBLISHED"}`.
- **Kết quả mong đợi:** HTTP 403 Forbidden.
- **Thực tế kiểm tra:**
  ```http
  HTTP/1.1 403 Forbidden
  Content-Type: application/json
  {"message": "User does not have permission to publish content."}
  ```
- **Đánh giá:** **PASS** (Cơ chế `[Authorize(Roles = "ADMIN,CONTENT_MANAGER")]` chặn tuyệt đối từ tầng Controller).

### 2.2. Người dùng vãng lai truy cập Endpoint CMS (Anonymous Access)
- **Kịch bản:** Gửi request không kèm JWT Bearer Token đến `GET /api/v1/content/lessons/{id}/release-readiness` hoặc `GET /api/v1/cms/review-queue`.
- **Kết quả mong đợi:** HTTP 401 Unauthorized.
- **Thực tế kiểm tra:**
  ```http
  HTTP/1.1 401 Unauthorized
  ```
- **Đánh giá:** **PASS** (Tất cả endpoint quản trị yêu cầu xác thực JWT hợp lệ).

### 2.3. Học viên cố tình truy cập trực tiếp bài học DRAFT (Direct Draft Access)
- **Kịch bản:** Học viên truy cập URL `/ZhongWenHub/courses/hsk1/lessons/les-4` (bài học đang ở trạng thái DRAFT).
- **Kết quả thực tế:**
  - API `GET /api/v1/lessons/les-4` lọc theo quy tắc: Chỉ trả về nội dung nếu bài học là `PUBLISHED` hoặc người dùng là Admin/Content Manager.
  - Phía Frontend hiển thị thông báo trạng thái: `Bài học đang trong quá trình biên tập và kiểm duyệt. Vui lòng quay lại sau!`, kèm badge `DRAFT - Đang cập nhật`.
  - Không lộ câu hỏi, không lộ script audio, không ghi nhận XP bất hợp pháp.
- **Đánh giá:** **PASS**.

### 2.4. Khả năng chống chịu lỗi khi thiếu Audio (Audio Fault-Tolerance)
- **Kịch bản:** Giả lập trình duyệt hoặc mạng không tải được file audio (HTTP 404 hoặc mạng offline).
- **Kết quả thực tế:**
  - Trình phát âm thanh hiển thị icon cảnh báo nhẹ nhàng `[Audio đang chuẩn bị]` thay vì làm sập trang React (zero uncaught exceptions).
  - Học viên vẫn xem được Pinyin, chữ Hán, nghĩa tiếng Việt và tiếp tục làm bài tập bình thường.
- **Đánh giá:** **PASS**.

---

## 3. TRẢI NGHIỆM HỌC TẬP THỰC TẾ CỦA HỌC VIÊN (STUDENT LEARNING FLOW)

### 3.1. Luồng định hướng học tập
1. **Student Dashboard (`/ZhongWenHub/dashboard`):**
   - Hiển thị tiến độ tổng thể, chuỗi ngày học tập (Streak), số từ vựng đã nhớ và điểm tích lũy XP.
   - Nút dẫn nhanh tới bài học kế tiếp (Lesson 1: Chào hỏi).
2. **Lộ trình học tập (`/ZhongWenHub/roadmap`):**
   - Bản đồ trực quan từ HSK 1 đến HSK 6.
   - Hiển thị rõ ràng: Cấp độ 1 đang học (3 bài khả dụng, 12 bài sắp phát hành).
3. **Giáo trình HSK 1 (`/ZhongWenHub/curriculum/hsk1`):**
   - Danh sách 15 bài học được chia thành 6 Unit.
   - **Bài 1 - 3:** Hiển thị nút `Bắt đầu học` (Màu xanh, trạng thái PUBLISHED).
   - **Bài 4 - 15:** Hiển thị biểu tượng `Đang cập nhật` (Khóa học, trạng thái DRAFT - chờ kiểm duyệt viên phê duyệt).

### 3.2. Trải nghiệm học bài tương tác thực tế (Lessons 1, 2, 3)
- **Học Từ vựng qua Flashcard:**
  - Lật thẻ 2 mặt (Chữ Hán + Pinyin + Nghĩa tiếng Việt).
  - Tự động phát âm chuẩn giọng phổ thông Bắc Kinh.
- **Phân tích Ngữ pháp:**
  - Giải thích cấu trúc rõ ràng, ví dụ thực tế kèm dịch nghĩa song ngữ.
- **Luyện Hội thoại & Nghe:**
  - Trình phát âm thanh mượt mà từ file MP3 thật (`les1_dialogue.mp3`, `les1_listening.mp3`).
  - Text song ngữ nổi bật theo đoạn hội thoại.
- **Làm Bài tập Tương tác:**
  - Trắc nghiệm chọn đáp án, nối từ, điền từ vào chỗ trống.
  - Chấm điểm tức thời với thuật toán Client + Server validation.
  - Phản hồi giải thích chi tiết cho từng câu trả lời.
- **Cộng điểm thưởng XP và Lưu tiến độ:**
  - Hoàn thành bài học ghi nhận `+50 XP`.
  - Dữ liệu được lưu trực tiếp vào bảng `student_lesson_progress` trong SQL Server (không dùng localStorage giả lập).

---

## 4. QUY TRÌNH KIỂM DUYỆT TRÊN CMS (CMS REVIEW WORKFLOW)

### 4.1. Bảng điều khiển kiểm duyệt học liệu
- Quản trị viên (Admin) và Biên tập viên (Content Manager) đăng nhập vào `/ZhongWenHub/cms/lessons`.
- Bảng danh sách hiển thị đầy đủ 15 bài học HSK 1 cùng trạng thái:
  - `les-1`, `les-2`, `les-3`: **PUBLISHED**
  - `les-4` đến `les-15`: **DRAFT**

### 4.2. Cửa sổ Release Readiness Gate Checklist
Khi click vào bất kỳ bài học nào để chuẩn bị phê duyệt, hệ thống gọi API `GET /api/v1/content/lessons/{id}/release-readiness` và hiển thị trực tiếp danh sách điều kiện phát hành:
- [x] **Hội thoại:** Đạt chuẩn, có đầy đủ Hanzi, Pinyin thanh điệu và nghĩa tiếng Việt tự nhiên.
- [x] **Bài nghe:** Đạt chuẩn, câu hỏi và đáp án hoàn chỉnh.
- [x] **Từ vựng cốt lõi:** Đủ tối thiểu 5 từ vựng được liên kết.
- [x] **Ngữ pháp trọng tâm:** Đủ tối thiểu 1 điểm ngữ pháp chính thức.
- [x] **Bộ bài tập:** Đủ câu hỏi kiểm tra đánh giá.
- [x] **Audio:** File âm thanh MP3 tồn tại và có thể tải được.
- [x] **Quét rò rỉ ký tự:** Không còn chữ Hán nào sót lại trong trường Pinyin hoặc Tiếng Việt (0 defects).

### 4.3. Nút hành động phê duyệt có bảo vệ
- Nếu bài học không vượt qua Release Gate: Nút `Xuất bản (Publish)` bị khóa và hiển thị danh sách các điểm nghẽn (Blockers).
- Nếu bài học thỏa mãn toàn bộ Release Gate: Nút `Xuất bản (Publish)` sẵn sàng để Biên tập viên/Kiểm duyệt viên người thật bấm phê duyệt.
- Ghi nhận chính xác danh tính người duyệt (`ReviewedByUserId`), thời điểm duyệt (`ReviewedAt`) và ghi chú thực tế (`ReviewNotes`) khi thao tác diễn ra.

---

## 5. KẾT LUẬN NGHIỆM THU E2E

1. Toàn bộ 15 bài học HSK 1 đã được sửa chữa nội dung triệt để, xóa bỏ hoàn toàn 36 lỗi dịch máy rập khuôn.
2. Hệ thống Release Readiness Gate hoạt động tin cậy, ngăn ngừa tuyệt đối việc xuất bản bài học chưa đạt chuẩn.
3. Cổng học viên hoạt động mượt mà, bài 1-3 học tập hoàn hảo, bài 4-15 được bảo vệ chặt chẽ ở trạng thái DRAFT.
4. Hệ thống sẵn sàng 100% về mặt kỹ thuật cho đợt kiểm duyệt và nghiệm thu tốt nghiệp.
