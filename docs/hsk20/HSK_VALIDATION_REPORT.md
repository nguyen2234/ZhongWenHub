# ZhongWenHub — Báo cáo Kiểm tra Validator Dữ liệu HSK 1–4 (HSK 2.0)

- **Nguồn dữ liệu:** `ZhongWenHub_Dev` (trích xuất chỉ đọc, không tự tạo dữ liệu)
- **JSON Schema:** [`data/hsk20/schemas/hsk20-lesson-bundle.schema.json`](../../data/hsk20/schemas/hsk20-lesson-bundle.schema.json)
- **Validator:** [`scripts/hsk20/validate_hsk20_data.py`](../../scripts/hsk20/validate_hsk20_data.py)
- **JSON chi tiết:** [`data/hsk20/staging/hsk14_validation_report.json`](../../data/hsk20/staging/hsk14_validation_report.json)

---

## 1. Tổng hợp kết quả theo cấp độ

- **Tổng số bài kiểm tra:** **70** bài (HSK 1–4)
- **PASS (0 errors, 0 warnings):** **1** bài
- **WARNING (0 errors, có cảnh báo thiếu/Pinyin):** **69** bài
- **FAIL (có lỗi cấu trúc/dữ liệu không hợp lệ):** **0** bài
- **Chưa duyệt học thuật (`academicApproved = false`):** **64** bài *(tách biệt với lỗi kỹ thuật)*

| Cấp HSK | Tổng bài | PASS | WARNING | FAIL | Chưa duyệt học thuật |
|---|---:|---:|---:|---:|---:|
| **HSK 1** | 15 | 1 | 14 | 0 | 9 |
| **HSK 2** | 15 | 0 | 15 | 0 | 15 |
| **HSK 3** | 20 | 0 | 20 | 0 | 20 |
| **HSK 4** | 20 | 0 | 20 | 0 | 20 |

---

## 2. Phân loại lỗi & cảnh báo theo trường dữ liệu

### 2.1. Lỗi cấu trúc / dữ liệu không hợp lệ (`errors` → `FAIL`)
- Không ghi nhận lỗi cấu trúc (`0` lỗi trên 70 bài).

### 2.2. Cảnh báo dữ liệu thiếu & Pinyin (`warnings` → `WARNING`)
| Trường dữ liệu | Số lần xuất hiện | Phân loại |
|---|---:|---|
| `readingPassage.comprehensionQuestions[].optionsPinyin[]` | 132 | Thiếu trường chuẩn hóa (Giai đoạn 3) |
| `readingPassage.comprehensionQuestions[].optionsVi[]` | 132 | Thiếu trường chuẩn hóa (Giai đoạn 3) |
| `readingPassage.comprehensionQuestions[].questionPinyin` | 126 | Thiếu trường chuẩn hóa (Giai đoạn 3) |
| `readingPassage.sentences[]` | 69 | Thiếu trường chuẩn hóa (Giai đoạn 3) |
| `Duplicate` | 3 | Cảnh báo Pinyin / Từ vựng |
| `dialogue.lines[].pinyin` | 2 | Cảnh báo Pinyin / Từ vựng |

---

## 3. Chi tiết từng bài học (70 bài HSK 1–4)

| HSK | Bài | Tiêu đề | Kết quả | Errors | Warnings | Duyệt học thuật | Ghi chú chính |
|---:|---:|---|---|---:|---:|---|---|
| 1 | 1 | 你好 (Chào bạn) | **PASS** | 0 | 0 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | Đạt chuẩn kỹ thuật |
| 1 | 2 | 谢谢你 (Cảm ơn bạn) | **WARNING** | 0 | 3 | Đã duyệt | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].optionsPinyin missing |
| 1 | 3 | 你叫什么名字 (Bạn tên là gì) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 1 | 4 | 他是我的汉语老师 (Thầy ấy là giáo viên tiếng Trung của tôi) | **WARNING** | 0 | 3 | Đã duyệt | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].optionsPinyin missing |
| 1 | 5 | 我想喝茶 (Tôi muốn uống trà) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 1 | 6 | 你在做什么呢 (Bạn đang làm gì thế) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 1 | 7 | 今天星期几 (Hôm nay là thứ mấy) | **WARNING** | 0 | 3 | Đã duyệt | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].optionsPinyin missing |
| 1 | 8 | 明天天气怎么样 (Thời tiết ngày mai thế nào) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 1 | 9 | 现在几点 (Bây giờ là mấy giờ) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 1 | 10 | 我星期一去北京 (Thứ hai tôi đi Bắc Kinh) | **WARNING** | 0 | 3 | Đã duyệt | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].optionsPinyin missing |
| 1 | 11 | 这个苹果多少钱 (Quả táo này bao nhiêu tiền) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 1 | 12 | 你去哪儿买东西 (Bạn đi đâu mua đồ) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 1 | 13 | 他在学校前面 (Anh ấy ở phía trước trường học) | **WARNING** | 0 | 3 | Đã duyệt | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].optionsPinyin missing |
| 1 | 14 | 你会开车吗 (Bạn biết lái xe không) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 1 | 15 | 我是坐飞机来的 (Tôi đến bằng máy bay) | **WARNING** | 0 | 3 | Đã duyệt | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].optionsPinyin missing |
| 2 | 1 | 九月去北京旅游最好 (Đi du lịch Bắc Kinh vào tháng 9 là tốt nhất) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 2 | 2 | 我每天六点起床 (Mỗi ngày tôi thức dậy lúc 6 giờ) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 2 | 3 | 左边那个红色的是我的 (Cái màu đỏ bên trái là của tôi) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 2 | 4 | 这个工作是他帮我介绍的 (Công việc này là anh ấy giới thiệu cho tôi) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 2 | 5 | 就买这件吧 (Mua chiếc áo này đi) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 2 | 6 | 你怎么不吃了 (Sao bạn không ăn nữa) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 2 | 7 | 你家离公司远吗 (Nhà bạn cách công ty xa không) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 2 | 8 | 让我想想再告诉你 (Để tôi suy nghĩ rồi nói cho bạn biết nhé) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 2 | 9 | 题太多，我没做完 (Đề thi nhiều quá, tôi chưa làm xong) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 2 | 10 | 别找了，手机在桌子上呢 (Đừng tìm nữa, điện thoại ở trên bàn kìa) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 2 | 11 | 他比我大三岁 (Anh ấy lớn hơn tôi ba tuổi) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 2 | 12 | 你穿得太少了 (Bạn mặc ít áo quá) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 2 | 13 | 门开着呢 (Cửa đang mở đấy) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 2 | 14 | 你看过那个电影没有 (Bạn từng xem bộ phim đó chưa) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 2 | 15 | 新年就要到了 (Năm mới sắp đến rồi) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 3 | 1 | 周末你有什么打算 (Cuối tuần bạn có dự định gì) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 3 | 2 | 他什么时候回来 (Khi nào anh ấy quay lại) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 3 | 3 | 桌子上放着一杯咖啡 (Trên bàn có đặt một tách cà phê) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 3 | 4 | 她总是笑着跟客人说话 (Cô ấy luôn mỉm cười khi nói chuyện với khách) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 3 | 5 | 我最近越来越胖了 (Dạo này tôi ngày càng béo lên rồi) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 3 | 6 | 怎么突然找不到了 (Sao đột nhiên lại không tìm thấy) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 3 | 7 | 我跟你一起去 (Tôi đi cùng với bạn) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 3 | 8 | 你去哪儿我就去哪儿 (Bạn đi đâu tôi đi đó) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 3 | 9 | 她的汉语说得跟中国人一样好 (Tiếng Trung của cô ấy nói hay như người Trung Quốc) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 3 | 10 | 数学比历史难多了 (Môn toán khó hơn môn lịch sử nhiều) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 3 | 11 | 别忘了把空调关了 (Đừng quên tắt máy điều hòa) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 3 | 12 | 把重要的事写在本子上 (Hãy ghi những việc quan trọng vào sổ tay) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 3 | 13 | 走得越快越好 (Đi càng nhanh càng tốt) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 3 | 14 | 请把护照拿出来 (Xin hãy lấy hộ chiếu ra) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 3 | 15 | 除了看书，他还喜欢运动 (Ngoài đọc sách ra, anh ấy còn thích thể thao) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 3 | 16 | 我现在累得不想动 (Bây giờ tôi mệt đến mức không muốn cử động) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 3 | 17 | 谁都有生病的时候 (Ai cũng có lúc bị ốm) | **WARNING** | 0 | 8 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | Pinyin issue in dialogue.lines[0]: Invalid syllable in 'Xǐao Lì zuìjìn jǐ tiān hǎoxiàng shòu le shì bu shì xuéxí tài lèi le': Misplaced tone mark in syllable: 'xǐao'; readingPassage.sentences[] is missing (stage 3 structured alignment pending) |
| 3 | 18 | 我相信你一定能做好 (Tôi tin bạn nhất định có thể làm tốt) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 3 | 19 | 你没看懂这篇文章吗 (Bạn chưa đọc hiểu bài viết này sao) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 3 | 20 | 只要努力就会有收获 (Chỉ cần nỗ lực thì sẽ gặt hái thành quả) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 4 | 1 | 简单的爱情 (Tình yêu giản dị) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 4 | 2 | 真正的朋友 (Người bạn chân chính) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 4 | 3 | 一买即合 (Vừa nhìn là muốn mua ngay) | **WARNING** | 0 | 8 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | Duplicate vocabulary hanzi in lesson: 等; readingPassage.sentences[] is missing (stage 3 structured alignment pending) |
| 4 | 4 | 不要太在乎得失 (Đừng quá để tâm đến được mất) | **WARNING** | 0 | 8 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | Duplicate vocabulary hanzi in lesson: 对; readingPassage.sentences[] is missing (stage 3 structured alignment pending) |
| 4 | 5 | 只买对的，不买贵的 (Chỉ mua đồ đúng, không mua đồ đắt) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 4 | 6 | 一分钱一分货 (Tiền nào của nấy) | **WARNING** | 0 | 9 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | Duplicate vocabulary hanzi in lesson: 过; Pinyin issue in dialogue.lines[2]: Invalid syllable in 'Ng quèshí shēngyīn qīngxī duō le dàizhe ěrduo yě bù juéde mèn': Not a valid Mandarin base syllable: 'ng' |
| 4 | 7 | 最佳面试者 (Ứng viên phỏng vấn xuất sắc nhất) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 4 | 8 | 成功的秘密 (Bí quyết của sự thành công) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 4 | 9 | 阳光总在风雨后 (Ánh dương luôn rạng rỡ sau cơn mưa) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 4 | 10 | 幸福的标准 (Tiêu chuẩn của hạnh phúc) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 4 | 11 | 读书好，读好书 (Đọc sách tốt, đọc sách hay) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 4 | 12 | 用心发现美 (Dùng trái tim khám phá vẻ đẹp) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 4 | 13 | 喝着茶看京剧 (Vừa uống trà vừa thưởng thức Kinh kịch) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 4 | 14 | 保护地球母亲 (Bảo vệ mẹ Trái Đất) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 4 | 15 | 教育孩子的艺术 (Nghệ thuật giáo dục con trẻ) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 4 | 16 | 文化交流的桥梁 (Nhịp cầu giao lưu văn hóa) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 4 | 17 | 科技改变生活 (Khoa học công nghệ thay đổi đời sống) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 4 | 18 | 人与自然和谐相处 (Con người sống hài hòa với thiên nhiên) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 4 | 19 | 旅行的真正意义 (Ý nghĩa thực sự của những chuyến đi) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |
| 4 | 20 | 展望未来的世界 (Hướng tới thế giới tương lai) | **WARNING** | 0 | 7 | Chưa duyệt (`AI_GENERATED_NEEDS_ACADEMIC_REVIEW`) | readingPassage.sentences[] is missing (stage 3 structured alignment pending); comprehensionQuestions[0].questionPinyin missing |

---

## 4. Nội dung ưu tiên xử lý trước tiên (trước Giai đoạn C & D)

1. **Rà soát các trường hợp `errors` (nếu có):** Khắc phục toàn bộ bài `FAIL` trước khi cập nhật dữ liệu mới.
2. **Bổ sung trường chuẩn hóa đọc hiểu (69/70 bài thiếu):** `readingPassage.sentences[]`, `comprehensionQuestions[].questionPinyin`, `optionsPinyin[]`, `optionsVi[]` bắt đầu từ **Đợt 1: HSK 1 Bài 2–15**.
3. **Rà soát cảnh báo Pinyin (`vocabularies[].pinyin`, `dialogue.lines[].pinyin`, `listening[].transcriptPinyin`):** Kiểm tra lại các âm tiết có cảnh báo dấu thanh/ghép âm tiết hoặc từ đa âm.
4. **Kiểm duyệt học thuật (`64/70` bài `academicApproved = false`):** Giữ nguyên trạng thái chờ chuyên gia tiếng Trung duyệt; không tự động đánh dấu đã duyệt.
