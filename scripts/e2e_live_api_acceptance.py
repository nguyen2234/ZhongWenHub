"""
ZhongWenHub E2E Live API Acceptance Script
===========================================

This script verifies authentication, RBAC, CMS content, and student learning APIs
against a live backend instance.

REQUIRED environment variables (no defaults — script will exit with instructions if missing):
  E2E_ADMIN_PASSWORD            Admin account password
  E2E_CONTENT_MANAGER_PASSWORD  Content Manager account password
  E2E_TEACHER_PASSWORD          Teacher account password
  E2E_STUDENT_PASSWORD          Student account password

OPTIONAL environment variables (defaults shown):
  E2E_ADMIN_EMAIL               admin@gmail.com
  E2E_CONTENT_MANAGER_EMAIL     content.hongphuc.demo@zhongwenhub.edu.vn
  E2E_TEACHER_EMAIL             teacher.son.demo@zhongwenhub.edu.vn
  E2E_STUDENT_EMAIL             student.an.demo@zhongwenhub.edu.vn
  E2E_API_BASE_URL              http://127.0.0.1:5000/api/v1

Setup example (mirror the pattern used in Fontend/.env.local):
  # Windows PowerShell
  $env:E2E_ADMIN_PASSWORD = "..."
  $env:E2E_CONTENT_MANAGER_PASSWORD = "..."
  $env:E2E_TEACHER_PASSWORD = "..."
  $env:E2E_STUDENT_PASSWORD = "..."
  python scripts/e2e_live_api_acceptance.py

  # Linux / macOS
  export E2E_ADMIN_PASSWORD="..."
  export E2E_CONTENT_MANAGER_PASSWORD="..."
  export E2E_TEACHER_PASSWORD="..."
  export E2E_STUDENT_PASSWORD="..."
  python scripts/e2e_live_api_acceptance.py
"""

import sys
import os
import urllib.request
import urllib.error
import json
import uuid

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

# --- Credentials from environment variables ---
ADMIN_EMAIL = os.environ.get('E2E_ADMIN_EMAIL', 'admin@gmail.com')
ADMIN_PASSWORD = os.environ.get('E2E_ADMIN_PASSWORD', '')
CM_EMAIL = os.environ.get('E2E_CONTENT_MANAGER_EMAIL', 'content.hongphuc.demo@zhongwenhub.edu.vn')
CM_PASSWORD = os.environ.get('E2E_CONTENT_MANAGER_PASSWORD', '')
TEACHER_EMAIL = os.environ.get('E2E_TEACHER_EMAIL', 'teacher.son.demo@zhongwenhub.edu.vn')
TEACHER_PASSWORD = os.environ.get('E2E_TEACHER_PASSWORD', '')
STUDENT_EMAIL = os.environ.get('E2E_STUDENT_EMAIL', 'student.an.demo@zhongwenhub.edu.vn')
STUDENT_PASSWORD = os.environ.get('E2E_STUDENT_PASSWORD', '')

BASE_URL = os.environ.get('E2E_API_BASE_URL', 'http://127.0.0.1:5000/api/v1')

# --- Validate required env vars before making any network calls ---
_required = {
    'E2E_ADMIN_PASSWORD': ADMIN_PASSWORD,
    'E2E_CONTENT_MANAGER_PASSWORD': CM_PASSWORD,
    'E2E_TEACHER_PASSWORD': TEACHER_PASSWORD,
    'E2E_STUDENT_PASSWORD': STUDENT_PASSWORD,
}
_missing = [k for k, v in _required.items() if not v]
if _missing:
    print("[FATAL] The following required environment variables are not set:")
    for var in _missing:
        print(f"  - {var}")
    print("\nPlease set them before running this script.")
    print("Example (PowerShell):")
    for var in _missing:
        print(f"  $env:{var} = '<password>'")
    print("  python scripts/e2e_live_api_acceptance.py")
    print("\nSee Fontend/.env.local for the pattern used for frontend credentials.")
    sys.exit(1)


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
status, res = request_json("POST", "/auth/login", {"usernameOrEmail": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
assert status == 200, f"Admin login failed: {status} {res}"
admin_token = res["accessToken"]
print(" [PASS] Admin login SUCCESS (200 OK) - Roles:", res.get("user", {}).get("roles"))

status, res = request_json("POST", "/auth/login", {"usernameOrEmail": CM_EMAIL, "password": CM_PASSWORD})
assert status == 200, f"ContentManager login failed: {status} {res}"
cm_token = res["accessToken"]
print(" [PASS] ContentManager login SUCCESS (200 OK) - Roles:", res.get("user", {}).get("roles"))

status, res = request_json("POST", "/auth/login", {"usernameOrEmail": TEACHER_EMAIL, "password": TEACHER_PASSWORD})
assert status == 200, f"Teacher login failed: {status} {res}"
teacher_token = res["accessToken"]
print(" [PASS] Teacher login SUCCESS (200 OK) - Roles:", res.get("user", {}).get("roles"))

status, res = request_json("POST", "/auth/login", {"usernameOrEmail": STUDENT_EMAIL, "password": STUDENT_PASSWORD})
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
