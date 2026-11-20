# LỘ TRÌNH KHẮC PHỤC VÀ TỐI ƯU MÃ NGUỒN (CLEAN CODE REFACTOR ROADMAP)
**Dự án:** ZhongWenHub  
**Thời gian lập kế hoạch:** 19/11/2026  
**Chiến lược thực hiện:** Chia thành 5 Waves kế tiếp nhau theo nguyên tắc an toàn, cô lập rủi ro và kiểm thử liên tục.  
*Lưu ý: Không thực hiện xóa file hoặc tái cấu trúc hàng loạt khi chưa có sự phê duyệt từng wave từ người dùng.*

---

## TỔNG QUAN 5 WAVES

```
┌────────────────────────────────────────────────────────────────────────┐
│ WAVE 1: P0 / P1 — BẢO MẬT & CHỐNG MẤT DỮ LIỆU TỆP                      │
│ - Sửa đối chiếu TranscriptPdfPath trong StorageCleanupService          │
│ - Xác minh quyền sở hữu TranscriptPdfPath trong LearningVideoService   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ WAVE 2: P2 — HOÀN THIỆN XỬ LÝ LỖI & TOÀN VẸN DỮ LIỆU                  │
│ - Bổ sung kiểm tra AssetType trong ValidateAndClaimAssetAsync          │
│ - Phân biệt lỗi 404 và Network/500 trong fetchVideoById                │
│ - Loại bỏ DEMO_VIDEOS fallback khỏi VideoDetailPage production         │
│ - Tách riêng VideoManagementMockService ra khỏi real service           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ WAVE 3: CLEAN CODE & TYPE-SAFETY                                       │
│ - Đặt durationSeconds = 0 mặc định trong VideoEditorModal               │
│ - Dọn dẹp biểu thức vô nghĩa (useless ternaries) & loại bỏ `any` casts │
│ - Thêm Per-Request Timeout cho Gemini STT HttpClient                   │
│ - Cấu hình Code-Splitting manualChunks trong vite.config.ts            │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ WAVE 4: DỌN DẸP MÃ NGUỒN VÀ TỆP MỒ CÔI (CLEANUP)                       │
│ - Lưu trữ SpeakingPracticeCard & SynchronizedTranscript vào archive    │
│ - Dọn dẹp các scripts Python one-off dump thô trong scripts/hsk30/     │
│ - Loại bỏ các tệp ảnh PNG dung lượng nặng chưa tối ưu                  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ WAVE 5: HỒI QUY TOÀN DIỆN & NGHIỆM THU CUỐI CÙNG (FINAL REVIEW)        │
│ - Chạy 100% Backend Unit Tests (67+ tests)                             │
│ - Chạy 100% Frontend Tests (388+ tests)                                │
│ - Chạy kiểm tra Playwright E2E & Production Build                      │
│ - Báo cáo tổng kết và bàn giao ChatGPT review                          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## CHI TIẾT TỪNG WAVE VÀ TIÊU CHÍ NGHIỆM THU

### WAVE 1: P0 / P1 — BẢO MẬT & CHỐNG MẤT DỮ LIỆU TỆP
*Mục tiêu: Đảm bảo dữ liệu tệp trong Cloud Storage không bao giờ bị xóa nhầm và người dùng không thể can thiệp tệp của người khác.*

1. **Khắc phục StorageCleanupService (Finding 1):**
   - **Tệp chỉnh sửa:** `Backend/src/Business/Content/Services/Storage/StorageCleanupService.cs`.
   - **Nhiệm vụ:**
     Bổ sung điều kiện kiểm tra tệp PDF còn đang được tham chiếu trong bất kỳ bài học video nào trước khi thực hiện xóa vật lý:
     ```csharp
     var isReferencedInVideos = await _context.LearningVideos
         .AnyAsync(v => v.StoragePath == job.StoragePath || v.TranscriptPdfPath == job.StoragePath, cancellationToken);
     ```
   - **Tiêu chí nghiệm thù:** Viết unit test giả lập có 2 video cùng trỏ vào 1 file PDF, khi 1 video bị xóa và worker chạy dọn dẹp, file PDF vật lý **không bị xóa** và job được đánh dấu hoàn thành an toàn.

2. **Khắc phục Xác minh quyền sở hữu PDF Transcript (Finding 2):**
   - **Tệp chỉnh sửa:** `Backend/src/Business/Content/LearningVideoService.cs`.
   - **Nhiệm vụ:**
     Khi client gửi `TranscriptPdfPath` mà không có `TranscriptUploadId`, phải tra cứu trong `VideoUploadAssets` theo đường dẫn để xác nhận người dùng hiện tại là người đã upload (`UploadedByUserId == currentUserId || isAdmin`). Nếu không tìm thấy hoặc thuộc người khác, từ chối với lỗi `403 Forbidden` / `UnauthorizedAccessException`. Đồng thời gọi `StoragePathSecurity.IsValidStoragePath` để ngăn chặn path traversal.
   - **Tiêu chí nghiệm thu:** Unit test gửi request với `TranscriptPdfPath` của user khác sẽ bị từ chối truy cập.

---

### WAVE 2: P2 — HOÀN THIỆN XỬ LÝ LỖI & TOÀN VẸN DỮ LIỆU
*Mục tiêu: Đảm bảo tính nhất quán của API và không để mã giả lập (mock) rò rỉ vào production.*

1. **Kiểm tra AssetType khi Claim Asset (Finding 3):**
   - **Tệp chỉnh sửa:**
     - `Backend/src/Business/Content/Services/Storage/IUploadAssetService.cs`
     - `Backend/src/Business/Content/Services/Storage/UploadAssetService.cs`
     - `Backend/src/Business/Content/LearningVideoService.cs`
   - **Nhiệm vụ:**
     Thêm tham số `string? expectedAssetType = null` vào `ValidateAndClaimAssetAsync`. Khi claim PDF transcript, truyền `expectedAssetType: "PdfTranscript"`. Nếu asset có kiểu `"Thumbnail"` hoặc `"Video"`, ném lỗi `InvalidOperationException("Loại tệp không khớp với yêu cầu.")`.

2. **Sửa xử lý lỗi trong `fetchVideoById` (Finding 4):**
   - **Tệp chỉnh sửa:** `Fontend/src/features/videos/services/video-learning.service.ts`.
   - **Nhiệm vụ:**
     Chỉ trả về `null` khi `response.status === 404`. Nếu `response.status >= 500` hoặc lỗi mạng (network failure), ném `Error` để component giao diện hiển thị đúng trạng thái lỗi và nút "Thử lại" (Retry).

3. **Loại bỏ `DEMO_VIDEOS` fallback trong Production (Finding 5):**
   - **Tệp chỉnh sửa:** `Fontend/src/features/videos/pages/VideoDetailPage.tsx`.
   - **Nhiệm vụ:**
     Xóa hoàn toàn khối `DEMO_VIDEOS.find(...)` trong component production. Khi API trả về `null`, hiển thị thông báo "Bài học video không tồn tại" thay vì hiển thị dữ liệu giả định.

4. **Tách biệt Mock Fixture trong Video Management (Finding 6):**
   - **Tệp chỉnh sửa:**
     - `Fontend/src/management/content-manager/services/video-management.service.ts`
     - Tạo mới `Fontend/src/tests/fixtures/video-management.mock.ts`
   - **Nhiệm vụ:**
     Di chuyển mảng `INITIAL_VIDEOS` và các hàm `createVideo`, `updateVideo`, `deleteVideo`, `getVideos` đồng bộ sang file mock fixture riêng dành cho unit test. Giữ `video-management.service.ts` 100% thuần khiết chỉ chứa các lệnh gọi API backend thật.

---

### WAVE 3: CLEAN CODE & TYPE-SAFETY
*Mục tiêu: Tối ưu trải nghiệm giao diện, bảo đảm an toàn kiểu dữ liệu và ngăn chặn nghẽn kết nối.*

1. **Chuẩn hóa Duration trong VideoEditorModal (Finding 7):**
   - Đặt mặc định `durationSeconds = 0`.
   - Cập nhật hiển thị: nếu thời lượng `= 0`, hiển thị `—:—` hoặc ẩn nhãn thời lượng trên danh sách quản trị cho đến khi video có metadata thực tế.
2. **Dọn dẹp biểu thức vô nghĩa & TypeScript `any` (Finding 8):**
   - Xóa bỏ biểu thức `videoLearningService.constructor.prototype ? '03:00' : '03:00'` trong `VideoDetailPage.tsx`.
   - Thay thế các ép kiểu `as any` bằng các interface chuẩn (`VideoStatus`, `LearningVideo`).
3. **Cấu hình Timeout riêng cho Gemini STT HttpClient:**
   - Trong `GeminiSpeechRecognitionService.cs`, sử dụng `CancellationTokenSource.CreateLinkedTokenSource` với thời gian chờ tối đa 30 giây khi gọi Google Generative Language API.
4. **Tối ưu hóa Code-Splitting trong Vite Build:**
   - Trong `Fontend/vite.config.ts`, bổ sung cấu hình `manualChunks` để chia nhỏ vendor bundle, giải quyết cảnh báo chunk > 500 KB.

---

### WAVE 4: DỌN DẸP MÃ NGUỒN VÀ TỆP MỒ CÔI (CLEANUP)
*Mục tiêu: Làm sạch repository, giảm thiểu nợ kỹ thuật (Technical Debt).*

1. Di chuyển 2 component video mồ côi:
   - `Fontend/src/features/videos/components/SpeakingPracticeCard.tsx`
   - `Fontend/src/features/videos/components/SynchronizedTranscript.tsx`
   vào thư mục lưu trữ `archive/videos/` hoặc gỡ bỏ nếu không còn kế hoạch tái sử dụng.
2. Dọn dẹp các tệp dump dữ liệu một lần trong `scripts/hsk30/`.
3. Xóa các tệp ảnh PNG trùng lặp, chưa nén trong `Fontend/public/images/dashboard/`.

---

### WAVE 5: HỒI QUY TOÀN DIỆN & NGHIỆM THU CUỐI CÙNG
*Mục tiêu: Chứng minh tính toàn vẹn 100% của hệ thống sau khi tối ưu.*

1. Chạy toàn bộ bài kiểm thử Backend:
   ```bash
   dotnet test Backend/tests/ZhongWenHub.UnitTests/ZhongWenHub.UnitTests.csproj
   ```
2. Chạy toàn bộ bài kiểm thử Frontend & Linter:
   ```bash
   cd Fontend && bun run lint && bun test src/tests
   ```
3. Chạy build sản phẩm Frontend & Backend:
   ```bash
   dotnet build Backend/ZhongWenHub.sln
   cd Fontend && bun run build
   ```
4. Lập báo cáo kết quả tổng kết cuối cùng và bàn giao cho ChatGPT review độc lập.
