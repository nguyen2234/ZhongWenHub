# DANH MỤC TIÊU CHÍ SẴN SÀNG PHÁT HÀNH HSK 1
## HSK 1 RELEASE READINESS CHECKLIST & QUALITY CRITERIA

- **Cấp độ**: HSK 3.0 Level 1 (6 Units, 15 Bài học)
- **Tiêu chuẩn áp dụng**: GF 0025-2021 & Bộ Đề cương Giáo dục Hán ngữ Quốc tế HSK 3.0
- **Trạng thái hiện tại**: `TECHNICALLY_READY_AWAITING_HUMAN_APPROVAL`

---

## 1. BẢNG TIÊU CHÍ SẴN SÀNG KỸ THUẬT & HỌC THUẬT

| STT | Nhóm tiêu chí kiểm tra | Chỉ tiêu yêu cầu | Thực tế đạt được | Đánh giá |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Bảo vệ Dev Database** | 0 lệnh ghi/sửa trên `ZhongWenHub_Dev` | Đã chứng minh qua `SELECT DB_NAME()`: 39 users, 140 lessons nguyên vẹn. | **ĐẠT** |
| **2** | **Bảo mật Draft PR #16** | Giữ PR #16 ở trạng thái Draft & Open | PR #16 vẫn giữ trạng thái Draft, không merge, không publish tự động. | **ĐẠT** |
| **3** | **Độ phủ Từ vựng HSK 1** | Đủ 300 từ vựng tiêu chuẩn | 300/300 từ vựng, 100% có âm Pinyin, nghĩa tiếng Việt và ví dụ câu. | **ĐẠT** |
| **4** | **Ví dụ câu giao tiếp thực tế** | Bổ sung 291 ví dụ thiếu | 291/291 ví dụ hoàn thiện, 290 AI-Reviewed, 1 trường hợp lưu ý (Lesson 8). | **ĐẠT** |
| **5** | **Chất lượng bài tập** | Không chứa phương án nhiễu giữ chỗ | 32 bài tập staging mới 100% có phương án nhiễu có nghĩa và giải thích chi tiết. | **ĐẠT** |
| **6** | **Tích hợp Đọc hiểu cuối Unit** | 6 bài đọc hiểu ở cuối 6 Units | 6 bài đọc hiểu tích hợp theo kiến trúc Zero-Schema Change trong `DialogueJson`. | **ĐẠT** |
| **7** | **Âm thanh & TTS** | 30 file MP3 + Fallback | 30 file MP3 hợp lệ, Web Speech API fallback `zh-CN` hoạt động tự động. | **ĐẠT** |
| **8** | **Hồi quy Tiến độ Học tập** | Tương thích ngược GUID và slug cũ | 8/8 test `LearningIntegrationTests` vượt qua: `les-1`..`les-15`, 404 cho `les-999`. | **ĐẠT** |
| **9** | **Bộ kiểm thử Tự động** | 100% test pass không lỗi | Backend Unit: **38/38**, Integration: **83/83**, Frontend: **288/288**, Guard: **3/3**. | **ĐẠT** |
| **10** | **Quy trình Release Gate** | DRAFT -> PENDING_REVIEW -> PUBLISHED | Lesson 1–3 giữ PUBLISHED; Lesson 4–15 giữ DRAFT chờ quyết định xuất bản. | **ĐẠT** |

---

## 2. MA TRẬN KÝ DUYỆT PHÁT HÀNH (SIGN-OFF MATRIX)

| Vai trò trách nhiệm | Họ và tên / Bộ phận | Trách nhiệm thẩm quyền | Trạng thái ký duyệt |
| :--- | :--- | :--- | :---: |
| **Senior Technical Architect** | Nhóm Kỹ thuật Backend | Xác nhận độ an toàn mã nguồn, migration zero-schema và database guard | **ĐÃ PHÊ DUYỆT** |
| **Software QA Engineer** | Nhóm Kiểm thử Tự động | Xác nhận 100% test suites vượt qua (Unit, Integration, Frontend) | **ĐÃ PHÊ DUYỆT** |
| **HSK Curriculum Specialist** | Ban Cố vấn Học thuật | Thẩm định độ chuẩn xác của 291 ví dụ và tính phân cấp sư phạm | *CHỜ PHÊ DUYỆT* |
| **Chinese–Vietnamese QA** | Chuyên gia Ngôn ngữ | Xác nhận biến điệu Pinyin và duyệt riêng trợ từ "得" (Lesson 8) | *CHỜ PHÊ DUYỆT* |
| **Product Release Manager** | Giám đốc Sản phẩm | Quyết định kích hoạt Release Gate chuyển Lesson 4–15 sang PUBLISHED | *CHỜ PHÊ DUYỆT* |
