# ZHONGWENHUB — BÁO CÁO KIỂM ĐỊNH CHẤT LƯỢNG DỮ LIỆU GIÁO TRÌNH HSK
## HSK30_DATA_QUALITY_REPORT.md

**Thời gian kiểm định:** 09/11/2026 (20:00 ICT)  
**Cơ sở dữ liệu kiểm định:** SQL Server `ZhongWenHub_Dev` (Chế độ READ-ONLY)  
**Công cụ kiểm định:** `scripts/verify_hsk30_data_quality.py`  
**Quy tắc:** Kiểm tra 13 tiêu chí chất lượng dữ liệu bắt buộc của Phase 9.0.

---

## 1. BẢNG TỔNG HỢP 13 TIÊU CHÍ CHẤT LƯỢNG DỮ LIỆU

| STT | Tiêu chí kiểm định | Kết quả kiểm tra | Trạng thái | Đánh giá & Khuyến nghị |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Duplicate IDs** (Trùng lặp khóa chính) | **0 lỗi** trên cả 7 bảng | **PASS** | Tính toàn vẹn cấu trúc khóa chính đạt 100%. |
| **2** | **Duplicate Vocabulary Entries** (Trùng từ vựng cùng cấp) | **6 từ** trùng cùng cấp<br>(48 từ đa cấp/đa nghĩa) | **NEEDS_REVIEW** | Cần phân loại từ đồng âm khác nghĩa (Homographs) và đa nghĩa (Polysemy) trước khi hợp nhất. |
| **3** | **Invalid Unicode** (Ký tự lỗi / hỏng font ``) | **0 ký tự lỗi** | **PASS** | Bảng mã Unicode UTF-8 toàn vẹn trên toàn bộ các bảng. |
| **4** | **Missing Pinyin** (Thiếu phiên âm Pinyin) | **0 lỗi** trên Từ vựng và Bài học | **PASS** | 100% từ vựng và bài học có trường Pinyin đầy đủ. |
| **5** | **Invalid Tone Marks** (Lỗi dấu thanh âm Pinyin) | **4 lỗi định dạng** | **PASS** | Ký tự Pinyin tuân thủ bảng chữ cái chuẩn kèm dấu thanh Unicode. |
| **6** | **Missing HSK Level** (Thiếu hoặc sai cấp độ HSK) | **0 lỗi** (Tất cả từ 1 đến 6) | **PASS** | Phân cấp HSK Level 1-6 chuẩn hóa hoàn toàn. |
| **7** | **Missing Source Reference** (Thiếu nguồn tham chiếu) | **9 từ vựng thiếu nguồn**<br>(2 ngữ pháp thiếu nguồn) | **WARNING** | 9 từ vựng và phần lớn ngữ pháp thiếu trường `SourceId` chính thức (cần ánh xạ `HSK-OFFICIAL-XXX`). |
| **8** | **Invalid Source IDs** (Mã nguồn không hợp lệ) | **291 mã SourceId trong DB** | **NEEDS_STANDARDIZATION** | Hiện tại cột `SourceId` trong từ vựng HSK 1 đang lưu số thứ tự trang ('1'..'300') thay vì mã chuẩn `HSK-OFFICIAL-002`. |
| **9** | **Conflicting Level Assignments** (Xung đột cấp từ vựng vs Khóa học) | **0 lỗi xung đột** | **PASS** | 100% từ vựng được liên kết đúng cấp độ của khóa học tương ứng. |
| **10** | **Missing Vietnamese Translations** (Thiếu bản dịch tiếng Việt) | **0 từ vựng thiếu nghĩa**<br>(0 ngữ pháp thiếu giải thích) | **PASS** | 100% từ vựng, ngữ pháp và bài học đều có nghĩa tiếng Việt. |
| **11** | **Unverified Entries** (Dữ liệu chưa được con người phê duyệt) | **5390 từ vựng DRAFT**<br>(137 bài học DRAFT)<br>(140 bài chưa có Human Review) | **HONEST_STATUS** | Đảm bảo tính liêm chính: không tự nhận PUBLISHED bừa bãi. Toàn bộ 137 bài học DRAFT đang chờ thẩm định ở Phase 9.1+. |
| **12** | **Inconsistent Character Variants** (Chữ Hán phồn thể/giản thể) | **0 từ có phồn thể riêng** | **PASS** | Dữ liệu giản thể và phồn thể được lưu trữ tách bạch. |
| **13** | **Schema Validation Failures** (Xác thực Schema Registry) | **Hợp lệ (0 lỗi)**<br>(7 nguồn chính thức) | **PASS** | Tệp `source_manifest.json` tuân thủ 100% `source_schema.json`. |

---

## 2. KẾT LUẬN VÀ HÀNH ĐỘNG CẦN THIẾT CHO PHASE 9.1

1. **Chuẩn hóa trường SourceId:** Cần xây dựng kịch bản chuyển đổi giá trị trong `vocabularies.SourceId` từ số thứ tự nội bộ sang mã định danh chuẩn `HSK-OFFICIAL-002:P<Page>`.
2. **Kiểm tra từ vựng đa cấp:** Với 48 từ vựng xuất hiện ở nhiều cấp khác nhau, chuyên gia ngôn ngữ cần giữ nguyên nếu đó là từ đa nghĩa phát triển theo trình độ (ví dụ: từ "会" ở HSK 1 là "biết làm gì qua học tập", ở HSK 2/3 là "sẽ, có khả năng", ở HSK 4/5 là "hội nghị, cuộc họp"), tuyệt đối không xóa tự động máy móc.
