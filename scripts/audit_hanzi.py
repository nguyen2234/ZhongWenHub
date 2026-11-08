import sys
import re
import pyodbc
from collections import Counter
from strokes import strokes
import cnradical

sys.stdout.reconfigure(encoding='utf-8')

conn = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;')
cursor = conn.cursor()

cursor.execute("""
    SELECT Id, Character, Pinyin, SinoVietnamese, MeaningVi, Radical, StrokeCount, FirstHskLevel
    FROM hanzi_characters
    ORDER BY FirstHskLevel, Character
""")
rows = cursor.fetchall()

print(f"Total Hanzi characters in Dev: {len(rows)}")

rad_engine = cnradical.Radical(cnradical.RunOption.Radical)

stroke_mismatches = []
radical_mismatches = []
pinyin_issues = []
sinoviet_issues = []
meaning_issues = []
level_counts = Counter()

for r in rows:
    h_id, ch, py, hv, m_vi, rad, stk, lvl = r
    level_counts[lvl] += 1

    # 1. Pinyin check
    if not py or not py.strip() or not re.search(r"[a-zA-Z]", py):
        pinyin_issues.append((ch, py, "Empty or invalid pinyin"))
    elif re.search(r"[0-9]", py):
        pinyin_issues.append((ch, py, "Numbered pinyin instead of tone mark"))

    # 2. Sino-Vietnamese check
    if not hv or not hv.strip():
        sinoviet_issues.append((ch, hv, "Empty Sino-Vietnamese"))
    elif not hv[0].isupper():
        sinoviet_issues.append((ch, hv, "Not capitalized"))

    # 3. MeaningVi check
    if not m_vi or not m_vi.strip():
        meaning_issues.append((ch, m_vi, "Empty MeaningVi"))
    elif m_vi.strip().lower() == hv.strip().lower():
        # Fallback to pure Han-Viet without actual meaning
        meaning_issues.append((ch, m_vi, "Pure Han-Viet duplicate, lacks explanatory gloss"))

    # 4. StrokeCount check against Unicode standard
    expected_stk = strokes(ch)
    if stk != expected_stk:
        stroke_mismatches.append((ch, stk, expected_stk))

    # 5. Radical check
    expected_rad = rad_engine.trans_ch(ch)
    if rad != expected_rad:
        radical_mismatches.append((ch, rad, expected_rad))

# Check Level Requirements
cursor.execute("""
    SELECT r.Type, COUNT(*) AS Total, COUNT(DISTINCT r.CharacterId) AS UniqueChars
    FROM hanzi_level_requirements r
    GROUP BY r.Type
""")
req_stats = cursor.fetchall()

cursor.execute("""
    SELECT r.HskLevel, r.Type, COUNT(*)
    FROM hanzi_level_requirements r
    GROUP BY r.HskLevel, r.Type
    ORDER BY r.HskLevel, r.Type
""")
req_by_level = cursor.fetchall()

print("\n=== 1. GENERAL METRICS ===")
print("FirstHskLevel breakdown:", dict(level_counts))
print("Level Requirements stats:", req_stats)
print("Requirements by Level & Type:", req_by_level)

print("\n=== 2. DATA QUALITY AUDIT ===")
print(f"Pinyin issues: {len(pinyin_issues)}")
print(f"Sino-Vietnamese issues: {len(sinoviet_issues)}")
if sinoviet_issues:
    print("  Sample HV issues:", sinoviet_issues[:5])

print(f"MeaningVi issues: {len(meaning_issues)}")
if meaning_issues:
    print(f"  Sample MeaningVi issues ({len(meaning_issues)} total):")
    for mi in meaning_issues[:10]:
        print(f"    {mi[0]}: {mi[1]} ({mi[2]})")

print(f"Stroke count mismatches with Unicode Unihan: {len(stroke_mismatches)}")
if stroke_mismatches:
    print("  Sample stroke mismatches:", stroke_mismatches[:5])

print(f"Radical mismatches: {len(radical_mismatches)}")
if radical_mismatches:
    print("  Sample radical mismatches:", radical_mismatches[:5])

print("\n=== 3. SAMPLE AUDITED CHARACTERS ===")
for r in [rows[0], rows[50], rows[300], rows[800], rows[1500]]:
    print(f"  Char: {r[1]} | Py: {r[2]} | HV: {r[3]} | Rad: {r[5]} | Stk: {r[6]} | Lvl: {r[7]} | Meaning: {r[4]}")
