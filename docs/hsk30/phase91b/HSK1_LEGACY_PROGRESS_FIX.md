# ZHONGWENHUB — BÁO CÁO KHẮC PHỤC TIẾN ĐỘ HỌC VIÊN CŨ (HSK 1 LEGACY PROGRESS SAFETY)

**Tài liệu:** `docs/hsk30/phase91b/HSK1_LEGACY_PROGRESS_FIX.md`  
**Giai đoạn:** Phase 9.1B — Task B  
**Ngày thực hiện:** 09/11/2026  
**Trạng thái:** HOÀN THÀNH — ĐÃ KIỂM ĐỊNH TỰ ĐỘNG (38/38 Unit Tests, 81/81 Integration Tests)

---

## I. NGUYÊN NHÂN PHÁT SINH CHUỖI 'les-1' TRONG DATABASE

### 1. Vị trí mã nguồn gây lỗi
Qua kiểm toán toàn diện mã nguồn Backend, chuỗi hardcoded `'les-1'` bắt nguồn từ 3 vị trí cụ thể:
1. `Backend/src/Business/Learning/LearningService.cs:46, 59`:
   - Hàm `GetOrCreateProfileAsync`: Khi khởi tạo hồ sơ học viên mới (`StudentLearningProfile`), trường `CurrentLessonId` được gán cứng `'les-1'`. Đồng thời, một bản ghi `StudentLessonProgress` ban đầu cũng được thêm với `LessonId = "les-1"`.
2. `Backend/src/Data/Entities/Learning/StudentLearningProfile.cs:9`:
   - Giá trị mặc định của thuộc tính `CurrentLessonId` trong entity là `"les-1"`.
3. `Backend/src/Business/Learning/DTOs/StudentLearningStateDto.cs:16`:
   - Giá trị mặc định của thuộc tính DTO `CurrentLessonId` là `"les-1"`.

### 2. Dữ liệu thực tế phát sinh trên `ZhongWenHub_Dev`
- Tổng số bản ghi trong bảng `student_lesson_progress`: **14 bản ghi**.
- Bản ghi sử dụng GUID chuẩn (`aaaaaaaa-1111-1111-1111-111111111111`): **1 bản ghi**.
- Bản ghi lưu chuỗi legacy `'les-1'`: **13 bản ghi** (tương ứng với các tài khoản được khởi tạo hồ sơ học tập).

### 3. Nguy cơ lỗi ép kiểu (Type Conversion Crash 8169)
- Cột `lessons.Id` là kiểu `uniqueidentifier` (GUID).
- Cột `student_lesson_progress.LessonId` là kiểu `nvarchar(450)`.
- Khi thực hiện truy vấn SQL JOIN hoặc so sánh con trực tiếp (`student_lesson_progress.LessonId = lessons.Id`), SQL Server cố gắng chuyển đổi chuỗi `'les-1'` sang kiểu `uniqueidentifier`. Việc này dẫn đến lỗi nghiêm trọng:
  ```
  Conversion failed when converting from a character string to uniqueidentifier. (Error 8169)
  ```
- Lỗi này từng làm sập API learning khi học viên truy cập trang học tập.

---

## II. GIẢI PHÁP KHẮC PHỤC TRIỆT ĐỂ Ở BACKEND

### 1. Chuẩn hóa GUID Lesson 1 và Khởi tạo Mới
- Đặt hằng số chuẩn hóa trong `LearningService`:
  ```csharp
  public const string Lesson1Guid = "aaaaaaaa-1111-1111-1111-111111111111";
  public const string LegacyLesson1Id = "les-1";
  ```
- Cập nhật giá trị mặc định trong `StudentLearningProfile` và `StudentLearningStateDto` sang `Lesson1Guid`.
- Trong `GetOrCreateProfileAsync`: Mọi học viên mới được cấp `CurrentLessonId = Lesson1Guid` và bản ghi tiến độ đầu tiên với `LessonId = Lesson1Guid`.

### 2. Cơ chế Tương thích Ngược An toàn (Backward Compatibility & Safe Aliasing)
Đã triển khai hai phương thức tĩnh trong `LearningService`:
- `NormalizeLessonId(string? lessonId)`: Chuẩn hóa bất kỳ chuỗi đầu vào nào (`"les-1"`, `"LES-1"`, `"  les-1  "`) thành `Lesson1Guid` dạng chữ thường (`"aaaaaaaa-1111-1111-1111-111111111111"`). Nếu là GUID khác, chuẩn hóa về dạng chữ thường và cắt khoảng trắng.
- `IsLesson1(string? lessonId)`: Nhận diện chính xác Lesson 1 ở cả hai định dạng.

Khi trả về dữ liệu qua API:
- `GetStudentLearningStateAsync`:
  - `state.CurrentLessonId` luôn trả về GUID chuẩn.
  - `state.CompletedLessonIds` được chuẩn hóa thành danh sách GUID duy nhất (`Distinct`).
  - Trong từ điển `state.LessonProgress`: Lưu trữ key chính thức là GUID chuẩn (`Lesson1Guid`), đồng thời ánh xạ thêm key phụ (`"les-1"`) trỏ cùng vào đối tượng tiến độ. Nhờ đó, cả frontend mới dùng GUID lẫn các component/test legacy dùng `"les-1"` đều đọc được đúng tiến độ mà không bao giờ bị lệch.

### 3. Cập nhật và Hoàn thành Bài học Không Trùng Lặp
Trong `UpdateLessonStepAsync` và `CompleteLessonAsync`:
- Tìm kiếm bản ghi hiện có với điều kiện an toàn:
  ```csharp
  l.UserId == userId && (l.LessonId == normalizedId || (isLesson1 && l.LessonId == LegacyLesson1Id))
  ```
- Khi phát hiện bản ghi cũ đang mang `LessonId == "les-1"`, hệ thống tự động di trú mượt mà (`lesson.LessonId = Lesson1Guid`), không xóa dữ liệu, không tạo thêm bản ghi trùng lặp.
- Mã định danh sự kiện nhận thưởng XP được tạo theo GUID chuẩn:
  ```csharp
  var eventId = $"lesson_complete_{normalizedId}";
  ```
  Đảm bảo tính lũy đẳng (idempotent), không cấp đúp điểm thưởng khi gọi qua alias.

### 4. Cách ly Dữ liệu Tuyệt đối Giữa Các Học viên (User Isolation)
- Mọi truy vấn tiến độ, bước học và hoàn thành bài đều lọc theo `UserId` trích xuất trực tiếp từ JWT Claims của phiên đăng nhập (`GetCurrentUserId()`).
- Học viên A không thể xem, sửa hoặc ghi đè tiến độ của học viên B dưới bất kỳ hình thức nào.

---

## III. KẾT QUẢ KIỂM THỬ XÁC MINH

### 1. Unit Tests (`ZhongWenHub.UnitTests`)
Đã bổ sung bộ kiểm thử `StudentProgressSafetyTests.cs`:
- `NormalizeLessonId_ValidInputs_ReturnsNormalizedGuid`: Kiểm tra chuyển đổi các biến thể `'les-1'`, `'LES-1'`, GUID hoa/thường về GUID chuẩn.
- `NormalizeLessonId_NullOrWhitespace_ReturnsEmptyString`: Kiểm tra an toàn trước null/rỗng.
- `IsLesson1_IdentifiesLesson1Correctly`: Kiểm tra nhận diện Lesson 1.
- `EntityAndDtoDefaults_UseLesson1Guid_InsteadOfLegacyString`: Đảm bảo giá trị mặc định của entity và DTO không còn chuỗi `'les-1'`.

**Kết quả Unit Tests:** **38/38 tests PASSED (100%)**.

### 2. Integration Tests (`ZhongWenHub.IntegrationTests`)
Đã bổ sung kiểm thử tích hợp trên cơ sở dữ liệu kiểm thử `ZhongWenHub_Test`:
- `LegacyProgressCompatibility_WithLes1AndGuid_HandlesBothGracefullyWithoutCrash`:
  1. Gửi request cập nhật sở thích với `CurrentLessonId = "les-1"` -> API trả về `CurrentLessonId` đã chuẩn hóa thành `aaaaaaaa-1111-1111-1111-111111111111`.
  2. Gọi cập nhật bước học với `les-1` -> Trả về HTTP 200 OK, không crash SQL Server.
  3. Tiếp tục gọi cập nhật bước học với GUID chuẩn -> Cập nhật cùng bản ghi, không sinh bản ghi thứ hai.
  4. Lấy danh sách toàn bộ tiến độ (`GET /api/v1/learning/me/lessons`) -> Xác nhận chỉ tồn tại đúng 1 bản ghi duy nhất cho Lesson 1.

**Kết quả Integration Tests:** **81/81 tests PASSED (100%)**.

### 3. Trạng thái Database `ZhongWenHub_Dev`
- Số lượng users: **39 (không đổi)**.
- Số lượng lessons: **140 (3 PUBLISHED, 137 DRAFT — không đổi)**.
- Số lượng student_lesson_progress: **14 (13 les-1, 1 GUID — bảo lưu nguyên vẹn, không ghi/xóa trên Dev)**.
