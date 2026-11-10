# -*- coding: utf-8 -*-
"""
HSK 2 Complete Exercises Generator (Staging)
Phase 9.2 — Task 7

Generates 60 high-quality pedagogical exercises (4 per lesson across 15 lessons):
  - 30 enhanced existing exercises (fixing generic placeholders, varying correct indices)
  - 30 newly authored exercises (vocabulary, grammar, reading, listening)
Outputs to:
  - data/hsk30/staging/hsk2_exercises.json
  - data/hsk30/staging/hsk2_exercise_qa_manifest.json
"""

import sys
import json
import uuid
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# 4 exercises per lesson for all 15 lessons (total 60 exercises)
# Each exercise has: (type, skill, title, instruction, promptHanzi, promptPinyin, promptVi, options, correctIdx, explanation)
EXERCISES_DATA = {
    1: [
        # Ex 1 (Enhancement of dev exercise 1)
        ("multiple-choice", "grammar", "Chọn thời điểm thích hợp", "Chọn phó từ hoặc từ thích hợp điền vào chỗ trống.",
         "九月去北京旅游_____好。", "Jiǔ yuè qù Běijīng lǚyóu _____ hǎo.", "Đi du lịch Bắc Kinh vào tháng chín là _____ tốt.",
         ["最 (zuì)", "也 (yě)", "还 (hái)", "都 (dōu)"], 0,
         "Cấu trúc '最 + tính từ' biểu thị mức độ cao nhất. '最好' nghĩa là tốt nhất."),
        # Ex 2 (Enhancement of dev exercise 2)
        ("multiple-choice", "reading", "Đọc hiểu câu bài 1", "Đọc câu sau và chọn nhận định đúng nhất.",
         "我最喜欢踢足球，每天下午都要去操场踢球。", "Wǒ zuì xǐhuan tī zúqiú, měitiān xiàwǔ dōu yào qù cāochǎng tī qiú.", "Tôi thích đá bóng nhất, mỗi buổi chiều đều ra sân đá bóng.",
         ["Cậu ấy không thích đá bóng", "Cậu ấy thích đá bóng nhất", "Cậu ấy chỉ đá bóng vào buổi sáng", "Cậu ấy không bao giờ ra sân vận động"], 1,
         "Câu '我最喜欢踢足球' có nghĩa là 'Tôi thích đá bóng nhất'."),
        # Ex 3 (New exercise 1)
        ("multiple-choice", "vocabulary", "Từ vựng: 一会儿", "Chọn câu sử dụng đúng từ '一会儿' (yíhuìr).",
         "请等我_____，我马上来。", "Qǐng děng wǒ _____, wǒ mǎshàng lái.", "Xin đợi tôi một lát, tôi đến ngay.",
         ["一会儿 (yíhuìr)", "一年 (yì nián)", "一次 (yí cì)", "一天 (yì tiān)"], 0,
         "'一会儿' biểu thị khoảng thời gian ngắn: 'đợi tôi một lát'."),
        # Ex 4 (New exercise 2)
        ("multiple-choice", "listening", "Luyện nghe hội thoại bài 1", "Nghe câu hỏi và chọn câu đáp phù hợp.",
         "外面冷，别感冒了。", "Wàimiàn lěng, bié gǎnmào le.", "Bên ngoài lạnh, đừng để bị cảm nhé.",
         ["我不去学校", "好的，我会多穿点儿衣服", "今天星期一", "他在前面"], 1,
         "Đáp lại lời nhắc nhở giữ ấm '别感冒了' hợp lý nhất là '好的，我会多穿点儿衣服' (Vâng, tôi sẽ mặc nhiều áo).")
    ],
    2: [
        # Ex 1 (Dev enhancement)
        ("multiple-choice", "grammar", "Ngữ pháp: Cặp liên từ 因为...所以...", "Điền liên từ thích hợp vào chỗ trống.",
         "_____今天生病了，_____我没去上班。", "_____ jīntiān shēngbìng le, _____ wǒ méi qù shàngbān.", "_____ hôm nay bị ốm, _____ tôi không đi làm.",
         ["虽然...但是...", "因为...所以...", "除了...还...", "不仅...而且..."], 1,
         "Cặp liên từ '因为...所以...' biểu thị quan hệ nguyên nhân - kết quả: Vì... nên..."),
        # Ex 2 (Dev enhancement)
        ("multiple-choice", "reading", "Đọc hiểu thời gian biểu", "Đọc câu sau và trả lời câu hỏi: Người nói thức dậy lúc mấy giờ?",
         "我每天早上六点起床，然后去公园跑步。", "Wǒ měitiān zǎoshang liù diǎn qǐchuáng, ránhòu qù gōngyuán pǎobù.", "Mỗi sáng tôi thức dậy lúc sáu giờ, sau đó ra công viên chạy bộ.",
         ["5:00", "6:00", "7:00", "8:00"], 1,
         "Trong câu ghi rõ: '六点起床' (thức dậy lúc 6 giờ)."),
        # Ex 3 (New)
        ("multiple-choice", "vocabulary", "Từ vựng: 生病 & 出院", "Chọn từ thích hợp điền vào chỗ trống.",
         "大卫身体好了，医生说他明天可以_____了。", "Dàwèi shēntǐ hǎo le, yīshēng shuō tā míngtiān kěyǐ _____ le.", "Sức khỏe của David đã khỏe rồi, bác sĩ nói ngày mai anh ấy có thể _____.",
         ["生病 (shēngbìng)", "出院 (chūyuàn)", "跑步 (pǎobù)", "踢球 (tī qiú)"], 1,
         "Sau khi khỏi bệnh thì xuất viện ('出院')."),
        # Ex 4 (New)
        ("multiple-choice", "grammar", "Ngữ pháp: Lượng từ 每", "Chọn câu dùng đúng cấu trúc với '每'.",
         "他_____星期六都去图书馆。", "Tā _____ xīngqīliù dōu qù túshūguǎn.", "Anh ấy _____ thứ bảy đều đi thư viện.",
         ["每 (měi)", "都 (dōu)", "很 (hěn)", "真 (zhēn)"], 0,
         "Cấu trúc '每...都...' biểu thị hành động xảy ra định kỳ đều đặn: '每个星期六都...'")
    ],
    3: [
        # Ex 1 (Dev enhancement)
        ("multiple-choice", "grammar", "Ngữ pháp: Cụm từ mang chữ 的", "Chọn câu diễn đạt đúng khi đại từ hóa danh từ.",
         "左边那个红色的书包是_____。", "Zuǒbian nàge hóngsè de shūbāo shì _____.", "Chiếc ba lô màu đỏ bên trái là _____.",
         ["我 (wǒ)", "我的 (wǒ de)", "我很 (wǒ hěn)", "我在 (wǒ zài)"], 1,
         "Cụm từ chữ '的' (我的) có chức năng thay thế cho 'của tôi / chiếc ba lô của tôi'."),
        # Ex 2 (Dev enhancement)
        ("multiple-choice", "reading", "Đọc hiểu vị trí đồ vật", "Đọc câu: '桌子左边有一本书，右边是一支笔。' Sách ở vị trí nào?",
         "桌子左边有一本书，右边是一支笔。", "Zhuōzi zuǒbian yǒu yì běn shū, yòubian shì yì zhī bǐ.", "Bên trái bàn có một cuốn sách, bên phải là một cây bút.",
         ["Bên phải", "Bên trái", "Ở trên trần", "Dưới sàn nhà"], 1,
         "Trong câu nói rõ '桌子左边有一本书' -> sách ở bên trái."),
        # Ex 3 (New)
        ("multiple-choice", "vocabulary", "Từ vựng số đếm: 万", "10,000 trong tiếng Trung đọc là gì?",
         "这台电脑要10,000块钱。", "Zhè tái diànnǎo yào 10,000 kuài qián.", "Chiếc máy tính này giá 10.000 tệ.",
         ["一千 (yìqiān)", "一百 (yìbǎi)", "一万 (yíwàn)", "十万 (shíwàn)"], 2,
         "10.000 là '一万' (yíwàn)."),
        # Ex 4 (New)
        ("multiple-choice", "grammar", "Ngữ pháp: 快要...了", "Chọn từ thích hợp điền vào chỗ trống để chỉ hành động sắp xảy ra.",
         "火车_____开了，快上车吧！", "Huǒchē _____ kāi le, kuài shàng chē ba!", "Tàu hỏa _____ chạy rồi, mau lên xe thôi!",
         ["快要 (kuàiyào)", "已经 (yǐjīng)", "正在 (zhèngzài)", "从小 (cóngxiǎo)"], 0,
         "Cấu trúc '快要...了' biểu thị hành động sắp xảy ra trong tương lai gần.")
    ],
    4: [
        # Ex 1 (Dev enhancement)
        ("multiple-choice", "grammar", "Cấu trúc nhấn mạnh 是...的", "Chọn câu dùng cấu trúc 是...的 nhấn mạnh người thực hiện hành động.",
         "这个工作_____他帮我介绍的。", "Zhè gè gōngzuò _____ tā bāng wǒ jièshào de.", "Công việc này _____ do anh ấy giới thiệu cho tôi.",
         ["在 (zài)", "有 (yǒu)", "是 (shì)", "被 (bèi)"], 2,
         "Cấu trúc '是...的' dùng để nhấn mạnh thời gian, địa điểm, phương thức hoặc người thực hiện hành động đã xảy ra."),
        # Ex 2 (Dev enhancement)
        ("multiple-choice", "reading", "Đọc hiểu quan hệ gia đình", "Đọc câu: '她丈夫是一位医生。' Chồng của cô ấy làm nghề gì?",
         "她丈夫是一位医生。", "Tā zhàngfu shì yí wèi yīshēng.", "Chồng cô ấy là một bác sĩ.",
         ["Giáo viên", "Bác sĩ", "Lái xe", "Sinh viên"], 1,
         "'医生' nghĩa là bác sĩ."),
        # Ex 3 (New)
        ("multiple-choice", "vocabulary", "Từ vựng: 洗手间", "Hỏi đường đi nhà vệ sinh như thế nào?",
         "请问，_____在哪里？", "Qǐngwèn, _____ zài nǎlǐ?", "Xin hỏi, _____ ở đâu ạ?",
         ["洗手间 (xǐshǒujiān)", "地铁 (dìtiě)", "报纸 (bàozhǐ)", "牛奶 (niúnǎi)"], 0,
         "'洗手间' là nhà vệ sinh."),
        # Ex 4 (New)
        ("multiple-choice", "grammar", "Giới từ: 从...到...", "Điền giới từ thích hợp: 'Tôi làm việc từ 8 giờ đến 5 giờ'.",
         "我_____早上八点工作_____下午五点。", "Wǒ _____ zǎoshang bā diǎn gōngzuò _____ xiàwǔ wǔ diǎn.", "Tôi làm việc từ 8 giờ sáng đến 5 giờ chiều.",
         ["从...到...", "在...到...", "离...往...", "向...在..."], 0,
         "Cấu trúc '从...到...' nghĩa là 'từ... đến...' chỉ mốc thời gian hoặc không gian.")
    ],
    5: [
        # Ex 1 (Dev enhancement)
        ("multiple-choice", "grammar", "Ngữ pháp: Phó từ 就", "Chọn câu dùng 就 để biểu thị quyết định nhanh chóng.",
         "这件衣服颜色很漂亮，_____买这件吧。", "Zhè jiàn yīfu yánsè hěn piàoliang, _____ mǎi zhè jiàn ba.", "Chiếc áo này màu sắc rất đẹp, mua chiếc này _____ đi.",
         ["就 (jiù)", "才 (cái)", "还 (hái)", "又 (yòu)"], 0,
         "Phó từ '就' biểu thị sự dứt khoát đưa ra quyết định: '就买这件吧' (thế thì mua chiếc này đi)."),
        # Ex 2 (Dev enhancement)
        ("multiple-choice", "reading", "Đọc hiểu mua sắm", "Đọc câu: '这件衣服太贵了，便宜点儿吧。' Người nói muốn gì?",
         "这件衣服太贵了，便宜点儿吧。", "Zhè jiàn dàyī tài guì le, piányi diǎnr ba.", "Chiếc áo khoác này đắt quá, rẻ bớt chút đi.",
         ["Khen áo đẹp", "Muốn giảm giá bớt", "Chê áo xấu", "Không có tiền"], 1,
         "'便宜点儿吧' là lời đề nghị giảm giá bớt / rẻ hơn một chút."),
        # Ex 3 (New)
        ("multiple-choice", "vocabulary", "Từ vựng: 坏", "Chọn câu sử dụng đúng từ '坏' (huài).",
         "我的手机_____了，不能开机。", "Wǒ de shǒujī _____ le, bù néng kāijī.", "Điện thoại của tôi bị _____ rồi, không bật nguồn được.",
         ["坏 (huài)", "慢 (màn)", "贵 (guì)", "白 (bái)"], 0,
         "Đồ vật bị hỏng hóc dùng từ '坏' (huài)."),
        # Ex 4 (New)
        ("multiple-choice", "grammar", "Giới từ khoảng cách: 离", "Chọn trật tự từ đúng khi nói về khoảng cách.",
         "我家_____学校很近。", "Wǒ jiā _____ xuéxiào hěn jìn.", "Nhà tôi _____ trường học rất gần.",
         ["离 (lí)", "在 (zài)", "从 (cóng)", "往 (wǎng)"], 0,
         "Cấu trúc chỉ khoảng cách: A + 离 + B + Tính từ (远/近).")
    ],
    6: [
        # Ex 1 (Dev enhancement)
        ("multiple-choice", "grammar", "Ngữ pháp: Đại từ nghi vấn 怎么", "Chọn câu dùng 怎么 để hỏi nguyên nhân.",
         "你今天_____不吃晚饭了？", "Nǐ jīntiān _____ bù chī wǎnfàn le?", "Hôm nay sao bạn lại không ăn cơm tối thế?",
         ["怎么 (zěnme)", "什么 (shénme)", "哪里 (nǎlǐ)", "多少 (duōshao)"], 0,
         "'怎么' dùng trước động từ biểu thị sự ngạc nhiên hỏi nguyên nhân: Sao lại không ăn?"),
        # Ex 2 (Dev enhancement)
        ("multiple-choice", "reading", "Đọc hiểu ẩm thực", "Đọc câu: '我们点了羊肉、鸡蛋和面条。' Họ đã không gọi món gì?",
         "我们点了羊肉、鸡蛋和面条。", "Wǒmen diǎn le yángròu, jīdàn hé miàntiáo.", "Chúng tôi đã gọi thịt dê, trứng gà và mì sợi.",
         ["Thịt dê (羊肉)", "Trứng gà (鸡蛋)", "Mì sợi (面条)", "Thịt bò (牛肉)"], 3,
         "Trong câu không nhắc đến thịt bò (牛肉)."),
        # Ex 3 (New)
        ("multiple-choice", "vocabulary", "Từ vựng: 已经", "Điền từ chỉ hành động đã xảy ra.",
         "我_____吃过药了，感觉好多了。", "Wǒ _____ chī guò yào le, gǎnjué hǎoduō le.", "Tôi _____ uống thuốc rồi, cảm thấy đỡ hơn nhiều.",
         ["已经 (yǐjīng)", "正在 (zhèngzài)", "快要 (kuàiyào)", "从小 (cóngxiǎo)"], 0,
         "'已经' biểu thị hành động đã hoàn tất trong quá khứ."),
        # Ex 4 (New)
        ("multiple-choice", "grammar", "Trợ từ ngữ khí 了 chỉ sự thay đổi", "Ý nghĩa của câu '他不吃了' là gì?",
         "他不吃了。", "Tā bù chī le.", "Anh ấy không ăn nữa.",
         ["Anh ấy trước giờ không ăn", "Trước đó anh ấy có ăn, giờ ngừng lại không ăn nữa", "Anh ấy sắp ăn", "Anh ấy muốn ăn thêm"], 1,
         "Trợ từ '了' ở cuối câu phủ định '不...了' biểu thị sự thay đổi trạng thái: không ăn nữa.")
    ],
    7: [
        # Ex 1 (Dev enhancement)
        ("multiple-choice", "grammar", "Ngữ pháp: Câu hỏi với 离...远吗", "Chọn câu hỏi khoảng cách đúng ngữ pháp.",
         "你家离公司_____？", "Nǐ jiā lí gōngsī _____?", "Nhà bạn cách công ty _____?",
         ["远吗 (yuǎn ma)", "多远 (duō yuǎn)", "远不远 (yuǎn bù yuǎn)", "Tất cả các phương án trên đều đúng"], 3,
         "Có thể hỏi khoảng cách bằng '远吗', '远不远' hoặc '有多远'."),
        # Ex 2 (Dev enhancement)
        ("multiple-choice", "reading", "Đọc hiểu khoảng cách và đi lại", "Đọc câu: '我家离公司走路只要十分钟。' Nhận định nào sau đây là đúng?",
         "我家离公司走路只要十分钟。", "Wǒ jiā lí gōngsī zǒulù zhǐ yào shí fēnzhōng.", "Nhà tôi cách công ty đi bộ chỉ mất 10 phút.",
         ["Nhà rất xa công ty", "Nhà rất gần công ty", "Đi tàu điện ngầm mất 1 tiếng", "Không thể đi bộ được"], 1,
         "Đi bộ chỉ mất 10 phút chứng tỏ khoảng cách rất gần."),
        # Ex 3 (New)
        ("multiple-choice", "vocabulary", "Từ vựng: 机场 & 路上", "Chọn từ điền vào chỗ trống: 'Tôi đi _____ đón bạn'.",
         "我下午去_____接一位外国朋友。", "Wǒ xiàwǔ qù _____ jiē yí wèi wàiguó péngyou.", "Chiều nay tôi đi ra _____ đón một người bạn nước ngoài.",
         ["机场 (jīchǎng)", "洗手间 (xǐshǒujiān)", "教室 (jiàoshì)", "床 (chuáng)"], 0,
         "Đón người từ máy bay đến là ở sân bay ('机场')."),
        # Ex 4 (New)
        ("multiple-choice", "grammar", "Liên từ: 但是 (nhưng)", "Điền liên từ thích hợp: 'Tôi rất muốn đi, nhưng không có thời gian'.",
         "我很想去，_____今天没有时间。", "Wǒ hěn xiǎng qù, _____ jīntiān méiyǒu shíjiān.", "Tôi rất muốn đi, _____ hôm nay không có thời gian.",
         ["但是 (dànshì)", "因为 (yīnwèi)", "所以 (suǒyǐ)", "而且 (érqiě)"], 0,
         "'但是' biểu thị sự chuyển tiếp ý (nhưng / tuy nhiên).")
    ],
    8: [
        # Ex 1 (Dev enhancement)
        ("multiple-choice", "grammar", "Câu kiêm ngữ với 让", "Chọn từ thích hợp điền vào câu cầu khiến: 'Để tôi nghĩ đã...'",
         "_____我想想再告诉你。", "_____ wǒ xiǎngxiang zài gàosu nǐ.", "_____ tôi suy nghĩ rồi nói cho bạn biết nhé.",
         ["让 (ràng)", "被 (bèi)", "给 (gěi)", "在 (zài)"], 0,
         "'让' trong câu kiêm ngữ có nghĩa là để cho, bảo ai làm gì: '让我想想' (để tôi nghĩ một chút)."),
        # Ex 2 (Dev enhancement)
        ("multiple-choice", "reading", "Đọc hiểu lặp lại động từ", "Động từ '想想' (xiǎngxiang) biểu thị sắc thái gì?",
         "让我想想再告诉你。", "Ràng wǒ xiǎngxiang zài gàosu nǐ.", "Để tôi suy nghĩ rồi nói cho bạn biết nhé.",
         ["Hành động diễn ra lâu dài", "Hành động diễn ra trong thời gian ngắn, ngữ khí nhẹ nhàng", "Hành động bắt buộc nghiêm khắc", "Hành động đã kết thúc từ lâu"], 1,
         "Hình thức lặp lại động từ (AA/A一A) biểu thị hành động ngắn, thử nghiệm, ngữ khí thoải mái nhẹ nhàng."),
        # Ex 3 (New)
        ("multiple-choice", "vocabulary", "Lượng từ: 位", "Lượng từ '位' (wèi) dùng cho đối tượng nào?",
         "请问您找哪_____老师？", "Qǐngwèn nín zhǎo nǎ _____ lǎoshī?", "Xin hỏi bạn tìm vị thầy cô giáo nào?",
         ["位 (wèi)", "个 (gè)", "本 (běn)", "条 (tiáo)"], 0,
         "'位' là lượng từ lịch sự dùng cho người (vị giáo viên, vị khách)."),
        # Ex 4 (New)
        ("multiple-choice", "grammar", "Phó từ 再 (lại / sau đó)", "Trong câu '让我想想再告诉你', từ '再' có nghĩa là gì?",
         "让我想想再告诉你。", "Ràng wǒ xiǎngxiang zài gàosu nǐ.", "Để tôi suy nghĩ rồi nói cho bạn biết nhé.",
         ["Lặp lại trong quá khứ", "Làm xong việc thứ nhất rồi mới làm tiếp việc thứ hai", "Không bao giờ làm", "Làm ngay lập tức"], 1,
         "'再' ở đây biểu thị sự tiếp nối: làm xong việc này rồi mới làm việc kia (suy nghĩ xong rồi mới nói).")
    ],
    9: [
        # Ex 1 (Dev enhancement)
        ("multiple-choice", "grammar", "Bổ ngữ kết quả: 完 (xong)", "Chọn động từ kết hợp với bổ ngữ kết quả 完.",
         "考试题太多了，我没做_____。", "Kǎoshì tí tài duō le, wǒ méi zuò _____.", "Đề thi nhiều quá, tôi chưa làm _____.",
         ["完 (wán)", "懂 (dǒng)", "走 (zǒu)", "来 (lái)"], 0,
         "Bổ ngữ kết quả '做完' nghĩa là làm xong."),
        # Ex 2 (Dev enhancement)
        ("multiple-choice", "reading", "Đọc hiểu kết quả thi cử", "Đọc câu: '题太多，我没做完。' Tại sao người nói chưa làm xong bài thi?",
         "题太多，我没做完。", "Tí tài duō, wǒ méi zuò wán.", "Đề thi nhiều quá, tôi chưa làm xong.",
         ["Vì không biết làm", "Vì đề thi quá nhiều", "Vì đi muộn", "Vì ngủ quên"], 1,
         "Lý do được nêu rõ trong câu: '题太多' (đề nhiều quá)."),
        # Ex 3 (New)
        ("multiple-choice", "vocabulary", "Từ vựng: 手表", "Điền từ vào chỗ trống: 'Chiếc đồng hồ này rất đẹp'.",
         "这块_____是爸爸送给我的生日礼物。", "Zhè kuài _____ shì bàba sòng gěi wǒ de shēngrì lǐwù.", "Chiếc _____ này là món quà sinh nhật bố tặng tôi.",
         ["手表 (shǒubiǎo)", "报纸 (bàozhǐ)", "牛奶 (niúnǎi)", "铅笔 (qiānbǐ)"], 0,
         "Lượng từ '块' đi kèm với '手表' (đồng hồ đeo tay)."),
        # Ex 4 (New)
        ("multiple-choice", "grammar", "Phủ định của bổ ngữ kết quả: 没 + V + Bổ ngữ", "Chọn câu phủ định đúng của '我做完了'.",
         "我做完了。", "Wǒ zuò wán le.", "Tôi làm xong rồi.",
         ["我不做完", "我没做完", "我没有做完了", "我做不完"], 1,
         "Phủ định của bổ ngữ kết quả trong quá khứ là dùng '没 / 没有' trước động từ và bỏ '了': '我没做完'.")
    ],
    10: [
        # Ex 1 (Dev enhancement)
        ("multiple-choice", "grammar", "Cấu trúc khuyên can 别...了", "Chọn câu khuyên ngăn đúng ngữ pháp: 'Đừng tìm nữa!'",
         "_____找了，手机在桌子上呢。", "_____ zhǎo le, shǒujī zài zhuōzi shang ne.", "_____ tìm nữa, điện thoại ở trên bàn kìa.",
         ["别 (bié)", "不 (bù)", "没 (méi)", "不要 (búyào)"], 0,
         "Cấu trúc '别...了' dùng để khuyên ai đó đừng tiếp tục làm việc gì nữa."),
        # Ex 2 (Dev enhancement)
        ("multiple-choice", "reading", "Đọc hiểu vị trí điện thoại", "Đọc câu: '别找了，手机在桌子上呢。' Điện thoại đang ở đâu?",
         "别找了，手机在桌子上呢。", "Bié zhǎo le, shǒujī zài zhuōzi shang ne.", "Đừng tìm nữa, điện thoại ở trên bàn kìa.",
         ["Ở trong túi xách", "Ở trên bàn", "Ở dưới giường", "Ở trên ghế"], 1,
         "Trong câu nêu rõ: '在桌子上呢' (ở trên bàn)."),
        # Ex 3 (New)
        ("multiple-choice", "vocabulary", "Từ vựng: 准备", "Chọn từ thích hợp: 'Chuẩn bị bài thi'.",
         "你_____好明天的考试了吗？", "Nǐ _____ hǎo míngtiān de kǎoshì le ma?", "Bạn đã _____ bài thi ngày mai chưa?",
         ["准备 (zhǔnbèi)", "告诉 (gàosu)", "起床 (qǐchuáng)", "跑步 (pǎobù)"], 0,
         "'准备好' nghĩa là chuẩn bị sẵn sàng."),
        # Ex 4 (New)
        ("multiple-choice", "grammar", "Phó từ chỉ hành động đang diễn ra: 正在", "Chọn từ điền vào chỗ trống: 'Tôi đang làm bài tập'.",
         "我_____做作业呢，一会儿再打给你。", "Wǒ _____ zuò zuòyè ne, yíhuìr zài dǎ gěi nǐ.", "Tôi _____ làm bài tập, lát nữa gọi lại cho bạn.",
         ["正在 (zhèngzài)", "已经 (yǐjīng)", "快要 (kuàiyào)", "常常 (chángcháng)"], 0,
         "'正在...呢' biểu thị hành động đang tiến hành.")
    ],
    11: [
        # Ex 1 (Dev enhancement)
        ("multiple-choice", "grammar", "Cấu trúc so sánh hơn chữ 比", "Chọn trật tự đúng: 'Anh ấy lớn hơn tôi 3 tuổi'.",
         "他_____我大三岁。", "Tā _____ wǒ dà sān suì.", "Anh ấy _____ tôi lớn ba tuổi.",
         ["比 (bǐ)", "跟 (gēn)", "和 (hé)", "同 (tóng)"], 0,
         "Cấu trúc so sánh: A + 比 + B + Tính từ + Số lượng (độ chênh lệch)."),
        # Ex 2 (Dev enhancement)
        ("multiple-choice", "reading", "Đọc hiểu tuổi tác so sánh", "Đọc câu: '他比我大三岁，我今年二十岁。' Năm nay anh ấy bao nhiêu tuổi?",
         "他比我大三岁，我今年二十岁。", "Tā bǐ wǒ dà sān suì, wǒ jīnnián èrshí suì.", "Anh ấy lớn hơn tôi ba tuổi, năm nay tôi hai mươi tuổi.",
         ["17 tuổi", "20 tuổi", "23 tuổi", "26 tuổi"], 2,
         "Tôi 20 tuổi, anh ấy lớn hơn tôi 3 tuổi -> 20 + 3 = 23 tuổi."),
        # Ex 3 (New)
        ("multiple-choice", "vocabulary", "Từ vựng: 开始", "Trái nghĩa với '开始' (bắt đầu) là từ nào?",
         "电影几点开始？", "Diànyǐng jǐ diǎn kāishǐ?", "Phim mấy giờ bắt đầu?",
         ["结束 / 完 (jiéshù / wán)", "出院 (chūyuàn)", "开学 (kāixué)", "准备 (zhǔnbèi)"], 0,
         "Bắt đầu là '开始', kết thúc là '结束' hoặc '完'."),
        # Ex 4 (New)
        ("multiple-choice", "grammar", "So sánh độ chênh lệch: 一点儿 / 得多", "Chọn phương án đúng biểu thị độ chênh lệch rất nhiều.",
         "北京的冬天比上海冷_____。", "Běijīng de dōngtiān bǐ Shànghǎi lěng _____.", "Mùa đông Bắc Kinh lạnh hơn Thượng Hải _____.",
         ["得多 (de duō)", "一点儿 (yìdiǎnr)", "一些 (yìxiē)", "很 (hěn)"], 0,
         "Chênh lệch nhiều dùng bổ ngữ '得多' hoặc '多了' đặt sau tính từ.")
    ],
    12: [
        # Ex 1 (Dev enhancement)
        ("multiple-choice", "grammar", "Bổ ngữ trạng thái với 得", "Chọn câu dùng đúng trợ từ kết cấu 得.",
         "今天天气很冷，你穿_____太少了。", "Jīntiān tiānqì hěn lěng, nǐ chuān _____ tài shǎo le.", "Hôm nay thời tiết rất lạnh, bạn mặc _____ quá ít.",
         ["得 (de)", "的 (de)", "地 (de)", "着 (zhe)"], 0,
         "Bổ ngữ trạng thái đứng sau động từ và liên kết bởi '得': Động từ + 得 + Tính từ / Cụm miêu tả."),
        # Ex 2 (Dev enhancement)
        ("multiple-choice", "reading", "Đọc hiểu thời tiết và trang phục", "Đọc câu: '你穿得太少了，多穿点儿衣服吧。' Người nói đưa ra lời khuyên gì?",
         "你穿得太少了，多穿点儿衣服吧。", "Nǐ chuān de tài shǎo le, duō chuān diǎnr yīfu ba.", "Bạn mặc ít quá rồi, mặc thêm áo vào đi.",
         ["Khuyên cởi bớt áo", "Khuyên mặc thêm áo ấm", "Khen quần áo đẹp", "Bảo đi mua quần áo mới"], 1,
         "'多穿点儿衣服吧' nghĩa là hãy mặc thêm quần áo vào."),
        # Ex 3 (New)
        ("multiple-choice", "vocabulary", "Từ vựng: 打车 & 堵车", "Chọn phương tiện đi lại: 'Chúng ta bắt taxi đi'.",
         "时间快来不及了，我们_____去吧。", "Shíjiān kuài láibùjí le, wǒmen _____ qù ba.", "Sắp không kịp thời gian rồi, chúng ta _____ đi thôi.",
         ["打车 (dǎchē)", "走路 (zǒulù)", "跑步 (pǎobù)", "游泳 (yóuyǒng)"], 0,
         "'打车' nghĩa là bắt taxi / đón taxi."),
        # Ex 4 (New)
        ("multiple-choice", "grammar", "Cặp liên từ 虽然...但是...", "Chọn cặp liên từ thích hợp: 'Tuy trời lạnh nhưng anh ấy vẫn đi chạy bộ'.",
         "_____今天很冷，_____他还是去跑步了。", "_____ jīntiān hěn lěng, _____ tā háishi qù pǎobù le.", "_____ hôm nay rất lạnh, _____ cậu ấy vẫn đi chạy bộ.",
         ["虽然...但是...", "因为...所以...", "不仅...而且...", "如果...就..."], 0,
         "'虽然...但是...' là cặp liên từ biểu thị quan hệ nhượng bộ (Tuy... nhưng...).")
    ],
    13: [
        # Ex 1 (Dev enhancement)
        ("multiple-choice", "grammar", "Trợ từ động thái 着 chỉ trạng thái tĩnh", "Chọn câu biểu thị cửa đang ở trạng thái mở.",
         "门开_____呢，请进吧。", "Mén kāi _____ ne, qǐng jìn ba.", "Cửa đang mở đấy, xin mời vào.",
         ["着 (zhe)", "了 (le)", "过 (guo)", "的 (de)"], 0,
         "Trợ từ động thái '着' đi sau động từ biểu thị trạng thái đang tiếp diễn."),
        # Ex 2 (Dev enhancement)
        ("multiple-choice", "reading", "Đọc hiểu trạng thái đồ vật", "Đọc câu: '墙上挂着一张中国地图。' Trên tường đang có cái gì?",
         "墙上挂着一张中国地图。", "Qiáng shang guà zhe yì zhāng Zhōngguó dìtú.", "Trên tường đang treo một tấm bản đồ Trung Quốc.",
         ["Bức ảnh gia đình", "Tấm bản đồ Trung Quốc", "Chiếc đồng hồ", "Chiếc áo khoác"], 1,
         "'中国地图' nghĩa là bản đồ Trung Quốc."),
        # Ex 3 (New)
        ("multiple-choice", "vocabulary", "Giới từ phương hướng: 往", "Chỉ đường đi thẳng về phía trước:",
         "一直_____前走一百米就是地铁站。", "Yìzhí _____ qián zǒu yìbǎi mǐ jiù shì dìtiě zhàn.", "Cứ đi thẳng về phía trước 100 mét là ga tàu điện ngầm.",
         ["往 (wǎng)", "从 (cóng)", "离 (lí)", "在 (zài)"], 0,
         "Giới từ '往' chỉ phương hướng: '往前走' (đi về phía trước)."),
        # Ex 4 (New)
        ("multiple-choice", "grammar", "Phân biệt 着 và 正在", "Câu nào sau đây miêu tả tư thế / trạng thái mang '着'?",
         "老师笑着对我说：'欢迎你！'", "Lǎoshī xiào zhe duì wǒ shuō: 'Huānyíng nǐ!'", "Thầy giáo mỉm cười nói với tôi: 'Chào mừng em!'",
         ["Diễn tả động tác mỉm cười đi kèm lời nói", "Diễn tả hành động đã hoàn tất", "Diễn tả trải nghiệm quá khứ", "Diễn tả hành động sắp xảy ra"], 0,
         "'V1 + 着 + V2' diễn tả phương thức hoặc trạng thái thực hiện hành động V2.")
    ],
    14: [
        # Ex 1 (Dev enhancement)
        ("multiple-choice", "grammar", "Trợ từ động thái 过 chỉ kinh nghiệm", "Chọn câu hỏi kinh nghiệm đúng ngữ pháp.",
         "你看_____那个电影没有？", "Nǐ kàn _____ nàge diànyǐng méiyǒu?", "Bạn từng xem bộ phim đó chưa?",
         ["过 (guo)", "了 (le)", "着 (zhe)", "在 (zài)"], 0,
         "Trợ từ động thái '过' đứng sau động từ biểu thị hành động đã từng trải nghiệm trong quá khứ."),
        # Ex 2 (Dev enhancement)
        ("multiple-choice", "reading", "Đọc hiểu trải nghiệm quá khứ", "Đọc câu: '我去过两次北京。' Nhận định nào sau đây là đúng?",
         "我去过两次北京。", "Wǒ qù guò liǎng cì Běijīng.", "Tôi từng đi Bắc Kinh hai lần.",
         ["Chưa bao giờ đến Bắc Kinh", "Đã từng đến Bắc Kinh 2 lần", "Đang ở Bắc Kinh", "Chuẩn bị đi Bắc Kinh"], 1,
         "'去过两次' nghĩa là đã từng đến hai lần."),
        # Ex 3 (New)
        ("multiple-choice", "vocabulary", "Động từ: 游泳 & 跑步", "Chọn từ thích hợp cho hoạt động dưới nước:",
         "夏天我经常去室内泳池_____。", "Xiàtiān wǒ jīngcháng qù shìnèi yǒngchí _____.", "Mùa hè tôi thường xuyên đến bể bơi trong nhà để _____.",
         ["游泳 (yóuyǒng)", "跑步 (pǎobù)", "打球 (dǎqiú)", "踢球 (tī qiú)"], 0,
         "Bơi lội là '游泳'."),
        # Ex 4 (New)
        ("multiple-choice", "grammar", "Phủ định của động từ + 过", "Phủ định đúng của '我去过中国' là:",
         "我去过中国。", "Wǒ qù guò Zhōngguó.", "Tôi từng đến Trung Quốc.",
         ["我没去过中国", "我不去过中国", "我没有去中国了", "我别去过中国"], 0,
         "Phủ định của 'Động từ + 过' là '没 / 没有 + Động từ + 过'.")
    ],
    15: [
        # Ex 1 (Dev enhancement)
        ("multiple-choice", "grammar", "Cấu trúc 就要...了 / 快要...了", "Chọn từ thích hợp điền vào cấu trúc hành động sắp xảy ra.",
         "新年_____到了，祝大家新年快乐！", "Xīnnián _____ dào le, zhù dàjiā xīnnián kuàilè!", "Năm mới _____ đến rồi, chúc mọi người năm mới vui vẻ!",
         ["就要 (jiù yào)", "已经 (yǐjīng)", "正在 (zhèngzài)", "曾经 (céngjīng)"], 0,
         "Cấu trúc '就要...了' biểu thị sự việc sắp xảy ra."),
        # Ex 2 (Dev enhancement)
        ("multiple-choice", "reading", "Đọc hiểu chuẩn bị đón Tết", "Đọc câu: '新年快到了，大家都在忙着准备。' Mọi người đang làm gì?",
         "新年快到了，大家都在忙着准备。", "Xīnnián kuài dào le, dàjiā dōu zài máng zhe zhǔnbèi.", "Năm mới sắp đến rồi, mọi người đều đang bận rộn chuẩn bị.",
         ["Nghỉ ngơi ở nhà", "Bận rộn chuẩn bị đón Tết", "Đi ngủ", "Đi bệnh viện"], 1,
         "Trong câu ghi rõ: '都在忙着准备' (đều đang bận rộn chuẩn bị)."),
        # Ex 3 (New)
        ("multiple-choice", "vocabulary", "Từ vựng: 票", "Vé đi tàu hỏa được gọi là gì?",
         "春节回家的_____非常难买。", "Chūnjié huíjiā de _____ fēicháng nán mǎi.", "_____ về quê dịp Tết Nguyên Đán rất khó mua.",
         ["火车票 (huǒchēpiào)", "门票 (ménpiào)", "机票 (jīpiào)", "电影票 (diànyǐngpiào)"], 0,
         "Vé tàu hỏa là '火车票'."),
        # Ex 4 (New)
        ("multiple-choice", "grammar", "Lượng từ 次 chỉ số lần", "Chọn câu điền đúng lượng từ số lần:",
         "这本书我已经看过两_____了。", "Zhè běn shū wǒ yǐjīng kàn guò liǎng _____ le.", "Cuốn sách này tôi đã xem qua hai _____ rồi.",
         ["次 (cì)", "本 (běn)", "个 (gè)", "件 (jiàn)"], 0,
         "'次' là lượng từ biểu thị số lần của động tác: '看过两次'.")
    ]
}

def generate_exercises():
    raw_path = Path("data/hsk30/staging/dev_hsk2_exercises_raw.json")
    with open(raw_path, "r", encoding="utf-8") as f:
        dev_exercises = json.load(f)

    # Group dev exercises by lessonNumber
    dev_by_lesson = {}
    for ex in dev_exercises:
        dev_by_lesson.setdefault(ex["lessonNumber"], []).append(ex)

    all_exercises = []
    manifest_list = []

    for lesson_num in range(1, 16):
        ex_defs = EXERCISES_DATA.get(lesson_num, [])
        dev_list = dev_by_lesson.get(lesson_num, [])

        for i, item in enumerate(ex_defs):
            ex_type, skill, title, instruction, p_zh, p_py, p_vi, options, corr_idx, explanation = item
            corr_ans = options[corr_idx]

            # If i < 2 and dev_list has existing exercise, preserve devId!
            if i < len(dev_list):
                ex_id = dev_list[i]["devId"]
                lesson_id = dev_list[i]["lessonId"]
                lesson_title = dev_list[i]["lessonTitle"]
                origin = "ENHANCED_EXISTING"
            else:
                ex_id = str(uuid.uuid4()).upper()
                lesson_id = dev_list[0]["lessonId"] if dev_list else ""
                lesson_title = dev_list[0]["lessonTitle"] if dev_list else f"Lesson {lesson_num}"
                origin = "NEWLY_AUTHORED"

            record = {
                "id": ex_id,
                "type": ex_type,
                "skill": skill,
                "hskLevel": 2,
                "title": title,
                "instruction": instruction,
                "promptHanzi": p_zh,
                "promptPinyin": p_py,
                "promptVietnamese": p_vi,
                "audioUrl": None,
                "optionsJson": json.dumps(options, ensure_ascii=False),
                "correctOptionIndex": corr_idx,
                "correctAnswer": corr_ans,
                "explanation": explanation,
                "xpReward": 10,
                "status": "DRAFT",
                "lessonId": lesson_id,
                "lessonNumber": lesson_num,
                "lessonTitle": lesson_title,
                "origin": origin
            }
            all_exercises.append(record)

            manifest_list.append({
                "id": ex_id,
                "lessonNumber": lesson_num,
                "type": ex_type,
                "skill": skill,
                "title": title,
                "prompt": p_zh,
                "optionCount": len(options),
                "correctIndex": corr_idx,
                "correctAnswer": corr_ans,
                "origin": origin,
                "hasExplanation": bool(explanation),
                "reviewStatus": "NEEDS_HUMAN_REVIEW"
            })

    print(f"Total staged exercises: {len(all_exercises)}")

    out_file = Path("data/hsk30/staging/hsk2_exercises.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(all_exercises, f, ensure_ascii=False, indent=2)
    print(f"Saved exercises -> {out_file}")

    manifest_file = Path("data/hsk30/staging/hsk2_exercise_qa_manifest.json")
    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump({
            "phase": "9.2",
            "hskLevel": 2,
            "totalExercises": len(all_exercises),
            "exercisesPerLesson": 4,
            "enhancedExistingCount": 30,
            "newlyAuthoredCount": 30,
            "reviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF",
            "exercises": manifest_list
        }, f, ensure_ascii=False, indent=2)
    print(f"Saved exercise QA manifest -> {manifest_file}")

if __name__ == "__main__":
    generate_exercises()
