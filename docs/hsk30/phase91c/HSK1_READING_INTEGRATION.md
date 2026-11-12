# BÁO CÁO TÍCH HỢP BÀI ĐỌC HIỂU CUỐI UNIT HSK 1
## HSK 1 UNIT-ENDING READING PASSAGES INTEGRATION & ZERO-SCHEMA CONTRACT

- **Cấp độ**: HSK 3.0 Level 1 (6 Units, 15 Bài học)
- **Vị trí bài đọc**: Bài kết thúc mỗi Unit (Lessons 2, 4, 7, 10, 13, 15)
- **Giải pháp kỹ thuật**: Zero-Schema Change Architecture (Lưu trữ nhúng an toàn trong `lessons.DialogueJson`)

---

## 1. MỤC TIÊU SƯ PHẠM VÀ PHÂN BỔ BÀI ĐỌC

Theo chuẩn thiết kế giáo trình HSK 3.0, ở cuối mỗi Unit, học viên cần được củng cố kỹ năng đọc hiểu đoạn văn ngắn (20–40 chữ Hán) tổng hợp các từ vựng và điểm ngữ pháp trọng tâm đã học trong Unit:

| Unit | Bài học | Tiêu đề đoạn văn | Độ dài (Ký tự) | Ngữ pháp & Từ vựng trọng tâm | Câu hỏi đọc hiểu |
| :---: | :---: | :--- | :---: | :--- | :---: |
| **Unit 1** | **Lesson 2** | 你好，朋友！<br>*(Chào bạn nhé!)* | 32 | Chào hỏi, cảm ơn, từ vựng: 朋友, 谢谢, 再见 | 1 câu trắc nghiệm |
| **Unit 2** | **Lesson 4** | 我的汉语老师<br>*(Thầy giáo tiếng Trung của tôi)* | 30 | Câu chữ 是, trợ từ 的, từ vựng: 老师, 汉语, 很 | 1 câu trắc nghiệm |
| **Unit 3** | **Lesson 7** | 星期天的一天<br>*(Một ngày chủ nhật)* | 32 | Thời gian, câu vị ngữ động từ, từ vựng: 星期天, 吃, 喝 | 1 câu trắc nghiệm |
| **Unit 4** | **Lesson 10** | 去北京看朋友<br>*(Đi Bắc Kinh thăm bạn)* | 35 | Động từ năng nguyện 想, liên động từ 去, từ vựng: 北京, 想 | 1 câu trắc nghiệm |
| **Unit 5** | **Lesson 13** | 学校附近<br>*(Gần trường học)* | 32 | Phương vị từ, câu tồn tại 在/有, từ vựng: 商店, 后面, 哪儿 | 1 câu trắc nghiệm |
| **Unit 6** | **Lesson 15** | 坐飞机来中国<br>*(Đi máy bay đến Trung Quốc)* | 35 | Cấu trúc nhấn mạnh 是……的, từ vựng: 坐, 飞机, 时候 | 1 câu trắc nghiệm |

---

## 2. KIẾN TRÚC LƯU TRỮ ZERO-SCHEMA CHANGE

Nhằm đảm bảo an toàn tuyệt đối cho cơ sở dữ liệu hiện có và không làm phát sinh migration phá vỡ tương thích ngược:
- Thuộc tính `readingPassage` được lưu trữ dưới dạng JSON object nhúng trực tiếp vào cột `lessons.DialogueJson` (`nvarchar(max)`).
- **Cấu trúc JSON nhúng**:
```json
{
  "id": "diag-AAAAAAAA-2222-2222-2222-222222222222",
  "lines": [...],
  "readingPassage": {
    "unitNumber": 1,
    "lessonNumber": 2,
    "titleZh": "你好，朋友！",
    "titleVi": "Chào bạn nhé!",
    "passageZh": "你好！我是大卫。这是我的中国朋友，他叫李明。我们天天在一起学习，我们明天见！",
    "passagePinyin": "Nǐ hǎo! Wǒ shì Dàwèi...",
    "passageVi": "Xin chào! Tôi là David...",
    "characterCount": 32,
    "comprehensionQuestions": [
      {
        "questionZh": "大卫的中国朋友叫什么名字？",
        "questionVi": "Bạn người Trung Quốc của David tên là gì?",
        "options": ["李明 (Lǐ Míng)", "王明 (Wáng Míng)", "张三 (Zhāng Sān)", "大卫 (Dàwèi)"],
        "correctIndex": 0,
        "explanation": "Trong đoạn văn nêu rõ: '这是我的中国朋友，他叫李明。'"
      }
    ]
  }
}
```

---

## 3. TRIỂN KHAI BACKEND VÀ FRONTEND

### Backend ASP.NET Core
- **DTOs (`ContentDtos.cs`)**: Khai báo `ReadingPassageDto` và `ReadingComprehensionQuestionDto`. Bổ sung trường `public ReadingPassageDto? ReadingPassage { get; set; }` vào `LessonDetailDto`.
- **Dịch vụ (`ContentService.cs`)**: Trong `GetLessonByIdAsync`, trích xuất an toàn `readingPassage` từ `DialogueJson` thông qua `JsonDocument`. Các bài học không có bài đọc trả về `null` trơn tru.

### Frontend React / TypeScript
- **Hợp đồng Type (`lesson-content.types.ts`)**: Bổ sung `LessonReadingPassageDTO` và `ReadingComprehensionQuestionDTO`.
- **Component Trực quan (`ReadingPassageCard.tsx`)**:
  - Giao diện thẻ đọc hiện đại theo tông màu cam–ấm của ZhongWenHub.
  - Điều khiển bật/tắt hiển thị Pinyin và bản dịch tiếng Việt.
  - Tích hợp nút phát âm Web Speech API `zh-CN`.
  - Bộ câu hỏi tương tác: chọn đáp án, kiểm tra đúng/sai ngay lập tức, hiển thị giải thích cặn kẽ và hỗ trợ làm lại khi trả lời sai.
- **Tích hợp Bước học (`DialogueStep.tsx` & `LessonExperience.tsx`)**: Tự động hiển thị thẻ bài đọc hiểu ở cuối bước hội thoại của bài học kết thúc Unit.
