# BÁO CÁO NGHIỆM THU: XUẤT BẢN HSK 1, TỔ CHỨC MENU CONTENT MANAGER & KHO ĐỀ THI

**Task ID:** `ZWH-HSK1-PUBLISH-15-LESSONS-AND-EXAM-REPOSITORY`  
**Branch:** `integration/zhongwenhub-sqlserver` (PR `#16` giữ **Open/Draft**)  
**Ngày kiểm tra:** `2026-11-11`

---

## 1. Phân loại trạng thái trung thực

| Hạng mục | Trạng thái | Chi tiết thực tế |
|---|---|---|
| Phase 1 — Tổ chức lại menu Content Manager (`Giáo trình`, bỏ `Trình biên tập bài học` riêng, thêm `Kho đề thi`) | `IMPLEMENTED`, `TESTED` | Commit `564f42e`. Bảo toàn `AdminLessonEditorPage.tsx` và route `:lessonId/edit`; nút **Sửa** trong `CurriculumUnitCard.tsx` mở trực tiếp trình soạn bài. |
| Phase 4 — Kho đề thi (`exams`, `exam_questions`, `student_exam_attempts`, API RBAC, UI Content Manager) | `IMPLEMENTED`, `TESTED` | Commit `a4a6574`. Build + migration code hoàn chỉnh + xUnit & Bun tests pass. **Chưa apply migration lên SQL Server `ZhongWenHub_Test`** do không có `USER_APPROVAL_TOKEN.signed`. |
| Phase 2 & 3 — Quy trình kiểm duyệt & xuất bản 15 bài HSK 1 (`GET /lessons/readiness`, `POST /lessons/batch-review`, UI readiness, negative/positive tests) | `IMPLEMENTED`, `TESTED` | Đã kiểm tra toàn bộ 15 bài trên `ZhongWenHub_Test`: **1/15** `PUBLISHED` đạt chuẩn (Bài 1), **2/15** `PUBLISHED` nhưng dưới ngưỡng `VocabCount >= 5` (Bài 2–3: `V=3`), **12/15** đang `DRAFT` & `BLOCKED` do `VocabCount=0` (Bài 4–15). **Chưa ghi DB** vì thiếu `USER_APPROVAL_TOKEN.signed`. |
| Phục hồi Student & HSK 2–4 | `TESTED` | API public `/api/v1/content/courses` trả về 6 khóa HSK 1–6 (HSK 2.0, không có 4A/4B). API `/api/v1/content/lessons?hskLevel=1` chỉ trả về 3 bài `PUBLISHED`, không lộ 12 bài `DRAFT`. |

---

## 2. Kết quả Build, Test & Security Scan (chạy sau lần sửa code cuối)

1. **Backend Solution Build (Release):**
   - Lệnh: `dotnet build Backend/ZhongWenHub.sln -c Release --no-restore`
   - Kết quả: **Build succeeded — 0 Warning(s), 0 Error(s)** (`2.97s`).
2. **Backend Unit Tests:**
   - Lệnh: `dotnet test Backend/tests/ZhongWenHub.UnitTests/ZhongWenHub.UnitTests.csproj -c Release --no-build`
   - Kết quả: **53/53 Passed, 0 Failed, 0 Skipped** (`112 ms`), bao gồm `ExamServiceTests` và `LessonPublicationWorkflowTests`.
3. **Frontend TypeScript + Vite Build:**
   - Lệnh: `cd Fontend ; bun run build`
   - Kết quả: **`tsc -b && vite build` hoàn thành trong `1.51s`** (0 lỗi).
4. **Frontend Unit Tests:**
   - Lệnh: `cd Fontend ; bun test src/tests`
   - Kết quả: **292/292 Passed, 0 Failed** trên **32 file** (`4291 expect()` calls, `535.00 ms`).
5. **Security Secret Scan:**
   - Lệnh: `python scripts/ai_bridge/scan_secrets.py`
   - Kết quả: **`SCAN COMPLETED: ZERO SECRETS FOUND!`**.
6. **Live Backend Read-Only HTTP Check (`http://localhost:5000`):**
   - `GET /api/v1/content/courses` -> `200 OK`, trả về 6 cấp độ HSK 1–6 (HSK 2.0, không có HSK 4A/4B).
   - `GET /api/v1/content/lessons?hskLevel=1&pageSize=20` -> `200 OK`, chỉ trả về 3 bài `PUBLISHED` (Bài 1–3), ẩn hoàn toàn Bài 4–15 đang `DRAFT`.

---

## 3. Các file báo cáo đã tạo

- `docs/maintenance/CONTENT_MANAGER_MENU_RESTRUCTURE_REPORT.md`
- `docs/exams/EXAM_REPOSITORY_IMPLEMENTATION_REPORT.md`
- `docs/hsk20/HSK1_15_LESSONS_PUBLICATION_READINESS.md`
- `docs/qa/HSK1_PUBLICATION_AND_EXAM_CRUD_ACCEPTANCE.md`
