# -*- coding: utf-8 -*-
"""
scripts/hsk30/browser_audio_hsk2_qa.py
Phase 9.2 — Task 6: HSK 2 Browser Audio Reachability QA
Tests HTTP 200 reachability and MIME type of all 30 HSK 2 audio files via Vite server.
"""

import sys
import json
import urllib.request
import urllib.error
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:5173/ZhongWenHub/audio/hsk2"

print("=== Starting HSK 2 Browser Audio Reachability QA ===")
audio_manifest = []
success_count = 0
fail_count = 0

for lesson_num in range(1, 16):
    for audio_type in ["dialogue", "listening"]:
        filename = f"les{lesson_num}_{audio_type}.mp3"
        url = f"{BASE_URL}/{filename}"
        try:
            req = urllib.request.Request(url, method="HEAD")
            with urllib.request.urlopen(req, timeout=5) as response:
                status = response.status
                content_type = response.headers.get("Content-Type", "")
                content_length = int(response.headers.get("Content-Length", 0))

                if content_length == 0:
                    get_req = urllib.request.Request(url)
                    with urllib.request.urlopen(get_req, timeout=5) as get_resp:
                        data = get_resp.read()
                        content_length = len(data)
                        content_type = get_resp.headers.get("Content-Type", content_type)

                is_valid = (status == 200 and ("audio" in content_type or "mpeg" in content_type or "octet-stream" in content_type) and content_length > 1000)
                if is_valid:
                    success_count += 1
                else:
                    fail_count += 1

                record = {
                    "lessonNumber": lesson_num,
                    "type": audio_type,
                    "filename": filename,
                    "url": url,
                    "status": status,
                    "contentType": content_type,
                    "contentLength": content_length,
                    "reachable": status == 200,
                    "valid": is_valid
                }
                audio_manifest.append(record)
                print(f"[{'PASS' if is_valid else 'FAIL'}] {filename:22} -> Status: {status}, Type: {content_type}, Size: {content_length} bytes")

        except Exception as e:
            fail_count += 1
            print(f"[ERROR] {filename:22} -> {e}")
            audio_manifest.append({
                "lessonNumber": lesson_num,
                "type": audio_type,
                "filename": filename,
                "url": url,
                "status": 0,
                "error": str(e),
                "reachable": False,
                "valid": False
            })

out_path = Path("data/hsk30/staging/hsk2_audio_browser_qa_results.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump({
        "phase": "9.2",
        "hskLevel": 2,
        "totalAudioFiles": len(audio_manifest),
        "passed": success_count,
        "failed": fail_count,
        "ttsFallbackSupported": True,
        "results": audio_manifest
    }, f, ensure_ascii=False, indent=2)

print(f"\nCompleted: {success_count}/{len(audio_manifest)} passed ({fail_count} failed).")
print(f"Saved results to {out_path}")

if fail_count > 0:
    sys.exit(1)
