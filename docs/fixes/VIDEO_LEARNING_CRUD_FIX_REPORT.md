# BÁO CÁO HOÀN THÀNH SỬA LỖI VIDEO LEARNING CRUD & TỐI GIẢN HÓA QUẢN LÝ VIDEO (ZHONGWENHUB)

**Mã tài liệu:** `VIDEO_LEARNING_CRUD_FIX_REPORT.md`  
**Nhánh:** `feature/ai-personalization-phase5`  
**Ngày hoàn thành:** 18/11/2026  
**Phạm vi:** Sửa hoàn chỉnh chức năng CRUD Học qua video, tối giản giao diện còn 3 trường, tích hợp tài liệu PDF transcript, loại bỏ mock service trong production.

---

## 1. NGUYÊN NHÂN LỖI CRUD KHÔNG HOẠT ĐỘNG BAN ĐẦU

1. **Frontend gọi hàm mock in-memory thay vì API thật**:
   - `VideoEditorModal.tsx` gọi `videoManagementService.createVideo()` và `videoManagementService.updateVideo()`. Đây là các phương thức fixture đồng bộ chỉ thêm/sửa trong mảng RAM `syncVideos`, không hề gửi request HTTP đến máy chủ.
   - `VideoManagementPage.tsx` gọi `videoManagementService.deleteVideo()`, chỉ xóa trên mảng RAM.
   - Bảng danh sách lại tải từ Backend (`GET /api/v1/videos/manage`), khiến mọi thao tác Thêm/Sửa/Xóa của người dùng bị biến mất ngay khi làm mới trang hoặc chuyển trang.
2. **Backend thiếu endpoint upload PDF và mapping dữ liệu PDF**:
   - DTO Backend `CreateLearningVideoDto`, `UpdateLearningVideoDto` và `LearningVideoDto` chưa khai báo các trường `TranscriptPdfPath`, `TranscriptPdfName`, `TranscriptPdfSizeBytes` (dù entity `LearningVideo` đã có các cột này).
   - `VideosController.cs` chưa có endpoint `POST manage/upload-transcript-pdf`.
   - `MapToDto` trong `LearningVideoService.cs` không ánh xạ trả về thông tin PDF cho client.
3. **Thiếu cơ chế Cleanup Outbox cho PDF**:
   - Khi xóa video hoặc thay file PDF mới, chưa có công việc dọn dẹp (`VideoStorageCleanupJob`) ghi nhận tệp PDF cũ, dẫn đến nguy cơ tệp mồ côi (orphan files) trong Storage.
4. **Trang học viên phụ thuộc dữ liệu tĩnh**:
   - `VideoDetailPage.tsx` gắn cứng dữ liệu với `DEMO_VIDEOS` thay vì tải từ API thật `fetchVideoById(videoId)` và chưa có thành phần hiển thị PDF transcript.

---

## 2. THIẾT KẾ DỮ LIỆU TỐI GIẢN (3 THÔNG TIN DUY NHẤT)

Người quản lý chỉ cần cung cấp đúng **3 thông tin**:
1. **`videoUrl`**: Đường dẫn video YouTube (hỗ trợ `youtube.com/watch?v=...`, `youtu.be/...`, `youtube.com/shorts/...` hoặc 11 ký tự Video ID).
2. **`hskLevel`**: Cấp độ HSK từ 1 đến 6.
3. **`transcriptPdf`**: Tệp tài liệu PDF chứa lời thoại / bài đọc.

### Xử lý tự động ngầm tại hệ thống:
* **`Title`**: Tự động sinh nhất quán: `HSK {hskLevel} - Bài học Video ({youtubeVideoId})` (ở chế độ sửa: bảo lưu tiêu đề hiện hữu).
* **`Description`**: Tự động sinh: `Bài học video tiếng Trung HSK {hskLevel} kèm tài liệu PDF transcript.`
* **`SourceType`**: Cố định là `YouTube`.
* **`YouTubeVideoId`**: Trích xuất an toàn 11 ký tự chuẩn bằng Regex `YouTubeUrlParser`.
* **`ThumbnailUrl`**: Tự động sinh chất lượng cao: `https://img.youtube.com/vi/{youtubeVideoId}/hqdefault.jpg`.
* **`Topic`**: Mặc định `Luyện nghe HSK`.
* **`Status`**: Mặc định `Published`.
* **`DurationSeconds`**: Đặt mặc định `180` giây (hoặc giữ nguyên khi sửa).
* **`TranscriptPdfPath` / `TranscriptPdfName` / `TranscriptPdfSizeBytes`**: Lưu metadata và storage path của tệp PDF sau khi upload.

---

## 3. CÁC API VÀ LOGIC BACKEND ĐƯỢC HOÀN THIỆN

1. **`VideosController.cs`**:
   - Bổ sung endpoint có bảo vệ phân quyền:
     ```csharp
     [HttpPost("manage/upload-transcript-pdf")]
     [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
     [Consumes("multipart/form-data")]
     [RequestSizeLimit(20971520)] // Tối đa 20 MB
     ```
   - Tái sử dụng `_storageService.UploadPdfAsync` (xác thực chữ ký magic bytes `%PDF-`, MIME type `application/pdf`, dung lượng tối đa).
   - Đăng ký tài sản sở hữu qua `_uploadAssetService.RegisterUploadAsync(..., assetType: "PdfTranscript")`.
2. **`LearningVideoDtos.cs`**:
   - Cập nhật `CreateLearningVideoDto`, `UpdateLearningVideoDto` nhận `TranscriptPdfPath`, `TranscriptPdfName`, `TranscriptPdfSizeBytes`, `TranscriptUploadId`, `ClearTranscriptPdf`.
   - Cập nhật `LearningVideoDto` trả về `TranscriptPdfPath`, `TranscriptPdfName`, `TranscriptPdfSizeBytes` và `TranscriptPdfUrl`.
3. **`LearningVideoService.cs`**:
   - Xử lý Transactional Outbox: Đăng ký `VideoStorageCleanupJob` với `Reason = "VideoTranscriptPdfDeleted"` khi xóa video và `Reason = "TranscriptPdfReplaced"` khi thay tệp PDF mới.
   - Hỗ trợ giữ nguyên PDF cũ khi sửa URL hoặc HSK mà không cần tải lại file.
   - Ánh xạ `TranscriptPdfUrl` công khai qua `_storageService.GetPublicUrl(v.TranscriptPdfPath)`.

---

## 4. GIAO DIỆN ĐÃ TRIỂN KHAI THEO PHƯƠNG ÁN ĐƯỢC DUYỆT

1. **`VideoManagementPage.tsx`**:
   - Đồng bộ danh sách từ API thật `fetchVideos()`.
   - Thêm cột **Tài liệu PDF Transcript** hiển thị tên tệp, biểu tượng PDF và liên kết tải/xem nhanh.
   - Thao tác **Xóa** gọi trực tiếp `deleteVideoApi(id)`, xóa an toàn khỏi database SQL Server và làm mới danh sách.
   - Thao tác **Sửa** và **Thêm mới** liên kết với modal 3 trường, tự động đồng bộ sau khi lưu.
2. **`VideoEditorModal.tsx`**:
   - Giao diện Evondev Clean UI tinh giản chỉ 3 trường:
     1. Đường dẫn video YouTube (live validation trích xuất ID + xem trước thumbnail 16:9).
     2. Cấp độ HSK 1–6 (chọn 1 chạm).
     3. Tệp PDF transcript (kéo thả, kiểm tra đuôi `.pdf`, tối đa 20MB, thanh tiến trình tải lên; chế độ sửa hiển thị tệp PDF hiện hữu và cho phép thay tệp mới).
   - Gửi dữ liệu qua `createVideoApi` và `updateVideoApi` thật.
3. **`VideoDetailPage.tsx`**:
   - Bỏ phụ thuộc `DEMO_VIDEOS` trong luồng chính, tải dữ liệu thực theo `videoId` qua `videoLearningService.fetchVideoById(videoId)`.
   - Bố cục 2 cột chia đôi màn hình: Cột trái phát YouTube iframe responsive 16:9 kèm nút mở xem gốc; Cột phải nhúng khung xem tài liệu PDF Transcript kèm nút tải về máy.
   - Hỗ trợ responsive chuyển tab trên thiết bị di động.

---

## 5. KẾT QUẢ KIỂM THỬ

* **Backend Build**: Thành công 100% (`0 Error(s)`).
* **Backend Unit Tests**:
  - `LearningVideoServiceTests`: **67/67 tests PASSED**.
  - Bao gồm các test xác thực YouTube URL, phân cấp HSK, PDF transcript metadata, cleanup job và format duration.
* **Frontend Lint**:
  - `bun run lint`: **0 errors**.
* **Frontend Unit & Integration Tests**:
  - `bun test src/tests`: **388/388 tests PASSED**.
  - `video-management-phase2.test.ts`: **12/12 tests PASSED** (bao gồm test hợp đồng API `uploadTranscriptPdfFile`, `createVideoApi`, `updateStatus`, `deleteVideoApi`, YouTube Parser).
  - `video-library-integration.test.ts`: **7/7 tests PASSED**.
* **Frontend Production Build**:
  - `tsc -b && vite build`: **Thành công 100%**.

---

## 6. VẤN ĐỀ CÒN TỒN TẠI

* Các video tạo trước đây nếu chưa được gán tệp PDF sẽ hiển thị trạng thái *"Chưa có PDF"* trên trang học và trang quản trị; quản trị viên chỉ cần bấm nút **Sửa** và đính kèm tệp PDF để hoàn thiện.
* Giữ nguyên cơ chế Zero-Write đối với database chính; không có migration nào bị tự ý thực thi trái phép.
