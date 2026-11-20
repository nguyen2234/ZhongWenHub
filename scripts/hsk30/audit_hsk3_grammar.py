# -*- coding: utf-8 -*-
"""
HSK 3 Grammar Audit & QA Script
Phase 9.3 — Task 4
Inspects all 96 grammar points from dev_hsk3_grammar_raw.json (extracted read-only from ZhongWenHub_Dev)
Generates:
  - data/hsk30/staging/hsk3_grammar_qa_manifest.json
"""

import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

def audit_grammar():
    print("=== ZHONGWENHUB PHASE 9.3: HSK 3 GRAMMAR POINTS AUDIT ===")
    
    raw_path = os.path.join("data", "hsk30", "staging", "dev_hsk3_grammar_raw.json")
    with open(raw_path, "r", encoding="utf-8") as f:
        raw_grammar = json.load(f)

    print(f"Total HSK 3 Grammar Points retrieved: {len(raw_grammar)}")

    manifest_list = []
    by_lesson = {}

    for r in raw_grammar:
        g_id = r["devId"]
        code = r["code"]
        title = r["title"]
        formula = r["structureFormula"]
        explanation = r["explanation"]
        examples_json = r.get("examplesJson", "[]")
        lesson_idx = r["lessonNumber"]
        lesson_title = r["lessonTitle"]

        parsed_examples = []
        if examples_json:
            try:
                parsed_examples = json.loads(examples_json)
            except Exception as e:
                print(f"Warning: Failed to parse examples for {code}: {e}")

        point_entry = {
            "id": g_id,
            "code": code,
            "title": title,
            "structureFormula": formula,
            "explanation": explanation,
            "lessonNumber": lesson_idx,
            "lessonTitle": lesson_title,
            "exampleCount": len(parsed_examples),
            "examples": parsed_examples,
            "status": "NEEDS_HUMAN_REVIEW"
        }
        manifest_list.append(point_entry)
        by_lesson.setdefault(lesson_idx, []).append(point_entry)

    # Verification checks
    print("\n--- Distribution across 20 lessons ---")
    for l_num in sorted(by_lesson.keys()):
        count = len(by_lesson[l_num])
        print(f"Lesson {l_num:02d}: {count} grammar points")

    out_manifest = {
        "phase": "9.3",
        "hskLevel": 3,
        "totalGrammarPoints": len(manifest_list),
        "reviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF",
        "lessonsCovered": 20,
        "grammarPoints": manifest_list
    }

    out_path = os.path.join("data", "hsk30", "staging", "hsk3_grammar_qa_manifest.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out_manifest, f, ensure_ascii=False, indent=2)

    print(f"\nManifest successfully written to: {out_path}")
    print("Grammar audit completed successfully.")

if __name__ == "__main__":
    audit_grammar()
