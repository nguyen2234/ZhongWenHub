# ĐẶC TẢ KIẾN TRÚC MASTER CURRICULUM HSK 3.0 (CẤP 1–6)
## Comprehensive Master Curriculum Specification & Pedagogical Framework
**Dự án**: ZhongWenHub — Hệ sinh thái Đào tạo Tiếng Trung Chuẩn Quốc tế  
**Giai đoạn**: Phase 2 — Thiết kế Master Curriculum HSK 3.0 Cấp 1–6  
**Căn cứ chuẩn**: Khảo thí CTI/CLEC (`https://www.chinesetest.cn/syllabus`) & CSDL `ZhongWenHub_Dev`  
**Ngày ban hành**: 08/11/2026  
**Chuyên gia phụ trách**: Senior Chinese Assessment Specialist & Full-Stack Educational Architect  

---

## 1. NGUYÊN TẮC HỌC THUẬT & ĐỐI CHIẾU NGUỒN CHUẨN ĐỀ CƯƠNG

### 1.1. Tách biệt rành mạch hai hệ thống quy chuẩn HSK 3.0
Để tránh sai lệch phổ biến trên thị trường học liệu, Master Curriculum ZhongWenHub tuân thủ nghiêm ngặt nguyên tắc: **Không trộn lẫn khung giảng dạy học thuật tổng thể GF 0025-2021 với Đề cương khảo thí chính thức của CTI/CLEC**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TIÊU CHUẨN GF 0025-2021 (Khung Giảng Dạy Đại Học Dài Hạn)                              │
│ - HSK 1: 500 từ vựng · 300 chữ Hán · 48 điểm ngữ pháp                                 │
│ - HSK 2: 1,272 từ vựng (lũy kế) · 600 chữ Hán · 129 điểm ngữ pháp                      │
│ - HSK 3: 2,245 từ vựng (lũy kế) · 900 chữ Hán · 210 điểm ngữ pháp                      │
│ - HSK 1-6: 5,456 từ vựng · 1,800 chữ Hán · 424 điểm ngữ pháp                          │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │ Đối chiếu & phân loại thực tế
┌────────────────────────────────────────▼───────────────────────────────────────────────┐
│ ĐỀ CƯƠNG THI HSK 3.0 CHÍNH THỨC (CLEC / CTI Exam Syllabus — chinesetest.cn)            │
│ - Cấp 1: 300 từ vựng mục tiêu thi · 246-300 chữ Hán · 72 điểm ngữ pháp phân tầng       │
│ - Cấp 2: 200 từ vựng mới (500 lũy kế) · 125-300 chữ Hán · 78 điểm ngữ pháp             │
│ - Cấp 3: 500 từ vựng mới (1,000 lũy kế) · 284-300 chữ Hán · 96 điểm ngữ pháp           │
│ - Cấp 4: 1,000 từ vựng mới (2,000 lũy kế) · 441 chữ Hán · 95 điểm ngữ pháp             │
│ - Cấp 5: 1,600 từ vựng mới (3,600 lũy kế) · 431 chữ Hán · 70 điểm ngữ pháp             │
│ - Cấp 6: 1,800 từ vựng mới (5,400 lũy kế) · 413 chữ Hán · 50 điểm ngữ pháp             │
│ => TỔNG CỘNG HSK 1-6: ĐÚNG 5,400 TỪ VỰNG · 461 ĐIỂM NGỮ PHÁP · 1,940 CHỮ HÁN THỰC TẾ  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **TIÊU CHÍ GÁN TRẠNG THÁI XÁC MINH**:
> - `VERIFIED`: Chỉ gán cho các mục đã đối chiếu khớp 100% giữa SQL Server thật, mã nguồn API và đề cương CTI (ví dụ: các bài L1–L3 HSK 1 đã xuất bản, toàn bộ 5,400 từ vựng đã được làm sạch nghĩa tiếng Việt).
> - `PROPOSED_MASTER`: Gán cho cấu trúc bài học, mục tiêu đầu ra và hoạt động kỹ năng được đề xuất thiết kế cho 137 bài học đang ở trạng thái DRAFT.
> - `NEEDS_REVIEW`: Gán cho các thành phần chữ Hán cần phân bổ lại cấp hoặc bài tập cần mở rộng.

---

## 2. KIẾN TRÚC PHÂN TẦNG: COURSE → UNIT → LESSON

Toàn bộ hệ thống được chia thành 6 Khóa học (Courses), 35 Chương/Đơn vị bài học (Units) và 140 Bài giảng tương tác (Lessons).

```
ZHONGWENHUB MASTER CURRICULUM HSK 3.0 (LEVELS 1–6)
│
├── HSK 1: 1 Course · 6 Units · 15 Lessons · 300 Vocab · 72 Grammar · 28 Exercises
├── HSK 2: 1 Course · 5 Units · 15 Lessons · 200 Vocab · 78 Grammar · 30 Exercises
├── HSK 3: 1 Course · 5 Units · 20 Lessons · 500 Vocab · 96 Grammar · 40 Exercises
├── HSK 4: 1 Course · 5 Units · 20 Lessons · 1,000 Vocab · 95 Grammar · 40 Exercises
├── HSK 5: 1 Course · 6 Units · 30 Lessons · 1,600 Vocab · 70 Grammar · 60 Exercises
└── HSK 6: 1 Course · 8 Units · 40 Lessons · 1,800 Vocab · 50 Grammar · 80 Exercises
    ──────────────────────────────────────────────────────────────────────────────
    TỔNG:   6 Courses · 35 Units · 140 Lessons · 5,400 Vocab · 461 Grammar · 278 Exercises
```

---

## 3. THIẾT KẾ CHI TIẾT THEO TỪNG CẤP ĐỘ (HSK 1 ĐẾN HSK 6)

---

### 3.1. HSK CẤP 1: NỀN TẢNG GIAO TIẾP SINH TỒN (SURVIVAL CHINESE)
- **Mã khóa học**: `HSK1` (GUID: `11111111-1111-1111-1111-111111111111`)
- **Quy mô**: 6 Chương (Units) · 15 Bài học (Lessons) · 300 Từ vựng · 72 Điểm ngữ pháp · 246 Chữ Hán
- **Thời lượng tiêu chuẩn**: 20–30 phút/bài · 50–60 XP/bài

#### Bảng cấu trúc chương bài HSK 1:
| Chương (Unit) | Bài (Lesson) & Tên tiếng Trung | Tên tiếng Việt & Phiên âm Pinyin | Nhiệm vụ giao tiếp (Communicative Task) | Mục tiêu đo lường được (Measurable Outcomes) | Kiến thức tiên quyết | Học liệu thực tế (SQL Data) |
|---|---|---|---|---|---|---|
| **Unit 1**: 问候与认识<br>*(Chào hỏi & Làm quen)*<br>Status: `PUBLISHED` | **L1**: 你好 | **Chào bạn**<br>*(Nǐ hǎo)*<br>20m · 50XP | Chào hỏi lễ nghi, thể hiện sự lịch sự căn bản. | Chào hỏi đúng đối tượng (你 vs 您), nhận diện 23 từ vựng, viết 5 nét cơ bản. | Làm quen bảng phiên âm Pinyin. | 23 Vocab (你好, 您, 好...)<br>6 Grammar (GR30-HSK1-001...)<br>1 Exercise |
| | **L2**: 谢谢你 | **Cảm ơn bạn**<br>*(Xièxie nǐ)*<br>25m · 50XP | Nói lời cảm ơn, xin lỗi và đáp lại lịch thiệp. | Sử dụng thành thạo 谢谢, 不客气, 对不起, 没关系; nắm vững đại từ nhân xưng. | Hoàn thành L1. | 23 Vocab (谢谢, 不, 客气...)<br>5 Grammar (GR30-HSK1-007...)<br>2 Exercises |
| **Unit 2**: 家庭与朋友<br>*(Gia đình & Bạn bè)*<br>Status: `PUBLISHED` | **L3**: 你叫什么名字 | **Bạn tên là gì**<br>*(Nǐ jiào shénme míngzi)*<br>30m · 60XP | Hỏi tên tuổi, quốc tịch và giới thiệu danh tính. | Tự giới thiệu họ tên, hỏi người khác dùng đại từ nghi vấn 什么, nhận diện chữ 是. | Hoàn thành L2. | 22 Vocab (叫, 名字, 是, 老师...)<br>6 Grammar (Câu chữ 是, 什么...)<br>1 Exercise |
| | **L4**: 他是我的汉语老师 | **Thầy ấy là giáo viên tiếng Trung của tôi**<br>*(Tā shì wǒ de Hànyǔ lǎoshī)*<br>30m · 50XP | Giới thiệu các mối quan hệ (thầy cô, bạn bè, bạn học). | Vận dụng trợ từ kết cấu 的 biểu thị sở hữu; phân biệt tha nhân xưng (他, 她). | Hoàn thành L3. | 20 Vocab (的, 汉语, 同学, 朋友...)<br>5 Grammar (Trợ từ 的, nghi vấn 哪...)<br>2 Exercises |
| **Unit 3**: 饮食与日常<br>*(Ăn uống & Sinh hoạt)*<br>Status: `DRAFT` | **L5**: 她女儿今年二十岁 | **Con gái cô ấy năm nay 20 tuổi**<br>*(Tā nǚ'ér jīnnián èrshí suì)*<br>30m · 50XP | Hỏi tuổi tác, thành viên trong gia đình, đếm số 1–100. | Sử dụng 几 và 多大 để hỏi tuổi; đếm thành thạo số lượng trong phạm vi 100. | Số đếm cơ bản 1–10. | 18 Vocab (家, 有, 口, 女儿, 几, 岁...)<br>5 Grammar (Câu vị ngữ danh từ...)<br>2 Exercises |
| | **L6**: 我会说汉语 | **Tôi biết nói tiếng Trung**<br>*(Wǒ huì shuō Hànyǔ)*<br>30m · 50XP | Diễn đạt năng lực, khả năng và thói quen nấu ăn. | Sử dụng động từ năng nguyện 会 chỉ kỹ năng; câu vị ngữ tính từ. | Hoàn thành L5. | 19 Vocab (会, 说, 妈妈, 菜, 很, 好吃...)<br>5 Grammar (Động từ năng nguyện 会...)<br>2 Exercises |
| | **L7**: 今天几号 | **Hôm nay ngày mấy**<br>*(Jīntiān jǐ hào)*<br>30m · 50XP | Hỏi và nói ngày tháng, thứ trong tuần, lên lịch hẹn. | Đọc chính xác cấu trúc Ngày - Tháng - Năm - Thứ; hẹn ngày gặp mặt. | Hoàn thành L6. | 20 Vocab (请, 问, 今天, 号, 月, 星期...)<br>5 Grammar (Trật tự thời gian...)<br>2 Exercises |
| **Unit 4**: 时间与天气<br>*(Thời gian & Thời tiết)*<br>Status: `DRAFT` | **L8**: 我想喝茶 | **Tôi muốn uống trà**<br>*(Wǒ xiǎng hē chá)*<br>30m · 50XP | Bày tỏ mong muốn, gọi đồ uống và đồ ăn nhẹ. | Vận dụng động từ năng nguyện 想; hỏi số lượng với 多少 và đơn vị tiền 块. | Hoàn thành L7. | 20 Vocab (想, 喝, 茶, 吃, 米饭, 多少, 钱...)<br>4 Grammar (想 biểu thị nguyện vọng...)<br>2 Exercises |
| | **L9**: 你儿子在哪儿工作 | **Con trai bạn làm việc ở đâu**<br>*(Nǐ érzi zài nǎr gōngzuò)*<br>30m · 50XP | Hỏi và nói về địa điểm, nơi làm việc của người thân. | Sử dụng giới từ 在 chỉ nơi chốn; câu vị ngữ động từ có trạng ngữ chỉ địa điểm. | Hoàn thành L8. | 20 Vocab (在, 哪儿, 医院, 医生, 爸爸...)<br>4 Grammar (Giới từ 在 chỉ nơi chốn...)<br>2 Exercises |
| | **L10**: 我能坐这儿吗 | **Tôi có thể ngồi đây không**<br>*(Wǒ néng zuò zhèr ma)*<br>30m · 50XP | Xin phép, hỏi sự cho phép và mô tả vị trí đồ vật. | Sử dụng động từ năng nguyện 能 xin phép; nắm vững từ chỉ phương vị (这儿, 那儿, 上, 下). | Hoàn thành L9. | 20 Vocab (桌子, 上, 电脑, 本, 里, 前面, 坐...)<br>5 Grammar (Câu chữ 有 chỉ sự tồn tại...)<br>2 Exercises |
| **Unit 5**: 购物与出行<br>*(Mua sắm & Đi lại)*<br>Status: `DRAFT` | **L11**: 现在几点 | **Bây giờ mấy giờ**<br>*(Xiànzài jǐ diǎn)*<br>30m · 50XP | Hỏi giờ giấc chính xác, nói lịch trình sinh hoạt hàng ngày. | Biểu đạt giờ, phút, rưỡi (半); diễn đạt thời gian thực hiện hành động. | Hoàn thành L10. | 20 Vocab (现在, 点, 分, 中午, 吃饭, 什么时候...)<br>5 Grammar (Thời gian làm trạng ngữ...)<br>2 Exercises |
| | **L12**: 明天天气怎么样 | **Thời tiết ngày mai thế nào**<br>*(Míngtiān tiānqì zěnmeyàng)*<br>30m · 50XP | Hỏi thăm thời tiết, biểu đạt cảm giác nóng/lạnh, sức khỏe. | Sử dụng 怎么样 để hỏi tính chất; phó từ mức độ 太...了. | Hoàn thành L11. | 19 Vocab (天气, 怎么样, 太, 热, 冷, 下雨, 水...)<br>4 Grammar (Phó từ 太...了...)<br>2 Exercises |
| | **L13**: 他在学做中国菜呢 | **Anh ấy đang học nấu món Trung Quốc đấy**<br>*(Tā zài xué zuò Zhōngguó cài ne)*<br>30m · 50XP | Mô tả hành động đang diễn ra và gọi điện thoại. | Sử dụng phó từ 在 / 正在 / 呢 biểu thị hành động đang tiếp diễn; cách xưng hô qua điện thoại (喂). | Hoàn thành L12. | 18 Vocab (喂, 正在, 在, 做, 没, 读, 睡觉...)<br>5 Grammar (Cấu trúc 在...呢...)<br>2 Exercises |
| **Unit 6**: 爱好与复习<br>*(Sở thích & Ôn tập)*<br>Status: `DRAFT` | **L14**: 她买了不少衣服 | **Cô ấy đã mua không ít quần áo**<br>*(Tā mǎi le bù shǎo yīfu)*<br>30m · 50XP | Kể lại sự việc đã hoàn thành, đi mua sắm quần áo. | Sử dụng trợ từ động thái 了 sau động từ chỉ sự hoàn thành; cụm số lượng từ làm tân ngữ. | Hoàn thành L13. | 18 Vocab (买, 了, 衣服, 少, 不少, 后, 苹果...)<br>4 Grammar (Trợ từ động thái 了...)<br>2 Exercises |
| | **L15**: 我是坐飞机来的 | **Tôi đến đây bằng máy bay**<br>*(Wǒ shì zuò fēijī lái de)*<br>30m · 50XP | Nhấn mạnh thời gian, địa điểm, phương thức thực hiện hành động (Tổng kết HSK 1). | Sử dụng cấu trúc 是...的 để nhấn mạnh phương thức/thời gian; tổng ôn tập 300 từ HSK 1. | Hoàn thành L14. | 18 Vocab (认识, 年, 饭店, 大学, 飞机, 坐, 听...)<br>5 Grammar (Cấu trúc 是...的 nhấn mạnh...)<br>2 Exercises |

---

### 3.2. HSK CẤP 2: MỞ RỘNG GIAO TIẾP & ĐỜI SỐNG THƯỜNG NHẬT
- **Mã khóa học**: `HSK2` (GUID: `22222222-2222-2222-2222-222222222222`)
- **Quy mô**: 5 Chương (Units) · 15 Bài học (Lessons) · 200 Từ vựng mới (500 lũy kế) · 78 Điểm ngữ pháp · 30 Bài tập
- **Thời lượng tiêu chuẩn**: 30 phút/bài · 50 XP/bài

#### Bảng cấu trúc chương bài HSK 2:
| Chương (Unit) | Bài (Lesson) & Tên tiếng Trung | Tên tiếng Việt & Phiên âm | Trọng tâm ngữ pháp & Nhiệm vụ giao tiếp | Học liệu SQL liên kết |
|---|---|---|---|---|
| **Unit 1**: 生活与起居<br>*(Đời sống & Sinh hoạt)* | **L1**: 九月去北京旅游最好 | Đi du lịch Bắc Kinh vào tháng 9 là tốt nhất<br>*(Jiǔ yuè qù Běijīng lǚyóu zuì hǎo)* | Cấu trúc so sánh bậc nhất với 最; cấu trúc 要...了; lên kế hoạch du lịch mùa thu. | 14 Vocab (旅游, 觉得, 最, 为什么...)<br>6 Grammar (GR30-HSK2-001...)<br>2 Exercises |
| | **L2**: 我每天六点起床 | Mỗi ngày tôi thức dậy lúc 6 giờ<br>*(Wǒ měi tiān liù diǎn qǐchuáng)* | Câu hỏi phản vấn 怎么; động từ ly hợp chỉ sinh hoạt (起床, 跑步, 睡觉); thói quen tốt. | 13 Vocab (起床, 跑步, 药, 生病...)<br>5 Grammar (Động từ ly hợp...)<br>2 Exercises |
| | **L3**: 左边那个红色的是我的 | Cái màu đỏ bên trái là của tôi<br>*(Zuǒbian nà ge hóngsè de shì wǒ de)* | Cụm từ mang chữ 的 làm đại từ; hỏi và chọn đồ vật theo màu sắc, vị trí. | 13 Vocab (红, 色, 左边, 送, 手表...)<br>5 Grammar (Cụm chữ 的...)<br>2 Exercises |
| **Unit 2**: 工作与学习<br>*(Học tập & Công việc)* | **L4**: 这个工作是他帮我介绍的 | Công việc này là do anh ấy giới thiệu cho tôi<br>*(Zhège gōngzuò shì tā bāng wǒ jièshào de)* | Giới từ 帮; bổ ngữ kết quả (完, 好); giới thiệu bạn bè và công việc văn phòng. | 14 Vocab (帮, 介绍, 生日, 快乐, 晚上...)<br>5 Grammar (Bổ ngữ kết quả...)<br>2 Exercises |
| | **L5**: 就买这件吧 | Cứ mua chiếc này đi<br>*(Jiù mǎi zhè jiàn ba)* | Phó từ 就 biểu thị sự quyết đoán; lượng từ 件, 条; mua sắm quần áo và mặc cả. | 13 Vocab (就, 件, 衣服, 咖啡, 意思...)<br>5 Grammar (Phó từ 就...)<br>2 Exercises |
| | **L6**: 你怎么不吃了 | Sao bạn không ăn nữa<br>*(Nǐ zěnme bù chī le)* | Trợ từ động thái 了 chỉ sự biến đổi; câu hỏi 怎么 chỉ nguyên nhân; dùng bữa gia đình. | 13 Vocab (门, 外, 自行车, 羊肉, 面条...)<br>5 Grammar (Trợ từ 了 chỉ biến đổi...)<br>2 Exercises |
| **Unit 3**: 健康与运动<br>*(Sức khỏe & Vận động)* | **L7**: 差不多 | Gần như vậy, xấp xỉ<br>*(Chàbuduō)* | Tính từ / phó từ 差不多; so sánh 比; trao đổi về cân nặng, chiều cao và tiến độ. | 14 Vocab (快, 雪, 零, 度, 穿, 进...)<br>6 Grammar (Cấu trúc so sánh 比...)<br>2 Exercises |
| | **L8**: 让我想想 | Để tôi suy nghĩ một chút<br>*(Ràng wǒ xiǎngxshang)* | Câu kiêm ngữ với 让; động từ trùng điệp (看看, 想想); suy nghĩ và đưa ra quyết định. | 13 Vocab (让, 告诉, 等, 找, 事情...)<br>5 Grammar (Câu kiêm ngữ...)<br>2 Exercises |
| | **L9**: 题太多，我没做完 | Đề nhiều quá, tôi làm không hết<br>*(Tí tài duō, wǒ méi zuòwán)* | Bổ ngữ kết quả 完; phó từ 次; thi cử, làm bài tập và đánh giá độ khó. | 13 Vocab (题, 完, 开始, 错, 懂...)<br>5 Grammar (Phủ định bổ ngữ kết quả...)<br>2 Exercises |
| **Unit 4**: 交往与娱乐<br>*(Giao lưu & Giải trí)* | **L10**: 别找了，手机在桌子上呢 | Đừng tìm nữa, điện thoại ở trên bàn kìa<br>*(Bié zhǎo le, shǒujī zài zhuōzi shang ne)* | Phó từ khuyên ngăn 别...了; vị trí đồ vật và tìm kiếm đồ đạc thất lạc. | 13 Vocab (别, 找, 手机, 唱歌, 跳舞...)<br>5 Grammar (Cấu trúc 别...了...)<br>2 Exercises |
| | **L11**: 他比我大三岁 | Anh ấy lớn hơn tôi 3 tuổi<br>*(Tā bǐ wǒ dà sān suì)* | Câu chữ 比 có bổ ngữ số lượng; so sánh chi tiết về tuổi tác, ngoại hình. | 13 Vocab (比, 矮, 高, 长, 眼睛...)<br>5 Grammar (Câu chữ 比 có số lượng...)<br>2 Exercises |
| | **L12**: 你穿得太少了 | Bạn mặc ít quá đấy<br>*(Nǐ chuān de tài shǎo le)* | Bổ ngữ trạng thái với 得 (chuān de shǎo); quan tâm sức khỏe khi trời lạnh. | 13 Vocab (得, 穿, 少, 冷, 暖和...)<br>5 Grammar (Bổ ngữ trạng thái...)<br>2 Exercises |
| **Unit 5**: 出行与复习<br>*(Đi lại & Ôn tập)* | **L13**: 门开着呢 | Cửa đang mở kìa<br>*(Mén kāi zhe ne)* | Trợ từ động thái 着 biểu thị trạng thái đang tiếp diễn; mô tả không gian tĩnh. | 14 Vocab (开, 着, 关, 眼睛, 往...)<br>5 Grammar (Trợ từ 着 chỉ trạng thái...)<br>2 Exercises |
| | **L14**: 你看过那个电影没有 | Bạn đã từng xem bộ phim đó chưa<br>*(Nǐ kànguo nà ge diànyǐng méiyǒu)* | Trợ từ động thái 过 biểu thị kinh nghiệm từng trải; hỏi sở thích xem phim. | 14 Vocab (过, 电影, 晴, 阴, 懂...)<br>5 Grammar (Trợ từ 过 chỉ kinh nghiệm...)<br>2 Exercises |
| | **L15**: 新年就要到了 | Năm mới sắp đến rồi<br>*(Xīnnián jiù yào dào le)* | Cấu trúc 快要...了 / 就要...了; đón tết, chúc mừng năm mới; Tổng kết HSK 2. | 13 Vocab (新年, 票, 火车站, 大家, 更...)<br>6 Grammar (Cấu trúc 就要...了...)<br>2 Exercises |

---

### 3.3. HSK CẤP 3: TỰ CHỦ ĐỜI SỐNG, DU LỊCH & CÔNG SỞ
- **Mã khóa học**: `HSK3` (GUID: `33333333-3333-3333-3333-333333333333`)
- **Quy mô**: 5 Chương (Units) · 20 Bài học (Lessons) · 500 Từ vựng mới (1,000 lũy kế) · 96 Điểm ngữ pháp · 40 Bài tập
- **Trọng tâm sư phạm**: Bổ ngữ xu hướng phức hợp (V + 出来, 起来, 下去), Câu chữ 把 (把字句), Câu so sánh 跟...一样, Liên từ phức hợp (不仅...而且..., 虽然...但是...).

#### Phân bổ 5 Chương HSK 3:
1. **Unit 1: 周末与计划 (Kế hoạch cuối tuần & Du lịch)** — Bài 1 đến Bài 4 (100 từ vựng, 20 ngữ pháp, 8 bài tập).
2. **Unit 2: 生活与情感 (Đời sống tình cảm & Bạn bè)** — Bài 5 đến Bài 8 (100 từ vựng, 20 ngữ pháp, 8 bài tập).
3. **Unit 3: 职场与社交 (Công sở & Giao tiếp xã hội)** — Bài 9 đến Bài 12 (100 từ vựng, 20 ngữ pháp, 8 bài tập).
4. **Unit 4: 健康与习惯 (Sức khỏe & Lối sống)** — Bài 13 đến Bài 16 (100 từ vựng, 20 ngữ pháp, 8 bài tập).
5. **Unit 5: 环境与未来 (Môi trường sống & Mục tiêu tương lai)** — Bài 17 đến Bài 20 (100 từ vựng, 16 ngữ pháp, 8 bài tập).

---

### 3.4. HSK CẤP 4: HIỆN TƯỢNG XÃ HỘI & GIAO TIẾP ĐOẠN VĂN
- **Mã khóa học**: `HSK4` (GUID: `44444444-4444-4444-4444-444444444444`)
- **Quy mô**: 5 Chương (Units) · 20 Bài học (Lessons) · 1,000 Từ vựng mới (2,000 lũy kế) · 95 Điểm ngữ pháp · 40 Bài tập
- **Trọng tâm sư phạm**: Câu bị động (被字句), Cấu trúc phản vấn và nhấn mạnh (连...都/也..., 哪怕...也...), Từ ngữ văn viết cơ bản (以及, 甚至, 从而, 无论).

#### Phân bổ 5 Chương HSK 4:
1. **Unit 1: 爱情与友谊 (Tình yêu & Tình bạn)** — Bài 1 đến Bài 4 (200 từ vựng, 20 ngữ pháp, 8 bài tập).
2. **Unit 2: 职场与成功 (Thành công & Nơi làm việc)** — Bài 5 đến Bài 8 (200 từ vựng, 20 ngữ pháp, 8 bài tập).
3. **Unit 3: 生活与感悟 (Cảm thụ cuộc sống & Tâm lý)** — Bài 9 đến Bài 12 (200 từ vựng, 20 ngữ pháp, 8 bài tập).
4. **Unit 4: 科学与自然 (Khoa học & Thiên nhiên)** — Bài 13 đến Bài 16 (200 từ vựng, 20 ngữ pháp, 8 bài tập).
5. **Unit 5: 社会与时代 (Xã hội & Kỷ nguyên mới)** — Bài 17 đến Bài 20 (200 từ vựng, 15 ngữ pháp, 8 bài tập).

---

### 3.5. HSK CẤP 5: BIỆN LUẬN, KINH TẾ & DIỄN NGÔN HỌC THUẬT
- **Mã khóa học**: `HSK5` (GUID: `55555555-5555-5555-5555-555555555555`)
- **Quy mô**: 6 Chương (Units) · 30 Bài học (Lessons) · 1,600 Từ vựng mới (3,600 lũy kế) · 70 Điểm ngữ pháp · 60 Bài tập
- **Trọng tâm sư phạm**: Thư diện ngữ (书面语), Hư từ cổ ngữ thông dụng (乃, 亦, 尚, 岂), Cấu trúc lập luận đa tầng, Diễn đạt logic học thuật.

#### Phân bổ 6 Chương HSK 5:
1. **Unit 1: 人生哲理 (Triết lý nhân sinh & Lẽ sống)** — Bài 1 đến Bài 5 (267 từ, 12 ngữ pháp, 10 bài tập).
2. **Unit 2: 文化遗产 (Di sản văn hóa & Truyền thống)** — Bài 6 đến Bài 10 (267 từ, 12 ngữ pháp, 10 bài tập).
3. **Unit 3: 科技与商业 (Công nghệ & Thương mại hiện đại)** — Bài 11 đến Bài 15 (267 từ, 12 ngữ pháp, 10 bài tập).
4. **Unit 4: 社会百态 (Xã hội & Đời sống cộng đồng)** — Bài 16 đến Bài 20 (267 từ, 12 ngữ pháp, 10 bài tập).
5. **Unit 5: 生态与健康 (Hệ sinh thái & Sống xanh)** — Bài 21 đến Bài 25 (266 từ, 11 ngữ pháp, 10 bài tập).
6. **Unit 6: 全球视野 (Tầm nhìn toàn cầu & Tương lai)** — Bài 26 đến Bài 30 (266 từ, 11 ngữ pháp, 10 bài tập).

---

### 3.6. HSK CẤP 6: TINH HOA NGÔN NGỮ & QUẢN TRỊ VĨ MÔ
- **Mã khóa học**: `HSK6` (GUID: `66666666-6666-6666-6666-666666666666`)
- **Quy mô**: 8 Chương (Units) · 40 Bài học (Lessons) · 1,800 Từ vựng mới (5,400 lũy kế) · 50 Điểm ngữ pháp · 80 Bài tập
- **Trọng tâm sư phạm**: Tu từ cổ điển, Thành ngữ 4 chữ (成语), Điển cố văn hóa, Văn kiện ngoại giao và nghiên cứu chuyên sâu.

#### Phân bổ 8 Chương HSK 6:
1. **Unit 1: 哲学思想与智慧 (Tư tưởng triết học & Trí tuệ)** — Bài 1 đến Bài 5 (225 từ, 7 ngữ pháp, 10 bài tập).
2. **Unit 2: 文学审美与经典 (Mỹ học văn chương & Kinh điển)** — Bài 6 đến Bài 10 (225 từ, 7 ngữ pháp, 10 bài tập).
3. **Unit 3: 历史变迁与启示 (Biến thiên lịch sử & Nhân loại)** — Bài 11 đến Bài 15 (225 từ, 6 ngữ pháp, 10 bài tập).
4. **Unit 4: 前沿科技与伦理 (Khoa học đỉnh cao & Đạo đức)** — Bài 16 đến Bài 20 (225 từ, 6 ngữ pháp, 10 bài tập).
5. **Unit 5: 经济全球化与治理 (Kinh tế toàn cầu & Quản trị)** — Bài 21 đến Bài 25 (225 từ, 6 ngữ pháp, 10 bài tập).
6. **Unit 6: 社会治理与公共政策 (Quản trị xã hội & Chính sách)** — Bài 26 đến Bài 30 (225 từ, 6 ngữ pháp, 10 bài tập).
7. **Unit 7: 艺术鉴赏与美育 (Thưởng thức nghệ thuật & Thẩm mỹ)** — Bài 31 đến Bài 35 (225 từ, 6 ngữ pháp, 10 bài tập).
8. **Unit 8: 人类命运与未来篇章 (Vận mệnh nhân loại & Tương lai)** — Bài 36 đến Bài 40 (225 từ, 6 ngữ pháp, 10 bài tập).

---

## 4. MA TRẬN PHÂN BỔ 4 HOẠT ĐỘNG KỸ NĂNG VÀ ĐÁNH GIÁ TRONG MỖI BÀI HỌC

Mỗi bài học trong 140 bài của ZhongWenHub được quy chuẩn hóa thành chu trình sư phạm 5 bước tích hợp:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ BƯỚC 1: KHỞI ĐỘNG & TỪ VỰNG TRỌNG TÂM (Vocab Acquisition & Pronunciation)             │
│ - Tương tác thẻ từ Flashcard âm thanh Pinyin chuẩn bản xứ.                             │
│ - Nhận diện chữ Hán, chiết tự bộ thủ, phân biệt âm Hán Việt tương ứng.               │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼───────────────────────────────────────────────┐
│ BƯỚC 2: KHÁM PHÁ BÀI KHÓA HỘI THOẠI (Dialogue & Contextual Immersion)                  │
│ - Nghe bài hội thoại 2-4 nhân vật (kèm audio bản ngữ chuẩn Bắc Kinh).                 │
│ - Bật/tắt 3 tầng hiển thị: Chữ Hán, Phiên âm Pinyin, Dịch nghĩa tiếng Việt.           │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼───────────────────────────────────────────────┐
│ BƯỚC 3: GIẢI MÃ ĐIỂM NGỮ PHÁP (Grammar Decryption & Sentence Patterns)                 │
│ - Công thức trực quan (Formula), phân tích ngữ cảnh sử dụng thực tế.                   │
│ - 3 ví dụ đối chiếu và bài tập trắc nghiệm củng cố (PracticeJson).                     │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼───────────────────────────────────────────────┐
│ BƯỚC 4: LUYỆN TẬP 4 KỸ NĂNG TOÀN DIỆN (Comprehensive 4-Skills Drills)                 │
│ - Nghe: Nghe chọn tranh, nghe điền từ còn thiếu vào câu.                               │
│ - Nói: Nhại âm (Shadowing), ghi âm phản xạ trả lời câu hỏi tình huống.                 │
│ - Đọc: Đọc đoạn văn ngắn không Pinyin, đọc chọn đáp án đúng/sai.                      │
│ - Viết: Tập viết chữ Hán theo thứ tự nét (bút thuận), sắp xếp từ thành câu.           │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼───────────────────────────────────────────────┐
│ BƯỚC 5: ĐÁNH GIÁ ĐẦU RA & ÔN TẬP XOẮN ỐC (Mastery Assessment & Spaced Repetition)     │
│ - Bài kiểm tra nhỏ 5-10 câu trắc nghiệm (Exercises). Đạt >= 80% để mở khóa bài tiếp. │
│ - Tích hợp điểm thưởng XP và lưu tiến độ vào bảng student_lesson_progress.             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. CAM KẾT BẢO TOÀN DỮ LIỆU HIỆN HỮU & TÍNH TOÀN VẸN HỆ THỐNG

1. **Bảo toàn 100% Khóa chính (Primary Keys)**:
   - Toàn bộ 6 GUIDs của `courses`, 35 GUIDs của `units`, 140 GUIDs của `lessons`, 278 GUIDs của `exercises` được giữ nguyên vẹn 100%.
2. **Bảo toàn 100% Liên kết khóa ngoại (Foreign Keys)**:
   - 5,400 bản ghi `vocabularies.LessonId` và 461 bản ghi `grammar_points.LessonId` đang liên kết chính xác không bị thay đổi.
3. **Bảo vệ toàn vẹn tiến độ người dùng**:
   - 11 bản ghi tiến độ trong `student_lesson_progress`, 10 hồ sơ trong `student_learning_profiles`, 10 ví trong `user_wallets` và 16 giao dịch hoàn toàn không bị ảnh hưởng.
4. **Không tạo bản ghi trùng lặp**:
   - Master Curriculum tái sử dụng triệt để bộ khung 140 bài học hiện hữu, không sinh thêm bài học ảo làm phình to cơ sở dữ liệu.
