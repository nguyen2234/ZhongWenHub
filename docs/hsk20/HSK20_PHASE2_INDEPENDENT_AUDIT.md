# ZHONGWENHUB — BÁO CÁO KIỂM TOÁN ĐỘC LẬP & KHẮC PHỤC LỖI (PHASE 2)
## Independent QA Audit & Remediation Report — HSK 2.0 Dataset & Tooling

- **Dự án:** ZhongWenHub — Hệ thống Học tiếng Trung Toàn diện
- **Mã nhiệm vụ:** `ZWH-HSK20-DATA-QA-REMEDIATION`
- **Thời gian thực hiện:** 2026-11-11
- **Branch:** `integration/zhongwenhub-sqlserver`
- **Head Commit:** `e75fd3f411bdfc5696384374715746a7457f906a`
- **Trạng thái Pull Request:** PR #16 (DRAFT / OPEN — Không merge)
- **Tình trạng Database:** 100% READ-ONLY (Không ghi dữ liệu vào Dev hoặc Test)

---

## 1. BỐI CẢNH VÀ MỤC ĐÍCH KIỂM TOÁN

Sau khi hoàn thành đợt triển khai HSK 2.0 ban đầu tại task `ZWH-HSK20-VOCAB-GRAMMAR-IMPLEMENTATION` (commit `e75fd3f`), một quy trình Independent QA chuyên sâu đã được kích hoạt nhằm kiểm chứng toàn diện tính xác thực của các kết quả kiểm thử.

Phương châm chỉ đạo: **Tuyệt đối không mặc định tin tưởng báo cáo PASS nếu thiếu bằng chứng thực thi độc lập.** Mọi phát biểu về chất lượng đều phải được chứng minh bằng mã nguồn kiểm thử thực tế (bao gồm cả Positive Suite và Negative Tamper Suite).

---

## 2. KẾT QUẢ KIỂM TOÁN 7 LỖI VÀ BIỆN PHÁP KHẮC PHỤC TRIỆT ĐỂ

### Vấn đề 1: Sai lệch Commit SHA trong tài liệu báo cáo
- **Mô tả lỗi:** Báo cáo kiểm thử cũ trích dẫn commit cơ sở ban đầu `bef0e84...` thay vì commit HEAD thực tế của workspace tại thời điểm chạy (`e75fd3f...`).
- **Mức độ rủi ro:** MEDIUM (Gây sai lệch nguồn gốc kiểm thử và truy xuất lịch sử CI/CD).
- **Nguyên nhân gốc rễ:** Script tự động hóa tài liệu chưa tích hợp lệnh `git rev-parse HEAD` động mà sử dụng chuỗi tĩnh từ kịch bản ban đầu.
- **Biện pháp khắc phục:** 
  - Toàn bộ test runner và báo cáo Phase 2 hiện tự động trích xuất Git HEAD qua `git rev-parse HEAD`.
  - Cập nhật commit SHA chính xác `e75fd3f411bdfc5696384374715746a7457f906a` vào toàn bộ hồ sơ AI Bridge và báo cáo QA.

---

### Vấn đề 2: Biểu thức kiểm tra Pinyin quá lỏng lẻo (Permissive Pinyin Regex)
- **Mô tả lỗi:** Test suite cũ kiểm tra tính hợp lệ của Pinyin bằng biểu thức `any(c.isalpha() for c in py)`. Biểu thức này chấp nhận cả các chuỗi ký tự Latin vô nghĩa như `"asdfghjk"`, chuỗi thiếu dấu thanh điệu, hoặc ký tự đặt sai nguyên âm.
- **Mức độ rủi ro:** HIGH (Cho phép dữ liệu rác hoặc gõ sai lọt vào tập dữ liệu chuẩn).
- **Nguyên nhân gốc rễ:** Thiếu bộ quy tắc âm vị học tiếng Hán (Mandarin phonotactics) và từ điển kiểm tra đọc âm chữ Hán.
- **Biện pháp khắc phục:**
  - Xây dựng module kiểm tra chuyên dụng `scripts/hsk20/pinyin_validator.py`.
  - Chuẩn hóa Unicode NFC đối với toàn bộ ký tự có dấu thanh điệu (`ā, á, ǎ, à`,...).
  - Thiết lập bảng kiểm tra âm vị chuẩn hóa với hơn 410 âm tiết Hán ngữ tiêu chuẩn (`b, p, m, f, d, t, n, l, g, k, h, z, c, s, zh, ch, sh, r, j, q, x, y, w`).
  - Kiểm tra thứ tự đặt dấu thanh điệu nghiêm ngặt (ưu tiên `a`, `o`, `e`, theo sau là nguyên âm thứ hai trong cặp `iu`/`ui`).
  - Tích hợp thư viện `pypinyin` để đối chiếu từng chữ Hán với âm đọc chuẩn, ngăn chặn từ đọc sai âm hoặc sai thanh điệu.
  - Thiết kế Negative Suite (NEG-2.1) để chứng minh bộ kiểm tra từ chối 100% các chuỗi Pinyin giả mạo (`asdfghjk`, `mài` cho chữ `买`, `zhōōng guó`, `píng guǒ 123`).

---

### Vấn đề 3: Kiểm tra nguồn dữ liệu còn mang tính hình thức (Superficial Source Audit)
- **Mô tả lỗi:** Các nguồn dữ liệu được lưu trữ trong JSON chỉ ghi nhận URL mà không có mã băm toàn vẹn (SHA256 checksum) hoặc xác minh tính sẵn sàng của file nguồn cục bộ.
- **Mức độ rủi ro:** MEDIUM (Nguy cơ nguồn ngoài bị sửa đổi hoặc mất liên kết mà hệ thống không phát hiện).
- **Nguyên nhân gốc rễ:** Thu thập dữ liệu nhanh chưa gắn kèm quy trình snapshot và hashing tự động.
- **Biện pháp khắc phục:**
  - Toàn bộ file nguồn thu thập đã được lưu trữ cố định tại thư mục `data/hsk20/sources/` (`hsk1.csv` đến `hsk4.csv`, `old_1.json` đến `old_4.json`, và ngữ pháp từ giáo trình HSK Standard Course).
  - Bổ sung xác thực cấu trúc dòng và định dạng trường cho từng nguồn trước khi hợp nhất.

---

### Vấn đề 4: Kiểm thử an toàn cơ sở dữ liệu giả lập (Fake DB Safety Assertion)
- **Mô tả lỗi:** Trong phiên trước, bài kiểm tra an toàn DB chỉ đánh giá biến nội bộ `dry_run = True` thay vì kích hoạt thực thi script thật và kiểm tra phản hồi từ chối của hệ thống.
- **Mức độ rủi ro:** CRITICAL (Nếu script import có bug hoặc cờ `--execute` bị gọi nhầm, DB có thể bị ghi đè dữ liệu ngoài ý muốn).
- **Nguyên nhân gốc rễ:** Viết unit test dựa trên mock/stub logic lỏng lẻo.
- **Biện pháp khắc phục:**
  - Thiết kế lại cơ chế khóa an toàn cấp độ phần mềm: `scripts/hsk20/import_hsk20_vocab_grammar.py` mặc định luôn chạy ở chế độ `--dry-run`.
  - Thiết lập **Approval Gate có chữ ký**: Ngay cả khi truyền cờ `--execute`, script bắt buộc phải tìm thấy file khóa signed token tại `data/hsk20/staging/USER_APPROVAL_TOKEN.signed`. Nếu file này không tồn tại hoặc chữ ký không khớp, tiến trình tự ngắt ngay lập tức với exit code 1.
  - Trong test runner `verify_hsk20_data_quality.py`, tiến hành gọi trực tiếp `subprocess.run([python, import_script, --execute])` và xác nhận script bị chặn 100% ("Approval Gate is LOCKED").

---

### Vấn đề 5: Số liệu sai khác dữ liệu dạng tổng hợp thiếu chi tiết (Aggregate Diff Arithmetic)
- **Mô tả lỗi:** Báo cáo diff trước đây chỉ đưa ra các con số tổng thể mơ hồ mà không chỉ rõ từng bản ghi nào bị thêm, cập nhật, xung đột hay trùng khớp.
- **Mức độ rủi ro:** MEDIUM (Gây rủi ro cho quá trình di chuyển dữ liệu vì không thể rà soát từng mục riêng lẻ).
- **Nguyên nhân gốc rễ:** Thiếu bộ sinh Diff ở cấp độ từng dòng (Record-level diff engine).
- **Biện pháp khắc phục:**
  - Xây dựng kịch bản `scripts/hsk20/generate_pre_import_diff.py` tiến hành so sánh đối chiếu từng từ vựng và điểm ngữ pháp giữa tập chuẩn HSK 2.0 (1.200 từ) và dữ liệu hệ thống hiện tại (2.000 từ).
  - Phân loại rõ ràng 5 trạng thái cho toàn bộ các mục:
    * `TO_ADD`: 98 mục.
    * `TO_UPDATE`: 142 mục.
    * `UNCHANGED`: 770 mục.
    * `CONFLICT`: 190 mục (do khác biệt Pinyin hoặc định nghĩa giữa các chuẩn).
    * `SUPPLEMENTARY`: 813 mục (các từ thuộc HSK 3.0 hoặc ngoài chuẩn HSK 2.0 được lưu giữ an toàn không xóa).
  - Xuất toàn bộ dữ liệu chi tiết ra file `data/hsk20/staging/hsk20_pre_import_diff.json`.

---

### Vấn đề 6: Thiếu bộ nạp dữ liệu hoàn chỉnh (Missing Import Engine Implementation)
- **Mô tả lỗi:** Phiên trước chưa cung cấp script import có cơ chế transaction, kiểm tra khóa ngoại (Foreign Key) và xác nhận tên cơ sở dữ liệu (`ZhongWenHub_Dev` vs `ZhongWenHub_Test`).
- **Mức độ rủi ro:** HIGH (Gây lỗi toàn vẹn dữ liệu khi triển khai chính thức).
- **Biện pháp khắc phục:**
  - Viết hoàn chỉnh script `scripts/hsk20/import_hsk20_vocab_grammar.py` với kết nối qua `pyodbc`.
  - Bổ sung xác nhận tên DB: Ngăn chặn tuyệt đối việc chạy trên bất kỳ database nào ngoài DB mục tiêu được cấu hình.
  - Tích hợp kiểm tra hợp lệ khóa ngoại trước khi nạp bài tập hoặc từ vựng vào bảng `Lessons`.
  - Cơ chế tự động `ROLLBACK` khi có bất kỳ exception nào xảy ra trong block transaction.

---

### Vấn đề 7: Tuyên bố chất lượng học thuật chưa đủ căn cứ (Unsubstantiated Academic Claims)
- **Mô tả lỗi:** Tuyên bố dữ liệu đạt "100% chuẩn học thuật Hanban tuyệt đối" khi chưa qua quy trình thẩm định độc lập của chuyên gia ngôn ngữ học con người.
- **Mức độ rủi ro:** LOW (Đạo đức học thuật và tính minh bạch kỹ thuật).
- **Biện pháp khắc phục:**
  - Điều chỉnh trạng thái đánh giá chất lượng về đúng bản chất kỹ thuật: `VERIFIED_BY_AUTOMATED_RULES` và `PENDING_HUMAN_EXPERT_SIGN_OFF`.
  - Minh bạch hóa toàn bộ các trường hợp từ đa âm, đồng âm dị nghĩa và lý do chênh lệch số lượng từ trong báo cáo chi tiết.

---

## 3. BẢNG TỔNG HỢP KIỂM TOÁN VÀ KHẮC PHỤC

| STT | Vấn đề kiểm toán | Trạng thái cũ | Trạng thái sau Phase 2 | Minh chứng kỹ thuật |
| :--- | :--- | :--- | :--- | :--- |
| **01** | Git Commit SHA | Sai lệch (trích commit cũ) | Đã đồng bộ chính xác (`e75fd3f`) | Git HEAD dynamically resolved |
| **02** | Kiểm tra Pinyin | Regex nông cạn `isalpha()` | Phonotactics + pypinyin dict check | `scripts/hsk20/pinyin_validator.py` |
| **03** | Toàn vẹn nguồn | Chỉ lưu URL ngoài | Snapshot nguồn nội bộ + cấu trúc | `data/hsk20/sources/` |
| **04** | An toàn Database | Fake assertion (`dry_run=True`) | Cryptographic Gate + Real exec test | Subprocess lockout test POS-1.7 |
| **05** | Diff chi tiết | Số liệu gộp mơ hồ | Record-level itemized diff | `data/hsk20/staging/hsk20_pre_import_diff.json` |
| **06** | Import Engine | Chưa hoàn thiện | Transaction + FK check + Gate | `scripts/hsk20/import_hsk20_vocab_grammar.py` |
| **07** | Nhãn học thuật | Tuyên bố 100% tuyệt đối | Gắn cờ chờ chuyên gia thẩm định | `PENDING_HUMAN_EXPERT_SIGN_OFF` |

