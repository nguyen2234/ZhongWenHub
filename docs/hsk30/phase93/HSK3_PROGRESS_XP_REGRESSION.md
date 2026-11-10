# BÁO CÁO KIỂM THỬ HỒI QUY TIẾN ĐỘ & ĐIỂM KINH NGHIỆM (XP REGRESSION)

## I. MỤC TIÊU KIỂM THỬ

Xác minh rằng việc bổ sung giáo trình HSK 3 (500 từ vựng, 80 bài tập, 5 bài đọc hiểu) không làm ảnh hưởng đến:
1. Tiến độ học tập hiện tại của người dùng đối với các bài học HSK 1 và HSK 2 đã hoàn thành.
2. Tính lũy kế và Idempotency của điểm thưởng kinh nghiệm (XP Rewards).
3. Logic mở khóa tuần tự các Unit và bài học.

---

## II. KẾT QUẢ KIỂM TOÁN DỮ LIỆU NGƯỜI DÙNG HIỆN HỮU

- **Số lượng người dùng trên Dev DB**: 39 tài khoản (`users`).
- **Tiến độ học tập (`user_progress`, `user_lessons`)**: Nguyên vẹn 100%, không có bất kỳ dòng dữ liệu nào bị ghi đè, xóa hoặc thay đổi `CompletedAt`.
- **Điểm XP**: Không có sự thay đổi đột biến hoặc lạm phát XP trên hệ thống.

---

## III. KẾT QUẢ KIỂM THỬ ĐỘC LẬP TÍNH BẤT BIẾN (XP IDEMPOTENCY)

Tại bộ kiểm thử `Fontend/src/tests/connected-learning.test.ts`:
- Kiểm thử trao điểm XP bài học: Đạt (chỉ thưởng XP duy nhất 1 lần cho mỗi `eventId`).
- Kiểm thử hoàn thành bài học đã hoàn thành trước đó: Đạt (không trao điểm trùng lặp).
- Kiểm thử tải và phục hồi trạng thái người dùng từ `localStorage` khi bị lỗi/dữ liệu hỏng: Đạt.
