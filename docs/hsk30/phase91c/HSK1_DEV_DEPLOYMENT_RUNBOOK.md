# SỔ TAY TRIỂN KHAI DATABASE DEV (RUNBOOK)
## HSK 1 PRODUCTION/DEV DEPLOYMENT RUNBOOK & OPERATIONAL SOP

- **Tài liệu**: Quy trình chuẩn triển khai dữ liệu học liệu HSK 1 lên `ZhongWenHub_Dev`
- **Mục đích**: Hướng dẫn chi tiết từng bước cho Quản trị viên hệ thống khi nhận được phê duyệt học thuật chính thức từ chuyên gia con người
- **Thời điểm áp dụng**: Chỉ kích hoạt sau khi Phase 9.1C hoàn thành và có lệnh xuất bản chính thức từ Product Manager

---

## 1. CÔNG TÁC CHUẨN BỊ BẮT BUỘC (PRE-FLIGHT CHECKLIST)

Trước khi thực hiện bất kỳ lệnh ghi nào vào `ZhongWenHub_Dev`, quản trị viên bắt buộc phải thực hiện các bước sau:

### Bước 1.1: Tạo bản sao lưu toàn vẹn (Full Database Backup)
Mở PowerShell hoặc SQL Server Management Studio (SSMS) và chạy lệnh:
```sql
BACKUP DATABASE [ZhongWenHub_Dev] 
TO DISK = N'D:\ZhongWenHub\backups\ZhongWenHub_Dev_PrePhase91Deploy.bak' 
WITH FORMAT, INIT, NAME = N'ZhongWenHub_Dev Pre-Phase 9.1 Full Backup', STATS = 10;
```
*Xác nhận: File `.bak` đã được tạo thành công với dung lượng đầy đủ.*

### Bước 1.2: Kiểm tra biên bản phê duyệt con người (Human Approval Sign-off)
Xác nhận trong tài liệu [HSK1_RELEASE_READINESS_CHECKLIST.md](file:///D:/ZhongWenHub/docs/hsk30/phase91c/HSK1_RELEASE_READINESS_CHECKLIST.md) rằng cả 3 vai trò:
1. HSK Curriculum Specialist
2. Chinese–Vietnamese QA Specialist (đã duyệt trợ từ "得")
3. Product Release Manager
đều đã ký duyệt `APPROVED`.

---

## 2. QUY TRÌNH THỰC HIỆN TRIỂN KHAI (STEP-BY-STEP EXECUTION)

### Bước 2.1: Triển khai 291 Ví dụ Từ vựng (Vocabulary Examples)
Chạy script chuyên dụng với cờ tham số đích xác `ZhongWenHub_Dev`:
```powershell
python scripts/hsk30/deploy_to_dev.py --target dev --component vocab-examples
```
*Xác minh: 291 từ vựng HSK 1 được cập nhật trường `ExamplesJson` với đầy đủ câu ví dụ, Pinyin và dịch nghĩa tiếng Việt.*

### Bước 2.2: Triển khai 32 Bài tập Trắc nghiệm Mới (Staging Exercises)
```powershell
python scripts/hsk30/deploy_to_dev.py --target dev --component exercises
```
*Xác minh: Bảng `exercises` trên `ZhongWenHub_Dev` tăng thêm đúng 32 bài tập, không xảy ra xung đột khóa ngoại.*

### Bước 2.3: Nạp 6 Bài đọc hiểu vào `lessons.DialogueJson`
```powershell
python scripts/hsk30/deploy_to_dev.py --target dev --component reading-passages
```
*Xác minh: 6 bài học cuối Unit (Lessons 2, 4, 7, 10, 13, 15) có thuộc tính `readingPassage` hợp lệ trong `DialogueJson`.*

### Bước 2.4: Mở khóa Release Gate (Chuyển Lesson 4–15 sang PUBLISHED)
Sau khi nội dung đã được nạp và kiểm tra hiển thị hoàn tất trên Dev:
```sql
UPDATE lessons 
SET Status = 'PUBLISHED', UpdatedAt = GETUTCDATE() 
WHERE Id IN (
    SELECT l.Id FROM lessons l 
    JOIN units u ON l.UnitId = u.Id 
    JOIN courses c ON u.CourseId = c.Id 
    WHERE c.HskLevel = 1 AND l.LessonNumber BETWEEN 4 AND 15
);
```

---

## 3. KIỂM CHỨNG HẬU TRIỂN KHAI (POST-DEPLOYMENT SMOKE TESTS)

Chạy các truy vấn xác minh tính toàn vẹn:
```sql
-- 1. Kiểm tra tổng số bài học PUBLISHED của HSK 1 (Kỳ vọng: 15)
SELECT COUNT(*) FROM lessons l 
JOIN units u ON l.UnitId = u.Id 
JOIN courses c ON u.CourseId = c.Id 
WHERE c.HskLevel = 1 AND l.Status = 'PUBLISHED';

-- 2. Kiểm tra số từ vựng HSK 1 có ví dụ (Kỳ vọng: 300)
SELECT COUNT(*) FROM vocabularies 
WHERE HskLevel = 1 AND ExamplesJson IS NOT NULL;

-- 3. Kiểm tra số người dùng và tiến độ học tập (Tuyệt đối không bị xáo trộn)
SELECT COUNT(*) FROM users; -- Kỳ vọng: 39
SELECT COUNT(*) FROM student_lesson_progress; -- Kỳ vọng: 14
```

---

## 4. QUY TRÌNH HOÀN NGUYÊN KHẨN CẤP (EMERGENCY ROLLBACK)

Nếu phát hiện bất kỳ sự cố bất thường nào trong quá trình đưa dữ liệu lên Dev:
1. Đưa các bài học 4–15 trở lại trạng thái `DRAFT`:
   ```sql
   UPDATE lessons SET Status = 'DRAFT' WHERE LessonNumber BETWEEN 4 AND 15;
   ```
2. Phục hồi toàn vẹn cơ sở dữ liệu từ file backup đã tạo ở Bước 1.1:
   ```sql
   ALTER DATABASE [ZhongWenHub_Dev] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
   RESTORE DATABASE [ZhongWenHub_Dev] 
   FROM DISK = N'D:\ZhongWenHub\backups\ZhongWenHub_Dev_PrePhase91Deploy.bak' WITH REPLACE;
   ALTER DATABASE [ZhongWenHub_Dev] SET MULTI_USER;
   ```
3. Thông báo cho nhóm kỹ thuật để điều tra nguyên nhân.
