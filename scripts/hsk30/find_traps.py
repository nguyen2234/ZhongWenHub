# -*- coding: utf-8 -*-
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

with open('data/hsk30/staging/dev_hsk4_vocab_raw.json', 'r', encoding='utf-8') as f:
    vocab = json.load(f)

trap_keywords = ['tiếng lóng', 'slang', 'cũ', 'cổ', 'tục lệ', 'gái mại dâm', 'thô tục', 'khiêu dâm', 'đài loan']
count = 0
for item in vocab:
    m = item['meaningVi'].lower()
    found = [k for k in trap_keywords if k in m]
    if found:
        count += 1
        print(f"L{item['lessonNumber']:02d}: {item['hanzi']} ({item['pinyin']}) -> {found} -> {item['meaningVi'][:80]}")

print(f"\nTotal trapped items: {count}")
