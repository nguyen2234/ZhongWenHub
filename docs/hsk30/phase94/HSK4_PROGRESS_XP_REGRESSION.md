# BÁO CÁO HỒI QUY TIẾN ĐỘ HỌC TẬP VÀ ĐIỂM THƯỞNG XP (PROGRESS & XP REGRESSION)

## I. BẢO VỆ TÍNH TOÀN VẸN CỦA TIẾN ĐỘ NGƯỜI DÙNG

1. **Tính bất biến của dữ liệu cũ**:
   Việc nạp giáo trình HSK 4 vào cơ sở dữ liệu hoàn toàn không tác động đến các bản ghi lịch sử làm bài (`StudentPracticeAttempt`), tiến độ từ vựng (`StudentVocabularyProgress`) hoặc giao dịch XP (`StudentXpTransaction`) của các học viên hiện tại.
2. **Bảo vệ tính lũy kế XP (Idempotency)**:
   - Kiểm định API hoàn thành bài học đảm bảo khi học viên nộp lại một bài học đã hoàn thành trước đó, hệ thống không cấp trùng XP (Zero Double-Dipping).
   - Mã giao dịch thưởng điểm XP duy trì tính đơn nhất gắn liền với `EventId`.
