# ZHONGWENHUB — ĐỐI CHIẾU VÀ PHÂN BIỆT CÁC PHIÊN BẢN HSK
## HSK_VERSION_COMPARISON.md

**Tài liệu tham chiếu học thuật và tiêu chuẩn hóa hệ thống dữ liệu**  
**Thời gian lập:** 09/11/2026  
**Chuyên gia:** HSK 3.0 Standards Researcher, Senior Chinese Language Curriculum Designer  

---

## 1. NGUYÊN TẮC CỐT LÕI

> [!IMPORTANT]
> **Không đánh đồng giữa "Tiêu chuẩn quốc gia" và "Đề cương thi tuyển", không đánh đồng "Ngày công bố đề cương" với "Ngày bắt đầu thi thực tế".**
> - **GF 0025-2021** là **Tiêu chuẩn năng lực ngôn ngữ quốc gia** (National Standard), xác lập mục tiêu đánh giá tổng thể (3 bậc 9 cấp, 5 kỹ năng nghe-nói-đọc-viết-dịch).
> - **Đề cương thi (Exam Syllabus)** do đơn vị khảo thí quốc tế (CTI) xây dựng dựa trên tiêu chuẩn để áp dụng vào từng bài thi cụ thể.
> - **Giáo trình thương mại (Coursebooks)** là tài liệu học liệu do các nhà xuất bản tự thiết kế dựa trên đề cương hoặc tiêu chuẩn, có bản quyền tác giả độc quyền.

---

## 2. MA TRẬN ĐỐI CHIẾU CÁC HỆ THỐNG VÀ PHIÊN BẢN HSK

| Tiêu chí so sánh | HSK 2.0 (2009 / 2015) | GF 0025-2021 (HSK 3.0 Chuẩn) | Đề cương thi CTI chuyển tiếp (2022–2026) | Giáo trình HSK Standard Course (BLCUP) | Hiện trạng Database ZhongWenHub (Dev) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cơ quan ban hành** | Hanban / Khảo thí quốc tế | Bộ Giáo dục TQ & UB Ngôn ngữ QG | 汉考国际 (CTI) | BLCUP (Chủ biên: Khương Lệ Bình) | ZhongWenHub Project |
| **Cấu trúc cấp bậc** | 6 cấp độ (HSK 1 → 6) | 3 bậc 9 cấp (Sơ, Trung, Cao; Cấp 1 → 9) | Cấp 7–9 đã thi (2022); Cấp 1–6 áp dụng từ cuối 2026 | 6 cấp độ (1 tập/cấp sơ, 2 tập/cấp trung-cao) | 6 cấp độ (HSK 1 → 6) |
| **Từ vựng HSK 1** | **150 từ** | **500 từ** | 150 từ (thi hiện tại) / 500 từ (đề cương 3.0) | 150 từ | **300 từ** (Phân mảnh giữa kỳ) |
| **Từ vựng HSK 2** | **300 từ** (+150) | **1272 từ** (+772) | 300 từ (thi hiện tại) | 300 từ | **500 từ** lũy kế (+200 mới) |
| **Từ vựng HSK 3** | **600 từ** (+300) | **2245 từ** (+973) | 600 từ (thi hiện tại) | 600 từ | **1000 từ** lũy kế (+500 mới) |
| **Từ vựng HSK 4** | **1200 từ** (+600) | **3245 từ** (+1000) | 1200 từ (thi hiện tại) | 1200 từ | **2000 từ** lũy kế (+1000 mới) |
| **Từ vựng HSK 5** | **2500 từ** (+1300) | **4316 từ** (+1071) | 2500 từ (thi hiện tại) | 2500 từ | **3600 từ** lũy kế (+1600 mới) |
| **Từ vựng HSK 6** | **5000 từ** (+2500) | **5456 từ** (+1140) | 5000 từ (thi hiện tại) | 5000 từ | **5400 từ** lũy kế (+1800 mới) |
| **Từ vựng HSK 7-9** | Không có | **11,092 từ** (+5636) | Đã công bố và tổ chức thi (11,092 từ) | Đang cập nhật tập nâng cao | Chưa nạp |
| **Chữ Hán (Cấp 1-6)** | Không quy định cứng từng chữ | **1800 chữ** (300 chữ/cấp) | 1800 chữ | Gián tiếp qua bài học | **1940 chữ** trong DB |
| **Ngữ pháp (Cấp 1-6)** | Liệt kê theo dạng đề thi | **424 điểm** (HSK 1 có 48 điểm) | Theo đề cương chuẩn | Cấu trúc điểm ngữ pháp theo bài | **461 điểm** (HSK 1 có 72 điểm) |
| **Kỹ năng đánh giá** | Nghe, Đọc, Viết (tùy cấp) | Nghe, Nói, Đọc, Viết, **Dịch** | Tích hợp HSKK bắt buộc từ cấp 3 | Nghe, Đọc, Bài tập ngữ pháp | Nghe, Đọc, Ngữ pháp, Bài tập |
| **Tình trạng áp dụng** | Đang thi tại nhiều trung tâm | Chuẩn năng lực nền tảng | Lộ trình chính thức toàn cầu: **13/12/2026** | Sách giáo trình thương mại phổ biến | Cơ sở dữ liệu học tập nội bộ |

---

## 3. PHÂN TÍCH NGUYÊN NHÂN VÀ HIỆN TƯỢNG PHÂN KỲ DỮ LIỆU

### 3.1. Tại sao Database ZhongWenHub có 300 từ HSK 1 và 5400 từ HSK 1–6?
1. **Nguồn gốc dữ liệu hiện tại:**  
   Trong Phase 2 và các thử nghiệm ban đầu (tháng 11/2025), nhóm dự án tiền nhiệm đã nạp danh mục 5400 từ vựng chia theo công thức phân bổ bài học:
   - HSK 1: 300 từ
   - HSK 2: 200 từ (Lũy kế: 500)
   - HSK 3: 500 từ (Lũy kế: 1000)
   - HSK 4: 1000 từ (Lũy kế: 2000)
   - HSK 5: 1600 từ (Lũy kế: 3600)
   - HSK 6: 1800 từ (Lũy kế: 5400)
2. **Đối chiếu với GF 0025-2021:**
   - Trong chuẩn GF 0025-2021, tổng từ vựng lũy kế của cả 6 cấp sơ-trung là **5456 từ**. Con số 5400 từ của database ZhongWenHub thực chất là bộ từ vựng HSK 3.0 giai đoạn 1–6 nhưng đã bị chia bậc khác với bảng gốc:
     - Chuẩn GF 0025-2021 yêu cầu HSK 1 phải đạt ngay **500 từ**.
     - Database ZhongWenHub tách 500 từ đầu tiên này thành 300 từ (HSK 1) + 200 từ (HSK 2) nhằm giảm tải độ khó cho người mới bắt đầu.
3. **Đánh giá sư phạm:**
   - Bước đệm 300 từ cho HSK 1 là rất phù hợp với học viên Việt Nam bắt đầu từ con số 0 (vì 500 từ đối với cấp 1 là khối lượng rất lớn, gấp hơn 3.3 lần so với 150 từ của HSK 2.0).
   - Tuy nhiên, **về mặt chuẩn hóa học thuật**, ZhongWenHub không được tuyên bố 300 từ này là "Chuẩn toàn phần của GF 0025-2021" mà phải định danh rõ: **"HSK 1 Foundation — ZhongWenHub Pedagogical Core"** (chứa 150 từ HSK 2.0 truyền thống + 150 từ mở rộng theo chuẩn 3.0, lũy kế 500 từ khi hoàn thành HSK 2).

### 3.2. Về 72 điểm ngữ pháp HSK 1 trong Database (so với 48 điểm của GF 0025-2021)
- Trong GF 0025-2021, Level 1 có **48 điểm ngữ pháp** tổng quát (ví dụ: Câu chữ 是, Câu chữ 有, Câu nghi vấn 吗, Câu vị ngữ tính từ...).
- Trong quá trình phát triển Phase 6–7, ZhongWenHub đã chi tiết hóa các tiểu mục (sub-categories) thành 72 điểm học tập cụ thể (ví dụ: tách "Đại từ chỉ thị 这/那", "Số từ 1-10", "Số từ 11-99", "Phó từ chỉ mức độ 很", "Phó từ phủ định 不 vs 没").
- **Kết luận:** 72 điểm ngữ pháp hiện tại không mâu thuẫn mà là sự cụ thể hóa sư phạm (granular decomposition) của 48 nhóm ngữ pháp GF 0025-2021. Cần xây dựng bảng ánh xạ (Mapping Table) từ 72 mục của ZhongWenHub sang 48 mã chuẩn của GF 0025-2021.

---

## 4. QUY TẮC ĐỊNH DANH PHIÊN BẢN CHUẨN CỦA ZHONGWENHUB

Nhằm tránh gây hiểu lầm cho người học và tuân thủ liêm chính học thuật:

1. **Gắn nhãn rõ ràng:**
   - Cột `HskVersion`: Đánh dấu rõ mục nào thuộc `GF_0025_2021`, mục nào thuộc `HSK_2015_CORE`, mục nào là `ZHONGWENHUB_PEDAGOGY`.
2. **Không tự nhận "Chuẩn thi chính thức" khi chưa đối chiếu:**
   - Từ vựng thuộc danh mục 150 từ truyền thống được gắn nhãn `EXAM_VERIFIED_HSK2`.
   - Từ vựng mở rộng sang 500 từ được gắn nhãn `STANDARD_GF0025_HSK3`.
3. **Bảo tồn tính tương thích kép (Dual-Compatibility):**
   - Học viên học xong giáo trình của ZhongWenHub phải tự tin tham gia cả hai hình thức: kỳ thi HSK hiện hành lẫn kỳ thi theo đề cương mới HSK 3.0.
