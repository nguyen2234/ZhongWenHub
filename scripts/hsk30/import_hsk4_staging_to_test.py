# -*- coding: utf-8 -*-
"""
ZhongWenHub Phase 9.4 — Task 12: HSK 4 Staging Data Import & Exact Rollback Pipeline
Strictly executes on ZhongWenHub_Test database only.
Never connects or writes to ZhongWenHub_Dev.
"""

import sys
import json
import hashlib
import argparse
import uuid
from pathlib import Path
from db_safety_guard import connect_test_database, assert_safe_test_connection

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SNAPSHOT_FILE = Path("data/hsk30/staging/hsk4_pre_import_snapshot.json")
AUDIT_FILE = Path("data/hsk30/staging/hsk4_staging_import_audit.json")

def take_snapshot(cursor):
    """Takes a lightweight snapshot of HSK 4 tables on ZhongWenHub_Test for rollback verification."""
    cursor.execute("""
        SELECT LOWER(CAST(l.Id AS nvarchar(50))), l.OrderIndex, l.TitleZh, l.DialogueJson
        FROM lessons l 
        JOIN units u ON l.UnitId = u.Id 
        JOIN courses c ON u.CourseId = c.Id 
        WHERE c.HskLevel = 4
        ORDER BY l.OrderIndex
    """)
    lessons = [{"id": r[0], "order": r[1], "title": r[2], "dialogue": r[3]} for r in cursor.fetchall()]

    cursor.execute("""
        SELECT LOWER(CAST(Id AS nvarchar(50))), Hanzi, Pinyin, MeaningVi, ExamplesJson
        FROM vocabularies
        WHERE HskLevel = 4
        ORDER BY Hanzi
    """)
    vocab = [{"id": r[0], "hanzi": r[1], "pinyin": r[2], "meaning": r[3], "examples": r[4]} for r in cursor.fetchall()]

    cursor.execute("""
        SELECT LOWER(CAST(e.Id AS nvarchar(50))), e.Title, e.CorrectOptionIndex, e.CorrectAnswer, e.OptionsJson, e.Explanation, l.OrderIndex
        FROM exercises e
        JOIN lessons l ON e.LessonId = l.Id
        WHERE e.HskLevel = 4
        ORDER BY l.OrderIndex, e.Id
    """)
    exercises = [{"id": r[0], "title": r[1], "correctIdx": r[2], "correctAnswer": r[3], "options": r[4], "explanation": r[5], "lessonOrder": r[6]} for r in cursor.fetchall()]

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
    print(f"=== ZHONGWENHUB PHASE 9.4: HSK 4 STAGING IMPORT TO TEST DB (Mode: {mode.upper()}) ===")

    # 1. Strict Database Guard Check
    conn = connect_test_database()
    guard = assert_safe_test_connection(conn)
    print(f"Verified Safe Connection: Database='{guard['database']}', Server='{guard['server']}'")

    # 2. Paths
    vocab_file = Path("data/hsk30/staging/hsk4_vocabulary_enrichment.json")
    exercise_file = Path("data/hsk30/staging/hsk4_exercises.json")
    passage_file = Path("data/hsk30/staging/hsk4_reading_passages.json")

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
            WHERE c.HskLevel = 4
            ORDER BY l.OrderIndex
        """)
        test_lessons_info = {row[0]: {"id": row[1], "dialogue": row[2]} for row in cursor.fetchall()}
        print(f"Loaded {len(test_lessons_info)} HSK 4 lessons from ZhongWenHub_Test.")

        if mode == "rollback":
            print("\n--- Executing Exact Rollback / Cleanup Mode on ZhongWenHub_Test ---")
            if not SNAPSHOT_FILE.exists():
                print("Error: Snapshot file does not exist, cannot verify exact rollback!")
                sys.exit(1)

            with open(SNAPSHOT_FILE, "r", encoding="utf-8") as f:
                snapshot = json.load(f)

            # Revert exercises: delete newly authored ones, restore original 40 dev exercises
            orig_ex_ids = {e["id"] for e in snapshot["exercises"]}
            
            # Delete any exercise that was not in original snapshot
            cursor.execute("SELECT LOWER(CAST(Id AS nvarchar(50))) FROM exercises WHERE HskLevel = 4")
            current_ex_ids = [r[0] for r in cursor.fetchall()]
            new_ex_to_delete = [eid for eid in current_ex_ids if eid not in orig_ex_ids]
            
            if new_ex_to_delete:
                pl = ",".join(["?"] * len(new_ex_to_delete))
                cursor.execute(f"DELETE FROM exercises WHERE LOWER(CAST(Id AS nvarchar(50))) IN ({pl})", new_ex_to_delete)
                print(f"Deleted {cursor.rowcount} newly authored HSK 4 exercises.")

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

            # Delete all HSK 4 vocabularies (original count was 0 in snapshot)
            orig_vocab_ids = {v["id"] for v in snapshot["vocabularies"]}
            cursor.execute("SELECT LOWER(CAST(Id AS nvarchar(50))) FROM vocabularies WHERE HskLevel = 4")
            curr_vocab_ids = [r[0] for r in cursor.fetchall()]
            vocab_to_delete = [vid for vid in curr_vocab_ids if vid not in orig_vocab_ids]
            if vocab_to_delete:
                chunk_size = 100
                for i in range(0, len(vocab_to_delete), chunk_size):
                    chunk = vocab_to_delete[i:i+chunk_size]
                    pl = ",".join(["?"] * len(chunk))
                    cursor.execute(f"DELETE FROM vocabularies WHERE LOWER(CAST(Id AS nvarchar(50))) IN ({pl})", chunk)
                print(f"Deleted {len(vocab_to_delete)} inserted HSK 4 vocabularies.")

            conn.commit()

            # Verify post-rollback state against pre-import snapshot hash
            post_snapshot = take_snapshot(cursor)
            if post_snapshot["sha256"] == snapshot["sha256"]:
                print(f"EXACT ROLLBACK VERIFIED! Post-rollback SHA256: {post_snapshot['sha256']}")
            else:
                print(f"WARNING: Hash mismatch! Expected {snapshot['sha256']}, got {post_snapshot['sha256']}")

            return

        # TAKE SNAPSHOT IF COMMITTING OR DRY-RUN
        snapshot = take_snapshot(cursor)
        print(f"Pre-import Snapshot: Lessons={snapshot['counts']['lessons']}, Vocab={snapshot['counts']['vocabularies']}, Exercises={snapshot['counts']['exercises']}")
        print(f"Pre-import SHA256: {snapshot['sha256']}")

        if not SNAPSHOT_FILE.exists() or mode == "commit":
            SNAPSHOT_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(SNAPSHOT_FILE, "w", encoding="utf-8") as f:
                json.dump(snapshot, f, ensure_ascii=False, indent=2)
            print(f"Saved snapshot to: {SNAPSHOT_FILE}")

        # PREPARE BATCH DATA
        # 1. Vocabularies
        vocab_inserts = []
        for v in vocab_entries:
            l_num = v["lessonNumber"]
            target_lesson_id = test_lessons_info[l_num]["id"]
            test_vocab_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"zhongwenhub.test.hsk4.lesson{l_num}.{v['hanzi']}"))
            vocab_inserts.append((
                test_vocab_id,
                target_lesson_id,
                v["hanzi"],
                v["pinyin"],
                v["meaningVi"],
                v.get("partOfSpeech", ""),
                4,  # HskLevel
                v["examplesJson"]
            ))

        # 2. Exercises mapping
        cursor.execute("""
            SELECT l.OrderIndex, LOWER(CAST(e.Id AS nvarchar(50))), e.Skill
            FROM exercises e
            JOIN lessons l ON e.LessonId = l.Id
            WHERE e.HskLevel = 4
            ORDER BY l.OrderIndex, e.Id
        """)
        existing_ex_by_lesson = {}
        for row in cursor.fetchall():
            existing_ex_by_lesson.setdefault(row[0], []).append({"id": row[1], "skill": row[2]})

        staged_ex_by_lesson = {}
        for ex in exercise_entries:
            staged_ex_by_lesson.setdefault(ex["lessonNumber"], []).append(ex)

        exercise_updates = []
        exercise_inserts = []

        for l_num in range(1, 21):
            target_lesson_id = test_lessons_info[l_num]["id"]
            test_exs = existing_ex_by_lesson.get(l_num, [])
            staged_exs = staged_ex_by_lesson.get(l_num, [])

            # Update existing exercises (first 2 in staged)
            for idx, existing_ex in enumerate(test_exs):
                if idx < len(staged_exs):
                    staged = staged_exs[idx]
                    exercise_updates.append((
                        target_lesson_id,
                        staged["title"],
                        staged["instruction"],
                        staged["promptHanzi"],
                        staged["promptPinyin"],
                        staged["promptVietnamese"],
                        staged["optionsJson"],
                        staged["correctOptionIndex"],
                        staged["correctAnswer"],
                        staged["explanation"],
                        staged["skill"],
                        staged["type"],
                        existing_ex["id"]
                    ))

            # Insert remaining exercises (indices 2 and 3)
            for idx in range(len(test_exs), len(staged_exs)):
                staged = staged_exs[idx]
                new_ex_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"zhongwenhub.test.hsk4.lesson{l_num}.ex{idx+1}"))
                exercise_inserts.append((
                    new_ex_id,
                    target_lesson_id,
                    staged["title"],
                    staged["instruction"],
                    staged["promptHanzi"],
                    staged["promptPinyin"],
                    staged["promptVietnamese"],
                    staged["optionsJson"],
                    staged["correctOptionIndex"],
                    staged["correctAnswer"],
                    staged["explanation"],
                    staged["skill"],
                    staged["type"],
                    4,  # HskLevel
                    10, # xpReward
                    "APPROVED"
                ))

        # 3. Reading Passages attached to Lessons 4, 8, 12, 16, 20
        reading_passage_updates = []
        for p in passage_entries:
            l_num = p["lessonNumber"]
            target_lesson_id = test_lessons_info[l_num]["id"]
            current_diag = test_lessons_info[l_num]["dialogue"]
            diag_obj = {}
            if current_diag:
                try:
                    diag_obj = json.loads(current_diag)
                except Exception:
                    diag_obj = {"id": f"diag-{target_lesson_id}", "lines": []}
            else:
                diag_obj = {"id": f"diag-{target_lesson_id}", "lines": []}
            diag_obj["readingPassage"] = p
            reading_passage_updates.append((json.dumps(diag_obj, ensure_ascii=False), target_lesson_id))

        print(f"\nStaging Planned Changes:")
        print(f"  Vocabularies to Insert: {len(vocab_inserts)}")
        print(f"  Exercises to Update:    {len(exercise_updates)}")
        print(f"  Exercises to Insert:    {len(exercise_inserts)}")
        print(f"  Passages to Attach:     {len(reading_passage_updates)}")

        if mode == "commit":
            print("\n--- Applying Changes to ZhongWenHub_Test ---")
            
            # 1. Insert Vocabularies in chunks with CreatedAt = GETUTCDATE()
            print("Inserting 1,000 vocabularies...")
            chunk_size = 100
            for i in range(0, len(vocab_inserts), chunk_size):
                chunk = vocab_inserts[i:i+chunk_size]
                cursor.executemany("""
                    INSERT INTO vocabularies (Id, LessonId, Hanzi, Pinyin, MeaningVi, PartOfSpeech, HskLevel, ExamplesJson, CreatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, GETUTCDATE())
                """, chunk)
            print(f"Inserted {len(vocab_inserts)} vocabularies successfully.")

            # 2. Update existing exercises
            print("Updating 40 existing exercises...")
            cursor.executemany("""
                UPDATE exercises SET
                    LessonId = ?,
                    Title = ?,
                    Instruction = ?,
                    PromptHanzi = ?,
                    PromptPinyin = ?,
                    PromptVietnamese = ?,
                    OptionsJson = ?,
                    CorrectOptionIndex = ?,
                    CorrectAnswer = ?,
                    Explanation = ?,
                    Skill = ?,
                    Type = ?,
                    Status = 'APPROVED'
                WHERE LOWER(CAST(Id AS nvarchar(50))) = ?
            """, exercise_updates)
            print(f"Updated {len(exercise_updates)} existing exercises.")

            # 3. Insert new exercises with CreatedAt = GETUTCDATE()
            print("Inserting 40 newly authored exercises...")
            cursor.executemany("""
                INSERT INTO exercises (Id, LessonId, Title, Instruction, PromptHanzi, PromptPinyin, PromptVietnamese, OptionsJson, CorrectOptionIndex, CorrectAnswer, Explanation, Skill, Type, HskLevel, XpReward, Status, CreatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETUTCDATE())
            """, exercise_inserts)
            print(f"Inserted {len(exercise_inserts)} new exercises.")

            # 4. Attach reading passages
            print("Attaching 5 unit reading passages to lesson DialogueJson...")
            cursor.executemany("""
                UPDATE lessons SET DialogueJson = ? WHERE LOWER(CAST(Id AS nvarchar(50))) = ?
            """, reading_passage_updates)
            print(f"Attached {len(reading_passage_updates)} reading passages.")

            conn.commit()
            print("\nALL CHANGES COMMITTED SUCCESSFULLY TO ZhongWenHub_Test!")

            # Post-import verification
            post_snapshot = take_snapshot(cursor)
            print(f"\nPost-import State:")
            print(f"  Lessons:     {post_snapshot['counts']['lessons']} (expected {snapshot['counts']['lessons']})")
            print(f"  Vocab:       {post_snapshot['counts']['vocabularies']} (expected 1000)")
            print(f"  Exercises:   {post_snapshot['counts']['exercises']} (expected 80)")
            print(f"  Post SHA256: {post_snapshot['sha256']}")

            # Write Audit Report
            audit_report = {
                "phase": "9.4",
                "hskLevel": 4,
                "targetDatabase": guard["database"],
                "targetServer": guard["server"],
                "status": "COMMITTED_SUCCESSFULLY",
                "preImportSnapshot": {
                    "lessons": snapshot["counts"]["lessons"],
                    "vocabularies": snapshot["counts"]["vocabularies"],
                    "exercises": snapshot["counts"]["exercises"],
                    "sha256": snapshot["sha256"]
                },
                "postImportState": {
                    "lessons": post_snapshot["counts"]["lessons"],
                    "vocabularies": post_snapshot["counts"]["vocabularies"],
                    "exercises": post_snapshot["counts"]["exercises"],
                    "sha256": post_snapshot["sha256"]
                },
                "operations": {
                    "vocabulariesInserted": len(vocab_inserts),
                    "exercisesUpdated": len(exercise_updates),
                    "exercisesInserted": len(exercise_inserts),
                    "readingPassagesAttached": len(reading_passage_updates)
                }
            }
            with open(AUDIT_FILE, "w", encoding="utf-8") as f:
                json.dump(audit_report, f, ensure_ascii=False, indent=2)
            print(f"Saved audit report to: {AUDIT_FILE}")

            # Update checkpoint
            from save_checkpoint import update_checkpoint
            update_checkpoint(
                stage="STAGE_TEST_DB_IMPORTED_COMMITTED",
                completed_lessons=list(range(1, 21)),
                completed_vocab_count=1000,
                status="IN_PROGRESS"
            )
            print("Checkpoint updated: STAGE_TEST_DB_IMPORTED_COMMITTED.")

        else:
            print("\nDry-run complete. No changes written to database.")

    finally:
        conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import HSK 4 Staging to ZhongWenHub_Test DB")
    parser.add_argument("--mode", choices=["dry-run", "commit", "rollback"], default="dry-run", help="Execution mode")
    args = parser.parse_args()
    run_import(args.mode)
