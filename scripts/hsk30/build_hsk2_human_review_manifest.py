# -*- coding: utf-8 -*-
"""
scripts/hsk30/build_hsk2_human_review_manifest.py
Phase 9.2 — Master Human Review Manifest Builder
Assembles all HSK 2 curriculum components into a single unified JSON manifest:
  - 200 Vocabularies with sentence examples
  - 78 Grammar points with formulas and examples
  - 60 Pedagogical exercises (4 per lesson)
  - 5 Reading passages (1 per unit)
  - 30 Audio MP3 assets
Outputs to:
  - data/hsk30/staging/hsk2_content_human_review_manifest.json
"""

import sys
import json
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def build_manifest():
    print("=== Assembling HSK 2 Master Human Review Manifest ===")

    # 1. Load Vocabularies
    vocab_path = Path("data/hsk30/staging/hsk2_vocabulary_enrichment.json")
    with open(vocab_path, "r", encoding="utf-8") as f:
        vocabularies = json.load(f)

    # 2. Load Grammar Points
    grammar_path = Path("data/hsk30/staging/hsk2_grammar_qa_manifest.json")
    with open(grammar_path, "r", encoding="utf-8") as f:
        grammar_manifest = json.load(f)
        grammar_points = grammar_manifest.get("grammarPoints", [])

    # 3. Load Exercises
    exercise_path = Path("data/hsk30/staging/hsk2_exercises.json")
    with open(exercise_path, "r", encoding="utf-8") as f:
        exercises = json.load(f)

    # 4. Load Reading Passages
    passages_path = Path("data/hsk30/staging/hsk2_reading_passages.json")
    with open(passages_path, "r", encoding="utf-8") as f:
        reading_passages = json.load(f)

    # 5. Load Audio QA
    audio_path = Path("data/hsk30/staging/hsk2_audio_qa_manifest.json")
    with open(audio_path, "r", encoding="utf-8") as f:
        audio_manifest = json.load(f)
        audio_files = audio_manifest.get("audioFiles", [])

    master_manifest = {
        "curriculum": "HSK 3.0 Standard Curriculum",
        "hskLevel": 2,
        "phase": "9.2",
        "generatedAtUtc": "2026-11-10T06:14:00Z",
        "reviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF",
        "signOffRequirements": {
            "linguisticExpertRequired": True,
            "curriculumLeadRequired": True,
            "signOffDate": None,
            "signatureStatus": "NEEDS_HUMAN_REVIEW"
        },
        "statistics": {
            "totalUnits": 5,
            "totalLessons": 15,
            "totalVocabularies": len(vocabularies),
            "vocabulariesWithExamples": sum(1 for v in vocabularies if v.get("examples")),
            "totalGrammarPoints": len(grammar_points),
            "totalExercises": len(exercises),
            "exercisesPerLesson": 4,
            "totalReadingPassages": len(reading_passages),
            "totalAudioFiles": len(audio_files),
            "totalCurriculumComponents": len(vocabularies) + len(grammar_points) + len(exercises) + len(reading_passages) + len(audio_files)
        },
        "units": [
            {"unitNumber": 1, "titleZh": "生活与起居", "titleVi": "Đời sống & Sinh hoạt hàng ngày", "lessons": [1, 2, 3]},
            {"unitNumber": 2, "titleZh": "工作与学习", "titleVi": "Học tập & Công việc", "lessons": [4, 5, 6]},
            {"unitNumber": 3, "titleZh": "健康与运动", "titleVi": "Sức khỏe & Vận động", "lessons": [7, 8, 9]},
            {"unitNumber": 4, "titleZh": "交往与娱乐", "titleVi": "Giao lưu & Thư giãn giải trí", "lessons": [10, 11, 12]},
            {"unitNumber": 5, "titleZh": "出行与复习", "titleVi": "Đi lại & Ôn tập HSK 2", "lessons": [13, 14, 15]}
        ],
        "vocabularies": vocabularies,
        "grammarPoints": grammar_points,
        "exercises": exercises,
        "readingPassages": reading_passages,
        "audioAssets": audio_files
    }

    out_file = Path("data/hsk30/staging/hsk2_content_human_review_manifest.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(master_manifest, f, ensure_ascii=False, indent=2)

    print(f"Master Review Manifest successfully written -> {out_file}")
    print(f"Stats: {master_manifest['statistics']}")

if __name__ == "__main__":
    build_manifest()
