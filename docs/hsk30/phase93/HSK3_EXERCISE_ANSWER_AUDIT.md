# BÁO CÁO KIỂM TOÁN CHẤT LƯỢNG BÀI TẬP VÀ PHÂN BỔ ĐÁP ÁN HSK 3

## I. TỔNG QUAN HỆ THỐNG BÀI TẬP HSK 3

- **Tổng số bài tập**: Đúng **80 bài tập** phân bổ trên 20 bài học (mỗi bài học có chính xác **4 bài tập**).
  - 40 bài tập cải tiến từ cơ sở dữ liệu Dev (thay thế placeholder vô nghĩa).
  - 40 bài tập mới được biên soạn bám sát ngữ pháp, từ vựng và bài đọc của từng bài.
- **Phân bổ kỹ năng (Skill Coverage)**:
  - Ngữ pháp (Grammar): 20 bài tập.
  - Từ vựng (Vocabulary): 20 bài tập.
  - Đọc hiểu (Reading): 20 bài tập.
  - Luyện nghe & Phản xạ hội thoại (Listening): 20 bài tập.

---

## II. ĐỐI SOÁT PHÂN BỔ VỊ TRÍ ĐÁP ÁN ĐÚNG (ANSWER DISTRIBUTION)

Một trong các nhược điểm nghiêm trọng của bộ dữ liệu thô cũ là `correctOptionIndex` luôn cố định là `0` (vị trí A), dẫn đến nguy cơ học viên "đoán mò" và làm mất giá trị khảo thí.

Trong Phase 9.3, vị trí đáp án đúng của 80 bài tập đã được xáo trộn và phân bổ tự nhiên:
- Vị trí `0` (Lựa chọn A): 30 bài
- Vị trí `1` (Lựa chọn B): 27 bài
- Vị trí `2` (Lựa chọn C): 19 bài
- Vị trí `3` (Lựa chọn D): 4 bài
- **Tổng cộng**: 80 bài tập.

---

## III. KIỂM ĐỊNH NỘI DUNG VÀ GIẢI THÍCH SƯ PHẠM

1. **100% Không để lộ đáp án trong câu hỏi**: Câu hỏi không chứa gợi ý lộ liễu làm mất tính thử thách.
2. **Các phương án gây nhiễu (Distractors) hợp lý**: Các đáp án sai được xây dựng từ từ vựng cùng trường nghĩa hoặc lỗi ngữ pháp thường gặp của học viên Việt Nam (như nhầm lẫn giữa `比`, `跟`, `把`, `被`).
3. **100% Có giải thích tiếng Việt chi tiết**: Khi học viên chọn câu trả lời, hệ thống cung cấp giải thích ngữ pháp và trích dẫn bài học rõ ràng giúp củng cố kiến thức.

---

## IV. TÀI LIỆU STAGING ĐÃ TẠO

- `data/hsk30/staging/hsk3_exercises.json` (80 bài tập)
- `data/hsk30/staging/hsk3_exercise_qa_manifest.json` (Chỉ số kiểm định QA)
