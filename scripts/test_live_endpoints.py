import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_api(url):
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as resp:
            data = resp.read().decode('utf-8')
            js = json.loads(data)
            return resp.status, js
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return -1, str(e)

def main():
    print("=== LIVE API ENDPOINT VERIFICATION (http://localhost:5000) ===")
    
    # 1. Courses
    s_c, js_c = test_api('http://localhost:5000/api/v1/content/courses')
    print(f"1. GET /api/v1/content/courses: Status={s_c}, Items={len(js_c)}")
    for c in js_c:
        print(f"   - Course: {c.get('title')} ({c.get('slug')}), Level={c.get('level')}")

    # 2. Published Lessons
    s_les, js_les = test_api('http://localhost:5000/api/v1/content/lessons')
    items = js_les.get('items', []) if isinstance(js_les, dict) else js_les
    print(f"\n2. GET /api/v1/content/lessons (Student scope): Status={s_les}, Published count={len(items)}")
    for l in items:
        print(f"   - Lesson {l.get('orderIndex')}: {l.get('title')} (ID: {l.get('id')}, Status: {l.get('status')})")

    # 3. Lesson 1 Detail (Published)
    s_l1, js_l1 = test_api('http://localhost:5000/api/v1/content/lessons/aaaaaaaa-1111-1111-1111-111111111111')
    d_raw = js_l1.get('dialogueJson', '')
    l_raw = js_l1.get('listeningJson', '')
    d_parsed = json.loads(d_raw) if d_raw else None
    l_parsed = json.loads(l_raw) if l_raw else None
    print(f"\n3. GET /api/v1/content/lessons/aaaaaaaa-1111-1111-1111-111111111111:")
    print(f"   - Status: {s_l1}")
    print(f"   - Title: {js_l1.get('title')}")
    print(f"   - Dialogue lines: {len(d_parsed.get('lines', [])) if d_parsed else 0}")
    print(f"   - Dialogue audio status: {d_parsed.get('audioStatus') if d_parsed else 'N/A'}")
    l_items = l_parsed if isinstance(l_parsed, list) else (l_parsed.get('items', []) if l_parsed else [])
    print(f"   - Listening items: {len(l_items)}")
    print(f"   - Listening audio status: {l_items[0].get('audioStatus') if l_items else 'N/A'}")
    print(f"   - Listening question type: {l_items[0].get('questionTypeName') if l_items else 'N/A'}")
    print(f"   - Listening prompt: {l_items[0].get('prompt') if l_items else 'N/A'}")

    # 4. Lesson 4 Detail (Draft - must return 404 for unauthenticated/student)
    s_l4, js_l4 = test_api('http://localhost:5000/api/v1/content/lessons/aaaaaaaa-4444-4444-4444-444444444444')
    print(f"\n4. GET /api/v1/content/lessons/aaaaaaaa-4444-4444-4444-444444444444 (Draft):")
    print(f"   - Status: {s_l4} (Expected 404 Not Found to prevent content leakage)")

    # 5. Grammar Points
    s_gp, js_gp = test_api('http://localhost:5000/api/v1/content/grammar-points?hskLevel=1')
    print(f"\n5. GET /api/v1/content/grammar-points?hskLevel=1: Status={s_gp}, Count={len(js_gp)}")

    # 6. Vocabularies
    s_vb, js_vb = test_api('http://localhost:5000/api/v1/content/vocabularies?hskLevel=1')
    print(f"\n6. GET /api/v1/content/vocabularies?hskLevel=1: Status={s_vb}, Count={len(js_vb)}")

if __name__ == '__main__':
    main()
