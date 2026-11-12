# -*- coding: utf-8 -*-
"""
Staging Validation on Test Database
Phase 9.1B — Task H

Validates all 3 staging data files against ZhongWenHub_Test:
1. data/hsk30/staging/hsk1_vocabulary_examples.json (291 items)
2. data/hsk30/staging/hsk1_exercises.json (32 items)
3. data/hsk30/staging/hsk1_reading_passages.json (6 items)

STRICT GUARD: Refuses to run against ZhongWenHub_Dev!
"""

import sys
import json
import pyodbc
from pathlib import Path
from db_safety_guard import connect_test_database, assert_safe_test_connection

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def validate_staging_on_test():
    print("=== ZHONGWENHUB PHASE 9.1C: STAGING VALIDATION ON TEST DB ===")

    # 1. Strict Database Guard Check with live DB_NAME() verification
    conn = connect_test_database()
    guard_info = assert_safe_test_connection(conn)
    print(f"Target Database: {guard_info['database']} on {guard_info['server']} (Verified Guard Passed)")

    # 2. Load Staging Files
    vocab_file = Path("data/hsk30/staging/hsk1_vocabulary_examples.json")
    exercise_file = Path("data/hsk30/staging/hsk1_exercises.json")
    passage_file = Path("data/hsk30/staging/hsk1_reading_passages.json")

    assert vocab_file.exists(), f"Missing {vocab_file}"
    assert exercise_file.exists(), f"Missing {exercise_file}"
    assert passage_file.exists(), f"Missing {passage_file}"

    with open(vocab_file, "r", encoding="utf-8") as f:
        vocab_entries = json.load(f)
    with open(exercise_file, "r", encoding="utf-8") as f:
        exercise_entries = json.load(f)
    with open(passage_file, "r", encoding="utf-8") as f:
        passage_entries = json.load(f)

    print(f"Loaded staging data: {len(vocab_entries)} vocab examples, {len(exercise_entries)} exercises, {len(passage_entries)} reading passages.")

    cursor = conn.cursor()

    try:
        # A. Validate Vocabulary Examples
        print("\n--- A. Validating 291 Vocabulary Examples ---")
        cursor.execute("SELECT Hanzi, LOWER(CAST(Id AS nvarchar(50))) FROM vocabularies WHERE HskLevel=1")
        existing_vocab_by_hanzi = {row[0]: row[1] for row in cursor.fetchall()}
        print(f"Existing HSK 1 vocabularies in ZhongWenHub_Test: {len(existing_vocab_by_hanzi)}")

        matched_vocab = 0
        json_valid_count = 0
        for v in vocab_entries:
            hanzi = v["hanzi"]
            ex_json = v["examplesJson"]
            # Validate JSON parseable
            parsed = json.loads(ex_json)
            assert isinstance(parsed, list) and len(parsed) > 0
            assert "zh" in parsed[0] and "pinyin" in parsed[0] and "meaningVi" in parsed[0]
            json_valid_count += 1
            if hanzi in existing_vocab_by_hanzi:
                matched_vocab += 1
                # Dry-run update
                cursor.execute(
                    "UPDATE vocabularies SET ExamplesJson = ? WHERE Id = ?",
                    (ex_json, existing_vocab_by_hanzi[hanzi])
                )

        print(f"Valid JSON syntax: {json_valid_count}/{len(vocab_entries)} (100%)")
        print(f"Matching Hanzi updated in Test DB dry-run: {matched_vocab}/{len(vocab_entries)}")

        # B. Validate Exercises Ingestion
        print("\n--- B. Validating 32 Exercises Ingestion Dry-Run ---")
        cursor.execute("SELECT l.OrderIndex, LOWER(CAST(l.Id AS nvarchar(50))) FROM lessons l JOIN units u ON l.UnitId = u.Id JOIN courses c ON u.CourseId = c.Id WHERE c.HskLevel = 1")
        test_lessons_by_order = {row[0]: row[1] for row in cursor.fetchall()}
        print(f"HSK 1 lessons found in ZhongWenHub_Test: {len(test_lessons_by_order)}")

        inserted_exercises = 0
        for ex in exercise_entries:
            lesson_num = ex["lessonNumber"]
            target_lesson_id = test_lessons_by_order.get(lesson_num, ex["lessonId"].lower())

            # Dry-run insert into exercises table
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
            cursor.execute(insert_sql, (
                ex["id"], ex["type"], ex["skill"], ex["hskLevel"], ex["title"], ex["instruction"],
                ex["promptHanzi"], ex["promptPinyin"], ex["promptVietnamese"], ex["audioUrl"],
                ex["optionsJson"], ex["correctOptionIndex"], ex["correctAnswer"], ex["explanation"],
                ex["xpReward"], ex["status"], target_lesson_id
            ))
            inserted_exercises += 1

        print(f"Successfully dry-run inserted {inserted_exercises}/32 exercises without constraint errors.")

        # C. Validate Reading Passages
        print("\n--- C. Validating 6 Reading Passages ---")
        for p in passage_entries:
            lesson_num = p["lessonNumber"]
            assert lesson_num in test_lessons_by_order, f"Reading passage references non-existent lesson #{lesson_num}"
            assert p["characterCount"] >= 20, "Passage too short"
            assert len(p["comprehensionQuestions"]) >= 1, "Must have comprehension question"
            print(f"  Unit {p['unitNumber']} (Lesson {p['lessonNumber']}): '{p['titleZh']}' ({p['characterCount']} chars) - Validated OK.")

        # Dry-run rollback so test DB remains clean
        conn.rollback()
        print("\nTransaction rolled back cleanly: 0 dirty state left in Test DB.")
        print("ALL STAGING DATA VALIDATION PASSED WITH 100% SUCCESS!")

    except Exception as e:
        conn.rollback()
        print(f"ERROR DURING VALIDATION: {e}")
        conn.close()
        raise e

    conn.close()
    return True

if __name__ == "__main__":
    success = validate_staging_on_test()
    sys.exit(0 if success else 1)
