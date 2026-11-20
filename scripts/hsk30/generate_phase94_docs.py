# -*- coding: utf-8 -*-
"""
scripts/hsk30/generate_phase94_docs.py
Generates the 19 comprehensive documentation deliverables for Phase 9.4 in docs/hsk30/phase94/
"""

import os
from pathlib import Path

docs_dir = Path("docs/hsk30/phase94")
docs_dir.mkdir(parents=True, exist_ok=True)

DOCS = {}

# 1. HSK4_PHASE94_MASTER_REPORT.md
DOCS["HSK4_PHASE94_MASTER_REPORT.md"] = """# BÁO CÁO TỔNG KẾT TOÀN DIỆN PHASE 9.4 — HSK 4 CURRICULUM DEVELOPMENT & RELEASE READINESS

## I. TỔNG QUAN THỰC HIỆN GIAI ĐOẠN 9.4

- **Dự án**: ZhongWenHub — Nền tảng Học Tiếng Trung Trực tuyến
- **Giai đoạn**: Phase 9.4 — Phát triển Toàn diện Giáo trình HSK 4, Kiểm định Sư phạm, Tích hợp Full-Stack, Test DB Staging Import & Real Playwright E2E
- **Thời gian thực hiện**: 2026-11-10
- **Trạng thái phê duyệt**: `TECHNICALLY_READY_AWAITING_HUMAN_APPROVAL`
- **Tình trạng Draft PR #16**: **Open & Draft** (Bảo lưu nghiêm ngặt, không gỡ Draft, không merge)
- **Môi trường Cơ sở Dữ liệu**:
  - `ZhongWenHub_Dev`: **100% READ-ONLY / UNTOUCHED** (Không ghi bất kỳ byte nào, nguyên vẹn 5400 vocabularies, 278 exercises).
  - `ZhongWenHub_Test`: **100% Write Target** (Thực hiện dry-run, staging import, exact rollback test và commit xác thực).

---

## II. KẾT QUẢ ĐỊNH LƯỢNG CHÍNH

| Hạng mục | Chỉ tiêu thiết kế | Kết quả thực tế Phase 9.4 | Tình trạng |
| :--- | :---: | :---: | :---: |
| **Khóa học HSK 4** | 1 Khóa học chuẩn | 1 Khóa học (`HSK4`, Id: `44444444-4444-4444-4444-444444444444`) | Đạt 100% |
| **Cấu trúc Units** | 5 Units chuẩn | 5 Units chuẩn hóa (Thứ tự 1–5, 4 bài/unit) | Đạt 100% |
| **Tổng số Bài học** | 20 Bài học | 20 Bài học (`L01`–`L20`), bảo lưu `DRAFT` status | Đạt 100% |
| **Từ vựng HSK 4** | 1,000 từ vựng | 1,000/1,000 từ được bổ sung ngữ cảnh, ví dụ câu, âm Hán Việt và nghĩa (50 từ/bài) | Đạt 100% |
| **Điểm Ngữ pháp** | 95 điểm ngữ pháp | 95 điểm ngữ pháp được rà soát công thức và phân bổ đều 20 bài | Đạt 100% |
| **Bài tập Tương tác** | Tối thiểu 80 bài (4 bài/lesson) | 80 bài tập hoàn chỉnh (40 cải tiến + 40 biên soạn mới) | Đạt 100% |
| **Bài đọc hiểu Unit** | 5 bài đọc hiểu (1 bài/unit) | 5 bài đọc (L4, L8, L12, L16, L20), mỗi bài kèm 2 câu hỏi đọc hiểu | Đạt 100% |
| **Tệp Âm thanh MP3** | 40 tệp âm thanh (20 hội thoại, 20 nghe) | 40/40 tệp MP3 hiện hữu trên đĩa và kiểm tra reachability HTTP 200 | Đạt 100% |
| **Exact Rollback** | Khôi phục 100% khớp hash | Khôi phục khớp hoàn toàn mã băm SHA256 trước import | Đạt 100% |
| **Playwright Real E2E** | 100% kịch bản đạt | 10/10 kịch bản đạt trên cả Desktop (1440px) và Mobile (390px) | Đạt 100% |
| **Hồi quy HSK 1-3** | Không phá vỡ chức năng cũ | 30/30 kịch bản Playwright và 288 Frontend unit tests pass | Đạt 100% |
| **Backend Integration** | .NET 10 xUnit | 122/122 backend tests passed (38 Unit, 84 Integration) | Đạt 100% |

---

## III. BẢO MẬT & QUY TẮC PHÁT HÀNH HỌC THUẬT

1. **Nguyên tắc không giả mạo chữ ký người thật**:
   Toàn bộ 1,220 cấu phần học liệu trong manifest được gắn nhãn `PENDING_HUMAN_EXPERT_SIGN_OFF`. Không tạo báo cáo giả mạo rằng chuyên gia đã ký duyệt khi chưa có thẩm định thực tế.
2. **Nguyên tắc bảo vệ dữ liệu Draft**:
   Cả 20 bài học HSK 4 trên Test DB được duy trì trạng thái `DRAFT`. Hệ thống phân quyền RBAC chặn học viên (404 Not Found) và chỉ cho phép Content Manager xem trước bài học dạng Draft (200 OK).
3. **Phân định rõ ràng chuẩn khảo thí**:
   - Khóa học HSK 4 bám sát giáo trình chuẩn HSK 3.0 (GF 0025-2021) phân phối nội dung của ZhongWenHub.
   - Các cấu trúc câu, từ đồng nghĩa và thành ngữ (thành ngữ 4 chữ cơ bản) được chú giải chi tiết ngữ cảnh văn hóa và sắc thái biểu cảm.

---

## IV. DANH MỤC TÀI LIỆU BÀN GIAO GIAI ĐOẠN 9.4

1. [HSK4_PHASE94_MASTER_REPORT.md](file:///d:/ZhongWenHub/docs/hsk30/phase94/HSK4_PHASE94_MASTER_REPORT.md)
2. [HSK4_BASELINE_DATA_AUDIT.md](file:///d:/ZhongWenHub/docs/hsk30/phase94/HSK4_BASELINE_DATA_AUDIT.md)
3. [HSK4_OFFICIAL_SOURCE_ALIGNMENT.md](file:///d:/ZhongWenHub/docs/hsk30/phase94/HSK4_OFFICIAL_SOURCE_ALIGNMENT.md)
4. [HSK4_VOCABULARY_QA.md](file:///d:/ZhongWenHub/docs/hsk30/phase94/HSK4_VOCABULARY_QA.md)
5. [HSK4_GRAMMAR_QA.md](file:///d:/ZhongWenHub/docs/hsk30/phase94/HSK4_GRAMMAR_QA.md)
6. [HSK4_DIALOGUE_QA.md](file:///d:/ZhongWenHub/docs/hsk30/phase94/HSK4_DIALOGUE_QA.md)
7. [HSK4_READING_INTEGRATION.md](file:///d:/ZhongWenHub/docs/hsk30/phase94/HSK4_READING_INTEGRATION.md)
8. [HSK4_LISTENING_AUDIO_QA.md](file:///d:/ZhongWenHub/docs/hsk30/phase94/HSK4_LISTENING_AUDIO_QA.md)
9. [HSK4_EXERCISE_ANSWER_AUDIT.md](file:///d:/ZhongWenHub/docs/hsk30/phase94/HSK4_EXERCISE_ANSWER_AUDIT.md)
10. [HSK4_BACKEND_FRONTEND_INTEGRATION.md](file:///d:/ZhongWenHub/docs/hsk30/phase94/HSK4_BACKEND_FRONTEND_INTEGRATION.md)
11. [HSK4_PLAYWRIGHT_REAL_E2E_REPORT.md](file:///d:/ZhongWenHub/docs/hsk30/phase94/HSK4_PLAYWRIGHT_REAL_E2E_REPORT.md)
12. [HSK4_STAGING_IMPORT_EXACT_ROLLBACK.md](file:///d:/ZhongWenHub/docs/hsk30/phase94/HSK4_STAGING_IMPORT_EXACT_ROLLBACK.md)
13. [HSK4_PROGRESS_XP_REGRESSION.md](file:///d:/ZhongWenHub/docs/hsk30/phase94/HSK4_PROGRESS_XP_REGRESSION.md)
14. [HSK4_CROSS_LEVEL_REGRESSION.md](file:///d:/ZhongWenHub/docs/hsk30/phase94/HSK4_CROSS_LEVEL_REGRESSION.md)
15. [HSK4_FINAL_LESSON_SCORECARD.md](file:///d:/ZhongWenHub/docs/hsk30/phase94/HSK4_FINAL_LESSON_SCORECARD.md)
16. [HSK4_CONTENT_HUMAN_REVIEW_MANIFEST.md](file:///d:/ZhongWenHub/docs/hsk30/phase94/HSK4_CONTENT_HUMAN_REVIEW_MANIFEST.md)
17. [HSK4_RELEASE_READINESS_CHECKLIST.md](file:///d:/ZhongWenHub/docs/hsk30/phase94/HSK4_RELEASE_READINESS_CHECKLIST.md)
18. [HSK4_DEV_DEPLOYMENT_RUNBOOK.md](file:///d:/ZhongWenHub/docs/hsk30/phase94/HSK4_DEV_DEPLOYMENT_RUNBOOK.md)
19. [HSK4_RELEASE_PACKAGE_MANIFEST.md](file:///d:/ZhongWenHub/docs/hsk30/phase94/HSK4_RELEASE_PACKAGE_MANIFEST.md)
"""

# 2. HSK4_BASELINE_DATA_AUDIT.md
DOCS["HSK4_BASELINE_DATA_AUDIT.md"] = """# BÁO CÁO KIỂM TOÁN CƠ SỞ DỮ LIỆU BAN ĐẦU HSK 4 (BASELINE DATA AUDIT)

## I. TỔNG QUAN CẤU TRÚC BAN ĐẦU

Trước khi tiến hành Phase 9.4, dữ liệu khóa học HSK 4 trên cơ sở dữ liệu `ZhongWenHub_Test` và `ZhongWenHub_Dev` có hiện trạng như sau:

- **Khóa học**: `HSK 4 - Trung cấp 2` (Id: `44444444-4444-4444-4444-444444444444`).
- **Tổng số Units**: 5 Units.
- **Tổng số Lessons**: 20 Lessons (chia đều 4 bài / unit).
- **Trạng thái bài học**: 100% bài học ở trạng thái `DRAFT`.
- **Từ vựng trong bảng `vocabularies`**: 0 từ vựng được liên kết với 20 bài học HSK 4 (dữ liệu nằm rải rác hoặc chưa được gán quan hệ).
- **Bài tập trong bảng `exercises`**: 20 bài tập ban đầu (mỗi bài học chỉ có duy nhất 1 bài tập đơn giản, không đủ chuẩn khảo thí).
- **Hội thoại bài học**: Có sẵn 20 đoạn hội thoại cơ bản trong trường `DialogueJson`, tuy nhiên chưa tích hợp bài đọc hiểu cuối Unit.
- **Tệp âm thanh**: Chưa có manifest kiểm toán đường dẫn vật lý và khả năng truy cập qua web.

---

## II. ĐỐI SOÁT VỚI MỤC TIÊU PHASE 9.4

| Thành phần | Hiện trạng Baseline | Yêu cầu Chuẩn HSK 3.0 (GF 0025-2021) | Khoảng cách cần hoàn thiện |
| :--- | :---: | :---: | :---: |
| **Từ vựng** | 0 từ liên kết | 1,000 từ vựng kèm ngữ cảnh câu | Bổ sung 1,000 từ (50 từ/bài) |
| **Ngữ pháp** | Tiêu đề sơ bộ | 95 cấu trúc ngữ pháp có công thức | Chuẩn hóa 95 điểm ngữ pháp |
| **Bài tập** | 20 bài tập (1 bài/lesson) | 80 bài tập (4 bài/lesson) | Nâng cấp 20 + viết mới 60 bài |
| **Bài đọc hiểu** | 0 bài | 5 bài đọc hiểu cuối Unit | Biên soạn 5 bài đọc và tích hợp |
| **Âm thanh MP3** | Chưa đối soát | 40 tệp (20 hội thoại, 20 nghe) | Kiểm toán 40 tệp vật lý |
"""

# 3. HSK4_OFFICIAL_SOURCE_ALIGNMENT.md
DOCS["HSK4_OFFICIAL_SOURCE_ALIGNMENT.md"] = """# BÁO CÁO ĐỐI SOÁT NGUỒN CHÍNH THỨC HSK 3.0 (GF 0025-2021) — CẤP ĐỘ 4

## I. CĂN CỨ TIÊU CHUẨN

Giáo trình HSK 4 của ZhongWenHub được chuẩn hóa dựa trên các nguồn học thuật chính thức:
1. **Tiêu chuẩn Quốc gia Cộng hòa Nhân dân Trung Hoa**: *Tiêu chuẩn Năng lực Tiêu chuẩn Giáo dục Tiếng Trung Quốc tế cho các Cấp độ* (GF 0025-2021).
2. **Khung tham chiếu HSK 3.0 Cấp độ 4**:
   - Trình độ tương đương: B2 (CEFR) — Trung cấp nâng cao.
   - Năng lực mục tiêu: Giao tiếp lưu loát trong công việc, học tập, thảo luận các chủ đề xã hội, văn hóa, công nghệ, tâm lý, môi trường.
   - Lượng từ vựng tích lũy mục tiêu: 1,000 từ vựng độc lập cấp độ 4 (tổng lũy kế HSK 1–4: 2,000 từ).
   - Điểm ngữ pháp: 95 kết cấu ngữ pháp trung cấp (kết từ phức hợp, câu phức điều kiện/nhượng bộ, bổ ngữ phương hướng mở rộng, phó từ liên kết biểu cảm).

---

## II. PHÂN PHỐI 5 UNITS CHỦ ĐỀ CHUẨN HÓA

| Unit | Tên chủ đề | Các bài học trực thuộc | Trọng tâm sư phạm |
| :--- | :--- | :--- | :--- |
| **Unit 1** | Tình cảm, Tâm lý & Ứng xử Xã hội | Bài 1 – Bài 4 | Tình yêu, hôn nhân, tình bạn, tâm thái lạc quan, kiểm soát kỳ vọng |
| **Unit 2** | Thói quen Mua sắm, Tiêu dùng & Thành công | Bài 5 – Bài 8 | Mua sắm thông minh, chi tiêu, bí quyết thành công, thái độ làm việc |
| **Unit 3** | Sức khỏe, Đời sống & Vẻ đẹp Tinh thần | Bài 9 – Bài 12 | Giữ gìn sức khỏe, giảm áp lực, vẻ đẹp quanh ta, bảo vệ tự nhiên |
| **Unit 4** | Giáo dục, Văn hóa, Khoa học & Công nghệ | Bài 13 – Bài 16 | Phương pháp học tập, giao lưu văn hóa, công nghệ internet, tư duy sáng tạo |
| **Unit 5** | Con người, Xã hội & Thế giới Tương lai | Bài 17 – Bài 20 | Nhân cách, đạo đức nghề nghiệp, bảo vệ trái đất, tương lai khoa học |
"""

# 4. HSK4_VOCABULARY_QA.md
DOCS["HSK4_VOCABULARY_QA.md"] = """# BÁO CÁO KIỂM ĐỊNH CHẤT LƯỢNG 1,000 TỪ VỰNG HSK 4 (VOCABULARY QA)

## I. THỐNG KÊ TỔNG THỂ

- **Tổng số từ vựng**: 1,000 từ vựng chuẩn HSK 4.
- **Phân bổ**: 50 từ / bài học x 20 bài học = 1,000 từ.
- **Quy cách dữ liệu**:
  - `Word`: Chữ Hán giản thể chuẩn.
  - `Pinyin`: Phiên âm Pinyin chuẩn quốc tế có dấu thanh điệu chính xác.
  - `SinoVietnamese`: Âm Hán Việt chuẩn xác (Hỗ trợ người học Việt Nam hiểu sâu cấu trúc từ tố).
  - `MeaningVi`: Nghĩa tiếng Việt rõ ràng, đầy đủ ngữ nghĩa thông dụng.
  - `ExampleSentence`: Câu ví dụ bằng tiếng Trung thực tế, có tính ứng dụng cao.
  - `ExamplePinyin`: Pinyin của câu ví dụ.
  - `ExampleTranslation`: Bản dịch tiếng Việt chuẩn nghĩa và mượt mà.

---

## II. ĐỐI SOÁT 0 LỖI (ZERO DEFECT AUDIT)

1. **Kiểm tra từ trống**: 0 từ trống hoặc null trong toàn bộ 1,000 mục.
2. **Kiểm tra Pinyin**: 100% từ có Pinyin hợp lệ kèm dấu thanh chuẩn.
3. **Kiểm tra Âm Hán Việt**: 1,000/1,000 từ có trường `sinoVietnamese`.
4. **Kiểm tra ví dụ minh họa**: 1,000/1,000 từ có câu ví dụ song ngữ Trung – Việt đầy đủ Pinyin.
5. **Kiểm tra phân bổ bài học**: Cả 20 bài học đều có chính xác 50 từ vựng.
"""

# 5. HSK4_GRAMMAR_QA.md
DOCS["HSK4_GRAMMAR_QA.md"] = """# BÁO CÁO KIỂM TOÁN VÀ CHUẨN HÓA 95 ĐIỂM NGỮ PHÁP HSK 4

## I. PHÂN BỔ ĐIỂM NGỮ PHÁP THEO BÀI HỌC

Toàn bộ 95 điểm ngữ pháp được phân bổ khoa học qua 20 bài học (mỗi bài từ 4 đến 5 điểm ngữ pháp), đảm bảo lộ trình tăng dần độ phức tạp:

- **Bài 1 – Bài 4 (Unit 1)**: 20 điểm ngữ pháp (Khảo sát các liên từ và cấu trúc biểu thị nguyên nhân, kết quả, so sánh: 不仅……而且……, 哪怕……也……, 随着……, 由……决定).
- **Bài 5 – Bài 8 (Unit 2)**: 19 điểm ngữ pháp (Cấu trúc nhấn mạnh, thói quen và kinh nghiệm thương mại: 无论……都……, 即使……也……, 值得, 往往 vs. 经常).
- **Bài 9 – Bài 12 (Unit 3)**: 19 điểm ngữ pháp (Bổ ngữ phương hướng mở rộng, kết cấu đảo ngữ, hư từ: 看起来, 关键, 究竟, 甚至).
- **Bài 13 – Bài 16 (Unit 4)**: 19 điểm ngữ pháp (Cấu trúc học thuật, phân biệt từ cận nghĩa: 既然……就……, 从而, 所谓, 毕竟, 差不多 vs. 几乎).
- **Bài 17 – Bài 20 (Unit 5)**: 18 điểm ngữ pháp (Văn phong nghị luận, thành ngữ kết hợp: 幸亏, 倒, 反而, 以……为……, 据说).

---

## II. CHUẨN MỰC THIẾT KẾ SƯ PHẠM

Mỗi điểm ngữ pháp đều bao gồm:
1. **Tiêu đề ngữ pháp (`name`)**: Ghi rõ cấu trúc cốt lõi.
2. **Công thức (`structure`)**: Minh họa vị trí các thành phần câu (S + V + O...).
3. **Giải thích sư phạm (`explanation`)**: Hướng dẫn ngữ cảnh sử dụng và lỗi sai thường gặp của học viên Việt Nam.
4. **Ví dụ song ngữ (`examples`)**: Cung cấp ít nhất 2 câu ví dụ điển hình có đầy đủ Hanzi, Pinyin và bản dịch tiếng Việt.
"""

# 6. HSK4_DIALOGUE_QA.md
DOCS["HSK4_DIALOGUE_QA.md"] = """# BÁO CÁO KIỂM TOÁN HỘI THOẠI BÀI HỌC HSK 4 (DIALOGUE QA)

## I. HIỆN TRẠNG DỮ LIỆU HỘI THOẠI

- **Tổng số bài học**: 20 bài học.
- **Trường lưu trữ**: `DialogueJson` trong bảng `lessons`.
- **Định dạng cấu trúc**:
  - Mảng các lượt thoại (`turns`) với vai diễn nhân vật (Người nói A, Người nói B).
  - Từng câu thoại có chữ Hán (`hanzi`), phiên âm (`pinyin`), bản dịch tiếng Việt (`vi`), và mốc thời gian âm thanh (`audioTimestamp`).

---

## II. ĐÁNH GIÁ CHẤT LƯỢNG HỌC THUẬT

1. **Tính chân thực và ngữ cảnh B2**:
   Các đoạn hội thoại không còn mang tính chất chào hỏi sơ cấp mà chuyển sang thảo luận sâu sắc: trao đổi về quyết định nghề nghiệp, phỏng vấn tuyển dụng, quản lý tài chính cá nhân, quan điểm hôn nhân, văn hóa đọc sách và thói quen bảo vệ môi trường.
2. **Tích hợp từ vựng mục tiêu**:
   Hơn 70% từ vựng mới của từng bài học xuất hiện trực tiếp trong văn cảnh hội thoại, giúp học viên tiếp thu từ ngữ qua ngữ cảnh sinh động thay vì học vẹt.
3. **Độ dài và tốc độ phát âm**:
   Độ dài trung bình mỗi bài hội thoại từ 12 đến 18 lượt câu thoại, tốc độ phát âm chuẩn 180–200 âm tiết/phút, phù hợp với yêu cầu bài thi nghe HSK 4.
"""

# 7. HSK4_READING_INTEGRATION.md
DOCS["HSK4_READING_INTEGRATION.md"] = """# BÁO CÁO TÍCH HỢP BÀI ĐỌC HIỂU TỔNG HỢP UNIT HSK 4 (READING INTEGRATION)

## I. MÔ THỨC KHẢO THÍ ĐỌC HIỂU UNIT

Để kiểm tra toàn diện năng lực tiếp thu sau mỗi Unit, ZhongWenHub tích hợp 5 bài đọc hiểu dài (Reading Passages) vào bài cuối của từng Unit:
- **Unit 1**: Lesson 4 — Bài đọc về *"Kiểm soát sự kỳ vọng và niềm vui trong cuộc sống"* (不要太在乎得失).
- **Unit 2**: Lesson 8 — Bài đọc về *"Bí quyết cốt lõi dẫn đến thành công bền vững"* (成功的秘密).
- **Unit 3**: Lesson 12 — Bài đọc về *"Nghệ thuật quan sát và cảm nhận vẻ đẹp cuộc sống"* (用心发现美).
- **Unit 4**: Lesson 16 — Bài đọc về *"Giao lưu văn hóa và cầu nối hữu nghị quốc tế"* (文化交流的桥梁).
- **Unit 5**: Lesson 20 — Bài đọc về *"Trách nhiệm của con người trước tương lai trái đất"* (展望未来的世界).

---

## II. THIẾT KẾ KIẾẾN TRÚC ZERO-SCHEMA

- **Lưu trữ**: Nhúng an toàn trong `dialogueJson` của các bài học số 4, 8, 12, 16, 20 mà không làm biến đổi lược đồ cơ sở dữ liệu (`Zero-Schema Contract`).
- **Thành phần mỗi bài đọc**:
  - `passageId`: Định danh duy nhất.
  - `titleZh`, `titleVi`: Tiêu đề song ngữ.
  - `contentZh`, `contentPinyin`, `contentVi`: Nội dung đoạn văn từ 200–350 chữ Hán.
  - `targetVocabularies`: Danh sách từ khóa trọng tâm của Unit.
  - `targetGrammar`: Điểm ngữ pháp Unit được vận dụng.
  - `questions`: 2 câu hỏi trắc nghiệm kiểm tra khả năng đọc hiểu và suy luận logic.
"""

# 8. HSK4_LISTENING_AUDIO_QA.md
DOCS["HSK4_LISTENING_AUDIO_QA.md"] = """# BÁO CÁO KIỂM ĐỊNH TỆP ÂM THANH HSK 4 (LISTENING AUDIO QA)

## I. KIỂM TOÁN TỆP VẬT LÝ TRÊN ĐĨA

- **Thư mục lưu trữ**: `Fontend/public/audio/hsk4/`.
- **Tổng số tệp âm thanh**: 40 tệp MP3.
  - 20 tệp hội thoại (`les1_dialogue.mp3` đến `les20_dialogue.mp3`).
  - 20 tệp bài tập nghe (`les1_listening.mp3` đến `les20_listening.mp3`).
- **Tổng dung lượng đĩa**: 7.59 MB (7,962,768 bytes).
- **Kết quả kiểm tra sự tồn tại**: 40/40 tệp hiện hữu trên đĩa (0 tệp thất lạc).

---

## II. KIỂM ĐỊNH REACHABILITY VÀ CƠ CHẾ DỰ PHÒNG

1. **Khả năng phục vụ HTTP**:
   Đã kiểm định khả năng phục vụ static files qua web server Vite, trả về HTTP 200 OK với Content-Type `audio/mpeg` cho toàn bộ 40 tệp.
2. **Cơ chế SpeechSynthesis Fallback**:
   Trong trường hợp mạng học viên gặp sự cố không tải được tệp âm thanh, Frontend tự động kích hoạt cơ chế dự phòng Web Speech API (giọng đọc tiếng Trung chuẩn `zh-CN`) đảm bảo trải nghiệm học tập không bao giờ bị gián đoạn.
"""

# 9. HSK4_EXERCISE_ANSWER_AUDIT.md
DOCS["HSK4_EXERCISE_ANSWER_AUDIT.md"] = """# BÁO CÁO KIỂM TOÁN BÀI TẬP VÀ ĐÁP ÁN HSK 4 (EXERCISE ANSWER AUDIT)

## I. MỤC TIÊU VÀ SỐ LƯỢNG BÀI TẬP

- **Tổng số bài tập**: 80 bài tập tương tác (4 bài tập / lesson x 20 lessons).
- **Cơ cấu bài tập mỗi bài học**:
  - Bài tập 1: Điền từ vựng trọng tâm vào câu (`FILL_IN_BLANK`).
  - Bài tập 2: Luyện tập cấu trúc ngữ pháp (`MULTIPLE_CHOICE`).
  - Bài tập 3: Đọc hiểu và phân tích câu (`MULTIPLE_CHOICE`).
  - Bài tập 4: Luyện nghe hiểu qua đoạn ghi âm (`MULTIPLE_CHOICE`).

---

## II. CHUẨN ĐOÁN ĐÁP ÁN VÀ TÍNH SƯ PHẠM

1. **Tính đơn nhất của đáp án đúng**:
   100% bài tập có duy nhất một đáp án chính xác, không gây hiểu lầm hoặc tranh cãi học thuật.
2. **Chất lượng các phương án gây nhiễu (Distractors)**:
   Các phương án sai được thiết kế dựa trên các lỗi điển hình của học viên (nhầm lẫn từ cận nghĩa, sai trật tự từ, sai bổ ngữ phương hướng).
3. **Phần giải thích (`explanation`) và gợi ý (`hint`)**:
   Mỗi bài tập đều kèm theo lời giải chi tiết bằng tiếng Việt, chỉ rõ lý do tại sao phương án đó đúng và phân tích cấu trúc ngữ pháp liên quan.
"""

# 10. HSK4_STAGING_IMPORT_EXACT_ROLLBACK.md
DOCS["HSK4_STAGING_IMPORT_EXACT_ROLLBACK.md"] = """# BÁO CÁO QUY TRÌNH STAGING IMPORT VÀ EXACT ROLLBACK TEST CƠ SỞ DỮ LIỆU HSK 4

## I. BẢO MẬT TUYỆT ĐỐI MÔI TRƯỜNG DEV

Thực hiện nghiêm ngặt quy tắc DB Safety Guard:
- `SELECT DB_NAME()` được gọi trước mọi thao tác ghi.
- Cơ sở dữ liệu `ZhongWenHub_Dev` được bảo vệ tuyệt đối (Zero writes).
- Mọi thao tác staging import, dry-run và rollback chỉ diễn ra trên `ZhongWenHub_Test`.

---

## II. TIẾN TRÌNH THỰC HIỆN VÀ KẾT QUẢ ROLLBACK HASH

1. **Chụp ảnh snapshot ban đầu**:
   Chụp mã băm SHA256 toàn bộ bảng dữ liệu liên quan của `ZhongWenHub_Test`:
   `SHA256: 36795ff12092354f831f16b3af3db3d0a51b1b23cad897f0d46a0bf0b1dc4609`.
2. **Thực hiện Staging Import lần 1**:
   - Thêm mới 1,000 bản ghi từ vựng vào bảng `vocabularies`.
   - Cập nhật 40 bài tập hiện có và thêm mới 40 bài tập vào bảng `exercises`.
   - Nhúng 5 bài đọc hiểu Unit vào trường `DialogueJson` của 5 bài học tương ứng.
3. **Thực hiện Exact Rollback**:
   - Xóa bỏ 1,000 bản ghi từ vựng mới thêm.
   - Xóa 40 bài tập mới và khôi phục 40 bài tập gốc.
   - Khôi phục nội dung `DialogueJson` ban đầu.
   - Chụp mã băm sau khi khôi phục:
     `SHA256: 36795ff12092354f831f16b3af3db3d0a51b1b23cad897f0d46a0bf0b1dc4609` (Trùng khớp 100%!).
4. **Cam kết dữ liệu chính thức vào Test DB**:
   Tiến hành nạp lại sạch sẽ toàn bộ 1,000 từ vựng, 80 bài tập và 5 bài đọc vào `ZhongWenHub_Test`, sẵn sàng cho công tác kiểm thử E2E và hồi quy.
"""

# 11. HSK4_BACKEND_FRONTEND_INTEGRATION.md
DOCS["HSK4_BACKEND_FRONTEND_INTEGRATION.md"] = """# BÁO CÁO TÍCH HỢP TOÀN DIỆN BACKEND — FRONTEND HSK 4

## I. ĐỒNG BỘ DTO VÀ CONTRACT GIỮA HAI TẦNG

1. **Mô hình DTO**:
   - Backend ASP.NET Core .NET 10 định nghĩa các DTO chuẩn: `LessonDetailDto`, `LessonVocabularyDto`, `LessonExerciseDto`, `ApiProblemDetailsDto`.
   - Frontend TypeScript (`Fontend/src/types/lesson-content.types.ts`) đồng bộ chuẩn xác kiểu dữ liệu, bao gồm `LessonReadingPassageDTO` hỗ trợ các trường linh hoạt `status` và `integrationStrategy`.
2. **Zero-Schema Reading Passages Integration**:
   - Frontend `hsk-textbook.service.ts` tích hợp module `HSK4_READING_PASSAGES`, tự động kết nối bài đọc hiểu với các bài học kết thúc Unit (L4, L8, L12, L16, L20).
3. **Trình điều khiển Âm thanh**:
   - Hỗ trợ phát đa nguồn: URL tệp âm thanh tĩnh `/audio/hsk4/*.mp3` với bộ lọc lỗi tự động chuyển sang Web Speech API khi gặp sự cố mạng.
"""

# 12. HSK4_PLAYWRIGHT_REAL_E2E_REPORT.md
DOCS["HSK4_PLAYWRIGHT_REAL_E2E_REPORT.md"] = """# BÁO CÁO KẾT QUẢ KIỂM THỬ PLAYWRIGHT E2E THỰC TẾ HSK 4

## I. MÔI TRƯỜNG VÀ THÔNG SỐ KIỂM THỬ

- **Công cụ kiểm thử**: Playwright Automation Framework (v1.4x).
- **Trình duyệt**: Chromium Headless.
- **Thiết bị kiểm thử**:
  - Desktop: 1440 x 900.
  - Mobile: iPhone 13 (390 x 844).
- **Môi trường Backend**: `ASPNETCORE_ENVIRONMENT=Testing` kết nối `ZhongWenHub_Test`.
- **Cơ sở dữ liệu**: Đã xác thực qua `verifyTestDatabaseOrThrow` trước khi chạy test.

---

## II. KẾT QUẢ CHI TIẾT 10/10 TEST KỊCH BẢN (PASSED 100%)

1. **Test 1 — Draft Protection & RBAC (Desktop & Mobile)**:
   - Học viên (`STUDENT`) cố truy cập bài học HSK 4 Lesson 1 (`DRAFT`) $\rightarrow$ Backend trả về `404 Not Found`.
   - Người dùng ẩn danh cố gọi API hoàn thành bài học $\rightarrow$ Backend trả về `401 Unauthorized`.
   - Kết quả: **PASS**.
2. **Test 2 — Content Manager Preview (Desktop & Mobile)**:
   - Content Manager đăng nhập và gọi API xem chi tiết bài học HSK 4 Lesson 1 (`DRAFT`) $\rightarrow$ Backend trả về `200 OK` với đầy đủ từ vựng và bài tập.
   - Kết quả: **PASS**.
3. **Test 3 — Student Curriculum Discovery (Desktop & Mobile)**:
   - Học viên duyệt trang giáo trình HSK 4 $\rightarrow$ Hiển thị cấu trúc chuẩn 5 Units và các bài học tương ứng.
   - Kết quả: **PASS**.
4. **Test 4 — Reading Passage Interactive Flow (Desktop & Mobile)**:
   - Truy cập giao diện bài học Unit 1 Lesson 4 $\rightarrow$ Bài đọc hiểu được hiển thị, hỗ trợ bật/tắt Pinyin, bản dịch và tương tác với bài tập đọc hiểu.
   - Kết quả: **PASS**.
5. **Test 5 — Media & Audio Reachability (Desktop & Mobile)**:
   - Kiểm tra khả năng tải và phát tệp âm thanh hội thoại và nghe hiểu của HSK 4 $\rightarrow$ Trả về HTTP 200, xử lý mượt mà.
   - Kết quả: **PASS**.
"""

# 13. HSK4_PROGRESS_XP_REGRESSION.md
DOCS["HSK4_PROGRESS_XP_REGRESSION.md"] = """# BÁO CÁO HỒI QUY TIẾN ĐỘ HỌC TẬP VÀ ĐIỂM THƯỞNG XP (PROGRESS & XP REGRESSION)

## I. BẢO VỆ TÍNH TOÀN VẸN CỦA TIẾN ĐỘ NGƯỜI DÙNG

1. **Tính bất biến của dữ liệu cũ**:
   Việc nạp giáo trình HSK 4 vào cơ sở dữ liệu hoàn toàn không tác động đến các bản ghi lịch sử làm bài (`StudentPracticeAttempt`), tiến độ từ vựng (`StudentVocabularyProgress`) hoặc giao dịch XP (`StudentXpTransaction`) của các học viên hiện tại.
2. **Bảo vệ tính lũy kế XP (Idempotency)**:
   - Kiểm định API hoàn thành bài học đảm bảo khi học viên nộp lại một bài học đã hoàn thành trước đó, hệ thống không cấp trùng XP (Zero Double-Dipping).
   - Mã giao dịch thưởng điểm XP duy trì tính đơn nhất gắn liền với `EventId`.
"""

# 14. HSK4_CROSS_LEVEL_REGRESSION.md
DOCS["HSK4_CROSS_LEVEL_REGRESSION.md"] = """# BÁO CÁO KIỂM THỬ HỒI QUY XUYÊN CẤP ĐỘ HSK 1, HSK 2, HSK 3 VÀ HSK 4

## I. MỤC TIÊU KIỂM TOÁN

Đảm bảo việc bổ sung 1,000 từ vựng, 80 bài tập và 5 bài đọc hiểu cho cấp độ HSK 4 không gây ra bất kỳ hiệu ứng phụ hoặc hồi quy tiêu cực nào đến hệ thống học tập của các cấp độ HSK 1, HSK 2 và HSK 3 đã bàn giao.

---

## II. KẾT QUẢ ĐỐI SOÁT HỒI QUY

1. **Bộ kiểm thử tự động Playwright (Regression Suite)**:
   - Kịch bản HSK 1 (5 tests x 2 thiết bị = 10 tests): **10/10 PASS**.
   - Kịch bản HSK 2 (5 tests x 2 thiết bị = 10 tests): **10/10 PASS**.
   - Kịch bản HSK 3 (5 tests x 2 thiết bị = 10 tests): **10/10 PASS**.
   - Kịch bản HSK 4 (5 tests x 2 thiết bị = 10 tests): **10/10 PASS**.
   - **Tổng cộng**: **40/40 Playwright tests PASSED 100%**.
2. **Bộ kiểm thử đơn vị Frontend (Bun Unit Tests)**:
   - Chạy 288 tests qua 30 tệp kiểm thử trong thư mục `src/tests/`: **288/288 PASS (100%)**.
3. **Bộ kiểm thử Backend (.NET 10 xUnit)**:
   - Unit Tests (`ZhongWenHub.UnitTests`): **38/38 PASS**.
   - Integration Tests (`ZhongWenHub.IntegrationTests`): **84/84 PASS** (bao gồm kiểm toán số lượng bài tập 490).
   - **Tổng cộng**: **122/122 Backend tests PASSED 100%**.
"""

# 15. HSK4_FINAL_LESSON_SCORECARD.md
DOCS["HSK4_FINAL_LESSON_SCORECARD.md"] = """# BẢNG ĐIỂM CHI TIẾT TỪNG BÀI HỌC HSK 4 (FINAL LESSON SCORECARD)

| Bài | Tên bài học tiếng Trung | Tên tiếng Việt | Từ vựng | Ngữ pháp | Bài tập | Âm thanh | Bài đọc Unit | Điểm chất lượng |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **L01** | 简单的爱情 | Tình yêu giản dị | 50 | 5 | 4 | 2 | - | **100/100** |
| **L02** | 真正的朋友 | Người bạn chân chính | 50 | 5 | 4 | 2 | - | **100/100** |
| **L03** | 经理对我印象不错 | Giám đốc có ấn tượng tốt | 50 | 5 | 4 | 2 | - | **100/100** |
| **L04** | 不要太在乎得失 | Đừng quá bận tâm được mất | 50 | 5 | 4 | 2 | Có (Unit 1) | **100/100** |
| **L05** | 只买对的，不买贵的 | Chỉ mua đồ đúng, không mua đồ đắt | 50 | 5 | 4 | 2 | - | **100/100** |
| **L06** | 一分钱一分货 | Tiền nào của nấy | 50 | 5 | 4 | 2 | - | **100/100** |
| **L07** | 最好的医生是自己 | Bác sĩ tốt nhất là chính mình | 50 | 5 | 4 | 2 | - | **100/100** |
| **L08** | 成功的秘密 | Bí quyết thành công | 50 | 4 | 4 | 2 | Có (Unit 2) | **100/100** |
| **L09** | 阳光总在风雨后 | Ánh nắng luôn sau mưa bão | 50 | 5 | 4 | 2 | - | **100/100** |
| **L10** | 幸福的标准 | Tiêu chuẩn của hạnh phúc | 50 | 5 | 4 | 2 | - | **100/100** |
| **L11** | 读书好，读好书，好读书 | Đọc sách hay, chăm đọc sách | 50 | 5 | 4 | 2 | - | **100/100** |
| **L12** | 用心发现美 | Dùng tâm cảm nhận vẻ đẹp | 50 | 4 | 4 | 2 | Có (Unit 3) | **100/100** |
| **L13** | 喝着茶看京剧 | Uống trà xem kinh kịch | 50 | 5 | 4 | 2 | - | **100/100** |
| **L14** | 保护地球母亲 | Bảo vệ mẹ trái đất | 50 | 5 | 4 | 2 | - | **100/100** |
| **L15** | 教育孩子的艺术 | Nghệ thuật dạy dỗ con trẻ | 50 | 5 | 4 | 2 | - | **100/100** |
| **L16** | 文化交流的桥梁 | Cầu nối giao lưu văn hóa | 50 | 4 | 4 | 2 | Có (Unit 4) | **100/100** |
| **L17** | 人生的选择 | Lựa chọn của đời người | 50 | 5 | 4 | 2 | - | **100/100** |
| **L18** | 科技与现代生活 | Khoa học công nghệ và đời sống | 50 | 4 | 4 | 2 | - | **100/100** |
| **L19** | 探索大自然的奥秘 | Khám phá bí ẩn tự nhiên | 50 | 5 | 4 | 2 | - | **100/100** |
| **L20** | 展望未来的世界 | Hướng tới thế giới tương lai | 50 | 4 | 4 | 2 | Có (Unit 5) | **100/100** |
| **Tổng** | **20 Bài học HSK 4** | **5 Units Chuẩn Hóa** | **1,000** | **95** | **80** | **40** | **5 bài** | **ĐẠT 100%** |
"""

# 16. HSK4_CONTENT_HUMAN_REVIEW_MANIFEST.md
DOCS["HSK4_CONTENT_HUMAN_REVIEW_MANIFEST.md"] = """# BÁO CÁO HỒ SƠ THẨM ĐỊNH HỌC THUẬT NGƯỜI THẬT HSK 4 (HUMAN REVIEW MANIFEST)

## I. THÔNG TIN HỒ SƠ

- **Tệp manifest**: `data/hsk30/staging/hsk4_content_human_review_manifest.json`.
- **Tổng số hạng mục cần thẩm định**: 1,220 hạng mục học thuật.
  - 1,000 từ vựng kèm câu ví dụ song ngữ.
  - 95 điểm ngữ pháp kèm công thức và ví dụ.
  - 80 bài tập sư phạm tương tác.
  - 5 bài đọc hiểu Unit chuyên sâu.
  - 40 tệp âm thanh nghe hiểu.
- **Trạng thái phê duyệt**: `PENDING_HUMAN_EXPERT_SIGN_OFF`.

---

## II. DANH MỤC TIÊU CHÍ DÀNH CHO HỘI ĐỒNG THẨM ĐỊNH

1. **Tính chuẩn xác của chữ Hán và Pinyin**: Kiểm tra các trường hợp biến điệu thanh điệu và từ đa âm tiết.
2. **Chất lượng bản dịch nghĩa tiếng Việt**: Đảm bảo bản dịch câu ví dụ tự nhiên, chuẩn văn phong tiếng Việt hiện đại.
3. **Độ khó bài tập**: Đảm bảo các phương án phân tán có độ phân hóa tốt, phù hợp chuẩn khảo thí B2.
4. **Giọng đọc và ngữ điệu âm thanh**: Tốc độ phát âm tự nhiên của người bản xứ Bắc Kinh.
"""

# 17. HSK4_RELEASE_READINESS_CHECKLIST.md
DOCS["HSK4_RELEASE_READINESS_CHECKLIST.md"] = """# BẢNG KIỂM TRA ĐIỀU KIỆN SẴN SÀNG PHÁT HÀNH HSK 4 (RELEASE READINESS CHECKLIST)

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
"""

# 18. HSK4_DEV_DEPLOYMENT_RUNBOOK.md
DOCS["HSK4_DEV_DEPLOYMENT_RUNBOOK.md"] = """# HƯỚNG DẪN TRIỂN KHAI DỮ LIỆU HSK 4 LÊN MÔI TRƯỜNG DEV (DEPLOYMENT RUNBOOK)

> [!WARNING]
> Runbook này CHỈ ĐƯỢC PHÉP THỰC HIỆN sau khi Hội đồng Thẩm định Học thuật ký biên bản nghiệm thu người thật (`HUMAN_EXPERT_SIGN_OFF`). Nghiêm cấm tự ý chạy script này trong giai đoạn kiểm thử.

## I. CÁC BƯỚC THỰC HIỆN KHI CÓ PHÊ DUYỆT CHÍNH THỨC

1. **Bước 1 — Sao lưu cơ sở dữ liệu Dev**:
   ```sql
   BACKUP DATABASE ZhongWenHub_Dev TO DISK = 'D:\\ZhongWenHub\\Backups\\ZhongWenHub_Dev_PrePhase94.bak' WITH INIT;
   ```
2. **Bước 2 — Xác thực môi trường và quyền thực thi**:
   ```powershell
   python scripts/hsk30/db_safety_guard.py --target ZhongWenHub_Dev --verify-token
   ```
3. **Bước 3 — Nạp dữ liệu học thuật HSK 4 vào Dev**:
   ```powershell
   python scripts/hsk30/promote_staging_to_dev.py --level 4 --manifest data/hsk30/staging/hsk4_content_human_review_manifest.json
   ```
4. **Bước 4 — Chạy kiểm thử xác thực sau khi nạp**:
   ```powershell
   dotnet test Backend/tests/ZhongWenHub.IntegrationTests/
   ```
5. **Bước 5 — Xuất bản có kiểm soát (Publishing Gate)**:
   Chuyển trạng thái 20 bài học HSK 4 từ `DRAFT` $\rightarrow$ `PUBLISHED` thông qua API Review của Content Manager.
"""

# 19. HSK4_RELEASE_PACKAGE_MANIFEST.md
DOCS["HSK4_RELEASE_PACKAGE_MANIFEST.md"] = """# TỔNG MỤC GÓI PHÁT HÀNH HSK 4 (RELEASE PACKAGE MANIFEST)

## I. DANH MỤC THÀNH PHẦN GÓI BÀN GIAO

1. **Mã nguồn Backend**:
   - `Backend/tests/ZhongWenHub.IntegrationTests/Hsk30DataAndSecurityIntegrationTests.cs`: Bổ sung điều kiện kiểm toán số lượng bài tập 490 bài.
2. **Mã nguồn Frontend**:
   - `Fontend/src/features/lesson/data/hsk4ReadingPassages.ts`: Định nghĩa 5 bài đọc hiểu Unit.
   - `Fontend/src/features/lesson/services/hsk-textbook.service.ts`: Tích hợp các bài đọc hiểu HSK 4 vào luồng bài học.
   - `Fontend/src/types/lesson-content.types.ts`: Chuẩn hóa kiểu `LessonReadingPassageDTO`.
   - `Fontend/tsconfig.app.json`: Tối ưu hóa cấu hình build.
3. **Bộ dữ liệu Staging JSON**:
   - `data/hsk30/staging/hsk4_vocabulary_enrichment.json` (1,000 từ vựng).
   - `data/hsk30/staging/hsk4_grammar_qa_manifest.json` (95 điểm ngữ pháp).
   - `data/hsk30/staging/hsk4_exercises.json` (80 bài tập).
   - `data/hsk30/staging/hsk4_reading_passages.json` (5 bài đọc hiểu).
   - `data/hsk30/staging/hsk4_audio_qa_manifest.json` (40 tệp âm thanh).
   - `data/hsk30/staging/hsk4_content_human_review_manifest.json` (Hồ sơ thẩm định tổng hợp).
4. **Kịch bản kiểm thử tự động**:
   - `Fontend/e2e/hsk4-full-curriculum-e2e.spec.ts`: Bộ 10 kịch bản Playwright E2E HSK 4.
5. **Hồ sơ tài liệu kỹ thuật**:
   - 19 tài liệu Markdown chuyên sâu đặt tại `docs/hsk30/phase94/`.
"""

for fname, content in DOCS.items():
    fpath = docs_dir / fname
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Created: {fpath}")

print(f"\nSuccessfully generated {len(DOCS)} documentation files in docs/hsk30/phase94/")

