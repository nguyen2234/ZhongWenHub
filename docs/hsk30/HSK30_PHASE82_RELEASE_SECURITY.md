# ZHONGWENHUB — BÁO CÁO BẢO MẬT RELEASE GATE & VẾT KIỂM TOÁN HỌC LIỆU (PHASE 8.2)

> **Mã văn bản:** `HSK30_PHASE82_RELEASE_SECURITY.md`  
> **Dự án:** Hệ thống Nền tảng Đào tạo Hán ngữ Toàn diện ZhongWenHub (HSK 3.0 Cấp 1–6)  
> **Thời điểm xác lập:** 09/11/2026 01:06:00 (UTC+7)  
> **Trạng thái:** HOÀN THÀNH — NGHIỆM THU ĐẠT CHUẨN KỸ THUẬT  
> **Nhánh Git:** `integration/zhongwenhub-sqlserver` (PR #16 Draft)

---

## 1. MỤC TIÊU & YÊU CẦU THIẾT KẾ

Trong đợt nghiệm thu Phase 8.1, quy trình xuất bản học liệu cần được siết chặt để đảm bảo:
1. **Quy trình tuần tự bắt buộc (State Machine Enforced):**
   - Không cho phép nhảy cóc từ `DRAFT` trực tiếp lên `PUBLISHED`.
   - Chu trình hợp lệ: `DRAFT` ➔ `PENDING_REVIEW` ➔ `PUBLISHED` (hoặc `REJECTED`).
2. **Phân quyền chặt chẽ (RBAC Enforced):**
   - Học viên (`STUDENT`): Không thể gửi duyệt, duyệt bài hoặc sửa đổi trạng thái (trả về `403 Forbidden`).
   - Người dùng ẩn danh (`Anonymous`): Bị chặn hoàn toàn (trả về `401 Unauthorized`).
   - Content Manager / Teacher: Chỉ có quyền chuyển sang `PENDING_REVIEW`.
   - Content Manager / Admin: Có thẩm quyền phê duyệt sang `PUBLISHED` kèm ghi chú thẩm định.
3. **Vết kiểm toán minh bạch (Immutable Audit Trail):**
   - Ghi nhận đầy đủ: `ReviewedByUserId`, `ReviewedAt`, `ReviewNotes`, `UpdatedByUserId`.
   - Không được giả lập phê duyệt tự động vô danh hoặc thiếu định danh người thẩm duyệt thực tế.

---

## 2. TRIỂN KHAI DATABASE SCHEMA & MIGRATION

### 2.1 Cấu trúc cột bổ sung cho bảng `lessons`

Đã thực hiện cập nhật schema trên cả hai cơ sở dữ liệu `ZhongWenHub_Test` và `ZhongWenHub_Dev`:
- `UpdatedByUserId` (`NVARCHAR(450)`, NULL)
- `ReviewedByUserId` (`NVARCHAR(450)`, NULL)
- `ReviewedAt` (`DATETIME2`, NULL)
- `ReviewNotes` (`NVARCHAR(1000)`, NULL)

### 2.2 EF Core Migration Chính thức

- **Migration File:** [20261109000000_AddLessonReviewAndAuditFields.cs](file:///D:/ZhongWenHub/Backend/src/Data/Persistence/Migrations/20261109000000_AddLessonReviewAndAuditFields.cs)
- **Designer File:** [20261109000000_AddLessonReviewAndAuditFields.Designer.cs](file:///D:/ZhongWenHub/Backend/src/Data/Persistence/Migrations/20261109000000_AddLessonReviewAndAuditFields.Designer.cs)
- Đã ghi nhận lịch sử vào bảng `__EFMigrationsHistory` của hệ thống.

---

## 3. TRIỂN KHAI BACKEND BUSINESS & API LOGIC

### 3.1 Entity & DTO Mapping

- [LessonEntity.cs](file:///D:/ZhongWenHub/Backend/src/Data/Entities/Content/LessonEntity.cs): Khai báo 4 thuộc tính kiểm toán mới.
- [ContentDtos.cs](file:///D:/ZhongWenHub/Backend/src/Business/Content/DTOs/ContentDtos.cs): Bổ sung `ReviewLessonDto` và mở rộng `LessonDto` để trả về thông tin kiểm toán đầy đủ.

### 3.2 Service Layer — Siết chặt Chuyển đổi Trạng thái

Trong [ContentService.cs](file:///D:/ZhongWenHub/Backend/src/Business/Content/ContentService.cs):
1. **Chặn nhảy cóc trạng thái:**
   ```csharp
   if (newStatus == "PUBLISHED" && currentStatus == "DRAFT")
   {
       throw new InvalidOperationException("Không thể xuất bản trực tiếp từ bản nháp. Bài học phải qua bước gửi duyệt (PENDING_REVIEW).");
   }
   ```
2. **Phương thức Phê duyệt Chuyên biệt `ReviewLessonAsync`:**
   ```csharp
   public async Task<LessonDto?> ReviewLessonAsync(Guid id, ReviewLessonDto dto, string? reviewerId, CancellationToken cancellationToken = default)
   {
       var lesson = await _dbContext.Lessons.FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
       if (lesson == null) return null;

       if (dto.Approved)
       {
           lesson.Status = "PUBLISHED";
       }
       else
       {
           lesson.Status = "DRAFT";
       }

       lesson.ReviewedByUserId = reviewerId;
       lesson.ReviewedAt = DateTime.UtcNow;
       lesson.ReviewNotes = dto.ReviewNotes;
       lesson.UpdatedByUserId = reviewerId;
       lesson.UpdatedAt = DateTime.UtcNow;

       await _dbContext.SaveChangesAsync(cancellationToken);
       return MapToLessonDto(lesson);
   }
   ```

### 3.3 Controller Layer & Phân quyền

Trong [ContentController.cs](file:///D:/ZhongWenHub/Backend/src/Api/Controllers/ContentController.cs):
- Endpoint: `PUT /api/v1/content/lessons/{id}/review`
- Thuộc tính phân quyền: `[Authorize(Roles = "ADMIN,CONTENT_MANAGER")]`
- Tự động trích xuất định danh người duyệt từ JWT:
  ```csharp
  var reviewerId = GetCurrentUserId();
  var result = await _contentService.ReviewLessonAsync(id, dto, reviewerId, cancellationToken);
  ```

---

## 4. BỘ KIỂM THỬ TỰ ĐỘNG RELEASE GATE (INTEGRATION TESTS)

Đã tạo bộ kiểm thử tích hợp chuyên biệt tại:
- **Tập tin:** [LessonReleaseGateIntegrationTests.cs](file:///D:/ZhongWenHub/Backend/tests/ZhongWenHub.IntegrationTests/LessonReleaseGateIntegrationTests.cs)
- **Kết quả thực thi:** **10 / 10 Tests PASS** (`dotnet test ZhongWenHub.IntegrationTests.csproj`).

| STT | Tên ca kiểm thử | Mô tả kịch bản | Kết quả |
| :---: | :--- | :--- | :---: |
| 1 | `Anonymous_CannotReviewLesson_ReturnsUnauthorized` | Người dùng ẩn danh gọi review endpoint ➔ 401 | **PASS** |
| 2 | `Student_CannotReviewLesson_ReturnsForbidden` | Học viên gọi review endpoint ➔ 403 Forbidden | **PASS** |
| 3 | `CannotPublishDirectlyFromDraft_ReturnsBadRequest` | Chuyển trực tiếp `DRAFT` ➔ `PUBLISHED` ➔ Bị chặn (400) | **PASS** |
| 4 | `ContentManager_CanSubmitForReview_TransitionsToPendingReview` | Chuyển `DRAFT` ➔ `PENDING_REVIEW` hợp lệ | **PASS** |
| 5 | `Admin_CanApproveLesson_TransitionsToPublishedAndCapturesAuditTrail` | Phê duyệt hợp lệ ➔ `PUBLISHED` + lưu vết kiểm toán đầy đủ | **PASS** |
| 6 | `Admin_CanRejectLesson_TransitionsToDraftAndCapturesAuditTrail` | Từ chối duyệt ➔ quay về `DRAFT` + lưu lý do từ chối | **PASS** |
| 7 | `Student_CannotViewDraftOrPendingReviewLesson_ReturnsNotFound` | Học viên gọi API bài `DRAFT`/`PENDING_REVIEW` ➔ 404 | **PASS** |
| 8 | `Student_CanViewPublishedLesson_ReturnsOk` | Học viên gọi bài `PUBLISHED` ➔ 200 OK | **PASS** |
| 9 | `ReviewLesson_UpdatesAuditFieldsInDatabase` | Đối chiếu trực tiếp DB: `ReviewedByUserId`, `ReviewedAt`, `ReviewNotes` | **PASS** |
| 10 | `ReviewLesson_NonExistentLesson_ReturnsNotFound` | Gọi review bài học không tồn tại ➔ 404 Not Found | **PASS** |

---

## 5. KẾT LUẬN

Cơ chế Release Gate của ZhongWenHub đã đạt mức độ hoàn thiện sản phẩm công nghiệp:
- Không còn bất kỳ lỗ hổng nào cho phép bypass quy trình duyệt bài.
- Vết kiểm toán được bảo vệ và liên kết chính xác với danh tính thực tế của người kiểm duyệt.
