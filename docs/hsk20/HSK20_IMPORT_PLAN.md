# ZHONGWENHUB — KẾ HOẠCH IMPORT VÀ QUY TRÌNH AN TOÀN DỮ LIỆU
## HSK 2.0 DATA IMPORT, TRANSACTION INTEGRITY & ROLLBACK SPECIFICATION

- **Mã nhiệm vụ:** `ZWH-HSK20-VOCAB-GRAMMAR-IMPLEMENTATION`
- **Môi trường mục tiêu:** `ZhongWenHub_Test` (SQL Server `.\SQLEXPRESS`)
- **Môi trường cấm:** `ZhongWenHub_Dev` (Tuyệt đối không ghi, chỉ đọc)
- **Tình trạng:** SẴN SÀNG — ĐANG KHÓA CHỜ NGƯỜI DÙNG PHÊ DUYỆT (Gate Active)

---

## 1. Nguyên tắc An toàn Cơ sở Dữ liệu Bắt buộc

1. **Khóa ghi mặc định (Dry-Run by Default):**
   Mọi script import (`scripts/hsk20/import_hsk20_vocab_grammar.py`) đều chạy mặc định ở chế độ mô phỏng (`--dry-run`). Không thể ghi dữ liệu trừ khi có cờ tường minh `--execute` kèm sự phê duyệt của Người dùng.
2. **Kiểm tra Tên Database tại Điểm Kết nối:**
   Trước bất kỳ thao tác nào, script thực thi lệnh SQL trực tiếp:
   ```sql
   SELECT DB_NAME();
   ```
   Nếu kết quả trả về khác `ZhongWenHub_Test`, tiến trình sẽ lập tức kích hoạt Exception và dừng ngay lập tức.
3. **Tuyệt đối không chạm vào dữ liệu người dùng:**
   Không cập nhật bảng `Users`, `StudentProgress`, `UserActivities`, `PracticeAttempts`, hay điểm kinh nghiệm (`XP`).
4. **Idempotency (Tính lũy kế):**
   - Từ vựng: Đối chiếu theo cặp khóa tự nhiên `(Hanzi, HskLevel)`. Nếu đã tồn tại thì cập nhật metadata nguồn; nếu chưa có thì thêm mới. Tuyệt đối không nhân đôi bản ghi.
   - Ngữ pháp: Đối chiếu theo `Code` (ví dụ `GP-HSK1-001`).

---

## 2. Kế hoạch Snapshot & Phục hồi (Rollback Plan)

### Bước 1: Sao lưu hiện trạng trước khi import
Thực thi lệnh:
```powershell
python scripts/hsk20/snapshot_and_rollback.py --snapshot
```
Dữ liệu hiện tại của bảng `Vocabularies` và `GrammarPoints` sẽ được lưu trữ an toàn tại:
`data/hsk20/staging/pre_import_test_db_snapshot.json`

### Bước 2: Khôi phục khi có sự cố (Rollback Trigger)
Nếu quá trình import phát hiện sai lệch hoặc người dùng yêu cầu hoàn nguyên:
```powershell
python scripts/hsk20/snapshot_and_rollback.py --rollback
```
- Khôi phục trạng thái bảng về đúng bản sao lưu ban đầu trong Transaction duy nhất.
- Thời gian phục hồi (RTO): < 30 giây.
- Mục tiêu điểm phục hồi (RPO): 0 (không mất bất kỳ bản ghi nào của học viên).

---

## 3. Các bước Thực hiện Dự kiến Sau khi được Phê duyệt

1. **Giai đoạn 1 — Snapshot Baseline:**
   Tạo tệp snapshot lưu trữ trạng thái `ZhongWenHub_Test`.
2. **Giai đoạn 2 — Dry-run Verification:**
   Chạy xác thực mô phỏng 1.200 từ vựng và 311 điểm ngữ pháp.
3. **Giai đoạn 3 — Phê duyệt từ Người dùng:**
   Người dùng kiểm tra báo cáo chênh lệch và bấm xác nhận cho phép ghi `ZhongWenHub_Test`.
4. **Giai đoạn 4 — Thực thi Import có kiểm soát:**
   Chạy `python scripts/hsk20/import_hsk20_vocab_grammar.py --execute`.
5. **Giai đoạn 5 — Kiểm tra Hậu kiểm (Post-import QA):**
   Chạy lại bộ kiểm thử tự động `scripts/hsk20/verify_hsk20_data_quality.py` trên database thực tế.
