# -*- coding: utf-8 -*-
"""
Generator and Validator for HSK 4 — Lesson 15 Vocabulary
LessonId: CAD1FFDF-76A1-46E3-B3D9-35084C5BA139
Lesson 15: 教育孩子的艺术 (50 words)
"""
import sys
import json
import hashlib
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

LESSON_ID = "CAD1FFDF-76A1-46E3-B3D9-35084C5BA139"
LESSON_NUMBER = 15
LESSON_TITLE = "教育孩子的艺术"

L15_DEFINITIONS = {
    "不论": (
        "bất kể, dù cho, cho dù",
        "不论遇到什么样的困难与挫折，父母都应该耐心地陪伴孩子一起去面对。",
        "Búlùn yùdào shénmeyàng de kùnnan yǔ cuòzhé, fùmǔ dōu yīnggāi nàixīn de péibàn háizi yìqǐ qù miànduì.",
        "Dù gặp phải khó khăn và trắc trở như thế nào, cha mẹ cũng nên kiên nhẫn đồng hành cùng con đối mặt.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "之中": (
        "trong số, ở giữa, trong lúc",
        "在日常生活点滴之中，父母的言行举止潜移默化地影响着孩子的品格养成。",
        "Zài rìcháng shēnghuó diǎndī zhīzhōng, fùmǔ de yánxíng-jǔzhǐ qiǎnyí-mòhuà de yǐngxiǎng zhe háizi de pǐngé yǎngchéng.",
        "Trong từng chi tiết nhỏ của cuộc sống thường ngày, lời nói hành động của cha mẹ âm thầm tác động đến việc hình thành phẩm chất của con cái.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "京剧": (
        "Kinh kịch (nghệ thuật sân khấu truyền thống Bắc Kinh)",
        "为了让孩子们感受中华优秀传统文化的魅力，学校特别组织大家去大剧院观看京剧表演。",
        "Wèile ràng háizimen gǎnshòu Zhōnghuá yōuxiù chuántǒng wénhuà de mèilì, xuéxiào tèbié zǔzhī dàjiā qù dà jùyuàn guānkàn jīngjù biǎoyǎn.",
        "Để các em nhỏ cảm nhận được sức hút của văn hóa truyền thống ưu tú Trung Hoa, nhà trường đã đặc biệt tổ chức cho mọi người đến đại nhà hát xem biểu diễn Kinh kịch.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "任务": (
        "nhiệm vụ, việc được giao",
        "培养孩子独立自主的生活能力，是家庭教育中一项十分关键的长远任务。",
        "Péiyǎng háizi dúlì zìzhǔ de shēnghuó nénglì, shì jiātíng jiàoyù zhōng yí xiàng shífēn guānjiàn de chángyuǎn rènwu.",
        "Nuôi dưỡng năng lực sống độc lập tự chủ cho trẻ em là một nhiệm vụ lâu dài hết sức then chốt trong giáo dục gia đình.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "使": (
        "khiến cho, làm cho",
        "经常给予孩子真诚的肯定与赞美，能使他们内心充满自信与安全感。",
        "Jīngcháng jǐyǔ háizi zhēnchéng de kěndìng yǔ zànměi, néng shǐ tāmen nèixīn chōngmǎn zìxìn yǔ ānquángǎn.",
        "Thường xuyên dành cho con sự công nhận và khen ngợi chân thành có thể khiến nội tâm các em ngập tràn tự tin và cảm giác an toàn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "做梦": (
        "nằm mơ, mơ mộng",
        "昨晚孩子做梦梦见自己变成了一位宇航员，驾驶着宇宙飞船去探索神秘的外太空。",
        "Zuówǎn háizi zuòmèng mèngjiàn zìjǐ biànchéng le yí wèi yǔhángyuán, jiàshǐ zhe yǔzhòu fēichuán qù tànsuǒ shénmì de wài tàikōng.",
        "Đêm qua đứa trẻ nằm mơ thấy mình biến thành một phi hành gia, lái tàu vũ trụ đi khám phá không gian bên ngoài kỳ bí.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "全球": (
        "toàn cầu, toàn thế giới",
        "如今优质的在线教育资源跨越了地域限制，惠及了全球各地的青少年学习者。",
        "Rújīn yōuzhì de zàixiàn jiàoyù zīyuán kuàyuè le dìyù xiànzhì, huìjí le quánqiú gèdì de qīngshàonián xuéxízhě.",
        "Ngày nay tài nguyên giáo dục trực tuyến chất lượng cao đã vượt qua giới hạn địa lý, mang lại lợi ích cho người học thanh thiếu niên khắp toàn cầu.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "冷静": (
        "bình tĩnh, điềm tĩnh",
        "当孩子犯了错误时，父母切忌盲目发火，应当保持冷静并弄清事情的缘由。",
        "Dāng háizi fàn le cuòwù shí, fùmǔ qièjì mángmù fāhuǒ, yīngdāng bǎochí lěngjìng bìng nòng qīng shìqing de yuányóu.",
        "Khi con phạm lỗi, cha mẹ chớ nên nổi giận mù quáng mà cần giữ bình tĩnh và tìm hiểu rõ ngọn ngành của sự việc.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "前后": (
        "khoảng chừng, trước sau, đầu đuôi",
        "经过前后长达一个月的悉心开导，原本性格内向的孩子逐渐变得活泼开朗起来。",
        "Jīngguò qiánhòu cháng dá yí gè yuè de xīxīn kāidǎo, yuánběn xìnggé nèixiàng de háizi zhújiàn biànde huópo kāilǎng qǐlai.",
        "Trải qua khoảng chừng một tháng dài được tận tình khuyên bảo, đứa trẻ vốn hướng nội dần dần trở nên hoạt bát cởi mở hơn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "北部": (
        "phía bắc, miền bắc",
        "寒假期间，父亲特意带孩子去中国北部体验了千里冰封的冬日冰雪文化。",
        "Hánjià qījiān, fùqīn tèyì dài háizi qù Zhōngguó běibù tǐyàn le qiānlǐ bīngfēng de dōngrì bīngxuě wénhuà.",
        "Trong kỳ nghỉ đông, người cha đã đặc biệt đưa con đến miền bắc Trung Quốc để trải nghiệm văn hóa băng tuyết mùa đông ngàn dặm đóng băng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "厕所": (
        "nhà vệ sinh, phòng vệ sinh",
        "幼儿园老师耐心地教小朋友们饭前便后要主动洗手并保持厕所卫生。",
        "Yòu'éryuán lǎoshī nàixīn de jiāo xiǎopéngyoumen fànqián biànhòu yào zhǔdòng xǐshǒu bìng bǎochí cèsuǒ wèishēng.",
        "Cô giáo mầm non kiên nhẫn dạy các bé trước khi ăn và sau khi đi vệ sinh phải chủ động rửa tay và giữ gìn vệ sinh nhà vệ sinh.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "受伤": (
        "bị thương, chấn thương",
        "在户外体育运动中要时刻注意自我安全防护，避免跌倒摔伤或是关节受伤。",
        "Zài hùwài tǐyù yùndòng zhōng yào shíkè zhùyì zìwǒ ānquán fánghù, bìmiǎn diēdǎo shuāishāng huòshì guānjié shòushāng.",
        "Trong các hoạt động thể dục thể thao ngoài trời phải luôn chú ý tự bảo vệ an toàn, tránh vấp ngã hoặc bị thương khớp.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "听众": (
        "thính giả, người nghe",
        "在少儿故事大王比赛中，这位小选手用生动传神的语调吸引了台下所有的听众。",
        "Zài shào'ér gùshi dàwáng bǐsài zhōng, zhè wèi xiǎo xuǎnshǒu yòng shēngdòng chuánshén de yǔdiào xīyǐn le táixià suǒyǒu de tīngzhòng.",
        "Trong cuộc thi Vua kể chuyện thiếu nhi, thí sinh nhí này với giọng điệu sinh động truyền cảm đã thu hút tất cả thính giả phía dưới.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "回忆": (
        "nhớ lại, hồi ức, ký ức",
        "童年时期与父母一起阅读绘本的温馨时光，成了他长大后最珍贵美好的甜蜜回忆。",
        "Tóngnián shíqī yǔ fùmǔ yìqǐ yuèdú huìběn de wēnxīn shíguāng, chéng le tā zhǎngdà hòu zuì zhēnguì měihǎo de tiánmì huíyì.",
        "Khoảng thời gian ấm áp cùng cha mẹ đọc truyện tranh thời thơ ấu đã trở thành ký ức ngọt ngào và quý giá nhất của anh sau khi khôn lớn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "填写": (
        "điền vào, viết vào biểu mẫu",
        "家长在给孩子办理入学登记手续时，请务必如实详细地填写各项基本信息。",
        "Jiāzhǎng zài gěi háizi bànlǐ rùxué dēngjì shǒuxù shí, qǐng wùbì rúshí xiángxì de tiánxiě gè xiàng jīběn xìnxī.",
        "Khi làm thủ tục đăng ký nhập học cho con, phụ huynh xin vui lòng điền các thông tin cơ bản một cách trung thực và chi tiết.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "大量": (
        "số lượng lớn, nhiều",
        "课外阅读让孩子们接触了大量生动有趣的百科知识，极大地开阔了知识视野。",
        "Kèwài yuèdú ràng háizimen jiēchù le dàliàng shēngdòng yǒuqù de bǎikē zhīshi, jídà de kāikuò le zhīshi shìyě.",
        "Đọc sách ngoại khóa giúp các em tiếp xúc với một lượng lớn kiến thức bách khoa sinh động thú vị, mở rộng tầm nhìn hiểu biết rất nhiều.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "完全": (
        "hoàn toàn, trọn vẹn",
        "每个孩子都有自己独特的性格与天赋，父母不能完全用同一把尺子去衡量他们。",
        "Měi gè háizi dōu yǒu zìjǐ dútè de xìnggé yǔ tiānfù, fùmǔ bù néng wánquán yòng tóng yì bǎ chǐzi qù héngliáng tāmen.",
        "Mỗi đứa trẻ đều có tính cách và thiên phú độc đáo riêng của mình, cha mẹ không thể hoàn toàn dùng cùng một chiếc thước kẻ để đo lường tất cả.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "将": (
        "sẽ; đem, lấy (giới từ tương đương 把)",
        "学校下周将举办家庭教育专题讲座，邀请资深心理学专家为家长们答疑解惑。",
        "Xuéxiào xià zhōu jiāng jǔbàn jiātíng jiàoyù zhuāntí jiǎngzuò, yāoqǐng zīshēn xīnlǐxué zhuānjiā wèi jiāzhǎngmen dáyí jiěhuò.",
        "Tuần tới nhà trường sẽ tổ chức buổi tọa đàm chuyên đề về giáo dục gia đình, mời chuyên gia tâm lý học kỳ cựu đến giải đáp thắc mắc cho phụ huynh.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "巧克力": (
        "sô-cô-la",
        "虽然巧克力口感香甜可口，但为了保护牙齿健康，父母叮嘱孩子不能吃太多甜食。",
        "Suīrán qiǎokèlì kǒugǎn xiāngtián kěkǒu, dàn wèile bǎohù yáchǐ jiànkāng, fùmǔ dīngzhǔ háizi bù néng chī tài duō tiánshí.",
        "Tuy sô-cô-la có vị thơm ngọt ngon miệng, nhưng để bảo vệ sức khỏe răng miệng, cha mẹ căn dặn con không được ăn quá nhiều đồ ngọt.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "广告": (
        "quảng cáo",
        "家长要引导孩子理性看待电视和网络上的商业广告，不要盲目攀比购买昂贵玩具。",
        "Jiāzhǎng yào yǐngdǎo háizi lǐxìng kàndài diànshì hé wǎngluò shang de shāngyè guǎnggào, bú yào mángmù pānbǐ gòumǎi ángguì wánjù.",
        "Phụ huynh cần hướng dẫn trẻ nhìn nhận các quảng cáo thương mại trên truyền hình và internet một cách lý trí, không nên đua đòi mua sắm đồ chơi đắt tiền.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "得意": (
        "đắc ý, tự hào, hài lòng",
        "在数学竞赛中拿了满分之后，孩子得意洋洋地把荣誉证书拿给父母看。",
        "Zài shùxué jìngsài zhōng ná le mǎnfēn zhīhòu, háizi déyì-yángyáng de bǎ róngyù zhèngshū ná gěi fùmǔ kàn.",
        "Sau khi đạt điểm tối đa trong kỳ thi học sinh giỏi toán, đứa trẻ đắc ý hớn hở mang giấy chứng nhận vinh dự cho cha mẹ xem.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "感动": (
        "cảm động, lay động lòng người",
        "看到孩子亲手为自己制作的母亲节贺卡，妈妈感动得流下了欣慰的眼泪。",
        "Kàndào háizi qīnshǒu wèi zìjǐ zhìzuò de Mǔqīnjié hèkǎ, māma gǎndòng de liú xià le xīnwèi de yǎnlèi.",
        "Nhìn thấy tấm thiệp chúc mừng Ngày của Mẹ do chính tay con tự làm, người mẹ cảm động trào nước mắt vì vui mừng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "扔": (
        "ném, vứt, quẳng",
        "我们要教育孩子讲文明懂礼貌，绝不能随手把废纸和果皮扔在地上。",
        "Wǒmen yào jiàoyù háizi jiǎng wénmíng dǒng lǐmào, jué bù néng suíshǒu bǎ fèizhǐ hé guǒpí rēng zài dì shang.",
        "Chúng ta cần dạy con em mình sống văn minh hiểu lễ nghĩa, tuyệt đối không được tiện tay vứt giấy vụn và vỏ hoa quả xuống sàn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "按照": (
        "theo, dựa theo, căn cứ vào",
        "孩子们按照老师制订的时间表规律作息，学习状态和精神面貌都非常好。",
        "Háizimen ànzhào lǎoshī zhìdìng de shíjiānbiǎo guīlǜ zuòxī, xuéxí zhuàngtài hé jīngshén miànmào dōu fēicháng hǎo.",
        "Các bạn nhỏ sinh hoạt điều độ theo đúng thời gian biểu do thầy cô lập ra, tình trạng học tập và tinh thần đều rất tốt.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "擦": (
        "lau chùi, xoa, cọ",
        "放学后，值日生主动拿起抹布，把教室里的黑板和每张课桌都擦得干干净净。",
        "Fàngxué hòu, zhírìshēng zhǔdòng ná qǐ mǎbù, bǎ jiàoshì lǐ de hēibǎn hé měi zhāng kèzhuō dōu cā de gāngānjìngjìng.",
        "Sau khi tan học, học sinh trực nhật chủ động cầm giẻ lau, lau sạch bóng chiếc bảng đen và từng chiếc bàn học trong lớp.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "数": (
        "con số, số lượng (shù)",
        "在这个班级里，热爱阅读科普书籍的学生数占了全班总人数的大半以上。",
        "Zài zhè gè bānjí lǐ, rè'ài yuèdú kēpǔ shūjí de xuéshēng shù zhàn le quán bān zǒng rénshù de dà bàn yǐshàng.",
        "Trong lớp học này, số lượng học sinh yêu thích đọc sách khoa học phổ biến chiếm hơn một nửa tổng số học sinh cả lớp.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "既然": (
        "đã... thì... (既然...就...)",
        "既然你已经向老师承诺要改掉粗心马虎的毛病，今后做题就一定要认真细致。",
        "Jìrán nǐ yǐjīng xiàng lǎoshī chéngnuò yào gǎidiào cūxīn mǎhu de máobìng, jīnhòu zuò tí jiù yídìng yào rènzhēn xìzhì.",
        "Đã hứa với thầy cô là sửa thói quen bất cẩn ẩu đoản thì từ nay làm bài nhất định phải chăm chú tỉ mỉ.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "暑假": (
        "kỳ nghỉ hè",
        "今年暑假，父母打算带孩子参加一次走进大自然的夏令营活动。",
        "Jīnnián shǔjià, fùmǔ dǎsuàn dài háizi cānjiā yí cì zǒujìn dàzìrán de xiàlìngyíng huódòng.",
        "Kỳ nghỉ hè năm nay, cha mẹ dự định đưa con tham gia một chuyến cắm trại hè hòa mình vào thiên nhiên hoang dã.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "来得及": (
        "còn kịp, kịp thời",
        "只要你现在立刻静下心来认真复习，期末考试取得好成绩是完全来得及的。",
        "Zhǐyào nǐ xiànzài lìkè jìng xià xīn lai rènzhēn fùxí, qīmò kǎoshì qǔdé hǎo chéngjì shì wánquán láidejí de.",
        "Chỉ cần bây giờ con lập tức tĩnh tâm tập trung ôn tập thì việc đạt điểm tốt trong kỳ thi cuối kỳ là hoàn toàn còn kịp.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "正确": (
        "chính xác, đúng đắn",
        "引导孩子树立正确的人生观和价值观，是家庭教育最核心的基石。",
        "Yǐngdǎo háizi shùlì zhèngquè de rénshēngguān hé jiàzhíguān, shì jiātíng jiàoyù zuì héxīn de jīshí.",
        "Hướng dẫn con trẻ xây dựng nhân sinh quan và quan niệm giá trị đúng đắn là nền tảng cốt lõi nhất của giáo dục gia đình.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "污染": (
        "ô nhiễm, làm ô nhiễm",
        "我们要从小培养孩子爱护环境的良好习惯，拒绝随意丢弃有害电池污染水源。",
        "Wǒmen yào cóngxiǎo péiyǎng háizi àihù huánjìng de liánghǎo xíguàn, jùjué suíyì diūqì yǒuhài diànchí wūrǎn shuǐyuán.",
        "Chúng ta cần nuôi dưỡng thói quen bảo vệ môi trường cho trẻ từ bé, kiên quyết không tùy tiện vứt pin độc hại làm ô nhiễm nguồn nước.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "演": (
        "diễn xuất, biểu diễn, đóng vai",
        "在学校举办的迎新年话剧汇演中，他生动地演了一位乐于助人的老爷爷。",
        "Zài xuéxiào jǔbàn de yíng xīnnián huàjù huìyǎn zhōng, tā shēngdòng de yǎn le yí wèi lèyú-zhùrén de lǎo yéye.",
        "Trong buổi biểu diễn kịch đón năm mới do trường tổ chức, cậu ấy đã vào vai một người ông tốt bụng hết sức sống động.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "父女": (
        "hai cha con (cha và con gái)",
        "在这张泛黄的老照片上，父女俩坐在阳光明媚的草地上开怀大笑。",
        "Zài zhè zhāng fànhuáng de lǎo zhàopiàn shang, fùnǚ liǎ zuò zài yángguāng míngmèi de cǎodì shang kāihuái dàxiào.",
        "Trên tấm ảnh cũ đã ố vàng này, hai cha con ngồi trên bãi cỏ ngập tràn ánh nắng và cười rạng rỡ hết cỡ.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "生": (
        "nảy sinh, sinh ra, sống sót",
        "经常受到父母无端指责的孩子，容易在内心生出自卑与叛逆的抵触情绪。",
        "Jīngcháng shòudào fùmǔ wúduān zhǐzé de háizi, róngyì zài nèixīn shēng chū zìbēi yǔ pànnì de dǐchù qíngxù.",
        "Những đứa trẻ thường xuyên bị cha mẹ trách mắng vô cớ rất dễ nảy sinh tâm lý tự ti và phản kháng trong lòng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "盒子": (
        "cái hộp, chiếc hộp",
        "小女孩把珍藏多年的彩色弹珠和精美明信片都整齐地放在了这个小木盒子里。",
        "Xiǎo nǚhái bǎ zhēncáng duō nián de cǎisè dànzhū hé jīngměi míngxìnpiàn dōu zhěngqí de fàng zài le zhè gè xiǎo mù hézi lǐ.",
        "Bé gái đã cất xếp những viên bi ve nhiều màu sắc và những tấm bưu thiếp tinh xảo tích lũy bao năm gọn gàng vào trong chiếc hộp gỗ nhỏ này.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "研究生": (
        "nghiên cứu sinh, học viên cao học",
        "这位年轻的研究生毕业后毅然选择去乡村小学支教，奉献自己的青春力量。",
        "Zhè wèi niánqīng de yánjiūshēng bìyè hòu yìrán xuǎnzé qù xiāngcūn xiǎoxué zhījiào, fèngxiàn zìjǐ de qīngchūn lìliang.",
        "Học viên cao học trẻ tuổi này sau khi tốt nghiệp đã kiên quyết chọn về trường tiểu học nông thôn để dạy học tình nguyện, cống hiến sức trẻ của mình.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "空": (
        "trống không, rỗng không (kōng)",
        "在经历了长达一小时的严厉训斥后，孩子脑子里一片空白，完全不知所措。",
        "Zài jīnglì le cháng dá yì xiǎoshí de yánlì xùnchì hòu, háizi nǎozili yípiàn kòngbái, wánquán bùzhīsuǒcuò.",
        "Sau khi trải qua một giờ đồng hồ dài bị khiển trách nghiêm khắc, đầu óc đứa trẻ hoàn toàn trống rỗng và vô cùng lúng túng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "篇": (
        "bài, thiên (lượng từ cho bài văn, bài báo, trang viết)",
        "语文老师建议同学们每周坚持精读一篇优秀的经典文学散文名篇。",
        "Yǔwén lǎoshī jiànyì tóngxuémen měi zhōu jiānchí jīngdú yì piān yōuxiù de jīngdiǎn wénxué sǎnwén míngpiān.",
        "Thầy dạy Ngữ văn khuyên các bạn học sinh mỗi tuần nên kiên trì đọc kỹ một bài tản văn văn học kinh điển xuất sắc.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "缺": (
        "thiếu, thiếu hụt",
        "在孩子的成长旅途中，绝不能缺少来自父母的理解、尊重与长久陪伴。",
        "Zài háizi de chéngzhǎng lǚtú zhōng, jué bù néng quēshǎo láizì fùmǔ de lǐjiě, zūnzhòng yǔ chángjiǔ péibàn.",
        "Trong hành trình trưởng thành của con trẻ, tuyệt đối không thể thiếu sự thấu hiểu, tôn trọng và đồng hành lâu dài từ cha mẹ.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "者": (
        "người, kẻ (hậu tố chỉ người thực hiện hành vi)",
        "真正的优秀教育者，从不仅仅传授书本知识，更懂得如何启迪孩子的心灵智慧。",
        "Zhēnzhèng de yōuxiù jiàoyùzhě, cóng bù jǐnjǐn chuánshòu shūběn zhīshi, gèng dǒngde rúhé qǐdí háizi de xīnlíng zhìhuì.",
        "Một nhà giáo dục thực sự ưu tú không bao giờ chỉ dừng lại ở việc truyền thụ kiến thức sách vở, mà còn rất thấu hiểu cách thức khai sáng trí tuệ tâm hồn cho trẻ.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "自信": (
        "tự tin, lòng tự tin",
        "在父母持续的鼓励与肯定下，孩子终于重拾了战胜困难的充足自信。",
        "Zài fùmǔ chíxù de gǔlì yǔ kěndìng xià, háizi zhōngyú chóngshí le zhànshèng kùnnan de chōngzú zìxìn.",
        "Dưới sự khích lệ và công nhận bền bỉ của cha mẹ, đứa trẻ cuối cùng đã lấy lại được sự tự tin tràn đầy để chiến thắng khó khăn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "表扬": (
        "khen ngợi, biểu dương",
        "当孩子在生活细节中展现出懂事体贴的一面时，家长应当及时给予真诚的表扬。",
        "Dāng háizi zài shēnghuó xìjié zhōng zhǎnxiàn chū dǒngshì tǐtiē de yí miàn shí, jiāzhǎng yīngdāng jíshí jǐyǔ zhēnchéng de biǎoyáng.",
        "Khi con thể hiện mặt hiểu chuyện và chu đáo trong các chi tiết đời sống, cha mẹ nên kịp thời dành lời khen ngợi chân thành.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "记者": (
        "phóng viên, nhà báo",
        "几位关注未成年人心理健康的记者专程来到学校，就家庭教育现状进行了深入采访。",
        "Jǐ wèi guānzhù wèichéngniánrén xīnlǐ jiànkāng de jìzhě zhuānchéng lái dào xuéxiào, jiù jiātíng jiàoyù xiànzhuàng jìnxíng le shēnrù cǎifǎng.",
        "Mấy phóng viên quan tâm đến sức khỏe tâm lý trẻ vị thành niên đã đặc biệt đến trường để phỏng vấn sâu về hiện trạng giáo dục gia đình.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "负责": (
        "chịu trách nhiệm, phụ trách",
        "作为一名有责任感的家长，必须对孩子日常的行为规范和安全教育切实负起责任。",
        "Zuòwéi yì míng yǒu zérèngǎn de jiāzhǎng, bìxū duì háizi rìcháng de xíngwéi guīfàn hé ānquán jiàoyù qièshí fù qǐ zérèn.",
        "Là một phụ huynh có tinh thần trách nhiệm, cần phải thực sự chịu trách nhiệm về quy phạm hành vi và giáo dục an toàn hàng ngày của con.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "距离": (
        "khoảng cách, cự ly",
        "多倾听孩子的真实心声与情感诉求，有助于有效拉近父母与孩子之间的心理距离。",
        "Duō qīngtīng háizi de zhēnshí xīnshēng yǔ qínggǎn sùqiú, yǒu zhù yú yǒuxiào lājìn fùmǔ yǔ háizi zhījiān de xīnlǐ jùlí.",
        "Thường xuyên lắng nghe tâm tư nguyện vọng thực sự của con sẽ giúp kéo gần khoảng cách tâm lý giữa cha mẹ và con cái một cách hiệu quả.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "连": (
        "ngay cả, đến cả (连...都...)",
        "他今天身体实在太虚弱了，生病难受得连平时最喜欢吃的冰激凌都一口不碰。",
        "Tā jīntiān shēntǐ shízài tài xūruò le, shēngbìng nánshòu de lián píngshí zuì xǐhuan chī de bīngjīlíng dōu yì kǒu bù pèng.",
        "Hôm nay cơ thể cậu ấy thực sự quá yếu ớt, ốm mệt đến mức ngay cả món kem ngày thường thích ăn nhất cũng không buồn động một miếng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "重": (
        "nặng, nghiêm trọng, coi trọng (zhòng)",
        "我们做事情不仅要讲求办事速度，更要注重最终交付的工作质量。",
        "Wǒmen zuò shìqing bùjǐn yào jiǎngqiú bànshì sùdù, gèng yào zhùzhòng zuìzhōng jiāofù de gōngzuò zhìliàng.",
        "Chúng ta làm việc không chỉ cần chú trọng tốc độ giải quyết mà càng phải coi trọng chất lượng công việc bàn giao cuối cùng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "降温": (
        "hạ nhiệt, giảm nhiệt, trở lạnh",
        "气象台发布了寒潮蓝色预警，预计明天夜间全市气温将明显降温六到八度。",
        "Qìxiàngtái fābù le háncháo lánsè yùjǐng, yùjì míngtiān yèjiān quán shì qìwēn jiāng míngxiǎn jiàngwēn liù dào bā dù.",
        "Đài khí tượng đã phát đi cảnh báo màu xanh về đợt không khí lạnh, dự kiến đêm mai nhiệt độ toàn thành phố sẽ hạ nhiệt rõ rệt từ sáu đến tám độ.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "顺序": (
        "thứ tự, trình tự",
        "在指导孩子解数学应用题时，要提醒他们严格按照解题顺序一步一步细心推导。",
        "Zài zhǐdǎo háizi jiě shùxué yìngyòngtí shí, yào tíxǐng tāmen yángé ànzhào jiětí shùnxù yí bù yí bù xìxīn tuīdǎo.",
        "Khi hướng dẫn con giải toán ứng dụng, cần nhắc nhở con làm theo đúng trình tự giải từng bước một cách cẩn thận suy luận.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "高速": (
        "tốc độ cao, đường cao tốc",
        "国庆假期出行车辆很多，自驾带全家出行在高速公路上行车时务必保持安全车距。",
        "Guóqìng jiàqī chūxíng chēliàng hěn duō, zìjià dài quánjiā chūxíng zài gāosù gōnglù shang xíngchē shí wùbì bǎochí ānquán chējù.",
        "Kỳ nghỉ lễ Quốc khánh lượng xe cộ lưu thông rất đông, khi tự lái xe đưa cả nhà đi trên đường cao tốc nhất định phải giữ khoảng cách xe an toàn.",
        "LINGUISTICALLY_REVIEWED_AI"
    )
}

def generate_l15():
    with open('data/hsk30/staging/dev_hsk4_vocab_raw.json', 'r', encoding='utf-8') as f:
        raw_vocab = json.load(f)

    l15_raw = [w for w in raw_vocab if w['lessonNumber'] == LESSON_NUMBER]
    assert len(l15_raw) == 50, f"Expected 50 raw words for L15, got {len(l15_raw)}"

    enriched_records = []
    for item in l15_raw:
        hanzi = item['hanzi']
        assert hanzi in L15_DEFINITIONS, f"Missing definition for '{hanzi}' in L15"
        meaning_vi, ex_zh, ex_py, ex_vi, qa_status = L15_DEFINITIONS[hanzi]

        enriched_record = {
            "devId": item['devId'],
            "lessonId": LESSON_ID,
            "lessonNumber": LESSON_NUMBER,
            "hanzi": hanzi,
            "pinyin": item['pinyin'],
            "meaningVi": meaning_vi,
            "exampleZh": ex_zh,
            "examplePy": ex_py,
            "exampleVi": ex_vi,
            "qaStatus": qa_status,
            "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
        }
        enriched_records.append(enriched_record)

    out_file = Path("scripts/hsk30/hsk4_vocab_data_p3_l15.py")
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write("# -*- coding: utf-8 -*-\n")
        f.write('"""\nHSK 4 Vocabulary Data — Part 3: Lesson 15 (50 words)\n')
        f.write(f'LessonId: {LESSON_ID}\nLesson Title: {LESSON_TITLE}\n"""\n\n')
        f.write(f'LESSON_ID = "{LESSON_ID}"\n')
        f.write(f'LESSON_NUMBER = {LESSON_NUMBER}\n')
        f.write(f'LESSON_TITLE = "{LESSON_TITLE}"\n\n')
        f.write("HSK4_DATA_P3_L15_RECORDS = ")
        f.write(json.dumps(enriched_records, ensure_ascii=False, indent=4))
        f.write("\n\n")
        f.write("# Dictionary format compatible with P1 / P2: (lesson_num, hanzi) -> (meaningVi, exampleZh, examplePy, exampleVi)\n")
        f.write("HSK4_DATA_P3_L15 = {\n")
        for item in enriched_records:
            m = item["meaningVi"].replace('"', '\\"')
            ezh = item["exampleZh"].replace('"', '\\"')
            epy = item["examplePy"].replace('"', '\\"')
            evi = item["exampleVi"].replace('"', '\\"')
            f.write(f'    ({item["lessonNumber"]}, "{item["hanzi"]}"): ("{m}", "{ezh}", "{epy}", "{evi}"),\n')
        f.write("}\n")

    content_bytes = out_file.read_bytes()
    sha256_hash = hashlib.sha256(content_bytes).hexdigest()
    print(f"Successfully generated {out_file} (50 words, SHA256: {sha256_hash})")

    # Update checkpoint
    from save_checkpoint import update_checkpoint
    update_checkpoint(
        stage="STAGE_P3_LESSON15_COMPLETED",
        completed_lessons=list(range(1, 16)),
        completed_vocab_count=750,
        status="IN_PROGRESS"
    )
    print("Updated checkpoint: 750 words completed (Part 3 fully completed).")

if __name__ == '__main__':
    generate_l15()

