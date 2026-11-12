"""
ZhongWenHub Question Bank Real GitHub Audit, Normalization, Deduplication & Import Pipeline.

Repositories audited:
1. Roxaleen/hsk-annotated-corpus -> REJECTED (no LICENSE file in repo).
2. drkameleon/complete-hsk-vocabulary -> APPROVED (MIT License) lexical baseline (already in vocabularies).
3. InAnskr/HSK4Level-Test -> APPROVED for non-commercial educational attribution use (CC BY-NC-SA 4.0)
   for pure-text HSK 4 Reading items (Q46-Q85), entering strictly as DRAFT + PENDING_REVIEW.

Safety rules:
- Never auto-publishes imported or generated questions (Status='DRAFT', ReviewStatus='PENDING_REVIEW').
- Never mutates the 337 existing PUBLISHED curriculum exercises (except backfilling ContentHash/Difficulty).
- Normalizes NFKC + hashes canonical keys cleanly to match C# QuestionValidationHelper.ComputeContentHash.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import unicodedata
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pyodbc

ROOT = Path(r"D:\ZhongWenHub")
DATA_DIR = ROOT / "data" / "question-bank"
RAW_DIR = DATA_DIR / "inanskr_raw"
NORMALIZED_OUT = DATA_DIR / "inanskr_hsk4_normalized.json"
REPORT_OUT = ROOT / "docs" / "hsk20" / "QUESTION_BANK_GITHUB_AUDIT_AND_PIPELINE.md"

CONNS = {
    "Dev": (
        r"Driver={ODBC Driver 17 for SQL Server};"
        r"Server=.\SQLEXPRESS;"
        r"Database=ZhongWenHub_Dev;"
        r"Trusted_Connection=yes;"
    ),
    "Test": (
        r"Driver={ODBC Driver 17 for SQL Server};"
        r"Server=.\SQLEXPRESS;"
        r"Database=ZhongWenHub_Test;"
        r"Trusted_Connection=yes;"
    ),
}

PUNCT_AND_SPACE_RE = re.compile(r"[\s\u3000\.,!\?。！？，、；：\"'“”‘’（）\(\)【】\[\]—\-·…~`]+")
PAREN_NOTE_RE = re.compile(r"\s*\([^)]*\)\s*")
OPTION_PREFIX_RE = re.compile(r"^[A-F][\.．、\s]+")


def normalize_answer_text(value: str | None) -> str:
    if not value or not value.strip():
        return ""
    nfkc = unicodedata.normalize("NFKC", value)
    return PUNCT_AND_SPACE_RE.sub("", nfkc).strip().lower()


def strip_parenthetical_note(value: str | None) -> str:
    if not value or not value.strip():
        return ""
    return PAREN_NOTE_RE.sub(" ", value).strip()


def normalize_type(raw_type: str | None) -> str:
    t = (raw_type or "multiple-choice").strip().lower()
    if t in ("fill-in-the-blank", "fill_blank", "fill_in_blank", "fill-blank"):
        return "fill-blank"
    if t in ("sentence-ordering", "sentence_order", "sentence-order"):
        return "sentence-order"
    if t in ("listening", "listen-choice"):
        return "listen-choice"
    if t == "listening_true_false":
        return "listening_true_false"
    if t in ("reading_comprehension", "reading_ordering", "choice"):
        return "multiple-choice"
    if t in (
        "multiple-choice",
        "matching",
        "chinese-to-vietnamese",
        "vietnamese-to-chinese",
        "pronunciation",
        "speaking",
        "hanzi-writing",
    ):
        return t
    return "multiple-choice"


def compute_content_hash(
    hsk_level: int,
    raw_type: str | None,
    prompt_hanzi: str | None,
    prompt_vi: str | None,
    correct_answer: str | None,
) -> str:
    canonical_type = normalize_type(raw_type)
    p_hanzi = normalize_answer_text(prompt_hanzi)
    p_vi = normalize_answer_text(prompt_vi)
    ans = normalize_answer_text(strip_parenthetical_note(correct_answer))
    payload = f"{hsk_level}|{canonical_type}|{p_hanzi}|{p_vi}|{ans}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest().lower()


def clean_option_label(opt: str) -> str:
    cleaned = OPTION_PREFIX_RE.sub("", str(opt).strip(), count=1).strip()
    return cleaned if cleaned else str(opt).strip()


def download_inanskr_tests() -> tuple[list[dict[str, Any]], dict[str, int]]:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    accepted: list[dict[str, Any]] = []
    stats = {
        "total_raw": 0,
        "skipped_listening_audio": 0,
        "skipped_incomplete_or_writing": 0,
        "skipped_invalid": 0,
        "accepted_reading": 0,
    }

    for idx in range(1, 13):
        fname = f"test-{idx:02d}.json"
        local_path = RAW_DIR / fname
        if not local_path.exists():
            url = f"https://raw.githubusercontent.com/InAnskr/HSK4Level-Test/main/data/{fname}"
            raw_bytes = urllib.request.urlopen(url, timeout=20).read()
            local_path.write_bytes(raw_bytes)
        payload = json.loads(local_path.read_text(encoding="utf-8"))
        questions = payload.get("questions", [])
        for q in questions:
            stats["total_raw"] += 1
            qtype = (q.get("type") or "").strip().lower()
            text = (q.get("text") or "").strip()
            audio = (q.get("audio") or "").strip()
            options = q.get("options") or []
            c_idx = q.get("correct_answer_index")

            if audio or qtype.startswith("listening"):
                stats["skipped_listening_audio"] += 1
                continue

            if qtype not in ("fill_in_blank", "reading_ordering", "reading_comprehension"):
                stats["skipped_incomplete_or_writing"] += 1
                continue

            if not text or not isinstance(options, list) or len(options) < 2 or c_idx is None:
                stats["skipped_invalid"] += 1
                continue

            if not isinstance(c_idx, int) or c_idx < 0 or c_idx >= len(options):
                stats["skipped_invalid"] += 1
                continue

            cleaned_opts = [clean_option_label(o) for o in options]
            norm_opts = [normalize_answer_text(o) for o in cleaned_opts]
            if any(not o for o in norm_opts) or len(set(norm_opts)) < len(cleaned_opts):
                stats["skipped_invalid"] += 1
                continue

            target_type = "fill-blank" if qtype == "fill_in_blank" else "multiple-choice"
            skill = "vocabulary" if qtype == "fill_in_blank" else ("sentence" if qtype == "reading_ordering" else "reading")
            instruction = (
                "Chọn từ thích hợp nhất để điền vào chỗ trống (HSK 4)."
                if qtype == "fill_in_blank"
                else (
                    "Chọn thứ tự sắp xếp A-B-C logic nhất để tạo thành đoạn hoàn chỉnh."
                    if qtype == "reading_ordering"
                    else "Đọc đoạn văn sau và chọn phương án đúng nhất."
                )
            )
            correct_answer = cleaned_opts[c_idx]
            chash = compute_content_hash(4, target_type, text, "", correct_answer)

            accepted.append(
                {
                    "type": target_type,
                    "skill": skill,
                    "hskLevel": 4,
                    "difficulty": "HARD",
                    "title": f"HSK 4 {fname.replace('.json', '').upper()} · Câu {q.get('number')}",
                    "instruction": instruction,
                    "promptHanzi": text,
                    "promptPinyin": None,
                    "promptVietnamese": "Nguồn HSK 4 thực tế (InAnskr/HSK4Level-Test)",
                    "options": cleaned_opts,
                    "optionsJson": json.dumps(cleaned_opts, ensure_ascii=False),
                    "correctOptionIndex": c_idx,
                    "correctAnswer": correct_answer,
                    "explanation": f"Đáp án đúng là '{correct_answer}' (HSK 4 {fname.replace('.json', '').upper()} #Q{q.get('number')}, nguồn CC BY-NC-SA 4.0).",
                    "tags": f"hsk4,{skill},{qtype},inanskr",
                    "sourceId": f"InAnskr/HSK4Level-Test/{fname}#Q{q.get('number')}",
                    "sourceLicense": "CC-BY-NC-SA-4.0",
                    "qualityScore": 75.0,
                    "contentHash": chash,
                }
            )
            stats["accepted_reading"] += 1

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    NORMALIZED_OUT.write_text(json.dumps(accepted, ensure_ascii=False, indent=2), encoding="utf-8")
    return accepted, stats


def build_mit_vocab_generated_questions(cur: pyodbc.Cursor, per_level: int = 80) -> list[dict[str, Any]]:
    generated: list[dict[str, Any]] = []
    for hsk in (1, 2, 3, 4):
        cur.execute(
            """
            SELECT TOP 150 Id, Hanzi, Pinyin, MeaningVi, LessonId
            FROM vocabularies
            WHERE HskLevel = ? AND Status = 'PUBLISHED'
              AND Hanzi IS NOT NULL AND LTRIM(RTRIM(Hanzi)) <> ''
              AND MeaningVi IS NOT NULL AND LTRIM(RTRIM(MeaningVi)) <> ''
            ORDER BY Hanzi
            """,
            hsk,
        )
        rows = cur.fetchall()
        if len(rows) < 4:
            continue

        difficulty = "EASY" if hsk == 1 else ("HARD" if hsk >= 4 else "MEDIUM")
        count_for_level = 0
        for i, row in enumerate(rows):
            if count_for_level >= per_level:
                break
            vid, hanzi, pinyin, meaning_vi, lesson_id = row
            hanzi = hanzi.strip()
            pinyin = (pinyin or "").strip()
            meaning_vi = meaning_vi.strip()

            distractors = [
                r
                for j, r in enumerate(rows)
                if j != i
                and r[3].strip().lower() != meaning_vi.lower()
                and r[1].strip() != hanzi
            ][:3]
            if len(distractors) < 3:
                continue

            mode = i % 3
            if mode == 0:
                opts = [meaning_vi, distractors[0][3].strip(), distractors[1][3].strip(), distractors[2][3].strip()]
                rot = i % 4
                rotated = [opts[(k + rot) % 4] for k in range(4)]
                if len({normalize_answer_text(o) for o in rotated}) < 4:
                    continue
                c_idx = rotated.index(meaning_vi)
                title = f"HSK {hsk} · Nghĩa của từ \"{hanzi}\""
                instr = "Chọn nghĩa tiếng Việt đúng nhất cho từ tiếng Trung dưới đây."
                chash = compute_content_hash(hsk, "multiple-choice", hanzi, f"Từ vựng HSK {hsk}", meaning_vi)
                generated.append(
                    {
                        "type": "multiple-choice",
                        "skill": "vocabulary",
                        "hskLevel": hsk,
                        "difficulty": difficulty,
                        "title": title,
                        "instruction": instr,
                        "promptHanzi": hanzi,
                        "promptPinyin": pinyin,
                        "promptVietnamese": f"Từ vựng HSK {hsk}",
                        "optionsJson": json.dumps(rotated, ensure_ascii=False),
                        "correctOptionIndex": c_idx,
                        "correctAnswer": meaning_vi,
                        "explanation": f"'{hanzi}' ({pinyin}) mang nghĩa '{meaning_vi}' trong giáo trình HSK {hsk}.",
                        "tags": f"hsk{hsk},vocabulary,drkameleon-mit,zh-to-vi",
                        "sourceId": "drkameleon/complete-hsk-vocabulary",
                        "sourceLicense": "MIT",
                        "qualityScore": 90.0,
                        "contentHash": chash,
                        "vocabularyId": str(vid),
                        "lessonId": str(lesson_id) if lesson_id else None,
                    }
                )
                count_for_level += 1
            elif mode == 1:
                opts = [hanzi, distractors[0][1].strip(), distractors[1][1].strip(), distractors[2][1].strip()]
                rot = i % 4
                rotated = [opts[(k + rot) % 4] for k in range(4)]
                if len({normalize_answer_text(o) for o in rotated}) < 4:
                    continue
                c_idx = rotated.index(hanzi)
                chash = compute_content_hash(hsk, "vietnamese-to-chinese", meaning_vi, f"Nghĩa HSK {hsk}: {meaning_vi}", hanzi)
                generated.append(
                    {
                        "type": "vietnamese-to-chinese",
                        "skill": "vocabulary",
                        "hskLevel": hsk,
                        "difficulty": difficulty,
                        "title": f"HSK {hsk} · Chọn chữ Hán cho \"{meaning_vi}\"",
                        "instruction": "Chọn chữ Hán tương ứng với nghĩa tiếng Việt dưới đây.",
                        "promptHanzi": meaning_vi,
                        "promptPinyin": None,
                        "promptVietnamese": f"Nghĩa HSK {hsk}: {meaning_vi}",
                        "optionsJson": json.dumps(rotated, ensure_ascii=False),
                        "correctOptionIndex": c_idx,
                        "correctAnswer": hanzi,
                        "explanation": f"Đáp án đúng là '{hanzi}' ({pinyin}) — '{meaning_vi}'.",
                        "tags": f"hsk{hsk},vocabulary,drkameleon-mit,vi-to-zh",
                        "sourceId": "drkameleon/complete-hsk-vocabulary",
                        "sourceLicense": "MIT",
                        "qualityScore": 80.0,
                        "contentHash": chash,
                        "vocabularyId": str(vid),
                        "lessonId": str(lesson_id) if lesson_id else None,
                    }
                )
                count_for_level += 1
            else:
                chash = compute_content_hash(hsk, "fill-blank", "____", f"Điền chữ Hán có nghĩa: {meaning_vi}", hanzi)
                generated.append(
                    {
                        "type": "fill-blank",
                        "skill": "vocabulary",
                        "hskLevel": hsk,
                        "difficulty": difficulty,
                        "title": f"HSK {hsk} · Gõ chữ Hán ({pinyin})",
                        "instruction": "Gõ đúng chữ Hán tương ứng với Pinyin và nghĩa tiếng Việt.",
                        "promptHanzi": "____",
                        "promptPinyin": pinyin,
                        "promptVietnamese": f"Điền chữ Hán có nghĩa: {meaning_vi}",
                        "optionsJson": None,
                        "correctOptionIndex": None,
                        "correctAnswer": hanzi,
                        "explanation": f"Chữ Hán đúng là '{hanzi}' ({pinyin}): {meaning_vi}.",
                        "tags": f"hsk{hsk},fill-blank,drkameleon-mit",
                        "sourceId": "drkameleon/complete-hsk-vocabulary",
                        "sourceLicense": "MIT",
                        "qualityScore": 85.0,
                        "contentHash": chash,
                        "vocabularyId": str(vid),
                        "lessonId": str(lesson_id) if lesson_id else None,
                    }
                )
                count_for_level += 1
    return generated


def process_database(name: str, conn_str: str, inanskr_items: list[dict[str, Any]]) -> dict[str, Any]:
    conn = pyodbc.connect(conn_str)
    cur = conn.cursor()

    # 1. Backfill ContentHash cleanly for existing rows missing ContentHash
    cur.execute(
        """
        SELECT Id, HskLevel, Type, PromptHanzi, PromptVietnamese, CorrectAnswer
        FROM exercises
        WHERE ContentHash IS NULL
        """
    )
    missing_hash_rows = cur.fetchall()
    for row in missing_hash_rows:
        chash = compute_content_hash(row[1], row[2], row[3], row[4], row[5])
        cur.execute("UPDATE exercises SET ContentHash = ? WHERE Id = ?", chash, row[0])
    conn.commit()

    # Collect existing hashes
    cur.execute("SELECT ContentHash FROM exercises WHERE ContentHash IS NOT NULL")
    existing_hashes = {r[0].lower() for r in cur.fetchall() if r[0]}

    # 2. Build MIT-derived vocab practice items tailored to this database's Lesson/Vocab UUIDs
    vocab_items = build_mit_vocab_generated_questions(cur, per_level=80)

    inserted_inanskr = 0
    dup_inanskr = 0
    inserted_mit = 0
    dup_mit = 0
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    for item in inanskr_items:
        ch = item["contentHash"].lower()
        if ch in existing_hashes:
            dup_inanskr += 1
            continue
        existing_hashes.add(ch)
        cur.execute(
            """
            INSERT INTO exercises (
                Id, Type, Skill, HskLevel, Difficulty, Title, Instruction,
                PromptHanzi, PromptPinyin, PromptVietnamese, OptionsJson,
                CorrectOptionIndex, CorrectAnswer, Explanation, XpReward,
                Status, ReviewStatus, Tags, SourceId, SourceLicense,
                QualityScore, ContentHash, CreatedAt
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', 'PENDING_REVIEW', ?, ?, ?, ?, ?, ?)
            """,
            str(uuid.uuid4()),
            item["type"],
            item["skill"],
            item["hskLevel"],
            item["difficulty"],
            item["title"][:255],
            item["instruction"][:500],
            item["promptHanzi"][:500],
            item["promptPinyin"],
            item["promptVietnamese"],
            item["optionsJson"],
            item["correctOptionIndex"],
            item["correctAnswer"][:500],
            item["explanation"][:1000],
            10,
            item["tags"][:500],
            item["sourceId"][:200],
            item["sourceLicense"][:100],
            item["qualityScore"],
            ch,
            now,
        )
        inserted_inanskr += 1

    for item in vocab_items:
        ch = item["contentHash"].lower()
        if ch in existing_hashes:
            dup_mit += 1
            continue
        existing_hashes.add(ch)
        cur.execute(
            """
            INSERT INTO exercises (
                Id, Type, Skill, HskLevel, Difficulty, Title, Instruction,
                PromptHanzi, PromptPinyin, PromptVietnamese, OptionsJson,
                CorrectOptionIndex, CorrectAnswer, Explanation, XpReward,
                Status, ReviewStatus, Tags, SourceId, SourceLicense,
                QualityScore, ContentHash, LessonId, VocabularyId, CreatedAt
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', 'PENDING_REVIEW', ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            str(uuid.uuid4()),
            item["type"],
            item["skill"],
            item["hskLevel"],
            item["difficulty"],
            item["title"][:255],
            item["instruction"][:500],
            item["promptHanzi"][:500],
            item["promptPinyin"],
            item["promptVietnamese"],
            item["optionsJson"],
            item["correctOptionIndex"],
            item["correctAnswer"][:500],
            item["explanation"][:1000],
            10,
            item["tags"][:500],
            item["sourceId"][:200],
            item["sourceLicense"][:100],
            item["qualityScore"],
            ch,
            item["lessonId"],
            item["vocabularyId"],
            now,
        )
        inserted_mit += 1

    conn.commit()

    # Read back authoritative counts
    cur.execute(
        """
        SELECT Status, ReviewStatus, COUNT(*)
        FROM exercises
        GROUP BY Status, ReviewStatus
        ORDER BY Status, ReviewStatus
        """
    )
    breakdown = [(r[0], r[1], r[2]) for r in cur.fetchall()]
    cur.execute("SELECT HskLevel, COUNT(*) FROM exercises GROUP BY HskLevel ORDER BY HskLevel")
    by_hsk = {r[0]: r[1] for r in cur.fetchall()}
    cur.execute("SELECT COUNT(*) FROM exercises")
    total = cur.fetchone()[0]
    conn.close()

    return {
        "database": name,
        "backfilled_hashes": len(missing_hash_rows),
        "inserted_inanskr": inserted_inanskr,
        "dup_inanskr": dup_inanskr,
        "inserted_mit": inserted_mit,
        "dup_mit": dup_mit,
        "total_exercises": total,
        "breakdown": breakdown,
        "by_hsk": by_hsk,
    }


def write_report(raw_stats: dict[str, int], db_results: list[dict[str, Any]]) -> None:
    REPORT_OUT.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Question Bank GitHub Audit & Import Pipeline Report",
        "",
        f"Generated: `{datetime.now(timezone.utc).isoformat()}`",
        "",
        "## 1. GitHub Repository License & Quality Audit",
        "",
        "| Repository | Status | License | Decision | Rationale |",
        "|---|---|---|---|---|",
        "| `Roxaleen/hsk-annotated-corpus` | Exists (`main`) | None (`no LICENSE file`) | **REJECTED for import** | Missing explicit open-source license; corpus sentences/corpora cannot be redistributed blindly. |",
        "| `drkameleon/complete-hsk-vocabulary` | Exists (`main`) | `MIT License` | **APPROVED** | Used as verified lexical baseline (already in `vocabularies`); generates validated `DRAFT` / `PENDING_REVIEW` drills linked to `VocabularyId`. |",
        "| `InAnskr/HSK4Level-Test` | Exists (`main`) | `CC BY-NC-SA 4.0` | **APPROVED (Filtered Subset + Attribution)** | Educational non-commercial attribution (`CC-BY-NC-SA-4.0`); filtered strictly to self-contained text Q46–Q85 (`fill_in_blank`, `reading_ordering`, `reading_comprehension`). External `media.mandarinzone.com` audio/listening & picture/writing items skipped. |",
        "",
        "## 2. `InAnskr/HSK4Level-Test` Normalization Statistics",
        "",
        f"- Total raw JSON questions across `test-01.json`..`test-12.json`: `{raw_stats['total_raw']}`",
        f"- Skipped external audio / listening-dependent items: `{raw_stats['skipped_listening_audio']}`",
        f"- Skipped incomplete / picture / ungraded writing items: `{raw_stats['skipped_incomplete_or_writing']}`",
        f"- Rejected by validation (empty/duplicate options/bad index): `{raw_stats['skipped_invalid']}`",
        f"- Validated pure-text HSK 4 items saved to `data/question-bank/inanskr_hsk4_normalized.json`: `{raw_stats['accepted_reading']}`",
        "",
        "## 3. SQL Server Import Results (Zero Auto-Publish)",
        "",
    ]

    for r in db_results:
        lines.extend(
            [
                f"### `ZhongWenHub_{r['database']}`",
                f"- Backfilled `ContentHash` on existing exercises: `{r['backfilled_hashes']}`",
                f"- Inserted `InAnskr/HSK4Level-Test` (DRAFT / PENDING_REVIEW): `{r['inserted_inanskr']}` (duplicates skipped: `{r['dup_inanskr']}`)",
                f"- Inserted `drkameleon` MIT vocab drills (DRAFT / PENDING_REVIEW): `{r['inserted_mit']}` (duplicates skipped: `{r['dup_mit']}`)",
                f"- Total `exercises` in DB: `{r['total_exercises']}`",
                f"- By HSK Level: `{r['by_hsk']}`",
                "- Status / ReviewStatus breakdown:",
            ]
        )
        for st, rev, cnt in r["breakdown"]:
            lines.append(f"  - `{st}` / `{rev}`: `{cnt}`")
        lines.append("")

    REPORT_OUT.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    inanskr_items, raw_stats = download_inanskr_tests()
    print(f"InAnskr parsed: {raw_stats}")
    db_results = []
    for name, conn_str in CONNS.items():
        res = process_database(name, conn_str, inanskr_items)
        print(f"{name}: {res}")
        db_results.append(res)
    write_report(raw_stats, db_results)
    print(f"Report written to {REPORT_OUT}")


if __name__ == "__main__":
    main()

