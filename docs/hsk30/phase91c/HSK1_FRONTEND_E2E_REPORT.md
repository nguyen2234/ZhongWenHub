# BÁO CÁO KIỂM THỬ GIAO DIỆN HỌC TẬP FRONTEND
## FRONTEND UNIT TESTING, E2E VERIFICATION & ACCESS CONTROL REPORT

- **Dự án**: ZhongWenHub Frontend (React 18 + TypeScript + Vite)
- **Công cụ kiểm thử**: Bun Test Runner (`bun test src/`)
- **Kết quả thực thi**: **288/288 Tests Passed (100%)** qua 30 file kiểm thử và 3,947 câu lệnh assertion (`expect()`)
- **Máy chủ phát triển**: Vite Dev Server chạy ổn định tại `http://127.0.0.1:5173`

---

## 1. TỔNG KẾT BỘ KIỂM THỬ FRONTEND (288 / 288 PASSED)

| Nhóm chức năng kiểm thử | Số test | Trạng thái | Nội dung xác minh chính |
| :--- | :---: | :---: | :--- |
| **Reading Passage & Zero-Schema Contract** | 3 tests | **PASSED** | Cấu trúc bài đọc hiểu, kiểm tra câu hỏi tương tác, giải mã JSON nhúng trong `dialogueJson`. |
| **Connected Learning & SRS Persistence** | 22 tests | **PASSED** | Lưu trữ tiến độ localStorage, thuật toán lặp lại ngắt quãng (SM-2/FSRS), tính lũy đẳng của XP. |
| **HSK 1 Dictionary & Homograph Guard** | 16 tests | **PASSED** | Kiểm tra từ đa âm (Duoyinzi), bảo vệ thanh điệu HSK 1, gợi ý từ điển cho Content Manager. |
| **Beginner Roadmap & Learning Guidance** | 10 tests | **PASSED** | Lộ trình 6 bước trực quan cho người mới, ánh xạ bài học thực tế, cập nhật trạng thái động. |
| **Portal Switcher & RBAC Matrix** | 10 tests | **PASSED** | Cách ly 4 cổng thông tin (Student, Teacher, Content Manager, Admin), bảo mật phân quyền vai trò. |
| **Student Dashboard & Navigation** | 10 tests | **PASSED** | 6 mục điều hướng chính, bảo vệ liên kết trang phụ, điều hướng hồ sơ người dùng. |
| **User Management & Data Isolation** | 5 tests | **PASSED** | Bảo vệ tài khoản admin tối cao, cách ly 100% dữ liệu người dùng khi chuyển đổi tài khoản. |
| **AI Tutor & Voice Assistant** | 12 tests | **PASSED** | Trạng thái VoiceSessionController, xử lý ngắt lời (`interruptAssistant`), hội thoại AI. |
| **Các nhóm kiểm thử tích hợp khác** | 200 tests | **PASSED** | Quản lý học liệu, trình phát bài học, xử lý lỗi API và hiển thị thông tin học viên. |

---

## 2. KIỂM CHỨNG BẢO MẬT TRUY CẬP (RELEASE GATE ON FRONTEND)

Hệ thống Frontend tuân thủ nghiêm ngặt ranh giới phát hành (Release Gate):

### 1. Học viên (Student Role):
- **Bài học đã phát hành (Lessons 1, 2, 3 — `PUBLISHED`)**:
  - Tải đầy đủ từ vựng, ngữ pháp, hội thoại, file âm thanh MP3 và bài đọc hiểu.
  - Người dùng có thể hoàn thành bài học, tích lũy XP và ghi nhận chuỗi ngày học (streak).
- **Bài học đang dự thảo (Lessons 4–15 — `DRAFT`)**:
  - Khi học viên cố gắng truy cập trực tiếp bằng URL hoặc qua API: Backend trả về mã lỗi `404 Not Found`.
  - Frontend hiển thị thông báo rõ ràng: *"Bài học không tồn tại hoặc chưa được phát hành (Draft)"*, tuyệt đối không để lộ dữ liệu dự thảo cho học viên.

### 2. Quản trị nội dung (Content Manager / Admin Role):
- Được phép xem trước toàn bộ 15 bài học trên giao diện quản trị (`/management/admin/content/lessons`) kèm thông tin trạng thái kiểm định ngôn ngữ và huy hiệu `AI_ASSISTED_UNVERIFIED` hoặc `NEEDS_HUMAN_REVIEW`.
