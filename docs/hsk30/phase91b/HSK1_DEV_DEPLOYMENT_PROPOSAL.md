# ZHONGWENHUB — ĐỀ XUẤT TRIỂN KHAI DỮ LIỆU LÊN MÔI TRƯỜNG DEV (DEV DEPLOYMENT PROPOSAL)

**Tài liệu:** `docs/hsk30/phase91b/HSK1_DEV_DEPLOYMENT_PROPOSAL.md`  
**Giai đoạn:** Phase 9.1B — Task H  
**Ngày lập:** 09/11/2026  
**Trạng thái:** DRAFT PROPOSAL — CHỜ NGƯỜI DÙNG PHÊ DUYỆT (AWAITING USER APPROVAL)  
**Nguyên tắc cốt lõi:** ZERO WRITE ON DEV TRONG PHASE 9.1B. CHỈ THỰC HIỆN KHI ĐƯỢC CHỈ ĐỊNH RÕ RÀNG Ở PHASE 9.1C HOẶC TƯƠNG ĐƯƠNG.

---

## I. TỔNG QUAN TẬP DỮ LIỆU ĐÃ KIỂM ĐỊNH TẠI STAGING

Toàn bộ gói dữ liệu nâng cấp HSK 1 đã được sinh, kiểm tra cú pháp và kiểm định dry-run thành công 100% trên `ZhongWenHub_Test`:

1. **Bộ ví dụ câu từ vựng (`data/hsk30/staging/hsk1_vocabulary_examples.json`):**
   - **Số lượng:** 291 bản ghi từ vựng.
   - **Mục tiêu:** Cập nhật trường `ExamplesJson` cho 291 từ đang để trống hoặc null.
   - **Định dạng:** JSON mảng đối tượng `[{"zh": "...", "pinyin": "...", "meaningVi": "..."}]`.
   - **Chất lượng:** 100% câu mẫu sơ cấp chuẩn sư phạm, khớp chữ Hán mục tiêu, có pinyin thanh điệu và nghĩa tiếng Việt tự nhiên.
2. **Bộ bài tập luyện tập (`data/hsk30/staging/hsk1_exercises.json`):**
   - **Số lượng:** 32 bài tập mới.
   - **Phân bổ:** 2 bài tập/bài học cho 15 bài học (30 bài) + 2 bài ôn tập tổng hợp (Units 1–3 và Units 4–6).
   - **Trạng thái:** `Status = 'DRAFT'` (tuân thủ nguyên tắc không tự ý xuất bản).
   - **Mật độ sau triển khai:** Tổng số bài tập tăng từ 28 lên 60 bài (đạt chuẩn 4 bài/bài học).
3. **Bộ đoạn văn đọc hiểu (`data/hsk30/staging/hsk1_reading_passages.json`):**
   - **Số lượng:** 6 đoạn văn ngắn kết nối (20–40 chữ Hán) cho 6 bài học cuối Units (Lessons 2, 4, 7, 10, 13, 15).
   - **Kèm theo:** Câu hỏi trắc nghiệm kiểm tra đọc hiểu và giải thích chi tiết.
   - **Phương án tích hợp:** Không thay đổi cấu trúc bảng SQL Server (Zero Schema Impact).

---

## II. KẾ HOẠCH & QUY TRÌNH ÁP DỤNG LÊN DEV (DEPLOYMENT RUNBOOK)

Khi người dùng phê duyệt áp dụng lên môi trường `ZhongWenHub_Dev`:

### Bước 1: Tạo bản sao lưu (Snapshot Backup)
- Trước khi thực hiện bất kỳ lệnh ghi nào, tạo snapshot của database `ZhongWenHub_Dev`:
  ```sql
  BACKUP DATABASE ZhongWenHub_Dev TO DISK = 'D:\ZhongWenHub\data\backup\ZhongWenHub_Dev_PrePhase91C.bak' WITH INIT;
  ```

### Bước 2: Thực thi Script Ingestion qua Transaction An toàn
Sử dụng script chuyên dụng có kiểm tra transaction:
1. `UPDATE vocabularies`: Cập nhật `ExamplesJson` cho 291 từ vựng HSK 1 mục tiêu.
2. `INSERT INTO exercises`: Nạp 32 bài tập mới với trạng thái `Status = 'DRAFT'`.
3. Kiểm tra số dòng bị ảnh hưởng (`@@ROWCOUNT`). Nếu không đúng 291 và 32, tự động `ROLLBACK TRANSACTION`.

### Bước 3: Giữ nguyên Release Gate của 12 Lessons DRAFT
- Lessons 4–15 tiếp tục giữ trạng thái `DRAFT`.
- Chỉ người dùng có vai trò `ADMIN` hoặc `CONTENT_MANAGER` mới có quyền duyệt xuất bản (`PUBLISHED`) thông qua Release Gate sau khi hoàn tất kiểm tra nghiệm thu.

### Bước 4: Kiểm chứng tính toàn vẹn sau Ingestion
- Kiểm tra số lượng người dùng: Phải giữ nguyên chính xác 39 người dùng.
- Kiểm tra số lượng bài học: Phải giữ nguyên 140 bài học (3 PUBLISHED, 137 DRAFT).
- Kiểm tra tiến độ học viên cũ: Giữ nguyên 14 bản ghi (13 `les-1` được backward compatible).

---

## III. YÊU CẦU PHÊ DUYỆT

> [!IMPORTANT]
> Toàn bộ Phase 9.1B tuân thủ nghiêm ngặt nguyên tắc **ZERO WRITE ON DEV**.
> Dữ liệu đã sẵn sàng trong thư mục `data/hsk30/staging/`.
> Vui lòng chỉ định rõ khi nào bạn muốn tiến hành áp dụng gói dữ liệu này lên `ZhongWenHub_Dev`.
