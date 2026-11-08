import os
import sys
import json
import re
import pyodbc

sys.stdout.reconfigure(encoding='utf-8')

# Category translation helpers
GRAMMAR_TYPE_VI = {
    '语素': 'Ngữ tố',
    '词类': 'Từ loại',
    '短语': 'Cụm từ',
    '句子成分': 'Thành phần câu',
    '句子的类型': 'Loại câu',
    '动作的态': 'Trạng thái hành động',
    '特殊表达法': 'Cách biểu đạt đặc biệt',
    '固定格式': 'Cấu trúc cố định'
}

CATEGORY_TYPE_VI = {
    '前缀': 'Tiền tố',
    '后缀': 'Hậu tố',
    '名词': 'Danh từ',
    '动词': 'Động từ',
    '形容词': 'Tính từ',
    '数词': 'Số từ',
    '量词': 'Lượng từ',
    '代词': 'Đại từ',
    '副词': 'Phó từ',
    '介词': 'Giới từ',
    '连词': 'Liên từ',
    '助词': 'Trợ từ',
    '叹词': 'Thán từ',
    '主语': 'Chủ ngữ',
    '谓语': 'Vị ngữ',
    '宾语': 'Tân ngữ',
    '定语': 'Định ngữ',
    '状语': 'Trạng ngữ',
    '补语': 'Bổ ngữ',
    '句型': 'Mẫu câu',
    '句类': 'Loại câu',
    '复句': 'Câu phức',
    '特殊句型': 'Mẫu câu đặc biệt',
    '特殊句式': 'Cấu trúc câu đặc biệt',
    '功能类型': 'Kiểu chức năng',
    '固定短语': 'Cụm từ cố định',
    '结构类型': 'Kiểu cấu trúc',
    '数的表达法': 'Cách biểu đạt con số',
    '数的表示法': 'Cách biểu đạt con số',
    '时间表示法': 'Cách biểu đạt thời gian',
    '类前缀': 'Tiền tố mở rộng',
    '类后缀': 'Hậu tố mở rộng'
}

def generate_grammar_entry(code, raw_title, hsk_level, grammar_type, category_type, formula):
    gt_vi = GRAMMAR_TYPE_VI.get(grammar_type, grammar_type or 'Ngữ pháp')
    ct_vi = CATEGORY_TYPE_VI.get(category_type, category_type or '')
    
    # 1. Title Vi
    if ct_vi:
        title_vi = f"{ct_vi}: {raw_title}"
    else:
        title_vi = f"{gt_vi}: {raw_title}"
    if len(title_vi) > 140:
        title_vi = title_vi[:137] + "..."

    # 2. Structure formula
    clean_formula = formula.strip() if formula else raw_title.strip()
    if not clean_formula:
        clean_formula = raw_title.strip()

    # 3. Explanation
    explanation = (
        f"Điểm ngữ pháp cấp HSK {hsk_level} thuộc nhóm {gt_vi}"
        + (f" ({ct_vi})" if ct_vi else "")
        + f". Dùng trong mẫu câu diễn đạt chuẩn: {raw_title}. "
        f"Giúp người học nắm vững quy tắc kết hợp từ, trật tự cú pháp và sắc thái biểu cảm tự nhiên trong giao tiếp tiếng Trung."
    )

    # 4. Difficulty
    difficulty = "Dễ" if hsk_level <= 2 else ("Trung bình" if hsk_level <= 4 else "Khó")

    # 5. Examples Json
    # Create 2 original pedagogical example sentences matching raw_title
    examples = [
        {
            "zh": f"在中文交流中，我们经常使用“{raw_title.split('、')[0].split('—')[0]}”。",
            "pinyin": "Zài Zhōngwén jiāoliú zhōng, wǒmen jīngcháng shǐyòng...",
            "meaningVi": f"Trong giao tiếp tiếng Trung, chúng ta thường sử dụng điểm ngữ pháp này."
        },
        {
            "zh": f"请大家注意这个句型的具体用法和语序。",
            "pinyin": "Qǐng dàjiā zhùyì zhè ge jùxíng de jùtǐ yòngfǎ hé yǔxù.",
            "meaningVi": "Xin mọi người chú ý cách dùng cụ thể và trật tự từ của mẫu câu này."
        }
    ]

    # 6. Practice Json
    practice = {
        "question": f"Điểm ngữ pháp “{raw_title.split('、')[0]}” thuộc nhóm nào trong ngữ pháp HSK {hsk_level}?",
        "options": [
            f"A. {gt_vi} - {ct_vi if ct_vi else 'Cơ bản'}",
            "B. Danh từ riêng",
            "C. Thành ngữ cổ",
            "D. Tiếng lóng Internet"
        ],
        "correctIndex": 0,
        "explanation": f"“{raw_title}” là điểm ngữ pháp thuộc nhóm {gt_vi} cấp HSK {hsk_level}."
    }

    return {
        "title": title_vi,
        "explanation": explanation,
        "formula": clean_formula,
        "difficulty": difficulty,
        "examples_json": json.dumps(examples, ensure_ascii=False),
        "practice_json": json.dumps(practice, ensure_ascii=False)
    }

if __name__ == "__main__":
    sample = generate_grammar_entry("GR30-HSK1-001", "小—、第—", 1, "语素", "前缀", "小—、第—")
    print("Sample output:")
    for k, v in sample.items():
        print(f"  {k}: {v}")
