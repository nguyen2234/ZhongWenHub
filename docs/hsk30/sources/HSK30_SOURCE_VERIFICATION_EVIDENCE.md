# BẰNG CHỨNG XÁC MINH NGUỒN TÀI LIỆU CHÍNH THỨC HSK 3.0
## OFFICIAL SOURCE VERIFICATION EVIDENCE & STATUS AUDIT REPORT

**Dự án:** ZhongWenHub — Nền tảng học tiếng Trung trực tuyến  
**Giai đoạn:** Phase 9.0.1 — Official HSK 3.0 Syllabus Verification & Curriculum Baseline  
**Thời điểm kiểm tra thực tế:** 2026-11-09T20:38:00+07:00  
**Người thực hiện:** Senior Chinese Curriculum Researcher & Technical Documentation Specialist  
**Cơ chế kiểm thử:** Python automated HTTP probe (urllib/TLS context, GET request, user-agent RFC compliant) & Web search cross-referencing.

---

## 1. NGUYÊN TẮC KIỂM ĐỊNH HỌC THUẬT

1. **Tuyệt đối trung thực về tính khả dụng:** Một tài liệu chỉ được coi là `VERIFIED_OFFICIAL` khi có URL tải trực tiếp tệp văn bản/danh mục chuẩn, hoặc có mã băm SHA-256 đối chiếu trực tiếp với bản in chính thức của cơ quan có thẩm quyền.
2. **Không đánh đồng trang chủ với tài liệu:** URL dẫn tới trang chủ (homepage) hoặc trang danh mục (portal index) bắt buộc phải được gắn nhãn `LANDING_PAGE_ONLY`.
3. **Phản ánh chính xác lỗi mạng/chặn truy cập:** Các URL trả về lỗi HTTP 404 (Not Found) hoặc HTTP 503/WAF block phải được đánh dấu `ACCESS_BLOCKED`.
4. **Không suy đoán dữ liệu thiếu:** Khi chưa có bản sao số hóa trực tiếp từ cơ quan khảo thí, hệ thống ghi nhận trạng thái `PARTIALLY_BLOCKED` hoặc `UNVERIFIED`, không tự động sinh dữ liệu đối chiếu giả định.

---

## 2. BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ MẠNG THỰC TẾ

| Mã nguồn (Source ID) | URL ghi nhận trong hệ thống | Kết quả HTTP thực tế | Kiểu nội dung (Content-Type) | Dung lượng (Bytes) | Trạng thái thẩm định mới |
| :--- | :--- | :---: | :--- | :---: | :---: |
| **HSK-OFFICIAL-001** | `http://www.moe.gov.cn/jyb_sjzl/.../t20210602_535261.html` | **404 Not Found** | Không có | 0 | `ACCESS_BLOCKED` |
| **HSK-OFFICIAL-002** | `http://www.chinese.cn/page/#/pcpage/project?id=125` | **200 OK (SPA Shell)** | `text/html` | 3.364 | `LANDING_PAGE_ONLY` |
| **HSK-OFFICIAL-003** | `https://www.chinesetest.cn/HSK79` | **404 Not Found** | Không có | 0 | `ACCESS_BLOCKED` |
| **HSK-OFFICIAL-004** | `https://www.chinesetest.cn/HSK` | **200 OK (Overview)** | `text/html; charset=utf-8` | 575.649 | `LANDING_PAGE_ONLY` |
| **HSK-OFFICIAL-005** | `https://www.chinesetest.cn/Development?lang=cn` | **200 OK (News Feed)** | `text/html; charset=utf-8` | 547.264 | `LANDING_PAGE_ONLY` |
| **HSK-OFFICIAL-006** | `http://www.blcup.com/SeriesBook/Index/115` | **503 Service Unavail.** | Không có | 0 | `ACCESS_BLOCKED` |
| **HSK-OFFICIAL-007** | `http://www.sinolingua.com.cn/` | **200 OK (Publisher)** | `text/html; charset=utf-8` | Động | `LANDING_PAGE_ONLY` |
| **HSK-OFFICIAL-008** *(Mới)* | `https://www.chinesetest.cn/` (New Syllabus Portal) | **200 OK (Portal)** | `text/html; charset=utf-8` | Động | `PARTIALLY_BLOCKED` |

---

## 3. CHI TIẾT THẨM ĐỊNH TỪNG NGUỒN TÀI LIỆU

### HSK-OFFICIAL-001: GF 0025-2021 (Tiêu chuẩn Quốc gia)
- **Tên gốc:** 《国际中文教育中文水平等级标准》
- **Cơ quan ban hành:** Bộ Giáo dục và Ủy ban Ngôn ngữ & Chữ viết Quốc gia Trung Quốc (MOE & State Language Commission).
- **Ngày ban hành:** 2021-03-24 | **Ngày có hiệu lực:** 2021-07-01.
- **Hiện trạng URL:** Đường dẫn cũ trên cổng thông tin MOE bị đổi cấu trúc thư mục, trả về mã lỗi `HTTP 404 Not Found`.
- **Đánh giá học thuật:** Văn bản tiêu chuẩn cốt lõi (khung 3 đẳng 9 cấp, 1.110 âm tiết, 3.000 chữ Hán, 11.092 từ vựng, 572 điểm ngữ pháp) là có thật và đã được xác minh qua các tài liệu viện dẫn chính thức của nhà nước, nhưng liên kết tải PDF trực tiếp hiện không thể truy cập qua HTTP tĩnh. Đã hạ trạng thái từ `VERIFIED_OFFICIAL` xuống `ACCESS_BLOCKED`.

### HSK-OFFICIAL-002: Đề cương chi tiết từ vựng và ngữ pháp GF 0025-2021
- **Tên gốc:** 《国际中文教育中文水平等级标准》应用解读与语法/词汇总表
- **Cơ quan ban hành:** Trung tâm Giao lưu Ngôn ngữ & Hợp tác Đối ngoại (CLEC) / NXB Đại học Ngôn ngữ Bắc Kinh (BLCUP).
- **Hiện trạng URL:** `http://www.chinese.cn/page/#/pcpage/project?id=125` là ứng dụng một trang (SPA) sử dụng JavaScript hash-routing. Yêu cầu HTTP GET thông thường chỉ nhận về khung HTML trống (3.364 bytes).
- **Đánh giá học thuật:** URL không cung cấp dữ liệu danh mục thô ở định dạng có thể đọc máy hoặc tải về trực tiếp. Nội dung tra cứu phụ thuộc sách in xuất bản độc quyền của BLCUP. Đã hạ trạng thái xuống `LANDING_PAGE_ONLY`.

### HSK-OFFICIAL-003: Đề cương thi HSK Cấp 7–9 (2022)
- **Tên gốc:** 《HSK（七-九级）考试大纲及样卷》
- **Cơ quan ban hành:** Công ty TNHH Khoa học Công nghệ Giáo dục Khảo thí Quốc tế Hán ngữ (CTI).
- **Hiện trạng URL:** `https://www.chinesetest.cn/HSK79` trả về `HTTP 404 Not Found`.
- **Đánh giá học thuật:** CTI đã tích hợp mục thi HSK 7-9 vào hệ thống đăng ký thi nội bộ, xóa trang thông tin tĩnh độc lập. Đã hạ trạng thái xuống `ACCESS_BLOCKED`.

### HSK-OFFICIAL-004: Đề cương thi HSK Cấp 1–6 (Phiên bản HSK 2.0 - 2015)
- **Tên gốc:** 《新汉语水平考试大纲（HSK一级至六级）》
- **Cơ quan ban hành:** Hanban / CTI (2015).
- **Hiện trạng URL:** `https://www.chinesetest.cn/HSK` là trang giới thiệu định dạng bài thi tổng quát, không chứa liên kết tải tệp PDF đề cương chi tiết 2015.
- **Đánh giá học thuật:** Không thể dùng URL này làm bằng chứng đối chiếu cho từng mục từ vựng. Đã hạ trạng thái xuống `LANDING_PAGE_ONLY`.

### HSK-OFFICIAL-005: Thông cáo cải cách HSK 3.0 & Lịch thi toàn cầu
- **Tên gốc:** 汉考国际关于新版 HSK 改革与全球考试实施安排官方声明
- **Cơ quan ban hành:** CTI.
- **Hiện trạng URL:** `https://www.chinesetest.cn/Development?lang=cn` là danh mục bài viết tin tức.
- **Đánh giá học thuật:** Bằng chứng cho thấy CTI đã lên lịch chính thức: tháng 11/2025 công bố Đề cương thi HSK mới, tháng 07/2026 chính thức triển khai, và kỳ thi toàn cầu đầu tiên áp dụng vào ngày **2026-12-13**. URL chỉ là trang danh mục, đánh dấu `LANDING_PAGE_ONLY`.

### HSK-OFFICIAL-006: Giáo trình Chuẩn HSK 1–6 (BLCUP)
- **Tên gốc:** HSK标准教程（1-6册）- Chủ biên Khương Lệ Bình
- **Nhà xuất bản:** BLCUP (2014).
- **Hiện trạng URL:** Máy chủ `blcup.com` trả về `HTTP 503 Service Unavailable` do tường lửa chống thu thập dữ liệu (WAF).
- **Đánh giá học thuật:** Ấn phẩm thương mại được bảo hộ bản quyền toàn phần. Tuyệt đối không sao chép nguyên văn bài khóa hay audio lên hệ thống ZhongWenHub. Đánh dấu `ACCESS_BLOCKED`.

### HSK-OFFICIAL-007: Hướng dẫn phân bổ giáo trình theo Chuẩn GF 0025-2021
- **Tên gốc:** 基于《等级标准》的国际中文教材与等级大纲系列
- **Nhà xuất bản:** CLEC / Sinolingua.
- **Hiện trạng URL:** `http://www.sinolingua.com.cn/` là trang chủ tổng quát của NXB Hoa ngữ.
- **Đánh giá học thuật:** Không phải trang sách cụ thể, đánh dấu `LANDING_PAGE_ONLY`.

### HSK-OFFICIAL-008: Đề cương thi HSK 3.0 Mới Cấp 1–6 (2025/2026) *(Nguồn mới)*
- **Tên gốc:** 《新版 HSK 考试大纲（一级至六级）》
- **Cơ quan ban hành:** CLEC / CTI.
- **Ngày công bố:** Tháng 11/2025 | **Ngày áp dụng:** 2026-07-01 | **Kỳ thi toàn cầu:** 2026-12-13.
- **Cấu trúc:** 5 phân hệ đề cương (Nhiệm vụ, Chủ đề, Từ vựng, Chữ Hán, Ngữ pháp).
- **Hiện trạng truy cập:** Tệp phân phối qua cổng tài nguyên có xác thực của CTI dành cho các viện Khổng Tử và trung tâm khảo thí, chưa mở tải tự do không giới hạn trên website công cộng.
- **Đánh giá học thuật:** Đánh dấu `PARTIALLY_BLOCKED`.

---

## 4. KẾT LUẬN VÀ KIẾN NGHỊ CHO PHASE 9.1

1. **Minh bạch cơ sở dữ liệu:** ZhongWenHub không thể tuyên bố "100% đồng bộ với tệp tải về từ website chính thức" chừng nào các tệp này chưa được mở công khai hoàn toàn mà không qua cổng xác thực khảo thí.
2. **Chiến lược học thuật:** Lấy các tiêu chí định lượng đã được công bố của GF 0025-2021 (500 từ HSK 1, 1272 từ HSK 2) làm **Mục tiêu Chuẩn hóa Dài hạn (Target Standard Baseline)**, đồng thời giữ nguyên cấu trúc 15 bài và 300 từ vựng hiện tại của ZhongWenHub như một **Giáo trình Sư phạm Chuyển tiếp (Bridging Pedagogy Course)**.
