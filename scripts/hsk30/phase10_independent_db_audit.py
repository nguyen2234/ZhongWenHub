#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 10 — Independent DB Audit Script
Audits 70 lessons across HSK 1-4, checks HSK 5-6 status, audio files on disk,
exercise answers, dialogue structure, placeholder detection, and compares Test vs Dev.
"""

import os
import re
import json
import pyodbc

DB_TEST_CONN = "DRIVER={ODBC Driver 18 for SQL Server};SERVER=.\\SQLEXPRESS;DATABASE=ZhongWenHub_Test;Trusted_Connection=yes;TrustServerCertificate=yes;"
DB_DEV_CONN  = "DRIVER={ODBC Driver 18 for SQL Server};SERVER=.\\SQLEXPRESS;DATABASE=ZhongWenHub_Dev;Trusted_Connection=yes;TrustServerCertificate=yes;"

AUDIO_BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "Fontend", "public", "audio")

def audit_database():
    results = {
        "timestamp": "2026-11-10T17:15:00Z",
        "test_db": "ZhongWenHub_Test",
        "dev_db": "ZhongWenHub_Dev",
        "levels": {},
        "placeholder_violations": [],
        "broken_references": [],
        "invalid_exercises": [],
        "missing_audio": [],
        "hsk5_6_isolation": {},
        "dev_vs_test_comparison": {}
    }

    print("Connecting to ZhongWenHub_Test...")
    conn = pyodbc.connect(DB_TEST_CONN)
    cursor = conn.cursor()

    cursor.execute("SELECT DB_NAME()")
    current_db = cursor.fetchone()[0]
    assert current_db == "ZhongWenHub_Test", f"Expected ZhongWenHub_Test, got {current_db}"
    print(f"Verified connection to: {current_db}")

    # Audit HSK 1-6 Courses
    cursor.execute("""
        SELECT c.Id, c.Code, c.Title, c.Status,
               (SELECT COUNT(*) FROM units u WHERE u.CourseId = c.Id) as UnitCount,
               (SELECT COUNT(*) FROM lessons l WHERE l.CourseId = c.Id) as LessonCount
        FROM courses c
        WHERE c.Code IN ('HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6')
        ORDER BY c.Code
    """)
    courses = cursor.fetchall()
    
    for row in courses:
        cid, code, title, c_status, unit_count, lesson_count = row
        lvl_num = int(code.replace("HSK", ""))
        
        # Get lessons
        cursor.execute("""
            SELECT l.Id, l.LessonNumber, l.TitleZh, l.TitleVi, l.Status, l.DialogueJson, l.XpReward
            FROM lessons l
            WHERE l.CourseId = ?
            ORDER BY l.LessonNumber
        """, (cid,))
        lessons = cursor.fetchall()

        level_info = {
            "code": code,
            "title": title,
            "course_status": c_status,
            "unit_count": unit_count,
            "lesson_count": lesson_count,
            "total_vocab": 0,
            "total_grammar": 0,
            "total_exercises": 0,
            "total_dialogues": 0,
            "total_readings": 0,
            "lessons": []
        }

        for les in lessons:
            lid, lnum, ltitle, lvi, lstatus, dia_json, xp = les
            
            # Vocab count
            cursor.execute("SELECT COUNT(*) FROM vocabularies WHERE LessonId = ?", (lid,))
            v_count = cursor.fetchone()[0]
            level_info["total_vocab"] += v_count

            # Grammar count
            cursor.execute("SELECT COUNT(*) FROM grammar_points WHERE LessonId = ?", (lid,))
            g_count = cursor.fetchone()[0]
            level_info["total_grammar"] += g_count

            # Exercise count & valid answers
            cursor.execute("SELECT Id, Title, CorrectAnswer, CorrectOptionIndex, OptionsJson FROM exercises WHERE LessonId = ?", (lid,))
            exs = cursor.fetchall()
            level_info["total_exercises"] += len(exs)

            for ex in exs:
                ex_id, ex_title, ans, opt_idx, opts = ex
                if (ans is None or ans.strip() == "") and opt_idx is None:
                    results["invalid_exercises"].append({
                        "exercise_id": str(ex_id),
                        "lesson_id": str(lid),
                        "reason": "Missing both correct_answer and correct_option_index"
                    })

            # Check dialogue
            has_dia = False
            has_rd = False
            if dia_json:
                try:
                    dia_data = json.loads(dia_json)
                    if isinstance(dia_data, list) and len(dia_data) > 0:
                        has_dia = True
                    elif isinstance(dia_data, dict):
                        if "lines" in dia_data or "dialogue" in dia_data:
                            has_dia = True
                        if "reading_passage" in dia_data or "passage" in dia_data:
                            has_rd = True
                except Exception as e:
                    results["broken_references"].append({
                        "lesson_id": str(lid),
                        "reason": f"Corrupted DialogueJson: {e}"
                    })

            if has_dia:
                level_info["total_dialogues"] += 1
            if has_rd:
                level_info["total_readings"] += 1

            # Check placeholders in title
            if "TODO" in ltitle or "PLACEHOLDER" in ltitle.upper() or "LOREM" in ltitle.upper():
                results["placeholder_violations"].append({
                    "lesson_id": str(lid),
                    "title": ltitle
                })

            level_info["lessons"].append({
                "lesson_id": str(lid),
                "lesson_number": lnum,
                "title": ltitle,
                "vietnamese": lvi,
                "status": lstatus,
                "vocab_count": v_count,
                "grammar_count": g_count,
                "exercise_count": len(exs),
                "has_dialogue": has_dia,
                "has_reading": has_rd
            })

        results["levels"][code] = level_info

    # Check Audio files on disk
    for lvl in [1, 2, 3, 4, 5, 6]:
        lvl_audio_dir = os.path.join(AUDIO_BASE_DIR, f"hsk{lvl}")
        audio_files = []
        if os.path.isdir(lvl_audio_dir):
            audio_files = [f for f in os.listdir(lvl_audio_dir) if f.endswith(".mp3")]
        results["levels"][f"HSK{lvl}"]["audio_files_count"] = len(audio_files)

    # Check HSK 5 and 6 Isolation details
    hsk5_draft = sum(1 for l in results["levels"]["HSK5"]["lessons"] if l["status"] == "DRAFT")
    hsk5_pub   = sum(1 for l in results["levels"]["HSK5"]["lessons"] if l["status"] == "PUBLISHED")
    hsk6_draft = sum(1 for l in results["levels"]["HSK6"]["lessons"] if l["status"] == "DRAFT")
    hsk6_pub   = sum(1 for l in results["levels"]["HSK6"]["lessons"] if l["status"] == "PUBLISHED")
    results["hsk5_6_isolation"] = {
        "HSK5": {"draft_lessons": hsk5_draft, "published_lessons": hsk5_pub, "vocab_count": results["levels"]["HSK5"]["total_vocab"]},
        "HSK6": {"draft_lessons": hsk6_draft, "published_lessons": hsk6_pub, "vocab_count": results["levels"]["HSK6"]["total_vocab"]}
    }

    conn.close()

    # Compare with Dev DB (READ ONLY)
    print("Auditing ZhongWenHub_Dev (READ ONLY)...")
    dev_conn = pyodbc.connect(DB_DEV_CONN)
    dev_cursor = dev_conn.cursor()
    dev_cursor.execute("SELECT DB_NAME()")
    dev_name = dev_cursor.fetchone()[0]
    assert dev_name == "ZhongWenHub_Dev", f"Expected ZhongWenHub_Dev, got {dev_name}"

    dev_cursor.execute("""
        SELECT c.Code, 
               (SELECT COUNT(*) FROM lessons l WHERE l.CourseId = c.Id) as LessonCount,
               (SELECT COUNT(*) FROM vocabularies v JOIN lessons l ON v.LessonId = l.Id WHERE l.CourseId = c.Id) as VocabCount
        FROM courses c
        WHERE c.Code IN ('HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6')
        ORDER BY c.Code
    """)
    for row in dev_cursor.fetchall():
        code, l_count, v_count = row
        results["dev_vs_test_comparison"][code] = {
            "dev_lessons": l_count,
            "dev_vocab": v_count,
            "test_lessons": results["levels"][code]["lesson_count"],
            "test_vocab": results["levels"][code]["total_vocab"]
        }
    dev_conn.close()

    out_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "hsk30", "staging", "phase10_independent_audit_results.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("\n=== AUDIT SUMMARY ===")
    for code, info in results["levels"].items():
        print(f"[{code}] {info['title']}: {info['lesson_count']} Lessons, {info['total_vocab']} Vocab, {info['total_grammar']} Grammar, {info['total_exercises']} Exercises, {info['audio_files_count']} Audios")
    print(f"HSK 5/6 Isolation: {results['hsk5_6_isolation']}")
    print(f"Placeholder violations: {len(results['placeholder_violations'])}")
    print(f"Invalid exercises: {len(results['invalid_exercises'])}")
    print(f"Broken references: {len(results['broken_references'])}")
    print(f"Output saved to: {out_file}")

if __name__ == "__main__":
    audit_database()
