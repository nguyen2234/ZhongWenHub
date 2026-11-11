# ZHONGWENHUB — BÁO CÁO TRẢI NGHIỆM HỌC VIÊN HSK 1 THỰC TẾ
## Student Learning Journey & Progress Persistence Verification Report

- **Dự án:** ZhongWenHub
- **Mã nhiệm vụ:** `ZWH-HSK1-LEARNING-AND-CONTENT-CRUD`
- **Môi trường thử nghiệm:** Frontend React 19 + Backend ASP.NET Core .NET 10 + SQL Server Express (`ZhongWenHub_Ephemeral_QA` cho full E2E 15/15 bài đã xuất bản; `ZhongWenHub_Test` và `ZhongWenHub_Dev` được giữ nguyên ở mức `3/15 PUBLISHED`)
- **Vai trò người dùng:** `STUDENT` (Tài khoản học viên thật)
- **Tập tin kiểm thử:** `Fontend/src/features/lesson/pages/HskTextbookLessonPage.tsx`, `Fontend/src/features/learning/`

---

## 1. LUỒNG TRẢI NGHIỆM HỌC TẬP THỰC TẾ (STUDENT FLOW)

Hệ thống đã triển khai luồng học khép kín từ Database đến giao diện người học:

```
[Đăng nhập STUDENT]
        |
        v
[Truy cập Lộ trình HSK 1] (/learning-path?mode=hsk)
        |
        +---> Hiển thị đầy đủ 15 bài học theo 5 chủ đề sư phạm
        |
        v
[Chọn bài học đã xuất bản] (Ví dụ: Bài 1: 你好 - AAAAAAAA-1111-1111-1111-111111111111)
        |
        +---> Nạp dữ liệu thật từ Backend API: GET /api/v1/content/lessons/{id}
        |
        v
[Học theo cấu trúc sách điện tử (Digital Textbook)]
        |---> 1. Giới thiệu: Mục tiêu bài học, thời lượng, XP
        |---> 2. Từ vựng: 6 từ vựng thật từ DB (你好, 您, 你们, 对不起, 没关系, 谢谢)
        |---> 3. Ngữ pháp: 6 điểm ngữ pháp thật từ DB kèm công thức & ví dụ
        |---> 4. Hội thoại: Lời thoại nhân vật thật từ DialogueJson (Đại Vệ, ...)
        |---> 5. Luyện nghe & Bài tập: Câu hỏi trắc nghiệm thật từ Exercises
        |
        v
[Hoàn thành bài tập & Lưu tiến độ vào SQL Server]
        |---> PUT /api/v1/Learning/me/lessons/{lessonId}/progress (Cập nhật bước)
        |---> POST /api/v1/Learning/me/lessons/{lessonId}/complete (Hoàn thành bài & nhận XP)
        |
        v
[Tải lại trang (Reload)] ---> Tiến độ được phục hồi chính xác từ cơ sở dữ liệu
        |
        v
[Chuyển sang bài tiếp theo] ---> Điều hướng mượt mà sang Bài 2 (/lesson?id=...)
```

---

## 2. BẰNG CHỨNG XÓA BỎ HOÀN TOÀN MOCK FALLBACK (BUG A FIX)

1. **Chặn Mock Fallback khi API lỗi (`lesson-content.service.ts`):**
   - Bổ sung `isIsolatedTestRuntime()`: ở browser runtime, lỗi backend throw lỗi tiếng Việt rõ ràng thay vì fallback về `MOCK_LESSON_8_DRAFT` / `lesson8Data`; đồng thời chuẩn hóa `'HSK_2_0'` / `'2.0'`.
2. **Từ vựng (`hsk-textbook.service.ts`):**
   - Khi Backend trả về danh sách từ vựng của bài, hệ thống ưu tiên 100% dữ liệu từ Backend.
   - Tuyệt đối không ưu tiên `INITIAL_VOCABULARY_LIST` tĩnh đè lên dữ liệu bài học.
3. **Ngữ pháp:**
   - Ánh xạ trực tiếp từ `detailDto.grammars`. Không tìm kiếm mock trong `MOCK_GRAMMAR_POINTS`.
   - Nếu bài học chưa có ngữ pháp, hiển thị empty state trung thực, không bịa đặt điểm ngữ pháp giả.
4. **Hội thoại & Đọc hiểu:**
   - Lời thoại được giải mã trực tiếp từ `DialogueJson` của Backend; reading passage chỉ hiển thị khi Backend trả về. Nếu rỗng, hiển thị empty state.

---

## 3. KIỂM SOÁT BẢN THẢO (DRAFT ISOLATION) VÀ BẢO VỆ TIẾN ĐỘ

1. **Bảo vệ bài DRAFT (`LearningService.cs` & `ContentController.cs`):**
   - Học viên truy cập URL/API bài học đang ở trạng thái `DRAFT` (như Bài 4: `AAAAAAAA-4444-4444-4444-444444444444`) hoặc gọi `PUT .../progress`, `POST .../complete` sẽ nhận HTTP **404** từ Backend (`EnsureLessonPublishedOrThrow`).
   - Giao diện hiển thị thông báo an toàn: *"Bài học không tồn tại hoặc chưa được phát hành (Draft)."*
2. **Bảo vệ tính toàn vẹn XP (Server-Side Calculation):**
   - `CompleteLessonAsync`, `RecordPracticeSessionAsync`, và `CompleteSrsSessionAsync` bỏ qua mọi giá trị `dto.XpEarned` / `dto.SessionXp` do client gửi lên (đã kiểm chứng E2E gửi `xpEarned: 99999` nhưng server chỉ cộng `<= 200` XP theo `Lesson.XpReward` và idempotency).

---

## 4. KẾT LUẬN & PHẠM VI KIỂM CHỨNG DATABASE

- Luồng 15/15 bài `PUBLISHED` (kèm negative HTTP checks DRAFT 404, STUDENT 403, anti-XP-spoof) đã chạy và PASS trong bộ Playwright E2E trên cơ sở dữ liệu cô lập `ZhongWenHub_Ephemeral_QA`.
- Trên `ZhongWenHub_Test` và `ZhongWenHub_Dev`, hiện giữ nguyên **3/15 bài `PUBLISHED`** (L01–L03) và **12/15 bài `DRAFT`** vì chưa có `USER_APPROVAL_TOKEN.signed`. Trạng thái nghiệm thu hiện tại: **`CONDITIONAL`**.

