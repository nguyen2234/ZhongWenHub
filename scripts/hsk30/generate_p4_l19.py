# -*- coding: utf-8 -*-
"""
Generator and Validator for HSK 4 — Lesson 19 Vocabulary
LessonId: 538114D5-65FA-4154-B9A9-87FB6940F0CB
Lesson 19: 旅行的真正意义 (50 words)
"""
import sys
import json
import hashlib
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

LESSON_ID = "538114D5-65FA-4154-B9A9-87FB6940F0CB"
LESSON_NUMBER = 19
LESSON_TITLE = "旅行的真正意义"

L19_DEFINITIONS = {
    "专门": (
        "chuyên môn, đặc biệt, chuyên",
        "为了深入探寻古丝绸之路的历史遗迹，他专门利用年假自驾走了一趟大西北。",
        "Wèile shēnrù tànxún gǔ Sīchóu zhī Lù de lìshǐ yíjì, tā zhuānmén lìyòng niánjià zìjià zǒu le yí tàng Dà Xīběi.",
        "Để tìm hiểu sâu sắc về các di tích lịch sử trên Con đường Tơ lụa cổ đại, anh ấy đã đặc biệt dùng kỳ nghỉ phép năm tự lái xe đi một chuyến miền Đại Tây Bắc.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "乒乓球": (
        "bóng bàn, môn bóng bàn",
        "在青年旅舍的活动室里，来自各国的背包客们正在兴致勃勃地切磋乒乓球球技。",
        "Zài qīngnián lǚshè de huódòngshì lǐ, láizì gè guó de bēibāokèmen zhèngzài xìngzhì-bóbó de qiēcuō pīngpāngqiú qiújì.",
        "Trong phòng sinh hoạt của nhà nghỉ thanh niên, những du khách ba lô đến từ các nước đang hào hứng giao lưu so tài kỹ thuật bóng bàn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "人数": (
        "số lượng người, số người",
        "为了保护脆弱的丹霞地貌，景区管理中心严格限制了每天进入核心景区的游客人数。",
        "Wèile bǎohù cuìruò de dānxiá dìmào, jǐngqū guǎnlǐ zhōngxīn yángé xiànzhì le měitiān jìnrù héxīn jǐngqū de yóukè rénshù.",
        "Nhằm bảo vệ địa mạo Đan Hà mong manh, trung tâm quản lý khu du lịch đã hạn chế nghiêm ngặt số lượng du khách vào khu vực lõi mỗi ngày.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "会员": (
        "hội viên, thành viên",
        "成为这家国际青年旅行社的终身会员，可以在全球数百个国家享受预订折扣与专属向导服务。",
        "Chéngwéi zhè jiā guójì qīngnián lǚxíngshè de zhōngshēn huìyuán, kěyǐ zài quánqiú shù bǎi gè guójiā xiǎngshòu yùdìng zhékòu yǔ zhuānshǔ xiàngdǎo fúwù.",
        "Trở thành hội viên trọn đời của hãng lữ hành thanh niên quốc tế này có thể được hưởng giảm giá đặt chỗ và dịch vụ hướng dẫn viên riêng tại hàng trăm quốc gia trên toàn cầu.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "例子": (
        "ví dụ, tấm gương điển hình",
        "徐霞客用三十年时间走遍中国千山万水，正是后世无数旅行探险家学习的杰出例子。",
        "Xú Xiákè yòng sānshí nián shíjiān zǒu biàn Zhōngguó qiānshān-wànshuǐ, zhèng shì hòushì wúshù lǚxíng tànxiǎnjiā xuéxí de jiéchū lìzi.",
        "Từ Hà Khách dùng 30 năm ròng đi khắp ngàn non vạn nước Trung Hoa, chính là một ví dụ xuất sắc cho vô vàn nhà thám hiểm du hành đời sau noi theo.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "停车": (
        "đỗ xe, dừng xe",
        "盘山公路弯道多、坡度陡，自驾游司机切勿在危险的临崖路段随意违规停车拍照。",
        "Pánshān gōnglù wāndào duō, pōdù dǒu, zìjiàyóu sījī qiè wù zài wēixiǎn de línyá lùduàn suíyì wéiguī tíngchē pāizhào.",
        "Đường đèo quanh núi nhiều khúc cua và dốc đứng, lái xe tự lái tuyệt đối chớ nên dừng đỗ xe trái phép chụp ảnh tại các đoạn đường hiểm trở sát mép vực.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "公共": (
        "công cộng, chung",
        "提倡搭乘地铁、高铁等绿色公共交通出行，既能缓解交通拥堵，又能减少碳排放。",
        "Tíchàng dāchéng dìtiě, gāotiě děng lǜsè gōnggòng jiāotōng chūxíng, jì néng huǎnjiě jiāotōng yōngdǔ, yòu néng jiǎnshǎo tàn páifàng.",
        "Khuyến khích đi lại bằng phương tiện giao thông công cộng xanh như tàu điện ngầm, tàu cao tốc, vừa giải tỏa ùn tắc giao thông, vừa giảm phát thải carbon.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "凉": (
        "mát mẻ, mát mẻ dễ chịu; nguội (liáng)",
        "秋天的高原清晨天气微凉，登山前最好随身备上一件保暖防风外套。",
        "Qiūtiān de gāoyuán qīngchén tiānqì wēiliáng, dēngshān qián zuì hǎo suíshēn bèi shang yí jiàn bǎonuǎn fángfēng wàitào.",
        "Buổi sớm mùa thu trên cao nguyên trời se se mát lạnh, trước khi leo núi tốt nhất nên chuẩn bị sẵn một chiếc áo khoác chắn gió giữ ấm bên mình.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "力气": (
        "sức lực, sức mạnh",
        "在历经五个小时的艰苦徒步翻越雪山之后，大家几乎耗尽了全身所有的力气。",
        "Zài lìjīng wǔ gè xiǎoshí de jiānkǔ túbù fānyuè xuěshān zhīhòu, dàjiā jīhū hàojìn le quánshēn suǒyǒu de lìqi.",
        "Sau năm giờ đồng hồ đi bộ gian khổ vượt qua núi tuyết, mọi người gần như đã tiêu hao hết toàn bộ sức lực trong người.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "十字路口": (
        "ngã tư đường, giao lộ",
        "到达古城繁华商业区的十字路口后，往左转再走二百米就是著名的老字号茶馆。",
        "Dàodá gǔchéng fánhuá shāngyèqū de shízì lùkǒu hòu, wǎng zuǒ zhuǎn zài zǒu èrbǎi mǐ jiù shì zhùmíng de lǎozìhào cháguǎn.",
        "Sau khi đến ngã tư khu thương mại sầm uất của cổ trấn, rẽ trái đi thêm 200 mét nữa là tới quán trà lâu đời danh tiếng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "原谅": (
        "tha thứ, bỏ qua, lượng thứ",
        "旅途中难免会遇到行程延误或沟通误会，只要大家互相理解包容，就很容易原谅彼此的小疏忽。",
        "Lǚtú zhōng nánmiǎn huì yùdào xíngchéng yánwù huò gōutōng wùhuì, zhǐyào dàjiā hùxiāng lǐjiě bāoróng, jiù hěn róngyì yuánliàng bǐcǐ de xiǎo shūhu.",
        "Trong chuyến đi khó tránh khỏi gặp trễ nải hành trình hoặc hiểu lầm giao tiếp, chỉ cần mọi người thấu hiểu bao dung lẫn nhau thì rất dễ lượng thứ cho những sơ suất nhỏ của nhau.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "只好": (
        "đành phải, buộc phải",
        "由于海上突刮大风导致渡轮停航，游客们只好在风景秀丽的海岛上多停留了一天。",
        "Yóuyú hǎishang tū guā dàfēng dǎozhì dùlún tíngháng, yóukèmen zhǐhǎo zài fēngjǐng xiùlì de hǎidǎo shang duō tíngliú le yì tiān.",
        "Do trên biển bất ngờ nổi gió lớn khiến phà ngừng chạy, du khách đành phải nán lại hòn đảo phong cảnh tươi đẹp thêm một ngày.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "吹": (
        "thổi (gió, sáo); thổi tung",
        "站在巍峨的长城烽火台上，迎面吹来的山风让人感到心旷神怡、豁然开朗。",
        "Zhàn zài wēi'é de Chángchéng fēnghuǒtái shang, yíngmiàn chuī lái de shānfēng ràng rén gǎndào xīnkuàng-shényí, huòrán-kāilǎng.",
        "Đứng trên đài phong hỏa nguy nga của Trường Thành, ngọn gió núi thổi táp vào mặt khiến lòng người cảm thấy khoan khoái sảng khoái và rộng mở vô cùng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "国籍": (
        "quốc tịch",
        "虽然旅行团里的同伴来自不同的国籍与文化背景，但这并不妨碍大家成为志同道合的好朋友。",
        "Suīrán lǚxíngtuán lǐ de tóngbàn láizì bùtóng de guójí yǔ wénhuà bèijǐng, dàn zhè bìng bù fáng'ài dàjiā chéngwéi zhìtóng-dàohé de hǎo péngyou.",
        "Tuy các bạn đồng hành trong đoàn du lịch mang các quốc tịch và bối cảnh văn hóa khác nhau, nhưng điều đó không hề ngăn cản mọi người trở thành bạn tốt chí đồng đạo hợp.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "复杂": (
        "phức tạp, rắc rối",
        "面对错综复杂的山区徒步地形，出发前务必借助卫星地图认真规划好行进路线。",
        "Miànduì cuòzōng-fùzá de shānqū túbù dìxíng, chūfā qián wùbì jièzhù wèixīng dìtú rènzhēn guīhuà hǎo xíngjìn lùxiàn.",
        "Đối mặt với địa hình đi bộ leo núi phức tạp chằng chịt, trước khi lên đường nhất định phải nhờ bản đồ vệ tinh để lên kế hoạch lộ trình di chuyển thật kỹ.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "头痛": (
        "đau đầu, nhức đầu",
        "刚登上四千米高海拔雪山时，他稍微有些高原反应和轻微头痛，休息片刻后便逐渐好转。",
        "Gāng dēng shang sìqiān mǐ gāo hǎibá xuěshān shí, tā shāowēi yǒuxiē gāoyuán fǎnyìng hé qīngwēi tóutòng, xiūxi piànkè hòu biàn zhújiàn hǎozhuǎn.",
        "Vừa đặt chân lên đỉnh núi tuyết cao bốn ngàn mét so với mực nước biển, anh ấy hơi bị sốc độ cao và nhức đầu nhẹ, sau khi nghỉ ngơi chốc lát thì dần dần đỡ hẳn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "实际上": (
        "trên thực tế, thực ra",
        "旅行的意义表面上看是在观赏异域风光，实际上是一次深度的自我发现与内心对话之旅。",
        "Lǚxíng de yìyì biǎomiàn shang kàn shì zài guānshǎng yìyù fēngguāng, shíjìshang shì yí cì shēndù de zìwǒ fāxiàn yǔ nèixīn duìhuà zhī lǚ.",
        "Ý nghĩa của việc đi du lịch nhìn bề ngoài là thưởng ngoạn phong cảnh xứ lạ, nhưng trên thực tế là một chuyến đi khám phá bản thân và đối thoại sâu sắc với nội tâm.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "小伙子": (
        "chàng trai trẻ, thanh niên",
        "这位热心肠的当地小伙子不仅主动给迷路的游客指路，还热情地当起了免费向导。",
        "Zhè wèi rèxīncháng de dāngdì xiǎohuǒzi bùjǐn zhǔdòng gěi mílù de yóukè zhǐlù, hái rèqíng de dāng qǐ le miǎnfèi xiàngdǎo.",
        "Chàng trai trẻ nhiệt tình người bản địa này không chỉ chủ động chỉ đường cho du khách lạc lối, mà còn niềm nở làm hướng dẫn viên miễn phí.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "市场": (
        "chợ, thị trường",
        "要想真正融入当地人的市井生活，最好的去处莫过于清晨熙熙攘攘的传统农贸市场。",
        "Yào xiǎng zhēnzhèng róngrù dāngdìrén de shìjǐng shēnghuó, zuì hǎo de qùchù mòguòyú qīngchén xīxī-rǎngrǎng de chuántǒng nóngmào shìchǎng.",
        "Muốn thực sự hòa nhập vào nhịp sống bình dị của người dân địa phương, nơi đến lý tưởng nhất không gì bằng khu chợ nông sản truyền thống tấp nập lúc sáng sớm.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "底": (
        "đáy, phần dưới; cuối (tháng/năm) (dǐ)",
        "每年十月底秋风拂过的时候，九寨沟清澈见底的湖水与漫山遍野的彩林交相辉映。",
        "Měinián shí yuè dǐ qiūfēng fúguò de shíhou, Jiǔzhàigōu qīngchè jiàn dǐ de húshuǐ yǔ mànshān-biànyě de cǎilín jiāoxiāng-huìyìng.",
        "Mỗi năm vào cuối tháng mười khi gió thu lướt qua, làn nước trong vắt nhìn tận đáy hồ Cửu Trại Câu cùng rừng cây rực rỡ khắp non ngàn hòa quyện phản chiếu lẫn nhau tuyệt đẹp.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "快速": (
        "nhanh chóng, mau lẹ, tốc độ cao",
        "随着全国高铁网络的快速延展，早上在西安吃泡馍、下午在成都看大熊猫已经成为现实。",
        "Suízhe quánguó gāotiě wǎngluò de kuàisù yánzhǎn, zǎoshang zài Xī'ān chī pàomó, xiàwǔ zài Chéngdū kàn dàxióngmāo yǐjīng chéngwéi xiànshí.",
        "Cùng với sự mở rộng nhanh chóng của mạng lưới tàu cao tốc toàn quốc, buổi sáng ở Tây An ăn bánh mì canh thịt, buổi chiều ở Thành Đô ngắm gấu trúc đã trở thành hiện thực.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "感谢": (
        "cảm ơn, biết ơn",
        "离开宁静的小村庄时，旅行者们对热情招待自己的房东一家表达了由衷的感谢。",
        "Líkāi níngjìng de xiǎo cūnzhuāng shí, lǚxíngzhěmen duì rèqíng zhāodài zìjǐ de fángdōng yì jiā biǎodá le yóuzhōng de gǎnxiè.",
        "Khi rời khỏi ngôi làng nhỏ thanh bình, những người lữ hành đã bày tỏ lòng biết ơn chân thành nhất tới gia đình chủ nhà đã niềm nở đón tiếp mình.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "护士": (
        "y tá",
        "景区医疗急救站的护士技术娴熟，迅速帮扭伤脚踝的徒步登山爱好者处理好了伤口。",
        "Jǐngqū yīliáo jíjiùzhàn de hùshi jìshù xiánshú, xùnsù bāng niǔshāng jiǎohuái de túbù dēngshān àihàozhě chǔlǐ hǎo le shāngkǒu.",
        "Cô y tá của trạm cấp cứu y tế khu danh thắng có tay nghề thuần thục, đã nhanh chóng xử lý gọn gàng vết thương cho người đam mê leo núi bị trẹo mắt cá chân.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "排球": (
        "bóng chuyền",
        "金色的沙滩上，一群充满活力的各国年轻游客正在明媚阳光下热烈地打着沙滩排球。",
        "Jīnsè de shātān shang, yì qún chōngmǎn huólì de gè guó niánqīng yóukè zhèngzài míngmèi yángguāng xià rèliè de dǎ zhe shātān páiqiú.",
        "Trên bãi cát vàng óng ả, một nhóm du khách trẻ tuổi các nước tràn đầy sức sống đang hào hứng chơi bóng chuyền bãi biển dưới ánh nắng chan hòa.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "收听": (
        "lắng nghe, đón nghe (phát thanh, audio hướng dẫn)",
        "在游览历史博物馆时，戴上电子语音导览耳机认真收听每一件国宝文物的详尽解说。",
        "Zài yóulǎn lìshǐ bówùguǎn shí, dài shang diànzǐ yǔyīn dǎolǎn ěrjī rènzhēn shōutīng měi yí jiàn guóbǎo wénwù de xiángjìn jiěshuō.",
        "Khi tham quan bảo tàng lịch sử, hãy đeo tai nghe thuyết minh âm thanh điện tử để chăm chú lắng nghe lời giảng giải chi tiết về từng hiện vật bảo vật quốc gia.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "整": (
        "toàn bộ, trọn vẹn, cả (ngày/năm)",
        "他们花了一整天的时间漫步在苏杭古典园林中，细细领略江南水乡的独特雅致韵味。",
        "Tāmen huā le yì zhěng tiān de shíjiān mànbù zài Sū-Háng gǔdiǎn yuánlín zhōng, xìxì lǐnglüè Jiāngnán shuǐxiāng de dútè yǎzhì yùnwèi.",
        "Họ đã dành trọn cả một ngày trời dạo bước trong các khu vườn cổ điển Tô Châu - Hàng Châu, tỉ mỉ cảm nhận phong vị tao nhã độc đáo của vùng sông nước Giang Nam.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "日记": (
        "nhật ký",
        "每天傍晚回到客栈，他都会在旅行日记本上认真记录下旅途中的所见所闻与心灵感悟。",
        "Měitiān bàngwǎn huí dào kèzhàn, tā dōu huì zài lǚxíng rìjìběn shang rènzhēn jìlù xià lǚtú zhōng de suǒjiàn-suǒwén yǔ xīnlíng gǎnwù.",
        "Mỗi buổi chiều muộn khi trở về quán trọ, anh ấy đều cẩn thận ghi chép lại những điều mắt thấy tai nghe và cảm ngộ tâm hồn trong chuyến đi vào cuốn nhật ký du lịch.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "月份": (
        "tháng (trong năm)",
        "每年四五月份正是春暖花开的最佳旅游季节，江南大地处处草长莺飞、繁花似锦。",
        "Měinián sì-wǔ yuèfèn zhèng shì chūnnuǎn-huākāi de zuì jiā lǚyóu jìjié, Jiāngnán dàdì chùchù cǎozhǎng-yīngfēi, fánhuā-sìjǐn.",
        "Tháng 4 và tháng 5 hàng năm chính là mùa du lịch tuyệt vời nhất khi xuân ấm hoa nở, khắp vùng đất Giang Nam chim hót ríu rít cỏ cây tươi tốt muôn hoa như gấm.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "标准": (
        "tiêu chuẩn, chuẩn mực",
        "衡量一次旅行是否真正成功的标准，不在于拍了多少张照片，而在于是否收获了心灵的宁静与成长。",
        "Héngliáng yí cì lǚxíng shìfǒu zhēnzhèng chénggōng de biāozhǔn, bú zàiyú pāi le duōshǎo zhāng zhàopiàn, ér zàiyú shìfǒu shōuhuò le xīnlíng de níngjìng yǔ chéngzhǎng.",
        "Tiêu chuẩn để đo lường một chuyến đi du lịch có thực sự thành công hay không không nằm ở việc chụp được bao nhiêu tấm ảnh, mà nằm ở chỗ bạn có thu hoạch được sự thanh thản và trưởng thành trong tâm hồn hay không.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "步": (
        "bước, bước chân, nhịp bước",
        "读万卷书不如行万里路，迈开脚步去丈量世界，才能真正开阔眼界与胸襟。",
        "Dú wàn juàn shū bùrú xíng wàn lǐ lù, màikāi jiǎobù qù zhàngliáng shìjiè, cái néng zhēnzhèng kāikuò yǎnjiè yǔ xiōngjīn.",
        "Đọc vạn cuốn sách không bằng đi vạn dặm đường, hãy rảo bước chân để đo lường thế giới thì mới thực sự mở rộng được tầm mắt và tấm lòng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "法": (
        "phương pháp, cách thức; phép tắc (fǎ)",
        "入乡随俗是每一个文明旅行者应当遵循的基本法则，尊重各民族独特的民俗传统。",
        "Rùxiāng-suísú shì měi yí gè wénmíng lǚxíngzhě yīngdāng zūnxún de jīběn fǎzé, zūnzhòng gè mínzú dútè de mínsú chuántǒng.",
        "Nhập gia tùy tục là phép tắc cơ bản mà mỗi du khách văn minh nên tuân thủ, tôn trọng truyền thống phong tục tập quán độc đáo của từng dân tộc.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "激动": (
        "kích động, xúc động, phấn khích",
        "当历经千辛万苦终于登上泰山玉皇顶亲眼目睹日出的那一刻，所有登山者的内心都无比激动。",
        "Dāng lìjīng qiānxīn-wànkǔ zhōngyú dēng shang Tàishān Yùhuángdǐng qīnyǎn mùdǔ rìchū de nà yí kè, suǒyǒu dēngshānzhě de nèixīn dōu wúbǐ jīdòng.",
        "Khi trải qua muôn vàn gian nan vất vả cuối cùng cũng bước lên đỉnh Ngọc Hoàng núi Thái Sơn và tận mắt chứng kiến cảnh mặt trời mọc, nội tâm của mọi người leo núi đều vô cùng phấn khích.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "牌": (
        "biển hiệu, bảng chỉ dẫn; thương hiệu",
        "在国家森林公园复杂的岔路口，清晰完备的木质指路牌为徒步游客指明了前进方向。",
        "Zài guójiā sēnlín gōngyuán fùzá de chàlùkǒu, qīngxī wánbèi de mùzhì zhǐlùpái wèi túbù yóukè zhǐmíng le qiánjìn fāngxiàng.",
        "Tại các ngã rẽ phức tạp trong công viên rừng quốc gia, những chiếc biển chỉ đường bằng gỗ rõ ràng hoàn thiện đã chỉ rõ phương hướng tiến lên cho du khách đi bộ.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "用来": (
        "được dùng để, dùng cho việc",
        "这段年久失修的老茶马古道现在已经被整修一新，专门用来作为生态徒步健行的景观步道。",
        "Zhè duàn niánjiǔ-shīxiū de lǎo Chámǎ Gǔdào xiànzài yǐjīng bèi zhěngxiū yì xīn, zhuānmén yònglái zuòwéi shēngtài túbù jiànxíng de jǐngguān bùdào.",
        "Đoạn đường Trà Mã Cổ Đạo cổ xưa lâu năm hư hại nay đã được tu sửa mới hoàn toàn, chuyên dùng để làm đường đi bộ cảnh quan cho các chuyến dã ngoại sinh thái.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "目的地": (
        "điểm đến, đích đến",
        "旅行的真正魅力并不单纯在于最终抵达了哪个目的地，更在于一路上沿途经历的风景与人事。",
        "Lǚxíng de zhēnzhèng mèilì bìng bù dānchún zàiyú zuìzhōng dǐdá le nǎ gè mùdìdì, gèng zàiyú yí lù shang yántú jīnglì de fēngguāng yǔ rénshì.",
        "Sức hút thực sự của chuyến đi không đơn thuần nằm ở chỗ cuối cùng đã đặt chân tới điểm đến nào, mà càng nằm ở phong cảnh cùng con người sự việc trải nghiệm dọc suốt chặng đường.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "礼貌": (
        "lịch sự, lễ phép, phép lịch sự",
        "在异国他乡向当地居民问路或求助时，微笑和有礼貌的问候是最好的国际通用通行证。",
        "Zài yìguó tāxiāng xiàng dāngdì jūmín wènlù huò qiúzhù shí, wēixiào hé yǒu lǐmào de wènhòu shì zuì hǎo de guójì tōngyòng tōngxíngzhèng.",
        "Nơi đất khách quê người khi hỏi đường hoặc nhờ vả cư dân bản địa, nụ cười và lời chào hỏi có lễ phép lịch thiệp chính là tấm thẻ thông hành thông dụng quốc tế tốt nhất.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "竞争": (
        "cạnh tranh",
        "如今各大在线旅游服务平台之间的良性竞争，促使整个文旅行业的综合服务质量全面升级。",
        "Rújīn gè dà zàixiàn lǚyóu fúwù píngtái zhījiān de liángxìng jìngzhēng, cùshǐ zhěnggè wénlǚ hángyè de zōnghé fúwù zhìliàng quánmiàn shēngjí.",
        "Sự cạnh tranh lành mạnh giữa các nền tảng dịch vụ du lịch trực tuyến lớn ngày nay đã thúc đẩy chất lượng dịch vụ tổng hợp của toàn ngành văn hóa du lịch nâng cấp toàn diện.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "紧张": (
        "căng thẳng, hồi hộp; gấp rút",
        "平时在都市快节奏的工作容易让人神经紧绷，到山野间旅行能有效缓解长期积累的紧张情绪。",
        "Píngshí zài dūshì kuài jiézòu de gōngzuò róngyì ràng rén shénjīng jǐnbēng, dào shānyě jiān lǚxíng néng yǒuxiào huǎnjiě chángqī jīlěi de jǐnzhāng qíngxù.",
        "Ngày thường làm việc với nhịp sống hối hả nơi đô thị dễ khiến con người căng thẳng thần kinh, đi du lịch giữa núi rừng hoang sơ có thể xoa dịu hiệu quả tâm trạng căng thẳng tích tụ lâu ngày.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "网址": (
        "địa chỉ web, URL",
        "出发前您可以登录国家公园官方网址，查询最新的景区天气通告和步道开放状态。",
        "Chūfā qián nín kěyǐ dēnglù guójiā gōngyuán guānfāng wǎngzhǐ, cháxún zuì xīn de jǐngqū tiānqì tōnggào hé bùdào kāifàng zhuàngtài.",
        "Trước khi lên đường quý khách có thể đăng nhập vào địa chỉ trang web chính thức của công viên quốc gia để tra cứu thông báo thời tiết và tình trạng mở cửa của các tuyến đường đi bộ mới nhất.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "联系": (
        "liên hệ, liên lạc, kết nối",
        "深入偏远山区徒步探索时，必须确保随身携带卫星电话，以便遇到紧急险情能及时与外界取得联系。",
        "Shēnrù piānyuǎn shānqū túbù tànsuǒ shí, bìxū quèbǎo suíshēn xiédài wèixīng diànhuà, yǐbiàn yùdào jǐnjí xiǎnqíng néng jíshí yǔ wàijiè qǔdé liánxì.",
        "Khi đi sâu vào các vùng núi non hẻo lánh để thám hiểm đi bộ, bắt buộc phải bảo đảm mang theo điện thoại vệ tinh bên mình để khi gặp hiểm nguy khẩn cấp có thể kịp thời liên lạc với thế giới bên ngoài.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "航班": (
        "chuyến bay",
        "由于受台风天气影响，今天下午所有飞往热带滨海旅游城市的航班都已临时调整延误。",
        "Yóuyú shòu táifēng tiānqì yǐngxiǎng, jīntiān xiàwǔ suǒyǒu fēi wǎng rèdài bīnhǎi lǚyóu chéngshì de hángbān dōu yǐ línshí tiáozhěng yánwù.",
        "Do ảnh hưởng của thời tiết bão, chiều nay tất cả các chuyến bay hướng tới thành phố du lịch ven biển nhiệt đới đều đã tạm thời điều chỉnh hoãn lại.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "袋子": (
        "túi, bao (vải, giấy)",
        "做一名合格负责的环保旅行者，背包里一定要随身带上几个垃圾袋子，下山时把产生的杂物全部带走。",
        "Zuò yì míng hégé fùzé de huánbǎo lǚxíngzhě, bēibāo lǐ yídìng yào suíshēn dài shang jǐ gè lājī dàizi, xià shān shí bǎ chǎnshēng de záwù quánbù dài zǒu.",
        "Để làm một người lữ hành bảo vệ môi trường có trách nhiệm và đạt chuẩn, trong ba lô nhất định phải mang theo vài chiếc túi đựng rác, khi xuống núi mang toàn bộ rác rưởi thải ra đi cùng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "证明": (
        "chứng minh, bằng chứng; chứng thực",
        "他用亲身徒步穿越戈壁荒原的非凡经历证明，只要心怀坚定的信念，就能跨越常人无法想象的艰难险阻。",
        "Tā yòng qīnshēn túbù chuānyuè gēbì huāngyuán de fēifán jīnglì zhèngmíng, zhǐyào xīnhuái jiāndìng de xìnniàn, jiù néng kuàyuè chángrén wúfǎ xiǎngxiàng de jiānnán xiǎnzǔ.",
        "Anh ấy dùng chính trải nghiệm phi thường tự mình đi bộ xuyên qua hoang mạc gô-bi để chứng minh rằng, chỉ cần trong lòng ôm ấp niềm tin kiên định thì có thể vượt qua mọi hiểm trở gian nan mà người bình thường không thể tưởng tượng nổi.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "质量": (
        "chất lượng, phẩm chất",
        "旅行的真正精髓不在于打卡景点的数量，而在于旅途中深度体验与感悟的文化质量。",
        "Lǚxíng de zhēnzhèng jīngsuǐ bú zàiyú dǎkǎ jǐngdiǎn de shùliàng, ér zàiyú lǚtú zhōng shēndù tǐyàn yǔ gǎnwù de wénhuà zhìliàng.",
        "Tinh hoa thực sự của du lịch không nằm ở số lượng địa điểm tham quan chụp ảnh check-in, mà nằm ở chất lượng văn hóa của những trải nghiệm và cảm ngộ sâu sắc trong chuyến đi.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "躺": (
        "nằm, ngả lưng",
        "夏夜在无边无际的大草原上躺在柔软的绿草地上，仰望着漫天璀璨的银河繁星，令人震撼不已。",
        "Xiàyè zài wúbiān-wújì de dà cǎoyuán shang tǎng zài róuruǎn de lǜ cǎodì shang, yǎngwàng zhe màntiān cuǐcàn de Yínhé fánxīng, lìng rén zhènhàn bùyǐ.",
        "Đêm hè trên thảo nguyên mênh mông bát ngát, nằm ngả lưng trên thảm cỏ xanh êm ái, ngước mắt ngắm nhìn dải ngân hà muôn ngàn vì sao lấp lánh trên bầu trời, khiến lòng người vô cùng chấn động.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "通": (
        "thông, thông suốt, đi qua (tōng)",
        "随着这条跨越崇山峻岭的高速公路正式全线通车，原本闭塞的偏远古镇迎来了全新的发展生机。",
        "Suízhe zhè tiáo kuàyuè chóngshān-jùnlǐng de gāosù gōnglù zhèngshì quánxiàn tōngchē, yuánběn bìsè de piānyuǎn gǔzhèn yínglái le quánxīn de fāzhǎn shēngjī.",
        "Cùng với việc tuyến đường cao tốc băng qua muôn trùng núi non hiểm trở này chính thức thông xe toàn tuyến, cổ trấn xa xôi hẻo lánh vốn khép kín đã đón chào cơ hội phát triển hoàn toàn mới.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "重视": (
        "coi trọng, xem trọng, chú trọng",
        "现代旅游业越来越重视生态环境的保护与当地传统文化的传承，杜绝过度商业开发。",
        "Xiàndài lǚyóuyè yuèláiyuè zhòngshì shēngtài huánjìng de bǎohù yǔ dāngdì chuántǒng wénhuà de chuánchéng, dùjué guòdù shāngyè kāifā.",
        "Ngành du lịch hiện đại ngày càng coi trọng việc bảo vệ môi trường sinh thái và kế thừa văn hóa truyền thống bản địa, kiên quyết chấm dứt việc khai thác thương mại hóa quá mức.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "陪": (
        "đi cùng, đồng hành, bầu bạn (péi)",
        "在阳光明媚的金秋时节，陪着年迈的父母一起游览北京香山红叶，是一件无比幸福的孝心美事。",
        "Zài yángguāng míngmèi de jīnqiū shíjié, péi zhe niánmài de fùmǔ yìqǐ yóulǎn Běijīng Xiāngshān hóngyè, shì yí jiàn wúbǐ xìngfú de xiàoxīn měishì.",
        "Vào tiết trời thu vàng nắng đẹp chan hòa, đồng hành cùng cha mẹ già ngắm lá đỏ Hương Sơn Bắc Kinh là một việc làm hiếu thảo vô cùng hạnh phúc tốt đẹp.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "风景": (
        "phong cảnh, cảnh sắc",
        "大自然塑造的奇峰怪石和飞瀑流泉，构成了这幅气势磅礴、如诗如画的山水风景长卷。",
        "Dàzìrán sùzào de qífēng-guàishí hé fēipù-liúquán, gòuchéng le zhè fú qìshì-pángbó, rúshī-rúhuà de shānshuǐ fēngjǐng chángjuàn.",
        "Những đỉnh núi kỳ dị cùng thác nước tuôn trào do mẹ thiên nhiên nhào nặn đã tạo nên một bức tranh trường quyển phong cảnh non nước kỳ vĩ như thơ như họa.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "鼓励": (
        "khuyến khích, khích lệ, động viên",
        "父母应当积极鼓励年轻人勇敢背包走向广阔的世界，在独立探索中锻炼独立自强的优秀品格。",
        "Fùmǔ yīngdāng jījí gǔlì niánqīngrén yǒnggǎn bēibāo zǒuxiàng guǎngkuò de shìjiè, zài dúlì tànsuǒ zhōng duànliàn dúlì-zìqiáng de yōuxiù pǐngé.",
        "Cha mẹ nên tích cực khuyến khích người trẻ dũng cảm khoác ba lô bước ra thế giới rộng lớn, để rèn luyện phẩm chất ưu tú độc lập tự cường qua những chuyến khám phá tự thân.",
        "LINGUISTICALLY_REVIEWED_AI"
    )
}

def generate_l19():
    with open('data/hsk30/staging/dev_hsk4_vocab_raw.json', 'r', encoding='utf-8') as f:
        raw_vocab = json.load(f)

    l19_raw = [w for w in raw_vocab if w['lessonNumber'] == LESSON_NUMBER]
    assert len(l19_raw) == 50, f"Expected 50 raw words for L19, got {len(l19_raw)}"

    enriched_records = []
    for item in l19_raw:
        hanzi = item['hanzi']
        assert hanzi in L19_DEFINITIONS, f"Missing definition for '{hanzi}' in L19"
        meaning_vi, ex_zh, ex_py, ex_vi, qa_status = L19_DEFINITIONS[hanzi]

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

    out_file = Path("scripts/hsk30/hsk4_vocab_data_p4_l19.py")
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write("# -*- coding: utf-8 -*-\n")
        f.write('"""\nHSK 4 Vocabulary Data — Part 4: Lesson 19 (50 words)\n')
        f.write(f'LessonId: {LESSON_ID}\nLesson Title: {LESSON_TITLE}\n"""\n\n')
        f.write(f'LESSON_ID = "{LESSON_ID}"\n')
        f.write(f'LESSON_NUMBER = {LESSON_NUMBER}\n')
        f.write(f'LESSON_TITLE = "{LESSON_TITLE}"\n\n')
        f.write("HSK4_DATA_P4_L19_RECORDS = ")
        f.write(json.dumps(enriched_records, ensure_ascii=False, indent=4))
        f.write("\n\n")
        f.write("# Dictionary format compatible with P1 / P2: (lesson_num, hanzi) -> (meaningVi, exampleZh, examplePy, exampleVi)\n")
        f.write("HSK4_DATA_P4_L19 = {\n")
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
        stage="STAGE_P4_LESSON19_COMPLETED",
        completed_lessons=list(range(1, 20)),
        completed_vocab_count=950,
        status="IN_PROGRESS"
    )
    print("Updated checkpoint: 950 words completed.")

if __name__ == '__main__':
    generate_l19()
