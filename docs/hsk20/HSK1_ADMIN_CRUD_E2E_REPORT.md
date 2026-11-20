# ZHONGWENHUB — BÁO CÁO QUẢN TRỊ NỘI DUNG CRUD BÀI HỌC HSK 1
## Content Manager Aggregate CRUD, Persistence & Reload Verification Report

- **Dự án:** ZhongWenHub
- **Mã nhiệm vụ:** `ZWH-HSK1-LEARNING-AND-CONTENT-CRUD`
- **Môi trường:** Content Management Portal + ASP.NET Core API + SQL Server Express (`ZhongWenHub_Ephemeral_QA` cho full E2E; `ZhongWenHub_Test` & `ZhongWenHub_Dev` giữ nguyên READ-ONLY)
- **Vai trò người dùng:** `CONTENT_MANAGER` / `ADMIN`
- **Tập tin kiểm thử:** `Fontend/src/management/admin/content/pages/AdminLessonEditorPage.tsx`, `Fontend/src/management/admin/content/services/curriculum.service.ts`

---

## 1. QUY TRÌNH QUẢN TRỊ AGGREGATE CRUD ĐÃ XÁC MINH

Quản trị viên nội dung có toàn quyền thực hiện các thao tác quản lý bài học thông qua giao diện chuyên dụng:

```
[Mở Danh sách 15 bài HSK 1] (AdminCurriculumPage)
        |
        v
[Chọn bài học để chỉnh sửa] (Ví dụ: Bài 4 - AAAAAAAA-4444-4444-4444-444444444444)
        |
        +---> Nạp dữ liệu qua: GET /api/v1/content/lessons/{id}
        |
        v
[Giao diện Editor tích hợp] (AdminLessonEditorPage)
        |---> Chỉnh sửa Thông tin bài: Tiêu đề tiếng Trung, tiếng Việt, Pinyin, Tóm tắt, Thời lượng, XP
        |---> Chỉnh sửa Hội thoại: Thêm/Sửa/Xóa lời thoại và nhân vật (DialogueJson)
        |---> Chỉnh sửa Luyện nghe: Transcript, câu hỏi và file audio (ListeningJson)
        |---> Quản lý Từ vựng liên kết: Thêm từ mới hoặc gỡ liên kết từ vựng
        |---> Quản lý Ngữ pháp liên kết: Liên kết điểm ngữ pháp trọng tâm
        |---> Quản lý Bài tập: Gắn bài tập trắc nghiệm củng cố
        |
        v
[Lưu bản nháp] ---> PUT /api/v1/content/lessons/{id} (Kèm toàn bộ payload aggregate)
        |
        v
[Xác minh tính bền vững]
        |---> Tải lại trang (F5 / Reload)
        |---> Gọi lại GET /api/v1/content/lessons/{id}
        |---> Toàn bộ nội dung hội thoại, luyện nghe và liên kết từ vựng/ngữ pháp vẫn nguyên vẹn 100%!
```

---

## 2. KẾT QUẢ ĐỐI SOÁT PAYLOAD VÀ BACKEND PERSISTENCE (BUG B FIX)

### 2.1. Payload gửi đi từ Frontend (`curriculum.service.ts`):
```typescript
{
  unitId: draft.unitId,
  lessonNumber: draft.lessonNumber,
  titleZh: draft.intro.titleZh,
  titleVi: draft.intro.titleVi,
  pinyin: draft.intro.pinyinTitle,
  summary: draft.intro.summary,
  durationMinutes: draft.intro.durationMinutes,
  xpReward: draft.intro.xpReward,
  status: draft.status,
  dialogueJson: JSON.stringify(draft.dialogue),
  listeningJson: JSON.stringify(draft.listenings),
  linkedVocabularyIds: draft.vocabularies.map(v => v.id),
  linkedGrammarPointIds: draft.grammars.map(g => g.id),
  linkedExerciseIds: draft.exercises.map(e => e.id)
}
```

### 2.2. Xử lý lưu trữ tại Backend (`ContentService.UpdateLessonAsync`):
- `DialogueJson` và `ListeningJson` được lưu bền vững vào các cột tương ứng trong bảng `lessons`.
- `linkedVocabularyIds`: Tự động cập nhật khóa ngoại `v.LessonId = id` cho các từ được liên kết, và gỡ `v.LessonId = null` cho các từ bị loại bỏ.
- `linkedGrammarPointIds`: Cập nhật `g.LessonId = id` trong bảng `grammar_points`.
- `linkedExerciseIds`: Cập nhật `e.LessonId = id` trong bảng `exercises`.
- Toàn bộ thao tác thực hiện trong một Transaction đơn nhất, tự động Rollback nếu có lỗi.

### 2.3. Khóa bảo vệ xóa bài học có tiến độ & RBAC:
- Khi gọi `DELETE /api/v1/content/lessons/{id}`, phương thức `DeleteLessonAsync` kiểm tra sự tồn tại bản ghi theo `p.LessonId.ToLower() == idLower` (kể cả legacy alias `les-1`) trong `StudentLessonProgress`.
- Nếu bài học đã có tiến độ học viên: **Chặn đứng và ném ngoại lệ `InvalidOperationException`**, trả về HTTP 400 (`CANNOT_DELETE_ACTIVE_LESSON`). Bài học phải được lưu trữ dạng `ARCHIVED` thay vì xóa cứng.
- Tài khoản `STUDENT` gọi `POST /api/v1/content/lessons` bị chặn với HTTP **403 Forbidden** (đã xác minh trong Playwright E2E).

---

## 3. KẾT LUẬN

Hệ thống quản trị nội dung bài học HSK 1 và Kho đề thi đã được kiểm chứng E2E hoạt động bền vững từ giao diện CMS đến SQL Server trong cơ sở dữ liệu cô lập `ZhongWenHub_Ephemeral_QA`, trong khi `ZhongWenHub_Test` và `ZhongWenHub_Dev` được giữ nguyên hoàn toàn không bị chỉnh sửa.

