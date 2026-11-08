import sys
import json
import pyodbc
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

conn = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;')
cursor = conn.cursor()

cursor.execute("""
    SELECT Id, Code, Title, HskLevel, Category, StructureFormula, Explanation, Difficulty, ExamplesJson, PracticeJson, Status, LessonId, RawExplanationCn
    FROM grammar_points
    ORDER BY HskLevel, Code
""")
rows = cursor.fetchall()

print(f"Total grammar points in Dev: {len(rows)}")

level_counts = Counter()
status_counts = Counter()
difficulty_counts = Counter()

# Checks
missing_title = []
missing_formula = []
missing_expl = []
invalid_examples = []
invalid_practice = []
copyright_risks = []
unlinked_lesson = []

for r in rows:
    g_id, code, title, lvl, cat, formula, expl, diff, ex_json, pr_json, status, l_id, raw_cn = r
    level_counts[lvl] += 1
    status_counts[status] += 1
    difficulty_counts[diff] += 1

    if not title or not title.strip():
        missing_title.append(code)
    if not formula or not formula.strip():
        missing_formula.append(code)
    if not expl or not expl.strip():
        missing_expl.append(code)
    if not l_id:
        unlinked_lesson.append(code)

    # Check raw CTI explanation
    if raw_cn and len(raw_cn.strip()) > 0:
        copyright_risks.append((code, "Contains RawExplanationCn"))

    # Examples validation
    try:
        ex_list = json.loads(ex_json) if ex_json else []
        if not isinstance(ex_list, list) or len(ex_list) == 0:
            invalid_examples.append((code, "Empty or not a list"))
        else:
            for ex in ex_list:
                if not ex.get("zh") or not ex.get("meaningVi"):
                    invalid_examples.append((code, "Missing zh or meaningVi in example"))
    except Exception as e:
        invalid_examples.append((code, f"JSON parse error: {e}"))

    # Practice validation
    if code.startswith("GR30"):
        try:
            pr = json.loads(pr_json) if pr_json else None
            if not isinstance(pr, dict):
                invalid_practice.append((code, "Empty or not a dict"))
            else:
                q = pr.get("question")
                opts = pr.get("options")
                c_idx = pr.get("correctIndex")
                exp = pr.get("explanation")
                if not q or not opts or len(opts) != 4 or c_idx is None or not exp:
                    invalid_practice.append((code, "Incomplete practice schema"))
        except Exception as e:
            invalid_practice.append((code, f"Practice JSON parse error: {e}"))

print("\n=== 1. GENERAL METRICS ===")
print("Levels breakdown:", dict(level_counts))
print("Statuses breakdown:", dict(status_counts))
print("Difficulty breakdown:", dict(difficulty_counts))

print("\n=== 2. FIELD COMPLETENESS ===")
print(f"Missing Title: {len(missing_title)}")
print(f"Missing Formula: {len(missing_formula)}")
print(f"Missing Explanation: {len(missing_expl)}")
print(f"Invalid Examples: {len(invalid_examples)}")
print(f"Invalid Practice: {len(invalid_practice)}")
print(f"Copyright Risks: {len(copyright_risks)}")
print(f"Unlinked to Lesson: {len(unlinked_lesson)}")

print("\n=== 3. PUBLISHED LEGACY POINTS CHECK ===")
for r in rows:
    if r[10] == "PUBLISHED":
        print(f"  Published: {r[1]} | Title: {r[2]} | Level: {r[3]} | Status: {r[10]}")
        print(f"    Formula: {r[5]}")
        print(f"    Expl: {r[6][:80]}...")
        print(f"    Examples: {r[8][:100]}...")

print("\n=== 4. SAMPLE ENRICHED HSK 3.0 POINTS ===")
for r in [rows[2], rows[50], rows[150], rows[300], rows[450]]:
    print(f"\n  Code: {r[1]} (Level {r[3]}) | Title: {r[2]} | Diff: {r[7]} | Status: {r[10]}")
    print(f"    Formula: {r[5]}")
    print(f"    Explanation: {r[6]}")
    print(f"    Examples: {r[8]}")
    print(f"    Practice: {r[9]}")
