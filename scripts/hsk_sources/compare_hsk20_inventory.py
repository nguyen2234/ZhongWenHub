import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_INV_FILE = os.path.join(BASE_DIR, "data", "hsk30", "reference", "current_db_inventory.json")

# Canonical HSK Standard Course 2.0 Lesson Titles (Hanzi, Pinyin, English/Vietnamese Topic)
HSK20_CANONICAL = {
    "HSK1": [
        {"num": 1, "title": "你好", "pinyin": "Nǐ hǎo", "meaning": "Chào bạn", "theme": "Chào hỏi & Làm quen"},
        {"num": 2, "title": "谢谢你", "pinyin": "Xièxie nǐ", "meaning": "Cảm ơn bạn", "theme": "Cảm ơn & Xin lỗi"},
        {"num": 3, "title": "你叫什么名字", "pinyin": "Nǐ jiào shénme míngzi", "meaning": "Bạn tên là gì", "theme": "Hỏi tên & Quốc tịch"},
        {"num": 4, "title": "她是我的汉语老师", "pinyin": "Tā shì wǒ de Hànyǔ lǎoshī", "meaning": "Cô ấy là giáo viên tiếng Trung của tôi", "theme": "Xưng hô & Giới thiệu người"},
        {"num": 5, "title": "她女儿今年二十岁", "pinyin": "Tā nǚ'ér jīnnián èrshí suì", "meaning": "Con gái cô ấy năm nay 20 tuổi", "theme": "Tuổi tác & Gia đình"},
        {"num": 6, "title": "我会说汉语", "pinyin": "Wǒ huì shuō Hànyǔ", "meaning": "Tôi biết nói tiếng Trung", "theme": "Kỹ năng & Món ăn"},
        {"num": 7, "title": "今天几号", "pinyin": "Jīntiān jǐ hào", "meaning": "Hôm nay ngày mấy", "theme": "Ngày tháng & Thứ"},
        {"num": 8, "title": "我想喝茶", "pinyin": "Wǒ xiǎng hē chá", "meaning": "Tôi muốn uống trà", "theme": "Ăn uống & Mua sắm (Giá cả)"},
        {"num": 9, "title": "你儿子在哪儿工作", "pinyin": "Nǐ érzi zài nǎr gōngzuò", "meaning": "Con trai bạn làm việc ở đâu", "theme": "Vị trí & Nghề nghiệp"},
        {"num": 10, "title": "我能坐这儿吗", "pinyin": "Wǒ néng zuò zhèr ma", "meaning": "Tôi có thể ngồi ở đây không", "theme": "Phương vị & Đề nghị"},
        {"num": 11, "title": "现在几点", "pinyin": "Xiànzài jǐ diǎn", "meaning": "Bây giờ là mấy giờ", "theme": "Thời gian & Lịch trình"},
        {"num": 12, "title": "明天天气怎么样", "pinyin": "Míngtiān tiānqì zěnmeyàng", "meaning": "Thời tiết ngày mai thế nào", "theme": "Thời tiết & Sức khỏe"},
        {"num": 13, "title": "他在学做中国菜呢", "pinyin": "Tā zài xué zuò Zhōngguó cài ne", "meaning": "Anh ấy đang học nấu món Trung Quốc", "theme": "Hành động đang tiếp diễn"},
        {"num": 14, "title": "她买了不少衣服", "pinyin": "Tā mǎi le bù shǎo yīfu", "meaning": "Cô ấy mua không ít quần áo", "theme": "Mua sắm & Trợ từ 了"},
        {"num": 15, "title": "我是坐飞机来的", "pinyin": "Wǒ shì zuò fēijī lái de", "meaning": "Tôi đi máy bay đến", "theme": "Phương tiện & Kết cấu 是...的"}
    ],
    "HSK2": [
        {"num": 1, "title": "九月去北京旅游最好", "pinyin": "Jiǔyuè qù Běijīng lǚyóu zuì hǎo", "meaning": "Đi Bắc Kinh du lịch vào tháng 9 là tốt nhất", "theme": "Du lịch & Mùa"},
        {"num": 2, "title": "我每天六点起床", "pinyin": "Wǒ měitiān liù diǎn qǐchuáng", "meaning": "Tôi thức dậy lúc 6 giờ mỗi ngày", "theme": "Sinh hoạt hằng ngày & Thể thao"},
        {"num": 3, "title": "左边那个红色的是我的", "pinyin": "Zuǒbian nàge hóngsè de shì wǒ de", "meaning": "Cái màu đỏ bên trái là của tôi", "theme": "Màu sắc & Phương hướng"},
        {"num": 4, "title": "这个工作是他帮我介绍的", "pinyin": "Zhège gōngzuò shì tā bāng wǒ jièshào de", "meaning": "Công việc này là anh ấy giới thiệu cho tôi", "theme": "Công việc & Giúp đỡ"},
        {"num": 5, "title": "就买这件吧", "pinyin": "Jiù mǎi zhè jiàn ba", "meaning": "Mua chiếc này đi", "theme": "Mua sắm quần áo & Lựa chọn"},
        {"num": 6, "title": "你怎么不吃了", "pinyin": "Nǐ zěnme bù chī le", "meaning": "Sao bạn không ăn nữa", "theme": "Ăn uống & Sức khỏe"},
        {"num": 7, "title": "你家离公司远吗", "pinyin": "Nǐ jiā lí gōngsī yuǎn ma", "meaning": "Nhà bạn cách công ty xa không", "theme": "Khoảng cách & Phương tiện"},
        {"num": 8, "title": "让我想想再告诉你", "pinyin": "Ràng wǒ xiǎngxiang zài gàosu nǐ", "meaning": "Để tôi nghĩ đã rồi nói cho bạn", "theme": "Suy nghĩ & Kế hoạch"},
        {"num": 9, "title": "题太多，我没做完", "pinyin": "Tí tài duō, wǒ méi zuò wán", "meaning": "Đề nhiều quá, tôi chưa làm xong", "theme": "Bổ ngữ kết quả & Thi cử"},
        {"num": 10, "title": "别找了，手机在桌子上呢", "pinyin": "Bié zhǎo le, shǒujī zài zhuōzi shang ne", "meaning": "Đừng tìm nữa, điện thoại ở trên bàn kìa", "theme": "Tìm đồ & Phó từ 别"},
        {"num": 11, "title": "他比我大三岁", "pinyin": "Tā bǐ wǒ dà sān suì", "meaning": "Anh ấy lớn hơn tôi ba tuổi", "theme": "Câu so sánh 比"},
        {"num": 12, "title": "你穿得太少了", "pinyin": "Nǐ chuān de tài shǎo le", "meaning": "Bạn mặc ít quá", "theme": "Bổ ngữ trạng thái & Thời tiết"},
        {"num": 13, "title": "门开着呢", "pinyin": "Mén kāizhe ne", "meaning": "Cửa đang mở kìa", "theme": "Trợ từ động thái 着"},
        {"num": 14, "title": "你看过那个电影吗", "pinyin": "Nǐ kàn guo nàge diànyǐng ma", "meaning": "Bạn đã từng xem bộ phim đó chưa", "theme": "Trợ từ động thái 过 & Kinh nghiệm"},
        {"num": 15, "title": "新年就要到了", "pinyin": "Xīnnián jiù yào dào le", "meaning": "Năm mới sắp đến rồi", "theme": "Thời gian tương lai 快要...了"}
    ],
    "HSK3": [
        {"num": 1, "title": "周末你有什么打算", "pinyin": "Zhōumò nǐ yǒu shénme dǎsuàn", "meaning": "Cuối tuần bạn có kế hoạch gì", "theme": "Kế hoạch cuối tuần"},
        {"num": 2, "title": "他什么时候回来", "pinyin": "Tā shénme shíhou huílái", "meaning": "Khi nào anh ấy về", "theme": "Bổ ngữ xu hướng đơn"},
        {"num": 3, "title": "桌子上放着很多饮料", "pinyin": "Zhuōzi shang fàngzhe hěn duō yǐnliào", "meaning": "Trên bàn có đặt nhiều đồ uống", "theme": "Câu tồn tại & Trợ từ 着"},
        {"num": 4, "title": "她总是笑着也跟客人说话", "pinyin": "Tā zǒngshì xiàozhe yě gēn kèrén shuōhuà", "meaning": "Cô ấy luôn mỉm cười khi nói chuyện với khách", "theme": "Hai hành động đồng thời"},
        {"num": 5, "title": "我最近越来越胖了", "pinyin": "Wǒ zuìjìn yuè lái yuè pàng le", "meaning": "Gần đây tôi ngày càng béo ra", "theme": "Cấu trúc 越来越"},
        {"num": 6, "title": "怎么突然找不到了", "pinyin": "Zěnme tūrán zhǎo bu dào le", "meaning": "Sao tự nhiên không tìm thấy nữa", "theme": "Bổ ngữ khả năng"},
        {"num": 7, "title": "我跟你一起去吧", "pinyin": "Wǒ gēn nǐ yìqǐ qù ba", "meaning": "Tôi đi cùng bạn nhé", "theme": "Đi cùng & Bổ ngữ số lượng"},
        {"num": 8, "title": "你去哪儿我就去哪儿", "pinyin": "Nǐ qù nǎr wǒ jiù qù nǎr", "meaning": "Bạn đi đâu tôi đi đó", "theme": "Đại từ nghi vấn phiếm chỉ"},
        {"num": 9, "title": "她的汉语说得跟中国人一样好", "pinyin": "Tā de Hànyǔ shuō de gēn Zhōngguórén yíyàng hǎo", "meaning": "Tiếng Trung của cô ấy nói hay như người Trung Quốc", "theme": "So sánh 一样"},
        {"num": 10, "title": "数学比历史难多了", "pinyin": "Shùxué bǐ lìshǐ nán duō le", "meaning": "Toán khó hơn lịch sử nhiều", "theme": "So sánh hơn mức độ cao"},
        {"num": 11, "title": "别忘了把空调关了", "pinyin": "Bié wàng le bǎ kōngtiáo guān le", "meaning": "Đừng quên tắt điều hòa", "theme": "Câu chữ 把 (1)"},
        {"num": 12, "title": "把重要的东西放在我这儿吧", "pinyin": "Bǎ zhòngyào de dōngxi fàng zài wǒ zhèr ba", "meaning": "Để những đồ quan trọng ở chỗ tôi đi", "theme": "Câu chữ 把 (2)"},
        {"num": 13, "title": "我是走回来的", "pinyin": "Wǒ shì zǒu huílái de", "meaning": "Tôi đi bộ về", "theme": "Bổ ngữ xu hướng kép"},
        {"num": 14, "title": "你把水果拿过来", "pinyin": "Nǐ bǎ shuǐguǒ ná guòlái", "meaning": "Bạn mang hoa quả qua đây", "theme": "Câu chữ 把 kết hợp bổ ngữ xu hướng"},
        {"num": 15, "title": "其他都没什么问题", "pinyin": "Qítā dōu méi shénme wèntí", "meaning": "Những thứ khác đều không có vấn đề gì", "theme": "Phủ định phiếm chỉ"},
        {"num": 16, "title": "我现在累得下班就想睡觉", "pinyin": "Wǒ xiànzài lèi de xiàbān jiù xiǎng shuìjiào", "meaning": "Bây giờ tôi mệt đến mức tan làm chỉ muốn ngủ", "theme": "Bổ ngữ trạng thái mức độ"},
        {"num": 17, "title": "谁都有办法看好这种病", "pinyin": "Shéi dōu yǒu bànfǎ kànhǎo zhè zhǒng bìng", "meaning": "Ai cũng có cách chữa khỏi bệnh này", "theme": "Khẳng định toàn thể"},
        {"num": 18, "title": "我相信他们会同意的", "pinyin": "Wǒ xiāngxìn tāmen huì tóngyì de", "meaning": "Tôi tin họ sẽ đồng ý", "theme": "Khẳng định với 的"},
        {"num": 19, "title": "你没看出来吗", "pinyin": "Nǐ méi kàn chūlái ma", "meaning": "Bạn không nhìn ra à", "theme": "Bổ ngữ xu hướng trừu tượng"},
        {"num": 20, "title": "我被他影响了", "pinyin": "Wǒ bèi tā yǐngxiǎng le", "meaning": "Tôi bị anh ấy ảnh hưởng", "theme": "Câu chữ 被 (Bị động)"}
    ],
    "HSK4": [
        # 4A: Lessons 1-10
        {"num": 1, "title": "简单的爱情", "pinyin": "Jiǎndān de àiqíng", "meaning": "Tình yêu giản đơn", "book": "4A", "theme": "Tình yêu & Hôn nhân"},
        {"num": 2, "title": "真正的朋友", "pinyin": "Zhēnzhèng de péngyou", "meaning": "Tình bạn đích thực", "book": "4A", "theme": "Bạn bè & Sự tin tưởng"},
        {"num": 3, "title": "经理对我印象很好", "pinyin": "Jīnglǐ duì wǒ yìnxiàng hěn hǎo", "meaning": "Giám đốc có ấn tượng tốt về tôi", "book": "4A", "theme": "Công sở & Phỏng vấn"},
        {"num": 4, "title": "不要太着急赚钱", "pinyin": "Bú yào tài zháojí zhuànqián", "meaning": "Đừng quá vội vàng kiếm tiền", "book": "4A", "theme": "Sự nghiệp & Kinh nghiệm"},
        {"num": 5, "title": "只买对的，不买贵的", "pinyin": "Zhǐ mǎi duì de, bù mǎi guì de", "meaning": "Chỉ mua cái đúng, không mua cái đắt", "book": "4A", "theme": "Mua sắm & Tiêu dùng"},
        {"num": 6, "title": "一分钱一分货", "pinyin": "Yì fēn qián yì fēn huò", "meaning": "Tiền nào của nấy", "book": "4A", "theme": "Giá cả & Chất lượng"},
        {"num": 7, "title": "最好的医生是自己", "pinyin": "Zuì hǎo de yīshēng shì zìjǐ", "meaning": "Bác sĩ tốt nhất là chính mình", "book": "4A", "theme": "Sức khỏe & Lối sống"},
        {"num": 8, "title": "生活中不缺少美", "pinyin": "Shēnghuó zhōng bù quēshǎo měi", "meaning": "Cuộc sống không thiếu cái đẹp", "book": "4A", "theme": "Thái độ sống & Tâm lý"},
        {"num": 9, "title": "阳光总在风雨后", "pinyin": "Yángguāng zǒng zài fēngyǔ hòu", "meaning": "Nắng luôn sau cơn mưa", "book": "4A", "theme": "Nỗ lực & Vượt qua khó khăn"},
        {"num": 10, "title": "幸福的标准", "pinyin": "Xìngfú de biāozhǔn", "meaning": "Tiêu chuẩn của hạnh phúc", "book": "4A", "theme": "Quan niệm về hạnh phúc"},
        # 4B: Lessons 11-20
        {"num": 11, "title": "读书好，读好书，好读书", "pinyin": "Dúshū hǎo, dú hǎo shū, hào dúshū", "meaning": "Đọc sách tốt, đọc sách hay, thích đọc sách", "book": "4B", "theme": "Thói quen đọc sách"},
        {"num": 12, "title": "用心发现世界", "pinyin": "Yòngxīn fāxiàn shìjiè", "meaning": "Dùng trái tim khám phá thế giới", "book": "4B", "theme": "Khám phá & Trải nghiệm"},
        {"num": 13, "title": "喝着茶看京剧", "pinyin": "Hēzhe chá kàn jīngjù", "meaning": "Vừa uống trà vừa xem Kinh kịch", "book": "4B", "theme": "Văn hóa & Nghệ thuật truyền thống"},
        {"num": 14, "title": "保护地球母亲", "pinyin": "Bǎohù dìqiú mǔqīn", "meaning": "Bảo vệ Mẹ Trái Đất", "book": "4B", "theme": "Môi trường & Thiên nhiên"},
        {"num": 15, "title": "教育是个大问题", "pinyin": "Jiàoyù shì gè dà wèntí", "meaning": "Giáo dục là một vấn đề lớn", "book": "4B", "theme": "Giáo dục con cái & Trường học"},
        {"num": 16, "title": "文化的碰撞", "pinyin": "Wénhuà de pèngzhuàng", "meaning": "Sự giao thoa văn hóa", "book": "4B", "theme": "Giao lưu văn hóa & Phong tục"},
        {"num": 17, "title": "人与自然", "pinyin": "Rén yǔ zìrán", "meaning": "Con người và tự nhiên", "book": "4B", "theme": "Môi trường sinh thái & Động vật"},
        {"num": 18, "title": "科技与生活", "pinyin": "Kējì yǔ shēnghuó", "meaning": "Khoa học công nghệ và đời sống", "book": "4B", "theme": "Công nghệ & Thay đổi đời sống"},
        {"num": 19, "title": "味道与记忆", "pinyin": "Wèidào yǔ jìyì", "meaning": "Hương vị và ký ức", "book": "4B", "theme": "Ẩm thực & Ký ức tuổi thơ"},
        {"num": 20, "title": "走近中国", "pinyin": "Zǒujìn Zhōngguó", "meaning": "Tiếp cận đất nước Trung Hoa", "book": "4B", "theme": "Đất nước & Con người Trung Quốc"}
    ]
}

def compare():
    with open(DB_INV_FILE, "r", encoding="utf-8") as f:
        inv = json.load(f)

    report_lines = []
    stats = {"MATCHED": 0, "PARTIAL_MATCH": 0, "MISMATCH": 0, "NEEDS_REVIEW": 0}
    detailed_comparisons = {}

    for lvl_code, canonical_lessons in HSK20_CANONICAL.items():
        db_lvl = inv["levels"].get(lvl_code, {})
        db_lessons = {l["lesson_number"]: l for l in db_lvl.get("lessons", [])}
        detailed_comparisons[lvl_code] = []

        for c_les in canonical_lessons:
            num = c_les["num"]
            db_les = db_lessons.get(num)
            
            if not db_les:
                status = "SOURCE_MISSING"
                diff = "Lesson not in DB"
            else:
                db_title = db_les.get("title_zh", "").strip()
                canonical_title = c_les["title"].strip()
                
                # Title match check
                if db_title == canonical_title:
                    status = "MATCHED"
                    diff = f"Exact match: '{db_title}'"
                elif canonical_title in db_title or db_title in canonical_title:
                    status = "PARTIAL_MATCH"
                    diff = f"Partial match: DB='{db_title}' vs Standard='{canonical_title}'"
                else:
                    status = "NEEDS_REVIEW"
                    diff = f"Different theme/title: DB='{db_title}' vs Standard='{canonical_title}'"

            stats[status] = stats.get(status, 0) + 1
            detailed_comparisons[lvl_code].append({
                "lesson_number": num,
                "canonical_title": c_les["title"],
                "canonical_meaning": c_les["meaning"],
                "canonical_theme": c_les["theme"],
                "book": c_les.get("book", ""),
                "db_title": db_les.get("title_zh") if db_les else None,
                "db_meaning": db_les.get("title_vi") if db_les else None,
                "db_vocab_count": db_les.get("vocab_count") if db_les else 0,
                "db_grammar_count": db_les.get("grammar_count") if db_les else 0,
                "db_exercise_count": db_les.get("exercise_count") if db_les else 0,
                "match_status": status,
                "difference": diff
            })

    out_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hsk20_lesson_comparison.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump({"summary": stats, "levels": detailed_comparisons}, f, indent=2, ensure_ascii=False)

    print(f"Comparison completed. Stats: {stats}")
    print(f"Saved to: {out_file}")

if __name__ == "__main__":
    compare()
