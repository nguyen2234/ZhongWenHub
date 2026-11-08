import os
import sys
import re
import pyodbc
from collections import defaultdict, Counter

sys.stdout.reconfigure(encoding='utf-8')

conn = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;')
cursor = conn.cursor()

cursor.execute("""
    SELECT Id, HskLevel, Hanzi, Pinyin, PartOfSpeech, MeaningVi, SuggestedMeaningVi, Homograph, Status, LessonId
    FROM vocabularies
    ORDER BY HskLevel, Hanzi, Id
""")
rows = cursor.fetchall()

print(f"Total vocabularies in Dev: {len(rows)}")

# Metrics
empty_meanings = []
boilerplate_meanings = []
surname_patterns = []
archaic_patterns = []
dict_debris = []
pinyin_issues = []
homographs = defaultdict(list)
polyphones = defaultdict(list)
confidence_counts = Counter()
status_counts = Counter()
level_counts = Counter()

# Specific words to audit
target_words = {'别', '打', '花', '得', '等', '点', '好', '过', '回'}
target_word_reports = defaultdict(list)

# Known curated homographs
CURATED_KEYS = {
    ("花", "huā", "1"), ("花", "huā", "2"),
    ("别", "bié", "1"), ("别", "bié", "2"),
    ("打", "dǎ", "1"), ("万", "wàn", ""),
    ("路", "lù", ""), ("得", "de", "1"), ("得", "děi", "2"), ("得", "dé", ""),
    ("等", "děng", "1"), ("等", "děng", "2"),
    ("点", "diǎn", "1"), ("点", "diǎn", "2"),
    ("好", "hǎo", "1"), ("好", "hào", "2"),
    ("过", "guò", "1"), ("过", "guo", "2"),
    ("回", "huí", "1"), ("回", "huí", "2"),
    ("白", "bái", "1"), ("白", "bái", "2"),
    ("给", "gěi", ""), ("给", "jǐ", ""),
    ("干", "gān", "1"), ("干", "gàn", "2"),
    ("长", "cháng", "1"), ("长", "zhǎng", "2"),
    ("行", "xíng", "1"), ("行", "háng", "2"),
    ("看", "kàn", "1"), ("看", "kān", "2"),
    ("着", "zhe", "1"), ("着", "zháo", "2"),
    ("分", "fēn", "1"), ("分", "fèn", "2"),
    ("间", "jiān", "1"), ("间", "jiàn", "2"),
    ("重", "zhòng", "1"), ("重", "chóng", "2"),
    ("还", "hái", "1"), ("还", "huán", "2"),
    ("乐", "lè", "1"), ("乐", "yuè", "2"),
    ("少", "shǎo", "1"), ("少", "shào", "2"),
    ("教", "jiāo", "1"), ("教", "jiào", "2"),
    ("新媒体", "xīnméitǐ", ""), ("新能源", "xīnnéngyuán", "")
}

for r in rows:
    v_id, level, hanzi, py, pos, m_vi, sugg_vi, homo, status, lesson_id = r
    level_counts[level] += 1
    status_counts[status] += 1

    homo_str = homo.strip() if homo else ""
    m_vi_str = m_vi.strip() if m_vi else ""
    py_str = py.strip() if py else ""

    # Grouping for homographs & polyphones
    homographs[hanzi].append(r)
    polyphones[hanzi].append((py_str, level, m_vi_str))

    # Audit targets
    if hanzi in target_words:
        target_word_reports[hanzi].append(r)

    # 1. Empty check
    if not m_vi_str:
        empty_meanings.append(r)

    # 2. Boilerplate / fallback template check
    if "Từ vựng tiếng Trung HSK" in m_vi_str:
        boilerplate_meanings.append(r)

    # 3. Surname patterns (e.g. "họ [...]" or starting with "họ ")
    if re.search(r"\bhọ\b", m_vi_str, re.IGNORECASE) and not (pos and "名" in pos and "姓" in m_vi_str):
        # Check if it looks like a surname trap (e.g. "họ [Lu4]" or "họ Điền")
        if re.search(r"họ\s+(\[[A-Z]|\b[A-Z][a-z]+)", m_vi_str) or m_vi_str.startswith("họ "):
            surname_patterns.append((r, m_vi_str))

    # 4. Archaic / Classical patterns
    if re.search(r"(\bvăn học\b|\bthời xưa\b|\bcổ\b|\bnghĩa cũ\b|\bthời phong kiến\b|\bthời xưa\b)", m_vi_str, re.IGNORECASE):
        archaic_patterns.append((r, m_vi_str))

    # 5. Dictionary debris (unstripped brackets, LT:, CL:, pinyin in gloss)
    if re.search(r"(LT:|CL:|\[[A-Za-z0-9\s]+\]|\|\s*\S+\[)", m_vi_str):
        dict_debris.append((r, m_vi_str))

    # 6. Pinyin issues
    if not py_str or re.search(r"[0-9]", py_str) or not re.search(r"[a-zA-Z]", py_str):
        pinyin_issues.append((r, py_str))

    # 7. Confidence Classification
    key = (hanzi, py_str, homo_str)
    key_no_homo = (hanzi, py_str, "")
    if level == 1:
        # HSK 1 has been validated
        confidence = "HIGH_CONFIDENCE"
    elif key in CURATED_KEYS or key_no_homo in CURATED_KEYS:
        confidence = "HIGH_CONFIDENCE"
    elif not m_vi_str or "Từ vựng tiếng Trung HSK" in m_vi_str:
        confidence = "ANOMALY_FLAG"
    elif re.search(r"họ\s+(\[[A-Z]|\b[A-Z][a-z]+)", m_vi_str) or re.search(r"(LT:|CL:)", m_vi_str):
        confidence = "ANOMALY_FLAG"
    elif ";" in m_vi_str or homo_str:
        confidence = "NEEDS_REVIEW"
    else:
        confidence = "MEDIUM_CONFIDENCE"

    confidence_counts[confidence] += 1

print("\n=== 1. GENERAL METRICS ===")
print("Levels breakdown:", dict(level_counts))
print("Statuses breakdown:", dict(status_counts))
print("Confidence breakdown:", dict(confidence_counts))

print("\n=== 2. DEFECT DETECTION ===")
print(f"Empty meanings: {len(empty_meanings)}")
print(f"Boilerplate/Fallback template meanings: {len(boilerplate_meanings)}")
if boilerplate_meanings:
    for b in boilerplate_meanings[:5]:
        print("  Sample boilerplate:", b[1], b[2], b[3], b[5])

print(f"Surname patterns detected: {len(surname_patterns)}")
if surname_patterns:
    for s in surname_patterns[:10]:
        print(f"  Level {s[0][1]} | {s[0][2]} ({s[0][3]}, POS={s[0][4]}): {s[1]}")

print(f"Archaic/classical patterns detected: {len(archaic_patterns)}")
if archaic_patterns:
    for a in archaic_patterns[:10]:
        print(f"  Level {a[0][1]} | {a[0][2]} ({a[0][3]}): {a[1]}")

print(f"Dictionary formatting debris detected: {len(dict_debris)}")
if dict_debris:
    for d in dict_debris[:10]:
        print(f"  Level {d[0][1]} | {d[0][2]} ({d[0][3]}): {d[1]}")

print(f"Pinyin format issues: {len(pinyin_issues)}")
if pinyin_issues:
    for p in pinyin_issues[:5]:
        print(f"  Pinyin issue: {p[0][2]} -> {p[1]}")

print("\n=== 3. AUDIT OF SPECIFIC WORDS ===")
for tw in sorted(target_words):
    entries = target_word_reports[tw]
    print(f"\n--- Word: {tw} ({len(entries)} entries) ---")
    for e in entries:
        print(f"  Level {e[1]} | Hanzi={e[2]} | Pinyin={e[3]} | POS={e[4]} | Homo={e[7]} | Status={e[8]}")
        print(f"    MeaningVi: {e[5]}")
        print(f"    Suggested: {e[6][:80] if e[6] else 'None'}")
