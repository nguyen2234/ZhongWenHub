# ZHONGWENHUB — BÁO CÁO CHÊNH LỆCH VÀ ĐỐI CHIẾU DỮ LIỆU
## HSK 2.0 VOCABULARY & GRAMMAR PRE-IMPORT DIFF REPORT

- **Mã nhiệm vụ:** `ZWH-HSK20-VOCAB-GRAMMAR-IMPLEMENTATION`
- **Mục tiêu so sánh:** Dữ liệu chuẩn HSK 2.0 đề xuất vs Dữ liệu hiện có trong hệ thống (`ZhongWenHub_Test`)
- **Ngày lập báo cáo:** 2026-11-11
- **Cơ chế an toàn:** Ghi database bị KHÓA hoàn toàn chờ Người dùng phê duyệt

---

## 1. Bảng Tổng hợp Chênh lệch Từ vựng và Ngữ pháp

| Thành phần | Bộ dữ liệu chuẩn HSK 2.0 đề xuất | Hiện có trong hệ thống (Test DB) | Chênh lệch (Diff) | Bản chất chênh lệch |
|---|---:|---:|---:|---|
| **Từ vựng HSK 1** | 150 | 308 | -158 | DB hiện có chứa cả từ bổ trợ bài học mở rộng; Bộ chuẩn giữ đúng 150 từ mục tiêu |
| **Từ vựng HSK 2** | 150 | 200 | -50 | DB hiện có chứa từ bổ trợ; Bộ chuẩn giữ đúng 150 từ tích lũy (tổng tích lũy 300) |
| **Từ vựng HSK 3** | 299 | 500 | -201 | DB hiện có gồm 500 từ theo đề cương HSK 3.0 cũ; Bộ chuẩn giữ 299~300 từ HSK 2.0 |
| **Từ vựng HSK 4** | 601 | 1.000 | -399 | DB hiện có gồm 1.000 từ theo đề cương HSK 3.0 cũ; Bộ chuẩn giữ 601~600 từ HSK 2.0 |
| **TỔNG TỪ VỰNG** | **1.200** | **2.008** | **-808** | Chuẩn hóa chính xác về mốc 1.200 từ vựng cốt lõi HSK 2.0; các từ dôi dư được lưu làm từ bổ trợ |
| **Ngữ pháp HSK 1** | 50 | 72 | -22 | Tinh gọn các biến thể trùng lặp, quy về 50 chủ điểm chuẩn AllSet Wiki |
| **Ngữ pháp HSK 2** | 75 | 78 | -3 | Tương đồng cao (~96% khớp về phạm vi) |
| **Ngữ pháp HSK 3** | 79 | 96 | -17 | Tinh gọn và hệ thống hóa |
| **Ngữ pháp HSK 4** | 107 | 95 | +12 | Bổ sung 12 cấu trúc liên từ và ngữ khí phức hợp của HSK 4 |
| **TỔNG NGỮ PHÁP** | **311** | **341** | **-30** | Chuẩn hóa cấu trúc và ví dụ sư phạm nhất quán |

---

## 2. Danh sách Chữ Hán Đa âm / Đa nghĩa Giữ nguyên

Trong quá trình chuẩn hóa, hệ thống bảo toàn các mục từ đa âm phân hóa để bảo đảm học viên tiếp cận đúng nghĩa theo cấp:
1. `得`: HSK 2 (`de` - trợ từ kết cấu) và (`děi` - động từ năng nguyện: phải).
2. `还`: HSK 2 (`hái` - phó từ: vẫn) và (`huán` - động từ: trả lại).
3. `长`: HSK 2 (`cháng` - tính từ: dài) và (`zhǎng` - động từ: lớn lên).
4. `只`: HSK 3 (`zhī` - lượng từ) và (`zhǐ` - phó từ: chỉ).
5. `等`: HSK 4 (`děng` - động từ: đợi) và (`děng` - trợ từ: vân vân).
6. `对`: HSK 4 (`duì` - đúng, đối với) và (`duì` - lượng từ: đôi, cặp).
7. `过`: HSK 4 (`guò` - động từ: qua) và (`guò` - trợ từ động thái biểu thị kinh nghiệm).

---

## 3. Đánh giá Mức độ Tương thích 70 Bài học Hiện có

- **HSK 1 (Bài 1–15):** 15/15 bài học (**100% VERIFIED_MATCH**). Tiêu đề và chủ đề bài học khớp tuyệt đối với sách giáo khoa HSK Standard Course 1.
- **HSK 2 (Bài 1–15):** 15/15 bài học (**100% VERIFIED_MATCH**). Tiêu đề và chủ đề bài học khớp tuyệt đối với sách giáo khoa HSK Standard Course 2.
- **HSK 3 (Bài 1–20):** 2 bài VERIFIED_MATCH, 2 bài PARTIAL_MATCH, 16 bài NEEDS_REVIEW (do dữ liệu bài học trước đây được sắp xếp theo khung chủ đề HSK 3.0).
- **HSK 4 (Bài 1–20):** 2 bài VERIFIED_MATCH, 18 bài NEEDS_REVIEW (Bài 1–10 thuộc quyển 4A, Bài 11–20 thuộc quyển 4B).

---

## 4. Đề xuất Xử lý và Không phá vỡ Tính Tương thích (Non-Breaking)

1. **Tuyệt đối không xóa bài học hiện có:** Giữ nguyên vẹn 70 bài học trên môi trường Test để không ảnh hưởng đến tiến độ và trải nghiệm người dùng.
2. **Lưu trữ từ vựng bổ trợ:** Các từ vựng ngoài danh mục 1.200 từ chuẩn (808 từ) không bị xóa bỏ khỏi hệ thống mà được gắn nhãn `SourceDataset: 'LESSON_SUPPLEMENTARY'` nhằm làm giàu vốn từ trong các bài đọc và hội thoại thực tế.
3. **Cơ chế trạng thái an toàn:** Toàn bộ dữ liệu mới nhập vào sẽ mang trạng thái `Status = 'STAGING'` và `QAStatus = 'PENDING_HUMAN_EXPERT_SIGN_OFF'`. Không tự động chuyển thành `PUBLISHED`.
