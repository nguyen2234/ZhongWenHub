# -*- coding: utf-8 -*-
"""
HSK 2 Reading Passages Generator (Staging & Frontend)
Phase 9.2 — Task 5

Generates 5 comprehensive reading passages for HSK 2:
  - Unit 1 (Lesson 3): 介绍新房间 / 我的房间
  - Unit 2 (Lesson 6): 去饭馆吃午饭
  - Unit 3 (Lesson 9): 生病与运动
  - Unit 4 (Lesson 12): 买衣服与天气
  - Unit 5 (Lesson 15): 准备过新年
Outputs to:
  - data/hsk30/staging/hsk2_reading_passages.json
  - Fontend/src/features/lesson/data/hsk2ReadingPassages.ts
"""

import sys
import json
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

HSK2_PASSAGES = [
    {
        "unitNumber": 1,
        "lessonNumber": 3,
        "titleZh": "我的新房间",
        "titleVi": "Căn phòng mới của tôi",
        "targetWords": ["房间", "左边", "右边", "书包", "干净", "喜欢"],
        "targetGrammar": ["Cụm từ chữ 的", "Phương vị từ 左边 / 右边", "Câu tồn hiện với 有"],
        "passageZh": "这是我的新房间。左边有一张很大的床，右边有一张桌子和一个红色的书包。房间里面很干净，我很喜欢。",
        "passagePinyin": "Zhè shì wǒ de xīn fángjiān. Zuǒbian yǒu yì zhāng hěn dà de chuáng, yòubian yǒu yì zhāng zhuōzi hé yí gè hóngsè de shūbāo. Fángjiān lǐmiàn hěn gānjìng, wǒ hěn xǐhuan.",
        "passageVi": "Đây là căn phòng mới của tôi. Bên trái có một chiếc giường rất lớn, bên phải có một chiếc bàn và một chiếc cặp sách màu đỏ. Bên trong phòng rất sạch sẽ, tôi rất thích.",
        "characterCount": 42,
        "comprehensionQuestions": [
            {
                "questionZh": "房间左边有什么？",
                "questionPinyin": "Fángjiān zuǒbian yǒu shénme?",
                "questionVi": "Bên trái phòng có cái gì?",
                "options": [
                    "一张很大的床 (Yì zhāng hěn dà de chuáng)",
                    "一个红色的书包 (Yí gè hóngsè de shūbāo)",
                    "一张小桌子 (Yì zhāng xiǎo zhuōzi)",
                    "一只可爱的小猫 (Yì zhī kě'ài de xiǎo māo)"
                ],
                "correctIndex": 0,
                "explanation": "Trong bài nêu rõ: '左边有一张很大的床' (Bên trái có một chiếc giường rất lớn)."
            },
            {
                "questionZh": "书包是什么颜色的？",
                "questionPinyin": "Shūbāo shì shénme yánsè de?",
                "questionVi": "Chiếc cặp sách có màu gì?",
                "options": [
                    "白色的 (Báisè de)",
                    "黑色的 (Hēisè de)",
                    "红色的 (Hóngsè de)",
                    "绿色的 (Lǜsè de)"
                ],
                "correctIndex": 2,
                "explanation": "Đoạn văn viết: '右边有一张桌子和一个红色的书包' (Bên phải có một chiếc bàn và một chiếc cặp sách màu đỏ)."
            }
        ],
        "status": "AI_ASSISTED_UNVERIFIED",
        "integrationStrategy": {
            "schemaImpact": "ZERO_SCHEMA_CHANGE",
            "recommendedStorage": "DialogueJson.readingPassage OR static fallback"
        }
    },
    {
        "unitNumber": 2,
        "lessonNumber": 6,
        "titleZh": "去饭馆吃午饭",
        "titleVi": "Đi nhà hàng ăn trưa",
        "targetWords": ["饭馆", "羊肉", "鸡蛋", "面条", "开心", "已经"],
        "targetGrammar": ["Bổ ngữ chỉ mức độ / trạng thái với 得", "Trợ từ động thái 了", "Liên từ và phó từ"],
        "passageZh": "今天中午，我和同学一起去学校旁边的中国饭馆吃午饭。我们点了羊肉、鸡蛋和两碗热面条。大家吃得真开心！",
        "passagePinyin": "Jīntiān zhōngwǔ, wǒ hé tóngxué yìqǐ qù xuéxiào pángbiān de zhōngguó fànguǎn chī wǔfàn. Wǒmen diǎn le yángròu, jīdàn hé liǎng wǎn rè miàntiáo. Dàjiā chī de zhēn kāixīn!",
        "passageVi": "Trưa hôm nay, tôi và bạn học cùng nhau đến quán ăn Trung Quốc bên cạnh trường học để ăn trưa. Chúng tôi đã gọi thịt dê, trứng gà và hai bát mì nóng. Mọi người ăn thật là vui vẻ!",
        "characterCount": 44,
        "comprehensionQuestions": [
            {
                "questionZh": "他们去哪儿吃午饭？",
                "questionPinyin": "Tāmen qù nǎr chī wǔfàn?",
                "questionVi": "Họ đi đâu ăn cơm trưa?",
                "options": [
                    "学校里的食堂 (Xuéxiào lǐ de shítáng)",
                    "学校旁边的中国饭馆 (Xuéxiào pángbiān de zhōngguó fànguǎn)",
                    "李老师的家 (Lǐ lǎoshī de jiā)",
                    "市中心的咖啡馆 (Shì zhōngxīn de kāfēiguǎn)"
                ],
                "correctIndex": 1,
                "explanation": "Đoạn văn nêu: '我和同学一起去学校旁边的中国饭馆吃午饭。'"
            },
            {
                "questionZh": "他们点了什么菜？",
                "questionPinyin": "Tāmen diǎn le shénme cài?",
                "questionVi": "Họ đã gọi những món gì?",
                "options": [
                    "羊肉、鸡蛋和热面条 (Yángròu, jīdàn hé rè miàntiáo)",
                    "牛肉、米饭和鱼 (Niúròu, mǐfàn hé yú)",
                    "水果和热茶 (Shuǐguǒ hé rè chá)",
                    "饺子和包子 (Jiǎozi hé bāozi)"
                ],
                "correctIndex": 0,
                "explanation": "Đoạn văn ghi rõ: '我们点了羊肉、鸡蛋和两碗热面条。'"
            }
        ],
        "status": "AI_ASSISTED_UNVERIFIED",
        "integrationStrategy": {
            "schemaImpact": "ZERO_SCHEMA_CHANGE",
            "recommendedStorage": "DialogueJson.readingPassage OR static fallback"
        }
    },
    {
        "unitNumber": 3,
        "lessonNumber": 9,
        "titleZh": "生病与运动",
        "titleVi": "Ốm đau và vận động sức khỏe",
        "targetWords": ["生病", "头疼", "按时", "吃药", "身体", "跑步"],
        "targetGrammar": ["Câu kiêm ngữ với 让", "Phó từ chỉ mức độ 有点儿 / 多 / 少", "Bổ ngữ kết quả 好多了"],
        "passageZh": "大卫昨天生病了，头有点儿疼。医生让他按时吃药，多喝热水，少看电脑。今天他感觉好多了，下午想去公园跑跑步。",
        "passagePinyin": "Dàwèi zuótiān shēngbìng le, tóu yǒudiǎnr téng. Yīshēng ràng tā ànshí chī yào, duō hē rèshuǐ, shǎo kàn diànnǎo. Jīntiān tā gǎnjué hǎoduō le, xiàwǔ xiǎng qù gōngyuán pǎo pǎobù.",
        "passageVi": "David hôm qua bị ốm, đầu hơi đau. Bác sĩ bảo anh ấy uống thuốc đúng giờ, uống nhiều nước nóng, ít nhìn máy tính. Hôm nay anh ấy cảm thấy đỡ hơn nhiều rồi, chiều nay muốn ra công viên chạy bộ một chút.",
        "characterCount": 46,
        "comprehensionQuestions": [
            {
                "questionZh": "医生让大卫做什么？",
                "questionPinyin": "Yīshēng ràng Dàwèi zuò shénme?",
                "questionVi": "Bác sĩ bảo David làm những gì?",
                "options": [
                    "按时吃药，多喝热水，少看电脑 (Ànshí chī yào, duō hē rèshuǐ, shǎo kàn diànnǎo)",
                    "每天去踢足球 (Měitiān qù tī zúqiú)",
                    "去外国旅游 (Qù wàiguó lǚyóu)",
                    "马上回学校上课 (Mǎshàng huí xuéxiào shàngkè)"
                ],
                "correctIndex": 0,
                "explanation": "Đoạn văn viết: '医生让他按时吃药，多喝热水，少看电脑。'"
            },
            {
                "questionZh": "大卫今天下午想去哪儿？",
                "questionPinyin": "Dàwèi jīntiān xiàwǔ xiǎng qù nǎr?",
                "questionVi": "Chiều nay David muốn đi đâu?",
                "options": [
                    "去医院看医生 (Qù yīyuàn kàn yīshēng)",
                    "去公园跑跑步 (Qù gōngyuán pǎo pǎobù)",
                    "去图书馆借书 (Qù túshūguǎn jiè shū)",
                    "在家里睡觉 (Zài jiālǐ shuìjiào)"
                ],
                "correctIndex": 1,
                "explanation": "Đoạn văn viết: '下午想去公园跑跑步。'"
            }
        ],
        "status": "AI_ASSISTED_UNVERIFIED",
        "integrationStrategy": {
            "schemaImpact": "ZERO_SCHEMA_CHANGE",
            "recommendedStorage": "DialogueJson.readingPassage OR static fallback"
        }
    },
    {
        "unitNumber": 4,
        "lessonNumber": 12,
        "titleZh": "买衣服与天气",
        "titleVi": "Mua sắm quần áo và thời tiết mùa đông",
        "targetWords": ["冬天", "比", "下雪", "商场", "白色", "漂亮"],
        "targetGrammar": ["Câu chữ 比 chỉ so sánh", "Cụm số từ bổ ngữ 比...冷得多", "Trợ từ động thái 了"],
        "passageZh": "北京的冬天比上海冷得多，昨晚还下了一场大雪。下午我和姐姐去商场买衣服，姐姐买了一件白色的羽绒服，真漂亮。",
        "passagePinyin": "Běijīng de dōngtiān bǐ Shànghǎi lěng de duō, zuówǎn hái xià le yì chǎng dàxuě. Xiàwǔ wǒ hé jiějie qù shāngchǎng mǎi yīfu, jiějie mǎi le yí jiàn báisè de yǔróngfú, zhēn piàoliang.",
        "passageVi": "Mùa đông ở Bắc Kinh lạnh hơn nhiều so với Thượng Hải, tối qua còn đổ một trận tuyết lớn. Buổi chiều tôi và chị gái đến trung tâm thương mại mua quần áo, chị gái mua một chiếc áo phao lông vũ màu trắng, thật là đẹp.",
        "characterCount": 44,
        "comprehensionQuestions": [
            {
                "questionZh": "北京的冬天怎么样？",
                "questionPinyin": "Běijīng de dōngtiān zěnmeyàng?",
                "questionVi": "Mùa đông ở Bắc Kinh như thế nào?",
                "options": [
                    "比上海冷得多 (Bǐ Shànghǎi lěng de duō)",
                    "比上海热得多 (Bǐ Shànghǎi rè de duō)",
                    "天天晴天不下雪 (Tiāntiān qíngtiān bú xià xuě)",
                    "一点儿也不冷 (Yìdiǎnr yě bù lěng)"
                ],
                "correctIndex": 0,
                "explanation": "Đoạn văn so sánh: '北京的冬天比上海冷得多' (Mùa đông ở Bắc Kinh lạnh hơn nhiều so với Thượng Hải)."
            },
            {
                "questionZh": "姐姐买了一件什么颜色的衣服？",
                "questionPinyin": "Jiějie mǎi le yí jiàn shénme yánsè de yīfu?",
                "questionVi": "Chị gái đã mua một chiếc áo màu gì?",
                "options": [
                    "黑色的 (Hēisè de)",
                    "红色的 (Hóngsè de)",
                    "白色的 (Báisè de)",
                    "绿色的 (Lǜsè de)"
                ],
                "correctIndex": 2,
                "explanation": "Đoạn văn viết: '姐姐买了一件白色的羽绒服' (Chị gái mua một chiếc áo lông vũ màu trắng)."
            }
        ],
        "status": "AI_ASSISTED_UNVERIFIED",
        "integrationStrategy": {
            "schemaImpact": "ZERO_SCHEMA_CHANGE",
            "recommendedStorage": "DialogueJson.readingPassage OR static fallback"
        }
    },
    {
        "unitNumber": 5,
        "lessonNumber": 15,
        "titleZh": "准备过新年",
        "titleVi": "Chuẩn bị đón năm mới",
        "targetWords": ["新年", "快要...了", "教室", "唱歌", "跳舞", "快乐"],
        "targetGrammar": ["Cấu trúc 快要...了 chỉ hành động sắp xảy ra", "Trợ từ động thái 着 chỉ trạng thái tiếp diễn", "Cấu trúc song hành 有人...有人..."],
        "passageZh": "新年快要到了，我们班要开一个新年联欢会。大家都在教室里忙着准备，有人唱歌，有人跳舞，每个人都很快乐。",
        "passagePinyin": "Xīnnián kuàiyào dào le, wǒmen bān yào kāi yí gè xīnnián liánhuānhuì. Dàjiā dōu zài jiàoshì lǐ máng zhe zhǔnbèi, yǒu rén chànggē, yǒu rén tiàowǔ, měi gè rén dōu hěn kuàilè.",
        "passageVi": "Năm mới sắp đến rồi, lớp chúng tôi sẽ tổ chức một buổi liên hoan mừng năm mới. Mọi người đều đang bận rộn chuẩn bị trong phòng học, có người ca hát, có người nhảy múa, ai nấy đều rất vui vẻ.",
        "characterCount": 42,
        "comprehensionQuestions": [
            {
                "questionZh": "大家正在教室里做什么？",
                "questionPinyin": "Dàjiā zhèngzài jiàoshì lǐ zuò shénme?",
                "questionVi": "Mọi người đang làm gì trong phòng học?",
                "options": [
                    "在忙着准备新年联欢会 (Zài máng zhe zhǔnbèi xīnnián liánhuānhuì)",
                    "正在认真考试 (Zhèngzài rènzhēn kǎoshì)",
                    "在打扫操场 (Zài dǎsǎo cāochǎng)",
                    "在排队买火车票 (Zài páiduì mǎi huǒchēpiào)"
                ],
                "correctIndex": 0,
                "explanation": "Đoạn văn nêu: '大家都在教室里忙着准备，有人唱歌，有人跳舞...'"
            },
            {
                "questionZh": "大家的心情怎么样？",
                "questionPinyin": "Dàjiā de xīnqíng zěnmeyàng?",
                "questionVi": "Tâm trạng của mọi người như thế nào?",
                "options": [
                    "都很累 (Dōu hěn lèi)",
                    "每个人都很快乐 (Měi gè rén dōu hěn kuàilè)",
                    "有点儿难过 (Yǒudiǎnr nánguò)",
                    "很生气 (Hěn shēngqì)"
                ],
                "correctIndex": 1,
                "explanation": "Đoạn văn kết luận: '每个人都很快乐' (Mỗi người đều rất vui vẻ)."
            }
        ],
        "status": "AI_ASSISTED_UNVERIFIED",
        "integrationStrategy": {
            "schemaImpact": "ZERO_SCHEMA_CHANGE",
            "recommendedStorage": "DialogueJson.readingPassage OR static fallback"
        }
    }
]

def generate():
    # 1. Save JSON staging
    out_json = Path("data/hsk30/staging/hsk2_reading_passages.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(HSK2_PASSAGES, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(HSK2_PASSAGES)} reading passages -> {out_json}")

    # 2. Save TypeScript source for frontend
    ts_code = """import type { LessonReadingPassageDTO } from '../types/lesson-content.types';

export const HSK2_READING_PASSAGES: LessonReadingPassageDTO[] = """ + json.dumps(HSK2_PASSAGES, ensure_ascii=False, indent=2) + ";\n"

    out_ts = Path("Fontend/src/features/lesson/data/hsk2ReadingPassages.ts")
    with open(out_ts, "w", encoding="utf-8") as f:
        f.write(ts_code)
    print(f"Saved TypeScript reading passages -> {out_ts}")

if __name__ == "__main__":
    generate()
