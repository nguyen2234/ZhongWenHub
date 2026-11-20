# QUYẾT ĐỊNH CẤU TRÚC GIÁO TRÌNH HSK 1: DUY TRÌ 6 UNITS / 15 BÀI HỌC
## HSK30_PHASE901_HSK1_STRUCTURE_DECISION.md

**Dự án:** ZhongWenHub  
**Giai đoạn:** Phase 9.0.1 — Official Syllabus Verification & Curriculum Baseline  
**Chuyên gia:** Senior Chinese Curriculum Designer, ASP.NET Core Architect, Data Engineer  
**Thời điểm phê duyệt đề xuất:** 09/11/2026  

---

## 1. BỐI CẢNH VÀ XUNG ĐỘT THIẾT KẾ BAN ĐẦU

Trong quá trình rà soát Phase 9.0, nhóm nghiên cứu phát hiện có sự mâu thuẫn giữa hai tài liệu:
- **Tài liệu Blueprint Phase 9.0 sơ bộ:** Đề xuất mô hình HSK 1 gồm **5 Units, 15 Lessons** (chia đều 3 bài/unit, gộp bài ôn tập cuối vào Unit 5).
- **Cơ sở dữ liệu thực tế (`ZhongWenHub_Dev`):** Khóa học HSK 1 đang được lưu trữ với **6 Units, 15 Lessons**.

Nhiệm vụ của Task F là đánh giá toàn diện tác động kỹ thuật và giá trị sư phạm, từ đó đưa ra quyết định kiến trúc chính thức và ít rủi ro nhất.

---

## 2. HIỆN TRẠNG KỸ THUẬT VÀ DỮ LIỆU THỰC TẾ TRONG DATABASE

Truy vấn trực tiếp cơ sở dữ liệu `ZhongWenHub_Dev` xác nhận:

### 2.1. Cấu trúc 6 Units hiện có
1. **Unit 1 (OrderIndex 1, Id: `BBBBBBBB-1111-1111-1111-111111111111`):**  
   - Tiêu đề: *问候与认识 - Chào hỏi & Làm quen*  
   - Gồm 2 bài: Lesson 1 (*你好 - Chào bạn* - PUBLISHED) và Lesson 2 (*谢谢你 - Cảm ơn bạn* - PUBLISHED).
2. **Unit 2 (OrderIndex 2, Id: `BBBBBBBB-2222-2222-2222-222222222222`):**  
   - Tiêu đề: *家庭与朋友 - Gia đình & Bạn bè*  
   - Gồm 2 bài: Lesson 3 (*你叫什么名字 - Bạn tên là gì* - PUBLISHED) và Lesson 4 (*他是我的汉语老师 - Thầy ấy là giáo viên tiếng Trung của tôi* - DRAFT).
3. **Unit 3 (OrderIndex 3, Id: `964E9CF6-1181-4891-B812-622BA95DFA1B`):**  
   - Tiêu đề: *饮食与日常 - Ăn uống & Sinh hoạt thường ngày*  
   - Gồm 3 bài: Lesson 5 (*我想喝茶*), Lesson 6 (*你在做什么呢*), Lesson 7 (*今天星期几*) [Tất cả DRAFT].
4. **Unit 4 (OrderIndex 4, Id: `56BB32B4-0F53-478B-96F9-FF7F8065C1D7`):**  
   - Tiêu đề: *时间与天气 - Thời gian & Thời tiết*  
   - Gồm 3 bài: Lesson 8 (*明天天气怎么样*), Lesson 9 (*现在几点*), Lesson 10 (*我星期一去北京*) [Tất cả DRAFT].
5. **Unit 5 (OrderIndex 5, Id: `0BC9FA71-A6F7-46E6-92F8-F7E6415A9492`):**  
   - Tiêu đề: *购物与出行 - Mua sắm & Đi lại*  
   - Gồm 3 bài: Lesson 11 (*这个苹果多少钱*), Lesson 12 (*你去哪儿买东西*), Lesson 13 (*他在学校前面*) [Tất cả DRAFT].
6. **Unit 6 (OrderIndex 6, Id: `A75C6AE6-5477-4426-9F7F-D6770A7A3F76`):**  
   - Tiêu đề: *爱好与复习 - Sở thích & Ôn tập tổng kết*  
   - Gồm 2 bài: Lesson 14 (*你会开车吗*) và Lesson 15 (*我是坐飞机来的*) [Tất cả DRAFT].

### 2.2. Dữ liệu học viên phụ thuộc
- Bảng `student_lesson_progress` hiện ghi nhận **14 bản ghi tiến độ học tập** của người dùng thực tế đang liên kết trực tiếp tới các `LessonId` và `UnitId` này.
- Các bài học 1, 2, 3 đã ở trạng thái **PUBLISHED** và đang phục vụ học viên.

---

## 3. PHÂN TÍCH RỦI RO KHI THAY ĐỔI TỪ 6 UNITS SANG 5 UNITS

Nếu ép buộc chuyển đổi cơ sở dữ liệu về 5 Units:
1. **Xung đột toàn vẹn dữ liệu (Data Integrity Breaches):** Bắt buộc phải chạy migration thay đổi `UnitId` của hàng loạt bài học từ Lesson 4 đến 15, có nguy cơ gây mồ côi (orphaned) các khóa ngoại của 14 bản ghi tiến độ trong `student_lesson_progress`.
2. **Nguy cơ vi phạm nguyên tắc bất biến Dev:** Nguyên tắc cốt lõi của Phase 9.0.1 và Phase 8 là: *"Tuyệt đối không chạy migration hoặc INSERT/UPDATE/DELETE trên ZhongWenHub_Dev"*. Việc sửa 6 Units thành 5 Units sẽ vi phạm trực tiếp nguyên tắc an toàn này.
3. **Phá vỡ cấu trúc giao diện Frontend:** Các bộ lọc học phần, thanh tiến trình bài học (ProgressBar) và bản đồ khóa học (Curriculum Map) trên `Fontend/` đã được tối ưu hóa cho cấu trúc 6 chương theo từng nhóm chủ đề trực quan.

---

## 4. BIỆN HỘ SƯ PHẠM (PEDAGOGICAL JUSTIFICATION) CHO CẤU TRÚC 6 UNITS

1. **Giảm tải nhận thức cho người mới bắt đầu (Cognitive Load Theory):**
   - Người mới học tiếng Trung trong 4 bài đầu (Unit 1 & Unit 2) phải đồng thời làm quen với hệ thống ngữ âm Pinyin, thanh điệu, quy tắc viết chữ Hán và ngữ pháp cơ bản. Việc chia Unit 1 (2 bài) và Unit 2 (2 bài) tạo điểm dừng nghỉ ngắn (milestone), giúp học viên xây dựng sự tự tin.
2. **Sự cần thiết của Unit 6 (Ôn tập & Đánh giá tổng hợp):**
   - Việc tách riêng Unit 6 (*Sở thích & Ôn tập tổng kết*) tạo ra một "Trạm kiểm định cuối khóa" (Capstone Unit). Bài 14 và 15 tổng hợp các cấu trúc câu vị ngữ, động từ năng nguyện `会` và cấu trúc nhấn mạnh `是...的`. Đây là cấu trúc kinh điển trong khảo thí HSK 1, rất cần một không gian riêng để ôn tập tích hợp trước khi học viên bước sang bài thi cuối khóa.

---

## 5. QUYẾT ĐỊNH CHÍNH THỨC (ARCHITECTURAL DECISION)

> [!IMPORTANT]
> **QUYẾT ĐỊNH:**  
> **Giữ nguyên 100% cấu trúc 6 Units và 15 Lessons hiện có trong Database.**  
> Điều chỉnh tài liệu Blueprint và tài liệu chuẩn hóa để đồng bộ theo dữ liệu thực tế của Database, tuyệt đối không chỉnh sửa cấu trúc bảng hay dữ liệu trên `ZhongWenHub_Dev`.

### Bảng cấu trúc HSK 1 chính thức được phê duyệt:
- **Unit 1:** Chào hỏi & Làm quen (Lessons 1, 2) — *Nền tảng phát âm & xưng hô*
- **Unit 2:** Gia đình & Bạn bè (Lessons 3, 4) — *Giới thiệu người & nghề nghiệp*
- **Unit 3:** Ăn uống & Sinh hoạt thường ngày (Lessons 5, 6, 7) — *Giao tiếp đời sống & lịch trình*
- **Unit 4:** Thời gian & Thời tiết (Lessons 8, 9, 10) — *Thời gian, địa điểm & khí hậu*
- **Unit 5:** Mua sắm & Đi lại (Lessons 11, 12, 13) — *Số lượng, giá cả & phương hướng*
- **Unit 6:** Sở thích & Ôn tập tổng kết (Lessons 14, 15) — *Kỹ năng, phương tiện & bài đánh giá tổng hợp*

---

## 6. ĐỊNH VỊ CHƯƠNG TRÌNH TRONG QUAN HỆ VỚI CHUẨN 3.0

- Khóa học HSK 1 của ZhongWenHub được định vị chuẩn xác là: **"HSK 1 Foundation Course"** (15 bài học, 6 Units, 300 từ vựng cốt lõi, 72 điểm ngữ pháp phân rã).
- Đảm bảo học viên nắm chắc 100% kiến thức HSK 2.0 (150 từ) và hoàn thành 60% chỉ tiêu từ vựng HSK 3.0 (300/500 từ).
- Khóa HSK 2 tiếp theo sẽ đóng vai trò tích lũy thêm 200 từ vựng và mở rộng ngữ pháp để đạt trọn vẹn 500 từ chuẩn quốc gia GF 0025-2021.
