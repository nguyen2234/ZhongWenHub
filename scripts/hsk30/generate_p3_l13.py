# -*- coding: utf-8 -*-
"""
Generator and Validator for HSK 4 — Lesson 13 Vocabulary
LessonId: 227AFDAF-DA5C-431E-A82D-30FD5451E3DF
Lesson 13: 喝着茶看京剧 (50 words)
"""
import sys
import json
import hashlib
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

LESSON_ID = "227AFDAF-DA5C-431E-A82D-30FD5451E3DF"
LESSON_NUMBER = 13
LESSON_TITLE = "喝着茶看京剧"

# 50 words data dictionary: hanzi -> (meaningVi, exampleZh, examplePy, exampleVi, qaStatus)
L13_DEFINITIONS = {
    "不满": (
        "bất mãn, không hài lòng",
        "顾客对这家餐厅的服务态度表示强烈不满，要求经理出面道歉。",
        "Gùkè duì zhè jiā cāntīng de fúwù tàidu biǎoshì qiángliè bùmǎn, yāoqiú jīnglǐ chūmiàn dàoqiàn.",
        "Khách hàng bày tỏ sự bất mãn mạnh mẽ đối với thái độ phục vụ của nhà hàng này và yêu cầu quản lý ra mặt xin lỗi.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "举行": (
        "tổ chức (cuộc họp, buổi lễ, hoạt động)",
        "学校大礼堂今晚将举行一场别开生面的中外文化交流晚会。",
        "Xuéxiào dà lǐtáng jīnwǎn jiāng jǔxíng yì chǎng biékāishēngmiàn de zhōngwài wénhuà jiāoliú wǎnhuì.",
        "Hội trường lớn của trường tối nay sẽ tổ chức một đêm dạ hội giao lưu văn hóa Trung - ngoại vô cùng sinh động.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "交通": (
        "giao thông, việc đi lại",
        "随着城市地铁线路的不断完善，市民的日常交通变得越来越便捷。",
        "Suízhe chéngshì dìtiě xiànlù de búduàn wánshàn, shìmín de rìcháng jiāotōng biànde yuèláiyuè biànjié.",
        "Cùng với sự hoàn thiện không ngừng của các tuyến tàu điện ngầm đô thị, giao thông đi lại hằng ngày của người dân ngày càng thuận tiện.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "价钱": (
        "giá cả, giá tiền",
        "这件羊毛大衣不仅款式大方保暖，而且价钱非常实惠公道。",
        "Zhè jiàn yángmáo dàyī bùjǐn kuǎnshì dàfang bǎonuǎn, érqiě jiàqian fēicháng shíhuì gōngdao.",
        "Chiếc áo khoác dạ này không chỉ kiểu dáng trang nhã ấm áp mà giá tiền lại rất phải chăng, hợp lý.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "作用": (
        "tác dụng, vai trò, tác động",
        "适量饮用绿茶对促进人体消化和提神醒脑具有显著的作用。",
        "Shìliàng yǐnyòng lǜchá duì cùjìn réntǐ xiāohuà hé tíshén xǐngnǎo jùyǒu xiǎnzhù de zuòyòng.",
        "Uống trà xanh một lượng vừa phải có tác dụng rõ rệt trong việc thúc đẩy tiêu hóa và làm tinh thần tỉnh táo.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "假": (
        "giả, nhân tạo; kỳ nghỉ (nghỉ phép)",
        "在古玩市场购买艺术品时一定要仔细辨别真假，谨防上当受骗。",
        "Zài gǔwán shìchǎng gòumǎi yìshùpǐn shí yídìng yào zǐxì biànbié zhēnjiǎ, jǐnfáng shàngdàng shòupiàn.",
        "Khi mua đồ nghệ thuật ở chợ đồ cổ nhất định phải phân biệt thật giả cẩn thận, đề phòng bị lừa gạt.",
        "NEEDS_HUMAN_REVIEW"  # Polyphone: jiǎ (giả) / jià (nghỉ phép)
    ),
    "入学": (
        "nhập học, vào trường",
        "新生在办理完入学手续后，就可以正式领取学生证并安排入住宿舍。",
        "Xīnshēng zài bànlǐ wán rùxué shǒuxù hòu, jiù kěyǐ zhèngshì lǐngqǔ xuéshēngzhèng bìng ānpái rùzhù sùshè.",
        "Tân sinh viên sau khi hoàn tất thủ tục nhập học là có thể chính thức nhận thẻ sinh viên và được sắp xếp vào ở ký túc xá.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "再说": (
        "hơn nữa, vả lại; để sau hãy nói",
        "今天外面雨下得太大了，再说时间也晚了，我们改天再去茶馆吧。",
        "Jīntiān wàimiàn yǔ xià de tài dà le, zàishuō shíjiān yě wǎn le, wǒmen gǎitiān zài qù cháguǎn ba.",
        "Hôm nay trời mưa to quá, hơn nữa thời gian cũng muộn rồi, chúng ta đổi sang hôm khác hãy đến quán trà nhé.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "到底": (
        "rốt cuộc, cuối cùng",
        "这部京剧名段情节跌宕起伏，观众都想知道主人公到底有着怎样的命运。",
        "Zhè bù jīngjù míngduàn qíngjié diēdàng qǐfú, guānzhòng dōu xiǎng zhīdào zhǔréngōng dàodǐ yǒuzhe zěnyàng de mìngyùn.",
        "Trích đoạn kinh kịch nổi tiếng này tình tiết thăng trầm gay cấn, khán giả đều muốn biết rốt cuộc nhân vật chính có số phận như thế nào.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "动车": (
        "tàu cao tốc (tàu động lực phân tán)",
        "从北京乘坐动车前往天津只需半个多小时，极大地缩短了旅途时间。",
        "Cóng Běijīng chéngzuò dòngchē qiánwǎng Tiānjīn zhǐ xū bàn gè duō xiǎoshí, jídà de suōduǎn le lǚtú shíjiān.",
        "Từ Bắc Kinh đi tàu cao tốc đến Thiên Tân chỉ mất hơn nửa giờ đồng hồ, rút ngắn đáng kể thời gian chuyến đi.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "压": (
        "đè, ép, đè nặng",
        "沉重的工作和生活负担常常压得现代职场青年喘不过气来。",
        "Chénzhòng de gōngzuò hé shēnghuó fùdān chángcháng yā de xiàndài zhíchǎng qīngnián chuǎnbúguò qì lái.",
        "Gánh nặng công việc và cuộc sống trĩu nặng thường đè khiến thanh niên công sở hiện đại nghẹt thở.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "取消": (
        "hủy bỏ, bãi bỏ",
        "由于剧场设备出现突发电力故障，原定于今晚的京剧演出不得不遗憾取消。",
        "Yóuyú jùchǎng shèbèi chūxiàn tūfā diànlì gùzhàng, yuándìng yú jīnwǎn de jīngjù yǎnchū bùdébù yíhàn qǔxiāo.",
        "Do thiết bị nhà hát gặp sự cố mất điện đột xuất, buổi biểu diễn kinh kịch dự kiến tối nay đành phải tiếc nuối hủy bỏ.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "后悔": (
        "hối hận, ăn năn",
        "年轻时如果不好好珍惜宝贵的学习时光，将来老了一定会后悔莫及。",
        "Niánqīng shí rúguǒ bù hǎohāo zhēnxī bǎoguì de xuéxí shíguāng, jiānglái lǎo le yídìng huì hòuhuǐ mòjí.",
        "Thời trẻ nếu không biết trân trọng thời gian học tập quý báu, sau này về già nhất định sẽ hối hận không kịp.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "回信": (
        "hồi âm, viết thư trả lời",
        "收到老朋友从远方寄来的问候信件后，他当天下午就认真地写了回信。",
        "Shōudào lǎo péngyou cóng yuǎnfāng jì lái de wènhòu xìnjiàn hòu, tā dāngtiān xiàwǔ jiù rènzhēn de xiě le huíxìn.",
        "Sau khi nhận được thư thăm hỏi của người bạn cũ gửi từ phương xa, chiều hôm đó anh ấy đã cẩn thận viết thư hồi âm ngay.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "堵车": (
        "tắc đường, kẹt xe",
        "每逢下班晚高峰，城市环路主要路段总是不可避免地发生严重堵车。",
        "Měiféng xiàbān wǎngāofēng, chéngshì huánlù zhǔyào lùduàn zǒngshì bùkě bìmiǎn de fāshēng yánzhòng dǔchē.",
        "Mỗi khi vào giờ cao điểm tan tầm buổi chiều, các đoạn đường vành đai chính của thành phố luôn không tránh khỏi tình trạng kẹt xe nghiêm trọng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "大自然": (
        "thiên nhiên, tự nhiên",
        "远离喧闹的都市走进大自然，聆听鸟语花香能让人心情格外舒畅。",
        "Yuǎnlí xuānnào de dūshì zǒujìn dàzìrán, língtīng niǎoyǔ huāxiāng néng ràng rén xīnqíng géwài shūchàng.",
        "Rời xa chốn đô thị ồn ào bước vào thiên nhiên, lắng nghe tiếng chim hót ngắm hoa thơm khiến tâm trạng con người thư thái lạ thường.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "安排": (
        "sắp xếp, bố trí",
        "组委会已经为远道而来的各位专家学者妥善安排好了食宿和交通。",
        "Zǔwěihuì yǐjīng wèi yuǎndào ér lái de gèwèi zhuānjiā xuézhě tuǒshàn ānpái hǎo le shísù hé jiāotōng.",
        "Ban tổ chức đã sắp xếp chu đáo nơi ăn chốn ở và phương tiện đi lại cho các chuyên gia học giả từ phương xa đến.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "对面": (
        "đối diện, phía đối diện",
        "茶馆的正对面是一家历史悠久的老字号传统特色糕点铺。",
        "Cháguǎn de zhèng duìmiàn shì yì jiā lìshǐ yōujiǔ de lǎozìhào chuántǒng tèsè gāodiǎnpù.",
        "Ngay đối diện quán trà là một tiệm bánh ngọt đặc sản truyền thống có lịch sử lâu đời.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "左右": (
        "khoảng, chừng (ước lượng); trái phải",
        "我们相约在明天下午三点左右碰面，一起去大剧院欣赏京剧折子戏。",
        "Wǒmen xiāngyuē zài míngtiān xiàwǔ sān diǎn zuǒyòu pèngmiàn, yìqǐ qù dà jùyuàn xīnshǎng jīngjù zhézixì.",
        "Chúng tôi hẹn gặp nhau vào khoảng ba giờ chiều mai để cùng đến đại kịch viện thưởng thức các trích đoạn kinh kịch.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "幸福": (
        "hạnh phúc, an lành",
        "能在闲暇午后陪伴在父母身边品茶聊天，就是人生最实在的幸福。",
        "Néng zài xiánxiá wǔhòu péibàn zài fùmǔ shēnbiān pǐnchá liáotiān, jiù shì rénshēng zuì shízài de xìngfú.",
        "Có thể đồng hành bên cha mẹ vào buổi chiều thảnh thơi nhâm nhi tách trà trò chuyện chính là niềm hạnh phúc chân thực nhất của đời người.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "待": (
        "ở lại, lưu lại",
        "这次去北京出差，我打算在老城区多待几天，好好体验京味文化。",
        "Zhè cì qù Běijīng chūchāi, wǒ dǎsuàn zài lǎo chéngqū duō dāi jǐ tiān, hǎohāo tǐyàn jīngwèi wénhuà.",
        "Chuyến công tác Bắc Kinh lần này, tôi dự định ở lại khu phố cổ thêm vài ngày để trải nghiệm trọn vẹn nét văn hóa kinh kỳ.",
        "NEEDS_HUMAN_REVIEW"  # Polyphone: dāi (ở lại) vs dài (đãi ngộ, đối đãi)
    ),
    "感": (
        "cảm thấy, cảm giác, sự cảm nhận",
        "观摩这出传统历史戏剧时，观众们心中油然而生一种深沉的自豪感。",
        "Guānmó zhè chū chuántǒng lìshǐ xìjù shí, guānzhòngmen xīnzhōng yóurán ér shēng yì zhǒng shēnchén de zìháogǎn.",
        "Khi xem vở diễn lịch sử truyền thống này, trong lòng khán giả bất giác dâng trào một cảm giác tự hào sâu sắc.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "打败": (
        "đánh bại, chiến thắng đối thủ",
        "在戏剧武打场面中，英勇的武将凭借精湛武艺成功打败了来犯的敌军。",
        "Zài xìjù wǔdǎ chǎngmiàn zhōng, yīngyǒng de wǔjiàng píngjiè jīngzhàn wǔyì chénggōng dǎbài le láifàn de díjūn.",
        "Trong màn võ thuật của vở kịch, vị võ tướng dũng cảm nhờ võ nghệ cao cường đã đánh bại quân địch xâm lăng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "按": (
        "ấn, bấm, nhấn (nút, phím)",
        "进入电梯后，请轻按对应的楼层按钮并耐心等待电梯关门。",
        "Jìnrù diàntī hòu, qǐng qīng àn duìyìng de lóucéng ànniǔ bìng nàixīn děngdài diàntī guānmén.",
        "Sau khi vào thang máy, xin vui lòng bấm nhẹ nút tầng tương ứng và kiên nhẫn đợi cửa thang máy đóng lại.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "播放": (
        "phát sóng, phát nhạc, chiếu hình",
        "老茶馆的音响里正在循环播放着梅兰芳先生生前的经典京剧唱段。",
        "Lǎo cháguǎn de yīnxiǎng lǐ zhèngzài xúnhuán bōfàngzhe Méi Lánfāng xiānsheng shēngqián de jīngdiǎn jīngjù chàngduàn.",
        "Dàn âm thanh của quán trà cổ đang phát lặp đi lặp lại những đoạn xướng kinh kịch kinh điển sinh thời của nghệ sĩ Mai Lan Phương.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "敢": (
        "dám, can đảm",
        "只要你有克服困难的坚定决心，就没有什么不敢面对的挑战。",
        "Zhǐyào nǐ yǒu kèfú kùnnan de jiāndìng juéxīn, jiù méiyǒu shénme bù gǎn miànduì de tiǎozhàn.",
        "Chỉ cần bạn có quyết tâm kiên định vượt qua khó khăn thì không có thử thách nào là không dám đương đầu.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "无论": (
        "bất luận, dù cho, cho dù",
        "无论前方的求学道路多么曲折艰难，我们都应当持之以恒地奋勇前进。",
        "Wúlùn qiánfāng de qiúxué dàolù duōme qūzhé jiānnán, wǒmen dōu yīngdāng chízhīyǐhéng de fènyǒng qiánjìn.",
        "Bất luận con đường học vấn phía trước quanh co trắc trở thế nào, chúng ta đều nên kiên trì bền bỉ dũng cảm tiến bước.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "暂停": (
        "tạm dừng, tạm hoãn",
        "因受暴雨极端恶劣天气影响，风景区的所有户外索道设施暂时停止运营。",
        "Yīn shòu bàoyǔ jíduān èliè tiānqì yǐngxiǎng, fēngjǐngqū de suǒyǒu hùwài suǒdào shèshī zàntíng yíngyùn.",
        "Do ảnh hưởng của thời tiết mưa bão khắc nghiệt, toàn bộ hệ thống cáp treo ngoài trời của khu danh lam thắng cảnh tạm dừng vận hành.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "条件": (
        "điều kiện, tiêu chuẩn, hoàn cảnh",
        "这家文化艺术中心拥有先进的舞台音响设施，具备承办大型演出的优良条件。",
        "Zhè jiā wénhuà yìshù zhōngxīn yǒngyǒu xiānjìn de wǔtái yīnxiǎng shèshī, jùbèi chéngbàn dàxíng yǎnchū de yōuliáng tiáojiàn.",
        "Trung tâm văn hóa nghệ thuật này sở hữu thiết bị âm thanh sân khấu tiên tiến, hội đủ điều kiện tuyệt vời để tổ chức các buổi biểu diễn quy mô lớn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "正常": (
        "bình thường, quy chuẩn",
        "经过工程人员连夜抢修，剧场的电力供应系统目前已经全部恢复正常。",
        "Jīngguò gōngchéng rényuán liányè qiǎngxiū, jùchǎng de diànlì gōngyìng xìtǒng mùqián yǐjīng quánbù huīfù zhèngcháng.",
        "Qua một đêm nỗ lực sửa chữa của nhân viên kỹ thuật, hệ thống cấp điện của nhà hát hiện nay đã hoàn toàn khôi phục bình thường.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "汗": (
        "mồ hôi",
        "在炎热的夏日午后爬完长城，每个人身上都出了厚厚的一层热汗。",
        "Zài yánrè de xiàrì wǔhòu pá wán Chángchéng, měi gè rén shēnshang dōu chū le hòuhòu de yì céng rèhàn.",
        "Sau khi leo xong Vạn Lý Trường Thành vào buổi chiều hè oi bức, trên người ai nấy đều toát ra một lớp mồ hôi đầm đìa.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "游玩": (
        "vui chơi, du ngoạn, dạo chơi",
        "周末很多家长带着孩子来到颐和园游玩，感受中国古典园林的独特魅力。",
        "Zhōumò hěn duō jiāzhǎng dàizhe háizi láidào Yíhéyuán yóuwán, gǎnshòu Zhōngguó gǔdiǎn yuánlín de dútè mèilì.",
        "Cuối tuần nhiều phụ huynh đưa con cái đến Di Hòa Viên dạo chơi, cảm nhận nét quyến rũ độc đáo của vườn cảnh cổ điển Trung Hoa.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "爱情": (
        "tình yêu, ái tình",
        "传统戏曲经典《梁山伯与祝英台》歌颂了一段坚贞不渝的真挚爱情。",
        "Chuántǒng xìqǔ jīngdiǎn 《Liáng Shānbó yǔ Zhù Yīngtái》 gēsòng le yí duàn jiānzhēn bùyú de zhēnzhì àiqíng.",
        "Vở kịch truyền thống kinh điển 'Lương Sơn Bá - Chúc Anh Đài' ca ngợi một mối tình chân thành sắt son kiên định.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "甚至": (
        "thậm chí, ngay cả",
        "他对京剧艺术痴迷至极，甚至能一字不差地背诵好几出长篇大戏的戏词。",
        "Tā duì jīngjù yìshù chīmí zhìjí, shènzhì néng yí zì bú chà de bèisòng hǎojǐ chū chángpiān dàxì de xìcí.",
        "Anh ấy đam mê nghệ thuật kinh kịch tột độ, thậm chí có thể đọc thuộc lòng từng chữ lời thoại của mấy vở diễn lớn dài tập.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "皮鞋": (
        "giày da",
        "参加正式的外事商务宴会时，男士通常需要穿着得体的西服和干净的皮鞋。",
        "Cānjiā zhèngshì de wàishì shāngwù yànhuì shí, nánshì tōngcháng xūyào chuānzhuó détǐ de xīfú hé gānjìng de píxié.",
        "Khi tham gia yến tiệc ngoại giao thương mại trang trọng, phái nam thường cần mặc âu phục lịch sự và đi giày da sạch sẽ.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "短信": (
        "tin nhắn, tin nhắn SMS",
        "演出门票预订成功后，票务系统会立即给您的手机发送一条确认短信。",
        "Yǎnchū ménpiào yùdìng chénggōng hòu, piàowù xìtǒng huì lìjí gěi nín de shǒujī fāsòng yì tiáo quèrèn duǎnxìn.",
        "Sau khi đặt vé xem biểu diễn thành công, hệ thống bán vé sẽ lập tức gửi một tin nhắn xác nhận về điện thoại của quý khách.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "究竟": (
        "rốt cuộc, kết cục, thực chất",
        "科学家们通过大量的实地勘探，终于弄清了这处古建筑地质下沉的究竟原因。",
        "Kēxuéjiāmen tōngguò dàliàng de shídì kāntàn, zhōngyú nòngqīng le zhè chù gǔ jiànzhù dìzhì xiàchén de jiūjìng yuányīn.",
        "Các nhà khoa học qua nhiều đợt thăm dò thực địa rốt cuộc đã làm rõ nguyên nhân thực chất dẫn tới sụt lún địa chất của công trình cổ này.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "管": (
        "quản lý, trông coi, phụ trách",
        "作为剧场后勤主管，他每天主要管舞台布景的搭建和演职人员的后勤保障。",
        "Zuòwéi jùchǎng hòuqín zhǔguǎn, tā měitiān zhǔyào guǎn wǔtái bùjǐng de dājiàn hé yǎnzhí rényuán de hòuqín bǎozhàng.",
        "Với tư cách trưởng ban hậu cần nhà hát, mỗi ngày anh ấy chủ yếu phụ trách dựng bối cảnh sân khấu và đảm bảo hậu cần cho diễn viên, nhân viên.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "结账": (
        "thanh toán, tính tiền, kết toán",
        "品尝完茶馆的清茶和小吃后，他在前台结账并向服务员道谢。",
        "Pǐncháng wán cháguǎn de qīngchá hé xiǎochī hòu, tā zài qiántái jiézhàng bìng xiàng fúwùyuán dàoxiè.",
        "Sau khi thưởng thức trà thanh và đồ ăn vặt của quán trà, anh ấy ra quầy lễ tân thanh toán và cảm ơn nhân viên phục vụ.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "考生": (
        "thí sinh, người dự thi",
        "每年盛夏，数以万计的艺术类考生都会奔赴北京各大高校参加专业面试。",
        "Měinián shèngxià, shù yǐ wàn jì de yìshù lèi kǎoshēng dōu huì bēnfù Běijīng gè dà gāoxiào cānjiā zhuānyè miànshì.",
        "Mỗi độ giữa hè, hàng vạn thí sinh ngành nghệ thuật đều đổ về các trường đại học lớn ở Bắc Kinh để tham gia phỏng vấn chuyên môn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "自": (
        "kể từ, từ; tự mình",
        "自去年在老舍茶馆看过一场京剧表演后，他就深深爱上了这一门古老艺术。",
        "Zì qùnián zài Lǎoshě Cháguǎn kànguo yì chǎng jīngjù biǎoyǎn hòu, tā jiù shēnshēn àishàng le zhè yì mén gǔlǎo yìshù.",
        "Kể từ sau khi xem một buổi diễn kinh kịch tại Quán trà Lão Xá năm ngoái, anh ấy đã say mê sâu sắc môn nghệ thuật cổ kính này.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "街道": (
        "đường phố, phố xá",
        "北京胡同周围的古老街道干净整洁，两侧种满了高大挺拔的国槐树。",
        "Běijīng hútòng zhōuwéi de gǔlǎo jiēdào gānjìng zhěngjié, liǎngcè zhòngmǎn le gāodà tǐngbá de guóhuáishù.",
        "Những con đường cổ kính xung quanh ngõ hẻm Bắc Kinh sạch sẽ ngăn nắp, hai bên đường trồng đầy những hàng cây hòe cao vút.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "讨厌": (
        "ghét, phiền phức, khó chịu",
        "在安静的剧场内观看演出时，大声喧哗和随意接打电话是最令人讨厌的行为。",
        "Zài ānjìng de jùchǎng nèi guānkàn yǎnchū shí, dàshēng xuānhuá hé suíyì jiēdǎ diànhuà shì zuì lìng rén tǎoyàn de xíngwéi.",
        "Khi xem biểu diễn trong nhà hát yên tĩnh, nói to ồn ào và tự ý nghe gọi điện thoại là những hành vi đáng ghét nhất.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "调查": (
        "điều tra, khảo sát",
        "文化研究所开展了一项问卷调查，以了解当下年轻群体对传统戏曲的兴趣偏好。",
        "Wénhuà yánjiūsuǒ kāizhǎn le yí xiàng wènjuàn diàochá, yǐ liǎojiě dāngxià niánqīng qúntǐ duì chuántǒng xìqǔ de xìngqù piānhào.",
        "Viện nghiên cứu văn hóa đã triển khai một cuộc điều tra bằng bảng hỏi để tìm hiểu sở thích của giới trẻ hiện nay đối với hí khúc truyền thống.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "超过": (
        "vượt quá, vượt hơn",
        "这部经典京剧大戏的巡回演出场次目前已经累计超过了一千场。",
        "Zhè bù jīngdiǎn jīngjù dàxì de xúnhuí yǎnchū chǎngcì mùqián yǐjīng lěijì chāoguò le yìqiān chǎng.",
        "Số buổi lưu diễn của vở đại kịch kinh điển này hiện nay đã tích lũy vượt quá một nghìn buổi.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "进行": (
        "tiến hành, thực hiện",
        "全体演职人员正在舞台后台紧张有序地进行演出前的最后一次彩排。",
        "Quántǐ yǎnzhí rényuán zhèngzài wǔtái hòutái jǐnzhāng yǒuxù de jìnxíng yǎnchū qián de zuìhòu yí cì cǎipái.",
        "Toàn thể diễn viên và nhân viên đang khẩn trương tiến hành buổi tổng duyệt cuối cùng trước giờ diễn ở hậu trường sân khấu.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "酸奶": (
        "sữa chua",
        "老北京传统瓷瓶酸奶口感浓郁醇厚，是深受中外游客喜爱的风味小吃。",
        "Lǎo Běijīng chuántǒng cípíng suānnǎi kǒugǎn nóngyù chúnhòu, shì shēnshòu zhōngwài yóukè xǐ'ài de fēngwèi xiǎochī.",
        "Sữa chua lọ sứ truyền thống Bắc Kinh vị đậm đà thơm ngậy, là món ăn vặt được du khách trong và ngoài nước rất ưa chuộng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "降价": (
        "giảm giá, hạ giá",
        "为了迎接传统戏曲文化节，各大剧场纷纷对学生票和团体票实行大幅降价优惠。",
        "Wèile yíngjiē chuántǒng xìqǔ wénhuàjié, gè dà jùchǎng fēnfēn duì xuéshēngpiào hé tuántǐpiào shíxíng dàfú jiàngjià yōuhuì.",
        "Để chào mừng lễ hội văn hóa hí khúc truyền thống, các đại kịch viện đua nhau thực hiện ưu đãi giảm giá mạnh cho vé sinh viên và vé đoàn thể.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "顺便": (
        "tiện thể, nhân tiện",
        "你下班回家的路上，请顺便在街口的特产店买一盒正宗的西湖龙井绿茶。",
        "Nǐ xiàbān huíjiā de lùshang, qǐng shùnbiàn zài jiēkǒu de tèchǎndiàn mǎi yì hé zhèngzōng de Xīhú Lóngjǐng lǜchá.",
        "Trên đường tan làm về nhà, bạn nhân tiện ghé tiệm đặc sản đầu phố mua một hộp trà xanh Long Tỉnh Tây Hồ chính hiệu nhé.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "高温": (
        "nhiệt độ cao, thời tiết nắng nóng",
        "面对持续数日的高温酷暑天气，气象部门及时发布了红色预警信号。",
        "Miànduì chíxù shù rì de gāowēn kùshǔ tiānqì, qìxiàng bùmén jíshí fābù le hóngsè yùjǐng xìnhào.",
        "Đối mặt với đợt thời tiết nắng nóng gay gắt kéo dài nhiều ngày, cơ quan khí tượng đã kịp thời phát đi tín hiệu cảnh báo màu đỏ.",
        "LINGUISTICALLY_REVIEWED_AI"
    )
}

def generate():
    raw_path = Path("data/hsk30/staging/dev_hsk4_vocab_raw.json")
    with open(raw_path, "r", encoding="utf-8") as f:
        raw_vocab = json.load(f)

    l13_raw = [w for w in raw_vocab if w["lessonNumber"] == LESSON_NUMBER]
    assert len(l13_raw) == 50, f"Expected 50 raw words for L13, got {len(l13_raw)}"

    records = []
    missing = []
    for item in l13_raw:
        hanzi = item["hanzi"]
        dev_id = item["devId"]
        if hanzi not in L13_DEFINITIONS:
            missing.append(hanzi)
            continue
        meaning, ex_zh, ex_py, ex_vi, qa_status = L13_DEFINITIONS[hanzi]
        records.append({
            "devId": dev_id,
            "lessonId": LESSON_ID,
            "lessonNumber": LESSON_NUMBER,
            "hanzi": hanzi,
            "pinyin": item["pinyin"],
            "meaningVi": meaning,
            "exampleZh": ex_zh,
            "examplePy": ex_py,
            "exampleVi": ex_vi,
            "qaStatus": qa_status,
            "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
        })

    if missing:
        print(f"Error: Missing definitions for: {missing}")
        return False

    assert len(records) == 50, f"Expected 50 records, got {len(records)}"

    out_py_path = Path("scripts/hsk30/hsk4_vocab_data_p3_l13.py")
    with open(out_py_path, "w", encoding="utf-8") as f:
        f.write("# -*- coding: utf-8 -*-\n")
        f.write('"""\nHSK 4 Vocabulary Data — Part 3: Lesson 13 (50 words)\n')
        f.write(f'LessonId: {LESSON_ID}\nLesson Title: {LESSON_TITLE}\n"""\n\n')
        f.write(f'LESSON_ID = "{LESSON_ID}"\n')
        f.write(f'LESSON_NUMBER = {LESSON_NUMBER}\n')
        f.write(f'LESSON_TITLE = "{LESSON_TITLE}"\n\n')
        f.write("HSK4_DATA_P3_L13_RECORDS = ")
        f.write(json.dumps(records, ensure_ascii=False, indent=4))
        f.write("\n\n")
        f.write("# Dictionary format compatible with P1 / P2: (lesson_num, hanzi) -> (meaningVi, exampleZh, examplePy, exampleVi)\n")
        f.write("HSK4_DATA_P3_L13 = {\n")
        for item in records:
            m = item["meaningVi"].replace('"', '\\"')
            ezh = item["exampleZh"].replace('"', '\\"')
            epy = item["examplePy"].replace('"', '\\"')
            evi = item["exampleVi"].replace('"', '\\"')
            f.write(f'    ({item["lessonNumber"]}, "{item["hanzi"]}"): ("{m}", "{ezh}", "{epy}", "{evi}"),\n')
        f.write("}\n")

    sha256 = hashlib.sha256(open(out_py_path, "rb").read()).hexdigest()
    print(f"Successfully generated {out_py_path} (50 words, SHA256: {sha256})")
    return True

if __name__ == "__main__":
    if generate():
        print("Lesson 13 generation completed cleanly.")
    else:
        sys.exit(1)
