# -*- coding: utf-8 -*-
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('data/hsk30/staging/dev_hsk4_vocab_raw.json', 'r', encoding='utf-8') as f:
    vocab = json.load(f)

start_l = int(sys.argv[1]) if len(sys.argv) > 1 else 6
end_l = int(sys.argv[2]) if len(sys.argv) > 2 else 10

for l in range(start_l, end_l + 1):
    words = [x for x in vocab if x['lessonNumber'] == l]
    print(f"=== Lesson {l:02d} ({len(words)} words) ===")
    for w in words:
        clean_m = w['meaningVi'].split(';')[0].strip()
        print(f"    ({l}, \"{w['hanzi']}\"): (\"{clean_m}\", \"{w['pinyin']}\"),")
