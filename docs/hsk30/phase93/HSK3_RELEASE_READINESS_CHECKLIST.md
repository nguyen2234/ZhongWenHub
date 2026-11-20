# DANH SÁCH KIỂM TRA ĐIỀU KIỆN PHÁT HÀNH HSK 3 (RELEASE READINESS CHECKLIST)

## I. BẢNG KIỂM TRA ĐIỀU KIỆN TIÊN QUYẾT (PRE-FLIGHT CHECKLIST)

| Hạng mục kiểm tra | Yêu cầu chuẩn | Kết quả thực tế Phase 9.3 | Đánh giá |
| :--- | :--- | :--- | :---: |
| **Bảo toàn CSDL Dev** | Zero dirty writes trên `ZhongWenHub_Dev` | 100% nguyên vẹn (39 users, 6 courses, 35 units, 140 lessons, 200 HSK2 vocab, 500 HSK3 vocab, 40 exercises) | **PASS** |
| **Cấu trúc HSK 3** | 1 Course, 5 Units, 20 Lessons | Đúng 1 Course (`HSK3`), 5 Units, 20 Lessons | **PASS** |
| **Làm giàu Từ vựng** | 500 từ vựng có ví dụ câu và nghĩa tiếng Việt | 500/500 từ có ví dụ câu chuẩn, sửa 14 bẫy từ điển | **PASS** |
| **Hệ thống Ngữ pháp** | 96 điểm ngữ pháp bám sát bài học | 96/96 điểm có mã, công thức, giải thích sư phạm | **PASS** |
| **Bài tập Tương tác** | 80 bài tập có đáp án cân đối và giải thích | 80 bài (40 nâng cấp + 40 mới), đáp án phân bổ đều | **PASS** |
| **Bài đọc hiểu Unit** | 5 bài đọc hiểu có câu hỏi trắc nghiệm | 5 bài đọc nhúng trong DialogueJson & Frontend fallback | **PASS** |
| **Tệp âm thanh MP3** | 40 tệp âm thanh hiện hữu và truy cập được | 40/40 tệp MP3 hiện hữu trên đĩa và HTTP 200 | **PASS** |
| **Độ tin cậy Rollback** | Exact rollback khôi phục khớp SHA256 | Khôi phục chính xác 100% khớp snapshot SHA256 | **PASS** |
| **Kiểm thử Playwright** | Real browser E2E Desktop & Mobile | 10/10 kịch bản đạt trên cả 2 viewports | **PASS** |
| **Hồi quy HSK 1 & 2** | Không phá vỡ chức năng cũ | 20/20 kịch bản E2E HSK 1 & HSK 2 đạt | **PASS** |
| **Frontend Tests** | Toàn bộ unit test Bun pass | 288/288 tests pass (0 failures) | **PASS** |
| **Backend Tests** | Toàn bộ test .NET 10 xUnit pass | 122/122 tests pass (0 failures) | **PASS** |
| **Bảo lưu Draft PR #16** | PR #16 duy trì trạng thái Draft | PR #16 tiếp tục duy trì trạng thái Open & Draft | **PASS** |
| **Trạng thái xuất bản** | 20 bài học duy trì DRAFT trên DB | Tất cả 20 bài học duy trì `DRAFT` status | **PASS** |
| **Tính minh bạch chữ ký** | Không giả mạo chữ ký người thật | Đánh dấu `PENDING_HUMAN_EXPERT_SIGN_OFF` | **PASS** |

---

## II. KẾT LUẬN VỀ TÌNH TRẠNG PHÁT HÀNH

Khóa học HSK 3 của ZhongWenHub đã **đạt 100% tiêu chí kỹ thuật và sư phạm trên môi trường kiểm thử (Testing)**.

Khóa học đạt mức sẵn sàng: **`TECHNICALLY_READY_AWAITING_HUMAN_APPROVAL`**.
Sau khi có sự kiểm duyệt và phê duyệt chính thức từ chuyên gia ngôn ngữ con người, hệ thống có thể triển khai lên Dev/Production theo kịch bản Runbook.
