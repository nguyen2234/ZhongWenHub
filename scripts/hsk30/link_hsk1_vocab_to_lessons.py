#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ZhongWenHub — HSK 1 Vocabulary to Lesson Linker
Safely links 300 HSK 1 vocabularies to their corresponding 15 lessons on ZhongWenHub_Test.
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


def link_hsk1_vocabularies():
    print("=== ZHONGWENHUB HSK 1 VOCABULARY TO LESSON LINKER ===")
    
    # 1. Verify safe connection to ZhongWenHub_Test
    conn = connect_test_database()
    guard = assert_safe_test_connection(conn)
    print(f"Verified Safe Connection: Database='{guard['database']}', Server='{guard['server']}'")
    
    manifest_file = Path("data/hsk30/staging/hsk1_vocabulary_qa_manifest_300.json")
    if not manifest_file.is_file():
        raise FileNotFoundError(f"Manifest not found: {manifest_file}")
        
    with open(manifest_file, "r", encoding="utf-8") as f:
        manifest_data = json.load(f)
        
    manifest_items = manifest_data.get("manifest", [])
    print(f"Loaded {len(manifest_items)} words from HSK 1 QA manifest.")
    
    cursor = conn.cursor()
    
    # 2. Get HSK 1 lesson map from ZhongWenHub_Test
    cursor.execute("""
        SELECT l.LessonNumber, l.TitleZh, LOWER(CAST(l.Id AS nvarchar(50)))
        FROM lessons l
        JOIN courses c ON l.CourseId = c.Id
        WHERE c.HskLevel = 1
        ORDER BY l.LessonNumber
    """)
    lessons = cursor.fetchall()
    title_to_lesson_id = {row[1]: row[2] for row in lessons}
    print(f"Found {len(lessons)} HSK 1 lessons on Test DB.")
    
    # 3. Pre-update audit
    cursor.execute("""
        SELECT COUNT(*)
        FROM vocabularies v
        JOIN lessons l ON v.LessonId = l.Id
        JOIN courses c ON l.CourseId = c.Id
        WHERE c.HskLevel = 1
    """)
    before_linked = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM vocabularies WHERE HskLevel = 1 AND LessonId IS NULL")
    before_unlinked = cursor.fetchone()[0]
    print(f"Pre-update: {before_linked} vocabularies linked to HSK 1 lessons, {before_unlinked} unlinked.")
    
    # 4. Perform updates
    updated_count = 0
    not_found = []
    
    for item in manifest_items:
        hanzi = item["hanzi"]
        lesson_title = item.get("lessonTitle")
        
        target_lesson_id = title_to_lesson_id.get(lesson_title)
        if not target_lesson_id:
            print(f"  [WARN] Unknown lesson title '{lesson_title}' for word '{hanzi}'")
            continue
            
        cursor.execute("""
            UPDATE vocabularies
            SET LessonId = ?
            WHERE HskLevel = 1 AND Hanzi = ?
        """, (target_lesson_id, hanzi))
        if cursor.rowcount > 0:
            updated_count += cursor.rowcount
        else:
            not_found.append(hanzi)
            
    conn.commit()
    print(f"Successfully updated LessonId for {updated_count} vocabulary entries.")
    if not_found:
        print(f"Words not found in Test DB: {not_found}")
        
    # 5. Post-update audit
    cursor.execute("""
        SELECT l.LessonNumber, l.TitleZh, COUNT(v.Id) as VocabCount
        FROM lessons l
        JOIN courses c ON l.CourseId = c.Id
        LEFT JOIN vocabularies v ON v.LessonId = l.Id
        WHERE c.HskLevel = 1
        GROUP BY l.LessonNumber, l.TitleZh
        ORDER BY l.LessonNumber
    """)
    post_lessons = cursor.fetchall()
    print("\n=== POST-UPDATE HSK 1 LESSON VOCABULARY AUDIT ===")
    total_linked = 0
    for row in post_lessons:
        num, title, count = row
        total_linked += count
        print(f"  Lesson {num:02d} ({title}): {count} words")
        
    print(f"\nTotal HSK 1 Vocabularies linked to lessons: {total_linked}/300.")
    conn.close()
    return total_linked


if __name__ == "__main__":
    link_hsk1_vocabularies()
