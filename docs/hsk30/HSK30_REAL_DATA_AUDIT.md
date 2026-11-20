# BÁO CÁO KIỂM TOÁN DỮ LIỆU THẬT SQL SERVER (ZHONGWENHUB_DEV)
## Comprehensive Database Audit & Real-Data Health Analysis
**Cơ sở dữ liệu kiểm toán**: `ZhongWenHub_Dev` (Microsoft SQL Server trên `localhost\SQLEXPRESS`)  
**Thời gian thực hiện**: 20:25:00 - 20:35:00, ngày 08/11/2026  
**Chế độ thực thi**: `READ-ONLY` tuyệt đối (Không sửa đổi, không drop/truncate, không tạo dữ liệu rác)  
**Tình trạng tổng thể**: `DATABASE INTEGRITY VERIFIED — SYSTEMIC ANOMALIES IDENTIFIED`

---

## 1. TỔNG HỢP QUY MÔ DỮ LIỆU THỰC TẾ TRÊN 13 BẢNG CỐT LÕI

| STT | Tên bảng (Table Name) | Tổng số bản ghi (SQL Rows) | Trạng thái kỹ thuật & Phân loại dữ liệu |
|:---:|---|:---:|---|
| 1 | `courses` | **6** | 6 khóa học đại diện cho HSK 1 đến HSK 6 (100% PUBLISHED). |
| 2 | `units` | **35** | 2 PUBLISHED (HSK 1), 33 DRAFT (HSK 1–6). |
| 3 | `lessons` | **140** | 3 PUBLISHED (HSK 1: L1, L2, L3), 137 DRAFT (HSK 1–6). |
| 4 | `vocabularies` | **5,400** | 10 PUBLISHED (HSK 1), 290 DRAFT (HSK 1), 5,100 PENDING_REVIEW (HSK 2–6). |
| 5 | `grammar_points` | **461** | 2 PUBLISHED (HSK 1), 70 PENDING_REVIEW (HSK 1), 389 PENDING_REVIEW (HSK 2–6). |
| 6 | `hanzi_characters` | **1,940** | 1,940 chữ Hán độc lập phân bổ từ Cấp 1 đến Cấp 6. |
| 7 | `hanzi_level_requirements` | **2,640** | 1,840 yêu cầu tập viết (Type 1), 800 yêu cầu nhận biết (Type 2). |
| 8 | `exercises` | **278** | 2 PUBLISHED (HSK 1), 276 DRAFT (HSK 1–6). |
| 9 | `student_lesson_progress` | **11** | 10 bản ghi dùng định dạng chuỗi cũ (`les-1`), 1 bản ghi dùng GUID chuẩn. |
| 10 | `student_learning_profiles` | **10** | Hồ sơ năng lực học tập mẫu tương ứng 10 tài khoản học sinh. |
| 11 | `users` | **33** | 1 ADMIN, 3 CONTENT_MANAGER, 10 TEACHER, 19 STUDENT. |
| 12 | `user_wallets` | **10** | 10 ví học viên/giáo viên với tổng số dư: 10,500,000 VND. |
| 13 | `wallet_transactions` | **16** | 8 giao dịch ADMIN_ADJUST (400,000 VND), 8 INITIAL_SEED (10,100,000 VND). |
| 14 | `user_subscriptions` | **10** | 4 gói Premium, 4 gói Basic, 2 gói Free (tất cả trạng thái ACTIVE). |

---

## 2. THỐNG KÊ CHI TIẾT THEO CẤP ĐỘ HSK VÀ TRẠNG THÁI XUẤT BẢN

### 2.1. Phân bổ Giáo trình (Courses, Units, Lessons)
```
[Courses]
├── HSK 1: 1 Course (Code: HSK1) ── Status: PUBLISHED (Id: 11111111-1111-1111-1111-111111111111)
├── HSK 2: 1 Course (Code: HSK2) ── Status: PUBLISHED (Id: 22222222-2222-2222-2222-222222222222)
├── HSK 3: 1 Course (Code: HSK3) ── Status: PUBLISHED (Id: 33333333-3333-3333-3333-333333333333)
├── HSK 4: 1 Course (Code: HSK4) ── Status: PUBLISHED (Id: 44444444-4444-4444-4444-444444444444)
├── HSK 5: 1 Course (Code: HSK5) ── Status: PUBLISHED (Id: 55555555-5555-5555-5555-555555555555)
└── HSK 6: 1 Course (Code: HSK6) ── Status: PUBLISHED (Id: 66666666-6666-6666-6666-666666666666)

[Units & Lessons Breakdown]
Level   | Units (Total) | Units Published | Units Draft | Lessons (Total) | Lessons Published | Lessons Draft
--------+---------------+-----------------+-------------+-----------------+-------------------+--------------
HSK 1   |      6        |        2        |      4      |       15        |         3         |      12
HSK 2   |      5        |        0        |      5      |       15        |         0         |      15
HSK 3   |      5        |        0        |      5      |       20        |         0         |      20
HSK 4   |      5        |        0        |      5      |       20        |         0         |      20
HSK 5   |      6        |        0        |      6      |       30        |         0         |      30
HSK 6   |      8        |        0        |      8      |       40        |         0         |      40
--------+---------------+-----------------+-------------+-----------------+-------------------+--------------
Tổng    |     35        |        2        |     33      |      140        |         3         |     137
```

### 2.2. Phân bổ Học liệu Cốt lõi (Vocabularies, Grammar Points, Exercises)
```
Level   | Vocabularies          | Grammar Points        | Exercises
        | Total | Pub | Rev/Dft | Total | Pub | Rev/Dft | Total | Pub | Draft
--------+-------+-----+---------+-------+-----+---------+-------+-----+-------
HSK 1   |   300 |  10 |   290   |    72 |   2 |    70   |    28 |   2 |   26
HSK 2   |   200 |   0 |   200   |    78 |   0 |    78   |    30 |   0 |   30
HSK 3   |   500 |   0 |   500   |    96 |   0 |    96   |    40 |   0 |   40
HSK 4   | 1,000 |   0 | 1,000   |    95 |   0 |    95   |    40 |   0 |   40
HSK 5   | 1,600 |   0 | 1,600   |    70 |   0 |    70   |    60 |   0 |   60
HSK 6   | 1,800 |   0 | 1,800   |    50 |   0 |    50   |    80 |   0 |   80
--------+-------+-----+---------+-------+-----+---------+-------+-----+-------
Tổng    | 5,400 |  10 | 5,390   |   461 |   2 |   459   |   278 |   2 |  276
```

### 2.3. Phân bổ Chữ Hán (Hanzi Characters & Requirements)
- **Tổng số chữ Hán**: 1,940 ký tự độc lập.
  - HSK 1: 246 chữ
  - HSK 2: 125 chữ
  - HSK 3: 284 chữ
  - HSK 4: 441 chữ
  - HSK 5: 431 chữ
  - HSK 6: 413 chữ
- **Yêu cầu cấp độ (Level Requirements)**: 2,640 bản ghi
  - `Type 1 (Handwriting / Tập viết)`: 1,840 bản ghi (HSK 1: 246; HSK 2: 125; HSK 3: 284; HSK 4: 441; HSK 5: 431; HSK 6: 413).
  - `Type 2 (Recognition / Nhận biết)`: 800 bản ghi (HSK 2: 100; HSK 3: 150; HSK 4: 150; HSK 5: 150; HSK 6: 150).

---

## 3. KIỂM TOÁN 9 MỤC THEO YÊU CẦU ĐẶC TẢ

### 3.1. Kiểm tra bản ghi trùng lặp (Duplicate Records)
- **Từ vựng (`vocabularies`)**:
  - Truy vấn kiểm tra: `SELECT Hanzi, Pinyin, ISNULL(Homograph, ''), COUNT(*) GROUP BY ... HAVING COUNT(*) > 1`
  - Kết quả: **0 bản ghi trùng** (Toàn bộ 5,400 từ vựng có khóa bộ ba `Hanzi + Pinyin + Homograph` là duy nhất).
- **Ngữ pháp (`grammar_points`)**:
  - Truy vấn kiểm tra: `SELECT Code, COUNT(*) GROUP BY Code HAVING COUNT(*) > 1`
  - Kết quả: **0 bản ghi trùng** (Mã `GR30-HSKx-xxx` duy nhất tuyệt đối trên 461 bản ghi).
- **Chữ Hán (`hanzi_characters`)**:
  - Truy vấn kiểm tra: `SELECT Character, COUNT(*) GROUP BY Character HAVING COUNT(*) > 1`
  - Kết quả: **0 bản ghi trùng** (1,940 ký tự đơn nhất).
- **Đánh giá**: `ĐẠT CHUẨN (PASS)`

---

### 3.2. Kiểm tra mục thiếu nghĩa Việt hoặc Pinyin
- **Từ vựng**:
  - `MeaningVi` bị NULL hoặc rỗng: **0 / 5,400** (100% có nghĩa tiếng Việt).
  - `Pinyin` bị NULL hoặc rỗng: **0 / 5,400** (100% có phiên âm Pinyin chuẩn thanh điệu Unicode).
  - Dạng nghĩa rác hoặc template boilerplate (`"Từ vựng tiếng Trung HSK..."`): **0 / 5,400**.
- **Chữ Hán**:
  - `Pinyin` bị NULL hoặc rỗng: **0 / 1,940**.
  - `SinoVietnamese` (Âm Hán Việt) bị NULL hoặc rỗng: **0 / 1,940**.
  - `MeaningVi` (Nghĩa tiếng Việt giải thích) bị NULL hoặc rỗng: **0 / 1,940**.
- **Đánh giá**: `ĐẠT CHUẨN (PASS)`

---

### 3.3. Kiểm tra mục thiếu giải thích, ví dụ hoặc bộ thủ
- **Ngữ pháp**:
  - Thiếu tiêu đề (`Title`): **0 / 461**.
  - Thiếu công thức cấu trúc (`StructureFormula`): **0 / 461**.
  - Thiếu giải thích tiếng Việt (`Explanation`): **0 / 461**.
  - Thiếu ví dụ (`ExamplesJson` rỗng hoặc sai format): **0 / 461** (100% có ví dụ song ngữ Trung - Việt).
  - Thiếu bài tập trắc nghiệm củng cố (`PracticeJson`): **0 / 459** cho các điểm ngữ pháp HSK 3.0.
- **Chữ Hán**:
  - Thiếu số nét (`StrokeCount <= 0`): **0 / 1,940**.
  - **Phát hiện thiếu bộ thủ (`Radical` bị NULL hoặc rỗng)**: **2 ký tự**!
    1. Chữ **危** (Pinyin: *wēi*, Âm Hán Việt: *Nguy*, HSK 4) — Cần gán bộ thủ: `⺈` (bộ Bao / Tiết `卩`).
    2. Chữ **卷** (Pinyin: *juǎn*, Âm Hán Việt: *Cuộn, Quyển*, HSK 5) — Cần gán bộ thủ: `卩` (bộ Tiết).
- **Đánh giá**: `CẦN CHỈNH SỬA (2 DEFECTS)`

---

### 3.4. Kiểm tra liên kết sai cấp độ (Cross-Level Integrity)
- **Từ vựng <-> Khóa học qua Bài học**:
  - Truy vấn kiểm toán:
    ```sql
    SELECT v.HskLevel AS VocabLevel, c.HskLevel AS CourseLevel, COUNT(*)
    FROM vocabularies v
    JOIN lessons l ON v.LessonId = l.Id
    JOIN courses c ON l.CourseId = c.Id
    GROUP BY v.HskLevel, c.HskLevel;
    ```
  - Kết quả:
    - HSK 1: 300 từ vựng liên kết vào 15 bài học thuộc Khóa học HSK 1 (**100% MATCH**).
    - HSK 2: 200 từ vựng liên kết vào 15 bài học thuộc Khóa học HSK 2 (**100% MATCH**).
    - HSK 3: 500 từ vựng liên kết vào 20 bài học thuộc Khóa học HSK 3 (**100% MATCH**).
    - HSK 4: 1,000 từ vựng liên kết vào 20 bài học thuộc Khóa học HSK 4 (**100% MATCH**).
    - HSK 5: 1,600 từ vựng liên kết vào 30 bài học thuộc Khóa học HSK 5 (**100% MATCH**).
    - HSK 6: 1,800 từ vựng liên kết vào 40 bài học thuộc Khóa học HSK 6 (**100% MATCH**).
  - Không có bất kỳ từ vựng nào bị gán nhầm vào khóa học khác cấp độ.
- **Ngữ pháp <-> Khóa học qua Bài học**:
  - 100% 461 điểm ngữ pháp được liên kết đúng vào khóa học có cùng HskLevel.
- **Đánh giá**: `ĐẠT CHUẨN (PASS)`

---

### 3.5. Kiểm tra nội dung bài học (Lesson Content Completeness)
- **Trường thông tin cơ bản**:
  - `TitleZh` (Tiêu đề chữ Hán): 140 / 140 đầy đủ.
  - `TitleVi` (Tiêu đề dịch nghĩa tiếng Việt): 140 / 140 đầy đủ.
  - `Pinyin` (Phiên âm tiêu đề): 140 / 140 đầy đủ.
  - `Summary` (Tóm tắt bài học): 140 / 140 đầy đủ.
- **KHIẾM KHUYẾT NGHIÊM TRỌNG VỀ NỘI DUNG TƯƠNG TÁC**:
  - `DialogueJson` (Đoạn hội thoại bài học): **140 / 140 bài học đều bị RỖNG / NULL**!
  - `ListeningJson` (Nội dung bài nghe): **140 / 140 bài học đều bị RỖNG / NULL**!
  - **Hệ quả**: Hiện tại bài học trên hệ thống chỉ đóng vai trò là "container" chứa danh sách từ vựng, ngữ pháp và bài tập trắc nghiệm, chưa có bài khóa hội thoại thực tế để học sinh luyện đọc và luyện nghe.
- **Đánh giá**: `CẢNH BÁO CAO (SYSTEMIC GAP)`

---

### 3.6. Kiểm tra bài tập và đáp án (Exercises & Answer Keys)
- Tổng số bài tập: 278 bài tập.
  - Dạng trắc nghiệm ngữ pháp (`multiple-choice` + `grammar`): 138 bài (100% DRAFT).
  - Dạng trắc nghiệm đọc hiểu (`multiple-choice` + `reading`): 139 bài (1 PUBLISHED, 138 DRAFT).
  - Dạng điền từ (`fill-blank` + `writing`): 1 bài (PUBLISHED, Id: `24381C58-31D5-4CB4-8F97-720872CA9534`).
- **Kiểm toán đáp án & phương án**:
  - 277 bài multiple-choice đều có: `OptionsJson` chuẩn 4 phương án, `CorrectOptionIndex` (0–3), `CorrectAnswer` và `Explanation` chi tiết.
  - 1 bài fill-blank không có OptionsJson/CorrectOptionIndex (do người dùng tự gõ) nhưng có `CorrectAnswer = '什么'` và `Explanation` đầy đủ.
  - Bài tập thiếu đáp án: **0 / 278**.
  - Bài tập thiếu giải thích: **0 / 278**.
- **Đánh giá**: `ĐẠT CHUẨN (PASS)`

---

### 3.7. Kiểm tra mục tiêu bài học (Lesson Learning Objectives)
- **Hiện trạng schema SQL**:
  - Bảng `lessons` **chưa có cột `ObjectivesJson` hoặc `LearningObjectives`**.
  - Thông tin mục tiêu hiện chỉ được tóm tắt một câu ngắn gọn trong trường `Summary` (ví dụ: *"Học cách chào hỏi cơ bản trong tiếng Trung và giới thiệu bản thân."*).
- **Hệ quả**:
  - CMS và giao diện học sinh chưa hiển thị được danh sách mục tiêu đầu ra có cấu trúc (ví dụ: "Nắm vững 15 từ vựng chào hỏi", "Sử dụng cấu trúc 是", "Tự giới thiệu tên tuổi").
- **Đánh giá**: `THIẾU TRƯỜNG DỮ LIỆU CẤU TRÚC (MISSING FIELD)`

---

### 3.8. Kiểm tra mock data còn sót lại ở Frontend
- **Kết quả rà soát mã nguồn Frontend (`Fontend/src`)**:
  1. `Fontend/src/features/grammar/mock/mockGrammarData.ts`: Tồn tại tệp chứa 468 dòng dữ liệu mock cũ (`MOCK_GRAMMAR_POINTS`). `GrammarService.ts` vẫn import tệp này và dùng làm fallback trong khối `catch (err)`.
  2. `Fontend/src/features/vocabulary/components/VocabularyBank.tsx`: Tồn tại hằng số `INITIAL_VOCABULARY_LIST` dùng làm fallback khi API SQL Server bị lỗi.
  3. `Fontend/src/core/repositories/adapters/mock-exercise.repository.ts`: Tồn tại repository mock bài tập (`MockExerciseRepository`) được điều phối bởi cờ `defaultApiConfig.useMock`.
- **Hệ quả**:
  - Nếu kết nối API bị gián đoạn, Frontend sẽ tự động chuyển sang hiển thị mock data mà không thông báo rõ ràng cho người dùng là đang xem dữ liệu giả lập.
- **Đánh giá**: `CẦN LOẠI BỎ / CÔ LẬP MOCK (NEEDS CLEANUP)`

---

### 3.9. Kiểm tra dữ liệu có trong SQL nhưng chưa hiển thị được ở CMS hoặc Student
- **Giao diện Học sinh (Student Workspace)**:
  - SQL Server có **5,400 từ vựng**, nhưng Học sinh **chỉ xem được 10 từ vựng HSK 1** (vì 5,390 từ còn lại ở trạng thái PENDING_REVIEW / DRAFT).
  - SQL Server có **461 điểm ngữ pháp**, nhưng Học sinh **chỉ xem được 2 điểm ngữ pháp HSK 1** (vì 459 điểm còn lại là PENDING_REVIEW).
  - SQL Server có **140 bài học**, nhưng Học sinh **chỉ xem được 3 bài học HSK 1** (137 bài còn lại là DRAFT).
  - SQL Server có **278 bài tập**, nhưng Học sinh **chỉ làm được 2 bài tập HSK 1**.
  - **Kết luận**: Giao diện học sinh hiện tại gần như "trống" đối với các cấp HSK 2, 3, 4, 5, 6 do cơ chế lọc bảo mật `publishedOnly = true`.
- **Giao diện Quản trị (Admin / Content Manager CMS)**:
  - CMS hiển thị và cho phép lọc toàn bộ 5,400 từ vựng, 461 điểm ngữ pháp và 1,940 chữ Hán.
  - Tuy nhiên, tính năng chỉnh sửa nội dung bài khóa (`DialogueJson`, `ListeningJson`) chưa có giao diện trực quan để Content Editor nhập liệu hội thoại nhiều nhân vật.
- **Đánh giá**: `ĐÚNG PHÂN QUYỀN NHƯNG HỌC LIỆU BỊ NGHẼN Ở BƯỚC PHÊ DUYỆT (BLOCKED AT REVIEW)`

---

## 4. BẢNG TỔNG KẾT BẰNG CHỨNG KIỂM TOÁN DỮ LIỆU

```
+-----------------------------------+--------------------+--------------------+-----------------------+
| Hạng mục kiểm toán                | Số lượng kiểm tra  | Số lỗi phát hiện   | Trạng thái kết luận   |
+-----------------------------------+--------------------+--------------------+-----------------------+
| Bản ghi trùng lặp (Vocab/Gram/Hz) | 7,801 bản ghi      | 0 bản ghi          | VERIFIED (PASS)       |
| Thiếu nghĩa Việt hoặc Pinyin      | 7,340 bản ghi      | 0 bản ghi          | VERIFIED (PASS)       |
| Chữ Hán thiếu bộ thủ              | 1,940 chữ Hán      | 2 chữ (危, 卷)      | DEFECT (CẦN SỬA)      |
| Phân bổ Chữ Hán lệch chuẩn thi    | 6 cấp độ           | Lệch tại cả 6 cấp  | NEEDS_STANDARDIZATION |
| Sai lệch cấp độ liên kết          | 5,861 liên kết     | 0 liên kết sai     | VERIFIED (PASS)       |
| Bài học thiếu bài khóa/hội thoại  | 140 bài học        | 140 bài thiếu      | SYSTEMIC DEFECT       |
| Bài học thiếu cấu trúc mục tiêu   | 140 bài học        | 140 bài thiếu      | MISSING SCHEMA        |
| Bài tập thiếu đáp án/giải thích   | 278 bài tập        | 0 bài thiếu        | VERIFIED (PASS)       |
| Tồn tại Mock data fallback ở FE   | 3 vị trí adapter   | 3 vị trí còn mock  | NEEDS CLEANUP         |
| Tiến trình học lưu lẫn lộn ID     | 11 bản ghi progress| 10 bản ghi dùng slug| DATA INCONSISTENCY   |
+-----------------------------------+--------------------+--------------------+-----------------------+
```
