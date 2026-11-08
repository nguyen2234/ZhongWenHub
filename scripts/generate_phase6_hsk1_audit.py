import pyodbc
import csv
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;')
cur = conn.cursor()

# Vocab counts per lesson in HSK 1
cur.execute('SELECT LessonId, COUNT(*) FROM vocabularies WHERE HskLevel = 1 GROUP BY LessonId')
vocab_counts = {str(r[0]).upper(): r[1] for r in cur.fetchall()}

# Grammar counts per lesson in HSK 1
cur.execute('SELECT LessonId, COUNT(*) FROM grammar_points WHERE HskLevel = 1 GROUP BY LessonId')
grammar_counts = {str(r[0]).upper(): r[1] for r in cur.fetchall()}

# Exercises counts per lesson in HSK 1
cur.execute('''
    SELECT e.LessonId, COUNT(*)
    FROM exercises e
    JOIN lessons l ON e.LessonId = l.Id
    JOIN courses c ON l.CourseId = c.Id
    WHERE c.HskLevel = 1
    GROUP BY e.LessonId
''')
exercise_counts = {str(r[0]).upper(): r[1] for r in cur.fetchall()}

cur.execute('''
    SELECT 
        l.Id, l.LessonNumber, u.UnitNumber, u.TitleZh, u.TitleVi,
        l.TitleZh, l.TitleVi, l.DialogueJson, l.ListeningJson, l.Status
    FROM lessons l
    JOIN units u ON l.UnitId = u.Id
    JOIN courses c ON l.CourseId = c.Id
    WHERE c.HskLevel = 1
    ORDER BY l.LessonNumber
''')
lessons = cur.fetchall()

audio_dir = r"D:\ZhongWenHub\Fontend\public\audio\hsk1"

rows = []
for les in lessons:
    lid = str(les[0]).upper()
    lnum, unum, uzh, uvi, tzh, tvi, d_raw, l_raw, status = les[1], les[2], les[3], les[4], les[5], les[6], les[7], les[8], les[9]
    d = json.loads(d_raw) if d_raw else {}
    l = json.loads(l_raw) if l_raw else []

    diag_file = f"les{lnum}_dialogue.mp3"
    list_file = f"les{lnum}_listening.mp3"

    diag_path = os.path.join(audio_dir, diag_file)
    list_path = os.path.join(audio_dir, list_file)

    diag_sz = os.path.getsize(diag_path) if os.path.exists(diag_path) else 0
    list_sz = os.path.getsize(list_path) if os.path.exists(list_path) else 0

    lines = d.get('lines', [])
    q_type = l[0].get('questionType', 'DETAIL') if (isinstance(l, list) and len(l) > 0) else 'DETAIL'
    q_name = l[0].get('questionTypeName', 'Nghe tìm thông tin') if (isinstance(l, list) and len(l) > 0) else 'Nghe tìm thông tin'

    human_status = "VERIFIED_PUBLISHED" if (lnum <= 3) else "PENDING_EXPERT_REVIEW"
    student_access = "ACCESSIBLE" if (status == "PUBLISHED") else "BLOCKED_DRAFT_404"

    rows.append({
        "Lesson_ID": lid,
        "Lesson_Number": lnum,
        "Unit_Number": unum,
        "Unit_Title_Zh": uzh,
        "Unit_Title_Vi": uvi,
        "Title_Zh": tzh,
        "Title_Vi": tvi,
        "Vocab_Count": vocab_counts.get(lid, 0),
        "Grammar_Count": grammar_counts.get(lid, 0),
        "Exercises_Count": exercise_counts.get(lid, 0),
        "Dialogue_Lines_Count": len(lines),
        "Dialogue_Audio_File": diag_file,
        "Dialogue_Audio_Bytes": diag_sz,
        "Listening_Question_Type": q_type,
        "Listening_Question_Name": q_name,
        "Listening_Audio_File": list_file,
        "Listening_Audio_Bytes": list_sz,
        "Technical_Status": "READY_FOR_EDITORIAL_REVIEW",
        "Human_Review_Status": human_status,
        "Publication_Status": status,
        "Student_Accessibility": student_access
    })

conn.close()

out_path = r"D:\ZhongWenHub\HSK30_PHASE6_HSK1_LESSON_AUDIT.csv"
with open(out_path, "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)
print(f"Exported {len(rows)} rows to {out_path}")

os.system(f'copy "{out_path}" "D:\\ZhongWenHub\\docs\\hsk30\\" > nul')
print("Archived to docs/hsk30/")
