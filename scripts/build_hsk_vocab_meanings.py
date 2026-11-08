import os
import sys
import re
import pyodbc

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"D:\ZhongWenHub"
SCRATCH_DIR = r"C:\Users\nguyen\.gemini\antigravity\brain\cd186fce-5c0e-4fe7-82e2-2c0cf85214c4\scratch"
CVDICT_PATH = os.path.join(SCRATCH_DIR, "CVDICT.u8")

# Specialized Curated Meanings for Known Difficult / Polysemous / Homographic Words
EXPLICIT_CURATED_MEANINGS = {
    # 2 Missing Words
    ("新媒体", "xīnméitǐ", ""): "Truyền thông mới, phương tiện truyền thông mới",
    ("新能源", "xīnnéngyuán", ""): "Năng lượng mới",
    
    # HSK 2 Homographs & Common Words
    ("花", "huā", "1"): "tiêu, tốn (tiền bạc, thời gian)",
    ("花", "huā", "2"): "hoa, bông hoa",
    ("别", "bié", "1"): "đừng, chớ",
    ("别", "bié", "2"): "khác; chia tay; phân biệt",
    ("打", "dǎ", "1"): "đánh, đập; gọi (điện thoại); chơi (thể thao)",
    ("万", "wàn", ""): "mười nghìn, vạn",
    ("路", "lù", ""): "đường, tuyến đường; hành trình",
    ("得", "de", "1"): "được (trợ từ kết cấu biểu thị trình độ, khả năng)",
    ("得", "děi", "2"): "phải, cần phải",
    ("得", "dé", ""): "đạt được, nhận được",
    ("等", "děng", "1"): "chờ, đợi",
    ("等", "děng", "2"): "vân vân, v.v.",
    ("点", "diǎn", "1"): "giờ, một chút, dấu chấm",
    ("点", "diǎn", "2"): "gọi món; châm lửa; điểm danh",
    ("好", "hǎo", "1"): "tốt, đẹp, khỏe, được",
    ("好", "hào", "2"): "thích, ham chuộng",
    ("过", "guò", "1"): "qua, đi qua, trải qua, đón (tết, sinh nhật)",
    ("过", "guo", "2"): "từng (trợ từ động thái chỉ kinh nghiệm)",
    ("回", "huí", "1"): "về, quay lại; trả lời",
    ("回", "huí", "2"): "lần, hồi (lượng từ số lần hành động)",
    ("白", "bái", "1"): "màu trắng",
    ("白", "bái", "2"): "không công, vô ích, làm không được gì",
    ("给", "gěi", ""): "cho, đưa cho; để cho",
    ("给", "jǐ", ""): "cung cấp, chu cấp",
    ("干", "gān", "1"): "khô, cạn",
    ("干", "gàn", "2"): "làm (việc), cáng đáng",
    ("长", "cháng", "1"): "dài",
    ("长", "zhǎng", "2"): "lớn lên, trưởng thành; đứng đầu, trưởng",
    ("行", "xíng", "1"): "được, có thể; đi lại, hành động",
    ("行", "háng", "2"): "hàng, lối; ngành nghề, ngân hàng",
    ("看", "kàn", "1"): "xem, nhìn, đọc, thăm",
    ("看", "kān", "2"): "trông nom, coi sóc, canh giữ",
    ("着", "zhe", "1"): "đang (trợ từ biểu thị sự tiếp diễn của động tác)",
    ("着", "zháo", "2"): "chạm vào, trúng, dính",
    ("分", "fēn", "1"): "chia, phân chia; phút; điểm",
    ("分", "fèn", "2"): "phần, thành phần, phận",
    ("间", "jiān", "1"): "khoảng, giữa, gian (phòng)",
    ("间", "jiàn", "2"): "khoảng cách; gián cách, ngờ vực",
    ("重", "zhòng", "1"): "nặng, quan trọng, nghiêm trọng",
    ("重", "chóng", "2"): "lặp lại, trùng lặp; tầng, lớp",
    ("还", "hái", "1"): "còn, vẫn còn, hơn nữa",
    ("还", "huán", "2"): "trả lại, quay về",
    ("乐", "lè", "1"): "vui vẻ, vui mừng",
    ("乐", "yuè", "2"): "âm nhạc, nhạc",
    ("少", "shǎo", "1"): "ít, thiếu",
    ("少", "shào", "2"): "thiếu niên, trẻ tuổi",
    ("教", "jiāo", "1"): "dạy, giảng dạy",
    ("教", "jiào", "2"): "giáo dục, tôn giáo",
    ("朝", "cháo", "1"): "hướng về, triều đại",
    ("朝", "zhāo", "2"): "sớm mai, buổi sáng",
    ("差", "chà", "1"): "kém, tồi, thiếu",
    ("差", "chāi", "2"): "công tác, sai phái",
    ("差", "chā", ""): "sai biệt, chênh lệch",
    ("背", "bēi", "1"): "cõng, vác, đeo trên lưng",
    ("背", "bèi", "2"): "lưng, phía sau; học thuộc lòng",
    ("便", "biàn", "1"): "thuận tiện, tiện lợi; thì, liền",
    ("便", "pián", "2"): "tiện nghi, rẻ (trong 便宜)",
    ("只", "zhǐ", "1"): "chỉ, chỉ có",
    ("只", "zhī", "2"): "con, chiếc, cái (lượng từ)",
    ("倒", "dǎo", "1"): "ngã, đổ, sụp đổ",
    ("倒", "dào", "2"): "rót (nước), lùi (xe); ngược lại",
    ("数", "shǔ", "1"): "đếm, tính toán",
    ("数", "shù", "2"): "con số, số lượng",
    ("假", "jiǎ", "1"): "giả, nhân tạo; giả sử",
    ("假", "jià", "2"): "ngày nghỉ, kỳ nghỉ",
    ("发", "fā", "1"): "phát, gửi đi; phát triển, phát sinh",
    ("发", "fà", "2"): "tóc, mái tóc",
    ("结", "jiē", "1"): "kết trái, đơm hoa",
    ("结", "jié", "2"): "kết thúc; thắt nút; kết cấu",
    ("累", "lèi", "1"): "mệt mỏi, mệt nhọc",
    ("累", "lěi", "2"): "tích lũy, dồn lại",
    ("落", "luò", "1"): "rơi, rụng; hạ xuống",
    ("落", "là", "2"): "bỏ quên, sót lại",
    ("没", "méi", "1"): "không có, chưa",
    ("没", "mò", "2"): "chìm ngập, tịch thu",
    ("难", "nán", "1"): "khó, khó khăn",
    ("难", "nàn", "2"): "nạn, tai nạn, hoạn nạn",
    ("便", "biàn", ""): "tiện lợi; thì, là",
    ("奇", "qí", "1"): "kỳ lạ, ngạc nhiên",
    ("奇", "jī", "2"): "số lẻ, cơ số",
    ("散", "sǎn", "1"): "rời rạc, tản mạn",
    ("散", "sàn", "2"): "giải tán, tan ra, phân phát",
    ("省", "shěng", "1"): "tỉnh (đơn vị hành chính); tiết kiệm",
    ("省", "xǐng", "2"): "tỉnh ngộ, phản tỉnh; thăm viếng",
    ("应", "yīng", "1"): "nên, cần phải",
    ("应", "yìng", "2"): "đáp lại, ứng phó, thích ứng",
    ("传", "chuán", "1"): "truyền bá, truyền đạt, lan truyền",
    ("传", "zhuàn", "2"): "truyện, tiểu sử, truyền ký",
    ("转", "zhuǎn", "1"): "chuyển hướng, biến chuyển",
    ("转", "zhuàn", "2"): "quay vòng, xoay tròn",
    ("喝", "hē", "1"): "uống",
    ("喝", "hè", "2"): "quát to, hò hét"
}

def clean_cvdict_gloss(raw_gloss):
    if not raw_gloss:
        return ""
    # split by / or ;
    parts = re.split(r"[/;]", raw_gloss)
    cleaned = []
    
    noise_patterns = [
        r"^họ\s*\[.+\]$",
        r"^biến thể\b",
        r"^dùng trong\b",
        r"^xem thêm\b",
        r"^viết tắt của\b",
        r"^cũng đọc là\b",
        r"^LT:\s*.+$",
        r"^CL:\s*.+$"
    ]
    
    for p in parts:
        p = p.strip()
        if not p:
            continue
        is_noise = False
        for np in noise_patterns:
            if re.search(np, p, re.IGNORECASE):
                is_noise = True
                break
        if not is_noise:
            # clean internal notes like (khẩu ngữ), (văn học) etc if they overwhelm
            p_clean = re.sub(r"\[[A-Za-z0-9\s]+\]", "", p).strip()
            if p_clean and p_clean not in cleaned:
                cleaned.append(p_clean)
                
    if not cleaned:
        # If all were flagged as noise (e.g. only had 'họ [Lu4]'), salvage the first non-empty
        salvaged = [p.strip() for p in parts if p.strip()]
        return salvaged[0] if salvaged else raw_gloss
        
    # Return at most 3-4 clean meanings separated by semicolon
    return "; ".join(cleaned[:3])

def run_test():
    print("Testing clean_cvdict_gloss...")
    samples = [
        "họ [Lu4]/đường (LT:條|条[tiao2])/hành trình/tuyến/đường (xe buýt,...)/loại; kiểu",
        "họ [Hua1]/hoa/bông/LT:朵[duo3],支[zhi1],束[shu4],把[ba3],盆[pen2],簇[cu4]/hoa văn/tiêu (tiền, thời gian)",
        "dùng trong 万俟[Mo4 qi2]/mười nghìn/một số lượng lớn",
        "thường xuyên; liên tục; đều đặn; thường; ngày thường; hằng ngày; mỗi ngày"
    ]
    for s in samples:
        print(f"RAW:  {s}")
        print(f"CLEAN: {clean_cvdict_gloss(s)}\n")

if __name__ == "__main__":
    run_test()
