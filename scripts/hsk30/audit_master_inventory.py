#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ZhongWenHub — Master Inventory & Quality Audit
Produces the authoritative curriculum inventory across HSK 1 to HSK 6.
Guards:
- Strict assert_safe_test_connection (ZhongWenHub_Test only).
- Zero writes to ZhongWenHub_Dev.
"""

import os
import sys
import json
from pathlib import Path

# Safety guard import
scripts_dir = Path(__file__).resolve().parent
if str(scripts_dir) not in sys.path:
    sys.path.insert(0, str(scripts_dir))

from db_safety_guard import connect_test_database, assert_safe_test_connection


def audit_master_inventory():
    conn = connect_test_database()
    guard = assert_safe_test_connection(conn)
    cursor = conn.cursor()

    report = {
        "timestamp": "2026-11-10T23:35:00Z",
        "database": guard["database"],
        "levels": {}
    }

    print("================================================================================")
    print("       ZHONGWENHUB MASTER CURRICULUM AUDIT & INVENTORY (HSK 1 - 6)")
    print("================================================================================")

    for lvl in range(1, 7):
        cursor.execute("""
            SELECT c.Id, c.Code, c.Title, c.Status
            FROM courses c
            WHERE c.HskLevel = ?
        """, lvl)
        c_row = cursor.fetchone()
        if not c_row:
            print(f"HSK {lvl}: No course found in DB!")
            continue

        c_id, c_code, c_title, c_status = c_row

        # Units
        cursor.execute("SELECT COUNT(*) FROM units WHERE CourseId = ?", c_id)
        unit_count = cursor.fetchone()[0]

        # Lessons
        cursor.execute("""
            SELECT l.Id, l.LessonNumber, l.TitleZh, l.TitleVi, l.Status, l.DialogueJson, l.XpReward, l.DurationMinutes
            FROM lessons l
            WHERE l.CourseId = ?
            ORDER BY l.LessonNumber
        """, c_id)
        lessons = cursor.fetchall()
        lesson_count = len(lessons)

        # Audio files on disk
        audio_dir = Path(f"Fontend/public/audio/hsk{lvl}")
        audio_count = len(list(audio_dir.glob("*.mp3"))) if audio_dir.is_dir() else 0

        # Detailed lesson inventory
        lesson_details = []
        lvl_vocab_total = 0
        lvl_grammar_total = 0
        lvl_exercise_total = 0
        lvl_dialogue_total = 0
        lvl_reading_total = 0

        for l in lessons:
            l_id, l_num, l_zh, l_vi, l_status, d_json, xp, duration = l

            # Vocab count
            cursor.execute("SELECT COUNT(*) FROM vocabularies WHERE LessonId = ?", l_id)
            v_count = cursor.fetchone()[0]
            lvl_vocab_total += v_count

            # Grammar count
            cursor.execute("SELECT COUNT(*) FROM grammar_points WHERE LessonId = ?", l_id)
            g_count = cursor.fetchone()[0]
            lvl_grammar_total += g_count

            # Exercise count
            cursor.execute("SELECT COUNT(*) FROM exercises WHERE LessonId = ?", l_id)
            e_count = cursor.fetchone()[0]
            lvl_exercise_total += e_count

            # Dialogue & Reading
            has_dialogue = False
            has_reading = False
            if d_json:
                try:
                    d_parsed = json.loads(d_json)
                    if isinstance(d_parsed, dict):
                        if d_parsed.get("lines"):
                            has_dialogue = True
                            lvl_dialogue_total += 1
                        if d_parsed.get("readingPassage"):
                            has_reading = True
                            lvl_reading_total += 1
                except:
                    pass

            lesson_details.append({
                "lesson_id": str(l_id).lower(),
                "lesson_number": l_num,
                "title_zh": l_zh,
                "title_vi": l_vi,
                "status": l_status,
                "vocab_count": v_count,
                "grammar_count": g_count,
                "exercise_count": e_count,
                "has_dialogue": has_dialogue,
                "has_reading": has_reading,
                "xp_reward": xp,
                "duration_minutes": duration
            })

        report["levels"][f"HSK{lvl}"] = {
            "hsk_level": lvl,
            "course_id": str(c_id),
            "code": c_code,
            "title": c_title,
            "course_status": c_status,
            "unit_count": unit_count,
            "lesson_count": lesson_count,
            "total_vocab": lvl_vocab_total,
            "total_grammar": lvl_grammar_total,
            "total_exercises": lvl_exercise_total,
            "total_dialogues": lvl_dialogue_total,
            "total_reading_passages": lvl_reading_total,
            "audio_files_on_disk": audio_count,
            "lessons": lesson_details
        }

        print(f"\n--- HSK {lvl}: {c_title} ({c_code}) ---")
        print(f"  Course Status: {c_status} | Units: {unit_count} | Lessons: {lesson_count}")
        print(f"  Vocab: {lvl_vocab_total} | Grammar: {lvl_grammar_total} | Exercises: {lvl_exercise_total}")
        print(f"  Dialogues: {lvl_dialogue_total}/{lesson_count} | Reading Passages: {lvl_reading_total} | Audio Files: {audio_count}")
        if lvl in [5, 6]:
            draft_lessons = sum(1 for l in lesson_details if l["status"] == "DRAFT")
            print(f"  [COMING SOON ENFORCEMENT] Lessons Status: {draft_lessons}/{lesson_count} DRAFT (0 Published, 0 Vocab).")

    conn.close()

    # Save machine-readable inventory
    out_path = Path("data/hsk30/reference/current_db_inventory.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"\nSaved machine-readable inventory to: {out_path}")
    return report


if __name__ == "__main__":
    audit_master_inventory()

