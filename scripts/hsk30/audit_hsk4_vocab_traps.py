# -*- coding: utf-8 -*-
"""
Audit HSK 4 Vocabulary Traps and Anomalies
Phase 9.4 — Task 3
Scans all 1000 words in dev_hsk4_vocab_raw.json for:
  - Archaic / feudal / dictionary definitions
  - Slang / vulgar definitions
  - Formatting anomalies
"""

import sys
import json
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("=== AUDITING HSK 4 VOCABULARY TRAPS ===")
    raw_path = Path("data/hsk30/staging/dev_hsk4_vocab_raw.json")
    with open(raw_path, "r", encoding="utf-8") as f:
        vocab = json.load(f)

    print(f"Total vocabulary items: {len(vocab)}")

    suspicious = []
    # Keywords indicating potential dictionary traps
    trap_keywords = [
        "tiếng lóng", "slang", "cũ", "cổ", "tục lệ", "nghĩa bóng", "gái mại dâm",
        "tục tĩu", "thô tục", "khiêu dâm", "đài loan", "đơn vị đo", "họ hai chữ",
        "tên người", "tên đất", "thời phong kiến", "triều đại"
    ]

    for item in vocab:
        m = item["meaningVi"].lower()
        matched = [k for k in trap_keywords if k in m]
        if matched or len(item["meaningVi"]) > 100 or ";" in item["meaningVi"]:
            suspicious.append((item["lessonNumber"], item["hanzi"], item["pinyin"], item["meaningVi"], matched))

    print(f"Found {len(suspicious)} potential traps / dictionary entries needing review:")
    for les, hz, py, m, matched in suspicious[:30]:
        print(f"  [L{les:02d}] {hz} ({py}): {m[:60]}... -> flagged: {matched}")

if __name__ == "__main__":
    main()
