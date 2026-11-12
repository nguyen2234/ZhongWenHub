# KẾ HOẠCH TRIỂN KHAI VÀ KHẮC PHỤC HỌC LIỆU PHASE 9.1B
## HSK1_PHASE91B_IMPLEMENTATION_PLAN.md

**Dự án:** ZhongWenHub  
**Giai đoạn:** Phase 9.1B — HSK 1 Content Remediation & Publishing Preparation  
**Mục tiêu:** Xử lý triệt để các issues P1 và P2 đã ghi nhận tại Phase 9.1A, chuẩn bị dữ liệu hoàn hảo để đưa toàn bộ 15 bài HSK 1 ra hội đồng phê duyệt xuất bản.  
**Nguyên tắc:** Có kịch bản kiểm thử, có rollback plan, có xác nhận từ người có thẩm quyền trước khi xuất bản.  

---

## 1. LỘ TRÌNH 5 BƯỚC THỰC HIỆN PHASE 9.1B

### Bước 1: Chuẩn hóa dữ liệu từ vựng (Remediate Vocabulary)
- Biên soạn 291 câu ví dụ song ngữ ngắn gọn (5–8 chữ) cho các từ vựng còn thiếu `ExamplesJson`.
- Cấu hình chuẩn hóa phát âm cho toàn bộ 300 từ vựng.
- Thực hiện cập nhật có kiểm soát qua script được bảo vệ.

### Bước 2: Tăng cường mật độ bài tập (Exercise Density Expansion)
- Biên soạn thêm 32 bài tập mới chất lượng cao cho 15 bài học:
  - 15 bài tập Nghe hiểu chọn tranh/đáp án.
  - 17 bài tập Ngữ pháp và trật tự câu.
- Đảm bảo mỗi bài học có tối thiểu **4 bài tập** đa dạng kỹ năng.

### Bước 3: Bổ sung đoạn văn đọc hiểu (Reading Passages)
- Bổ sung đoạn văn đọc hiểu ngắn (20–30 chữ Hán) cho các bài tổng kết Unit (Bài 2, 4, 7, 10, 13, 15).
- Tích hợp câu hỏi đọc hiểu kiểm tra nắm bắt thông tin.

### Bước 4: Làm sạch tiêu đề và mã nguồn Frontend
- Cập nhật `TitleVi` của Bài 4: Loại bỏ chuỗi "(Bản thảo)".
- Dọn dẹp logic fallback mock `les-8` trong `lesson-content.service.ts`.
- Xử lý an toàn trường hợp `LessonId = 'les-1'` trong tầng truy vấn nghiệp vụ của `student_lesson_progress`.

### Bước 5: Chạy kiểm thử hồi quy toàn diện & Trình xuất bản
- Chạy 100% Unit Tests & Integration Tests Backend.
- Chạy Playwright E2E kiểm tra toàn bộ luồng học từ Bài 1 đến Bài 15 trên `ZhongWenHub_Test`.
- Lập hồ sơ đề xuất chuyển trạng thái 12 bài từ `DRAFT` sang `PENDING_REVIEW` để hội đồng xuất bản phê duyệt.

---

## 2. CAM KẾT VÀ ĐIỀU KIỆN KÍCH HOẠT PHASE 9.1B

> [!IMPORTANT]
> **ĐIỀU KIỆN BẮT BUỘC:**  
> Phase 9.1B **chỉ được phép bắt đầu** sau khi người có thẩm quyền đã xem xét và phê duyệt toàn bộ báo cáo kiểm toán Phase 9.1A này. Tuyệt đối không tự ý chạy Phase 9.1B trước khi có lệnh!
