# BÁO CÁO TÍCH HỢP VÀ KIỂM THỬ E2E BÀI ĐỌC HIỂU (READING PASSAGES)

**Dự án:** ZhongWenHub  
**Đối tượng:** 6 bài đọc hiểu thuộc 6 Units của chương trình HSK 1  
**Component giao diện:** `Fontend/src/features/lesson/components/ReadingPassageCard.tsx`  
**Trang hiển thị chính:** `Fontend/src/features/lesson/pages/HskTextbookLessonPage.tsx`  
**Dữ liệu nguồn:** `Fontend/src/features/lesson/data/hsk1ReadingPassages.ts` & `data/hsk30/staging/hsk1_reading_passages.json`  
**Kiểm thử tự động:** `Fontend/src/tests/reading-passage.test.ts` & `Fontend/e2e/hsk1-full-curriculum-e2e.spec.ts`  

---

## 1. MỤC TIÊU SƯ PHẠM VÀ PHÂN BỔ 6 UNITS

Bài đọc hiểu (Reading Passage) là một cải tiến sư phạm lớn trong chuẩn HSK 3.0 nhằm phát triển kỹ năng đọc đoạn văn liền mạch cho người học ngay từ cấp độ sơ cấp. Mỗi bài đọc hiểu được bố trí tại bài học cuối cùng của từng Unit:

| Unit | Bài học (Lesson) | Tiêu đề bài đọc | Chủ đề giao tiếp | Độ dài (Ký tự) | Điểm ngữ pháp tích hợp |
| :---: | :---: | :--- | :--- | :---: | :--- |
| **Unit 1** | Lesson 2 | 你好，朋友！ (Chào bạn nhé!) | Giới thiệu tên bạn bè, chào hỏi xã giao | 32 chữ | Chào hỏi sơ cấp, cảm ơn & xin lỗi |
| **Unit 2** | Lesson 4 | 我的汉语老师 (Thầy giáo tiếng Trung của tôi) | Miêu tả thầy giáo, tính cách, môn dạy | 30 chữ | Câu chữ 是, Trợ từ sở hữu 的 |
| **Unit 3** | Lesson 7 | 星期天的一天 (Một ngày chủ nhật) | Hoạt động ngày nghỉ, ăn uống cùng gia đình | 32 chữ | Hỏi thứ ngày tháng, Trạng ngữ thời gian |
| **Unit 4** | Lesson 10 | 去北京看朋友 (Đi Bắc Kinh thăm bạn) | Đi lại, thời tiết, mua sắm | 31 chữ | Câu liên động mục đích, Thời gian làm trạng ngữ |
| **Unit 5** | Lesson 13 | 学校附近 (Khu vực quanh trường học) | Vị trí các tòa nhà, cửa hàng quanh trường | 33 chữ | Phương vị từ (前面, 后面), Câu chữ 有 |
| **Unit 6** | Lesson 15 | 坐飞机来中国 (Đi máy bay đến Trung Quốc) | Phương tiện di chuyển, kết bạn quốc tế | 30 chữ | Cấu trúc nhấn mạnh 是...的, Năng nguyện 会 |

---

## 2. KIẾN TRÚC TÍCH HỢP ZERO-SCHEMA CONTRACT

Nhằm bảo đảm tính cô lập an toàn tuyệt đối và không gây xáo trộn lược đồ SQL Server hiện có, học liệu đọc hiểu được tích hợp theo kiến trúc:
1. **Lưu trữ nhúng (Zero-Schema JSON Embedding):**
   - Dữ liệu bài đọc hiểu được lưu dưới dạng trường con `readingPassage` bên trong cột JSON `DialogueJson` của bảng `lessons`.
   - Backend API trả về trọn vẹn `readingPassage` trong DTO `LessonDetailDTO` mà không cần thêm bất kỳ cột mới nào trong cơ sở dữ liệu.
2. **Bộ chuyển đổi dữ liệu Frontend (Fallback Adapter):**
   - Service `hskTextbookService` ưu tiên đọc trường `readingPassage` từ API backend.
   - Nếu bài học chưa có dữ liệu trong database, service tự động nạp từ bộ dữ liệu chuẩn hóa tĩnh `HSK1_READING_PASSAGES` tại `hsk1ReadingPassages.ts`.

---

## 3. CÁC TÍNH NĂNG TƯƠNG TÁC ĐÃ KIỂM THỬ E2E

### A. Bật / Tắt phiên âm Pinyin (Pinyin Toggle)
- **Hành vi:** Nhấp nút `Pinyin` có thuộc tính `data-testid="toggle-pinyin-btn"`.
- **Kết quả E2E:** 
  - Trạng thái mặc định: Dòng Pinyin `[data-testid="passage-pinyin"]` hiển thị đầy đủ màu cam hổ phách.
  - Khi nhấp tắt: Phần tử Pinyin lập tức bị ẩn khỏi DOM (`not.toBeVisible()`).
  - Khi nhấp bật lại: Phần tử Pinyin xuất hiện trở lại với độ trễ dưới 300ms.

### B. Bật / Tắt bản dịch tiếng Việt (Meaning Toggle)
- **Hành vi:** Nhấp nút `Dịch nghĩa` (`[data-testid="toggle-meaning-btn"]`).
- **Kết quả E2E:** Đoạn văn bản dịch tiếng Việt (`[data-testid="passage-meaning"]`) chuyển đổi mượt mà giữa trạng thái hiển thị và ẩn mà không làm xô lệch cấu trúc tổng thể trang.

### C. Phát âm Text-to-Speech (TTS Audio Playback)
- **Hành vi:** Nhấp nút `Nghe bài đọc` (`[data-testid="reading-passage-tts-btn"]`).
- **Kết quả E2E:** Sử dụng API `window.speechSynthesis` với ngôn ngữ `zh-CN`, tốc độ đọc chuẩn `0.95x` cho học viên sơ cấp.

### D. Trả lời câu hỏi đọc hiểu & Chấm điểm tức thì
- **Hành vi:** 
  - Chọn phương án đúng `[data-testid="question-0-opt-0"]`. Nút đổi sang trạng thái được chọn (viền cam).
  - Nút `Kiểm tra` chuyển sang trạng thái kích hoạt (`isEnabled()`).
  - Sau khi nhấp `Kiểm tra`: Icon tích xanh `CheckCircle2` xuất hiện, ô giải thích chi tiết tiếng Việt hiển thị rõ ràng (`Trong đoạn văn nêu rõ...`).

---

## 4. KẾT QUẢ KIỂM THỬ TRÊN CÁC THIẾT BỊ

- **Desktop (1440 × 900):** Đạt **PASS**. Component hiển thị đầy đủ với độ rộng tối ưu, đồng bộ với thanh điều hướng cuộn trang (Sticky Table of Contents) bên phải.
- **Mobile (390 × 844):** Đạt **PASS**. Các thẻ câu hỏi và nút bấm tự động co giãn theo chiều dọc, bảo đảm không bị tràn ngang và vùng bấm cảm ứng đạt tiêu chuẩn tối thiểu 44px.
- **Unit Test Bun:** `bun test src/tests/reading-passage.test.ts` đạt **3/3 PASS (0ms)**.
