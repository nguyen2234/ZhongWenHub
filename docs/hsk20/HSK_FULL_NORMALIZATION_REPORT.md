# ZhongWenHub — Báo cáo Chuẩn hóa Toàn bộ Dữ liệu HSK 1–4 (HSK 2.0)

- **Ngày thực hiện:** 2026-11-12
- **Database:** `ZhongWenHub_Dev` (SQL Server, chỉ cập nhật `dbo.lessons.DialogueJson` cho HSK 1–4, không sửa HSK 5–6, không thay đổi schema hay dữ liệu người dùng)
- **Script chuẩn hóa:** [`scripts/hsk20/normalize_hsk14_data.py`](../../scripts/hsk20/normalize_hsk14_data.py)

---

## 1. Tổng hợp kết quả cập nhật SQL Server (70 bài HSK 1–4)

| Hạng mục | Số lượng | Ghi chú |
|---|---:|---|
| Tổng số bài trong phạm vi HSK 1–4 | **70** | HSK 1 (15), HSK 2 (15), HSK 3 (20), HSK 4 (20) |
| Số bài đã cập nhật mới trong lượt này | **69** | HSK 1 Bài 2–15 (14 bài), HSK 2 (15), HSK 3 (20), HSK 4 (20) |
| Số bài đã chuẩn hóa từ giai đoạn trước | **1** | HSK 1 Bài 1 (`AAAAAAAA-1111-1111-1111-111111111111`) |
| Số câu đọc (`readingPassage.sentences[]`) đã chia | **210** | 206 câu mới + 4 câu Bài 1 HSK 1; `70/70` bài đạt 100% |
| Số câu hỏi đọc hiểu được bổ sung `questionPinyin` | **24 / 24** (HSK 1) | 16 câu mới + 8 câu đã có ở HSK 1; **110 câu HSK 2–4 giữ nguyên** (xem mục 2) |
| Số đáp án được bổ sung `optionsPinyin[]` & `optionsVi[]` | **96 / 96** (HSK 1) | 22 câu hỏi mới (88 đáp án) + 2 câu Bài 1 (8 đáp án) |
| Kiểm tra checksum SHA-256 trước/sau | **0 sai lệch** | `70/70` bài khớp `sha256After` với bản ghi thực tế trong DB |
| Tổng số bài HSK 5–6 | **70** | Không bị chạm (`Hsk56Count = 70`) |

---

## 2. Những nội dung chưa bổ sung câu hỏi tiếng Trung (không ép dữ liệu)

- **55 bài HSK 2–4 (110 câu hỏi đọc hiểu):** Dữ liệu gốc trong `ZhongWenHub_Dev` hiện lưu `questionZh = ""` (rỗng) và mảng `options[]` bằng tiếng Việt (ví dụ `"Tháng 1"`, `"Tháng 6"`), không có câu hỏi và đáp án chữ Hán.
- Theo nguyên tắc không tự tạo nội dung thay thế nguồn gốc, script giữ nguyên `questionZh`, `questionVi`, `options`, `correctIndex`, `explanation` cho 110 câu hỏi HSK 2–4 và đưa vào danh sách cần bổ sung/duyệt ở [`HSK_ACADEMIC_REVIEW_QUEUE.md`](./HSK_ACADEMIC_REVIEW_QUEUE.md).
- Đồng thời đã cập nhật [`ReadingPassageCard.tsx`](../../Fontend/src/features/lesson/components/ReadingPassageCard.tsx) để hiển thị `questionVi` trực tiếp khi `!questionZh`, bảo đảm HSK 2–4 hiển thị đầy đủ câu hỏi trên UI.

---

## 3. Sao lưu, Transaction & Rollback

- **Bản sao lưu đầy đủ trước chuẩn hóa (70 bài + SHA-256):** [`data/hsk20/patches/hsk14_stage4_backup_before_normalization.json`](../../data/hsk20/patches/hsk14_stage4_backup_before_normalization.json)
- **Các script SQL batch có transaction (`XACT_ABORT ON`, `ISJSON = 1`, `@@ROWCOUNT = 1`):**
  - `data/hsk20/patches/hsk14_stage4_batch1_hsk1.sql` (`14` bài — `BATCH_1_COMMITTED=true`)
  - `data/hsk20/patches/hsk14_stage4_batch2_hsk2.sql` (`15` bài — `BATCH_2_COMMITTED=true`)
  - `data/hsk20/patches/hsk14_stage4_batch3_hsk3.sql` (`20` bài — `BATCH_3_COMMITTED=true`)
  - `data/hsk20/patches/hsk14_stage4_batch4_hsk4.sql` (`20` bài — `BATCH_4_COMMITTED=true`)
- **Script rollback nguyên trạng cả 70 bài:** `data/hsk20/patches/hsk14_stage4_rollback.sql` *(không track git theo `.gitignore` `*.sql`, lưu tại thư mục patch cục bộ)*.

---

## 4. Kết quả kiểm thử toàn diện

| Kiểm tra | Kết quả | Chi tiết |
|---|---|---|
| Python Validator Unit Tests | **PASS** | `7/7` tests (`0.017s`) |
| HSK 2.0 Bundle Validator (70 bài) | **0 FAIL** | HSK 1: `15 PASS`; HSK 2–4: `55 WARNING` (chưa có `questionZh` cho 110 câu hỏi) |
| Backend Unit Tests | **PASS** | `122/122` passed |
| Backend Integration Tests | **PASS** | `9/9` passed (`Hsk30DataAndSecurityIntegrationTests`) |
| Frontend Lint (`oxlint`) | **PASS** | `0 errors` (149 warnings có sẵn) |
| Frontend Unit Tests (`bun test`) | **PASS** | `332/332` passed across 40 files |
| Frontend Bundle (`vite build`) | **PASS** | `built in 2.74s` (`tsc -b` còn 1 lỗi có sẵn ở `VocabularyDetailDrawer.tsx:275` thuộc AI Tutor, giữ nguyên không sửa) |
| API `GET /api/v1/content/lessons/{id}` | **PASS** | HSK1-L2 (`4`), HSK2-L1 (`4`), HSK3-L1 (`3`), HSK4-L1 (`2`) trả đủ `sentences[]` |
| Playwright E2E (Desktop 1440px & Mobile 375px) | **PASS** | HSK 1–4 đại diện đạt 100%, `PAGE_ERRORS=0`, `overflow=false` |
| Secret Scan (`scan_secrets.py`) | **PASS** | `ZERO SECRETS FOUND` |
