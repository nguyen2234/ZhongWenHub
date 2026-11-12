import json

with open('data/hsk30/staging/dev_hsk4_exercises_raw.json', 'r', encoding='utf-8') as f:
    exs = json.load(f)

print(f"Total raw exercises: {len(exs)}")
by_lesson = {}
for e in exs:
    l_num = e.get('lessonNumber', 0)
    by_lesson.setdefault(l_num, []).append(e)

for l in sorted(by_lesson.keys()):
    print(f"Lesson {l:02d}: {len(by_lesson[l])} exercises")

print("\nSample first exercise:")
print(json.dumps(exs[0], ensure_ascii=False, indent=2))

