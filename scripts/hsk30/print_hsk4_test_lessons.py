import sys
sys.path.insert(0, "scripts/hsk30")
from db_safety_guard import connect_test_database
conn = connect_test_database()
cur = conn.cursor()
cur.execute('''
    SELECT l.OrderIndex, LOWER(CAST(l.Id AS nvarchar(50))), l.TitleZh, l.Status
    FROM lessons l
    JOIN units u ON l.UnitId = u.Id
    JOIN courses c ON u.CourseId = c.Id
    WHERE c.HskLevel = 4
    ORDER BY l.OrderIndex
''')
for r in cur.fetchall():
    print(f"L{r[0]:02d}: {r[1]} | {r[2]} | Status={r[3]}")

