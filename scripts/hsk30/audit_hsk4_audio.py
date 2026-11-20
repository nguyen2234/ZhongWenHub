# -*- coding: utf-8 -*-
"""
HSK 4 Audio QA Audit Script
Phase 9.4 — Task 7

Audits all 40 MP3 files for HSK 4:
  - Dialogue audio (les1_dialogue.mp3 to les20_dialogue.mp3)
  - Listening audio (les1_listening.mp3 to les20_listening.mp3)
Outputs to:
  - data/hsk30/staging/hsk4_audio_qa_manifest.json
"""

import sys
import json
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def audit_audio():
    print("=== ZHONGWENHUB PHASE 9.4: HSK 4 AUDIO QA AUDIT ===")
    audio_dir = Path("Fontend/public/audio/hsk4")
    if not audio_dir.exists():
        print(f"Error: {audio_dir} does not exist!")
        sys.exit(1)

    manifest = []
    missing_files = []
    total_size = 0

    for lesson_num in range(1, 21):
        # 1. Dialogue
        diag_name = f"les{lesson_num}_dialogue.mp3"
        diag_path = audio_dir / diag_name
        if diag_path.exists():
            size = diag_path.stat().st_size
            total_size += size
            manifest.append({
                "lessonNumber": lesson_num,
                "type": "dialogue",
                "filename": diag_name,
                "relativeUrl": f"/audio/hsk4/{diag_name}",
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
                "relativeUrl": f"/audio/hsk4/{diag_name}",
                "fileSizeBytes": 0,
                "exists": False,
                "status": "MISSING"
            })

        # 2. Listening
        list_name = f"les{lesson_num}_listening.mp3"
        list_path = audio_dir / list_name
        if list_path.exists():
            size = list_path.stat().st_size
            total_size += size
            manifest.append({
                "lessonNumber": lesson_num,
                "type": "listening",
                "filename": list_name,
                "relativeUrl": f"/audio/hsk4/{list_name}",
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
                "relativeUrl": f"/audio/hsk4/{list_name}",
                "fileSizeBytes": 0,
                "exists": False,
                "status": "MISSING"
            })

    print(f"Total audio files audited: {len(manifest)}")
    print(f"Verified files: {len(manifest) - len(missing_files)} / {len(manifest)}")
    print(f"Missing files: {len(missing_files)}")
    print(f"Total size: {total_size / (1024 * 1024):.2f} MB")

    out_manifest = {
        "phase": "9.4",
        "hskLevel": 4,
        "totalAudios": len(manifest),
        "totalVerified": len(manifest) - len(missing_files),
        "missingCount": len(missing_files),
        "totalSizeBytes": total_size,
        "reviewStatus": "VERIFIED_PENDING_EXPERT_SIGN_OFF",
        "files": manifest
    }

    out_path = Path("data/hsk30/staging/hsk4_audio_qa_manifest.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out_manifest, f, ensure_ascii=False, indent=2)
    print(f"Saved: {out_path}")

    # Update checkpoint
    from save_checkpoint import update_checkpoint
    update_checkpoint(
        stage="STAGE_AUDIO_QA_AUDITED",
        completed_lessons=list(range(1, 21)),
        completed_vocab_count=1000,
        status="IN_PROGRESS"
    )
    print("Checkpoint updated: STAGE_AUDIO_QA_AUDITED.")

if __name__ == "__main__":
    audit_audio()

