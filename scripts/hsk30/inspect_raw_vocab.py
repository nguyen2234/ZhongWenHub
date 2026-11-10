# -*- coding: utf-8 -*-
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('data/hsk30/staging/dev_hsk4_vocab_raw.json', 'r', encoding='utf-8') as f:
    vocab = json.load(f)

for l in range(1, 21):
    words = [x for x in vocab if x['lessonNumber'] == l]
    print(f"L{l:02d}: count={len(words)}, first={words[0]['hanzi']}, last={words[-1]['hanzi']}")
