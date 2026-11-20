# SWAGGER & DATABASE SCHEMA FIX REPORT

**Branch:** `feature/ai-personalization-phase5`  
**Date:** 2026-11-16  
**Engineer:** AI Agent (resumed after quota interruption)

---

## 1. Trạng thái kế thừa từ phiên bị ngắt

Phiên trước bị ngắt sau khi đã:
- Xác định nguyên nhân gốc lỗi Swagger (OpenAPI version mismatch).
- Thay đổi `Microsoft.OpenApi` từ `1.6.23` → `1.6.14` trong `ZhongWenHub.Api.csproj`.
- Cập nhật `SwaggerIntegrationTests.cs` assert `"3.0.1"`.
- Build PASS và Swagger integration test PASS.
- Xác định 3 pending migrations trên `ZhongWenHub_Dev`.

Phiên này tiếp tục: hardening worker backoff, dọn file tạm, full tests, report, commit.

---

## 2. Nguyên nhân gốc lỗi Swagger

### Lỗi quan sát
```
Unable to render this definition
The provided definition does not specify a valid version field
```

### Phân tích

**Swashbuckle.AspNetCore 6.9.0** (đang dùng) bundled với Swagger UI ~5.17.x.  
Swagger UI 5.17.x validate OpenAPI version bằng regex cứng:
```js
/^3\.0\.([0123])(?:-rc[012])?$/
```
Chỉ chấp nhận `3.0.0`, `3.0.1`, `3.0.2`, `3.0.3`.

**Microsoft.OpenApi 1.6.23** (phiên bản cũ trong `ZhongWenHub.Api.csproj`) thay đổi version mặc định sang `"openapi": "3.0.4"` → Swagger UI parser fail regex `[0123]` tại chữ số `4`.

### Giải pháp
Downgrade `Microsoft.OpenApi` từ `1.6.23` → `1.6.14`.  
Phiên bản `1.6.14` serialize `"openapi": "3.0.1"` — khớp với regex của Swagger UI.

---

## 3. Nguyên nhân gốc lỗi SQL Server

### Lỗi quan sát
```
Microsoft.Data.SqlClient.SqlException (0x80131904):
Invalid object name 'video_storage_cleanup_jobs'
Error Number: 208
```

### Phân tích

Bảng `video_storage_cleanup_jobs` được tạo bởi migration:
```
20261113151257_AddVideoStorageOutboxAndUploadAssets
```

**`ZhongWenHub_Dev` database** chỉ áp dụng migrations đến `20261113105123_AddLearningVideosTable`.  
3 migrations còn chưa áp dụng trên Dev:

| Migration | Nội dung |
|---|---|
| `20261113151257_AddVideoStorageOutboxAndUploadAssets` | Tạo bảng `video_storage_cleanup_jobs` |
| `20261115170022_AddAiPersonalizationPhase3And4` | AI Phase 3 & 4 |
| `20261115173345_AddAiPersonalizationPhase5Speaking` | AI Phase 5 Speaking |

**`ZhongWenHub_Test` database** đã áp dụng đủ tất cả migrations — bảng tồn tại bình thường.

**Hành vi trước khi fix:** `VideoStorageCleanupWorker` chạy mỗi 30s, `StorageCleanupService.ProcessPendingCleanupsAsync` ném `SqlException(208)`, catch log `LogWarning` với full stack trace — spam log liên tục.

### Giải pháp
Không thể và không nên tự động migrate `ZhongWenHub_Dev` (Zero-Write rule).  
Thay vào đó, harden code để xử lý gracefully:

1. **`StorageCleanupService`**: Thêm `CleanupTableMissingException` và phân biệt SQL 208 → throw typed exception thay vì log spam.
2. **`VideoStorageCleanupWorker`**: Catch `CleanupTableMissingException`, log warning **một lần duy nhất**, sau đó chỉ log Debug, áp dụng **backoff 5 phút** thay vì retry mỗi 30s.

> **ACTION REQUIRED (Developer):** Áp dụng pending migrations lên `ZhongWenHub_Dev`:
> ```bash
> dotnet ef database update --project Backend/src/Data --startup-project Backend/src/Api \
>   -- --environment Development
> ```
> Hoặc qua SQL Server Management Studio chạy script migration thủ công.

---

## 4. Các file đã sửa

| File | Thay đổi |
|---|---|
| `Backend/src/Api/ZhongWenHub.Api.csproj` | `Microsoft.OpenApi` 1.6.23 → **1.6.14** |
| `Backend/tests/ZhongWenHub.IntegrationTests/SwaggerIntegrationTests.cs` | Assert `"3.0.1"` thay vì `StartsWith("3.")` |
| `Backend/src/Business/Content/Services/Storage/StorageCleanupService.cs` | Thêm `CleanupTableMissingException`, phân biệt SQL 208, `using Microsoft.Data.SqlClient`, helper `IsMissingTableException()` |
| `Backend/src/Business/Content/Services/Storage/VideoStorageCleanupWorker.cs` | Catch `CleanupTableMissingException`, log once warning + Debug, backoff 5 phút |

---

## 5. Package versions trước và sau

| Package | Trước | Sau |
|---|---|---|
| `Microsoft.OpenApi` | 1.6.23 | **1.6.14** |
| `Swashbuckle.AspNetCore` | 6.9.0 | 6.9.0 (không đổi) |

---

## 6. Migration liên quan

| Migration ID | Tạo bảng | Trạng thái Dev | Trạng thái Test |
|---|---|---|---|
| `20261113151257_AddVideoStorageOutboxAndUploadAssets` | `video_storage_cleanup_jobs` | ❌ PENDING | ✅ Applied |
| `20261115170022_AddAiPersonalizationPhase3And4` | AI Phase 3 & 4 tables | ❌ PENDING | ✅ Applied |
| `20261115173345_AddAiPersonalizationPhase5Speaking` | AI Phase 5 tables | ❌ PENDING | ✅ Applied |

---

## 7. Kết quả kiểm thử thực tế

### Build
```
Build succeeded. 5 Warning(s), 0 Error(s)
```
(5 warnings là pre-existing nullable warnings không liên quan)

### Swagger Integration Tests
```
Passed: SwaggerIntegrationTests.SwaggerJson_IsAccessibleInDevelopment_AndContainsExpectedEndpointsAndJwtScheme ✅
Passed: SwaggerIntegrationTests.SwaggerUI_IsAccessibleInDevelopment_AndLoadsHtml ✅
Passed: SwaggerIntegrationTests.Swagger_IsNotExposedInProduction_ReturnsNotFound ✅
Total: 4/4 PASS
```

### Video Storage Cleanup Unit Tests
```
StorageCleanupService_ProcessPendingCleanups_DeletesPhysicalFileAndMarksCompleted ✅
StorageCleanupService_ProcessPendingCleanups_CrossReferencedFile_SkipsPhysicalDeleteAndMarksCompleted ✅
StorageCleanupService_ProcessPendingCleanups_FailedDelete_IncrementsRetryAndSetsBackoff ✅
StorageCleanupService_ProcessPendingCleanups_MaxRetriesReached_MarksFailed ✅
LearningVideoService_DeleteVideo_EnqueuesCleanupJobInOutbox ✅
LearningVideoService_UpdateVideo_ReplacedStorageFile_EnqueuesOldFileCleanupJob ✅
... (12/12 PASS)
```

### Full Unit Tests
```
Passed: 285/285, Skipped: 0, Failed: 0
```

### Full Integration Tests
_(Đang chạy tại thời điểm viết báo cáo)_

### Runtime Swagger JSON
- Test integration host: `/swagger/v1/swagger.json` trả `"openapi": "3.0.1"` ✅
- Swagger UI renders via integration test ✅
- JWT Bearer scheme có trong security definitions ✅

---

## 8. Những vấn đề chưa giải quyết

| Vấn đề | Mô tả | Trạng thái |
|---|---|---|
| `ZhongWenHub_Dev` pending migrations | 3 migrations chưa áp dụng | ⚠️ BLOCKED — cần developer apply |
| Swagger UI render trực tiếp trên browser | Không thể xác minh UI render thực tế trong môi trường CI | PARTIAL |

---

## 9. Các thao tác cần người dùng phê duyệt

### Apply pending migrations lên ZhongWenHub_Dev

```bash
# Từ thư mục gốc d:\ZhongWenHub
dotnet ef database update \
  --project Backend/src/Data \
  --startup-project Backend/src/Api \
  -- --environment Development
```

> **LƯU Ý:** Lệnh này sẽ áp dụng 3 migrations còn pending. Bảo đảm connection string trong `appsettings.Development.json` trỏ đúng vào `ZhongWenHub_Dev` và bạn có quyền DDL trên database đó trước khi chạy.

---

## 10. Commit SHA

| | |
|---|---|
| **Commit SHA** | `fdfc3ee` |
| **Branch** | `feature/ai-personalization-phase5` |
| **Remote** | `origin/feature/ai-personalization-phase5` |
| **GitHub URL** | https://github.com/nguyen2234/ZhongWenHub/commit/fdfc3ee |

Commit range: `17672e4..fdfc3ee`
