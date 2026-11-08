import sys
import json
import pyodbc
from collections import Counter, defaultdict

sys.stdout.reconfigure(encoding='utf-8')

conn = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;')
cursor = conn.cursor()

# 1. Courses, Units, Lessons
cursor.execute("SELECT Id, Code, Title, HskLevel, Status FROM courses ORDER BY HskLevel")
courses = cursor.fetchall()

cursor.execute("SELECT Id, CourseId, UnitNumber, TitleZh, TitleVi, Status, OrderIndex FROM units ORDER BY CourseId, UnitNumber")
units = cursor.fetchall()

cursor.execute("SELECT Id, CourseId, UnitId, LessonNumber, TitleZh, TitleVi, Pinyin, Status, OrderIndex FROM lessons ORDER BY CourseId, LessonNumber")
lessons = cursor.fetchall()

# 2. Check Legacy 4th Lesson specifically
cursor.execute("SELECT Id, CourseId, UnitId, LessonNumber, TitleZh, TitleVi, Status, OrderIndex FROM lessons WHERE LessonNumber = 4 AND CourseId = '11111111-1111-1111-1111-111111111111'")
legacy_4th = cursor.fetchone()

# 3. Vocabulary linking check
cursor.execute("""
    SELECT v.Id, v.HskLevel, v.Hanzi, v.LessonId, l.LessonNumber, c.HskLevel AS CourseHskLevel
    FROM vocabularies v
    LEFT JOIN lessons l ON v.LessonId = l.Id
    LEFT JOIN courses c ON l.CourseId = c.Id
""")
vocab_links = cursor.fetchall()

vocab_level_mismatches = []
vocab_per_lesson = Counter()
for vl in vocab_links:
    v_id, v_lvl, hz, l_id, l_num, c_lvl = vl
    if l_id is None:
        vocab_level_mismatches.append((hz, "Unlinked to lesson"))
    elif v_lvl != c_lvl:
        vocab_level_mismatches.append((hz, f"Vocab level {v_lvl} != Course level {c_lvl}"))
    vocab_per_lesson[l_id] += 1

# 4. Grammar linking check
cursor.execute("""
    SELECT g.Id, g.Code, g.HskLevel, g.LessonId, l.LessonNumber, c.HskLevel AS CourseHskLevel
    FROM grammar_points g
    LEFT JOIN lessons l ON g.LessonId = l.Id
    LEFT JOIN courses c ON l.CourseId = c.Id
""")
grammar_links = cursor.fetchall()

grammar_level_mismatches = []
grammar_per_lesson = Counter()
for gl in grammar_links:
    g_id, code, g_lvl, l_id, l_num, c_lvl = gl
    if l_id is None:
        grammar_level_mismatches.append((code, "Unlinked to lesson"))
    elif g_lvl != c_lvl:
        grammar_level_mismatches.append((code, f"Grammar level {g_lvl} != Course level {c_lvl}"))
    grammar_per_lesson[l_id] += 1

# 5. Exercises audit
cursor.execute("""
    SELECT e.Id, e.Type, e.Skill, e.HskLevel, e.Title, e.Instruction, e.PromptHanzi, e.PromptVietnamese,
           e.OptionsJson, e.CorrectOptionIndex, e.CorrectAnswer, e.Explanation, e.Status, e.LessonId, e.GrammarPointId
    FROM exercises e
""")
exercises = cursor.fetchall()

invalid_options_json = []
index_mismatches = []
empty_explanations = []
duplicate_options = []
broken_fk_lesson = []
broken_fk_grammar = []

lesson_ids = set(l[0] for l in lessons)
grammar_ids = set(gl[0] for gl in grammar_links)

for ex in exercises:
    ex_id, ex_type, skill, lvl, title, inst, p_hz, p_vi, opt_json, c_idx, c_ans, expl, status, l_id, g_id = ex
    
    if l_id and l_id not in lesson_ids:
        broken_fk_lesson.append((ex_id, l_id))
    if g_id and g_id not in grammar_ids:
        broken_fk_grammar.append((ex_id, g_id))

    if not expl or not expl.strip():
        empty_explanations.append(ex_id)

    try:
        opts = json.loads(opt_json) if opt_json else []
        if not isinstance(opts, list) or len(opts) < 2:
            invalid_options_json.append((ex_id, "Not a list of options"))
        else:
            if c_idx is None or c_idx < 0 or c_idx >= len(opts):
                index_mismatches.append((ex_id, f"Invalid index {c_idx} for len {len(opts)}"))
            elif c_ans and str(opts[c_idx]).strip() != str(c_ans).strip():
                index_mismatches.append((ex_id, f"Option[{c_idx}]='{opts[c_idx]}' != CorrectAnswer='{c_ans}'"))

            # Check duplicate options (e.g. repeated dummy options)
            if len(opts) != len(set(opts)):
                duplicate_options.append((ex_id, title, opts))
    except Exception as e:
        invalid_options_json.append((ex_id, f"JSON error: {e}"))

# 6. Student progress integrity
cursor.execute("SELECT COUNT(*) FROM student_lesson_progress")
prog_count = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(*) FROM student_learning_profiles")
profile_count = cursor.fetchone()[0]

print("=== 1. CURRICULUM OVERVIEW ===")
print(f"Courses: {len(courses)}")
print(f"Units: {len(units)}")
print(f"Lessons: {len(lessons)}")
print(f"Exercises: {len(exercises)}")
print(f"Student Progress records: {prog_count}")
print(f"Student Learning Profiles: {profile_count}")

print("\n=== 2. LEGACY 4TH LESSON CHECK ===")
print("Legacy 4th Lesson:", legacy_4th)

print("\n=== 3. CONTENT-TO-LESSON LINKING INTEGRITY ===")
print(f"Vocabulary Level Mismatches: {len(vocab_level_mismatches)}")
if vocab_level_mismatches:
    print("  Sample mismatches:", vocab_level_mismatches[:5])

print(f"Grammar Level Mismatches: {len(grammar_level_mismatches)}")
if grammar_level_mismatches:
    print("  Sample mismatches:", grammar_level_mismatches[:5])

# Distribution statistics
counts = list(vocab_per_lesson.values())
print(f"Vocab per lesson - Min: {min(counts)}, Max: {max(counts)}, Avg: {sum(counts)/len(counts):.1f}")
g_counts = list(grammar_per_lesson.values())
print(f"Grammar per lesson - Min: {min(g_counts)}, Max: {max(g_counts)}, Avg: {sum(g_counts)/len(g_counts):.1f}")

print("\n=== 4. EXERCISES INTEGRITY ===")
print(f"Invalid Options JSON: {len(invalid_options_json)}")
print(f"Index or Answer Mismatches: {len(index_mismatches)}")
print(f"Empty Explanations: {len(empty_explanations)}")
print(f"Duplicate/Dummy Options: {len(duplicate_options)}")
if duplicate_options:
    print(f"  Sample duplicate options ({len(duplicate_options)} total):")
    for d in duplicate_options[:5]:
        print(f"    {d[1]}: {d[2]}")

print(f"Broken FK to Lesson: {len(broken_fk_lesson)}")
print(f"Broken FK to GrammarPoint: {len(broken_fk_grammar)}")
