"""
HSK 1 Live API E2E Verification Script
=======================================

This script runs 7 live API checks against the ZhongWenHub backend.

REQUIRED environment variables (no defaults — script will exit with instructions if missing):
  E2E_STUDENT_PASSWORD          Student account password
  E2E_CONTENT_MANAGER_PASSWORD  Content Manager account password

OPTIONAL environment variables (defaults shown):
  E2E_STUDENT_EMAIL             student.an.demo@zhongwenhub.edu.vn
  E2E_CONTENT_MANAGER_EMAIL     content.hongphuc.demo@zhongwenhub.edu.vn
  E2E_API_BASE_URL              http://localhost:5000

Setup example (mirror the pattern used in Fontend/.env.local):
  # Windows PowerShell
  $env:E2E_STUDENT_PASSWORD = "..."
  $env:E2E_CONTENT_MANAGER_PASSWORD = "..."
  python scripts/hsk20/test_live_api_hsk1.py

  # Linux / macOS
  export E2E_STUDENT_PASSWORD="..."
  export E2E_CONTENT_MANAGER_PASSWORD="..."
  python scripts/hsk20/test_live_api_hsk1.py
"""

import os
import sys
import urllib.request
import urllib.error
import json


def _require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        print(f"[ERROR] Required environment variable '{name}' is not set.")
        return ""
    return value


def post(url, data, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def get(url, token=None):
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def main():
    # --- Validate required env vars ---
    student_email = os.environ.get('E2E_STUDENT_EMAIL', 'student.an.demo@zhongwenhub.edu.vn')
    student_password = _require_env('E2E_STUDENT_PASSWORD')
    cm_email = os.environ.get('E2E_CONTENT_MANAGER_EMAIL', 'content.hongphuc.demo@zhongwenhub.edu.vn')
    cm_password = _require_env('E2E_CONTENT_MANAGER_PASSWORD')
    base_url = os.environ.get('E2E_API_BASE_URL', 'http://localhost:5000')

    missing = []
    if not student_password:
        missing.append('E2E_STUDENT_PASSWORD')
    if not cm_password:
        missing.append('E2E_CONTENT_MANAGER_PASSWORD')

    if missing:
        print("\n[FATAL] The following required environment variables are missing:")
        for var in missing:
            print(f"  - {var}")
        print("\nPlease set them before running this script.")
        print("Example (PowerShell):")
        print("  $env:E2E_STUDENT_PASSWORD = '<password>'")
        print("  $env:E2E_CONTENT_MANAGER_PASSWORD = '<password>'")
        print("  python scripts/hsk20/test_live_api_hsk1.py")
        print("\nSee Fontend/.env.local for the pattern used for frontend credentials.")
        sys.exit(1)

    print("=== LIVE API VERIFICATION FOR HSK 1 E2E ===")

    # 1. Login Student
    s_login = post(f'{base_url}/api/v1/auth/login', {
        'email': student_email,
        'password': student_password
    })
    s_token = s_login['accessToken']
    print('[PASS] 1. Student login successful.')

    # 2. Login Content Manager
    cm_login = post(f'{base_url}/api/v1/auth/login', {
        'email': cm_email,
        'password': cm_password
    })
    cm_token = cm_login['accessToken']
    print('[PASS] 2. Content Manager login successful.')

    # 3. Student fetches Lesson 1 (PUBLISHED)
    lesson1 = get(f'{base_url}/api/v1/content/lessons/aaaaaaaa-1111-1111-1111-111111111111', s_token)
    assert lesson1['status'] == 'PUBLISHED', f"Lesson 1 status is {lesson1['status']}"
    assert lesson1['titleZh'] == '你好', f"Lesson 1 title is {lesson1['titleZh']}"
    vocabs = lesson1.get('vocabularies', [])
    grammars = lesson1.get('grammars', [])
    print(f'[PASS] 3. Student retrieved Lesson 1: {lesson1["titleZh"]} ({lesson1["titleVi"]}), '
          f'Vocabularies: {len(vocabs)}, Grammars: {len(grammars)}')

    # 4. Student tries to fetch Lesson 4 (DRAFT) -> Must 404
    try:
        get(f'{base_url}/api/v1/content/lessons/aaaaaaaa-4444-4444-4444-444444444444', s_token)
        raise AssertionError('Security Failure: Student was able to fetch draft lesson!')
    except urllib.error.HTTPError as e:
        assert e.code == 404, f'Expected 404, got {e.code}'
        print(f'[PASS] 4. Draft protection verified: Student received HTTP 404 for draft Lesson 4.')

    # 5. Content Manager fetches Lesson 4 (DRAFT) -> Must 200 OK
    cm_lesson4 = get(f'{base_url}/api/v1/content/lessons/aaaaaaaa-4444-4444-4444-444444444444', cm_token)
    assert cm_lesson4['status'] == 'DRAFT', f"Lesson 4 status is {cm_lesson4['status']}"
    assert cm_lesson4['titleZh'] == '他是我的汉语老师', f"Lesson 4 title is {cm_lesson4['titleZh']}"
    print(f'[PASS] 5. Content Manager preview verified: CM retrieved Draft Lesson 4: {cm_lesson4["titleZh"]}')

    # 6. Anonymous completion test -> Must 401
    try:
        post(f'{base_url}/api/v1/learning/me/lessons/aaaaaaaa-1111-1111-1111-111111111111/complete', {
            'score': 100,
            'totalQuestions': 5,
            'xpAwarded': 50
        })
        raise AssertionError('Security Failure: Anonymous user completed lesson!')
    except urllib.error.HTTPError as e:
        assert e.code == 401, f'Expected 401, got {e.code}'
        print(f'[PASS] 6. Anonymous completion blocked with HTTP 401 Unauthorized.')

    # 7. Student checks lesson progress & XP
    progress_list = get(f'{base_url}/api/v1/learning/me/lessons', s_token)
    print(f'[PASS] 7. Student progress query succeeded: {len(progress_list)} records returned.')

    print("\nALL LIVE API E2E CHECKS PASSED SUCCESSFULLY (7/7).")

if __name__ == '__main__':
    main()
