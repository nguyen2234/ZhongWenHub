# BÁO CÁO TÍCH HỢP BÀI ĐỌC HIỂU TỔNG HỢP UNIT HSK 4 (READING INTEGRATION)

## I. MÔ THỨC KHẢO THÍ ĐỌC HIỂU UNIT

Để kiểm tra toàn diện năng lực tiếp thu sau mỗi Unit, ZhongWenHub tích hợp 5 bài đọc hiểu dài (Reading Passages) vào bài cuối của từng Unit:
- **Unit 1**: Lesson 4 — Bài đọc về *"Kiểm soát sự kỳ vọng và niềm vui trong cuộc sống"* (不要太在乎得失).
- **Unit 2**: Lesson 8 — Bài đọc về *"Bí quyết cốt lõi dẫn đến thành công bền vững"* (成功的秘密).
- **Unit 3**: Lesson 12 — Bài đọc về *"Nghệ thuật quan sát và cảm nhận vẻ đẹp cuộc sống"* (用心发现美).
- **Unit 4**: Lesson 16 — Bài đọc về *"Giao lưu văn hóa và cầu nối hữu nghị quốc tế"* (文化交流的桥梁).
- **Unit 5**: Lesson 20 — Bài đọc về *"Trách nhiệm của con người trước tương lai trái đất"* (展望未来的世界).

---

## II. THIẾT KẾ KIẾẾN TRÚC ZERO-SCHEMA

- **Lưu trữ**: Nhúng an toàn trong `dialogueJson` của các bài học số 4, 8, 12, 16, 20 mà không làm biến đổi lược đồ cơ sở dữ liệu (`Zero-Schema Contract`).
- **Thành phần mỗi bài đọc**:
  - `passageId`: Định danh duy nhất.
  - `titleZh`, `titleVi`: Tiêu đề song ngữ.
  - `contentZh`, `contentPinyin`, `contentVi`: Nội dung đoạn văn từ 200–350 chữ Hán.
  - `targetVocabularies`: Danh sách từ khóa trọng tâm của Unit.
  - `targetGrammar`: Điểm ngữ pháp Unit được vận dụng.
  - `questions`: 2 câu hỏi trắc nghiệm kiểm tra khả năng đọc hiểu và suy luận logic.
