# -*- coding: utf-8 -*-
import hashlib
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

CHECKPOINT_PATH = 'data/hsk30/staging/hsk4_phase94_checkpoint.json'

def compute_sha256(filepath):
    if not os.path.exists(filepath):
        return None
    with open(filepath, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()

def update_checkpoint(stage, completed_lessons, completed_vocab_count, status="IN_PROGRESS", extra=None):
    os.makedirs(os.path.dirname(CHECKPOINT_PATH), exist_ok=True)
    checkpoint = {
        "phase": "9.4",
        "current_stage": stage,
        "completed_tasks": [
            "Task 1: Baseline Audit & Data Dump",
            "Task 3: Vocabulary Enrichment P1 (L01-L05, 250 words)",
            "Task 3: Vocabulary Enrichment P2 (L06-L10, 250 words)"
        ],
        "completed_lessons": completed_lessons,
        "completed_vocabulary_count": completed_vocab_count,
        "remaining_stages": [
            "Vocabulary Enrichment P3 (L11-L15, 250 words)",
            "Vocabulary Enrichment P4 (L16-L20, 250 words)",
            "Vocabulary Enrichment Assembly & Manifest",
            "Source Provenance & Grammar Audit (95 points)",
            "5 Unit Reading Passages Integration",
            "Audio QA & Verification (40 files)",
            "Exercise Expansion (40 existing + 40 new = 80 exercises)",
            "Frontend Alignment & Bun Unit Tests",
            "Backend Integration & Multi-Batch Test DB Import/Rollback",
            "Lesson-by-Lesson Playwright E2E Testing",
            "19 Markdown Phase 9.4 Deliverables Generation"
        ],
        "file_hashes": {
            "hsk4_vocab_data_p1.py": compute_sha256("scripts/hsk30/hsk4_vocab_data_p1.py"),
            "hsk4_vocab_data_p2.py": compute_sha256("scripts/hsk30/hsk4_vocab_data_p2.py"),
            "dev_hsk4_vocab_raw.json": compute_sha256("data/hsk30/staging/dev_hsk4_vocab_raw.json"),
            "dev_hsk4_grammar_raw.json": compute_sha256("data/hsk30/staging/dev_hsk4_grammar_raw.json"),
            "dev_hsk4_exercises_raw.json": compute_sha256("data/hsk30/staging/dev_hsk4_exercises_raw.json")
        },
        "status": status
    }
    if extra:
        checkpoint.update(extra)
    with open(CHECKPOINT_PATH, 'w', encoding='utf-8') as f:
        json.dump(checkpoint, f, ensure_ascii=False, indent=2)
    print(f"Checkpoint saved to {CHECKPOINT_PATH} (stage={stage}, vocab_count={completed_vocab_count})")

if __name__ == '__main__':
    update_checkpoint("STAGE_RECOVERY_P1_P2_VALIDATED", list(range(1, 11)), 500)
