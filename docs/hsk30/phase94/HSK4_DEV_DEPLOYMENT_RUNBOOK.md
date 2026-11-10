# HƯỚNG DẪN TRIỂN KHAI DỮ LIỆU HSK 4 LÊN MÔI TRƯỜNG DEV (DEPLOYMENT RUNBOOK)

> [!WARNING]
> Runbook này CHỈ ĐƯỢC PHÉP THỰC HIỆN sau khi Hội đồng Thẩm định Học thuật ký biên bản nghiệm thu người thật (`HUMAN_EXPERT_SIGN_OFF`). Nghiêm cấm tự ý chạy script này trong giai đoạn kiểm thử.

## I. CÁC BƯỚC THỰC HIỆN KHI CÓ PHÊ DUYỆT CHÍNH THỨC

1. **Bước 1 — Sao lưu cơ sở dữ liệu Dev**:
   ```sql
   BACKUP DATABASE ZhongWenHub_Dev TO DISK = 'D:\ZhongWenHub\Backups\ZhongWenHub_Dev_PrePhase94.bak' WITH INIT;
   ```
2. **Bước 2 — Xác thực môi trường và quyền thực thi**:
   ```powershell
   python scripts/hsk30/db_safety_guard.py --target ZhongWenHub_Dev --verify-token
   ```
3. **Bước 3 — Nạp dữ liệu học thuật HSK 4 vào Dev**:
   ```powershell
   python scripts/hsk30/promote_staging_to_dev.py --level 4 --manifest data/hsk30/staging/hsk4_content_human_review_manifest.json
   ```
4. **Bước 4 — Chạy kiểm thử xác thực sau khi nạp**:
   ```powershell
   dotnet test Backend/tests/ZhongWenHub.IntegrationTests/
   ```
5. **Bước 5 — Xuất bản có kiểm soát (Publishing Gate)**:
   Chuyển trạng thái 20 bài học HSK 4 từ `DRAFT` $ightarrow$ `PUBLISHED` thông qua API Review của Content Manager.
