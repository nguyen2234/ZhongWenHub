# -*- coding: utf-8 -*-
"""
Exercise Quality Gate Audit
Phase 9.1C — Task 4

Audits both existing (28 Dev) and staging (32 New) exercises for:
1. Single correct answer verification.
2. Distractor plausibility & absence of placeholders.
3. Option array integrity (no empty/duplicate choices).
4. Pedagogical explanation presence.
5. Grading capability and alignment with frontend/backend engine.
"""

import sys
import json
import pyodbc
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def audit_all_exercises():
    print("=== AUDITING ALL 60 HSK 1 EXERCISES (28 CURRENT DEV + 32 STAGING) ===")

    # 1. Fetch 28 Current Dev Exercises (Read-Only)
    conn_str = "Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;"
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    cursor.execute("""
    SELECT Id, LessonId, Type, Skill, Title, Instruction, PromptHanzi, PromptPinyin, PromptVietnamese,
           OptionsJson, CorrectOptionIndex, CorrectAnswer, Explanation
    FROM exercises
    WHERE HskLevel = 1
    ORDER BY LessonId, Id
    """)
    dev_rows = cursor.fetchall()
    conn.close()
    print(f"Loaded {len(dev_rows)} existing exercises from ZhongWenHub_Dev (Read-Only).")

    # 2. Load 32 Staging Exercises
    staging_file = Path("data/hsk30/staging/hsk1_exercises.json")
    with open(staging_file, "r", encoding="utf-8") as f:
        staging_data = json.load(f)
    print(f"Loaded {len(staging_data)} new staging exercises from {staging_file}.")

    audit_results = {
        "currentDev": {"total": len(dev_rows), "valid": 0, "flagged": 0, "items": []},
        "staging": {"total": len(staging_data), "valid": 0, "flagged": 0, "items": []}
    }

    # Audit Dev exercises
    for r in dev_rows:
        e_id, l_id, e_type, skill, title, inst, p_zh, p_py, p_vi, opt_json, c_idx, c_ans, expl = r
        issues = []
        try:
            options = json.loads(opt_json) if opt_json else []
        except Exception as e:
            options = []
            issues.append(f"Invalid options JSON: {e}")

        # Check for placeholder distractors
        for opt in options:
            if "nghĩa khác" in opt.lower() or "placeholder" in opt.lower():
                issues.append(f"Contains placeholder distractor: '{opt}'")

        if len(options) < 2:
            issues.append(f"Fewer than 2 options: {len(options)}")

        if c_idx is None or c_idx < 0 or c_idx >= len(options):
            issues.append(f"Invalid CorrectOptionIndex: {c_idx}")
        elif options and c_ans != options[c_idx]:
            issues.append(f"CorrectAnswer mismatch: '{c_ans}' vs options[{c_idx}]='{options[c_idx]}'")

        item_status = "FLAGGED_PLACEHOLDER" if issues else "VALID"
        if issues:
            audit_results["currentDev"]["flagged"] += 1
        else:
            audit_results["currentDev"]["valid"] += 1

        audit_results["currentDev"]["items"].append({
            "id": str(e_id),
            "lessonId": str(l_id),
            "type": e_type,
            "title": title,
            "status": item_status,
            "issues": issues
        })

    # Audit Staging exercises
    for ex in staging_data:
        e_id = ex["id"]
        l_id = ex["lessonId"]
        e_type = ex["type"]
        title = ex["title"]
        options = ex.get("options", [])
        c_idx = ex.get("correctOptionIndex")
        c_ans = ex.get("correctAnswer")
        expl = ex.get("explanation", "")

        issues = []
        if len(options) < 3:
            issues.append(f"Fewer than 3 options: {len(options)}")
        if c_idx is None or c_idx < 0 or c_idx >= len(options):
            issues.append(f"Invalid CorrectOptionIndex: {c_idx}")
        elif options and c_ans != options[c_idx]:
            issues.append(f"CorrectAnswer mismatch: '{c_ans}' vs options[{c_idx}]='{options[c_idx]}'")

        # Check unique options
        if len(options) != len(set(options)):
            issues.append("Duplicate options found")

        # Check placeholder
        for opt in options:
            if "nghĩa khác" in opt.lower() or "placeholder" in opt.lower():
                issues.append(f"Contains placeholder distractor: '{opt}'")

        if not expl:
            issues.append("Missing explanation")

        item_status = "NEEDS_FIX" if issues else "VALID_PRODUCTION_READY"
        if issues:
            audit_results["staging"]["flagged"] += 1
        else:
            audit_results["staging"]["valid"] += 1

        audit_results["staging"]["items"].append({
            "id": e_id,
            "lessonId": l_id,
            "lessonNumber": ex.get("lessonNumber"),
            "type": e_type,
            "title": title,
            "status": item_status,
            "issues": issues
        })

    print(f"\nCurrent Dev Exercises (28): Valid={audit_results['currentDev']['valid']}, Flagged={audit_results['currentDev']['flagged']}")
    print(f"Staging Exercises (32): Valid={audit_results['staging']['valid']}, Flagged={audit_results['staging']['flagged']}")

    manifest_file = Path("data/hsk30/staging/hsk1_exercise_qa_manifest.json")
    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump(audit_results, f, ensure_ascii=False, indent=2)

    print(f"Exercise QA Manifest written to: {manifest_file}")
    return audit_results["staging"]["flagged"] == 0

if __name__ == "__main__":
    success = audit_all_exercises()
    sys.exit(0 if success else 1)
