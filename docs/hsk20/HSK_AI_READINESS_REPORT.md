# ZhongWenHub — Báo cáo Mức độ Sẵn sàng cho AI Learning Engine (HSK 1–4)

- **Ngày đánh giá:** 2026-11-12
- **Chuẩn áp dụng:** HSK 2.0 (`HSK_2_0`), 70 bài HSK 1–4

---

## 1. Dữ liệu đã sẵn sàng về mặt kỹ thuật cho AI Learning Engine

| Thành phần | Phạm vi | Tình trạng kỹ thuật | Có thể dùng ngay cho AI Engine? |
|---|---|---|---|
| **Course & Lesson Metadata** | 4 khóa, 70 bài | Đủ trường, không trùng | **Có** |
| **Vocabulary (HSK 2.0)** | 1.199 lượt gắn bài | Có `Hanzi`, `Pinyin`, `MeaningVi`, `SourceDataset` | **Có** (đã đối chiếu nguồn mở HSK 2.0) |
| **Grammar Points** | 146 điểm ngữ pháp | Có `StructureFormula`, `Explanation`, `ExamplesJson` | **Có** (đã đối chiếu `allset_grammar`) |
| **Reading Passage `sentences[]`** | 70/70 bài (210 câu) | Tách câu 1–1 `{ zh, pinyin, vi }` khớp 100% | **Có về mặt cấu trúc** (cần gắn cờ `academicApproved` tương ứng) |
| **HSK 1 Reading Comprehension** | 15/15 bài (24 câu, 96 đáp án) | Đủ `questionZh`, `questionPinyin`, `options`, `optionsPinyin`, `optionsVi`, `correctIndex` | **Có về mặt cấu trúc** |
| **Listening & Dialogue** | 70/70 bài | Đủ `lines[]`, `transcriptZh/Pinyin/Vi`, `options`, `isCorrect` | **Có** (trừ 2 typo Pinyin đã ghi nhận ở HSK3-L17 & HSK4-L6) |
| **Exercises** | 3.003 bài tập | 100% `OptionsJson` & `CorrectOptionIndex` hợp lệ | **Có** |

---

## 2. Dữ liệu CHƯA được phép coi là nguồn học thuật đã xác minh

1. **64/70 bài có `academicApproved = false`:** Tuyệt đối không gắn nhãn "giáo trình chuẩn đã kiểm duyệt" khi AI Learning Engine trích dẫn hoặc sinh bài tập thích ứng; phải giữ metadata `reviewStatus = AI_GENERATED_NEEDS_ACADEMIC_REVIEW`.
2. **110 câu hỏi đọc hiểu HSK 2–4:** Chưa có `questionZh` và `options` chữ Hán (hiện chỉ có tiếng Việt), chưa sẵn sàng cho tác vụ luyện đọc hiểu câu hỏi chữ Hán tự động.
3. **Bảng `dbo.exams`:** Hiện có `0` bản ghi — chưa có ngân hàng đề thi tổng hợp trong bảng `exams`.

---

## 3. Kết luận mức độ sẵn sàng

- **Mức độ sẵn sàng kỹ thuật (Schema / API / Frontend / Sentence Alignment):** **Đạt ~92%** (70/70 bài có JSON hợp lệ, 70/70 bài có `sentences[]` 210 câu, 15/15 HSK 1 hoàn thiện 100% câu hỏi/đáp án song ngữ; còn thiếu bản tiếng Trung cho 110 câu hỏi HSK 2–4).
- **Mức độ sẵn sàng học thuật (`academicApproved = true`):** **6/70 bài** (cần chuyên gia duyệt 64 bài còn lại theo [`HSK_ACADEMIC_REVIEW_QUEUE.md`](./HSK_ACADEMIC_REVIEW_QUEUE.md)).
