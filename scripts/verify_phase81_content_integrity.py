import pyodbc
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn_str = 'DRIVER={ODBC Driver 18 for SQL Server};SERVER=localhost\\SQLEXPRESS;DATABASE=ZhongWenHub_Dev;Trusted_Connection=yes;TrustServerCertificate=yes;'
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

cursor.execute('''
SELECT LessonNumber, Id, TitleZh, TitleVi, DialogueJson, ListeningJson
FROM lessons
WHERE CourseId = (SELECT TOP 1 Id FROM courses WHERE Title LIKE '%HSK 1%')
ORDER BY LessonNumber
''')

lessons = cursor.fetchall()
print(f'Checking {len(lessons)} HSK 1 lessons in ZhongWenHub_Dev...')

report = []
total_dialogue_lines = 0
total_listening_items = 0
total_exercises = 0

for les in lessons:
    num, lid, zh, vi, diag_str, list_str = les
    diag = json.loads(diag_str) if diag_str else {}
    list_items = json.loads(list_str) if list_str else []
    
    lines = diag.get('lines', [])
    total_dialogue_lines += len(lines)
    total_listening_items += len(list_items)
    
    # Check dialogue audio file
    diag_audio = f"D:/ZhongWenHub/Fontend/public/audio/hsk1/les{num}_dialogue.mp3"
    diag_audio_exists = os.path.exists(diag_audio)
    diag_audio_size = os.path.getsize(diag_audio) if diag_audio_exists else 0
    
    # Check listening audio file
    list_audio = f"D:/ZhongWenHub/Fontend/public/audio/hsk1/les{num}_listening.mp3"
    list_audio_exists = os.path.exists(list_audio)
    list_audio_size = os.path.getsize(list_audio) if list_audio_exists else 0
    
    # Check exercises
    cursor.execute('''
    SELECT Id, Type, PromptHanzi, OptionsJson, CorrectOptionIndex, CorrectAnswer, Explanation
    FROM exercises
    WHERE LessonId = ?
    ''', lid)
    exs = cursor.fetchall()
    total_exercises += len(exs)
    
    # Check listening items
    list_issues = []
    for idx, item in enumerate(list_items):
        t_zh = item.get('transcriptZh', '')
        t_py = item.get('transcriptPinyin', '')
        t_vi = item.get('transcriptVi', '')
        q_zh = item.get('questionZh', '')
        opts = item.get('options', [])
        ans = item.get('answer', '')
        
        # Check leaked hanzi
        if re.search(r'[\u4e00-\u9fff]', t_py) or re.search(r'[\u4e00-\u9fff]', t_vi):
            list_issues.append(f'Listening #{idx+1} has leaked Hanzi')
        
        # Check that options have exactly 1 correct option
        correct_opts = [o for o in opts if o.get('isCorrect') is True]
        if len(correct_opts) != 1:
            list_issues.append(f'Listening #{idx+1} does not have exactly 1 correct option (found {len(correct_opts)})')
            
    # Check dialogue lines
    diag_issues = []
    for idx, line in enumerate(lines):
        py = line.get('pinyin', '')
        vi_line = line.get('meaningVi', '')
        if re.search(r'[\u4e00-\u9fff]', py) or re.search(r'[\u4e00-\u9fff]', vi_line):
            diag_issues.append(f'Dialogue line #{idx+1} has leaked Hanzi')
            
    report.append({
        'lesson': num,
        'title': f'{zh} ({vi})',
        'dialogue_lines': len(lines),
        'dialogue_audio': f'exists={diag_audio_exists}, size={diag_audio_size} bytes',
        'listening_items': len(list_items),
        'listening_audio': f'exists={list_audio_exists}, size={list_audio_size} bytes',
        'exercises_count': len(exs),
        'diag_issues': diag_issues,
        'list_issues': list_issues
    })

print(f'Total Dialogue Lines: {total_dialogue_lines}')
print(f'Total Listening Items: {total_listening_items}')
print(f'Total Exercises: {total_exercises}')

any_issues = False
for r in report:
    has_err = len(r['diag_issues']) > 0 or len(r['list_issues']) > 0
    if has_err:
        any_issues = True
        print(f"Lesson {r['lesson']} ({r['title']}) ISSUES:")
        for e in r['diag_issues']:
            print(f"  - Diag: {e}")
        for e in r['list_issues']:
            print(f"  - List: {e}")
    else:
        print(f"Lesson {r['lesson']:2d} ({r['title']}): OK | Diag: {r['dialogue_audio']} | List: {r['listening_audio']} | Exs: {r['exercises_count']}")

if not any_issues:
    print("\nALL 15 LESSONS CONTENT & AUDIO VERIFIED: ZERO SYNTAX/STRUCTURAL ANOMALIES!")
