# -*- coding: utf-8 -*-
"""
HSK 2 Audio QA Audit Script
Phase 9.2 — Task 6

Audits all 30 MP3 files for HSK 2:
  - Dialogue audio (les1_dialogue.mp3 to les15_dialogue.mp3)
  - Listening audio (les1_listening.mp3 to les15_listening.mp3)
Outputs to:
  - data/hsk30/staging/hsk2_audio_qa_manifest.json
"""

import sys
import json
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def audit_audio():
    audio_dir = Path("Fontend/public/audio/hsk2")
    if not audio_dir.exists():
        print(f"Error: {audio_dir} does not exist!")
        sys.exit(1)

    manifest = []
    missing_files = []

    for lesson_num in range(1, 16):
        # 1. Dialogue
        diag_name = f"les{lesson_num}_dialogue.mp3"
        diag_path = audio_dir / diag_name
        if diag_path.exists():
            size = diag_path.stat().st_size
            manifest.append({
                "lessonNumber": lesson_num,
                "type": "dialogue",
                "filename": diag_name,
                "relativeUrl": f"/audio/hsk2/{diag_name}",
                "fileSizeBytes": size,
                "exists": True,
                "status": "VERIFIED_FILE_READY"
            })
        else:
            missing_files.append(diag_name)

        # 2. Listening
        list_name = f"les{lesson_num}_listening.mp3"
        list_path = audio_dir / list_name
        if list_path.exists():
            size = list_path.stat().st_size
            manifest.append({
                "lessonNumber": lesson_num,
                "type": "listening",
                "filename": list_name,
                "relativeUrl": f"/audio/hsk2/{list_name}",
                "fileSizeBytes": size,
                "exists": True,
                "status": "VERIFIED_FILE_READY"
            })
        else:
            missing_files.append(list_name)

    print(f"Total audio files audited: {len(manifest)}/30")
    if missing_files:
        print(f"Missing {len(missing_files)} files:", missing_files)
        sys.exit(1)

    out_file = Path("data/hsk30/staging/hsk2_audio_qa_manifest.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump({
            "phase": "9.2",
            "hskLevel": 2,
            "totalAudioFiles": len(manifest),
            "verifiedCount": len(manifest),
            "ttsFallbackAvailable": True,
            "audioFiles": manifest
        }, f, ensure_ascii=False, indent=2)

    print(f"Saved audio QA manifest to: {out_file}")

if __name__ == "__main__":
    audit_audio()
