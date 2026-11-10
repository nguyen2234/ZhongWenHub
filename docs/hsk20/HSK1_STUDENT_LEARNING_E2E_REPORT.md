# ZHONGWENHUB — BÁO CÁO TRẢI NGHIỆM HỌC VIÊN HSK 1 THỰC TẾ
## Student Learning Journey & Progress Persistence Verification Report

- **Dự án:** ZhongWenHub
- **Mã nhiệm vụ:** `ZWH-HSK1-LEARNING-AND-CONTENT-CRUD`
- **Môi trường thử nghiệm:** Frontend React 19 + Backend ASP.NET Core .NET 10 + SQL Server Express
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

1. **Từ vựng:**
   - Khi Backend trả về danh sách từ vựng của bài, hệ thống ưu tiên 100% dữ liệu từ Backend.
   - Tuyệt đối không ưu tiên `INITIAL_VOCABULARY_LIST` tĩnh đè lên dữ liệu bài học.
2. **Ngữ pháp:**
   - Ánh xạ trực tiếp từ `detailDto.grammars`. Không tìm kiếm mock trong `MOCK_GRAMMAR_POINTS`.
   - Nếu bài học chưa có ngữ pháp, hiển thị empty state trung thực, không bịa đặt điểm ngữ pháp giả.
3. **Hội thoại:**
   - Lời thoại được đọc và giải mã trực tiếp từ `DialogueJson` của Backend.
   - Nếu chưa có hội thoại, hiển thị empty state, không tự động sinh đoạn hội thoại 2 câu giả ("Người A", "Tôi rất vui được làm quen với bạn.").
4. **Bài đọc hiểu:**
   - Chỉ hiển thị reading passage khi Backend có trả về trường `readingPassage`. Không tự động gán passage của bài khác.

---

## 3. KIỂM SOÁT BẢN THẢO (DRAFT ISOLATION) VÀ BẢO VỆ TIẾN ĐỘ

1. **Bảo vệ bài DRAFT:**
   - Học viên thường cố tình truy cập vào URL bài học đang ở trạng thái DRAFT (như Bài 4: `AAAAAAAA-4444-4444-4444-444444444444`) sẽ nhận mã lỗi HTTP 404 từ Backend.
   - Giao diện hiển thị thông báo an toàn: *"Bài học không tồn tại hoặc chưa được phát hành (Draft)."*
2. **Bảo vệ tính toàn vẹn XP và Tiến độ:**
   - XP chỉ được cộng thông qua xác thực JWT của người dùng từ backend.
   - Hệ thống ngăn chặn việc cộng dồn XP khi học viên tải lại trang hoặc bấm thử lại bài kiểm tra (idempotency enforcement).

---

## 4. KẾT LUẬN

Trải nghiệm học tập HSK 1 của học viên đã được kết nối 100% với dữ liệu thực từ Backend API và lưu trữ bền vững trong SQL Server, đáp ứng trọn vẹn toàn bộ các tiêu chí nghiệm thu của Phase 4.
