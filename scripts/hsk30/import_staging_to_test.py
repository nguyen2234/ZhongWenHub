# -*- coding: utf-8 -*-
"""
ZhongWenHub Phase 9.1C — Task 10: Staging Data Import & Rollback Readiness
Strictly executes on ZhongWenHub_Test database only.
Never connects or writes to ZhongWenHub_Dev.
"""

import sys
import json
import argparse
from pathlib import Path
from db_safety_guard import connect_test_database, assert_safe_test_connection

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def run_import(mode="dry-run"):
    print(f"=== ZHONGWENHUB PHASE 9.1C: STAGING IMPORT TO TEST DB (Mode: {mode.upper()}) ===")

    # 1. Strict Database Guard Check
    conn = connect_test_database()
    guard = assert_safe_test_connection(conn)
    print(f"Verified Safe Connection: Database='{guard['database']}', Server='{guard['server']}'")

    # 2. Paths
    vocab_file = Path("data/hsk30/staging/hsk1_vocabulary_examples.json")
    exercise_file = Path("data/hsk30/staging/hsk1_exercises.json")
    passage_file = Path("data/hsk30/staging/hsk1_reading_passages.json")

    with open(vocab_file, "r", encoding="utf-8") as f:
        vocab_entries = json.load(f)
    with open(exercise_file, "r", encoding="utf-8") as f:
        exercise_entries = json.load(f)
    with open(passage_file, "r", encoding="utf-8") as f:
        passage_entries = json.load(f)

    cursor = conn.cursor()

    try:
        if mode == "rollback":
            print("\n--- Executing Rollback / Cleanup Mode on ZhongWenHub_Test ---")
            # Remove staging exercises
            staging_ids = [ex["id"] for ex in exercise_entries]
            placeholders = ",".join(["?"] * len(staging_ids))
            cursor.execute(f"DELETE FROM exercises WHERE Id IN ({placeholders})", staging_ids)
            deleted_ex = cursor.rowcount
            print(f"Deleted {deleted_ex} staged exercises.")

            # Clear reading passage from DialogueJson on test lessons
            cursor.execute("""
                SELECT l.Id, l.DialogueJson 
                FROM lessons l 
                JOIN units u ON l.UnitId = u.Id 
                JOIN courses c ON u.CourseId = c.Id 
                WHERE c.HskLevel = 1 AND l.DialogueJson LIKE '%readingPassage%'
            """)
            rp_rows = cursor.fetchall()
            cleaned_lessons = 0
            for row in rp_rows:
                l_id, d_json = row
                try:
                    parsed = json.loads(d_json)
                    if "readingPassage" in parsed:
                        del parsed["readingPassage"]
                        cursor.execute("UPDATE lessons SET DialogueJson = ? WHERE Id = ?", (json.dumps(parsed, ensure_ascii=False), l_id))
                        cleaned_lessons += 1
                except Exception:
                    pass
            print(f"Cleaned reading passages from {cleaned_lessons} lessons.")
            conn.commit()
            print("Rollback completed successfully on ZhongWenHub_Test.")
            conn.close()
            return True

        # Resolve lesson GUIDs on target test database
        cursor.execute("""
            SELECT l.OrderIndex, LOWER(CAST(l.Id AS nvarchar(50))), l.DialogueJson
            FROM lessons l 
            JOIN units u ON l.UnitId = u.Id 
            JOIN courses c ON u.CourseId = c.Id 
            WHERE c.HskLevel = 1
        """)
        lessons_info = {row[0]: {"id": row[1], "dialogue": row[2]} for row in cursor.fetchall()}

        # 1. Update Vocabulary Examples
        print("\n[Step 1/3] Updating 291 Vocabulary Examples...")
        cursor.execute("SELECT Hanzi, LOWER(CAST(Id AS nvarchar(50))) FROM vocabularies WHERE HskLevel = 1")
        test_vocab = {row[0]: row[1] for row in cursor.fetchall()}
        vocab_updated = 0
        for v in vocab_entries:
            hanzi = v["hanzi"]
            if hanzi in test_vocab:
                cursor.execute("UPDATE vocabularies SET ExamplesJson = ? WHERE Id = ?", (v["examplesJson"], test_vocab[hanzi]))
                vocab_updated += 1
        print(f"  -> Updated ExamplesJson for {vocab_updated}/{len(vocab_entries)} vocabularies on Test DB.")

        # 2. Insert Staging Exercises
        print("\n[Step 2/3] Ingesting 32 Staging Exercises...")
        inserted_ex = 0
        insert_sql = """
            INSERT INTO exercises (
                Id, Type, Skill, HskLevel, Title, Instruction,
                PromptHanzi, PromptPinyin, PromptVietnamese, AudioUrl,
                OptionsJson, CorrectOptionIndex, CorrectAnswer, Explanation,
                XpReward, Status, LessonId, CreatedAt
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, GETUTCDATE()
            )
        """
        for ex in exercise_entries:
            lesson_num = ex["lessonNumber"]
            target_lesson_id = lessons_info[lesson_num]["id"] if lesson_num in lessons_info else ex["lessonId"].lower()
            
            # Check if exercise already exists
            cursor.execute("SELECT COUNT(*) FROM exercises WHERE Id = ?", (ex["id"],))
            if cursor.fetchone()[0] == 0:
                cursor.execute(insert_sql, (
                    ex["id"], ex["type"], ex["skill"], ex["hskLevel"], ex["title"], ex["instruction"],
                    ex["promptHanzi"], ex["promptPinyin"], ex["promptVietnamese"], ex["audioUrl"],
                    ex["optionsJson"], ex["correctOptionIndex"], ex["correctAnswer"], ex["explanation"],
                    ex["xpReward"], ex["status"], target_lesson_id
                ))
                inserted_ex += 1
        print(f"  -> Inserted {inserted_ex} new exercises.")

        # 3. Integrate Reading Passages into DialogueJson
        print("\n[Step 3/3] Injecting 6 Unit Reading Passages into DialogueJson...")
        injected_passages = 0
        for p in passage_entries:
            lesson_num = p["lessonNumber"]
            if lesson_num in lessons_info:
                l_id = lessons_info[lesson_num]["id"]
                current_diag = lessons_info[lesson_num]["dialogue"]
                diag_obj = {}
                if current_diag:
                    try:
                        diag_obj = json.loads(current_diag)
                    except Exception:
                        diag_obj = {"id": f"diag-{l_id}", "lines": []}
                else:
                    diag_obj = {"id": f"diag-{l_id}", "lines": []}

                diag_obj["readingPassage"] = p
                cursor.execute("UPDATE lessons SET DialogueJson = ? WHERE Id = ?", (json.dumps(diag_obj, ensure_ascii=False), l_id))
                injected_passages += 1
                print(f"  -> Injected reading passage into Lesson {lesson_num} ({p['titleZh']}).")

        if mode == "commit":
            conn.commit()
            print("\n>>> ALL STAGING DATA SUCCESSFULLY COMMITTED TO ZHONGWENHUB_TEST <<<")
        else:
            conn.rollback()
            print("\n>>> DRY RUN COMPLETED — TRANSACTION ROLLED BACK CLEANLY (ZERO DIRTY WRITES) <<<")

        conn.close()
        return True

    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"FATAL ERROR during import: {e}")
        raise e

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Staging Data Import to Test DB")
    parser.add_argument("--mode", choices=["dry-run", "commit", "rollback"], default="dry-run", help="Execution mode")
    args = parser.parse_args()
    success = run_import(mode=args.mode)
    sys.exit(0 if success else 1)
