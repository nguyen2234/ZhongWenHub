import os
import glob
import json

audio_dir = r"D:\ZhongWenHub\Fontend\public\audio\hsk1"
files = sorted(glob.glob(os.path.join(audio_dir, "*.mp3")))

results = []
valid_count = 0

for file_path in files:
    filename = os.path.basename(file_path)
    file_size = os.path.getsize(file_path)
    
    with open(file_path, "rb") as f:
        header = f.read(10)
    
    is_id3 = header[:3] == b"ID3"
    is_sync = (len(header) >= 2 and header[0] == 0xFF and (header[1] & 0xE0) == 0xE0)
    is_valid_mp3 = (is_id3 or is_sync) and file_size > 0
    
    if is_valid_mp3:
        valid_count += 1
        
    results.append({
        "filename": filename,
        "filePath": file_path,
        "sizeBytes": file_size,
        "hasId3": is_id3,
        "hasSyncFrame": is_sync,
        "isValidMp3": is_valid_mp3,
        "status": "VALID_MP3" if is_valid_mp3 else "INVALID_OR_EMPTY"
    })

print(f"Total HSK 1 audio files found: {len(results)}")
print(f"Valid MP3 files: {valid_count} / {len(results)}")

manifest_path = r"D:\ZhongWenHub\data\hsk30\staging\hsk1_audio_qa_manifest.json"
os.makedirs(os.path.dirname(manifest_path), exist_ok=True)
with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump({
        "auditDate": "2026-11-09",
        "hskLevel": 1,
        "totalFiles": len(results),
        "validFiles": valid_count,
        "audioDirectory": audio_dir,
        "files": results
    }, f, ensure_ascii=False, indent=2)

print(f"Saved audio manifest to {manifest_path}")
