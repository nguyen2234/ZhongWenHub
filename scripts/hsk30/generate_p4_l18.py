# -*- coding: utf-8 -*-
"""
Generator and Validator for HSK 4 — Lesson 18 Vocabulary
LessonId: DFC9EF62-0C15-4B46-9BC2-19DC2C0C5404
Lesson 18: 人与自然和谐相处 (50 words)
"""
import sys
import json
import hashlib
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

LESSON_ID = "DFC9EF62-0C15-4B46-9BC2-19DC2C0C5404"
LESSON_NUMBER = 18
LESSON_TITLE = "人与自然和谐相处"

L18_DEFINITIONS = {
    "专业": (
        "chuyên nghiệp, chuyên ngành, chuyên môn",
        "国家自然保护区配备了专业的野生动植物巡护团队，全天候守护森林生态。",
        "Guójiā zìrán bǎohùqū pèibèi le zhuānyè de yěshēng dòng-zhíwù xúnhù tuánduì, quántiānhòu shǒuhù sēnlín shēngtài.",
        "Khu bảo tồn thiên nhiên quốc gia được trang bị đội ngũ tuần tra động thực vật hoang dã chuyên nghiệp, ngày đêm canh giữ sinh thái rừng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "之间": (
        "giữa, ở giữa, trong khoảng",
        "人与自然之间应当保持和谐平衡的共生关系，过度索取必然遭到自然的惩罚。",
        "Rén yǔ zìrán zhījiān yīngdāng bǎochí héxié pínghéng de gòngshēng guānxì, guòdù suǒqǔ bìrán zāodào zìrán de chéngfá.",
        "Giữa con người và tự nhiên cần duy trì mối quan hệ cộng sinh hài hòa cân bằng, việc vắt kiệt quá mức ắt sẽ phải gánh chịu sự trừng phạt của tự nhiên.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "人员": (
        "nhân viên, cán bộ, nhân sự",
        "环保科研人员常年扎根在条件艰苦的高原湿地，开展珍稀鸟类的迁徙监测。",
        "Huánbǎo kēyán rényuán chángnián zhāgēn zài tiáojiàn jiānkǔ de gāoyuán shīdì, kāizhǎn zhēnxī niǎolèi de qiānxǐ jiāncè.",
        "Các nhân viên nghiên cứu bảo vệ môi trường quanh năm bám rễ tại vùng đất ngập nước cao nguyên gian khổ để triển khai quan trắc di cư của các loài chim quý hiếm.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "优秀": (
        "xuất sắc, ưu tú",
        "这位青年环保志愿者凭借出色的工作表现，荣获了全国优秀生态卫士荣誉称号。",
        "Zhè wèi qīngnián huánbǎo zhìyuànzhě píngjiè chūsè de gōngzuò biǎoxiàn, rónghuò le quánguó yōuxiù shēngtài wèishì róngyù chēnghào.",
        "Bạn tình nguyện viên bảo vệ môi trường trẻ tuổi này nhờ thành tích công tác xuất sắc đã vinh dự đạt danh hiệu Vệ sĩ sinh thái ưu tú toàn quốc.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "例如": (
        "ví dụ, chẳng hạn như (liên từ ví dụ)",
        "大自然给予了人类许多宝贵的启示，例如飞机机翼的设计就借鉴了鸟类飞行的空气动力学原理。",
        "Dàzìrán jǐyǔ le rénlèi xǔduō bǎoguì de qǐshì, lìrú fēijī jīyì de shèjì jiù jièjiàn le niǎolèi fēixíng de kōngqì dònglìxué yuánlǐ.",
        "Mẹ thiên nhiên ban tặng cho con người vô số gợi mở quý giá, chẳng hạn như thiết kế cánh máy bay đã học hỏi nguyên lý khí động học khi bay của loài chim.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "停止": (
        "ngừng, dừng lại, chấm dứt",
        "为了让过度捕捞的江河湖泊休养生息，国家决定在重点流域全面实行禁渔停止捕捞政策。",
        "Wèile ràng guòdù bǔlāo de jiānghé húpō xiūyǎng-shēngxī, guójiā juédìng zài zhòngdiǎn liúyù quánmiàn shíxíng jìnyú tíngzhǐ bǔlāo zhèngcè.",
        "Nhằm giúp các sông ngòi hồ đầm bị đánh bắt quá mức được nghỉ ngơi phục hồi, nhà nước quyết định thực hiện toàn diện chính sách cấm đánh bắt và ngừng đánh cá tại các lưu vực trọng điểm.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "全都": (
        "tất cả, toàn bộ đều",
        "参加植树造林活动的志愿者们热情高涨，半天时间就全都把树苗整整齐齐地栽好了。",
        "Cānjiā zhíshù zàolín huódòng de zhìyuànzhěmen rèqíng gāozhàng, bàn tiān shíjiān jiù quándōu bǎ shùmiáo zhěngzhěng-qíqí de zāi hǎo le.",
        "Các tình nguyện viên tham gia hoạt động trồng cây gây rừng nhiệt huyết dâng trào, chỉ trong nửa ngày đã trồng xong toàn bộ các cây non ngay ngắn thẳng hàng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "准确": (
        "chính xác, chuẩn xác",
        "气象卫星和生态遥感雷达能够准确预报沙尘暴的移动路径，为防灾减灾提供科学依据。",
        "Qìxiàng wèixīng hé shēngtài yáogǎn léidá nénggòu zhǔnquè yùbào shāchénbào de yídòng lùjìng, wèi fángzāi-jiǎnzāi tígōng kēxué yījù.",
        "Vệ tinh khí tượng và radar viễn thám sinh thái có thể dự báo chính xác đường di chuyển của bão cát, cung cấp căn cứ khoa học cho công tác phòng chống giảm nhẹ thiên tai.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "剩": (
        "thừa, còn lại",
        "全社会都在积极倡导节约粮食的理念，外出就餐时点菜要适量，吃剩的饭菜应当主动打包带走。",
        "Quán shèhuì dōu zài jījí chàngdǎo jiéyuē liángshi de lǐniàn, wàichū jiùcān shí diǎn cài yào shìliàng, chī shèng de fàncài yīngdāng zhǔdòng dǎbāo dài zǒu.",
        "Toàn xã hội đều đang tích cực tuyên truyền quan niệm tiết kiệm lương thực, khi đi ăn ngoài gọi món vừa phải, đồ ăn thức uống còn thừa nên chủ động đóng gói mang về.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "十分": (
        "vô cùng, rất, hết sức (phó từ mức độ)",
        "保护长江源头的生态水质对于保障下游数亿人口的饮水安全十分重要。",
        "Bǎohù Cháng Jiāng yuántóu de shēngtài shuǐzhì duìyú bǎozhàng xiàyóu shù yì rénkǒu de yǐnshuǐ ānquán shífēn zhòngyào.",
        "Bảo vệ chất lượng nước sinh thái tại đầu nguồn sông Trường Giang vô cùng quan trọng đối với việc bảo đảm an toàn nước uống cho hàng trăm triệu dân ở hạ lưu.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "原来": (
        "vốn dĩ, ban đầu; hóa ra",
        "经过持续多年的退耕还林，这片原本光秃秃的荒山如今已经变成了郁郁葱葱的林海。",
        "Jīngguò chíxù duō nián de tuì gēng huán lín, zhè piàn yuánlái guāngtūtū de huāngshān rújīn yǐjīng biànchéng le yùyù-cōngcōng de línhǎi.",
        "Trải qua nhiều năm kiên trì trả nương làm rừng, sườn núi hoang vốn dĩ trơ trụi ngày nay đã biến thành một biển rừng xanh tươi bạt ngàn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "另外": (
        "ngoài ra, hơn nữa, mặt khác",
        "除了严格限制工业污水直排以外，另外还要加快推进城市生活垃圾的减量化与分类回收。",
        "Chúle yángé xiànzhì gōngyè wūshuǐ zhípái yǐwài, lìngwài hái yào jiākuài tuījìn chéngshì shēnghuó lājī de jiǎnliànghuà yǔ fēnlèi huíshōu.",
        "Ngoài việc hạn chế nghiêm ngặt xả thải trực tiếp nước thải công nghiệp, mặt khác còn phải đẩy nhanh việc giảm lượng và phân loại thu gom rác thải sinh hoạt đô thị.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "吸引": (
        "thu hút, lôi cuốn, hấp dẫn",
        "国家湿地公园优美的自然风光和清新的空气，每年都吸引着数以百万计的游客前来休闲度假。",
        "Guójiā shīdì gōngyuán yōuměi de zìrán fēngguāng hé qīngxīn de kōngqì, měinián dōu xīyǐn zhe shù yǐ bǎiwàn jì de yóukè qiánlái xiūxián dùjià.",
        "Phong cảnh thiên nhiên tươi đẹp và bầu không khí trong lành của công viên đất ngập nước quốc gia hàng năm đều thu hút hàng triệu du khách đến nghỉ dưỡng thư giãn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "困难": (
        "khó khăn, trở ngại, gian nan",
        "在荒漠化极其严重的戈壁滩上植树造林，面临着缺水和风沙侵袭等重重巨大困难。",
        "Zài huāngmòhuà jíqí yánzhòng de gēbìtān shang zhíshù zàolín, miànlín zhe quēshuǐ hé fēngshā qīnxí děng chóngchóng jùdà kùnnan.",
        "Việc trồng cây gây rừng trên bãi cát sa mạc hóa cực kỳ nghiêm trọng đối mặt với vô vàn khó khăn to lớn như thiếu nước và bão cát xâm thực.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "复印": (
        "photo, sao chụp tài liệu",
        "开展环保法律法规普法进社区活动时，宣传志愿者提前复印了数百份图文并茂的宣传小册子。",
        "Kāizhǎn huánbǎo fǎlǜ fǎguī pǔfǎ jìn shèqū huódòng shí, xuānchuán zhìyuànzhě tíqián fùyìn le shù bǎi fèn túwén-bìngmào de xuānchuán xiǎocèzi.",
        "Khi triển khai hoạt động phổ biến pháp luật bảo vệ môi trường vào cộng đồng, các tình nguyện viên tuyên truyền đã photo sẵn hàng trăm cuốn cẩm nang hình ảnh sinh động.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "失败": (
        "thất bại, không thành công",
        "虽然初期培育耐旱植物品种的试验遭遇了数次失败，但科研人员毫不气馁，最终成功攻克了技术难关。",
        "Suīrán chūqī péiyù nàihàn zhíwù pǐnzhǒng de shìyàn zāoyù le shù cì shībài, dàn kēyán rényuán háo bù qìněi, zhōngyú chénggōng gōngkè le jìshù nánguān.",
        "Tuy thử nghiệm nhân giống thực vật chịu hạn thời kỳ đầu đã gặp thất bại vài lần, nhưng các nhà nghiên cứu không hề nản lòng, cuối cùng đã vượt qua ải kỹ thuật thành công.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "实际": (
        "thực tế, thực tiễn",
        "制定环境保护治理规划必须立足当地实际情况，因地制宜采取切合实效的生态修复方案。",
        "Zhìdìng huánjìng bǎohù zhìlǐ guīhuà bìxū lìzú dāngdì shíjì qíngkuàng, yīndì-zhìyí cǎiqǔ qièhé shíxiào de shēngtài xiūfù fāng'àn.",
        "Việc lập quy hoạch quản lý bảo vệ môi trường bắt buộc phải dựa trên tình hình thực tế địa phương, căn cứ vào điều kiện cụ thể để áp dụng phương án phục hồi sinh thái hiệu quả.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "尊重": (
        "tôn trọng, kính trọng",
        "人类必须深刻懂得尊重自然、顺应自然和保护自然，才是实现经济社会永续发展的根本之道。",
        "Rénlèi bìxū shēnkè dǒngde zūnzhòng zìrán, shùnyìng zìrán hé bǎohù zìrán, cái shì shíxiàn jīngjì shèhuì yǒngxù fāzhǎn de gēnběn zhī dào.",
        "Con người cần phải hiểu sâu sắc rằng việc tôn trọng tự nhiên, thuận theo tự nhiên và bảo vệ tự nhiên mới là con đường căn bản để phát triển kinh tế xã hội bền vững.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "市区": (
        "nội thành, khu vực đô thị",
        "为了改善市区空气质量，市政府大力推进城市绿道建设和新能源公共交通全覆盖。",
        "Wèile gǎishàn shìqū kōngqì zhìliàng, shì zhèngfǔ dàlì tuījìn chéngshì lǜdào jiànshè hé xīnnéngyuán gōnggòng jiāotōng quán fùgài.",
        "Nhằm cải thiện chất lượng không khí khu vực nội thành, chính quyền thành phố đã dốc sức thúc đẩy xây dựng các tuyến đường xanh đô thị và phủ sóng toàn bộ phương tiện công cộng năng lượng mới.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "应聘": (
        "ứng tuyển, dự tuyển (việc làm)",
        "几位充满理想抱负的环境科学专业应届毕业生，积极来到国家大熊猫公园应聘一线生态管护岗位。",
        "Jǐ wèi chōngmǎn lǐxiǎng bàofù de huánjìng kēxué zhuānyè yīngjiè bìyèshēng, jījí lái dào Guójiā Dàxióngmāo Gōngyuán yìngpìn yíxiàn shēngtài guǎnhù gǎngwèi.",
        "Mấy cử nhân mới tốt nghiệp chuyên ngành khoa học môi trường tràn đầy hoài bão lý tưởng đã hăng hái đến Công viên Gấu trúc Quốc gia để ứng tuyển các vị trí quản lý bảo vệ sinh thái tiền tuyến.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "快递": (
        "chuyển phát nhanh, bưu kiện nhanh",
        "物流行业全面推广可降解包装材料和环保循环箱，从源头减少快递包装产生的塑料垃圾污染。",
        "Wùliú hángyè quánmiàn tuīguǎng kějiàngjiě bāozhuāng cáiliào hé huánbǎo xúnhuánxiāng, cóng yuántóu jiǎnshǎo kuàidì bāozhuāng chǎnshēng de sùliào lājī wūrǎn.",
        "Ngành logistics đang đẩy mạnh ứng dụng toàn diện vật liệu đóng gói tự phân hủy và thùng tái sử dụng bảo vệ môi trường, nhằm giảm thiểu ô nhiễm rác nhựa từ bao bì chuyển phát nhanh ngay tại nguồn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "感觉": (
        "cảm giác, cảm thấy, nhận thấy",
        "漫步在负氧离子极其充裕的原始森林公园里，人们感觉全身身心舒畅、神清气爽。",
        "Mànbù zài fùyǎnglízǐ jíqí chōngyù de yuánshǐ sēnlín gōngyuán lǐ, rénmen gǎnjué quán shēn shēnxīn shūchàng, shénqīng-qìshuǎng.",
        "Dạo bước trong công viên rừng nguyên sinh ngập tràn ion oxy âm, mọi người cảm thấy toàn thân thư thái, tinh thần sảng khoái nhẹ nhõm.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "技术": (
        "kỹ thuật, công nghệ",
        "采用现代智能滴灌节水灌溉技术，使干旱缺水地区的农作物产量与水分利用率大幅提高。",
        "Cǎiyòng xiàndài zhìnéng dīguàn jiéshuǐ guàngài jìshù, shǐ gānhàn quēshuǐ dìqū de nóngzuòwù chǎnliàng yǔ shuǐfèn lìyònglǜ dàfú tígāo.",
        "Việc áp dụng công nghệ tưới nhỏ giọt thông minh tiết kiệm nước hiện đại đã giúp sản lượng cây trồng và hiệu suất sử dụng nước ở các vùng khô hạn thiếu nước tăng vọt.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "排": (
        "hàng, dãy; sắp xếp; xả (nước thải)",
        "在蜿蜒的小溪两旁，整整齐齐地生长着一排排茂密翠绿的天然垂柳与杨树。",
        "Zài wānyán de xiǎoxī liǎngpáng, zhěngzhěng-qíqí de shēngzhǎng zhe yì pái pái màomì cuìlǜ de tiānrán chuíliǔ yǔ yángshù.",
        "Hai bên bờ con suối nhỏ uốn lượn mọc lên từng hàng từng dãy liễu rủ và cây dương tự nhiên xanh biếc rậm rạp hết sức ngay ngắn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "收入": (
        "thu nhập, doanh thu",
        "发展乡村生态旅游不仅保护了青山绿水，而且切实带动了当地村民家庭年均收入的稳步提升。",
        "Fāzhǎn xiāngcūn shēngtài lǚyóu bùjǐn bǎohù le qīngshān-lǜshuǐ, érqiě qièshí dàidòng le dāngdì cūnmín jiātíng niánjūn shōurù de wěnbù tíshēng.",
        "Phát triển du lịch sinh thái nông thôn không những bảo vệ được núi xanh nước biếc mà còn thúc đẩy thu nhập bình quân năm của các hộ gia đình thôn dân bản địa tăng trưởng ổn định.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "敲": (
        "gõ, đánh (cửa, chuông)",
        "频发的极端极端恶劣天气灾害给全人类敲响了必须加快环境保护步伐的刺耳警钟。",
        "Pínfā de jíduān èliè tiānqì zāihài gěi quán rénlèi qiāoxiǎng le bìxū jiākuài huánjìng bǎohù bùfá de cì'ěr jǐngzhōng.",
        "Các thảm họa thời tiết cực đoan khắc nghiệt xảy ra liên tục đã gióng lên hồi chuông cảnh báo chói tai cho toàn thể nhân loại rằng phải đẩy nhanh bước chân bảo vệ môi trường.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "日期": (
        "ngày tháng, thời hạn",
        "联合国防沙治沙大会公布了下一阶段全球荒漠化治理考核与行动评估的具体截止日期。",
        "Liánhéguó Fángshā Zhìshā Dàhuì gōngbù le xià yí jiēduàn quánqiú huāngmòhuà zhìlǐ kǎohé yǔ xíngdòng pínggū de jùtǐ jiézhǐ rìqī.",
        "Đại hội phòng chống sa mạc hóa của Liên Hợp Quốc đã công bố ngày tháng hạn chót cụ thể cho việc kiểm tra và đánh giá hành động quản trị sa mạc hóa toàn cầu giai đoạn tiếp theo.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "最终": (
        "cuối cùng, kết cục",
        "经过全体科研人员数十年如一日的艰苦攻关，塞罕坝三代务林人最终创造了荒原变林海的绿色人间奇迹。",
        "Jīngguò quántǐ kēyán rényuán shù shí nián rú yí rì de jiānkǔ gōngguān, Sàihǎnbà sān dài wùlínrén zuìzhōng chuàngzào le huāngyuán biàn línhǎi de lǜsè rénjiān qíjì.",
        "Trải qua nhiều thập kỷ miệt mài vượt khó như một của toàn thể cán bộ nghiên cứu, ba thế hệ người làm rừng Saihanba cuối cùng đã tạo nên kỳ tích xanh nơi trần thế: biến hoang mạc thành rừng bạt ngàn.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "查看": (
        "xem xét, kiểm tra, tra cứu",
        "护林巡护员每天都要亲自步行深入林区深处，仔细查看红外野外相机拍摄记录的动物出没数据。",
        "Hùlín xúnhùyuán měitiān dōu yào qīnzì bùxíng shēnrù línqū shēnchù, zǐxì chákàn hóngwài yěwài xiàngjī pāishè jìlù de dòngwù chūmò shùjù.",
        "Nhân viên kiểm lâm tuần tra rừng mỗi ngày đều phải đích thân đi bộ sâu vào trong rừng, kiểm tra tỉ mỉ dữ liệu hoạt động của thú rừng do máy ảnh hồng ngoại ghi lại.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "此次": (
        "lần này, đợt này",
        "在此次联合国生物多样性公约缔约方大会上，各国代表共同签署了保护生态地球的联合宣言。",
        "Zài cǐ cì Liánhéguó Shēngwù Duōyàngxìng Gōngyuē Dìyuēfāng Dàhuì shang, gè guó dàibiǎo gòngtóng qiānshǔ le bǎohù shēngtài Dìqiú de liánhé xuānyán.",
        "Tại Hội nghị các bên tham gia Công ước Đa dạng Sinh học Liên Hợp Quốc lần này, đại diện các nước đã cùng ký kết tuyên bố chung về bảo vệ Trái đất sinh thái.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "油": (
        "dầu, mỡ, dầu mỏ (nhiên liệu)",
        "为了保护脆弱的近海湿地水质，港口管理部门严禁各类船只向海湾倾倒机油和生活废油。",
        "Wèile bǎohù cuìruò de jìnhǎi shīdì shuǐzhì, gǎngkǒu guǎnlǐ bùmén yánjìn gè lèi chuánzhī xiàng hǎiwān qīngdǎo jīyóu hé shēnghuó fèiyóu.",
        "Nhằm bảo vệ chất lượng nước đất ngập nước ven biển mong manh, cơ quan quản lý cảng nghiêm cấm mọi loại tàu bè đổ dầu máy và dầu thải sinh hoạt ra vịnh biển.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "演唱": (
        "ca hát, biểu diễn ca khúc",
        "在世界地球日环保公益晚会上，著名歌唱家深情演唱了那首赞美大自然母亲的经典环保歌曲。",
        "Zài Shìjiè Dìqiúrì huánbǎo gōngyì wǎnhuì shang, zhùmíng gēchàngjiā shēnqíng yǎnchàng le nà shǒu zànměi dàzìrán mǔqīn de jīngdiǎn huánbǎo gēqǔ.",
        "Trong đêm hội công ích bảo vệ môi trường Ngày Trái đất Thế giới, ca sĩ danh tiếng đã hát say sưa ca khúc kinh điển ca ngợi người mẹ thiên nhiên.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "片": (
        "mảnh, tấm, vạt (lượng từ cho đất đai, lá cây, khu rừng)",
        "在大家的悉心呵护下，村头那片原本面临沙化荒芜的河滩地如今已长满了青青绿草。",
        "Zài dàjiā de xīxīn hēhù xià, cūntóu nà piàn yuánběn miànlín shāhuà huāngwú de hétāndì rújīn yǐ zhǎngmǎn le qīngqīng lǜcǎo.",
        "Dưới sự chăm sóc chu đáo của mọi người, vạt đất bãi sông đầu thôn vốn đối mặt với hoang mạc cằn cỗi nay đã phủ kín một màu cỏ xanh tươi.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "用于": (
        "dùng vào, sử dụng cho",
        "中央财政拨出专项专项环保资金，专门用于支持长江流域珍稀濒危水生生物的抢救性保护工程。",
        "Zhōngyāng cáizhèng bō chū zhuānxiàng huánbǎo zījīn, zhuānmén yòngyú zhīchí Cháng Jiāng liúyù zhēnxī bīnwēi shuǐshēng shēngwù de qiǎngjiùxìng bǎohù gōngchéng.",
        "Ngân sách trung ương đã trích nguồn kinh phí bảo vệ môi trường chuyên biệt, dùng riêng cho việc hỗ trợ công trình bảo vệ khẩn cấp các loài thủy sinh quý hiếm có nguy cơ tuyệt chủng ở lưu vực sông Trường Giang.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "目的": (
        "mục đích, ý định",
        "建立国家自然保护区国家公园的核心目的，是为了给子孙后代留下一片最真实纯净的自然遗产。",
        "Jiànlì guójiā zìrán bǎohùqū guójiā gōngyuán de héxīn mùdì, shì wèile gěi zǐsūn-hòudài liú xià yí piàn zuì zhēnshí chúnjìng de zìrán yíchǎn.",
        "Mục đích cốt lõi của việc thành lập các công viên quốc gia khu bảo tồn thiên nhiên là nhằm để lại cho con cháu muôn đời sau một di sản tự nhiên chân thực và thuần khiết nhất.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "确实": (
        "thực sự, đích thực, quả thật",
        "大自然是一个相互依存、紧密联系的生命共同体，破坏任何一个生态链条确实都会引发连锁反应。",
        "Dàzìrán shì yí gè xiānghù yīcún, jǐnmì liánxì de shēngmìng gòngtóngtǐ, pòhuài rènhé yí gè shēngtài liàntiáo quèshí dōu huì yǐnfā liánsuǒ fǎnyìng.",
        "Mẹ thiên nhiên là một cộng đồng sinh mệnh nương tựa lẫn nhau và gắn kết chặt chẽ, việc phá hoại bất kỳ mắt xích sinh thái nào quả thực cũng đều sẽ kích hoạt phản ứng dây chuyền.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "窗户": (
        "cửa sổ (nhà cửa)",
        "推开清晨面向青山的窗户，扑面而来的是带着泥土与松针清香的湿润空气。",
        "Tuīkāi qīngchén miànxiàng qīngshān de chuānghu, pūmiàn'érlái de shì dài zhe nítǔ yǔ sōngzhēn qīngxiāng de shīrùn kōngqì.",
        "Đẩy cánh cửa sổ hướng ra núi biếc vào buổi sáng sớm, ùa vào mặt là luồng không khí ẩm mát mang theo hương thơm ngát của đất và lá thông.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "精彩": (
        "đặc sắc, tuyệt vời, xuất sắc",
        "这部自然地理纪录片展现了高原雪豹在悬崖峭壁间捕猎的精彩绝伦画面。",
        "Zhè bù zìrán dìlǐ jìlùpiàn zhǎnxiàn le gāoyuán xuěbào zài xuányá-qiàobì jiān bǔliè de jīngcǎi juélún huàmiàn.",
        "Bộ phim tài liệu địa lý tự nhiên này đã tái hiện những thước phim đặc sắc tuyệt đỉnh về cảnh báo tuyết cao nguyên săn mồi giữa các vách đá dựng đứng.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "网友": (
        "cư dân mạng, bạn trên mạng",
        "全国数千万热心网友通过手机在线认领树木，积极参与到阿拉善防沙治沙绿化公益项目中。",
        "Quánguó shù qiānwàn rèxīn wǎngyǒu tōngguò shǒujī zàixiàn rènlǐng shùmù, jījí cānyù dào Ālāshàn fángshā zhìshā lǜhuà gōngyì xiàngmù zhōng.",
        "Hàng chục triệu cư dân mạng nhiệt huyết trên cả nước thông qua điện thoại nhận cây trực tuyến, tích cực tham gia vào dự án công ích phủ xanh chống cát sa mạc Alashan.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "职业": (
        "nghề nghiệp, công việc chuyên môn",
        "野生动物摄影师是一份虽然充满危险但极具崇高价值的特殊生态保护职业。",
        "Yěshēng dòngwù shèyǐngshī shì yí fèn suīrán chōngmǎn wēixiǎn dàn jí jù chónggāo jiàzhí de tèshū shēngtài bǎohù zhíyè.",
        "Nhiếp ảnh gia động vật hoang dã là một nghề nghiệp bảo vệ sinh thái đặc thù tuy tràn đầy nguy hiểm nhưng mang giá trị vô cùng cao cả.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "至少": (
        "ít nhất, tối thiểu",
        "根据城市绿色发展规划，新建居住小区的绿化覆盖率至少应当达到百分之三十五以上。",
        "Gēnjù chéngshì lǜsè fāzhǎn guīhuà, xīnjiàn jūzhù xiǎoqū de lǜhuà fùgàilǜ zhìshǎo yīngdāng dádào bǎifēnzhī sānshíwǔ yǐshàng.",
        "Căn cứ vào quy hoạch phát triển xanh đô thị, tỷ lệ phủ xanh của các khu dân cư xây mới ít nhất phải đạt trên 35%.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "表示": (
        "bày tỏ, biểu thị, cho thấy",
        "联合国环境规划署高级官员在新闻发布会上明确表示，中国在生态文明建设方面取得了令世界瞩目的卓越成就。",
        "Liánhéguó Huánjìng Guīhuàshǔ gāojí guānyuán zài xīnwén fābùhuì shang míngquè biǎoshì, Zhōngguó zài shēngtài wénmíng jiànshè fāngmiàn qǔdé le lìng shìjiè zhǔmù de zhuóyuè chéngjiù.",
        "Quan chức cấp cao của Chương trình Môi trường Liên Hợp Quốc tại buổi họp báo đã bày tỏ rõ ràng rằng, Trung Quốc trong xây dựng văn minh sinh thái đã đạt được những thành tựu xuất sắc khiến toàn thế giới chú ý.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "证件": (
        "giấy tờ, chứng từ, giấy thông hành",
        "进入国家级自然核心保护区开展科研考察，必须提前报批并随身携带相关审核批准证件。",
        "Jìnrù guójiājí zìrán héxīn bǎohùqū kāizhǎn kēyán kǎochá, bìxū tíqián bàopī bìng suíshēn xiédài xiāngguān shěnhé pīzhǔn zhèngjiàn.",
        "Khi đi vào vùng lõi khu bảo tồn thiên nhiên cấp quốc gia để tiến hành khảo sát khoa học, bắt buộc phải xin duyệt trước và mang theo đầy đủ các giấy tờ phê duyệt liên quan bên mình.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "货": (
        "hàng, hàng hóa (huò)",
        "海关缉私部门严厉打击任何走私野生动物濒危物种制品的违法货物交易行为。",
        "Hǎiguān jīsī bùmén yánlì dǎjī rènhé zǒusī yěshēng dòngwù bīnwēi wùzhǒng zhìpǐn de wéifǎ huòwù jiāoyì xíngwéi.",
        "Cơ quan chống buôn lậu hải quan xử lý nghiêm khắc mọi hành vi giao dịch hàng hóa phi pháp buôn lậu các chế phẩm từ động vật hoang dã nguy cấp.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "身份证": (
        "chứng minh thư, thẻ căn cước công dân",
        "进入国家生态森林公园景区的游客，请配合工作人员出示居民身份证实行实名制验票入园。",
        "Jìnrù guójiā shēngtài sēnlín gōngyuán jǐngqū de yóukè, qǐng pèihé gōngzuò rényuán chūshì jūmín shēnfènzhèng shíxíng shímíngzhì yànpiào rùyuán.",
        "Du khách vào tham quan khu danh thắng công viên rừng sinh thái quốc gia xin vui lòng phối hợp với nhân viên xuất trình thẻ căn cước công dân để soát vé vào cổng theo tên thật.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "适应": (
        "thích nghi, thích ứng, phù hợp",
        "经过科研人员在人工繁育基地的悉心野化训练，这批朱鹮已经完全适应了野外的自然生存环境。",
        "Jīngguò kēyán rényuán zài réngōng fányù jīdì de xīxīn yěhuà xùnliàn, zhè pī zhūhuán yǐjīng wánquán shìyìng le yěwài de zìrán shēngcún huánjìng.",
        "Sau khi được các cán bộ nghiên cứu kiên trì huấn luyện bán hoang dã tại khu nhân giống nhân tạo, đàn cò quăm mào này đã hoàn toàn thích nghi với môi trường sống tự nhiên ngoài hoang dã.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "重点": (
        "trọng điểm, điểm mấu chốt, phần cốt lõi",
        "流域生态综合治理的战略重点，应当放在上游涵养水源和中下游湿地生态系统的系统性恢复上。",
        "Liúyù shēngtài zōnghé zhìlǐ de zhànlüè zhòngdiǎn, yīngdāng fàng zài shàngyóu hányǎng shuǐyuán hé zhōng-xiàyóu shīdì shēngtài xìtǒng de xìtǒngxìng huīfù shang.",
        "Trọng điểm chiến lược của việc quản lý tổng hợp sinh thái lưu vực sông cần phải đặt vào việc bảo tồn nguồn nước thượng nguồn và khôi phục có hệ thống hệ sinh thái đất ngập nước ở trung và hạ lưu.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "院长": (
        "viện trưởng (học viện, viện nghiên cứu)",
        "中国林业科学研究院院长带领专家组专程来到林区一线，指导退化森林生态的科学修复工程。",
        "Zhōngguó Línyè Kēxué Yánjiūyuàn yuànzhǎng dàilǐng zhuānjiāzǔ zhuānchéng lái dào línqū yíxiàn, zhǐdǎo tuìhuà sēnlín shēngtài de kēxué xiūfù gōngchéng.",
        "Viện trưởng Viện Khoa học Lâm nghiệp Trung Quốc đã dẫn đầu đoàn chuyên gia đặc biệt đến tiền tuyến khu rừng để hướng dẫn công trình phục hồi khoa học hệ sinh thái rừng bị suy thoái.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "预习": (
        "chuẩn bị bài trước, soạn bài trước",
        "明天我们要前往自然历史博物馆开展生态研学活动，请同学们今晚提前认真预习相关生物演化资料。",
        "Míngtiān wǒmen yào qiánwǎng zìrán lìshǐ bówùguǎn kāizhǎn shēngtài yánxué huódòng, qǐng tóngxuémen jīnwǎn tíqián rènzhēn yùxí xiāngguān shēngwù yǎnhuà zīliào.",
        "Ngày mai chúng ta sẽ đến bảo tàng lịch sử tự nhiên để triển khai hoạt động học tập ngoại khóa sinh thái, tối nay các em nhớ chuẩn bị bài trước cẩn thận các tài liệu về tiến hóa sinh vật liên quan.",
        "LINGUISTICALLY_REVIEWED_AI"
    ),
    "麻烦": (
        "phiền phức, rắc rối; làm phiền",
        "虽然垃圾分类投放比起随手乱扔稍显麻烦，但为了子孙后代的碧水蓝天，每个人都应当自觉践行。",
        "Suīrán lājī fēnlèi tóufàng bǐqǐ suíshǒu luàn rēng shāo xiǎn máfan, dàn wèile zǐsūn-hòudài de bìshuǐ-lántiān, měi gè rén dōu yīngdāng zìjué jiànxíng.",
        "Tuy việc phân loại rác để bỏ vào thùng so với tiện tay vứt bừa có hơi phiền phức một chút, nhưng vì bầu trời xanh và dòng nước trong lành của con cháu mai sau, mỗi người đều nên tự giác thực hiện.",
        "LINGUISTICALLY_REVIEWED_AI"
    )
}

def generate_l18():
    with open('data/hsk30/staging/dev_hsk4_vocab_raw.json', 'r', encoding='utf-8') as f:
        raw_vocab = json.load(f)

    l18_raw = [w for w in raw_vocab if w['lessonNumber'] == LESSON_NUMBER]
    assert len(l18_raw) == 50, f"Expected 50 raw words for L18, got {len(l18_raw)}"

    enriched_records = []
    for item in l18_raw:
        hanzi = item['hanzi']
        assert hanzi in L18_DEFINITIONS, f"Missing definition for '{hanzi}' in L18"
        meaning_vi, ex_zh, ex_py, ex_vi, qa_status = L18_DEFINITIONS[hanzi]

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

    out_file = Path("scripts/hsk30/hsk4_vocab_data_p4_l18.py")
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write("# -*- coding: utf-8 -*-\n")
        f.write('"""\nHSK 4 Vocabulary Data — Part 4: Lesson 18 (50 words)\n')
        f.write(f'LessonId: {LESSON_ID}\nLesson Title: {LESSON_TITLE}\n"""\n\n')
        f.write(f'LESSON_ID = "{LESSON_ID}"\n')
        f.write(f'LESSON_NUMBER = {LESSON_NUMBER}\n')
        f.write(f'LESSON_TITLE = "{LESSON_TITLE}"\n\n')
        f.write("HSK4_DATA_P4_L18_RECORDS = ")
        f.write(json.dumps(enriched_records, ensure_ascii=False, indent=4))
        f.write("\n\n")
        f.write("# Dictionary format compatible with P1 / P2: (lesson_num, hanzi) -> (meaningVi, exampleZh, examplePy, exampleVi)\n")
        f.write("HSK4_DATA_P4_L18 = {\n")
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
        stage="STAGE_P4_LESSON18_COMPLETED",
        completed_lessons=list(range(1, 19)),
        completed_vocab_count=900,
        status="IN_PROGRESS"
    )
    print("Updated checkpoint: 900 words completed.")

if __name__ == '__main__':
    generate_l18()
