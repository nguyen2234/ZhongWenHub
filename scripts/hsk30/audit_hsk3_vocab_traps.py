# -*- coding: utf-8 -*-
"""
Audit HSK 3 vocabulary raw meanings for dictionary debris and traps
"""

import sys
import json
import re

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

raw_file = "data/hsk30/staging/dev_hsk3_vocab_raw.json"
vocab = json.load(open(raw_file, encoding='utf-8'))

surname_trap_regex = re.compile(r'họ\s+(\[[A-Z]|\b[A-Z][a-z]+)|\(họ\b', re.IGNORECASE)
debris_trap_regex = re.compile(r'(biến thể\b|cũ của\b|dùng trong\b|LT:|CL:|tiếng lóng|phản động|khiêu dâm|người lớn)', re.IGNORECASE)

traps_found = []
for v in vocab:
    m = v.get("meaningVi", "")
    hanzi = v.get("hanzi", "")
    l_num = v.get("lessonNumber")
    if surname_trap_regex.search(m) and hanzi not in ["姓名", "姓", "亲属"]:
        traps_found.append((l_num, hanzi, "SURNAME_TRAP", m))
    if debris_trap_regex.search(m):
        traps_found.append((l_num, hanzi, "DEBRIS_TRAP", m))

print(f"Total vocabulary checked: {len(vocab)}")
print(f"Traps found: {len(traps_found)}")
for t in traps_found:
    print(f"  L{t[0]:02d} [{t[1]}]: {t[2]} -> {t[3]}")
