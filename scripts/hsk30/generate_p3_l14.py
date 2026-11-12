# -*- coding: utf-8 -*-
"""
Generator and Validator for HSK 4 — Lesson 14 Vocabulary
LessonId: 9BCE8F39-E483-4846-874B-A5A4F9A136F5
Lesson 14: 保护地球母亲 (50 words)
"""
import sys
import json
import hashlib
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

LESSON_ID = "9BCE8F39-E483-4846-874B-A5A4F9A136F5"
LESSON_NUMBER = 14
LESSON_TITLE = "保护地球母亲"

L14_DEFINITIONS = {
    "不管": (
        "bất kể, dù cho, dù thế nào",
        "不管未来的道路多么艰难曲折，我们都要坚持把这项环保事业做下去。",
        "Bùguǎn wèilái de dàolù duōme jiānnán qūzhé, wǒmen dōu yào jiānchí bǎ zhè xiàng huánbǎo shìyè zuò xiàqu.",
        "Dù con đường tương lai có khó khăn gập ghềnh đến đâu, chúng ta cũng phải kiên trì theo đuổi sự nghiệp bảo vệ môi trường này.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "之": (
        "của (trợ từ kết cấu tương đương 的)",
        "保护自然环境是每个公民应尽的责任与义务之一。",
        "Bǎohù zìrán huánjìng shì měi gè gōngmín yīng jìn de zérèn yǔ yìwù zhī yī.",
        "Bảo vệ môi trường tự nhiên là một trong những trách nhiệm và nghĩa vụ mà mỗi công dân nên thực hiện.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "产生": (
        "nảy sinh, sinh ra, phát sinh",
        "大量塑料垃圾的处理不当，会对海洋生态系统产生极其严重的危害。",
        "Dàliàng sùliào lājī de chǔlǐ búdàng, huì duì hǎiyáng shēngtài xìtǒng chǎnshēng jíqí yánzhòng de wēihài.",
        "Việc xử lý rác thải nhựa số lượng lớn không đúng cách sẽ gây ra tác hại cực kỳ nghiêm trọng đối với hệ sinh thái biển.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "任何": (
        "bất kỳ, bất cứ",
        "在没有获得环保部门许可之前，任何企业都不得向河流排放污水。",
        "Zài méiyǒu huòdé huánbǎo bùmén xǔkě zhīqián, rènhé qǐyè dōu bùdé xiàng héliú páifàng wūshuǐ.",
        "Trước khi nhận được sự cho phép của cơ quan bảo vệ môi trường, bất kỳ doanh nghiệp nào cũng không được xả nước thải ra sông ngòi.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "作者": (
        "tác giả, người viết",
        "这本书的作者通过生动的故事，向读者普及了全球气候变暖的知识。",
        "Zhè běn shū de zuòzhě tōngguò shēngdòng de gùshi, xiàng dúzhě pǔjí le quánqiú qìhòu biànnuǎn de zhīshi.",
        "Tác giả của cuốn sách này thông qua những câu chuyện sinh động đã phổ biến kiến thức về hiện tượng nóng lên toàn cầu tới độc giả.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "假日": (
        "ngày nghỉ, kỳ nghỉ",
        "逢年过节或者法定假日，许多市民都会选择去郊区公园亲近大自然。",
        "Féngnián-guòjié huòzhě fǎdìng jiàrì, xǔduō shìmín dōu huì xuǎnzé qù jiāoqū gōngyuán qīnjìn dàzìrán.",
        "Vào dịp lễ tết hoặc ngày nghỉ theo luật định, nhiều người dân thành phố sẽ chọn đến công viên ngoại ô để hòa mình vào thiên nhiên.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "全": (
        "toàn bộ, tất cả, đầy đủ",
        "我们全班同学都积极响应号召，参加了这次周末植树造林活动。",
        "Wǒmen quán bān tóngxué dōu jījí xiǎngyìng hàozhào, cānjiā le zhè cì zhōumò zhíshù zàolín huódòng.",
        "Toàn thể các bạn học sinh trong lớp chúng tôi đều tích cực hưởng ứng lời kêu gọi, tham gia hoạt động trồng cây gây rừng cuối tuần này.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "农村": (
        "nông thôn, làng quê",
        "随着绿色生态农业的发展，如今农村的环境面貌发生了翻天覆地的变化。",
        "Suízhe lǜsè shēngtài nóngyè de fāzhǎn, rújīn nóngcūn de huánjìng miànmào fāshēng le fāntiān-fùdì de biànhuà.",
        "Cùng với sự phát triển của nông nghiệp sinh thái xanh, diện mạo môi trường ở nông thôn ngày nay đã có sự thay đổi long trời lở đất.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "到来": (
        "sự đến, đến nơi, sự xuất hiện",
        "春天的到来给原本干枯的大地带来了生机盎然的绿意。",
        "Chūntiān de dàolái gěi yuánběn gānkū de dàdì dàilái le shēngjī-àngrán de lǜyì.",
        "Mùa xuân đến đã mang lại sắc xanh ngập tràn sức sống cho mảnh đất vốn cằn cỗi.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "勇敢": (
        "dũng cảm, quả cảm",
        "面对突如其来的森林火灾，消防员们勇敢地冲进了火海展开扑救。",
        "Miànduì tūrúqílái de sēnlín huǒzāi, xiāofángyuánmen yǒnggǎn de chōng jìn le huǒhǎi zhǎnkāi pūjiù.",
        "Đối mặt với đám cháy rừng bất ngờ bùng phát, các chiến sĩ cứu hỏa đã dũng cảm lao vào biển lửa để tiến hành dập lửa.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "压力": (
        "áp lực (công việc, tinh thần hoặc vật lý)",
        "长期高强度的工作压力容易让人感到疲惫，应当学会适度放松身心。",
        "Chángqī gāo qiángdù de gōngzuò yālì róngyì ràng rén gǎndào píbèi, yīngdāng xuéhuì shìdù fàngsōng shēnxīn.",
        "Áp lực công việc cường độ cao trong thời gian dài rất dễ khiến người ta kiệt sức, cần học cách thả lỏng thể chất và tinh thần một cách hợp lý.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "受不了": (
        "chịu không nổi, không thể chịu đựng được",
        "夏天的天气又热又闷，屋里如果没有空调，实在让人受不了。",
        "Xiàtiān de tiānqì yòu rè yòu mēn, wūli rúguǒ méiyǒu kōngtiáo, shízài ràng rén shòubuliǎo.",
        "Thời tiết mùa hè vừa nóng vừa oi bức, trong phòng nếu không có điều hòa thì thật sự khiến người ta không thể chịu nổi.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "否则": (
        "nếu không thì, bằng không",
        "出门时请务必随手关灯关水，否则会造成大量宝贵资源的无端浪费。",
        "Chūmén shí qǐng wùbì suíshǒu guān dēng guān shuǐ, fǒuzé huì zàochéng dàliàng bǎoguì zīyuán de wúduān làngfèi.",
        "Khi ra khỏi cửa xin hãy nhớ tiện tay tắt đèn khóa nước, nếu không thì sẽ gây lãng phí vô ích một lượng lớn tài nguyên quý giá.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "回复": (
        "trả lời, hồi âm (tin nhắn, thư từ)",
        "我已经在邮件中详细说明了合作方案，期待您能尽快给予正式回复。",
        "Wǒ yǐjīng zài yóujiàn zhōng xiángxì shuōmíng le hézuò fāng'àn, qīdài nín néng jǐnkuài jǐyǔ zhèngshì huífù.",
        "Tôi đã giải thích chi tiết phương án hợp tác trong email, rất mong nhận được phản hồi chính thức của bạn trong thời gian sớm nhất.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "塑料": (
        "chất dẻo, nhựa",
        "为了减少白色污染，超市倡导顾客自带布袋，尽量减少塑料袋的使用。",
        "Wèile jiǎnshǎo báisè wūrǎn, chāoshì chàngdǎo gùkè zìdài bùdài, jǐnliàng jiǎnshǎo sùliàodài de shǐyòng.",
        "Nhằm giảm thiểu ô nhiễm rác thải trắng, siêu thị khuyến khích khách hàng tự mang túi vải, cố gắng giảm thiểu việc dùng túi nilon nhựa.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "大赛": (
        "cuộc thi lớn, giải đấu lớn",
        "他在本届全国青少年环保创新大赛中表现出色，荣获了一等奖。",
        "Tā zài běn jiè quánguó qīngshàonián huánbǎo chuàngxīn dàsài zhōng biǎoxiàn chūsè, rónghuò le yīděngjiǎng.",
        "Cậu ấy đã thể hiện xuất sắc trong cuộc thi lớn sáng tạo bảo vệ môi trường thanh thiếu niên toàn quốc kỳ này và giành giải nhất.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "安检": (
        "kiểm tra an ninh (an kiểm)",
        "乘坐高铁或飞机出行前，所有旅客都必须按规定接受严格的安全检查。",
        "Chéngzuò gāotiě huò fēijī chūxíng qián, suǒyǒu lǚkè dōu bìxū àn guīdìng jiēshòu yángé de ānquán jiǎnchá.",
        "Trước khi đi lại bằng tàu cao tốc hoặc máy bay, tất cả hành khách đều phải qua cửa kiểm tra an ninh nghiêm ngặt theo quy định.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "导游": (
        "hướng dẫn viên du lịch",
        "那位热情专业的导游不仅熟悉景区路线，还为我们生动讲解了许多民间传说。",
        "Nà wèi rèqíng zhuānyè de dǎoyóu bùjǐn shúxī jǐngqū lùxiàn, hái wèi wǒmen shēngdòng jiǎngjiě le xǔduō mínjiān chuánshuō.",
        "Người hướng dẫn viên du lịch nhiệt tình chuyên nghiệp đó không chỉ thông thạo tuyến điểm tham quan mà còn giảng giải sinh động cho chúng tôi nhiều truyền thuyết dân gian.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "巧": (
        "khéo léo, tình cờ, đúng lúc, vừa vặn",
        "今天真是太巧了，我刚走到书店门口就碰到了多年未见的小学同桌。",
        "Jīntiān zhēn shì tài qiǎo le, wǒ gāng zǒu dào shūdiàn ménkǒu jiù pèng dào le duō nián wèi jiàn de xiǎoxué tóngzhuō.",
        "Hôm nay thật là quá tình cờ khéo léo, tôi vừa bước đến cửa hiệu sách thì đã gặp lại người bạn cùng bàn tiểu học bao năm chưa gặp.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "幽默": (
        "hài hước, hóm hỉnh",
        "王老师讲课风格幽默风趣，课堂上总是充满了同学们的欢声笑语。",
        "Wáng lǎoshī jiǎngkè fēnggé yōumò fēngqù, kètáng shang zǒngshì chōngmǎn le tóngxuémen de huānshēng xiàoyǔ.",
        "Phong cách giảng dạy của thầy Vương rất hài hước hóm hỉnh, trong lớp học luôn tràn ngập tiếng cười nói vui vẻ của học sinh.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "律师": (
        "luật sư",
        "在签订这份涉及金额巨大的商业合同前，经理特意咨询了法律顾问和专业律师。",
        "Zài qiāndìng zhè fèn shèjí jīn'é jùdà de shāngyè hétong qián, jīnglǐ tèyì zīxún le fǎlǜ gùwèn hé zhuānyè lǜshī.",
        "Trước khi ký kết bản hợp đồng thương mại có giá trị rất lớn này, giám đốc đã cẩn thận xin ý kiến cố vấn pháp luật và luật sư chuyên nghiệp.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "感人": (
        "cảm động, lay động lòng người",
        "这部纪录片真实记录了志愿者救助野生动物的感人故事，深深触动了观众的心灵。",
        "Zhè bù jìlùpiàn zhēnshí jìlù le zhìyuànzhě jiùzhù yěshēng dòngwù de gǎnrén gùshi, shēnshēn chùdòng le guānzhòng de xīnlíng.",
        "Bộ phim tài liệu này ghi lại chân thực câu chuyện cảm động của các tình nguyện viên cứu hộ động vật hoang dã, chạm đến tận đáy lòng người xem.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "打针": (
        "tiêm thuốc, chích thuốc",
        "生病时按医生的嘱咐吃药打针，病症才会尽快好转并彻底康复。",
        "Shēngbìng shí àn yīshēng de zhǔfù chīyào dǎzhēn, bìngzhèng cái huì jǐnkuài hǎozhuǎn bìng chèdǐ kāngfù.",
        "Khi bị ốm, uống thuốc và tiêm theo đúng lời dặn của bác sĩ thì triệu chứng bệnh mới mau chóng thuyên giảm và hồi phục hoàn toàn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "按时": (
        "đúng giờ, đúng hẹn, đúng hạn",
        "只要我们按时完成每天制订的学习任务，期末考试就一定能取得优异成绩。",
        "Zhǐyào wǒmen ànshí wánchéng měitiān zhìdìng de xuéxí rènwu, qīmò kǎoshì jiù yídìng néng qǔdé yōuyì chéngjì.",
        "Chỉ cần chúng ta hoàn thành đúng hạn các nhiệm vụ học tập đã đặt ra mỗi ngày thì kỳ thi cuối kỳ nhất định sẽ đạt được thành tích xuất sắc.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "操场": (
        "sân vận động, sân tập, sân chơi trường học",
        "每天傍晚放学后，许多热爱运动的同学都会来到学校操场上跑步踢球。",
        "Měitiān bàngwǎn fàngxué hòu, xǔduō rè'ài yùndòng de tóngxué dōu huì lái dào xuéxiào cāochǎng shang pǎobù tīqiú.",
        "Mỗi buổi chiều muộn sau khi tan học, rất nhiều bạn yêu thể thao đều đến sân thể dục của trường để chạy bộ và đá bóng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "散步": (
        "đi dạo, tản bộ",
        "晚饭后陪着父母在小区林荫道上散步，是一种非常惬意温馨的家庭时光。",
        "Wǎnfàn hòu péi zhe fùmǔ zài xiǎoqū línyīndào shang sànbù, shì yì zhǒng fēicháng qièyì wēnxīn de jiātíng shíguāng.",
        "Sau bữa tối cùng cha mẹ đi dạo trên con đường rợp bóng cây của khu tập thể là một khoảng thời gian gia đình vô cùng thư thái, ấm cúng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "既": (
        "đã... lại còn, vừa... vừa (既...又...)",
        "多吃新鲜绿色蔬菜既能补充人体必需的维生素，又有利于维持肠道健康。",
        "Duō chī xīnxiān lǜsè shūcài jì néng bǔchōng réntǐ bìxū de wéishēngsù, yòu yǒulìyú wéichí chángdào jiànkāng.",
        "Ăn nhiều rau xanh tươi vừa có thể bổ sung vitamin cần thiết cho cơ thể người, lại vừa có lợi cho việc duy trì sức khỏe đường ruột.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "暂时": (
        "tạm thời, trước mắt",
        "由于暴雨导致山体滑坡，通往景区的主干道路目前已暂时实行交通管制。",
        "Yóuyú bàoyǔ dǎozhì shāntǐ huápō, tōng wǎng jǐngqū de zhǔgàn dàolù mùqián yǐ zànshí shíxíng jiāotōng guǎnzhì.",
        "Do mưa bão gây sạt lở núi, tuyến đường giao thông chính dẫn đến khu danh lam thắng cảnh hiện đang tạm thời bị điều tiết hạn chế.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "来不及": (
        "không kịp (thời gian)",
        "今天早晨闹钟坏了，我起床晚了，连早饭都来不及吃就急匆匆赶去公司。",
        "Jīntiān zǎochen nàozhōng huài le, wǒ qǐchuáng wǎn le, lián zǎofàn dōu láibují chī jiù jícōngcōng gǎn qù gōngsī.",
        "Sáng nay đồng hồ báo thức bị hỏng, tôi dậy muộn, ngay cả bữa sáng cũng không kịp ăn đã vội vã chạy đến công ty.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "正式": (
        "chính thức, trang trọng",
        "经过为期半年的筹备与试运行，这家城市现代化图书馆将于明天正式对外开放。",
        "Jīngguò wéiqī bàn nián de chóubèi yǔ shìyùnxíng, zhè jiā chéngshì xiàndàihuà túshūguǎn jiāng yú míngtiān zhèngshì duìwài kāifàng.",
        "Sau nửa năm chuẩn bị và chạy thử nghiệm, thư viện hiện đại của thành phố này sẽ chính thức mở cửa đón khách vào ngày mai.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "江": (
        "sông lớn, con sông (Trường Giang, sông ngòi)",
        "长江是中国第一大河，浩浩荡荡的水流滋养了流域内数以亿计的中华儿女。",
        "Cháng Jiāng shì Zhōngguó dì-yī dà hé, hàohàodàngdàng de shuǐliú zīyǎng le liúyù nèi shù yǐ yì jì de Zhōnghuá érnǚ.",
        "Trường Giang là con sông lớn nhất của Trung Quốc, dòng nước cuồn cuộn đã nuôi dưỡng hàng trăm triệu người con đất nước trong toàn lưu vực.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "满": (
        "đầy, tràn đầy, trọn vẹn, đủ (tuổi, thời gian)",
        "听到女儿以优异成绩考上名牌大学的好消息，这位老父亲心里装满了欣慰与幸福。",
        "Tīngdào nǚ'ér yǐ yōuyì chéngjì kǎoshàng míngpái dàxué de hǎo xiāoxi, zhè wèi lǎo fùqīn xīnli zhuāngmǎn le xīnwèi yǔ xìngfú.",
        "Nghe tin con gái đỗ vào trường đại học danh tiếng với thành tích xuất sắc, lòng người cha già ngập tràn niềm an ủi và hạnh phúc.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "父亲": (
        "cha, người cha (từ ngữ trang trọng, tôn kính)",
        "在我的成长道路上，父亲严厉的教导与深沉的关怀始终是我前行的力量源泉。",
        "Zài wǒ de chéngzhǎng dàolù shang, fùqīn yánlì de jiàodǎo yǔ shēnchén de guānhuái shǐzhōng shì wǒ qiánxíng de lìliang yuánquán.",
        "Trên con đường trưởng thành của tôi, những lời dạy bảo nghiêm khắc cùng sự quan tâm sâu sắc của cha luôn là cội nguồn sức mạnh cho tôi bước tiếp.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "生": (
        "sinh ra, sống (chưa chín), nảy sinh, lạ",
        "这种海鲜必须彻底煮熟后才能食用，吃生的容易引发肠胃细菌感染。",
        "Zhè zhǒng hǎixiān bìxū chèdǐ zhǔshóu hòu cái néng shíyòng, chī shēng de róngyì yǐnfā chángwèi xìjūn gǎnrǎn.",
        "Loại hải sản này phải nấu chín kỹ rồi mới được ăn, ăn đồ sống rất dễ dẫn đến nhiễm khuẩn đường tiêu hóa.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "盐": (
        "muối ăn",
        "健康饮食建议成年人每天控制食盐摄入量，过量吃盐会增加患高血压的风险。",
        "Jiànkāng yǐnshí jiànyì chéngniánrén měitiān kòngzhì shíyán shèrù liàng, guòliàng chī yán huì zēngjiā huàn gāoxuèyā de fēngxiǎn.",
        "Chế độ ăn lành mạnh khuyến cáo người trưởng thành nên kiểm soát lượng muối ăn hàng ngày, ăn quá nhiều muối sẽ làm tăng nguy cơ mắc bệnh cao huyết áp.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "研究": (
        "nghiên cứu, tìm hiểu kỹ lưỡng",
        "科学家们通过多年深入系统的科学研究，终于找到了治理这种土壤污染的新方法。",
        "Kēxuéjiāmen tōngguò duō nián shēnrù xìtǒng de kēxué yánjiū, zhōngyú zhǎodào le zhìlǐ zhè zhǒng tǔrǎng wūrǎn de xīn fāngfǎ.",
        "Các nhà khoa học thông qua nhiều năm nghiên cứu khoa học chuyên sâu và có hệ thống cuối cùng đã tìm ra phương pháp mới để xử lý loại ô nhiễm đất này.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "空": (
        "rảnh rỗi, thời gian rảnh, trống (kòng)",
        "等周末你手头的事情忙完了有空的时候，咱们再一起去郊外爬山散散心。",
        "Děng zhōumò nǐ shǒutóu de shìqing máng wán le yǒu kòng de shíhou, zánmen zài yìqǐ qù jiāowài páshān sànsàn xīn.",
        "Đợi đến cuối tuần khi mọi việc trong tay cậu bận xong và có thời gian rảnh, tụi mình hãy cùng nhau đi leo núi dã ngoại thư giãn nhé.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "管理": (
        "quản lý, điều hành, quản trị",
        "一家优秀的企业不仅需要先进的技术设备，更需要一套科学完善的现代化管理制度。",
        "Yì jiā yōuxiù de qǐyè bùjǐn xūyào xiānjìn de jìshù shèbèi, gèng xūyào yí tào kēxué wánshàn de xiàndàihuà guǎnlǐ zhìdù.",
        "Một doanh nghiệp xuất sắc không chỉ cần trang thiết bị công nghệ tiên tiến mà còn rất cần một hệ thống chế độ quản lý hiện đại, khoa học và hoàn thiện.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "继续": (
        "tiếp tục, duy trì không gián đoạn",
        "虽然遭遇了暂时的挫折，但科研团队并没有放弃，依然选择继续攻关这个课题。",
        "Suīrán zāoyù le zànshí de cuòzhé, dàn kēyán tuánduì bìng méiyǒu fàngqì, yīrán xuǎnzé jìxù gōngguān zhè gè kètí.",
        "Tuy gặp phải trắc trở tạm thời nhưng đội ngũ nghiên cứu không hề bỏ cuộc mà vẫn tiếp tục nỗ lực giải quyết đề tài nghiên cứu này.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "考虑": (
        "suy nghĩ, cân nhắc",
        "在做出更换工作这个重大职业决定之前，请你务必认真充分地考虑各个方面的利弊。",
        "Zài zuòchū gēnghuàn gōngzuò zhè gè zhòngdà zhíyè juédìng zhīqián, qǐng nǐ wùbì rènzhēn chōngfèn de kǎolǜ gè gè fāngmiàn de lìbì.",
        "Trước khi đưa ra quyết định nghề nghiệp quan trọng là đổi việc làm, xin bạn hãy cân nhắc thật kỹ càng và đầy đủ mọi mặt lợi hại.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "自习": (
        "tự học, giờ tự học",
        "每天晚自习期间，教室里都十分安静，大家都在聚精会神地复习白天的功课。",
        "Měitiān wǎn zìxí qījiān, jiàoshì lǐ dōu shífēn ānjìng, dàjiā dōu zài jùjīng-huìshén de fùxí báitiān de gōngkè.",
        "Trong suốt giờ tự học buổi tối mỗi ngày, trong lớp học đều vô cùng yên tĩnh, mọi người đều đang tập trung tinh thần ôn lại bài học ban ngày.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "表": (
        "đồng hồ đeo tay; bảng biểu",
        "我手上戴的这块手表是去年大学毕业时父亲送给我的珍贵纪念礼物。",
        "Wǒ shǒushang dài de zhè kuài shǒubiǎo shì qùnián dàxué bìyè shí fùqīn sòng gěi wǒ de zhēnguì jìniàn lǐwù.",
        "Chiếc đồng hồ đeo tay mà tôi đang đeo là món quà kỷ niệm quý giá mà cha đã tặng tôi khi tốt nghiệp đại học năm ngoái.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "讨论": (
        "thảo luận, bàn luận, trao đổi ý kiến",
        "在每周的项目进度会议上，大家都会就遇到的技术难点展开热烈深入的讨论。",
        "Zài měi zhōu de xiàngmù jìndù huìyì shang, dàjiā dōu huì jiù yùdào de jìshù nándiǎn zhǎnkāi rèliè shēnrù de tǎolùn.",
        "Tại cuộc họp tiến độ dự án hàng tuần, mọi người đều triển khai thảo luận sôi nổi và sâu sắc về các điểm nghẽn kỹ thuật gặp phải.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "谈": (
        "nói chuyện, trò chuyện, bàn luận, đàm đạo",
        "下午两位公司高管在会议室里坐下来，就双方下一步的战略合作进行了深入交谈。",
        "Xiàwǔ liǎng wèi gōngsī gāoguǎn zài huìyìshì lǐ zuò xiàlai, jiù shuāngfāng xià yí bù de zhànlüè hézuò jìnxíng le shēnrù jiāotán.",
        "Buổi chiều hai vị lãnh đạo cấp cao của công ty đã ngồi lại trong phòng họp, tiến hành trò chuyện sâu sắc về bước hợp tác chiến lược tiếp theo của hai bên.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "趟": (
        "chuyến, lượt (lượng từ chỉ số lần đi lại)",
        "为了办理出国留学的签证手续，这个月他已经专程跑了好几趟领事馆。",
        "Wèile bànlǐ chūguó liúxué de qiānzhèng shǒuxù, zhè gè yuè tā yǐjīng zhuānchéng pǎo le hǎo jǐ tàng lǐngshìguǎn.",
        "Để làm thủ tục xin thị thực đi du học nước ngoài, tháng này cậu ấy đã đặc biệt đi đến lãnh sự quán mấy lượt rồi.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "远离": (
        "tránh xa, xa rời, cách xa",
        "医生特别叮嘱我们要养成良好的健康作息习惯，远离油腻食品和垃圾饮料。",
        "Yīshēng tèbié dīngzhǔ wǒmen yào yǎngchéng liánghǎo de jiànkāng zuòxī xíguàn, yuǎnlí yóunì shípǐn hé lājī yǐnliào.",
        "Bác sĩ đặc biệt căn dặn chúng tôi phải rèn luyện thói quen sinh hoạt lành mạnh, tránh xa các thực phẩm nhiều dầu mỡ và đồ uống có hại.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "醒": (
        "tỉnh dậy, thức giấc, nhận ra",
        "每天早晨清晨第一缕阳光洒进窗户的时候，我便自然而然地从睡梦中醒来。",
        "Měitiān zǎochen qīngchén dì-yī lǚ yángguāng sǎ jìn chuānghu de shíhou, wǒ biàn zìrán'érzìrán de cóng shuìmèng zhōng xǐng lái.",
        "Mỗi buổi sáng khi tia nắng đầu tiên sớm mai rọi vào khung cửa sổ, tôi liền tự nhiên tỉnh dậy sau giấc ngủ.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "降低": (
        "hạ thấp, làm giảm, giảm bớt",
        "通过在工厂车间安装先进的消音过滤装置，有效降低了工业生产对周边居民造成的噪音影响。",
        "Tōngguò zài gōngchǎng chējiān ānzhuāng xiānjìn de xiāoyīn guòlǜ zhuāngzhì, yǒuxiào jiàngdī le gōngyè shēngchǎn duì zhōubiān jūmín zàochéng de zàoyīn yǐngxiǎng.",
        "Bằng cách lắp đặt thiết bị tiêu âm lọc tiếng ồn tiên tiến trong phân xưởng nhà máy, đã giảm thiểu hiệu quả tiếng ồn do sản xuất công nghiệp gây ra cho cư dân xung quanh.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "顺利": (
        "thuận lợi, suôn sẻ, trôi chảy",
        "在全体项目组成员的齐心协作下，整个软件系统升级工程进行得非常顺利。",
        "Zài quántǐ xiàngmù zǔ chéngyuán de qíxīn xiézuò xià, zhěnggè ruǎnjiàn xìtǒng shēngjí gōngchéng jìnxíng de fēicháng shùnlì.",
        "Dưới sự hợp tác đồng lòng của toàn thể thành viên nhóm dự án, toàn bộ công trình nâng cấp hệ thống phần mềm đã diễn ra hết sức thuận lợi.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "高考": (
        "kỳ thi tuyển sinh đại học toàn quốc (cao khảo)",
        "高考不仅是考查高中三年文化知识的重大考试，更是考验年轻人意志品质的人生洗礼。",
        "Gāokǎo bùjǐn shì kǎochá gāozhōng sān nián wénhuà zhīshi de zhòngdà kǎoshì, gèng shì kǎoyàn niánqīngrén yìzhì pǐnzhì de rénshēng xǐlǐ.",
        "Kỳ thi đại học không chỉ là bài kiểm tra quan trọng về kiến thức văn hóa ba năm phổ thông mà còn là dịp tôi luyện thử thách ý chí phẩm chất của người trẻ trong cuộc đời.",
        "LINGUISTICALLY_REVIEWED_AI"
    )
}

def generate_l14():
    with open('data/hsk30/staging/dev_hsk4_vocab_raw.json', 'r', encoding='utf-8') as f:
        raw_vocab = json.load(f)

    l14_raw = [w for w in raw_vocab if w['lessonNumber'] == LESSON_NUMBER]
    assert len(l14_raw) == 50, f"Expected 50 raw words for L14, got {len(l14_raw)}"

    enriched_records = []
    for item in l14_raw:
        hanzi = item['hanzi']
        assert hanzi in L14_DEFINITIONS, f"Missing definition for '{hanzi}' in L14"
        meaning_vi, ex_zh, ex_py, ex_vi, qa_status = L14_DEFINITIONS[hanzi]

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

    out_file = Path("scripts/hsk30/hsk4_vocab_data_p3_l14.py")
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write("# -*- coding: utf-8 -*-\n")
        f.write('"""\nHSK 4 Vocabulary Data — Part 3: Lesson 14 (50 words)\n')
        f.write(f'LessonId: {LESSON_ID}\nLesson Title: {LESSON_TITLE}\n"""\n\n')
        f.write(f'LESSON_ID = "{LESSON_ID}"\n')
        f.write(f'LESSON_NUMBER = {LESSON_NUMBER}\n')
        f.write(f'LESSON_TITLE = "{LESSON_TITLE}"\n\n')
        f.write("HSK4_DATA_P3_L14_RECORDS = ")
        f.write(json.dumps(enriched_records, ensure_ascii=False, indent=4))
        f.write("\n\n")
        f.write("# Dictionary format compatible with P1 / P2: (lesson_num, hanzi) -> (meaningVi, exampleZh, examplePy, exampleVi)\n")
        f.write("HSK4_DATA_P3_L14 = {\n")
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
        stage="STAGE_P3_LESSON14_COMPLETED",
        completed_lessons=list(range(1, 15)),
        completed_vocab_count=700,
        status="IN_PROGRESS"
    )
    print("Updated checkpoint: 700 words completed.")

if __name__ == '__main__':
    generate_l14()
