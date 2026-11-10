# BÁO CÁO QUY TRÌNH STAGING IMPORT VÀ EXACT ROLLBACK TEST CƠ SỞ DỮ LIỆU HSK 4

## I. BẢO MẬT TUYỆT ĐỐI MÔI TRƯỜNG DEV

Thực hiện nghiêm ngặt quy tắc DB Safety Guard:
- `SELECT DB_NAME()` được gọi trước mọi thao tác ghi.
- Cơ sở dữ liệu `ZhongWenHub_Dev` được bảo vệ tuyệt đối (Zero writes).
- Mọi thao tác staging import, dry-run và rollback chỉ diễn ra trên `ZhongWenHub_Test`.

---

## II. TIẾN TRÌNH THỰC HIỆN VÀ KẾT QUẢ ROLLBACK HASH

1. **Chụp ảnh snapshot ban đầu**:
   Chụp mã băm SHA256 toàn bộ bảng dữ liệu liên quan của `ZhongWenHub_Test`:
   `SHA256: 36795ff12092354f831f16b3af3db3d0a51b1b23cad897f0d46a0bf0b1dc4609`.
2. **Thực hiện Staging Import lần 1**:
   - Thêm mới 1,000 bản ghi từ vựng vào bảng `vocabularies`.
   - Cập nhật 40 bài tập hiện có và thêm mới 40 bài tập vào bảng `exercises`.
   - Nhúng 5 bài đọc hiểu Unit vào trường `DialogueJson` của 5 bài học tương ứng.
3. **Thực hiện Exact Rollback**:
   - Xóa bỏ 1,000 bản ghi từ vựng mới thêm.
   - Xóa 40 bài tập mới và khôi phục 40 bài tập gốc.
   - Khôi phục nội dung `DialogueJson` ban đầu.
   - Chụp mã băm sau khi khôi phục:
     `SHA256: 36795ff12092354f831f16b3af3db3d0a51b1b23cad897f0d46a0bf0b1dc4609` (Trùng khớp 100%!).
4. **Cam kết dữ liệu chính thức vào Test DB**:
   Tiến hành nạp lại sạch sẽ toàn bộ 1,000 từ vựng, 80 bài tập và 5 bài đọc vào `ZhongWenHub_Test`, sẵn sàng cho công tác kiểm thử E2E và hồi quy.
