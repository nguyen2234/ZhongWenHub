#!/usr/bin/env python3
"""
scripts/hsk30/audit_hsk2_baseline.py
Performs a comprehensive READ-ONLY audit of HSK 2 baseline data on ZhongWenHub_Dev and ZhongWenHub_Test.
"""

import sys
import json
import pyodbc

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def audit_database(db_name):
    print(f"\n=======================================================")
    print(f"AUDITING DATABASE: {db_name}")
    print(f"=======================================================")
    
    conn_str = f"Driver={{ODBC Driver 17 for SQL Server}};Server=.\\SQLEXPRESS;Database={db_name};Trusted_Connection=yes;"
    try:
        conn = pyodbc.connect(conn_str)
        cur = conn.cursor()
        
        # 1. Course for HSK 2
        cur.execute("SELECT Id, Code, Title, HskLevel, Description FROM courses WHERE HskLevel = 2")
        courses = cur.fetchall()
        print(f"Courses (HskLevel=2): {len(courses)}")
        course_id = courses[0][0] if courses else None
        for c in courses:
            print(f"  - Id: {c[0]}, Code: {c[1]}, Title: {c[2]}")

        # 2. Units for HSK 2
        cur.execute("""
            SELECT u.Id, u.UnitNumber, u.TitleZh, u.TitleVi, u.OrderIndex, u.CourseId
            FROM units u
            JOIN courses c ON u.CourseId = c.Id
            WHERE c.HskLevel = 2
            ORDER BY u.UnitNumber
        """)
        units = cur.fetchall()
        print(f"\nUnits for HSK 2: {len(units)}")
        unit_ids = []
        for u in units:
            unit_ids.append(u[0])
            print(f"  - Unit {u[1]}: {u[2]} ({u[3]}) [Id: {u[0]}, OrderIndex: {u[4]}]")

        # 3. Lessons for HSK 2
        cur.execute("""
            SELECT l.Id, l.LessonNumber, l.TitleZh, l.TitleVi, l.Status, l.OrderIndex, l.UnitId,
                   DATALENGTH(l.Summary), DATALENGTH(l.DialogueJson), DATALENGTH(l.ListeningJson)
            FROM lessons l
            JOIN units u ON l.UnitId = u.Id
            JOIN courses c ON u.CourseId = c.Id
            WHERE c.HskLevel = 2
            ORDER BY l.LessonNumber
        """)
        lessons = cur.fetchall()
        print(f"\nLessons for HSK 2: {len(lessons)}")
        status_counts = {}
        for les in lessons:
            st = les[4]
            status_counts[st] = status_counts.get(st, 0) + 1
            has_summary = bool(les[7])
            has_dialogue = bool(les[8])
            has_listening = bool(les[9])
            print(f"  - Lesson {les[1]}: {les[2]} ({les[3]}) | Status: {st} | Order: {les[5]} | Summary: {has_summary}, Diag: {has_dialogue}, List: {has_listening} | Id: {les[0]}")
        print(f"Lesson Status Counts: {status_counts}")

        # 4. Vocabularies for HSK 2
        cur.execute("""
            SELECT COUNT(*),
                   SUM(CASE WHEN ExamplesJson IS NOT NULL AND LEN(CAST(ExamplesJson AS nvarchar(max))) > 10 THEN 1 ELSE 0 END),
                   SUM(CASE WHEN MeaningVi IS NOT NULL AND LEN(MeaningVi) > 0 THEN 1 ELSE 0 END),
                   SUM(CASE WHEN Pinyin IS NOT NULL AND LEN(Pinyin) > 0 THEN 1 ELSE 0 END)
            FROM vocabularies
            WHERE HskLevel = 2
        """)
        v_stat = cur.fetchone()
        print(f"\nVocabularies (HskLevel=2): Total = {v_stat[0]}, With Examples = {v_stat[1]}, With Meaning = {v_stat[2]}, With Pinyin = {v_stat[3]}")

        # Sample 5 vocab
        cur.execute("SELECT TOP 5 Id, Hanzi, Pinyin, MeaningVi, LessonId, ExamplesJson FROM vocabularies WHERE HskLevel = 2")
        print("  Sample Vocabularies:")
        for v in cur.fetchall():
            print(f"    * {v[1]} ({v[2]}): {v[3]} | LessonId: {v[4]} | Ex: {bool(v[5])}")

        # 5. Grammar points for HSK 2
        cur.execute("""
            SELECT COUNT(*),
                   SUM(CASE WHEN StructureFormula IS NOT NULL AND LEN(StructureFormula) > 0 THEN 1 ELSE 0 END),
                   SUM(CASE WHEN Explanation IS NOT NULL AND LEN(Explanation) > 0 THEN 1 ELSE 0 END),
                   SUM(CASE WHEN ExamplesJson IS NOT NULL AND LEN(CAST(ExamplesJson AS nvarchar(max))) > 10 THEN 1 ELSE 0 END)
            FROM grammar_points
            WHERE HskLevel = 2
        """)
        g_stat = cur.fetchone()
        print(f"\nGrammar Points (HskLevel=2): Total = {g_stat[0]}, With Formula = {g_stat[1]}, With Expl = {g_stat[2]}, With Ex = {g_stat[3]}")
        
        cur.execute("SELECT TOP 5 Code, Title, StructureFormula, LessonId FROM grammar_points WHERE HskLevel = 2")
        print("  Sample Grammar Points:")
        for g in cur.fetchall():
            print(f"    * [{g[0]}] {g[1]} | Formula: {g[2]} | LessonId: {g[3]}")

        # 6. Exercises for HSK 2
        cur.execute("""
            SELECT COUNT(*),
                   SUM(CASE WHEN OptionsJson LIKE '%Nghĩa khác%' THEN 1 ELSE 0 END),
                   SUM(CASE WHEN OptionsJson IS NULL OR OptionsJson = '[]' THEN 1 ELSE 0 END),
                   SUM(CASE WHEN CorrectOptionIndex IS NULL THEN 1 ELSE 0 END)
            FROM exercises
            WHERE HskLevel = 2
        """)
        e_stat = cur.fetchone()
        print(f"\nExercises (HskLevel=2): Total = {e_stat[0]}, Placeholders('Nghĩa khác') = {e_stat[1]}, Empty Options = {e_stat[2]}, Null CorrectIndex = {e_stat[3]}")

        # Exercises by Lesson
        cur.execute("""
            SELECT l.LessonNumber, COUNT(e.Id)
            FROM lessons l
            JOIN units u ON l.UnitId = u.Id
            JOIN courses c ON u.CourseId = c.Id
            LEFT JOIN exercises e ON e.LessonId = l.Id
            WHERE c.HskLevel = 2
            GROUP BY l.LessonNumber
            ORDER BY l.LessonNumber
        """)
        print("  Exercises Count per Lesson:")
        for row in cur.fetchall():
            print(f"    * Lesson {row[0]}: {row[1]} exercises")

        # Sample 5 exercises
        cur.execute("SELECT TOP 5 Title, PromptHanzi, OptionsJson, CorrectOptionIndex, LessonId FROM exercises WHERE HskLevel = 2")
        print("  Sample Exercises:")
        for ex in cur.fetchall():
            print(f"    * {ex[0]} | Prompt: {ex[1]} | Options: {ex[2]} | Correct: {ex[3]}")

        # 7. Student progress for HSK 2
        cur.execute("""
            SELECT COUNT(*)
            FROM student_lesson_progress p
            JOIN lessons l ON p.LessonId = l.Id
            JOIN units u ON l.UnitId = u.Id
            JOIN courses c ON u.CourseId = c.Id
            WHERE c.HskLevel = 2
        """)
        p_stat = cur.fetchone()
        print(f"\nStudent Lesson Progress records for HSK 2: {p_stat[0]}")

        conn.close()
    except Exception as e:
        print(f"Error auditing {db_name}: {e}")

if __name__ == "__main__":
    audit_database("ZhongWenHub_Dev")
    audit_database("ZhongWenHub_Test")
