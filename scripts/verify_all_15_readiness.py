import requests
import pyodbc
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

login_res = requests.post('http://127.0.0.1:5000/api/v1/auth/login', json={'email': 'admin@gmail.com', 'password': 'admin'})
token = login_res.json()['accessToken']
headers = {'Authorization': f'Bearer {token}'}

# Get HSK 1 Course ID from DB
conn = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;')
cur = conn.cursor()
cur.execute("SELECT Id FROM courses WHERE HskLevel = 1")
hsk1_course_id = str(cur.fetchone()[0])

cur.execute("""
    SELECT Id, LessonNumber, TitleZh, TitleVi, Status
    FROM lessons
    WHERE CourseId = ?
    ORDER BY LessonNumber
""", (hsk1_course_id,))

rows = cur.fetchall()
print(f"=== HSK 1 RELEASE READINESS AUDIT (15 LESSONS) ===")
print(f"Course ID: {hsk1_course_id}\n")

hsk1_summary = []
for r in rows:
    lid, num, tzh, tvi, status = r
    chk = requests.get(f"http://127.0.0.1:5000/api/v1/content/lessons/{lid}/release-readiness", headers=headers).json()
    ready = chk.get('isReadyForPublish', False)
    v_cnt = chk.get('vocabCount', 0)
    g_cnt = chk.get('grammarCount', 0)
    e_cnt = chk.get('exerciseCount', 0)
    audio = chk.get('audioFilesExist', False)
    blockers = chk.get('blockerReasons', [])
    
    print(f"L{num:02d}: {tzh:<14} | DB Status={status:<9} | Gate Ready={str(ready):<5} | V={v_cnt:02d}, G={g_cnt:02d}, E={e_cnt:02d} | Audio={audio} | Blockers={len(blockers)}")
    hsk1_summary.append({
        'lessonNumber': num,
        'titleZh': tzh,
        'titleVi': tvi,
        'status': status,
        'ready': ready,
        'blockers': blockers
    })

conn.close()
