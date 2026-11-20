# QUY TRÌNH TRIỂN KHAI LÊN DEV / PRODUCTION (DEPLOYMENT RUNBOOK)

## I. MỤC ĐÍCH

Runbook này cung cấp chỉ dẫn từng bước an toàn cho Kỹ sư Phát hành (Release Engineer) khi có sự phê duyệt chính thức bằng văn bản từ Chuyên gia Ngôn ngữ học để đưa gói học liệu HSK 3 từ Staging vào cơ sở dữ liệu `ZhongWenHub_Dev` hoặc Production.

---

## II. CÁC BƯỚC THỰC HIỆN TRIỂN KHAI

### Bước 1: Sao lưu Cơ sở Dữ liệu trước khi triển khai (Pre-Deployment Backup)
```powershell
# Chụp bản sao lưu khẩn cấp của ZhongWenHub_Dev
sqlcmd -S .\SQLEXPRESS -E -Q "BACKUP DATABASE [ZhongWenHub_Dev] TO DISK = 'D:\ZhongWenHub\data\hsk30\backups\ZhongWenHub_Dev_Pre_HSK3_Deployment.bak' WITH FORMAT, MEDIANAME = 'ZhongWenHub_Dev_Backup';"
```

### Bước 2: Kiểm tra Chữ ký Nghiệm thu Học thuật (Academic Sign-Off Check)
- Mở tệp `data/hsk30/staging/hsk3_content_human_review_manifest.json`.
- Xác nhận trường `releaseStatus` đã được chuyên gia con người ký duyệt thành `APPROVED_FOR_PRODUCTION`.
- Nếu vẫn là `PENDING_HUMAN_EXPERT_SIGN_OFF`, **DỪNG LẠI NGAY LẬP TỨC**.

### Bước 3: Chạy Pipeline Nhập Dữ liệu lên Dev với Dry-Run
```powershell
# Thực hiện kiểm tra giao dịch không commit trước
python scripts/hsk30/import_hsk3_staging_to_dev.py --mode dry-run
```

### Bước 4: Thực hiện Commit chính thức
```powershell
# Sau khi dry-run thành công, thực hiện commit
python scripts/hsk30/import_hsk3_staging_to_dev.py --mode commit
```

### Bước 5: Kiểm toán Tính toàn vẹn sau Triển khai (Post-Deployment Audit)
```powershell
# Chạy script kiểm toán đối chiếu số lượng thực thể
python scripts/hsk30/audit_hsk3_baseline.py
```
- Xác nhận:
  - Khóa học HSK 3: 1
  - Units HSK 3: 5
  - Lessons HSK 3: 20
  - Vocabularies HSK 3: 500 (100% có `ExamplesJson`)
  - Exercises HSK 3: 80 (đáp án cân đối)
  - Số người dùng, lịch sử học tập, XP không bị thay đổi.

### Bước 6: Phê duyệt Xuất bản Bài học (Publishing)
- Các bài học được duy trì ở trạng thái `DRAFT` cho đến khi Ban Giám hiệu / Giám đốc Đào tạo quyết định công bố từng Unit hoặc toàn bộ 20 bài học sang `PUBLISHED`.
```sql
-- Khi có quyết định xuất bản chính thức toàn khóa:
UPDATE lessons 
SET Status = 'PUBLISHED', UpdatedAt = GETUTCDATE()
WHERE UnitId IN (SELECT Id FROM units WHERE CourseId = '33333333-3333-3333-3333-333333333333');
```
