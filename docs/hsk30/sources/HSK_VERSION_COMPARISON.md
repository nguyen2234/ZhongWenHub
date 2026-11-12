# ZHONGWENHUB — ĐỐI CHIẾU VÀ PHÂN BIỆT CÁC PHIÊN BẢN HSK
## HSK_VERSION_COMPARISON.md

**Tài liệu tham chiếu học thuật và tiêu chuẩn hóa hệ thống dữ liệu**  
**Thời gian cập nhật:** 09/11/2026 (20:50 ICT) — Phase 9.0.1  
**Chuyên gia:** HSK 3.0 Standards Researcher, Senior Chinese Language Curriculum Designer  

---

## 1. NGUYÊN TẮC CỐT LÕI

> [!IMPORTANT]
> **Tuyệt đối không đánh đồng giữa "Tiêu chuẩn quốc gia", "Đề cương thi tuyển" và "Giáo trình nội bộ".**
> - `GF_0025_2021` là **Tiêu chuẩn năng lực ngôn ngữ quốc gia** (National Standard), xác lập mục tiêu đánh giá tổng thể (3 bậc 9 cấp, 5 kỹ năng nghe-nói-đọc-viết-dịch).
> - `HSK_2_2015` là **Đề cương thi HSK 2.0 (ấn bản sửa đổi 2015)** đang áp dụng trong giai đoạn chuyển tiếp.
> - `HSK_3_EXAM_2025_2026` là **Đề cương thi HSK 3.0 Mới** công bố 11/2025, áp dụng từ 07/2026 và thi toàn cầu ngày 13/12/2026.
> - `ZHONGWENHUB_CURRICULUM` là **Khung chương trình sư phạm độc lập của ZhongWenHub**, lấy trọng tâm sư phạm chuyển tiếp cho người Việt Nam.

---

## 2. MA TRẬN ĐỐI CHIẾU BỐN HỆ THỐNG VÀ PHIÊN BẢN HSK (LEVEL 1 → 6)

| Tiêu chí so sánh | `HSK_2_2015` (Đề cương 2.0) | `GF_0025_2021` (Chuẩn Quốc gia) | `HSK_3_EXAM_2025_2026` (Đề cương 3.0 Mới) | `ZHONGWENHUB_CURRICULUM` (Hiện trạng DB Dev) |
| :--- | :--- | :--- | :--- | :--- |
| **Cơ quan chủ quản** | Hanban / CTI (2015) | Bộ Giáo dục TQ & UB Ngôn ngữ QG | CLEC & CTI (2025/2026) | ZhongWenHub Academic Team |
| **Phân cấp hệ thống** | 6 cấp độc lập (HSK 1-6) | 3 đẳng 9 cấp (Sơ, Trung, Cao 1-9) | 6 cấp sơ/trung + Khối 7-9 | 6 cấp học phần (HSK 1-6) |
| **Từ vựng HSK 1** | **150 từ** (Mới & Lũy kế) | **500 từ** (Mới & Lũy kế) | **500 từ** (Theo chuẩn 3.0) | **300 từ** *(HSK 1 Foundation)* |
| **Từ vựng HSK 2** | **300 từ** (+150 mới) | **1.272 từ** (+772 mới) | **1.272 từ** (+772 mới) | **500 từ** (+200 mới, lũy kế 500) |
| **Từ vựng HSK 3** | **600 từ** (+300 mới) | **2.245 từ** (+973 mới) | **2.245 từ** (+973 mới) | **1.000 từ** (+500 mới, lũy kế 1.000) |
| **Từ vựng HSK 4** | **1.200 từ** (+600 mới) | **3.245 từ** (+1.000 mới) | **3.245 từ** (+1.000 mới) | **2.000 từ** (+1.000 mới, lũy kế 2.000) |
| **Từ vựng HSK 5** | **2.500 từ** (+1.300 mới) | **4.316 từ** (+1.071 mới) | **4.316 từ** (+1.071 mới) | **3.600 từ** (+1.600 mới, lũy kế 3.600) |
| **Từ vựng HSK 6** | **5.000 từ** (+2.500 mới) | **5.456 từ** (+1.140 mới) | **5.456 từ** (+1.140 mới) | **5.400 từ** (+1.800 mới, lũy kế 5.400) |
| **Tổng từ vựng 1–6** | **5.000 từ** | **5.456 từ** | **5.456 từ** | **5.400 từ** (64 từ đa nghĩa/đa từ loại) |
| **Chữ Hán HSK 1** | Không quy định danh mục cứng | **300 chữ** (100 chữ viết tay) | **300 chữ** (Nhận biết + viết cơ bản) | **180 chữ** trọng tâm trong 15 bài |
| **Chữ Hán 1–6** | Không quy định cứng | **1.800 chữ** (300 chữ/cấp) | **1.800 chữ** | **1.940 chữ** trong cơ sở dữ liệu |
| **Ngữ pháp HSK 1** | Mẫu câu theo đề thi | **48 điểm** (Nhóm năng lực) | **48 điểm** (Theo đề cương ngữ pháp) | **72 điểm** (Phân rã sư phạm chi tiết) |
| **Ngữ pháp 1–6** | Không cố định mã | **424 điểm** (Sơ & Trung cấp) | **424 điểm** | **461 điểm** (Phân rã thành tiểu mục) |
| **Kỹ năng thi** | Nghe, Đọc, Viết (tùy cấp) | Nghe, Nói, Đọc, Viết, **Dịch** | Nghe, Nói (tích hợp HSKK), Đọc, Viết | Nghe, Đọc, Ngữ pháp, Bài tập tương tác |
| **Tính pháp lý** | Hiệu lực chuyển tiếp đến 2026 | Tiêu chuẩn nhà nước có hiệu lực | Áp dụng thi toàn cầu **13/12/2026** | Học liệu số độc quyền ZhongWenHub |

---

## 3. PHÂN TÍCH HIỆN TƯỢNG PHÂN KỲ DỮ LIỆU ZHONGWENHUB

### 3.1. Phân kỳ Từ vựng HSK 1 (300 từ vs 150 từ vs 500 từ)
1. **Bản chất 300 từ hiện tại:**
   - 300 từ trong `vocabularies` HSK 1 của ZhongWenHub bao phủ **100% của 150 từ trong `HSK_2_2015`**, đồng thời bổ sung thêm 150 từ tần suất cao nằm trong danh mục 500 từ của `GF_0025_2021`.
   - Đây là giải pháp "Cầu nối sư phạm" (Bridging Curriculum). Nếu học viên chỉ học 150 từ thì không bắt kịp chuẩn 3.0; nếu học ngay 500 từ trong khóa sơ cấp đầu tiên (HSK 1) thì tỷ lệ bỏ cuộc (churn rate) của người mới học sẽ rất cao.
2. **Cam kết minh bạch học thuật:**
   - Hệ thống **không được** quảng bá: *"Khóa HSK 1 này đạt 100% từ vựng chuẩn GF 0025-2021"*.
   - Hệ thống **phải** ghi rõ: *"Khóa học HSK 1 Căn bản: 300 từ vựng cốt lõi — Hoàn thành 100% chuẩn HSK 2.0 và 60% chỉ tiêu HSK 3.0"*.
   - Hoàn thành xong HSK 2 (tích lũy đủ 500 từ), học viên sẽ đạt trọn vẹn 100% dung lượng từ vựng của HSK 1 theo chuẩn mới `GF_0025_2021`.

### 3.2. Phân kỳ Ngữ pháp HSK 1 (72 điểm vs 48 điểm)
1. **Tại sao có 72 điểm?**
   - Tiêu chuẩn `GF_0025_2021` nhóm các cấu trúc tương đồng vào 1 mã (ví dụ: 能愿动词 gom 想, 要, 会, 可以 vào 1 điểm).
   - Trong quá trình thiết kế bài giảng sư phạm cho học viên sơ cấp, ZhongWenHub đã rã nhỏ (decomposition) các từ năng nguyện, các phó từ phủ định (不 vs 没有), các đại từ chỉ thị (这 vs 那) thành các thẻ kiến thức riêng lẻ để chấm điểm bài tập micro-learning.
   - Do đó, 72 điểm của ZhongWenHub là **phép phân rã sư phạm ở mức hạt mịn (fine-grained instructional points)**, không phải phát minh ngữ pháp mới ngoài chuẩn.

---

## 4. CHIẾN LƯỢC TƯƠNG THÍCH KÉP (DUAL-COMPATIBILITY STRATEGY)

Nhằm đảm bảo quyền lợi tối đa cho học viên ZhongWenHub:
1. **Thi HSK 2.0:** Học viên hoàn thành HSK 1 của ZhongWenHub tự tin đỗ 100% kỳ thi HSK 1 (150 từ) hiện tại với điểm số cao.
2. **Thi HSK 3.0 Mới:** Học viên theo học lộ trình HSK 1 (300 từ) + HSK 2 (200 từ) sẽ tích lũy trọn vẹn 500 từ vựng, tự tin bước vào kỳ thi chuẩn hóa toàn cầu theo đề cương `HSK_3_EXAM_2025_2026`.
