# BÁO CÁO KIỂM TOÁN TOÀN DIỆN MÃ NGUỒN (FULL CODEBASE AUDIT)
**Dự án:** ZhongWenHub (Nền tảng Học tiếng Trung & Luyện thi HSK Tích hợp AI)  
**Repository:** `nguyen2234/ZhongWenHub`  
**Nhánh kiểm toán:** `audit/full-codebase-clean-code-20261119` (fork từ `feature/ai-personalization-phase5`)  
**Ngày thực hiện:** 19/11/2026  
**Công cụ kiểm toán:** Static Analysis, Roslyn Compiler (`dotnet build/test`), Oxlint (`bun run lint`), TypeScript Compiler (`tsc -b`), Bun Test Runner (388 frontend tests, 67 backend tests), Codebase Architecture Inspection.  
**Tuyên bố môi trường:** Quá trình kiểm toán được thực hiện trực tiếp bởi Antigravity Agent trên toàn bộ Git tracked files; không sử dụng Codex trong phiên làm việc này.

---

## MỤC LỤC
1. [Xác minh và Đánh giá 8 Phát hiện Độc lập của ChatGPT](#1-xác-minh-và-đánh-giá-8-phát-hiện-độc-lập-của-chatgpt)
2. [Kiểm toán Backend (.NET 10 & ASP.NET Core)](#2-kiểm-toán-backend-net-10--aspnet-core)
3. [Kiểm toán Frontend (React 19, TypeScript, Vite)](#3-kiểm-toán-frontend-react-19-typescript-vite)
4. [Ma trận Đánh giá Toàn bộ Module Nghiệp vụ](#4-ma-trận-đánh-giá-toàn-bộ-module-nghiệp-vụ)
5. [Thống kê Static Analysis & Test Results](#5-thống-kê-static-analysis--test-results)
6. [Top 10 Vấn đề Cần Ưu Tiên Xử Lý Hàng Đầu](#6-top-10-vấn-đề-cần-ưu-tiên-xử-lý-hàng-đầu)

---

## 1. XÁC MINH VÀ ĐÁNH GIÁ 8 PHÁT HIỆN ĐỘC LẬP CỦA CHATGPT

Sau khi kiểm tra trực tiếp vào từng dòng mã nguồn, chúng tôi đưa ra kết luận chi tiết cho từng phát hiện:

### Finding 1: `StorageCleanupService` thiếu đối chiếu `TranscriptPdfPath` khi bảo vệ file đang được tham chiếu
* **Vị trí:** `Backend/src/Business/Content/Services/Storage/StorageCleanupService.cs`, dòng 172–178.
* **Hiện trạng mã nguồn:**
  ```csharp
  // Cross-reference safety check: is file still referenced anywhere?
  var isReferencedInVideos = await _context.LearningVideos
      .AnyAsync(v => v.StoragePath == job.StoragePath, cancellationToken);

  var isReferencedInAssets = await _context.VideoUploadAssets
      .AnyAsync(a => a.StoragePath == job.StoragePath && a.UploadStatus == VideoUploadAssetStatus.Linked, cancellationToken);
  ```
* **Điều kiện gây lỗi:** Khi một tệp PDF transcript được chia sẻ giữa 2 bài học, hoặc khi một video A bị thay thế PDF cũ `transcript_x.pdf` và tạo outbox cleanup job, worker chạy kiểm tra tham chiếu. Câu lệnh chỉ so sánh `v.StoragePath == job.StoragePath` (chỉ áp dụng cho video MP4). Do `job.StoragePath` là đường dẫn PDF (`transcripts/videos/...`), kết quả `isReferencedInVideos` trả về `false`.
* **Mức độ nghiêm trọng:** **P1 (Data Loss / Broken Foreign Reference)**.
* **Bằng chứng:** Worker sẽ xóa vật lý tệp PDF trong Storage, khiến các bài học khác đang dùng chung tệp PDF này bị lỗi 404 khi học viên tải/xem.
* **Phương án sửa:** Cập nhật điều kiện kiểm tra:
  ```csharp
  var isReferencedInVideos = await _context.LearningVideos
      .AnyAsync(v => v.StoragePath == job.StoragePath || v.TranscriptPdfPath == job.StoragePath, cancellationToken);
  ```
* **Rủi ro khi sửa:** Thấp. Thêm một điều kiện OR trong câu truy vấn EF Core được hỗ trợ tốt bởi chỉ mục cơ sở dữ liệu.

---

### Finding 2: `LearningVideoService` nhận `TranscriptPdfPath` trực tiếp từ request, cần xác minh quyền sở hữu file
* **Vị trí:** `Backend/src/Business/Content/LearningVideoService.cs`, dòng 342–348 (Create) và dòng 536–545 (Update).
* **Hiện trạng mã nguồn:**
  ```csharp
  string? resolvedTranscriptPdfPath = dto.TranscriptPdfPath?.Trim();
  if (dto.TranscriptUploadId.HasValue)
  {
      var claimedPdfAsset = await _uploadAssetService.ValidateAndClaimAssetAsync(
          dto.TranscriptUploadId.Value, currentUserId, isAdmin, videoId, cancellationToken);
      resolvedTranscriptPdfPath = claimedPdfAsset.StoragePath;
  }
  ```
* **Điều kiện gây lỗi:** Nếu một client (vai trò Content Manager) gửi payload trực tiếp chứa `TranscriptPdfPath` trỏ đến đường dẫn tệp của người khác hoặc tệp hệ thống mà **không gửi** `TranscriptUploadId`, hệ thống chấp nhận chuỗi này trực tiếp và gán vào database mà không xác minh xem người dùng đó có tải lên tệp này hay không.
* **Mức độ nghiêm trọng:** **P1 (Security / IDOR / File Hijacking)**.
* **Bằng chứng:** Đối với `StoragePath` (video MP4), code tại dòng 305–320 có bước tra cứu `VideoUploadAssets` theo đường dẫn và kiểm tra quyền sở hữu (`!isAdmin => throw UnauthorizedAccessException`), nhưng với `TranscriptPdfPath` thì bước này bị bỏ sót.
* **Phương án sửa:** Bắt buộc tra cứu quyền sở hữu tệp hoặc bắt buộc phải có `TranscriptUploadId` hợp lệ qua `ValidateAndClaimAssetAsync`. Đồng thời kiểm tra `StoragePathSecurity.IsValidStoragePath(resolvedTranscriptPdfPath)`.
* **Rủi ro khi sửa:** Thấp. Tăng cường tính bảo mật dữ liệu giữa các quản trị viên nội dung.

---

### Finding 3: `UploadAssetService.ValidateAndClaimAssetAsync` chưa xác minh đúng `AssetType`
* **Vị trí:** `Backend/src/Business/Content/Services/Storage/UploadAssetService.cs`, dòng 58–103.
* **Hiện trạng mã nguồn:**
  Hàm nhận: `(Guid uploadId, string userId, bool isAdmin, Guid videoId, CancellationToken cancellationToken)`. Trong bảng `VideoUploadAssets` có cột `AssetType` ("Video", "Thumbnail", "PdfTranscript"), nhưng hàm này không có tham số `expectedAssetType` và không kiểm tra `asset.AssetType`.
* **Điều kiện gây lỗi:** Kẻ tấn công hoặc client gửi nhầm `UploadId` của một ảnh đại diện (Thumbnail) vào vị trí `TranscriptUploadId` (hoặc MP4 `UploadId`), hệ thống vẫn claim thành công và gán đường dẫn ảnh JPG làm tệp PDF transcript.
* **Mức độ nghiêm trọng:** **P2 (Data Integrity)**.
* **Bằng chứng:** `RegisterUploadAsync` lưu `assetType`, nhưng `ValidateAndClaimAssetAsync` bỏ qua việc kiểm tra trường này.
* **Phương án sửa:** Thêm tham số `string? expectedAssetType = null` vào `ValidateAndClaimAssetAsync`. Nếu được chỉ định, kiểm tra `string.Equals(asset.AssetType, expectedAssetType, StringComparison.OrdinalIgnoreCase)`.
* **Rủi ro khi sửa:** Cần cập nhật các vị trí gọi `ValidateAndClaimAssetAsync` trong `LearningVideoService.cs` và các bài unit test liên quan.

---

### Finding 4: `VideoLearningService.fetchVideoById` trả `null` khi API lỗi
* **Vị trí:** `Fontend/src/features/videos/services/video-learning.service.ts`, dòng 106–130.
* **Hiện trạng mã nguồn:**
  ```ts
  try {
    const response = await fetch(...);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Lỗi tải video (${response.status})`);
    ...
  } catch (err) {
    console.warn('[VideoLearningService] Error fetching video by id:', err);
    return null; // Nuốt chửng toàn bộ lỗi mạng / 500 thành null
  }
  ```
* **Điều kiện gây lỗi:** Khi máy chủ backend bị lỗi 500, lỗi xác thực 401/403 hoặc mất kết nối mạng, hàm nuốt lỗi và trả về `null`.
* **Mức độ nghiêm trọng:** **P2 (Error Handling / Silent Failure)**.
* **Bằng chứng:** Người gọi không thể phân biệt được video thực sự không tồn tại (404) hay hệ thống đang gặp sự cố mạng (500/Network Error).
* **Phương án sửa:** Chỉ trả về `null` khi `response.status === 404`. Các lỗi HTTP khác và lỗi mạng phải `throw Error` để giao diện hiển thị đúng banner lỗi và nút "Thử lại".
* **Rủi ro khi sửa:** Thấp. Cải thiện trải nghiệm người dùng khi gặp sự cố mạng.

---

### Finding 5: `VideoDetailPage` fallback về `DEMO_VIDEOS`
* **Vị trí:** `Fontend/src/features/videos/pages/VideoDetailPage.tsx`, dòng 48–74.
* **Hiện trạng mã nguồn:**
  ```ts
  const data = await videoLearningService.fetchVideoById(videoId);
  if (data) {
    setVideo(data);
  } else {
    // Fallback check for demo fixture (backward-compatibility)
    const fallback = DEMO_VIDEOS.find((v) => v.id === videoId);
    if (fallback) {
      setVideo({ ... });
    } else {
      setError('Không tìm thấy video bài học hoặc video đã bị ẩn.');
    }
  }
  ```
* **Điều kiện gây lỗi:** Khi ở môi trường Production, nếu truy cập vào một ID trùng với mảng demo (hoặc khi API lỗi biến thành null theo Finding 4), giao diện hiển thị dữ liệu giả định `DEMO_VIDEOS` với tên PDF `HSK_BaiDoc_Mau.pdf` và YouTube ID mẫu.
* **Mức độ nghiêm trọng:** **P2 (Mock Leaking into Production)**.
* **Bằng chứng:** Code kiểm tra trực tiếp mảng in-memory `DEMO_VIDEOS` trong component production.
* **Phương án sửa:** Loại bỏ hoàn toàn khối `fallback` về `DEMO_VIDEOS` trong `VideoDetailPage.tsx`. Nếu API trả về `null`, thông báo lỗi 404 chuẩn. Chuyển `DEMO_VIDEOS` thành fixture chỉ dùng trong các bài kiểm thử unit/e2e.
* **Rủi ro khi sửa:** Cần kiểm tra lại các bài test cũ xem có bài test nào phụ thuộc vào việc điều hướng tới URL `/videos/vid-101` hay không.

---

### Finding 6: `VideoManagementService` trộn API thật với mock CRUD trong RAM
* **Vị trí:** `Fontend/src/management/content-manager/services/video-management.service.ts`, dòng 54–262 và 628–751.
* **Hiện trạng mã nguồn:**
  Class `VideoManagementService` vừa chứa các phương thức gọi HTTP Backend thật (`fetchVideos`, `createVideoApi`, `updateVideoApi`, `deleteVideoApi`), vừa chứa mảng `INITIAL_VIDEOS` và các hàm thao tác RAM đồng bộ (`createVideo`, `updateVideo`, `deleteVideo`, `getVideos`).
* **Điều kiện gây lỗi:** Gây nhầm lẫn nghiêm trọng cho các nhà phát triển khi gọi hàm (như lỗi gọi nhầm `createVideo` thay vì `createVideoApi` ở phiên bản trước).
* **Mức độ nghiêm trọng:** **P2 (Code Quality / Architecture Smelling)**.
* **Bằng chứng:** Trong cùng một service có 2 tập hàm CRUD song song: một tập bất đồng bộ gọi API thật và một tập đồng bộ sửa mảng RAM cục bộ.
* **Phương án sửa:** Tách riêng thành 2 file độc lập:
  - `video-management.service.ts`: Chỉ chứa các phương thức gọi API thật.
  - `video-management-mock.service.ts` (hoặc chuyển vào thư mục `tests/fixtures/`): Chứa mảng `INITIAL_VIDEOS` và các hàm synchronous dành riêng cho các bài kiểm thử unit/e2e cũ.
* **Rủi ro khi sửa:** Cần cập nhật đường dẫn import trong các file test liên quan (`video-management-phase2.test.ts`, `fe-7-interactive-video.test.ts`).

---

### Finding 7: `VideoEditorModal` gán `durationSeconds = 180` dù chưa có metadata
* **Vị trí:** `Fontend/src/management/content-manager/components/VideoEditorModal.tsx`, dòng 201.
* **Hiện trạng mã nguồn:**
  ```ts
  const created = await videoManagementService.createVideoApi({
    ...
    durationSeconds: 180,
    ...
  });
  ```
* **Điều kiện gây lỗi:** Khi người quản lý thêm mới bài học video YouTube, thời lượng luôn bị hardcode thành 180 giây (3 phút) dù video thực tế dài 30 giây hay 1 tiếng.
* **Mức độ nghiêm trọng:** **P3 (UI / Inaccurate Metadata)**.
* **Bằng chứng:** Mọi video mới tạo đều hiển thị `03:00` trên danh sách và thẻ bài học.
* **Phương án sửa:** Đặt mặc định `durationSeconds: 0`. Khi hiển thị, nếu `durationSeconds <= 0`, hiển thị `—:—` hoặc ẩn nhãn thời lượng cho đến khi trình phát YouTube tải xong metadata và cập nhật thời lượng thực tế.
* **Rủi ro khi sửa:** Rất thấp. Không ảnh hưởng đến dữ liệu cốt lõi.

---

### Finding 8: Các biểu thức vô nghĩa, code duplication và TypeScript `any`
* **Vị trí & Bằng chứng cụ thể:**
  1. `Fontend/src/features/videos/pages/VideoDetailPage.tsx`:
     Biểu thức ternary dư thừa: `durationFormatted: videoLearningService.constructor.prototype ? '03:00' : '03:00'`. Cả 2 nhánh đều trả về `'03:00'`.
  2. `Fontend/src/management/content-manager/components/VideoEditorModal.tsx`, dòng 181:
     Ép kiểu lỏng lẻo: `status: (video.status as any) || 'Published'`.
  3. `Fontend/src/features/videos/services/video-learning.service.ts`, dòng 120:
     `const item = (await response.json()) as any`.
  4. `Fontend/src/management/content-manager/pages/VideoManagementPage.tsx`:
     Mã lặp trong việc render các trạng thái lọc và mapping tag.
* **Mức độ nghiêm trọng:** **P3 (Code Quality / Type Safety)**.
* **Phương án sửa:** Dọn dẹp biểu thức thừa, định nghĩa kiểu `VideoStatus` chặt chẽ, loại bỏ hoàn toàn các `as any` không cần thiết.
* **Rủi ro khi sửa:** Thấp.

---

## 2. KIỂM TOÁN BACKEND (.NET 10 & ASP.NET CORE)

### 2.1. Authentication, Authorization & RBAC
* **Điểm mạnh:**
  - Hệ thống sử dụng JWT Bearer Token chuẩn mực (`Microsoft.AspNetCore.Authentication.JwtBearer 10.0.14`).
  - Phân quyền theo Policy rõ ràng (`PolicyConstants.AdminAccess`, `PolicyConstants.ContentManagementAccess`, `PolicyConstants.StudentAccess`, `PolicyConstants.TeacherAccess`).
  - Các Controller quản trị (`AdminUsersController`, `AdminDashboardController`, `QuestionBankController`, `VideosController.manage`) đều được bảo vệ nghiêm ngặt bằng Policy tương ứng.
* **Điểm cần khắc phục:**
  - Trong `VideosController.cs`, phương thức `IsStaff()` (dòng 44-47) tự kiểm tra `User.IsInRole(RoleConstants.Admin) || User.IsInRole(RoleConstants.ContentManager)`. Logic này nên được thống nhất dùng `IAuthorizationService` hoặc `User.HasClaim()` để tránh trùng lặp logic kiểm tra quyền.

### 2.2. SQL Queries, EF Core & Concurrency
* **Điểm mạnh:**
  - Không phát hiện bất kỳ lệnh raw SQL nguy hiểm nào (`FromSqlRaw`, `ExecuteSqlRaw` không tồn tại trong code nghiệp vụ). 100% truy vấn được thực thi qua LINQ to Entities với tham số hóa an toàn chống SQL Injection.
  - Áp dụng `AsNoTracking()` trên các truy vấn đọc (`GetVideosAsync`, `GetByIdAsync`, `ListSessionsAsync`) giúp tối ưu bộ nhớ và hiệu năng.
  - Áp dụng Transactional Outbox Pattern cho các thao tác xóa và thay thế tệp trong `LearningVideoService.cs`.
* **Điểm cần lưu ý:**
  - Một số truy vấn danh sách người dùng (`AdminUserService.GetUsersAsync`) có thể phát sinh tải cao nếu bảng người dùng tăng lên hàng chục nghìn bản ghi; cần đảm bảo các cột tìm kiếm (`Email`, `FullName`, `PhoneNumber`) có Index phù hợp trong SQL Server.

### 2.3. Background Workers & Transactional Outbox
* **Điểm mạnh:**
  - `VideoStorageCleanupWorker` kế thừa `BackgroundService`, có cơ chế Lease Locking (`LeaseOwner`, `LeaseExpiresAt = 5 minutes`) để chống xung đột khi chạy nhiều instance (multi-replica).
  - Có cơ chế bắt lỗi `CleanupTableMissingException` thông minh: nếu bảng chưa tồn tại do migration chưa áp dụng, worker tự động backoff 10 phút thay vì spam log liên tục.
* **Lỗi phát hiện:**
  - Như đã chỉ ra ở Finding 1: Worker chưa kiểm tra `v.TranscriptPdfPath` trong bước `isReferencedInVideos`.

### 2.4. Tích hợp AI (Gemini STT & AI Tutor)
* **Điểm mạnh:**
  - Giới hạn kích thước audio chặt chẽ (tối đa 10 MB).
  - Giới hạn output tokens (`maxOutputTokens = 300`, `temperature = 0.0`) cho Speech-to-Text để tối ưu chi phí và tránh model bị lan man.
  - Sử dụng thuật toán so khớp LCS (Longest Common Subsequence) thuần túy phía server trong `AISpeakingService.cs`, loại bỏ hoàn toàn độ tin cậy giả lập.
* **Điểm cần cải thiện:**
  - HttpClient gọi Gemini (`GeminiSpeechRecognitionService.cs` dòng 148) chưa cấu hình Timeout riêng cho từng request (đang dùng timeout mặc định 100 giây của .NET). Cần bọc bằng `CancellationTokenSource.CreateLinkedTokenSource` với timeout 25–30 giây.

---

## 3. KIỂM TOÁN FRONTEND (REACT 19, TYPESCRIPT, VITE)

### 3.1. Routing & Route Guards
* **Điểm mạnh:**
  - Sử dụng `react-router-dom 7.18.4` với cấu trúc route module hóa: `authRoutes`, `studentRoutes`, `managementRoutes`.
  - Phân tách quyền truy cập qua `ManagementRouteGuard` và `StudentRouteGuard`.
* **Điểm cần tối ưu:**
  - Một số route cũ (`/management/videos`) vẫn tồn tại dưới dạng redirect sang `/management/content-manager/videos`. Cần đảm bảo các link trên thanh menu điều hướng cập nhật đồng bộ sang đường dẫn mới.

### 3.2. Quản lý State & Form Validation
* **Điểm mạnh:**
  - `VideoEditorModal.tsx` đã được tối giản thành công về 3 trường theo đúng yêu cầu người dùng: URL, HSK, PDF Transcript.
  - Live validation URL YouTube bằng regex chuẩn, trích xuất ID tức thì và hiển thị xem trước thumbnail 16:9.
* **Điểm cần khắc phục:**
  - Cần sửa Finding 7: Đưa `durationSeconds` về mặc định `0` thay vì `180`.

### 3.3. Hiệu năng & Bundle Size
* **Điểm mạnh:**
  - Không có thư viện UI cồng kềnh (không dùng Ant Design, MUI hay thư viện thừa); toàn bộ UI được viết bằng Tailwind CSS và các inline styled components nhẹ nhàng, thanh lịch.
  - Tốc độ build với Vite cực nhanh: hoàn thành bundle client trong 1.51 giây.
* **Cảnh báo Vite Build:**
  - Chunk `index-DPLamSJR.js` đạt kích thước 2.7 MB (gzip ~605 KB). Vite cảnh báo chunk > 500 KB do import tĩnh `curriculumData.ts`.
  - Khuyến nghị: Cấu hình `manualChunks` trong `vite.config.ts` để tách riêng `vendor` (React, React-Router, Lucide) và dữ liệu giáo trình thành các chunk nạp bất đồng bộ (`lazy loading`).

---

## 4. MA TRẬN ĐÁNH GIÁ TOÀN BỘ MODULE NGHIỆP VỤ

| STT | Phân hệ nghiệp vụ | Luồng tương tác (FE → API → Service → DB) | Đánh giá hiện trạng | Ghi chú & Đề xuất |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **Xác thực & Phân quyền (Auth)** | `LoginPage` → `AuthController` → `AuthService` → `Users/Roles` | **WORKING** | JWT, Refresh token, Bcrypt password hashing hoạt động ổn định. |
| **2** | **Quản lý người dùng (Admin Users)** | `AdminUserManagementPage` → `AdminUsersController` → `AdminUserService` → `Users/Wallets` | **WORKING** | Đầy đủ xem, sửa, khóa, mở khóa, đổi vai trò, điều chỉnh ví. |
| **3** | **Quản lý giáo viên & Lớp học** | `TeacherClassListPage` → `TeacherClassroomService` | **PARTIAL** | Giao diện đã có, nhưng đang kết nối qua fixture/mock phía client. |
| **4** | **Giáo trình HSK & Bài học** | `CurriculumView` → `ContentController` → `ContentService` → `Courses/Lessons` | **WORKING** | HSK 1–4 chuẩn 70 bài học đã nạp và đối chiếu đầy đủ. |
| **5** | **Từ vựng & Sổ từ SRS** | `VocabularyPage` → `ContentController` → `LearningService` → `Vocabularies` | **WORKING** | Hỗ trợ Spaced Repetition (SRS), phát âm mẫu. |
| **6** | **Ngữ pháp HSK** | `GrammarPage` → `ContentController` → `ContentService` → `GrammarPoints` | **WORKING** | Đầy đủ cấu trúc, giải thích tiếng Việt, ví dụ câu. |
| **7** | **Ngân hàng câu hỏi & Bài tập** | `QuestionBankPage` → `QuestionBankController` → `QuestionBankService` → `QuestionBankItems` | **WORKING** | Hỗ trợ đa dạng kỹ năng (Nghe, Đọc, Viết), chấm điểm tự động. |
| **8** | **Học qua video & PDF Transcript** | `VideoDetailPage` / `VideoManagementPage` → `VideosController` → `LearningVideoService` → `LearningVideos` | **WORKING** | Đã sửa CRUD thật, form 3 trường; cần sửa 3 findings (F1, F2, F6). |
| **9** | **Luyện nói AI (Speaking)** | `SkillSpeakingPage` → `AILearningEngineController` → `AISpeakingService` → `SpeakingAssessments` | **WORKING** | Thuật toán LCS thật, Gemini STT audio, không điểm ảo. |
| **10** | **Hội thoại AI (AI Tutor)** | `AITutorPage` → `AILearningEngineController` → `AIConversationService` → `AiConversationSessions` | **WORKING** | Giao diện tối giản, lưu lịch sử phiên hội thoại. |
| **11** | **Cá nhân hóa AI Phase 3–5** | `AIExerciseGeneratorPage` → `AILearningEngineController` → `BktAlgorithm/DiagnosticAssessmentService` | **WORKING** | Thuật toán BKT tính xác suất nắm vững kiến thức thật. |
| **12** | **Gói dịch vụ & Giao dịch ví** | `UserFormModal` → `AdminUsersController` → `Wallets/Subscriptions` | **PARTIAL** | Đã có quản lý số dư backend, chưa có cổng thanh toán online. |

---

## 5. THỐNG KÊ STATIC ANALYSIS & TEST RESULTS

* **Backend Compilation (.NET 10):**
  - Command: `dotnet build Backend/ZhongWenHub.sln`
  - Exit Code: **0**
  - Warnings: 5 warnings (CS8601/CS8604 null reference annotations không ảnh hưởng runtime).
  - Errors: **0**.
* **Backend Unit Tests:**
  - Command: `dotnet test Backend/tests/ZhongWenHub.UnitTests/ZhongWenHub.UnitTests.csproj`
  - Kết quả: **Passed: 67, Failed: 0, Total: 67 (100% PASS)**.
* **Frontend Linter (Oxlint):**
  - Command: `cd Fontend && bun run lint`
  - Exit Code: **0**
  - Errors: **0**.
  - Warnings: 160 warnings (chủ yếu là React Compiler recommendations về `set-state-in-effect`).
* **Frontend Unit & Integration Tests (Bun):**
  - Command: `cd Fontend && bun test src/tests`
  - Kết quả: **Passed: 388, Failed: 0, Total: 388 across 50 files (100% PASS)**.
* **Frontend Production Build (Vite & TypeScript):**
  - Command: `cd Fontend && bun run build`
  - Exit Code: **0** (Hoàn tất thành công trong 1.51s).

---

## 6. TOP 10 VẤN ĐỀ CẦN ƯU TIÊN XỬ LÝ HÀNG ĐẦU

Dựa trên kết quả kiểm toán toàn diện, dưới đây là 10 vấn đề có mức ưu tiên cao nhất cần đưa vào kế hoạch khắc phục:

| Thứ tự | Hạng mục | Vị trí file | Mức độ | Lý do & Tác động |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **Bổ sung đối chiếu `TranscriptPdfPath` trong Storage Cleanup Worker** | `Backend/.../StorageCleanupService.cs:172` | **P1** | Tránh xóa nhầm tệp PDF trong Cloud Storage khi tệp vẫn đang được tham chiếu bởi bài học khác. |
| **2** | **Bổ sung xác minh quyền sở hữu `TranscriptPdfPath`** | `Backend/.../LearningVideoService.cs:342, 536` | **P1** | Ngăn chặn lỗ hổng IDOR/File Hijacking khi client gửi đường dẫn PDF trực tiếp mà không qua upload token. |
| **3** | **Kiểm tra `AssetType` trong `ValidateAndClaimAssetAsync`** | `Backend/.../UploadAssetService.cs:58` | **P2** | Đảm bảo tính toàn vẹn dữ liệu, không cho phép claim nhầm thumbnail thành video hoặc PDF transcript. |
| **4** | **Tách biệt Mock Fixture ra khỏi `VideoManagementService`** | `Fontend/.../video-management.service.ts:54, 628` | **P2** | Tách hẳn client API production và fixture mock test, loại bỏ nguy cơ gọi nhầm hàm RAM. |
| **5** | **Không nuốt lỗi thành `null` trong `fetchVideoById`** | `Fontend/.../video-learning.service.ts:128` | **P2** | Phân biệt chính xác giữa lỗi mạng/500 và video không tồn tại (404) để hiển thị thông báo đúng cho người dùng. |
| **6** | **Loại bỏ `DEMO_VIDEOS` fallback trong `VideoDetailPage`** | `Fontend/.../VideoDetailPage.tsx:49` | **P2** | Ngăn chặn dữ liệu giả lập (mock data) hiển thị ngoài môi trường sản xuất. |
| **7** | **Bỏ hardcode `durationSeconds = 180` trong `VideoEditorModal`** | `Fontend/.../VideoEditorModal.tsx:201` | **P3** | Đặt mặc định 0 để không hiển thị thời lượng giả `03:00` gây hiểu nhầm cho học viên. |
| **8** | **Cấu hình Timeout riêng cho Gemini API HttpClient** | `Backend/.../GeminiSpeechRecognitionService.cs:148` | **P3** | Ngăn chặn việc giữ kết nối HTTP quá lâu khi Google API bị chậm hoặc ngắt quãng mạng. |
| **9** | **Dọn dẹp các component video mồ côi (`SpeakingPracticeCard`, `SynchronizedTranscript`)** | `Fontend/src/features/videos/components/` | **P3** | Các component cũ không còn nơi nào import, cần đưa vào thư mục lưu trữ để giảm kích thước bundle. |
| **10**| **Tối ưu hóa Code-Splitting cho Vite Bundle** | `Fontend/vite.config.ts` | **P3** | Phân tách chunk vendor và curriculum data lớn hơn 500KB để tăng tốc độ tải trang ban đầu cho học viên. |
