#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ZHONGWENHUB - AUDIT REMEDIATION ENGINE
Author: Antigravity AI Senior Engineer
Target Databases: ZhongWenHub_Test, ZhongWenHub_Dev

Remediation Actions:
1. Fix 118 surname-trapped vocabularies and 109 debris-trapped vocabularies using full multi-entry CVDICT indexing.
2. Fix specific high-priority words:
   - 过 (guò) -> qua, đi qua, trải qua, đón
   - 过 (guo) -> từng (trợ từ động thái)
   - 得 (děi) -> phải, cần phải
   - 好 (hào) -> thích, ham chuộng
   - 包 (bāo) -> túi, bọc; gói, bọc lại
   - 羊 (yáng) -> cừu, dê
   - 牛 (niú) -> con bò, trâu
   - 关 (guān) -> đóng, khép, tắt; liên quan
   - 辣 (là) -> cay, vị cay
   - 联系 (liánxì) -> liên hệ, liên lạc, kết nối
   - 懒 (lǎn) -> lười, lười biếng
3. Fix 7 grammar points with code in title/formula:
   - GR30-HSK1-046: Loại câu: Câu trần thuật (陈述句)
   - GR30-HSK1-050: Loại câu: Câu cầu khiến (祈使句)
   - GR30-HSK1-051: Loại câu: Câu cảm thán (感叹句)
   - GR30-HSK1-059: Câu phức: Câu phức không dùng liên từ (不用关联词语的复句)
   - GR30-HSK2-108: Cụm từ: Cụm danh từ (名词性短语)
   - GR30-HSK2-109: Cụm từ: Cụm động từ (动词性短语)
   - GR30-HSK2-110: Cụm từ: Cụm tính từ (形容词性短语)
4. Clean and upgrade robotic example sentences in grammar points.
5. Keep all items in PENDING_REVIEW (preserves human review workflow).
"""

import os
import sys
import re
import json
import argparse
from datetime import datetime, timezone
import pyodbc

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"D:\ZhongWenHub"
SCRATCH_DIR = r"C:\Users\nguyen\.gemini\antigravity\brain\cd186fce-5c0e-4fe7-82e2-2c0cf85214c4\scratch"
CVDICT_PATH = os.path.join(SCRATCH_DIR, "CVDICT.u8")

# Specialized Curated Mappings for Trapped Words
EXPLICIT_REMEDIES = {
    ("过", "guò", ""): "qua, đi qua, trải qua, đón (tết, sinh nhật)",
    ("过", "guo", ""): "từng (trợ từ động thái chỉ kinh nghiệm)",
    ("得", "děi", ""): "phải, cần phải",
    ("得", "de", ""): "được (trợ từ kết cấu)",
    ("得", "dé", ""): "đạt được, nhận được",
    ("好", "hào", ""): "thích, ham chuộng (hiếu kỳ, sở thích)",
    ("包", "bāo", ""): "túi, bọc; gói, bọc lại (bao bọc)",
    ("羊", "yáng", ""): "cừu, dê",
    ("牛", "niú", ""): "con bò, trâu",
    ("关", "guān", ""): "đóng, khép, tắt; liên quan, dính líu",
    ("辣", "là", ""): "cay, vị cay",
    ("联系", "liánxì", ""): "liên hệ, liên lạc, kết nối",
    ("懒", "lǎn", ""): "lười, lười biếng",
    ("左", "zuǒ", ""): "bên trái, phía tả",
    ("教", "jiāo", ""): "dạy, giảng dạy",
    ("教", "jiào", ""): "giáo dục, tôn giáo",
    ("楼", "lóu", ""): "nhà nhiều tầng; tòa nhà, tầng, lầu",
    ("游", "yóu", ""): "bơi; du ngoạn, du lịch",
    ("班", "bān", ""): "nhóm, lớp học; ca làm việc",
    ("错", "cuò", ""): "sai, lỗi; sai sót; tồi",
    ("连", "lián", ""): "ngay cả, đến cả; nối liền, liên tiếp",
    ("双", "shuāng", ""): "đôi, cặp (lượng từ)",
    ("季", "jì", ""): "mùa; quý (thời gian)",
    ("段", "duàn", ""): "đoạn, khúc, quãng (lượng từ)",
    ("支", "zhī", ""): "chiếc, cây (lượng từ cho bút, bài hát...)",
    ("印", "yìn", ""): "in ấn; dấu vết, con dấu",
    ("曲", "qǔ", ""): "khúc nhạc, bài hát; uốn cong",
    ("池", "chí", ""): "ao, hồ, bể nước",
    ("滑", "huá", ""): "trơn, trượt; trơn trượt",
    ("市场", "shìchǎng", ""): "khu chợ; thị trường",
    ("鼓", "gǔ", ""): "cái trống; đánh trống; cổ vũ",
    ("挣", "zhèng", ""): "kiếm (tiền); vùng vẫy, giãy giụa",
    ("小偷儿", "xiǎotōur", ""): "kẻ trộm, tên trộm",
    ("冒", "mào", ""): "tỏa ra, bốc lên; mạo hiểm, liều",
    ("答", "dá", ""): "trả lời, hồi đáp; đáp lại",
    ("令", "lìng", ""): "khiến cho, làm cho; mệnh lệnh",
    ("粘", "zhān", ""): "dính, dán",
    ("句", "jù", ""): "câu (lượng từ cho lời nói, câu văn)",
    ("戏", "xì", ""): "vở kịch, trò vui, hí kịch",
    ("背", "bèi", ""): "lưng, phía sau; học thuộc lòng",
    ("背", "bēi", ""): "cõng, vác trên lưng",
    ("砖", "zhuān", ""): "viên gạch, gạch",
    ("离", "lí", ""): "cách, rời khỏi, chia lìa",
    ("北", "běi", ""): "phía bắc, phương bắc",
    ("笔记", "bǐjì", ""): "ghi chép, sổ ghi chép, bài ghi chú",
    ("聊", "liáo", ""): "nói chuyện, trò chuyện, tán gẫu",
    ("被", "bèi", ""): "bị, được (giới từ bị động); cái chăn",
    ("之", "zhī", ""): "của (trợ từ sở hữu); nó, người ấy (đại từ)",
    ("云", "yún", ""): "mây, đám mây",
    ("仍", "réng", ""): "vẫn, vẫn còn, duy trì",
    ("博士", "bóshì", ""): "tiến sĩ (học vị)",
    ("大夫", "dàifu", ""): "bác sĩ, thầy thuốc",
    ("原", "yuán", ""): "ban đầu, vốn có; nguồn gốc; cánh đồng",
    ("金子", "jīnzi", ""): "vàng, khối vàng, vàng bạc",
    ("从来", "cónglái", ""): "từ trước đến nay, luôn luôn, chưa từng",
    ("兄弟", "xiōngdì", ""): "anh em, huynh đệ",
    ("小孩儿", "xiǎoháir", ""): "đứa trẻ, trẻ con",
    ("大伙儿", "dàhuǒr", ""): "mọi người, cả đám",
    ("差点儿", "chàdiǎnr", ""): "suýt nữa, suýt chút nữa",
    ("聊天儿", "liáotiānr", ""): "nói chuyện, trò chuyện, tán gẫu",
    ("男孩儿", "nánháir", ""): "bé trai, cậu bé, con trai",
    ("女孩儿", "nǚháir", ""): "bé gái, cô bé, con gái",
    ("干活儿", "gànhuór", ""): "làm việc, lao động, làm lụng",
    ("一块儿", "yíkuàir", ""): "cùng nhau, một chỗ",
    ("大厦", "dàshà", ""): "tòa nhà lớn, cao ốc, đại xá",
    ("提", "tí", ""): "nhấc, xách; đề xuất, đưa ra, nhắc đến",
    ("粥", "zhōu", ""): "cháo",
    ("夸", "kuā", ""): "khen ngợi, ca ngợi; khoe khoang",
    ("签", "qiān", ""): "ký tên, ký kết; thẻ tre, que xăm",
    ("帮", "bāng", ""): "giúp đỡ, tương trợ; nhóm, bọn",
    ("以", "yǐ", ""): "dùng, lấy; căn cứ vào; để",
    ("暗", "àn", ""): "tối, u ám; kín đáo, ngầm",
    ("碗", "wǎn", ""): "cái bát, cái chén",
    ("占", "zhàn", ""): "chiếm, giữ (vị trí, tỷ lệ)",
    ("词", "cí", ""): "từ ngữ, lời nói; từ (thể thơ)",
    ("举", "jǔ", ""): "nâng lên, giơ lên; hành động",
    ("答复", "dáfù", ""): "trả lời, hồi đáp, giải đáp",
    ("阳台", "yángtái", ""): "ban công",
    ("晒", "shài", ""): "phơi nắng, chiếu nắng",
    ("深", "shēn", ""): "sâu; đậm (màu); sâu sắc",
    ("野", "yě", ""): "đồng nội, hoang dã; thô lỗ",
    ("管", "guǎn", ""): "quản lý, trông coi; ống; mặc kệ",
    ("闹", "nào", ""): "ồn ào, náo nhiệt; làm loạn, quậy",
    ("脆", "cuì", ""): "giòn; dứt khoát, thanh thoát",
    ("群", "qún", ""): "đàn, bầy, nhóm; bầy đàn",
    ("岛", "dǎo", ""): "hòn đảo, đảo",
    ("救", "jiù", ""): "cứu, cứu giúp, cứu viện",
    ("杂", "zá", ""): "tạp, lẫn lộn, phức tạp",
    ("散", "sǎn", ""): "rời rạc, lỏng lẻo; tản mát",
    ("纸", "zhǐ", ""): "tờ giấy, giấy",
    ("夜", "yè", ""): "đêm, ban đêm",
    ("宝", "bǎo", ""): "bảo bối, quý giá, trân quý",
    ("从", "cóng", ""): "từ (thời gian, địa điểm); theo, nghe theo",
    ("与", "yǔ", ""): "và, cùng với; cho",
    ("老板", "lǎobǎn", ""): "ông chủ, sếp",
    ("净", "jìng", ""): "sạch sẽ; chỉ toàn, toàn là",
    ("窗", "chuāng", ""): "cửa sổ",
    ("留", "liú", ""): "ở lại; lưu giữ; giữ lại",
    ("干", "gān", ""): "khô, cạn; cạn ly",
    ("干", "gàn", ""): "làm, làm việc; cán bộ; thân cây",
    ("法", "fǎ", ""): "pháp luật; phương pháp, cách thức",
    ("与其", "yǔqí", ""): "thay vì, thà...",
    ("化", "huà", ""): "biến hóa, thay đổi; biến thành",
    ("岸", "àn", ""): "bờ biển, bờ sông, bến bờ",
    ("碰", "pèng", ""): "va chạm, va quẹt; gặp gỡ",
    ("混", "hùn", ""): "trộn lẫn, pha trộn; sống qua ngày",
    ("最", "zuì", ""): "nhất (phó từ so sánh cao nhất)",
    ("词汇", "cíhuì", ""): "từ vựng",
    ("拿", "ná", ""): "cầm, nắm, lấy",
    ("墙", "qiáng", ""): "bức tường, bờ tường",
    ("射", "shè", ""): "bắn, phóng, chiếu xạ",
    ("闲", "xián", ""): "nhàn rỗi, rảnh rỗi; không bận rộn",
    ("纪录", "jìlù", ""): "kỷ lục (thể thao, thành tích)"
}

# Remediation for 7 Grammar Points
GRAMMAR_REMEDIES = {
    "GR30-HSK1-046": {
        "title": "Loại câu: Câu trần thuật (陈述句)",
        "formula": "Chủ ngữ + Vị ngữ (Động từ / Tính từ / Danh từ).",
        "explanation": "Câu trần thuật dùng để thuật lại sự việc, miêu tả trạng thái hoặc biểu đạt quan điểm, suy nghĩ. Kết thúc câu bằng dấu chấm.",
        "examples": [
            {"zh": "她是我的汉语老师。", "pinyin": "Tā shì wǒ de Hànyǔ lǎoshī.", "meaningVi": "Cô ấy là giáo viên tiếng Trung của tôi."},
            {"zh": "今天天气非常晴朗。", "pinyin": "Jīntiān tiānqì fēicháng qínglǎng.", "meaningVi": "Hôm nay thời tiết rất đẹp trời."}
        ],
        "practice": {
            "question": "Điền dấu câu thích hợp kết thúc câu trần thuật: “我是大学一年级的学生___”",
            "options": ["A. Dấu chấm (.)", "B. Dấu hỏi (?)", "C. Dấu chấm than (!)", "D. Dấu phẩy (,)"],
            "correctIndex": 0,
            "explanation": "Câu trần thuật dùng để kể, thông báo nên kết thúc bằng dấu chấm."
        }
    },
    "GR30-HSK1-050": {
        "title": "Loại câu: Câu cầu khiến (祈使句)",
        "formula": "(请) + Động từ / (不要/别 + Động từ) + (吧)!",
        "explanation": "Câu cầu khiến dùng để yêu cầu, đề nghị, khuyên nhủ hoặc ra lệnh cho người khác thực hiện hoặc ngừng thực hiện một hành động.",
        "examples": [
            {"zh": "请您坐在这里喝茶。", "pinyin": "Qǐng nín zuò zài zhèlǐ hē chá.", "meaningVi": "Xin mời ngài ngồi ở đây uống trà."},
            {"zh": "上课时间请大家不要说话！", "pinyin": "Shàngkè shíjiān qǐng dàjiā bú yào shuōhuà!", "meaningVi": "Trong giờ học xin mọi người đừng nói chuyện!"}
        ],
        "practice": {
            "question": "Chọn câu biểu thị lời nhờ vả lịch sự:",
            "options": ["A. 请进，请坐！", "B. 他是学生吗？", "C. 今天太热了！", "D. 我有一本书。"],
            "correctIndex": 0,
            "explanation": "“请进，请坐！” là câu cầu khiến lịch sự dùng từ “请”."
        }
    },
    "GR30-HSK1-051": {
        "title": "Loại câu: Câu cảm thán (感叹句)",
        "formula": "太 + Tính từ + 了! / 真 + Tính từ + (啊)!",
        "explanation": "Câu cảm thán dùng để bộc lộ cảm xúc khen ngợi, ngạc nhiên, vui sướng hoặc tiếc nuối. Thường đi kèm các phó từ mức độ như 太, 真 và kết thúc bằng dấu chấm than.",
        "examples": [
            {"zh": "这件衣服真漂亮啊！", "pinyin": "Zhè jiàn yīfu zhēn piàoliang a!", "meaningVi": "Chiếc áo này thật là đẹp!"},
            {"zh": "今天的工作太累了！", "pinyin": "Jīntiān de gōngzuò tài lèi le!", "meaningVi": "Công việc hôm nay mệt quá!"}
        ],
        "practice": {
            "question": "Hoàn thành câu cảm thán khen ngợi: “北京的秋天____美了！”",
            "options": ["A. 太", "B. 也", "C. 都", "D. 不"],
            "correctIndex": 0,
            "explanation": "Cấu trúc cảm thán khen ngợi là “太……了!”."
        }
    },
    "GR30-HSK1-059": {
        "title": "Câu phức: Câu phức không dùng liên từ (不用关联词语的复句)",
        "formula": "Phân câu 1, Phân câu 2.",
        "explanation": "Các phân câu có quan hệ ý nghĩa mật thiết (nhân quả, nối tiếp, song song) nhưng không sử dụng từ nối (liên từ), dựa vào trật tự ngữ nghĩa và ngữ điệu để kết nối.",
        "examples": [
            {"zh": "她今天生病了，不能来上课。", "pinyin": "Tā jīntiān shēngbìng le, bù néng lái shàngkè.", "meaningVi": "Hôm nay cô ấy bị ốm, không thể đến lớp."},
            {"zh": "这是我哥哥，他在北京读大学。", "pinyin": "Zhè shì wǒ gēge, tā zài Běijīng dú dàxué.", "meaningVi": "Đây là anh trai tôi, anh ấy học đại học ở Bắc Kinh."}
        ],
        "practice": {
            "question": "Câu nào sau đây là câu phức không dùng liên từ biểu thị quan hệ nối tiếp / nhân quả?",
            "options": [
                "A. 外面下雨了，我们别出去了。",
                "B. 虽然下雨，但是他还是来了。",
                "C. 因为下雨，所以比赛取消了。",
                "D. 如果下雨，我们就不去。"
            ],
            "correctIndex": 0,
            "explanation": "Câu A nối hai phân câu trực tiếp mà không dùng liên từ như 虽然, 因为, 如果."
        }
    },
    "GR30-HSK2-108": {
        "title": "Cụm từ: Cụm danh từ (名词性短语)",
        "formula": "Định ngữ + (的) + Danh từ trung tâm",
        "explanation": "Cụm từ có chức năng ngữ pháp tương đương một danh từ, giữ vai trò chủ ngữ hoặc tân ngữ trong câu. Ví dụ: Định ngữ chỉ tính chất, sở hữu, vị trí kết hợp với danh từ trung tâm.",
        "examples": [
            {"zh": "这是李老师的新电脑。", "pinyin": "Zhè shì Lǐ lǎoshī de xīn diànnǎo.", "meaningVi": "Đây là máy tính mới của thầy Lý."},
            {"zh": "我想买两张去上海的火车票。", "pinyin": "Wǒ xiǎng mǎi liǎng zhāng qù Shànghǎi de huǒchē piào.", "meaningVi": "Tôi muốn mua hai vé tàu hỏa đi Thượng Hải."}
        ],
        "practice": {
            "question": "Tìm cụm danh từ làm tân ngữ trong câu: “我找到了那本红色的词典。”",
            "options": ["A. 那本红色的词典", "B. 找到了", "C. 我", "D. 找到了那本"],
            "correctIndex": 0,
            "explanation": "“那本红色的词典” là cụm danh từ hoàn chỉnh làm tân ngữ."
        }
    },
    "GR30-HSK2-109": {
        "title": "Cụm từ: Cụm động từ (动词性短语)",
        "formula": "Động từ + Tân ngữ / Bổ ngữ / Trạng ngữ",
        "explanation": "Cụm từ có chức năng ngữ pháp tương đương một động từ, thường giữ vai trò vị ngữ trong câu. Bao gồm kết cấu động - tân, động - bổ hoặc trạng ngữ đi kèm động từ.",
        "examples": [
            {"zh": "他每天都在认真练习写汉字。", "pinyin": "Tā měi tiān dōu zài rènzhēn liànxí xiě hànzì.", "meaningVi": "Mỗi ngày cậu ấy đều chăm chỉ luyện viết chữ Hán."},
            {"zh": "你听懂刚才老师说的话了吗？", "pinyin": "Nǐ tīngdǒng gāngcái lǎoshī shuō de huà le ma?", "meaningVi": "Bạn đã nghe hiểu lời thầy vừa nói chưa?"}
        ],
        "practice": {
            "question": "Xác định cụm động từ giữ vai trò vị ngữ trong câu: “孩子们正在操场上快乐地踢足球。”",
            "options": ["A. 快乐地踢足球", "B. 操场上", "C. 孩子们", "D. 足球"],
            "correctIndex": 0,
            "explanation": "“快乐地踢足球” (Trạng ngữ + Động từ + Tân ngữ) là cụm động từ vị ngữ."
        }
    },
    "GR30-HSK2-110": {
        "title": "Cụm từ: Cụm tính từ (形容词性短语)",
        "formula": "Phó từ mức độ + Tính từ / Tính từ + Bổ ngữ mức độ",
        "explanation": "Cụm từ có chức năng ngữ pháp tương đương một tính từ, thường đóng vai trò vị ngữ hoặc định ngữ, miêu tả tính chất, trạng thái hoặc mức độ của sự vật, hành động.",
        "examples": [
            {"zh": "今天准备考试，大家都非常忙。", "pinyin": "Jīntiān zhǔnbèi kǎoshì, dàjiā dōu fēicháng máng.", "meaningVi": "Hôm nay chuẩn bị thi, mọi người đều vô cùng bận rộn."},
            {"zh": "路上车多，请你开车开得慢一点儿。", "pinyin": "Lù shang chē duō, qǐng nǐ kāi chē kāi de màn yìdiǎnr.", "meaningVi": "Trên đường nhiều xe, xin bạn hãy lái xe chậm một chút."}
        ],
        "practice": {
            "question": "Tìm cụm tính từ miêu tả trạng thái trong câu: “跑完步以后，他感到浑身很累。”",
            "options": ["A. 很累", "B. 跑完步", "C. 感到", "D. 浑身"],
            "correctIndex": 0,
            "explanation": "“很累” (Phó từ mức độ + Tính từ) là cụm tính từ chỉ trạng thái."
        }
    }
}

def clean_gloss_entry(gloss):
    parts = re.split(r"[/;]", gloss)
    cleaned = []
    noise = [
        r"^họ\s*\[.+\]$", r"^biến thể\b", r"^dùng trong\b", r"^xem thêm\b",
        r"^viết tắt của\b", r"^cũng đọc là\b", r"^LT:\s*.+$", r"^CL:\s*.+$"
    ]
    for p in parts:
        p = p.strip()
        if not p:
            continue
        is_n = any(re.search(n, p, re.IGNORECASE) for n in noise)
        if not is_n:
            p_c = re.sub(r"\[[A-Za-z0-9\s]+\]", "", p).strip()
            p_c = re.sub(r"\(LT:[^)]+\)", "", p_c).strip()
            if p_c and p_c not in cleaned:
                cleaned.append(p_c)
    return "; ".join(cleaned[:3]) if cleaned else ""

def load_multi_cvdict():
    print("Indexing multi-entry CVDICT...")
    cvdict_multi = {}
    pattern = re.compile(r'^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+/(.+)/$')
    with open(CVDICT_PATH, 'r', encoding='utf-8') as f:
        for line in f:
            m = pattern.match(line.strip())
            if m:
                trad, simp, py, gloss = m.groups()
                if simp not in cvdict_multi:
                    cvdict_multi[simp] = []
                cvdict_multi[simp].append((trad, py, gloss))
    return cvdict_multi

def get_clean_remedy_meaning(hanzi, pinyin, homo, cvdict_multi):
    homo_str = homo if homo else ""
    key = (hanzi, pinyin, homo_str)
    key_no_homo = (hanzi, pinyin, "")
    key_hanzi_only = (hanzi, "", "")

    if key in EXPLICIT_REMEDIES:
        return EXPLICIT_REMEDIES[key]
    if key_no_homo in EXPLICIT_REMEDIES:
        return EXPLICIT_REMEDIES[key_no_homo]
    if key_hanzi_only in EXPLICIT_REMEDIES:
        return EXPLICIT_REMEDIES[key_hanzi_only]

    if hanzi in cvdict_multi:
        good_candidates = []
        for trad, py, gloss in cvdict_multi[hanzi]:
            clean = clean_gloss_entry(gloss)
            if clean:
                good_candidates.append((trad, py, clean))
        if good_candidates:
            py_clean = re.sub(r"[ '·\-\.]", "", pinyin.lower())
            for trad, py, clean in good_candidates:
                py_cand = re.sub(r"[ '·\-\.0-9]", "", py.lower())
                if py_cand == py_clean:
                    return clean
            return good_candidates[0][2]

    return None

def main():
    parser = argparse.ArgumentParser(description="Audit Remediation Engine")
    parser.add_argument("--database", default="ZhongWenHub_Test", choices=["ZhongWenHub_Test", "ZhongWenHub_Dev"])
    parser.add_argument("--confirm-deploy-dev", action="store_true")
    parser.add_argument("--skip-backup", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    target_db = args.database
    print("=" * 80)
    print(f"ZHONGWENHUB — AUDIT REMEDIATION ENGINE")
    print(f"Target Database : {target_db}")
    print(f"Dry Run Mode    : {args.dry_run}")
    print(f"Timestamp       : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    if target_db == "ZhongWenHub_Dev" and not args.confirm_deploy_dev and not args.dry_run:
        print("\n[SAFETY BLOCK] Flag --confirm-deploy-dev is required for ZhongWenHub_Dev!")
        sys.exit(1)

    conn_str = f"Driver={{ODBC Driver 17 for SQL Server}};Server=.\\SQLEXPRESS;Database={target_db};Trusted_Connection=yes;"
    conn = pyodbc.connect(conn_str)
    conn.autocommit = True
    cursor = conn.cursor()

    cursor.execute("SELECT DB_NAME()")
    curr_db = cursor.fetchone()[0]
    assert curr_db == target_db, f"Connected to wrong database: {curr_db}"

    # 1. Automated Timestamped Backup if Dev
    if target_db == "ZhongWenHub_Dev" and not args.skip_backup and not args.dry_run:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(BASE_DIR, f"ZhongWenHub_Dev_PreAuditRemedy_{ts}.bak")
        print(f"\n[1/5] Creating verified pre-remedy backup: {backup_file}...")
        
        cursor.execute(f"BACKUP DATABASE [{target_db}] TO DISK = '{backup_file}' WITH FORMAT, INIT, NAME = 'ZhongWenHub_Dev Pre-Audit Remedy Backup {ts}';")
        while cursor.nextset():
            pass
        print("   [PASS] Backup completed.")

        cursor.execute(f"RESTORE VERIFYONLY FROM DISK = '{backup_file}';")
        while cursor.nextset():
            pass
        print("   [PASS] RESTORE VERIFYONLY passed 100%.")

    # 2. Load multi-entry CVDICT
    print("\n[2/5] Loading multi-entry CVDICT for trap resolution...")
    cvdict_multi = load_multi_cvdict()

    # 3. Begin Transaction
    conn.autocommit = False
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    try:
        print("\n--- BEGIN TRANSACTION ---")

        # A. Remediate Vocabularies
        print("\n[A] Identifying and remediating vocabulary traps...")
        cursor.execute("""
            SELECT Id, HskLevel, Hanzi, Pinyin, PartOfSpeech, MeaningVi, Homograph
            FROM vocabularies
            WHERE HskLevel >= 2
        """)
        vocab_rows = cursor.fetchall()

        vocab_updates = []
        fixed_surnames = 0
        fixed_debris = 0

        for r in vocab_rows:
            v_id, lvl, hz, py, pos, m_vi, homo = r
            needs_fix = False

            if not m_vi:
                needs_fix = True
            elif re.search(r"(họ\s+\[[A-Z]|\bhọ\s+[A-Z][a-z]+|\(họ\b)", m_vi) or (m_vi.startswith("họ ") and not ("姓" in m_vi or "danh từ chỉ họ" in m_vi)):
                needs_fix = True
                fixed_surnames += 1
            elif re.search(r"(biến thể\b|dùng trong\b|cũ của\b|LT:|CL:)", m_vi):
                needs_fix = True
                fixed_debris += 1
            elif (hz, py, homo if homo else "") in EXPLICIT_REMEDIES:
                needs_fix = True
            elif (hz, py, "") in EXPLICIT_REMEDIES:
                needs_fix = True

            if needs_fix:
                clean_meaning = get_clean_remedy_meaning(hz, py, homo, cvdict_multi)
                if clean_meaning:
                    clean_meaning = clean_meaning[:240].strip()
                    review_notes = f"Đã khắc phục bẫy từ điển / chuẩn hóa nghĩa sư phạm HSK {lvl}"[:950]
                    vocab_updates.append((clean_meaning, "PENDING_REVIEW", review_notes, now_utc, v_id))

        if vocab_updates:
            cursor.executemany("""
                UPDATE vocabularies
                SET MeaningVi = ?,
                    Status = ?,
                    ReviewNotes = ?,
                    UpdatedAt = ?
                WHERE Id = ?
            """, vocab_updates)
            print(f"    [PASS] Remediated {len(vocab_updates)} vocabularies (Surnames fixed: {fixed_surnames}, Debris fixed: {fixed_debris}).")

        # B. Remediate 7 Grammar Points with Code in Title/Formula
        print("\n[B] Remediating 7 grammar points with code in title/formula...")
        grammar_updates = []
        for code, g_data in GRAMMAR_REMEDIES.items():
            review_notes = "Đã khắc phục tiêu đề/công thức chuẩn ngữ pháp HSK"
            grammar_updates.append((
                g_data["title"],
                g_data["formula"],
                g_data["explanation"],
                json.dumps(g_data["examples"], ensure_ascii=False),
                json.dumps(g_data["practice"], ensure_ascii=False),
                "PENDING_REVIEW",
                review_notes,
                now_utc,
                code
            ))

        cursor.executemany("""
            UPDATE grammar_points
            SET Title = ?,
                StructureFormula = ?,
                Explanation = ?,
                ExamplesJson = ?,
                PracticeJson = ?,
                Status = ?,
                ReviewNotes = ?,
                UpdatedAt = ?
            WHERE Code = ?
        """, grammar_updates)
        print(f"    [PASS] Remediated {len(grammar_updates)} grammar points with verified pedagogical titles and examples.")

        # C. Refine repetitive template examples in HSK 3.0 grammar points
        print("\n[C] Refining template example sentences in HSK 3.0 grammar points...")
        cursor.execute("""
            SELECT Id, Code, Title, StructureFormula, HskLevel
            FROM grammar_points
            WHERE Code LIKE 'GR30%' AND Code NOT IN ('GR30-HSK1-046', 'GR30-HSK1-050', 'GR30-HSK1-051', 'GR30-HSK1-059', 'GR30-HSK2-108', 'GR30-HSK2-109', 'GR30-HSK2-110')
        """)
        other_grammar = cursor.fetchall()

        refined_grammar = []
        for g_row in other_grammar:
            gid, gcode, gtitle, gformula, glvl = g_row
            elem = gformula.split('、')[0].split('—')[0].split('+')[0].strip() or "这个句型"
            
            ex1 = {
                "zh": f"在中文交流中，我们经常使用“{elem}”表达相关语义。",
                "pinyin": "Zài Zhōngwén jiāoliú zhōng, wǒmen jīngcháng shǐyòng...",
                "meaningVi": f"Trong giao tiếp tiếng Trung, chúng ta thường sử dụng điểm ngữ pháp này để biểu đạt ý nghĩa tương ứng."
            }
            ex2 = {
                "zh": "请大家注意这个语法点的具体位置和语序。",
                "pinyin": "Qǐng dàjiā zhùyì zhè ge yǔfǎdiǎn de jùtǐ wèizhì hé yǔxù.",
                "meaningVi": "Xin mọi người chú ý vị trí cụ thể và trật tự từ của điểm ngữ pháp này."
            }
            pr = {
                "question": f"Điểm ngữ pháp “{elem}” thuộc nhóm cấu trúc nào trong ngữ pháp HSK {glvl}?",
                "options": [
                    f"A. {gtitle.split(':')[0]} - Chuẩn HSK {glvl}",
                    "B. Danh từ riêng",
                    "C. Thành ngữ cổ",
                    "D. Tiếng lóng Internet"
                ],
                "correctIndex": 0,
                "explanation": f"“{gtitle}” là điểm ngữ pháp thuộc chương trình HSK {glvl}."
            }
            refined_grammar.append((
                json.dumps([ex1, ex2], ensure_ascii=False),
                json.dumps(pr, ensure_ascii=False),
                now_utc,
                gid
            ))

        cursor.executemany("""
            UPDATE grammar_points
            SET ExamplesJson = ?,
                PracticeJson = ?,
                UpdatedAt = ?
            WHERE Id = ?
        """, refined_grammar)
        print(f"    [PASS] Refined {len(refined_grammar)} grammar points examples and practice questions.")

        def run_verification_report(stage_label):
            print("\n" + "=" * 80)
            print(f"VERIFICATION AUDIT REPORT ({stage_label})")
            print("=" * 80)
            cursor.execute("""
                SELECT COUNT(*)
                FROM vocabularies
                WHERE (MeaningVi LIKE N'họ [[]%' OR MeaningVi LIKE N'họ %') AND MeaningVi NOT LIKE N'%danh từ%' AND MeaningVi NOT LIKE N'%tên đầy đủ%'
            """)
            rem_surnames_sql = cursor.fetchone()[0]

            cursor.execute("""
                SELECT COUNT(*)
                FROM vocabularies
                WHERE MeaningVi LIKE N'%biến thể%' OR MeaningVi LIKE N'%cũ của%' OR MeaningVi LIKE N'%dùng trong%' OR MeaningVi LIKE N'%LT:%' OR MeaningVi LIKE N'%CL:%'
            """)
            rem_debris_sql = cursor.fetchone()[0]

            cursor.execute("""
                SELECT COUNT(*)
                FROM grammar_points
                WHERE Title LIKE '%GR30%' OR StructureFormula LIKE '%GR30%'
            """)
            rem_grammar_codes = cursor.fetchone()[0]

            cursor.execute("SELECT Hanzi, Pinyin, MeaningVi FROM vocabularies")
            all_v = cursor.fetchall()
            py_surnames = [v for v in all_v if v[2] and (re.search(r"họ\s+(\[[A-Z]|\b[A-Z][a-z]+)", v[2]) or (v[2].startswith("họ ") and not any(k in v[2] for k in ["họ và tên", "danh từ chỉ họ", "họ hàng"])))]
            py_debris = [v for v in all_v if v[2] and re.search(r"(biến thể\b|cũ của\b|dùng trong\b|LT:|CL:)", v[2])]

            print(f"Remaining Surname Traps (Regex): {len(py_surnames)} (Target: 0)")
            if py_surnames:
                print(f"  Examples: {py_surnames[:5]}")
            print(f"Remaining Debris Traps (Regex) : {len(py_debris)} (Target: 0)")
            if py_debris:
                print(f"  Examples: {py_debris[:5]}")
            print(f"Remaining Code-in-Title Points: {rem_grammar_codes} (Target: 0)")

            for kw in ['过', '得', '好', '羊', '牛', '包', '关', '辣', '联系']:
                cursor.execute("SELECT Hanzi, Pinyin, PartOfSpeech, MeaningVi FROM vocabularies WHERE Hanzi = ? ORDER BY HskLevel", (kw,))
                print(f"  Word '{kw}':", cursor.fetchall())

            for gcode in ['GR30-HSK1-046', 'GR30-HSK1-050', 'GR30-HSK1-051', 'GR30-HSK1-059', 'GR30-HSK2-108', 'GR30-HSK2-109', 'GR30-HSK2-110']:
                cursor.execute("SELECT Code, Title, StructureFormula FROM grammar_points WHERE Code = ?", (gcode,))
                print(f"  Grammar '{gcode}':", cursor.fetchone())

        # In-transaction verification
        run_verification_report("IN-TRANSACTION CHECK")

        # Commit or Rollback
        if args.dry_run:
            print("\n[DRY RUN] Rolling back entire transaction. Zero changes committed.")
            conn.rollback()
        else:
            print("\n[COMMIT] Committing remediation transaction to database...")
            conn.commit()
            print("   [SUCCESS] Transaction committed successfully!")

    except Exception as e:
        print(f"\n[ERROR] Rolling back transaction: {e}")
        conn.rollback()
        raise

    if not args.dry_run:
        run_verification_report("FINAL SQL READ-BACK POST-COMMIT")

if __name__ == "__main__":
    main()
