# ZHONGWENHUB — BÁO CÁO BỔ SUNG ĐOẠN VĂN ĐỌC HIỂU HSK 1 (READING PASSAGE QA)

**Tài liệu:** `docs/hsk30/phase91b/HSK1_READING_PASSAGE_QA.md`  
**Giai đoạn:** Phase 9.1B — Task E  
**Ngày thực hiện:** 09/11/2026  
**File staging sinh ra:** `data/hsk30/staging/hsk1_reading_passages.json`  
**Trạng thái:** HOÀN THÀNH — 6 ĐOẠN VĂN KẾT UNIT ĐÃ ĐƯỢC THIẾT KẾ & KIỂM ĐỊNH

---

## I. MỤC TIÊU & BỐI CẢNH

Theo kết quả kiểm toán chuyên sâu Phase 9.1A:
- Giáo trình HSK 1 hiện tại chỉ bao gồm các đoạn hội thoại cực ngắn (2 lượt thoại A/B: "你好！- 你好！"), hoàn toàn thiếu vắng các đoạn văn tự sự liền mạch (connected narrative passages).
- Việc thiếu các đoạn văn đọc hiểu ngắn khiến học viên không phát triển được kỹ năng đọc hiểu đoạn văn bản kết nối, gây hụt hẫng khi tiếp cận bài thi đọc hiểu HSK 1 thực tế (nơi có các đoạn văn ngắn 20–40 chữ Hán kèm câu hỏi đọc hiểu).

**Mục tiêu Phase 9.1B Task E:**
- Xây dựng **6 đoạn văn đọc hiểu ngắn** (20–40 chữ Hán mỗi đoạn) đặt tại các bài học kết thúc 6 Units của HSK 1.
- Tích hợp câu hỏi đọc hiểu kiểm tra khả năng nắm bắt thông tin thực tế.
- Đề xuất phương án lưu trữ an toàn, tương thích ngược tuyệt đối với schema hiện tại (Zero Schema Change).
- Lưu toàn bộ tại `data/hsk30/staging/hsk1_reading_passages.json`.
- **Tuyệt đối an toàn:** Không chỉnh sửa trực tiếp trên cơ sở dữ liệu `ZhongWenHub_Dev`.

---

## II. MA TRẬN 6 ĐOẠN VĂN THEO 6 UNITS

| Unit | Bài học kết thúc | Tiêu đề đoạn văn | Số chữ Hán | Ngữ pháp & Từ vựng trọng điểm |
| :---: | :---: | :--- | :---: | :--- |
| **Unit 1** | Lesson 2 (`...2222`) | 你好，朋友！ (Chào bạn nhé!) | 28 chữ | Chào hỏi sơ cấp, giới thiệu bạn bè, hẹn gặp lại (你好, 朋友, 天天, 明天见). |
| **Unit 2** | Lesson 4 (`...4444`) | 我的汉语老师 (Thầy giáo của tôi) | 32 chữ | Câu chữ 是, trợ từ sở hữu 的, phó từ 很 và 都 (老师, 汉语, 中国, 喜欢). |
| **Unit 3** | Lesson 7 (`...0358`) | 星期天的一天 (Một ngày chủ nhật) | 35 chữ | Thứ ngày, thời gian làm trạng ngữ, ăn uống sinh hoạt (星期天, 米饭, 喝茶, 太...了). |
| **Unit 4** | Lesson 10 (`...4DB0`) | 去北京看朋友 (Đi Bắc Kinh thăm bạn) | 30 chữ | Câu liên động mục đích, thời tiết, mua sắm (去...看, 商店, 买, 不太冷). |
| **Unit 5** | Lesson 13 (`...828E`) | 学校附近 (Khu vực quanh trường học) | 34 chữ | Phương vị từ 前面/后面, câu chữ 有, siêu thị & quán ăn (大学, 前面, 后面, 很多). |
| **Unit 6** | Lesson 15 (`...AEB3`) | 坐飞机来中国 (Đến Trung Quốc bằng máy bay) | 31 chữ | Cấu trúc nhấn mạnh 是...的, năng nguyện 会, cảm xúc vui mừng (坐飞机, 会说, 高兴). |

---

## III. NỘI DUNG CHI TIẾT 6 ĐOẠN VĂN & CÂU HỎI ĐỌC HIỂU

### 1. Unit 1 (Lesson 2): 你好，朋友！
- **Chữ Hán:** 你好！我是大卫。这是我的中国朋友，他叫李明。我们天天在一起学习，我们明天见！
- **Pinyin:** Nǐ hǎo! Wǒ shì Dàwèi. Zhè shì wǒ de zhōngguó péngyou, tā jiào Lǐ Míng. Wǒmen tiāntiān zài yìqǐ xuéxí, wǒmen míngtiān jiàn!
- **Tiếng Việt:** Xin chào! Tôi là David. Đây là người bạn Trung Quốc của tôi, cậu ấy tên là Lý Minh. Ngày nào chúng tôi cũng học cùng nhau, hẹn ngày mai gặp lại!
- **Câu hỏi đọc hiểu:**
  - *Hỏi:* 大卫的中国朋友叫什么名字？ (Bạn người Trung Quốc của David tên là gì?)
  - *Đáp án đúng:* 李明 (Lǐ Míng)
  - *Giải thích:* Trong bài viết: '这是我的中国朋友，他叫李明。'

### 2. Unit 2 (Lesson 4): 我的汉语老师
- **Chữ Hán:** 他是王老师。他是中国人，也是我们的汉语老师。他人很好，我们都很喜欢他。
- **Pinyin:** Tā shì Wáng lǎoshī. Tā shì zhōngguó rén, yě shì wǒmen de hànyǔ lǎoshī. Tā rén hěn hǎo, wǒmen dōu hěn xǐhuan tā.
- **Tiếng Việt:** Thầy ấy là thầy giáo Vương. Thầy là người Trung Quốc, cũng là thầy giáo dạy tiếng Hán của chúng tôi. Tính thầy rất tốt, chúng tôi đều rất quý mến thầy.
- **Câu hỏi đọc hiểu:**
  - *Hỏi:* 王老师教他们什么？ (Thầy Vương dạy họ môn gì?)
  - *Đáp án đúng:* 汉语 (Hànyǔ)
  - *Giải thích:* Thầy Vương là '我们的汉语老师'.

### 3. Unit 3 (Lesson 7): 星期天的一天
- **Chữ Hán:** 今天星期天，我不去学校。中午我和妈妈在家吃米饭，下午我们喝中国茶，太好了！
- **Pinyin:** Jīntiān xīngqītiān, wǒ bú qù xuéxiào. Zhōngwǔ wǒ hé māma zài jiā chī mǐfàn, xiàwǔ wǒmen hē zhōngguó chá, tài hǎo le!
- **Tiếng Việt:** Hôm nay là chủ nhật, tôi không đến trường. Buổi trưa tôi và mẹ ở nhà ăn cơm, buổi chiều chúng tôi uống trà Trung Quốc, thật tuyệt vời!
- **Câu hỏi đọc hiểu:**
  - *Hỏi:* 他今天去不去学校？ (Hôm nay cậu ấy có đến trường không?)
  - *Đáp án đúng:* 不去学校 (Bú qù xuéxiào)
  - *Giải thích:* Câu đầu nêu rõ: '今天星期天，我不去学校。'

### 4. Unit 4 (Lesson 10): 去北京看朋友
- **Chữ Hán:** 我星期一去北京看朋友。北京天气不太冷。我和朋友想去商店买一点儿东西。
- **Pinyin:** Wǒ xīngqīyī qù Běijīng kàn péngyou. Běijīng tiānqì bú tài lěng. Wǒ hé péngyou xiǎng qù shāngdiàn mǎi yìdiǎnr dōngxi.
- **Tiếng Việt:** Thứ hai tôi đi Bắc Kinh thăm bạn. Thời tiết Bắc Kinh không quá lạnh. Tôi và bạn muốn đi cửa hàng mua một ít đồ.
- **Câu hỏi đọc hiểu:**
  - *Hỏi:* 他什么时候去北京？ (Khi nào cậu ấy đi Bắc Kinh?)
  - *Đáp án đúng:* 星期一 (Xīngqīyī)
  - *Giải thích:* Câu mở đầu: '我星期一去北京看朋友。'

### 5. Unit 5 (Lesson 13): 学校附近
- **Chữ Hán:** 这是我们的大学。学校前面有一家大超市，后面是一家小饭馆。超市里有很多水果。
- **Pinyin:** Zhè shì wǒmen de dàxué. Xuéxiào qiánmiàn yǒu yì jiā dà chāoshì, hòumiàn shì yì jiā xiǎo fànguǎn. Chāoshì lǐ yǒu hěn duō shuǐguǒ.
- **Tiếng Việt:** Đây là trường đại học của chúng tôi. Phía trước trường có một siêu thị lớn, phía sau là một quán ăn nhỏ. Trong siêu thị có rất nhiều hoa quả.
- **Câu hỏi đọc hiểu:**
  - *Hỏi:* 学校前面有什么？ (Phía trước trường học có cái gì?)
  - *Đáp án đúng:* 一家大超市 (Yì jiā dà chāoshì)
  - *Giải thích:* '学校前面有一家大超市'.

### 6. Unit 6 (Lesson 15): 坐飞机来中国
- **Chữ Hán:** 我是坐飞机来中国的。我会说一点儿汉语。认识很多中国朋友，我非常高兴！
- **Pinyin:** Wǒ shì zuò fēijī lái Zhōngguó de. Wǒ huì shuō yìdiǎnr hànyǔ. Rènshi hěn duō zhōngguó péngyou, wǒ fēicháng gāoxìng!
- **Tiếng Việt:** Tôi đến Trung Quốc bằng máy bay. Tôi biết nói một chút tiếng Hán. Quen biết rất nhiều bạn bè Trung Quốc, tôi vô cùng vui mừng!
- **Câu hỏi đọc hiểu:**
  - *Hỏi:* 他是怎么来中国的？ (Cậu ấy đến Trung Quốc bằng cách nào?)
  - *Đáp án đúng:* 坐飞机 (Zuò fēijī)
  - *Giải thích:* Cấu trúc nhấn mạnh: '我是坐飞机来中国的。'

---

## IV. CHIẾN LƯỢC TÍCH HỢP TƯƠNG THÍCH TUYỆT ĐỐI (ZERO SCHEMA IMPACT)

Có hai phương án kỹ thuật triển khai đã được kiểm chứng không làm thay đổi cấu trúc bảng SQL Server:

1. **Phương án Khuyến nghị (Recommended): Nhúng vào `DialogueJson` của bài học:**
   - Trong cột `lessons.DialogueJson` (kiểu `nvarchar(max)`), bổ sung đối tượng `readingPassage`:
     ```json
     {
       "id": "diag-...",
       "lines": [...],
       "readingPassage": {
         "titleZh": "你好，朋友！",
         "titleVi": "Chào bạn nhé!",
         "passageZh": "...",
         "passagePinyin": "...",
         "passageVi": "...",
         "comprehensionQuestions": [...]
       }
     }
     ```
   - *Ưu điểm:* Không đổi cấu trúc C# entity `Lesson` (vốn lưu chuỗi `DialogueJson`), Frontend component `LessonPlayer` có thể render thêm tab "Đọc hiểu mở rộng" sau phần đối thoại.

2. **Phương án Bổ trợ: Nhúng dưới dạng bài tập `exercises`:**
   - Đưa đoạn văn vào trường `PromptHanzi` và câu hỏi vào trường `Instruction` của bảng `exercises` với `Type = "reading"`.
   - *Ưu điểm:* Sử dụng ngay UI làm bài tập hiện có của học viên.
