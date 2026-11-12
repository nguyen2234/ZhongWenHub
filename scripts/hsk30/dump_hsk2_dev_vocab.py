#!/usr/bin/env python3
"""
scripts/hsk30/dump_hsk2_dev_vocab.py
Extracts the 200 HSK 2 vocabularies from ZhongWenHub_Dev (Read-Only) for quality audit and enrichment staging.
"""

import sys
import json
import pyodbc

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

conn = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;')
cur = conn.cursor()

cur.execute("""
    SELECT v.Id, v.Hanzi, v.Pinyin, v.MeaningVi, v.PartOfSpeech, v.LessonId, l.LessonNumber, l.TitleZh, v.ExamplesJson
    FROM vocabularies v
    JOIN lessons l ON v.LessonId = l.Id
    JOIN units u ON l.UnitId = u.Id
    JOIN courses c ON u.CourseId = c.Id
    WHERE c.HskLevel = 2
    ORDER BY l.LessonNumber, v.Hanzi
""")

rows = cur.fetchall()
print(f"Total HSK 2 vocabularies retrieved from Dev DB: {len(rows)}")

vocab_list = []
for r in rows:
    v_id, hanzi, pinyin, meaning_vi, pos, lesson_id, lesson_num, lesson_title, examples_json = r
    vocab_list.append({
        "devId": str(v_id),
        "hanzi": hanzi,
        "pinyin": pinyin,
        "meaningVi": meaning_vi,
        "partOfSpeech": pos,
        "lessonId": str(lesson_id),
        "lessonNumber": lesson_num,
        "lessonTitle": lesson_title,
        "hasExamples": bool(examples_json)
    })

out_path = "data/hsk30/staging/dev_hsk2_vocab_raw.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(vocab_list, f, ensure_ascii=False, indent=2)

print(f"Saved raw HSK 2 vocabularies to {out_path}")
conn.close()
