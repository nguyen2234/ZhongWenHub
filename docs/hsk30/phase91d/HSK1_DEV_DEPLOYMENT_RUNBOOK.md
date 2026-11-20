# HƯỚNG DẪN TRIỂN KHAI VÀ PHÁT HÀNH HSK 1 LÊN DEV DATABASE (DEV DEPLOYMENT RUNBOOK)

**Dự án:** ZhongWenHub  
**Cơ sở dữ liệu mục tiêu:** `ZhongWenHub_Dev` (Server: `.\SQLEXPRESS`)  
**Tài liệu tham chiếu:** `docs/hsk30/phase91d/HSK1_RELEASE_PACKAGE_MANIFEST.md`  
**Điều kiện tiên quyết:** **BẮT BUỘC ĐÃ CÓ CHỮ KÝ PHÊ DUYỆT TRONG [HSK1_CONTENT_HUMAN_REVIEW_CHECKLIST.md](file:///d:/ZhongWenHub/docs/hsk30/phase91d/HSK1_CONTENT_HUMAN_REVIEW_CHECKLIST.md)**  
**Cảnh báo an toàn:** Tuyệt đối không thực thi các bước dưới đây nếu chưa có văn bản phê duyệt của Hội đồng Thẩm định.  

---

## 1. ĐIỀU KIỆN TIÊN QUYẾT TRƯỚC KHI TRIỂN KHAI (PRE-REQUISITES)

1. [ ] Kiểm tra chữ ký thẩm định của Senior Chinese Curriculum Specialist và Linguistic QA Lead trong file `HSK1_CONTENT_HUMAN_REVIEW_CHECKLIST.md`.
2. [ ] Kiểm tra mã băm SHA-256 của các tệp staging trùng khớp với [HSK1_RELEASE_PACKAGE_MANIFEST.md](file:///d:/ZhongWenHub/docs/hsk30/phase91d/HSK1_RELEASE_PACKAGE_MANIFEST.md).
3. [ ] Tạo bản sao lưu (Full Backup) cơ sở dữ liệu `ZhongWenHub_Dev` trước khi thực hiện.

### Lệnh tạo sao lưu dự phòng:
```sql
BACKUP DATABASE [ZhongWenHub_Dev] 
TO DISK = 'D:\ZhongWenHub\backups\ZhongWenHub_Dev_PrePhase91D_Backup.bak'
WITH FORMAT, INIT, NAME = 'Pre-Phase 9.1D Dev Full Backup';
```

---

## 2. QUY TRÌNH 4 BƯỚC TRIỂN KHAI LÊN DEV DATABASE

### Bước 1: Áp dụng 14 bài tập sửa lỗi placeholder
Chạy script áp dụng các phương án nhiễu đạt chuẩn HSK 1 cho 14 bài tập:
```powershell
# Chạy ở chế độ dry-run để kiểm tra trước
python scripts/hsk30/apply_exercise_fixes_to_dev.py --mode dry-run

# Áp dụng chính thức
python scripts/hsk30/apply_exercise_fixes_to_dev.py --mode commit
```
*Tiêu chí thành công:* `Verification query: Placeholders remaining in HSK 1 exercises = 0`.

### Bước 2: Nhập 291 câu ví dụ từ vựng và 32 bài tập mới
Thực thi pipeline nhập staging data:
```powershell
python scripts/hsk30/import_staging_to_dev.py --mode dry-run
python scripts/hsk30/import_staging_to_dev.py --mode commit
```
*Tiêu chí thành công:*
- Cập nhật 291 câu ví dụ từ vựng vào bảng `vocabularies`.
- Chèn thêm 32 bài tập mới vào bảng `exercises` (tổng bài tập HSK 1 đạt đúng 60 bài).
- Nhúng 6 bài đọc hiểu vào trường `DialogueJson` của các bài học 2, 4, 7, 10, 13, 15.

### Bước 3: Xuất bản chính thức 12 bài học DRAFT (Release Gate Execution)
Sau khi học liệu đã được nhập và kiểm tra toàn vẹn, thực hiện chuyển trạng thái 12 bài học từ `DRAFT` sang `PUBLISHED`:
```sql
-- Chỉ thực thi khi ĐÃ CÓ PHÊ DUYỆT HỌC THUẬT
UPDATE l
SET l.Status = 'PUBLISHED', l.UpdatedAt = GETUTCDATE()
FROM lessons l
JOIN units u ON l.UnitId = u.Id
JOIN courses c ON u.CourseId = c.Id
WHERE c.HskLevel = 1 AND l.Status = 'DRAFT';
```
*Tiêu chí thành công:*
- 15/15 bài học HSK 1 đều mang trạng thái `PUBLISHED`.
- Học viên có thể truy cập toàn bộ 15 bài học qua giáo trình số.

### Bước 4: Chạy smoke test xác minh sau phát hành
```powershell
# Kiểm tra số lượng bài học đã xuất bản
python -c "
import pyodbc
conn = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;')
cur = conn.cursor()
cur.execute('SELECT COUNT(*) FROM lessons l JOIN units u ON l.UnitId = u.Id JOIN courses c ON u.CourseId = c.Id WHERE c.HskLevel = 1 AND l.Status = \'PUBLISHED\'')
print('Published HSK 1 Lessons:', cur.fetchone()[0])
"
```
*Kết quả kỳ vọng:* `Published HSK 1 Lessons: 15`.

---

## 3. KỊCH BẢN THU HỒI DỮ LIỆU KHẨN CẤP (ROLLBACK PROCEDURES)

Nếu trong quá trình triển khai phát hiện bất kỳ sự cố kỹ thuật hoặc yêu cầu thu hồi từ Hội đồng Thẩm định:

### Phương án A: Thu hồi bằng script chuyên dụng
```powershell
# 1. Chuyển lại 12 bài học về trạng thái DRAFT
python scripts/hsk30/revert_lessons_to_draft.py

# 2. Xóa 32 bài tập staging và làm sạch DialogueJson
python scripts/hsk30/import_staging_to_dev.py --mode rollback
```

### Phương án B: Khôi phục toàn bộ từ bản sao lưu (Full Database Restore)
```sql
USE master;
ALTER DATABASE [ZhongWenHub_Dev] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
RESTORE DATABASE [ZhongWenHub_Dev]
FROM DISK = 'D:\ZhongWenHub\backups\ZhongWenHub_Dev_PrePhase91D_Backup.bak'
WITH REPLACE;
ALTER DATABASE [ZhongWenHub_Dev] SET MULTI_USER;
```

---

## 4. KẾT LUẬN

Tài liệu này là cẩm nang hướng dẫn triển khai chuẩn mực và duy nhất cho đội ngũ DevOps và Release Engineering khi đưa học liệu HSK 1 chính thức lên môi trường vận hành.
