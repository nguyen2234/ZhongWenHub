# -*- coding: utf-8 -*-
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

with open('data/hsk30/staging/dev_hsk4_vocab_raw.json', 'r', encoding='utf-8') as f:
    raw = json.load(f)

l11 = [x for x in raw if x['lessonNumber'] == 11]
print(f"Total L11 words: {len(l11)}")
for i, w in enumerate(l11, 1):
    print(f"{i:02d}. devId: '{w['devId']}', hanzi: '{w['hanzi']}', pinyin: '{w['pinyin']}', meaningVi: '{w['meaningVi']}', partOfSpeech: '{w['partOfSpeech']}'")
