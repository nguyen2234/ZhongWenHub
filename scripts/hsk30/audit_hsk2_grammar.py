# -*- coding: utf-8 -*-
"""
HSK 2 Grammar Audit & QA Script
Phase 9.2 — Task 4
Inspects all 78 grammar points from ZhongWenHub_Dev (Read-only)
Generates:
  - data/hsk30/staging/hsk2_grammar_qa_manifest.json
"""

import sys
import json
import pyodbc
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def audit_grammar():
    print("=== ZHONGWENHUB PHASE 9.2: HSK 2 GRAMMAR POINTS AUDIT ===")
    conn_str = "Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;ApplicationIntent=ReadOnly;"
    conn = pyodbc.connect(conn_str)
    cur = conn.cursor()

    sql = """
        SELECT 
            g.Id,
            g.Code,
            g.Title,
            g.StructureFormula,
            g.Explanation,
            g.ExamplesJson,
            l.OrderIndex,
            l.TitleZh,
            l.TitleVi
        FROM grammar_points g
        JOIN lessons l ON g.LessonId = l.Id
        JOIN units u ON l.UnitId = u.Id
        JOIN courses c ON u.CourseId = c.Id
        WHERE c.HskLevel = 2
        ORDER BY l.OrderIndex, g.Code
    """
    cur.execute(sql)
    rows = cur.fetchall()
    conn.close()

    print(f"Total HSK 2 Grammar Points retrieved: {len(rows)}")

    manifest_list = []
    by_lesson = {}

    for r in rows:
        g_id, code, title, formula, explanation, examples_json, lesson_idx, l_zh, l_vi = r
        
        parsed_examples = []
        if examples_json:
            try:
                parsed_examples = json.loads(examples_json)
            except Exception as e:
                print(f"Warning: Failed to parse examples for {code}: {e}")

        record = {
            "id": str(g_id).upper(),
            "code": code,
            "title": title,
            "structureFormula": formula,
            "explanation": explanation,
            "lessonNumber": lesson_idx,
            "lessonTitle": f"{l_zh} ({l_vi})",
            "exampleCount": len(parsed_examples),
            "examples": parsed_examples,
            "status": "NEEDS_HUMAN_REVIEW"
        }
        manifest_list.append(record)
        by_lesson.setdefault(lesson_idx, []).append(record)

    for l_num in sorted(by_lesson.keys()):
        items = by_lesson[l_num]
        print(f"  Lesson {l_num:2d} ({items[0]['lessonTitle'][:25]}...): {len(items)} grammar points")

    out_file = Path("data/hsk30/staging/hsk2_grammar_qa_manifest.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump({
            "phase": "9.2",
            "hskLevel": 2,
            "totalGrammarPoints": len(manifest_list),
            "reviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF",
            "grammarPoints": manifest_list
        }, f, ensure_ascii=False, indent=2)

    print(f"Saved grammar QA manifest to: {out_file}")

if __name__ == "__main__":
    audit_grammar()
