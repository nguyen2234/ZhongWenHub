# BÁO CÁO KIỂM THỬ TÍNH ĐỒNG THỜI (CONCURRENCY) VÀ BẢO TOÀN DỮ LIỆU CŨ (LEGACY PROGRESS)

**Dự án:** ZhongWenHub  
**Hợp phần kiểm thử:** ASP.NET Core Learning Engine & SQL Server EF Core Data Layer  
**Bộ test tích hợp:** `Backend/tests/ZhongWenHub.IntegrationTests/LearningIntegrationTests.cs`  
**Cơ sở dữ liệu thực thi:** `ZhongWenHub_Test`  
**Kết quả kiểm thử:** **9 / 9 Integration Tests PASS (0 thất bại)**  

---

## 1. MỤC TIÊU VÀ BỐI CẢNH KIỂM THỬ

1. **Khả năng chịu tải và tính đồng thời:** Trong môi trường lớp học hoặc ứng dụng thực tế, nhiều thiết bị của cùng một học viên có thể gửi đồng thời nhiều requests cập nhật bước học, nộp bài kiểm tra hoặc nhận thưởng XP. Cần bảo đảm SQL Server không bị deadlock và điểm thưởng không bị tính lặp lại.
2. **Bảo toàn dữ liệu người dùng cũ:** Hệ thống bài học ban đầu sử dụng mã định danh dạng chuỗi rút gọn (`les-1`, `les-2`, `les-3`), trong khi hệ thống cơ sở dữ liệu mới sử dụng định dạng UUID (`aaaaaaaa-1111-1111-1111-111111111111`). Cần bảo đảm tiến độ cũ của học viên tiếp tục hoạt động trơn tru và không bị nhân đôi dữ liệu.
3. **Cách ly dữ liệu người dùng (Tenant/User Isolation):** Tuyệt đối không để rò rỉ dữ liệu bài học giữa các học viên.

---

## 2. KẾT QUẢ KIỂM THỬ TÍNH ĐỒNG THỜI (CONCURRENCY)

### Kịch bản kiểm thử:
- **Test case:** `ConcurrentProgressUpdates_HandlesParallelRequestsWithoutDeadlockOrDuplicateXp`
- **Số lượng requests song song:** 10 requests HTTP PUT gửi đồng thời tới endpoint `/api/v1/learning/me/lessons/{lessonId}/progress` cho cùng một mã học viên trên bài học số 1.
- **Tiêu chí đánh giá:**
  + 10/10 requests đều hoàn thành với HTTP Status `200 OK`.
  + Không xuất hiện lỗi Transaction Deadlock (SQL Server Error 1205).
  + Không xuất hiện lỗi 500 Internal Server Error do tranh chấp khóa chính/khóa ngoại.
  + Trạng thái bài học cuối cùng phản ánh chính xác bước học lớn nhất đã mở khóa.

### Kết quả đo lường:
- **Thời gian xử lý 10 requests song song:** ~320ms.
- **Tỷ lệ thành công:** **10 / 10 (100%)**.
- **Tính lũy đẳng (Idempotency):** Điểm thưởng XP và các sự kiện ghi nhận thưởng (như `lesson_complete_les-1`) được lưu trữ theo danh sách duy nhất `RewardedEventIds`. Khi học viên nộp bài hoàn thành nhiều lần, điểm XP giữ nguyên không tăng thêm.

---

## 3. KẾT QUẢ BẢO TOÀN DỮ LIỆU CŨ (LEGACY PROGRESS)

### Kịch bản kiểm thử:
- **Test case:** `LegacyProgressCompatibility_WithLes1AndGuid_HandlesBothGracefullyWithoutCrash`
1. **Truy vấn bằng mã cũ `les-1`:**
   - Học viên cập nhật sở thích học tập với `CurrentLessonId = "les-1"`.
   - Backend tự động nhận diện và ánh xạ chuẩn hóa sang UUID `aaaaaaaa-1111-1111-1111-111111111111`.
   - Từ điển `LessonProgress` trả về đầy đủ cả hai khóa để hỗ trợ các phiên bản frontend cũ và mới tương thích 100%.
2. **Cập nhật bước học bằng `les-1` rồi cập nhật tiếp bằng UUID:**
   - Cập nhật bước 2 bằng `les-1`.
   - Cập nhật bước 4 bằng UUID `aaaaaaaa-1111-1111-1111-111111111111`.
   - **Xác thực:** Hệ thống cập nhật trên đúng 1 bản ghi duy nhất trong bảng `student_lesson_progress`, không tạo bản ghi trùng lặp (No Duplicate Key Violation).
   - Truy vấn danh sách `/api/v1/learning/me/lessons` trả về đúng 1 bản ghi duy nhất cho Bài 1 với bước học hiện tại là 4.

---

## 4. KẾT QUẢ CÁCH LY DỮ LIỆU GIỮA CÁC HỌC VIÊN

### Kịch bản kiểm thử:
- **Test case:** `UserIsolation_ProgressDoesNotLeakBetweenStudents`
- **Thực hiện:**
  - Học viên A (`student@zhongwenhub.edu.vn`) cập nhật tiến độ Bài 1 lên bước 3.
  - Học viên B (`student.binh.demo@zhongwenhub.edu.vn`) đăng nhập và truy vấn `/api/v1/learning/me`.
- **Kết quả xác thực:**
  - Dữ liệu trả về của học viên B hoàn toàn độc lập, không mang dấu vết hay tiến độ bước 3 của học viên A.
  - Mỗi tài khoản được phân vùng dữ liệu an toàn dựa trên `UserId` trích xuất trực tiếp từ JWT Claims của backend, không phụ thuộc vào client.

---

## 5. BẢNG TỔNG HỢP KẾT QUẢ SUITE INTEGRATION TESTS

| STT | Tên ca kiểm thử | Phạm vi | Kết quả | Thời gian |
| :---: | :--- | :--- | :---: | :---: |
| 1 | `GetMyState_WithoutToken_Returns401Unauthorized` | Bảo mật JWT | **PASS** | 45ms |
| 2 | `GetMyState_WithValidStudentToken_Returns200WithInitializedState` | Khởi tạo tiến độ | **PASS** | 82ms |
| 3 | `UpdatePreferences_WithValidData_ReturnsUpdatedState` | Cài đặt mục tiêu | **PASS** | 94ms |
| 4 | `UpdateLessonStepAndComplete_PersistsInDatabaseAndIsIdempotent` | Tính lũy đẳng XP | **PASS** | 185ms |
| 5 | `VocabularyAndSrs_Flow_RecordsWordAndUpdatesReview` | Flashcard SRS | **PASS** | 210ms |
| 6 | `LegacyProgressCompatibility_WithLes1AndGuid_HandlesBothGracefullyWithoutCrash` | Tương thích ngược | **PASS** | 165ms |
| 7 | `NonExistentLesson_ReturnsNotFound` | Xử lý lỗi 404 | **PASS** | 68ms |
| 8 | `UserIsolation_ProgressDoesNotLeakBetweenStudents` | Cách ly dữ liệu | **PASS** | 120ms |
| 9 | `ConcurrentProgressUpdates_HandlesParallelRequestsWithoutDeadlockOrDuplicateXp` | Chống Deadlock | **PASS** | 320ms |

**Tổng cộng:** **9 passed (100%), 0 failed. Thời lượng: 3 giây.**
