# -*- coding: utf-8 -*-
"""
Generator and Validator for HSK 4 — Lesson 16 Vocabulary
LessonId: DCCB7E43-12FA-4FCD-BE98-C11A21D006B6
Lesson 16: 文化交流的桥梁 (50 words)
"""
import sys
import json
import hashlib
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

LESSON_ID = "DCCB7E43-12FA-4FCD-BE98-C11A21D006B6"
LESSON_NUMBER = 16
LESSON_TITLE = "文化交流的桥梁"

L16_DEFINITIONS = {
    "不过": (
        "tuy nhiên, nhưng mà, chẳng qua là",
        "学习一门外语确实不容易，不过只要坚持每天练习，就一定能取得进步。",
        "Xuéxí yì mén wàiyǔ quèshí bù róngyì, búguò zhǐyào jiānchí měitiān liànxí, jiù yídìng néng qǔdé jìnbù.",
        "Học một ngoại ngữ quả thực không dễ dàng, tuy nhiên chỉ cần kiên trì luyện tập mỗi ngày thì nhất định sẽ tiến bộ.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "之前": (
        "trước khi, trước đây",
        "在正式走出国门留学之前，他已经做好了充分的跨文化适应准备。",
        "Zài zhèngshì zǒu chū guómén liúxué zhīqián, tā yǐjīng zuò hǎo le chōngfèn de kuà-wénhuà shìyìng zhǔnbèi.",
        "Trước khi chính thức bước ra nước ngoài du học, cậu ấy đã chuẩn bị đầy đủ cho việc thích nghi đa văn hóa.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "亮": (
        "sáng, sáng sủa, soi sáng",
        "夜幕降临，两岸五彩斑斓的景观灯同时亮了起来，把整条江面照得宛如白昼。",
        "Yèmù jiànglín, liǎng'àn wǔcǎi-bānlán de jǐngguāndēng tóngshí liàng le qǐlai, bǎ zhěng tiáo jiāngmiàn zhào de wǎnrú báizhòu.",
        "Màn đêm buông xuống, những ngọn đèn cảnh quan rực rỡ hai bên bờ đồng loạt sáng bừng lên, soi sáng toàn bộ mặt sông như ban ngày.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "份": (
        "phần, bản, suất (lượng từ cho tài liệu, báo chí, quà tặng)",
        "为了参加这次国际文化论坛，他精心准备了一份内容详实的学术演讲提纲。",
        "Wèile cānjiā zhè cì guójì wénhuà lùntán, tā jīngxīn zhǔnbèi le yí fèn nèiróng xiángshí de xuéshù yǎnjiǎng tígāng.",
        "Để tham gia diễn đàn văn hóa quốc tế lần này, anh ấy đã chuẩn bị chu đáo một bản đề cương bài phát biểu học thuật với nội dung phong phú xác thực.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "使用": (
        "sử dụng, dùng, áp dụng",
        "在全球化交流中，熟练使用多种语言能够帮助人们消除沟通上的隔阂。",
        "Zài quánqiúhuà jiāoliú zhōng, shúliàn shǐyòng duō zhǒng yǔyán nénggòu bāngzhù rénmen xiāochú gōutōng shang de géhé.",
        "Trong giao lưu toàn cầu hóa, việc sử dụng thành thạo nhiều ngôn ngữ có thể giúp mọi người xóa bỏ những rào cản ngăn cách trong giao tiếp.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "做法": (
        "cách làm, phương pháp làm, cách xử lý",
        "通过举办民间艺术节来推动两国文化交流，是一种非常受大众欢迎的生动做法。",
        "Tōngguò jǔbàn mínjiān yìshùjié lái tuīdòng liǎng guó wénhuà jiāoliú, shì yì zhǒng fēicháng shòu dàzhòng huānyíng de shēngdòng zuòfǎ.",
        "Thông qua việc tổ chức lễ hội nghệ thuật dân gian để thúc đẩy giao lưu văn hóa hai nước là một cách làm sinh động được đông đảo quần chúng hoan nghênh.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "全身": (
        "toàn thân, toàn bộ cơ thể",
        "他全神贯注地投入到民乐演奏中，随着乐曲的旋律全身心都沉浸在艺术之美中。",
        "Tā quánshén-guànzhù de tóurù dào mínyuè yǎnzòu zhōng, suízhe yuèqǔ de xuánlǜ quánshēnxīn dōu chénjìn zài yìshù zhī měi zhōng.",
        "Anh ấy toàn tâm toàn ý hòa mình vào buổi biểu diễn nhạc dân tộc, theo từng giai điệu của bản nhạc mà toàn thân và tâm hồn đều đắm chìm trong vẻ đẹp nghệ thuật.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "准": (
        "chuẩn, chính xác; cho phép",
        "这位外国留学生的普通话发音特别标准，听起来就像土生土长的中国人一样。",
        "Zhè wèi wàiguó liúxuéshēng de Pǔtōnghuà fāyīn tèbié biāozhǔn, tīng qǐlai jiù xiàng tǔshēng-tǔzhǎng de Zhōngguórén yíyàng.",
        "Phát âm tiếng phổ thông của bạn lưu học sinh nước ngoài này vô cùng chuẩn, nghe như thể một người Trung Quốc sinh ra và lớn lên tại bản địa.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "前方": (
        "phía trước, đằng trước",
        "文化交流的大门已经敞开，展现在我们前方的将是一片更加广阔的世界舞台。",
        "Wénhuà jiāoliú de dàmén yǐjīng chǎngkāi, zhǎnxiàn zài wǒmen qiánfāng de jiāng shì yí piàn gèngjiā guǎngkuò de shìjiè wǔtái.",
        "Cánh cửa giao lưu văn hóa đã mở rộng, hiện ra trước mắt chúng ta sẽ là một vũ đài thế giới càng thêm bao la rộng lớn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "区": (
        "khu, khu vực, vùng",
        "这个跨国博览会特意设立了东方文化体验区，吸引了成千上万的中外游客前来打卡。",
        "Zhè gè kuàguó bólǎnhuì tèyì shèlì le dōngfāng wénhuà tǐyànqū, xīyǐn le chéngqiān-shàngwàn de zhōngwài yóukè qiánlái dǎkǎ.",
        "Hội chợ triển lãm đa quốc gia này đặc biệt thiết lập khu trải nghiệm văn hóa phương Đông, thu hút hàng ngàn du khách trong và ngoài nước đến tham quan.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "厚": (
        "dày; sâu sắc, thâm hậu",
        "这本书系统介绍了中国传统建筑文化，拿在手里沉甸甸的，内容十分厚实丰富。",
        "Zhè běn shū xìtǒng jièshào le Zhōngguó chuántǒng jiànzhù wénhuà, ná zài shǒuli chéndiāndiān de, nèiróng shífēn hòushi fēngfù.",
        "Cuốn sách này giới thiệu có hệ thống về văn hóa kiến trúc truyền thống Trung Hoa, cầm trên tay nặng trịch, nội dung vô cùng dày dặn và phong phú.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "口语": (
        "khẩu ngữ, ngôn ngữ nói",
        "想要提高中文口语表达水平，最好的捷径就是勇敢多与中国朋友面对面交流。",
        "Xiǎng yào tígāo Zhōngwén kǒuyǔ biǎodá shuǐpíng, zuì hǎo de jiéjìng jiù shì yǒnggǎn duō yǔ Zhōngguó péngyou miànduìmiàn jiāoliú.",
        "Muốn nâng cao trình độ diễn đạt khẩu ngữ tiếng Trung, đường tắt tốt nhất chính là dũng cảm giao tiếp trực tiếp thật nhiều với những người bạn Trung Quốc.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "听力": (
        "kỹ năng nghe, thính lực",
        "每天早晨坚持收听半小时中文新闻广播，能够迅速提升你的汉语听力理解能力。",
        "Měitiān zǎochen jiānchí shōutīng bàn xiǎoshí Zhōngwén xīnwén guǎngbō, nénggòu xùnsù tíshēng nǐ de Hànyǔ tīnglì lǐjiě nénglì.",
        "Mỗi buổi sáng kiên trì nghe nửa tiếng chương trình phát thanh tin tức tiếng Trung có thể nâng cao nhanh chóng năng lực nghe hiểu tiếng Hán của bạn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "因此": (
        "do đó, vì vậy, bởi thế",
        "中西方文化背景存在显著差异，因此在国际商务跨文化沟通中更需要互相包容。",
        "Zhōng-xīfāng wénhuà bèijǐng cúnzài xiǎnzhù chāyì, yīncǐ zài guójì shāngwù kuà-wénhuà gōutōng zhōng gèng xūyào hùxiāng bāoróng.",
        "Bối cảnh văn hóa Trung - phương Tây tồn tại sự khác biệt rõ rệt, do đó trong giao tiếp đa văn hóa thương mại quốc tế càng cần bao dung lẫn nhau.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "增加": (
        "tăng thêm, gia tăng",
        "举办国际留学生文化节，有力地增加了各国青年学者之间的了解与深厚友谊。",
        "Jǔbàn guójì liúxuéshēng wénhuàjié, yǒulì de zēngjiā le gè guó qīngnián xuézhě zhījiān de liǎojiě yǔ shēnhòu yǒuyì.",
        "Việc tổ chức ngày hội văn hóa lưu học sinh quốc tế đã tăng cường mạnh mẽ sự hiểu biết và tình bạn sâu sắc giữa các học giả trẻ của các quốc gia.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "失去": (
        "mất mát, đánh mất",
        "如果一个民族丢弃了自己的优秀传统文化，就等于失去了精神命脉和立身之本。",
        "Rúguǒ yí gè mínzú diūqì le zìjǐ de yōuxiù chuántǒng wénhuà, jiù děngyú shīqù le jīngshén mìngmài hé lìshēn zhī běn.",
        "Nếu một dân tộc vứt bỏ đi văn hóa truyền thống ưu tú của chính mình thì coi như đã đánh mất huyết mạch tinh thần và cội rễ lập thân.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "定": (
        "định, xác định, quyết định",
        "我们团队经过商议，将下一次跨文化研讨会的举办日期定在了下个月十五号。",
        "Wǒmen tuánduì jīngguò shāngyì, jiāng xià yí cì kuà-wénhuà yántǎohuì de jǔbàn rìqī dìng zài le xià gè yuè shíwǔ hào.",
        "Nhóm chúng tôi sau khi bàn bạc đã ấn định ngày tổ chức hội thảo đa văn hóa lần tới vào ngày 15 tháng sau.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "将来": (
        "tương lai, sau này",
        "她希望将来能够成为一名优秀的文化传播使者，架起中外文明互鉴的友谊之桥。",
        "Tā xīwàng jiānglái nénggòu chéngwéi yì míng yōuxiù de wénhuà chuánbō shǐzhě, jià qǐ zhōngwài wénmíng hùjiàn de yǒuyì zhī qiáo.",
        "Cô ấy hy vọng tương lai có thể trở thành một sứ giả truyền bá văn hóa xuất sắc, bắc nên nhịp cầu hữu nghị giao lưu học hỏi lẫn nhau giữa văn minh Trung - ngoại.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "差点儿": (
        "suýt nữa, suýt chút nữa",
        "由于机场安检排队人数过多，他今天早晨差点儿就错过了飞往北京的国际航班。",
        "Yóuyú jīchǎng ānjiǎn páiduì rénshù guò duō, tā jīntiān zǎochen chàdiǎnr jiù cuòguò le fēi wǎng Běijīng de guójì hángbān.",
        "Do số người xếp hàng qua cửa kiểm tra an ninh sân bay quá đông, sáng nay cậu ấy suýt chút nữa đã lỡ mất chuyến bay quốc tế đi Bắc Kinh.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "广播": (
        "phát thanh, đài phát thanh, phát sóng",
        "中央人民广播电台每天用多种语言向全世界广播中国的发展成就与文化魅力。",
        "Zhōngyāng Rénmín Guǎngbō Diàntái měitiān yòng duō zhǒng yǔyán xiàng quán shìjiè guǎngbō Zhōngguó de fāzhǎn chéngjiù yǔ wénhuà mèilì.",
        "Đài Tiếng nói Nhân dân Trung ương mỗi ngày dùng nhiều thứ tiếng phát thanh ra toàn thế giới về thành tựu phát triển và sức hút văn hóa của Trung Quốc.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "心": (
        "tâm, trái tim, tấm lòng",
        "文明交流最重要的是将心比心，真诚对待每一种异国文化的不同风俗习惯。",
        "Wénmíng jiāoliú zuì zhòngyào de shì jiāngxīnbǐxīn, zhēnchéng duìdài měi yì zhǒng yìguó wénhuà de bùtóng fēngsú xíguàn.",
        "Giao lưu văn minh điều quan trọng nhất là lấy lòng suy lòng, đối xử chân thành với phong tục tập quán khác nhau của từng nền văn hóa ngoại quốc.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "感受": (
        "cảm nhận, trải nghiệm cảm xúc",
        "通过亲手学包中国饺子，外国朋友们深切感受到了浓厚的中国春节家庭年味。",
        "Tōngguò qīnshǒu xué bāo Zhōngguó jiǎozi, wàiguó péngyoumen shēnqiè gǎnshòu dào le nónghòu de Zhōngguó Chūnjié jiātíng niánwèi.",
        "Thông qua việc tự tay học gói sủi cảo Trung Quốc, những người bạn nước ngoài đã cảm nhận sâu sắc phong vị Tết gia đình ấm cúng đậm đà của Trung Quốc.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "扫码": (
        "quét mã (mã QR, mã vạch)",
        "在中国各大城市的景区和餐厅，外国游客只需用手机扫码就能轻松完成在线支付。",
        "Zài Zhōngguó gè dà chéngshì de jǐngqū hé cāntīng, wàiguó yóukè zhǐ xū yòng shǒujī sǎomǎ jiù néng qīngsōng wánchéng zàixiàn zhīfù.",
        "Tại các khu danh thắng và nhà hàng ở các thành phố lớn Trung Quốc, du khách nước ngoài chỉ cần dùng điện thoại quét mã là có thể dễ dàng thanh toán trực tuyến.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "换乘": (
        "chuyển tuyến, đổi chuyến (tàu xe, phương tiện)",
        "从首都机场前往国家大剧院，您可以乘坐机场快轨然后在市中心换乘一号线地铁。",
        "Cóng Shǒudū Jīchǎng qiánwǎng Guójiā Dà Jùyuàn, nín kěyǐ chéngzuò jīchǎng kuàiguǐ ránhòu zài shìzhōngxīn huànchéng Yīhào Xiàn dìtiě.",
        "Từ sân bay Thủ đô đến Nhà hát Lớn Quốc gia, bạn có thể đi tuyến đường sắt nhanh sân bay sau đó đổi tuyến tàu điện ngầm tuyến số 1 tại trung tâm thành phố.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "支付": (
        "thanh toán, chi trả",
        "移动支付的普及给来华旅游和学习的外国友人提供了极其便利的现代化生活体验。",
        "Yídòng zhīfù de pǔjí gěi lái Huá lǚyóu hé xuéxí de wàiguó yǒurén tígōng le jíqí biànlì de xiàndàihuà shēnghuó tǐyàn.",
        "Sự phổ biến của thanh toán di động đã mang đến trải nghiệm đời sống hiện đại cực kỳ tiện lợi cho các bạn bè quốc tế sang Trung Quốc du lịch và học tập.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "数字": (
        "con số, kỹ thuật số",
        "随着数字技术的高速发展，故宫博物院将上万件珍贵文物制作成了线上数字展览。",
        "Suízhe shùzì jìshù de gāosù fāzhǎn, Gùgōng Bówùyuàn jiāng shàng wàn jiàn zhēnguì wénwù zhìzuò chéng le xiànshang shùzì zhǎnlǎn.",
        "Cùng với sự phát triển nhanh chóng của công nghệ kỹ thuật số, Viện bảo tàng Cố Cung đã dựng hàng vạn hiện vật quý giá thành triển lãm số trực tuyến.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "日子": (
        "ngày tháng, những ngày, cuộc sống",
        "在海外留学的日子里，每当逢年过节，留学生们都会聚在一起做家乡菜寄托思乡之情。",
        "Zài hǎiwài liúxué de rìzi lǐ, měi dāng féngnián-guòjié, liúxuéshēngmen dōu huì jù zài yìqǐ zuò jiāxiāng cài jìtuō sīxiāng zhī qíng.",
        "Trong những ngày tháng du học ở nước ngoài, mỗi khi đến dịp lễ tết, các bạn du học sinh đều tụ họp lại nấu món ăn quê hương để gửi gắm nỗi nhớ quê nhà.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "暖和": (
        "ấm áp, dễ chịu",
        "春天来了，微风吹在脸上感觉非常暖和，各所高校里的跨文化交流活动也活跃起来。",
        "Chūntiān lái le, wēifēng chuī zài liǎn shang gǎnjué fēicháng nuǎnhuo, gè suǒ gāoxiào lǐ de kuà-wénhuà jiāoliú huódòng yě huóyuè qǐlai.",
        "Mùa xuân đã đến, gió nhẹ thổi vào mặt cảm thấy rất đỗi ấm áp, các hoạt động giao lưu đa văn hóa trong các trường đại học cũng sôi nổi hẳn lên.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "果汁": (
        "nước ép trái cây, nước hoa quả",
        "招待来自各国的国际交流生时，志愿者们贴心地准备了新鲜的果汁和传统中国绿茶。",
        "Zhāodài láizì gè guó de guójì jiāoliúshēng shí, zhìyuànzhěmen tiēxīn de zhǔnbèi le xīnxiān de guǒzhī hé chuántǒng Zhōngguó lǜchá.",
        "Khi tiếp đãi các sinh viên giao lưu quốc tế đến từ các nước, các tình nguyện viên đã chu đáo chuẩn bị nước ép hoa quả tươi và trà xanh truyền thống Trung Quốc.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "此": (
        "này, đây (đại từ chỉ thị văn ngôn tương đương 这)",
        "文化交流旨在增进中外相互信任，以此为契机，双方在经贸教育领域展开了深度合作。",
        "Wénhuà jiāoliú zhǐ zài zēngjìn zhōngwài xiānghù xìnrèn, yǐ cǐ wéi qìjī, shuāngfāng zài jīngmào jiàoyù lǐngyù zhǎnkāi le shēndù hézuò.",
        "Giao lưu văn hóa nhằm tăng cường sự tin cậy lẫn nhau giữa Trung Quốc và nước ngoài, lấy đây làm cơ hội, hai bên đã mở rộng hợp tác sâu rộng trong các lĩnh vực kinh tế thương mại giáo dục.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "汤": (
        "canh, súp, nước dùng",
        "中国饮食讲究滋补养生，这道传统排骨冬瓜汤味道鲜美且营养极为丰富。",
        "Zhōngguó yǐnshí jiǎngjiu zībǔ yǎngshēng, zhè dào chuántǒng páigǔ dōngguātāng wèidào xiānměi qiě yíngyǎng jíwéi fēngfù.",
        "Ẩm thực Trung Quốc rất coi trọng bổ dưỡng dưỡng sinh, món canh sườn nấu bí đao truyền thống này hương vị thơm ngọt mà dinh dưỡng lại vô cùng phong phú.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "演出": (
        "biểu diễn, buổi biểu diễn",
        "来自各国的青年艺术家们同台献艺，为观众带来了一场精彩纷呈的多元文化演出。",
        "Láizì gè guó de qīngnián yìshùjiāmen tóng tái xiànyì, wèi guānzhòng dàilái le yì chǎng jīngcǎi fēnchéng de duōyuán wénhuà yǎnchū.",
        "Các nghệ sĩ trẻ đến từ nhiều quốc gia đã cùng nhau đứng chung sân khấu, mang đến cho khán giả một buổi biểu diễn đa văn hóa đặc sắc rực rỡ.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "父子": (
        "hai cha con (cha và con trai)",
        "这对来自德国的父子都对中国功夫十分着迷，特地来到少林寺拜师学艺。",
        "Zhè duì láizì Déguó de fùzǐ dōu duì Zhōngguó gōngfu shífēn zháomí, tèdì lái dào Shàolínsì bàishī xuéyì.",
        "Hai cha con người Đức này đều rất say mê võ thuật Trung Hoa, đã đặc biệt đến chùa Thiếu Lâm bái sư học nghệ.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "生命": (
        "sinh mệnh, sự sống",
        "文化是一座城市的独特生命与灵魂所在，保护历史遗产就是在延续城市的生命线。",
        "Wénhuà shì yí zuò chéngshì de dútè shēngmìng yǔ línghún suǒzài, bǎohù lìshǐ yíchǎn jiù shì zài yánxù chéngshì de shēngmìngxiàn.",
        "Văn hóa chính là sức sống và linh hồn độc đáo của một thành phố, bảo vệ di sản lịch sử chính là tiếp nối dòng chảy sinh mệnh của thành phố đó.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "目前": (
        "hiện nay, hiện tại, trước mắt",
        "目前已有来自全球一百多个国家和地区的留学生在这所百年名校就读深造。",
        "Mùqián yǐ yǒu láizì quánqiú yībǎi duō gè guójiā hé dìqū de liúxuéshēng zài zhè suǒ bǎinián míngxiào jiùdú shēnzào.",
        "Hiện nay đã có lưu học sinh đến từ hơn 100 quốc gia và vùng lãnh thổ trên thế giới đang theo học nâng cao tại ngôi trường danh tiếng trăm năm này.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "破": (
        "rách, vỡ, hỏng; phá vỡ",
        "通过真诚平等的文化对话，我们能够打破彼此之间的偏见与刻板印象。",
        "Tōngguò zhēnchéng píngděng de wénhuà duìhuà, wǒmen nénggòu dǎpò bǐcǐ zhījiān de piānjiàn yǔ kèbǎn yìnxiàng.",
        "Thông qua đối thoại văn hóa chân thành và bình đẳng, chúng ta có thể phá vỡ định kiến và ấn tượng rập khuôn lẫn nhau.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "空气": (
        "không khí, bầu không khí",
        "在多元文化交流夏令营的营地里，处处弥漫着欢声笑语和友谊融洽的轻松空气。",
        "Zài duōyuán wénhuà jiāoliú xiàlìngyíng de yíngdì lǐ, chùchù mímàn zhe huānshēng-xiàoyǔ hé yǒuyì róngqià de qīngsōng kōngqì.",
        "Trong khu trại hè giao lưu đa văn hóa, khắp nơi đều tràn ngập tiếng cười nói vui vẻ và bầu không khí thoải mái hòa hợp của tình bằng hữu.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "粗": (
        "thô, to; bất cẩn, sơ sài",
        "在翻译文学作品时切忌粗枝大叶，必须细致斟酌每一个词句背后的文化内涵。",
        "Zài fānyì wénxué zuòpǐn shí qièjì cūzhī-dàyè, bìxū xìzhì zhēnzhuó měi yí gè cíjù bèihòu de wénhuà nèihán.",
        "Khi dịch tác phẩm văn học chớ nên sơ sài cẩu thả, cần phải cân nhắc tỉ mỉ hàm ý văn hóa đằng sau mỗi câu mỗi chữ.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "缺少": (
        "thiếu, thiếu thốn, không đủ",
        "跨文化交流如果缺少了真诚与相互尊重，就很难实现心灵上的真正相通。",
        "Kuà-wénhuà jiāoliú rúguǒ quēshǎo le zhēnchéng yǔ xiānghù zūnzhòng, jiù hěn nán shíxiàn xīnlíng shang de zhēnzhèng xiāngtōng.",
        "Giao lưu đa văn hóa nếu thiếu đi sự chân thành và tôn trọng lẫn nhau thì rất khó đạt được sự đồng điệu thấu hiểu thực sự trong tâm hồn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "而": (
        "mà, và, lại (liên từ biểu thị kết nối hoặc tương phản)",
        "文化不是封闭孤立的，而是要在文明互鉴与交流融合中才能焕发出勃勃生机。",
        "Wénhuà bú shì fēngbì gūlì de, ér shì yào zài wénmíng hùjiàn yǔ jiāoliú rónghé zhōng cái néng huànfā chū bóbó shēngjī.",
        "Văn hóa không phải là thứ khép kín cô lập, mà phải thông qua học hỏi lẫn nhau và giao lưu hòa nhập giữa các nền văn minh thì mới tỏa sáng sức sống dạt dào.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "自学": (
        "tự học, tự nghiên cứu",
        "凭借强烈的兴趣，这位外国小伙自学了中国书法，如今写得一手漂亮的毛笔字。",
        "Píngjiè qiángliè de xìngqù, zhè wèi wàiguó xiǎohuǒ zìxué le Zhōngguó shūfǎ, rújīn xiě de yì shǒu piàoliang de máobǐzì.",
        "Nhờ vào niềm đam mê mãnh liệt, chàng trai ngoại quốc này đã tự học thư pháp Trung Hoa, nay viết được chữ thư pháp bút lông vô cùng đẹp mắt.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "表格": (
        "biểu mẫu, bảng biểu",
        "申请参加国际留学生文化交流项目的同学，请在截止日期前将电子表格发送到指定邮箱。",
        "Shēnqǐng cānjiā guójì liúxuéshēng wénhuà jiāoliú xiàngmù de tóngxué, qǐng zài jiézhǐ rìqī qián jiāng diànzǐ biǎogé fāsòng dào zhǐdìng yóuxiāng.",
        "Các bạn học sinh đăng ký tham gia chương trình giao lưu văn hóa lưu học sinh quốc tế xin vui lòng gửi biểu mẫu điện tử về hộp thư quy định trước ngày hạn chót.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "许多": (
        "nhiều, rất nhiều",
        "中国传统节日如中秋节和端午节，如今在世界许多国家都受到了当地居民的热烈欢迎。",
        "Zhōngguó chuántǒng jiérì rú Zhōngqiūjié hé Duānwǔjié, rújīn zài shìjiè xǔduō guójiā dōu shòudào le dāngdì jūmín de rèliè huānyíng.",
        "Các ngày lễ truyền thống Trung Quốc như Tết Trung thu và Tết Đoan ngọ ngày nay ở rất nhiều quốc gia trên thế giới đều nhận được sự chào đón nồng nhiệt của cư dân bản địa.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "负责人": (
        "người phụ trách, trưởng ban",
        "作为文化交流活动的负责人，她精心安排了每一场中外民间艺术对话会。",
        "Zuòwéi wénhuà jiāoliú huódòng de fùzérén, tā jīngxīn ānpái le měi yì chǎng zhōngwài mínjiān yìshù duìhuàhuì.",
        "Với tư cách là người phụ trách hoạt động giao lưu văn hóa, cô ấy đã sắp xếp chu đáo từng buổi tọa đàm nghệ thuật dân gian Trung - ngoại.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "路过": (
        "đi qua, đi ngang qua",
        "今天早晨路过国际文化交流中心时，大厅里正在举办精彩的中国茶艺表演。",
        "Jīntiān zǎochen lùguò guójì wénhuà jiāoliú zhōngxīn shí, dàtīng lǐ zhèngzài jǔbàn jīngcǎi de Zhōngguó cháyì biǎoyǎn.",
        "Sáng nay khi đi ngang qua trung tâm giao lưu văn hóa quốc tế, trong đại sảnh đang tổ chức buổi biểu diễn trà đạo Trung Quốc vô cùng đặc sắc.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "迟": (
        "muộn, trễ, chậm trễ",
        "即使因为国际时差原因邮件回复得稍迟了一些，双方的友好合作意愿依然没有丝毫减退。",
        "Jíshǐ yīnwèi guójì shíchā yuányīn yóujiàn huífù de shāo chí le yìxiē, shuāngfāng de yǒuhǎo hézuò yìyuàn yīrán méiyǒu sīháo jiǎntuì.",
        "Dù vì lý do chênh lệch múi giờ quốc tế mà email phản hồi hơi muộn một chút, nhưng thiện chí hợp tác hữu hảo của đôi bên vẫn không hề suy giảm mảy may.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "重": (
        "lại, làm lại lần nữa (chóng)",
        "为了在国际舞台上完美呈现这段传统京剧唱腔，演员们反复重练了数十次动作。",
        "Wèile zài guójì wǔtái shang wánměi chéngxiàn zhè duàn chuántǒng jīngjù chàngqiāng, yǎnyuánmen fǎnfù chóng liàn le shù shí cì dòngzuò.",
        "Để thể hiện hoàn mỹ đoạn làn điệu Kinh kịch truyền thống này trên sân khấu quốc tế, các diễn viên đã tập lại động tác hàng chục lần.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "降落": (
        "hạ cánh, tiếp đất",
        "载着二百多名外国留学生和文化代表团的包机，已于今晚七点安全降落在首都国际机场。",
        "Zài zhe èrbǎi duō míng wàiguó liúxuéshēng hé wénhuà dàibiǎotuán de bāojī, yǐ yú jīnwǎn qī diǎn ānquán jiàngluò zài Shǒudū Guójì Jīchǎng.",
        "Chuyến bay thuê bao chở hơn 200 lưu học sinh và đoàn đại biểu văn hóa nước ngoài đã hạ cánh an toàn xuống Sân bay Quốc tế Thủ đô vào 7 giờ tối nay.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "顾客": (
        "khách hàng, khách mua",
        "这家充满中国风情的手工艺品商店里，每天都有许多外国顾客挑选心仪的丝绸纪念品。",
        "Zhè jiā chōngmǎn Zhōngguó fēngqíng de shǒugōngyìpǐn shāngdiàn lǐ, měitiān dōu yǒu xǔduō wàiguó gùkè tiāoxuǎn xīnyí de sīchóu jìniànpǐn.",
        "Trong cửa hàng thủ công mỹ nghệ đậm phong vị Trung Hoa này, mỗi ngày đều có rất nhiều khách hàng nước ngoài đến lựa chọn đồ lưu niệm tơ lụa ưng ý.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "鲜": (
        "tươi, tươi mới, ngon (xiān)",
        "这里的西湖龙井新茶条索紧细、色泽翠绿，泡出来的茶汤香气清雅、滋味甘鲜。",
        "Zhèlǐ de Xīhú Lóngjǐng xīn chá tiáosuǒ jǐnxì, sèzé cuìlǜ, pào chūlai de chátāng xiāngqì qīngyǎ, zīwèi gānxiān.",
        "Trà Long Tỉnh Tây Hồ vụ mới ở đây búp trà bện chặt, sắc xanh biếc, nước trà pha ra hương thơm thanh nhã, vị ngọt tươi thanh mát.",
        "LINGUISTICALLY_REVIEWED_AI"
    )
}

def generate_l16():
    with open('data/hsk30/staging/dev_hsk4_vocab_raw.json', 'r', encoding='utf-8') as f:
        raw_vocab = json.load(f)

    l16_raw = [w for w in raw_vocab if w['lessonNumber'] == LESSON_NUMBER]
    assert len(l16_raw) == 50, f"Expected 50 raw words for L16, got {len(l16_raw)}"

    enriched_records = []
    for item in l16_raw:
        hanzi = item['hanzi']
        assert hanzi in L16_DEFINITIONS, f"Missing definition for '{hanzi}' in L16"
        meaning_vi, ex_zh, ex_py, ex_vi, qa_status = L16_DEFINITIONS[hanzi]

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

    out_file = Path("scripts/hsk30/hsk4_vocab_data_p4_l16.py")
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write("# -*- coding: utf-8 -*-\n")
        f.write('"""\nHSK 4 Vocabulary Data — Part 4: Lesson 16 (50 words)\n')
        f.write(f'LessonId: {LESSON_ID}\nLesson Title: {LESSON_TITLE}\n"""\n\n')
        f.write(f'LESSON_ID = "{LESSON_ID}"\n')
        f.write(f'LESSON_NUMBER = {LESSON_NUMBER}\n')
        f.write(f'LESSON_TITLE = "{LESSON_TITLE}"\n\n')
        f.write("HSK4_DATA_P4_L16_RECORDS = ")
        f.write(json.dumps(enriched_records, ensure_ascii=False, indent=4))
        f.write("\n\n")
        f.write("# Dictionary format compatible with P1 / P2: (lesson_num, hanzi) -> (meaningVi, exampleZh, examplePy, exampleVi)\n")
        f.write("HSK4_DATA_P4_L16 = {\n")
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
        stage="STAGE_P4_LESSON16_COMPLETED",
        completed_lessons=list(range(1, 17)),
        completed_vocab_count=800,
        status="IN_PROGRESS"
    )
    print("Updated checkpoint: 800 words completed.")

if __name__ == '__main__':
    generate_l16()

