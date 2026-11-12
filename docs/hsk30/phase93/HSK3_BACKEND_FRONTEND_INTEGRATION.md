# BÁO CÁO TÍCH HỢP HỆ THỐNG FULL-STACK (BACKEND & FRONTEND) HSK 3

## I. KIẾN TRÚC TÍCH HỢP VÀ PHÂN QUYỀN RBAC

Hệ thống ZhongWenHub được vận hành theo kiến trúc bảo mật phân tầng nghiêm ngặt:
- **Backend**: ASP.NET Core .NET 10, Entity Framework Core, SQL Server Express (`ZhongWenHub_Test`).
- **Frontend**: React + TypeScript + Vite, TailwindCSS.

### Quy tắc bảo vệ bài học Draft (Draft Protection):
1. **Đối với Học viên (Role: `Student`)**:
   - Khi truy cập API `/api/v1/content/lessons/{lessonId}` của bài học có trạng thái `DRAFT`, hệ thống trả về mã lỗi `404 Not Found`.
   - Trên giao diện Frontend, xuất hiện bảng thông báo an toàn `Không tìm thấy nội dung bài học` thay vì bị sập ứng dụng (Crash).
2. **Đối với Content Manager / Admin (Role: `Content_Manager`, `Admin`)**:
   - Truy cập hợp lệ qua API và nhận mã `200 OK` kèm đầy đủ payload: 25 từ vựng, 4 bài tập, 4-5 điểm ngữ pháp, và bài đọc hiểu nhúng trong `DialogueJson`.
   - Có thể xem trước (Preview) chất lượng bài học trên cổng quản trị trước khi xuất bản.
3. **Đối với người dùng vãng lai (Anonymous)**:
   - Các API ghi nhận tiến độ (`/api/v1/learning/me/lessons/{id}/complete`) trả về `401 Unauthorized`.

---

## II. ĐỒNG BỘ DỮ LIỆU FRONTEND TĨNH

Tại file `Fontend/src/features/learning/data/curriculumData.ts`:
- Chuẩn hóa đối tượng `HSK_CURRICULUM[3]`:
  - `totalLessons: 20` (trước đây là 24).
  - `totalWords: 500` (trước đây là 600).
  - Đầy đủ 5 Units chuẩn hóa:
    * Unit 1: 周末与计划 (Lessons 1–4)
    * Unit 2: 生活与情感 (Lessons 5–8)
    * Unit 3: 职场与社交 (Lessons 9–12)
    * Unit 4: 健康与习惯 (Lessons 13–16)
    * Unit 5: 环境与未来 (Lessons 17–20)
- Tích hợp dịch vụ sách giáo khoa `Fontend/src/features/lesson/services/hsk-textbook.service.ts`:
  - Phân giải động `readingPassageList`:
    ```typescript
    const readingPassageList =
      hskLevel === 3
        ? HSK3_READING_PASSAGES
        : hskLevel === 2
          ? HSK2_READING_PASSAGES
          : HSK1_READING_PASSAGES;
    ```

---

## III. KẾT QUẢ KIỂM THỬ TÍCH HỢP

- **Frontend Unit Tests**: Chạy toàn bộ test suites (`bun test src/tests/`), kết quả: **288/288 tests passed** (4139 assertions, 0 failures, 402ms).
- **Backend Tests**: Chạy toàn bộ xUnit suites (`dotnet test Backend/ZhongWenHub.sln`), kết quả: **122/122 tests passed** (38 UnitTests, 84 IntegrationTests, 0 failures).
