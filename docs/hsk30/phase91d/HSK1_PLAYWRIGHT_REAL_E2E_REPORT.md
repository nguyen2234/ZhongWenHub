# BÁO CÁO KẾT QUẢ KIỂM THỬ E2E TRÌNH DUYỆT THẬT (PLAYWRIGHT) VỚI LIVE TEST DATABASE

**Dự án:** ZhongWenHub  
**Công cụ kiểm thử:** Playwright Automation Test Runner  
**Trình duyệt mục tiêu:** Chromium (Headless)  
**Môi trường thực thi:** Backend ASP.NET Core (.NET 10) chạy profile `Testing` trên cổng 5000  
**Cơ sở dữ liệu:** Live SQL Server `ZhongWenHub_Test`  
**Frontend Dev Server:** Vite 5.x chạy trên `http://127.0.0.1:5173`  
**Chính sách cách ly:** Enforce `verifyTestDatabaseOrThrow` trước mọi luồng kiểm thử  

---

## 1. THIẾT LẬP VÀ CƠ CHẾ AN TOÀN FAIL-CLOSED

Toàn bộ các test suite E2E của ZhongWenHub đều tuân thủ cơ chế bảo vệ nghiêm ngặt:
1. **Global Setup Hook:** Tự động gọi endpoint `/api/v1/system/database-environment` qua HTTP proxy của Vite trước khi khởi tạo worker trình duyệt.
2. **Pre-flight Assertion:**
   - Yêu cầu `databaseName === "ZhongWenHub_Test"`.
   - Yêu cầu `environment === "Testing"`.
   - Yêu cầu `isTestDatabase === true`.
   - **Nếu không đáp ứng điều kiện trên:** Ném ngoại lệ `FATAL E2E VIOLATION` và hủy bỏ toàn bộ phiên chạy ngay lập tức nhằm bảo vệ tuyệt đối cơ sở dữ liệu `ZhongWenHub_Dev`.

---

## 2. BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ THỰC TẾ

| STT | Tệp kiểm thử (Spec File) | Viewport / Project | Số Test | Thời gian | Kết quả | Bằng chứng kiểm thử chính |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| 1 | `e2e/hsk1-full-curriculum-e2e.spec.ts` | Desktop 1440px | 5 | 27.2s | **PASS (5/5)** | Luồng học Lesson 1, chặn Draft 404, CM preview Draft 200, Reading toggle & quiz, Audio fallback |
| 2 | `e2e/hsk1-full-curriculum-e2e.spec.ts` | Mobile 390px | 5 | 31.8s | **PASS (5/5)** | Giao diện học viên di động, Reading Passage co giãn linh hoạt, phím bấm cảm ứng nhạy |
| 3 | `e2e/student-learning-journey.spec.ts` | Desktop 1440px | 5 | 34.3s | **PASS (5/5)** | Đăng nhập học viên, khám phá 6 cấp HSK, xem sách giáo khoa số, Focus mode và lưu tiến độ |
| 4 | `e2e/student-exercise-acceptance.spec.ts` | Desktop 1440px | 4 | 25.4s | **PASS (4/4)** | Làm bài tập tương tác, Focus runner 6 bước, tính năng chống rò rỉ đề thi nháp (404), bảo toàn tiến độ |
| 5 | `e2e/student-vocabulary-grammar.spec.ts` | Desktop 1440px | 6 | 34.8s | **PASS (6/6)** | Menu 5 nhóm sidebar, module từ vựng tra cứu SQL thật, module ngữ pháp, drawer AI tutor, mobile drawer |
| 6 | `e2e/real-admin-acceptance.spec.ts` | Desktop 1440px | 6 | 23.7s | **PASS (6/6)** | Phân quyền RBAC quản trị viên, chống giả mạo session, quản lý danh sách user thật từ SQL Server, KPI |

**Tổng số kịch bản kiểm thử E2E trình duyệt thật chạy thành công:** **31 / 31 tests PASS (100%)**.

---

## 3. CHI TIẾT CÁC CA KIỂM THỬ CỐT LÕI (CORE TEST CASES)

### Test Case 1: Học viên hoàn thành bài học 1 HSK 1
- **Kịch bản:** Học viên `student.an.demo@zhongwenhub.edu.vn` đăng nhập $\rightarrow$ Vào bài học 1 $\rightarrow$ Xem từ vựng (`你好`), ngữ pháp, hội thoại $\rightarrow$ Bấm nghe âm thanh $\rightarrow$ Mở modal luyện tập tương tác $\rightarrow$ Đóng modal $\rightarrow$ Kiểm tra trang Tiến độ học tập.
- **Kết quả:** Trình duyệt tải dữ liệu mượt mà từ SQL Server `ZhongWenHub_Test`, phản hồi UI dưới 1 giây, tiến độ ghi nhận đầy đủ.

### Test Case 2: Kiểm soát bảo vệ bài nháp (Draft Protection & RBAC)
- **Kịch bản:** 
  1. Học viên gọi GET `/api/v1/content/lessons/aaaaaaaa-4444-4444-4444-444444444444` (Lesson 4 đang ở trạng thái DRAFT).
  2. Người dùng nặc danh (Anonymous) gọi POST `/api/v1/learning/me/lessons/aaaaaaaa-1111-1111-1111-111111111111/complete`.
- **Kết quả:**
  1. API trả về **404 Not Found** (Bài nháp hoàn toàn bị giấu khỏi học viên).
  2. API trả về **401 Unauthorized** (Không thể ghi nhận hoàn thành bài học khi chưa đăng nhập).

### Test Case 3: Chế độ xem trước nội dung dành cho Content Manager (Draft Preview)
- **Kịch bản:** Content Manager `content.hongphuc.demo@zhongwenhub.edu.vn` đăng nhập và gọi API xem bài Lesson 4 (DRAFT).
- **Kết quả:** API trả về **200 OK**, đầy đủ tiêu đề chữ Hán, phiên âm Pinyin, danh sách từ vựng và bài tập đã được chuẩn hóa.

### Test Case 4: Trải nghiệm bài đọc hiểu tương tác (Reading Passage)
- **Kịch bản:** Học viên mở bài học 2 (Lesson 2) $\rightarrow$ Cuộn tới vùng `reading-passage-card` $\rightarrow$ Nhấp nút bật/tắt Pinyin $\rightarrow$ Nhấp nút bật/tắt Dịch nghĩa $\rightarrow$ Chọn phương án câu hỏi đọc hiểu $\rightarrow$ Nhấp kiểm tra.
- **Kết quả:** Các phần tử DOM tương ứng phản hồi chính xác, hiện tích xanh và hiển thị giải thích chi tiết tiếng Việt.

---

## 4. KẾT LUẬN

Hệ thống đã trải qua quy trình kiểm thử tự động nghiêm ngặt trên trình duyệt thật với live backend và cơ sở dữ liệu thật. Không có bất kỳ lỗi JavaScript runtime nào xảy ra trên console của trình duyệt. Nền tảng học tập đã đạt độ ổn định và sẵn sàng cho các đợt phát hành tiếp theo.
