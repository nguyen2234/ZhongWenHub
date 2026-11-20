# -*- coding: utf-8 -*-
"""
ZhongWenHub — HSK 1-4 Vocabulary Duplicate Remediation & Verification Script

Supports:
  --db ZhongWenHub_Dev | ZhongWenHub_Test
  --backup      Export SHA-256 timestamped backup snapshot JSON
  --dry-run     Inspect and print planned changes without modifying SQL Server
  --apply       Create pre-apply backup, remediate inside a single transaction, and commit
  --rollback    Restore affected tables from a backup JSON file
  --verify      Verify 0 active normalized key duplicates and 100% FK integrity
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import unicodedata
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pyodbc

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKUP_DIR = REPO_ROOT / "backups"
ALLOWED_DBS = {"ZhongWenHub_Dev", "ZhongWenHub_Test"}

# Known integration-test leftover records inserted by Hsk1MeaningAndPublishIntegrationTests
TEST_LEFTOVER_HANS = {"八", "爸爸", "白天", "茶", "只"}
TEST_LEFTOVER_ENTRY_IDS = {"2", "3", "5", "8", "17", "287"}


def norm_hanzi(hanzi: str | None) -> str:
    return (hanzi or "").strip()


def norm_pinyin(pinyin: str | None) -> str:
    if not pinyin or not pinyin.strip():
        return ""
    nfc = unicodedata.normalize("NFC", pinyin.strip()).lower()
    return re.sub(r"[\s'\u2019\-·•.,/()\xa0]+", "", nfc)


def norm_homograph(hg: str | None) -> str:
    return (hg or "").strip()


def get_conn(db_name: str) -> pyodbc.Connection:
    if db_name not in ALLOWED_DBS:
        raise ValueError(f"Unsupported database '{db_name}'. Allowed: {sorted(ALLOWED_DBS)}")
    conn_str = (
        "DRIVER={ODBC Driver 17 for SQL Server};"
        f"SERVER=localhost\\SQLEXPRESS;DATABASE={db_name};"
        "Trusted_Connection=yes;TrustServerCertificate=yes;"
    )
    return pyodbc.connect(conn_str)


def fetch_snapshot(conn: pyodbc.Connection, db_name: str) -> dict[str, Any]:
    cur = conn.cursor()

    def rows_as_dicts(sql: str) -> list[dict[str, Any]]:
        cur.execute(sql)
        cols = [c[0] for c in cur.description]
        out = []
        for row in cur.fetchall():
            item: dict[str, Any] = {}
            for k, v in zip(cols, row):
                if isinstance(v, datetime):
                    item[k] = v.isoformat()
                elif v is not None and not isinstance(v, (int, float, bool, str)):
                    item[k] = str(v)
                else:
                    item[k] = v
            out.append(item)
        return out

    vocabularies = rows_as_dicts("SELECT * FROM vocabularies ORDER BY HskLevel, Hanzi, CreatedAt, Id")
    lesson_vocabularies = rows_as_dicts("SELECT * FROM lesson_vocabularies ORDER BY LessonId, SortOrder, VocabularyId")
    exercise_links = rows_as_dicts("SELECT Id, VocabularyId FROM exercises WHERE VocabularyId IS NOT NULL ORDER BY Id")
    progress_links = rows_as_dicts("SELECT Id, UserId, VocabularyId FROM student_vocabulary_progress ORDER BY Id")

    payload = {
        "database": db_name,
        "capturedAtUtc": datetime.now(timezone.utc).isoformat(),
        "counts": {
            "vocabularies": len(vocabularies),
            "lesson_vocabularies": len(lesson_vocabularies),
            "exercise_vocab_links": len(exercise_links),
            "student_vocabulary_progress": len(progress_links),
        },
        "vocabularies": vocabularies,
        "lesson_vocabularies": lesson_vocabularies,
        "exercise_links": exercise_links,
        "student_vocabulary_progress": progress_links,
    }
    raw_bytes = json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")
    payload["sha256"] = hashlib.sha256(raw_bytes).hexdigest()
    return payload


def write_backup(conn: pyodbc.Connection, db_name: str, tag: str = "manual") -> Path:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    snap = fetch_snapshot(conn, db_name)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = BACKUP_DIR / f"vocab_backup_{db_name}_{tag}_{ts}.json"
    path.write_text(json.dumps(snap, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[BACKUP] Saved {path} (sha256={snap['sha256']}, rows={snap['counts']['vocabularies']})")
    return path


def load_context(conn: pyodbc.Connection):
    cur = conn.cursor()
    cur.execute("""
        SELECT v.*, l.LessonNumber, l.TitleVi AS LessonTitleVi,
               (SELECT COUNT(*) FROM exercises e WHERE e.VocabularyId = v.Id) AS ExRefCount,
               (SELECT COUNT(*) FROM student_vocabulary_progress p WHERE p.VocabularyId = CAST(v.Id AS nvarchar(100))) AS ProgRefCount
        FROM vocabularies v
        LEFT JOIN lessons l ON l.Id = v.LessonId
    """)
    cols = [c[0] for c in cur.description]
    vocabs = [dict(zip(cols, r)) for r in cur.fetchall()]
    for v in vocabs:
        v["IdStr"] = str(v["Id"]).upper()
        v["LessonIdStr"] = str(v["LessonId"]).upper() if v["LessonId"] else None
        v["NormPinyin"] = norm_pinyin(v["Pinyin"])
        v["NormHanzi"] = norm_hanzi(v["Hanzi"])
        v["NormHg"] = norm_homograph(v["Homograph"])

    cur.execute("SELECT LessonId, VocabularyId, SortOrder FROM lesson_vocabularies")
    lv_pairs = defaultdict(list)
    for r in cur.fetchall():
        lv_pairs[str(r.VocabularyId).upper()].append((str(r.LessonId).upper(), r.SortOrder))

    return vocabs, lv_pairs


def pick_canonical(rows: list[dict[str, Any]]) -> dict[str, Any]:
    def score(r: dict[str, Any]):
        status_rank = {"PUBLISHED": 4, "PENDING_REVIEW": 3, "DRAFT": 2, "ARCHIVED": 1}.get(r["Status"], 0)
        is_hsk20 = 1 if (r.get("SourceDataset") or "").strip() == "HSK 2.0" else 0
        has_lesson = 1 if r["LessonId"] is not None else 0
        has_meaning = 1 if (r.get("MeaningVi") or "").strip() else 0
        has_ex = 1 if (r.get("ExamplesJson") or "").strip() else 0
        ex_refs = int(r.get("ExRefCount") or 0)
        prog_refs = int(r.get("ProgRefCount") or 0)
        lesson_num = int(r.get("LessonNumber") or 9999)
        return (
            status_rank,
            is_hsk20,
            prog_refs,
            ex_refs,
            has_lesson,
            has_meaning,
            has_ex,
            -lesson_num,
            str(r["IdStr"]),
        )

    return max(rows, key=score)


def is_distinct_sense_group(rows: list[dict[str, Any]]) -> bool:
    """True when rows share Hanzi+NormalizedPinyin+HskLevel ONLY because they are genuinely different POS/senses."""
    pos_set = {(r.get("PartOfSpeech") or "").strip().lower() for r in rows if (r.get("PartOfSpeech") or "").strip()}
    # Check known homograph families with distinct grammatical roles
    if len(pos_set) > 1:
        # Check that meanings aren't literally identical
        meanings = {unicodedata.normalize("NFC", (r.get("MeaningVi") or "").strip().lower()) for r in rows}
        if len(meanings) > 1:
            return True
    return False


def build_plan(conn: pyodbc.Connection, db_name: str) -> dict[str, Any]:
    vocabs, lv_pairs = load_context(conn)

    # 1. Remove placeholder '无意词' and leftover uncleaned integration-test rows in ZhongWenHub_Test
    delete_ids: dict[str, str] = {}
    relink_map: dict[str, str] = {}  # removed_id -> canonical_id

    by_id = {v["IdStr"]: v for v in vocabs}

    # Index active HSK 2.0 / canonical words by (HskLevel, NormHanzi, NormPinyin)
    by_hsk_word = defaultdict(list)
    for v in vocabs:
        by_hsk_word[(v["HskLevel"], v["NormHanzi"], v["NormPinyin"])].append(v)

    if db_name == "ZhongWenHub_Test":
        for v in vocabs:
            # Remove test leftover HSK 3.0 unlinked rows from Hsk1MeaningAndPublishIntegrationTests
            if (
                (v.get("SourceDataset") or "").strip() == "HSK 3.0"
                and v["LessonId"] is None
                and v["NormHanzi"] in TEST_LEFTOVER_HANS
                and (v.get("SourceEntryId") or "").strip() in TEST_LEFTOVER_ENTRY_IDS
            ):
                siblings = [
                    s for s in vocabs
                    if s["HskLevel"] == v["HskLevel"]
                    and s["NormHanzi"] == v["NormHanzi"]
                    and s["IdStr"] != v["IdStr"]
                    and (s.get("SourceDataset") or "") == "HSK 2.0"
                ]
                delete_ids[v["IdStr"]] = f"Integration-test leftover ({v['NormHanzi']} {v['Pinyin']}, HSK 3.0)"
                if siblings:
                    relink_map[v["IdStr"]] = pick_canonical(siblings)["IdStr"]
                continue

            # Remove unreferenced '无意词' archived placeholder test rows
            if v["NormHanzi"] == "无意词" and v["Status"] == "ARCHIVED" and v["ExRefCount"] == 0 and v["ProgRefCount"] == 0:
                delete_ids[v["IdStr"]] = "Archived placeholder test row (无意词)"

    # 2. Check all groups sharing (HskLevel, NormHanzi, NormPinyin) among remaining rows
    merge_ops: list[dict[str, Any]] = []
    homograph_tags: list[dict[str, Any]] = []

    remaining = [v for v in vocabs if v["IdStr"] not in delete_ids and 1 <= v["HskLevel"] <= 4]
    groups = defaultdict(list)
    for v in remaining:
        groups[(v["HskLevel"], v["NormHanzi"], v["NormPinyin"])].append(v)

    for key, rows in sorted(groups.items()):
        if len(rows) <= 1:
            continue

        # If every row already has a distinct non-empty NormalizedHomograph, no key collision exists
        non_empty_hgs = [r["NormHg"] for r in rows if r["NormHg"]]
        if len(non_empty_hgs) == len(rows) and len(set(non_empty_hgs)) == len(rows):
            continue

        hsk_level, hanzi, norm_py = key
        active_rows = [r for r in rows if r["Status"] != "ARCHIVED"]
        archived_rows = [r for r in rows if r["Status"] == "ARCHIVED"]

        # Case A: Archived seed duplicates matching an active canonical row (e.g. Test archived 你/好)
        if active_rows and archived_rows:
            canon_active = pick_canonical(active_rows)
            for ar in archived_rows:
                # Only remove archived exact duplicate if same POS/meaning and safe
                if db_name == "ZhongWenHub_Test" and (ar.get("SourceDataset") or "") == "" and ar["LessonId"] is None:
                    delete_ids[ar["IdStr"]] = f"Unlinked ARCHIVED seed duplicate of active canonical ({hanzi})"
                    relink_map[ar["IdStr"]] = canon_active["IdStr"]

        rows_left = [r for r in rows if r["IdStr"] not in delete_ids]
        if len(rows_left) <= 1:
            continue

        # Re-evaluate remaining rows in this group
        # Separate active vs archived-only cases
        if is_distinct_sense_group(rows_left):
            # Legitimate distinct senses (e.g., HSK4 对, 等, 过; HSK2 花; HSK4 生): KEEP SEPARATE and tag Homograph!
            sorted_senses = sorted(
                rows_left,
                key=lambda x: (
                    0 if x["Status"] == "PUBLISHED" else 1,
                    int(x["NormHg"]) if x["NormHg"].isdigit() else 99,
                    str(x.get("PartOfSpeech") or ""),
                    x["IdStr"],
                ),
            )
            # Only tag when two rows actually share NormalizedHomograph
            seen_hg = defaultdict(list)
            for r in sorted_senses:
                seen_hg[r["NormHg"]].append(r)
            if any(len(v) > 1 for v in seen_hg.values()):
                for idx, r in enumerate(sorted_senses, start=1):
                    target_hg = str(idx)
                    if r["NormHg"] != target_hg:
                        homograph_tags.append({
                            "id": r["IdStr"],
                            "hanzi": hanzi,
                            "pinyin": r["Pinyin"],
                            "hskLevel": hsk_level,
                            "pos": r.get("PartOfSpeech"),
                            "oldHomograph": r.get("Homograph"),
                            "newHomograph": target_hg,
                        })
        else:
            # True duplicates (same HSK + Hanzi + NormalizedPinyin + same core sense/POS)
            canon = pick_canonical(rows_left)
            dups = [r for r in rows_left if r["IdStr"] != canon["IdStr"]]
            all_lessons: list[str] = []
            seen_lessons = set()
            for r in [canon] + dups:
                if r["LessonIdStr"] and r["LessonIdStr"] not in seen_lessons:
                    seen_lessons.add(r["LessonIdStr"])
                    all_lessons.append(r["LessonIdStr"])
                for lid, _ in lv_pairs.get(r["IdStr"], []):
                    if lid not in seen_lessons:
                        seen_lessons.add(lid)
                        all_lessons.append(lid)

            merge_ops.append({
                "key": f"HSK{hsk_level}|{hanzi}|{norm_py}",
                "canonicalId": canon["IdStr"],
                "canonicalStatus": canon["Status"],
                "canonicalPrimaryLessonId": canon["LessonIdStr"],
                "duplicateIds": [d["IdStr"] for d in dups],
                "allLessonIds": all_lessons,
                "enrichAudioUrl": next((r.get("AudioUrl") for r in [canon] + dups if (r.get("AudioUrl") or "").strip()), canon.get("AudioUrl")),
                "enrichExamplesJson": next((r.get("ExamplesJson") for r in [canon] + dups if (r.get("ExamplesJson") or "").strip()), canon.get("ExamplesJson")),
                "enrichMeaningEn": next((r.get("MeaningEn") for r in [canon] + dups if (r.get("MeaningEn") or "").strip()), canon.get("MeaningEn")),
            })
            for d in dups:
                delete_ids[d["IdStr"]] = f"Merged true duplicate into {canon['IdStr']}"
                relink_map[d["IdStr"]] = canon["IdStr"]

    return {
        "database": db_name,
        "merge_ops": merge_ops,
        "homograph_tags": homograph_tags,
        "deletes": [{"id": k, "reason": v, "relinkTo": relink_map.get(k)} for k, v in sorted(delete_ids.items())],
    }


def apply_plan(conn: pyodbc.Connection, plan: dict[str, Any]) -> None:
    cur = conn.cursor()
    cur.execute("SET XACT_ABORT ON;")

    try:
        # 1. Execute merges (preserve all lessons in lesson_vocabularies, enrich canonical metadata, repoint FKs)
        for op in plan["merge_ops"]:
            canon_id = op["canonicalId"]
            cur.execute(
                """
                UPDATE vocabularies
                SET AudioUrl = COALESCE(NULLIF(AudioUrl, N''), ?),
                    ExamplesJson = COALESCE(NULLIF(ExamplesJson, N''), ?),
                    MeaningEn = COALESCE(NULLIF(MeaningEn, N''), ?),
                    UpdatedAt = SYSUTCDATETIME()
                WHERE Id = ?
                """,
                (op["enrichAudioUrl"], op["enrichExamplesJson"], op["enrichMeaningEn"], canon_id),
            )

            for sort_idx, lesson_id in enumerate(op["allLessonIds"]):
                cur.execute(
                    """
                    IF NOT EXISTS (SELECT 1 FROM lesson_vocabularies WHERE LessonId = ? AND VocabularyId = ?)
                        INSERT INTO lesson_vocabularies (LessonId, VocabularyId, SortOrder, CreatedAt)
                        VALUES (?, ?, ?, SYSUTCDATETIME())
                    """,
                    (lesson_id, canon_id, lesson_id, canon_id, sort_idx),
                )

        # 2. Repoint exercises & student_vocabulary_progress FKs for ALL removed/merged IDs
        for d in plan["deletes"]:
            old_id = d["id"]
            target_id = d["relinkTo"]
            if target_id:
                cur.execute("UPDATE exercises SET VocabularyId = ? WHERE VocabularyId = ?", (target_id, old_id))
                # student_vocabulary_progress.VocabularyId is nvarchar(100)
                cur.execute(
                    """
                    UPDATE p
                    SET p.VocabularyId = LOWER(?)
                    FROM student_vocabulary_progress p
                    WHERE LOWER(p.VocabularyId) = LOWER(?)
                      AND NOT EXISTS (
                          SELECT 1 FROM student_vocabulary_progress existing
                          WHERE existing.UserId = p.UserId
                            AND LOWER(existing.VocabularyId) = LOWER(?)
                      )
                    """,
                    (target_id, old_id, target_id),
                )
            else:
                # Assert zero FK references before unlinked delete
                cur.execute("SELECT COUNT(*) FROM exercises WHERE VocabularyId = ?", (old_id,))
                ex_cnt = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM student_vocabulary_progress WHERE LOWER(VocabularyId) = LOWER(?)", (old_id,))
                prog_cnt = cur.fetchone()[0]
                if ex_cnt > 0 or prog_cnt > 0:
                    raise RuntimeError(f"Refusing to delete {old_id} without target relink: ex={ex_cnt}, prog={prog_cnt}")

            cur.execute("DELETE FROM lesson_vocabularies WHERE VocabularyId = ?", (old_id,))
            cur.execute("DELETE FROM vocabularies WHERE Id = ?", (old_id,))

        # 3. Assign explicit Homograph tags for legitimate distinct-sense homographs
        for tag in plan["homograph_tags"]:
            cur.execute(
                """
                UPDATE vocabularies
                SET Homograph = ?,
                    NormalizedHomograph = ?,
                    UpdatedAt = SYSUTCDATETIME()
                WHERE Id = ?
                """,
                (tag["newHomograph"], tag["newHomograph"], tag["id"]),
            )

        # 4. Ensure every vocabulary with LessonId has its primary row in lesson_vocabularies
        cur.execute(
            """
            INSERT INTO lesson_vocabularies (LessonId, VocabularyId, SortOrder, CreatedAt)
            SELECT v.LessonId, v.Id, 0, SYSUTCDATETIME()
            FROM vocabularies v
            INNER JOIN lessons l ON l.Id = v.LessonId
            WHERE v.LessonId IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM lesson_vocabularies lv
                  WHERE lv.LessonId = v.LessonId AND lv.VocabularyId = v.Id
              )
            """
        )

        # 5. Refresh NormalizedPinyin and NormalizedHomograph for all vocabularies in case of Python-exact NFC rules
        cur.execute("SELECT Id, Hanzi, Pinyin, Homograph, NormalizedPinyin, NormalizedHomograph FROM vocabularies")
        for r in cur.fetchall():
            nh = norm_hanzi(r.Hanzi)
            np = norm_pinyin(r.Pinyin)
            nhg = norm_homograph(r.Homograph)
            if r.Hanzi != nh or r.NormalizedPinyin != np or r.NormalizedHomograph != nhg:
                cur.execute(
                    """
                    UPDATE vocabularies
                    SET Hanzi = ?, NormalizedPinyin = ?, NormalizedHomograph = ?
                    WHERE Id = ?
                    """,
                    (nh, np, nhg, r.Id),
                )

        conn.commit()
    except Exception:
        conn.rollback()
        raise


def rollback_from_backup(conn: pyodbc.Connection, backup_path: Path) -> None:
    data = json.loads(backup_path.read_text(encoding="utf-8"))
    cur = conn.cursor()
    cur.execute("SET XACT_ABORT ON;")
    try:
        # Find vocabularies missing from current DB or changed
        cur.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'vocabularies' ORDER BY ORDINAL_POSITION")
        v_cols = [r[0] for r in cur.fetchall()]

        cur.execute("SELECT Id FROM vocabularies")
        current_ids = {str(r[0]).upper() for r in cur.fetchall()}

        backup_by_id = {str(v["Id"]).upper(): v for v in data["vocabularies"]}

        # Re-insert deleted rows
        dt_cols = {"CreatedAt", "UpdatedAt", "ReviewedAt"}
        insert_cols = ", ".join(f"[{c}]" for c in v_cols)
        placeholders = ", ".join("?" for _ in v_cols)
        for vid, row in backup_by_id.items():
            if vid not in current_ids:
                vals = []
                for c in v_cols:
                    val = row.get(c)
                    if c in dt_cols and isinstance(val, str):
                        val = datetime.fromisoformat(val)
                    vals.append(val)
                cur.execute(f"INSERT INTO vocabularies ({insert_cols}) VALUES ({placeholders})", vals)
            else:
                updated_at = row.get("UpdatedAt")
                if isinstance(updated_at, str):
                    updated_at = datetime.fromisoformat(updated_at)
                cur.execute(
                    """
                    UPDATE vocabularies
                    SET Homograph = ?, NormalizedHomograph = ?, NormalizedPinyin = ?,
                        AudioUrl = ?, ExamplesJson = ?, MeaningEn = ?, UpdatedAt = ?
                    WHERE Id = ?
                    """,
                    (
                        row.get("Homograph"),
                        row.get("NormalizedHomograph", ""),
                        row.get("NormalizedPinyin", ""),
                        row.get("AudioUrl"),
                        row.get("ExamplesJson"),
                        row.get("MeaningEn"),
                        updated_at,
                        row["Id"],
                    ),
                )

        # Restore lesson_vocabularies snapshot
        cur.execute("DELETE FROM lesson_vocabularies")
        for lv in data["lesson_vocabularies"]:
            lv_dt = lv["CreatedAt"]
            if isinstance(lv_dt, str):
                lv_dt = datetime.fromisoformat(lv_dt)
            cur.execute(
                "INSERT INTO lesson_vocabularies (LessonId, VocabularyId, SortOrder, CreatedAt) VALUES (?, ?, ?, ?)",
                (lv["LessonId"], lv["VocabularyId"], lv["SortOrder"], lv_dt),
            )

        # Restore exercise VocabularyIds
        for ex in data["exercise_links"]:
            cur.execute("UPDATE exercises SET VocabularyId = ? WHERE Id = ?", (ex["VocabularyId"], ex["Id"]))

        # Restore student_vocabulary_progress
        for sp in data["student_vocabulary_progress"]:
            cur.execute("UPDATE student_vocabulary_progress SET VocabularyId = ? WHERE Id = ?", (sp["VocabularyId"], sp["Id"]))

        conn.commit()
        print(f"[ROLLBACK] Restored {len(data['vocabularies'])} vocabularies and {len(data['lesson_vocabularies'])} lesson links from {backup_path.name}")
    except Exception:
        conn.rollback()
        raise


def verify_db(conn: pyodbc.Connection, db_name: str) -> bool:
    cur = conn.cursor()
    print(f"\n=== VERIFYING {db_name} ===")

    # 1. Active duplicate check
    cur.execute("""
        SELECT HskLevel, Hanzi, NormalizedPinyin, NormalizedHomograph, COUNT(*) AS Cnt
        FROM vocabularies
        WHERE Status <> N'ARCHIVED'
        GROUP BY HskLevel, Hanzi, NormalizedPinyin, NormalizedHomograph
        HAVING COUNT(*) > 1
    """)
    active_dups = cur.fetchall()
    print(f"1. Active (HskLevel, Hanzi, NormalizedPinyin, NormalizedHomograph) duplicates: {len(active_dups)}")
    for d in active_dups:
        print("   DUP:", d)

    # 2. HSK1 八 check
    cur.execute("""
        SELECT v.Id, v.Hanzi, v.Pinyin, v.Status, v.SourceDataset,
               (SELECT COUNT(*) FROM lesson_vocabularies lv WHERE lv.VocabularyId = v.Id) AS LessonLinks
        FROM vocabularies v
        WHERE v.HskLevel = 1 AND v.Hanzi = N'八' AND v.Status <> N'ARCHIVED'
    """)
    ba_rows = cur.fetchall()
    print(f"2. HSK1 active '八' rows: {len(ba_rows)} -> {ba_rows}")

    # 3. Multi-lesson canonical words check (得, 还, 长)
    cur.execute("""
        SELECT v.HskLevel, v.Hanzi, v.Pinyin, v.Status,
               STRING_AGG(CAST(l.LessonNumber AS nvarchar(10)), ',') WITHIN GROUP (ORDER BY l.LessonNumber) AS LessonNumbers
        FROM vocabularies v
        LEFT JOIN lesson_vocabularies lv ON lv.VocabularyId = v.Id
        LEFT JOIN lessons l ON l.Id = lv.LessonId
        WHERE v.HskLevel = 2 AND v.Hanzi IN (N'得', N'还', N'长') AND v.Status = N'PUBLISHED'
        GROUP BY v.Id, v.HskLevel, v.Hanzi, v.Pinyin, v.Status
        ORDER BY v.Hanzi
    """)
    multi_rows = cur.fetchall()
    print(f"3. Multi-lesson words (得, 还, 长): {multi_rows}")

    # 4. Homographs preserved separately (对, 等, 过)
    cur.execute("""
        SELECT v.HskLevel, v.Hanzi, v.Pinyin, v.Homograph, v.PartOfSpeech, v.Status
        FROM vocabularies v
        WHERE v.HskLevel = 4 AND v.Hanzi IN (N'对', N'等', N'过') AND v.Status = N'PUBLISHED'
        ORDER BY v.Hanzi, v.Homograph
    """)
    homo_rows = cur.fetchall()
    print(f"4. Homograph distinct senses (HSK4 对, 等, 过): {len(homo_rows)} rows")
    for hr in homo_rows:
        print("  ", hr)

    # 5. Dangling FKs
    cur.execute("SELECT COUNT(*) FROM exercises e WHERE e.VocabularyId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM vocabularies v WHERE v.Id = e.VocabularyId)")
    dangling_ex = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM lesson_vocabularies lv WHERE NOT EXISTS (SELECT 1 FROM lessons l WHERE l.Id = lv.LessonId) OR NOT EXISTS (SELECT 1 FROM vocabularies v WHERE v.Id = lv.VocabularyId)")
    dangling_lv = cur.fetchone()[0]
    print(f"5. Dangling links: exercises={dangling_ex}, lesson_vocabularies={dangling_lv}")

    # 6. Published HSK 1-4 counts
    cur.execute("""
        SELECT HskLevel, COUNT(*) AS Cnt
        FROM vocabularies
        WHERE HskLevel BETWEEN 1 AND 4 AND Status = N'PUBLISHED'
        GROUP BY HskLevel ORDER BY HskLevel
    """)
    pub_counts = cur.fetchall()
    print(f"6. Published counts HSK 1-4: {pub_counts}")

    ok = (
        len(active_dups) == 0
        and len(ba_rows) == 1
        and dangling_ex == 0
        and dangling_lv == 0
        and len(multi_rows) == 3
    )
    print(f"VERDICT: {'PASS' if ok else 'FAIL'}")
    return ok


def main() -> int:
    parser = argparse.ArgumentParser(description="ZhongWenHub duplicate vocabulary remediation")
    parser.add_argument("--db", required=True, choices=sorted(ALLOWED_DBS))
    parser.add_argument("--backup", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--rollback", type=Path)
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()

    conn = get_conn(args.db)
    try:
        if args.backup:
            write_backup(conn, args.db, tag="manual")

        if args.rollback:
            rollback_from_backup(conn, args.rollback)

        if args.dry_run or args.apply:
            plan = build_plan(conn, args.db)
            print(json.dumps(plan, ensure_ascii=False, indent=2))
            if args.apply:
                write_backup(conn, args.db, tag="pre_apply")
                apply_plan(conn, plan)
                print(f"[APPLY] Applied {len(plan['merge_ops'])} merges, {len(plan['homograph_tags'])} homograph tags, {len(plan['deletes'])} row cleanups to {args.db}.")

        if args.verify:
            ok = verify_db(conn, args.db)
            return 0 if ok else 1

        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
