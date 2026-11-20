# -*- coding: utf-8 -*-
"""
HSK 3 Baseline Data Audit Script
Phase 9.3 — Task 1: Audit ZhongWenHub_Dev (Strictly READ-ONLY)
"""

import sys
import json
import pyodbc
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def audit_baseline():
    print("=== ZHONGWENHUB PHASE 9.3: HSK 3 BASELINE DATA AUDIT (READ-ONLY) ===")
    conn_str = "Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;ApplicationIntent=ReadOnly;"
    conn = pyodbc.connect(conn_str)
    cur = conn.cursor()

    # 1. Course HSK 3
    cur.execute("SELECT * FROM courses WHERE HskLevel = 3")
    courses = cur.fetchall()
    cols = [col[0] for col in cur.description]
    print(f"\n1. Courses (HskLevel=3): Found {len(courses)}")
    course_id = None
    for c in courses:
        row_dict = dict(zip(cols, c))
        print("  - Course row:", row_dict)
        course_id = row_dict["Id"]

    # 2. Units
    cur.execute("""
        SELECT u.Id, u.UnitNumber, u.OrderIndex, u.TitleZh, u.TitleVi, COUNT(l.Id) as LessonCount
        FROM units u
        JOIN courses c ON u.CourseId = c.Id
        LEFT JOIN lessons l ON l.UnitId = u.Id
        WHERE c.HskLevel = 3
        GROUP BY u.Id, u.UnitNumber, u.OrderIndex, u.TitleZh, u.TitleVi
        ORDER BY u.OrderIndex, u.UnitNumber
    """)
    units = cur.fetchall()
    print(f"\n2. Units: Found {len(units)}")
    for u in units:
        print(f"  - Unit {u[1]} (Order {u[2]}): {u[3]} ({u[4]}) | Lessons: {u[5]}")

    # 3. Lessons
    cur.execute("""
        SELECT l.Id, l.OrderIndex, l.TitleZh, l.TitleVi, l.Pinyin, l.Status, l.UnitId, u.UnitNumber,
               LEN(ISNULL(l.Summary, '')) as SummaryLen,
               LEN(ISNULL(l.DialogueJson, '')) as DiagLen,
               LEN(ISNULL(l.ListeningJson, '')) as ListLen
        FROM lessons l
        JOIN units u ON l.UnitId = u.Id
        JOIN courses c ON u.CourseId = c.Id
        WHERE c.HskLevel = 3
        ORDER BY l.OrderIndex
    """)
    lessons = cur.fetchall()
    print(f"\n3. Lessons: Found {len(lessons)}")
    lesson_map = {}
    for l in lessons:
        lesson_map[l[1]] = {"id": str(l[0]), "titleZh": l[2], "titleVi": l[3], "status": l[5], "unit": l[7]}
        print(f"  - L{l[1]:02d} (Unit {l[7]}): {l[2]} ({l[3]}) | Status: {l[5]} | DiagLen: {l[9]} | ListLen: {l[10]}")

    # 4. Vocabularies
    cur.execute("""
        SELECT COUNT(*), 
               COUNT(CASE WHEN ExamplesJson IS NOT NULL AND LEN(ExamplesJson) > 5 THEN 1 END),
               COUNT(CASE WHEN LessonId IS NULL THEN 1 END)
        FROM vocabularies
        WHERE HskLevel = 3
    """)
    v_stat = cur.fetchone()
    print(f"\n4. Vocabularies (HskLevel=3): Total={v_stat[0]}, WithExamples={v_stat[1]}, Unassigned={v_stat[2]}")

    # Vocabulary per lesson
    cur.execute("""
        SELECT l.OrderIndex, l.TitleZh, COUNT(v.Id)
        FROM vocabularies v
        LEFT JOIN lessons l ON v.LessonId = l.Id
        WHERE v.HskLevel = 3
        GROUP BY l.OrderIndex, l.TitleZh
        ORDER BY l.OrderIndex
    """)
    v_by_lesson = cur.fetchall()
    print("  Vocab per lesson breakdown:")
    for vl in v_by_lesson:
        print(f"    L{vl[0] if vl[0] is not None else -1} ({vl[1]}): {vl[2]} words")

    # 5. Grammar Points
    cur.execute("""
        SELECT COUNT(*),
               COUNT(CASE WHEN ExamplesJson IS NOT NULL AND LEN(ExamplesJson) > 5 THEN 1 END),
               COUNT(CASE WHEN StructureFormula IS NOT NULL AND LEN(StructureFormula) > 0 THEN 1 END)
        FROM grammar_points g
        JOIN lessons l ON g.LessonId = l.Id
        JOIN units u ON l.UnitId = u.Id
        JOIN courses c ON u.CourseId = c.Id
        WHERE c.HskLevel = 3
    """)
    g_stat = cur.fetchone()
    print(f"\n5. Grammar Points: Total={g_stat[0]}, WithExamples={g_stat[1]}, WithFormula={g_stat[2]}")

    cur.execute("""
        SELECT l.OrderIndex, l.TitleZh, COUNT(g.Id)
        FROM grammar_points g
        JOIN lessons l ON g.LessonId = l.Id
        JOIN units u ON l.UnitId = u.Id
        JOIN courses c ON u.CourseId = c.Id
        WHERE c.HskLevel = 3
        GROUP BY l.OrderIndex, l.TitleZh
        ORDER BY l.OrderIndex
    """)
    g_by_lesson = cur.fetchall()
    print("  Grammar per lesson breakdown:")
    for gl in g_by_lesson:
        print(f"    L{gl[0]} ({gl[1]}): {gl[2]} points")

    # 6. Exercises
    cur.execute("""
        SELECT COUNT(*),
               COUNT(CASE WHEN OptionsJson IS NOT NULL AND LEN(OptionsJson) > 5 THEN 1 END)
        FROM exercises
        WHERE HskLevel = 3
    """)
    ex_stat = cur.fetchone()
    print(f"\n6. Exercises: Total={ex_stat[0]}, WithOptions={ex_stat[1]}")

    cur.execute("""
        SELECT l.OrderIndex, l.TitleZh, COUNT(e.Id)
        FROM exercises e
        JOIN lessons l ON e.LessonId = l.Id
        WHERE e.HskLevel = 3
        GROUP BY l.OrderIndex, l.TitleZh
        ORDER BY l.OrderIndex
    """)
    ex_by_lesson = cur.fetchall()
    print("  Exercises per lesson breakdown:")
    for el in ex_by_lesson:
        print(f"    L{el[0]} ({el[1]}): {el[2]} exercises")

    # 7. Student progress
    cur.execute("""
        SELECT COUNT(*)
        FROM student_lesson_progress p
        JOIN lessons l ON TRY_CONVERT(uniqueidentifier, p.LessonId) = l.Id
        JOIN units u ON l.UnitId = u.Id
        JOIN courses c ON u.CourseId = c.Id
        WHERE c.HskLevel = 3
    """)
    p_count = cur.fetchone()[0]
    print(f"\n7. Student Progress records on HskLevel=3: {p_count}")

    # 8. Check Audio directory
    audio_dir = Path("Fontend/public/audio/hsk3")
    mp3_count = len(list(audio_dir.glob("*.mp3"))) if audio_dir.exists() else 0
    print(f"\n8. Audio files in Fontend/public/audio/hsk3: {mp3_count} files (Directory exists: {audio_dir.exists()})")

    conn.close()

if __name__ == "__main__":
    audit_baseline()
