# Báo Cáo Nghiệm Thu Kỹ Thuật: Phase B1 – Video Learning Fail-Closed & Fallback Cleanup

**Thời điểm thực hiện:** 2026-11-19 20:30 (Giờ địa phương)  
**Repository:** `nguyen2234/ZhongWenHub`  
**Nhánh làm việc:** `fix/phase-b1-video-fail-closed`  
**Mục tiêu:** Khắc phục triệt để lỗi nuốt lỗi HTTP 500/mạng (Error Masking) và gỡ bỏ hoàn toàn dữ liệu giả lập (`DEMO_VIDEOS`) trong luồng production của tính năng Học qua Video (Video Learning), bảo đảm nguyên tắc fail-closed, phân biệt đúng trạng thái 404 (Not Found) và 500/Network (Error + Retry).

---

## 1. Phân Tích Nguyên Nhân Gốc & Các Lỗi Đã Xác Minh

### 1.1. Lỗi Nuốt Lỗi Kỹ Thuật (P1 Error Masking)
- **Vị trí cũ:** `Fontend/src/features/videos/services/video-learning.service.ts:106-129` và `Fontend/src/management/content-manager/services/video-management.service.ts:348-368`.
- **Hiện tượng:** Khối `catch (err)` nuốt mọi lỗi mạng (Network failure/timeout), lỗi máy chủ (HTTP 500), lỗi phân quyền (HTTP 401/403) và âm thầm trả về `null`.
- **Hệ quả:** Tầng UI (`VideoDetailPage.tsx`) không thể phân biệt giữa:
  - Video không tồn tại thực sự (HTTP 404 Not Found)
  - Lỗi kết nối / sập máy chủ / lỗi gateway (HTTP 500/502/503/Network timeout)
  - Người dùng chưa đăng nhập hoặc bị từ chối truy cập (HTTP 401/403).

### 1.2. Fallback Dữ Liệu Giả Trong Production (P1 Fabricated Mock Fallback)
- **Vị trí cũ:** `Fontend/src/features/videos/pages/VideoDetailPage.tsx:48-77`.
- **Hiện tượng:** Khi `fetchVideoById()` trả về `null` (do lỗi API hoặc do video không có trong DB), UI tự động tra cứu trong mảng tĩnh `DEMO_VIDEOS`. Nếu trùng ID (như `vid-1`), trang sẽ hiển thị dữ liệu bịa đặt:
  - Lời thoại PDF giả lập: `transcriptPdfName: 'HSK_BaiDoc_Mau.pdf'`, dung lượng giả `1048576` bytes (1MB).
  - Metadata giả: `durationFormatted: '03:00'`, `viewCount: 100`.
- **Hệ quả:** Che giấu lỗi hệ thống thật; người dùng tưởng nhầm bài học thật nhưng tải tài liệu không tồn tại trên Cloud Storage.

### 1.3. Thiếu Xử Lý Retry & Not Found Chưa Chuẩn
- Khi gặp lỗi mạng hoặc 500, giao diện hiển thị thông báo "Bài học này không tồn tại hoặc đã được gỡ bỏ" và chỉ có nút "Quay lại thư viện video", không có nút **"Thử lại" (Retry)**.
- Khi `videoId` là chuỗi rỗng hoặc khoảng trắng (`''`, `'   '`), `getApiUrl('/videos/' + id)` vô tình gọi đến endpoint danh sách `/videos`, nhận về `{ items: [...] }` và gây crash do sai cấu trúc.

---

## 2. Giải Pháp & Chi Tiết Sửa Đổi

### 2.1. `Fontend/src/features/videos/services/video-learning.service.ts`
1. **Bảo vệ tham số đầu vào:** Thêm kiểm tra `const cleanId = id?.trim(); if (!cleanId) return null;` và sử dụng `encodeURIComponent(cleanId)` để ngăn chặn request rỗng/sai lệch endpoint.
2. **Fail-Closed Semantics:**
   - HTTP 404: Trả về `null` (đúng chuẩn ngữ nghĩa Not Found).
   - HTTP 401: Ném lỗi `new Error('Yêu cầu đăng nhập để xem bài học video này (401)')`.
   - HTTP 403: Ném lỗi `new Error('Bạn không có quyền truy cập video này (403)')`.
   - HTTP 500 / Network Error: Ném lỗi fail-closed, không dùng khối catch nuốt lỗi.
3. **Kiểm tra cấu trúc Schema (Schema Validation):** Xác thực `item` trả về từ server là object hợp lệ, bắt buộc có `id` và `title` dạng chuỗi; nếu server trả sai cấu trúc, ném lỗi rõ ràng thay vì để crash runtime.
4. **Chuẩn hóa Metadata:** Chuẩn hóa `youtubeVideoId`, `durationFormatted` (qua `VideoLearningService.formatDuration`), `viewCount` và đường dẫn public URL PDF.

### 2.2. `Fontend/src/management/content-manager/services/video-management.service.ts`
1. Loại bỏ hoàn toàn khối try/catch nuốt lỗi trong `fetchVideoById()`.
2. Kiểm tra `cleanId` và `encodeURIComponent(cleanId)`.
3. Bổ sung schema validation cho cả `fetchVideos()` và `fetchVideoById()`, xử lý đúng 401, 403, 500 và network error.

### 2.3. `Fontend/src/features/videos/pages/VideoDetailPage.tsx`
1. **Gỡ bỏ hoàn toàn `DEMO_VIDEOS`:** Xóa bỏ `import { DEMO_VIDEOS } from '../data/demoVideos';` và toàn bộ khối fallback dữ liệu giả.
2. **Tách biệt 4 trạng thái giao diện rõ ràng:**
   - **Loading State:** Spinner tải bài học.
   - **Empty / Not Found State (404):** Hiển thị rõ ràng "Không tìm thấy video bài học. Bài học này không tồn tại hoặc đã được gỡ bỏ khỏi hệ thống", kèm nút "Quay lại thư viện video". Không hiển thị nút Thử lại vì video 404 thử lại vẫn là 404.
   - **Error State (500 / Network / 401 / 403):** Hiển thị lỗi kỹ thuật chính xác, có nút **"Thử lại" (Retry)** gọi lại `loadVideo()` và nút "Quay lại thư viện video".
   - **Success / Loaded State:** Hiển thị dữ liệu thực tế từ Backend.
3. **Hỗ trợ đa nguồn phát video thực tế:**
   - Nguồn YouTube: Nhúng iframe YouTube an toàn qua `youtubeVideoId`.
   - Nguồn Uploaded: Nhúng thẻ `<video controls src={video.videoUrl} poster={video.thumbnailUrl} />` dựa trên URL public do Backend sinh ra từ Storage Service.
   - Trường hợp không có nguồn phát hợp lệ: Hiển thị cảnh báo trong khung phát, không để iframe lỗi.
4. **Trung thực về Transcript PDF:** Chỉ hiển thị tên file, dung lượng và nút tải về khi `video.transcriptPdfUrl` thực sự tồn tại. Nếu không có PDF, hiển thị trạng thái "Chưa có tệp PDF Transcript" rõ ràng, không bịa đặt file PDF mẫu.
5. **Tối ưu render & chống request lặp vô hạn:** Bọc `loadVideo` trong `useCallback([videoId])`, gọi sạch sẽ trong `useEffect`, loại bỏ cảnh báo oxlint `react(set-state-in-effect)`.

### 2.4. `Fontend/src/features/videos/types/video-learning.types.ts`
- Bổ sung trường `videoUrl?: string | null;` vào `LearningVideo` để khớp với `LearningVideoDto.VideoUrl` phía Backend.

---

## 3. Bổ Sung Bộ Kiểm Thử Hồi Quy Tự Động (Regression Test Suite)

Trong `Fontend/src/tests/video-library-integration.test.ts`, đã bổ sung thêm 18 kiểm thử tích hợp (nâng tổng số test của file từ 7 lên 25 tests):
1. `fetchVideoById` trả về DTO đầy đủ với formatted duration trên HTTP 200 OK.
2. `fetchVideoById` trả về `null` trên HTTP 404 (chuẩn Not Found).
3. `fetchVideoById` ném lỗi fail-closed trên HTTP 500 mà không nuốt thành `null`.
4. `fetchVideoById` ném lỗi fail-closed trên lỗi mạng / timeout mà không nuốt thành `null`.
5. `fetchVideoById` ném lỗi phân quyền trên HTTP 401.
6. `fetchVideoById` ném lỗi phân quyền trên HTTP 403.
7. `fetchVideoById` ném lỗi xác thực cấu trúc khi server trả payload sai (thiếu id/title).
8. `fetchVideos` ném lỗi fail-closed trên HTTP 500 mà không trả về mảng rỗng giả.
9. `fetchVideos` ném lỗi cấu trúc khi server trả `items` không phải mảng.
10. `fetchVideoById` trả về `null` ngay lập tức khi `id` rỗng hoặc chỉ toàn khoảng trắng, không gửi request sai đến `/videos`.
11. `videoManagementService.fetchVideoById` trả về `null` trên 404.
12. `videoManagementService.fetchVideoById` ném lỗi trên 500 và lỗi mạng.
13. `videoManagementService.fetchVideoById` ném lỗi trên 401 và 403.
14. `videoManagementService.fetchVideoById` trả về `null` khi `id` rỗng.
15. `videoManagementService.fetchVideos` ném lỗi khi `items` không phải mảng.
16. Hỗ trợ nguồn HTML5 Video khi `videoUrl` được cung cấp từ Cloud Storage.
17. Kiểm tra tĩnh mã nguồn `VideoDetailPage.tsx`: Cam kết 100% không chứa tham chiếu đến `DEMO_VIDEOS` hoặc `demoVideos` trong production.

---

## 4. Kết Quả Kiểm Tra Thực Tế (Execution Verification)

| Lệnh kiểm thử | Kết quả | Chi tiết thực thi | Exit Code |
|:---|:---:|:---|:---:|
| `bun test src/tests/video-library-integration.test.ts` | **PASS** | 25 pass, 0 fail (70 expect calls, 1.15s) | `0` |
| `bun test src/tests/video-management-phase2.test.ts` | **PASS** | 12 pass, 0 fail (45 expect calls, 0.19s) | `0` |
| `bun test src/tests` (Toàn bộ Frontend) | **PASS** | **474 pass, 0 fail** (5,015 expect calls, 51 test files, 8.50s) | `0` |
| `bun run lint` (oxlint) | **PASS** | **0 errors**, 155 warnings (toàn bộ warning là non-fatal có sẵn từ trước, mô-đun Video đạt 0 warnings) | `0` |
| `bun run build` (`tsc -b && vite build`) | **PASS** | 2,436 modules transformed, built in **1.76s** | `0` |
| `dotnet test Backend/tests/...` (Backend Unit Tests) | **PASS** | **328 passed, 0 failed, 0 skipped** (6s) | `0` |

---

## 5. Danh Sách File Đã Thay Đổi

1. `Fontend/src/features/videos/types/video-learning.types.ts`: Khai báo thêm `videoUrl?: string | null`.
2. `Fontend/src/features/videos/services/video-learning.service.ts`: Sửa `fetchVideos` và `fetchVideoById` fail-closed, thêm schema validation, xử lý empty ID.
3. `Fontend/src/management/content-manager/services/video-management.service.ts`: Xóa nuốt lỗi trong `fetchVideoById`, thêm schema validation, xử lý empty ID.
4. `Fontend/src/features/videos/pages/VideoDetailPage.tsx`: Gỡ bỏ `DEMO_VIDEOS` fallback, phân định Not Found (404) vs Error (500/Network), thêm nút Retry, hỗ trợ HTML5 video player, chuẩn hóa PDF view.
5. `Fontend/src/tests/video-library-integration.test.ts`: Bổ sung 18 regression test cases.
6. `docs/audits/FULL_SYSTEM_FUNCTIONAL_INVENTORY.md`: Hiệu chỉnh trạng thái `/videos/:videoId` từ `BROKEN` thành `API_WIRED`.
7. `docs/audits/FE_BE_API_CONTRACT_MATRIX.md`: Hiệu chỉnh trạng thái `/videos/:videoId` từ `BROKEN` thành `API_WIRED`.
8. `docs/audits/PHASE_B1_VIDEO_FIX_REPORT.md`: Báo cáo nghiệm thu kỹ thuật chi tiết.

---

## 6. Đối Chiếu Bảng Kiểm Kê & Rủi Ro Tồn Đọng

- **Trạng thái `/videos` và `/videos/:videoId`:** Đã đạt chuẩn `API_WIRED` (đầy đủ Backend Controller, Frontend Service, fail-closed handling, validation, unit/integration tests).
- **Rủi ro còn tồn đọng:** Endpoint video hiện kết nối chuẩn với SQLite/In-Memory trong unit test; kiểm thử live SQL Server với dataset video production thực tế vẫn đang được cấu hình conditional skip trên GitHub Actions CI.
- **Tiêu chí Phase B2:** Sẵn sàng chuyển tiếp sang **Phase B2 – Student Classes Real Data** sau khi Phase B1 được nghiệm thu độc lập.
