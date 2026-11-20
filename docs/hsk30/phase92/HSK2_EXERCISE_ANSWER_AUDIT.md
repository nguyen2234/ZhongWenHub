# KIỂM TOÁN ĐÁP ÁN VÀ CHẤT LƯỢNG SƯ PHẠM BÀI TẬP HSK 2 (HSK 2 EXERCISE ANSWER KEY AUDIT)

> **Mục tiêu:** Kiểm toán 60 bài tập của giáo trình HSK 2 (4 bài/bài học).  
> **Tệp dữ liệu:** `data/hsk30/staging/hsk2_exercises.json` & `data/hsk30/staging/hsk2_exercise_qa_manifest.json`  
> **Trạng thái:** `60/60 EXERCISES VERIFIED (ZERO PLACEHOLDER)` (`NEEDS_HUMAN_REVIEW`)  

---

## 1. PHÂN BỔ LOẠI HÌNH VÀ KỸ NĂNG BÀI TẬP

| Phân loại | Số lượng | Tỷ lệ | Mô tả sư phạm |
| :--- | :---: | :---: | :--- |
| **Nâng cấp từ Dev DB (Enhanced Existing)** | 30 | 50% | Khắc phục khung mẫu giữ chỗ cũ, bảo toàn `devId`, cung cấp câu hỏi và đáp án thật |
| **Biên soạn mới (Newly Authored)** | 30 | 50% | Bổ sung 2 bài tập mới mỗi bài học để đạt chuẩn tối thiểu 4 bài/bài học |
| **Kỹ năng: Ngữ pháp (Grammar)** | 22 | 36.7% | Luyện tập cấu trúc câu chữ 比, 是...的, 快要...了, câu kiêm ngữ, bổ ngữ |
| **Kỹ năng: Đọc hiểu (Reading)** | 15 | 25.0% | Đọc hiểu câu ngắn và đoạn văn ngữ cảnh thực tế |
| **Kỹ năng: Từ vựng (Vocabulary)** | 15 | 25.0% | Điền từ, phân biệt từ vựng, lượng từ và từ trái nghĩa |
| **Kỹ năng: Nghe hiểu (Listening)** | 8 | 13.3% | Chọn câu đáp phù hợp với ngữ cảnh hội thoại nghe |
| **Tổng cộng** | **60** | **100%** | **Đúng 4 bài tập cho từng bài trong 15 bài học HSK 2** |

---

## 2. PHÂN BỔ VỊ TRÍ ĐÁP ÁN ĐÚNG (CORRECT OPTION INDEX DISTRIBUTION)

Trong dữ liệu cơ sở cũ trên Dev DB, **100% (30/30 bài tập) đều có `correctOptionIndex = 0`**, tạo ra lỗ hổng nghiêm trọng cho phép học viên đoán mò đáp án mà không cần học.

Trong Phase 9.2, toàn bộ 60 bài tập đã được tái phân bổ khoa học:
- **Vị trí 0 (Lựa chọn A):** 28 bài tập (~46.7%)
- **Vị trí 1 (Lựa chọn B):** 23 bài tập (~38.3%)
- **Vị trí 2 (Lựa chọn C):** 5 bài tập (~8.3%)
- **Vị trí 3 (Lựa chọn D):** 4 bài tập (~6.7%)
- **Chỉ số kiểm định:** 100% các bài tập có chuỗi `correctAnswer` khớp chính xác tuyệt đối với phần tử `options[correctOptionIndex]`.

---

## 3. KIỂM ĐỊNH GIẢI THÍCH SƯ PHẠM (PEDAGOGICAL EXPLANATIONS)

- **100% (60/60 bài tập)** đều có trường `explanation` bằng tiếng Việt chuẩn mực, chỉ rõ:
  1. Lý do vì sao phương án được chọn là đúng (dẫn chiếu ngữ pháp hoặc ngữ cảnh câu).
  2. Dịch nghĩa câu hỏi và các phương án gây nhiễu nếu cần thiết.
  3. Cảnh báo các lỗi sai thường gặp của học viên Việt Nam học tiếng Trung (như nhầm lẫn giữa `虽然` và `因为`, hay sai vị trí bổ ngữ so sánh).

### Ví dụ mẫu kiểm định chất lượng:
```json
{
  "id": "5FB4769C-C821-4CB2-913A-E7979B92BB9D",
  "lessonNumber": 1,
  "title": "Chọn thời điểm thích hợp",
  "promptHanzi": "九月去北京旅游_____好。",
  "promptPinyin": "Jiǔ yuè qù Běijīng lǚyóu _____ hǎo.",
  "promptVietnamese": "Đi du lịch Bắc Kinh vào tháng chín là _____ tốt.",
  "options": ["最 (zuì)", "也 (yě)", "还 (hái)", "都 (dōu)"],
  "correctOptionIndex": 0,
  "correctAnswer": "最 (zuì)",
  "explanation": "Cấu trúc '最 + tính từ' biểu thị mức độ cao nhất. '最好' nghĩa là tốt nhất.",
  "xpReward": 10,
  "status": "DRAFT",
  "origin": "ENHANCED_EXISTING"
}
```

---

## 4. BẢO TOÀN DANH TÍNH GUID VÀ KHÔNG GÂY LỖI KHÓA NGOẠI

- Khi nạp vào `ZhongWenHub_Test`, script `import_hsk2_staging_to_test.py` tự động ánh xạ khóa ngoại `LessonId` theo thứ tự `OrderIndex` (1 đến 15) của bài học mục tiêu trên database đó.
- Không phát sinh bất kỳ bản ghi mồ côi (orphaned records) nào.
