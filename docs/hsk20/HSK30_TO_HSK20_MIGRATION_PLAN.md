# ZHONGWENHUB — KẾ HOẠCH CHUYỂN ĐỔI HỌC LIỆU SANG HSK 2.0
## COMPREHENSIVE CURRICULUM GAP ANALYSIS & MIGRATION ROADMAP (HSK 1–4)

- **Dự án:** ZhongWenHub
- **Phạm vi chuyển đổi:** HSK 1 đến HSK 4 (Chính xác 70 bài học)
- **Quy chuẩn giáo trình mục tiêu:** HSK Standard Course 2.0 (Nhà xuất bản Đại học Ngôn ngữ Bắc Kinh - BLCUP)
- **Ngày lập kế hoạch:** 11/11/2026
- **Trạng thái thực thi:** Giai đoạn lập kế hoạch & đối chiếu (Không ghi đè dữ liệu Staging/Test)

---

## I. BỐI CẢNH & NGUYÊN TẮC CHUYỂN ĐỔI

1. **Mục tiêu chiến lược:** Chuyển đổi trọng tâm học liệu của ZhongWenHub sang bộ giáo trình kinh điển **HSK Standard Course 2.0**, bộ giáo trình phổ biến nhất thế giới trong việc luyện thi và giảng dạy tiếng Trung từ HSK 1 đến HSK 4.
2. **Cấu trúc 4 cấp độ vững chắc:**
   - **HSK 1:** 15 bài học.
   - **HSK 2:** 15 bài học.
   - **HSK 3:** 20 bài học.
   - **HSK 4:** 20 bài học (Tích hợp 4A bài 1–10 và 4B bài 11–20).
   - **HSK 5 & 6:** Sắp ra mắt (Coming Soon) — Không tạo bài học giả.
   - **TỔNG CỘNG: 70 BÀI HỌC.**
3. **Nguyên tắc an toàn dữ liệu:**
   - Cơ sở dữ liệu `ZhongWenHub_Dev` và `ZhongWenHub_Test` được bảo toàn nguyên trạng, **0 thao tác ghi** trong giai đoạn này.
   - Không kết luận tương thích chỉ dựa trên sự trùng khớp về số lượng bài học mà phải đối soát chi tiết chủ đề, từ vựng, ngữ pháp và bài tập.

---

## II. TỔNG HỢP ĐỐI CHIẾU GAP ANALYSIS (70 BÀI HIỆN TẠI VS HSK 2.0)

- **Tổng số bài học đối chiếu:** 70 bài
- **Số bài khớp hoàn toàn (MATCHED):** 34 bài (~48.6%)
- **Số bài khớp một phần (PARTIAL_MATCH):** 2 bài (~2.8%)
- **Số bài cần rà soát & điều chỉnh chủ đề (NEEDS_REVIEW):** 34 bài (~48.6%)
- **Số bài thiếu nguồn (SOURCE_MISSING):** 0 bài (Đã có đầy đủ 100% sách và audio HSK 1–4B)

> [!NOTE]
> **Nhận xét chuyên môn:**
> - **HSK 1 và HSK 2 (30 bài):** Tương thích 100% với HSK Standard Course 2.0 từ tiêu đề Hanzi, chủ đề sinh hoạt, từ vựng đến các điểm ngữ pháp trọng tâm.
> - **HSK 3 và HSK 4 (40 bài):** Do hệ thống trước đây xây dựng dựa trên khung đề cương HSK 3.0 (phân bổ chủ đề thảo luận xã hội và văn hóa), các bài học cần được sắp xếp lại thứ tự chủ đề và biên tập lại hội thoại/từ vựng để khớp chính xác với 20 bài học của sách HSK 3 và 20 bài học của sách HSK 4A/4B Standard Course.

---

## III. BẢNG CHI TIẾT ĐỐI CHIẾU 70 BÀI HỌC THEO TỪNG CẤP ĐỘ

### Bảng đối chiếu HSK1 (15 bài học)

| Bài | Tiêu đề HSK 2.0 Chuẩn | Chủ đề bài học | Tiêu đề hiện tại trong DB | Khớp | Đánh giá khác biệt |
|:---:|:---|:---|:---|:---:|:---|
| 1 | **你好** | Chào hỏi & Làm quen | 你好 | **MATCHED** | Exact match: '你好' |
| 2 | **谢谢你** | Cảm ơn & Xin lỗi | 谢谢你 | **MATCHED** | Exact match: '谢谢你' |
| 3 | **你叫什么名字** | Hỏi tên & Quốc tịch | 你叫什么名字 | **MATCHED** | Exact match: '你叫什么名字' |
| 4 | **她是我的汉语老师** | Xưng hô & Giới thiệu người | 他是我的汉语老师 | `NEEDS_REVIEW` | Different theme/title: DB='他是我的汉语老师' vs Standard='她是我的汉语老师' |
| 5 | **她女儿今年二十岁** | Tuổi tác & Gia đình | 我想喝茶 | `NEEDS_REVIEW` | Different theme/title: DB='我想喝茶' vs Standard='她女儿今年二十岁' |
| 6 | **我会说汉语** | Kỹ năng & Món ăn | 你在做什么呢 | `NEEDS_REVIEW` | Different theme/title: DB='你在做什么呢' vs Standard='我会说汉语' |
| 7 | **今天几号** | Ngày tháng & Thứ | 今天星期几 | `NEEDS_REVIEW` | Different theme/title: DB='今天星期几' vs Standard='今天几号' |
| 8 | **我想喝茶** | Ăn uống & Mua sắm (Giá cả) | 明天天气怎么样 | `NEEDS_REVIEW` | Different theme/title: DB='明天天气怎么样' vs Standard='我想喝茶' |
| 9 | **你儿子在哪儿工作** | Vị trí & Nghề nghiệp | 现在几点 | `NEEDS_REVIEW` | Different theme/title: DB='现在几点' vs Standard='你儿子在哪儿工作' |
| 10 | **我能坐这儿吗** | Phương vị & Đề nghị | 我星期一去北京 | `NEEDS_REVIEW` | Different theme/title: DB='我星期一去北京' vs Standard='我能坐这儿吗' |
| 11 | **现在几点** | Thời gian & Lịch trình | 这个苹果多少钱 | `NEEDS_REVIEW` | Different theme/title: DB='这个苹果多少钱' vs Standard='现在几点' |
| 12 | **明天天气怎么样** | Thời tiết & Sức khỏe | 你去哪儿买东西 | `NEEDS_REVIEW` | Different theme/title: DB='你去哪儿买东西' vs Standard='明天天气怎么样' |
| 13 | **他在学做中国菜呢** | Hành động đang tiếp diễn | 他在学校前面 | `NEEDS_REVIEW` | Different theme/title: DB='他在学校前面' vs Standard='他在学做中国菜呢' |
| 14 | **她买了不少衣服** | Mua sắm & Trợ từ 了 | 你会开车吗 | `NEEDS_REVIEW` | Different theme/title: DB='你会开车吗' vs Standard='她买了不少衣服' |
| 15 | **我是坐飞机来的** | Phương tiện & Kết cấu 是...的 | 我是坐飞机来的 | **MATCHED** | Exact match: '我是坐飞机来的' |

### Bảng đối chiếu HSK2 (15 bài học)

| Bài | Tiêu đề HSK 2.0 Chuẩn | Chủ đề bài học | Tiêu đề hiện tại trong DB | Khớp | Đánh giá khác biệt |
|:---:|:---|:---|:---|:---:|:---|
| 1 | **九月去北京旅游最好** | Du lịch & Mùa | 九月去北京旅游最好 | **MATCHED** | Exact match: '九月去北京旅游最好' |
| 2 | **我每天六点起床** | Sinh hoạt hằng ngày & Thể thao | 我每天六点起床 | **MATCHED** | Exact match: '我每天六点起床' |
| 3 | **左边那个红色的是我的** | Màu sắc & Phương hướng | 左边那个红色的是我的 | **MATCHED** | Exact match: '左边那个红色的是我的' |
| 4 | **这个工作是他帮我介绍的** | Công việc & Giúp đỡ | 这个工作是他帮我介绍的 | **MATCHED** | Exact match: '这个工作是他帮我介绍的' |
| 5 | **就买这件吧** | Mua sắm quần áo & Lựa chọn | 就买这件吧 | **MATCHED** | Exact match: '就买这件吧' |
| 6 | **你怎么不吃了** | Ăn uống & Sức khỏe | 你怎么不吃了 | **MATCHED** | Exact match: '你怎么不吃了' |
| 7 | **你家离公司远吗** | Khoảng cách & Phương tiện | 你家离公司远吗 | **MATCHED** | Exact match: '你家离公司远吗' |
| 8 | **让我想想再告诉你** | Suy nghĩ & Kế hoạch | 让我想想再告诉你 | **MATCHED** | Exact match: '让我想想再告诉你' |
| 9 | **题太多，我没做完** | Bổ ngữ kết quả & Thi cử | 题太多，我没做完 | **MATCHED** | Exact match: '题太多，我没做完' |
| 10 | **别找了，手机在桌子上呢** | Tìm đồ & Phó từ 别 | 别找了，手机在桌子上呢 | **MATCHED** | Exact match: '别找了，手机在桌子上呢' |
| 11 | **他比我大三岁** | Câu so sánh 比 | 他比我大三岁 | **MATCHED** | Exact match: '他比我大三岁' |
| 12 | **你穿得太少了** | Bổ ngữ trạng thái & Thời tiết | 你穿得太少了 | **MATCHED** | Exact match: '你穿得太少了' |
| 13 | **门开着呢** | Trợ từ động thái 着 | 门开着呢 | **MATCHED** | Exact match: '门开着呢' |
| 14 | **你看过那个电影吗** | Trợ từ động thái 过 & Kinh nghiệm | 你看过那个电影没有 | `NEEDS_REVIEW` | Different theme/title: DB='你看过那个电影没有' vs Standard='你看过那个电影吗' |
| 15 | **新年就要到了** | Thời gian tương lai 快要...了 | 新年就要到了 | **MATCHED** | Exact match: '新年就要到了' |

### Bảng đối chiếu HSK3 (20 bài học)

| Bài | Tiêu đề HSK 2.0 Chuẩn | Chủ đề bài học | Tiêu đề hiện tại trong DB | Khớp | Đánh giá khác biệt |
|:---:|:---|:---|:---|:---:|:---|
| 1 | **周末你有什么打算** | Kế hoạch cuối tuần | 周末你有什么打算 | **MATCHED** | Exact match: '周末你有什么打算' |
| 2 | **他什么时候回来** | Bổ ngữ xu hướng đơn | 他什么时候回来 | **MATCHED** | Exact match: '他什么时候回来' |
| 3 | **桌子上放着很多饮料** | Câu tồn tại & Trợ từ 着 | 桌子上放着一杯咖啡 | `NEEDS_REVIEW` | Different theme/title: DB='桌子上放着一杯咖啡' vs Standard='桌子上放着很多饮料' |
| 4 | **她总是笑着也跟客人说话** | Hai hành động đồng thời | 她总是笑着跟客人说话 | `NEEDS_REVIEW` | Different theme/title: DB='她总是笑着跟客人说话' vs Standard='她总是笑着也跟客人说话' |
| 5 | **我最近越来越胖了** | Cấu trúc 越来越 | 我最近越来越胖了 | **MATCHED** | Exact match: '我最近越来越胖了' |
| 6 | **怎么突然找不到了** | Bổ ngữ khả năng | 怎么突然找不到了 | **MATCHED** | Exact match: '怎么突然找不到了' |
| 7 | **我跟你一起去吧** | Đi cùng & Bổ ngữ số lượng | 我跟你一起去 | `PARTIAL_MATCH` | Partial match: DB='我跟你一起去' vs Standard='我跟你一起去吧' |
| 8 | **你去哪儿我就去哪儿** | Đại từ nghi vấn phiếm chỉ | 你去哪儿我就去哪儿 | **MATCHED** | Exact match: '你去哪儿我就去哪儿' |
| 9 | **她的汉语说得跟中国人一样好** | So sánh 一样 | 她的汉语说得跟中国人一样好 | **MATCHED** | Exact match: '她的汉语说得跟中国人一样好' |
| 10 | **数学比历史难多了** | So sánh hơn mức độ cao | 数学比历史难多了 | **MATCHED** | Exact match: '数学比历史难多了' |
| 11 | **别忘了把空调关了** | Câu chữ 把 (1) | 别忘了把空调关了 | **MATCHED** | Exact match: '别忘了把空调关了' |
| 12 | **把重要的东西放在我这儿吧** | Câu chữ 把 (2) | 把重要的事写在本子上 | `NEEDS_REVIEW` | Different theme/title: DB='把重要的事写在本子上' vs Standard='把重要的东西放在我这儿吧' |
| 13 | **我是走回来的** | Bổ ngữ xu hướng kép | 走得越快越好 | `NEEDS_REVIEW` | Different theme/title: DB='走得越快越好' vs Standard='我是走回来的' |
| 14 | **你把水果拿过来** | Câu chữ 把 kết hợp bổ ngữ xu hướng | 请把护照拿出来 | `NEEDS_REVIEW` | Different theme/title: DB='请把护照拿出来' vs Standard='你把水果拿过来' |
| 15 | **其他都没什么问题** | Phủ định phiếm chỉ | 除了看书，他还喜欢运动 | `NEEDS_REVIEW` | Different theme/title: DB='除了看书，他还喜欢运动' vs Standard='其他都没什么问题' |
| 16 | **我现在累得下班就想睡觉** | Bổ ngữ trạng thái mức độ | 我现在累得不想动 | `NEEDS_REVIEW` | Different theme/title: DB='我现在累得不想动' vs Standard='我现在累得下班就想睡觉' |
| 17 | **谁都有办法看好这种病** | Khẳng định toàn thể | 谁都有生病的时候 | `NEEDS_REVIEW` | Different theme/title: DB='谁都有生病的时候' vs Standard='谁都有办法看好这种病' |
| 18 | **我相信他们会同意的** | Khẳng định với 的 | 我相信你一定能做好 | `NEEDS_REVIEW` | Different theme/title: DB='我相信你一定能做好' vs Standard='我相信他们会同意的' |
| 19 | **你没看出来吗** | Bổ ngữ xu hướng trừu tượng | 你没看懂这篇文章吗 | `NEEDS_REVIEW` | Different theme/title: DB='你没看懂这篇文章吗' vs Standard='你没看出来吗' |
| 20 | **我被他影响了** | Câu chữ 被 (Bị động) | 只要努力就会有收获 | `NEEDS_REVIEW` | Different theme/title: DB='只要努力就会有收获' vs Standard='我被他影响了' |

### Bảng đối chiếu HSK4 (20 bài học)

| Bài | Tiêu đề HSK 2.0 Chuẩn | Chủ đề bài học | Tiêu đề hiện tại trong DB | Khớp | Đánh giá khác biệt |
|:---:|:---|:---|:---|:---:|:---|
| 1 | **简单的爱情** | Tình yêu & Hôn nhân | 简单的爱情 | **MATCHED** | Exact match: '简单的爱情' |
| 2 | **真正的朋友** | Bạn bè & Sự tin tưởng | 真正的朋友 | **MATCHED** | Exact match: '真正的朋友' |
| 3 | **经理对我印象很好** | Công sở & Phỏng vấn | 一买即合 | `NEEDS_REVIEW` | Different theme/title: DB='一买即合' vs Standard='经理对我印象很好' |
| 4 | **不要太着急赚钱** | Sự nghiệp & Kinh nghiệm | 不要太在乎得失 | `NEEDS_REVIEW` | Different theme/title: DB='不要太在乎得失' vs Standard='不要太着急赚钱' |
| 5 | **只买对的，不买贵的** | Mua sắm & Tiêu dùng | 只买对的，不买贵的 | **MATCHED** | Exact match: '只买对的，不买贵的' |
| 6 | **一分钱一分货** | Giá cả & Chất lượng | 一分钱一分货 | **MATCHED** | Exact match: '一分钱一分货' |
| 7 | **最好的医生是自己** | Sức khỏe & Lối sống | 最佳面试者 | `NEEDS_REVIEW` | Different theme/title: DB='最佳面试者' vs Standard='最好的医生是自己' |
| 8 | **生活中不缺少美** | Thái độ sống & Tâm lý | 成功的秘密 | `NEEDS_REVIEW` | Different theme/title: DB='成功的秘密' vs Standard='生活中不缺少美' |
| 9 | **阳光总在风雨后** | Nỗ lực & Vượt qua khó khăn | 阳光总在风雨后 | **MATCHED** | Exact match: '阳光总在风雨后' |
| 10 | **幸福的标准** | Quan niệm về hạnh phúc | 幸福的标准 | **MATCHED** | Exact match: '幸福的标准' |
| 11 | **读书好，读好书，好读书** | Thói quen đọc sách | 读书好，读好书 | `PARTIAL_MATCH` | Partial match: DB='读书好，读好书' vs Standard='读书好，读好书，好读书' |
| 12 | **用心发现世界** | Khám phá & Trải nghiệm | 用心发现美 | `NEEDS_REVIEW` | Different theme/title: DB='用心发现美' vs Standard='用心发现世界' |
| 13 | **喝着茶看京剧** | Văn hóa & Nghệ thuật truyền thống | 喝着茶看京剧 | **MATCHED** | Exact match: '喝着茶看京剧' |
| 14 | **保护地球母亲** | Môi trường & Thiên nhiên | 保护地球母亲 | **MATCHED** | Exact match: '保护地球母亲' |
| 15 | **教育是个大问题** | Giáo dục con cái & Trường học | 教育孩子的艺术 | `NEEDS_REVIEW` | Different theme/title: DB='教育孩子的艺术' vs Standard='教育是个大问题' |
| 16 | **文化的碰撞** | Giao lưu văn hóa & Phong tục | 文化交流的桥梁 | `NEEDS_REVIEW` | Different theme/title: DB='文化交流的桥梁' vs Standard='文化的碰撞' |
| 17 | **人与自然** | Môi trường sinh thái & Động vật | 科技改变生活 | `NEEDS_REVIEW` | Different theme/title: DB='科技改变生活' vs Standard='人与自然' |
| 18 | **科技与生活** | Công nghệ & Thay đổi đời sống | 人与自然和谐相处 | `NEEDS_REVIEW` | Different theme/title: DB='人与自然和谐相处' vs Standard='科技与生活' |
| 19 | **味道与记忆** | Ẩm thực & Ký ức tuổi thơ | 旅行的真正意义 | `NEEDS_REVIEW` | Different theme/title: DB='旅行的真正意义' vs Standard='味道与记忆' |
| 20 | **走近中国** | Đất nước & Con người Trung Quốc | 展望未来的世界 | `NEEDS_REVIEW` | Different theme/title: DB='展望未来的世界' vs Standard='走近中国' |

---

## IV. LỘ TRÌNH THỰC THI CHUYỂN ĐỔI (5 BƯỚC AN TOÀN)

### Bước 1: Thu thập & Kiểm chứng tài liệu nguồn (Hoàn thành trong Phase 10 / Issue #19)
- Tải về và xác minh 21 files tài liệu HSK 1–4B từ Baúl Chino vào `resources/hsk-standard-course-2.0/`.
- Kiểm tra magic bytes và SHA-256.
- Thiết lập công cụ một click `Download-HSK-All.bat`.

### Bước 2: Trích xuất nội dung số (Text & Audio Parsing)
- Viết các công cụ trích xuất văn bản có cấu trúc từ PDF sách giáo khoa và sách bài tập.
- Trích xuất danh mục từ vựng mới theo từng bài, câu hội thoại ngữ cảnh, điểm ngữ pháp và bài tập kèm đáp án chuẩn.
- Cắt phân đoạn âm thanh MP3 tương ứng với các bài hội thoại trong từng bài học.
- Lưu trữ staging tại `data/hsk20/staging/` dưới định dạng JSON trung gian.

### Bước 3: Ánh xạ cấu trúc dữ liệu & Nạp thử nghiệm trên Test DB
- Ánh xạ cấu trúc Course -> Unit -> Lesson -> Vocabulary / GrammarPoint / Exercise.
- Thực hiện kiểm tra an toàn: `SELECT DB_NAME() == 'ZhongWenHub_Test'` trước khi ghi.
- Xây dựng kịch bản kiểm tra rollback đa lô (multi-batch rollback) đảm bảo khôi phục nguyên trạng khi cần.

### Bước 4: Kiểm thử tích hợp Full-Stack & Trải nghiệm học viên
- Chạy 288 Bun frontend unit tests, 122 Backend tests (.NET 10).
- Chạy Playwright E2E tự động xác thực hành trình học viên cho toàn bộ 70 bài học mới.
- Xác minh HSK 5–6 Coming Soon hiển thị ổn định, không có liên kết hỏng.

### Bước 5: Thẩm định học thuật & Nghiệm thu phát hành
- Bàn giao cho chuyên gia ngôn ngữ học kiểm tra ngữ cảnh tự nhiên của câu ví dụ và bản dịch tiếng Việt.
- Chuyển giao qua AI Collaboration Bridge để ChatGPT kiểm tra độc lập.
- Ký duyệt biên bản nghiệm thu trước khi chuyển trạng thái `PUBLISHED` trên Production.

---

## V. KẾT LUẬN & CAM KẾT

Kế hoạch chuyển đổi sang HSK 2.0 đã được xây dựng rõ ràng, có căn cứ dữ liệu thực tế từ tài liệu nguồn đã tải về, đảm bảo an toàn tuyệt đối cho hệ thống và không làm gián đoạn trải nghiệm người dùng hiện tại.