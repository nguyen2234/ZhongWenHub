#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate all 9 AI Collaboration Bridge task files for Master HSK 1-4 Completion.
"""

import os
import json
from datetime import datetime

TASKS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".ai-collaboration", "tasks")

timestamp = "2026-11-10T23:50:00Z"
commit_sha = "3918063"

tasks = [
    {
        "schema_version": "1.0.0",
        "task_id": "ZWH-HSK1-4-COMPLETION",
        "title": "Master HSK 1-4 Complete Curriculum Integration & Verification",
        "description": "Master orchestration task overseeing complete curriculum integration for HSK 1 to HSK 4 (70 lessons, 2008 vocabulary, 341 grammar, 350 exercises), HSK 5-6 Coming Soon enforcement, fullstack testing, and release gate approval.",
        "project": "ZhongWenHub",
        "phase": "Master Curriculum Integration",
        "owner": "ChatGPT",
        "reviewer": "ChatGPT",
        "executor": "Antigravity",
        "status": "WAITING_FOR_REVIEW",
        "revision": 1,
        "issue_number": 17,
        "expected_branch": "integration/zhongwenhub-sqlserver",
        "source_commit": commit_sha,
        "input_files": [
            "data/hsk30/reference/current_db_inventory.json",
            "data/hsk30/staging/hsk4_phase94_checkpoint.json",
            ".ai-collaboration/qa/functional-test-matrix.json"
        ],
        "expected_outputs": [
            "docs/hsk30/HSK1_TO_HSK4_FINAL_COMPLETION_REPORT.md",
            "data/hsk30/reference/current_db_inventory.json",
            ".ai-collaboration/results/ZWH-HSK1-4-COMPLETION_result.json"
        ],
        "acceptance_criteria": [
            "Complete HSK 1-4 curriculum: 70 lessons, 2008 vocab, 341 grammar, 350 exercises, 70 dialogues, 21 passages, 140 audios",
            "HSK 5 and HSK 6 strictly Coming Soon with zero fake lessons, zero vocab, and DRAFT status",
            "Zero writes to ZhongWenHub_Dev; all updates verified against ZhongWenHub_Test",
            "100% Bun frontend unit tests (288 tests) and .NET backend unit tests (38 tests) pass",
            "AI Collaboration Bridge schemas and QA evidence audit pass",
            "Final completion report docs/hsk30/HSK1_TO_HSK4_FINAL_COMPLETION_REPORT.md generated",
            "PR #16 remains Open and Draft awaiting human academic approval"
        ],
        "safety_constraints": [
            "Dev DB ZhongWenHub_Dev is strictly read-only (0 writes)",
            "Runtime check SELECT DB_NAME() == 'ZhongWenHub_Test' required for test DB modifications",
            "Do not auto-publish lessons to students (maintain DRAFT / staging state)",
            "Do not merge PR #16"
        ],
        "created_at": timestamp,
        "updated_at": timestamp
    },
    {
        "schema_version": "1.0.0",
        "task_id": "HSK1-AUDIT-COMPLETE",
        "title": "HSK 1 Curriculum Audit & Lesson Foreign Key Linking",
        "description": "Audit and verify HSK 1 curriculum: 15 lessons, 308 vocabulary with lesson foreign key links, 72 grammar points, 60 exercises, 15 dialogues, 6 reading passages, 30 audio files in ZhongWenHub_Test.",
        "project": "ZhongWenHub",
        "phase": "Phase 9.1",
        "owner": "ChatGPT",
        "reviewer": "ChatGPT",
        "executor": "Antigravity",
        "status": "COMPLETED",
        "revision": 1,
        "issue_number": None,
        "expected_branch": "integration/zhongwenhub-sqlserver",
        "source_commit": commit_sha,
        "input_files": [
            "data/hsk30/staging/hsk1_vocabulary_qa_manifest_300.json",
            "scripts/hsk30/link_hsk1_vocab_to_lessons.py"
        ],
        "expected_outputs": [
            "data/hsk30/reference/current_db_inventory.json"
        ],
        "acceptance_criteria": [
            "All 15 HSK 1 lessons exist with valid IDs",
            "308 vocabulary records linked to lessons with non-null LessonId",
            "72 grammar points and 60 exercises verified in ZhongWenHub_Test",
            "15 dialogues and 6 reading passages verified"
        ],
        "safety_constraints": [
            "Dev DB is strictly read-only",
            "Verify ZhongWenHub_Test before updating vocabulary LessonId"
        ],
        "created_at": timestamp,
        "updated_at": timestamp
    },
    {
        "schema_version": "1.0.0",
        "task_id": "HSK2-AUDIT-COMPLETE",
        "title": "HSK 2 Curriculum Verification & Test DB Integrity",
        "description": "Audit and verify HSK 2 curriculum: 15 lessons, 200 vocabulary, 78 grammar points, 90 exercises, 15 dialogues, 5 reading passages, 30 audio files in ZhongWenHub_Test.",
        "project": "ZhongWenHub",
        "phase": "Phase 9.2",
        "owner": "ChatGPT",
        "reviewer": "ChatGPT",
        "executor": "Antigravity",
        "status": "COMPLETED",
        "revision": 1,
        "issue_number": None,
        "expected_branch": "integration/zhongwenhub-sqlserver",
        "source_commit": commit_sha,
        "input_files": [
            "data/hsk30/reference/current_db_inventory.json"
        ],
        "expected_outputs": [
            "data/hsk30/reference/current_db_inventory.json"
        ],
        "acceptance_criteria": [
            "15 lessons in HSK 2 verified in ZhongWenHub_Test",
            "200 vocabulary entries with verified pinyin and Vietnamese definitions",
            "78 grammar points, 90 exercises, 15 dialogues, 5 passages, 30 audios verified"
        ],
        "safety_constraints": [
            "Read-only audit against ZhongWenHub_Test"
        ],
        "created_at": timestamp,
        "updated_at": timestamp
    },
    {
        "schema_version": "1.0.0",
        "task_id": "HSK3-AUDIT-COMPLETE",
        "title": "HSK 3 Curriculum Verification & Test DB Integrity",
        "description": "Audit and verify HSK 3 curriculum: 20 lessons, 500 vocabulary, 96 grammar points, 120 exercises, 20 dialogues, 5 reading passages, 40 audio files in ZhongWenHub_Test.",
        "project": "ZhongWenHub",
        "phase": "Phase 9.3",
        "owner": "ChatGPT",
        "reviewer": "ChatGPT",
        "executor": "Antigravity",
        "status": "COMPLETED",
        "revision": 1,
        "issue_number": None,
        "expected_branch": "integration/zhongwenhub-sqlserver",
        "source_commit": commit_sha,
        "input_files": [
            "data/hsk30/reference/current_db_inventory.json"
        ],
        "expected_outputs": [
            "data/hsk30/reference/current_db_inventory.json"
        ],
        "acceptance_criteria": [
            "20 lessons in HSK 3 verified in ZhongWenHub_Test",
            "500 vocabulary entries with verified pinyin and Vietnamese definitions",
            "96 grammar points, 120 exercises, 20 dialogues, 5 passages, 40 audios verified"
        ],
        "safety_constraints": [
            "Read-only audit against ZhongWenHub_Test"
        ],
        "created_at": timestamp,
        "updated_at": timestamp
    },
    {
        "schema_version": "1.0.0",
        "task_id": "HSK4-PHASE94-COMPLETE",
        "title": "HSK 4 Complete Curriculum Development & Multi-Batch Enrichment",
        "description": "Audit and verify HSK 4 curriculum: 20 lessons, 1000 vocabulary with rich contextual examples, 95 grammar points, 80 exercises, 20 dialogues, 5 reading passages, 40 audio files in ZhongWenHub_Test. Linked to GitHub Issue #17.",
        "project": "ZhongWenHub",
        "phase": "Phase 9.4",
        "owner": "ChatGPT",
        "reviewer": "ChatGPT",
        "executor": "Antigravity",
        "status": "COMPLETED",
        "revision": 1,
        "issue_number": 17,
        "expected_branch": "integration/zhongwenhub-sqlserver",
        "source_commit": commit_sha,
        "input_files": [
            "data/hsk30/staging/hsk4_phase94_checkpoint.json",
            "data/hsk30/reference/current_db_inventory.json"
        ],
        "expected_outputs": [
            "data/hsk30/reference/current_db_inventory.json",
            "docs/hsk30/phase94/HSK4_PHASE94_MASTER_REPORT.md"
        ],
        "acceptance_criteria": [
            "All 20 HSK 4 lessons enriched in ZhongWenHub_Test",
            "Exactly 1,000 vocabulary words with examples and Vietnamese translations",
            "95 grammar points, 80 exercises, 20 dialogues, 5 passages, 40 audios verified",
            "Playwright E2E and multi-batch rollback verified"
        ],
        "safety_constraints": [
            "Dev DB is strictly read-only",
            "All 20 lessons maintained in DRAFT state awaiting expert sign-off"
        ],
        "created_at": timestamp,
        "updated_at": timestamp
    },
    {
        "schema_version": "1.0.0",
        "task_id": "HSK5-6-COMING-SOON",
        "title": "HSK 5 & 6 Coming Soon Invariant Enforcement",
        "description": "Enforce strict Coming Soon state for HSK 5 and HSK 6: all database lessons remain DRAFT with zero vocabularies, frontend units/lessons cleared, coming soon badge displayed, no fake progress, no playable buttons.",
        "project": "ZhongWenHub",
        "phase": "Phase 9.5",
        "owner": "ChatGPT",
        "reviewer": "ChatGPT",
        "executor": "Antigravity",
        "status": "COMPLETED",
        "revision": 1,
        "issue_number": None,
        "expected_branch": "integration/zhongwenhub-sqlserver",
        "source_commit": commit_sha,
        "input_files": [
            "Fontend/src/features/learning/data/curriculumData.ts",
            "Fontend/src/features/learning-path/components/HskCurriculumView.tsx",
            "Fontend/src/features/dashboard/pages/DashboardPage.tsx"
        ],
        "expected_outputs": [
            "Fontend/src/features/learning/data/curriculumData.ts",
            "Fontend/src/features/learning-path/components/HskCurriculumView.tsx",
            "Fontend/src/features/dashboard/pages/DashboardPage.tsx"
        ],
        "acceptance_criteria": [
            "Frontend HSK 5, 6, 7 have units: [] and isComingSoon: true",
            "HskCurriculumView shows dedicated Coming Soon state with CTA to HSK 4/1",
            "Dashboard displays Sắp ra mắt badge with no fake progress bar",
            "DB lessons for HSK 5 and 6 remain 100% DRAFT with 0 vocabularies"
        ],
        "safety_constraints": [
            "No fake placeholder content or mock lessons injected into HSK 5 or 6"
        ],
        "created_at": timestamp,
        "updated_at": timestamp
    },
    {
        "schema_version": "1.0.0",
        "task_id": "FULLSTACK-INTEGRATION",
        "title": "Fullstack Architecture & Contract Integration Verification",
        "description": "Verify backend ContentController, EF Core migrations, SQL Server schema integrity, frontend curriculum adapters, navigation, and dashboard integration.",
        "project": "ZhongWenHub",
        "phase": "Fullstack Integration",
        "owner": "ChatGPT",
        "reviewer": "ChatGPT",
        "executor": "Antigravity",
        "status": "COMPLETED",
        "revision": 1,
        "issue_number": None,
        "expected_branch": "integration/zhongwenhub-sqlserver",
        "source_commit": commit_sha,
        "input_files": [
            "Backend/src/Presentation/Controllers/ContentController.cs",
            "Fontend/src/features/learning/data/curriculumData.ts"
        ],
        "expected_outputs": [
            ".ai-collaboration/qa/functional-test-matrix.json"
        ],
        "acceptance_criteria": [
            "ContentController enforces role-based access (publishedOnly = !IsStaff())",
            "No schema breakage across courses, lessons, vocabularies, grammar_points, exercises",
            "Frontend routing and topic presentation adapters work seamlessly across HSK 1-4"
        ],
        "safety_constraints": [
            "Preserve EF Core database schema stability and access controls"
        ],
        "created_at": timestamp,
        "updated_at": timestamp
    },
    {
        "schema_version": "1.0.0",
        "task_id": "FUNCTIONAL-QA",
        "title": "Comprehensive Functional QA & Automated Test Suite Execution",
        "description": "Execute 288 Bun frontend unit tests, 38 Backend .NET unit tests, 35 matrix QA test cases, and verify release gate criteria with real on-disk artifacts.",
        "project": "ZhongWenHub",
        "phase": "Quality Assurance",
        "owner": "ChatGPT",
        "reviewer": "ChatGPT",
        "executor": "Antigravity",
        "status": "COMPLETED",
        "revision": 1,
        "issue_number": None,
        "expected_branch": "integration/zhongwenhub-sqlserver",
        "source_commit": commit_sha,
        "input_files": [
            ".ai-collaboration/qa/functional-test-matrix.json",
            ".ai-collaboration/qa/release-gate.json"
        ],
        "expected_outputs": [
            ".ai-collaboration/qa/functional-test-matrix.json",
            ".ai-collaboration/qa/release-gate.json"
        ],
        "acceptance_criteria": [
            "288 Bun frontend unit tests pass (0 failures)",
            "38 Backend .NET unit tests pass (0 failures)",
            "verify_qa_evidence.py passes with 27 verified PASS, 7 BLOCKED, 1 NOT_TESTED, 0 static passes",
            "verify_release_gate.py evaluates to TECHNICAL_QA_PASSED"
        ],
        "safety_constraints": [
            "Zero fake passes; all test results backed by actual command execution"
        ],
        "created_at": timestamp,
        "updated_at": timestamp
    },
    {
        "schema_version": "1.0.0",
        "task_id": "FINAL-REVIEW",
        "title": "Final Multi-Agent Academic and Release Review",
        "description": "Coordinate cross-model review between Antigravity and ChatGPT via GitHub AI Bridge, audit full deliverables, and compile final completion report.",
        "project": "ZhongWenHub",
        "phase": "Release Readiness",
        "owner": "ChatGPT",
        "reviewer": "ChatGPT",
        "executor": "Antigravity",
        "status": "WAITING_FOR_REVIEW",
        "revision": 1,
        "issue_number": 17,
        "expected_branch": "integration/zhongwenhub-sqlserver",
        "source_commit": commit_sha,
        "input_files": [
            "docs/hsk30/HSK1_TO_HSK4_FINAL_COMPLETION_REPORT.md",
            "data/hsk30/reference/current_db_inventory.json"
        ],
        "expected_outputs": [
            "docs/hsk30/HSK1_TO_HSK4_FINAL_COMPLETION_REPORT.md"
        ],
        "acceptance_criteria": [
            "Comprehensive 26-section master completion report compiled",
            "Verdict concluded as HSK1_4_TECHNICALLY_COMPLETE_AWAITING_HUMAN_APPROVAL",
            "Verdict concluded as HSK5_6_COMING_SOON_NO_LESSONS",
            "PR #16 remains Open & Draft awaiting human academic approval"
        ],
        "safety_constraints": [
            "Do not merge PR #16 or publish to students without human review"
        ],
        "created_at": timestamp,
        "updated_at": timestamp
    }
]

for t in tasks:
    filename = f"{t['task_id']}.json"
    filepath = os.path.join(TASKS_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(t, f, indent=2, ensure_ascii=False)
    print(f"Created task: {filename}")

print(f"Successfully generated {len(tasks)} tasks.")

