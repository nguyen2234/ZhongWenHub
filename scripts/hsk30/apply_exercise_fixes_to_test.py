# -*- coding: utf-8 -*-
"""
ZhongWenHub Phase 9.1D — Task 2: Apply 14 Placeholder Exercise Fixes to Test DB
Strictly targets ZhongWenHub_Test. Zero-write to ZhongWenHub_Dev.
Supports dynamic ID matching by LessonNumber + Title for database independence.
"""

import sys
import json
import hashlib
import argparse
from pathlib import Path
from db_safety_guard import connect_test_database, assert_safe_test_connection

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def apply_fixes(mode="dry-run"):
    print(f"=== APPLYING 14 EXERCISE FIXES TO TEST DB (Mode: {mode.upper()}) ===")

    # 1. Database Safety Guard Check
    conn = connect_test_database()
    guard = assert_safe_test_connection(conn)
    print(f"Target Database: '{guard['database']}' on '{guard['server']}' (Guard Verified)")

    # 2. Load fixes file and verify checksum
    fix_file = Path("data/hsk30/staging/hsk1_existing_exercise_fixes.json")
    assert fix_file.exists(), f"Missing {fix_file}"

    with open(fix_file, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    fixes = manifest["fixes"]
    expected_hash = manifest["payloadSha256"]
    calculated_hash = hashlib.sha256(json.dumps(fixes, sort_keys=True, ensure_ascii=False).encode('utf-8')).hexdigest()
    assert calculated_hash == expected_hash, f"Integrity check failed: {calculated_hash} != {expected_hash}"
    print(f"Verified integrity: 14 fixes match SHA256 {expected_hash[:16]}...")

    cursor = conn.cursor()

    try:
        updated_count = 0
        already_patched_count = 0

        for fix in fixes:
            ex_id = fix["exerciseId"]
            lesson_num = fix["lessonNumber"]
            title = fix["title"]

            # Try exact ID match first
            cursor.execute("SELECT Id, Type, OptionsJson, CorrectAnswer, Explanation FROM exercises WHERE Id = ?", (ex_id,))
            row = cursor.fetchone()

            # If not found by ID, match dynamically by lessonNumber + title
            if not row:
                cursor.execute("""
                    SELECT e.Id, e.Type, e.OptionsJson, e.CorrectAnswer, e.Explanation
                    FROM exercises e
                    JOIN lessons l ON e.LessonId = l.Id
                    JOIN units u ON l.UnitId = u.Id
                    JOIN courses c ON u.CourseId = c.Id
                    WHERE c.HskLevel = 1 AND l.LessonNumber = ? AND (e.Title = ? OR ? LIKE e.Title + '%')
                """, (lesson_num, title, title))
                row = cursor.fetchone()

            if not row:
                print(f"WARNING: Exercise for Lesson {lesson_num} ('{title}') not found on Test DB!")
                continue

            target_id = row[0]
            current_opts_json = row[2]
            proposed_opts_json = json.dumps(fix["proposedOptions"], ensure_ascii=False)

            if current_opts_json == proposed_opts_json and row[3] == fix["proposedCorrectAnswer"]:
                already_patched_count += 1
                continue

            # Apply patch
            cursor.execute("""
                UPDATE exercises 
                SET Type = ?, Title = ?, Instruction = ?, OptionsJson = ?, 
                    CorrectOptionIndex = ?, CorrectAnswer = ?, Explanation = ?,
                    UpdatedAt = GETUTCDATE()
                WHERE Id = ?
            """, (
                fix["type"], fix["title"], fix["instruction"], proposed_opts_json,
                fix["correctOptionIndex"], fix["proposedCorrectAnswer"], fix["explanation"],
                target_id
            ))
            updated_count += 1
            print(f"  -> Patched Exercise {target_id} (L{fix['lessonNumber']}: {fix['lessonTitle']})")

        print(f"\nExecution summary: {updated_count} exercises updated, {already_patched_count} already patched.")

        # Verification step
        cursor.execute("""
            SELECT COUNT(*) 
            FROM exercises 
            WHERE HskLevel = 1 AND (OptionsJson LIKE '%Nghĩa khác%' OR OptionsJson LIKE '%nghĩa khác%')
        """)
        placeholders_remaining = cursor.fetchone()[0]
        print(f"Verification query: Placeholders remaining in HSK 1 exercises on Test DB = {placeholders_remaining}")
        assert placeholders_remaining == 0, f"Error: {placeholders_remaining} placeholders still remain!"

        if mode == "commit":
            conn.commit()
            print(">>> 14 EXERCISE FIXES SUCCESSFULLY COMMITTED TO ZHONGWENHUB_TEST <<<")
        else:
            conn.rollback()
            print(">>> DRY-RUN COMPLETE: TRANSACTION ROLLED BACK (ZERO WRITES) <<<")

        conn.close()
        return True

    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"FATAL ERROR during exercise patching: {e}")
        raise e

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Apply 14 Exercise Fixes to Test DB")
    parser.add_argument("--mode", choices=["dry-run", "commit"], default="dry-run")
    args = parser.parse_args()
    success = apply_fixes(mode=args.mode)
    sys.exit(0 if success else 1)
