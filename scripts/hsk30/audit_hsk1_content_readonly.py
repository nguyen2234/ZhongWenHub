#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ZHONGWENHUB - PHASE 9.1A: HSK 1 CONTENT QUALITY AUDIT SCRIPT (READ-ONLY)
Strict safety guard: Executes ONLY SELECT queries against SQL Server.
Zero mutation guarantee.
"""

import pyodbc
import json
import re
import sys
import os

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Database connection configuration
CONN_STR = (
    "Driver={ODBC Driver 18 for SQL Server};"
    "Server=.\\SQLEXPRESS;"
    "Database=ZhongWenHub_Dev;"
    "Trusted_Connection=yes;"
    "TrustServerCertificate=yes;"
    "ApplicationIntent=ReadOnly;"
)

def safe_query(cursor, sql, params=None):
    # Safety guard: strictly forbid any DDL / DML write operations
    forbidden = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "EXEC", "MERGE"]
    normalized_sql = sql.strip().upper()
    for kw in forbidden:
        if normalized_sql.startswith(kw) or f" {kw} " in normalized_sql:
            raise ValueError(f"SECURITY VIOLATION: Forbidden keyword '{kw}' in read-only audit query: {sql}")
    
    if params:
        cursor.execute(sql, params)
    else:
        cursor.execute(sql)
    return cursor

def audit_hsk1_data():
    print("Connecting to SQL Server (ZhongWenHub_Dev) in READ-ONLY mode...")
    conn = pyodbc.connect(CONN_STR)
    cur = conn.cursor()

    report = {
        "metadata": {
            "phase": "9.1A",
            "database": "ZhongWenHub_Dev",
            "audit_type": "READ_ONLY_CONTENT_AUDIT"
        }
    }

    # 1. HSK 1 Course
    safe_query(cur, "SELECT Id, Code, Title, Description, HskLevel, Status, OrderIndex FROM courses WHERE HskLevel = 1")
    course = cur.fetchone()
    course_id = str(course[0])
    report["course"] = {
        "id": course_id,
        "code": course[1],
        "title": course[2],
        "description": course[3],
        "hsk_level": course[4],
        "status": course[5],
        "order_index": course[6]
    }
    print(f"Course: {course[2]} ({course_id})")

    # 2. Units in HSK 1
    safe_query(cur, """
        SELECT Id, UnitNumber, TitleZh, TitleVi, Description, OrderIndex, Status
        FROM units
        WHERE CourseId = ?
        ORDER BY OrderIndex
    """, (course_id,))
    units = []
    unit_ids = []
    for u in cur.fetchall():
        uid = str(u[0])
        unit_ids.append(uid)
        units.append({
            "id": uid,
            "unit_number": u[1],
            "title_zh": u[2],
            "title_vi": u[3],
            "description": u[4],
            "order_index": u[5],
            "status": u[6]
        })
    report["units"] = units
    print(f"Total Units: {len(units)}")

    # 3. Lessons in HSK 1
    safe_query(cur, """
        SELECT Id, UnitId, LessonNumber, TitleZh, TitleVi, Pinyin, Summary, 
               DurationMinutes, XpReward, OrderIndex, Status, DialogueJson, ListeningJson
        FROM lessons
        WHERE CourseId = ?
        ORDER BY OrderIndex
    """, (course_id,))
    lessons = []
    lesson_ids = []
    for l in cur.fetchall():
        lid = str(l[0])
        lesson_ids.append(lid)
        
        # Dialogue JSON inspection
        raw_dialogue = l[11]
        dialogue_parsed = None
        dialogue_valid_json = False
        dialogue_usable = False
        dialogue_error = None
        if raw_dialogue:
            try:
                dialogue_parsed = json.loads(raw_dialogue)
                dialogue_valid_json = True
                if isinstance(dialogue_parsed, list) and len(dialogue_parsed) > 0:
                    dialogue_usable = True
                elif isinstance(dialogue_parsed, dict) and len(dialogue_parsed.keys()) > 0:
                    dialogue_usable = True
            except Exception as e:
                dialogue_error = str(e)

        # Listening JSON inspection
        raw_listening = l[12]
        listening_parsed = None
        listening_valid_json = False
        listening_usable = False
        listening_error = None
        if raw_listening:
            try:
                listening_parsed = json.loads(raw_listening)
                listening_valid_json = True
                if isinstance(listening_parsed, list) and len(listening_parsed) > 0:
                    listening_usable = True
                elif isinstance(listening_parsed, dict) and len(listening_parsed.keys()) > 0:
                    listening_usable = True
            except Exception as e:
                listening_error = str(e)

        lessons.append({
            "id": lid,
            "unit_id": str(l[1]),
            "lesson_number": l[2],
            "title_zh": l[3],
            "title_vi": l[4],
            "pinyin": l[5],
            "summary": l[6],
            "duration_minutes": l[7],
            "xp_reward": l[8],
            "order_index": l[9],
            "status": l[10],
            "dialogue_present": raw_dialogue is not None and len(raw_dialogue) > 0,
            "dialogue_valid_json": dialogue_valid_json,
            "dialogue_usable": dialogue_usable,
            "dialogue_error": dialogue_error,
            "dialogue_content": dialogue_parsed,
            "listening_present": raw_listening is not None and len(raw_listening) > 0,
            "listening_valid_json": listening_valid_json,
            "listening_usable": listening_usable,
            "listening_error": listening_error,
            "listening_content": listening_parsed
        })
    report["lessons"] = lessons
    print(f"Total Lessons: {len(lessons)}")

    # 4. Vocabularies in HSK 1
    safe_query(cur, """
        SELECT Id, Hanzi, Traditional, Pinyin, MeaningVi, MeaningEn, PartOfSpeech, 
               AudioUrl, ExamplesJson, Status, LessonId, SourceId, Homograph, SuggestedMeaningVi
        FROM vocabularies
        WHERE HskLevel = 1
        ORDER BY LessonId, Id
    """)
    vocab_list = []
    for v in cur.fetchall():
        ex_raw = v[8]
        ex_parsed = None
        ex_valid = False
        if ex_raw:
            try:
                ex_parsed = json.loads(ex_raw)
                ex_valid = True
            except Exception:
                pass

        vocab_list.append({
            "id": v[0],
            "hanzi": v[1],
            "traditional": v[2],
            "pinyin": v[3],
            "meaning_vi": v[4],
            "meaning_en": v[5],
            "part_of_speech": v[6],
            "audio_url": v[7],
            "examples_json_valid": ex_valid,
            "examples": ex_parsed,
            "status": v[9],
            "lesson_id": str(v[10]) if v[10] else None,
            "source_id": v[11],
            "homograph": v[12],
            "suggested_meaning_vi": v[13]
        })
    report["vocabularies"] = vocab_list
    print(f"Total HSK 1 Vocabularies: {len(vocab_list)}")

    # 5. Grammar Points in HSK 1
    safe_query(cur, """
        SELECT Id, Code, Title, PinyinTitle, Category, StructureFormula, 
               Explanation, Difficulty, ExamplesJson, PracticeJson, Status, LessonId
        FROM grammar_points
        WHERE HskLevel = 1
        ORDER BY LessonId, Id
    """)
    grammar_list = []
    for g in cur.fetchall():
        ex_raw = g[8]
        ex_parsed = None
        if ex_raw:
            try:
                ex_parsed = json.loads(ex_raw)
            except Exception:
                pass

        pr_raw = g[9]
        pr_parsed = None
        if pr_raw:
            try:
                pr_parsed = json.loads(pr_raw)
            except Exception:
                pass

        grammar_list.append({
            "id": g[0],
            "code": g[1],
            "title": g[2],
            "pinyin_title": g[3],
            "category": g[4],
            "structure_formula": g[5],
            "explanation": g[6],
            "difficulty": g[7],
            "examples": ex_parsed,
            "practice": pr_parsed,
            "status": g[10],
            "lesson_id": str(g[11]) if g[11] else None
        })
    report["grammar_points"] = grammar_list
    print(f"Total HSK 1 Grammar Points: {len(grammar_list)}")

    # 6. Exercises linked to HSK 1
    safe_query(cur, """
        SELECT Id, Type, Skill, HskLevel, Title, Instruction, PromptHanzi, PromptPinyin, 
               PromptVietnamese, AudioUrl, OptionsJson, CorrectOptionIndex, CorrectAnswer, 
               Explanation, XpReward, Status, LessonId, GrammarPointId
        FROM exercises
        WHERE HskLevel = 1 OR LessonId IN (SELECT Id FROM lessons WHERE CourseId = ?)
        ORDER BY LessonId, Id
    """, (course_id,))
    exercise_list = []
    for e in cur.fetchall():
        opt_raw = e[10]
        opt_parsed = None
        if opt_raw:
            try:
                opt_parsed = json.loads(opt_raw)
            except Exception:
                pass

        exercise_list.append({
            "id": str(e[0]),
            "type": e[1],
            "skill": e[2],
            "hsk_level": e[3],
            "title": e[4],
            "instruction": e[5],
            "prompt_hanzi": e[6],
            "prompt_pinyin": e[7],
            "prompt_vi": e[8],
            "audio_url": e[9],
            "options": opt_parsed,
            "correct_option_index": e[11],
            "correct_answer": e[12],
            "explanation": e[13],
            "xp_reward": e[14],
            "status": e[15],
            "lesson_id": str(e[16]) if e[16] else None,
            "grammar_point_id": str(e[17]) if e[17] else None
        })
    report["exercises"] = exercise_list
    print(f"Total HSK 1 Exercises: {len(exercise_list)}")

    # 7. Student lesson progress check
    safe_query(cur, f"""
        SELECT COUNT(*) FROM student_lesson_progress
        WHERE LessonId IN (SELECT LOWER(CAST(Id AS nvarchar(50))) FROM lessons WHERE CourseId = '{course_id}')
    """)
    report["student_progress_count"] = cur.fetchone()[0]

    out_file = r"C:\Users\nguyen\.gemini\antigravity\brain\cd186fce-5c0e-4fe7-82e2-2c0cf85214c4\scratch\hsk1_audit_data.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"Audit completed successfully. Full data dumped to: {out_file}")

if __name__ == "__main__":
    audit_hsk1_data()
