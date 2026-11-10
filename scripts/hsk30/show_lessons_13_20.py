import json

with open('data/hsk30/staging/dev_hsk4_vocab_raw.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

seen = {}
for d in data:
    ln = d['lessonNumber']
    if ln >= 13 and ln not in seen:
        seen[ln] = (d['lessonId'], d['lessonTitle'])

for ln in sorted(seen.keys()):
    lid, title = seen[ln]
    print(f"Lesson {ln:02d}: ID={lid} | Title='{title}'")

