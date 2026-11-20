# BÁO CÁO KIỂM TOÁN CƠ SỞ DỮ LIỆU BAN ĐẦU HSK 4 (BASELINE DATA AUDIT)

## I. TỔNG QUAN CẤU TRÚC BAN ĐẦU

Trước khi tiến hành Phase 9.4, dữ liệu khóa học HSK 4 trên cơ sở dữ liệu `ZhongWenHub_Test` và `ZhongWenHub_Dev` có hiện trạng như sau:

- **Khóa học**: `HSK 4 - Trung cấp 2` (Id: `44444444-4444-4444-4444-444444444444`).
- **Tổng số Units**: 5 Units.
- **Tổng số Lessons**: 20 Lessons (chia đều 4 bài / unit).
- **Trạng thái bài học**: 100% bài học ở trạng thái `DRAFT`.
- **Từ vựng trong bảng `vocabularies`**: 0 từ vựng được liên kết với 20 bài học HSK 4 (dữ liệu nằm rải rác hoặc chưa được gán quan hệ).
- **Bài tập trong bảng `exercises`**: 20 bài tập ban đầu (mỗi bài học chỉ có duy nhất 1 bài tập đơn giản, không đủ chuẩn khảo thí).
- **Hội thoại bài học**: Có sẵn 20 đoạn hội thoại cơ bản trong trường `DialogueJson`, tuy nhiên chưa tích hợp bài đọc hiểu cuối Unit.
- **Tệp âm thanh**: Chưa có manifest kiểm toán đường dẫn vật lý và khả năng truy cập qua web.

---

## II. ĐỐI SOÁT VỚI MỤC TIÊU PHASE 9.4

| Thành phần | Hiện trạng Baseline | Yêu cầu Chuẩn HSK 3.0 (GF 0025-2021) | Khoảng cách cần hoàn thiện |
| :--- | :---: | :---: | :---: |
| **Từ vựng** | 0 từ liên kết | 1,000 từ vựng kèm ngữ cảnh câu | Bổ sung 1,000 từ (50 từ/bài) |
| **Ngữ pháp** | Tiêu đề sơ bộ | 95 cấu trúc ngữ pháp có công thức | Chuẩn hóa 95 điểm ngữ pháp |
| **Bài tập** | 20 bài tập (1 bài/lesson) | 80 bài tập (4 bài/lesson) | Nâng cấp 20 + viết mới 60 bài |
| **Bài đọc hiểu** | 0 bài | 5 bài đọc hiểu cuối Unit | Biên soạn 5 bài đọc và tích hợp |
| **Âm thanh MP3** | Chưa đối soát | 40 tệp (20 hội thoại, 20 nghe) | Kiểm toán 40 tệp vật lý |
