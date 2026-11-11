# BÁO CÁO NGHIỆM THU: FIX CURRICULUM CREATE LESSON, LIVE COUNTS & READINESS 404

- **Nhiệm vụ:** `ZHONGWENHUB — FIX CURRICULUM CREATE LESSON & LIVE COUNTS` (P0 — Functional regression)
- **Branch:** `integration/zhongwenhub-sqlserver`
- **Base HEAD trước khi commit:** `3754c53b0868ce2f3f1874a25e1102e3db9b09e5`
- **PR #16:** Giữ nguyên trạng thái `Open / Draft` (không merge, không force-push)

---

## 1. Nguyên nhân gốc rễ (Root Causes)

### 1.1. Lỗi `404 Not Found` tại `GET /api/v1/content/lessons/readiness`
- Process Backend API chạy trên cổng `5000` (`PID 17644`) trước đó đang load bản `ZhongWenHub.Api.dll` cũ build lúc `12:21:47`, trước thời điểm endpoint `[HttpGet("lessons/readiness")]` trong `Backend/src/Api/Controllers/ContentController.cs` được commit ở `5d2f0b1` (`13:13:32`).
- Probe trực tiếp `:5000` và qua Vite proxy `:5173` đều trả `404` khi process cũ còn chạy.
- Frontend `AdminCurriculumPage.tsx` khi gặp lỗi readiness API trước đó không đặt trạng thái lỗi riêng, không xóa dữ liệu cũ/fallback và vẫn hiển thị `(0 bài)` cùng các nút nộp duyệt/xuất bản hàng loạt ở trạng thái bật.

### 1.2. Lỗi nút `+ Thêm bài` không tạo được bài và hiển thị sai trạng thái
- `AdminCurriculumPage.tsx` (`handleOpenAddLesson`) khởi tạo bài nháp mới với `status: 'PUBLISHED'` thay vì `'DRAFT'`.
- `LessonDetailDrawer.tsx` mở bài `les-new-*` ở chế độ xem thay vì chế độ chỉnh sửa, thiếu trường `lessonNumber` và `pinyin`, thiếu kiểm tra trùng `lessonNumber`, thiếu cảnh báo/xác nhận vượt chuẩn HSK 2.0 (15/15 với HSK 1), vẫn giữ ID giả `les-new-*` sau khi lưu thay vì đồng bộ `Guid` từ Backend, và chưa có thao tác `Xóa bài`.
- `curriculum.service.ts` (`syncFromApi()`) trước đó chỉ gọi `/content/lessons?pageSize=100`, làm cắt mất bài 101–140 trong tổng 140 bài HSK 1–6; `createLesson` tính `lessonNumber` theo `unitLessons.length + 1` thay vì toàn khóa học và không khóa `status: 'DRAFT'`.
- Backend (`ContentDtos.cs`, `ContentService.cs`): `CreateLessonDto.Status` mặc định là `"PUBLISHED"`, `CreateLessonAsync` chưa xác thực `UnitId` tồn tại/thuộc `CourseId`, chưa kiểm tra trùng `LessonNumber` trong khóa, và chưa chặn vượt chuẩn HSK 1–4 khi thiếu xác nhận `AllowExceedStandardLimit`. `DeleteUnitAsync` chưa chặn xóa Unit đang chứa bài học.

### 1.3. Lỗi lệch số liệu Live Counts và chuyển HSK Level trên `AdminCurriculumPage`
- Khi đổi `selectedLevelId` trên UI, `selectedCourseId` không được đồng bộ theo khóa học của HSK tương ứng (khiến các cấp độ HSK khác vẫn hiển thị danh sách Unit của HSK 1).
- Chưa có thanh thống kê số liệu đồng bộ trực tiếp từ SQL Server (số Unit, tổng bài, `PUBLISHED`, `DRAFT`, `PENDING_REVIEW`, `BLOCKED`, chuẩn HSK 2.0 `15/15/20/20`).

---

## 2. Danh sách các file đã sửa / bổ sung

### Backend
- `Backend/src/Business/Content/DTOs/ContentDtos.cs`: cập nhật `CourseDto`, `CreateLessonDto` (`Status = "DRAFT"`, validation range cho `DurationMinutes` & `XpReward`, `AllowExceedStandardLimit`), và `CoursePublicationReadinessDto` (`UnitCount`, `DraftCount`, `PendingReviewLessonCount`, `ArchivedLessonCount`, `StandardLessonTarget`, v.v.).
- `Backend/src/Business/Content/ContentService.cs`: cập nhật `GetCoursesAsync`, `GetCourseByIdAsync`, `UpdateCourseAsync`, `CreateUnitAsync`, `DeleteUnitAsync`, `ResolveStandardCurriculumLimit`, `ValidateAndNormalizeNewLessonCreation`, `CreateLessonAsync`, `UpdateLessonAsync`, `GetCourseLessonsReadinessAsync`.
- `Backend/src/Api/Controllers/ContentController.cs`: map `InvalidOperationException` sang `400 BadRequest` ở `CreateUnit` và `DeleteUnit`.
- `Backend/tests/ZhongWenHub.UnitTests/CurriculumCreationRulesTests.cs`: bổ sung unit test/theory kiểm tra quy tắc tạo bài `DRAFT` và chuẩn giới hạn HSK 1–4.

### Frontend & QA Tests
- `Fontend/src/management/admin/content/types/curriculum.types.ts`: bổ sung field đếm số lượng và `hskLevel` cho `Course`, `courseId`/`pinyin` cho `Lesson`, và `lessonNumber`/`pinyin`/`allowExceedStandardLimit` cho `UpdateLessonDTO`.
- `Fontend/src/management/admin/content/services/curriculum.service.ts`: phân trang đầy đủ (`pageSize: 500` qua các trang) trong `syncFromApi()`, khóa `status: 'DRAFT'` khi tạo bài, chuẩn hóa `lessonNumber`, bổ sung `pinyin` và `allowExceedStandardLimit`.
- `Fontend/src/management/admin/content/components/CurriculumUnitCard.tsx`: hiển thị breakdown `PUBLISHED` / `DRAFT` theo Unit và bổ sung thao tác xác nhận inline `Xóa Unit` / `Xóa bài`.
- `Fontend/src/management/admin/content/components/LessonDetailDrawer.tsx`: tự bật edit mode cho `les-new-*`, thêm input `lessonNumber` & `pinyin`, validate trùng số bài, cảnh báo & checkbox xác nhận khi vượt chuẩn HSK 2.0, khóa bài mới ở `DRAFT`, vô hiệu hóa `Mở trình soạn bài` khi còn ID tạm `les-new-*` và bật ngay với `Guid` thật sau POST thành công, thêm `Xóa bài`.
- `Fontend/src/management/admin/content/pages/AdminCurriculumPage.tsx`: đồng bộ 2 chiều `selectedCourseId` <-> `selectedLevelId`, thanh chỉ số live SQL (`curriculum-live-stats`), không hiển thị số `0` giả khi API lỗi, hiển thị thông báo `Không thể tải dữ liệu kiểm duyệt. Vui lòng kiểm tra kết nối Backend.` và vô hiệu hóa nút hàng loạt khi readiness API lỗi, reload đầy đủ sau save/delete.
- `Fontend/src/tests/curriculum-create-and-counts.test.ts`: unit test phân trang `syncFromApi` (140 bài) và tạo bài mặc định `DRAFT`.
- `Fontend/playwright.ephemeral.config.ts`: cập nhật cấu hình chạy E2E cô lập cho `ZhongWenHub_Ephemeral_QA`.
- `Fontend/e2e/curriculum-create-and-counts.spec.ts`: kịch bản E2E đầy đủ trên DB cô lập `ZhongWenHub_Ephemeral_QA`.

---

## 3. Trạng thái Readiness API & Số liệu Live SQL Server (Read-Only Probe qua Vite `:5173` -> Backend `:5000`)

Sau khi dừng process cũ và build lại `ZhongWenHub.Api.csproj` (Debug & Release, `0 Warning(s), 0 Error(s)`), process mới trên `:5000` với `Database__AutoMigrate=false`, `Database__EnableSeed=false` trả về qua cả `:5000` và Vite proxy `:5173`:

- Không có JWT token (`GET /api/v1/content/lessons/readiness?hskLevel=1`): **`401 Unauthorized`** (đã hết `404`).
- Có JWT token hợp lệ (`CONTENT_MANAGER`, `GET /api/v1/content/lessons/readiness?hskLevel=1..4` qua `:5173`): **`200 OK`**:

| Cấp độ | Units | Tổng bài (SQL) | `PUBLISHED` | `DRAFT` | `READY_TO_PUBLISH` | `PENDING_REVIEW` | `BLOCKED` | Chuẩn HSK 2.0 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| HSK 1 | 6 | 15 | 3 | 12 | 0 | 0 | 13 | 15 |
| HSK 2 | 5 | 15 | 0 | 15 | 0 | 0 | 15 | 15 |
| HSK 3 | 5 | 20 | 0 | 20 | 0 | 0 | 20 | 20 |
| HSK 4 | 5 | 20 | 0 | 20 | 0 | 0 | 20 | 20 |
| **Tổng HSK 1–4** | **21** | **70** | **3** | **67** | **0** | **0** | **68** | **70** |

Kiểm tra đọc `/api/v1/content/courses` trên `:5173` (`200 OK`): HSK 5 có `unitCount=6, totalLessons=30 (0 published, 30 draft)`; HSK 6 có `unitCount=8, totalLessons=40 (0 published, 40 draft)` (tổng toàn hệ thống HSK 1–6: `140` bài).

---

## 4. Kết quả kiểm thử (Tests & Isolated E2E)

1. **Backend Unit Tests (`dotnet test D:\ZhongWenHub\Backend\tests\ZhongWenHub.UnitTests\ZhongWenHub.UnitTests.csproj -c Release`):**
   - `Passed! Failed: 0, Passed: 79, Skipped: 0, Total: 79, Duration: 225 ms`.
2. **Frontend Unit Tests (`Set-Location D:\ZhongWenHub\Fontend; bun test src/tests`):**
   - `295 pass, 0 fail, 4305 expect() calls` across 33 files (`[433.00ms]`).
3. **Frontend TypeScript & Production Build (`Set-Location D:\ZhongWenHub\Fontend; bun run build`):**
   - `tsc -b && vite build` thành công (`2423 modules transformed`, `built in 1.33s`).
4. **Playwright E2E cô lập trên `ZhongWenHub_Ephemeral_QA` (`:5099` / `:5179`):**
   - Lệnh: `bunx playwright test e2e/curriculum-create-and-counts.spec.ts e2e/exam-repository-e2e.spec.ts --config=playwright.ephemeral.config.ts`
   - Kết quả: **`2 passed (28.2s)`**:
     - `curriculum-create-and-counts.spec.ts`: `13.5s` (tạo Unit -> thêm bài mặc định `DRAFT` -> POST API thành công với `Guid` thật -> Reload giữ nguyên dữ liệu -> cập nhật metadata -> xóa bài & Unit sạch -> kiểm tra live count tăng/giảm đúng -> giả lập lỗi `404` readiness hiển thị banner chuẩn không hiện `(0 bài)` & khóa nút batch -> khôi phục `200 OK` -> kiểm tra regression HSK 1–4).
     - `exam-repository-e2e.spec.ts`: `13.9s`.
5. **Cleanup & Read-Only DB Audit sau E2E:**
   - Đã drop `ZhongWenHub_Ephemeral_QA` (`DB_ID('ZhongWenHub_Ephemeral_QA'): None`).
   - `AUDIT ZhongWenHub_Test (ReadOnly): HSK1 PublishedLessons=3, ExamTables=0`
   - `AUDIT ZhongWenHub_Dev (ReadOnly): HSK1 PublishedLessons=3, ExamTables=0`
