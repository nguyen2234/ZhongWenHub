# BÁO CÁO KỸ THUẬT: WAVE 1 P1 FIX – STORAGE CLEANUP SAFETY & PDF OWNERSHIP

**Dự án:** ZhongWenHub  
**Branch:** `fix/video-storage-security-wave1`  
**Ngày thực hiện:** 19/11/2026  
**Phạm vi:** Wave 1 (2 lỗi mức P1 từ Codebase Audit)  
**Tình trạng:** Hoàn tất, toàn bộ test passed, sẵn sàng cho ChatGPT review độc lập  

---

## 1. TỔNG QUAN CÁC LỖI ĐƯỢC KHẮC PHỤC (P1)

### Lỗi 1 (Finding 1): StorageCleanupService thiếu đối chiếu `TranscriptPdfPath` khi bảo vệ file đang được tham chiếu
- **Vị trí cũ:** `Backend/src/Business/Content/Services/Storage/StorageCleanupService.cs` (Dòng 172-178).
- **Nguyên nhân gốc:** Worker dọn dẹp bộ nhớ định kỳ chỉ kiểm tra `LearningVideo.StoragePath == job.StoragePath`. Đối với tệp tài liệu PDF phụ đề/lời thoại (`TranscriptPdfPath`), hệ thống hoàn toàn bỏ qua việc kiểm tra chéo. Nếu một file PDF được gán cho nhiều video hoặc một video được cập nhật/xóa, file PDF vật lý trên ổ đĩa/Supabase sẽ bị xóa nhầm dù các bài học khác vẫn đang dùng nó. Ngoài ra, worker chỉ kiểm tra các asset có trạng thái `Linked`, dẫn đến race condition nếu file vừa tải lên (`Completed` và `ExpiresAt > now`) đang chờ người dùng bấm tạo/sửa video thì bị worker dọn dẹp xóa mất file vật lý.
- **Mức độ:** P1 (Nguy cơ mất mát dữ liệu thực tế / Data Loss).

### Lỗi 2 & 3 (Finding 2 & 3): PDF Transcript Ownership, Path Traversal & AssetType Validation
- **Vị trí cũ:** 
  - `Backend/src/Business/Content/Services/Storage/UploadAssetService.cs` (Dòng 58-103)
  - `Backend/src/Business/Content/LearningVideoService.cs` (Dòng 342-348 và 546-551)
- **Nguyên nhân gốc:**
  1. `UploadAssetService.ValidateAndClaimAssetAsync` không kiểm tra `expectedAssetType`. Bất kỳ người dùng nào cũng có thể truyền UploadId của video MP4 hoặc thumbnail ảnh để gán làm PDF Transcript, hoặc ngược lại.
  2. `LearningVideoService.CreateVideoAsync` và `UpdateVideoAsync` trực tiếp tin tưởng `dto.TranscriptPdfPath` do client gửi lên mà không kiểm tra định dạng an toàn (`StoragePathSecurity.IsValidStoragePath`), không kiểm tra quyền sở hữu trong bảng `VideoUploadAssets`. Kẻ xấu có thể gửi chuỗi `../../etc/passwd` (path traversal) hoặc điền đường dẫn PDF bảo mật của người khác để chiếm quyền sử dụng tài nguyên.
  3. Khi cập nhật video chỉ để đổi tên/HSK, nếu hệ thống ép buộc phải gửi upload ID mới sẽ làm mất PDF cũ của các bài học hiện hành.
- **Mức độ:** P1 (IDOR, Path Traversal, Unvalidated Asset Claim).

---

## 2. CHI TIẾT GIẢI PHÁP KỸ THUẬT ĐÃ TRIỂN KHAI

### 2.1. Cập nhật `IUploadAssetService` & `UploadAssetService`
- Thêm tham số tùy chọn `string? expectedAssetType = null` vào phương thức:
  ```csharp
  Task<VideoUploadAsset> ValidateAndClaimAssetAsync(
      Guid uploadId,
      string userId,
      bool isAdmin,
      Guid videoId,
      string? expectedAssetType = null,
      CancellationToken cancellationToken = default);
  ```
- Kiểm tra nghiêm ngặt `AssetType`: Nếu `expectedAssetType` được chỉ định và không khớp với `asset.AssetType` (không phân biệt hoa thường), ném `InvalidOperationException($"Loại tệp không khớp. Yêu cầu: {expectedAssetType}, thực tế: {asset.AssetType}.")`.
- Bổ sung xác thực an toàn đường dẫn cơ bản chống path traversal (`..` và `\`) đối với asset lưu trữ.
- Đảm bảo thứ tự kiểm tra logic: Kiểm tra tồn tại -> Hết hạn (`ExpiresAt`) -> Quyền sở hữu (`UploadedByUserId == userId || isAdmin`) -> Loại tệp (`AssetType`) -> Path Security -> Trạng thái liên kết -> Cập nhật trạng thái `Linked` nguyên tử.

### 2.2. Khắc phục `StorageCleanupService` (Bảo vệ dữ liệu toàn diện)
- Bổ sung kiểm tra cả 2 trường đường dẫn trong `LearningVideos`:
  ```csharp
  var isReferencedInVideos = await _context.LearningVideos
      .AnyAsync(v => v.StoragePath == job.StoragePath || v.TranscriptPdfPath == job.StoragePath, cancellationToken);
  ```
- Bổ sung kiểm tra các asset đang hoạt động trong `VideoUploadAssets`:
  ```csharp
  var isReferencedInAssets = await _context.VideoUploadAssets
      .AnyAsync(a => a.StoragePath == job.StoragePath &&
                     (a.UploadStatus == VideoUploadAssetStatus.Linked ||
                     (a.UploadStatus == VideoUploadAssetStatus.Completed && a.ExpiresAt > now)),
                cancellationToken);
  ```
- Khi phát hiện tệp còn được tham chiếu: Bỏ qua việc xóa vật lý (`DeleteFileAsync`), chuyển `job.Status = VideoStorageCleanupStatus.Completed` với thông báo lý do rõ ràng trong `LastError`.
- Xử lý Idempotency & Provider Resilience:
  - Nếu `DeleteFileAsync` trả về `false`, gọi `FileExistsAsync(job.StoragePath)`: Nếu tệp thực tế đã không còn tồn tại trên storage provider, đánh dấu hoàn thành `Completed` thay vì retry thất bại 5 lần.
  - Nếu tệp vẫn tồn tại nhưng xóa lỗi: Tăng `RetryCount`, kích hoạt exponential backoff và chuyển sang `Failed` nếu chạm ngưỡng 5 lần.

### 2.3. Khắc phục `LearningVideoService` (Quyền sở hữu & Tương thích ngược)
- **Khi tạo video (`CreateVideoAsync`):**
  - Claim video asset với `expectedAssetType: "Video"`.
  - Nếu có `dto.TranscriptUploadId`: Claim PDF asset với `expectedAssetType: "PdfTranscript"`.
  - Nếu có `dto.TranscriptPdfPath` trực tiếp:
    1. Kiểm tra an toàn tuyệt đối với `StoragePathSecurity.IsValidStoragePath(trimmedPdfPath)`.
    2. Đối chiếu trong `VideoUploadAssets`: Nếu tìm thấy asset tương ứng, xác minh quyền sở hữu thông qua `ValidateAndClaimAssetAsync(..., expectedAssetType: "PdfTranscript")`.
    3. Nếu không tìm thấy asset trong hệ thống và người dùng không phải Quản trị viên (`!isAdmin`), ném `UnauthorizedAccessException`.
- **Khi cập nhật video (`UpdateVideoAsync`):**
  - Nếu `dto.ClearTranscriptPdf == true`: Xóa liên kết PDF.
  - Nếu `dto.TranscriptUploadId.HasValue`: Claim PDF mới với `expectedAssetType: "PdfTranscript"`.
  - Nếu `dto.TranscriptPdfPath` được gửi lên:
    - Nếu trùng với `oldPdfPath`: Cho phép giữ nguyên an toàn (hỗ trợ thao tác sửa URL hoặc HSK mà không cần upload lại file).
    - Nếu khác `oldPdfPath`: Bắt buộc kiểm tra `StoragePathSecurity.IsValidStoragePath`, xác minh quyền sở hữu thông qua `VideoUploadAssets` hoặc quyền Admin.
  - Khi thay thế `oldPdfPath` hoặc `oldStoragePath`: Tự động tìm các upload asset cũ liên kết với video đó và chuyển trạng thái sang `Deleted`, đồng thời ghi outbox cleanup job.

---

## 3. DANH SÁCH REGRESSION TESTS ĐÃ BỔ SUNG

Tại `Backend/tests/ZhongWenHub.UnitTests/VideoStorageDataIntegrityTests.cs`:

1. `UploadAssetService_ValidateAndClaim_MismatchedAssetType_ThrowsInvalidOperationException`: Xác minh ném lỗi khi cố tình claim asset `"Video"` thành `"PdfTranscript"`.
2. `UploadAssetService_ValidateAndClaim_PathTraversal_ThrowsArgumentException`: Xác minh từ chối asset có chứa path traversal.
3. `StorageCleanupService_ProcessPendingCleanups_TranscriptPdfReferencedByVideo_SkipsPhysicalDelete`: Xác minh PDF đang được video sử dụng KHÔNG bị xóa vật lý.
4. `StorageCleanupService_ProcessPendingCleanups_TranscriptPdfSharedByTwoVideos_SkipsPhysicalDelete`: Xác minh PDF dùng chung giữa 2 video KHÔNG bị xóa khi 1 video dọn dẹp.
5. `StorageCleanupService_ProcessPendingCleanups_TranscriptPdfUnreferenced_DeletesPhysicalFile`: Xác minh PDF mồ côi (không còn ai tham chiếu) được xóa vật lý và hoàn thành job.
6. `StorageCleanupService_ProcessPendingCleanups_ActiveUnlinkedUploadAsset_SkipsPhysicalDelete`: Xác minh asset mới upload chưa kịp link (`ExpiresAt > now`) không bị worker xóa sớm.
7. `StorageCleanupService_ProcessPendingCleanups_DeleteReturnsFalse_FileAlreadyGone_MarksCompletedWithoutRetry`: Xác minh tính lũy thừa (idempotency) khi file đã bị xóa từ trước.
8. `LearningVideoService_CreateVideo_WithTranscriptUploadId_MismatchedAssetType_ThrowsInvalidOperationException`: Xác minh tạo video thất bại nếu truyền upload ID sai loại tệp.
9. `LearningVideoService_CreateVideo_WithDirectTranscriptPdfPath_MaliciousTraversal_ThrowsArgumentException`: Xác minh chặn đường dẫn độc hại `../../secret.pdf`.
10. `LearningVideoService_CreateVideo_WithDirectTranscriptPdfPath_OwnedByOtherUser_ThrowsUnauthorizedAccessException`: Xác minh giáo viên B không thể chiếm đường dẫn PDF do giáo viên A upload.
11. `LearningVideoService_UpdateVideo_RetainingExistingTranscriptPdfPath_SucceedsWithoutUploadId`: Xác minh cập nhật video giữ nguyên PDF cũ thành công mà không cần upload lại.
12. `LearningVideoService_UpdateVideo_WithDirectTranscriptPdfPath_MaliciousTraversal_ThrowsArgumentException`: Xác minh chặn path traversal khi cập nhật video.
13. `LearningVideoService_UpdateVideo_WithDirectTranscriptPdfPath_OwnedByOtherUser_ThrowsUnauthorizedAccessException`: Xác minh chặn chiếm quyền PDF của người khác khi cập nhật video.
14. `LearningVideoService_UpdateVideo_ReplacedTranscriptPdf_EnqueuesCleanupJobAndMarksAssetDeleted`: Xác minh thay thế PDF cũ tạo cleanup job và cập nhật trạng thái asset chuẩn xác.

---

## 4. KẾT QUẢ KIỂM THỬ VÀ XÁC NHẬN ZERO-WRITE DB

### 4.1. Backend Unit Tests
- **Lệnh chạy:** `dotnet test Backend/tests/ZhongWenHub.UnitTests/ZhongWenHub.UnitTests.csproj`
- **Exit Code:** `0`
- **Kết quả:** `Passed! - Failed: 0, Passed: 305, Skipped: 0, Total: 305`

### 4.2. Backend Integration Tests
- **Lệnh chạy:** `dotnet test Backend/tests/ZhongWenHub.IntegrationTests/ZhongWenHub.IntegrationTests.csproj`
- **Exit Code:** `0`
- **Kết quả:** `Passed! - Failed: 0, Passed: 109, Skipped: 0, Total: 109`

### 4.3. Frontend Unit Tests
- **Lệnh chạy:** `cd Fontend && bun test src/tests`
- **Exit Code:** `0`
- **Kết quả:** `389 pass, 0 fail, 4766 expect() calls across 50 files`

### 4.4. Backend Build Solution
- **Lệnh chạy:** `dotnet build Backend/ZhongWenHub.sln`
- **Exit Code:** `0`
- **Kết quả:** `Build succeeded. 0 Error(s)`

### 4.5. Xác nhận Zero-Write Database
- Không có bất kỳ lệnh migration nào được tạo hay áp dụng lên cơ sở dữ liệu `ZhongWenHub_Dev` hay production.
- Không sửa đổi schema hay can thiệp dữ liệu vật lý của cơ sở dữ liệu.
