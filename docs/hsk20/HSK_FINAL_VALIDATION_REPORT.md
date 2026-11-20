# ZhongWenHub — Báo cáo Kiểm định Cuối cùng Dữ liệu HSK 1–4

- **Nguồn kiểm tra:** Trích xuất trực tiếp từ `ZhongWenHub_Dev` sau khi chạy 4 batch chuẩn hóa
- **JSON kết quả:** [`data/hsk20/staging/hsk14_validation_report.json`](../../data/hsk20/staging/hsk14_validation_report.json)

---

## 1. Tổng hợp kết quả theo cấp độ (Sau chuẩn hóa)

| Cấp HSK | Tổng bài | PASS | WARNING | FAIL | `sentences[]` | Chưa duyệt học thuật |
|---|---:|---:|---:|---:|---:|---:|
| **HSK 1** | 15 | **15** | 0 | 0 | 15/15 (100%) | 9/15 |
| **HSK 2** | 15 | 0 | 15 | 0 | 15/15 (100%) | 15/15 |
| **HSK 3** | 20 | 0 | 20 | 0 | 20/20 (100%) | 20/20 |
| **HSK 4** | 20 | 0 | 20 | 0 | 20/20 (100%) | 20/20 |
| **Tổng** | **70** | **15** | **55** | **0** | **70/70 (100%)** | **64/70** |

---

## 2. Phân loại lỗi & cảnh báo còn tồn tại

### 2.1. Lỗi kỹ thuật / cấu trúc (`errors` → `FAIL`): **0**
- 70/70 bài có `DialogueJson` & `ListeningJson` hợp lệ, đúng `lessonId`, `correctIndex` nằm trong phạm vi đáp án, không trùng ID.

### 2.2. Cảnh báo còn tồn tại (`warnings`)
1. **Thiếu `questionZh` tiếng Trung ở 55 bài HSK 2–4 (110 câu hỏi):**
   - `comprehensionQuestions[].questionPinyin`: 110 cảnh báo (do `questionZh` rỗng).
   - `comprehensionQuestions[].optionsPinyin[]`: 110 cảnh báo (do `options[]` đang là tiếng Việt).
   - `comprehensionQuestions[].optionsVi[]`: 110 cảnh báo (do `options[]` đã là tiếng Việt).
2. **Lỗi Pinyin thực sự còn tồn tại ở hội thoại (2 cảnh báo):**
   - **HSK 3 — Bài 17 (`dialogue.lines[0]`):** `Xǐao Lì` (đặt dấu sai trên `i` thay vì `a`, chuẩn là `Xiǎo Lì`).
   - **HSK 4 — Bài 6 (`dialogue.lines[2]`):** `Ng` (thán từ `嗯`, chưa theo dạng nguyên âm chuẩn).
3. **Từ vựng xuất hiện 2 lần trong cùng bài (3 cảnh báo):**
   - **HSK 4 — Bài 3 (`等`)**, **Bài 4 (`对`)**, **Bài 6 (`过`)**: đều là **từ đa nghĩa / đa từ loại hợp lệ**, không phải lỗi nhập lặp.
