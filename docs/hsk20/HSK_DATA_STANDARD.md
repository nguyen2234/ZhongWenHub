# ZhongWenHub — Chuẩn Dữ liệu Nội dung HSK 1–4 (HSK 2.0)

- **Phiên bản chuẩn:** `1.0.0`
- **Chuẩn giáo trình áp dụng:** `HSK_2_0` (HSK 1: 15 bài, HSK 2: 15 bài, HSK 3: 20 bài, HSK 4: 20 bài — tổng 70 bài).
- **JSON Schema chuẩn:** [`data/hsk20/schemas/hsk20-lesson-bundle.schema.json`](../../data/hsk20/schemas/hsk20-lesson-bundle.schema.json)
- **Validator tự động:** [`scripts/hsk20/validate_hsk20_data.py`](../../scripts/hsk20/validate_hsk20_data.py)

---

## 1. Phân biệt HSK 2.0 và HSK 3.0

1. Toàn bộ nội dung bài học đang xuất bản cho cấp độ 1–4 trong ZhongWenHub thuộc chuẩn **HSK 2.0** (`curriculumStandard = "HSK_2_0"`, mã khóa `HSK1`–`HSK4`).
2. Không trộn từ vựng, danh sách ngữ pháp hoặc bài đọc của chuẩn HSK 3.0 (`data/hsk30/`, `docs/hsk30/`) vào bộ bài học HSK 2.0.
3. Mọi gói dữ liệu chuẩn hóa bắt buộc khai báo `curriculumStandard: "HSK_2_0"` ở cấp root và trong `sourceMetadata`.

---

## 2. Quy tắc tương thích ngược (SQL Server → Backend DTO → Frontend)

1. **Không thay đổi schema SQL Server** khi chưa có lý do kỹ thuật bắt buộc:
   - Các trường chuẩn hóa của hội thoại và bài đọc lưu trong `dbo.lessons.DialogueJson` (`nvarchar(max)`).
   - Bài nghe lưu trong `dbo.lessons.ListeningJson` (`nvarchar(max)`).
2. **Backend DTO (`Backend/src/Business/Content/DTOs/ContentDtos.cs`)**:
   - `ReadingPassageDto` giữ nguyên các trường hiện tại (`PassageZh`, `PassagePinyin`, `PassageVi`, `ComprehensionQuestions`) và mở rộng trường tùy chọn `Sentences` (`List<ReadingSentenceDto>?`).
   - `ReadingComprehensionQuestionDto` mở rộng `QuestionPinyin`, `OptionsPinyin`, `OptionsVi` dạng nullable để tương thích ngược với dữ liệu cũ chưa bổ sung.
3. **Frontend (`Fontend/src/features/lesson/types/lesson-content.types.ts` & `ReadingPassageCard.tsx`)**:
   - Ưu tiên `sentences[]` nếu có; tự động fallback an toàn nếu thiếu `sentences[]` hoặc lệch số lượng `optionsVi` / `optionsPinyin`.

---

## 3. Chuẩn cấu trúc 10 nhóm dữ liệu

| Nhóm | Bảng / Nơi lưu | Trường bắt buộc | Ràng buộc chính |
|---|---|---|---|
| **1. Course** | `dbo.courses` | `id`, `code`, `title`, `hskLevel`, `status`, `orderIndex` | `code ∈ {HSK1..HSK4}`, `hskLevel ∈ [1..4]` |
| **2. Lesson** | `dbo.lessons` | `id`, `courseId`, `lessonNumber`, `titleZh`, `titleVi`, `status`, `orderIndex` | `titleZh` chứa Hanzi Unicode; không trùng `lessonNumber` trong cùng khóa |
| **3. Vocabulary** | `dbo.vocabularies`, `dbo.lesson_vocabularies` | `id`, `hanzi`, `pinyin`, `meaningVi`, `hskLevel`, `status` | `hanzi` Unicode; `pinyin` chuẩn NFC và dấu thanh đúng quy tắc âm vị |
| **4. Grammar** | `dbo.grammar_points` | `id`, `lessonId`, `title`, `structure`, `explanation`, `hskLevel`, `status` | `ExamplesJson` hợp lệ; mỗi ví dụ đủ `{ zh, pinyin, vi }` |
| **5. Dialogue** | `dbo.lessons.DialogueJson` | `id`, `lessonId`, `title`, `lines[]` | `lines.length >= 1`; mỗi dòng có `{ id, speakerName, zh, pinyin, meaningVi, displayOrder }` |
| **6. ReadingPassage** | `dbo.lessons.DialogueJson.readingPassage` | `unitNumber`, `lessonNumber`, `titleZh`, `titleVi`, `passageZh`, `passagePinyin`, `passageVi`, `comprehensionQuestions[]` | Bổ sung `sentences[]` (`{ zh, pinyin, vi }`), `questionPinyin`, `optionsPinyin[]`, `optionsVi[]`; đảm bảo `options.length === optionsPinyin.length === optionsVi.length` khi có mặt |
| **7. Listening** | `dbo.lessons.ListeningJson[]` | `id`, `lessonId`, `title`, `transcriptZh`, `transcriptPinyin`, `transcriptVi`, `prompt`, `options[]`, `explanation` | Mỗi câu có `>= 2` đáp án và **đúng 1** đáp án `isCorrect: true` |
| **8. Exercise** | `dbo.exercises` | `id`, `lessonId`, `type`, `skill`, `hskLevel`, `status` | Nếu có `OptionsJson` là mảng thì `CorrectOptionIndex` phải nằm trong `[0, options.length - 1]` |
| **9. Quiz** | `dbo.exams` / `dbo.exam_questions` (hoặc bundle `quizzes[]`) | `id`, `title`, `hskLevel`, `questions[]` | Mỗi phần tử trong `questions[]` tuân thủ chuẩn `Exercise` |
| **10. SourceMetadata** | Manifest kiểm duyệt & JSON metadata | `sourceId`, `sourceVersion`, `curriculumStandard`, `reviewStatus`, `academicApproved` | Không tự đặt `academicApproved = true` cho dữ liệu AI tạo; dữ liệu không có nguồn đối chiếu giữ `UNVERIFIED_SOURCE` hoặc `AI_GENERATED_NEEDS_ACADEMIC_REVIEW` |

---

## 4. Quy tắc kiểm định chất lượng (5 nhãn trạng thái)

1. `COMPLETE_VERIFIED`: Đủ cấu trúc, vượt qua mọi kiểm tra tự động và đã được xác minh/duyệt học thuật (`academicApproved: true`).
2. `STRUCTURALLY_VALID_UNREVIEWED`: Đủ cấu trúc, vượt qua validator kỹ thuật (JSON, Pinyin, tham chiếu, đáp án) nhưng nội dung AI tạo chưa được duyệt học thuật.
3. `MISSING_CONTENT`: Thiếu thành phần bắt buộc hoặc thiếu các trường chuẩn hóa (`sentences[]`, `questionPinyin`, `optionsPinyin[]`, `optionsVi[]`).
4. `INVALID_DATA`: JSON hỏng, `correctIndex` ngoài phạm vi, `lessonId` không khớp, hoặc lỗi cấu trúc bắt buộc.
5. `SOURCE_UNVERIFIED`: Không có tài liệu nguồn để đối chiếu học thuật.

> **Nguyên tắc:** Kiểm tra tự động chỉ chứng minh **tính hợp lệ cấu trúc/kỹ thuật**, không thay thế phê duyệt học thuật của chuyên gia tiếng Trung.

---

## 5. Cách chạy Validator & Unit Tests

```powershell
# Chạy unit tests cho bộ validator
python -m unittest scripts/hsk20/test_validate_hsk20_data.py -v

# Kiểm tra một lesson bundle JSON theo chuẩn
python scripts/hsk20/validate_hsk20_data.py --bundle <path-to-bundle.json>
```

