import json
import pyodbc
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

replacements = {
    7: ("星期三", "xīngqīsān"),
    9: ("两点半", "liǎng diǎn bàn"),
    11: ("八块钱", "bā kuài qián"),
    12: ("一件新衣服", "yí jiàn xīn yīfu")
}

for db in ["ZhongWenHub_Test", "ZhongWenHub_Dev"]:
    conn = pyodbc.connect(f'Driver={{ODBC Driver 17 for SQL Server}};Server=.\\SQLEXPRESS;Database={db};Trusted_Connection=yes;')
    cur = conn.cursor()
    
    for l_num, (hz, py) in replacements.items():
        cur.execute("""
            SELECT l.Id, l.ListeningJson
            FROM lessons l
            JOIN courses c ON l.CourseId = c.Id
            WHERE c.HskLevel = 1 AND l.LessonNumber = ?
        """, (l_num,))
        row = cur.fetchone()
        if row and row[1]:
            l_id, l_json = row
            data = json.loads(l_json)
            for item in data:
                exp = item.get("explanation", "")
                if hz in exp:
                    item["explanation"] = exp.replace(hz, py)
            new_json = json.dumps(data, ensure_ascii=False)
            cur.execute("UPDATE lessons SET ListeningJson = ? WHERE Id = ?", (new_json, l_id))
    
    conn.commit()
    conn.close()
    print(f"Cleaned explanations in {db}")
