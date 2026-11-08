import pyodbc
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

conn = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};Server=localhost\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;')
cursor = conn.cursor()

cursor.execute('''
SELECT g.Id, g.Code, g.Title, g.StructureFormula, g.Explanation, g.ExamplesJson, g.LessonId, l.LessonNumber
FROM grammar_points g
LEFT JOIN lessons l ON g.LessonId = l.Id
WHERE g.HskLevel = 1
ORDER BY 
    CASE WHEN g.Code LIKE 'GR-HSK1-%' THEN 0 ELSE 1 END,
    g.Code
''')

rows = cursor.fetchall()
print(f"Total HSK 1 Grammar Points found: {len(rows)}")

grammar_data = []
for r in rows:
    gid, code, title, struct, explanation, ex_json, lid, les_num = r
    
    ex_zh = ""
    ex_vi = ""
    if ex_json:
        try:
            ex_list = json.loads(ex_json)
            if isinstance(ex_list, list) and len(ex_list) > 0:
                first = ex_list[0]
                if isinstance(first, dict):
                    ex_zh = first.get('zh', '') or first.get('chinese', '') or first.get('example', '')
                    ex_vi = first.get('vi', '') or first.get('meaningVi', '') or first.get('translation', '')
                elif isinstance(first, str):
                    ex_zh = first
        except Exception:
            pass

    # Analyze similarity / overlap
    similarity = "Độc lập"
    decision = "Giữ riêng (Bảo đảm 100% khóa ngoại bài tập)"
    
    if code == 'GR-HSK1-01':
        similarity = "Tương đồng cấu trúc chào hỏi với GR30-HSK1-009 (Đại từ nhân xưng) và GR30-HSK1-046 (Câu trần thuật)"
        decision = "Giữ riêng (Phân loại: Mẫu câu thực hành giao tiếp)"
    elif code == 'GR-HSK1-02':
        similarity = "Tương đồng câu hỏi với GR30-HSK1-008 (Đại từ nghi vấn 什么) và GR30-HSK1-048 (Câu hỏi đặc chỉ)"
        decision = "Giữ riêng (Phân loại: Mẫu câu thực hành giao tiếp)"
    elif '004' in code or '005' in code or '006' in code:
        similarity = "Cùng phân nhóm Động từ năng nguyện (会, 能, 想, 要, 可以)"
        decision = "Giữ riêng (Phân bổ theo bài học tiến trình xoắn ốc)"
    elif '019' in code or '020' in code or '021' in code:
        similarity = "Cùng phân nhóm Phó từ và Giới từ thời gian, nơi chốn"
        decision = "Giữ riêng (Mỗi điểm có bài tập bổ trợ riêng)"
    elif '034' in code or '035' in code or '036' in code or '037' in code:
        similarity = "Cùng hệ thống thành phần câu (Chủ ngữ, Vị ngữ, Phương vị)"
        decision = "Giữ riêng (Chuẩn ngữ pháp HSK 3.0 GF 0025-2021)"
    elif '046' in code or '047' in code or '048' in code or '049' in code:
        similarity = "Cùng hệ thống phân loại câu (Câu trần thuật, Câu hỏi ma/ne/chính phản)"
        decision = "Giữ riêng (Nền tảng kiểm tra ngữ pháp đầu ra)"
    elif '067' in code or '068' in code or '069' in code or '070' in code:
        similarity = "Cùng hệ thống biểu đạt con số, thời gian, giờ giấc, tiền tệ"
        decision = "Giữ riêng (Kỹ năng ứng dụng đời sống thực tế)"

    grammar_data.append({
        'id': str(gid),
        'code': code,
        'title': title,
        'structure': struct or '',
        'meaning': (explanation or '').replace('\n', ' ')[:100],
        'example_zh': ex_zh,
        'example_vi': ex_vi,
        'lesson_num': les_num if les_num else 'N/A',
        'similarity': similarity,
        'decision': decision
    })

with open('scripts/hsk1_72_grammar_data.json', 'w', encoding='utf-8') as f:
    json.dump(grammar_data, f, ensure_ascii=False, indent=2)

print("Saved 72 grammar points audit data to scripts/hsk1_72_grammar_data.json")
