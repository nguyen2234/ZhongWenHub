# -*- coding: utf-8 -*-
"""
scripts/hsk30/build_hsk4_human_review_manifest.py
Phase 9.4 — Master Human Review Manifest Builder
Assembles all HSK 4 curriculum components into a single unified JSON manifest:
  - 1,000 Vocabularies with sentence examples
  - 95 Grammar points with formulas and examples
  - 80 Pedagogical exercises (4 per lesson across 20 lessons)
  - 5 Reading passages (1 per unit)
  - 40 Audio MP3 assets
Outputs to:
  - data/hsk30/staging/hsk4_content_human_review_manifest.json
"""

import sys
import json
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def build_manifest():
    print("=== Assembling HSK 4 Master Human Review Manifest ===")

    # 1. Load Vocabularies
    vocab_path = Path("data/hsk30/staging/hsk4_vocabulary_enrichment.json")
    with open(vocab_path, "r", encoding="utf-8") as f:
        vocabularies = json.load(f)

    # 2. Load Grammar Points
    grammar_path = Path("data/hsk30/staging/hsk4_grammar_qa_manifest.json")
    with open(grammar_path, "r", encoding="utf-8") as f:
        grammar_manifest = json.load(f)
        grammar_points = grammar_manifest.get("grammarPoints", [])

    # 3. Load Exercises
    exercise_path = Path("data/hsk30/staging/hsk4_exercises.json")
    with open(exercise_path, "r", encoding="utf-8") as f:
        exercises = json.load(f)

    # 4. Load Reading Passages
    passage_path = Path("data/hsk30/staging/hsk4_reading_passages.json")
    with open(passage_path, "r", encoding="utf-8") as f:
        passages = json.load(f)

    # 5. Load Audio Manifest
    audio_path = Path("data/hsk30/staging/hsk4_audio_qa_manifest.json")
    with open(audio_path, "r", encoding="utf-8") as f:
        audio_manifest = json.load(f)
        audio_files = audio_manifest.get("files", [])

    manifest = {
        "metadata": {
            "hskLevel": 4,
            "phase": "Phase 9.4",
            "curriculumVersion": "HSK 3.0 (GF 0025-2021)",
            "assembledAt": "2026-11-10T20:40:00Z",
            "reviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF",
            "scope": {
                "totalUnits": 5,
                "totalLessons": 20,
                "totalVocabularies": len(vocabularies),
                "totalGrammarPoints": len(grammar_points),
                "totalExercises": len(exercises),
                "totalReadingPassages": len(passages),
                "totalAudioFiles": len(audio_files)
            }
        },
        "curriculumSummary": {
            "targetProficiency": "B2 Intermediate / Upper Intermediate",
            "wordTarget": 1000,
            "grammarTarget": 95,
            "exerciseTarget": 80,
            "readingPassageTarget": 5
        },
        "vocabularies": vocabularies,
        "grammarPoints": grammar_points,
        "exercises": exercises,
        "readingPassages": passages,
        "audioFiles": audio_files
    }

    out_path = Path("data/hsk30/staging/hsk4_content_human_review_manifest.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"Manifest written successfully to: {out_path}")
    print(f"Total Vocabularies: {len(vocabularies)}")
    print(f"Total Grammar Points: {len(grammar_points)}")
    print(f"Total Exercises: {len(exercises)}")
    print(f"Total Reading Passages: {len(passages)}")
    print(f"Total Audio Files: {len(audio_files)}")

if __name__ == "__main__":
    build_manifest()
