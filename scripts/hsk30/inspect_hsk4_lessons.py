import json

with open('data/hsk30/staging/dev_hsk4_vocab_raw.json', 'r', encoding='utf-8') as f:
    vocab = json.load(f)

lessons = {}
for v in vocab:
    l_num = v['lessonNumber']
    if l_num not in lessons:
        lessons[l_num] = {
            'id': v['lessonId'],
            'title': v['lessonTitle']
        }

for l_num in sorted(lessons.keys()):
    print(f"Lesson {l_num:02d}: {lessons[l_num]['title']} ({lessons[l_num]['id']})")
