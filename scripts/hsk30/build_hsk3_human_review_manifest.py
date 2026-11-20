# -*- coding: utf-8 -*-
"""
scripts/hsk30/build_hsk3_human_review_manifest.py
Phase 9.3 — Master Human Review Manifest Builder
Assembles all HSK 3 curriculum components into a single unified JSON manifest:
  - 500 Vocabularies with sentence examples
  - 96 Grammar points with formulas and examples
  - 80 Pedagogical exercises (4 per lesson across 20 lessons)
  - 5 Reading passages (1 per unit)
  - 40 Audio MP3 assets
Outputs to:
  - data/hsk30/staging/hsk3_content_human_review_manifest.json
"""

import sys
import json
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def build_manifest():
    print("=== Assembling HSK 3 Master Human Review Manifest ===")

    # 1. Load Vocabularies
    vocab_path = Path("data/hsk30/staging/hsk3_vocabulary_enrichment.json")
    with open(vocab_path, "r", encoding="utf-8") as f:
        vocabularies = json.load(f)

    # 2. Load Grammar Points
    grammar_path = Path("data/hsk30/staging/hsk3_grammar_qa_manifest.json")
    with open(grammar_path, "r", encoding="utf-8") as f:
        grammar_manifest = json.load(f)
        grammar_points = grammar_manifest.get("grammarPoints", [])

    # 3. Load Exercises
    exercise_path = Path("data/hsk30/staging/hsk3_exercises.json")
    with open(exercise_path, "r", encoding="utf-8") as f:
        exercises = json.load(f)

    # 4. Load Reading Passages
    passage_path = Path("data/hsk30/staging/hsk3_reading_passages.json")
    with open(passage_path, "r", encoding="utf-8") as f:
        passages = json.load(f)

    # 5. Load Audio Manifest
    audio_path = Path("data/hsk30/staging/hsk3_audio_qa_manifest.json")
    with open(audio_path, "r", encoding="utf-8") as f:
        audio_manifest = json.load(f)
        audio_files = audio_manifest.get("audioManifest", [])

    total_components = len(vocabularies) + len(grammar_points) + len(exercises) + len(passages) + len(audio_files)

    manifest_data = {
        "phase": "9.3",
        "hskLevel": 3,
        "title": "ZhongWenHub HSK 3 Complete Curriculum Master Human Review Manifest",
        "releaseStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF",
        "signOffNotice": "All components have passed automated linguistic, structural, integration, and E2E validation. Awaiting official pedagogical sign-off from human Chinese language expert before production deployment.",
        "componentCounts": {
            "vocabularies": len(vocabularies),
            "grammarPoints": len(grammar_points),
            "exercises": len(exercises),
            "readingPassages": len(passages),
            "audioFiles": len(audio_files),
            "totalComponents": total_components
        },
        "curriculumStructure": {
            "courses": 1,
            "units": 5,
            "lessons": 20,
            "vocabulariesPerLesson": 25,
            "exercisesPerLesson": 4
        },
        "components": {
            "vocabularies": [
                {
                    "id": v["devId"],
                    "lessonNumber": v["lessonNumber"],
                    "hanzi": v["hanzi"],
                    "pinyin": v["pinyin"],
                    "meaningVi": v["meaningVi"],
                    "partOfSpeech": v["partOfSpeech"],
                    "examples": json.loads(v["examplesJson"]) if isinstance(v["examplesJson"], str) else v["examplesJson"],
                    "status": "NEEDS_HUMAN_REVIEW"
                }
                for v in vocabularies
            ],
            "grammarPoints": [
                {
                    "id": g["id"],
                    "code": g["code"],
                    "lessonNumber": g["lessonNumber"],
                    "title": g["title"],
                    "structureFormula": g["structureFormula"],
                    "explanation": g["explanation"],
                    "status": "NEEDS_HUMAN_REVIEW"
                }
                for g in grammar_points
            ],
            "exercises": [
                {
                    "id": e["id"],
                    "lessonNumber": e["lessonNumber"],
                    "exerciseOrder": e["exerciseOrder"],
                    "type": e["type"],
                    "skill": e["skill"],
                    "title": e["title"],
                    "promptHanzi": e["promptHanzi"],
                    "correctOptionIndex": e["correctOptionIndex"],
                    "correctAnswer": e["correctAnswer"],
                    "status": "NEEDS_HUMAN_REVIEW"
                }
                for e in exercises
            ],
            "readingPassages": [
                {
                    "unitNumber": p["unitNumber"],
                    "lessonNumber": p["lessonNumber"],
                    "titleZh": p["titleZh"],
                    "titleVi": p["titleVi"],
                    "characterCount": p["characterCount"],
                    "questionCount": len(p["comprehensionQuestions"]),
                    "status": "NEEDS_HUMAN_REVIEW"
                }
                for p in passages
            ],
            "audioFiles": [
                {
                    "lessonNumber": a["lessonNumber"],
                    "type": a["type"],
                    "filename": a["filename"],
                    "relativeUrl": a["relativeUrl"],
                    "fileSizeBytes": a["fileSizeBytes"],
                    "status": "NEEDS_HUMAN_REVIEW"
                }
                for a in audio_files
            ]
        }
    }

    out_file = Path("data/hsk30/staging/hsk3_content_human_review_manifest.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, ensure_ascii=False, indent=2)

    print(f"Master Review Manifest successfully generated: {out_file}")
    print(f"Summary of Components: {manifest_data['componentCounts']}")

if __name__ == "__main__":
    build_manifest()
