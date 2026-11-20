# BÁO CÁO TỔ CHỨC LẠI MENU CONTENT MANAGER

**Task ID:** `ZWH-HSK1-PUBLISH-15-LESSONS-AND-EXAM-REPOSITORY`  
**Commit liên quan:** `564f42e` (`refactor(content): consolidate lesson editor into curriculum navigation`)  
**Trạng thái:** `IMPLEMENTED` & `TESTED` (Unit tests & Vite production build)

---

## 1. Cấu trúc menu mới trong nhóm **HỌC LIỆU & BIÊN TẬP**

Đã cập nhật `CONTENT_MANAGER_NAV_GROUPS` (`cm-repository`) trong `Fontend/src/management/shared/config/navigation.config.tsx` theo đúng thứ tự yêu cầu:

1. **Kho HSK** (`/management/content-manager/hsk-repository`, `cm-hsk-repository`)
2. **Giáo trình** (`/management/content-manager/curriculum`, `cm-curriculum` — đổi tên từ `Giáo trình & Bài học`)
3. **Ngữ pháp** (`/management/content-manager/grammar`, `cm-grammar`)
4. **Ngân hàng câu hỏi** (`/management/content-manager/question-bank`, `cm-questions`)
5. **Kho đề thi** (`/management/content-manager/exams`, `cm-exams` — bổ sung mới)
6. **Học liệu video** (`/management/content-manager/videos`, `cm-videos`)

Đã **xóa** mục menu riêng `Trình biên tập bài học` (`cm-lesson-editor`) khỏi sidebar Content Manager.

---

## 2. Bảo toàn chức năng biên tập bài học & luồng điều hướng

- Giữ nguyên component `Fontend/src/management/admin/content/pages/AdminLessonEditorPage.tsx` và các editor con trong `Fontend/src/management/admin/content/components/editor/`.
- Giữ nguyên route `/management/content-manager/curriculum/lessons/:lessonId/edit` trong `Fontend/src/app/router/management.routes.tsx` để mở trực tiếp theo tham số `:lessonId`, giữ redirect tương thích cho `/management/admin/curriculum/lessons/:lessonId/edit` và chuyển hướng legacy `/management/content-manager/lesson-editor` về `/management/content-manager/curriculum`.
- Luồng truy cập chuẩn: **Giáo trình** → **Chọn cấp độ HSK** → **Chọn Unit** → **Chọn bài** → **Sửa**:
  - Nút **Sửa** trong `Fontend/src/management/admin/content/components/CurriculumUnitCard.tsx` điều hướng trực tiếp tới `/management/content-manager/curriculum/lessons/:lessonId/edit` qua callback `onEditLesson` từ `AdminCurriculumPage.tsx`.
  - Nút xem nhanh (biểu tượng con mắt) vẫn mở `LessonDetailDrawer.tsx` kèm nút **"Mở trình soạn bài"** trỏ đúng vào cùng đường dẫn trên.
- Đồng bộ tiêu đề trang trong `AdminCurriculumPage.tsx` (`Giáo trình`), breadcrumb trong `ManagementHeader.tsx` (`Giáo trình` và `Giáo trình / Biên tập bài học`, cùng `Kho đề thi`), và kiểm thử trong `Fontend/src/tests/fe-12-content-manager-workspace-separation.test.ts` + E2E specs (`fe-12-content-manager.spec.ts`, `real-content-manager.spec.ts`).

