# -*- coding: utf-8 -*-
import sys
import json
from db_safety_guard import connect_test_database, assert_safe_test_connection

sys.stdout.reconfigure(encoding='utf-8')

conn = connect_test_database()
guard = assert_safe_test_connection(conn)
print(f"Safe Connection: Database='{guard['database']}', Server='{guard['server']}'")

cursor = conn.cursor()

# Check HskLevel 4 in courses
cursor.execute("SELECT Id, Title, HskLevel FROM courses WHERE HskLevel = 4")
courses = cursor.fetchall()
print(f"HSK 4 courses count: {len(courses)}")
for c in courses:
    print(f"  Course: {c[0]} - {c[1]} (HskLevel {c[2]})")

# Check lessons for HSK 4
cursor.execute("""
    SELECT l.OrderIndex, l.TitleZh, l.TitleVi, l.Status, COUNT(v.Id) as VocabCount
    FROM lessons l
    JOIN units u ON l.UnitId = u.Id
    JOIN courses c ON u.CourseId = c.Id
    LEFT JOIN vocabularies v ON v.LessonId = l.Id
    WHERE c.HskLevel = 4
    GROUP BY l.OrderIndex, l.TitleZh, l.TitleVi, l.Status
    ORDER BY l.OrderIndex
""")
lessons = cursor.fetchall()
print(f"HSK 4 lessons on Test: {len(lessons)}")
for l in lessons[:5]:
    print(f"  L{l[0]:02d}: {l[1]} ({l[2]}) - Status={l[3]}, VocabCount={l[4]}")

# Total vocabularies with HskLevel = 4
cursor.execute("SELECT COUNT(*), COUNT(DISTINCT LessonId) FROM vocabularies WHERE HskLevel = 4")
row = cursor.fetchone()
print(f"Total HSK 4 vocabularies on Test: {row[0]} across {row[1]} lessons")

# Total exercises with HskLevel = 4
cursor.execute("SELECT COUNT(*) FROM exercises WHERE HskLevel = 4")
ex_count = cursor.fetchone()[0]
print(f"Total HSK 4 exercises on Test: {ex_count}")
