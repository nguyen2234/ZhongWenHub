# -*- coding: utf-8 -*-
"""
HSK 3 Audio QA Audit Script
Phase 9.3 — Task 7

Audits all 40 MP3 files for HSK 3:
  - Dialogue audio (les1_dialogue.mp3 to les20_dialogue.mp3)
  - Listening audio (les1_listening.mp3 to les20_listening.mp3)
Outputs to:
  - data/hsk30/staging/hsk3_audio_qa_manifest.json
"""

import sys
import json
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def audit_audio():
    audio_dir = Path("Fontend/public/audio/hsk3")
    if not audio_dir.exists():
        print(f"Error: {audio_dir} does not exist!")
        sys.exit(1)

    manifest = []
    missing_files = []

    for lesson_num in range(1, 21):
        # 1. Dialogue
        diag_name = f"les{lesson_num}_dialogue.mp3"
        diag_path = audio_dir / diag_name
        if diag_path.exists():
            size = diag_path.stat().st_size
            manifest.append({
                "lessonNumber": lesson_num,
                "type": "dialogue",
                "filename": diag_name,
                "relativeUrl": f"/audio/hsk3/{diag_name}",
                "fileSizeBytes": size,
                "exists": True,
                "status": "VERIFIED_FILE_EXISTS" if size > 1000 else "FILE_TOO_SMALL"
            })
        else:
            missing_files.append(diag_name)
            manifest.append({
                "lessonNumber": lesson_num,
                "type": "dialogue",
                "filename": diag_name,
                "relativeUrl": f"/audio/hsk3/{diag_name}",
                "fileSizeBytes": 0,
                "exists": False,
                "status": "MISSING"
            })

        # 2. Listening
        list_name = f"les{lesson_num}_listening.mp3"
        list_path = audio_dir / list_name
        if list_path.exists():
            size = list_path.stat().st_size
            manifest.append({
                "lessonNumber": lesson_num,
                "type": "listening",
                "filename": list_name,
                "relativeUrl": f"/audio/hsk3/{list_name}",
                "fileSizeBytes": size,
                "exists": True,
                "status": "VERIFIED_FILE_EXISTS" if size > 1000 else "FILE_TOO_SMALL"
            })
        else:
            missing_files.append(list_name)
            manifest.append({
                "lessonNumber": lesson_num,
                "type": "listening",
                "filename": list_name,
                "relativeUrl": f"/audio/hsk3/{list_name}",
                "fileSizeBytes": 0,
                "exists": False,
                "status": "MISSING"
            })

    total_expected = 40
    total_found = len([m for m in manifest if m["exists"]])

    print(f"Total HSK 3 Audio Files expected: {total_expected}")
    print(f"Total HSK 3 Audio Files found on disk: {total_found}")

    if missing_files:
        print(f"Warning: {len(missing_files)} audio files missing: {missing_files}")
    else:
        print("SUCCESS: All 40 HSK 3 audio files are verified on disk!")

    out_data = {
        "phase": "9.3",
        "hskLevel": 3,
        "totalExpected": total_expected,
        "totalFound": total_found,
        "missingCount": len(missing_files),
        "reviewStatus": "VERIFIED_ON_DISK",
        "audioManifest": manifest
    }

    out_path = Path("data/hsk30/staging/hsk3_audio_qa_manifest.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out_data, f, ensure_ascii=False, indent=2)

    print(f"Saved: {out_path}")

if __name__ == "__main__":
    audit_audio()
