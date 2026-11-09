# ZHONGWENHUB — OFFICIAL SOURCE REGISTRY
## DANH MỤC NGUỒN THAM CHIẾU CHÍNH THỨC HSK 3.0 VÀ TIÊU CHUẨN QUỐC GIA

**Dự án:** ZhongWenHub  
**Thời gian lập:** 09/11/2026 (19:55 ICT)  
**Tình trạng:** Sẵn sàng kiểm tra tự động bằng máy qua `data/hsk30/reference/source_manifest.json` và `source_schema.json`.

---

## 1. NGUYÊN TẮC QUẢN LÝ NGUỒN CHÍNH THỨC

1. **Tính xác thực (Authenticity):** Mọi nguồn tham chiếu phải được phát hành bởi cơ quan có thẩm quyền của Nhà nước Trung Quốc (Bộ Giáo dục - MOE, Ủy ban Ngôn ngữ Quốc gia), đơn vị chủ trì khảo thí HSK (Trung tâm Giao lưu Ngôn ngữ Trung - Ngoại CLEC, Công ty TNHH Khoa học Công nghệ Giáo dục Khảo thí Hán ngữ Quốc tế CTI), hoặc các nhà xuất bản chuyên môn được ủy quyền (BLCUP, Sinolingua).
2. **Định danh ổn định (Immutable Source ID):** Mỗi nguồn được cấp mã định danh cố định theo định dạng `HSK-OFFICIAL-XXX`. Mã này được lưu trữ trong cơ sở dữ liệu làm khóa ngoại tham chiếu cho từ vựng, ngữ pháp và chữ Hán.
3. **Phân tách ranh giới pháp lý:** Phân định rạch ròi giữa *Thông số tiêu chuẩn công khai* (được phép trích dẫn thông số, số lượng, chỉ tiêu) và *Tác phẩm thương mại có bản quyền* (giáo trình, file ghi âm, đề thi độc quyền - cấm sao chép).

---

## 2. BẢNG DANH MỤC NGUỒN THAM CHIẾU CHÍNH THỨC

| Source ID | Tên tiếng Trung & Tiêu chuẩn | Cơ quan ban hành | Loại tài liệu | Phiên bản & Ngày hiệu lực | URL chính thức | Trạng thái xác minh | Tình trạng bản quyền |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **HSK-OFFICIAL-001** | **《国际中文教育中文水平等级标准》** (GF 0025-2021) | 教育部、国家语言文字工作委员会 (MOE & State Language Commission) | Tiêu chuẩn Ngôn ngữ Quốc gia | GF 0025-2021 (Ban hành: 24/03/2021, Hiệu lực: 01/07/2021) | [moe.gov.cn/t20210602](http://www.moe.gov.cn/jyb_sjzl/moe_364/moe_902/moe_903/202106/t20210602_535261.html) | **VERIFIED_OFFICIAL** | `PUBLIC_STANDARD_METADATA_ONLY` |
| **HSK-OFFICIAL-002** | **《国际中文教育中文水平等级标准》附录（总表）** | 教育部中外语言交流合作中心 (CLEC) / BLCUP | Phụ lục Đề cương Âm tiết, Chữ Hán, Từ vựng, Ngữ pháp | Bản Phụ lục chuẩn GF 0025-2021 (01/07/2021) | [chinese.cn/project/125](http://www.chinese.cn/page/#/pcpage/project?id=125) | **VERIFIED_OFFICIAL** | `PUBLIC_STANDARD_METADATA_ONLY` |
| **HSK-OFFICIAL-003** | **《HSK（七-九级）考试大纲及样卷》** | 汉考国际 (CTI) | Đề cương thi & Đề thi mẫu HSK 7-9 | Bản chính thức 2022 (Áp dụng: 26/11/2022) | [chinesetest.cn/HSK79](https://www.chinesetest.cn/HSK79) | **VERIFIED_OFFICIAL** | `OFFICIAL_TEST_SYLLABUS_RESTRICTED` |
| **HSK-OFFICIAL-004** | **《新汉语水平考试大纲》（HSK一级至六级）** | 孔子学院总部 / 国家汉办 / 汉考国际 (CTI) | Đề cương thi hiện hành HSK 1–6 (HSK 2.0) | Phiên bản 2015 (Áp dụng thực tế 2015–2026) | [chinesetest.cn/HSK](https://www.chinesetest.cn/HSK) | **VERIFIED_OFFICIAL** | `OFFICIAL_TEST_SYLLABUS_RESTRICTED` |
| **HSK-OFFICIAL-005** | **《汉考国际关于新版 HSK 改革与全球考试实施安排官方声明》** | 汉考国际 (CTI) | Thông cáo Lộ trình Khảo thí | Thông cáo cập nhật 2024–2026 (Lộ trình 13/12/2026) | [chinesetest.cn/Development](https://www.chinesetest.cn/Development?lang=cn) | **VERIFIED_OFFICIAL** | `PUBLIC_STANDARD_METADATA_ONLY` |
| **HSK-OFFICIAL-006** | **《HSK标准教程》（1-6册）** | 北京语言大学出版社 (BLCUP) — Chủ biên Khương Lệ Bình | Giáo trình Thương mại | Tái bản lần 1 (Căn bản HSK 2.0) | [blcup.com/SeriesBook/115](http://www.blcup.com/SeriesBook/Index/115) | **VERIFIED_OFFICIAL** | `ALL_RIGHTS_RESERVED_COMMERCIAL` |
| **HSK-OFFICIAL-007** | **《基于等级标准的国际中文教学指南》** | 中外语言交流合作中心 (CLEC) / 华语教学出版社 | Sách Hướng dẫn Giảng dạy | Hướng dẫn khung 2022 | [sinolingua.com.cn](http://www.sinolingua.com.cn/) | **VERIFIED_OFFICIAL** | `ALL_RIGHTS_RESERVED_COMMERCIAL` |

---

## 3. CHI TIẾT TỪNG NGUỒN VÀ PHẠM VI SỬ DỤNG TRÊN ZHONGWENHUB

### 3.1. HSK-OFFICIAL-001 & HSK-OFFICIAL-002: Tiêu Chuẩn GF 0025-2021
- **Vị trí và thẩm quyền:** Là tiêu chuẩn ngôn ngữ quốc gia cấp cao nhất hiện nay của Trung Quốc cho người học quốc tế, xác lập cấu trúc "Ba bậc chín cấp" (三等九级) và "Bốn chiều cơ sở" (Âm tiết, Chữ Hán, Từ vựng, Ngữ pháp).
- **Phạm vi dữ liệu được phép sử dụng:**
  - Chỉ tiêu số lượng định lượng: 500 từ HSK 1; 1272 từ HSK 2; 2245 từ HSK 3; 3245 từ HSK 4; 4316 từ HSK 5; 5456 từ HSK 6.
  - Danh mục chữ Hán (300 chữ mỗi cấp 1–6, tổng 1800 chữ).
  - Khung ngữ pháp 572 điểm (48 điểm HSK 1; 81 điểm HSK 2; 81 điểm HSK 3; 76 điểm HSK 4; 71 điểm HSK 5; 67 điểm HSK 6).
- **Ranh giới biên soạn ZhongWenHub:** Toàn bộ phần dịch nghĩa tiếng Việt, câu ví dụ thực tế ngữ cảnh Việt Nam, bài đọc và giải thích ngữ pháp phải do đội ngũ sư phạm ZhongWenHub biên soạn độc lập.

### 3.2. HSK-OFFICIAL-004: Đề Cương Thi Hiện Hành (HSK 2.0 - 2015)
- **Vị trí thực tế:** Đề cương thi thực tế đang diễn ra tại các phòng thi trên toàn cầu (Việt Nam, Trung Quốc và quốc tế).
- **Đặc điểm phân kỳ:** HSK 1 gồm 150 từ vựng; HSK 2 gồm 300 từ vựng; HSK 3 gồm 600 từ vựng; HSK 4 gồm 1200 từ vựng; HSK 5 gồm 2500 từ vựng; HSK 6 gồm 5000 từ vựng.
- **Vai trò trong ZhongWenHub:** Sử dụng làm bộ từ vựng cốt lõi bắt buộc (Core Foundation), giúp học viên vừa đáp ứng chuẩn thi hiện tại vừa không bị sốc kiến thức trước khi kỳ thi 3.0 chuyển đổi hoàn toàn.

### 3.3. HSK-OFFICIAL-006: Bộ Sách HSK Standard Course (BLCUP)
- **Tình trạng bản quyền:** Tác phẩm độc quyền thương mại của BLCUP.
- **Quy tắc tuyệt đối:**
  - Không sao chép nguyên văn bài khóa hội thoại (Dialogue) của tác giả Khương Lệ Bình.
  - Không sao chép các bài tập trong Workbook.
  - Không lấy các file audio thu âm có bản quyền của đĩa CD/MP3 đi kèm sách.
  - Chỉ nghiên cứu cấu trúc bài học để học hỏi mô hình sư phạm, tự sáng tác 100% ngữ cảnh hội thoại của ZhongWenHub.
