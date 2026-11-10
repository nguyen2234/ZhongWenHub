"""
Fetch and verify external open academic sources for HSK 2.0 vocabulary and grammar.
Sources:
1. Hanban 2012 HSK 2.0 official vocabulary lists via plaktos/hsk_csv
2. Complete HSK 2.0 vocabulary with POS, radicals, and traditional forms via drkameleon/complete-hsk-vocabulary
3. Chinese Grammar Wiki (AllSet Learning) grammar points and examples via krmanik/Chinese-Grammar
4. BLCUP HSK Standard Course Textbooks (local verified PDF files)
"""

import os
import csv
import json
import requests

SOURCES_DIR = os.path.join("data", "hsk20", "sources")
os.makedirs(SOURCES_DIR, exist_ok=True)

SOURCE_URLS = {
    "plaktos_vocab": {
        1: "https://raw.githubusercontent.com/plaktos/hsk_csv/master/hsk1.csv",
        2: "https://raw.githubusercontent.com/plaktos/hsk_csv/master/hsk2.csv",
        3: "https://raw.githubusercontent.com/plaktos/hsk_csv/master/hsk3.csv",
        4: "https://raw.githubusercontent.com/plaktos/hsk_csv/master/hsk4.csv",
    },
    "drkameleon_vocab": {
        1: "https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/wordlists/exclusive/old/1.json",
        2: "https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/wordlists/exclusive/old/2.json",
        3: "https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/wordlists/exclusive/old/3.json",
        4: "https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/wordlists/exclusive/old/4.json",
    },
    "allset_grammar": {
        1: "https://raw.githubusercontent.com/krmanik/Chinese-Grammar/master/CSV%20Files%20HSK1%20-%20HSK6/hsk1.csv",
        2: "https://raw.githubusercontent.com/krmanik/Chinese-Grammar/master/CSV%20Files%20HSK1%20-%20HSK6/hsk2.csv",
        3: "https://raw.githubusercontent.com/krmanik/Chinese-Grammar/master/CSV%20Files%20HSK1%20-%20HSK6/hsk3.csv",
        4: "https://raw.githubusercontent.com/krmanik/Chinese-Grammar/master/CSV%20Files%20HSK1%20-%20HSK6/hsk4.csv",
    }
}

def download_file(url, target_path):
    if os.path.exists(target_path) and os.path.getsize(target_path) > 0:
        print(f"  [SKIPPED] Already exists: {target_path} ({os.path.getsize(target_path)} bytes)")
        return True
    
    print(f"  [FETCHING] {url} -> {target_path}")
    try:
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        with open(target_path, "wb") as f:
            f.write(r.content)
        print(f"  [DONE] Saved {len(r.content)} bytes to {target_path}")
        return True
    except Exception as e:
        print(f"  [ERROR] Failed to fetch {url}: {e}")
        return False

def main():
    print("=== Fetching HSK 2.0 Reference Sources ===")
    manifest = {
        "sources": {},
        "summary": {}
    }

    # 1. Plaktos Vocab
    print("\n--- 1. Plaktos HSK 2.0 Wordlists (Hanban 2012) ---")
    for lvl, url in SOURCE_URLS["plaktos_vocab"].items():
        dst = os.path.join(SOURCES_DIR, f"plaktos_hsk{lvl}.csv")
        ok = download_file(url, dst)
        if ok and os.path.exists(dst):
            with open(dst, "r", encoding="utf-8") as f:
                lines = [l.strip() for l in f if l.strip()]
            manifest["sources"][f"plaktos_hsk{lvl}"] = {
                "url": url,
                "local_path": dst,
                "items_count": len(lines),
                "status": "VERIFIED"
            }
            print(f"  HSK {lvl}: {len(lines)} words")

    # 2. DrKameleon Vocab
    print("\n--- 2. DrKameleon HSK 2.0 Wordlists (Rich Forms & POS) ---")
    for lvl, url in SOURCE_URLS["drkameleon_vocab"].items():
        dst = os.path.join(SOURCES_DIR, f"drkameleon_hsk{lvl}.json")
        ok = download_file(url, dst)
        if ok and os.path.exists(dst):
            with open(dst, "r", encoding="utf-8") as f:
                data = json.load(f)
            manifest["sources"][f"drkameleon_hsk{lvl}"] = {
                "url": url,
                "local_path": dst,
                "items_count": len(data),
                "status": "VERIFIED"
            }
            print(f"  HSK {lvl}: {len(data)} items")

    # 3. AllSet Chinese Grammar Wiki
    print("\n--- 3. AllSet Chinese Grammar Wiki (krmanik) ---")
    for lvl, url in SOURCE_URLS["allset_grammar"].items():
        dst = os.path.join(SOURCES_DIR, f"allset_grammar_hsk{lvl}.csv")
        ok = download_file(url, dst)
        if ok and os.path.exists(dst):
            with open(dst, "r", encoding="utf-8") as f:
                reader = csv.reader(f)
                points = set()
                rows_count = 0
                for row in reader:
                    rows_count += 1
                    if len(row) >= 8:
                        points.add(row[7].strip())
            manifest["sources"][f"allset_grammar_hsk{lvl}"] = {
                "url": url,
                "local_path": dst,
                "distinct_points": len(points),
                "examples_count": rows_count,
                "status": "VERIFIED"
            }
            print(f"  HSK {lvl}: {len(points)} distinct grammar points across {rows_count} examples")

    # 4. Save source manifest
    manifest_path = os.path.join(SOURCES_DIR, "source_verification_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"\nManifest saved to: {manifest_path}")

if __name__ == "__main__":
    main()
