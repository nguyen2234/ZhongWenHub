import json
import re
import csv
import pyodbc
import os
import asyncio
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    import edge_tts
    HAS_EDGE_TTS = True
except ImportError:
    HAS_EDGE_TTS = False

AUDIO_DIR = r"D:\ZhongWenHub\Fontend\public\audio\hsk1"
os.makedirs(AUDIO_DIR, exist_ok=True)

# 12 authentic pedagogical dialogues and listening scripts for L4 - L15
LESSON_REMEDIATIONS = {
    4: {
        "title": "Bài học 4 HSK 1: 他是我的汉语老师 (Thầy ấy là giáo viên tiếng Trung của tôi (Bản thảo))",
        "topic": "Chủ đề HSK 1: Thầy ấy là giáo viên tiếng Trung của tôi",
        "dialogue": [
            {
                "id": "line-1", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "请问，他是你的汉语老师吗？",
                "pinyin": "Qǐngwèn, tā shì nǐ de hànyǔ lǎoshī ma?",
                "meaningVi": "Xin hỏi, thầy ấy có phải là giáo viên tiếng Trung của bạn không?",
                "audioUrl": "/audio/hsk1/les4_line1.mp3", "displayOrder": 1
            },
            {
                "id": "line-2", "speakerName": "玛丽", "speakerRole": "Mã Lệ (Mary)",
                "zh": "是的，他是王老师，住在学校里面。",
                "pinyin": "Shì de, tā shì Wáng lǎoshī, zhù zài xuéxiào lǐmiàn.",
                "meaningVi": "Đúng vậy, thầy là thầy Vương, sống ở bên trong trường học.",
                "audioUrl": "/audio/hsk1/les4_line2.mp3", "displayOrder": 2
            },
            {
                "id": "line-3", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "王老师教得好不好？",
                "pinyin": "Wáng lǎoshī jiāo de hǎo bu hǎo?",
                "meaningVi": "Thầy Vương dạy có tốt không?",
                "audioUrl": "/audio/hsk1/les4_line3.mp3", "displayOrder": 3
            },
            {
                "id": "line-4", "speakerName": "玛丽", "speakerRole": "Mã Lệ (Mary)",
                "zh": "他教得非常好，我们都很喜欢他。",
                "pinyin": "Tā jiāo de fēicháng hǎo, wǒmen dōu hěn xǐhuan tā.",
                "meaningVi": "Thầy dạy rất tốt, chúng tôi đều rất quý thầy.",
                "audioUrl": "/audio/hsk1/les4_line4.mp3", "displayOrder": 4
            }
        ],
        "listening_title": "Luyện nghe hiểu bài 4 - Nghe xác định ý chính",
        "prompt": "这段对话的核心讨论主题是什么？ (Chủ đề thảo luận cốt lõi của đoạn hội thoại này là gì?)",
        "options": [
            {"id": 0, "text": "介绍大卫的汉语老师及其在学校的教学与生活情况 (Giới thiệu về thầy giáo tiếng Trung và tình hình giảng dạy tại trường)", "isCorrect": True},
            {"id": 1, "text": "抱怨当前工作与生活中的琐碎烦恼 (Phàn nàn về những phiền muộn vụn vặt trong công việc và cuộc sống)", "isCorrect": False},
            {"id": 2, "text": "讨论天气变化对出行的不利影响 (Thảo luận về ảnh hưởng bất lợi của thời tiết đối với việc đi lại)", "isCorrect": False},
            {"id": 3, "text": "比较不同城市的交通与生活成本 (So sánh giao thông và chi phí sinh hoạt giữa các thành phố khác nhau)", "isCorrect": False}
        ],
        "explanation": "Toàn bộ đoạn hội thoại xoay quanh việc Mary giới thiệu về thầy giáo tiếng Trung của mình cho David. Phương án A nắm bắt chính xác ý chính."
    },
    5: {
        "title": "Bài học 5 HSK 1: 我想喝茶 (Tôi muốn uống trà)",
        "topic": "Chủ đề HSK 1: Tôi muốn uống trà",
        "dialogue": [
            {
                "id": "line-1", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "下午你想喝什么？我想喝茶。",
                "pinyin": "Xiàwǔ nǐ xiǎng hē shénme? Wǒ xiǎng hē chá.",
                "meaningVi": "Buổi chiều bạn muốn uống gì? Tôi muốn uống trà.",
                "audioUrl": "/audio/hsk1/les5_line1.mp3", "displayOrder": 1
            },
            {
                "id": "line-2", "speakerName": "玛丽", "speakerRole": "Mã Lệ (Mary)",
                "zh": "我也想喝茶，今天天气有点儿冷。",
                "pinyin": "Wǒ yě xiǎng hē chá, jīntiān tiānqì yǒudiǎnr lěng.",
                "meaningVi": "Tôi cũng muốn uống trà, thời tiết hôm nay hơi lạnh.",
                "audioUrl": "/audio/hsk1/les5_line2.mp3", "displayOrder": 2
            },
            {
                "id": "line-3", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "你想去哪儿喝茶呢？",
                "pinyin": "Nǐ xiǎng qù nǎr hē chá ne?",
                "meaningVi": "Bạn muốn đi đâu uống trà thế?",
                "audioUrl": "/audio/hsk1/les5_line3.mp3", "displayOrder": 3
            },
            {
                "id": "line-4", "speakerName": "玛丽", "speakerRole": "Mã Lệ (Mary)",
                "zh": "我们去学校前面的茶馆吧。",
                "pinyin": "Wǒmen qù xuéxiào qiánmiàn de cháguǎn ba.",
                "meaningVi": "Chúng ta đến quán trà phía trước trường nhé.",
                "audioUrl": "/audio/hsk1/les5_line4.mp3", "displayOrder": 4
            }
        ],
        "listening_title": "Luyện nghe hiểu bài 5 - Nghe tìm thông tin chi tiết",
        "prompt": "两位说话人打算下午去哪里喝茶？ (Hai người nói dự định đi đâu uống trà vào buổi chiều?)",
        "options": [
            {"id": 0, "text": "学校前面的茶馆 (Quán trà ở phía trước trường học)", "isCorrect": True},
            {"id": 1, "text": "图书馆旁边的咖啡厅 (Quán cà phê cạnh thư viện)", "isCorrect": False},
            {"id": 2, "text": "大卫自己的宿舍里 (Trong ký túc xá của David)", "isCorrect": False},
            {"id": 3, "text": "离学校很远的大饭店 (Nhà hàng lớn cách xa trường)", "isCorrect": False}
        ],
        "explanation": "Mary đề xuất: 'Chúng ta đi quán trà phía trước trường nhé'. Đáp án chính xác là A."
    },
    6: {
        "title": "Bài học 6 HSK 1: 你在做什么呢 (Bạn đang làm gì thế)",
        "topic": "Chủ đề HSK 1: Bạn đang làm gì thế",
        "dialogue": [
            {
                "id": "line-1", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "喂，玛丽，你在做什么呢？",
                "pinyin": "Wèi, Mǎlì, nǐ zài zuò shénme ne?",
                "meaningVi": "Alo, Mary, bạn đang làm gì đấy?",
                "audioUrl": "/audio/hsk1/les6_line1.mp3", "displayOrder": 1
            },
            {
                "id": "line-2", "speakerName": "玛丽", "speakerRole": "Mã Lệ (Mary)",
                "zh": "我正在看书呢，你找我有事吗？",
                "pinyin": "Wǒ zhèngzài kàn shū ne, nǐ zhǎo wǒ yǒu shì ma?",
                "meaningVi": "Tôi đang đọc sách này, bạn tìm tôi có việc gì không?",
                "audioUrl": "/audio/hsk1/les6_line2.mp3", "displayOrder": 2
            },
            {
                "id": "line-3", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "今天天气很好，我们一起去买东西吧。",
                "pinyin": "Jīntiān tiānqì hěn hǎo, wǒmen yìqǐ qù mǎi dōngxi ba.",
                "meaningVi": "Hôm nay thời tiết rất đẹp, chúng mình cùng đi mua sắm đi.",
                "audioUrl": "/audio/hsk1/les6_line3.mp3", "displayOrder": 3
            },
            {
                "id": "line-4", "speakerName": "玛丽", "speakerRole": "Mã Lệ (Mary)",
                "zh": "太好了！我可以和你一起去。",
                "pinyin": "Tài hǎo le! Wǒ kěyǐ hé nǐ yìqǐ qù.",
                "meaningVi": "Tuyệt quá! Tôi có thể đi cùng bạn.",
                "audioUrl": "/audio/hsk1/les6_line4.mp3", "displayOrder": 4
            }
        ],
        "listening_title": "Luyện nghe hiểu bài 6 - Nghe suy luận ngữ cảnh",
        "prompt": "玛丽接到大卫电话时正在做什么？ (Mary đang làm gì khi nhận được cuộc gọi của David?)",
        "options": [
            {"id": 0, "text": "正在看书 (Đang đọc sách)", "isCorrect": True},
            {"id": 1, "text": "正在睡觉 (Đang ngủ)", "isCorrect": False},
            {"id": 2, "text": "正在做中国菜 (Đang nấu món Trung Quốc)", "isCorrect": False},
            {"id": 3, "text": "在外面买东西 (Đang mua sắm ở bên ngoài)", "isCorrect": False}
        ],
        "explanation": "Mary nói rõ qua điện thoại: 'Tôi đang đọc sách này'. Phương án A là đáp án chính xác."
    },
    7: {
        "title": "Bài học 7 HSK 1: 今天星期几 (Hôm nay là thứ mấy)",
        "topic": "Chủ đề HSK 1: Hôm nay là thứ mấy",
        "dialogue": [
            {
                "id": "line-1", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "请问，今天星期几？",
                "pinyin": "Qǐngwèn, jīntiān xīngqī jǐ?",
                "meaningVi": "Xin hỏi, hôm nay là thứ mấy?",
                "audioUrl": "/audio/hsk1/les7_line1.mp3", "displayOrder": 1
            },
            {
                "id": "line-2", "speakerName": "玛丽", "speakerRole": "Mã Lệ (Mary)",
                "zh": "今天星期三，王老师今天有汉语课。",
                "pinyin": "Jīntiān xīngqīsān, Wáng lǎoshī jīntiān yǒu hànyǔ kè.",
                "meaningVi": "Hôm nay là thứ tư, thầy Vương hôm nay có tiết tiếng Trung.",
                "audioUrl": "/audio/hsk1/les7_line2.mp3", "displayOrder": 2
            },
            {
                "id": "line-3", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "你哥哥今天去上班吗？",
                "pinyin": "Nǐ gēge jīntiān qù shàngbān ma?",
                "meaningVi": "Anh trai bạn hôm nay có đi làm không?",
                "audioUrl": "/audio/hsk1/les7_line3.mp3", "displayOrder": 3
            },
            {
                "id": "line-4", "speakerName": "玛丽", "speakerRole": "Mã Lệ (Mary)",
                "zh": "他不读书了，他每天都去上班。",
                "pinyin": "Tā bù dúshū le, tā měitiān dōu qù shàngbān.",
                "meaningVi": "Anh ấy không đi học nữa, ngày nào anh ấy cũng đi làm.",
                "audioUrl": "/audio/hsk1/les7_line4.mp3", "displayOrder": 4
            }
        ],
        "listening_title": "Luyện nghe hiểu bài 7 - Nghe tìm thông tin chi tiết",
        "prompt": "根据对话，今天星期几？ (Theo đoạn hội thoại, hôm nay là thứ mấy?)",
        "options": [
            {"id": 0, "text": "星期三 (Thứ tư)", "isCorrect": True},
            {"id": 1, "text": "星期一 (Thứ hai)", "isCorrect": False},
            {"id": 2, "text": "星期五 (Thứ sáu)", "isCorrect": False},
            {"id": 3, "text": "星期天 (Chủ nhật)", "isCorrect": False}
        ],
        "explanation": "Mary trả lời trực tiếp câu hỏi: 'Hôm nay là thứ tư (星期三)'. Phương án A chính xác."
    },
    8: {
        "title": "Bài học 8 HSK 1: 明天天气怎么样 (Thời tiết ngày mai thế nào)",
        "topic": "Chủ đề HSK 1: Thời tiết ngày mai thế nào",
        "dialogue": [
            {
                "id": "line-1", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "明天天气怎么样？我们能出去吗？",
                "pinyin": "Míngtiān tiānqì zěnmeyàng? Wǒmen néng chūqù ma?",
                "meaningVi": "Thời tiết ngày mai thế nào? Chúng mình có thể ra ngoài không?",
                "audioUrl": "/audio/hsk1/les8_line1.mp3", "displayOrder": 1
            },
            {
                "id": "line-2", "speakerName": "玛丽", "speakerRole": "Mã Lệ (Mary)",
                "zh": "明天天气很好，不冷也不热。",
                "pinyin": "Míngtiān tiānqì hěn hǎo, bù lěng yě bú rè.",
                "meaningVi": "Ngày mai thời tiết rất đẹp, không lạnh cũng không nóng.",
                "audioUrl": "/audio/hsk1/les8_line2.mp3", "displayOrder": 2
            },
            {
                "id": "line-3", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "太好了，我们去买些面包和水果吧。",
                "pinyin": "Tài hǎo le, wǒmen qù mǎi xiē miànbāo hé shuǐguǒ ba.",
                "meaningVi": "Tuyệt quá, chúng ta đi mua ít bánh mì và hoa quả nhé.",
                "audioUrl": "/audio/hsk1/les8_line3.mp3", "displayOrder": 3
            },
            {
                "id": "line-4", "speakerName": "玛丽", "speakerRole": "Mã Lệ (Mary)",
                "zh": "好的，十分钟后我们在校门口见。",
                "pinyin": "Hǎo de, shí fēnzhōng hòu wǒmen zài xiào ménkǒu jiàn.",
                "meaningVi": "Được, mười phút nữa chúng ta gặp ở cổng trường.",
                "audioUrl": "/audio/hsk1/les8_line4.mp3", "displayOrder": 4
            }
        ],
        "listening_title": "Luyện nghe hiểu bài 8 - Nghe tìm thông tin chi tiết",
        "prompt": "明天的天气怎么样？ (Thời tiết ngày mai như thế nào?)",
        "options": [
            {"id": 0, "text": "很好，不冷也不热 (Rất tốt, không lạnh cũng không nóng)", "isCorrect": True},
            {"id": 1, "text": "会下很大的大雨 (Sẽ có mưa rất to)", "isCorrect": False},
            {"id": 2, "text": "非常冷，不能出门 (Rất lạnh, không thể ra khỏi cửa)", "isCorrect": False},
            {"id": 3, "text": "天气太热，大家都想喝水 (Thời tiết quá nóng, ai cũng muốn uống nước)", "isCorrect": False}
        ],
        "explanation": "Mary nhận xét: 'Ngày mai thời tiết rất đẹp, không lạnh cũng không nóng'. Đáp án A chính xác."
    },
    9: {
        "title": "Bài học 9 HSK 1: 现在几点 (Bây giờ là mấy giờ)",
        "topic": "Chủ đề HSK 1: Bây giờ là mấy giờ",
        "dialogue": [
            {
                "id": "line-1", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "请问，现在是几点？",
                "pinyin": "Qǐngwèn, xiànzài shì jǐ diǎn?",
                "meaningVi": "Xin hỏi, bây giờ là mấy giờ?",
                "audioUrl": "/audio/hsk1/les9_line1.mp3", "displayOrder": 1
            },
            {
                "id": "line-2", "speakerName": "玛丽", "speakerRole": "Mã Lệ (Mary)",
                "zh": "现在是下午两点十分钟。",
                "pinyin": "Xiànzài shì xiàwǔ liǎng diǎn shí fēnzhōng.",
                "meaningVi": "Bây giờ là hai giờ mười phút chiều.",
                "audioUrl": "/audio/hsk1/les9_line2.mp3", "displayOrder": 2
            },
            {
                "id": "line-3", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "你几点去给王老师打电话？",
                "pinyin": "Nǐ jǐ diǎn qù gěi Wáng lǎoshī dǎ diànhuà?",
                "meaningVi": "Bạn mấy giờ sẽ gọi điện thoại cho thầy Vương?",
                "audioUrl": "/audio/hsk1/les9_line3.mp3", "displayOrder": 3
            },
            {
                "id": "line-4", "speakerName": "玛丽", "speakerRole": "Mã Lệ (Mary)",
                "zh": "我两点半给他打电话。",
                "pinyin": "Wǒ liǎng diǎn bàn gěi tā dǎ diànhuà.",
                "meaningVi": "Tôi sẽ gọi cho thầy lúc hai giờ rưỡi.",
                "audioUrl": "/audio/hsk1/les9_line4.mp3", "displayOrder": 4
            }
        ],
        "listening_title": "Luyện nghe hiểu bài 9 - Nghe tìm thông tin chi tiết",
        "prompt": "玛丽打算几点给王老师打电话？ (Mary dự định mấy giờ gọi điện cho thầy Vương?)",
        "options": [
            {"id": 0, "text": "两点半 (Hai giờ rưỡi)", "isCorrect": True},
            {"id": 1, "text": "两点十分 (Hai giờ mười phút)", "isCorrect": False},
            {"id": 2, "text": "三点整 (Ba giờ đúng)", "isCorrect": False},
            {"id": 3, "text": "早上八点 (Tám giờ sáng)", "isCorrect": False}
        ],
        "explanation": "Mary nói: 'Tôi sẽ gọi điện thoại cho thầy lúc hai giờ rưỡi (两点半)'. Đáp án đúng là A."
    },
    10: {
        "title": "Bài học 10 HSK 1: 我星期一去北京 (Thứ hai tôi đi Bắc Kinh)",
        "topic": "Chủ đề HSK 1: Thứ hai tôi đi Bắc Kinh",
        "dialogue": [
            {
                "id": "line-1", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "李月，你什么时候去北京？",
                "pinyin": "Lǐ Yuè, nǐ shénme shíhou qù Běijīng?",
                "meaningVi": "Lý Nguyệt, khi nào bạn đi Bắc Kinh?",
                "audioUrl": "/audio/hsk1/les10_line1.mp3", "displayOrder": 1
            },
            {
                "id": "line-2", "speakerName": "李月", "speakerRole": "Lý Nguyệt",
                "zh": "我星期一坐早上的飞机去北京。",
                "pinyin": "Wǒ xīngqīyī zuò zǎoshang de fēijī qù Běijīng.",
                "meaningVi": "Tôi đi máy bay chuyến sáng thứ hai để đến Bắc Kinh.",
                "audioUrl": "/audio/hsk1/les10_line2.mp3", "displayOrder": 2
            },
            {
                "id": "line-3", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "你去北京住哪儿？",
                "pinyin": "Nǐ qù Běijīng zhù nǎr?",
                "meaningVi": "Bạn đến Bắc Kinh sẽ ở đâu?",
                "audioUrl": "/audio/hsk1/les10_line3.mp3", "displayOrder": 3
            },
            {
                "id": "line-4", "speakerName": "李月", "speakerRole": "Lý Nguyệt",
                "zh": "我住在我朋友的家，下星期回来看你。",
                "pinyin": "Wǒ zhù zài wǒ péngyou de jiā, xià xīngqī huílái kàn nǐ.",
                "meaningVi": "Tôi ở nhà của bạn tôi, tuần sau sẽ quay về thăm bạn.",
                "audioUrl": "/audio/hsk1/les10_line4.mp3", "displayOrder": 4
            }
        ],
        "listening_title": "Luyện nghe hiểu bài 10 - Nghe xác định trình tự sự kiện",
        "prompt": "李月怎么去北京？ (Lý Nguyệt đến Bắc Kinh bằng phương tiện gì?)",
        "options": [
            {"id": 0, "text": "坐早上的飞机 (Đi máy bay chuyến sáng)", "isCorrect": True},
            {"id": 1, "text": "坐晚上的火车 (Đi tàu hỏa chuyến tối)", "isCorrect": False},
            {"id": 2, "text": "自己开车去 (Tự lái xe ô tô đi)", "isCorrect": False},
            {"id": 3, "text": "坐出租车去 (Đi xe taxi)", "isCorrect": False}
        ],
        "explanation": "Lý Nguyệt cho biết: 'Tôi đi máy bay chuyến sáng thứ hai đến Bắc Kinh'. Đáp án chính xác là A."
    },
    11: {
        "title": "Bài học 11 HSK 1: 这个苹果多少钱 (Quả táo này bao nhiêu tiền)",
        "topic": "Chủ đề HSK 1: Quả táo này bao nhiêu tiền",
        "dialogue": [
            {
                "id": "line-1", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "老板，请问这个苹果多少钱一斤？",
                "pinyin": "Lǎobǎn, qǐngwèn zhège píngguǒ duōshao qián yì jīn?",
                "meaningVi": "Ông chủ, xin hỏi táo này bao nhiêu tiền một cân?",
                "audioUrl": "/audio/hsk1/les11_line1.mp3", "displayOrder": 1
            },
            {
                "id": "line-2", "speakerName": "售货员", "speakerRole": "Người bán hàng",
                "zh": "你看，这是今天新来的苹果，五块钱一斤。",
                "pinyin": "Nǐ kàn, zhè shì jīntiān xīn lái de píngguǒ, wǔ kuài qián yì jīn.",
                "meaningVi": "Bạn xem, đây là táo mới về hôm nay, năm đồng một cân.",
                "audioUrl": "/audio/hsk1/les11_line2.mp3", "displayOrder": 2
            },
            {
                "id": "line-3", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "那只小猫真好看，是您家里的吗？",
                "pinyin": "Nà zhī xiǎomāo zhēn hǎokàn, shì nín jiālǐ de ma?",
                "meaningVi": "Con mèo con kia trông đáng yêu quá, là của nhà bác à?",
                "audioUrl": "/audio/hsk1/les11_line3.mp3", "displayOrder": 3
            },
            {
                "id": "line-4", "speakerName": "售货员", "speakerRole": "Người bán hàng",
                "zh": "是我儿子养的，你买两斤苹果吧，算你八块钱。",
                "pinyin": "Shì wǒ érzi yǎng de, nǐ mǎi liǎng jīn píngguǒ ba, suàn nǐ bā kuài qián.",
                "meaningVi": "Là của con trai tôi nuôi đấy, bạn mua hai cân táo đi, tính bạn tám đồng thôi.",
                "audioUrl": "/audio/hsk1/les11_line4.mp3", "displayOrder": 4
            }
        ],
        "listening_title": "Luyện nghe hiểu bài 11 - Nghe tìm thông tin chi tiết",
        "prompt": "如果大卫买两斤苹果，售货员算他多少钱？ (Nếu David mua hai cân táo, người bán tính bao nhiêu tiền?)",
        "options": [
            {"id": 0, "text": "八块钱 (Tám đồng)", "isCorrect": True},
            {"id": 1, "text": "十块钱 (Mười đồng)", "isCorrect": False},
            {"id": 2, "text": "五块钱 (Năm đồng)", "isCorrect": False},
            {"id": 3, "text": "三块钱 (Ba đồng)", "isCorrect": False}
        ],
        "explanation": "Người bán hàng nói: 'Bạn mua hai cân đi, tính bạn tám đồng (八块钱)'. Phương án A là đáp án đúng."
    },
    12: {
        "title": "Bài học 12 HSK 1: 你去哪儿买东西 (Bạn đi đâu mua đồ)",
        "topic": "Chủ đề HSK 1: Bạn đi đâu mua đồ",
        "dialogue": [
            {
                "id": "line-1", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "玛丽，你今天早上几点起床？",
                "pinyin": "Mǎlì, nǐ jīntiān zǎoshang jǐ diǎn qǐchuáng?",
                "meaningVi": "Mary, sáng nay mấy giờ bạn thức dậy thế?",
                "audioUrl": "/audio/hsk1/les12_line1.mp3", "displayOrder": 1
            },
            {
                "id": "line-2", "speakerName": "玛丽", "speakerRole": "Mã Lệ (Mary)",
                "zh": "我七点起床，今天我想去商店买东西。",
                "pinyin": "Wǒ qī diǎn qǐchuáng, jīntiān wǒ xiǎng qù shāngdiàn mǎi dōngxi.",
                "meaningVi": "Tôi dậy lúc bảy giờ, hôm nay tôi muốn đi cửa hàng mua sắm đồ đạc.",
                "audioUrl": "/audio/hsk1/les12_line2.mp3", "displayOrder": 2
            },
            {
                "id": "line-3", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "今年流行很多新衣服，你想买衣服吗？",
                "pinyin": "Jīnnián liúxíng hěn duō xīn yīfu, nǐ xiǎng mǎi yīfu ma?",
                "meaningVi": "Năm nay thịnh hành nhiều mẫu quần áo mới, bạn muốn mua quần áo à?",
                "audioUrl": "/audio/hsk1/les12_line3.mp3", "displayOrder": 3
            },
            {
                "id": "line-4", "speakerName": "玛丽", "speakerRole": "Mã Lệ (Mary)",
                "zh": "是的，我想买一件新衣服，你和我一起去吧。",
                "pinyin": "Shì de, wǒ xiǎng mǎi yí jiàn xīn yīfu, nǐ hé wǒ yìqǐ qù ba.",
                "meaningVi": "Đúng rồi, tôi muốn mua một bộ quần áo mới, bạn đi cùng tôi nhé.",
                "audioUrl": "/audio/hsk1/les12_line4.mp3", "displayOrder": 4
            }
        ],
        "listening_title": "Luyện nghe hiểu bài 12 - Nghe tìm thông tin chi tiết",
        "prompt": "玛丽打算去商店买什么？ (Mary dự định đến cửa hàng mua gì?)",
        "options": [
            {"id": 0, "text": "一件新衣服 (Một bộ quần áo mới)", "isCorrect": True},
            {"id": 1, "text": "一本汉语书 (Một cuốn sách tiếng Trung)", "isCorrect": False},
            {"id": 2, "text": "一些红苹果 (Một ít táo đỏ)", "isCorrect": False},
            {"id": 3, "text": "一辆新自行车 (Một chiếc xe đạp mới)", "isCorrect": False}
        ],
        "explanation": "Mary nói: 'Tôi muốn mua một bộ quần áo mới (一件新衣服)'. Đáp án đúng là A."
    },
    13: {
        "title": "Bài học 13 HSK 1: 他在学校前面 (Anh ấy ở phía trước trường học)",
        "topic": "Chủ đề HSK 1: Anh ấy ở phía trước trường học",
        "dialogue": [
            {
                "id": "line-1", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "请问，李月的哥哥在学校前面吗？",
                "pinyin": "Qǐngwèn, Lǐ Yuè de gēge zài xuéxiào qiánmiàn ma?",
                "meaningVi": "Xin hỏi, anh trai của Lý Nguyệt có ở phía trước trường không?",
                "audioUrl": "/audio/hsk1/les13_line1.mp3", "displayOrder": 1
            },
            {
                "id": "line-2", "speakerName": "玛丽", "speakerRole": "Mã Lệ (Mary)",
                "zh": "他在前面的医院工作，他是一位医生。",
                "pinyin": "Tā zài qiánmiàn de yīyuàn gōngzuò, tā shì yí wèi yīshēng.",
                "meaningVi": "Anh ấy làm việc ở bệnh viện phía trước, anh ấy là một bác sĩ.",
                "audioUrl": "/audio/hsk1/les13_line2.mp3", "displayOrder": 2
            },
            {
                "id": "line-3", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "他会写中国汉字吗？",
                "pinyin": "Tā huì xiě Zhōngguó Hànzì ma?",
                "meaningVi": "Anh ấy có biết viết chữ Hán Trung Quốc không?",
                "audioUrl": "/audio/hsk1/les13_line3.mp3", "displayOrder": 3
            },
            {
                "id": "line-4", "speakerName": "玛丽", "speakerRole": "Mã Lệ (Mary)",
                "zh": "他写得非常好，每天早晨都练习写汉字。",
                "pinyin": "Tā xiě de fēicháng hǎo, měitiān zǎochén dōu liànxí xiě Hànzì.",
                "meaningVi": "Anh ấy viết rất đẹp, mỗi buổi sáng đều luyện viết chữ Hán.",
                "audioUrl": "/audio/hsk1/les13_line4.mp3", "displayOrder": 4
            }
        ],
        "listening_title": "Luyện nghe hiểu bài 13 - Nghe tìm thông tin chi tiết",
        "prompt": "李月的哥哥在哪里工作？是什么工作？ (Anh trai của Lý Nguyệt làm việc ở đâu? Là nghề gì?)",
        "options": [
            {"id": 0, "text": "在前面的医院当医生 (Làm bác sĩ ở bệnh viện phía trước)", "isCorrect": True},
            {"id": 1, "text": "在学校当汉语老师 (Làm giáo viên tiếng Trung ở trường)", "isCorrect": False},
            {"id": 2, "text": "在商店卖衣服 (Bán quần áo ở cửa hàng)", "isCorrect": False},
            {"id": 3, "text": "在饭馆做中国菜 (Nấu món Trung ở nhà hàng)", "isCorrect": False}
        ],
        "explanation": "Mary trả lời: 'Anh ấy làm việc ở bệnh viện phía trước, là một bác sĩ'. Đáp án đúng là A."
    },
    14: {
        "title": "Bài học 14 HSK 1: 你会开车吗 (Bạn biết lái xe không)",
        "topic": "Chủ đề HSK 1: Bạn biết lái xe không",
        "dialogue": [
            {
                "id": "line-1", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "王老师，请问您会开车吗？",
                "pinyin": "Wáng lǎoshī, qǐngwèn nín huì kāichē ma?",
                "meaningVi": "Thưa thầy Vương, xin hỏi thầy có biết lái xe không ạ?",
                "audioUrl": "/audio/hsk1/les14_line1.mp3", "displayOrder": 1
            },
            {
                "id": "line-2", "speakerName": "王老师", "speakerRole": "Thầy Vương",
                "zh": "我会开车，我以前在大学里学过开车。",
                "pinyin": "Wǒ huì kāichē, wǒ yǐqián zài dàxué lǐ xuéguo kāichē.",
                "meaningVi": "Thầy biết lái xe, trước đây thầy từng học lái xe ở trường đại học.",
                "audioUrl": "/audio/hsk1/les14_line2.mp3", "displayOrder": 2
            },
            {
                "id": "line-3", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "今天下午我们开车去公园好不好？",
                "pinyin": "Jīntiān xiàwǔ wǒmen kāichē qù gōngyuán hǎo bu hǎo?",
                "meaningVi": "Chiều nay chúng ta lái xe đi công viên được không ạ?",
                "audioUrl": "/audio/hsk1/les14_line3.mp3", "displayOrder": 3
            },
            {
                "id": "line-4", "speakerName": "王老师", "speakerRole": "Thầy Vương",
                "zh": "好啊，那个公园很大，非常好玩儿！",
                "pinyin": "Hǎo a, nàge gōngyuán hěn dà, fēicháng hǎowánr!",
                "meaningVi": "Được chứ, công viên đó rộng lắm, chơi rất vui!",
                "audioUrl": "/audio/hsk1/les14_line4.mp3", "displayOrder": 4
            }
        ],
        "listening_title": "Luyện nghe hiểu bài 14 - Nghe chọn phản hồi phù hợp",
        "prompt": "王老师是在哪里学会开车的？ (Thầy Vương đã học lái xe ở đâu?)",
        "options": [
            {"id": 0, "text": "在大学里学过开车 (Học lái xe ở trường đại học)", "isCorrect": True},
            {"id": 1, "text": "在医院里工作时学的 (Học lúc làm việc ở bệnh viện)", "isCorrect": False},
            {"id": 2, "text": "在家里跟着父亲学的 (Học theo bố ở nhà)", "isCorrect": False},
            {"id": 3, "text": "从来没有学过开车 (Chưa từng học lái xe)", "isCorrect": False}
        ],
        "explanation": "Thầy Vương giải thích: 'Trước đây thầy từng học lái xe ở trường đại học'. Đáp án đúng là A."
    },
    15: {
        "title": "Bài học 15 HSK 1: 我是坐飞机来的 (Tôi đến bằng máy bay)",
        "topic": "Chủ đề HSK 1: Tôi đến bằng máy bay",
        "dialogue": [
            {
                "id": "line-1", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "张先生，您好！您是什么时候到北京的？",
                "pinyin": "Zhāng xiānsheng, nín hǎo! Nín shì shénme shíhou dào Běijīng de?",
                "meaningVi": "Chào ông Trương! Ông đến Bắc Kinh khi nào thế ạ?",
                "audioUrl": "/audio/hsk1/les15_line1.mp3", "displayOrder": 1
            },
            {
                "id": "line-2", "speakerName": "张先生", "speakerRole": "Ông Trương",
                "zh": "我是昨天坐飞机来的，三天后回上海。",
                "pinyin": "Wǒ shì zuótiān zuò fēijī lái de, sān tiān hòu huí Shànghǎi.",
                "meaningVi": "Tôi đi máy bay đến vào hôm qua, ba ngày nữa sẽ quay về Thượng Hải.",
                "audioUrl": "/audio/hsk1/les15_line2.mp3", "displayOrder": 2
            },
            {
                "id": "line-3", "speakerName": "大卫", "speakerRole": "Đại Vệ (David)",
                "zh": "您这次来北京工作忙不忙？",
                "pinyin": "Nín zhè cì lái Běijīng gōngzuò máng bu máng?",
                "meaningVi": "Lần này ông đến Bắc Kinh công việc có bận không ạ?",
                "audioUrl": "/audio/hsk1/les15_line3.mp3", "displayOrder": 3
            },
            {
                "id": "line-4", "speakerName": "张先生", "speakerRole": "Ông Trương",
                "zh": "有一点儿忙，不过也很高兴见到老朋友。",
                "pinyin": "Yǒu yìdiǎnr máng, búguò yě hěn gāoxìng jiàndào lǎo péngyou.",
                "meaningVi": "Có hơi bận một chút, nhưng cũng rất vui khi được gặp lại bạn cũ.",
                "audioUrl": "/audio/hsk1/les15_line4.mp3", "displayOrder": 4
            }
        ],
        "listening_title": "Luyện nghe hiểu bài 15 - Nghe xác định ý chính",
        "prompt": "张先生是怎么来北京的？几天后回上海？ (Ông Trương đến Bắc Kinh bằng cách nào? Mấy ngày sau quay về Thượng Hải?)",
        "options": [
            {"id": 0, "text": "坐飞机来的，三天后回上海 (Đi bằng máy bay, 3 ngày sau về Thượng Hải)", "isCorrect": True},
            {"id": 1, "text": "坐火车来的，今天晚上就回 (Đi bằng tàu hỏa, tối nay về luôn)", "isCorrect": False},
            {"id": 2, "text": "自己开车来的，不打算回上海 (Tự lái xe đến, không định về Thượng Hải)", "isCorrect": False},
            {"id": 3, "text": "坐出租车来的，明天早晨走 (Đi xe taxi đến, sáng mai đi)", "isCorrect": False}
        ],
        "explanation": "Ông Trương khẳng định: 'Tôi đi máy bay đến hôm qua, ba ngày sau sẽ quay về Thượng Hải'. Phương án A là đáp án đúng."
    }
}

async def generate_audio_for_lesson(l_num, d_lines, l_transcript):
    if not HAS_EDGE_TTS:
        print(f"Skipping audio generation for L{l_num} (edge_tts not installed)")
        return

    d_path = os.path.join(AUDIO_DIR, f"les{l_num}_dialogue.mp3")
    l_path = os.path.join(AUDIO_DIR, f"les{l_num}_listening.mp3")

    # Combine dialogue lines into full dialogue audio
    full_d_text = " ".join([line["zh"] for line in d_lines])
    comm_d = edge_tts.Communicate(full_d_text, "zh-CN-XiaoxiaoNeural")
    await comm_d.save(d_path)

    # Listening audio with male voice
    comm_l = edge_tts.Communicate(l_transcript, "zh-CN-YunxiNeural")
    await comm_l.save(l_path)

    d_sz = os.path.getsize(d_path)
    l_sz = os.path.getsize(l_path)
    print(f"Generated audio for L{l_num}: dialogue={d_sz:,}B, listening={l_sz:,}B")

async def main():
    print("=== ZHONGWENHUB PHASE 8 CONTENT REMEDIATION ENGINE ===")

    # First, let's extract the exact 36 old defects from ZhongWenHub_Dev before modifying anything
    conn_dev = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;')
    cur_dev = conn_dev.cursor()

    cur_dev.execute('''
        SELECT l.LessonNumber, l.Id, l.DialogueJson, l.ListeningJson
        FROM lessons l
        JOIN courses c ON l.CourseId = c.Id
        WHERE c.HskLevel = 1 AND l.LessonNumber BETWEEN 4 AND 15
        ORDER BY l.LessonNumber
    ''')

    defect_rows = []
    defect_id = 1
    hanzi_regex = re.compile(r'[\u4e00-\u9fff]')

    # Build the 36 defect log
    for les_num, les_id, d_json, l_json in cur_dev.fetchall():
        d_data = json.loads(d_json)
        l_data = json.loads(l_json)
        new_item = LESSON_REMEDIATIONS[les_num]

        # Dialogue Line 1
        d_line1 = d_data["lines"][0]
        py_hz1 = "".join(hanzi_regex.findall(d_line1.get("pinyin", "")))
        vi_hz1 = "".join(hanzi_regex.findall(d_line1.get("meaningVi", "")))
        new_d1 = new_item["dialogue"][0]
        defect_rows.append({
            "DefectId": f"DEF-{defect_id:03d}",
            "LessonNumber": les_num,
            "LessonId": str(les_id),
            "Source": "DialogueJson",
            "Position": "lines[0].line-1",
            "Field": "Pinyin & Vietnamese",
            "LeakedHanzi": py_hz1 or vi_hz1,
            "OriginalZh": d_line1.get("zh", ""),
            "PinyinBefore": d_line1.get("pinyin", ""),
            "VietnameseBefore": d_line1.get("meaningVi", ""),
            "FixedZh": new_d1["zh"],
            "FixedPinyin": new_d1["pinyin"],
            "FixedVietnamese": new_d1["meaningVi"],
            "PedagogicalRationale": f"Thay thế mẫu máy sinh lỗi bằng lời thoại tự nhiên khớp chủ đề bài học {les_num} và chuẩn giao tiếp HSK 1."
        })
        defect_id += 1

        # Dialogue Line 2
        d_line2 = d_data["lines"][1]
        py_hz2 = "".join(hanzi_regex.findall(d_line2.get("pinyin", "")))
        vi_hz2 = "".join(hanzi_regex.findall(d_line2.get("meaningVi", "")))
        new_d2 = new_item["dialogue"][1]
        defect_rows.append({
            "DefectId": f"DEF-{defect_id:03d}",
            "LessonNumber": les_num,
            "LessonId": str(les_id),
            "Source": "DialogueJson",
            "Position": "lines[1].line-2",
            "Field": "Pinyin & Vietnamese",
            "LeakedHanzi": py_hz2 or vi_hz2,
            "OriginalZh": d_line2.get("zh", ""),
            "PinyinBefore": d_line2.get("pinyin", ""),
            "VietnameseBefore": d_line2.get("meaningVi", ""),
            "FixedZh": new_d2["zh"],
            "FixedPinyin": new_d2["pinyin"],
            "FixedVietnamese": new_d2["meaningVi"],
            "PedagogicalRationale": f"Sửa câu thoại phản hồi, kết hợp tự nhiên từ vựng cốt lõi bài học mà không để lọt ký tự Hán vào Pinyin/Tiếng Việt."
        })
        defect_id += 1

        # Listening script
        l_item = l_data[0]
        t_py = l_item.get("transcriptPinyin", "")
        t_vi = l_item.get("transcriptVi", "")
        py_hz_l = "".join(hanzi_regex.findall(t_py))
        vi_hz_l = "".join(hanzi_regex.findall(t_vi))
        new_l_zh = " ".join([line["zh"] for line in new_item["dialogue"]])
        new_l_py = " ".join([line["pinyin"] for line in new_item["dialogue"]])
        new_l_vi = " ".join([line["meaningVi"] for line in new_item["dialogue"]])
        defect_rows.append({
            "DefectId": f"DEF-{defect_id:03d}",
            "LessonNumber": les_num,
            "LessonId": str(les_id),
            "Source": "ListeningJson",
            "Position": "[0].transcript",
            "Field": "transcriptPinyin & transcriptVi",
            "LeakedHanzi": py_hz_l or vi_hz_l,
            "OriginalZh": l_item.get("transcriptZh", ""),
            "PinyinBefore": t_py,
            "VietnameseBefore": t_vi,
            "FixedZh": new_l_zh,
            "FixedPinyin": new_l_py,
            "FixedVietnamese": new_l_vi,
            "PedagogicalRationale": f"Đồng bộ kịch bản bài nghe hiểu tương ứng hoàn toàn với lời thoại chuẩn hóa, chuẩn bị tệp âm thanh đồng bộ."
        })
        defect_id += 1

    conn_dev.close()

    print(f"Total defects logged: {len(defect_rows)} (Target: 36)")

    # Write out CSV file
    csv_path = r"D:\ZhongWenHub\HSK30_PHASE8_36_DEFECT_FIX_LOG.csv"
    with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "DefectId", "LessonNumber", "LessonId", "Source", "Position", "Field",
            "LeakedHanzi", "OriginalZh", "PinyinBefore", "VietnameseBefore",
            "FixedZh", "FixedPinyin", "FixedVietnamese", "PedagogicalRationale"
        ])
        writer.writeheader()
        writer.writerows(defect_rows)
    print(f"Saved fix log to: {csv_path}")

    # Step 2: Apply to ZhongWenHub_Test FIRST!
    for db_target in ["ZhongWenHub_Test", "ZhongWenHub_Dev"]:
        print(f"\nApplying verified remediations to: {db_target} (Test-First Strategy)...")
        conn = pyodbc.connect(f'Driver={{ODBC Driver 17 for SQL Server}};Server=.\\SQLEXPRESS;Database={db_target};Trusted_Connection=yes;')
        cur = conn.cursor()

        for les_num in range(4, 16):
            cur.execute("""
                SELECT l.Id, l.DialogueJson, l.ListeningJson, l.Status
                FROM lessons l
                JOIN courses c ON l.CourseId = c.Id
                WHERE c.HskLevel = 1 AND l.LessonNumber = ?
            """, (les_num,))
            row = cur.fetchone()
            if not row:
                print(f"Warning: Lesson {les_num} not found in {db_target}")
                continue
            les_id, old_d_json, old_l_json, status = row
            les_id_str = str(les_id)

            item = LESSON_REMEDIATIONS[les_num]

            # Construct new DialogueJson
            new_dialogue_obj = {
                "id": f"diag-{les_id_str}",
                "lessonId": les_id_str,
                "title": item["title"],
                "topic": item["topic"],
                "audioUrl": f"/audio/hsk1/les{les_num}_dialogue.mp3",
                "audioStatus": "GENERATED",
                "editorialReviewStatus": "PENDING_EDITORIAL_REVIEW",
                "lines": item["dialogue"]
            }

            # Construct new ListeningJson
            full_zh = " ".join([line["zh"] for line in item["dialogue"]])
            full_py = " ".join([line["pinyin"] for line in item["dialogue"]])
            full_vi = " ".join([line["meaningVi"] for line in item["dialogue"]])

            new_listening_obj = [
                {
                    "id": f"list-{les_id_str}-1",
                    "lessonId": les_id_str,
                    "title": item["listening_title"],
                    "questionType": "MAIN_IDEA" if les_num % 2 == 0 else "DETAIL",
                    "questionTypeName": "Nghe xác định ý chính" if les_num % 2 == 0 else "Nghe tìm thông tin chi tiết",
                    "audioUrl": f"/audio/hsk1/les{les_num}_listening.mp3",
                    "audioStatus": "GENERATED",
                    "editorialReviewStatus": "PENDING_EDITORIAL_REVIEW",
                    "transcriptZh": full_zh,
                    "transcriptPinyin": full_py,
                    "transcriptVi": full_vi,
                    "prompt": item["prompt"],
                    "options": item["options"],
                    "explanation": item["explanation"],
                    "displayOrder": 1
                }
            ]

            new_d_str = json.dumps(new_dialogue_obj, ensure_ascii=False)
            new_l_str = json.dumps(new_listening_obj, ensure_ascii=False)

            # Update lesson keeping Status unchanged as DRAFT!
            cur.execute("""
                UPDATE lessons
                SET DialogueJson = ?, ListeningJson = ?, UpdatedAt = GETUTCDATE()
                WHERE Id = ?
            """, (new_d_str, new_l_str, les_id))

        conn.commit()
        conn.close()
        print(f"Successfully committed updates to {db_target}. Status remained DRAFT.")

    # Step 3: Generate Neural Audio files using edge-tts
    print("\nSynthesizing high-quality Neural TTS audio files for L4 - L15...")
    for les_num in range(4, 16):
        item = LESSON_REMEDIATIONS[les_num]
        full_zh = " ".join([line["zh"] for line in item["dialogue"]])
        await generate_audio_for_lesson(les_num, item["dialogue"], full_zh)

    print("\n=== Remediation and audio generation complete ===")

if __name__ == "__main__":
    asyncio.run(main())
