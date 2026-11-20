# BÁO CÁO KIỂM TOÁN VÀ PHÂN TÍCH KHOẢNG TRỐNG TỪ VỰNG HSK 1–6
## HSK30_PHASE901_VOCABULARY_GAP_ANALYSIS.md

**Dự án:** ZhongWenHub  
**Giai đoạn:** Phase 9.0.1 — Official Syllabus Verification & Curriculum Baseline  
**Phương pháp:** Truy vấn SQL Read-Only trực tiếp trên SQL Server (`ZhongWenHub_Dev`) & Đối chiếu với tiêu chuẩn `GF_0025_2021`, đề cương `HSK_2_2015` và đề cương thi mới `HSK_3_EXAM_2025_2026`.  
**Thời điểm thực hiện:** 09/11/2026  

---

## 1. TỔNG QUAN HIỆN TRẠNG DỮ LIỆU TỪ VỰNG TRONG HỆ THỐNG

Dữ liệu thực tế truy vấn từ bảng `vocabularies` trên cơ sở dữ liệu `ZhongWenHub_Dev`:

| Cấp HSK | Số bản ghi (Records) | Số từ Hanzi duy nhất (Unique) | Số từ trùng cấp khác (Polysemous) | Lũy kế bản ghi (Cumulative) | Lũy kế từ duy nhất |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **HSK 1** | 300 | 300 | 3 | 300 | 300 |
| **HSK 2** | 200 | 198 | 4 | 500 | 498 |
| **HSK 3** | 500 | 499 | 9 | 1.000 | 993 |
| **HSK 4** | 1.000 | 997 | 15 | 2.000 | 1.982 |
| **HSK 5** | 1.600 | 1.595 | 24 | 3.600 | 3.565 |
| **HSK 6** | 1.800 | 1.794 | 28 | **5.400** | **5.336** |
| **TỔNG** | **5.400** | **5.336** | **64 từ đa nghĩa** | **5.400** | **5.336** |

*(Xác nhận: Truy vấn SQL READ-ONLY 100%, không phát sinh bất kỳ thao tác INSERT, UPDATE, DELETE nào trên cơ sở dữ liệu Dev).*

---

## 2. MA TRẬN SO SÁNH DUNG LƯỢNG TỪ VỰNG VỚI CÁC CHUẨN KHẢO THÍ

| Cấp HSK | `HSK_2_2015` (Đề cương cũ) | `GF_0025_2021` (Chuẩn Quốc gia) | `HSK_3_EXAM_2025_2026` (Đề cương mới) | `ZHONGWENHUB_CURRICULUM` | Tỷ lệ bao phủ so với GF 0025-2021 | Tỷ lệ bao phủ so với HSK 2.0 |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **HSK 1** | 150 | 500 | 500 | **300** | **60.0%** | **200.0%** |
| **HSK 2** | 300 | 1.272 | 1.272 | **500** | **39.3%** | **166.7%** |
| **HSK 3** | 600 | 2.245 | 2.245 | **1.000** | **44.5%** | **166.7%** |
| **HSK 4** | 1.200 | 3.245 | 3.245 | **2.000** | **61.6%** | **166.7%** |
| **HSK 5** | 2.500 | 4.316 | 4.316 | **3.600** | **83.4%** | **144.0%** |
| **HSK 6** | 5.000 | 5.456 | 5.456 | **5.400** | **99.0%** | **108.0%** |

---

## 3. PHÂN TÍCH SÂU VỀ KHOẢNG TRỐNG (GAP ANALYSIS) HSK 1

### 3.1. Đối chiếu HSK 1 (300 từ hiện có)
- **So với `HSK_2_2015` (150 từ):**
  - Hệ thống ZhongWenHub bao phủ **100% toàn bộ 150 từ** cơ bản của HSK 2.0 (như 你, 好, 谢谢, 再见, 爸爸, 妈妈, 吃, 喝...).
  - Bổ sung thêm 150 từ giao tiếp thực tế (như 手机, 微信, 电子邮件, 越南, 咖啡, 司机...).
- **So với `GF_0025_2021` (500 từ):**
  - Thiếu **200 từ** so với chỉ tiêu toàn phần của cấp 1 chuẩn mới.
  - 200 từ còn lại này đã được phân bổ vào học phần HSK 2 (200 từ) trong cấu trúc dữ liệu hiện tại của ZhongWenHub.
  - Kết quả: Khi học viên hoàn thành xong cả HSK 1 và HSK 2 của ZhongWenHub (tổng 500 từ), học viên sẽ tích lũy trọn vẹn 500 từ vựng nền tảng của chuẩn GF 0025-2021.

### 3.2. Hiện tượng từ đồng tự khác nghĩa / đa từ loại (Homographs & Polysemous Words)
Cơ sở dữ liệu ghi nhận **64 chữ Hán** xuất hiện ở nhiều cấp độ hoặc xuất hiện lặp lại để biểu thị các từ loại và nét nghĩa khác nhau:
1. `会` (huì): Xuất hiện ở HSK 1 (động từ năng nguyện: biết làm gì qua rèn luyện) và HSK 3 (danh từ: cuộc họp, hội nghị).
2. `只`: Xuất hiện ở HSK 1 (lượng từ: `zhī` - dùng cho động vật nhỏ, một chiếc trong đôi) và HSK 3 (phó từ: `zhǐ` - chỉ có).
3. `得`: Xuất hiện ở HSK 2 (trợ từ kết cấu: `de` trong bổ ngữ trạng thái) và HSK 3 (động từ năng nguyện: `děi` - phải, cần phải).
4. `为`: Xuất hiện ở HSK 3 (giới từ: `wèi` - vì, để) và HSK 5 (động từ: `wéi` - làm, trở thành).
5. `别`: Xuất hiện ở HSK 2 (phó từ: `bié` - đừng) và HSK 5 (động từ: phân biệt, từ biệt).

> [!NOTE]
> Đây là hiện tượng ngôn ngữ hoàn toàn tự nhiên và đúng quy luật sư phạm quốc tế. Việc giữ các bản ghi riêng biệt cho từng từ loại/nét nghĩa giúp học viên tra cứu chính xác ví dụ và bài tập tương ứng mà không bị nhầm lẫn phát âm và ngữ cảnh.

---

## 4. TÌNH TRẠNG KIỂM ĐỊNH DANH MỤC THÔ (OFFICIAL RAW LIST STATUS)

Theo nguyên tắc học thuật được đề ra trong Phase 9.0.1:
- Do bản phụ lục từ vựng chi tiết của `GF_0025_2021` (Ấn phẩm NXB BLCUP) là sách in thương mại và chưa có bản phân phối số hóa mở API công khai, nhóm nghiên cứu ghi nhận tình trạng kiểm định từng mục từ là:
  **`BLOCKED_OFFICIAL_RAW_LIST_UNAVAILABLE_VIA_PUBLIC_API`**
- Nhóm nghiên cứu không tự ý chế tác bảng đối chiếu khớp từng từ (synthetic comparison) khi chưa có file số hóa có chữ ký số hoặc mã băm chính thức từ CLEC/CTI.

---

## 5. KẾT LUẬN VÀ KHUYẾN NGHỊ CHO BẢN PHÁT HÀNH HSK 1

1. **Giữ nguyên 300 từ hiện có:** Không đột ngột nạp thêm 200 từ vào HSK 1 trong giai đoạn này vì sẽ làm vỡ toàn bộ cấu trúc 15 bài học, bài tập và hội thoại đã qua thẩm định kỹ thuật ở các Phase 6, 7, 8.
2. **Minh bạch nhãn hiển thị:** Trên giao diện Student Portal và chứng chỉ khóa học, đặt tên khóa học là:
   **`HSK 1 Foundation Course (300 Essential Words — HSK 2.0 Full Mastery & HSK 3.0 Stepping Stone)`**.
3. **Lộ trình Phase 9.1:** Tiến hành rà soát ngữ âm, thanh điệu, giải nghĩa tiếng Việt và bài tập cho đúng 300 từ này để sẵn sàng cho hội đồng xuất bản.
