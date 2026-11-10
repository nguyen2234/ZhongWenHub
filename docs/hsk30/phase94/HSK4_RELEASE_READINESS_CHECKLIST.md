# BẢNG KIỂM TRA ĐIỀU KIỆN SẴN SÀNG PHÁT HÀNH HSK 4 (RELEASE READINESS CHECKLIST)

| STT | Hạng mục kiểm tra | Tiêu chuẩn nghiệm thu | Kết quả kỹ thuật | Ký duyệt |
| :---: | :--- | :--- | :---: | :---: |
| 1 | **Bảo vệ môi trường Dev** | Zero byte ghi vào `ZhongWenHub_Dev` | **PASSED** (100% Read-Only) | Kỹ sư trưởng |
| 2 | **Khóa học và Units** | 1 Khóa học HSK 4, đúng 5 Units | **PASSED** (5 Units, 20 Lessons) | Kỹ sư dữ liệu |
| 3 | **Từ vựng HSK 4** | 1,000 từ vựng, 100% có câu ví dụ, Pinyin, Hán Việt | **PASSED** (1,000/1,000) | Chuyên gia QA |
| 4 | **Ngữ pháp HSK 4** | 95 điểm ngữ pháp, có công thức và ví dụ | **PASSED** (95/95 điểm) | Chuyên gia QA |
| 5 | **Bài tập tương tác** | 80 bài tập (4 bài/lesson), có giải thích | **PASSED** (80/80 bài) | Chuyên gia GD |
| 6 | **Bài đọc hiểu Unit** | 5 bài đọc hiểu cuối Unit (L4, 8, 12, 16, 20) | **PASSED** (5/5 bài) | Chuyên gia GD |
| 7 | **Tệp âm thanh** | 40/40 tệp MP3 hiện hữu và truy cập được | **PASSED** (40/40 files) | Kỹ sư hệ thống |
| 8 | **Exact Rollback Test** | Khôi phục nguyên trạng 100% khớp SHA256 | **PASSED** (Hash trùng khớp) | Kỹ sư dữ liệu |
| 9 | **Kiểm thử E2E Playwright** | 100% kịch bản E2E HSK 4 đạt trên Desktop & Mobile | **PASSED** (10/10 passed) | Kỹ sư QA |
| 10 | **Kiểm thử hồi quy** | 30/30 E2E HSK 1-3 passed, 288 Bun tests passed | **PASSED** (100% passed) | Kỹ sư QA |
| 11 | **Backend Tests** | 122/122 tests passed (.NET 10) | **PASSED** (122/122 passed) | Backend Lead |
| 12 | **Bảo lưu Draft PR #16** | PR #16 duy trì trạng thái Draft, không merge | **PASSED** (Draft bảo lưu) | Tech Lead |
| 13 | **Thẩm định người thật** | Chữ ký chuyên gia HSK 3.0 người thật | **CHỜ PHÊ DUYỆT THỰC TẾ** | Hội đồng thẩm định |
