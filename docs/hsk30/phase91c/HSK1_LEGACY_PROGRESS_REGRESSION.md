# BÁO CÁO KIỂM THỬ HỒI QUY TIẾN ĐỘ HỌC TẬP
## LEGACY PROGRESS SAFE ALIASING & USER PROGRESSION REGRESSION AUDIT

- **Dự án**: ZhongWenHub Core Learning Service
- **Test Suite**: `Backend/tests/ZhongWenHub.IntegrationTests/LearningIntegrationTests.cs`
- **Kết quả thực thi**: **8/8 Tests Passed (100%)**
- **Cơ sở dữ liệu kiểm thử**: `ZhongWenHub_Test`

---

## 1. MỤC TIÊU VÀ BỐI CẢNH KIỂM THỬ

Trong quá trình chuyển đổi kiến trúc dữ liệu từ định danh mã chuỗi cũ (`les-1`, `les-2`, ...) sang chuẩn định danh toàn cầu GUID (`Guid`), hệ thống phải đảm bảo:
1. Người dùng cũ có tiến độ lưu bằng `les-1` không bị mất dữ liệu hoặc crash màn hình.
2. Ứng dụng Frontend và Mobile gọi API bằng slug cũ hoặc GUID mới đều được xử lý đồng nhất thông qua cơ chế Safe Aliasing.
3. Các yêu cầu tới bài học không tồn tại phải trả về mã lỗi `404 Not Found` tiêu chuẩn (RFC 7231), không được gây lỗi sập máy chủ `500 Internal Server Error`.
4. Điểm thưởng kinh nghiệm (XP) phải đảm bảo tính lũy đẳng (Idempotency).
5. Dữ liệu tiến độ giữa các học viên phải cách ly hoàn toàn (Data Isolation).

---

## 2. KẾT QUẢ KIỂM THỬ 5 KỊCH BẢN CHÍNH (8/8 TESTS PASSED)

| Kịch bản kiểm thử | Test Method tương ứng | Kết quả thực tế | Trạng thái |
| :--- | :--- | :--- | :---: |
| **1. Request với GUID thực tế** | `LegacyProgressCompatibility_WithLes1AndGuid_HandlesBothGracefullyWithoutCrash` | Cập nhật tiến độ thành công, chỉ ghi 1 bản ghi duy nhất trong `student_lesson_progress`. | **PASSED** |
| **2. Request với Legacy Slug (`les-1`, `les-2`, `les-3`)** | `LegacyProgressCompatibility_WithLes1AndGuid_HandlesBothGracefullyWithoutCrash` | Tự động ánh xạ sang GUID chuẩn, phản hồi mã `200 OK` và trả về cấu trúc tiến độ tương thích. | **PASSED** |
| **3. Request với ID không tồn tại (`les-999`, random GUID)** | `NonExistentLesson_ReturnsNotFound` | Phản hồi chính xác mã `404 Not Found` (ProblemDetails), thông báo lỗi rõ ràng, không gây crash 500. | **PASSED** |
| **4. Tính lũy đẳng của điểm XP (XP Idempotency)** | `UpdateLessonStepAndComplete_PersistsInDatabaseAndIsIdempotent` | Hoàn thành bài học nhiều lần liên tiếp không làm tăng tổng XP vượt quá mức quy định. | **PASSED** |
| **5. Cách ly tiến độ người dùng (User Isolation)** | `UserIsolation_ProgressDoesNotLeakBetweenStudents` | Cập nhật tiến độ của Student A không bị lộ hoặc ảnh hưởng sang hồ sơ học tập của Student B. | **PASSED** |

---

## 3. CHI TIẾT KỸ THUẬT CƠ CHẾ SAFE ALIASING

Trong `Backend/src/Business/Learning/LearningService.cs`:
- Hàm `ResolveAndValidateLessonIdAsync`:
  - Kiểm tra nếu `lessonId` bắt đầu bằng `les-` hoặc `les_`: phân tích số thứ tự bài học, đối chiếu với danh sách bài học thực tế trong bảng `Lessons`.
  - Nếu tìm thấy: trả về chuỗi GUID chuẩn hóa dạng chữ thường.
  - Nếu là bài học số 1: ánh xạ sang `aaaaaaaa-1111-1111-1111-111111111111`.
  - Nếu không tồn tại: quăng ngoại lệ `KeyNotFoundException`.
- Trong `Backend/src/Api/Middleware/ProblemDetailsMiddleware.cs`:
  - Bắt giữ `KeyNotFoundException` và chuyển đổi trực tiếp thành mã HTTP `404 Not Found` kèm `ApiProblemDetailsDto` chuẩn RFC.
- Trong phản hồi DTO `StudentLearningStateDto`:
  - Hồ sơ tiến độ bài học số 1 luôn được bổ sung cả 2 khóa: khóa GUID chuẩn và khóa alias `les-1`, giúp các màn hình Frontend cũ tiếp tục hiển thị tiến độ mà không cần sửa mã hàng loạt.
