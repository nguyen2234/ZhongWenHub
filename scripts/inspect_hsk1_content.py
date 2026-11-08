import pyodbc
import json
import re
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

conn = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};Server=localhost\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;')
cursor = conn.cursor()

cursor.execute('''
SELECT l.LessonNumber, l.TitleZh, l.TitleVi, l.DialogueJson, l.ListeningJson, l.Id
FROM lessons l
JOIN courses c ON l.CourseId = c.Id
WHERE c.HskLevel = 1
ORDER BY l.LessonNumber
''')

hanzi_regex = re.compile(r'[\u4e00-\u9fff]')

anomalies = []

for row in cursor.fetchall():
    les_num, title_zh, title_vi, d_json, l_json, les_id = row
    print(f"=== Lesson {les_num}: {title_zh} ({title_vi}) ===")
    
    # Check DialogueJson
    if d_json:
        try:
            d_data = json.loads(d_json)
            # could be list or dict
            lines = d_data if isinstance(d_data, list) else d_data.get('lines', d_data.get('dialogue', []))
            for i, line in enumerate(lines):
                py = line.get('pinyin', '') or line.get('Pinyin', '')
                vi = line.get('meaningVi', '') or line.get('meaning_vi', '') or line.get('vi', '') or line.get('vietnamese', '')
                zh = line.get('text', '') or line.get('chinese', '') or line.get('zh', '')
                
                # Check for hanzi in py or vi
                py_hanzi = hanzi_regex.findall(py)
                vi_hanzi = hanzi_regex.findall(vi)
                if py_hanzi:
                    anomalies.append({
                        'lesson': les_num, 'id': str(les_id), 'type': 'Dialogue', 'line': i+1,
                        'field': 'Pinyin', 'zh': zh, 'py': py, 'vi': vi, 'hanzi': ''.join(py_hanzi)
                    })
                if vi_hanzi:
                    anomalies.append({
                        'lesson': les_num, 'id': str(les_id), 'type': 'Dialogue', 'line': i+1,
                        'field': 'Vietnamese', 'zh': zh, 'py': py, 'vi': vi, 'hanzi': ''.join(vi_hanzi)
                    })
        except Exception as e:
            print(f"Error parsing DialogueJson for L{les_num}: {e}")

    # Check ListeningJson
    if l_json:
        try:
            l_data = json.loads(l_json)
            # check scripts, questions, etc.
            # let's dump strings recursively
            def check_obj(obj, path):
                if isinstance(obj, dict):
                    for k, v in obj.items():
                        if k in ['pinyin', 'Pinyin']:
                            hz = hanzi_regex.findall(str(v))
                            if hz:
                                anomalies.append({
                                    'lesson': les_num, 'id': str(les_id), 'type': 'Listening', 'line': path + '.' + k,
                                    'field': 'Pinyin', 'zh': obj.get('text', obj.get('script', '')),
                                    'py': str(v), 'vi': obj.get('meaningVi', obj.get('meaning_vi', '')), 'hanzi': ''.join(hz)
                                })
                        elif k in ['meaningVi', 'meaning_vi', 'vi', 'vietnamese', 'translation', 'explanation']:
                            hz = hanzi_regex.findall(str(v))
                            if hz:
                                anomalies.append({
                                    'lesson': les_num, 'id': str(les_id), 'type': 'Listening', 'line': path + '.' + k,
                                    'field': 'Vietnamese', 'zh': obj.get('text', obj.get('script', '')),
                                    'py': obj.get('pinyin', ''), 'vi': str(v), 'hanzi': ''.join(hz)
                                })
                        else:
                            check_obj(v, f"{path}.{k}")
                elif isinstance(obj, list):
                    for idx, item in enumerate(obj):
                        check_obj(item, f"{path}[{idx}]")
            check_obj(l_data, "root")
        except Exception as e:
            print(f"Error parsing ListeningJson for L{les_num}: {e}")

print(f"\nTotal Anomalies Found: {len(anomalies)}")
for a in anomalies:
    print(f"L{a['lesson']} [{a['type']} - {a['field']}] Hanzi: {a['hanzi']} | ZH: {a['zh']} | PY: {a['py']} | VI: {a['vi']}")
