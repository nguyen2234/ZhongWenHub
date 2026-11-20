# QUESTION BANK BULK ADMINISTRATIVE APPROVAL REPORT (HSK 1–4)

**Repository:** `nguyen2234/ZhongWenHub`  
**Branch:** `integration/zhongwenhub-sqlserver`  
**Base Commit:** `c7dbec6a16a22dd14f6106f40eaf856ecc0a6d83`  
**PR:** `#16` (Open/Draft — kept strictly Open/Draft)  
**Target Environments:** `ZhongWenHub_Dev`, `ZhongWenHub_Test` (`.\SQLEXPRESS`, SQL Server; **Production untouched**)

---

## 1. Phân biệt rõ Phê duyệt quản trị vs. Kiểm duyệt học thuật vs. Xuất bản

Hệ thống trước đợt triển khai này đã sử dụng `ExerciseEntity.ReviewStatus == "APPROVED"` làm điều kiện cổng học thuật để xuất bản (`PublishAsync` trong `QuestionBankService.cs` và bảng `"Kiểm duyệt học thuật"` trên CMS). Để tuyệt đối **không trộn lẫn quyết định quản trị của chủ dự án với xác nhận chuyên môn tiếng Trung của giảng viên** và **không tự động xuất bản**, giải pháp đã bổ sung hai trường trạng thái độc lập trên bảng `exercises` qua migration tương thích ngược `20261111170115_AddAdministrativeApprovalFields`:

1. **Phê duyệt quản trị (`AdministrativeApprovalStatus`, mặc định `"NONE"`):**
   - Biểu thị quyết định quản trị của chủ dự án đối với tập câu hỏi hợp lệ trong phạm vi HSK 1–4.
   - Kèm siêu dữ liệu kiểm toán: `AdministrativeApprovalScope`, `AdministrativeApprovalSource`, `AdministrativeApprovalNotes`, `AdministrativeApprovedAt`.
   - Hoàn toàn **không** đủ điều kiện để gọi `POST /api/v1/question-bank/{id}/publish` (vẫn bị chặn với `400 Bad Request` nếu `ReviewStatus != "APPROVED"`).
2. **Kiểm duyệt học thuật (`ReviewStatus` và `HumanAcademicReviewStatus`, mặc định `"NOT_REVIEWED"`):**
   - `ReviewStatus` (`PENDING_REVIEW`, `VALIDATED`, `NEEDS_ACADEMIC_REVIEW`, `APPROVED`, `REJECTED`) được **giữ nguyên 100%** như trước khi cập nhật.
   - `HumanAcademicReviewStatus` được đặt `"PENDING_HUMAN_REVIEW"` cho toàn bộ **4.663** câu hỏi chưa xuất bản mới được phê duyệt quản trị, và `"APPROVED_BASELINE"` cho riêng **337** câu hỏi gốc đã xuất bản trước đó.
   - **Số câu được xác nhận học thuật mới (`Human Sign-Off`):** **`0`**.
3. **Trạng thái xuất bản (`Status`):**
   - `PUBLISHED`: giữ nguyên **337** câu gốc (học viên chỉ truy cập được `Status == "PUBLISHED"`).
   - `DRAFT`: toàn bộ **4.663** câu mới phê duyệt quản trị vẫn giữ `Status = "DRAFT"` và bị cô lập khỏi Practice Center / bài học của học viên.

---

## 2. Cơ chế Schema, Migration & API đã triển khai

- **Entity & DbContext:**
  - `Backend/src/Data/Entities/Content/ExerciseEntity.cs`: bổ sung `AdministrativeApprovalStatus`, `AdministrativeApprovalScope`, `AdministrativeApprovalSource`, `AdministrativeApprovalNotes`, `AdministrativeApprovedAt`, `HumanAcademicReviewStatus`.
  - `Backend/src/Data/Persistence/ApplicationDbContext.cs`: cấu hình chiều dài chuỗi, `datetime2`, default values (`"NONE"`, `"NOT_REVIEWED"`) và chỉ mục `idx_exercises_hsk_admin_approval (HskLevel, AdministrativeApprovalStatus)`.
  - `Backend/src/Data/Persistence/Migrations/20261111170115_AddAdministrativeApprovalFields.cs`: migration EF Core bổ sung cột không phá hủy dữ liệu (`Up`) và hoàn tác sạch (`Down`), đã chạy trực tiếp lên cả `ZhongWenHub_Dev` và `ZhongWenHub_Test`.
- **Service, DTO, Controller & Frontend CMS:**
  - `Backend/src/Business/QuestionBank/DTOs/QuestionBankDtos.cs`, `IQuestionBankService.cs`, `QuestionBankService.cs`:
    - Mở rộng `QuestionBankItemDto` & `QuestionBankStatsDto` (`AdminApprovedCount`, `AdminUnapprovedCount`, `AdminApprovedDraftCount`, `HumanApprovedCount`, `ByAdministrativeApprovalStatus`).
    - Bổ sung lọc `administrativeApprovalStatus` cho `GET /api/v1/question-bank`.
    - Bổ sung `POST /api/v1/question-bank/administrative-approval/bulk` (yêu cầu policy `ContentManagementAccess`, mặc định `DryRun = true`, giới hạn HSK 1–4, không thay đổi `Status`, `ReviewStatus`, hay nội dung câu hỏi).
  - `Fontend/src/management/admin/content/{types/admin-content.types.ts,services/question-bank.service.ts,pages/AdminExerciseBankPage.tsx,components/AdminExerciseDetailDrawer.tsx}`: hiển thị nhãn tách bạch `"Duyệt QT · Chưa GV duyệt"` vs `"Quản trị + GV duyệt"` và bộ lọc `"Lọc phê duyệt quản trị"`.
- **Script thực thi có Transaction, Dry-Run, Snapshot, Verify & Rollback:**
  - `scripts/bulk_administrative_approval.py`: hỗ trợ `--dry-run`, `--apply`, `--verify --snapshot ...`, `--rollback <snapshot_json>`.

---

## 3. Thống kê số lượng câu hỏi trước khi cập nhật (Dev & Test SQL Server)

Kiểm toán trực tiếp trước khi chạy cập nhật trên cả `ZhongWenHub_Dev` và `ZhongWenHub_Test`:

| Chỉ số HSK 1–4 | `ZhongWenHub_Dev` | `ZhongWenHub_Test` |
| --- | ---: | ---: |
| Tổng câu hỏi HSK 1–4 hiệu lực (`Status <> 'ARCHIVED'`, `ReviewStatus <> 'REJECTED'`) | **5.000** | **5.000** |
| — HSK 1 | 500 | 500 |
| — HSK 2 | 900 | 900 |
| — HSK 3 | 1.500 | 1.500 |
| — HSK 4 | 2.100 | 2.100 |
| Đã `PUBLISHED` & `APPROVED` gốc | **337** (62 / 75 / 100 / 100) | **337** (62 / 75 / 100 / 100) |
| Chưa xuất bản (`Status = 'DRAFT'`, `ReviewStatus <> 'REJECTED'`) | **4.663** | **4.663** |
| — `VALIDATED` | 320 (80 × 4 cấp) | 320 (80 × 4 cấp) |
| — `NEEDS_ACADEMIC_REVIEW` (HSK 4) | 231 | 231 |
| — `PENDING_REVIEW` | 4.112 | 4.112 |
| Câu `REJECTED` (ngoài 5.000 câu hiệu lực) | **19** | **19** |
| Tổng `AdministrativeApprovalStatus = 'APPROVED'` | **0** | **0** |

---

## 4. Thống kê số lượng câu hỏi sau khi cập nhật (Dev & Test SQL Server)

Kết quả truy vấn trực tiếp và kiểm chứng bằng `python scripts/bulk_administrative_approval.py --all-dbs --verify`:

| Chỉ số hậu kiểm | `ZhongWenHub_Dev` | `ZhongWenHub_Test` | Kỳ vọng bắt buộc |
| --- | ---: | ---: | ---: |
| Câu hỏi HSK 1–4 hiệu lực | **5.000** (`500 / 900 / 1.500 / 2.100`) | **5.000** (`500 / 900 / 1.500 / 2.100`) | 5.000 |
| `AdministrativeApprovalStatus = 'APPROVED'` | **5.000** | **5.000** | 5.000 |
| — `DRAFT` mới phê duyệt quản trị (`BULK_HSK14_PROJECT_OWNER_ADMIN_APPROVAL`) | **4.663** | **4.663** | 4.663 |
| — `PUBLISHED` baseline gốc (`ORIGINAL_PUBLISHED_BASELINE`) | **337** | **337** | 337 |
| HSK 1–4 chưa phê duyệt quản trị | **0** | **0** | 0 |
| `Status = 'PUBLISHED'` | **337** | **337** | 337 (`0` xuất bản mới) |
| `HumanAcademicReviewStatus = 'PENDING_HUMAN_REVIEW'` | **4.663** | **4.663** | 4.663 (`0` human sign-off mới) |
| `ReviewStatus` (`APPROVED`/`VALIDATED`/`NEEDS_ACADEMIC_REVIEW`/`PENDING_REVIEW`) | `337 / 320 / 231 / 4.112` | `337 / 320 / 231 / 4.112` | 0 thay đổi |
| Câu `REJECTED` giữ nguyên (`AdministrativeApprovalStatus = 'NONE'`) | **19** (`0` bị chạm) | **19** (`0` bị chạm) | 19 |
| HSK 5–6 & `ARCHIVED` bị chạm | **0** | **0** | 0 |
| Sai lệch `ContentHash` / `Status` / `ReviewStatus` / `Reviewed*` so với snapshot | **0** / 5.129 dòng | **0** / 5.309 dòng | 0 |

---

## 5. Xác nhận 0 câu hỏi mới được xuất bản (`PUBLISHED`)

- Trên cả `ZhongWenHub_Dev` và `ZhongWenHub_Test`, tổng số câu hỏi `Status = 'PUBLISHED'` vẫn là **337** (`0` câu hỏi mới chuyển sang `PUBLISHED`).
- Toàn bộ **4.663** câu hỏi mới được phê duyệt quản trị đều có `Status = 'DRAFT'`.
- Integration test `BulkAdministrativeApproval_PreservesDraftAndHumanReviewState_AndBlocksPublishAndStudentAccess` xác nhận:
  1. Gọi `POST /api/v1/question-bank/{id}/publish` đối với câu hỏi đã `AdministrativeApprovalStatus = "APPROVED"` nhưng `ReviewStatus != "APPROVED"` vẫn bị từ chối với **`400 Bad Request`**.
  2. Endpoint học viên `GET /api/v1/question-bank/recommendations` chỉ trả về `TotalPublishedQuestions == 337`, không lộ câu `DRAFT`.

---

## 6. Xác nhận 0 câu hỏi mới được đánh dấu đã kiểm duyệt học thuật bởi con người

- Cột `ReviewStatus` của toàn bộ **4.663** câu giữ nguyên nguyên trạng trước cập nhật (`320 VALIDATED`, `231 NEEDS_ACADEMIC_REVIEW`, `4.112 PENDING_REVIEW`).
- Cột `ReviewedByUserId`, `ReviewedAt`, `ReviewNotes` giữ nguyên `0` khác biệt so với snapshot SHA-256 trước cập nhật.
- Cột `HumanAcademicReviewStatus` của **4.663** câu được ghi nhận là `"PENDING_HUMAN_REVIEW"` (chưa giảng viên tiếng Trung kiểm duyệt). Không có tên giảng viên giả định hoặc human sign-off mới nào được tạo ra.

---

## 7. Xác nhận 19 câu `REJECTED` được giữ nguyên hoàn toàn

- Cả trên `ZhongWenHub_Dev` và `ZhongWenHub_Test`, truy vấn hậu kiểm xác nhận:
  - `rejected_total = 19`
  - `rejected_touched = 0` (`AdministrativeApprovalStatus = 'NONE'`, `Status = 'DRAFT'`, `ReviewStatus = 'REJECTED'`).

---

## 8. Cơ chế Rollback & Bằng chứng kiểm thử Rollback

- **Snapshot trước cập nhật (lưu ngoài git trong thư mục artifact scratch với SHA-256):**
  - `pre_admin_approval_backup_dev.json` (5.129 dòng HSK 1–4, SHA-256: `283ba9268b6514b4c1f174c97e71d3986afffc22ab665c87f54eecfd5b54880b`)
  - `pre_admin_approval_backup_test.json` (5.309 dòng HSK 1–4, SHA-256: `2c2cb54218f82cc738941bd0510f40f2c6494b822013fc6142d0d3d20f3b324d`)
- **Kiểm thử Rollback thực tế trên `ZhongWenHub_Test`:**
  1. Chạy `python scripts/bulk_administrative_approval.py --db ZhongWenHub_Test --rollback admin_approval_snapshot_zhongwenhub_test.json` -> hoàn tác **5.309** dòng về nguyên trạng `admin_approved = 0`, `admin_unapproved = 5000`, `pending_human = 0`, `baseline_human = 0`, `rejected_total = 19`.
  2. Chạy lại `--apply` -> khôi phục **4.663** câu `DRAFT` + **337** câu baseline = **5.000** `admin_approved`, `0` lỗi, `0` sai lệch snapshot.
- Ngoài ra, schema có thể rollback hoàn toàn qua `dotnet ef database update 20261111152940_AddQuestionBankArchitecture` (gọi `Down()` của migration `20261111170115_AddAdministrativeApprovalFields`).

---

## 9. Kết quả toàn bộ Tests & CI Checks

- **Backend Solution (`dotnet test Backend/ZhongWenHub.sln --nologo`):**
  - `ZhongWenHub.UnitTests`: **101 / 101 PASS** (`0` failed, `0` skipped), bao gồm test mới `AdministrativeApproval_StatusNormalization_PreservesSeparationFromAcademicReview`.
  - `ZhongWenHub.IntegrationTests` (chạy trực tiếp với `ZhongWenHub_Test` trên `.\SQLEXPRESS`): **92 / 92 PASS** (`0` failed, `0` skipped), bao gồm test end-to-end mới `BulkAdministrativeApproval_PreservesDraftAndHumanReviewState_AndBlocksPublishAndStudentAccess`.
- **Frontend (`Fontend/`):**
  - `bun run build`: **PASS** (`tsc -b && vite build`, 2.428 modules, 0 errors).
  - `bun run lint`: **PASS** (`oxlint`, 0 errors).
  - `bun test src/tests`: **306 / 306 PASS** (`0` fail, `4.369` expect() calls across `35` files), bao gồm test mới `Administrative approval metadata remains distinct from human academic review`.
- **SQL Verification (`scripts/bulk_administrative_approval.py --all-dbs --verify`):**
  - `ZhongWenHub_Dev`: `5.129` dòng kiểm tra, `0` immutable diffs, **PASS**.
  - `ZhongWenHub_Test`: `5.309` dòng kiểm tra, `0` immutable diffs, **PASS**.
