# -*- coding: utf-8 -*-
"""
Generator and Validator for HSK 4 — Lesson 20 Vocabulary
LessonId: 2FADFA73-1A0F-4C8B-A556-30539D2A9B40
Lesson 20: 展望未来的世界 (50 words)
"""
import sys
import json
import hashlib
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

LESSON_ID = "2FADFA73-1A0F-4C8B-A556-30539D2A9B40"
LESSON_NUMBER = 20
LESSON_TITLE = "展望未来的世界"

L20_DEFINITIONS = {
    "世纪": (
        "thế kỷ",
        "步入二十一世纪，人类科技迎来了前所未有的数字化与智能化高速变革。",
        "Bùrù èrshíyī shìjì, rénlèi kējì yínglái le qiánsuǒwèiyǒu de shùzìhuà yǔ zhìnénghuà gāosù biàngé.",
        "Bước vào thế kỷ hai mươi mốt, khoa học công nghệ của nhân loại đã đón chào cuộc cải cách số hóa và thông minh hóa thần tốc chưa từng có.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "乘": (
        "ngồi, đi (tàu xe, máy bay); nhân (phép tính)",
        "未来城际交通将更加高效，乘客只需乘坐超高速真空磁悬浮列车就能在半小时内跨省通勤。",
        "Wèilái chéngjì jiāotōng jiāng gèngjiā gāoxiào, chéngkè zhǐ xū chéngzuò chāo gāosù zhēnkōng cíxuánfú lièchē jiù néng zài bàn xiǎoshí nèi kuà shěng tōngqín.",
        "Giao thông liên đô thị trong tương lai sẽ càng thêm hiệu quả cao, hành khách chỉ cần đi tàu đệm từ chân không siêu tốc độ là có thể đi lại giữa các tỉnh trong vòng nửa tiếng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "人生": (
        "đời người, nhân sinh, cuộc đời",
        "在漫长的人生道路上，保持终身学习的热情是应对未来未知挑战的最佳智慧。",
        "Zài màncháng de rénshēng dàolù shang, bǎochí zhōngshēn xuéxí de rèqíng shì yìngduì wèilái wèizhī tiǎozhàn de zuì jiā zhìhuì.",
        "Trên con đường đời người dài đằng đẵng, duy trì nhiệt huyết học tập suốt đời chính là trí tuệ tốt nhất để ứng phó với các thử thách chưa biết trong tương lai.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "伤心": (
        "đau lòng, buồn bã, tổn thương",
        "面对成长过程中遭遇的挫折无需过度伤心，每一次摔倒都是磨砺意志的宝贵财富。",
        "Miànduì chéngzhǎng guòchéng zhōng zāoyù de cuòzhé wúxū guòdù shāngxīn, měi yí cì shuāidǎo dōu shì mólì yìzhì de bǎoguì cáifù.",
        "Đối mặt với những trắc trở gặp phải trong quá trình trưởng thành không cần phải quá đau buồn, mỗi một lần vấp ngã đều là tài sản quý báu tôi luyện ý chí.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "便于": (
        "thuận tiện cho, dễ dàng để",
        "未来智能办公软件采用了极简模块化设计，非常便于全球跨地域团队协同办公。",
        "Wèilái zhìnéng bàngōng ruǎnjiàn cǎiyòng le jíjiǎn mókuàihuà shèjì, fēicháng biànyú quánqiú kuà-dìyù tuánduì xiétóng bàngōng.",
        "Phần mềm văn phòng thông minh tương lai áp dụng thiết kế mô đun tối giản, rất thuận tiện cho các nhóm làm việc phối hợp xuyên khu vực trên toàn cầu.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "停车场": (
        "bãi đỗ xe, bãi gửi xe",
        "未来的地下多功能智能立体停车场，能够通过机器人托盘实现汽车自动存取。",
        "Wèilái de dìxià duō gōngnéng zhìnéng lìtǐ tíngchēchǎng, nénggòu tōngguò jīqìrén tuōpán shíxiàn qìchē zìdòng cúnqǔ.",
        "Bãi đỗ xe lập thể ngầm thông minh đa chức năng trong tương lai có thể thông qua khay nâng robot để thực hiện việc gửi và lấy xe ô tô tự động.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "公路": (
        "đường bộ, đường cái, xa lộ",
        "科学家正在试验能够实现无线光伏发电和自动融雪的未来绿色超级智慧公路。",
        "Kēxuéjiā zhèngzài shìyàn nénggòu shíxiàn wúxiàn guāngfú fādiàn hé zìdòng róngxuě de wèilái lǜsè chāojí zhìhuì gōnglù.",
        "Các nhà khoa học đang thử nghiệm tuyến siêu xa lộ thông minh xanh tương lai có thể phát điện quang điện không dây và tự động làm tan tuyết.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "减": (
        "giảm, giảm bớt, hạ",
        "推广可再生绿色清洁能源有助于大幅减低温室气体排放，减缓全球变暖趋势。",
        "Tuīguǎng kězàishēng lǜsè qīngjié néngyuán yǒu zhù yú dàfú jiǎndī wēnshì qìtǐ páifàng, jiǎnhuǎn quánqiú biànnuǎn qūshì.",
        "Đẩy mạnh năng lượng tái tạo xanh sạch giúp giảm đáng kể lượng phát thải khí nhà kính và làm chậm lại xu thế nóng lên toàn cầu.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "办事": (
        "làm việc, giải quyết công việc, xử lý công vụ",
        "未来城市一网通办数字化平台极大简化了流程，市民在手机上足不出户就能轻松办事。",
        "Wèilái chéngshì yìwǎngtōngbàn shùzìhuà píngtái jídà jiǎnhuà le liúchéng, shìmín zài shǒujī shang zúbùchūhù jiù néng qīngsōng bànshì.",
        "Nền tảng số hóa dịch vụ hành chính công một cửa tương lai đã đơn giản hóa tối đa quy trình, người dân không cần ra khỏi cửa cũng có thể dễ dàng giải quyết công việc trên điện thoại.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "千万": (
        "nhất thiết, tuyệt đối (khuyên răn); hàng ngàn vạn (qiānwàn)",
        "走向未来充满机遇与挑战的世界，我们千万不要固步自封，而要勇敢拥抱创新变革。",
        "Zǒuxiàng wèilái chōngmǎn jīyù yǔ tiǎozhàn de shìjiè, wǒmen qiānwàn bú yào gùbù-zìfēng, ér yào yǒnggǎn yōngbào chuàngxīn biàngé.",
        "Bước vào thế giới tương lai tràn ngập thời cơ và thách thức, chúng ta tuyệt đối không được tự mãn khép kín, mà phải dũng cảm đón nhận đổi mới sáng tạo.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "厨师": (
        "đầu bếp",
        "未来的餐厅里，智能烹饪机器人将与五星级专业厨师协同配合，制作出兼顾营养与美味的特色佳肴。",
        "Wèilái de cāntīng lǐ, zhìnéng pēngrèn jīqìrén jiāng yǔ wǔxīngjí zhuānyè chúshī xiétóng pèihé, zhìzuò chū jiāngù yíngyǎng yǔ měiwèi de tèsè jiāyáo.",
        "Trong các nhà hàng tương lai, robot nấu nướng thông minh sẽ hiệp đồng phối hợp với các đầu bếp chuyên nghiệp chuẩn 5 sao để chế biến ra những món ăn đặc sắc vừa bổ dưỡng vừa thơm ngon.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "叫作": (
        "gọi là, được gọi là",
        "这套由我国科学家完全自主研发的下一代量子通信加密协议，被形象地叫作量子盾牌。",
        "Zhè tào yóu wǒ guó kēxuéjiā wánquán zìzhǔ yánfā de xià yídài liàngzǐ tōngxìn jiāmì xiéyì, bèi xíngxiàng de jiàozuò Liàngzǐ Dùnpái.",
        "Bộ giao thức mã hóa thông tin lượng tử thế hệ tiếp theo do các nhà khoa học nước ta hoàn toàn tự chủ nghiên cứu này được ví von gọi là Chiếc khiên lượng tử.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "周围": (
        "xung quanh, vùng lân cận",
        "未来生态智慧社区注重人与自然和谐，住宅周围环绕着茂密的立体绿化花园与清澈水系。",
        "Wèilái shēngtài zhìhuì shèqū zhùzhòng rén yǔ zìrán héxié, zhùzhái zhōuwéi huánrào zhe màomì de lìtǐ lǜhuà huāyuán yǔ qīngchè shuǐxì.",
        "Khu đô thị thông minh sinh thái tương lai coi trọng sự hài hòa giữa con người và thiên nhiên, xung quanh khu nhà ở được bao bọc bởi các khu vườn phủ xanh đa tầng rậm rạp và hệ thống nước trong lành.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "国际": (
        "quốc tế",
        "应对全球气候变化与未来资源短缺等全球性危机，需要更加紧密高效的国际多边合作。",
        "Yìngduì quánqiú qìhòu biànhuà yǔ wèilái zīyuán duǎnquē děng quánqiúxìng wēijī, xūyào gèngjiā jǐnmì gāoxiào de guójì duōbiān hézuò.",
        "Để ứng phó với các cuộc khủng hoảng mang tính toàn cầu như biến đổi khí hậu và khan hiếm tài nguyên tương lai, cần có sự hợp tác đa phương quốc tế chặt chẽ và hiệu quả hơn nữa.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "外出": (
        "ra ngoài, đi ra ngoài",
        "未来居民外出旅行或公干时，家庭智能中枢会自动启动防盗节能安防巡航模式。",
        "Wèilái jūmín wàichū lǚxíng huò gōnggàn shí, jiātíng zhìnéng zhōngshū huì zìdòng qǐdòng fángdào jiénéng ānfáng xúnháng móshì.",
        "Khi cư dân tương lai ra ngoài du lịch hoặc đi công tác, trung tâm điều khiển nhà thông minh sẽ tự động kích hoạt chế độ tuần tra an ninh chống trộm tiết kiệm năng lượng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "奖": (
        "giải thưởng, phần thưởng, giải",
        "青少年科技创新大赛特意设立了未来科学家专项大奖，以激发中小学生探索宇宙的科学梦想。",
        "Qīngshàonián kējì chuàngxīn dàsài tèyì shèlì le wèilái kēxuéjiā zhuānxiàng dà jiǎng, yǐ jīfā zhōng-xiǎoxuéshēng tànsuǒ yǔzhòu de kēxué mèngxiǎng.",
        "Cuộc thi sáng tạo khoa học kỹ thuật thanh thiếu niên đã đặc biệt thiết lập giải thưởng lớn dành riêng cho các Nhà khoa học tương lai, nhằm khơi dậy ước mơ khoa học khám phá vũ trụ của học sinh phổ thông.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "客厅": (
        "phòng khách",
        "在未来的未来家庭客厅里，超高清全息投影墙能够随时将空间切换成星空或森林全景。",
        "Zài wèilái de wèilái jiātíng kètīng lǐ, chāo gāoqīng quánxī tóuyǐng qiáng nénggòu suíshí jiāng kōngjiān qiēhuàn chéng xīngkōng huò sēnlín quánjǐng.",
        "Trong phòng khách gia đình tương lai, bức tường máy chiếu ba chiều siêu nét có thể chuyển đổi không gian thành toàn cảnh bầu trời đầy sao hay rừng rậm bất cứ lúc nào.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "小吃": (
        "đồ ăn vặt, món ăn nhẹ, món ngon truyền thống",
        "虽然未来快节奏生活带来了预制营养餐，但承载着地方文化印记的传统街头小吃依然无可替代。",
        "Suīrán wèilái kuài jiézòu shēnghuó dàilái le yùzhì yíngyǎng cān, dàn chéngzài zhe dìfāng wénhuà yìnjì de chuántǒng jiētóu xiǎochī yīrán wúkě-tìdài.",
        "Tuy nhịp sống hối hả tương lai mang đến các bữa ăn dinh dưỡng chế biến sẵn, nhưng những món ăn vặt đường phố truyền thống mang đậm dấu ấn văn hóa địa phương vẫn là thứ không thể thay thế.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "帅": (
        "bảnh bao, đẹp trai, tuấn tú, phong độ (shuài)",
        "那位青年航天员穿上国产全新一代舱外航天服，英姿勃发，显得格外帅气精神。",
        "Nà wèi qīngnián hángtiānyuán chuān shang guóchǎn quánxīn yídài cāngwài hángtiānfú, yīngzī-bófā, xiǎnde géwài shuàiqi jīngshen.",
        "Phi hành gia trẻ tuổi đó mặc bộ đồ du hành vũ trụ ngoài khoang thế hệ mới do nước nhà sản xuất, phong thái hiên ngang, trông vô cùng bảnh bao tuấn tú và tinh anh.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "底下": (
        "dưới, phía dưới, bên dưới",
        "在未来城市立体交通规划中，地面是步行绿道，底下则是地下物流管网与轨道交通网络。",
        "Zài wèilái chéngshì lìtǐ jiāotōng guīhuà zhōng, dīmiàn shì bùxíng lǜdào, dǐxia zé shì dìxià wùliú guǎnwǎng yǔ guǐdào jiāotōng wǎngluò.",
        "Trong quy hoạch giao thông lập thể đô thị tương lai, mặt đất là đường đi bộ rợp bóng cây, phía dưới lòng đất thì là mạng lưới đường ống logistics ngầm và mạng lưới giao thông đường sắt.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "快餐": (
        "thức ăn nhanh, đồ ăn nhanh",
        "为了追求长久的身体健康，未来的都市青年越来越倾向于自制营养沙拉，减少高油脂快餐的食用频率。",
        "Wèile zhuīqiú chángjiǔ de shēntǐ jiànkāng, wèilái de dūshì qīngnián yuèláiyuè qīngxiàng yú zìzhì yíngyǎng shālā, jiǎnshǎo gāo yóuzhǐ kuàicān de shíyòng pínlǜ.",
        "Để theo đuổi sức khỏe thể chất lâu dài, thanh niên đô thị tương lai ngày càng có xu hướng tự làm salad dinh dưỡng, giảm bớt tần suất ăn thức ăn nhanh nhiều dầu mỡ.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "懒": (
        "lười biếng, lười nhác (lǎn)",
        "科技创新虽然让日常生活变得极为便利，但人绝不能因此变得懒惰而丧失勤奋劳动的能力。",
        "Kējì chuàngxīn suīrán ràng rìcháng shēnghuó biànde jíwéi biànlì, dàn rén jué bù néng yīncǐ biànde lǎnduò ér sàngshī qínfèn láodòng de nénglì.",
        "Đổi mới khoa học công nghệ tuy khiến cuộc sống thường nhật trở nên vô cùng tiện lợi, nhưng con người tuyệt đối không được vì thế mà trở nên lười biếng và đánh mất năng lực lao động chăm chỉ.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "报名": (
        "đăng ký, ghi danh, báo danh",
        "国家航天局刚一公布面向全社会公开招募未来商业太空飞行志愿者的消息，就有数万人踊跃报名。",
        "Guójiā Hángtiānjú gāng yì gōngbù miànxiàng quán shèhuì gōngkāi zhāomù wèilái shāngyè tàikōng fēixíng zhìyuànzhě de xiāoxi, jiù yǒu shù wàn rén yǒngyuè bàomíng.",
        "Cơ quan Vũ trụ Quốc gia vừa công bố thông tin tuyển chọn công khai tình nguyện viên du hành không gian thương mại tương lai ra toàn xã hội, đã có hàng vạn người hăng hái đăng ký ghi danh.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "排队": (
        "xếp hàng",
        "借助未来生物识别与自动通关无感支付技术，机场和车站旅客登机检票将彻底告别漫长的排队等待。",
        "Jièzhù wèilái shēngwù shíbié yǔ zìdòng tōngguān wúgǎn zhīfù jìshù, jīchǎng hé chēzhàn lǚkè dēngjī jiǎnpiào jiāng chèdǐ gàobié màncháng de páiduì děngdài.",
        "Nhờ vào công nghệ nhận diện sinh trắc học và thanh toán không cảm ứng thông quan tự động trong tương lai, hành khách tại sân bay bến xe khi lên máy bay soát vé sẽ hoàn toàn tạm biệt việc phải xếp hàng chờ đợi dằng dặc.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "收拾": (
        "dọn dẹp, sắp xếp, thu dọn",
        "未来的家用服务机器人能够自主识别各类杂物并精准抓取，几分钟内就能把整个房间收拾得井井有条。",
        "Wèilái de jiāyòng fúwù jīqìrén nénggòu zìzhǔ shíbié gè lèi záwù bìng jīngzhǔn zhuāqǔ, jǐ fēnzhōng nèi jiù néng bǎ zhěng gè fángjiān shōushi de jǐngjǐng-yǒutiáo.",
        "Robot phục vụ gia đình tương lai có thể tự động nhận diện các loại đồ đạc và gắp chuẩn xác, chỉ trong vài phút là có thể dọn dẹp toàn bộ căn phòng ngăn nắp gọn gàng đâu ra đấy.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "整个": (
        "toàn bộ, toàn thể, cả (thế giới, căn phòng)",
        "科技的日新月异不仅改变了个人的生活方式，更深刻重塑了整个国际社会的经济产业形态。",
        "Kējì de rìxīn-yuèyì bùjǐn gǎibiàn le gèrén de shēnghuó fāngshì, gèng shēnkè chóngsù le zhěng gè guójì shèhuì de jīngjì chǎnyè xíngtài.",
        "Khoa học công nghệ đổi mới từng ngày không những thay đổi phương thức sống của mỗi cá nhân, mà còn tái định hình sâu sắc hình thái ngành nghề kinh tế của toàn bộ xã hội quốc tế.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "早晨": (
        "buổi sáng sớm, sớm mai",
        "每天早晨迎着初升的朝阳跑跑步、呼吸新鲜空气，能为一整天的工作注入充沛的精力与活力。",
        "Měitiān zǎochen yíng zhe chū shēng de zhāoyáng pǎopǎobù, hūxī xīnxiān kōngqì, néng wèi yì zhěng tiān de gōngzuò zhùrù chōngpèi de jīnglì yǔ huólì.",
        "Mỗi buổi sáng sớm đón ánh mặt trời vừa lên chạy bộ, hít thở không khí trong lành có thể tiếp thêm nguồn sinh lực và năng lượng dồi dào cho cả ngày dài làm việc.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "月饼": (
        "bánh trung thu",
        "即使在未来的太空空间站里，中国航天员每逢中秋节也会品尝特制的低糖健康月饼以寄托乡思。",
        "Jíshǐ zài wèilái de tàikōng kōngjiānzhàn lǐ, Zhōngguó hángtiānyuán měi féng Zhōngqiūjié yě huì pǐncháng tèzhì de dī táng jiànkāng yuèbing yǐ jìtuō xiāngsī.",
        "Dù ở trong trạm không gian vũ trụ tương lai, các nhà du hành vũ trụ Trung Quốc mỗi dịp Tết Trung thu cũng sẽ thưởng thức những chiếc bánh trung thu ít đường có lợi cho sức khỏe để gửi gắm nỗi nhớ quê nhà.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "树林": (
        "rừng cây, lùm cây, khu rừng",
        "未来的城市规划将建筑群巧妙地隐藏在郁郁葱葱的天然树林与人工绿海之中，实现城林相融。",
        "Wèilái de chéngshì guīhuà jiāng jiànzhùqún qiǎomiào de yǐncáng zài yùyù-cōngcōng de tiānrán shùlín yǔ réngōng lǜhǎi zhīzhōng, shíxiàn chéng-lín xiāngróng.",
        "Quy hoạch đô thị tương lai khéo léo giấu các cụm tòa nhà giữa những rừng cây tự nhiên xanh tươi bạt ngàn và biển xanh nhân tạo, thực hiện sự giao hòa giữa thành phố và rừng xanh.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "死": (
        "chết, mất mát; cực kỳ, cứng nhắc",
        "面对未来快速迭代的新知识与新技术，我们决不能死读书、读死书，而要注重灵活实践与创新运用。",
        "Miànduì wèilái kuàisù diédài de xīn zhīshi yǔ xīn jìshù, wǒmen jué bù néng sǐ dúshū, dú sǐ shū, ér yào zhùzhòng línghuó shíjiàn yǔ chuàngxīn yùnyòng.",
        "Đối mặt với những kiến thức và công nghệ mới cập nhật liên tục trong tương lai, chúng ta tuyệt đối không thể đọc sách cứng nhắc chết nhắc, mà cần chú trọng thực hành linh hoạt và ứng dụng sáng tạo.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "法律": (
        "pháp luật, luật pháp",
        "面对自动驾驶汽车和人工智能生成内容带来的新伦理挑战，必须及时完善相关的国家法律法规。",
        "Miànduì zìdòng jiàshǐ qìchē hé réngōng zhìnéng shēngchéng nèiróng dàilái de xīn lúnlǐ tiǎozhàn, bìxū jíshí wánshàn xiāngguān de guójiā fǎlǜ fǎguī.",
        "Trước những thách thức luân lý mới do xe tự lái và nội dung do trí tuệ nhân tạo tạo ra mang lại, bắt buộc phải kịp thời hoàn thiện các quy định pháp luật quốc gia liên quan.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "火": (
        "lửa, hỏa lực; hot, thịnh hành, nổi tiếng",
        "这款由青年科学家团队研发的开源大语言模型一经推出就火遍了全球整个科技界。",
        "Zhè kuǎn yóu qīngnián kēxuéjiā tuánduì yánfā de kāiyuán dà yǔyán móxíng yì jīng tuīchū jiù huǒ biàn le quánqiú zhěng gè kējìjiè.",
        "Mô hình ngôn ngữ lớn mã nguồn mở do nhóm các nhà khoa học trẻ nghiên cứu phát triển này vừa ra mắt đã lập tức nổi đình nổi đám hot khắp giới công nghệ toàn cầu.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "牌子": (
        "thương hiệu, nhãn hiệu; tấm biển",
        "未来的消费者在购买商品时不仅看重品牌牌子的知名度，更加看重产品背后的绿色低碳环保理念。",
        "Wèilái de xiāofèizhě zài gòumǎi shāngpǐn shí bùjǐn kànzhòng pǐnpái páizi de zhīmíngdù, gèngjiā kànzhòng chǎnpǐn bèihòu de lǜsè dītàn huánbǎo lǐniàn.",
        "Người tiêu dùng tương lai khi mua sắm hàng hóa không chỉ coi trọng độ nổi tiếng của nhãn hiệu thương hiệu, mà càng coi trọng triết lý bảo vệ môi trường phát thải carbon thấp đằng sau sản phẩm.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "由": (
        "do, bởi, từ (giới từ yóu)",
        "这场关于未来全球生态安全的高级别国际峰会，由联合国环境规划署与多国政府联合主办。",
        "Zhè chǎng guānyú wèilái quánqiú shēngtài ānquán de gāo jíbié guójì fēnghuì, yóu Liánhéguó Huánjìng Guīhuàshǔ yǔ duō guó zhèngfǔ liánhé zhǔbàn.",
        "Hội nghị thượng đỉnh quốc tế cấp cao về an ninh sinh thái toàn cầu tương lai này do Chương trình Môi trường Liên Hợp Quốc cùng chính phủ nhiều nước đồng tổ chức.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "直接": (
        "trực tiếp, thẳng thắn",
        "未来的脑机接口技术有望使脑部指令直接转化为计算机代码，实现人机思维的无缝互联。",
        "Wèilái de nǎo-jī jiēkǒu jìshù yǒuwàng shǐ nǎobù zhǐlìng zhíjiē zhuǎnhuà wéi jìsuànjī dàimǎ, shíxiàn rén-jī sīwéi de wúfèng hùlián.",
        "Công nghệ giao diện não - máy tính trong tương lai có triển vọng giúp các mệnh lệnh của não bộ được chuyển hóa trực tiếp thành mã máy tính, hiện thực hóa sự kết nối tư duy liền mạch giữa người và máy.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "社会": (
        "xã hội, cộng đồng",
        "构建一个更加公平、包容和可持续发展的未来数字化社会，是全人类共同的奋斗愿景。",
        "Gòujiàn yí gè gèngjiā gōngpíng, bāoróng hé kěchíxù fāzhǎn de wèilái shùzìhuà shèhuì, shì quán rénlèi gòngtóng de fèndòu yuànjǐng.",
        "Xây dựng một xã hội số hóa tương lai công bằng hơn, bao dung hơn và phát triển bền vững chính là viễn cảnh phấn đấu chung của toàn thể nhân loại.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "竟然": (
        "lại, mà lại, không ngờ lại (biểu thị sự bất ngờ)",
        "令人惊叹的是，这台体积小巧的微型量子计算机计算能力竟然超越了传统超级计算机成千上万倍。",
        "Lìng rén jīngtàn de shì, zhè tái tǐjī xiǎoqiǎo de wēixíng liàngzǐ jìsuànjī jìsuàn nénglì jìngrán chāoyuè le chuántǒng chāojí jìsuànjī chéngqiān-shàngwàn bèi.",
        "Điều khiến mọi người kinh ngạc là cỗ máy tính lượng tử siêu nhỏ với kích thước bé xinh này mà năng lực tính toán lại vượt xa máy siêu tính truyền thống hàng ngàn hàng vạn lần.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "红包": (
        "tiền mừng tuổi, bao lì xì, hồng bao",
        "逢年过节通过数字人民币向远方亲友发送定制祝福电子数字红包，已经成为了温馨的新风尚。",
        "Féngnián-guòjié tōngguò shùzì rénmínbì xiàng yuǎnfāng qīnyǒu fāsòng dìngzhì zhùfú diànzǐ shùzì hóngbāo, yǐjīng chéngwéi le wēnxīn de xīn fēngshàng.",
        "Vào dịp lễ tết gửi bao lì xì điện tử số kèm lời chúc tùy chỉnh qua đồng nhân dân tệ kỹ thuật số tới người thân bạn bè nơi phương xa đã trở thành một nét phong cách sống mới ấm áp.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "网购": (
        "mua sắm qua mạng, mua hàng online",
        "未来无人机低空物流配送的成熟，将使全国大部分地区的网购商品在下单后半小时内极速送达。",
        "Wèilái wúrénjī dīkōng wùliú pèisòng de chéngshú, jiāng shǐ quánguó dà bùfen dìqū de wǎnggòu shāngpǐn zài xiàdān hòu bàn xiǎoshí nèi jísù sòngdá.",
        "Sự chín muồi của dịch vụ giao hàng bằng máy bay không người lái tầm thấp trong tương lai sẽ giúp hàng hóa mua sắm qua mạng ở đại đa số các vùng trên cả nước được giao thần tốc trong nửa giờ sau khi đặt đơn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "聚": (
        "tụ họp, sum họp, gom lại (jù)",
        "在未来的星际探索时代，散布在不同科研基地的青年学者们依然会定期通过全息技术欢聚一堂。",
        "Zài wèilái de xīngjì tànsuǒ shídài, sànbù zài bùtóng kēyán jīdì de qīngnián xuézhěmen yīrán huì dìngqī tōngguò quánxī jìshù huānjù yì táng.",
        "Trong thời đại khám phá giữa các vì sao tương lai, các học giả trẻ phân tán ở các căn cứ nghiên cứu khác nhau vẫn sẽ định kỳ sum họp vui vẻ cùng nhau qua công nghệ ba chiều toàn phần.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "艺术": (
        "nghệ thuật",
        "未来的艺术创作不再局限于画布与乐器，数字虚拟现实与生成算法正在开拓人类前所未有的艺术表现维度。",
        "Wèilái de yìshù chuàngzuò bú zài júxiàn yú huàbù yǔ yuèqì, shùzì xūnǐ xiànshí yǔ shēngchéng suànfǎ zhèngzài kāituò rénlèi qiánsuǒwèiyǒu de yìshù biǎoxiàn wéidù.",
        "Sáng tác nghệ thuật tương lai không còn bó hẹp nơi khung vẽ và nhạc cụ, thực tế ảo kỹ thuật số cùng thuật toán tạo sinh đang mở ra những chiều kích biểu đạt nghệ thuật chưa từng có của con người.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "袜子": (
        "tất, vớ",
        "智能穿戴织物研发出的新型健康监测袜子，能够全天候实时采集老年人的足底压力与行走步态数据。",
        "Zhìnéng chuāndài zhīwù yánfā chū de xīnxíng jiànkāng jiāncè wàzi, nénggòu quántiānhòu shíshí cǎijí lǎoniánrén de zúdǐ yālì yǔ xíngzǒu bùtài shùjù.",
        "Đôi tất theo dõi sức khỏe kiểu mới do ngành dệt may mặc thông minh nghiên cứu phát triển có thể thu thập dữ liệu áp lực lòng bàn chân và dáng đi của người cao tuổi theo thời gian thực suốt ngày đêm.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "词语": (
        "từ ngữ, thuật ngữ",
        "随着科学技术的飞速演进，人工智能、量子计算、低碳生活等一系列新时代词语不断丰富着现代汉语词汇库。",
        "Suízhe kēxué jìshù de fēisù yǎnjìn, réngōng zhìnéng, liàngzǐ jìsuàn, dītàn shēnghuó děng yí xìliè xīn shídài cíyǔ búduàn fēngfù zhe xiàndài Hànyǔ cíhuìkù.",
        "Cùng với sự tiến triển vượt bậc của khoa học công nghệ, hàng loạt từ ngữ thời đại mới như trí tuệ nhân tạo, tính toán lượng tử, lối sống carbon thấp không ngừng làm giàu thêm cho kho từ vựng tiếng Hán hiện đại.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "购买": (
        "mua, mua sắm",
        "绿色低碳消费理念日益深入人心，越来越多的消费者主动选择购买由循环可再生材料制成的新型环保产品。",
        "Lǜsè dītàn xiāofèi lǐniàn rìyì shēnrù-rénxīn, yuèláiyuè duō de xiāofèizhě zhǔdòng xuǎnzé gòumǎi yóu xúnhuán kězàishēng cáiliào zhìchéng de xīnxíng huánbǎo chǎnpǐn.",
        "Quan niệm tiêu dùng xanh carbon thấp ngày càng đi sâu vào lòng người, ngày càng có nhiều người tiêu dùng chủ động chọn mua các sản phẩm thân thiện với môi trường làm từ vật liệu tuần hoàn tái chế kiểu mới.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "车位": (
        "chỗ đỗ xe, vị trí đỗ xe",
        "借助城市智能停车大脑系统，车主可以通过车机导航提前精准预订目的地附近的空余停车位。",
        "Jièzhù chéngshì zhìnéng tíngchē dànǎo xìtǒng, chēzhǔ kěyǐ tōngguò chējī dǎoháng tíqián jīngzhǔn yùdìng mùdìdì fùjìn de kōngyú chēwèi.",
        "Nhờ vào hệ thống bộ não đỗ xe thông minh của thành phố, chủ xe có thể định vị dẫn đường qua màn hình ô tô để đặt trước chuẩn xác chỗ đỗ xe còn trống gần điểm đến.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "通知": (
        "thông báo, tin báo; thông tri",
        "国际天文学联合会紧急发出全球科研通知，邀请各国天文台共同对新发现的地外小行星展开联合轨道监测。",
        "Guójì Tiānwénxué Liánhéhuì jǐnjí fāchū quánqiú kēyán tōngzhī, yāoqǐng gè guó tiānwéntái gòngtóng duì xīn fāxiàn de dìwài xiǎoxíngxīng zhǎnkāi liánhé guǐdào jiāncè.",
        "Hiệp hội Thiên văn Quốc tế đã khẩn cấp phát đi thông báo nghiên cứu khoa học toàn cầu, mời đài thiên văn các nước cùng triển khai quan trắc quỹ đạo liên hợp đối với tiểu hành tinh mới phát hiện ngoài Trái đất.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "量": (
        "đo lường, cân nhắc, đo đạc (liáng)",
        "气象科研人员利用高精度激光雷达，精准测量极地冰盖厚度与融化速度的变化数据。",
        "Qìxiàng kēyán rényuán lìyòng gāojīngdù jīguāng léidá, jīngzhǔn cèliáng jídì bīnggài hòudù yǔ rónghuà sùdù de biànhuà shùjù.",
        "Các nhà nghiên cứu khí tượng ứng dụng radar laser độ chính xác cao để đo lường chuẩn xác dữ liệu thay đổi về độ dày và tốc độ tan băng của lớp băng địa cực.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "随便": (
        "tùy ý, tùy tiện, tùy thích (suíbiàn)",
        "进入高精尖科学实验室必须严格遵守安全规程与操作细则，绝不能随便触碰精密仪器设备。",
        "Jìnrù gāojīngjiān kēxué shíyànshì bìxū yángé zūnshǒu ānquán guīchéng yǔ cāozuò xìzé, jué bù néng suíbiàn chùpèng jīngmì yíqì shèbèi.",
        "Khi đi vào phòng thí nghiệm khoa học công nghệ cao bắt buộc phải tuân thủ nghiêm ngặt quy trình an toàn và hướng dẫn thao tác, tuyệt đối không được tùy tiện chạm vào các thiết bị dụng cụ tinh xảo.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "食品": (
        "thực phẩm, đồ ăn thức uống",
        "未来的现代生物农业技术将为全球人口提供更加安全、纯净且营养全面均衡的优质绿色健康食品。",
        "Wèilái de xiàndài shēngwù nóngyè jìshù jiāng wèi quánqiú rénkǒu tígōng gèngjiā ānquán, chúnjìng qiě yíngyǎng quánmiàn jūnhéng de yōuzhì lǜsè jiànkāng shípǐn.",
        "Công nghệ nông nghiệp sinh học hiện đại trong tương lai sẽ cung cấp cho dân số toàn cầu những nguồn thực phẩm xanh sạch an toàn, thuần khiết và dinh dưỡng toàn diện cân bằng hơn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "鼻子": (
        "mũi, chiếc mũi",
        "科学家最新研制的人造仿生电子鼻子，能够敏锐探测出空气中极其微量的有毒有害化学气体泄漏。",
        "Kēxuéjiā zuìxīn yánzhì de rénzào fǎngshēng diànzǐ bízi, nénggòu mǐnruì tàncè chū kōngqì zhōng jíqí wēiliàng de yǒudú yǒuhài huàxué qìtǐ xièlòu.",
        "Chiếc mũi điện tử phỏng sinh học nhân tạo mới nhất do các nhà khoa học chế tạo có thể nhạy bén phát hiện ra lượng khí hóa học độc hại rò rỉ cực nhỏ trong không khí.",
        "LINGUISTICALLY_REVIEWED_AI"
    )
}

def generate_l20():
    with open('data/hsk30/staging/dev_hsk4_vocab_raw.json', 'r', encoding='utf-8') as f:
        raw_vocab = json.load(f)

    l20_raw = [w for w in raw_vocab if w['lessonNumber'] == LESSON_NUMBER]
    assert len(l20_raw) == 50, f"Expected 50 raw words for L20, got {len(l20_raw)}"

    enriched_records = []
    for item in l20_raw:
        hanzi = item['hanzi']
        assert hanzi in L20_DEFINITIONS, f"Missing definition for '{hanzi}' in L20"
        meaning_vi, ex_zh, ex_py, ex_vi, qa_status = L20_DEFINITIONS[hanzi]

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

    out_file = Path("scripts/hsk30/hsk4_vocab_data_p4_l20.py")
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write("# -*- coding: utf-8 -*-\n")
        f.write('"""\nHSK 4 Vocabulary Data — Part 4: Lesson 20 (50 words)\n')
        f.write(f'LessonId: {LESSON_ID}\nLesson Title: {LESSON_TITLE}\n"""\n\n')
        f.write(f'LESSON_ID = "{LESSON_ID}"\n')
        f.write(f'LESSON_NUMBER = {LESSON_NUMBER}\n')
        f.write(f'LESSON_TITLE = "{LESSON_TITLE}"\n\n')
        f.write("HSK4_DATA_P4_L20_RECORDS = ")
        f.write(json.dumps(enriched_records, ensure_ascii=False, indent=4))
        f.write("\n\n")
        f.write("# Dictionary format compatible with P1 / P2: (lesson_num, hanzi) -> (meaningVi, exampleZh, examplePy, exampleVi)\n")
        f.write("HSK4_DATA_P4_L20 = {\n")
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
        stage="STAGE_P4_LESSON20_COMPLETED",
        completed_lessons=list(range(1, 21)),
        completed_vocab_count=1000,
        status="IN_PROGRESS"
    )
    print("Updated checkpoint: 1,000 words completed! (All 20 lessons enriched).")

if __name__ == '__main__':
    generate_l20()

