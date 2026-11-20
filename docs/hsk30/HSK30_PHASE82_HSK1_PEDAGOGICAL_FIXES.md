# ZHONGWENHUB — BÁO CÁO CHUẨN HÓA SƯ PHẠM BÀI 1–3 HSK 1 (PHASE 8.2)

> **Mã văn bản:** `HSK30_PHASE82_HSK1_PEDAGOGICAL_FIXES.md`  
> **Dự án:** Hệ thống Nền tảng Đào tạo Hán ngữ Toàn diện ZhongWenHub (HSK 3.0 Cấp 1–6)  
> **Thời điểm xác lập:** 09/11/2026 01:06:00 (UTC+7)  
> **Trạng thái:** HOÀN THÀNH — NGHIỆM THU ĐẠT CHUẨN SƯ PHẠM  
> **Nhánh Git:** `integration/zhongwenhub-sqlserver` (PR #16 Draft)

---

## 1. MỤC TIÊU & BỐI CẢNH

Trong đợt nghiệm thu Phase 8.1, kiểm tra sư phạm nhận diện 3 bài học đầu tiên (Lesson 1, 2, 3 của HSK 1) chứa phần câu hỏi và phương án trắc nghiệm nghe hiểu có từ ngữ trừu tượng, mang phong cách đàm phán doanh nghiệp, vượt quá trình độ người mới bắt đầu (A1/HSK 1).

**Yêu cầu Phase 8.2 — Phân hệ C:**
1. Lưu lại bản sao lưu (Snapshot) v1.0 của 3 bài học trước khi chỉnh sửa.
2. Thiết kế lại câu hỏi và phương án trắc nghiệm: gần gũi, chuẩn mực, đúng ngữ cảnh bài học A1 (chào hỏi, trường lớp, uống trà, quốc tịch).
3. Không ghi đè âm thầm nội dung đã duyệt: ghi rõ lý do sửa đổi vào trường `ReviewNotes` để lưu vết lịch sử phiên bản.
4. Đồng bộ trên cả hai cơ sở dữ liệu `ZhongWenHub_Test` và `ZhongWenHub_Dev`.
5. Đảm bảo cấu trúc JSON hợp lệ, không gây crash giao diện học viên.

---

## 2. QUY TRÌNH THỰC HIỆN & BẢN SAO LƯU V1.0

### 2.1 Bản sao lưu Snapshot v1.0

Trước khi tiến hành sửa đổi, toàn bộ dữ liệu hiện tại của Bài 1, Bài 2, Bài 3 đã được trích xuất và lưu trữ tại:
- **Đường dẫn:** [hsk1_lessons_1_to_3_v1_snapshot.json](file:///D:/ZhongWenHub/scripts/snapshots/hsk1_lessons_1_to_3_v1_snapshot.json)
- **Tập lệnh thực thi:** `scripts/remedy_lessons_1_to_3_pedagogy.py`

---

## 3. CHI TIẾT SỬA ĐỔI SƯ PHẠM TRÊN TỪNG BÀI HỌC

### 3.1 Bài 1 (Lesson 1 — 你好 / Xin chào)
- **LessonId:** `AAAAAAAA-1111-1111-1111-111111111111`
- **Ngữ cảnh hội thoại:** Hai người chào nhau trong trường học ("你好！" - "你好！").
- **Trước khi sửa:**
  - *Câu hỏi:* Câu nói thể hiện điều gì?
  - *Phương án:* Thể hiện sự hợp tác thiện chí / Bày tỏ sự phản đối / Yêu cầu đàm phán lại. (Quá trừu tượng đối với người mới học HSK 1).
- **Sau khi chuẩn hóa (v1.1):**
  - *Câu hỏi:* Người nói thứ hai là ai?
  - *Phương án A:* `学生` (Học sinh) — **ĐÁP ÁN ĐÚNG**
  - *Phương án B:* `老师` (Giáo viên)
  - *Phương án C:* `医生` (Bác sĩ)
  - *Phương án D:* `司机` (Tài xế)
- **Ghi chú thẩm duyệt:**
  > *"Cập nhật sư phạm v1.1: Chuẩn hóa câu hỏi nghe hiểu và phương án trắc nghiệm phù hợp trình độ HSK 1 (nhận biết vai vế giao tiếp cơ bản thay vì thuật ngữ đàm phán)."*

---

### 3.2 Bài 2 (Lesson 2 — 谢谢你 / Cảm ơn bạn)
- **LessonId:** `AAAAAAAA-2222-2222-2222-222222222222`
- **Ngữ cảnh hội thoại:** Lời cảm ơn và hẹn gặp lại để đi uống trà.
- **Trước khi sửa:**
  - *Câu hỏi:* Mục đích của cuộc gặp là gì?
  - *Phương án:* Ký kết biên bản ghi nhớ / Giải quyết tranh chấp thương mại / Khảo sát thị trường.
- **Sau khi chuẩn hóa (v1.1):**
  - *Câu hỏi:* Chiều mai làm gì?
  - *Phương án A:* `去喝茶` (Đi uống trà) — **ĐÁP ÁN ĐÚNG**
  - *Phương án B:* `去学校` (Đến trường)
  - *Phương án C:* `去医院` (Đến bệnh viện)
  - *Phương án D:* `去商店` (Đến cửa hàng)
- **Ghi chú thẩm duyệt:**
  > *"Cập nhật sư phạm v1.1: Chuẩn hóa câu hỏi nghe hiểu và phương án trắc nghiệm phù hợp trình độ HSK 1 (hoạt động đời sống hằng ngày: uống trà, đi học thay vì ngôn ngữ doanh nghiệp)."*

---

### 3.3 Bài 3 (Lesson 3 — 你是哪国人 / Bạn là người nước nào)
- **LessonId:** `AAAAAAAA-3333-3333-3333-333333333333`
- **Ngữ cảnh hội thoại:** Hỏi quốc tịch giữa bạn bè quốc tế ("你是哪国人？" - "我是美国人。").
- **Trước khi sửa:**
  - *Câu hỏi:* Địa vị pháp lý của nhân vật là gì?
  - *Phương án:* Đại diện ngoại giao thường trú / Cố vấn pháp lý đa quốc gia / Chuyên viên thương vụ.
- **Sau khi chuẩn hóa (v1.1):**
  - *Câu hỏi:* David đến từ nước nào?
  - *Phương án A:* `美国` (Nước Mỹ) — **ĐÁP ÁN ĐÚNG**
  - *Phương án B:* `中国` (Trung Quốc)
  - *Phương án C:* `英国` (Nước Anh)
  - *Phương án D:* `日本` (Nhật Bản)
- **Ghi chú thẩm duyệt:**
  > *"Cập nhật sư phạm v1.1: Chuẩn hóa câu hỏi nghe hiểu và phương án trắc nghiệm phù hợp trình độ HSK 1 (quốc gia và quốc tịch quen thuộc theo chuẩn HSK 3.0 GF 0025-2021)."*

---

## 4. KIỂM TRA TOÀN VẸN VÀ KHÔNG CRASH GIAO DIỆN

1. **Kiểm tra cú pháp JSON:**
   Chạy tập lệnh `scripts/verify_phase81_content_integrity.py`:
   - Kết quả: **15 / 15 bài học HSK 1** đạt tính toàn vẹn 100%. Không có lỗi cú pháp JSON, không còn chuỗi `\u...` chưa parse.
2. **Bảo vệ component UI:**
   Bổ sung kiểm tra an toàn trong [VocabularyStep.tsx](file:///D:/ZhongWenHub/Fontend/src/features/lesson/steps/VocabularyStep.tsx) và [DialogueStep.tsx](file:///D:/ZhongWenHub/Fontend/src/features/lesson/steps/DialogueStep.tsx) để giao diện không bị gián đoạn khi dữ liệu đang tải hoặc từ vựng trống.
3. **Trải nghiệm học viên:**
   Xác minh trực tiếp qua bài test Playwright [student-learning-journey.spec.ts](file:///D:/ZhongWenHub/Fontend/e2e/student-learning-journey.spec.ts):
   - Học viên mở bài học, nghe audio, chọn đáp án đúng, đạt điểm thưởng XP và chuyển tiếp bước học liền mạch.

---

## 5. KẾT LUẬN

Nội dung 3 bài học đầu tiên của HSK 1 đã được chuẩn hóa đúng mực theo chuẩn sư phạm HSK 3.0, đem lại trải nghiệm học tập tự nhiên, hứng thú và phù hợp cho người học sơ cấp.
