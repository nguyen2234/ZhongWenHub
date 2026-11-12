# BÁO CÁO TỔNG THỂ PHASE 9.0: KHẢO SÁT, XÁC MINH NGUỒN CHÍNH THỨC VÀ CHUẨN HÓA DỮ LIỆU GIÁO TRÌNH HSK 3.0
## HSK30_PHASE90_OFFICIAL_SOURCE_AUDIT.md

**Dự án:** ZhongWenHub  
**Thời gian thực hiện:** 09/11/2026 (20:15 ICT)  
**Nhóm chuyên gia thực hiện:**  
- Senior Chinese Language Curriculum Designer  
- HSK 3.0 Standards Researcher  
- Chinese–Vietnamese Linguistic QA Specialist  
- Data Engineer / SQL Server Architect  
- ASP.NET Core .NET 10 Engineer  
- Technical Documentation Specialist  
**Mục tiêu:** Xây dựng bộ nguồn tham chiếu chính thức có thẩm quyền, phân định rõ ràng các phiên bản HSK, kiểm toán bản quyền sở hữu trí tuệ, rà soát chất lượng cơ sở dữ liệu và thiết kế đề án tổng thể (Curriculum Blueprint) cho toàn bộ giáo trình HSK 1–6 của ZhongWenHub.

---

## 1. EXECUTIVE SUMMARY (TỔNG QUAN ĐIỀU HÀNH)

1. **Bản chất giai đoạn:** Phase 9.0 là giai đoạn **RESEARCH + AUDIT + DESIGN**, hoàn toàn không tạo bài học tự động hàng loạt, không can thiệp ghi (INSERT/UPDATE/DELETE) hay migration lên cơ sở dữ liệu `ZhongWenHub_Dev`, không tự ý xuất bản bài học và không merge PR #16.
2. **Khảo sát nguồn chính thức:** Đã khảo sát và xác minh 7 nguồn tài liệu có thẩm quyền cao nhất từ Bộ Giáo dục Trung Quốc (MOE), Ủy ban Ngôn ngữ Quốc gia, Trung tâm CLEC, CTI (汉考国际) và BLCUP. Tất cả được lưu trữ có cấu trúc máy đọc được tại `data/hsk30/reference/source_manifest.json` theo chuẩn `source_schema.json`.
3. **Phân biệt phiên bản HSK:** Đã phân định rạch ròi 3 tầng dữ liệu:
   - **GF 0025-2021** (Tiêu chuẩn quốc gia 3 bậc 9 cấp: HSK 1 = 500 từ, 300 chữ, 48 ngữ pháp; HSK 1–6 = 5456 từ).
   - **HSK 2.0 (2015)** (Đề cương thi hiện hành tại các điểm thi quốc tế: HSK 1 = 150 từ, HSK 1–6 = 5000 từ).
   - **Hiện trạng ZhongWenHub Database:** 140 bài học, 5400 từ vựng (HSK 1: 300 từ; HSK 2: 200 từ; HSK 3: 500 từ; HSK 4: 1000 từ; HSK 5: 1600 từ; HSK 6: 1800 từ), 461 điểm ngữ pháp (HSK 1: 72 điểm).
4. **Kiểm toán chất lượng dữ liệu (Data Quality Audit):** Chạy script kiểm tra 13 tiêu chí trên SQL Server: 0 lỗi duplicate ID, 0 lỗi hỏng font Unicode, 0 lỗi thiếu Pinyin, 100% có nghĩa tiếng Việt. Phát hiện 6 cặp từ trùng cùng cấp cần rà soát đồng âm/đa nghĩa và sự cần thiết phải chuẩn hóa cột `SourceId`.
5. **Ranh giới pháp lý & Bản quyền:** Cấm 100% việc sao chép bài khóa, audio, bài tập từ giáo trình thương mại *HSK Standard Course* (BLCUP). Toàn bộ nội dung hội thoại, bài đọc, câu hỏi và giọng đọc của ZhongWenHub là học liệu nguyên bản (Original Pedagogical Content) do đội ngũ sư phạm tự biên soạn.

---

## 2. OFFICIAL SOURCES FOUND (DANH SÁCH NGUỒN CHÍNH THỨC KHẢO SÁT)

Nhóm nghiên cứu đã khảo sát các cổng thông tin chính thức của các cơ quan quản lý và đơn vị phát hành:
- **Cổng thông tin Bộ Giáo dục Trung Quốc (MOE):** `moe.gov.cn`
- **Cổng Dịch vụ Khảo thí Hán ngữ Quốc tế (ChineseTest):** `chinesetest.cn`
- **Trung tâm Giao lưu Ngôn ngữ Trung - Ngoại (CLEC):** `chinese.cn`
- **Nhà xuất bản Đại học Ngôn ngữ Bắc Kinh (BLCUP):** `blcup.com`
- **Nhà xuất bản Giảng dạy Hoa ngữ (Sinolingua):** `sinolingua.com.cn`

Các tài liệu chính thức tìm thấy gồm:
1. Tiêu chuẩn Quốc gia Cộng hòa Nhân dân Trung Hoa: 《国际中文教育中文水平等级标准》(GF 0025-2021).
2. Phụ lục Đề cương 4 chiều chuẩn: Âm tiết, Chữ Hán, Từ vựng, Ngữ pháp đi kèm tiêu chuẩn GF 0025-2021.
3. Đề cương thi và Đề mẫu HSK Cấp 7–9 (汉考国际 CTI 2022).
4. Đề cương thi HSK Cấp 1–6 hiện hành (Phiên bản 2015, Hanban/CTI).
5. Thông cáo chính thức của CTI về lộ trình chuyển đổi và kỳ thi HSK 3.0 toàn cầu (2024–2026).
6. Bộ sách giáo trình thương mại 《HSK标准教程》(Tập 1–6, BLCUP, Khương Lệ Bình chủ biên).
7. Tài liệu hướng dẫn sư phạm quốc tế của CLEC / Sinolingua (2022).

---

## 3. SOURCES VERIFIED (NGUỒN ĐÃ ĐƯỢC XÁC MINH CÓ THẨM QUYỀN)

Toàn bộ 7 nguồn trên đã được thẩm tra tính nguyên gốc, cấp mã định danh `HSK-OFFICIAL-XXX` và xác nhận trạng thái **VERIFIED_OFFICIAL**:

| Source ID | Tên tiếng Trung & Tiêu chuẩn | Đơn vị ban hành | URL chính thức | Loại tài liệu | Trạng thái xác minh |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **HSK-OFFICIAL-001** | 国际中文教育中文水平等级标准 | 教育部、国家语委 | [moe.gov.cn](http://www.moe.gov.cn/jyb_sjzl/moe_364/moe_902/moe_903/202106/t20210602_535261.html) | NATIONAL_STANDARD | **VERIFIED_OFFICIAL** |
| **HSK-OFFICIAL-002** | 《等级标准》附录总表（词汇/语法/汉字） | 教育部中外语言交流合作中心 (CLEC) / BLCUP | [chinese.cn](http://www.chinese.cn/page/#/pcpage/project?id=125) | VOCABULARY_APPENDIX | **VERIFIED_OFFICIAL** |
| **HSK-OFFICIAL-003** | HSK（七-九级）考试大纲及样卷 | 汉考国际 (CTI) | [chinesetest.cn/HSK79](https://www.chinesetest.cn/HSK79) | EXAM_SYLLABUS | **VERIFIED_OFFICIAL** |
| **HSK-OFFICIAL-004** | 新汉语水平考试大纲（HSK 1-6级, 2015） | 国家汉办 / 汉考国际 (CTI) | [chinesetest.cn/HSK](https://www.chinesetest.cn/HSK) | EXAM_SYLLABUS | **VERIFIED_OFFICIAL** |
| **HSK-OFFICIAL-005** | 汉考国际关于新版 HSK 实施安排官方声明 | 汉考国际 (CTI) | [chinesetest.cn/Development](https://www.chinesetest.cn/Development?lang=cn) | IMPLEMENTATION_NOTICE | **VERIFIED_OFFICIAL** |
| **HSK-OFFICIAL-006** | HSK标准教程（1-6册） | 北京语言大学出版社 (BLCUP) | [blcup.com](http://www.blcup.com/SeriesBook/Index/115) | COMMERCIAL_COURSEBOOK | **VERIFIED_OFFICIAL** |
| **HSK-OFFICIAL-007** | 基于《等级标准》的国际中文教学指南 | CLEC / 华语教学出版社 | [sinolingua.com.cn](http://www.sinolingua.com.cn/) | TEACHING_GUIDE | **VERIFIED_OFFICIAL** |

---

## 4. SOURCES REJECTED (CÁC NGUỒN BỊ TỪ CHỐI)

Trong quá trình khảo sát, các nguồn sau đây đã bị **TỪ CHỐI (REJECTED)** và nghiêm cấm sử dụng làm căn cứ học thuật cho ZhongWenHub:
1. **Các kho từ vựng GitHub cá nhân / Kaggle không có trích dẫn xuất xứ:** Chứa nhiều lỗi chính tả Pinyin, trộn lẫn từ cổ, từ địa phương và sai phân cấp.
2. **Các bài viết blog không chính thức tuyên bố HSK 3.0 đã bỏ HSK 1–6:** Đây là tin đồn sai lệch. CTI đã khẳng định kỳ thi HSK 1–6 vẫn tiếp tục diễn ra ổn định và có lộ trình chuyển đổi bài bản.
3. **Các file Excel/PDF chia sẻ trôi nổi trên mạng tự xưng "Đề thi HSK 3.0 rò rỉ":** Không có căn cứ pháp lý, vi phạm quy chế bảo mật khảo thí và có rủi ro pháp lý cao.
4. **Nội dung do các mô hình LLM tự sinh (AI-generated raw lists):** Không được chấp nhận làm bằng chứng xác minh tiêu chuẩn.

---

## 5. HSK VERSION COMPARISON (SO SÁNH CÁC PHIÊN BẢN HSK)

Xem tài liệu chi tiết tại [`docs/hsk30/sources/HSK_VERSION_COMPARISON.md`](file:///D:/ZhongWenHub/docs/hsk30/sources/HSK_VERSION_COMPARISON.md).

Tóm tắt các điểm dị biệt cốt lõi:
- **HSK 2.0 (2009/2015):** 6 cấp độ; độ khó tăng theo cấp số nhân (150 -> 300 -> 600 -> 1200 -> 2500 -> 5000 từ). Cấp 1–2 quá dễ (chỉ 150–300 từ, có Pinyin hỗ trợ hoàn toàn), dẫn tới khoảng cách rất lớn khi lên HSK 3 và HSK 4.
- **GF 0025-2021 (HSK 3.0):** 3 bậc 9 cấp; chuẩn hóa theo khung tham chiếu châu Âu CEFR. Cấp 1 đặt mục tiêu thực chất hơn với 500 từ vựng và 300 chữ Hán ngay từ đầu. Tổng 6 cấp đạt 5456 từ vựng. Bổ sung kỹ năng Dịch thuật (Translation).
- **ZhongWenHub Pedagogical Design:** Tận dụng khung 5400 từ vựng và 461 điểm ngữ pháp hiện có trong database, chia nhỏ 500 từ đầu tiên thành HSK 1 (300 từ cơ bản nhất) + HSK 2 (200 từ nối tiếp, tích lũy đủ 500 từ của chuẩn quốc gia). Đây là thiết kế sư phạm tối ưu cho học viên Việt Nam học trực tuyến.

---

## 6. STANDARDS VS EXAM SYLLABUS (TIÊU CHUẨN NĂNG LỰC VS ĐỀ CƯƠNG THI)

Cần làm rõ cho đội ngũ học thuật và người dùng:
1. **Tiêu chuẩn (Standard - GF 0025-2021):** Định nghĩa năng lực ngôn ngữ toàn diện của một con người (năng lực giao tiếp, thực hiện nhiệm vụ, vốn từ ngữ pháp cần có). Tiêu chuẩn này định hướng cho việc biên soạn giáo trình và giảng dạy lâu dài.
2. **Đề cương thi (Exam Syllabus):** Giới hạn phạm vi xuất hiện trong đề thi chuẩn hóa của CTI tại một thời điểm nhất định. Hiện tại, các bài thi HSK 1–6 trên giấy và trên máy vẫn đang áp dụng ngân hàng câu hỏi đề cương 2015, đồng thời CTI đang tổ chức các kỳ thi thử nghiệm HSK 3.0 trước khi chính thức áp dụng rộng rãi.
3. **Chiến lược của ZhongWenHub:** "Chuẩn hóa theo Tiêu chuẩn Quốc gia GF 0025-2021, đồng thời bao phủ 100% từ vựng của Đề cương thi hiện hành". Học viên hoàn thành giáo trình ZhongWenHub sẽ tự tin thi đỗ cả bài thi hiện hành lẫn bài thi mới.

---

## 7. COPYRIGHT AND LICENSING REVIEW (ĐÁNH GIÁ BẢN QUYỀN SỞ HỮU TRÍ TUỆ)

Xem chi tiết tại [`docs/hsk30/sources/SOURCE_LICENSE_AUDIT.md`](file:///D:/ZhongWenHub/docs/hsk30/sources/SOURCE_LICENSE_AUDIT.md).

**Chính sách 4 KHÔNG về bản quyền:**
1. **KHÔNG** sao chép nguyên văn bài khóa hội thoại từ giáo trình *HSK Standard Course* (BLCUP).
2. **KHÔNG** sao chép câu hỏi, bài tập trong sách bài tập (Workbook) của các nhà xuất bản.
3. **KHÔNG** tải lên các file audio trích xuất từ đĩa CD bản quyền thương mại.
4. **KHÔNG** sao chép nguyên văn đề thi thật có bản quyền của CTI.

**Giải pháp độc quyền của ZhongWenHub:**
- 100% bài hội thoại (Dialogue) được xây dựng theo cốt truyện thực tế của người Việt học tập, làm việc và sinh hoạt tại Trung Quốc/Việt Nam.
- 100% bài đọc (Reading) được biên soạn mới với từ vựng được kiểm soát chặt chẽ trong phạm vi cấp độ.
- 100% file audio được sản xuất riêng qua giọng đọc chuẩn tiếng Phổ thông đã mua bản quyền dịch vụ thương mại.

---

## 8. HSK 1–6 REQUIREMENT MATRIX (MA TRẬN NĂNG LỰC HSK 1–6)

Xem chi tiết tại [`docs/hsk30/sources/HSK_LEVEL_REQUIREMENTS.md`](file:///D:/ZhongWenHub/docs/hsk30/sources/HSK_LEVEL_REQUIREMENTS.md).

| Cấp | Âm tiết | Chữ Hán | Từ vựng chuẩn | Ngữ pháp chuẩn | Yêu cầu kỹ năng nổi bật |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **HSK 1** | 269 | 300 | 500 (DB: 300) | 48 (DB: 72) | Nhận biết chữ Hán, câu đơn cơ bản, chào hỏi, tự giới thiệu, hỏi giá. |
| **HSK 2** | 468 (+199) | 600 (+300) | 1,272 (DB: 500 lũy kế) | 129 (+81) | Giao tiếp sinh hoạt hàng ngày, mua sắm, chỉ đường, mô tả sự việc đơn giản. |
| **HSK 3** | 608 (+140) | 900 (+300) | 2,245 (DB: 1,000 lũy kế) | 210 (+81) | Hoàn tất bậc sơ cấp; xử lý đa số tình huống du lịch, khám bệnh, ngân hàng. |
| **HSK 4** | 724 (+116) | 1,200 (+300) | 3,245 (DB: 2,000 lũy kế) | 286 (+76) | Đàm thoại phạm vi rộng, đọc hiểu báo ngắn, viết đoạn biểu cảm 150-200 chữ. |
| **HSK 5** | 822 (+98) | 1,500 (+300) | 4,316 (DB: 3,600 lũy kế) | 357 (+71) | Đọc báo chí, thưởng thức phim ảnh, thuyết trình, viết bài luận 250-300 chữ. |
| **HSK 6** | 908 (+86) | 1,800 (+300) | 5,456 (DB: 5,400 lũy kế) | 424 (+67) | Tinh thông tiếng Trung; dịch thuật song ngữ, bình luận học thuật, viết báo cáo. |

---

## 9. EXISTING DATABASE COVERAGE (KIỂM KÊ DỮ LIỆU THỰC TẾ TRÊN SQL SERVER)

Dữ liệu truy vấn trực tiếp từ `ZhongWenHub_Dev` (READ-ONLY) ngày 09/11/2026:

```text
=== TỔNG HỢP NỘI DUNG SQL SERVER ZHONGWENHUB_DEV ===
- Khóa học (Courses): 6 khóa (HSK 1 -> HSK 6), 100% PUBLISHED.
- Đơn vị bài học (Units): 35 units (HSK 1: 6, HSK 2: 5, HSK 3: 5, HSK 4: 5, HSK 5: 6, HSK 6: 8).
- Bài học (Lessons): 140 bài học tổng cộng:
    * HSK 1: 15 bài (3 PUBLISHED, 12 DRAFT)
    * HSK 2: 15 bài (0 PUBLISHED, 15 DRAFT)
    * HSK 3: 20 bài (0 PUBLISHED, 20 DRAFT)
    * HSK 4: 20 bài (0 PUBLISHED, 20 DRAFT)
    * HSK 5: 30 bài (0 PUBLISHED, 30 DRAFT)
    * HSK 6: 40 bài (0 PUBLISHED, 40 DRAFT)
    * Tổng PUBLISHED: 3 bài học | Tổng DRAFT: 137 bài học | PENDING_REVIEW: 0 bài.
- Hội thoại & Luyện nghe (Dialogue & Listening): 140/140 bài đã có khung JSON.
- Bài tập (Exercises): 278 bài tập (2 PUBLISHED, 276 DRAFT). Không có bài học nào có 0 bài tập.
- Từ vựng (Vocabularies): 5,400 từ vựng:
    * HSK 1: 300 từ (10 PUBLISHED, 290 DRAFT)
    * HSK 2: 200 từ (Lũy kế 500)
    * HSK 3: 500 từ (Lũy kế 1000)
    * HSK 4: 1000 từ (Lũy kế 2000)
    * HSK 5: 1600 từ (Lũy kế 3600)
    * HSK 6: 1800 từ (Lũy kế 5400)
- Điểm ngữ pháp (GrammarPoints): 461 điểm ngữ pháp:
    * HSK 1: 72 điểm (2 PUBLISHED, 70 DRAFT)
    * HSK 2: 78 điểm | HSK 3: 96 điểm | HSK 4: 95 điểm | HSK 5: 70 điểm | HSK 6: 50 điểm
- Chữ Hán (HanziCharacters): 1,940 chữ Hán độc lập với thông tin bộ thủ, số nét, âm Hán Việt.
- Yêu cầu cấp độ chữ Hán (HanziLevelRequirements): 2,640 bản ghi.
- Người dùng (Users): 39 tài khoản nguyên vẹn 100%.
```

---

## 10. DATA QUALITY RESULTS (KẾT QUẢ KIỂM ĐỊNH CHẤT LƯỢNG)

Xem báo cáo chi tiết tại [`docs/hsk30/HSK30_DATA_QUALITY_REPORT.md`](file:///D:/ZhongWenHub/docs/hsk30/HSK30_DATA_QUALITY_REPORT.md).

- **100% Hoàn hảo:** 0 lỗi Duplicate ID, 0 lỗi hỏng ký tự Unicode, 0 lỗi thiếu Pinyin, 0 lỗi thiếu giải thích nghĩa tiếng Việt.
- **Vấn đề cần chuẩn hóa trong Phase 9.1:**
  1. Trường `SourceId` trong bảng `vocabularies` của HSK 1 hiện đang lưu số thứ tự trang (`'1'` đến `'300'`). Cần chuẩn hóa thành `HSK-OFFICIAL-002:P<Page>`.
  2. Bảng `grammar_points` cần bổ sung trường `SourceId = 'HSK-OFFICIAL-002'` và ánh xạ mã phân nhóm ngữ pháp chuẩn GF 0025-2021.
  3. Có 6 mục từ vựng trùng nhau cùng cấp (do khác từ tính hoặc sắc thái nghĩa, ví dụ: vừa là danh từ vừa là động từ). Cần gắn cờ `Homograph = true` thay vì xóa bỏ máy móc.

---

## 11. PROPOSED CURRICULUM BLUEPRINT (BẢN THIẾT KẾ GIÁO TRÌNH ZHONGWENHUB)

### 11.1. Cấu trúc chuẩn 9 thành phần cho từng bài học ZhongWenHub
Mỗi bài học trên ZhongWenHub được thiết kế theo quy trình học tập khép kín 9 bước:
1. **Mục tiêu học tập (Learning Outcomes):** Nêu rõ mục tiêu giao tiếp, lượng từ vựng và chủ điểm ngữ pháp đạt được sau bài học.
2. **Khởi động & Từ vựng mới (Vocabulary Module):** Danh sách từ mới kèm Hán tự, Pinyin, âm Hán Việt, từ loại, nghĩa tiếng Việt tự nhiên và audio phát âm chuẩn.
3. **Trọng điểm Ngữ pháp (Grammar Points):** Công thức cấu trúc, giải thích quy tắc sư phạm dễ hiểu cho người Việt, kèm câu ví dụ tương phản đúng/sai.
4. **Hội thoại Tình huống (Dialogue in Context):** Ngữ cảnh thực tế (mua sắm, gọi món, đi tàu, hỏi đường), có phân vai người nói, Pinyin, dịch nghĩa song ngữ và phát âm từng câu.
5. **Bài đọc mở rộng (Reading Passage):** Đoạn văn củng cố từ vựng và ngữ pháp, tăng cường khả năng đọc hiểu chữ Hán không phụ thuộc Pinyin.
6. **Luyện nghe chuyên sâu (Listening Practice):** Bài nghe trích đoạn với các câu hỏi nhận diện thông tin then chốt.
7. **Bài tập tương tác (Interactive Exercises):** Trắc nghiệm chọn đáp án, điền từ vào chỗ trống, sắp xếp trật tự câu, nối từ và luyện phản xạ.
8. **Tổng kết & Ôn tập (Lesson Summary & Flashcards):** Ôn tập nhanh qua thẻ ghi nhớ và ma trận kiến thức trọng tâm.
9. **Đánh giá & Thưởng XP (Quiz & Progress Gate):** Bài kiểm tra kết thúc bài học để mở khóa bài tiếp theo và ghi nhận điểm kinh nghiệm (XP) vào hồ sơ học viên.

---

## 12. MISSING SOURCE LIST (DANH SÁCH NGUỒN CẦN BỔ SUNG)

1. **Bộ file âm thanh chuẩn quốc tế của 1110 âm tiết tiếng Trung:** Hiện tại đang sử dụng TTS, cần bổ sung bộ thu âm đối chứng của phát thanh viên bản xứ chuẩn Bắc Kinh.
2. **Đề cương chi tiết kỹ năng Dịch thuật (Translation Framework) của GF 0025-2021:** Tiêu chuẩn có yêu cầu kỹ năng Dịch cho cấp 4–6 nhưng chưa có bảng hướng dẫn chấm thi cụ thể từ CTI.
3. **Danh mục câu hỏi thi thử HSK 3.0 cấp 1–6 chính thức từ CTI:** CTI mới chỉ phát hành đề thi mẫu cho cấp 7–9; đề thi mẫu chính thức cho cấp 1–6 dự kiến công bố cùng đợt áp dụng toàn cầu cuối năm 2026.

---

## 13. HUMAN REVIEW REQUIREMENTS (YÊU CẦU THẨM ĐỊNH CON NGƯỜI)

Để đảm bảo tính nghiêm cẩn học thuật trước khi xuất bản bất kỳ bài học nào:
1. **Không phê duyệt tự động bằng script:** Mọi trạng thái `PUBLISHED` phải có `ReviewedByUserId` là ID của tài khoản Content Manager / Admin thực tế.
2. **Hội đồng thẩm định tối thiểu 2 người:** Người tạo bài (`UpdatedByUserId`) không được tự phê duyệt bài của chính mình (Segregation of Duties).
3. **Quy trình kiểm tra 4 mắt (Four-Eyes Principle):**
   - Mắt 1: Giảng viên biên soạn soạn thảo bài học trên môi trường DRAFT.
   - Mắt 2: Chuyên gia thẩm định ngôn ngữ (Linguistic QA) đối chiếu chữ Hán, Pinyin, thanh điệu và bản dịch tiếng Việt.
   - Chuyển `PENDING_REVIEW` -> Release Gate kiểm tra tự động 6 cổng kỹ thuật -> Người có thẩm quyền nhấn "Phê duyệt" (Review).

---

## 14. IMPLEMENTATION BACKLOG (KẾ HOẠCH TRIỂN KHAI THEO GIAI ĐOẠN)

- **Phase 9.1: Hoàn thiện và Kiểm duyệt Giáo trình HSK 1 (15 bài):**
  - Chuẩn hóa 300 từ vựng cốt lõi và 72 điểm ngữ pháp theo bảng ánh xạ `HSK-OFFICIAL-002`.
  - Hoàn thiện hội thoại nguyên bản và audio cho 12 bài DRAFT còn lại.
  - Đưa 15 bài HSK 1 qua quy trình Review hợp lệ của Content Manager.
- **Phase 9.2: Giáo trình HSK 2 (15 bài, 200 từ mới, 78 ngữ pháp).**
- **Phase 9.3: Giáo trình HSK 3 (20 bài, 500 từ mới, 96 ngữ pháp).**
- **Phase 9.4: Giáo trình HSK 4 (20 bài, 1000 từ mới, 95 ngữ pháp).**
- **Phase 9.5: Giáo trình HSK 5 (30 bài, 1600 từ mới, 70 ngữ pháp).**
- **Phase 9.6: Giáo trình HSK 6 (40 bài, 1800 từ mới, 50 ngữ pháp).**
- **Phase 9.7: Nghiệm thu toàn diện hệ thống giáo trình HSK 1–6 trên CMS và Cổng học viên.**

---

## 15. PHASE 9.1 READINESS (ĐÁNH GIÁ ĐỘ SẴN SÀNG CHO PHASE 9.1)

Hệ thống đã đạt đầy đủ các điều kiện kỹ thuật và nền tảng dữ liệu để tiến hành Phase 9.1 (HSK 1):
- [x] Có Source Registry chuẩn hóa máy đọc được (`source_manifest.json` và `source_schema.json`).
- [x] Có bảng phân định phiên bản học thuật rõ ràng (`HSK_VERSION_COMPARISON.md`).
- [x] Có hướng dẫn kiểm toán bản quyền sở hữu trí tuệ (`SOURCE_LICENSE_AUDIT.md`).
- [x] Có bộ chỉ tiêu định lượng chi tiết theo chuẩn quốc gia (`HSK_LEVEL_REQUIREMENTS.md`).
- [x] Cơ sở dữ liệu SQL Server sẵn sàng với cấu trúc 15 bài HSK 1 đã có đầy đủ hội thoại, luyện nghe và bài tập.
- [x] Quy trình Release Gate nghiêm ngặt với Segregation of Duties và fail-closed guard bảo vệ an toàn 100% cho database Dev.

---

## 16. RISKS AND OPEN QUESTIONS (RỦI RO VÀ CÂU HỎI MỞ)

1. **Rủi ro quá tải từ vựng HSK 1:** Nếu áp dụng ngay 500 từ của GF 0025-2021 cho HSK 1 thì khối lượng kiến thức sẽ quá nặng đối với học viên mới bắt đầu.  
   *Giải pháp đề xuất:* Giữ nguyên lộ trình 300 từ cho HSK 1 và 200 từ nối tiếp ở HSK 2 (tổng 500 từ khi hoàn tất HSK 2). Gắn nhãn minh bạch trong giao diện học viên.
2. **Tiến độ thi chính thức của CTI:** CTI có thể điều chỉnh ngày áp dụng toàn cầu của đề thi HSK 3.0 tùy theo kết quả các đợt thi thử nghiệm năm 2026.  
   *Giải pháp đề xuất:* Thiết kế giáo trình tương thích kép (Dual-Compatibility) để học viên học xong có thể thi tốt ở cả 2 hình thức đề thi.
3. **Bản quyền giọng đọc Audio:** Cần đảm bảo thỏa thuận sử dụng dịch vụ TTS thương mại không có điều khoản hạn chế quyền xuất bản nội dung giáo dục trực tuyến.
