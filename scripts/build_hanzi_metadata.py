import os
import sys
import re
import csv
import ast
import pyodbc
from pypinyin import pinyin, Style
import cnradical
from strokes import strokes

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"D:\ZhongWenHub"
SCRATCH_DIR = r"C:\Users\nguyen\.gemini\antigravity\brain\cd186fce-5c0e-4fe7-82e2-2c0cf85214c4\scratch"
CVDICT_PATH = os.path.join(SCRATCH_DIR, "CVDICT.u8")
HANVIET_PATH = os.path.join(SCRATCH_DIR, "hanviet.csv")

def build_hanzi_metadata_map():
    print("Loading Hanzi tools and dictionaries...")
    rad_engine = cnradical.Radical(cnradical.RunOption.Radical)

    # 1. Load CVDICT for simp -> trad and meaning
    simp_to_trad = {}
    simp_meanings = {}
    pattern = re.compile(r'^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+/(.+)/$')
    with open(CVDICT_PATH, 'r', encoding='utf-8') as f:
        for line in f:
            m = pattern.match(line.strip())
            if m:
                trad, simp, py, gloss = m.groups()
                if len(simp) == 1:
                    if simp not in simp_to_trad:
                        simp_to_trad[simp] = set()
                    simp_to_trad[simp].add(trad)
                    if simp not in simp_meanings:
                        simp_meanings[simp] = []
                    # clean gloss
                    clean_p = [p.strip() for p in re.split(r"[/;]", gloss) if p.strip() and not re.search(r"^(họ\s*\[|biến thể|dùng trong|xem thêm|viết tắt|LT:|CL:)", p)]
                    if clean_p:
                        simp_meanings[simp].extend(clean_p)

    # 2. Load hanviet.csv
    trad_to_hv = {}
    with open(HANVIET_PATH, 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            c = row['char']
            try:
                readings = ast.literal_eval(row['hanviet'])
                if c not in trad_to_hv:
                    trad_to_hv[c] = []
                for item in readings:
                    if item and item not in trad_to_hv[c]:
                        trad_to_hv[c].append(item)
            except:
                pass

    return rad_engine, simp_to_trad, simp_meanings, trad_to_hv

def get_hanzi_details(c, rad_engine, simp_to_trad, simp_meanings, trad_to_hv):
    # Pinyin
    py_list = pinyin(c, style=Style.TONE)
    py_str = py_list[0][0] if py_list and py_list[0] else ""

    # Radical
    rad = rad_engine.trans_ch(c) or ""

    # Strokes
    stk = strokes(c) or 0

    # Sino-Vietnamese
    hv_list = list(trad_to_hv.get(c, []))
    if c in simp_to_trad:
        for trad in simp_to_trad[c]:
            for item in trad_to_hv.get(trad, []):
                if item not in hv_list:
                    hv_list.append(item)
    hv_str = ", ".join(hv_list[:2]).title() if hv_list else ""

    # MeaningVi
    m_list = simp_meanings.get(c, [])
    m_clean = []
    for m in m_list:
        m_s = re.sub(r"\[[A-Za-z0-9\s]+\]", "", m).strip()
        if m_s and m_s not in m_clean:
            m_clean.append(m_s)
    meaning_vi = "; ".join(m_clean[:2]) if m_clean else (hv_str.lower() if hv_str else "")

    return py_str, hv_str, meaning_vi, rad, stk

if __name__ == "__main__":
    rad_engine, simp_to_trad, simp_meanings, trad_to_hv = build_hanzi_metadata_map()
    test_chars = ['你', '好', '学', '生', '语', '言', '爱', '和', '中', '国']
    for c in test_chars:
        py, hv, m, rad, stk = get_hanzi_details(c, rad_engine, simp_to_trad, simp_meanings, trad_to_hv)
        print(f"Char: {c:2} | Py: {py:6} | HV: {hv:15} | Rad: {rad:2} | Stk: {stk:2} | Meaning: {m}")
