# QUY TRÌNH HƯỚNG DẪN TRIỂN KHAI HSK 2 LÊN DEV & PRODUCTION (HSK 2 DEPLOYMENT RUNBOOK)

> **Mục tiêu:** Cung cấp hướng dẫn chi tiết từng bước cho Release Engineer khi nhận được văn bản phê duyệt chính thức từ Hội đồng Chuyên gia để triển khai học liệu HSK 2 lên môi trường Development và Production.  
> **CẢNH BÁO QUAN TRỌNG:** KHÔNG THỰC HIỆN CÁC BƯỚC TRONG RUNBOOK NÀY NẾU CHƯA CÓ CHỮ KÝ PHÊ DUYỆT CỦA CHUYÊN GIA CON NGƯỜI THẬT.  

---

## 1. CÁC ĐIỀU KIỆN TIÊN QUYẾT (PRE-REQUISITES)

Trước khi thực hiện triển khai:
1. Có biên bản nghiệm thu ký bởi Senior Chinese Linguistic Expert và Curriculum Lead.
2. Kiểm tra sao lưu cơ sở dữ liệu (Full Database Backup) của `ZhongWenHub_Dev` và `ZhongWenHub_Prod`.
3. Nhánh Git đang ở trạng thái sạch, đã rebase hoặc merge các commit mới nhất từ `main`.

---

## 2. QUY TRÌNH TRIỂN KHAI TỪNG BƯỚC (STEP-BY-STEP PROCEDURE)

### Bước 1: Sao lưu cơ sở dữ liệu Dev
Chạy lệnh PowerShell tạo bản snapshot backup trước khi ghi dữ liệu:
```powershell
sqlcmd -S .\SQLEXPRESS -E -Q "BACKUP DATABASE [ZhongWenHub_Dev] TO DISK = 'D:\ZhongWenHub\backups\ZhongWenHub_Dev_PrePhase92_$(Get-Date -Format 'yyyyMMdd_HHmmss').bak' WITH INIT, COMPRESSION;"
```

### Bước 2: Kiểm tra tính hợp lệ của bộ Staging
Chạy script kiểm toán toàn vẹn trước khi nạp:
```powershell
python scripts/hsk30/generate_hsk2_vocabulary_examples.py
python scripts/hsk30/generate_hsk2_exercises.py
python scripts/hsk30/generate_hsk2_reading_passages.py
```

### Bước 3: Chạy thử nghiệm nạp với cơ chế Dry-Run trên Dev DB
> *Chỉ mở khóa cờ an toàn trong script khi có chỉ thị trực tiếp từ Release Manager.*
```powershell
# Thực hiện kiểm tra giao dịch nạp mà không commit
python scripts/hsk30/deploy_hsk2_to_dev.py --mode dry-run
```

### Bước 4: Thực thi nạp chính thức (Commit)
```powershell
python scripts/hsk30/deploy_hsk2_to_dev.py --mode commit
```

### Bước 5: Kiểm toán số lượng sau khi nạp
Kiểm tra số lượng bản ghi trên cơ sở dữ liệu sau nạp:
```sql
SELECT 'Vocabularies' AS Entity, COUNT(*) AS Total FROM vocabularies WHERE HskLevel = 2
UNION ALL
SELECT 'Exercises' AS Entity, COUNT(*) AS Total FROM exercises WHERE HskLevel = 2
UNION ALL
SELECT 'ReadingPassages' AS Entity, COUNT(*) AS Total FROM lessons l JOIN units u ON l.UnitId = u.Id JOIN courses c ON u.CourseId = c.Id WHERE c.HskLevel = 2 AND l.DialogueJson LIKE '%readingPassage%';
```
*Kết quả kỳ vọng:*
- Vocabularies: 200 bản ghi (100% có câu ví dụ)
- Exercises: 60 bản ghi (hoặc 60 + các bài tập cũ)
- ReadingPassages: đúng 5 bài đọc hiểu ở Bài 3, 6, 9, 12, 15.

### Bước 6: Phê duyệt xuất bản (Publishing Gate)
Sau khi kiểm tra học liệu hiển thị chuẩn xác trên môi trường Staging:
Chạy API hoặc script kích hoạt trạng thái từ `DRAFT` $\rightarrow$ `PUBLISHED` cho 15 bài học HSK 2:
```sql
UPDATE lessons 
SET Status = 'PUBLISHED', UpdatedAt = GETUTCDATE()
FROM lessons l
JOIN units u ON l.UnitId = u.Id
JOIN courses c ON u.CourseId = c.Id
WHERE c.HskLevel = 2;
```

---

## 3. KẾ HOẠCH HỒI NGUYÊN KHẨN CẤP (ROLLBACK PLAN)

Nếu phát hiện bất kỳ sự cố nghiêm trọng nào sau khi triển khai:
1. **Phương án 1 (Rollback qua script):**
   ```powershell
   python scripts/hsk30/deploy_hsk2_to_dev.py --mode rollback
   ```
2. **Phương án 2 (Phục hồi từ bản sao lưu .bak):**
   ```powershell
   sqlcmd -S .\SQLEXPRESS -E -Q "ALTER DATABASE [ZhongWenHub_Dev] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; RESTORE DATABASE [ZhongWenHub_Dev] FROM DISK = 'D:\ZhongWenHub\backups\ZhongWenHub_Dev_PrePhase92_...bak' WITH REPLACE; ALTER DATABASE [ZhongWenHub_Dev] SET MULTI_USER;"
   ```
