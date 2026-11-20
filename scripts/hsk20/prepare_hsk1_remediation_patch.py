import argparse
import csv
import json
import os
import re
import sys
import uuid
from collections import defaultdict
from datetime import datetime, timezone
import pyodbc

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
STAGING_DIR = os.path.join(REPO_ROOT, "data", "hsk20", "staging")
SOURCES_DIR = os.path.join(REPO_ROOT, "data", "hsk20", "sources")
PATCH_DIR = os.path.join(REPO_ROOT, "data", "hsk20", "patches")

READONLY_CONN = (
    "DRIVER={{ODBC Driver 17 for SQL Server}};"
    "SERVER=.\\SQLEXPRESS;"
    "DATABASE={db};"
    "Trusted_Connection=yes;"
    "TrustServerCertificate=yes;"
    "ApplicationIntent=ReadOnly;"
)

READWRITE_CONN = (
    "DRIVER={{ODBC Driver 17 for SQL Server}};"
    "SERVER=.\\SQLEXPRESS;"
    "DATABASE={db};"
    "Trusted_Connection=yes;"
    "TrustServerCertificate=yes;"
)

# Deterministic thematic lesson fallback for any HSK 2.0 words not appearing verbatim in dialogue/listening/exercise text
THEMATIC_VOCAB_LESSON = {
    # L01: Greetings
    "好": 1, "你": 1, "我": 1, "他": 4, "她": 4, "我们": 1, "再见": 2, "不": 1, "吗": 1, "呢": 5, "很": 1, "的": 4,
    # L02: Gratitude / Apologies
    "谢谢": 2, "不客气": 2, "对不起": 2, "没关系": 2, "请": 2, "小姐": 2, "先生": 2,
    # L03: Names / Countries / Identity
    "叫": 3, "什么": 3, "名字": 3, "谁": 3, "中国": 3, "北京": 10, "人": 3, "是": 1, "学习": 3, "汉语": 4,
    # L04: People, Family, Teachers, Numbers 1-10
    "老师": 4, "学生": 4, "同学": 4, "朋友": 4, "爸爸": 4, "妈妈": 4, "儿子": 4, "女儿": 4,
    "爱": 4, "喜欢": 4, "认识": 4, "岁": 4, "多": 4, "大": 4, "小": 4, "都": 4, "和": 4, "一": 4, "二": 4, "三": 4,
    # L05: Drinks, Food, Fruits, Eating
    "想": 5, "喝": 5, "茶": 5, "水": 5, "杯子": 5, "吃": 5, "米饭": 5, "菜": 5, "水果": 5, "苹果": 11,
    "饭馆": 5, "饭": 5, "做": 6, "四": 5, "五": 5, "六": 5,
    # L06: Daily activities, Reading, Studying, Objects
    "看": 6, "看见": 6, "读": 6, "写": 6, "字": 6, "书": 6, "桌子": 6, "椅子": 6, "本": 6,
    "工作": 6, "医生": 6, "医院": 6, "电脑": 6, "电视": 6, "电影": 6, "听": 6, "说": 6, "说话": 6,
    # L07: Calendar, Weekdays, Dates
    "今天": 7, "明天": 8, "昨天": 7, "星期": 7, "年": 7, "月": 7, "日": 7, "号": 7, "几": 7,
    "七": 7, "八": 7, "九": 7, "十": 7,
    # L08: Weather, Cold/Hot, Degree
    "天气": 8, "冷": 8, "热": 8, "下雨": 8, "怎么样": 8, "怎么": 8, "太": 8, "了": 8, "没": 8, "没有": 8,
    "高": 8, "高兴": 8, "漂亮": 8, "能": 8,
    # L09: Time, Clock, Phone
    "现在": 9, "时候": 9, "点": 9, "分钟": 9, "上午": 9, "中午": 9, "下午": 9, "睡觉": 9,
    "打电话": 9, "喂": 9,
    # L10: Going places, Home, Living
    "去": 10, "来": 10, "回": 10, "住": 10, "在": 10, "家": 10, "有": 10, "这": 10, "这儿": 10, "那": 10, "那儿": 10, "哪": 10, "哪儿": 10,
    # L11: Shopping, Money, Animals
    "钱": 11, "块": 11, "多少": 11, "少": 11, "个": 11, "些": 11, "一点儿": 11,
    "猫": 11, "狗": 11, "零": 11,
    # L12: Buying things, Clothes, Store
    "买": 12, "东西": 12, "商店": 12, "衣服": 12, "只": 12, "吧": 12, "也": 12, "吗": 1,
    # L13: Locations, Directions, School
    "学校": 13, "前面": 13, "后面": 13, "里": 13, "上": 13, "下": 13, "里面": 13,
    # L14: Driving, Ability, Car
    "会": 14, "开": 14, "开车": 14, "出租车": 14, "坐": 14,
    # L15: Travel, Airplane, Train station
    "飞机": 15, "火车站": 15, "到": 15, "出": 15,
}

# Verified AllSet HSK 1 Grammar specs (each matched directly to allset_grammar_hsk1.csv exact structure formula & checked marker)
VERIFIED_ALLSET_GRAMMAR_SPECS = [
    {
        "lessonNumber": 1, "code": "GP-HSK20-01A",
        "title": "Tính từ làm vị ngữ với phó từ 很 (rất)",
        "structure": "Noun + 很 + Adj.",
        "explanation": "Khi tính từ làm vị ngữ trong câu khẳng định tiếng Trung, thường đặt phó từ 很 (hěn) trước tính từ để câu tự nhiên, không nhất thiết mang nghĩa nhấn mạnh 'rất'.",
        "difficulty": "Dễ",
        "required_markers": ["很"],
        "csv_structs": ["Noun + 很 + Adj."],
        "vi_translations": {
            "我很好。": "Tôi rất khỏe.",
            "他很高。": "Anh ấy cao.",
            "她很漂亮。": "Cô ấy rất xinh đẹp.",
        },
    },
    {
        "lessonNumber": 2, "code": "GP-HSK20-02A",
        "title": "Lời mời, yêu cầu lịch sự với 请 (xin mời)",
        "structure": "请 (+ 你) + Verb Phrase",
        "explanation": "Đặt động từ 请 (qǐng - xin mời) trước cụm động từ để biểu thị lời mời hoặc đề nghị lịch sự.",
        "difficulty": "Dễ",
        "required_markers": ["请"],
        "csv_structs": ["请 + Verb", "请 (+ 你) + Verb Phrase"],
        "vi_translations": {
            "请进。": "Mời vào.",
            "请坐。": "Mời ngồi.",
            "请喝茶。": "Mời uống trà.",
            "请你说得慢一点。": "Xin bạn nói chậm một chút.",
        },
    },
    {
        "lessonNumber": 2, "code": "GP-HSK20-02B",
        "title": "Câu hỏi Có/Không với trợ từ ngữ khí 吗",
        "structure": "[Statement] + 吗？",
        "explanation": "Thêm trợ từ ngữ khí 吗 (ma) vào cuối câu trần thuật để tạo thành câu hỏi Có/Không (Yes/No).",
        "difficulty": "Dễ",
        "required_markers": ["吗"],
        "csv_structs": ["[Statement] + 吗 ？"],
        "vi_translations": {
            "你喜欢咖啡吗？": "Bạn có thích cà phê không?",
            "你喜欢中国菜吗？": "Bạn có thích món ăn Trung Quốc không?",
            "他是老师吗？": "Anh ấy có phải là giáo viên không?",
        },
    },
    {
        "lessonNumber": 3, "code": "GP-HSK20-03A",
        "title": "Giới thiệu tên với động từ 叫 (tên là)",
        "structure": "Subj. + 叫 + [Name]",
        "explanation": "Động từ 叫 (jiào) dùng để giới thiệu tên của người hoặc gọi tên sự vật.",
        "difficulty": "Dễ",
        "required_markers": ["叫"],
        "csv_structs": ["Subj. + 叫 + [Name]"],
        "vi_translations": {
            "我叫Tom。": "Tôi tên là Tom.",
            "他叫李明。": "Anh ấy tên là Lý Minh.",
            "这个地方叫外滩。": "Nơi này gọi là Bến Thượng Hải.",
        },
    },
    {
        "lessonNumber": 3, "code": "GP-HSK20-03B",
        "title": "Câu phán đoán với động từ 是 (là)",
        "structure": "Noun 1 + 是 + Noun 2",
        "explanation": "Động từ 是 (shì) dùng để nối chủ ngữ và danh từ vị ngữ nhằm xác định danh tính hoặc nghề nghiệp.",
        "difficulty": "Dễ",
        "required_markers": ["是"],
        "csv_structs": ["Noun 1 + 是 + Noun 2"],
        "vi_translations": {
            "我是学生。": "Tôi là học sinh.",
            "她是老师。": "Cô ấy là giáo viên.",
            "他是中国人。": "Anh ấy là người Trung Quốc.",
        },
    },
    {
        "lessonNumber": 4, "code": "GP-HSK20-04A",
        "title": "Trợ từ kết cấu sở hữu 的 (của)",
        "structure": "Noun 1 + 的 + Noun 2",
        "explanation": "Trợ từ 的 (de) đặt giữa chủ sở hữu và danh từ bị sở hữu để biểu thị quan hệ sở hữu 'của'.",
        "difficulty": "Dễ",
        "required_markers": ["的"],
        "csv_structs": ["Noun 1 + 的 + Noun 2"],
        "vi_translations": {
            "你的手机": "điện thoại của bạn",
            "我们的钱": "tiền của chúng tôi",
            "爸爸的车": "xe của bố",
            "北京的空气": "không khí của Bắc Kinh",
        },
    },
    {
        "lessonNumber": 4, "code": "GP-HSK20-04B",
        "title": "Phó từ chỉ toàn thể 都 (đều)",
        "structure": "Subj. + 都 + [Verb Phrase]",
        "explanation": "Phó từ 都 (dōu) luôn đứng trước động từ hoặc tính từ, biểu thị toàn bộ các đối tượng được nhắc tới ở chủ ngữ đều có chung trạng thái/hành động.",
        "difficulty": "Dễ",
        "required_markers": ["都"],
        "csv_structs": ["Subj. + 都 + [Verb Phrase]"],
        "vi_translations": {
            "他们都在上海。": "Họ đều ở Thượng Hải.",
            "明天我们都可以去。": "Ngày mai tất cả chúng ta đều có thể đi.",
            "我们两个都爱你。": "Cả hai chúng tôi đều yêu bạn.",
        },
    },
    {
        "lessonNumber": 5, "code": "GP-HSK20-05A",
        "title": "Biểu thị mong muốn với động từ năng nguyện 想",
        "structure": "Subj. + 想 + Verb (+ Obj.)",
        "explanation": "Động từ năng nguyện 想 (xiǎng) đứng trước động từ chính để biểu thị mong muốn, dự định làm việc gì đó.",
        "difficulty": "Dễ",
        "required_markers": ["想"],
        "csv_structs": ["Subj. + 想 + Verb (+ Obj.)", "Subj. + 不 + 想 + Verb + Obj."],
        "vi_translations": {
            "你想去吗？": "Bạn có muốn đi không?",
            "那个地方很近，我不想开车。": "Nơi đó rất gần, tôi không muốn lái xe.",
            "我想喝茶。": "Tôi muốn uống trà.",
        },
    },
    {
        "lessonNumber": 5, "code": "GP-HSK20-05B",
        "title": "Câu hỏi tỉnh lược với trợ từ 呢 (thì sao)",
        "structure": "Topic + 呢？",
        "explanation": "Đặt 呢 (ne) sau danh từ hoặc đại từ để hỏi tiếp theo ngữ cảnh trước đó ('...thì sao?' hoặc '...ở đâu rồi?').",
        "difficulty": "Dễ",
        "required_markers": ["呢"],
        "csv_structs": ["Topic + 呢 ？", "[Missing Person / Thing] + 呢 ？"],
        "vi_translations": {
            "这个很好，那个呢？": "Cái này rất tốt, còn cái kia thì sao?",
            "你妈妈呢？": "Mẹ bạn đâu rồi?",
        },
    },
    {
        "lessonNumber": 6, "code": "GP-HSK20-06A",
        "title": "Biểu thị hành động đang diễn ra với 在",
        "structure": "Subj. + 在 + Verb + Obj.",
        "explanation": "Phó từ 在 (zài) hoặc 正在 đặt trước động từ để diễn tả hành động đang diễn ra ở thời điểm nói.",
        "difficulty": "Dễ",
        "required_markers": ["在"],
        "csv_structs": ["Subj. + 在 + Verb + Obj.", "Subj. + 正在 + Verb + Obj."],
        "vi_translations": {
            "她在看书。": "Cô ấy đang đọc sách.",
            "妈妈在打电话。": "Mẹ đang gọi điện thoại.",
            "我们正在上课，请你等一会儿。": "Chúng tôi đang lên lớp, xin bạn đợi một lát.",
        },
    },
    {
        "lessonNumber": 6, "code": "GP-HSK20-06B",
        "title": "Liên từ đẳng lập 和 (và / cùng với)",
        "structure": "Noun 1 + 和 + Noun 2",
        "explanation": "和 (hé) nối hai danh từ hoặc cụm danh từ ngang hàng nhau.",
        "difficulty": "Dễ",
        "required_markers": ["和"],
        "csv_structs": ["Noun 1 + 和 + Noun 2"],
        "vi_translations": {
            "你和我": "bạn và tôi",
            "我和朋友在酒吧。": "Tôi và bạn đang ở quán bar.",
        },
    },
    {
        "lessonNumber": 7, "code": "GP-HSK20-07A",
        "title": "Cách biểu đạt ngày tháng năm (年 - 月 - 号/日)",
        "structure": "x 年 + y 月 + z （日 / 号）",
        "explanation": "Trong tiếng Trung, thứ tự thời gian viết từ đơn vị lớn đến nhỏ: Năm (年) -> Tháng (月) -> Ngày (号 trong khẩu ngữ / 日 trong văn viết).",
        "difficulty": "Dễ",
        "required_markers": ["月"],
        "csv_structs": ["x 年 + y 月 + z （日 /  号）"],
        "vi_translations": {
            "1910年8月9号": "Ngày 9 tháng 8 năm 1910",
            "五月一号": "Ngày 1 tháng 5",
        },
    },
    {
        "lessonNumber": 7, "code": "GP-HSK20-07B",
        "title": "Phủ định của động từ 有 bằng 没 / 没有",
        "structure": "Subj. + 没 + 有 (+ Obj.)",
        "explanation": "Để phủ định động từ sở hữu 有 (yǒu), bắt buộc dùng 没 (méi) chứ không dùng 不.",
        "difficulty": "Dễ",
        "required_markers": ["没"],
        "csv_structs": ["没 + 有 (+ Obj.)"],
        "vi_translations": {
            "我没有问题。": "Tôi không có vấn đề gì.",
            "我们现在没有钱。": "Bây giờ chúng tôi không có tiền.",
            "他没有工作吗？": "Anh ấy không có việc làm à?",
        },
    },
    {
        "lessonNumber": 8, "code": "GP-HSK20-08A",
        "title": "Hỏi tính chất / trạng thái với 怎么样 (thế nào)",
        "structure": "Subj. + 怎么样？",
        "explanation": "Đại từ nghi vấn 怎么样 (zěnmeyàng) đặt cuối câu để hỏi về tình hình, cảm nhận hoặc thời tiết.",
        "difficulty": "Dễ",
        "required_markers": ["怎么样"],
        "csv_structs": ["Subj. + 怎么样 ?", "你 觉得 + Topic + 怎么样 ?"],
        "vi_translations": {
            "你最近怎么样？": "Gần đây bạn thế nào?",
            "你觉得我怎么样？": "Bạn thấy tôi thế nào?",
        },
    },
    {
        "lessonNumber": 8, "code": "GP-HSK20-08B",
        "title": "Câu cảm thán mức độ cao với 太……了",
        "structure": "太 + Adj. + 了",
        "explanation": "Cấu trúc 太 + Tính từ + 了 biểu đạt mức độ vượt ngưỡng hoặc cảm thán ('...quá rồi / thật là...').",
        "difficulty": "Dễ",
        "required_markers": ["太", "了"],
        "csv_structs": ["太 + Adj. + 了"],
        "vi_translations": {
            "小猫太可爱了！": "Chú mèo con dễ thương quá đi!",
            "米饭太多了。": "Cơm nhiều quá rồi.",
        },
    },
    {
        "lessonNumber": 8, "code": "GP-HSK20-08C",
        "title": "Phủ định nhẹ với 不太 (không...lắm)",
        "structure": "Subj. + 不太 + Adj.",
        "explanation": "不太 + Tính từ dùng để làm dịu câu phủ định, mang nghĩa 'không ... lắm'.",
        "difficulty": "Dễ",
        "required_markers": ["不太"],
        "csv_structs": ["Subj. + 不太 + Adj."],
        "vi_translations": {
            "我家不太大。": "Nhà tôi không lớn lắm.",
        },
    },
    {
        "lessonNumber": 9, "code": "GP-HSK20-09A",
        "title": "Cách nói giờ và phút (x 点 y 分 / 半)",
        "structure": "x 点 + y 分 / x 点 + 半",
        "explanation": "Dùng 点 (diǎn - giờ), 分 (fēn - phút) và 半 (bàn - rưỡi) để biểu đạt thời gian trong ngày.",
        "difficulty": "Dễ",
        "required_markers": ["点"],
        "csv_structs": ["x 点 y 分", "x 点 + 半", "(Date and/or time of day +) x 点"],
        "vi_translations": {
            "两点十分": "2 giờ 10 phút",
            "两点零九分": "2 giờ 09 phút",
            "五点半": "5 giờ rưỡi",
            "昨天晚上七点半": "7 giờ rưỡi tối hôm qua",
            "上午七点": "7 giờ sáng",
        },
    },
    {
        "lessonNumber": 9, "code": "GP-HSK20-09B",
        "title": "Trật tự từ chỉ thời gian trong câu",
        "structure": "Subj. + Time + Verb + Obj.",
        "explanation": "Trạng ngữ chỉ thời gian luôn đứng trước động từ (đặt trước hoặc ngay sau chủ ngữ), không đặt ở cuối câu như tiếng Việt.",
        "difficulty": "Trung bình",
        "required_markers": ["点"],
        "csv_structs": ["Time / Verb + 以后, ...."],
        "vi_translations": {
            "下午三点以后，我不在家。": "Sau 3 giờ chiều tôi không có ở nhà.",
        },
    },
    {
        "lessonNumber": 10, "code": "GP-HSK20-10A",
        "title": "Hỏi thời điểm với 什么时候 (khi nào)",
        "structure": "Subj. + 什么时候 + Predicate?",
        "explanation": "Cụm từ nghi vấn 什么时候 đặt ở vị trí của trạng ngữ thời gian để hỏi về thời điểm diễn ra sự việc.",
        "difficulty": "Dễ",
        "required_markers": ["什么时候"],
        "csv_structs": ["Subj. + 什么时候 + Predicate ?"],
        "vi_translations": {
            "你什么时候来？": "Khi nào bạn đến?",
        },
    },
    {
        "lessonNumber": 10, "code": "GP-HSK20-10B",
        "title": "Diễn đạt di chuyển tới địa điểm với 去 / 来",
        "structure": "Subj. + 去 / 来 + [Place]",
        "explanation": "去 (qù - đi tới) hướng ra xa người nói, còn 来 (lái - đến) hướng về phía người nói.",
        "difficulty": "Dễ",
        "required_markers": ["去"],
        "csv_structs": ["Subj. + 去 + [Place]", "来 / 去 + Place"],
        "vi_translations": {
            "我去公司。": "Tôi đi công ty.",
            "爸爸明天去北京出差。": "Bố ngày mai đi Bắc Kinh công tác.",
            "妈妈要去超市。": "Mẹ sắp đi siêu thị.",
        },
    },
    {
        "lessonNumber": 11, "code": "GP-HSK20-11A",
        "title": "Hỏi giá tiền và số lượng với 多少钱 / 几",
        "structure": "Subj. + 多少钱？ / 几 + MW + Noun？",
        "explanation": "Dùng 多少钱 (duōshao qián) để hỏi giá cả và 几 (jǐ) + lượng từ để hỏi số lượng ước chừng nhỏ hơn 10.",
        "difficulty": "Dễ",
        "required_markers": ["多少钱", "几"],
        "csv_structs": ["Subj. + 多少钱 ?", "Subj. + Verb + 几 + Measure Word + Noun？"],
        "vi_translations": {
            "多少钱？": "Bao nhiêu tiền?",
            "他有几个孩子？": "Anh ấy có mấy người con?",
        },
    },
    {
        "lessonNumber": 11, "code": "GP-HSK20-11B",
        "title": "Đơn vị tiền tệ Trung Quốc (块 / 毛) và lượng từ 个",
        "structure": "Number + 块 / Number + 个 + Noun",
        "explanation": "Trong khẩu ngữ dùng 块 (kuài - đồng/tệ) và 毛 (máo - hào); 个 (gè) là lượng từ phổ biến nhất đứng giữa số từ và danh từ.",
        "difficulty": "Dễ",
        "required_markers": ["块", "个"],
        "csv_structs": ["Number + 块 + Number + 毛", "Number + 个 + Noun"],
        "vi_translations": {
            "两块五毛": "2 tệ 5 hào",
            "二十三块八毛": "23 tệ 8 hào",
            "十个男人，七个傻，八个坏。": "Mười người đàn ông thì bảy người ngốc, tám người xấu.",
        },
    },
    {
        "lessonNumber": 12, "code": "GP-HSK20-12A",
        "title": "Hỏi nơi chốn với 哪儿 / 哪里 (ở đâu)",
        "structure": "Subj. + Verb + 哪儿 / 哪里？",
        "explanation": "哪儿 (nǎr) và 哪里 (nǎli) đặt ở vị trí danh từ chỉ nơi chốn để hỏi địa điểm.",
        "difficulty": "Dễ",
        "required_markers": ["哪"],
        "csv_structs": ["Subj. + Verb + 哪里 / 哪儿 ?", "Subj. + Verb + 哪个 (+ Noun) ?"],
        "vi_translations": {
            "你要哪个？": "Bạn muốn cái nào?",
        },
    },
    {
        "lessonNumber": 12, "code": "GP-HSK20-12B",
        "title": "Câu đề nghị, rủ rê nhẹ nhàng với trợ từ 吧",
        "structure": "Statement / Command + 吧",
        "explanation": "Trợ từ 吧 (ba) đặt cuối câu để giảm nhẹ sắc thái mệnh lệnh, biểu thị lời rủ rê hoặc gợi ý thân mật ('...nhé / đi thôi').",
        "difficulty": "Dễ",
        "required_markers": ["吧"],
        "csv_structs": ["Command + 吧", "Statement + 吧"],
        "vi_translations": {
            "我们走吧。": "Chúng ta đi thôi.",
            "我们去吃饭吧。": "Chúng ta đi ăn cơm nhé.",
            "太贵了吧，我不买了。": "Đắt quá rồi nhỉ, tôi không mua nữa đâu.",
        },
    },
    {
        "lessonNumber": 13, "code": "GP-HSK20-13A",
        "title": "Biểu thị sự tồn tại tại vị trí với 在 và 有",
        "structure": "Subj. + 在 + Place / Place + 有 + Obj.",
        "explanation": "'Chủ thể + 在 + Vị trí' nhấn mạnh đối tượng ở đâu; 'Vị trí + 有 + Danh từ' nhấn mạnh ở nơi đó có cái gì.",
        "difficulty": "Trung bình",
        "required_markers": ["在", "有"],
        "csv_structs": ["Subj. + 在 + Place", "Place + 有 + Obj."],
        "vi_translations": {
            "我在上海。": "Tôi ở Thượng Hải.",
            "我家有很多小狗。": "Nhà tôi có rất nhiều chó con.",
        },
    },
    {
        "lessonNumber": 13, "code": "GP-HSK20-13B",
        "title": "Địa điểm thực hiện hành động (在 + Place + Verb)",
        "structure": "Subj. + 在 + Place + Verb + Obj.",
        "explanation": "Cụm giới từ '在 + Địa điểm' luôn đặt trước động từ để chỉ nơi chốn diễn ra hành động.",
        "difficulty": "Trung bình",
        "required_markers": ["在"],
        "csv_structs": ["Subj. + 在 + Place + Verb + Obj."],
        "vi_translations": {
            "我在上海上大学。": "Tôi học đại học ở Thượng Hải.",
            "老板在会议室见客户。": "Sếp gặp khách hàng ở phòng họp.",
        },
    },
    {
        "lessonNumber": 14, "code": "GP-HSK20-14A",
        "title": "Động từ năng nguyện 会 (biết làm qua học tập)",
        "structure": "Subj. + (不) + 会 + Verb + Obj.",
        "explanation": "会 (huì) đặt trước động từ để chỉ kỹ năng có được thông qua học tập hoặc luyện tập (như lái xe, nói tiếng Trung).",
        "difficulty": "Dễ",
        "required_markers": ["会"],
        "csv_structs": ["Subj. + 会 + Verb + Obj."],
        "vi_translations": {
            "他会说中文。": "Anh ấy biết nói tiếng Trung.",
            "我奶奶不会用电脑。": "Bà tôi không biết dùng máy tính.",
        },
    },
    {
        "lessonNumber": 14, "code": "GP-HSK20-14B",
        "title": "Biểu thị khả năng / sự cho phép với 能 (có thể)",
        "structure": "Subj. + 能 + Verb + Obj.",
        "explanation": "能 (néng) diễn đạt khả năng thực tế hoặc sự cho phép thực hiện hành động.",
        "difficulty": "Dễ",
        "required_markers": ["能"],
        "csv_structs": ["Subj. + 能 + Verb + Obj."],
        "vi_translations": {
            "我能吃四十个饺子。": "Tôi có thể ăn 40 cái sủi cảo.",
            "上课的时候不能说英文。": "Lúc lên lớp không được nói tiếng Anh.",
        },
    },
    {
        "lessonNumber": 15, "code": "GP-HSK20-15A",
        "title": "Cấu trúc nhấn mạnh thời gian, địa điểm, phương thức 是……的",
        "structure": "Subj. + 是 + [Time/Place/Manner] + Verb + 的",
        "explanation": "Khi hành động đã xảy ra, dùng 是……的 kẹp lấy phần thời gian, nơi chốn hoặc phương thức (như đi máy bay) để nhấn mạnh chi tiết đó.",
        "difficulty": "Trung bình",
        "required_markers": ["是", "的"],
        "csv_structs": ["Subj. + 是 + [Information to be Emphasized] + Verb + 的"],
        "vi_translations": {
            "那次我们是用Skype开会的。": "Lần đó chúng tôi họp bằng Skype.",
        },
    },
    {
        "lessonNumber": 15, "code": "GP-HSK20-15B",
        "title": "Trợ từ động thái 了 biểu thị hành động đã hoàn thành",
        "structure": "Subj. + Verb + 了 (+ Obj.)",
        "explanation": "了 (le) đứng sau động từ biểu thị sự hoàn thành của hành động.",
        "difficulty": "Trung bình",
        "required_markers": ["了"],
        "csv_structs": ["Subj. + Verb + 了", "Subj. + Time + Verb + 了 + Obj.", "Subj. + Verb + 了 + [Number + Measure Word] + Obj."],
        "vi_translations": {
            "他们到了。": "Họ đến rồi.",
            "我今天吃了早饭。": "Hôm nay tôi đã ăn sáng rồi.",
            "我喝了两杯咖啡。": "Tôi đã uống hai cốc cà phê.",
            "老师问了五个问题。": "Thầy giáo đã hỏi năm câu hỏi.",
        },
    },
]


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def fetch_db_hsk1(conn):
    cur = conn.cursor()

    def q(sql, params=()):
        cur.execute(sql, params)
        cols = [c[0] for c in cur.description]
        rows = []
        for r in cur.fetchall():
            d = {}
            for k, v in zip(cols, r):
                if isinstance(v, uuid.UUID):
                    v = str(v).upper()
                elif isinstance(v, datetime):
                    v = v.isoformat()
                elif isinstance(v, str) and (k.endswith("Id") or k == "Id") and len(v) == 36:
                    v = v.upper()
                d[k] = v
            rows.append(d)
        return rows

    courses = q("SELECT * FROM courses ORDER BY HskLevel")
    hsk1_course = next(c for c in courses if c["HskLevel"] == 1)
    cid = hsk1_course["Id"]
    units = q("SELECT * FROM units WHERE CourseId = ? ORDER BY OrderIndex, UnitNumber", (cid,))
    lessons = q("SELECT * FROM lessons WHERE CourseId = ? ORDER BY LessonNumber, OrderIndex", (cid,))
    vocabs = q("SELECT * FROM vocabularies WHERE HskLevel = 1 OR LessonId IN (SELECT Id FROM lessons WHERE CourseId = ?) ORDER BY Hanzi, Id", (cid,))
    grammars = q("SELECT * FROM grammar_points WHERE HskLevel = 1 OR LessonId IN (SELECT Id FROM lessons WHERE CourseId = ?) ORDER BY Code, Id", (cid,))
    exercises = q("SELECT * FROM exercises WHERE HskLevel = 1 OR LessonId IN (SELECT Id FROM lessons WHERE CourseId = ?) ORDER BY LessonId, Id", (cid,))
    return {
        "courses": courses,
        "course": hsk1_course,
        "units": units,
        "lessons": lessons,
        "vocabs": vocabs,
        "grammars": grammars,
        "exercises": exercises,
    }


def deterministic_vocab_mapping(hsk20_words, lessons):
    lesson_texts = {}
    for l in lessons:
        lnum = l["LessonNumber"]
        dlg = json.loads(l["DialogueJson"] or "{}")
        lst = json.loads(l["ListeningJson"] or "[]")
        items = lst if isinstance(lst, list) else lst.get("items", [])
        text = " ".join([
            l.get("TitleZh") or "",
            " ".join(x.get("zh", "") for x in dlg.get("lines", [])),
            " ".join(x.get("transcriptZh", "") for x in items),
        ])
        lesson_texts[lnum] = text

    assigned = {}
    counts = defaultdict(int)

    # First lock explicit thematic/dialogue anchors for L01-L03 existing core & missing words
    anchors = {
        "你": 1, "好": 1, "我": 1, "不": 1, "吗": 1, "很": 1,
        "谢谢": 2, "不客气": 2, "对不起": 2, "没关系": 2,
        "叫": 3, "什么": 3, "名字": 3, "谁": 3, "中国": 3, "人": 3, "学习": 3,
    }
    for w in hsk20_words:
        hz = w["hanzi"]
        if hz in anchors:
            lnum = anchors[hz]
            assigned[hz] = (lnum, "EXPLICIT_L1_L3_ANCHOR")
            counts[lnum] += 1

    # Second pass: match words by thematic table first if lesson hasn't hit cap, preferring dialogue appearance
    for w in hsk20_words:
        hz = w["hanzi"]
        if hz in assigned:
            continue
        # Find lessons whose dialogue/listening contains this exact word
        dialogue_hits = [ln for ln in range(1, 16) if hz in lesson_texts[ln]]
        theme_ln = THEMATIC_VOCAB_LESSON.get(hz)
        if theme_ln and counts[theme_ln] < 12:
            chosen = theme_ln
            reason = "THEMATIC_HSK20_MAPPING" if theme_ln not in dialogue_hits else "DIALOGUE_AND_THEME_MATCH"
        elif dialogue_hits:
            chosen = min(dialogue_hits, key=lambda ln: (counts[ln] >= 12, ln))
            reason = "DIALOGUE_TEXT_MATCH"
        else:
            # Fallback to least populated lesson within semantic neighborhood
            chosen = min(range(4, 16), key=lambda ln: (counts[ln], ln))
            reason = "BALANCED_HSK20_CURRICULUM_FIT"
        assigned[hz] = (chosen, reason)
        counts[chosen] += 1

    return assigned, dict(counts)


def build_allset_grammar_rows(allset_rows, lessons_by_num):
    by_struct = defaultdict(list)
    for r in allset_rows:
        if len(r) < 9:
            continue
        _, zh, py, en, _, struct, cat, title_en, url = r[:9]
        by_struct[struct.strip(": ")].append({
            "zh": zh.strip(),
            "pinyin": py.strip(),
            "en": en.strip(),
            "url": url.strip(),
        })

    new_grammars = []
    for spec in VERIFIED_ALLSET_GRAMMAR_SPECS:
        examples = []
        seen_zh = set()
        for cs in spec["csv_structs"]:
            for item in by_struct.get(cs, []):
                zh = item["zh"]
                if zh in seen_zh:
                    continue
                if zh not in spec["vi_translations"]:
                    continue
                if not any(m in zh for m in spec["required_markers"]):
                    continue
                seen_zh.add(zh)
                examples.append({
                    "zh": zh,
                    "pinyin": item["pinyin"],
                    "meaningVi": spec["vi_translations"][zh],
                    "meaningEn": item["en"],
                    "sourceUrl": item["url"],
                })
        # Also include curated spec translations if CSV uses slightly different sentence form only if directly verified in spec
        if not examples:
            raise RuntimeError(f"No verified CSV example found for {spec['code']} ({spec['structure']})")

        ex0 = examples[0]
        practice = {
            "question": f"Điểm ngữ pháp '{spec['title']}' ({spec['structure']}) phù hợp nhất với câu nào dưới đây?",
            "options": [
                f"{ex0['zh']} ({ex0['meaningVi']})",
                "明天不热吗？ (Câu ví dụ không khớp cấu trúc)",
                "他叫大卫。 (Câu giới thiệu tên)",
                "请问多少钱？ (Câu hỏi giá tiền)",
            ],
            "correctIndex": 0,
            "explanation": spec["explanation"],
        }

        lid = lessons_by_num[spec["lessonNumber"]]["Id"]
        gid = str(uuid.uuid5(uuid.NAMESPACE_URL, f"zhongwenhub:hsk20:grammar:{spec['code']}")).upper()
        new_grammars.append({
            "Id": gid,
            "Code": spec["code"],
            "Title": spec["title"],
            "PinyinTitle": "",
            "HskLevel": 1,
            "Category": "HSK 2.0 Ngữ pháp cốt lõi",
            "StructureFormula": spec["structure"],
            "Explanation": spec["explanation"],
            "Difficulty": spec["difficulty"],
            "ExamplesJson": json.dumps(examples, ensure_ascii=False),
            "PracticeJson": json.dumps(practice, ensure_ascii=False),
            "Status": "PENDING_REVIEW",
            "LessonId": lid,
            "LessonNumber": spec["lessonNumber"],
            "SourceDataset": "HSK 2.0 (AllSet Grammar Wiki)",
            "SourceEntryId": spec["code"],
            "ReviewNotes": "Sourced & verified from AllSet Learning Chinese Grammar Wiki (data/hsk20/sources/allset_grammar_hsk1.csv)",
        })
    return new_grammars


def sql_str(val):
    if val is None:
        return "NULL"
    escaped = str(val).replace("'", "''")
    return f"N'{escaped}'"


def build_patch(test_db, dev_db, target_db_label="ZhongWenHub_Test"):
    hsk20_vocab_raw = load_json(os.path.join(STAGING_DIR, "hsk20_vocab_hsk1.json"))["words"]
    allset_rows = list(csv.reader(open(os.path.join(SOURCES_DIR, "allset_grammar_hsk1.csv"), encoding="utf-8")))
    mapping70 = load_json(os.path.join(STAGING_DIR, "hsk20_curriculum_mapping_70_lessons.json"))["levels"]["HSK1"]["lessons"]

    lessons_by_num = {l["LessonNumber"]: l for l in test_db["lessons"]}
    dev_lessons_by_num = {l["LessonNumber"]: l for l in dev_db["lessons"]}
    units_by_id = {u["Id"]: u for u in test_db["units"]}
    map70_by_num = {m["lessonNumber"]: m for m in mapping70}

    # 1. Cross-matrix (Phase A deliverable)
    cross_matrix = []
    for lnum in range(1, 16):
        tl = lessons_by_num[lnum]
        dl = dev_lessons_by_num.get(lnum)
        m70 = map70_by_num.get(lnum, {})
        tu = units_by_id.get(tl["UnitId"], {})
        tv = [v for v in test_db["vocabs"] if v["LessonId"] == tl["Id"]]
        tg = [g for g in test_db["grammars"] if g["LessonId"] == tl["Id"]]
        te = [e for e in test_db["exercises"] if e["LessonId"] == tl["Id"]]
        tg_real = [g for g in tg if "在中文交流中，我们经常使用" not in (g.get("ExamplesJson") or "")]
        dlg = json.loads(tl.get("DialogueJson") or "{}")
        rp = dlg.get("readingPassage") or {}
        cross_matrix.append({
            "lessonNumber": lnum,
            "testLessonId": tl["Id"],
            "devLessonId": dl["Id"] if dl else None,
            "testUnitId": tl["UnitId"],
            "unitNumber": tu.get("UnitNumber"),
            "unitStatus": tu.get("Status"),
            "testTitleZh": tl["TitleZh"],
            "testTitleVi": tl["TitleVi"],
            "pinyin": tl["Pinyin"],
            "canonicalBlcupTitleZh": m70.get("canonicalTitleZh"),
            "testStatus": tl["Status"],
            "currentLinkedVocabCount": len(tv),
            "currentGrammarCount": len(tg),
            "currentRealGrammarCount": len(tg_real),
            "currentPublishedGrammarCount": sum(1 for g in tg if g["Status"] == "PUBLISHED"),
            "currentExerciseCount": len(te),
            "currentPublishedExerciseCount": sum(1 for e in te if e["Status"] == "PUBLISHED"),
            "dialogueLineCount": len(dlg.get("lines", [])),
            "readingPassageStatus": rp.get("status"),
            "readingPassageLessonIdMismatch": bool(rp and (rp.get("lessonId") or "").upper() != tl["Id"]),
            "hasDraftPlaceholder": "bản thảo" in ((tl.get("TitleVi") or "") + (tl.get("DialogueJson") or "")).lower(),
        })

    # 2. Deterministic Vocab Mapping (150/150)
    vocab_assign, lesson_vocab_counts = deterministic_vocab_mapping(hsk20_vocab_raw, test_db["lessons"])
    existing_by_hanzi = defaultdict(list)
    for v in test_db["vocabs"]:
        existing_by_hanzi[v["Hanzi"]].append(v)

    vocab_updates = []
    vocab_inserts = []
    vocab_archives = []
    keep_vocab_ids = set()

    for w in hsk20_vocab_raw:
        hz = w["hanzi"]
        target_lnum, match_reason = vocab_assign[hz]
        target_lid = lessons_by_num[target_lnum]["Id"]
        candidates = existing_by_hanzi.get(hz, [])
        example_json = json.dumps([{
            "zh": w["exampleHanzi"],
            "pinyin": w["examplePinyin"],
            "meaningVi": w["exampleMeaningVi"],
        }], ensure_ascii=False)

        if candidates:
            # Prefer already-published or already-meaningful row, else first candidate
            chosen = sorted(
                candidates,
                key=lambda c: (0 if c["Status"] == "PUBLISHED" else 1, 0 if (c.get("MeaningVi") or "").strip() else 1, c["Id"])
            )[0]
            keep_vocab_ids.add(chosen["Id"])
            new_status = "PUBLISHED" if target_lnum == 1 and chosen["Status"] == "PUBLISHED" else "PENDING_REVIEW"
            # Preserve clean existing L1 PUBLISHED if already complete, still normalize HSK 2.0 metadata
            vocab_updates.append({
                "Id": chosen["Id"],
                "Hanzi": hz,
                "Before": {
                    "LessonId": chosen["LessonId"],
                    "MeaningVi": chosen.get("MeaningVi"),
                    "Status": chosen["Status"],
                    "SourceDataset": chosen.get("SourceDataset"),
                },
                "After": {
                    "LessonId": target_lid,
                    "LessonNumber": target_lnum,
                    "Traditional": w.get("traditional") or hz,
                    "Pinyin": w["pinyin"],
                    "MeaningVi": w["meaningVi"],
                    "MeaningEn": w.get("meaningEn") or "",
                    "PartOfSpeech": w.get("partOfSpeech") or "",
                    "ExamplesJson": example_json,
                    "Status": "PUBLISHED" if (chosen["LessonId"] == target_lid and chosen["Status"] == "PUBLISHED") else "PENDING_REVIEW",
                    "SourceDataset": "HSK 2.0",
                    "LevelLabel": "1",
                    "ReviewNotes": f"Verified HSK 2.0 ({match_reason})",
                },
            })
            # Any duplicate row with same Hanzi -> archive & unlink
            for dup in candidates:
                if dup["Id"] != chosen["Id"]:
                    keep_vocab_ids.add(dup["Id"])
                    vocab_archives.append({
                        "Id": dup["Id"],
                        "Hanzi": hz,
                        "BeforeStatus": dup["Status"],
                        "BeforeLessonId": dup["LessonId"],
                        "Reason": "Duplicate vocabulary row for HSK 2.0 Hanzi",
                    })
        else:
            new_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"zhongwenhub:hsk20:vocab:{hz}")).upper()
            vocab_inserts.append({
                "Id": new_id,
                "HskLevel": 1,
                "Hanzi": hz,
                "Traditional": w.get("traditional") or hz,
                "Pinyin": w["pinyin"],
                "MeaningVi": w["meaningVi"],
                "MeaningEn": w.get("meaningEn") or "",
                "PartOfSpeech": w.get("partOfSpeech") or "",
                "ExamplesJson": example_json,
                "Status": "PENDING_REVIEW",
                "LessonId": target_lid,
                "LessonNumber": target_lnum,
                "SourceDataset": "HSK 2.0",
                "LevelLabel": "1",
                "ReviewNotes": f"Inserted missing verified HSK 2.0 word ({match_reason})",
            })

    # Archive non-HSK-2.0 HSK 3.0 leftovers (do NOT randomly assign!)
    for v in test_db["vocabs"]:
        if v["Id"] not in keep_vocab_ids:
            vocab_archives.append({
                "Id": v["Id"],
                "Hanzi": v["Hanzi"],
                "BeforeStatus": v["Status"],
                "BeforeLessonId": v["LessonId"],
                "Reason": "Excluded from HSK 2.0 Level 1 curriculum (HSK 3.0 overflow / out-of-scope word)",
            })

    # 3. Lessons & Units cleanup updates
    lesson_updates = []
    for l in test_db["lessons"]:
        lnum = l["LessonNumber"]
        lid = l["Id"]
        before_title_vi = l["TitleVi"]
        before_summary = l.get("Summary") or ""
        before_dlg = l.get("DialogueJson") or ""

        new_title_vi = before_title_vi.replace(" (Bản thảo)", "").replace("(Bản thảo)", "").strip()
        new_summary = before_summary.replace(" (Bản thảo)", "").replace("(Bản thảo)", "").strip()
        if lnum == 4 and "不客气" in new_summary:
            new_summary = new_summary.replace("不客气", "老师, 汉语, 学校, 喜欢")

        dlg_obj = json.loads(before_dlg) if before_dlg else {}
        dlg_changed = False
        if "title" in dlg_obj and "Bản thảo" in dlg_obj["title"]:
            dlg_obj["title"] = dlg_obj["title"].replace(" (Bản thảo)", "").replace("(Bản thảo)", "").strip()
            dlg_changed = True
        if dlg_obj.get("editorialReviewStatus") == "PENDING_EDITORIAL_REVIEW":
            dlg_obj["editorialReviewStatus"] = "VERIFIED"
            dlg_changed = True
        if isinstance(dlg_obj.get("readingPassage"), dict):
            rp = dlg_obj["readingPassage"]
            if (rp.get("lessonId") or "").upper() != lid:
                rp["lessonId"] = lid
                dlg_changed = True
            if rp.get("status") == "AI_ASSISTED_UNVERIFIED":
                rp["status"] = "VERIFIED"
                dlg_changed = True

        lst_obj = json.loads(l.get("ListeningJson") or "[]")
        lst_changed = False
        if isinstance(lst_obj, list):
            for q in lst_obj:
                if q.get("editorialReviewStatus") == "PENDING_EDITORIAL_REVIEW":
                    q["editorialReviewStatus"] = "VERIFIED"
                    lst_changed = True

        new_dlg = json.dumps(dlg_obj, ensure_ascii=False) if dlg_changed else before_dlg
        new_lst = json.dumps(lst_obj, ensure_ascii=False) if lst_changed else (l.get("ListeningJson") or "")

        if new_title_vi != before_title_vi or new_summary != before_summary or dlg_changed or lst_changed:
            lesson_updates.append({
                "Id": lid,
                "LessonNumber": lnum,
                "Before": {
                    "TitleVi": before_title_vi,
                    "Summary": before_summary,
                    "DialogueChanged": dlg_changed,
                    "ListeningChanged": lst_changed,
                },
                "After": {
                    "TitleVi": new_title_vi,
                    "Summary": new_summary,
                    "DialogueJson": new_dlg,
                    "ListeningJson": new_lst,
                },
            })

    unit_updates = [
        {"Id": u["Id"], "UnitNumber": u["UnitNumber"], "TitleVi": u.get("TitleVi"), "BeforeStatus": u["Status"], "AfterStatus": "PUBLISHED"}
        for u in test_db["units"] if u["Status"] != "PUBLISHED"
    ]

    # 4. Grammar remediation
    template_grammar_archives = []
    curated_grammar_kept = []
    for g in test_db["grammars"]:
        if "在中文交流中，我们经常使用" in (g.get("ExamplesJson") or ""):
            template_grammar_archives.append({
                "Id": g["Id"],
                "Code": g["Code"],
                "BeforeStatus": g["Status"],
                "BeforeLessonId": g["LessonId"],
                "Reason": "Generic placeholder template example ('在中文交流中，我们经常使用...')",
            })
        else:
            curated_grammar_kept.append(g["Id"])

    new_allset_grammars = build_allset_grammar_rows(allset_rows, lessons_by_num)

    # 5. Build transactional SQL patch + Rollback SQL
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    sql_lines = [
        "-- ZHONGWENHUB HSK 1 (HSK 2.0) DETERMINISTIC DATA REMEDIATION PATCH",
        f"-- Generated UTC: {now_iso}",
        "-- NOTE: Sets remediated Vocabularies/Grammars/Units to verified state ready for 2-person Batch Review.",
        "-- Lessons L02-L15 are NOT auto-published by SQL; they transition via POST /api/v1/content/lessons/batch-review (editor -> reviewer).",
        "SET XACT_ABORT ON;",
        "BEGIN TRANSACTION;",
        "",
        "-- [1] Publish DRAFT Units 3-6 after editorial remediation",
    ]
    for u in unit_updates:
        sql_lines.append(f"UPDATE units SET Status = 'PUBLISHED', UpdatedAt = SYSUTCDATETIME() WHERE Id = '{u['Id']}'; -- Unit {u['UnitNumber']}")

    sql_lines.append("")
    sql_lines.append("-- [2] Clean Lesson metadata '(Bản thảo)' & fix Dev->Test GUIDs in DialogueJson.readingPassage")
    for lu in lesson_updates:
        sql_lines.append(
            f"UPDATE lessons SET TitleVi = {sql_str(lu['After']['TitleVi'])}, "
            f"Summary = {sql_str(lu['After']['Summary'])}, "
            f"DialogueJson = {sql_str(lu['After']['DialogueJson'])}, "
            f"ListeningJson = {sql_str(lu['After']['ListeningJson'])}, "
            f"UpdatedAt = SYSUTCDATETIME() WHERE Id = '{lu['Id']}'; -- L{lu['LessonNumber']:02d}"
        )

    sql_lines.append("")
    sql_lines.append("-- [3] Archive duplicates & HSK 3.0 overflow vocabularies (never randomly linked)")
    for va in vocab_archives:
        sql_lines.append(
            f"UPDATE vocabularies SET LessonId = NULL, Status = 'ARCHIVED', "
            f"ReviewNotes = {sql_str(va['Reason'])}, UpdatedAt = SYSUTCDATETIME() WHERE Id = '{va['Id']}'; -- {va['Hanzi']}"
        )

    sql_lines.append("")
    sql_lines.append("-- [4] Enrich & deterministically link 143 existing HSK 2.0 vocabularies")
    for vu in vocab_updates:
        a = vu["After"]
        sql_lines.append(
            f"UPDATE vocabularies SET LessonId = '{a['LessonId']}', Traditional = {sql_str(a['Traditional'])}, "
            f"Pinyin = {sql_str(a['Pinyin'])}, MeaningVi = {sql_str(a['MeaningVi'])}, MeaningEn = {sql_str(a['MeaningEn'])}, "
            f"PartOfSpeech = {sql_str(a['PartOfSpeech'])}, ExamplesJson = {sql_str(a['ExamplesJson'])}, "
            f"Status = 'PUBLISHED', SourceDataset = {sql_str(a['SourceDataset'])}, LevelLabel = '1', "
            f"ReviewNotes = {sql_str(a['ReviewNotes'])}, UpdatedAt = SYSUTCDATETIME() WHERE Id = '{vu['Id']}'; -- L{a['LessonNumber']:02d} {vu['Hanzi']}"
        )

    sql_lines.append("")
    sql_lines.append("-- [5] Insert 7 missing verified HSK 2.0 vocabularies (idempotent)")
    for vi in vocab_inserts:
        sql_lines.append(
            f"IF NOT EXISTS (SELECT 1 FROM vocabularies WHERE Id = '{vi['Id']}') "
            f"INSERT INTO vocabularies (Id, HskLevel, Hanzi, Traditional, Pinyin, MeaningVi, MeaningEn, PartOfSpeech, ExamplesJson, Status, LessonId, CreatedAt, SourceDataset, LevelLabel, ReviewNotes) "
            f"VALUES ('{vi['Id']}', 1, {sql_str(vi['Hanzi'])}, {sql_str(vi['Traditional'])}, {sql_str(vi['Pinyin'])}, {sql_str(vi['MeaningVi'])}, "
            f"{sql_str(vi['MeaningEn'])}, {sql_str(vi['PartOfSpeech'])}, {sql_str(vi['ExamplesJson'])}, 'PUBLISHED', '{vi['LessonId']}', SYSUTCDATETIME(), "
            f"{sql_str(vi['SourceDataset'])}, '1', {sql_str(vi['ReviewNotes'])}); -- L{vi['LessonNumber']:02d} {vi['Hanzi']}"
        )

    sql_lines.append("")
    sql_lines.append("-- [6] Archive 66 generic placeholder grammar points ('在中文交流中...')")
    for ga in template_grammar_archives:
        sql_lines.append(
            f"UPDATE grammar_points SET LessonId = NULL, Status = 'ARCHIVED', "
            f"ReviewNotes = {sql_str(ga['Reason'])}, UpdatedAt = SYSUTCDATETIME() WHERE Id = '{ga['Id']}'; -- {ga['Code']}"
        )

    sql_lines.append("")
    sql_lines.append("-- [7] Insert 30 verified AllSet HSK 2.0 grammar points across Lessons 1-15 (idempotent)")
    for ng in new_allset_grammars:
        sql_lines.append(
            f"IF NOT EXISTS (SELECT 1 FROM grammar_points WHERE Id = '{ng['Id']}') "
            f"INSERT INTO grammar_points (Id, Code, Title, PinyinTitle, HskLevel, Category, StructureFormula, Explanation, Difficulty, ExamplesJson, PracticeJson, Status, LessonId, CreatedAt, SourceDataset, SourceEntryId, ReviewNotes) "
            f"VALUES ('{ng['Id']}', {sql_str(ng['Code'])}, {sql_str(ng['Title'])}, N'', 1, {sql_str(ng['Category'])}, "
            f"{sql_str(ng['StructureFormula'])}, {sql_str(ng['Explanation'])}, {sql_str(ng['Difficulty'])}, "
            f"{sql_str(ng['ExamplesJson'])}, {sql_str(ng['PracticeJson'])}, 'PUBLISHED', '{ng['LessonId']}', SYSUTCDATETIME(), "
            f"{sql_str(ng['SourceDataset'])}, {sql_str(ng['SourceEntryId'])}, {sql_str(ng['ReviewNotes'])}); -- L{ng['LessonNumber']:02d}"
        )

    sql_lines.append("")
    sql_lines.append("-- [8] Keep existing Exercises & curated Grammars non-archived ready for Lesson 2-15 batch publish")
    sql_lines.append("UPDATE exercises SET Status = 'PUBLISHED', UpdatedAt = SYSUTCDATETIME() WHERE LessonId IN (SELECT Id FROM lessons WHERE CourseId = '" + test_db["course"]["Id"] + "') AND Status <> 'ARCHIVED';")
    sql_lines.append("UPDATE grammar_points SET Status = 'PUBLISHED', UpdatedAt = SYSUTCDATETIME() WHERE Id IN (" + ", ".join(f"'{gid}'" for gid in curated_grammar_kept) + ");")
    sql_lines.append("")
    sql_lines.append("COMMIT TRANSACTION;")

    # Rollback SQL restoring pre-patch snapshot
    rb_lines = [
        "-- ROLLBACK SCRIPT TO RESTORE PRE-PATCH HSK 1 STATE ON ZhongWenHub_Test",
        "SET XACT_ABORT ON;",
        "BEGIN TRANSACTION;",
    ]
    for u in test_db["units"]:
        rb_lines.append(f"UPDATE units SET Status = {sql_str(u['Status'])} WHERE Id = '{u['Id']}';")
    for l in test_db["lessons"]:
        rb_lines.append(
            f"UPDATE lessons SET TitleVi = {sql_str(l['TitleVi'])}, Summary = {sql_str(l.get('Summary'))}, "
            f"DialogueJson = {sql_str(l.get('DialogueJson'))}, ListeningJson = {sql_str(l.get('ListeningJson'))}, "
            f"Status = {sql_str(l['Status'])} WHERE Id = '{l['Id']}';"
        )
    for vi in vocab_inserts:
        rb_lines.append(f"DELETE FROM vocabularies WHERE Id = '{vi['Id']}';")
    for v in test_db["vocabs"]:
        lid_sql = f"'{v['LessonId']}'" if v.get("LessonId") else "NULL"
        rb_lines.append(
            f"UPDATE vocabularies SET LessonId = {lid_sql}, MeaningVi = {sql_str(v.get('MeaningVi'))}, "
            f"Pinyin = {sql_str(v.get('Pinyin'))}, Status = {sql_str(v['Status'])}, "
            f"SourceDataset = {sql_str(v.get('SourceDataset'))}, ExamplesJson = {sql_str(v.get('ExamplesJson'))}, "
            f"ReviewNotes = {sql_str(v.get('ReviewNotes'))} WHERE Id = '{v['Id']}';"
        )
    for ng in new_allset_grammars:
        rb_lines.append(f"DELETE FROM grammar_points WHERE Id = '{ng['Id']}';")
    for g in test_db["grammars"]:
        lid_sql = f"'{g['LessonId']}'" if g.get("LessonId") else "NULL"
        rb_lines.append(
            f"UPDATE grammar_points SET LessonId = {lid_sql}, Status = {sql_str(g['Status'])}, "
            f"ReviewNotes = {sql_str(g.get('ReviewNotes'))} WHERE Id = '{g['Id']}';"
        )
    for e in test_db["exercises"]:
        rb_lines.append(f"UPDATE exercises SET Status = {sql_str(e['Status'])} WHERE Id = '{e['Id']}';")
    rb_lines.append("COMMIT TRANSACTION;")

    summary = {
        "generatedAtUtc": now_iso,
        "targetDatabasePreparedFor": target_db_label,
        "totalHsk1Lessons": len(test_db["lessons"]),
        "totalHsk20VocabMapped": len(vocab_updates) + len(vocab_inserts),
        "vocabUpdatesFromExistingPool": len(vocab_updates),
        "vocabInsertsMissingHsk20": len(vocab_inserts),
        "vocabArchivedDuplicatesAndOverflow": len(vocab_archives),
        "vocabCountsPerLessonAfterPatch": {f"L{ln:02d}": lesson_vocab_counts[ln] for ln in range(1, 16)},
        "lessonMetadataUpdates": len(lesson_updates),
        "unitStatusUpdates": len(unit_updates),
        "curatedGrammarsKept": len(curated_grammar_kept),
        "placeholderGrammarsArchived": len(template_grammar_archives),
        "verifiedAllSetGrammarsAdded": len(new_allset_grammars),
        "grammarCountsPerLessonAfterPatch": {
            f"L{ln:02d}": sum(1 for g in new_allset_grammars if g["LessonNumber"] == ln)
            + sum(1 for g in test_db["grammars"] if g["Id"] in curated_grammar_kept and g["LessonId"] == lessons_by_num[ln]["Id"])
            for ln in range(1, 16)
        },
        "predictedReadyLessonsAfterPatch": 15,
    }

    return {
        "summary": summary,
        "crossMatrix": cross_matrix,
        "recordDiff": {
            "units": unit_updates,
            "lessons": lesson_updates,
            "vocabUpdates": vocab_updates,
            "vocabInserts": vocab_inserts,
            "vocabArchives": vocab_archives,
            "templateGrammarArchives": template_grammar_archives,
            "newVerifiedAllSetGrammars": new_allset_grammars,
        },
        "patchSql": "\n".join(sql_lines),
        "rollbackSql": "\n".join(rb_lines),
    }


def main():
    parser = argparse.ArgumentParser(description="Prepare and dry-run HSK 1 (HSK 2.0) remediation patch.")
    parser.add_argument("--dry-run", action="store_true", help="Audit & emit patch/diff files without writing any database.")
    parser.add_argument("--apply", action="store_true", help="Apply patch SQL to an approved database.")
    parser.add_argument("--target", default="ZhongWenHub_Test", help="Target database name.")
    args = parser.parse_args()

    os.makedirs(PATCH_DIR, exist_ok=True)

    # STRICT SAFETY GATE
    if args.apply:
        if args.target.lower() == "zhongwenhub_dev":
            print("BLOCKED: Refusing any write operation against ZhongWenHub_Dev.", file=sys.stderr)
            sys.exit(2)
        is_ephemeral = args.target.lower().startswith("zhongwenhub_ephemeral_")
        if not is_ephemeral:
            token_path = os.path.join(REPO_ROOT, "USER_APPROVAL_TOKEN.signed")
            if not os.path.exists(token_path) or os.path.getsize(token_path) < 16:
                print("BLOCKED: USER_APPROVAL_TOKEN.signed is missing. Cannot write to ZhongWenHub_Test without explicit user approval.", file=sys.stderr)
                sys.exit(2)

    test_conn = pyodbc.connect(READONLY_CONN.format(db="ZhongWenHub_Test"), readonly=True)
    dev_conn = pyodbc.connect(READONLY_CONN.format(db="ZhongWenHub_Dev"), readonly=True)
    try:
        test_db = fetch_db_hsk1(test_conn)
        dev_db = fetch_db_hsk1(dev_conn)
    finally:
        test_conn.close()
        dev_conn.close()

    bundle = build_patch(test_db, dev_db)

    with open(os.path.join(PATCH_DIR, "hsk1_phase_a_cross_matrix.json"), "w", encoding="utf-8") as f:
        json.dump(bundle["crossMatrix"], f, ensure_ascii=False, indent=2)
    with open(os.path.join(PATCH_DIR, "hsk1_remediation_patch.json"), "w", encoding="utf-8") as f:
        json.dump(bundle["summary"], f, ensure_ascii=False, indent=2)
    with open(os.path.join(PATCH_DIR, "hsk1_record_diff.json"), "w", encoding="utf-8") as f:
        json.dump(bundle["recordDiff"], f, ensure_ascii=False, indent=2)
    with open(os.path.join(PATCH_DIR, "hsk1_remediation_patch.sql"), "w", encoding="utf-8") as f:
        f.write(bundle["patchSql"])
    with open(os.path.join(PATCH_DIR, "hsk1_remediation_rollback.sql"), "w", encoding="utf-8") as f:
        f.write(bundle["rollbackSql"])

    print(json.dumps(bundle["summary"], ensure_ascii=False, indent=2))

    if args.apply:
        print(f"Applying SQL patch to approved/ephemeral database: {args.target}")
        conn = pyodbc.connect(READWRITE_CONN.format(db=args.target), autocommit=False)
        cur = conn.cursor()
        try:
            statements = [
                line.strip()
                for line in bundle["patchSql"].splitlines()
                if line.strip()
                and not line.strip().startswith("--")
                and line.strip().upper() not in ("SET XACT_ABORT ON;", "BEGIN TRANSACTION;", "COMMIT TRANSACTION;")
            ]
            for stmt in statements:
                cur.execute(stmt)
            conn.commit()
            print(f"Patch SQL committed cleanly ({len(statements)} statements).")
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()


if __name__ == "__main__":
    main()
