# ZHONGWENHUB — KIỂM TOÁN & XỬ LÝ TRÙNG LẶP TỪ VỰNG HSK 1–4

**Nhánh:** `integration/zhongwenhub-sqlserver`  
**Ngày hoàn thành:** 2026-11-12  
**Phạm vi:** SQL Server (`ZhongWenHub_Dev`, `ZhongWenHub_Test`), EF Core Schema & Migrations, Backend Services & DTOs, Frontend UI, Unit / Integration / Playwright E2E Tests

---

## 1. Nguyên nhân gốc rễ (Root Cause Analysis)

Hiện tượng từ `八 (bā)` xuất hiện hai lần trong màn hình từ vựng HSK 1 (một thẻ hiển thị `Nguồn: HSK 1 chuẩn quốc tế`, một thẻ hiển thị `Nguồn: HSK 1 · 1`) xuất phát từ **hai nguyên nhân phối hợp**:

1. **Dữ liệu test sót trong `ZhongWenHub_Test` + thiết kế khóa duy nhất / quan hệ bài học ở Backend:**
   - Integration test [`Hsk1MeaningAndPublishIntegrationTests`](file:///D:/ZhongWenHub/Backend/tests/ZhongWenHub.IntegrationTests/Hsk1MeaningAndPublishIntegrationTests.cs) trước đây chèn các bản ghi từ vựng test mang `SourceDataset = 'HSK 3.0'` (`八`, `爸爸`, `白天`, `茶`, `只`) với `LessonId = NULL` nhưng không có `try/finally` dọn dẹp sau khi chạy xong, làm bảng `vocabularies` trên `ZhongWenHub_Test` tồn dư `2` bản ghi `PUBLISHED` (`八`, `茶`) và `3` bản ghi `DRAFT` (`爸爸`, `白天`, `只`).
   - Đồng thời, trên cả `ZhongWenHub_Dev` và `ZhongWenHub_Test`, mô hình cũ dùng khóa ngoại đơn `vocabularies.LessonId` (`1:N` thay vì `N:N`), khiến các từ xuất hiện ở nhiều bài học trong giáo trình HSK 2.0 (`得`, `还`, `长`) hoặc nhập lặp trong cùng bài (`只` ở HSK 3 Bài 19) bị lưu thành nhiều dòng độc lập.
   - Bảng `vocabularies` trước đây cũng chưa có trường khóa chuẩn hóa (`NormalizedPinyin`, `NormalizedHomograph`) và chưa có filtered unique index ở SQL Server; các endpoint/service tạo, sửa và import Excel/CSV chưa kiểm tra khóa chuẩn hóa (không phân biệt hoa thường, dấu nháy `'`, khoảng trắng giữa âm tiết Pinyin hay định dạng NFC/NFD).

2. **Logic hiển thị nguồn bài học sai ở Frontend (`VocabularyBank.tsx`):**
   - Hàm map dữ liệu trước đây trong [`VocabularyBank.tsx`](file:///D:/ZhongWenHub/Fontend/src/features/vocabulary/components/VocabularyBank.tsx) nối chuỗi trực tiếp `HSK ${dto.hskLevel} · ${dto.levelLabel}` khi `dto.levelLabel` tồn tại (tức `"1"` -> hiển thị sai thành `"HSK 1 · 1"` thay vì số bài học thực tế `Bài 7` của từ `八`), và fallback sang `"HSK ${dto.hskLevel} chuẩn quốc tế"` khi `levelLabel` rỗng (`LessonId = NULL`).
   - Khi sửa sang sử dụng danh sách `lessons: VocabularyLessonRef[]` (qua helper `formatLessonSource`), thẻ từ chuẩn của `八 (bā)` hiển thị đúng **`Nguồn: HSK 1 · Bài 7`**, còn các từ đa bài học hiển thị **`HSK 2 · Bài 2, Bài 3`**.

---

## 2. Thống kê bản ghi trùng & bất thường HSK 1–4 (Trước và Sau xử lý)

Toàn bộ dữ liệu trước khi sửa đã được sao lưu thành JSON kèm SHA-256 checksum trong thư mục `backups/` (đã loại trừ khỏi git qua `.gitignore`):

| Cơ sở dữ liệu | Backup trước xử lý (rows / `lesson_vocabularies`) | HSK 1–4 Trước xử lý | HSK 1–4 Sau xử lý | Thay đổi thực tế |
|---|---|---|---|---|
| `ZhongWenHub_Dev` | `5,692` / `4,600` | `1,200 PUBLISHED`, `1,092 ARCHIVED` | `1,196 PUBLISHED`, `1,092 ARCHIVED` (`4,599` links) | Hợp nhất `4` cặp trùng thật (`-4` rows, `-1` link trùng Bài 19 `只`) |
| `ZhongWenHub_Test` | `2,163` / `1,200` | `1,202 PUBLISHED`, `3 DRAFT`, `958 ARCHIVED` | `1,196 PUBLISHED`, `0 DRAFT`, `952 ARCHIVED` (`1,199` links) | Hợp nhất `5` cặp/bản ghi trùng, gắn `10` homograph tags, dọn `15` test/placeholder rows |

Phân bố số lượng từ vựng HSK 1–4 `PUBLISHED` sau chuẩn hóa **khớp tuyệt đối 1:1 giữa `ZhongWenHub_Dev` và `ZhongWenHub_Test`**:
- **HSK 1:** `150` từ (`八 (bā)` còn duy nhất **1 bản ghi active**, gắn **Bài 7**)
- **HSK 2:** `147` từ
- **HSK 3:** `298` từ
- **HSK 4:** `601` từ
- **Tổng HSK 1–4:** **`1,196` từ `PUBLISHED`** (`0` bản ghi trùng khóa chuẩn hóa active).

> Ghi chú: `3,400` bản ghi `PENDING_REVIEW` của HSK 5–6 trên `ZhongWenHub_Dev` được giữ nguyên vẹn ngoài phạm vi HSK 1–4.

---

## 3. Phân loại hợp nhất vs. Giữ riêng từ đồng âm / đa nghĩa (Homographs & Polyphones)

Quá trình xử lý phân biệt rạch ròi giữa **trùng lặp thực sự** và **từ khác âm đọc hoặc khác từ loại / nét nghĩa sư phạm**:

### A. Nhóm hợp nhất (4 cặp trùng HSK 2.0 + test leftovers)
1. **HSK 2 — `得 (dé)`**: 2 bản ghi giống nhau ở Bài 2 và Bài 3 -> hợp nhất thành 1 bản ghi `PUBLISHED` chuẩn, giữ nguyên cả **2 liên kết bài học (`Bài 2, Bài 3`)** trong `lesson_vocabularies`.
2. **HSK 2 — `还 (hái)`**: 2 bản ghi giống nhau ở Bài 4 và Bài 5 -> hợp nhất thành 1 bản ghi `PUBLISHED`, giữ đủ **2 liên kết bài học (`Bài 4, Bài 5`)**.
3. **HSK 2 — `长 (zhǎng)`**: 2 bản ghi giống nhau ở Bài 1 và Bài 14 -> hợp nhất thành 1 bản ghi `PUBLISHED`, giữ đủ **2 liên kết bài học (`Bài 1, Bài 14`)**.
4. **HSK 3 — `只 (zhī)`**: 2 bản ghi trùng lặp cùng nằm trong Bài 19 -> hợp nhất thành 1 bản ghi chuẩn với **1 liên kết Bài 19**.
5. **Dữ liệu sót test / placeholder (trên `ZhongWenHub_Test` / `ARCHIVED`)**:
   - Dọn `5` bản ghi `HSK 3.0` không gắn bài học (`八`, `爸爸`, `白天`, `茶`, `只`) trên `ZhongWenHub_Test`, dọn `3` dòng placeholder `无意词` (`EntryId` test rác) và `ARCHIVED` seed leftovers trùng (`你`, `好`, bản trùng `您`).

### B. Nhóm GIỮ RIÊNG (Polyphones `多音字` & Distinct Senses — 6 mục HSK 4 tiêu biểu)
Không hợp nhất các từ đồng hình khác âm (`Pinyin` khác nhau) hoặc cùng Pinyin nhưng **khác rõ `PartOfSpeech` và `MeaningVi`**; gắn `Homograph` phân biệt chuẩn xác:

| Cấp độ | Chữ Hán | Pinyin | Homograph | Từ loại (`PartOfSpeech`) | Trạng thái | Ghi chú bảo toàn |
|---|---|---|---|---|---|---|
| HSK 4 | `对` | `duì` | `1` | `Lượng từ` | `PUBLISHED` | đôi, cặp |
| HSK 4 | `对` | `duì` | `2` | `Tính từ / Giới từ` | `PUBLISHED` | đúng, chính xác / đối với |
| HSK 4 | `等` | `děng` | *(cơ sở)* / `1` | `Trợ từ` | `PUBLISHED` | vân vân, các thứ |
| HSK 4 | `等` | `děng` | `2` | `Động từ` | `PUBLISHED` | chờ, đợi |
| HSK 4 | `过` | `guo` | `1` | `Trợ từ động thái` | `PUBLISHED` | đã từng |
| HSK 4 | `过` | `guo` | `2` | `Động từ` | `PUBLISHED` | qua, đi qua, đón |

---

## 4. Chi tiết chuẩn hóa dữ liệu, quan hệ đa bài học & Kiểm chứng Rollback

- **Quan hệ `N:N` qua bảng mới [`lesson_vocabularies`](file:///D:/ZhongWenHub/Backend/src/Data/Entities/Content/LessonVocabularyEntity.cs):**
  - Mỗi bản ghi `VocabularyEntity` có thể thuộc nhiều bài học đồng thời (`PK(LessonId, VocabularyId)` + `SortOrder`), giúp loại bỏ hoàn toàn nhu cầu nhân bản dòng từ vựng chỉ để gắn vào bài học thứ hai.
  - Cập nhật [`DbInitializer.cs`](file:///D:/ZhongWenHub/Backend/src/Data/Persistence/DbInitializer.cs) để đồng bộ `LessonVocabularies` ngay khi seed database mới.
- **Bảo toàn khóa ngoại và tiến độ học viên (`0` dữ liệu bị mất):**
  - Khi hợp nhất các bản ghi trùng, toàn bộ tham chiếu trong `exercises.VocabularyId` (`3,301` dòng trên Dev, `3,300` dòng trên Test) và `student_vocabulary_progress` (`1` dòng trên Test) được chuyển hướng an toàn về ID bản ghi chuẩn trước khi xóa bản ghi dư.
  - Kiểm tra hậu kiểm trên cả hai DB cho thấy **Dangling links: `exercises = 0`, `lesson_vocabularies = 0`**.
- **Kiểm chứng Backup, Rollback & Idempotency bằng [`fix_duplicate_vocabularies.py`](file:///D:/ZhongWenHub/scripts/hsk20/fix_duplicate_vocabularies.py):**
  - Chạy thực tế chu trình `--apply` -> `--rollback backups/vocab_backup_ZhongWenHub_Test_pre_apply_20261112_004100.json` (khôi phục nguyên trạng `2,163` từ vựng và `1,200` liên kết) -> `--apply --verify` trên `ZhongWenHub_Test`.
  - Chạy lại `--dry-run` và `--verify` trên cả `ZhongWenHub_Dev` và `ZhongWenHub_Test` xác nhận **`merge_ops: []`, `homograph_tags: []`, `deletes: []`** (**100% idempotent**) và **`VERDICT: PASS`**.

---

## 5. Ràng buộc Cơ sở dữ liệu, API & Test chống tái phát

1. **Chuẩn hóa khóa định danh — [`VocabularyKeyNormalizer.cs`](file:///D:/ZhongWenHub/Backend/src/Data/Persistence/VocabularyKeyNormalizer.cs):**
   - `NormalizePinyin`: giữ nguyên thanh điệu chuẩn Unicode NFC, hạ chữ thường, loại bỏ khoảng trắng, dấu nháy đơn (`'` / `’`), gạch nối (`-`), dấu chấm giữa/phân tách âm tiết.
   - `NormalizeHanzi` và `NormalizeHomograph`: cắt khoảng trắng thừa, dùng đồng bộ ở `DbContext.SaveChanges` / `SaveChangesAsync`.
2. **Ràng buộc duy nhất ở tầng SQL Server:**
   - Migration [`20261111173747_AddLessonVocabulariesAndNormalizedKeys`](file:///D:/ZhongWenHub/Backend/src/Data/Persistence/Migrations/20261111173747_AddLessonVocabulariesAndNormalizedKeys.cs): tạo bảng `lesson_vocabularies`, thêm cột `NormalizedPinyin`, `NormalizedHomograph` và backfill dữ liệu hiện có.
   - Migration [`20261111174226_EnforceVocabularyUniqueCanonicalKey`](file:///D:/ZhongWenHub/Backend/src/Data/Persistence/Migrations/20261111174226_EnforceVocabularyUniqueCanonicalKey.cs): tạo filtered unique index **`UQ_vocabularies_active_canonical_key`** trên `(HskLevel, Hanzi, NormalizedPinyin, NormalizedHomograph) WHERE [Status] <> N'ARCHIVED'`.
   - Cả hai migrations đã được áp dụng lên `ZhongWenHub_Dev` và `ZhongWenHub_Test`.
3. **Kiểm tra & chống trùng ở tầng Service / Import / Query ([`ContentService.cs`](file:///D:/ZhongWenHub/Backend/src/Business/Content/ContentService.cs), [`ContentDtos.cs`](file:///D:/ZhongWenHub/Backend/src/Business/Content/DTOs/ContentDtos.cs), [`QuestionBankService.cs`](file:///D:/ZhongWenHub/Backend/src/Business/QuestionBank/QuestionBankService.cs)):**
   - Bổ sung `Lessons: List<VocabularyLessonRefDto>` vào `VocabularyDto` và `LessonIds` vào `CreateVocabularyDto`.
   - `CreateVocabularyAsync`, `UpdateVocabularyAsync`, `ImportVocabulariesFromCsvAsync` và `ImportVocabulariesFromExcelAsync` kiểm tra trùng bằng khóa chuẩn hóa active (chỉ cho phép nhiều bản ghi khi khác `Pinyin` hoặc khác `Homograph` hợp lệ).
   - `GetVocabulariesAsync` hỗ trợ tìm kiếm theo Pinyin chuẩn hóa, lọc bài học qua cả `LessonId` và `LessonVocabularies`, và phân trang theo thứ tự xác định (`HskLevel`, `Hanzi`, `Pinyin`, `NormalizedHomograph`, `Id`) để tránh trùng lặp hoặc sót mục qua các trang.
4. **Cập nhật UI Frontend ([`VocabularyBank.tsx`](file:///D:/ZhongWenHub/Fontend/src/features/vocabulary/components/VocabularyBank.tsx), [`VocabularyCard.tsx`](file:///D:/ZhongWenHub/Fontend/src/features/vocabulary/components/VocabularyCard.tsx), [`VocabularyDetailDrawer.tsx`](file:///D:/ZhongWenHub/Fontend/src/features/vocabulary/components/VocabularyDetailDrawer.tsx)):**
   - Thêm hàm `formatLessonSource` hiển thị chính xác `HSK X · Bài Y` (hoặc `Bài Y, Bài Z` với từ đa bài học), huy hiệu số bài trên thẻ từ, và danh sách `Thuộc các bài học:` trong drawer chi tiết; loại bỏ hoàn toàn nhãn sai `HSK 1 · 1`.
5. **Cô lập Integration Test ([`Hsk1MeaningAndPublishIntegrationTests.cs`](file:///D:/ZhongWenHub/Backend/tests/ZhongWenHub.IntegrationTests/Hsk1MeaningAndPublishIntegrationTests.cs)):**
   - Cô lập khóa test bằng `Homograph` riêng (`isoTag`) và bao bọc `try/finally` xóa sạch bản ghi tạo tạm khỏi SQL Server, ngăn rò rỉ dữ liệu test ra `ZhongWenHub_Test`.

---

## 6. Kết quả kiểm thử & Xác minh thực tế

| Hạng mục kiểm tra | Phạm vi / Lệnh | Kết quả |
|---|---|---|
| **Backend Unit Tests** | `dotnet test Backend/ZhongWenHub.sln` (`VocabularyDeduplicationTests` + toàn bộ unit tests) | **110 / 110 Passed, 0 Failed, 0 Skipped** |
| **Backend Integration Tests** | `dotnet test Backend/ZhongWenHub.sln` (`VocabularyDeduplicationIntegrationTests` + `Hsk1MeaningAndPublishIntegrationTests` + toàn suite) | **97 / 97 Passed, 0 Failed** |
| **Frontend Build (`tsc -b && vite build`)** | `cd Fontend && bun run build` | **0 Errors** (build sạch) |
| **Frontend Lint (`oxlint`)** | `cd Fontend && bun run lint` | **0 Errors** (`148` pre-existing/non-blocking warnings across 591 files) |
| **Frontend Unit Tests** | `cd Fontend && bun test src/tests` (`vocabulary-dedup.test.ts` + toàn bộ unit tests) | **310 / 310 Passed, 0 Failed** (36 files) |
| **Playwright E2E** | `cd Fontend && npx playwright test e2e/student-vocabulary-grammar.spec.ts` (`desktop-1440` + `mobile-390`, xác minh `八` HSK 1 chỉ hiển thị 1 thẻ kèm `Bài 7`) | **12 / 12 Passed** (`38.7s`, Backend chạy với `ZhongWenHub_Test`) |
| **SQL Verification & Idempotency** | `python scripts/hsk20/fix_duplicate_vocabularies.py --db ZhongWenHub_Dev|Test --dry-run` & `--verify` | **`merge_ops=[]`, `VERDICT: PASS`** trên cả 2 DB; `0` active duplicates |

---

## 7. Trạng thái Git & Chính sách Triển khai

- Mọi thay đổi được đẩy lên nhánh **`integration/zhongwenhub-sqlserver`**.
- **PR #16** (`integration/zhongwenhub-sqlserver` -> `main`) được giữ nguyên trạng thái **OPEN / Draft**, không merge sang `main` và **không deploy Production**.
