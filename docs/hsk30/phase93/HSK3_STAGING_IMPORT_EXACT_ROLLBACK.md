# BÁO CÁO NHẬP DỮ LIỆU STAGING VÀ XÁC MINH ROLLBACK CHÍNH XÁC (EXACT ROLLBACK)

## I. MỤC TIÊU VÀ QUY TẮC AN TOÀN TUYỆT ĐỐI

1. **Ranh giới an toàn cơ sở dữ liệu**:
   - `ZhongWenHub_Dev`: **100% READ-ONLY**, tuyệt đối không ghi bất kỳ thay đổi nào.
   - `ZhongWenHub_Test`: Môi trường kiểm thử duy nhất được phép ghi.
   - Script `import_hsk3_staging_to_test.py` luôn kích hoạt `assert_safe_test_connection` kiểm tra `SELECT DB_NAME() == 'ZhongWenHub_Test'` trước khi mở giao dịch.
2. **Yêu cầu Exact Rollback (Khôi phục chính xác)**:
   - Không dựa vào đếm số dòng (row counts) đơn thuần.
   - Chụp ảnh snapshot toàn diện (Pre-import Snapshot) lưu trữ mã băm SHA256 trước khi thực hiện ghi.
   - Khi chạy `--mode rollback`, script xóa các bản ghi được thêm mới, hoàn nguyên giá trị ban đầu của các bản ghi được cập nhật, dọn dẹp `readingPassage`, và tính toán mã băm hậu hoàn nguyên (Post-rollback SHA256) đối chiếu với Pre-import SHA256.

---

## II. QUÁ TRÌNH THỰC THI PIPELINE VÀ BẰNG CHỨNG

### 1. Thử nghiệm Dry-Run (`--mode dry-run`)
- Lệnh chạy: `python scripts/hsk30/import_hsk3_staging_to_test.py --mode dry-run`
- Kết quả:
  - Pre-import snapshot captured: `{'lessons': 20, 'vocabularies': 0, 'exercises': 40}` (SHA256: `3a9c1c173d30af69dbd8df2afc4ab9093617cfa2d824d87463ddbd71898cb377`).
  - Mô phỏng chèn 500 từ vựng, 80 bài tập, 5 bài đọc hiểu.
  - Giao dịch được `ROLLBACK` sạch sẽ, 0 dirty writes.

### 2. Thực hiện Commit lần 1 (`--mode commit`)
- Lệnh chạy: `python scripts/hsk30/import_hsk3_staging_to_test.py --mode commit`
- Kết quả:
  - Đã chèn 500 từ vựng HSK 3 với đầy đủ ví dụ câu vào `vocabularies`.
  - Đã cập nhật 40 bài tập cũ và chèn 40 bài tập mới vào `exercises` (tổng 80 bài).
  - Đã tiêm 5 bài đọc hiểu vào `DialogueJson` của các bài 4, 8, 12, 16, 20.
  - Toàn bộ thay đổi được lưu bền vững vào `ZhongWenHub_Test`.

### 3. Thử nghiệm Hoàn nguyên Chính xác (`--mode rollback`)
- Lệnh chạy: `python scripts/hsk30/import_hsk3_staging_to_test.py --mode rollback`
- Kết quả:
  - Xóa 80 bài tập HSK 3 khỏi `exercises`.
  - Khôi phục nguyên vẹn 40 bài tập ban đầu từ snapshot.
  - Khôi phục `DialogueJson` của 20 bài học.
  - Xóa 500 từ vựng đã chèn khỏi `vocabularies`.
  - **BẰNG CHỨNG XÁC THỰC**:
    ```text
    EXACT ROLLBACK VERIFIED! Post-rollback SHA256: 3a9c1c173d30af69dbd8df2afc4ab9093617cfa2d824d87463ddbd71898cb377
    ```
    Mã băm hậu hoàn nguyên khớp 100% với mã băm ban đầu.

### 4. Tái xác lập Commit cho Kiểm thử (`--mode commit`)
- Lệnh chạy: `python scripts/hsk30/import_hsk3_staging_to_test.py --mode commit`
- Dữ liệu HSK 3 được nạp đầy đủ vào `ZhongWenHub_Test` sẵn sàng cho Playwright E2E và Backend tests.
