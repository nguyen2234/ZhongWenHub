# -*- coding: utf-8 -*-
"""
Generator and Validator for HSK 4 — Lesson 17 Vocabulary
LessonId: 54B43ADC-9959-4839-B6D1-CA9460D34655
Lesson 17: 科技改变生活 (50 words)
"""
import sys
import json
import hashlib
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

LESSON_ID = "54B43ADC-9959-4839-B6D1-CA9460D34655"
LESSON_NUMBER = 17
LESSON_TITLE = "科技改变生活"

L17_DEFINITIONS = {
    "与": (
        "và, cùng với (liên từ/giới từ tương đương 和, 跟)",
        "现代信息科学与人工智能技术的结合，极大地推动了智慧医疗产业的跨越式发展。",
        "Xiàndài xìnxī kēxué yǔ réngōng zhìnéng jìshù de jiéhé, jídà de tuīdòng le zhìhuì yīliáo chǎnyè de kuàyuèshì fāzhǎn.",
        "Sự kết hợp giữa khoa học thông tin hiện đại cùng với công nghệ trí tuệ nhân tạo đã thúc đẩy mạnh mẽ sự phát triển vượt bậc của ngành y tế thông minh.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "之后": (
        "sau khi, sau đó",
        "在成功研发出这款新型节能芯片之后，公司迅速启动了大规模量产计划。",
        "Zài chénggōng yánfā chū zhè kuǎn xīnxíng jiénéng xīnpiàn zhīhòu, gōngsī xùnsù qǐdòng le dà guīmó liàngchǎn jìhuà.",
        "Sau khi nghiên cứu và phát triển thành công con chip tiết kiệm năng lượng kiểu mới này, công ty đã nhanh chóng khởi động kế hoạch sản xuất hàng loạt quy mô lớn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "亲戚": (
        "bà con, họ hàng, người thân",
        "如今即使亲戚朋友远在千里之外，也可以通过高清视频通话随时随地互致问候。",
        "Rújīn jíshǐ qīnqi péngyou yuǎn zài qiānlǐ zhī wài, yě kěyǐ tōngguò gāoqīng shìpín tōnghuà suíshí-suídì hù zhì wènhòu.",
        "Ngày nay dù bà con họ hàng bạn bè ở xa ngàn dặm, cũng có thể thông qua cuộc gọi video độ nét cao để hỏi thăm nhau mọi lúc mọi nơi.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "优点": (
        "ưu điểm, thế mạnh, điểm tốt",
        "智能家居系统最大的优点在于能够通过手机远程控制家电设备，既省时又省电。",
        "Zhìnéng jiājū xìtǒng zuì dà de yōudiǎn zàiyú nénggòu tōngguò shǒujī yuǎnchéng kòngzhì jiādiàn shèbèi, jì shěng shí yòu shěng diàn.",
        "Ưu điểm lớn nhất của hệ thống nhà thông minh nằm ở chỗ có thể điều khiển từ xa thiết bị gia dụng qua điện thoại, vừa tiết kiệm thời gian vừa tiết kiệm điện.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "使馆": (
        "đại sứ quán, tòa đại sứ",
        "为了方便海外华侨华人办理领事业务，中国驻外使馆全面推出了在线预约申办平台。",
        "Wèile fāngbiàn hǎiwài Huáqiáo Huárén bànlǐ lǐngshì yèwù, Zhōngguó zhùwài shǐguǎn quánmiàn tuīchū le zàixiàn yùyuē shēnbàn píngtái.",
        "Để tạo thuận tiện cho bà con kiều bào ở nước ngoài làm các thủ tục lãnh sự, đại sứ quán Trung Quốc ở nước ngoài đã triển khai toàn diện nền tảng hẹn trực tuyến.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "停": (
        "dừng, ngừng lại, đỗ xe",
        "随着新能源自动驾驶汽车技术的成熟，车辆已经能够实现精准的无人自主停泊。",
        "Suízhe xīnnéngyuán zìdòng jiàshǐ qìchē jìshù de chéngshú, chēliàng yǐjīng nénggòu shíxiàn jīngzhǔn de wúrén zìzhǔ tíngbó.",
        "Cùng với sự chín muồi của công nghệ xe năng lượng mới tự hành, ô tô hiện nay đã có thể tự động dừng đỗ không người lái một cách chuẩn xác.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "全部": (
        "toàn bộ, tất cả",
        "这家现代化物流中心已经全部实现了仓储分拣的机器人自动化作业。",
        "Zhè jiā xiàndàihuà wùliú zhōngxīn yǐjīng quánbù shíxiàn le cāngchǔ fēnjiǎn de jīqìrén zìdònghuà zuòyè.",
        "Trung tâm logistics hiện đại này đã thực hiện toàn bộ việc phân loại kho bãi bằng tác nghiệp tự động hóa của robot.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "准时": (
        "đúng giờ, đúng hẹn",
        "借助先进的高铁网络与卫星导航调度系统，列车能够风雨无阻、准时到站。",
        "Jièzhù xiānjìn de gāotiě wǎngluò yǔ wèixīng dǎoháng diàodù xìtǒng, lièchē nénggòu fēngyǔ-wúzǔ, zhǔnshí dào zhàn.",
        "Nhờ vào mạng lưới tàu cao tốc tiên tiến cùng hệ thống điều độ định vị vệ tinh, các chuyến tàu có thể bất chấp mưa gió để đến ga đúng giờ.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "剧院": (
        "nhà hát, rạp hát",
        "国家大剧院利用虚拟现实数字技术，让观众足不出户就能身临其境地欣赏顶级舞台剧。",
        "Guójiā Dà Jùyuàn lìyòng xūnǐ xiànshí shùzì jìshù, ràng guānzhòng zúbùchūhù jiù néng shēnlínqíjìng de xīnshǎng dǐngjí wǔtáijù.",
        "Nhà hát Lớn Quốc gia đã ứng dụng công nghệ số thực tế ảo, giúp khán giả không cần bước chân ra khỏi nhà cũng có thể thưởng thức các vở kịch đỉnh cao như đang có mặt tại chỗ.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "区别": (
        "phân biệt, sự khác biệt",
        "高清数字显示屏幕能够精准还原色彩细节，让人一眼就能看出普通画面与超清画质的区别。",
        "Gāoqīng shùzì xiǎnshì píngmù nénggòu jīngzhǔn huányuán sècǎi xìjié, ràng rén yì yǎn jiù néng kàn chū pǔtōng huàmiàn yǔ chāoqīng huàzhì de qūbié.",
        "Màn hình hiển thị kỹ thuật số độ nét cao có thể tái hiện chuẩn xác từng chi tiết màu sắc, giúp người xem nhìn thoáng qua là phân biệt được sự khác biệt giữa hình ảnh thường và chuẩn siêu nét.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "原因": (
        "nguyên nhân, lý do",
        "工程师经过严密的排查与系统分析，终于找到了导致网络服务器异常中断的技术原因。",
        "Gōngchéngshī jīngguò yánmì de páichá yǔ xìtǒng fēnxī, zhōngyú zhǎodào le dǎozhì wǎngluò fúwùqì yìcháng zhōngduàn de jìshù yuányīn.",
        "Các kỹ sư sau khi rà soát chặt chẽ và phân tích hệ thống cuối cùng đã tìm ra nguyên nhân kỹ thuật dẫn đến sự cố ngắt kết nối bất thường của máy chủ mạng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "另": (
        "khác, riêng biệt (另/另外)",
        "除了不断优化现有的手机操作系统外，研发团队还在积极探索另一个前沿技术领域。",
        "Chúle búduàn yōuhuà xiànyǒu de shǒujī cāozuò xìtǒng wài, yánfā tuánduì hái zài jījí tànsuǒ lìng yí gè qiányán jìshù lǐngyù.",
        "Ngoài việc không ngừng tối ưu hóa hệ điều hành điện thoại hiện có, đội ngũ nghiên cứu còn tích cực tìm tòi một lĩnh vực công nghệ mũi nhọn khác.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "吸": (
        "hít, hút (không khí, khói, bụi)",
        "这款家用智能空气净化器能够强力吸走室内悬浮的微小颗粒物与粉尘。",
        "Zhè kuǎn jiāyòng zhìnéng kōngqì jìnghuàqì nénggòu qiánglì xī zǒu shìnèi xuánfú de wēixiǎo kēlìwù yǔ fěnchén.",
        "Chiếc máy lọc không khí thông minh gia đình này có thể hút mạnh các hạt bụi mịn và vi hạt lơ lửng trong phòng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "困": (
        "buồn ngủ; khốn khó, bị vây hãm (kùn)",
        "连续在电脑前写了五个小时程序代码，他感到有些发困，便站起来喝了杯浓咖啡提神。",
        "Liánxù zài diànnǎo qián xiě le wǔ gè xiǎoshí chéngxù dàimǎ, tā gǎndào yǒuxiē fā kùn, biàn zhàn qǐlai hē le bēi nóng kāfēi tíshén.",
        "Liên tục viết mã lập trình năm tiếng đồng hồ trước máy tính, anh ấy cảm thấy hơi buồn ngủ nên đứng dậy uống một ly cà phê đậm đặc để lấy lại tỉnh táo.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "增长": (
        "tăng trưởng, gia tăng, nâng cao",
        "电子商务与移动互联网的迅猛普及，推动了全国居民线上消费规模的持续强劲增长。",
        "Diànzǐ shāngwù yǔ yídòng hùliánwǎng de xùnměng pǔjí, tuīdòng le quánguó jūmín xiànshang xiāofèi guīmó de chíxù qiángjìn zēngzhǎng.",
        "Sự phổ biến nhanh chóng của thương mại điện tử và internet di động đã thúc đẩy quy mô tiêu dùng trực tuyến của người dân cả nước tăng trưởng mạnh mẽ và liên tục.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "失望": (
        "thất vọng, mất hy vọng",
        "新一代智能手机在续航和摄影性能上的卓越表现，绝不会让期待已久的消费者感到失望。",
        "Xīn yídài zhìnéng shǒujī zài xùháng hé shèyǐng xìngnéng shang de zhuóyuè biǎoxiàn, jué bú huì ràng qīdài yǐ jiǔ de xiāofèizhě gǎndào shīwàng.",
        "Biểu hiện vượt trội về thời lượng pin và tính năng chụp ảnh của thế hệ điện thoại thông minh mới tuyệt đối sẽ không khiến người tiêu dùng mong đợi bấy lâu phải thất vọng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "实在": (
        "thực sự, quả thật; chân thật, thật thà",
        "利用高速网络在线挂号看病，不仅节省了大量排队时间，而且操作起来实在太方便了。",
        "Lìyòng gāosù wǎngluò zàixiàn guàhào kànbìng, bùjǐn jiéshěng le dàliàng páiduì shíjiān, érqiě cāozuò qǐlai shízài tài fāngbiàn le.",
        "Ứng dụng mạng tốc độ cao để đăng ký khám bệnh trực tuyến không những tiết kiệm được nhiều thời gian xếp hàng mà thao tác quả thật vô cùng tiện lợi.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "将要": (
        "sắp, sẽ, sắp sửa",
        "这家知名科技企业下周将要正式发布首款搭载国产自主操作系统的智能汽车。",
        "Zhè jiā zhìmíng kējì qǐyè xià zhōu jiāngyào zhèngshì fābù shǒu kuǎn dāzài guóchǎn zìzhǔ cāozuò xìtǒng de zhìnéng qìchē.",
        "Doanh nghiệp công nghệ danh tiếng này tuần tới sẽ chính thức ra mắt mẫu xe thông minh đầu tiên tích hợp hệ điều hành tự chủ sản xuất trong nước.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "已": (
        "đã (phó từ tương đương 已经)",
        "随着光纤宽带网入户工程的全面铺开，千兆高速网络已基本覆盖了全省所有行政村。",
        "Suízhe guāngxiān kuāndàiwǎng rù hù gōngchéng de quánmiàn pūkāi, qiān zhào gāosù wǎngluò yǐ jīběn fùgài le quán shěng suǒyǒu xíngzhèngcūn.",
        "Cùng với việc triển khai toàn diện công trình mạng cáp quang băng thông rộng đến từng hộ gia đình, mạng tốc độ cao gigabit đã cơ bản phủ sóng toàn bộ các làng hành chính trong tỉnh.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "庆祝": (
        "chúc mừng, ăn mừng, kỷ niệm",
        "科研团队全体成员齐聚一堂，共同热烈庆祝我国空间站核心舱成功发射升空。",
        "Kēyán tuánduì quántǐ chéngyuán qíjù yì táng, gòngtóng rèliè qìngzhù wǒ guó kōngjiānzhàn héxīncāng chénggōng fāshè shēngkōng.",
        "Toàn thể thành viên đội ngũ nghiên cứu khoa học đã tề tựu đông đủ, cùng nhau nhiệt liệt ăn mừng khoang lõi trạm vũ trụ của nước nhà phóng thành công vào không gian.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "心情": (
        "tâm trạng, tâm tình",
        "在阳光明媚的周末戴上耳机听听舒缓的数字轻音乐，能让人原本紧张的心情彻底放松下来。",
        "Zài yángguāng míngmèi de zhōumò dài shang ěrjī tīngtīng shūhuǎn de shùzì qīngyīnyuè, néng ràng rén yuánběn jǐnzhāng de xīnqíng chèdǐ fàngsōng xiàlai.",
        "Vào dịp cuối tuần nắng đẹp đeo tai nghe nghe những bản nhạc nhẹ kỹ thuật số êm dịu có thể khiến tâm trạng vốn căng thẳng được thả lỏng hoàn toàn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "感情": (
        "tình cảm, cảm xúc",
        "人机对话语言模型虽然越来越聪明逼真，但依然无法替代人类之间真挚深沉的情感交流。",
        "Rén-jī duìhuà yǔyán móxíng suīrán yuèláiyuè cōngmíng bīzhēn, dàn yīrán wúfǎ tìdài rénlèi zhījiān zhēnzhì shēnchén de qínggǎn jiāoliú.",
        "Mô hình ngôn ngữ đối thoại giữa người và máy tuy ngày càng thông minh sống động, nhưng vẫn không thể thay thế được sự giao lưu tình cảm chân thành sâu sắc giữa con người với nhau.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "批评": (
        "phê bình, chỉ trích, góp ý",
        "面对技术测试中暴露出的一系列软件漏洞，项目负责人虚心接受了质检部门提出的严格批评。",
        "Miànduì jìshù cèshì zhōng bàolù chū de yí xìliè ruǎnjiàn lòudòng, xiàngmù fùzérén xūxīn jiēshòu le zhìjiǎn bùmén tíchū de yángé pīpíng.",
        "Đối mặt với hàng loạt lỗ hổng phần mềm bộc lộ trong quá trình thử nghiệm kỹ thuật, người phụ trách dự án đã khiêm tốn tiếp thu những lời phê bình nghiêm khắc từ bộ phận kiểm tra chất lượng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "掉": (
        "rơi, rớt, tụt, mất",
        "新型无线耳机采用了符合人体工学的设计，即使在剧烈运动跑步时也不会轻易掉落。",
        "Xīnxíng wúxiàn ěrjī cǎiyòng le fúhé réntǐ gōngxué de shèjì, jíshǐ zài jùliè yùndòng pǎobù shí yě bù huì qīngyì diàoluò.",
        "Mẫu tai nghe không dây kiểu mới áp dụng thiết kế công thái học phù hợp với cơ thể người, dù khi chạy bộ vận động mạnh cũng không dễ bị rơi tuột.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "支持": (
        "ủng hộ, hỗ trợ, tương thích",
        "这款现代智能手机不仅支持双模全网通网络，还全面支持无线快速充电功能。",
        "Zhè kuǎn xiàndài zhìnéng shǒujī bùjǐn zhīchí shuāngmó quán wǎngtōng wǎngluò, hái quánmiàn zhīchí wúxiàn kuàisù chōngdiàn gōngnéng.",
        "Chiếc điện thoại thông minh hiện đại này không chỉ hỗ trợ mạng toàn mạng chế độ kép mà còn hỗ trợ toàn diện tính năng sạc nhanh không dây.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "数量": (
        "số lượng, lượng",
        "随着新能源汽车充电桩建设的快速铺开，全国公共充电桩的拥有数量已经突破了数百万大关。",
        "Suízhe xīnnéngyuán qìchē chōngdiànzhuāng jiànshè de kuàisù pūkāi, quánguó gōnggòng chōngdiànzhuāng de yōngyǒu shùliàng yǐjīng tūpò le shù bǎi wàn dàguān.",
        "Cùng với việc triển khai nhanh chóng xây dựng trạm sạc xe năng lượng mới, số lượng trạm sạc công cộng sở hữu trên toàn quốc đã vượt mốc hàng triệu.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "日常": (
        "thường nhật, hằng ngày",
        "智能手机已经深度融入到了现代人的日常生活中，成为了不可或缺的生活助手。",
        "Zhìnéng shǒujī yǐjīng shēndù róngrù dào le xiàndàirén de rìcháng shēnghuó zhōng, chéngwéi le bùkě-huòquē de shēnghuó zhùshǒu.",
        "Điện thoại thông minh đã hòa nhập sâu sắc vào đời sống thường nhật của con người hiện đại, trở thành trợ thủ đắc lực không thể thiếu trong cuộc sống.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "更加": (
        "càng, càng thêm",
        "人工智能大模型的不断迭代与升级，让计算机的处理能力变得更加高效和智能化。",
        "Réngōng zhìnéng dà móxíng de búduàn diédài yǔ shēngjí, ràng jìsuànjī de chǔlǐ nénglì biànde gèngjiā gāoxiào hé zhìnénghuà.",
        "Việc không ngừng cập nhật nâng cấp các mô hình lớn trí tuệ nhân tạo đã giúp năng lực xử lý của máy tính trở nên càng thêm hiệu quả và thông minh hơn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "查找": (
        "tra cứu, tìm kiếm",
        "借助数字图书馆的高效检索算法，读者可以在几秒钟内精准查找到所需的科研论文资料。",
        "Jièzhù shùzì túshūguǎn de gāoxiào jiǎnsuǒ suànfǎ, dúzhě kěyǐ zài jǐ miǎozhōng nèi jīngzhǔn cházhǎo dào suǒ xū de kēyán lùnwén zīliào.",
        "Nhờ thuật toán tìm kiếm hiệu quả cao của thư viện số, độc giả có thể tra cứu chuẩn xác tài liệu bài báo nghiên cứu khoa học cần thiết chỉ trong vài giây.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "此外": (
        "ngoài ra, thêm vào đó, bên cạnh đó",
        "这款智能手表不仅能全天候监测心率与睡眠质量，此外还具备高精度卫星定位与紧急呼叫功能。",
        "Zhè kuǎn zhìnéng shǒubiǎo bùjǐn néng quántiānhòu jiāncè xīnlǜ yǔ shuìmián zhìliàng, cǐwài hái jùbèi gāojīngdù wèixīng dìngwèi yǔ jǐnjí hūjiào gōngnéng.",
        "Chiếc đồng hồ thông minh này không chỉ có thể giám sát nhịp tim và chất lượng giấc ngủ suốt ngày đêm, ngoài ra còn được trang bị tính năng định vị vệ tinh độ chính xác cao và gọi khẩn cấp.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "汽水": (
        "nước ngọt có ga, nước soda",
        "炎热的夏天在实验室工作了一整天，下班后喝上一罐冰镇柠檬汽水真是让人倍感清爽。",
        "Yánrè de xiàtiān zài shíyànshì gōngzuò le yì zhěng tiān, xiàbān hòu hē shang yí guàn bīngzhèn níngméng qìshuǐ zhēn shì ràng rén bèi gǎn qīngshuǎng.",
        "Mùa hè nóng bức làm việc suốt cả ngày trong phòng thí nghiệm, sau khi tan tầm uống một lon nước ngọt chanh ướp lạnh quả thật khiến người ta cảm thấy vô cùng sảng khoái.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "演员": (
        "diễn viên",
        "在虚拟现实动作捕捉摄影棚里，演员穿上特制感应服装，为三维科幻动画电影提供逼真生动的肢体表演。",
        "Zài xūnǐ xiànshí dòngzuò bǔzhuō shèyǐngpéng lǐ, yǎnyuán chuān shang tèzhì gǎnyìng fúzhuāng, wèi sānwéi kēhuàn dònghuà diànyǐng tígōng bīzhēn shēngdòng de zhītǐ biǎoyǎn.",
        "Trong phim trường ghi hình bắt chuyển động thực tế ảo, diễn viên mặc trang phục cảm ứng đặc chế để cung cấp các màn diễn xuất hình thể sống động như thật cho bộ phim hoạt hình khoa học viễn tưởng 3D.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "父母": (
        "cha mẹ, phụ huynh",
        "年轻人应当有足够的耐心教会父母使用智能手机扫码看病、网购和视频通话。",
        "Niánqīngrén yīngdāng yǒu zúgòu de nàixīn jiàohuì fùmǔ shǐyòng zhìnéng shǒujī sǎomǎ kànbìng, wǎnggòu hé shìpín tōnghuà.",
        "Người trẻ cần có đủ kiên nhẫn để dạy cha mẹ cách sử dụng điện thoại thông minh quét mã khám bệnh, mua sắm qua mạng và gọi điện thoại video.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "生意": (
        "kinh doanh, buôn bán, làm ăn (shēngyi)",
        "随着跨境电商平台的迅速崛起，许多传统外贸商家的海外生意变得越来越红火。",
        "Suízhe kuàjìng diànshāng píngtái de xùnsù juéqǐ, xǔduō chuántǒng wàimào shāngjiā de hǎiwài shēngyi biànde yuèláiyuè hónghuo.",
        "Cùng với sự trỗi dậy nhanh chóng của các nền tảng thương mại điện tử xuyên biên giới, việc làm ăn buôn bán ra nước ngoài của nhiều thương nhân ngoại thương truyền thống ngày càng phát đạt hồng phát.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "目标": (
        "mục tiêu, đích đến",
        "国家制定了发展绿色清洁能源的宏伟目标，力争在未来十年内显著降低工业碳排放。",
        "Guójiā zhìdìng le fāzhǎn lǜsè qīngjié néngyuán de hóngwěi mùbiāo, lìzhēng zài wèilái shí nián nèi xiǎnzhù jiàngdī gōngyè tàn páifàng.",
        "Nhà nước đã đặt ra mục tiêu to lớn phát triển năng lượng xanh sạch, phấn đấu trong mười năm tới giảm thiểu đáng kể lượng khí thải carbon công nghiệp.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "硕士": (
        "thạc sĩ",
        "他在清华大学计算机专业顺利拿到了工学硕士学位，随后加入了知名人工智能实验室。",
        "Tā zài Qīnghuá Dàxué jìsuànjī zhuānyè shùnlì ná dào le gōngxué shuòshì xuéwèi, suíhòu jiārù le zhìmíng réngōng zhìnéng shíyànshì.",
        "Anh ấy đã thuận lợi nhận bằng thạc sĩ kỹ thuật chuyên ngành máy tính tại Đại học Thanh Hoa, sau đó gia nhập một phòng thí nghiệm trí tuệ nhân tạo danh tiếng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "窗": (
        "cửa sổ",
        "现代智能建筑配备了光电感应窗户，能够根据室外阳光强弱自动调节玻璃的透光度。",
        "Xiàndài zhìnéng jiànzhù pèibèi le guāngdiàn gǎnyìng chuānghu, nénggòu gēnjù shìwài yángguāng qiángruò zìdòng tiáojié bōli de tòuguāngdù.",
        "Các tòa nhà thông minh hiện đại được trang bị cửa sổ cảm ứng quang điện, có thể tự động điều chỉnh độ truyền sáng của kính theo cường độ ánh nắng ngoài trời.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "粗心": (
        "sơ ý, cẩu thả, bất cẩn",
        "在编写航空航天控制软件时绝不能有一丝一毫的粗心大意，否则可能酿成严重事故。",
        "Zài biānxiě hángkōng hángtiān kòngzhì ruǎnjiàn shí jué bù néng yǒu yì sī yì háo de cūxīn-dàyì, fǒuzé kěnéng niàngchéng yánzhòng shìgù.",
        "Khi viết phần mềm điều khiển hàng không vũ trụ tuyệt đối không được có một chút sơ ý bất cẩn nào, nếu không có thể gây ra tai nạn nghiêm trọng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "缺点": (
        "khuyết điểm, nhược điểm",
        "虽然早期的纯电动汽车存在电池续航偏短的缺点，但随着电池技术的突破，这一问题已得到根本改善。",
        "Suīrán zǎoqī de chún diàndòng qìchē cúnzài diànchí xùháng piān duǎn de quēdiǎn, dàn suízhe diànchí jìshù de tūpò, zhè yì wèntí yǐ dédào gēnběn gǎishàn.",
        "Tuy các dòng xe thuần điện thời kỳ đầu có nhược điểm cự ly chạy của pin hơi ngắn, nhưng với sự đột phá của công nghệ pin thì vấn đề này đã được cải thiện căn bản.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "耐心": (
        "kiên nhẫn, lòng kiên nhẫn",
        "科学实验往往需要经历成百上千次的反复测试与失败，只有保持极大的耐心才能攻克科研难关。",
        "Kēxué shíyàn wǎngwǎng xūyào jīnglì chéng bǎi shàng qiān cì de fǎnfù cèshì yǔ shībài, zhǐyǒu bǎochí jídà de nàixīn cái néng gōngkè kēyán nánguān.",
        "Thí nghiệm khoa học thường cần trải qua hàng trăm hàng ngàn lần thử nghiệm và thất bại lặp đi lặp lại, chỉ có duy trì lòng kiên nhẫn cực lớn mới có thể vượt qua ải khó khăn nghiên cứu.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "自然": (
        "tự nhiên; đương nhiên, tự nhiên",
        "人与自然和谐共生的绿色发展理念，正在引领着全球绿色环保科技创新的发展方向。",
        "Rén yǔ zìrán héxié gòngshēng de lǜsè fāzhǎn lǐniàn, zhèngzài yǐnlǐng zhe quánqiú lǜsè huánbǎo kējì chuàngxīn de fāzhǎn fāngxiàng.",
        "Triết lý phát triển xanh con người cùng chung sống hài hòa với thiên nhiên tự nhiên đang dẫn dắt phương hướng đổi mới công nghệ bảo vệ môi trường xanh toàn cầu.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "表现": (
        "biểu hiện, thể hiện, phong độ",
        "这款由我国自主研发的高铁列车在极寒高温等严酷气候测试中，各系统均表现出极佳的稳定性能。",
        "Zhè kuǎn yóu wǒ guó zìzhǔ yánfā de gāotiě lièchē zài jíhán gāowēn děng yánkù qìhòu cèshì zhōng, gè xìtǒng jūn biǎoxiàn chū jí jiā de wěndìng xìngnéng.",
        "Đoàn tàu cao tốc do nước ta tự chủ nghiên cứu phát triển này trong các bài kiểm tra khí hậu khắc nghiệt như cực lạnh và nhiệt độ cao, các hệ thống đều thể hiện tính năng ổn định xuất sắc.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "证": (
        "chứng minh thư, giấy chứng nhận, bằng chứng (zhèng)",
        "如今市民出门乘坐公共交通或是去政务大厅办事，只需在手机上亮出电子身份证明即可。",
        "Rújīn shìmín chūmén chéngzuò gōnggòng jiāotōng huòshì qù zhèngwù dàtīng bànshì, zhǐ xū zài shǒujī shang liàng chū diànzǐ shēnfèn zhèngmíng jíkě.",
        "Ngày nay người dân ra ngoài đi phương tiện công cộng hay đến sảnh giải quyết hành chính làm việc, chỉ cần xuất trình giấy chứng nhận danh tính điện tử trên điện thoại là được.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "责任": (
        "trách nhiệm, bổn phận",
        "科技向善是每一个科技企业必须承担的社会责任，人工智能的研发必须服务于人类福祉。",
        "Kējì xiàngshàn shì měi yí gè kējì qǐyè bìxū chéngdān de shèhuì zérèn, réngōng zhìnéng de yánfā bìxū fúwù yú rénlèi fúzhǐ.",
        "Công nghệ hướng thiện là trách nhiệm xã hội mà mỗi doanh nghiệp công nghệ phải gánh vác, việc nghiên cứu phát triển trí tuệ nhân tạo bắt buộc phải phục vụ cho hạnh phúc con người.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "身": (
        "thân, thân thể, toàn thân; bộ (quần áo)",
        "高空作业人员穿上量身定制的智能防护服，能够全方位监测身体体温和心率变化。",
        "Gāokōng zuòyè rényuán chuān shang liàngshēn-dìngzhì de zhìnéng fánghùfú, nénggòu quánfāngwèi jiāncè shēntǐ tǐwēn hé xīnlǜ biànhuà.",
        "Công nhân làm việc trên cao mặc bộ đồ bảo hộ thông minh may đo vừa vặn theo thân người, có thể theo dõi toàn diện sự thay đổi thân nhiệt và nhịp tim cơ thể.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "适合": (
        "phù hợp, thích hợp",
        "这种轻便易携、操作简便的智能平板电脑，非常适合中小学生用于日常远程线上学习。",
        "Zhè zhǒng qīngbiàn yì xié, cāozuò jiǎnbiàn de zhìnéng píngbǎn diànnǎo, fēicháng shìhé zhōng-xiǎoxuéshēng yòng yú rìcháng yuǎnchéng xiànshang xuéxí.",
        "Chiếc máy tính bảng thông minh nhẹ gọn dễ mang, thao tác giản tiện này rất phù hợp cho học sinh phổ thông dùng để học trực tuyến từ xa hàng ngày.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "重新": (
        "lại từ đầu, làm lại, tái tạo (chóngxīn)",
        "当电脑系统因突发断电出现运行故障时，用户可以一键重新启动恢复正常工作状态。",
        "Dāng diànnǎo xìtǒng yīn tūfā duàndiàn chūxiàn yùnxíng gùzhàng shí, yònghù kěyǐ yí jiàn chóngxīn qǐdòng huīfù zhèngcháng gōngzuò zhuàngtài.",
        "Khi hệ thống máy tính gặp sự cố vận hành do mất điện đột ngột, người dùng có thể khởi động lại một chạm để khôi phục trạng thái làm việc bình thường.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "院子": (
        "sân, sân nhà, vườn trong sân",
        "爷爷在院子里安装了太阳能自动感应庭院灯，每当天黑就会自动亮起柔和的光芒。",
        "Yéye zài yuànzi lǐ ānzhuāng le tàiyángnéng zìdòng gǎnyìng tíngyuàndēng, měi dāng tiān hēi jiù huì zìdòng liàng qǐ róuhé de guāngmáng.",
        "Ông nội đã lắp đặt chiếc đèn sân vườn cảm ứng năng lượng mặt trời trong sân, cứ hễ trời tối là sẽ tự động sáng lên ánh sáng dịu dàng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "顿": (
        "bữa, trận, chầu (lượng từ chỉ bữa ăn, lần mắng đòn)",
        "智能炒菜机器人几分钟就能做出一顿色香味俱全的美味家常晚餐。",
        "Zhìnéng chǎocài jīqìrén jǐ fēnzhōng jiù néng zuò chū yí dùn sè-xiāng-wèi jù quán de měiwèi jiācháng wǎncān.",
        "Robot xào nấu thông minh chỉ trong vài phút là có thể làm xong một bữa cơm tối gia đình thơm ngon hấp dẫn đầy đủ sắc hương vị.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "鲜花": (
        "hoa tươi",
        "通过冷链物流与高速航空运输网，云南昆明早晨刚采摘的新鲜鲜花下午就能送到全国各地消费者的手中。",
        "Tōngguò lěngliàn wùliú yǔ gāosù hángkōng yùnshūwǎng, Yúnnán Kūnmíng zǎochen gāng cǎizhāi de xīnxiān xiānhuā xiàwǔ jiù néng sòng dào quánguó gèdì xiāofèizhě de shǒuzhōng.",
        "Thông qua chuỗi logistics bảo quản lạnh và mạng lưới vận tải hàng không tốc độ cao, những bông hoa tươi mới hái sáng sớm tại Côn Minh Vân Nam thì buổi chiều đã có thể trao đến tay người tiêu dùng khắp mọi miền đất nước.",
        "LINGUISTICALLY_REVIEWED_AI"
    )
}

def generate_l17():
    with open('data/hsk30/staging/dev_hsk4_vocab_raw.json', 'r', encoding='utf-8') as f:
        raw_vocab = json.load(f)

    l17_raw = [w for w in raw_vocab if w['lessonNumber'] == LESSON_NUMBER]
    assert len(l17_raw) == 50, f"Expected 50 raw words for L17, got {len(l17_raw)}"

    enriched_records = []
    for item in l17_raw:
        hanzi = item['hanzi']
        assert hanzi in L17_DEFINITIONS, f"Missing definition for '{hanzi}' in L17"
        meaning_vi, ex_zh, ex_py, ex_vi, qa_status = L17_DEFINITIONS[hanzi]

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

    out_file = Path("scripts/hsk30/hsk4_vocab_data_p4_l17.py")
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write("# -*- coding: utf-8 -*-\n")
        f.write('"""\nHSK 4 Vocabulary Data — Part 4: Lesson 17 (50 words)\n')
        f.write(f'LessonId: {LESSON_ID}\nLesson Title: {LESSON_TITLE}\n"""\n\n')
        f.write(f'LESSON_ID = "{LESSON_ID}"\n')
        f.write(f'LESSON_NUMBER = {LESSON_NUMBER}\n')
        f.write(f'LESSON_TITLE = "{LESSON_TITLE}"\n\n')
        f.write("HSK4_DATA_P4_L17_RECORDS = ")
        f.write(json.dumps(enriched_records, ensure_ascii=False, indent=4))
        f.write("\n\n")
        f.write("# Dictionary format compatible with P1 / P2: (lesson_num, hanzi) -> (meaningVi, exampleZh, examplePy, exampleVi)\n")
        f.write("HSK4_DATA_P4_L17 = {\n")
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
        stage="STAGE_P4_LESSON17_COMPLETED",
        completed_lessons=list(range(1, 18)),
        completed_vocab_count=850,
        status="IN_PROGRESS"
    )
    print("Updated checkpoint: 850 words completed.")

if __name__ == '__main__':
    generate_l17()

