#!/usr/bin/env python3
"""
scripts/hsk30/dump_hsk2_dev_exercises.py
Dumps the 30 existing exercises for HSK 2 on ZhongWenHub_Dev for audit.
"""

import sys
import json
import pyodbc

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

conn = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;')
cur = conn.cursor()

cur.execute("""
    SELECT e.Id, e.Type, e.Skill, e.HskLevel, e.Title, e.Instruction,
           e.PromptHanzi, e.PromptPinyin, e.PromptVietnamese, e.AudioUrl,
           e.OptionsJson, e.CorrectOptionIndex, e.CorrectAnswer, e.Explanation,
           e.XpReward, e.Status, e.LessonId, l.LessonNumber, l.TitleZh
    FROM exercises e
    JOIN lessons l ON e.LessonId = l.Id
    JOIN units u ON l.UnitId = u.Id
    JOIN courses c ON u.CourseId = c.Id
    WHERE c.HskLevel = 2
    ORDER BY l.LessonNumber, e.Title
""")

rows = cur.fetchall()
print(f"Total HSK 2 exercises retrieved from Dev DB: {len(rows)}")

exercises = []
for r in rows:
    exercises.append({
        "devId": str(r[0]),
        "type": r[1],
        "skill": r[2],
        "hskLevel": r[3],
        "title": r[4],
        "instruction": r[5],
        "promptHanzi": r[6],
        "promptPinyin": r[7],
        "promptVietnamese": r[8],
        "audioUrl": r[9],
        "optionsJson": r[10],
        "correctOptionIndex": r[11],
        "correctAnswer": r[12],
        "explanation": r[13],
        "xpReward": r[14],
        "status": r[15],
        "lessonId": str(r[16]),
        "lessonNumber": r[17],
        "lessonTitle": r[18]
    })

out_path = "data/hsk30/staging/dev_hsk2_exercises_raw.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(exercises, f, ensure_ascii=False, indent=2)

print(f"Saved to {out_path}")
conn.close()
