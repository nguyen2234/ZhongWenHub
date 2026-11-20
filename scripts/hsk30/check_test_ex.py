import sys
sys.path.insert(0, "scripts/hsk30")
from db_safety_guard import connect_test_database
conn = connect_test_database()
cur = conn.cursor()
cur.execute('''
    SELECT l.OrderIndex, e.Id, e.Title, e.Skill, e.Type, e.OptionsJson
    FROM exercises e
    JOIN lessons l ON e.LessonId = l.Id
    JOIN units u ON l.UnitId = u.Id
    JOIN courses c ON u.CourseId = c.Id
    WHERE c.HskLevel = 4 AND l.OrderIndex IN (1, 2)
    ORDER BY l.OrderIndex, e.Id
''')
for r in cur.fetchall():
    print(f"L{r[0]:02d}: {r[1]} | {r[2]} | Skill={r[3]} | Type={r[4]}")
    print(f"     Options: {r[5]}")
