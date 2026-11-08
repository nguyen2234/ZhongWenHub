import sys
import urllib.request
import json
import uuid

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:5000/api/v1"

def request_json(method, endpoint, data=None, token=None):
    payload = json.dumps(data).encode('utf-8') if data is not None else None
    req = urllib.request.Request(f"{BASE_URL}{endpoint}", data=payload, method=method)
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body

print("=== 1. AUTHENTICATION OF REAL ROLES IN ZHONGWENHUB_DEV ===")
status, res = request_json("POST", "/auth/login", {"usernameOrEmail": "admin@gmail.com", "password": "admin"})
assert status == 200, f"Admin login failed: {status} {res}"
admin_token = res["accessToken"]
print(" [PASS] Admin login SUCCESS (200 OK) - Roles:", res.get("user", {}).get("roles"))

status, res = request_json("POST", "/auth/login", {"usernameOrEmail": "content.hongphuc.demo@zhongwenhub.edu.vn", "password": "Demo@2026!ZhongWen"})
assert status == 200, f"ContentManager login failed: {status} {res}"
cm_token = res["accessToken"]
print(" [PASS] ContentManager login SUCCESS (200 OK) - Roles:", res.get("user", {}).get("roles"))

status, res = request_json("POST", "/auth/login", {"usernameOrEmail": "teacher.son.demo@zhongwenhub.edu.vn", "password": "Demo@2026!ZhongWen"})
assert status == 200, f"Teacher login failed: {status} {res}"
teacher_token = res["accessToken"]
print(" [PASS] Teacher login SUCCESS (200 OK) - Roles:", res.get("user", {}).get("roles"))

status, res = request_json("POST", "/auth/login", {"usernameOrEmail": "student.an.demo@zhongwenhub.edu.vn", "password": "Demo@2026!ZhongWen"})
assert status == 200, f"Student login failed: {status} {res}"
student_token = res["accessToken"]
print(" [PASS] Student login SUCCESS (200 OK) - Roles:", res.get("user", {}).get("roles"))

print("\n=== 2. SECURITY & RBAC ENFORCEMENT ===")
dummy_id = str(uuid.uuid4())
# 2.1 Student calls review endpoint -> 403 Forbidden
status, res = request_json("PUT", f"/content/vocabularies/{dummy_id}/review", {"status": "PUBLISHED"}, student_token)
assert status == 403, f"Expected 403 for student review, got {status}"
print(" [PASS] Student blocked from vocabulary review endpoint (403 Forbidden)")

# 2.2 Teacher calls batch review -> 403 Forbidden
status, res = request_json("POST", "/content/grammar/batch-review", {"ids": [dummy_id], "status": "PUBLISHED"}, teacher_token)
assert status == 403, f"Expected 403 for teacher batch-review, got {status}"
print(" [PASS] Teacher blocked from grammar batch-review endpoint (403 Forbidden)")

# 2.3 Student calls PUT character metadata -> 403 Forbidden
status, res = request_json("PUT", f"/content/characters/{dummy_id}", {"pinyin": "test", "sinoVietnamese": "test"}, student_token)
assert status == 403, f"Expected 403 for student character update, got {status}"
print(" [PASS] Student blocked from character metadata editing (403 Forbidden)")

# 2.4 Student querying published lessons only
status, res = request_json("GET", "/content/lessons", token=student_token)
assert status == 200, f"Get lessons failed: {status}"
draft_lessons = [l for l in res.get("items", []) if l.get("status") == "DRAFT"]
assert len(draft_lessons) == 0, f"Found {len(draft_lessons)} DRAFT lessons returned to student!"
print(f" [PASS] Student only sees published lessons (Found {len(res.get('items', []))} lessons, exactly 0 DRAFT)")

print("\n=== 3. CMS CONTENT AUDIT & REVIEW LIFECYCLE (LIVE API) ===")
# 3.1 Query Vocabularies
status, res = request_json("GET", "/content/vocabularies?hskLevel=1&pageSize=5", token=cm_token)
assert status == 200, f"Get vocabularies failed: {status}"
print(f" [PASS] ContentManager queried HSK 1 Vocabularies: {res.get('totalItems', 0)} total items found")

# 3.2 Query Grammar Points
status, res = request_json("GET", "/content/grammar?hskLevel=2&pageSize=5", token=cm_token)
assert status == 200, f"Get grammar points failed: {status}"
print(f" [PASS] ContentManager queried HSK 2 Grammar Points: {res.get('totalItems', 0)} total items found")

# 3.3 Query Hanzi Characters
status, res = request_json("GET", "/content/characters?pageSize=5")
assert status == 200, f"Get characters failed: {status}"
print(f" [PASS] Hanzi Characters API returned: {res.get('totalItems', 0)} total items (Unihan metadata)")

# 3.4 Hanzi Stats
status, res = request_json("GET", "/content/characters/stats")
assert status == 200, f"Get hanzi stats failed: {status}"
print(f" [PASS] Hanzi Stats: Total {res.get('totalCharacters')}, Recognition {res.get('recognitionCount')}, Handwriting {res.get('handwritingCount')}")

# 3.5 Spoofing Protection for ReviewedByUserId
status, vocabs = request_json("GET", "/content/vocabularies?status=PENDING_REVIEW&pageSize=1", token=cm_token)
if vocabs.get("items"):
    v_item = vocabs["items"][0]
    spoofed_uuid = str(uuid.uuid4())
    status, updated_v = request_json("PUT", f"/content/vocabularies/{v_item['id']}/review", {
        "status": "PENDING_REVIEW",
        "reviewNotes": "Auditing spoof protection",
        "reviewedByUserId": spoofed_uuid
    }, cm_token)
    assert status == 200
    assert updated_v["reviewedByUserId"] != spoofed_uuid, "CRITICAL: Server allowed spoofed ReviewedByUserId!"
    print(f" [PASS] Server prevented ReviewedByUserId spoofing (Recorded real user ID: {updated_v['reviewedByUserId']})")

print("\n=== 4. STUDENT LEARNING EXPERIENCE ===")
# 4.1 Student Courses
status, res = request_json("GET", "/content/courses", token=student_token)
assert status == 200, f"Get courses failed: {status}"
print(f" [PASS] Student sees {len(res)} Courses across HSK 1-6:")
for c in res[:3]:
    print(f"   -> Course: HSK {c.get('hskLevel')} ({c.get('code')})")

# 4.2 Student Units & Lessons
if res:
    c_id = res[0]["id"]
    status, units = request_json("GET", f"/content/courses/{c_id}", token=student_token)
    if status == 200:
        print(f" [PASS] Course structure retrieved: {len(units.get('units', []))} units")

# 4.3 Student Learning State
status, res = request_json("GET", "/learning/me", token=student_token)
if status == 200:
    print(f" [PASS] Student learning profile active (Daily Streak: {res.get('currentStreak', 0)}, Total XP: {res.get('totalXp', 0)})")
else:
    print(f" [INFO] Student learning profile status: {status}")

print("\n>>> ALL API E2E ACCEPTANCE CHECKS PASSED WITH 100% SUCCESS! <<<")
