import os
import sys
import re
import pyodbc

sys.stdout.reconfigure(encoding='utf-8')

SCRATCH_DIR = r"C:\Users\nguyen\.gemini\antigravity\brain\cd186fce-5c0e-4fe7-82e2-2c0cf85214c4\scratch"
CVDICT_PATH = os.path.join(SCRATCH_DIR, "CVDICT.u8")

# Parse full CVDICT with all candidate definitions per simplified word
print("Indexing full CVDICT...")
cvdict_multi = {}
pattern = re.compile(r'^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+/(.+)/$')

with open(CVDICT_PATH, 'r', encoding='utf-8') as f:
    for line in f:
        m = pattern.match(line.strip())
        if m:
            trad, simp, py, gloss = m.groups()
            if simp not in cvdict_multi:
                cvdict_multi[simp] = []
            cvdict_multi[simp].append((trad, py, gloss))

print(f"Total unique simplified words in CVDICT: {len(cvdict_multi)}")

def clean_gloss_entry(gloss):
    parts = re.split(r"[/;]", gloss)
    cleaned = []
    noise = [
        r"^họ\s*\[.+\]$", r"^biến thể\b", r"^dùng trong\b", r"^xem thêm\b",
        r"^viết tắt của\b", r"^cũng đọc là\b", r"^LT:\s*.+$", r"^CL:\s*.+$"
    ]
    for p in parts:
        p = p.strip()
        if not p:
            continue
        is_n = any(re.search(n, p, re.IGNORECASE) for n in noise)
        if not is_n:
            p_c = re.sub(r"\[[A-Za-z0-9\s]+\]", "", p).strip()
            p_c = re.sub(r"\(LT:[^)]+\)", "", p_c).strip()
            if p_c and p_c not in cleaned:
                cleaned.append(p_c)
    return "; ".join(cleaned[:3]) if cleaned else ""

def get_best_clean_meaning(hanzi, pinyin, pos):
    if hanzi not in cvdict_multi:
        return None
    candidates = cvdict_multi[hanzi]

    # Filter out pure surname or debris lines first
    good_candidates = []
    for trad, py, gloss in candidates:
        clean = clean_gloss_entry(gloss)
        if clean:
            good_candidates.append((trad, py, clean))

    if not good_candidates:
        return None

    # Try matching pinyin
    py_lower = re.sub(r"[ '·\-\.]", "", pinyin.lower())
    for trad, py, clean in good_candidates:
        py_cand = re.sub(r"[ '·\-\.0-9]", "", py.lower())
        if py_cand == py_lower:
            return clean

    # Fallback to first good clean candidate
    return good_candidates[0][2]

# Test on trapped words
test_words = ['羊', '牛', '关', '包', '过', '辣', '联系', '懒', '左', '教', '楼', '游', '班', '错']
for tw in test_words:
    res = get_best_clean_meaning(tw, "test", "")
    print(f"  {tw:4} -> {res}")
