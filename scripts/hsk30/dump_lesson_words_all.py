# -*- coding: utf-8 -*-
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('data/hsk30/staging/dev_hsk4_vocab_raw.json', 'r', encoding='utf-8') as f:
    vocab = json.load(f)

for l in range(16, 21):
    words = [x for x in vocab if x['lessonNumber'] == l]
    print(f"=== Lesson {l}: {len(words)} words ===")
    for i, w in enumerate(words):
        print(f"    \"{w['hanzi']}\": (\"{w['devId']}\", \"{w['pinyin']}\", \"{w['partOfSpeech']}\", \"{w['meaningVi']}\"),")

