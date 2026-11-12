# Báo Cáo Kiểm Toán Chất Lượng Học Liệu HSK 1–4 (70 Bài Học)

> **NGUYÊN TẮC PHÂN LOẠI NGHIÊM NGẶT:**
> - `VERIFIED`: Học liệu đối chiếu khớp chuẩn giáo trình `HSK 2.0` (`plaktos`, `drkameleon`, `hsk20_vocabulary_standard.json`) hoặc học liệu gốc HSK 1 đã qua kiểm định trước đó không thuộc phạm vi AI tạo mới.
> - `NEEDS_REVIEW`: **Tất cả nội dung do AI tạo/bổ sung** (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW` trong `HSK14_HUMAN_REVIEW_MANIFEST.json`), kể cả khi kiểm tra tự động Pinyin/audio/cấu trúc đạt 100%, **KHÔNG ĐƯỢC TỰ ĐỘNG ĐÁNH DẤU `VERIFIED`** nếu chưa có giảng viên chuyên môn Trung Ngữ ký duyệt.
> - `ERROR`: Bất kỳ sai sót kỹ thuật/học thuật nào (sai/thiếu Pinyin thanh điệu, nghĩa rỗng, lộ tiếng Anh chưa dịch, audio hỏng, câu hỏi đọc/nghe lỗi chỉ mục).

- **Thời điểm kiểm toán:** 2026-11-11 15:21 UTC
- **Tổng trạng thái DB (`ZhongWenHub_Dev`):** `[(1, 'PUBLISHED', 15), (2, 'PUBLISHED', 15), (3, 'PUBLISHED', 20), (4, 'PUBLISHED', 20)]`

## 1. Bảng phân loại tổng hợp (`VERIFIED` / `NEEDS_REVIEW` / `ERROR`)

| Hạng mục học liệu | Tổng số | VERIFIED | NEEDS_REVIEW | ERROR | Ghi chú nguồn gốc |
|---|---:|---:|---:|---:|---|
| Từ vựng (70 bài, HSK 2.0) | 1200 | 1124 | 76 | 0 | 1.200 từ chuẩn HSK 2.0; riêng 76 từ HSK 4 có câu ví dụ AI thay thế mẫu cũ cần duyệt |
| Điểm ngữ pháp (70 bài) | 146 | 36 | 110 | 0 | 36 điểm HSK 1 nền chuẩn + 110 điểm HSK 2–4 do AI biên soạn tiếng Việt |
| Hội thoại (70 bài) | 70 | 15 | 55 | 0 | 15 bài HSK 1 gốc + 55 bài HSK 2–4 AI biên soạn |
| Đoạn đọc hiểu & Q&A (70 bài) | 70 | 6 | 64 | 0 | 6 bài HSK 1 gốc + 9 đoạn HSK 1 AI bổ sung + 55 đoạn HSK 2–4 AI biên soạn |
| Bài nghe & Transcript (70 bài) | 70 | 15 | 55 | 0 | 15 bài HSK 1 gốc + 55 bài HSK 2–4 AI biên soạn |
| File Audio `.mp3` (HSK 1–4) | 140 | 30 | 110 | 0 | 30 file HSK 1 + 110 file TTS HSK 2–4 (đều đạt chuẩn MP3/ID3 >= 5KB) |
| Bài tập luyện tập (70 bài) | 337 | 62 | 275 | 0 | 62 bài HSK 1 gốc + 275 bài HSK 2–4 AI biên soạn |

## 2. Chi tiết các hạng mục kiểm tra tự động

- **Pinyin & Thanh điệu:** Đã kiểm tra dấu thanh (`āáǎà...` hoặc âm nhẹ chuẩn) trên toàn bộ 1200 từ vựng và toàn bộ các dòng hội thoại của 70 bài học -> **ERROR = 0**.
- **Nghĩa tiếng Việt & Không còn placeholder:** Kiểm tra `MeaningVi`, `Explanation`, `Summary`, `meaningVi`, `passageVi` không rỗng, không chứa dấu vết tiếng Anh `(indicating...` hay placeholder `Bản thảo`/`Đang cập nhật`/`在中文交流中` -> **ERROR = 0**.
- **Tính nhất quán câu hỏi - đáp án & Audio:** Kiểm tra toàn bộ 140 file MP3 thực tế trên đĩa (`Fontend/public/audio/hsk1..4`) và toàn bộ câu hỏi đọc hiểu + bài nghe -> **ERROR = 0**.

## 3. Danh sách hạng mục `NEEDS_REVIEW` cần Giảng viên Trung Ngữ kiểm duyệt

- **Đoạn đọc hiểu HSK 1 do AI bổ sung (9 bài):** HSK1-L01, L03, L05, L06, L07, L08, L10, L11, L12.
- **Toàn bộ học liệu biên soạn mới HSK 2–4 (55 bài):** 55 hội thoại + 55 bài nghe + 55 đoạn đọc hiểu + 110 điểm ngữ pháp + 275 bài tập + 110 file audio TTS (chi tiết đầy đủ tại `data/hsk20/staging/HSK14_HUMAN_REVIEW_MANIFEST.json` và `docs/hsk20/HSK14_AI_CONTENT_HUMAN_REVIEW_REPORT.md`).
- **Câu ví dụ AI thay thế cho 76 từ vựng HSK 4:** Danh sách chi tiết 76 từ nằm trong trường `aiReplacedExampleWords` của `data/hsk20/staging/HSK14_HUMAN_REVIEW_MANIFEST.json`.

## 4. Kết luận lỗi kỹ thuật / dữ liệu

- Tổng số `ERROR`: **0**. Toàn bộ 70 bài học HSK 1–4 sẵn sàng về mặt kỹ thuật và cấu trúc, chờ nghiệm thu học thuật từ giảng viên đối với phần `NEEDS_REVIEW`.
