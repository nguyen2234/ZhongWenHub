import urllib.request
import json
import os

urls = [
    {
        "level": "HSK1",
        "category": "Textbook",
        "filename": "HSK-1-Textbook.pdf",
        "target_rel_path": "HSK1/Textbook/HSK-1-Textbook.pdf",
        "url": "https://cdn.baulchino.com/hsk-books/HSK-1-Textbook.pdf"
    },
    {
        "level": "HSK1",
        "category": "Workbook",
        "filename": "HSK-1-Workbook.pdf",
        "target_rel_path": "HSK1/Workbook/HSK-1-Workbook.pdf",
        "url": "https://cdn.baulchino.com/hsk-books/HSK-1-Workbook.pdf"
    },
    {
        "level": "HSK1",
        "category": "Answers",
        "filename": "hsk1-workbook-answers.pdf",
        "target_rel_path": "HSK1/Workbook/hsk1-workbook-answers.pdf",
        "url": "https://cdn.baulchino.com/hsk-books-answers/hsk1-workbook-answers.pdf"
    },
    {
        "level": "HSK1",
        "category": "Audio",
        "filename": "hsk1textbookaudios.zip",
        "target_rel_path": "HSK1/Audio/hsk1textbookaudios.zip",
        "url": "https://cdn.baulchino.com/hsk-books-audios/hsk1textbookaudios.zip"
    },
    {
        "level": "HSK1",
        "category": "Audio",
        "filename": "hsk1workbookaudios.zip",
        "target_rel_path": "HSK1/Audio/hsk1workbookaudios.zip",
        "url": "https://cdn.baulchino.com/hsk-books-audios/hsk1workbookaudios.zip"
    },
    {
        "level": "HSK2",
        "category": "Textbook",
        "filename": "HSK-2-Textbook.pdf",
        "target_rel_path": "HSK2/Textbook/HSK-2-Textbook.pdf",
        "url": "https://cdn.baulchino.com/hsk-books/HSK-2-Textbook.pdf"
    },
    {
        "level": "HSK2",
        "category": "Workbook",
        "filename": "HSK-2-Workbook.pdf",
        "target_rel_path": "HSK2/Workbook/HSK-2-Workbook.pdf",
        "url": "https://cdn.baulchino.com/hsk-books/HSK-2-Workbook.pdf"
    },
    {
        "level": "HSK2",
        "category": "Audio",
        "filename": "hsk2textbookaudios.zip",
        "target_rel_path": "HSK2/Audio/hsk2textbookaudios.zip",
        "url": "https://cdn.baulchino.com/hsk-books-audios/hsk2textbookaudios.zip"
    },
    {
        "level": "HSK2",
        "category": "Audio",
        "filename": "hsk2workbookaudios.zip",
        "target_rel_path": "HSK2/Audio/hsk2workbookaudios.zip",
        "url": "https://cdn.baulchino.com/hsk-books-audios/hsk2workbookaudios.zip"
    },
    {
        "level": "HSK3",
        "category": "Textbook",
        "filename": "HSK-3-Textbook.pdf",
        "target_rel_path": "HSK3/Textbook/HSK-3-Textbook.pdf",
        "url": "https://cdn.baulchino.com/hsk-books/HSK-3-Textbook.pdf"
    },
    {
        "level": "HSK3",
        "category": "Workbook",
        "filename": "HSK-3-Workbook.pdf",
        "target_rel_path": "HSK3/Workbook/HSK-3-Workbook.pdf",
        "url": "https://cdn.baulchino.com/hsk-books/HSK-3-Workbook.pdf"
    },
    {
        "level": "HSK3",
        "category": "Audio",
        "filename": "hsk3textbookaudios.zip",
        "target_rel_path": "HSK3/Audio/hsk3textbookaudios.zip",
        "url": "https://cdn.baulchino.com/hsk-books-audios/hsk3textbookaudios.zip"
    },
    {
        "level": "HSK3",
        "category": "Audio",
        "filename": "hsk3workbookaudios.zip",
        "target_rel_path": "HSK3/Audio/hsk3workbookaudios.zip",
        "url": "https://cdn.baulchino.com/hsk-books-audios/hsk3workbookaudios.zip"
    },
    {
        "level": "HSK4",
        "category": "Textbook",
        "filename": "HSK-4A-Textbook.pdf",
        "target_rel_path": "HSK4/Textbook/HSK4A.pdf",
        "url": "https://cdn.baulchino.com/hsk-books/HSK-4A-Textbook.pdf"
    },
    {
        "level": "HSK4",
        "category": "Workbook",
        "filename": "HSK-4A-Workbook.pdf",
        "target_rel_path": "HSK4/Workbook/HSK4A.pdf",
        "url": "https://cdn.baulchino.com/hsk-books/HSK-4A-Workbook.pdf"
    },
    {
        "level": "HSK4",
        "category": "Textbook",
        "filename": "HSK-4B-Textbook.pdf",
        "target_rel_path": "HSK4/Textbook/HSK4B.pdf",
        "url": "https://cdn.baulchino.com/hsk-books/HSK-4B-Textbook.pdf"
    },
    {
        "level": "HSK4",
        "category": "Workbook",
        "filename": "HSK-4B-Workbook.pdf",
        "target_rel_path": "HSK4/Workbook/HSK4B.pdf",
        "url": "https://cdn.baulchino.com/hsk-books/HSK-4B-Workbook.pdf"
    },
    {
        "level": "HSK4",
        "category": "Audio",
        "filename": "hsk4Atextbookaudios.zip",
        "target_rel_path": "HSK4/Audio/hsk4Atextbookaudios.zip",
        "url": "https://cdn.baulchino.com/hsk-books-audios/hsk4Atextbookaudios.zip"
    },
    {
        "level": "HSK4",
        "category": "Audio",
        "filename": "hsk4Aworkbookaudios.zip",
        "target_rel_path": "HSK4/Audio/hsk4Aworkbookaudios.zip",
        "url": "https://cdn.baulchino.com/hsk-books-audios/hsk4Aworkbookaudios.zip"
    },
    {
        "level": "HSK4",
        "category": "Audio",
        "filename": "hsk4Btextbookaudios.zip",
        "target_rel_path": "HSK4/Audio/hsk4Btextbookaudios.zip",
        "url": "https://cdn.baulchino.com/hsk-books-audios/hsk4Btextbookaudios.zip"
    },
    {
        "level": "HSK4",
        "category": "Audio",
        "filename": "hsk4Bworkbookaudios.zip",
        "target_rel_path": "HSK4/Audio/hsk4Bworkbookaudios.zip",
        "url": "https://cdn.baulchino.com/hsk-books-audios/hsk4Bworkbookaudios.zip"
    }
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

verified_manifest = []

print("Verifying link availability via HTTP HEAD...")
for item in urls:
    req = urllib.request.Request(item["url"], headers=headers, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            size_bytes = int(r.headers.get("Content-Length", 0))
            size_mb = size_bytes / (1024 * 1024)
            ctype = r.headers.get("Content-Type", "")
            ranges = r.headers.get("Accept-Ranges", "")
            status = r.status
            
            entry = {
                **item,
                "status": "AVAILABLE",
                "http_status": status,
                "size_bytes": size_bytes,
                "size_mb": round(size_mb, 2),
                "content_type": ctype,
                "accept_ranges": ranges == "bytes"
            }
            verified_manifest.append(entry)
            print(f"[{entry['level']} | {entry['category']}] {entry['filename']} -> OK ({entry['size_mb']} MB, Range: {entry['accept_ranges']})")
    except Exception as e:
        entry = {
            **item,
            "status": "UNAVAILABLE",
            "error": str(e)
        }
        verified_manifest.append(entry)
        print(f"[{item['level']} | {item['category']}] {item['filename']} -> FAILED ({e})")

out_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hsk_source_manifest.json")
with open(out_file, "w", encoding="utf-8") as f:
    json.dump(verified_manifest, f, indent=2, ensure_ascii=False)

print(f"\nManifest saved to: {out_file}")
total_size = sum(x.get("size_mb", 0) for x in verified_manifest if x.get("status") == "AVAILABLE")
print(f"Total verified files: {len(verified_manifest)} | Total size: {total_size:.2f} MB")
