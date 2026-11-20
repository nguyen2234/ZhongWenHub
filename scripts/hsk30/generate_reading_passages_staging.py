# -*- coding: utf-8 -*-
"""
HSK 1 Reading Passages Generator (Staging)
Phase 9.1B — Task E

Generates 6 short, authentic connected reading passages (20-40 Hanzi each)
for the 6 Unit-ending lessons in HSK 1:
- Unit 1 End: Lesson 2 (AAAAAAAA-2222-2222-2222-222222222222)
- Unit 2 End: Lesson 4 (AAAAAAAA-4444-4444-4444-444444444444)
- Unit 3 End: Lesson 7 (4EE4EDB7-7F40-4484-9C27-D69DB03F0358)
- Unit 4 End: Lesson 10 (F16768F3-EB8F-4954-BB67-A9BEA0B74DB0)
- Unit 5 End: Lesson 13 (B24B8ED2-34D9-468A-8560-778F5640828E)
- Unit 6 End: Lesson 15 (E41DF40E-B099-4EA1-A42F-1D41B916AEB3)

Outputs to: data/hsk30/staging/hsk1_reading_passages.json
Strictly READ-ONLY on ZhongWenHub_Dev.
"""

import sys
import json
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PASSAGES_DATA = [
    {
        "unitNumber": 1,
        "lessonNumber": 2,
        "lessonId": "AAAAAAAA-2222-2222-2222-222222222222",
        "titleZh": "你好，朋友！",
        "titleVi": "Chào bạn nhé!",
        "targetWords": ["你好", "谢谢", "不客气", "再见", "朋友"],
        "targetGrammar": ["Chào hỏi sơ cấp", "Đáp từ cảm ơn và xin lỗi"],
        "passageZh": "你好！我是大卫。这是我的中国朋友，他叫李明。我们天天在一起学习，我们明天见！",
        "passagePinyin": "Nǐ hǎo! Wǒ shì Dàwèi. Zhè shì wǒ de zhōngguó péngyou, tā jiào Lǐ Míng. Wǒmen tiāntiān zài yìqǐ xuéxí, wǒmen míngtiān jiàn!",
        "passageVi": "Xin chào! Tôi là David. Đây là người bạn Trung Quốc của tôi, cậu ấy tên là Lý Minh. Ngày nào chúng tôi cũng học cùng nhau, hẹn ngày mai gặp lại!",
        "characterCount": 38,
        "comprehensionQuestions": [
            {
                "questionZh": "大卫的中国朋友叫什么名字？",
                "questionPinyin": "Dàwèi de zhōngguó péngyou jiào shénme míngzi?",
                "questionVi": "Bạn người Trung Quốc của David tên là gì?",
                "options": ["李明 (Lǐ Míng)", "王明 (Wáng Míng)", "张三 (Zhāng Sān)", "大卫 (Dàwèi)"],
                "correctIndex": 0,
                "explanation": "Trong đoạn văn nêu rõ: '这是我的中国朋友，他叫李明。'"
            }
        ]
    },
    {
        "unitNumber": 2,
        "lessonNumber": 4,
        "lessonId": "AAAAAAAA-4444-4444-4444-444444444444",
        "titleZh": "我的汉语老师",
        "titleVi": "Thầy giáo tiếng Trung của tôi",
        "targetWords": ["老师", "汉语", "学生", "中国", "很"],
        "targetGrammar": ["Câu chữ 是", "Trợ từ sở hữu 的"],
        "passageZh": "他是王老师。他是中国人，也是我们的汉语老师。他人很好，我们都很喜欢他。",
        "passagePinyin": "Tā shì Wáng lǎoshī. Tā shì zhōngguó rén, yě shì wǒmen de hànyǔ lǎoshī. Tā rén hěn hǎo, wǒmen dōu hěn xǐhuan tā.",
        "passageVi": "Thầy ấy là thầy giáo Vương. Thầy là người Trung Quốc, cũng là thầy giáo dạy tiếng Hán của chúng tôi. Tính thầy rất tốt, chúng tôi đều rất quý mến thầy.",
        "characterCount": 35,
        "comprehensionQuestions": [
            {
                "questionZh": "王老师教他们什么？",
                "questionPinyin": "Wáng lǎoshī jiāo tāmen shénme?",
                "questionVi": "Thầy giáo Vương dạy họ môn gì?",
                "options": ["汉语 (Hànyǔ)", "英语 (Yīngyǔ)", "法语 (Fǎyǔ)", "画画 (Huàhuà)"],
                "correctIndex": 0,
                "explanation": "Trong đoạn văn: '也是我们的汉语老师', thầy Vương dạy tiếng Hán."
            }
        ]
    },
    {
        "unitNumber": 3,
        "lessonNumber": 7,
        "lessonId": "4EE4EDB7-7F40-4484-9C27-D69DB03F0358",
        "titleZh": "星期天的一天",
        "titleVi": "Một ngày chủ nhật",
        "targetWords": ["今天", "星期天", "吃", "米饭", "喝茶"],
        "targetGrammar": ["Hỏi thứ ngày tháng", "Trạng ngữ chỉ thời gian"],
        "passageZh": "今天星期天，我不去学校。中午我和妈妈在家吃米饭，下午我们喝中国茶，太好了！",
        "passagePinyin": "Jīntiān xīngqītiān, wǒ bú qù xuéxiào. Zhōngwǔ wǒ hé māma zài jiā chī mǐfàn, xiàwǔ wǒmen hē zhōngguó chá, tài hǎo le!",
        "passageVi": "Hôm nay là chủ nhật, tôi không đến trường. Buổi trưa tôi và mẹ ở nhà ăn cơm, buổi chiều chúng tôi uống trà Trung Quốc, thật tuyệt vời!",
        "characterCount": 38,
        "comprehensionQuestions": [
            {
                "questionZh": "他今天去不去学校？",
                "questionPinyin": "Tā jīntiān qù bu qù xuéxiào?",
                "questionVi": "Hôm nay cậu ấy có đến trường không?",
                "options": ["不去学校 (Bú qù xuéxiào)", "去学校 (Qù xuéxiào)", "去医院 (Qù yīyuàn)", "去商店 (Qù shāngdiàn)"],
                "correctIndex": 0,
                "explanation": "Trong câu đầu tiên: '今天星期天，我不去学校。' (Hôm nay chủ nhật, tôi không đến trường)."
            }
        ]
    },
    {
        "unitNumber": 4,
        "lessonNumber": 10,
        "lessonId": "F16768F3-EB8F-4954-BB67-A9BEA0B74DB0",
        "titleZh": "去北京看朋友",
        "titleVi": "Đi Bắc Kinh thăm bạn",
        "targetWords": ["去", "北京", "星期一", "坐", "天气"],
        "targetGrammar": ["Câu liên động mục đích", "Thời gian làm trạng ngữ"],
        "passageZh": "我星期一去北京看朋友。北京天气不太冷。我和朋友想去商店买一点儿东西。",
        "passagePinyin": "Wǒ xīngqīyī qù Běijīng kàn péngyou. Běijīng tiānqì bú tài lěng. Wǒ hé péngyou xiǎng qù shāngdiàn mǎi yìdiǎnr dōngxi.",
        "passageVi": "Thứ hai tôi đi Bắc Kinh thăm bạn. Thời tiết Bắc Kinh không quá lạnh. Tôi và bạn muốn đi cửa hàng mua một ít đồ.",
        "characterCount": 33,
        "comprehensionQuestions": [
            {
                "questionZh": "他什么时候去北京？",
                "questionPinyin": "Tā shénme shíhou qù Běijīng?",
                "questionVi": "Khi nào cậu ấy đi Bắc Kinh?",
                "options": ["星期一 (Xīngqīyī)", "星期天 (Xīngqītiān)", "星期五 (Xīngqīwǔ)", "明天上午 (Míngtiān shàngwǔ)"],
                "correctIndex": 0,
                "explanation": "Bài viết bắt đầu bằng: '我星期一去北京看朋友。'"
            }
        ]
    },
    {
        "unitNumber": 5,
        "lessonNumber": 13,
        "lessonId": "B24B8ED2-34D9-468A-8560-778F5640828E",
        "titleZh": "学校附近",
        "titleVi": "Khu vực quanh trường học",
        "targetWords": ["学校", "前面", "后面", "商店", "有"],
        "targetGrammar": ["Cấu trúc phương vị từ", "Câu tồn hiện chữ 有"],
        "passageZh": "这是我们的大学。学校前面有一家大超市，后面是一家小饭馆。超市里有很多水果。",
        "passagePinyin": "Zhè shì wǒmen de dàxué. Xuéxiào qiánmiàn yǒu yì jiā dà chāoshì, hòumiàn shì yì jiā xiǎo fànguǎn. Chāoshì lǐ yǒu hěn duō shuǐguǒ.",
        "passageVi": "Đây là trường đại học của chúng tôi. Phía trước trường có một siêu thị lớn, phía sau là một quán ăn nhỏ. Trong siêu thị có rất nhiều hoa quả.",
        "characterCount": 37,
        "comprehensionQuestions": [
            {
                "questionZh": "学校前面有什么？",
                "questionPinyin": "Xuéxiào qiánmiàn yǒu shénme?",
                "questionVi": "Phía trước trường học có cái gì?",
                "options": ["一家大超市 (Yì jiā dà chāoshì)", "一家小饭馆 (Yì jiā xiǎo fànguǎn)", "一家医院 (Yì jiā yīyuàn)", "一个火车站 (Yí gè huǒchēzhàn)"],
                "correctIndex": 0,
                "explanation": "Đoạn văn viết: '学校前面有一家大超市' (Phía trước trường có một siêu thị lớn)."
            }
        ]
    },
    {
        "unitNumber": 6,
        "lessonNumber": 15,
        "lessonId": "E41DF40E-B099-4EA1-A42F-1D41B916AEB3",
        "titleZh": "坐飞机来中国",
        "titleVi": "Đi máy bay đến Trung Quốc",
        "targetWords": ["坐", "飞机", "来", "高兴", "认识"],
        "targetGrammar": ["Cấu trúc nhấn mạnh 是...的", "Năng nguyện 会"],
        "passageZh": "我是坐飞机来中国的。我会说一点儿汉语。认识很多中国朋友，我非常高兴！",
        "passagePinyin": "Wǒ shì zuò fēijī lái Zhōngguó de. Wǒ huì shuō yìdiǎnr hànyǔ. Rènshi hěn duō zhōngguó péngyou, wǒ fēicháng gāoxìng!",
        "passageVi": "Tôi đến Trung Quốc bằng máy bay. Tôi biết nói một chút tiếng Hán. Quen biết rất nhiều bạn bè Trung Quốc, tôi vô cùng vui mừng!",
        "characterCount": 35,
        "comprehensionQuestions": [
            {
                "questionZh": "他是怎么来中国的？",
                "questionPinyin": "Tā shì zěnme lái Zhōngguó de?",
                "questionVi": "Cậu ấy đến Trung Quốc bằng cách nào?",
                "options": ["坐飞机 (Zuò fēijī)", "坐火车 (Zuò huǒchē)", "坐出租车 (Zuò chūzūchē)", "开车 (Kāichē)"],
                "correctIndex": 0,
                "explanation": "Câu mở đầu khẳng định rõ: '我是坐飞机来中国的。'"
            }
        ]
    }
]

def generate_reading_passages_staging():
    print(f"Total Unit-ending reading passages to generate: {len(PASSAGES_DATA)}")

    staging_passages = []

    for p in PASSAGES_DATA:
        char_count = len(p["passageZh"].replace(" ", "").replace("，", "").replace("。", "").replace("！", "").replace("？", ""))
        assert 20 <= char_count <= 45, f"Passage for Unit {p['unitNumber']} char count ({char_count}) out of bounds (20-45)"

        entry = {
            "unitNumber": p["unitNumber"],
            "lessonNumber": p["lessonNumber"],
            "lessonId": p["lessonId"],
            "titleZh": p["titleZh"],
            "titleVi": p["titleVi"],
            "targetWords": p["targetWords"],
            "targetGrammar": p["targetGrammar"],
            "passageZh": p["passageZh"],
            "passagePinyin": p["passagePinyin"],
            "passageVi": p["passageVi"],
            "characterCount": char_count,
            "comprehensionQuestions": p["comprehensionQuestions"],
            "status": "AI_ASSISTED_UNVERIFIED",
            "integrationStrategy": {
                "schemaImpact": "ZERO_SCHEMA_CHANGE",
                "recommendedStorage": "DialogueJson.readingPassage OR exercises (type='reading-comprehension')"
            }
        }
        staging_passages.append(entry)

    out_file = Path("data/hsk30/staging/hsk1_reading_passages.json")
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(staging_passages, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated {len(staging_passages)} reading passages to {out_file}")
    return len(staging_passages)

if __name__ == "__main__":
    count = generate_reading_passages_staging()
    sys.exit(0 if count == 6 else 1)
