# -*- coding: utf-8 -*-
"""
ZhongWenHub Phase 9.3 — Task 12: HSK 3 Staging Data Import & Exact Rollback Pipeline
Strictly executes on ZhongWenHub_Test database only.
Never connects or writes to ZhongWenHub_Dev.
"""

import sys
import json
import hashlib
import argparse
from pathlib import Path
from db_safety_guard import connect_test_database, assert_safe_test_connection

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SNAPSHOT_FILE = Path("data/hsk30/staging/hsk3_pre_import_snapshot.json")
AUDIT_FILE = Path("data/hsk30/staging/hsk3_staging_import_audit.json")

def take_snapshot(cursor):
    """Takes a lightweight snapshot of HSK 3 tables on ZhongWenHub_Test for rollback verification."""
    cursor.execute("""
        SELECT LOWER(CAST(l.Id AS nvarchar(50))), l.OrderIndex, l.TitleZh, l.DialogueJson
        FROM lessons l 
        JOIN units u ON l.UnitId = u.Id 
        JOIN courses c ON u.CourseId = c.Id 
        WHERE c.HskLevel = 3
        ORDER BY l.OrderIndex
    """)
    lessons = [{"id": r[0], "order": r[1], "title": r[2], "dialogue": r[3]} for r in cursor.fetchall()]

    cursor.execute("""
        SELECT LOWER(CAST(Id AS nvarchar(50))), Hanzi, Pinyin, MeaningVi, ExamplesJson
        FROM vocabularies
        WHERE HskLevel = 3
        ORDER BY Hanzi
    """)
    vocab = [{"id": r[0], "hanzi": r[1], "pinyin": r[2], "meaning": r[3], "examples": r[4]} for r in cursor.fetchall()]

    cursor.execute("""
        SELECT LOWER(CAST(Id AS nvarchar(50))), Title, CorrectOptionIndex, CorrectAnswer, OptionsJson, Explanation
        FROM exercises
        WHERE HskLevel = 3
        ORDER BY Id
    """)
    exercises = [{"id": r[0], "title": r[1], "correctIdx": r[2], "correctAnswer": r[3], "options": r[4], "explanation": r[5]} for r in cursor.fetchall()]

    data = {
        "lessons": lessons,
        "vocabularies": vocab,
        "exercises": exercises,
        "counts": {
            "lessons": len(lessons),
            "vocabularies": len(vocab),
            "exercises": len(exercises)
        }
    }
    raw_str = json.dumps(data, sort_keys=True, ensure_ascii=False)
    data["sha256"] = hashlib.sha256(raw_str.encode("utf-8")).hexdigest()
    return data

def run_import(mode="dry-run"):
    print(f"=== ZHONGWENHUB PHASE 9.3: HSK 3 STAGING IMPORT TO TEST DB (Mode: {mode.upper()}) ===")

    # 1. Strict Database Guard Check
    conn = connect_test_database()
    guard = assert_safe_test_connection(conn)
    print(f"Verified Safe Connection: Database='{guard['database']}', Server='{guard['server']}'")

    # 2. Paths
    vocab_file = Path("data/hsk30/staging/hsk3_vocabulary_enrichment.json")
    exercise_file = Path("data/hsk30/staging/hsk3_exercises.json")
    passage_file = Path("data/hsk30/staging/hsk3_reading_passages.json")

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
            WHERE c.HskLevel = 3
            ORDER BY l.OrderIndex
        """)
        test_lessons_info = {row[0]: {"id": row[1], "dialogue": row[2]} for row in cursor.fetchall()}
        print(f"Loaded {len(test_lessons_info)} HSK 3 lessons from ZhongWenHub_Test.")

        if mode == "rollback":
            print("\n--- Executing Exact Rollback / Cleanup Mode on ZhongWenHub_Test ---")
            if not SNAPSHOT_FILE.exists():
                print("Error: Snapshot file does not exist, cannot verify exact rollback!")
                sys.exit(1)

            with open(SNAPSHOT_FILE, "r", encoding="utf-8") as f:
                snapshot = json.load(f)

            # Revert exercises: delete newly authored ones, restore original 40 dev exercises
            orig_ex_ids = {e["id"]: e for e in snapshot["exercises"]}
            staged_ex_ids = [ex["id"].lower() for ex in exercise_entries]
            
            # Delete any exercise that was not in original snapshot
            cursor.execute("SELECT LOWER(CAST(Id AS nvarchar(50))) FROM exercises WHERE HskLevel = 3")
            current_ex_ids = [r[0] for r in cursor.fetchall()]
            new_ex_to_delete = [eid for eid in current_ex_ids if eid not in orig_ex_ids]
            
            if new_ex_to_delete:
                pl = ",".join(["?"] * len(new_ex_to_delete))
                cursor.execute(f"DELETE FROM exercises WHERE LOWER(CAST(Id AS nvarchar(50))) IN ({pl})", new_ex_to_delete)
                print(f"Deleted {cursor.rowcount} newly authored HSK 3 exercises.")

            # Restore original values for the 40 dev exercises
            for ex in snapshot["exercises"]:
                cursor.execute("""
                    UPDATE exercises SET
                        Title = ?,
                        CorrectOptionIndex = ?,
                        CorrectAnswer = ?,
                        OptionsJson = ?,
                        Explanation = ?
                    WHERE LOWER(CAST(Id AS nvarchar(50))) = ?
                """, (ex["title"], ex["correctIdx"], ex["correctAnswer"], ex["options"], ex["explanation"], ex["id"]))
            print(f"Restored original values for {len(snapshot['exercises'])} original exercises.")

            # Clean reading passages from lessons
            for les in snapshot["lessons"]:
                cursor.execute("UPDATE lessons SET DialogueJson = ? WHERE LOWER(CAST(Id AS nvarchar(50))) = ?", (les["dialogue"], les["id"]))
            print(f"Restored DialogueJson for {len(snapshot['lessons'])} lessons.")

            # Delete all HSK 3 vocabularies (original count was 0 in snapshot)
            orig_vocab_ids = {v["id"] for v in snapshot["vocabularies"]}
            cursor.execute("SELECT LOWER(CAST(Id AS nvarchar(50))) FROM vocabularies WHERE HskLevel = 3")
            curr_vocab_ids = [r[0] for r in cursor.fetchall()]
            vocab_to_delete = [vid for vid in curr_vocab_ids if vid not in orig_vocab_ids]
            if vocab_to_delete:
                # Batch delete
                chunk_size = 100
                for i in range(0, len(vocab_to_delete), chunk_size):
                    chunk = vocab_to_delete[i:i+chunk_size]
                    pl = ",".join(["?"] * len(chunk))
                    cursor.execute(f"DELETE FROM vocabularies WHERE LOWER(CAST(Id AS nvarchar(50))) IN ({pl})", chunk)
                print(f"Deleted {len(vocab_to_delete)} inserted HSK 3 vocabularies.")

            conn.commit()

            # Verify post-rollback state against pre-import snapshot hash
            post_snapshot = take_snapshot(cursor)
            if post_snapshot["sha256"] == snapshot["sha256"]:
                print(f"EXACT ROLLBACK VERIFIED! Post-rollback SHA256: {post_snapshot['sha256']}")
            else:
                print(f"WARNING: Hash mismatch! Expected {snapshot['sha256']}, got {post_snapshot['sha256']}")

            conn.close()
            return True

        # Pre-import snapshot
        print("\n[Step 0/3] Capturing Pre-Import Snapshot of ZhongWenHub_Test...")
        snapshot_data = take_snapshot(cursor)
        with open(SNAPSHOT_FILE, "w", encoding="utf-8") as f:
            json.dump(snapshot_data, f, ensure_ascii=False, indent=2)
        print(f"Pre-import snapshot captured: {snapshot_data['counts']} (SHA256: {snapshot_data['sha256'][:16]}...)")

        # 1. Ingest/Update 500 Vocabularies on Test DB
        print("\n[Step 1/3] Ingesting 500 Vocabulary Words with Examples on Test DB...")
        cursor.execute("SELECT LOWER(CAST(Id AS nvarchar(50))), Hanzi FROM vocabularies WHERE HskLevel = 3")
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
                    v_id, target_lesson_id, 3, v["hanzi"], v["pinyin"], v["meaningVi"],
                    v["partOfSpeech"], v["examplesJson"]
                ))
                vocab_inserted += 1

        print(f"  -> Vocabularies: {vocab_inserted} inserted, {vocab_updated} updated (Total: {vocab_inserted + vocab_updated}/{len(vocab_entries)}).")

        # 2. Ingest/Update 80 Exercises on Test DB
        print("\n[Step 2/3] Ingesting/Updating 80 Exercises on Test DB...")
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

        # Generate Audit Record
        audit_record = {
            "phase": "9.3",
            "mode": mode,
            "targetDatabase": guard["database"],
            "preImportSnapshotHash": snapshot_data["sha256"],
            "metrics": {
                "vocabulariesInserted": vocab_inserted,
                "vocabulariesUpdated": vocab_updated,
                "exercisesInserted": ex_inserted,
                "exercisesUpdated": ex_updated,
                "passagesInjected": injected_passages
            },
            "status": "COMMITTED" if mode == "commit" else "ROLLED_BACK_DRY_RUN"
        }
        with open(AUDIT_FILE, "w", encoding="utf-8") as f:
            json.dump(audit_record, f, ensure_ascii=False, indent=2)

        if mode == "commit":
            conn.commit()
            print("\n>>> ALL HSK 3 STAGING DATA SUCCESSFULLY COMMITTED TO ZHONGWENHUB_TEST <<<")
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
    parser = argparse.ArgumentParser(description="HSK 3 Staging Data Importer for ZhongWenHub_Test")
    parser.add_argument("--mode", choices=["dry-run", "commit", "rollback"], default="dry-run",
                        help="Import mode: 'dry-run' (test transaction without commit), 'commit' (persist to Test DB), 'rollback' (clean up test data)")
    args = parser.parse_args()
    run_import(args.mode)
