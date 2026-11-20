# ZHONGWENHUB — BÁO CÁO KIỂM THỬ BẢO MẬT & RELEASE GATE BACKEND (PHASE 8.1)
**Mã tài liệu:** HSK30_PHASE81_RELEASE_SECURITY_TESTS.md  
**Hệ thống:** ZhongWenHub Language Learning Platform  
**Phiên bản kiểm toán:** Phase 8.1 Final Integrity & Release Security Verification  
**Thời gian thực hiện:** 2026-11-09  
**Kết quả kiểm thử:** 8 / 8 Tình huống bảo mật & Release Gate đạt chuẩn (74 / 74 Integration Tests PASS)

---

## 1. PHÂN TÍCH VÀ XÁC MINH MÃ NGUỒN TẦNG BACKEND

Đã kiểm tra trực tiếp mã nguồn thực tế tại 4 tệp lõi của phân hệ Quản lý Học liệu:

1. [`Backend/src/Api/Controllers/ContentController.cs`](file:///d:/ZhongWenHub/Backend/src/Api/Controllers/ContentController.cs):
   - Áp dụng bộ lọc quyền nghiêm ngặt `[Authorize(Policy = PolicyConstants.ContentManagementAccess)]` trên cả 2 endpoint phát hành:
     - `GET /api/v1/content/lessons/{id}/release-readiness`
     - `PUT /api/v1/content/lessons/{id}/status`
   - Bắt và phân loại ngoại lệ cụ thể để trả về mã lỗi nhất quán:
     - `ArgumentException` → `400 Bad Request` kèm `{ "code": "INVALID_STATUS" }`
     - `InvalidOperationException` → `400 Bad Request` kèm `{ "code": "RELEASE_GATE_VALIDATION_FAILED" }`
     - Không tìm thấy tài nguyên → `404 Not Found` kèm `{ "code": "LESSON_NOT_FOUND" }`
2. [`Backend/src/Business/Content/ContentService.cs`](file:///d:/ZhongWenHub/Backend/src/Business/Content/ContentService.cs):
   - **Xác thực trạng thái hợp lệ:** Chỉ chấp nhận `DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `ARCHIVED`. Bất kỳ chuỗi trạng thái lạ nào đều bị từ chối ngay lập tức.
   - **Ngăn chặn nhảy cóc Workflow:** Bài học thực tế đang ở trạng thái `DRAFT` không được phép chuyển thẳng sang `PUBLISHED`. Bắt buộc phải qua trạng thái `PENDING_REVIEW` để người có thẩm quyền kiểm duyệt.
   - **Release Gate Validation:** Quét toàn diện 7 tiêu chí:
     1. Kịch bản hội thoại tồn tại và có tối thiểu 2 lượt thoại.
     2. Không còn bất kỳ chữ Hán nào rò rỉ trong Pinyin hoặc nghĩa Tiếng Việt của hội thoại.
     3. Kịch bản luyện nghe tồn tại và có tối thiểu 1 câu hỏi.
     4. Không còn bất kỳ chữ Hán nào rò rỉ trong Pinyin hoặc nghĩa Tiếng Việt của bài nghe.
     5. Số lượng từ vựng liên kết $\ge 5$.
     6. Số lượng điểm ngữ pháp liên kết $\ge 1$.
     7. Số lượng bài tập tương tác kiểm tra $\ge 1$.
3. [`Backend/src/Business/Content/IContentService.cs`](file:///d:/ZhongWenHub/Backend/src/Business/Content/IContentService.cs):
   - Khai báo giao diện hợp đồng nghiệp vụ `GetLessonReleaseReadinessAsync` và `UpdateLessonStatusAsync`.
4. [`Backend/src/Business/Content/DTOs/ContentDtos.cs`](file:///d:/ZhongWenHub/Backend/src/Business/Content/DTOs/ContentDtos.cs):
   - Định nghĩa `LessonReleaseReadinessDto` và `UpdateContentStatusDto` với các thuộc tính phản ánh đầy đủ tình trạng khóa phát hành.

---

## 2. DANH SÁCH 8 BÀI KIỂM THỬ TÍCH HỢP BỔ SUNG (INTEGRATION TESTS)

Tệp kiểm thử mới [`Backend/tests/ZhongWenHub.IntegrationTests/LessonReleaseGateIntegrationTests.cs`](file:///d:/ZhongWenHub/Backend/tests/ZhongWenHub.IntegrationTests/LessonReleaseGateIntegrationTests.cs) đã được bổ sung và thực thi thành công 100%:

| STT | Tên bài kiểm thử | Kịch bản kiểm tra | Mã phản hồi & Code | Kết quả |
|:---:|:---|:---|:---:|:---:|
| 1 | `Student_AttemptToPublishLesson_ReturnsForbidden` | Tài khoản Student cố tình gửi request PUT cập nhật bài học sang PUBLISHED | `403 Forbidden` | **PASS** |
| 2 | `Anonymous_AttemptToAccessReleaseReadinessOrStatus_ReturnsUnauthorized` | Người dùng vãng lai chưa đăng nhập gọi API kiểm tra readiness hoặc cập nhật status | `401 Unauthorized` | **PASS** |
| 3 | `Lesson_NonExistentId_ReturnsNotFound_WithConsistentCode` | Yêu cầu cập nhật hoặc kiểm tra bài học với GUID không tồn tại trong CSDL | `404 Not Found`<br>`code: LESSON_NOT_FOUND` | **PASS** |
| 4 | `Lesson_InvalidStatus_ReturnsBadRequest_WithConsistentCode` | Gửi chuỗi trạng thái không nằm trong danh mục (ví dụ `INVALID_STATUS_XYZ`) | `400 Bad Request`<br>`code: INVALID_STATUS` | **PASS** |
| 5 | `ProductionLesson_Draft_CannotDirectlyTransitionToPublished_WithoutPendingReview` | Cố tình chuyển bài học thật từ `DRAFT` thẳng sang `PUBLISHED` mà chưa qua `PENDING_REVIEW` | `400 Bad Request`<br>`code: RELEASE_GATE_VALIDATION_FAILED` | **PASS** |
| 6 | `Lesson_Workflow_Draft_To_PendingReview_Succeeds` | Biên tập viên chuyển bài học từ `DRAFT` sang `PENDING_REVIEW` để chuẩn bị kiểm duyệt | `200 OK`<br>`status: PENDING_REVIEW` | **PASS** |
| 7 | `Lesson_MissingExercisesOrVocab_PublishAttempt_RejectedWithBlockers` | Cố tình xuất bản bài học chưa đủ từ vựng hoặc thiếu bài tập kiểm tra | `400 Bad Request`<br>`code: RELEASE_GATE_VALIDATION_FAILED` | **PASS** |
| 8 | `Lesson_WithLeakedHanziInPinyinOrVi_PublishAttempt_RejectedImmediately` | Cố tình xuất bản bài học có chữ Hán sót lại trong trường Pinyin hoặc Tiếng Việt | `400 Bad Request`<br>`code: RELEASE_GATE_VALIDATION_FAILED` | **PASS** |

> **Quy tắc an toàn dữ liệu kiểm thử:** Tất cả các test case tạo dữ liệu tạm đều được bọc trong khối `try / finally` để tự dọn dẹp các thực thể kiểm thử trên cơ sở dữ liệu `ZhongWenHub_Test`. Hoàn toàn không để lại bản ghi rác và không tác động đến `ZhongWenHub_Dev`.

---

## 3. BẰNG CHỨNG THỰC TẾ TRÊN LIVE API (PORT 5000)

Đã thực hiện các request trực tiếp đến máy chủ Web API đang chạy:

### 3.1. Kịch bản Student cố tình xuất bản bài học
- **Request:**
  ```http
  PUT /api/v1/content/lessons/aaaaaaaa-4444-4444-4444-444444444444/status HTTP/1.1
  Host: 127.0.0.1:5000
  Authorization: Bearer <Student_Token>
  Content-Type: application/json

  {"status": "PUBLISHED"}
  ```
- **Response:**
  ```http
  HTTP/1.1 403 Forbidden
  ```
- **Xác nhận:** Sinh viên bị chặn tuyệt đối ở tầng Middleware Authorization.

### 3.2. Kịch bản chuyển trực tiếp từ DRAFT sang PUBLISHED
- **Request:**
  ```http
  PUT /api/v1/content/lessons/aaaaaaaa-4444-4444-4444-444444444444/status HTTP/1.1
  Host: 127.0.0.1:5000
  Authorization: Bearer <Admin_Token>
  Content-Type: application/json

  {"status": "PUBLISHED"}
  ```
- **Response:**
  ```http
  HTTP/1.1 400 Bad Request
  Content-Type: application/json

  {
    "message": "Quy trình xuất bản yêu cầu bài học phải trải qua bước kiểm duyệt (PENDING_REVIEW) và có sự phê duyệt của người có thẩm quyền trước khi xuất bản (PUBLISHED).",
    "code": "RELEASE_GATE_VALIDATION_FAILED"
  }
  ```
- **Xác nhận:** API kiên quyết từ chối phát hành nếu bài học chưa qua quy trình tiền kiểm duyệt.

### 3.3. Kịch bản truyền trạng thái không hợp lệ
- **Request:** `PUT /api/v1/content/lessons/aaaaaaaa-4444-4444-4444-444444444444/status` với body `{"status": "INVALID_STATUS_ABC"}`
- **Response:**
  ```http
  HTTP/1.1 400 Bad Request
  Content-Type: application/json

  {
    "message": "Trạng thái 'INVALID_STATUS_ABC' không hợp lệ.",
    "code": "INVALID_STATUS"
  }
  ```

### 3.4. Kịch bản kiểm tra bài học không tồn tại
- **Request:** `PUT /api/v1/content/lessons/00000000-0000-0000-0000-000000000000/status`
- **Response:**
  ```http
  HTTP/1.1 404 Not Found
  Content-Type: application/json

  {
    "message": "Không tìm thấy bài học với ID 00000000-0000-0000-0000-000000000000.",
    "code": "LESSON_NOT_FOUND"
  }
  ```

---

## 4. KẾT LUẬN

Hệ thống Release Readiness Gate và cơ chế kiểm soát quyền tại tầng Backend ASP.NET Core 8 đã được chứng minh hoạt động hoàn toàn chính xác, nhất quán và an toàn trước mọi hình thức truy cập sai thẩm quyền hoặc cố tình vi phạm quy trình phát hành học liệu.
