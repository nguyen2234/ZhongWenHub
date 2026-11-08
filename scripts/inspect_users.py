import sys
sys.stdout.reconfigure(encoding='utf-8')
import pyodbc

conn = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;TrustServerCertificate=yes;')
cur = conn.cursor()

cur.execute("SELECT Id, Title, Type, Status, PromptHanzi, PromptVietnamese, OptionsJson, CorrectOptionIndex, Explanation FROM exercises WHERE LessonId = 'AAAAAAAA-2222-2222-2222-222222222222'")
for r in cur.fetchall():
    print(f"ID: {r[0]}")
    print(f"Title: {r[1]} | Type: {r[2]} | Status: {r[3]}")
    print(f"PromptHanzi: {r[4]} | PromptVi: {r[5]}")
    print(f"Options: {r[6]} | CorrectIndex: {r[7]}")
    print(f"Explanation: {r[8]}\n")

conn.close()
