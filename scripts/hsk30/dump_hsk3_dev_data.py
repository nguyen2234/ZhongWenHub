# -*- coding: utf-8 -*-
"""
Dump HSK 3 baseline data from ZhongWenHub_Dev (Strictly READ-ONLY)
Outputs:
  - data/hsk30/staging/dev_hsk3_vocab_raw.json (500 words)
  - data/hsk30/staging/dev_hsk3_exercises_raw.json (40 exercises)
  - data/hsk30/staging/dev_hsk3_grammar_raw.json (96 grammar points)
"""

import sys
import json
import pyodbc
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def dump_dev_data():
    conn_str = "Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;ApplicationIntent=ReadOnly;"
    conn = pyodbc.connect(conn_str)
    cur = conn.cursor()

    # 1. Vocabularies
    cur.execute("""
        SELECT 
            v.Id, v.Hanzi, v.Pinyin, v.MeaningVi, v.PartOfSpeech,
            v.LessonId, l.OrderIndex, l.TitleZh,
            v.ExamplesJson
        FROM vocabularies v
        JOIN lessons l ON v.LessonId = l.Id
        WHERE v.HskLevel = 3
        ORDER BY l.OrderIndex, v.Hanzi
    """)
    v_rows = cur.fetchall()
    vocab_list = []
    for r in v_rows:
        vocab_list.append({
            "devId": str(r[0]).upper(),
            "hanzi": r[1],
            "pinyin": r[2],
            "meaningVi": r[3],
            "partOfSpeech": r[4],
            "lessonId": str(r[5]).upper(),
            "lessonNumber": r[6],
            "lessonTitle": r[7],
            "hasExamples": bool(r[8] and len(r[8]) > 5)
        })

    v_out = Path("data/hsk30/staging/dev_hsk3_vocab_raw.json")
    with open(v_out, "w", encoding="utf-8") as f:
        json.dump(vocab_list, f, ensure_ascii=False, indent=2)
    print(f"Dumped {len(vocab_list)} raw HSK 3 vocabularies -> {v_out}")

    # 2. Exercises
    cur.execute("""
        SELECT 
            e.Id, e.Type, e.Skill, e.HskLevel, e.Title, e.Instruction,
            e.PromptHanzi, e.PromptPinyin, e.PromptVietnamese, e.AudioUrl,
            e.OptionsJson, e.CorrectOptionIndex, e.CorrectAnswer, e.Explanation,
            e.XpReward, e.Status, e.LessonId, l.OrderIndex, l.TitleZh
        FROM exercises e
        JOIN lessons l ON e.LessonId = l.Id
        WHERE e.HskLevel = 3
        ORDER BY l.OrderIndex, e.Id
    """)
    ex_rows = cur.fetchall()
    ex_list = []
    for r in ex_rows:
        ex_list.append({
            "devId": str(r[0]).upper(),
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
            "lessonId": str(r[16]).upper(),
            "lessonNumber": r[17],
            "lessonTitle": r[18]
        })

    ex_out = Path("data/hsk30/staging/dev_hsk3_exercises_raw.json")
    with open(ex_out, "w", encoding="utf-8") as f:
        json.dump(ex_list, f, ensure_ascii=False, indent=2)
    print(f"Dumped {len(ex_list)} raw HSK 3 exercises -> {ex_out}")

    # 3. Grammar
    cur.execute("""
        SELECT 
            g.Id, g.Code, g.Title, g.StructureFormula, g.Explanation,
            g.ExamplesJson, g.LessonId, l.OrderIndex, l.TitleZh
        FROM grammar_points g
        JOIN lessons l ON g.LessonId = l.Id
        WHERE l.UnitId IN (
            SELECT u.Id FROM units u JOIN courses c ON u.CourseId = c.Id WHERE c.HskLevel = 3
        )
        ORDER BY l.OrderIndex, g.Code
    """)
    g_rows = cur.fetchall()
    g_list = []
    for r in g_rows:
        g_list.append({
            "devId": str(r[0]).upper(),
            "code": r[1],
            "title": r[2],
            "structureFormula": r[3],
            "explanation": r[4],
            "examplesJson": r[5],
            "lessonId": str(r[6]).upper(),
            "lessonNumber": r[7],
            "lessonTitle": r[8]
        })

    g_out = Path("data/hsk30/staging/dev_hsk3_grammar_raw.json")
    with open(g_out, "w", encoding="utf-8") as f:
        json.dump(g_list, f, ensure_ascii=False, indent=2)
    print(f"Dumped {len(g_list)} raw HSK 3 grammar points -> {g_out}")

    conn.close()

if __name__ == "__main__":
    dump_dev_data()
