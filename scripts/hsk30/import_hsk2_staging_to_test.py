# -*- coding: utf-8 -*-
"""
ZhongWenHub Phase 9.2 — Task 10: HSK 2 Staging Data Import & Rollback Pipeline
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
    print(f"=== ZHONGWENHUB PHASE 9.2: HSK 2 STAGING IMPORT TO TEST DB (Mode: {mode.upper()}) ===")

    # 1. Strict Database Guard Check
    conn = connect_test_database()
    guard = assert_safe_test_connection(conn)
    print(f"Verified Safe Connection: Database='{guard['database']}', Server='{guard['server']}'")

    # 2. Paths
    vocab_file = Path("data/hsk30/staging/hsk2_vocabulary_enrichment.json")
    exercise_file = Path("data/hsk30/staging/hsk2_exercises.json")
    passage_file = Path("data/hsk30/staging/hsk2_reading_passages.json")

    with open(vocab_file, "r", encoding="utf-8") as f:
        vocab_entries = json.load(f)
    with open(exercise_file, "r", encoding="utf-8") as f:
        exercise_entries = json.load(f)
    with open(passage_file, "r", encoding="utf-8") as f:
        passage_entries = json.load(f)

    cursor = conn.cursor()

    try:
        # Resolve lesson GUIDs on target test database
        cursor.execute("""
            SELECT l.OrderIndex, LOWER(CAST(l.Id AS nvarchar(50))), l.DialogueJson
            FROM lessons l 
            JOIN units u ON l.UnitId = u.Id 
            JOIN courses c ON u.CourseId = c.Id 
            WHERE c.HskLevel = 2
            ORDER BY l.OrderIndex
        """)
        test_lessons_info = {row[0]: {"id": row[1], "dialogue": row[2]} for row in cursor.fetchall()}
        print(f"Loaded {len(test_lessons_info)} HSK 2 lessons from ZhongWenHub_Test.")

        if mode == "rollback":
            print("\n--- Executing Rollback / Cleanup Mode on ZhongWenHub_Test ---")
            # Remove staged exercises
            staged_ids = [ex["id"] for ex in exercise_entries]
            placeholders = ",".join(["?"] * len(staged_ids))
            cursor.execute(f"DELETE FROM exercises WHERE Id IN ({placeholders})", staged_ids)
            deleted_ex = cursor.rowcount
            print(f"Deleted {deleted_ex} staged HSK 2 exercises.")

            # Clear reading passage from DialogueJson on test lessons
            cursor.execute("""
                SELECT l.Id, l.DialogueJson 
                FROM lessons l 
                JOIN units u ON l.UnitId = u.Id 
                JOIN courses c ON u.CourseId = c.Id 
                WHERE c.HskLevel = 2 AND l.DialogueJson LIKE '%readingPassage%'
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

            # Delete the staged vocabularies that were inserted
            staged_vocab_ids = [v["devId"] for v in vocab_entries]
            v_placeholders = ",".join(["?"] * len(staged_vocab_ids))
            cursor.execute(f"DELETE FROM vocabularies WHERE Id IN ({v_placeholders})", staged_vocab_ids)
            deleted_vocab = cursor.rowcount
            print(f"Deleted {deleted_vocab} staged HSK 2 vocabularies.")

            conn.commit()
            print("Rollback completed successfully on ZhongWenHub_Test.")
            conn.close()
            return True

        # 1. Ingest/Update 200 Vocabularies on Test DB
        print("\n[Step 1/3] Ingesting/Updating 200 Vocabulary Examples on Test DB...")
        cursor.execute("SELECT LOWER(CAST(Id AS nvarchar(50))), Hanzi FROM vocabularies WHERE HskLevel = 2")
        existing_test_vocab = {row[0]: row[1] for row in cursor.fetchall()}
        existing_hanzi = {row[1]: row[0] for row in existing_test_vocab.items()}

        insert_vocab_sql = """
            INSERT INTO vocabularies (
                Id, LessonId, HskLevel, Hanzi, Pinyin, MeaningVi,
                PartOfSpeech, ExamplesJson, CreatedAt
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, GETUTCDATE()
            )
        """
        update_vocab_sql = """
            UPDATE vocabularies SET
                LessonId = ?,
                MeaningVi = ?,
                PartOfSpeech = ?,
                ExamplesJson = ?
            WHERE Id = ?
        """

        vocab_inserted = 0
        vocab_updated = 0

        for v in vocab_entries:
            v_id = v["devId"].lower()
            l_num = v["lessonNumber"]
            target_lesson_id = test_lessons_info[l_num]["id"]

            if v_id in existing_test_vocab:
                cursor.execute(update_vocab_sql, (
                    target_lesson_id, v["meaningVi"], v["partOfSpeech"], v["examplesJson"], v_id
                ))
                vocab_updated += 1
            elif v["hanzi"] in existing_hanzi:
                target_id = existing_hanzi[v["hanzi"]]
                cursor.execute(update_vocab_sql, (
                    target_lesson_id, v["meaningVi"], v["partOfSpeech"], v["examplesJson"], target_id
                ))
                vocab_updated += 1
            else:
                cursor.execute(insert_vocab_sql, (
                    v_id, target_lesson_id, 2, v["hanzi"], v["pinyin"], v["meaningVi"],
                    v["partOfSpeech"], v["examplesJson"]
                ))
                vocab_inserted += 1

        print(f"  -> Vocabularies: {vocab_inserted} inserted, {vocab_updated} updated (Total: {vocab_inserted + vocab_updated}/{len(vocab_entries)}).")

        # 2. Ingest/Update 60 Exercises on Test DB
        print("\n[Step 2/3] Ingesting/Updating 60 Exercises on Test DB...")
        insert_ex_sql = """
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
        update_ex_sql = """
            UPDATE exercises SET
                Type = ?,
                Skill = ?,
                Title = ?,
                Instruction = ?,
                PromptHanzi = ?,
                PromptPinyin = ?,
                PromptVietnamese = ?,
                OptionsJson = ?,
                CorrectOptionIndex = ?,
                CorrectAnswer = ?,
                Explanation = ?,
                LessonId = ?
            WHERE Id = ?
        """

        ex_inserted = 0
        ex_updated = 0

        for ex in exercise_entries:
            ex_id = ex["id"].lower()
            l_num = ex["lessonNumber"]
            target_lesson_id = test_lessons_info[l_num]["id"]

            cursor.execute("SELECT COUNT(*) FROM exercises WHERE LOWER(CAST(Id AS nvarchar(50))) = ?", (ex_id,))
            exists = cursor.fetchone()[0] > 0

            if exists:
                cursor.execute(update_ex_sql, (
                    ex["type"], ex["skill"], ex["title"], ex["instruction"],
                    ex["promptHanzi"], ex["promptPinyin"], ex["promptVietnamese"],
                    ex["optionsJson"], ex["correctOptionIndex"], ex["correctAnswer"], ex["explanation"],
                    target_lesson_id, ex_id
                ))
                ex_updated += 1
            else:
                cursor.execute(insert_ex_sql, (
                    ex_id, ex["type"], ex["skill"], ex["hskLevel"], ex["title"], ex["instruction"],
                    ex["promptHanzi"], ex["promptPinyin"], ex["promptVietnamese"], ex["audioUrl"],
                    ex["optionsJson"], ex["correctOptionIndex"], ex["correctAnswer"], ex["explanation"],
                    ex["xpReward"], ex["status"], target_lesson_id
                ))
                ex_inserted += 1

        print(f"  -> Exercises: {ex_inserted} inserted, {ex_updated} updated (Total: {ex_inserted + ex_updated}/{len(exercise_entries)}).")

        # 3. Inject Reading Passages into DialogueJson
        print("\n[Step 3/3] Injecting 5 Reading Passages into DialogueJson on Test DB...")
        injected_passages = 0
        for p in passage_entries:
            l_num = p["lessonNumber"]
            if l_num in test_lessons_info:
                l_id = test_lessons_info[l_num]["id"]
                current_diag = test_lessons_info[l_num]["dialogue"]
                diag_obj = {}
                if current_diag:
                    try:
                        diag_obj = json.loads(current_diag)
                    except Exception:
                        diag_obj = {"id": f"diag-{l_id}", "lines": []}
                else:
                    diag_obj = {"id": f"diag-{l_id}", "lines": []}

                diag_obj["readingPassage"] = p
                cursor.execute("UPDATE lessons SET DialogueJson = ? WHERE LOWER(CAST(Id AS nvarchar(50))) = ?", (json.dumps(diag_obj, ensure_ascii=False), l_id))
                injected_passages += 1
                print(f"  -> Injected reading passage into Lesson {l_num} ({p['titleZh']}).")

        if mode == "commit":
            conn.commit()
            print("\n>>> ALL HSK 2 STAGING DATA SUCCESSFULLY COMMITTED TO ZHONGWENHUB_TEST <<<")
        else:
            conn.rollback()
            print("\n>>> DRY RUN COMPLETED — TRANSACTION ROLLED BACK CLEANLY (ZERO DIRTY WRITES) <<<")

        conn.close()
        return True

    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"\nERROR during staging import: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HSK 2 Staging Data Importer for ZhongWenHub_Test")
    parser.add_argument("--mode", choices=["dry-run", "commit", "rollback"], default="dry-run",
                        help="Import mode: 'dry-run' (test transaction without commit), 'commit' (persist to Test DB), 'rollback' (clean up test data)")
    args = parser.parse_args()
    run_import(args.mode)
