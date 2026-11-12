# -*- coding: utf-8 -*-
"""
Generator and Validator for HSK 4 — Lesson 12 Vocabulary
LessonId: 8BA251C3-784B-4235-AFA3-B8B41D28B70F
Lesson 12: 用心发现美
"""
import sys
import json
import hashlib

sys.stdout.reconfigure(encoding='utf-8')

LESSON_ID = "8BA251C3-784B-4235-AFA3-B8B41D28B70F"
LESSON_NUMBER = 12
LESSON_TITLE = "用心发现美"

L12_DATA = [
    {
        "devId": "01BCAC92-50A3-4B81-B9AB-B528B7BDDAF3",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "不断",
        "pinyin": "búduàn",
        "meaningVi": "không ngừng, liên tục",
        "exampleZh": "只有在日常生活中不断学习和积累，才能持续提高自己的专业水平。",
        "examplePy": "Zhǐyǒu zài rìcháng shēnghuó zhōng búduàn xuéxí hé jīlěi, cáinéng chíxù tígāo zìjǐ de zhuānyè shuǐpíng.",
        "exampleVi": "Chỉ có không ngừng học tập và tích lũy trong cuộc sống hằng ngày mới có thể liên tục nâng cao trình độ chuyên môn của bản thân.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "B1E42CD6-DD97-4C4F-8513-75002E617A18",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "举办",
        "pinyin": "jǔbàn",
        "meaningVi": "tổ chức, tiến hành (sự kiện, hội nghị, triển lãm)",
        "exampleZh": "学校美术馆将于下周五举办一场当代青年摄影艺术展。",
        "examplePy": "Xuéxiào měishùguǎn jiāng yú xià zhōuwǔ jǔbàn yì chǎng dāngdài qīngnián shèyǐng yìshù zhǎn.",
        "exampleVi": "Bảo tàng mỹ thuật của trường sẽ tổ chức một buổi triển lãm nghệ thuật nhiếp ảnh thanh niên đương đại vào thứ Sáu tuần tới.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "3033C63A-BA92-4584-9D01-BE14889870E2",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "交警",
        "pinyin": "jiāojǐng",
        "meaningVi": "cảnh sát giao thông",
        "exampleZh": "早高峰时段，交警站在十字路口指挥车辆有序通行。",
        "examplePy": "Zǎogāofēng shíduàn, jiāojǐng zhàn zài shízì lùkǒu zhǐhuī chēliàng yǒuxù tōngxíng.",
        "exampleVi": "Vào giờ cao điểm buổi sáng, các chú cảnh sát giao thông đứng ở ngã tư điều khiển xe cộ lưu thông có trật tự.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "12DA8A0F-014E-41DA-882E-3E83A5EA7558",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "价格",
        "pinyin": "jiàgé",
        "meaningVi": "giá cả, mức giá",
        "exampleZh": "这家书店的艺术画册不仅印刷精美，而且价格十分合理。",
        "examplePy": "Zhè jiā shūdiàn de yìshù huàcè bùjǐn yìnshuā jīngměi, érqiě jiàgé shífēn hélǐ.",
        "exampleVi": "Các tập tranh nghệ thuật của hiệu sách này không chỉ in ấn đẹp mắt mà giá cả còn rất hợp lý.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "234C6653-F569-438C-BCB4-D5323FF4A538",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "作文",
        "pinyin": "zuòwén",
        "meaningVi": "bài làm văn; viết văn",
        "exampleZh": "老师在课堂上表扬了他的作文，称赞他观察生活非常细致。",
        "examplePy": "Lǎoshī zài kètáng shang biǎoyáng le tā de zuòwén, chēngzàn tā guānchá shēnghuó fēicháng xìzhì.",
        "exampleVi": "Thầy giáo đã biểu dương bài làm văn của cậu ấy trước lớp, khen ngợi cậu ấy quan sát cuộc sống vô cùng tỉ mỉ.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "FB573FEA-7E24-4A7F-978B-0163D308E40E",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "值得",
        "pinyin": "zhídé",
        "meaningVi": "đáng, xứng đáng (để làm gì)",
        "exampleZh": "这座古老小镇处处充满艺术气息，确实很值得去细细游览。",
        "examplePy": "Zhè zuò gǔlǎo xiǎozhèn chùchù chōngmǎn yìshù qìxī, quèshí hěn zhídé qù xìxì yóulǎn.",
        "exampleVi": "Thị trấn cổ kính này nơi nơi đều tràn ngập hơi thở nghệ thuật, thực sự rất đáng để đến tham quan và thưởng lãm tỉ mỉ.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "77D5286E-FDCE-450C-BE4E-0AC47FF025C5",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "入口",
        "pinyin": "rùkǒu",
        "meaningVi": "lối vào, cửa vào; nhập khẩu",
        "exampleZh": "参观画展的游客请在博物馆东侧入口处有序排队安检。",
        "examplePy": "Cānguān huàzhǎn de yóukè qǐng zài bówùguǎn dōng cè rùkǒu chù yǒuxù páiduì ānjiǎn.",
        "exampleVi": "Khách tham quan triển lãm tranh xin vui lòng xếp hàng trật tự kiểm tra an ninh tại lối vào phía đông bảo tàng.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "4C65FA25-074C-4674-99FD-C5D153581EEA",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "再次",
        "pinyin": "zàicì",
        "meaningVi": "một lần nữa, lại lần nữa",
        "exampleZh": "听完他的精彩演讲后，全场观众再次报以热烈的掌声。",
        "examplePy": "Tīng wán tā de jīngcǎi yǎnjiǎng hòu, quánchǎng guānzhòng zàicì bào yǐ rèliè de zhǎngshēng.",
        "exampleVi": "Sau khi nghe xong bài diễn thuyết tuyệt vời của anh ấy, toàn thể khán giả lại một lần nữa dành cho anh những tràng pháo tay nồng nhiệt.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "D71652E4-12FA-492D-99D9-65B3229598C1",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "判断",
        "pinyin": "pànduàn",
        "meaningVi": "phán đoán, nhận định, đánh giá",
        "exampleZh": "我们不能仅仅根据外表来判断一个人的内在品格。",
        "examplePy": "Wǒmen bù néng jǐnjǐn gēnjù wàibiǎo lái pànduàn yí gè rén de nèizài pǐngé.",
        "exampleVi": "Chúng ta không thể chỉ dựa vào vẻ bề ngoài để phán đoán phẩm chất bên trong của một con người.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "38E7E562-61F1-48FD-B784-3506C39091E4",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "动作",
        "pinyin": "dòngzuò",
        "meaningVi": "động tác, cử động; hành động",
        "exampleZh": "舞蹈演员优美的动作深深打动了台下的每一位观众。",
        "examplePy": "Wǔdǎo yǎnyuán yōuměi de dòngzuò shēnshēn dǎdòng le táixià de měi yí wèi guānzhòng.",
        "exampleVi": "Động tác uyển chuyển của diễn viên múa đã làm rung động sâu sắc từng khán giả ngồi phía dưới sân khấu.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "5C147D6A-6195-4210-853C-95AA8D64CA57",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "厉害",
        "pinyin": "lìhai",
        "meaningVi": "lợi hại, giỏi giang, cừ khôi; dữ dội, nghiêm trọng, ghê gớm",
        "exampleZh": "她不仅琴弹得好，画画也很厉害，在学校里是个公认的才女。",
        "examplePy": "Tā bùjǐn qín tán de hǎo, huàhuà yě hěn lìhai, zài xuéxiào lǐ shì gè gōngrèn de cáinǚ.",
        "exampleVi": "Cô ấy không chỉ đàn giỏi mà vẽ tranh cũng rất cừ, là một tài nữ được mọi người trong trường công nhận.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "B74117CC-827F-4C42-8CFA-FB4C0A06D589",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "取得",
        "pinyin": "qǔdé",
        "meaningVi": "đạt được, giành được (thành tựu, kết quả, tiến bộ)",
        "exampleZh": "经过长期的刻苦训练，这位年轻画家在国际艺术节上取得了优异成绩。",
        "examplePy": "Jīngguò chángqī de kèkǔ xùnliàn, zhè wèi niánqīng huàjiā zài guójì yìshùjié shang qǔdé le yōuyì chéngjì.",
        "exampleVi": "Trải qua quá trình khổ luyện lâu dài, họa sĩ trẻ này đã đạt được thành tích xuất sắc tại lễ hội nghệ thuật quốc tế.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "4E199608-0451-4122-B947-36B8FC099894",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "同样",
        "pinyin": "tóngyàng",
        "meaningVi": "giống nhau, tương tự, đồng dạng",
        "exampleZh": "面对同样的风景，不同心态的人往往会产生完全不同的感受。",
        "examplePy": "Miànduì tóngyàng de fēngjǐng, bù tóng xīntài de rén wǎngwǎng huì chǎnshēng wánquán bù tóng de gǎnshòu.",
        "exampleVi": "Đứng trước cùng một phong cảnh, những người với tâm thế khác nhau thường sẽ có những cảm nhận hoàn toàn khác biệt.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "D629686F-A41F-4640-8466-F2FA4DD08738",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "嗯",
        "pinyin": "ǹg",
        "meaningVi": "ừ, vâng, ừm (thán từ biểu thị đồng ý hoặc đáp lời)",
        "exampleZh": "“嗯，你说得很有道理，我们可以按照这个建议去修改方案。”",
        "examplePy": "“Ǹg, nǐ shuō de hěn yǒu dàolǐ, wǒmen kěyǐ ànzhào zhè gè jiànyì qù xiūgǎi fāng'àn.”",
        "exampleVi": "“Ừm, bạn nói rất có lý, chúng ta có thể sửa đổi phương án theo đề xuất này.”",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "AFAED48C-AC6E-456F-9D51-3C9E5D290853",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "基础",
        "pinyin": "jīchǔ",
        "meaningVi": "nền tảng, cơ sở, căn bản",
        "exampleZh": "掌握扎实的美术素描基础，对于以后的艺术创作至关重要。",
        "examplePy": "Zhǎngwò zhāshi de měishù sùmiáo jīchǔ, duìyú yǐhòu de yìshù chuàngzuò zhìguān zhòngyào.",
        "exampleVi": "Nắm vững nền tảng vẽ phác họa mỹ thuật vững chắc có ý nghĩa đặc biệt quan trọng đối với việc sáng tác nghệ thuật sau này.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "C3FA80D2-9FBB-4BEC-8BF7-9E143E507424",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "大约",
        "pinyin": "dàyuē",
        "meaningVi": "khoảng chừng, ước chừng, chừng",
        "exampleZh": "从这里步行到山顶的观景台大约需要四十分钟。",
        "examplePy": "Cóng zhèlǐ bùxíng dào shāndǐng de guānjǐngtái dàyuē xūyào sìshí fēnzhōng.",
        "exampleVi": "Đi bộ từ đây lên đài ngắm cảnh trên đỉnh núi ước chừng mất khoảng bốn mươi phút.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "32B429A3-836D-4806-AD57-1C1981B183BD",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "学院",
        "pinyin": "xuéyuàn",
        "meaningVi": "học viện, trường đại học chuyên ngành",
        "exampleZh": "哥哥从小热爱音乐，去年顺利考入了中央音乐学院。",
        "examplePy": "Gēge cóngxiǎo rè'ài yīnyuè, qùnián shùnlì kǎorù le Zhōngyāng Yīnyuè Xuéyuàn.",
        "exampleVi": "Anh trai từ nhỏ đã đam mê âm nhạc, năm ngoái đã thuận lợi thi đỗ vào Học viện Âm nhạc Trung ương.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "FCDFAEA1-F881-4B7D-8519-4CA1C6AFCD28",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "对方",
        "pinyin": "duìfāng",
        "meaningVi": "đối phương, bên kia, phía đối diện",
        "exampleZh": "在沟通的过程中，我们要学会倾听并尊重对方的观点。",
        "examplePy": "Zài gōutōng de guòchéng zhōng, wǒmen yào xuéhuì qīngtīng bìng zūnzhòng duìfāng de guāndiǎn.",
        "exampleVi": "Trong quá trình giao tiếp, chúng ta cần học cách lắng nghe và tôn trọng quan điểm của đối phương.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "C92E1705-0019-4118-9AAF-7ADBD6BDAE65",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "工资",
        "pinyin": "gōngzī",
        "meaningVi": "tiền lương, thù lao",
        "exampleZh": "公司不仅按时给员工发放工资，年底还会提供丰厚的奖金。",
        "examplePy": "Gōngsī bùjǐn ànshí gěi yuángōng fāfàng gōngzī, niándǐ hái huì tígōng fēnghòu de jiǎngxīn.",
        "exampleVi": "Công ty không những chi trả tiền lương đúng hạn cho nhân viên mà cuối năm còn trao tặng tiền thưởng hậu hĩnh.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "3FF6A7FA-5531-49D5-AC6E-30AB5DAE7FDC",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "并且",
        "pinyin": "bìngqiě",
        "meaningVi": "và, hơn nữa, đồng thời",
        "exampleZh": "他认真倾听了大家的意见，并且在会上做出了详细的解答。",
        "examplePy": "Tā rènzhēn qīngtīng le dàjiā de yìjiàn, bìngqiě zài huì shang zuòchū le xiángxì de jiědá.",
        "exampleVi": "Anh ấy chăm chú lắng nghe ý kiến của mọi người, đồng thời đưa ra lời giải đáp chi tiết ngay tại cuộc họp.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "A5B9F167-3FFF-4F9A-8AF8-167A67084260",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "往往",
        "pinyin": "wǎngwǎng",
        "meaningVi": "thường, thường hay (chỉ quy luật trong điều kiện nhất định)",
        "exampleZh": "生活中真正动人的美，往往隐藏在那些平凡细微的小事之中。",
        "examplePy": "Shēnghuó zhōng zhēnzhèng dòngrén de měi, wǎngwǎng yǐncáng zài nàxiē píngfán xìwēi de xiǎoshì zhī zhōng.",
        "exampleVi": "Vẻ đẹp thực sự làm rung động lòng người trong cuộc sống thường hay ẩn giấu trong những điều giản dị, nhỏ bé.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "8B44771E-37A3-413D-844E-25CF7C084584",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "意见",
        "pinyin": "yìjiàn",
        "meaningVi": "ý kiến, quan điểm; bất đồng, phàn nàn",
        "exampleZh": "如果大家对这个展览布置方案还有什么意见，欢迎随时提出来。",
        "examplePy": "Rúguǒ dàjiā duì zhè gè zhǎnlǎn bùzhì fāng'àn hái yǒu shénme yìjiàn, huānyíng suíshí tí chūlái.",
        "exampleVi": "Nếu mọi người vẫn còn ý kiến gì đối với phương án bài trí triển lãm này, rất hoan nghênh góp ý bất cứ lúc nào.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "63169AB6-3EBF-4055-B64D-812FD87817B4",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "打招呼",
        "pinyin": "dǎ zhāohu",
        "meaningVi": "chào hỏi; đánh tiếng, báo trước",
        "exampleZh": "邻里之间在楼道里碰面时，总会微笑着相互打招呼。",
        "examplePy": "Línlǐ zhījiān zài lóudào lǐ pèngmiàn shí, zǒng huì wēixiào zhe xiānghù dǎ zhāohu.",
        "exampleVi": "Hàng xóm láng giềng khi gặp mặt nhau ở hành lang luôn mỉm cười chào hỏi lẫn nhau.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "B8FCD1B3-2234-434E-9F79-F7588751DA7B",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "指出",
        "pinyin": "zhǐchū",
        "meaningVi": "chỉ ra, vạch rõ, nêu ra",
        "exampleZh": "导师在审阅论文时，明确指出了几处需要补充论据的地方。",
        "examplePy": "Dǎoshī zài shěnyuè lùnwén shí, míngquè zhǐchū le jǐ chù xūyào bǔchōng lùnjù de dìfang.",
        "exampleVi": "Người hướng dẫn khi duyệt luận văn đã chỉ ra rõ ràng một vài chỗ cần bổ sung thêm luận cứ.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "61FCED62-C173-498B-B1BC-EE4079AEE042",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "摄氏度",
        "pinyin": "shèshìdù",
        "meaningVi": "độ C (°C, độ Bách phân)",
        "exampleZh": "今天室外最高气温达到了三十五摄氏度，出门一定要做好防暑准备。",
        "examplePy": "Jīntiān shìwài zuìgāo qìwēn dádào le sānshíwǔ shèshìdù, chūmén yídìng yào zuò hǎo fángshǔ zhǔnbèi.",
        "exampleVi": "Nhiệt độ cao nhất ngoài trời hôm nay chạm ngưỡng 35 độ C, khi ra ngoài nhất định phải chuẩn bị các biện pháp chống nắng nóng.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "078D58BB-F970-4AC7-B070-F9C3E7352971",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "教育",
        "pinyin": "jiàoyù",
        "meaningVi": "giáo dục, dạy dỗ; nền giáo dục",
        "exampleZh": "良好的家庭教育能够帮助孩子从小树立正确的价值观。",
        "examplePy": "Liánghǎo de jiātíng jiàoyù nénggòu bāngzhù háizi cóngxiǎo shùlì zhèngquè de jiàzhíguān.",
        "exampleVi": "Nền giáo dục gia đình tốt đẹp có thể giúp con trẻ xây dựng thế giới quan đúng đắn ngay từ thuở nhỏ.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "279C0827-B463-4429-9131-9DE9A8855FFD",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "无聊",
        "pinyin": "wúliáo",
        "meaningVi": "nhàm chán, buồn tẻ, tẻ nhạt",
        "exampleZh": "一个人待在家里无事可做的时候，他会觉得有些无聊。",
        "examplePy": "Yí gè rén dāi zài jiā lǐ wú shì kě zuò de shíhou, tā huì juéde yǒuxiē wúliáo.",
        "exampleVi": "Những lúc một mình ở nhà chẳng có việc gì làm, anh ấy sẽ cảm thấy có phần buồn tẻ.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "85A569BE-8D34-4DFB-A203-CE1B6E607CDC",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "景色",
        "pinyin": "jǐngsè",
        "meaningVi": "phong cảnh, cảnh sắc, cảnh quan",
        "exampleZh": "清晨站在山顶俯瞰，云雾缭绕中的自然景色美丽极了。",
        "examplePy": "Qīngchén zhàn zài shāndǐng fǔkàn, yúnwù liáorào zhōng de zìrán jǐngsè měilì jí le.",
        "exampleVi": "Buổi sáng sớm đứng trên đỉnh núi nhìn xuống, cảnh sắc thiên nhiên trong làn mây sương bao phủ đẹp vô cùng.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "D8C800DD-8823-4245-AA77-54404D26FF44",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "村",
        "pinyin": "cūn",
        "meaningVi": "làng, thôn xóm, làng mạc",
        "exampleZh": "这个宁静的小山村保留了许多明清时期的传统古建筑。",
        "examplePy": "Zhè gè níngjìng de xiǎo shāncūn bǎoliú le xǔduō Míng Qīng shíqī de chuántǒng gǔ jiànzhù.",
        "exampleVi": "Ngôi làng miền núi yên bình này vẫn còn lưu giữ nhiều công trình kiến trúc cổ truyền thống từ thời Minh - Thanh.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "E695BEFE-3D17-4026-98BF-8E280DB5AA1F",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "正好",
        "pinyin": "zhènghǎo",
        "meaningVi": "vừa đúng, đúng lúc, vừa vặn, vừa khéo",
        "exampleZh": "我刚想出门买书，正好碰见朋友来家里找我。",
        "examplePy": "Wǒ gāng xiǎng chūmén mǎi shū, zhènghǎo pèngjiàn péngyou lái jiā lǐ zhǎo wǒ.",
        "exampleVi": "Tôi vừa định ra ngoài mua sách thì vừa khéo gặp bạn ghé nhà tìm tôi.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "0804EFF1-4736-405E-819C-2E90D3397785",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "永远",
        "pinyin": "yǒngyuǎn",
        "meaningVi": "mãi mãi, vĩnh viễn",
        "exampleZh": "那些在困难时刻向我们伸出援手的人，我们永远不会忘记。",
        "examplePy": "Nàxiē zài kùnnan shíkè xiàng wǒmen shēn chū yuánshǒu de rén, wǒmen yǒngyuǎn bú huì wàngjì.",
        "exampleVi": "Những người từng chìa tay giúp đỡ chúng ta trong thời khắc khó khăn, chúng ta sẽ mãi mãi không bao giờ quên.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "62D5BC77-312B-4FFE-ABBB-2B39F5F7548D",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "温度",
        "pinyin": "wēndù",
        "meaningVi": "nhiệt độ",
        "exampleZh": "春天到来后，湖水的温度逐渐回升，吸引了许多游人前来散步。",
        "examplePy": "Chūntiān dàolái hòu, húshuǐ de wēndù zhújiàn huíshēng, xīyǐn le xǔduō yóurén qiánlái sànbù.",
        "exampleVi": "Sau khi mùa xuân về, nhiệt độ nước hồ ấm dần lên, thu hút rất nhiều du khách tới tản bộ.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "8BA6BC19-CA93-423C-AE8B-F6669EAFA055",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "爱心",
        "pinyin": "àixīn",
        "meaningVi": "lòng nhân ái, tấm lòng yêu thương, tình nhân ái",
        "exampleZh": "社区志愿者们充满爱心，长期义务照顾敬老院里的孤独老人。",
        "examplePy": "Shèqū zhìyuànzhě men chōngmǎn àixīn, chángqī yìwù zhàogù jìnglǎoyuàn lǐ de gūdú lǎorén.",
        "exampleVi": "Các tình nguyện viên khu dân cư chan chứa lòng nhân ái, thường xuyên chăm sóc miễn phí cho các cụ già neo đơn trong viện dưỡng lão.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "2FE27481-2CF1-4E60-8499-3EB0B0948547",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "琴",
        "pinyin": "qín",
        "meaningVi": "đàn, nhạc cụ dây hoặc phím (như cổ cầm, đàn tranh, dương cầm, vĩ cầm); đàn cổ cầm",
        "exampleZh": "傍晚在书房里抚琴弹奏一曲，能让浮躁的心境彻底宁静下来。",
        "examplePy": "Bàngwǎn zài shūfáng lǐ fǔqín tánzòu yì qǔ, néng ràng fúzào de xīnjìng chèdǐ níngjìng xiàlái.",
        "exampleVi": "Buổi chiều muộn ngồi gảy một khúc đàn trong thư phòng có thể giúp cõi lòng đang bồn chồn lắng đọng trở lại bình yên.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "AECCC78B-22C3-4A39-A8EC-140752CE09D2",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "皮肤",
        "pinyin": "pífū",
        "meaningVi": "làn da, da",
        "exampleZh": "经常进行户外运动并保证充足饮水，有助于保持皮肤健康有光泽。",
        "examplePy": "Jīngcháng jìnxíng hùwài yùndòng bìng bǎozhèng chōngzú yǐnshuǐ, yǒu zhù yú bǎochí pífū jiànkāng yǒu guāngzé.",
        "exampleVi": "Thường xuyên vận động ngoài trời và đảm bảo uống đủ nước giúp duy trì làn da khỏe khoắn và hồng hào.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "7F13225B-6E4E-43D1-9F9A-27033770E718",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "知识",
        "pinyin": "zhīshi",
        "meaningVi": "kiến thức, tri thức",
        "exampleZh": "阅读不同领域的经典书籍，能够不断拓宽我们的科学与文化知识。",
        "examplePy": "Yuèdú bù tóng lǐngyù de jīngdiǎn shūjí, nénggòu búduàn tuòkuān wǒmen de kēxué yǔ wénhuà zhīshi.",
        "exampleVi": "Đọc sách kinh điển ở các lĩnh vực khác nhau có thể không ngừng mở rộng kiến thức khoa học và văn hóa của chúng ta.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "F67B10DA-44C7-43AF-B603-9D8C2833E25A",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "稍微",
        "pinyin": "shāowēi",
        "meaningVi": "hơi, một chút, một ít",
        "exampleZh": "这幅风景油画的色彩稍微偏暗了一点儿，但整体意境非常深远。",
        "examplePy": "Zhè fú fēngjǐng yóuhuà de sècǎi shāowēi piān àn le yìdiǎnr, dàn zhěngtǐ yìjìng fēicháng shēnyuǎn.",
        "exampleVi": "Màu sắc của bức tranh sơn dầu phong cảnh này hơi trầm tối một chút, nhưng ý cảnh tổng thể lại vô cùng sâu lắng.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "CA23C6CB-5F6D-4EC0-A084-1847EDD30367",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "算",
        "pinyin": "suàn",
        "meaningVi": "tính, tính toán; coi là, kể như",
        "exampleZh": "把这几项数据统计清楚之后，整个项目的预算就算全部完成了。",
        "examplePy": "Bǎ zhè jǐ xiàng shùjù tǒngjì qīngchu zhīhòu, zhěng gè xiàngmù de yùsuàn jiù suàn quánbù wánchéng le.",
        "exampleVi": "Sau khi thống kê rõ ràng mấy khoản số liệu này, bản dự toán của toàn bộ dự án coi như đã hoàn thành tất cả.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "4E4325C1-C58F-4811-8AFF-899444AEE73C",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "结果",
        "pinyin": "jiéguǒ",
        "meaningVi": "kết quả; kết cục (cũng chỉ đơm hoa kết trái)",
        "exampleZh": "大家经过连续几个星期的同心协力，最终取得了令人满意的调研结果。",
        "examplePy": "Dàjiā jīngguò liánxù jǐ gè xīngqī de tóngxīn-xiélì, zuìzhōng qǔdé le lìng rén mǎnyì de diàoyán jiéguǒ.",
        "exampleVi": "Mọi người sau nhiều tuần liên tiếp chung sức đồng lòng, cuối cùng đã đạt được kết quả khảo sát khiến ai nấy đều hài lòng.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "60CD9540-DA48-472D-96B0-353FB9E34395",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "老虎",
        "pinyin": "lǎohǔ",
        "meaningVi": "con hổ, cọp",
        "exampleZh": "在自然保护区里，几只威风凛凛的野生东北老虎正在雪地中漫步。",
        "examplePy": "Zài zìrán bǎohùqū lǐ, jǐ zhī wēifēng-lǐnlǐn de yěshēng Dōngběi lǎohǔ zhèngzài xuědì zhōng mànbù.",
        "exampleVi": "Trong khu bảo tồn thiên nhiên, vài con hổ Siberia hoang dã oai phong lẫm liệt đang dạo bước trên nền tuyết trắng.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "DF8547EB-842E-4EDD-9144-A02AE73C1B51",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "脾气",
        "pinyin": "píqi",
        "meaningVi": "tính tình, tính khí, tính nết",
        "exampleZh": "他的脾气非常温和，无论遇到多么棘手的事情也从不轻易发火。",
        "examplePy": "Tā de píqi fēicháng wēnhé, wúlùn yùdào duōme jíshǒu de shìqing yě cóng bù qīngyì fāhuǒ.",
        "exampleVi": "Tính tình anh ấy rất ôn hòa, dù gặp phải chuyện hóc búa đến đâu cũng không bao giờ dễ dàng nổi nóng.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "C2F0E524-629C-4E7E-9D6F-FB125F7512BF",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "血",
        "pinyin": "xiě",
        "meaningVi": "máu, huyết (khẩu ngữ đọc là xiě, từ ghép thường đọc xuè)",
        "exampleZh": "他削苹果时不小心划破了手指，伤口渗出了一点儿鲜红的血。",
        "examplePy": "Tā xiāo píngguǒ shí bù xiǎoxīn huàpò le shǒuzhǐ, shāngkǒu shènchū le yìdiǎnr xiānhóng de xiě.",
        "exampleVi": "Anh ấy lúc gọt táo bất cẩn làm rách ngón tay, miệng vết thương rỉ ra một chút máu đỏ tươi.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "E84E0053-EE56-484A-9202-308889EC8145",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "订",
        "pinyin": "dìng",
        "meaningVi": "đặt (vé, phòng, hàng); ký kết (hợp đồng), định ra",
        "exampleZh": "为了确保假期出行顺利，我们提前在网上预订了高铁票和酒店。",
        "examplePy": "Wèile quèbǎo jiàqī chūxíng shùnlì, wǒmen tíqián zài wǎngshang yùdìng le gāotiě piào hé jiǔdiàn.",
        "exampleVi": "Để đảm bảo chuyến đi trong kỳ nghỉ diễn ra thuận lợi, chúng tôi đã đặt trước vé tàu cao tốc và khách sạn qua mạng.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "52D16DD0-8B87-4416-BC0F-F00701EA14EE",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "课程",
        "pinyin": "kèchéng",
        "meaningVi": "khóa học, chương trình học, học phần",
        "exampleZh": "这门中国传统水墨画课程深入浅出，深受广大学生的喜爱。",
        "examplePy": "Zhè mén Zhōngguó chuántǒng shuǐmòhuà kèchéng shēnrù-qiǎnchū, shēn shòu guǎngdà xuésheng de xǐ'ài.",
        "exampleVi": "Khóa học tranh thủy mặc truyền thống Trung Quốc này truyền tải sâu sắc mà dễ hiểu, được đông đảo học sinh vô cùng yêu thích.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "AAB8341E-078C-48FA-A376-720A69218418",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "起到",
        "pinyin": "qǐdào",
        "meaningVi": "phát huy, đem lại, đóng (vai trò, tác dụng: 起到……作用)",
        "exampleZh": "每天坚持适度的体育锻炼，能对缓解工作压力起到显著的积极作用。",
        "examplePy": "Měitiān jiānchí shìdù de tǐyù duànliàn, néng duì huǎnjiě gōngzuò yālì qǐdào xiǎnzhù de jījí zuòyòng.",
        "exampleVi": "Mỗi ngày kiên trì rèn luyện thể thao vừa sức có thể đem lại tác dụng tích cực rõ rệt trong việc giải tỏa áp lực công việc.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "E135813B-E1AC-4027-87CE-DEA92050BF31",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "进入",
        "pinyin": "jìnrù",
        "meaningVi": "bước vào, đi vào, tiến vào",
        "exampleZh": "汽车缓缓驶出隧道，我们仿佛进入了一座风景如画的世外桃源。",
        "examplePy": "Qìchē huǎnhuǎn shǐchū suìdào, wǒmen fǎngfú jìnrù le yí zuò fēngjǐng-rúhuà de shìwàitáoyuán.",
        "exampleVi": "Chiếc ô tô chầm chậm chạy ra khỏi đường hầm, chúng tôi ngỡ như vừa bước vào một chốn bồng lai tiên cảnh đẹp tựa tranh vẽ.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "A8619FF9-2760-4604-8E65-4E7F2A6349CF",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "酸",
        "pinyin": "suān",
        "meaningVi": "chua; đau nhức, ê ẩm; chua xót",
        "exampleZh": "爬完一整天的山路后，双腿感到有些酸痛，但心情格外舒畅。",
        "examplePy": "Pá wán yì zhěng tiān de shānlù hòu, shuāng tuǐ gǎndào yǒuxiē suāntòng, dàn xīnqíng géwài shūchàng.",
        "exampleVi": "Sau khi leo đường núi suốt cả ngày, hai chân cảm thấy hơi nhức mỏi nhưng tâm trạng lại vô cùng sảng khoái.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "54BB2C81-D879-4CCA-9C99-8FF344E93A05",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "降",
        "pinyin": "jiàng",
        "meaningVi": "giảm, hạ xuống, rơi xuống",
        "exampleZh": "受强冷空气南下影响，今晚本市的气温将大幅度下降。",
        "examplePy": "Shòu qiáng lěng kōngqì nán xià yǐngxiǎng, jīnwǎn běn shì de qìwēn jiāng dà fúdù xiàjiàng.",
        "exampleVi": "Do chịu ảnh hưởng của đợt không khí lạnh mạnh tràn xuống phía nam, đêm nay nhiệt độ thành phố sẽ giảm mạnh.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "F019832D-6BDF-418B-9931-BDFEEF86FA39",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "项",
        "pinyin": "xiàng",
        "meaningVi": "hạng mục, điều khoản; lượng từ cho công việc, nghiên cứu, nhiệm vụ",
        "exampleZh": "经过科研团队半年的潜心钻研，这项重要的技术革新终于取得了突破。",
        "examplePy": "Jīngguò kēyán tuánduì bàn nián de qiǎnxīn zuānyán, zhè xiàng zhòngyào de jìshù géxīn zhōngyú qǔdé le tūpò.",
        "exampleVi": "Trải qua nửa năm dày công nghiên cứu của đội ngũ khoa học, sáng kiến cải tiến kỹ thuật quan trọng này cuối cùng đã đạt được bước đột phá.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    },
    {
        "devId": "29C7922A-B4F2-4071-B143-B60ACDBC4DE6",
        "lessonId": LESSON_ID,
        "lessonNumber": LESSON_NUMBER,
        "hanzi": "高价",
        "pinyin": "gāojià",
        "meaningVi": "giá cao, giá đắt",
        "exampleZh": "这件珍贵的古代青花瓷瓶在昨晚的艺术拍卖会上以高价成交。",
        "examplePy": "Zhè jiàn zhēnguì de gǔdài qīnghuā cípíng zài zuówǎn de yìshù pāimàihuì shang yǐ gāojià chéngjiāo.",
        "exampleVi": "Chiếc bình gốm hoa lam cổ quý giá này đã được giao dịch với mức giá cao trong buổi đấu giá nghệ thuật tối qua.",
        "qaStatus": "LINGUISTICALLY_REVIEWED_AI",
        "humanReviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
    }
]

def validate_and_generate():
    print(f"Validating Lesson 12 data...")
    assert len(L12_DATA) == 50, f"Expected 50 words, got {len(L12_DATA)}"
    
    # Check uniqueness of devIds
    dev_ids = [x["devId"] for x in L12_DATA]
    assert len(set(dev_ids)) == 50, "Duplicate devId detected!"
    
    # Check uniqueness of hanzi within lesson
    hanzi_list = [x["hanzi"] for x in L12_DATA]
    assert len(set(hanzi_list)) == 50, "Duplicate hanzi detected!"
    
    # Check against raw dump
    with open("D:/ZhongWenHub/data/hsk30/staging/dev_hsk4_vocab_raw.json", "r", encoding="utf-8") as f:
        raw = json.load(f)
    raw_l12 = [x for x in raw if x["lessonNumber"] == 12]
    raw_ids = set(x["devId"] for x in raw_l12)
    raw_hanzi = set(x["hanzi"] for x in raw_l12)
    
    assert set(dev_ids) == raw_ids, f"devId mismatch with raw dump! Diff: {set(dev_ids) ^ raw_ids}"
    assert set(hanzi_list) == raw_hanzi, f"hanzi mismatch with raw dump! Diff: {set(hanzi_list) ^ raw_hanzi}"
    
    # Validate required fields
    required_fields = [
        "devId", "lessonId", "lessonNumber", "hanzi", "pinyin",
        "meaningVi", "exampleZh", "examplePy", "exampleVi",
        "qaStatus", "humanReviewStatus"
    ]
    for i, item in enumerate(L12_DATA):
        for field in required_fields:
            val = item.get(field)
            assert val is not None and str(val).strip() != "", f"Empty field {field} at index {i} ({item.get('hanzi')})"
        assert item["lessonId"] == LESSON_ID
        assert item["lessonNumber"] == LESSON_NUMBER
        assert item["qaStatus"] == "LINGUISTICALLY_REVIEWED_AI", f"Invalid qaStatus: {item['qaStatus']}"
        assert item["humanReviewStatus"] == "PENDING_HUMAN_EXPERT_SIGN_OFF", f"Invalid humanReviewStatus: {item['humanReviewStatus']}"

    print("All validation checks PASSED!")
    
    # Generate scripts/hsk30/hsk4_vocab_data_p3_l12.py
    out_path = "D:/ZhongWenHub/scripts/hsk30/hsk4_vocab_data_p3_l12.py"
    header = f'''# -*- coding: utf-8 -*-
"""
HSK 4 Vocabulary Data — Part 3: Lesson 12 (50 words)
LessonId: {LESSON_ID}
Lesson Title: {LESSON_TITLE}
"""

LESSON_ID = "{LESSON_ID}"
LESSON_NUMBER = {LESSON_NUMBER}
LESSON_TITLE = "{LESSON_TITLE}"

# Detailed records with devId, QAStatus, and HumanReviewStatus
HSK4_DATA_P3_L12_RECORDS = {json.dumps(L12_DATA, ensure_ascii=False, indent=4)}

# Dictionary format compatible with P1 / P2: (lesson_num, hanzi) -> (meaningVi, exampleZh, examplePy, exampleVi)
HSK4_DATA_P3_L12 = {{
'''
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(header)
        for item in L12_DATA:
            m = item["meaningVi"].replace('"', '\\"')
            ezh = item["exampleZh"].replace('"', '\\"')
            epy = item["examplePy"].replace('"', '\\"')
            evi = item["exampleVi"].replace('"', '\\"')
            f.write(f'    ({item["lessonNumber"]}, "{item["hanzi"]}"): ("{m}", "{ezh}", "{epy}", "{evi}"),\n')
        f.write("}\n")
    
    # Calculate sha256
    with open(out_path, "rb") as f:
        file_sha256 = hashlib.sha256(f.read()).hexdigest()
    
    print(f"Successfully generated {out_path} with {len(L12_DATA)} entries.")
    print(f"File SHA256: {file_sha256}")
    return file_sha256

if __name__ == "__main__":
    validate_and_generate()
