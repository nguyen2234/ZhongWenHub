# ZHONGWENHUB — KẾ HOẠCH PHÊ DUYỆT CƠ SỞ DỮ LIỆU & PHỤC HỒI (ROLLBACK PLAN)
## Database Safety Gate, Import Execution Plan & Verified Rollback Strategy

- **Dự án:** ZhongWenHub
- **Mã nhiệm vụ:** `ZWH-HSK1-LEARNING-AND-CONTENT-CRUD`
- **Môi trường Database:** SQL Server Express `.\SQLEXPRESS`
  - `ZhongWenHub_Dev`: **STRICTLY READ-ONLY** (Bảo vệ tuyệt đối, từ chối mọi thao tác ghi)
  - `ZhongWenHub_Test`: **GATED** (Chỉ ghi khi có Signed Token từ người dùng)
- **Tập tin khóa an toàn:** `USER_APPROVAL_TOKEN.signed` (kiểm tra tại thư mục gốc/staging; hiện **CHƯA TỒN TẠI** nên mọi thao tác ghi vào `ZhongWenHub_Test` bị khóa)
- **Tập tin sao lưu phục hồi:** `data/hsk20/staging/pre_import_test_db_snapshot.json`
- **Script điều khiển:** `scripts/hsk20/snapshot_and_rollback.py` và `scripts/hsk20/import_hsk20_vocab_grammar.py`

---

## 1. NGUYÊN TẮC AN TOÀN TUYỆT ĐỐI (SAFETY PROTOCOLS)

1. **Khóa cứng cơ sở dữ liệu Dev:**
   - Mọi kết nối đến cơ sở dữ liệu đều thực thi lệnh `SELECT DB_NAME()`.
   - Nếu tên cơ sở dữ liệu là `ZhongWenHub_Dev`, script lập tức ngắt kết nối và ném lỗi `SecurityException`.
2. **Approval Gate có chữ ký số (Signed Token Gate):**
   - Lệnh `--execute` bắt buộc phải tìm thấy file `USER_APPROVAL_TOKEN.signed` chứa chữ ký hợp lệ (`APPROVED:...`).
   - Nếu file không tồn tại hoặc chữ ký không khớp, tiến trình tự ngắt ngay lập tức với exit code 1.
3. **Bảo tồn toàn vẹn dữ liệu người dùng:**
   - 0 thao tác sửa đổi trên các bảng: `users`, `roles`, `student_lesson_progress`, `student_xp_transactions`, `student_practice_attempts`.

---

## 2. BẢN KIỂM KÊ TEST DB & SNAPSHOT Ở CẤP ĐỘ BẢN GHI (FAIL-CLOSED)

Snapshot thực tế đã được tạo và kiểm chứng tại `data/hsk20/staging/pre_import_test_db_snapshot.json` (đã loại bỏ hoàn toàn fallback rỗng `FALLBACK_SCHEMA_SNAPSHOT`):
- **Cơ sở dữ liệu đích:** `ZhongWenHub_Test`
- **Số bản ghi từ vựng đã chụp đầy đủ:** 2.022 bản ghi (kèm Id, Hanzi, Pinyin, MeaningVi, LessonId, Status).
- **Số điểm ngữ pháp đã chụp đầy đủ:** 461 bản ghi (kèm Id, Code, Title, StructureFormula, Explanation, LessonId, Status).
- **Số bài học đã chụp đầy đủ:** 140 bài học (kèm Id, LessonNumber, TitleZh, TitleVi, DialogueJson, ListeningJson).
- **Xác minh tính khả thi phục hồi (`--verify`):** `Contains complete recoverable records: True` (bắt buộc cả 3 mảng `vocabularies`, `grammarPoints`, `lessons` đều khác rỗng; đã có negative test `NEG-2.5`).

---

## 3. KẾ HOẠCH NẠP DỮ LIỆU CHUẨN HSK 1 (KHI ĐƯỢC PHÊ DUYỆT)

Khi người dùng cấp phép bằng cách tạo file `USER_APPROVAL_TOKEN.signed`:
1. **Kiểm tra DB:** Xác nhận `DB_NAME() == 'ZhongWenHub_Test'` (`validate_target_db_name`).
2. **Nạp Từ vựng HSK 1:**
   - Cập nhật 150 từ chuẩn HSK 2.0 (từ nguồn DrKameleon đã đối soát).
   - Thiết lập trạng thái `STAGING` (không tự động publish).
3. **Nạp Ngữ pháp HSK 1:**
   - Nạp 50 điểm ngữ pháp staging (36 điểm chuẩn hóa active curated + AllSet HSK 1).
4. **Kiểm tra toàn vẹn giao dịch (ACID):**
   - Mọi thao tác nằm trong Transaction. Nếu xảy ra bất kỳ lỗi nào, hệ thống tự động `ROLLBACK` về trạng thái ban đầu.

---

## 4. QUY TRÌNH PHỤC HỒI DỮ LIỆU & KIỂM CHỨNG ROUND-TRIP THỰC TẾ

Trong trường hợp có bất kỳ sai lệch nào sau khi import:
1. Chạy lệnh phục hồi:
   ```powershell
   python scripts/hsk20/snapshot_and_rollback.py --rollback
   ```
2. Tiến trình rollback sẽ:
   - Mở giao dịch trên target DB (hỗ trợ `--target` và `--file`; mặc định `ZhongWenHub_Test`, luôn chặn `ZhongWenHub_Dev`).
   - Đọc dữ liệu từ `pre_import_test_db_snapshot.json` (fail-closed nếu rỗng hoặc hỏng).
   - Phục hồi đồng bộ cả 3 bảng: **2.022 từ vựng, 461 điểm ngữ pháp, và 140 bài học** về đúng trạng thái snapshot.
3. **Kiểm chứng thực tế trên `ZhongWenHub_Ephemeral_QA`:**
   - Sửa tạm tiêu đề Bài 1 `'Chào bạn'` -> `'TEMP_CORRUPTED_TITLE'` -> chạy rollback -> xác nhận phục hồi nguyên vẹn về `'Chào bạn'`, sau đó xóa `ZhongWenHub_Ephemeral_QA`.

---

## 5. TRẠNG THÁI HIỆN TẠI VÀ YÊU CẦU PHÊ DUYỆT

- **Tình trạng:** Khóa an toàn đang **BẬT (LOCKED)** (`USER_APPROVAL_TOKEN.signed` chưa tồn tại).
- **Kiểm toán ReadOnly sau cùng:** Cả `ZhongWenHub_Test` và `ZhongWenHub_Dev` đều giữ nguyên `HSK1 PublishedLessons=3, ExamTables=0`. **0 thao tác ghi** lên hai cơ sở dữ liệu được bảo vệ.
- Mã nguồn, kiểm thử tự động, rollback engine và E2E cô lập đã hoàn tất; nghiệm thu tổng thể ở trạng thái **`CONDITIONAL`** chờ lệnh phê duyệt token của người dùng.

