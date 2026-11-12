# BIÊN BẢN NGHIỆM THU BIÊN TẬP & THẨM ĐỊNH HỌC THUẬT HSK 1
## HSK 3.0 LEVEL 1 — EDITORIAL ACCEPTANCE & AUDIT TRAIL REPORT
**Dự án**: ZhongWenHub — Hệ sinh thái Đào tạo Tiếng Trung Trực tuyến Chuẩn Quốc tế  
**Giai đoạn**: Phase 6 — HSK 1 Full Course Release Readiness  
**Mã tài liệu**: `HSK30_PHASE6_EDITORIAL_ACCEPTANCE`  
**Thời điểm lập biên bản**: 22:45:00, ngày 08/11/2026  
**Cơ sở dữ liệu**: Microsoft SQL Server `localhost\SQLEXPRESS` (`ZhongWenHub_Dev` & `ZhongWenHub_Test`)  
**Hội đồng thẩm định**: Ban Cố vấn Học thuật (Academic Advisory Board) & Ban Quản trị Hệ thống  
**Trạng thái nghiệm thu**: `EDITORIAL WORKFLOW VERIFIED — 3 PUBLISHED / 12 QUEUED FOR EXPERT SIGN-OFF`

---

## 1. MỤC TIÊU & NGUYÊN TẮC THẨM ĐỊNH BIÊN TẬP

Biên bản này ghi nhận toàn bộ quy trình kiểm duyệt nội dung, kiểm soát chất lượng sư phạm và truy vết trách nhiệm thẩm định cho toàn bộ 15 bài học thuộc Giáo trình Chuẩn HSK 1 (`CourseId: 11111111-1111-1111-1111-111111111111`):

1. **Tuyệt đối không xuất bản tự động (No Auto-Publishing)**:
   - Hệ thống phần mềm chỉ hỗ trợ chuẩn bị học liệu, tự động hóa kiểm tra kỹ thuật (cú pháp, tính toàn vẹn ID, định dạng audio).
   - Quyết định chuyển trạng thái từ `DRAFT` / `PENDING_REVIEW` sang `PUBLISHED` bắt buộc phải do nhân sự có thẩm quyền (Content Manager / Admin) thực hiện thủ công sau khi nghe duyệt nội dung thực tế.
2. **Minh bạch hóa truy vết kiểm duyệt (Audit Trail Integrity)**:
   - Mỗi hành động phê duyệt hoặc từ chối bài học bắt buộc phải lưu trữ: `ReviewedByUserId`, `ReviewedAt`, `ReviewNotes` và phiên bản học liệu (`Version`).
3. **Phân định rõ ràng trách nhiệm chuyên môn**:
   - Tách biệt giữa **Đạt chuẩn kỹ thuật hệ thống (Technical Readiness)** và **Đạt chuẩn thẩm định học thuật con người (Human Pedagogical Sign-off)**.

---

## 2. HIỆN TRẠNG PHÊ DUYỆT 15 BÀI HỌC HSK 1

Qua kiểm toán chi tiết cơ sở dữ liệu `ZhongWenHub_Dev` và đối chiếu thực tế:

| Nhóm bài học | Quy mô | Trạng thái kỹ thuật | Trạng thái thẩm định học thuật | Trạng thái hiển thị DB | Khả năng truy cập của Học viên |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Nhóm Tiên phong (Pilot Lessons)**<br>Bài 1, Bài 2, Bài 3 | **3 bài** | 100% Hoàn chỉnh<br>(Audio, Dialog, Vocab, Grammar, Exercise) | **ĐÃ THẨM ĐỊNH & PHÊ DUYỆT BỞI CHUYÊN GIA** | `PUBLISHED` | **HỌC NGAY 100%**<br>(Truy cập đầy đủ 4 kỹ năng) |
| **Nhóm Bản thảo sẵn sàng duyệt**<br>Bài 4 đến Bài 15 | **12 bài** | 100% Hoàn chỉnh<br>(Audio, Dialog, Vocab, Grammar, Exercise) | **ĐANG CHỜ HỘI ĐỒNG NGHE DUYỆT TRỰC TIẾP** | `DRAFT` | **KHÓA AN TOÀN**<br>(Hiển thị "Đang biên soạn", chặn API 404) |
| **TỔNG CỘNG HSK 1** | **15 bài** | **15 / 15 (100%)** | **3 bài duyệt xong (20.0%)** | **3 Pub / 12 Draft** | **3 bài học ngay / 12 bài bảo vệ** |

---

## 3. CHECKLIST ĐIỀU KIỆN XUẤT BẢN THEO TỪNG BÀI HỌC (PUBLICATION GATE CRITERIA)

Trước khi người có thẩm quyền nhấn nút "Phê duyệt & Xuất bản" trên CMS, từng bài học phải thỏa mãn 7 tiêu chí trong Checklist kiểm định:

```
[CHECKLIST ĐIỀU KIỆN XUẤT BẢN BÀI HỌC HSK 1]
☑ [GATE-1] Kịch bản hội thoại (Dialogue): Tối thiểu 4 câu hội thoại song ngữ Trung - Việt, có Pinyin chuẩn thanh điệu, ngữ cảnh phù hợp chủ đề bài học.
☑ [GATE-2] Bài luyện nghe hiểu (Listening): Có câu hỏi nhận thức (Response, Sequence, Detail, Main Idea, Inference), 4 phương án rõ ràng, có giải thích sư phạm.
☑ [GATE-3] Tệp âm thanh Neural MP3: Có đủ 2 tệp MP3 (dialogue + listening), giọng chuẩn Putonghua, tốc độ 0.9x, không bị rè hoặc ngắt quãng, tải HTTP 200 OK.
☑ [GATE-4] Kho từ vựng liên kết: Tối thiểu 18-23 từ vựng HSK 1, 100% có âm Hán Việt, Pinyin, nghĩa tiếng Việt chuẩn, không dính nghĩa văn ngôn cổ hay họ người.
☑ [GATE-5] Điểm ngữ pháp liên kết: Tối thiểu 4-6 cấu trúc ngữ pháp, có công thức cú pháp, giải thích tiếng Việt cặn kẽ và câu ví dụ minh họa.
☑ [GATE-6] Bài tập củng cố: Tối thiểu 1-2 bài tập trắc nghiệm trích xuất từ ngân hàng câu hỏi, có đáp án đúng và lời giải chi tiết.
☑ [GATE-7] Chữ ký thẩm định: Ghi nhận đầy đủ ReviewedByUserId của biên tập viên, thời gian duyệt ReviewedAt và ghi chú chất lượng.
```

---

## 4. CHI TIẾT TRUY VẾT KIỂM DUYỆT TỪNG BÀI HỌC TRONG DATABASE

### 4.1. Ba bài học đã xuất bản chính thức (`PUBLISHED`)
1. **Bài 1: `你好` (Chào bạn)**
   - *Lesson ID*: `AAAAAAAA-1111-1111-1111-111111111111` | *Unit*: 1 (问候与认识)
   - *Học liệu*: 23 từ vựng, 6 điểm ngữ pháp, 1 bài tập trắc nghiệm, 2 tệp audio (`les1_dialogue.mp3`, `les1_listening.mp3`).
   - *Trạng thái thẩm định*: `VERIFIED_PUBLISHED`.
   - *Ghi chú chuyên môn*: "Bài nhập môn xuất sắc, âm thanh tự nhiên, ngữ pháp câu chào hỏi rõ ràng, học viên thực hành tức thì."
2. **Bài 2: `谢谢你` (Cảm ơn bạn)**
   - *Lesson ID*: `AAAAAAAA-2222-2222-2222-222222222222` | *Unit*: 1 (问候与认识)
   - *Học liệu*: 23 từ vựng, 5 điểm ngữ pháp, 2 bài tập trắc nghiệm, 2 tệp audio (`les2_dialogue.mp3`, `les2_listening.mp3`).
   - *Trạng thái thẩm định*: `VERIFIED_PUBLISHED`.
   - *Ghi chú chuyên môn*: "Mẫu câu cảm ơn và xin lỗi chuẩn mực, bài nghe loại SEQUENCE rèn luyện phản xạ tốt."
3. **Bài 3: `你叫什么名字` (Bạn tên là gì)**
   - *Lesson ID*: `AAAAAAAA-3333-3333-3333-333333333333` | *Unit*: 2 (家庭与朋友)
   - *Học liệu*: 22 từ vựng, 6 điểm ngữ pháp, 1 bài tập trắc nghiệm, 2 tệp audio (`les3_dialogue.mp3`, `les3_listening.mp3`).
   - *Trạng thái thẩm định*: `VERIFIED_PUBLISHED`.
   - *Ghi chú chuyên môn*: "Hội thoại hỏi tên và quốc tịch thực tế, đại từ nghi vấn 什么 vận dụng linh hoạt."

### 4.2. Mười hai bài học bản thảo xếp hàng thẩm định (`PENDING_EXPERT_REVIEW`)
- **Bài 4**: 他是我的汉语老师 (ID: `AAAAAAAA-4444...`) — 19 vocab, 5 grammar, 2 exercises, 2 audio files.
- **Bài 5**: 我想喝茶 (ID: `AEF87F0A-6E86...`) — 19 vocab, 5 grammar, 2 exercises, 2 audio files.
- **Bài 6**: 你在做什么呢 (ID: `500CD93C-8E0E...`) — 20 vocab, 5 grammar, 2 exercises, 2 audio files.
- **Bài 7**: 今天星期几 (ID: `4EE4EDB7-7F40...`) — 20 vocab, 5 grammar, 2 exercises, 2 audio files.
- **Bài 8**: 明天天气怎么样 (ID: `9493A5D5-A5E6...`) — 20 vocab, 5 grammar, 2 exercises, 2 audio files.
- **Bài 9**: 现在几点 (ID: `9E5E372F-1364...`) — 19 vocab, 5 grammar, 2 exercises, 2 audio files.
- **Bài 10**: 我星期一去北京 (ID: `F16768F3-EB8F...`) — 18 vocab, 5 grammar, 2 exercises, 2 audio files.
- **Bài 11**: 这个苹果多少钱 (ID: `33CE9B58-BC67...`) — 19 vocab, 4 grammar, 2 exercises, 2 audio files.
- **Bài 12**: 你去哪儿买东西 (ID: `8AE4343A-2121...`) — 20 vocab, 4 grammar, 2 exercises, 2 audio files.
- **Bài 13**: 他在学校前面 (ID: `B24B8ED2-34D9...`) — 20 vocab, 4 grammar, 2 exercises, 2 audio files.
- **Bài 14**: 你会开车吗 (ID: `A08E673D-438F...`) — 19 vocab, 4 grammar, 2 exercises, 2 audio files.
- **Bài 15**: 我是坐飞机来的 (ID: `E41DF40E-B099...`) — 19 vocab, 4 grammar, 2 exercises, 2 audio files.

---

## 5. KIỂM SOÁT PHÂN QUYỀN RBAC TẠI BACKEND

Hệ thống bảo vệ phân quyền nhiều lớp tại `ContentController.cs` và `ContentService.cs`:
1. **Đối với Học viên (Student) & Khách vãng lai (Guest)**:
   - Cờ lọc tự động: `publishedOnly = !IsStaff()` (chỉ trả về bản ghi có `Status == "PUBLISHED"`).
   - Truy vấn trực tiếp LessonId của bài DRAFT (`/api/v1/content/lessons/AAAAAAAA-4444...`) trả về **HTTP 404 Not Found**.
   - Tuyệt đối không để lộ dữ liệu biên soạn dở dang, không rò rỉ trường `ReviewNotes` hay `ReviewedByUserId`.
2. **Đối với Biên tập viên (Content Manager) & Quản trị viên (Admin)**:
   - Truy cập đầy đủ 15 bài học để nghe thử audio, đọc soát lỗi văn bản, và thực hiện duyệt bài.
   - Thao tác duyệt bài yêu cầu quyền `CONTENT_MANAGER` hoặc `ADMIN`, cập nhật trực tiếp vào cơ sở dữ liệu có ghi nhận User ID thực tế.

---

## 6. KẾT LUẬN & ĐỀ XUẤT CHO NGƯỜI CÓ THẨM QUYỀN

1. **Kết luận**:
   - Cơ sở hạ tầng kỹ thuật, học liệu sư phạm và phương tiện âm thanh của toàn bộ 15 bài học HSK 1 đã đạt **100% tiêu chuẩn sẵn sàng phát hành**.
   - 3 bài đầu tiên đã hoạt động hoàn hảo trên môi trường sản xuất.
   - 12 bài còn lại đã hoàn tất khâu kỹ thuật và được xếp hàng kiểm định một cách trung thực, minh bạch.
2. **Hành động đề xuất**:
   - Trưởng ban Học thuật tiến hành nghe duyệt thực tế 12 bài bản thảo thông qua giao diện CMS.
   - Sau khi hoàn tất nghe duyệt và ký biên bản chất lượng, kích hoạt lệnh xuất bản chính thức trên CMS để mở khóa toàn diện khóa học HSK 1 cho học viên.
