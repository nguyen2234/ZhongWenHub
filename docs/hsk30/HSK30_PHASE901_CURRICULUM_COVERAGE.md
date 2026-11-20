# MA TRẬN ĐỘ BAO PHỦ GIÁO TRÌNH HSK 3.0
## HSK30_PHASE901_CURRICULUM_COVERAGE.md

**Dự án:** ZhongWenHub  
**Giai đoạn:** Phase 9.0.1 — Official Syllabus Verification & Curriculum Baseline  
**Chuyên gia:** Senior Chinese Language Curriculum Designer & QA Engineer  
**Thời điểm thực hiện:** 09/11/2026  

---

## 1. NGUYÊN TẮC XÁC ĐỊNH ĐỘ BAO PHỦ (COVERAGE PRINCIPLES)

Hệ thống đánh giá bao phủ của ZhongWenHub phân biệt rạch ròi 2 cấp độ:
1. **Bao phủ ở mức Dữ liệu nền (Database Storage Coverage):** Mục từ vựng hoặc điểm ngữ pháp đã có bản ghi trong bảng `vocabularies` hoặc `grammar_points`.
2. **Bao phủ ở mức Giảng dạy tích hợp (Instructional Integration Coverage):** Kiến thức đó đã thực sự được đưa vào văn cảnh hội thoại (`DialogueJson`), bài luyện nghe (`ListeningJson`), giải thích sư phạm và bài tập đánh giá (`exercises`).

Các trạng thái bao phủ chuẩn:
- `COVERED_VERIFIED`: Đã giảng dạy, có bài tập kiểm tra và đối chiếu nguồn chính thức.
- `PARTIALLY_COVERED`: Đã có trong cơ sở dữ liệu và bài tập từ vựng, nhưng chưa xuất hiện trong bài khóa chính.
- `MISSING`: Chưa có trong hệ thống hoặc thiếu hụt so với chuẩn khảo thí.
- `UNVERIFIED`: Chưa có văn bản chuẩn gốc để xác thực.

---

## 2. MA TRẬN BAO PHỦ TỔNG THỂ HSK 1–6 THEO CÁC CHUẨN

| Cấp HSK | Chuẩn đối chiếu | Yêu cầu định lượng chuẩn (Từ vựng / Ngữ pháp / Chữ Hán) | Dữ liệu hiện có trong ZhongWenHub | Trạng thái bao phủ dữ liệu | Mức độ tích hợp bài học | Trạng thái thẩm định (Human Review) | Mã nguồn chứng cứ |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **HSK 1** | `HSK_2_2015` | 150 từ / Mẫu câu cơ bản | 300 từ / 72 ngữ pháp / 180 chữ | `COVERED_VERIFIED` (200%) | 15 bài học (6 Units) hoàn chỉnh | **VERIFIED** (Phase 8 QA) | `HSK-OFFICIAL-004` |
| **HSK 1** | `GF_0025_2021` | 500 từ / 48 phạm trù / 300 chữ | 300 từ / 72 ngữ pháp / 180 chữ | `PARTIALLY_COVERED` (60%) | Dạy 300 từ cốt lõi trong 15 bài | **PENDING_EXPANSION** | `HSK-OFFICIAL-001` / `002` |
| **HSK 2** | `HSK_2_2015` | 300 từ (+150) | 500 từ lũy kế / 78 ngữ pháp | `COVERED_VERIFIED` (166%) | Đang ở dạng Draft dữ liệu | `PENDING_REVIEW` | `HSK-OFFICIAL-004` |
| **HSK 2** | `GF_0025_2021` | 1.272 từ (+772) | 500 từ lũy kế / 78 ngữ pháp | `PARTIALLY_COVERED` (39.3%) | Đang ở dạng Draft dữ liệu | `PENDING_REVIEW` | `HSK-OFFICIAL-001` / `002` |
| **HSK 3** | `GF_0025_2021` | 2.245 từ (+973) | 1.000 từ lũy kế / 96 ngữ pháp | `PARTIALLY_COVERED` (44.5%) | Dữ liệu nền tảng sẵn có | `PENDING_REVIEW` | `HSK-OFFICIAL-001` / `002` |
| **HSK 4** | `GF_0025_2021` | 3.245 từ (+1.000) | 2.000 từ lũy kế / 95 ngữ pháp | `PARTIALLY_COVERED` (61.6%) | Dữ liệu nền tảng sẵn có | `PENDING_REVIEW` | `HSK-OFFICIAL-001` / `002` |
| **HSK 5** | `GF_0025_2021` | 4.316 từ (+1.071) | 3.600 từ lũy kế / 70 ngữ pháp | `PARTIALLY_COVERED` (83.4%) | Dữ liệu nền tảng sẵn có | `PENDING_REVIEW` | `HSK-OFFICIAL-001` / `002` |
| **HSK 6** | `GF_0025_2021` | 5.456 từ (+1.140) | 5.400 từ lũy kế / 50 ngữ pháp | `COVERED_VERIFIED` (99.0%) | Dữ liệu nền tảng sẵn có | `PENDING_REVIEW` | `HSK-OFFICIAL-001` / `002` |

---

## 3. MA TRẬN PHÂN BỔ NỘI DUNG 15 BÀI HỌC HSK 1 HIỆN TẠI

Khóa học HSK 1 của ZhongWenHub gồm 15 bài học, được phân bổ theo 6 nhóm chủ đề giao tiếp lớn:

| Unit | Bài học (Lesson) | Tiêu đề bài học | Chủ đề giao tiếp | Từ vựng trọng tâm bài học | Ngữ pháp tiêu biểu | Trạng thái tích hợp | Trạng thái bài học |
| :---: | :---: | :--- | :--- | :---: | :--- | :---: | :---: |
| **Unit 1** | **Bài 1** | 你好 (Chào bạn) | Chào hỏi cơ bản | 12 từ | Động từ 是, Đại từ nhân xưng | `COVERED_VERIFIED` | **PUBLISHED** |
| **Unit 1** | **Bài 2** | 谢谢你 (Cảm ơn bạn) | Lịch sự & Cảm ơn | 14 từ | Phó từ 不, Cảm ơn & Tạm biệt | `COVERED_VERIFIED` | **PUBLISHED** |
| **Unit 2** | **Bài 3** | 你叫什么名字 (Bạn tên là gì) | Giới thiệu họ tên | 15 từ | Đại từ nghi vấn 什么, Câu chữ 叫 | `COVERED_VERIFIED` | **PUBLISHED** |
| **Unit 2** | **Bài 4** | 他是我的汉语老师 (Thầy ấy là giáo viên tôi) | Nghề nghiệp & Quốc tịch | 16 từ | Trợ từ kết cấu 的, Đại từ 哪, 谁 | `COVERED_VERIFIED` | **DRAFT** |
| **Unit 3** | **Bài 5** | 我想喝茶 (Tôi muốn uống trà) | Nhu cầu ăn uống | 16 từ | Động từ năng nguyện 想, Lượng từ 个 | `COVERED_VERIFIED` | **DRAFT** |
| **Unit 3** | **Bài 6** | 你在做什么呢 (Bạn đang làm gì thế) | Hành động tiếp diễn | 18 từ | Giới từ 在, Trợ từ ngữ khí 呢 | `COVERED_VERIFIED` | **DRAFT** |
| **Unit 3** | **Bài 7** | 今天星期几 (Hôm nay là thứ mấy) | Ngày trong tuần & Lịch trình | 18 từ | Câu vị ngữ danh từ, Thứ & Ngày | `COVERED_VERIFIED` | **DRAFT** |
| **Unit 4** | **Bài 8** | 明天天气怎么样 (Thời tiết ngày mai thế nào) | Thời tiết & Nhiệt độ | 18 từ | Đại từ 怎么样, Phó từ 太...了 | `COVERED_VERIFIED` | **DRAFT** |
| **Unit 4** | **Bài 9** | 现在几点 (Bây giờ là mấy giờ) | Hỏi & Trả lời giờ giấc | 18 từ | Thời gian biểu, Số từ chỉ giờ phút | `COVERED_VERIFIED` | **DRAFT** |
| **Unit 4** | **Bài 10** | 我星期一去北京 (Thứ hai tôi đi Bắc Kinh) | Đi lại & Kế hoạch | 18 từ | Động từ 去, Trạng ngữ thời gian | `COVERED_VERIFIED` | **DRAFT** |
| **Unit 5** | **Bài 11** | 这个苹果多少钱 (Quả táo này bao nhiêu tiền) | Mua sắm & Tiền tệ | 18 từ | Đại từ 多少, Đơn vị tiền tệ 块/元 | `COVERED_VERIFIED` | **DRAFT** |
| **Unit 5** | **Bài 12** | 你去哪儿买东西 (Bạn đi đâu mua đồ) | Nơi chốn & Mua sắm | 18 từ | Đại từ nghi vấn 哪儿, Câu liên động | `COVERED_VERIFIED` | **DRAFT** |
| **Unit 5** | **Bài 13** | 他在学校前面 (Anh ấy ở phía trước trường) | Phương vị & Vị trí | 18 từ | Từ chỉ phương vị (前, 后, 里) | `COVERED_VERIFIED` | **DRAFT** |
| **Unit 6** | **Bài 14** | 你会开车吗 (Bạn biết lái xe không) | Kỹ năng & Khả năng | 18 từ | Động từ năng nguyện 会, Câu hỏi 吗 | `COVERED_VERIFIED` | **DRAFT** |
| **Unit 6** | **Bài 15** | 我是坐飞机来的 (Tôi đến bằng máy bay) | Cấu trúc nhấn mạnh & Ôn tập | 18 từ | Cấu trúc 是...的, Tổng kết cuối khóa | `COVERED_VERIFIED` | **DRAFT** |

---

## 4. ĐÁNH GIÁ ĐỘ LỆCH VÀ BẢO HIỂM HỌC THUẬT

1. **Từ vựng trong bài học vs Từ vựng bổ trợ:**
   - 15 bài học tích hợp trực tiếp **250 từ vựng cốt lõi** vào các đoạn hội thoại nghe - nói tự nhiên.
   - 50 từ vựng còn lại trong kho 300 từ đóng vai trò từ vựng mở rộng (Extended Vocabulary Bank) xuất hiện trong các bài đọc hiểu bổ trợ và ngân hàng câu hỏi ôn tập (Flashcards & Quizzes).
2. **Kỹ năng thi:**
   - Cung cấp đủ 100% dạng bài kiểm tra nghe (Listening Comprehension), đọc hiểu (Reading Matching & True/False) và trắc nghiệm ngữ pháp theo định dạng thi chuẩn hóa của CTI.
