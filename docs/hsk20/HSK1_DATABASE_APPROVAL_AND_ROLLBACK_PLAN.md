# ZHONGWENHUB — KẾ HOẠCH PHÊ DUYỆT CƠ SỞ DỮ LIỆU & PHỤC HỒI (ROLLBACK PLAN)
## Database Safety Gate, Import Execution Plan & Verified Rollback Strategy

- **Dự án:** ZhongWenHub
- **Mã nhiệm vụ:** `ZWH-HSK1-LEARNING-AND-CONTENT-CRUD`
- **Môi trường Database:** SQL Server Express `.\SQLEXPRESS`
  - `ZhongWenHub_Dev`: **STRICTLY READ-ONLY** (Bảo vệ tuyệt đối, từ chối mọi thao tác ghi)
  - `ZhongWenHub_Test`: **GATED** (Chỉ ghi khi có Signed Token từ người dùng)
- **Tập tin khóa an toàn:** `data/hsk20/staging/USER_APPROVAL_TOKEN.signed`
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

## 2. BẢN KIỂM KÊ TEST DB & SNAPSHOT Ở CẤP ĐỘ BẢN GHI (RECORD-LEVEL SNAPSHOT)

Snapshot thực tế đã được tạo và kiểm chứng tại `data/hsk20/staging/pre_import_test_db_snapshot.json`:
- **Cơ sở dữ liệu đích:** `ZhongWenHub_Test`
- **Số bản ghi từ vựng đã chụp đầy đủ:** 2.022 bản ghi (kèm Id, Hanzi, Pinyin, MeaningVi, LessonId, Status).
- **Số điểm ngữ pháp đã chụp đầy đủ:** 461 bản ghi (kèm Id, Code, Title, StructureFormula, Explanation, LessonId, Status).
- **Số bài học đã chụp đầy đủ:** 140 bài học (kèm Id, LessonNumber, TitleZh, TitleVi, DialogueJson, ListeningJson).
- **Xác minh tính khả thi phục hồi (`--verify`):** `Contains recoverable records: True`.

---

## 3. KẾ HOẠCH NẠP DỮ LIỆU CHUẨN HSK 1 (KHI ĐƯỢC PHÊ DUYỆT)

Khi người dùng cấp phép bằng cách tạo file `USER_APPROVAL_TOKEN.signed`:
1. **Kiểm tra DB:** Xác nhận `DB_NAME() == 'ZhongWenHub_Test'`.
2. **Nạp Từ vựng HSK 1:**
   - Cập nhật 150 từ chuẩn HSK 2.0 (từ nguồn DrKameleon đã đối soát).
   - Thiết lập trạng thái `STAGING` (không tự động publish).
3. **Nạp Ngữ pháp HSK 1:**
   - Nạp 46 điểm ngữ pháp đã dịch tiêu đề sư phạm tiếng Việt.
4. **Kiểm tra toàn vẹn giao dịch (ACID):**
   - Mọi thao tác nằm trong Transaction. Nếu xảy ra bất kỳ lỗi nào, hệ thống tự động `ROLLBACK` về trạng thái ban đầu.

---

## 4. QUY TRÌNH PHỤC HỒI DỮ LIỆU (ROLLBACK PROCEDURE)

Trong trường hợp có bất kỳ sai lệch nào sau khi import:
1. Chạy lệnh phục hồi:
   ```powershell
   python scripts/hsk20/snapshot_and_rollback.py --rollback
   ```
2. Tiến trình rollback sẽ:
   - Mở giao dịch trên `ZhongWenHub_Test`.
   - Đọc dữ liệu từ `pre_import_test_db_snapshot.json`.
   - Cập nhật và phục hồi lại toàn bộ 2.022 từ vựng và 461 điểm ngữ pháp về đúng trạng thái trước khi nạp.
   - Commit giao dịch và xác nhận kết quả phục hồi an toàn 100%.

---

## 5. TRẠNG THÁI HIỆN TẠI VÀ YÊU CẦU PHÊ DUYỆT

- **Tình trạng:** Khóa an toàn đang **BẬT (LOCKED)**.
- **Số thao tác ghi đã thực hiện trên database thật:** **0 (ZERO)**.
- Hệ thống đã sẵn sàng 100% về mặt mã nguồn, kiểm thử và dữ liệu. Đang dừng tại Approval Gate chờ lệnh của người dùng.
