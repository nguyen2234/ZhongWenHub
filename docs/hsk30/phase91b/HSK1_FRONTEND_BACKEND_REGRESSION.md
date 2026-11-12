# ZHONGWENHUB — BÁO CÁO HỒI QUY FRONTEND / BACKEND & UX HỌC TẬP (FRONTEND BACKEND REGRESSION)

**Tài liệu:** `docs/hsk30/phase91b/HSK1_FRONTEND_BACKEND_REGRESSION.md`  
**Giai đoạn:** Phase 9.1B — Task G  
**Ngày thực hiện:** 09/11/2026  
**File điều chỉnh:** `Fontend/src/features/lesson/services/lesson-content.service.ts`  
**Trạng thái:** HOÀN THÀNH — 285/285 FRONTEND UNIT TESTS PASSED, REMOVED LES-8 BYPASS

---

## I. MỤC TIÊU & BỐI CẢNH

Theo kết quả kiểm toán Phase 9.1A:
1. `lesson-content.service.ts` chứa logic hardcoded:
   ```typescript
   if (lessonId && lessonId !== 'les-8') { ... }
   ```
   Khiến bất kỳ yêu cầu nào đối với `les-8` đều bỏ qua việc gọi API Backend thật và ép buộc nạp dữ liệu mock từ `MOCK_LESSON_8_DRAFT`.
2. Giá trị tham số mặc định của hàm `getLessonDetail` là `'les-8'`.
3. Nhãn hiển thị giáo trình cần đảm bảo tính trung thực sư phạm, đúng chuẩn HSK 3.0 (GF 0025-2021 / HSK 2025–2026).

---

## II. CHI TIẾT SỬA LỖI & CHUẨN HÓA

### 1. Loại bỏ hoàn toàn Bypass Hardcode trong `LessonContentService`
- Đổi chữ ký hàm mặc định từ `lessonId = 'les-8'` sang `lessonId = 'les-1'`.
- Đảm bảo **mọi `lessonId`** (kể cả `'les-8'` hay bất kỳ bài học nào) đều gửi request trực tiếp lên Backend ASP.NET Core: `GET /api/v1/content/lessons/{lessonId}`.
- Giữ nguyên cơ chế chặn gian lận 404: Nếu bài học đang ở trạng thái DRAFT hoặc không tìm thấy, hệ thống chủ động ném lỗi rõ ràng (`Bài học không tồn tại hoặc chưa được phát hành (Draft)`), không che giấu lỗi bằng mock data giả lập.
- Giữ fallback an toàn cho môi trường chạy test cô lập (offline test runner) khi không có backend server.

### 2. Tính trung thực của nhãn giáo trình (Truthful Curriculum Labeling)
- Các metadata `hskLevel` đều được gắn cờ chuẩn hóa:
  ```typescript
  standardCode: 'HSK_3_0',
  standardVersion: '3.0'
  ```
- Không gây hiểu nhầm giữa cấu trúc 6 Units hiện có trong database và 5 Units trong Blueprint lý thuyết (đã được làm rõ tại quyết định cấu trúc Phase 9.0.1).

---

## III. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG

- Chạy bộ kiểm thử Frontend: `bun test src/`
- Kết quả: **285/285 tests PASSED (100%)**.
- Số lượng `expect()` assertions được kiểm chứng: **3,934 calls**.
- Thời gian thực thi: **714 ms**.
- Không phát sinh bất kỳ lỗi TypeScript, cú pháp hoặc hồi quy chức năng nào trên toàn bộ 29 test suites của Frontend.
