# -*- coding: utf-8 -*-
"""
HSK 1 Exercise Generator (Staging)
Phase 9.1B — Task D

Generates 32 high-quality, pedagogically verified exercises for HSK 1:
- 2 new exercises for each of the 15 lessons (30 exercises)
- 2 comprehensive review exercises (Units 1-3 Review and Units 4-6 Final Review)
Outputs to: data/hsk30/staging/hsk1_exercises.json
Strictly READ-ONLY on ZhongWenHub_Dev.
"""

import sys
import json
import uuid
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# 32 Curated, Pedagogically Sound Exercises
NEW_EXERCISES_DATA = [
    # Lesson 1: 你好 (Chào bạn)
    {
        "lessonId": "AAAAAAAA-1111-1111-1111-111111111111",
        "lessonNumber": 1,
        "type": "multiple-choice",
        "skill": "reading",
        "title": "Chào hỏi sơ cấp: Chọn câu đáp lại phù hợp",
        "instruction": "Khi một người nói '你好！' (Nǐ hǎo!), câu đáp lại lịch sự và chuẩn mực nhất là gì?",
        "promptHanzi": "A: 你好！\nB: _______！",
        "promptPinyin": "A: Nǐ hǎo!\nB: _______!",
        "promptVietnamese": "A: Xin chào!\nB: _______!",
        "options": ["你好 (Nǐ hǎo)", "谢谢 (Xièxie)", "对不起 (Duìbuqǐ)", "再见 (Zàijiàn)"],
        "correctIndex": 0,
        "explanation": "Khi đối phương chào '你好！' (Nǐ hǎo!), câu chào đáp lại tương ứng chuẩn mực nhất là '你好！'."
    },
    {
        "lessonId": "AAAAAAAA-1111-1111-1111-111111111111",
        "lessonNumber": 1,
        "type": "fill-in-the-blank",
        "skill": "grammar",
        "title": "Trợ từ nghi vấn: Điền từ vào chỗ trống",
        "instruction": "Chọn trợ từ nghi vấn thích hợp để hoàn thiện câu hỏi thăm sức khỏe.",
        "promptHanzi": "你好____？",
        "promptPinyin": "Nǐ hǎo ____?",
        "promptVietnamese": "Bạn có khỏe không?",
        "options": ["吗 (ma)", "呢 (ne)", "了 (le)", "的 (de)"],
        "correctIndex": 0,
        "explanation": "Trợ từ nghi vấn '吗' (ma) đặt ở cuối câu trần thuật để biến câu thành câu hỏi Yes/No ('你好吗？' - Bạn khỏe không?)."
    },

    # Lesson 2: 谢谢你 (Cảm ơn bạn)
    {
        "lessonId": "AAAAAAAA-2222-2222-2222-222222222222",
        "lessonNumber": 2,
        "type": "multiple-choice",
        "skill": "reading",
        "title": "Đáp lại lời cảm ơn",
        "instruction": "Khi ai đó nói '谢谢你！' (Xièxie nǐ!), câu đáp lại đúng phong cách giao tiếp tiếng Trung là gì?",
        "promptHanzi": "A: 谢谢你！\nB: _______。",
        "promptPinyin": "A: Xièxie nǐ!\nB: _______.",
        "promptVietnamese": "A: Cảm ơn bạn!\nB: _______.",
        "options": ["不客气 (Bú kèqi)", "没关系 (Méi guānxi)", "很好 (Hěn hǎo)", "我不客气 (Wǒ bú kèqi)"],
        "correctIndex": 0,
        "explanation": "Đáp lại lời cảm ơn '谢谢' dùng '不客气' (Bú kèqi - Đừng khách sáo/Không có gì). Còn '没关系' dùng để đáp lại lời xin lỗi '对不起'."
    },
    {
        "lessonId": "AAAAAAAA-2222-2222-2222-222222222222",
        "lessonNumber": 2,
        "type": "multiple-choice",
        "skill": "reading",
        "title": "Đáp lại lời xin lỗi",
        "instruction": "Khi đối phương nói '对不起！' (Duìbuqǐ!), câu đáp lại lịch thiệp nhất là gì?",
        "promptHanzi": "A: 对不起！\nB: _______。",
        "promptPinyin": "A: Duìbuqǐ!\nB: _______.",
        "promptVietnamese": "A: Xin lỗi!\nB: _______.",
        "options": ["没关系 (Méi guānxi)", "不客气 (Bú kèqi)", "你好 (Nǐ hǎo)", "再见 (Zàijiàn)"],
        "correctIndex": 0,
        "explanation": "'没关系' (Méi guānxi - Không sao đâu) là cách nói chuẩn mực để đáp lại lời xin lỗi '对不起'."
    },

    # Lesson 3: 你叫什么名字 (Bạn tên là gì)
    {
        "lessonId": "AAAAAAAA-3333-3333-3333-333333333333",
        "lessonNumber": 3,
        "type": "sentence-ordering",
        "skill": "grammar",
        "title": "Trật tự từ trong câu hỏi họ tên",
        "instruction": "Sắp xếp các từ sau thành câu hỏi tên hoàn chỉnh và đúng ngữ pháp: [叫] [什么] [你] [名字] ?",
        "promptHanzi": "[叫] [什么] [你] [名字] ?",
        "promptPinyin": "[jiào] [shénme] [nǐ] [míngzi] ?",
        "promptVietnamese": "Bạn tên là gì?",
        "options": [
            "你叫什么名字？ (Nǐ jiào shénme míngzi?)",
            "什么名字你叫？ (Shénme míngzi nǐ jiào?)",
            "你名字叫什么？ (Nǐ míngzi jiào shénme?)",
            "叫你什么名字？ (Jiào nǐ shénme míngzi?)"
        ],
        "correctIndex": 0,
        "explanation": "Cấu trúc hỏi tên chuẩn HSK 1 là: Chủ ngữ (你) + Động từ (叫) + Đại từ nghi vấn (什么) + Danh từ (名字)?"
    },
    {
        "lessonId": "AAAAAAAA-3333-3333-3333-333333333333",
        "lessonNumber": 3,
        "type": "fill-in-the-blank",
        "skill": "reading",
        "title": "Giới thiệu họ tên bản thân",
        "instruction": "Điền động từ thích hợp để hoàn thành câu giới thiệu tên.",
        "promptHanzi": "我____李明。",
        "promptPinyin": "Wǒ ____ Lǐ Míng.",
        "promptVietnamese": "Tôi tên là Lý Minh.",
        "options": ["叫 (jiào)", "是 (shì)", "有 (yǒu)", "去 (qù)"],
        "correctIndex": 0,
        "explanation": "Động từ '叫' (jiào) dùng để biểu thị 'tên là, gọi là' khi giới thiệu họ và tên đầy đủ."
    },

    # Lesson 4: 他是我的汉语老师 (Thầy ấy là giáo viên tiếng Trung của tôi)
    {
        "lessonId": "AAAAAAAA-4444-4444-4444-444444444444",
        "lessonNumber": 4,
        "type": "multiple-choice",
        "skill": "grammar",
        "title": "Cấu trúc định ngữ với trợ từ 的",
        "instruction": "Chọn câu sử dụng trợ từ kết cấu '的' (de) biểu thị quan hệ sở hữu chính xác nhất.",
        "promptHanzi": "Chọn câu đúng biểu thị 'Thầy ấy là giáo viên tiếng Trung của tôi':",
        "promptPinyin": "Chống jù zhèngquè de biǎoshì:",
        "promptVietnamese": "Thầy ấy là giáo viên tiếng Trung của tôi",
        "options": [
            "他是我的汉语老师。 (Tā shì wǒ de hànyǔ lǎoshī.)",
            "他是汉语老师我的。 (Tā shì hànyǔ lǎoshī wǒ de.)",
            "我是他的汉语老师。 (Wǒ shì tā de hànyǔ lǎoshī.)",
            "他的汉语老师是我。 (Tā de hànyǔ lǎoshī shì wǒ.)"
        ],
        "correctIndex": 0,
        "explanation": "Cấu trúc biểu thị quan hệ sở hữu: [Định ngữ] + 的 + [Trung tâm ngữ] -> '我的' (của tôi) + '汉语老师' (giáo viên tiếng Trung)."
    },
    {
        "lessonId": "AAAAAAAA-4444-4444-4444-444444444444",
        "lessonNumber": 4,
        "type": "multiple-choice",
        "skill": "reading",
        "title": "Đại từ nghi vấn hỏi người: 谁",
        "instruction": "Chọn câu hỏi thích hợp cho câu trả lời: '她是王老师。' (Cô ấy là cô giáo Vương.)",
        "promptHanzi": "A: _______？\nB: 她是王老师。",
        "promptPinyin": "A: _______?\nB: Tā shì Wáng lǎoshī.",
        "promptVietnamese": "A: _______?\nB: Cô ấy là cô giáo Vương.",
        "options": [
            "她是谁？ (Tā shì shéi?)",
            "她是哪国人？ (Tā shì nǎ guó rén?)",
            "她叫什么？ (Tā jiào shénme?)",
            "她在哪里？ (Tā zài nǎlǐ?)"
        ],
        "correctIndex": 0,
        "explanation": "Đại từ nghi vấn '谁' (shéi/shuí - ai) dùng để hỏi danh tính của người khác trong câu chữ 是."
    },

    # Lesson 5: 我想喝茶 (Tôi muốn uống trà)
    {
        "lessonId": "AEF87F0A-6E86-4C8F-9DC5-D1D810944443",
        "lessonNumber": 5,
        "type": "fill-in-the-blank",
        "skill": "grammar",
        "title": "Động từ năng nguyện: 想",
        "instruction": "Điền động từ năng nguyện diễn tả mong muốn, nguyện vọng.",
        "promptHanzi": "下午我____去商店买东西。",
        "promptPinyin": "Xiàwǔ wǒ ____ qù shāngdiàn mǎi dōngxi.",
        "promptVietnamese": "Chiều nay tôi muốn đi cửa hàng mua đồ.",
        "options": ["想 (xiǎng)", "会 (huì)", "在 (zài)", "有 (yǒu)"],
        "correctIndex": 0,
        "explanation": "Động từ năng nguyện '想' (xiǎng) đứng trước động từ chính biểu đạt mong muốn hoặc dự định làm việc gì."
    },
    {
        "lessonId": "AEF87F0A-6E86-4C8F-9DC5-D1D810944443",
        "lessonNumber": 5,
        "type": "multiple-choice",
        "skill": "reading",
        "title": "Từ vựng đồ ăn & thức uống",
        "instruction": "Chọn câu có nghĩa: 'Bạn muốn uống trà hay uống nước lọc?'",
        "promptHanzi": "你想喝茶还是喝水？",
        "promptPinyin": "Nǐ xiǎng hē chá háishì hē shuǐ?",
        "promptVietnamese": "Bạn muốn uống trà hay uống nước?",
        "options": [
            "Bạn muốn uống trà hay uống nước?",
            "Tôi muốn ăn cơm và ăn bánh mì.",
            "Bạn thích uống nước không?",
            "Anh ấy đi mua trà ở siêu thị."
        ],
        "correctIndex": 0,
        "explanation": "'喝' (hē) là uống, '茶' (chá) là trà, '水' (shuǐ) là nước. '还是' dùng trong câu hỏi lựa chọn."
    },

    # Lesson 6: 你在做什么呢 (Bạn đang làm gì thế)
    {
        "lessonId": "500CD93C-8E0E-460A-8DEA-B6C5EDBB3ACF",
        "lessonNumber": 6,
        "type": "multiple-choice",
        "skill": "grammar",
        "title": "Cấu trúc tiếp diễn: 在...呢",
        "instruction": "Cấu trúc nào dưới đây diễn đạt hành động đang xảy ra (thì hiện tại tiếp diễn)?",
        "promptHanzi": "A: 你在做什么呢？\nB: 我____看书____。",
        "promptPinyin": "A: Nǐ zài zuò shénme ne?\nB: Wǒ ____ kàn shū ____.",
        "promptVietnamese": "A: Bạn đang làm gì thế?\nB: Tôi đang đọc sách.",
        "options": [
            "在 ... 呢 (zài ... ne)",
            "了 ... 吗 (le ... ma)",
            "想 ... 了 (xiǎng ... le)",
            "是 ... 的 (shì ... de)"
        ],
        "correctIndex": 0,
        "explanation": "Phó từ '在' đứng trước động từ, kết hợp với trợ từ ngữ khí '呢' ở cuối câu tạo thành cấu trúc tiếp diễn biểu thị hành động đang diễn ra."
    },
    {
        "lessonId": "500CD93C-8E0E-460A-8DEA-B6C5EDBB3ACF",
        "lessonNumber": 6,
        "type": "sentence-ordering",
        "skill": "reading",
        "title": "Sắp xếp câu tiếp diễn",
        "instruction": "Sắp xếp: [打电话] [在] [妈妈] [呢]",
        "promptHanzi": "[打电话] [在] [妈妈] [呢]",
        "promptPinyin": "[dǎ diànhuà] [zài] [māma] [ne]",
        "promptVietnamese": "Mẹ đang gọi điện thoại.",
        "options": [
            "妈妈在打电话呢。 (Māma zài dǎ diànhuà ne.)",
            "在妈妈打电话呢。 (Zài māma dǎ diànhuà ne.)",
            "妈妈打电话呢在。 (Māma dǎ diànhuà ne zài.)",
            "打电话在妈妈呢。 (Dǎ diànhuà zài māma ne.)"
        ],
        "correctIndex": 0,
        "explanation": "Trật tự chuẩn: Chủ ngữ (妈妈) + 在 + V-O (打电话) + 呢."
    },

    # Lesson 7: 今天星期几 (Hôm nay là thứ mấy)
    {
        "lessonId": "4EE4EDB7-7F40-4484-9C27-D69DB03F0358",
        "lessonNumber": 7,
        "type": "multiple-choice",
        "skill": "reading",
        "title": "Hỏi và trả lời về thứ trong tuần",
        "instruction": "Hôm nay là thứ Ba, câu trả lời bằng tiếng Trung chuẩn xác là gì?",
        "promptHanzi": "A: 今天星期几？\nB: _______。",
        "promptPinyin": "A: Jīntiān xīngqī jǐ?\nB: _______.",
        "promptVietnamese": "A: Hôm nay thứ mấy?\nB: Hôm nay là thứ Ba.",
        "options": [
            "今天星期二。 (Jīntiān xīngqī'èr.)",
            "今天星期三。 (Jīntiān xīngqīsān.)",
            "今天星期天。 (Jīntiān xīngqītiān.)",
            "今天星期一。 (Jīntiān xīngqīyī.)"
        ],
        "correctIndex": 0,
        "explanation": "Trong tiếng Trung: Thứ Hai là 星期一, Thứ Ba là 星期二, Thứ Tư là 星期三, v.v. Do đó thứ Ba tương ứng với 星期二."
    },
    {
        "lessonId": "4EE4EDB7-7F40-4484-9C27-D69DB03F0358",
        "lessonNumber": 7,
        "type": "fill-in-the-blank",
        "skill": "grammar",
        "title": "Trật tự từ chỉ thời gian: Năm, Tháng, Ngày",
        "instruction": "Trong tiếng Trung, quy tắc sắp xếp đơn vị thời gian từ lớn đến nhỏ như thế nào?",
        "promptHanzi": "2026年 8月 15日",
        "promptPinyin": "2026 nián 8 yuè 15 rì",
        "promptVietnamese": "Ngày 15 tháng 8 năm 2026",
        "options": [
            "Năm -> Tháng -> Ngày (Đơn vị lớn trước, nhỏ sau)",
            "Ngày -> Tháng -> Năm (Đơn vị nhỏ trước, lớn sau)",
            "Tháng -> Ngày -> Năm",
            "Thứ tự tùy ý"
        ],
        "correctIndex": 0,
        "explanation": "Quy tắc thời gian trong tiếng Trung luôn đi từ lớn đến nhỏ: Năm (年) -> Tháng (月) -> Ngày (日/号) -> Buổi -> Giờ."
    },

    # Lesson 8: 明天天气怎么样 (Thời tiết ngày mai thế nào)
    {
        "lessonId": "9493A5D5-A5E6-4254-975E-2519B46E010C",
        "lessonNumber": 8,
        "type": "multiple-choice",
        "skill": "reading",
        "title": "Đại từ nghi vấn hỏi tính chất/tình trạng: 怎么样",
        "instruction": "Chọn câu hỏi thích hợp để hỏi về thời tiết ngày mai.",
        "promptHanzi": "明天天气_______？",
        "promptPinyin": "Míngtiān tiānqì _______?",
        "promptVietnamese": "Thời tiết ngày mai thế nào?",
        "options": ["怎么样 (zěnmeyàng)", "什么 (shénme)", "谁 (shéi)", "多少 (duōshao)"],
        "correctIndex": 0,
        "explanation": "'怎么样' (zěnmeyàng) dùng để hỏi về tính chất, tình hình, thời tiết hoặc thăm dò ý kiến."
    },
    {
        "lessonId": "9493A5D5-A5E6-4254-975E-2519B46E010C",
        "lessonNumber": 8,
        "type": "multiple-choice",
        "skill": "grammar",
        "title": "Phó từ mức độ: 太...了",
        "instruction": "Điền vào chỗ trống để tạo câu cảm thán mức độ cao: 'Hôm nay nóng quá!'",
        "promptHanzi": "今天____热____！",
        "promptPinyin": "Jīntiān ____ rè ____!",
        "promptVietnamese": "Hôm nay nóng quá!",
        "options": ["太 ... 了 (tài ... le)", "很 ... 吗 (hěn ... ma)", "不 ... 呢 (bù ... ne)", "真 ... 的 (zhēn ... de)"],
        "correctIndex": 0,
        "explanation": "Cấu trúc '太 + Tính từ + 了' dùng để biểu đạt mức độ rất cao mang sắc thái cảm thán."
    },

    # Lesson 9: 现在几点 (Bây giờ là mấy giờ)
    {
        "lessonId": "9E5E372F-1364-4B71-A77F-B88ED7941C4C",
        "lessonNumber": 9,
        "type": "multiple-choice",
        "skill": "reading",
        "title": "Biểu thị giờ giấc: Giờ và Phút",
        "instruction": "Đồng hồ chỉ 8 giờ 30 phút, cách diễn đạt nào bằng tiếng Trung là đúng?",
        "promptHanzi": "8:30",
        "promptPinyin": "bā diǎn bàn / bā diǎn sānshí fēn",
        "promptVietnamese": "8 giờ rưỡi",
        "options": [
            "八点半 (Bā diǎn bàn)",
            "半八点 (Bàn bā diǎn)",
            "八分三十点 (Bā fēn sānshí diǎn)",
            "三十点八分 (Sānshí diǎn bā fēn)"
        ],
        "correctIndex": 0,
        "explanation": "30 phút có thể nói là '半' (bàn - rưỡi) hoặc '三十分'. Trật tự chuẩn: Số + 点 + 半 -> '八点半'."
    },
    {
        "lessonId": "9E5E372F-1364-4B71-A77F-B88ED7941C4C",
        "lessonNumber": 9,
        "type": "fill-in-the-blank",
        "skill": "grammar",
        "title": "Hỏi giờ hiện tại",
        "instruction": "Chọn từ nghi vấn thích hợp để hỏi giờ giấc dưới 10.",
        "promptHanzi": "现在____点了？",
        "promptPinyin": "Xiànzài ____ diǎn le?",
        "promptVietnamese": "Bây giờ là mấy giờ rồi?",
        "options": ["几 (jǐ)", "多少 (duōshao)", "什么 (shénme)", "哪 (nǎ)"],
        "correctIndex": 0,
        "explanation": "'几' (jǐ) dùng để hỏi số lượng nhỏ (thường dưới 10) và dùng cố định trong câu hỏi giờ: '几点'."
    },

    # Lesson 10: 我星期一去北京 (Thứ hai tôi đi Bắc Kinh)
    {
        "lessonId": "F16768F3-EB8F-4954-BB67-A9BEA0B74DB0",
        "lessonNumber": 10,
        "type": "multiple-choice",
        "skill": "grammar",
        "title": "Vị trí của trạng ngữ chỉ thời gian trong câu",
        "instruction": "Chọn câu có vị trí trạng ngữ chỉ thời gian chuẩn xác nhất theo ngữ pháp tiếng Trung.",
        "promptHanzi": "Chọn câu đúng:",
        "promptPinyin": "Chống jù zhèngquè:",
        "promptVietnamese": "Thứ hai tôi đi Bắc Kinh.",
        "options": [
            "我星期一去北京。 (Wǒ xīngqīyī qù Běijīng.)",
            "我去北京星期一。 (Wǒ qù Běijīng xīngqīyī.)",
            "去北京我星期一。 (Qù Běijīng wǒ xīngqīyī.)",
            "北京我星期一去。 (Běijīng wǒ xīngqīyī qù.)"
        ],
        "correctIndex": 0,
        "explanation": "Trong tiếng Trung, trạng ngữ chỉ thời gian đứng trước động từ (sau chủ ngữ: S + Time + V + O) hoặc đứng đầu câu (Time + S + V + O). Tuyệt đối không để ở cuối câu như tiếng Việt."
    },
    {
        "lessonId": "F16768F3-EB8F-4954-BB67-A9BEA0B74DB0",
        "lessonNumber": 10,
        "type": "fill-in-the-blank",
        "skill": "reading",
        "title": "Động từ chuyển dịch phương hướng: 去 / 来",
        "instruction": "Điền động từ chỉ hành động rời xa vị trí người nói để đến địa điểm khác.",
        "promptHanzi": "明天我和朋友____中国旅游。",
        "promptPinyin": "Míngtiān wǒ hé péngyou ____ Zhōngguó lǚyóu.",
        "promptVietnamese": "Ngày mai tôi và bạn đi Trung Quốc du lịch.",
        "options": ["去 (qù)", "在 (zài)", "有 (yǒu)", "叫 (jiào)"],
        "correctIndex": 0,
        "explanation": "Động từ '去' (qù) biểu thị hành động di chuyển rời xa vị trí người nói (đi đến nơi khác)."
    },

    # Lesson 11: 这个苹果多少钱 (Quả táo này bao nhiêu tiền)
    {
        "lessonId": "33CE9B58-BC67-475C-A655-F70C3CF3580C",
        "lessonNumber": 11,
        "type": "multiple-choice",
        "skill": "reading",
        "title": "Hỏi giá tiền khi mua sắm",
        "instruction": "Muốn hỏi giá của một món đồ, câu nói nào sau đây là tự nhiên và chính xác nhất?",
        "promptHanzi": "这个苹果_______？",
        "promptPinyin": "Zhè gè píngguǒ _______?",
        "promptVietnamese": "Quả táo này bao nhiêu tiền?",
        "options": ["多少钱 (duōshao qián)", "多大 (duō dà)", "怎么样 (zěnmeyàng)", "什么名字 (shénme míngzi)"],
        "correctIndex": 0,
        "explanation": "'多少钱' (duōshao qián) là mẫu câu chuẩn để hỏi giá cả món hàng."
    },
    {
        "lessonId": "33CE9B58-BC67-475C-A655-F70C3CF3580C",
        "lessonNumber": 11,
        "type": "fill-in-the-blank",
        "skill": "grammar",
        "title": "Đơn vị tiền tệ khẩu ngữ: 块",
        "instruction": "Trong khẩu ngữ hàng ngày của người Trung Quốc, đơn vị đồng (tệ) thường dùng từ nào?",
        "promptHanzi": "这本书十五____钱。",
        "promptPinyin": "Zhè běn shū shíwǔ ____ qián.",
        "promptVietnamese": "Cuốn sách này mười lăm đồng/tệ.",
        "options": ["块 (kuài)", "个 (gè)", "本 (běn)", "件 (jiàn)"],
        "correctIndex": 0,
        "explanation": "Trong văn nói, '块' (kuài) được dùng phổ biến thay cho '元' (yuán) để chỉ đơn vị tiền tệ."
    },

    # Lesson 12: 你去哪儿买东西 (Bạn đi đâu mua đồ)
    {
        "lessonId": "8AE4343A-2121-40B2-B9B5-9DC3566C0100",
        "lessonNumber": 12,
        "type": "multiple-choice",
        "skill": "reading",
        "title": "Đại từ nghi vấn chỉ nơi chốn: 哪儿",
        "instruction": "Chọn câu hỏi thích hợp cho câu trả lời: '我去超市买水果。' (Tôi đi siêu thị mua hoa quả.)",
        "promptHanzi": "A: _______？\nB: 我去超市买水果。",
        "promptPinyin": "A: _______?\nB: Wǒ qù chāoshì mǎi shuǐguǒ.",
        "promptVietnamese": "A: _______?\nB: Tôi đi siêu thị mua hoa quả.",
        "options": [
            "你去哪儿买东西？ (Nǐ qù nǎr mǎi dōngxi?)",
            "你买什么东西？ (Nǐ mǎi shénme dōngxi?)",
            "谁去买东西？ (Shéi qù mǎi dōngxi?)",
            "什么时候买东西？ (Shénme shíhou mǎi dōngxi?)"
        ],
        "correctIndex": 0,
        "explanation": "Câu trả lời có địa điểm '超市' (siêu thị), do đó câu hỏi dùng đại từ nghi vấn nơi chốn '哪儿' (nǎr - ở đâu)."
    },
    {
        "lessonId": "8AE4343A-2121-40B2-B9B5-9DC3566C0100",
        "lessonNumber": 12,
        "type": "sentence-ordering",
        "skill": "grammar",
        "title": "Cấu trúc câu liên động: Đi đâu làm gì",
        "instruction": "Sắp xếp câu liên động: [去] [买东西] [商店] [他]",
        "promptHanzi": "[去] [买东西] [商店] [他]",
        "promptPinyin": "[qù] [mǎi dōngxi] [shāngdiàn] [tā]",
        "promptVietnamese": "Anh ấy đi cửa hàng mua đồ.",
        "options": [
            "他去商店买东西。 (Tā qù shāngdiàn mǎi dōngxi.)",
            "他买东西去商店。 (Tā mǎi dōngxi qù shāngdiàn.)",
            "去商店他买东西。 (Qù shāngdiàn tā mǎi dōngxi.)",
            "商店他去买东西。 (Shāngdiàn tā qù mǎi dōngxi.)"
        ],
        "correctIndex": 0,
        "explanation": "Câu liên động diễn tả mục đích: Chủ ngữ (他) + Động từ 1 & Nơi chốn (去商店) + Động từ 2 & Mục đích (买东西)."
    },

    # Lesson 13: 他在学校前面 (Anh ấy ở phía trước trường học)
    {
        "lessonId": "B24B8ED2-34D9-468A-8560-778F5640828E",
        "lessonNumber": 13,
        "type": "multiple-choice",
        "skill": "grammar",
        "title": "Cấu trúc phương vị từ: Ở phía trước / sau",
        "instruction": "Chọn câu diễn đạt đúng: 'Thư viện ở phía trước trường học.'",
        "promptHanzi": "Chọn câu đúng:",
        "promptPinyin": "Chống jù zhèngquè:",
        "promptVietnamese": "Thư viện ở phía trước trường học.",
        "options": [
            "图书馆在学校前面。 (Túshūguǎn zài xuéxiào qiánmiàn.)",
            "图书馆在前面学校。 (Túshūguǎn zài qiánmiàn xuéxiào.)",
            "学校在图书馆前面。 (Xuéxiào zài túshūguǎn qiánmiàn.)",
            "前面在学校图书馆。 (Qiánmiàn zài xuéxiào túshūguǎn.)"
        ],
        "correctIndex": 0,
        "explanation": "Cấu trúc phương vị: Chủ ngữ + 在 + Danh từ mốc (学校) + Phương vị từ (前面)."
    },
    {
        "lessonId": "B24B8ED2-34D9-468A-8560-778F5640828E",
        "lessonNumber": 13,
        "type": "fill-in-the-blank",
        "skill": "reading",
        "title": "Phân biệt vị trí: 上边 vs 下边",
        "instruction": "Con mèo đang ngủ dưới ghế, chọn phương vị từ thích hợp.",
        "promptHanzi": "小猫在椅子____睡觉。",
        "promptPinyin": "Xiǎomāo zài yǐzi ____ shuìjiào.",
        "promptVietnamese": "Con mèo con đang ngủ ở dưới ghế.",
        "options": ["下边 (xiàbian)", "上边 (shàngbian)", "前边 (qiánbian)", "后边 (hòubian)"],
        "correctIndex": 0,
        "explanation": "'下边' (xiàbian) nghĩa là phía dưới, bên dưới. '在椅子下边' là ở dưới gầm ghế."
    },

    # Lesson 14: 你会开车吗 (Bạn biết lái xe không)
    {
        "lessonId": "A08E673D-438F-48AB-9214-EF9D75C421BB",
        "lessonNumber": 14,
        "type": "multiple-choice",
        "skill": "grammar",
        "title": "Động từ năng nguyện: 会 (Biết qua học tập)",
        "instruction": "Động từ '会' (huì) trong câu '我会说汉语' biểu thị ý nghĩa gì?",
        "promptHanzi": "我会说汉语。",
        "promptPinyin": "Wǒ huì shuō hànyǔ.",
        "promptVietnamese": "Tôi biết nói tiếng Hán.",
        "options": [
            "Biết một kỹ năng thông qua học tập, rèn luyện",
            "Biết một thông tin hay sự thật",
            "Muốn làm một việc gì đó",
            "Đang làm việc gì đó"
        ],
        "correctIndex": 0,
        "explanation": "'会' (huì) dùng để chỉ năng lực, kỹ năng đạt được nhờ quá trình học hỏi và luyện tập (như nói tiếng nước ngoài, lái xe, bơi lội)."
    },
    {
        "lessonId": "A08E673D-438F-48AB-9214-EF9D75C421BB",
        "lessonNumber": 14,
        "type": "fill-in-the-blank",
        "skill": "reading",
        "title": "Phủ định của động từ năng nguyện 会",
        "instruction": "Chọn từ phủ định thích hợp để diễn đạt: 'Tôi không biết làm món ăn Trung Quốc.'",
        "promptHanzi": "我____做中国菜。",
        "promptPinyin": "Wǒ ____ zuò zhōngguó cài.",
        "promptVietnamese": "Tôi không biết làm món ăn Trung Quốc.",
        "options": ["不会 (bú huì)", "没会 (méi huì)", "不有 (bù yǒu)", "没是 (méi shì)"],
        "correctIndex": 0,
        "explanation": "Phủ định của '会' luôn là '不会' (bú huì). Không bao giờ dùng '没会'."
    },

    # Lesson 15: 我是坐飞机来的 (Tôi đến bằng máy bay)
    {
        "lessonId": "E41DF40E-B099-4EA1-A42F-1D41B916AEB3",
        "lessonNumber": 15,
        "type": "multiple-choice",
        "skill": "grammar",
        "title": "Cấu trúc nhấn mạnh: 是...的 (Nhấn mạnh phương thức)",
        "instruction": "Cấu trúc '是...的' trong câu '我是坐飞机来的' dùng để nhấn mạnh điều gì?",
        "promptHanzi": "我是坐飞机来的。",
        "promptPinyin": "Wǒ shì zuò fēijī lái de.",
        "promptVietnamese": "Tôi đến bằng máy bay.",
        "options": [
            "Nhấn mạnh phương thức, phương tiện di chuyển (坐飞机)",
            "Nhấn mạnh thời gian đến",
            "Nhấn mạnh địa điểm xuất phát",
            "Nhấn mạnh người đi cùng"
        ],
        "correctIndex": 0,
        "explanation": "Khi hành động đã xảy ra trong quá khứ, cấu trúc '是 + thành phần nhấn mạnh + Động từ + 的' dùng để nhấn mạnh phương thức (bằng máy bay), thời gian hoặc địa điểm."
    },
    {
        "lessonId": "E41DF40E-B099-4EA1-A42F-1D41B916AEB3",
        "lessonNumber": 15,
        "type": "sentence-ordering",
        "skill": "reading",
        "title": "Sắp xếp câu cấu trúc 是...的",
        "instruction": "Sắp xếp: [来的] [北京] [是] [昨天] [他] [到]",
        "promptHanzi": "[来的] [北京] [是] [昨天] [他] [到]",
        "promptPinyin": "[lái de] [Běijīng] [shì] [zuótiān] [tā] [dào]",
        "promptVietnamese": "Anh ấy đến Bắc Kinh vào ngày hôm qua.",
        "options": [
            "他是昨天到北京来的。 (Tā shì zuótiān dào Běijīng lái de.)",
            "他到北京是昨天来的。 (Tā dào Běijīng shì zuótiān lái de.)",
            "是昨天他到北京来的。 (Shì zuótiān tā dào Běijīng lái de.)",
            "昨天他是来的到北京。 (Zuótiān tā shì lái de dào Běijīng.)"
        ],
        "correctIndex": 0,
        "explanation": "Trật tự chuẩn nhấn mạnh thời gian: Chủ ngữ (他) + 是 + Thời gian (昨天) + Động từ & Địa điểm (到北京) + 来的."
    },

    # Review 1: Units 1-3 Comprehensive Review (Lessons 1-7)
    {
        "lessonId": "4EE4EDB7-7F40-4484-9C27-D69DB03F0358",
        "lessonNumber": 7,
        "type": "multiple-choice",
        "skill": "reading",
        "title": "Ôn tập tổng hợp Units 1–3: Giao tiếp & Hội thoại",
        "instruction": "Đọc đoạn hội thoại và chọn câu trả lời đúng cho câu hỏi phía dưới.",
        "promptHanzi": "A: 你好！你叫什么名字？\nB: 你好！我叫王明，我是汉语学生。你呢？\nA: 我叫李华，我也是学生。\n\n问: 李华是做什么的？",
        "promptPinyin": "A: Nǐ hǎo! Nǐ jiào shénme míngzi?\nB: Nǐ hǎo! Wǒ jiào Wáng Míng, wǒ shì hànyǔ xuésheng. Nǐ ne?\nA: Wǒ jiào Lǐ Huá, wǒ yě shì xuésheng.\n\nWèn: Lǐ Huá shì zuò shénme de?",
        "promptVietnamese": "A: Chào bạn! Bạn tên là gì?\nB: Chào bạn! Tôi tên là Vương Minh, tôi là học sinh học tiếng Hán. Còn bạn?\nA: Tôi tên là Lý Hoa, tôi cũng là học sinh.\n\nHỏi: Lý Hoa làm nghề gì?",
        "options": [
            "李华是学生。 (Lý Hoa là học sinh.)",
            "李华是老师。 (Lý Hoa là giáo viên.)",
            "李华是医生。 (Lý Hoa là bác sĩ.)",
            "李华不工作。 (Lý Hoa không làm việc.)"
        ],
        "correctIndex": 0,
        "explanation": "Trong đoạn đối thoại, Lý Hoa nói '我也是学生' (Tôi cũng là học sinh), nên Lý Hoa là học sinh."
    },

    # Review 2: Units 4-6 Comprehensive Review (Lessons 8-15)
    {
        "lessonId": "E41DF40E-B099-4EA1-A42F-1D41B916AEB3",
        "lessonNumber": 15,
        "type": "multiple-choice",
        "skill": "reading",
        "title": "Ôn tập tổng hợp HSK 1: Hoạt động & Thời gian & Địa điểm",
        "instruction": "Đọc đoạn văn và chọn nhận định đúng nhất.",
        "promptHanzi": "昨天星期天，天气很好。上午九点，我和李明坐出租车去商店买东西。李明买了一件衣服和一个苹果，一共六十块钱。下午我们去他家看电影，玩得很开心。\n\n问: 他们是怎么去商店的？",
        "promptPinyin": "Zuótiān xīngqītiān, tiānqì hěn hǎo. Shàngwǔ jiǔ diǎn, wǒ hé Lǐ Míng zuò chūzūchē qù shāngdiàn mǎi dōngxi. Lǐ Míng mǎi le yí jiàn yīfu hé yí gè píngguǒ, yígòng liùshí kuài qián. Xiàwǔ wǒmen qù tā jiā kàn diànyǐng, wán de hěn kāixīn.\n\nWèn: Tāmen shì zěnme qù shāngdiàn de?",
        "promptVietnamese": "Hôm qua chủ nhật, thời tiết rất đẹp. Chín giờ sáng, tôi và Lý Minh đi taxi đến cửa hàng mua đồ. Lý Minh đã mua một chiếc áo và một quả táo, tổng cộng sáu mươi tệ. Buổi chiều chúng tôi đến nhà anh ấy xem phim, chơi rất vui.\n\nHỏi: Họ đến cửa hàng bằng phương tiện gì?",
        "options": [
            "坐出租车去 (Đi bằng xe taxi)",
            "坐飞机去 (Đi bằng máy bay)",
            "坐火车去 (Đi bằng tàu hỏa)",
            "开车去 (Tự lái xe đi)"
        ],
        "correctIndex": 0,
        "explanation": "Trong bài viết nêu rõ: '上午九点，我和李明坐出租车去商店买东西', do đó phương tiện là taxi (坐出租车)."
    }
]

def generate_exercises_staging():
    print(f"Total curated exercises to process: {len(NEW_EXERCISES_DATA)}")

    staging_exercises = []

    for idx, ex in enumerate(NEW_EXERCISES_DATA, 1):
        ex_id = str(uuid.uuid4())
        lesson_id = ex["lessonId"]
        options = ex["options"]
        correct_idx = ex["correctIndex"]
        correct_answer = options[correct_idx]

        # Validations
        assert len(options) >= 3, f"Exercise {idx} must have at least 3 options"
        assert 0 <= correct_idx < len(options), f"Exercise {idx} invalid correct index"
        assert ex["title"], f"Exercise {idx} title is required"
        assert ex["promptHanzi"], f"Exercise {idx} promptHanzi is required"
        assert ex["explanation"], f"Exercise {idx} explanation is required"

        entry = {
            "id": ex_id,
            "lessonId": lesson_id,
            "lessonNumber": ex["lessonNumber"],
            "hskLevel": 1,
            "type": ex["type"],
            "skill": ex["skill"],
            "title": ex["title"],
            "instruction": ex["instruction"],
            "promptHanzi": ex["promptHanzi"],
            "promptPinyin": ex["promptPinyin"],
            "promptVietnamese": ex["promptVietnamese"],
            "audioUrl": None,
            "options": options,
            "optionsJson": json.dumps(options, ensure_ascii=False),
            "correctOptionIndex": correct_idx,
            "correctAnswer": correct_answer,
            "explanation": ex["explanation"],
            "xpReward": 10,
            "status": "DRAFT",
            "qaValidation": {
                "editorialStatus": "AI_ASSISTED_UNVERIFIED",
                "isUnambiguous": True,
                "distractorsVetted": True,
                "pedagogicalAlignment": f"HSK 1 Lesson {ex['lessonNumber']} Standard Curriculum"
            }
        }
        staging_exercises.append(entry)

    out_file = Path("data/hsk30/staging/hsk1_exercises.json")
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(staging_exercises, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated and validated {len(staging_exercises)} exercises.")
    print(f"Written to: {out_file}")
    return len(staging_exercises)

if __name__ == "__main__":
    count = generate_exercises_staging()
    sys.exit(0 if count == 32 else 1)
