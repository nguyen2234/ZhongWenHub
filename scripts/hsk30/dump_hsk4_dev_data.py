# -*- coding: utf-8 -*-
"""
Dump HSK 4 Baseline Data from ZhongWenHub_Dev (READ-ONLY)
Phase 9.4 — Task 1
Dumps:
  - data/hsk30/staging/dev_hsk4_vocab_raw.json (1000 words)
  - data/hsk30/staging/dev_hsk4_grammar_raw.json (95 grammar points)
  - data/hsk30/staging/dev_hsk4_exercises_raw.json (40 exercises)
"""

import sys
import json
import pyodbc
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("=== DUMPING HSK 4 BASELINE DATA (READ-ONLY FROM DEV) ===")
    conn_str = "Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;ApplicationIntent=ReadOnly;"
    conn = pyodbc.connect(conn_str)
    cur = conn.cursor()

    staging_dir = Path("data/hsk30/staging")
    staging_dir.mkdir(parents=True, exist_ok=True)

    # 1. Dump Vocabularies
    print("Dumping 1,000 Vocabularies...")
    cur.execute("""
        SELECT 
            v.Id, v.Hanzi, v.Pinyin, v.MeaningVi, v.PartOfSpeech,
            v.LessonId, l.OrderIndex as LessonNumber, l.TitleZh as LessonTitle,
            CASE WHEN v.ExamplesJson IS NOT NULL AND LEN(v.ExamplesJson) > 5 THEN 1 ELSE 0 END as HasExamples
        FROM vocabularies v
        JOIN lessons l ON v.LessonId = l.Id
        JOIN units u ON l.UnitId = u.Id
        WHERE u.CourseId = '44444444-4444-4444-4444-444444444444'
        ORDER BY l.OrderIndex, v.Hanzi
    """)
    vocab_rows = cur.fetchall()
    vocab_list = [
        {
            "devId": str(r[0]),
            "hanzi": r[1],
            "pinyin": r[2],
            "meaningVi": r[3],
            "partOfSpeech": r[4],
            "lessonId": str(r[5]),
            "lessonNumber": r[6],
            "lessonTitle": r[7],
            "hasExamples": bool(r[8])
        }
        for r in vocab_rows
    ]
    with open(staging_dir / "dev_hsk4_vocab_raw.json", "w", encoding="utf-8") as f:
        json.dump(vocab_list, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(vocab_list)} vocabularies to {staging_dir / 'dev_hsk4_vocab_raw.json'}")

    # 2. Dump Grammar Points
    print("Dumping 95 Grammar Points...")
    cur.execute("""
        SELECT 
            g.Id, g.Code, g.Title, g.StructureFormula, g.Explanation,
            g.ExamplesJson, g.LessonId, l.OrderIndex as LessonNumber, l.TitleZh as LessonTitle
        FROM grammar_points g
        JOIN lessons l ON g.LessonId = l.Id
        JOIN units u ON l.UnitId = u.Id
        WHERE u.CourseId = '44444444-4444-4444-4444-444444444444'
        ORDER BY l.OrderIndex, g.Code
    """)
    grammar_rows = cur.fetchall()
    grammar_list = [
        {
            "devId": str(r[0]),
            "code": r[1],
            "title": r[2],
            "structureFormula": r[3],
            "explanation": r[4],
            "examplesJson": r[5],
            "lessonId": str(r[6]),
            "lessonNumber": r[7],
            "lessonTitle": r[8]
        }
        for r in grammar_rows
    ]
    with open(staging_dir / "dev_hsk4_grammar_raw.json", "w", encoding="utf-8") as f:
        json.dump(grammar_list, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(grammar_list)} grammar points to {staging_dir / 'dev_hsk4_grammar_raw.json'}")

    # 3. Dump Exercises
    print("Dumping 40 Exercises...")
    cur.execute("""
        SELECT 
            e.Id, e.Type, e.Skill, e.HskLevel, e.Title, e.Instruction,
            e.PromptHanzi, e.PromptPinyin, e.PromptVietnamese, e.AudioUrl,
            e.OptionsJson, e.CorrectOptionIndex, e.CorrectAnswer, e.Explanation,
            e.XpReward, e.Status, e.LessonId, l.OrderIndex as LessonNumber, l.TitleZh as LessonTitle
        FROM exercises e
        JOIN lessons l ON e.LessonId = l.Id
        JOIN units u ON l.UnitId = u.Id
        WHERE u.CourseId = '44444444-4444-4444-4444-444444444444'
        ORDER BY l.OrderIndex, e.Id
    """)
    exercise_rows = cur.fetchall()
    exercise_list = [
        {
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
        }
        for r in exercise_rows
    ]
    with open(staging_dir / "dev_hsk4_exercises_raw.json", "w", encoding="utf-8") as f:
        json.dump(exercise_list, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(exercise_list)} exercises to {staging_dir / 'dev_hsk4_exercises_raw.json'}")

    conn.close()
    print("Baseline dump completed successfully.")

if __name__ == "__main__":
    main()
