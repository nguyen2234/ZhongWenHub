"""
ZhongWenHub - Question Bank Phase 2 Audit, Explanation Upgrade & Batch Expansion Pipeline
=======================================================================================
Usage:
  python scripts/question_bank_phase2_pipeline.py --dry-run
  python scripts/question_bank_phase2_pipeline.py --apply

Rules enforced:
- NEVER touches or deletes the 337 existing PUBLISHED/APPROVED curriculum exercises.
- NEVER modifies ARCHIVED or HSK 5-6 legacy rows, users, or student progress tables.
- NEVER auto-approves or auto-publishes any audited or newly generated question.
- Computes SHA-256 ContentHash identically to C# QuestionValidationHelper.ComputeContentHash.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import random
import re
import unicodedata
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

import pyodbc

SQL_SERVERS = [
    r".\SQLEXPRESS",
    "localhost",
]

TARGET_COUNTS = {
    1: 500,
    2: 900,
    3: 1500,
    4: 2100,
}

BATCH_SIZE = 150
RNG = random.Random(20261111)

PUNCT_AND_SPACE_RE = re.compile(
    r"[\s\u3000\.,!\?。！？，、；：\"'“”‘’（）\(\)【】\[\]—\-·…~`]+"
)
PAREN_NOTE_RE = re.compile(r"\s*\([^)]*\)\s*")


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
    if t in ("reading_comprehension", "choice"):
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
    qtype: str | None,
    prompt_hanzi: str | None,
    prompt_vi: str | None,
    correct_answer: str | None,
) -> str:
    canonical_type = normalize_type(qtype)
    p_hanzi = normalize_answer_text(prompt_hanzi)
    p_vi = normalize_answer_text(prompt_vi)
    ans = normalize_answer_text(strip_parenthetical_note(correct_answer))
    payload = f"{hsk_level}|{canonical_type}|{p_hanzi}|{p_vi}|{ans}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest().lower()


def meaning_tokens(meaning: str | None) -> set[str]:
    if not meaning:
        return set()
    cleaned = strip_parenthetical_note(meaning).lower()
    parts = re.split(r"[,;/]+", cleaned)
    return {p.strip() for p in parts if len(p.strip()) >= 2}


def meanings_overlap(a: str, b: str) -> bool:
    na = normalize_answer_text(strip_parenthetical_note(a))
    nb = normalize_answer_text(strip_parenthetical_note(b))
    if not na or not nb:
        return True
    if na == nb or na in nb or nb in na:
        return True
    ta = meaning_tokens(a)
    tb = meaning_tokens(b)
    if ta and tb and (ta & tb):
        return True
    return False


def connect_db(db_name: str) -> pyodbc.Connection:
    last_err = None
    for srv in SQL_SERVERS:
        try:
            conn_str = (
                f"Driver={{SQL Server}};Server={srv};Database={db_name};"
                "Trusted_Connection=yes;"
            )
            return pyodbc.connect(conn_str)
        except Exception as exc:
            last_err = exc
    raise RuntimeError(f"Could not connect to {db_name}: {last_err}")


def normalize_pos_label(pos: str | None) -> str:
    p = (pos or "").strip().lower()
    if not p:
        return "Từ vựng"
    mapping = {
        "n": "Danh từ",
        "danh từ": "Danh từ",
        "名": "Danh từ",
        "v": "Động từ",
        "động từ": "Động từ",
        "动": "Động từ",
        "a": "Tính từ",
        "adj": "Tính từ",
        "tính từ": "Tính từ",
        "形": "Tính từ",
        "d": "Phó từ",
        "adv": "Phó từ",
        "phó từ": "Phó từ",
        "副": "Phó từ",
        "r": "Đại từ",
        "đại từ": "Đại từ",
        "代": "Đại từ",
        "m": "Số từ",
        "số từ": "Số từ",
        "数": "Số từ",
        "q": "Lượng từ",
        "lượng từ": "Lượng từ",
        "量": "Lượng từ",
        "p": "Giới từ",
        "giới từ": "Giới từ",
        "介": "Giới từ",
        "c": "Liên từ",
        "liên từ": "Liên từ",
        "连": "Liên từ",
        "u": "Trợ từ",
        "trợ từ": "Trợ từ",
        "助": "Trợ từ",
    }
    for k, v in mapping.items():
        if p == k or p.startswith(k + " "):
            return v
    return pos.strip() if pos else "Từ vựng"


def load_verified_sources(base_dir: str, conn: pyodbc.Connection) -> dict[str, Any]:
    """Load verified MIT dictionaries, SQL vocabularies, staging enrichment examples, HSK 2.0 grammar, and lesson dialogues."""
    vocab_by_hanzi: dict[str, dict[str, Any]] = {}
    vocab_by_level: dict[int, list[dict[str, Any]]] = defaultdict(list)

    cur = conn.cursor()
    cur.execute(
        """
        SELECT Id, LessonId, HskLevel, Hanzi, Pinyin, MeaningVi, PartOfSpeech, ExamplesJson
        FROM vocabularies
        WHERE HskLevel BETWEEN 1 AND 4 AND Hanzi IS NOT NULL AND MeaningVi IS NOT NULL
        ORDER BY HskLevel, Hanzi
        """
    )
    for vid, lid, lvl, hanzi, pinyin, meaning, pos, ex_json in cur.fetchall():
        hz = (hanzi or "").strip()
        mv = (meaning or "").strip()
        if not hz or not mv:
            continue
        examples = []
        if ex_json:
            try:
                parsed = json.loads(ex_json)
                if isinstance(parsed, list):
                    for ex in parsed:
                        zh = (ex.get("zh") or ex.get("chinese") or "").strip()
                        py = (ex.get("pinyin") or "").strip()
                        vi = (ex.get("vi") or ex.get("translation") or ex.get("meaningVi") or "").strip()
                        if zh and vi and "我们经常使用" not in zh:
                            examples.append({"zh": zh, "pinyin": py, "vi": vi})
            except Exception:
                pass
        entry = {
            "id": str(vid),
            "lessonId": str(lid) if lid else None,
            "hskLevel": int(lvl),
            "hanzi": hz,
            "pinyin": (pinyin or "").strip(),
            "meaningVi": mv,
            "pos": normalize_pos_label(pos),
            "examples": examples,
            "sourceId": "curriculum-vocab",
            "sourceLicense": "INTERNAL_AUTHORED",
        }
        if hz not in vocab_by_hanzi:
            vocab_by_hanzi[hz] = entry
            vocab_by_level[int(lvl)].append(entry)

    # Enrich examples from curated verified HSK 1-4 staging files
    staging_files = [
        ("hsk1_vocabulary_examples.json", 1),
        ("hsk2_vocabulary_enrichment.json", 2),
        ("hsk3_vocabulary_enrichment.json", 3),
        ("hsk4_vocabulary_enrichment.json", 4),
    ]
    for fn, lvl in staging_files:
        path = os.path.join(base_dir, "data", "hsk30", "staging", fn)
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as f:
            items = json.load(f)
        for item in items:
            hz = (item.get("hanzi") or "").strip()
            if not hz:
                continue
            exs = item.get("examples") or []
            if not exs and item.get("examplesJson"):
                try:
                    exs = json.loads(item["examplesJson"])
                except Exception:
                    exs = []
            if not exs and item.get("exampleSentenceZh"):
                exs = [
                    {
                        "zh": item.get("exampleSentenceZh"),
                        "pinyin": item.get("exampleSentencePinyin", ""),
                        "vi": item.get("exampleSentenceVi", ""),
                    }
                ]
            cleaned_exs = []
            for ex in exs:
                zh = (ex.get("zh") or ex.get("chinese") or "").strip()
                py = (ex.get("pinyin") or "").strip()
                vi = (ex.get("vi") or ex.get("translation") or "").strip()
                if zh and vi and "我们经常使用" not in zh:
                    cleaned_exs.append({"zh": zh, "pinyin": py, "vi": vi})
            if hz in vocab_by_hanzi:
                existing_zh = {e["zh"] for e in vocab_by_hanzi[hz]["examples"]}
                for ce in cleaned_exs:
                    if ce["zh"] not in existing_zh:
                        vocab_by_hanzi[hz]["examples"].append(ce)
                        existing_zh.add(ce["zh"])
            else:
                entry = {
                    "id": item.get("vocabularyId") or item.get("devId"),
                    "lessonId": item.get("lessonId"),
                    "hskLevel": int(item.get("hskLevel") or lvl),
                    "hanzi": hz,
                    "pinyin": (item.get("pinyin") or "").strip(),
                    "meaningVi": (item.get("meaningVi") or "").strip(),
                    "pos": normalize_pos_label(item.get("partOfSpeech")),
                    "examples": cleaned_exs,
                    "sourceId": f"staging-enrichment-hsk{lvl}",
                    "sourceLicense": "INTERNAL_AUTHORED",
                }
                if entry["meaningVi"]:
                    vocab_by_hanzi[hz] = entry
                    vocab_by_level[entry["hskLevel"]].append(entry)

    # Load drkameleon MIT lexicon lookup (pinyin + EN meanings + POS fallback)
    drk_lookup: dict[str, dict[str, Any]] = {}
    for lvl in (1, 2, 3, 4):
        p = os.path.join(base_dir, "data", "hsk20", "sources", f"drkameleon_hsk{lvl}.json")
        if not os.path.exists(p):
            continue
        with open(p, encoding="utf-8") as f:
            arr = json.load(f)
        for row in arr:
            hz = (row.get("simplified") or "").strip()
            if not hz:
                continue
            forms = row.get("forms") or []
            py = ""
            meanings = []
            if forms:
                py = (forms[0].get("transcriptions") or {}).get("pinyin", "")
                meanings = forms[0].get("meanings") or []
            drk_lookup[hz] = {
                "hskLevel": lvl,
                "pinyin": py,
                "pos": row.get("pos") or [],
                "meanings": meanings,
            }

    # Load real non-boilerplate grammar points (HSK 1-4)
    grammar_points: list[dict[str, Any]] = []
    cur.execute(
        """
        SELECT Id, Code, Title, HskLevel, StructureFormula, Explanation, ExamplesJson, LessonId
        FROM grammar_points
        WHERE HskLevel BETWEEN 1 AND 4
          AND ExamplesJson IS NOT NULL AND LEN(ExamplesJson) > 15
          AND ExamplesJson NOT LIKE '%我们经常使用%'
          AND Explanation NOT LIKE '%thuộc nhóm cấu trúc nào%'
        ORDER BY HskLevel, Code
        """
    )
    for gid, code, title, lvl, formula, exp, ex_json, lid in cur.fetchall():
        try:
            exs = json.loads(ex_json or "[]")
        except Exception:
            exs = []
        valid_exs = []
        for ex in exs:
            zh = (ex.get("zh") or ex.get("chinese") or "").strip()
            py = (ex.get("pinyin") or "").strip()
            vi = (ex.get("meaningVi") or ex.get("vi") or ex.get("translation") or "").strip()
            if zh and vi and "我们经常使用" not in zh:
                valid_exs.append({"zh": zh, "pinyin": py, "vi": vi})
        if valid_exs:
            grammar_points.append(
                {
                    "id": str(gid),
                    "code": code or "",
                    "title": (title or "").strip(),
                    "hskLevel": int(lvl),
                    "formula": (formula or "").strip(),
                    "explanation": (exp or "").strip(),
                    "examples": valid_exs,
                    "lessonId": str(lid) if lid else None,
                }
            )

    # Load published lesson dialogues (HSK 1-4)
    cur.execute(
        """
        SELECT l.Id, c.HskLevel, l.LessonNumber, l.TitleZh, l.TitleVi, l.DialogueJson
        FROM lessons l
        JOIN courses c ON l.CourseId = c.Id
        WHERE l.Status = 'PUBLISHED' AND c.HskLevel BETWEEN 1 AND 4 AND l.DialogueJson IS NOT NULL
        ORDER BY c.HskLevel, l.LessonNumber
        """
    )
    dialogues: list[dict[str, Any]] = []
    for lid, lvl, lnum, tzh, tvi, djson in cur.fetchall():
        try:
            turns = json.loads(djson or "[]")
        except Exception:
            turns = []
        if isinstance(turns, dict):
            turns = turns.get("lines") or turns.get("turns") or []
        if isinstance(turns, list) and len(turns) >= 2:
            dialogues.append(
                {
                    "lessonId": str(lid),
                    "hskLevel": int(lvl),
                    "lessonNumber": int(lnum),
                    "titleZh": tzh or "",
                    "titleVi": tvi or "",
                    "turns": turns,
                }
            )

    return {
        "vocabByHanzi": vocab_by_hanzi,
        "vocabByLevel": vocab_by_level,
        "drkLookup": drk_lookup,
        "grammarPoints": grammar_points,
        "dialogues": dialogues,
    }


def pick_distinct_vocab_distractors(
    target_entry: dict[str, Any],
    vocab_by_level: dict[int, list[dict[str, Any]]],
    field: str,  # 'meaningVi' or 'hanzi'
    count: int = 3,
) -> list[dict[str, Any]]:
    lvl = target_entry["hskLevel"]
    target_pos = target_entry["pos"]
    same_lvl = vocab_by_level.get(lvl, [])
    same_pos = [v for v in same_lvl if v["pos"] == target_pos and v["hanzi"] != target_entry["hanzi"]]
    other_lvl = [v for v in same_lvl if v["hanzi"] != target_entry["hanzi"]]
    fallback_pool = vocab_by_level.get(max(1, lvl - 1), []) + vocab_by_level.get(min(4, lvl + 1), [])

    RNG.shuffle(same_pos)
    RNG.shuffle(other_lvl)
    RNG.shuffle(fallback_pool)

    chosen: list[dict[str, Any]] = []
    chosen_meanings = [target_entry["meaningVi"]]
    chosen_hanzi = {target_entry["hanzi"]}

    for candidate in same_pos + other_lvl + fallback_pool:
        if len(chosen) >= count:
            break
        if candidate["hanzi"] in chosen_hanzi:
            continue
        if any(meanings_overlap(candidate["meaningVi"], m) for m in chosen_meanings):
            continue
        if field == "meaningVi" and len(candidate["meaningVi"]) > 75:
            continue
        chosen.append(candidate)
        chosen_hanzi.add(candidate["hanzi"])
        chosen_meanings.append(candidate["meaningVi"])

    return chosen


def describe_word_brief(hz: str, sources: dict[str, Any]) -> str:
    v = sources["vocabByHanzi"].get(hz)
    if v:
        py = f" ({v['pinyin']})" if v["pinyin"] else ""
        return f"'{hz}'{py}: {v['meaningVi']}"
    d = sources["drkLookup"].get(hz)
    if d and d.get("meanings"):
        py = f" ({d['pinyin']})" if d.get("pinyin") else ""
        return f"'{hz}'{py}: {d['meanings'][0]}"
    return f"'{hz}'"


def audit_and_build_updates(
    conn: pyodbc.Connection, sources: dict[str, Any]
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    """Audit all 570 PENDING_REVIEW rows cleanly (never auto-approve or auto-publish)."""
    cur = conn.cursor()
    cur.execute(
        """
        SELECT Id, HskLevel, Type, Skill, Title, Instruction, PromptHanzi, PromptPinyin,
               PromptVietnamese, OptionsJson, CorrectOptionIndex, CorrectAnswer,
               Explanation, SourceId, SourceLicense, Tags, LessonId, VocabularyId
        FROM exercises
        WHERE ReviewStatus = 'PENDING_REVIEW'
          AND (SourceId LIKE 'InAnskr%' OR SourceId LIKE 'drkameleon%')
        ORDER BY CreatedAt, Id
        """
    )
    rows = cur.fetchall()

    # Load existing published/draft non-rejected hashes to detect duplicates cleanly
    cur.execute(
        "SELECT Id, ContentHash FROM exercises WHERE ContentHash IS NOT NULL AND ReviewStatus <> 'PENDING_REVIEW' AND ReviewStatus <> 'REJECTED'"
    )
    existing_hashes = {r[1]: str(r[0]) for r in cur.fetchall() if r[1]}

    stats = defaultdict(int)
    updates: list[dict[str, Any]] = []
    batch_hashes: set[str] = set()

    for row in rows:
        (
            qid,
            lvl,
            qtype,
            skill,
            title,
            instr,
            p_hz,
            p_py,
            p_vi,
            opts_json,
            corr_idx,
            corr_ans,
            exp,
            src_id,
            src_lic,
            tags,
            lesson_id,
            vocab_id,
        ) = row

        opts: list[str] = []
        if opts_json:
            try:
                opts = [str(x).strip() for x in json.loads(opts_json) if str(x).strip()]
            except Exception:
                opts = []

        src = src_id or ""
        norm_type = normalize_type(qtype)

        # ---- Branch 1: InAnskr/HSK4Level-Test audit ----
        if src.startswith("InAnskr"):
            ph_s = (p_hz or "").strip()
            reject_reason = None
            if len(opts) < 2:
                reject_reason = "Bỏ loại: Thiếu danh sách phương án trả lời hợp lệ."
            elif all(o in ["A", "B", "C", "D", "E", "F"] for o in opts):
                reject_reason = (
                    "Bỏ loại: Phương án chỉ là ký tự giữ chỗ A–F, thiếu danh sách từ gốc của phần Đọc hiểu."
                )
            elif "请按正确顺序排列句子" in ph_s and (
                "A " not in ph_s and "A." not in ph_s and "A：" not in ph_s
            ):
                reject_reason = (
                    "Bỏ loại: Câu hỏi sắp xếp câu thiếu 3 mệnh đề A/B/C trong phần đề bài."
                )
            elif ("听" in ph_s and "录音" in ph_s and len(ph_s) < 60) or (
                0 <= ph_s.find("★") < 20
            ) or (len(ph_s) < 35 and set(opts) <= {"对", "错"}):
                reject_reason = (
                    "Bỏ loại: Câu hỏi Đọc hiểu/Nghe thiếu đoạn văn ngữ cảnh hoặc tệp âm thanh."
                )

            if reject_reason:
                stats["inanskr_rejected"] += 1
                updates.append(
                    {
                        "id": str(qid),
                        "reviewStatus": "REJECTED",
                        "reviewNotes": reject_reason,
                        "type": norm_type,
                        "skill": skill,
                        "promptHanzi": p_hz,
                        "promptPinyin": p_py,
                        "promptVietnamese": p_vi,
                        "optionsJson": opts_json,
                        "correctOptionIndex": corr_idx,
                        "correctAnswer": corr_ans,
                        "explanation": exp,
                        "contentHash": compute_content_hash(lvl, norm_type, p_hz, p_vi, corr_ans),
                        "validationScore": 25.0,
                        "vocabularyId": str(vocab_id) if vocab_id else None,
                    }
                )
                continue

            # Valid InAnskr question -> build substantive Vietnamese explanation
            ans_str = (corr_ans or "").strip()
            new_corr_idx = corr_idx
            if ans_str in opts:
                new_corr_idx = opts.index(ans_str)
            elif corr_idx is not None and 0 <= corr_idx < len(opts):
                ans_str = opts[corr_idx]

            is_ordering = "排列" in ph_s or (set(opts) <= {"ABC", "ACB", "BAC", "BCA", "CAB", "CBA"})
            if is_ordering:
                markers = []
                for kw, vi_hint in [
                    ("因此", "因此 (vì vậy)"),
                    ("所以", "所以 (cho nên)"),
                    ("但是", "但是 (nhưng)"),
                    ("可是", "可是 (nhưng mà)"),
                    ("而且", "而且 (hơn nữa)"),
                    ("首先", "首先 (trước tiên)"),
                    ("其实", "其实 (thực ra)"),
                    ("后来", "后来 (sau đó)"),
                ]:
                    if kw in ph_s:
                        markers.append(vi_hint)
                marker_note = (
                    f" Chú ý từ nối logic trong câu: {', '.join(markers[:3])}."
                    if markers
                    else " Chú ý mạch chủ ngữ dẫn nhập -> triển khai/nguyên nhân -> kết luận."
                )
                wrong_orders = [o for o in opts if o != ans_str][:3]
                new_exp = (
                    f"Trình tự câu chính xác là '{ans_str}' dựa trên quan hệ liên kết giữa các vế A–B–C.{marker_note} "
                    f"Các trật tự nhiễu ({', '.join(wrong_orders)}) làm đứt mạch thời gian hoặc quan hệ nhân-quả của câu HSK 4. (Nguồn: {src}, CC BY-NC-SA 4.0)"
                )
            elif "★" in ph_s:
                distractors = [o for o in opts if o != ans_str][:3]
                new_exp = (
                    f"Đáp án đúng theo nội dung đoạn đọc hiểu HSK 4 là '{ans_str}'. "
                    f"Khi đối chiếu câu hỏi (★) với dữ kiện trong đoạn văn, các phương án còn lại ({', '.join(distractors)}) suy diễn sai hoặc thiếu căn cứ từ ngữ cảnh bài đọc. (Nguồn: {src}, CC BY-NC-SA 4.0)"
                )
            else:
                # Cloze / sentence fill MCQ
                ans_desc = describe_word_brief(ans_str, sources)
                dist_descs = [describe_word_brief(o, sources) for o in opts if o != ans_str][:3]
                new_exp = (
                    f"Chỗ trống cần từ {ans_desc} để hoàn chỉnh cả về ngữ nghĩa lẫn kết hợp từ trong ngữ cảnh HSK 4. "
                    f"Phân biệt các phương án nhiễu: {'; '.join(dist_descs)} — đều không khớp vai trò ngữ pháp hoặc ý nghĩa của câu. (Nguồn: {src}, CC BY-NC-SA 4.0)"
                )

            c_hash = compute_content_hash(lvl, norm_type, p_hz, p_vi, ans_str)
            if c_hash in existing_hashes or c_hash in batch_hashes:
                stats["inanskr_rejected_dup"] += 1
                updates.append(
                    {
                        "id": str(qid),
                        "reviewStatus": "REJECTED",
                        "reviewNotes": "Bỏ loại: Câu hỏi trùng lặp nội dung (ContentHash) trong ngân hàng câu hỏi.",
                        "type": norm_type,
                        "skill": skill,
                        "promptHanzi": p_hz,
                        "promptPinyin": p_py,
                        "promptVietnamese": p_vi,
                        "optionsJson": json.dumps(opts, ensure_ascii=False),
                        "correctOptionIndex": new_corr_idx,
                        "correctAnswer": ans_str,
                        "explanation": new_exp,
                        "contentHash": c_hash,
                        "validationScore": 35.0,
                        "vocabularyId": str(vocab_id) if vocab_id else None,
                    }
                )
                continue

            batch_hashes.add(c_hash)
            stats["inanskr_needs_academic_review"] += 1
            updates.append(
                {
                    "id": str(qid),
                    "reviewStatus": "NEEDS_ACADEMIC_REVIEW",
                    "reviewNotes": "Phase 2 audit: Đã nâng cấp giải thích tiếng Việt; nguồn đề thi CC-BY-NC-SA-4.0 chờ giảng viên/kiểm duyệt học thuật rà soát trước khi xuất bản.",
                    "type": norm_type,
                    "skill": skill,
                    "promptHanzi": p_hz,
                    "promptPinyin": p_py,
                    "promptVietnamese": p_vi,
                    "optionsJson": json.dumps(opts, ensure_ascii=False),
                    "correctOptionIndex": new_corr_idx,
                    "correctAnswer": ans_str,
                    "explanation": new_exp,
                    "contentHash": c_hash,
                    "validationScore": 85.0,
                    "vocabularyId": str(vocab_id) if vocab_id else None,
                }
            )
            continue

        # ---- Branch 2: drkameleon MIT audit ----
        ans_str = (corr_ans or "").strip()
        target_hz = (
            (p_hz or "").strip() if norm_type == "multiple-choice" else ans_str
        )
        v_entry = sources["vocabByHanzi"].get(target_hz)
        drk_entry = sources["drkLookup"].get(target_hz)

        resolved_py = (p_py or (v_entry["pinyin"] if v_entry else (drk_entry["pinyin"] if drk_entry else ""))).strip()
        resolved_pos = v_entry["pos"] if v_entry else "Từ vựng"
        resolved_vid = v_entry["id"] if v_entry else (str(vocab_id) if vocab_id else None)
        resolved_meaning = v_entry["meaningVi"] if v_entry else (
            ans_str if norm_type == "multiple-choice" else (p_vi or "").replace(f"Nghĩa HSK {lvl}: ", "").strip()
        )

        new_type = norm_type
        new_p_hz = p_hz
        new_p_py = resolved_py or None
        new_p_vi = p_vi
        new_opts = list(opts)

        # Clean up fill-blank items that previously had bare PromptHanzi == '____'
        if norm_type == "fill-blank":
            matched_ex = None
            if v_entry and v_entry["examples"]:
                for ex in v_entry["examples"]:
                    if target_hz in ex["zh"]:
                        matched_ex = ex
                        break
            if matched_ex:
                new_p_hz = matched_ex["zh"].replace(target_hz, "（　）", 1)
                new_p_py = matched_ex["pinyin"] or resolved_py or None
                new_p_vi = f"Hoàn thành câu: \"{matched_ex['vi']}\""
                stats["drk_fillblank_contextualized"] += 1
            else:
                # Convert bare '____' without a verified example sentence cleanly into vietnamese-to-chinese
                new_type = "vietnamese-to-chinese"
                new_p_hz = None
                new_p_py = None
                new_p_vi = f"Chọn chữ Hán đúng ({resolved_pos}): {resolved_meaning}"
                stats["drk_fillblank_converted_v2c"] += 1
        elif norm_type == "vietnamese-to-chinese":
            # Fix ExerciseRenderer rendering: Vietnamese meaning must live in PromptVietnamese only, never PromptHanzi
            new_p_hz = None
            new_p_py = None
            new_p_vi = f"Chọn chữ Hán đúng ({resolved_pos}): {resolved_meaning}"

        # Fix option near-duplicates / synonym collisions in drkameleon
        has_opt_overlap = False
        if len(new_opts) < 4:
            has_opt_overlap = True
        else:
            for i in range(len(new_opts)):
                for j in range(i + 1, len(new_opts)):
                    if new_type == "multiple-choice":
                        if meanings_overlap(new_opts[i], new_opts[j]):
                            has_opt_overlap = True
                            break
                    elif normalize_answer_text(new_opts[i]) == normalize_answer_text(new_opts[j]):
                        has_opt_overlap = True
                        break
                if has_opt_overlap:
                    break

        if has_opt_overlap and v_entry:
            dist_field = "meaningVi" if new_type == "multiple-choice" else "hanzi"
            dists = pick_distinct_vocab_distractors(v_entry, sources["vocabByLevel"], dist_field, count=3)
            if len(dists) == 3:
                corr_val = ans_str if new_type == "multiple-choice" else target_hz
                new_opts = [corr_val] + [d[dist_field] for d in dists]
                RNG.shuffle(new_opts)
                stats["drk_distractors_rebuilt"] += 1

        new_corr_idx = new_opts.index(ans_str) if ans_str in new_opts else (corr_idx or 0)
        if not new_opts or ans_str not in new_opts or len(set(normalize_answer_text(o) for o in new_opts)) < len(new_opts):
            stats["drk_rejected_unfixable"] += 1
            updates.append(
                {
                    "id": str(qid),
                    "reviewStatus": "REJECTED",
                    "reviewNotes": "Bỏ loại: Phương án trả lời còn trùng lặp nghĩa hoặc thiếu đáp án khớp chuẩn.",
                    "type": new_type,
                    "skill": skill,
                    "promptHanzi": new_p_hz,
                    "promptPinyin": new_p_py,
                    "promptVietnamese": new_p_vi,
                    "optionsJson": json.dumps(new_opts, ensure_ascii=False),
                    "correctOptionIndex": new_corr_idx,
                    "correctAnswer": ans_str,
                    "explanation": exp,
                    "contentHash": compute_content_hash(lvl, new_type, new_p_hz, new_p_vi, ans_str),
                    "validationScore": 35.0,
                    "vocabularyId": resolved_vid,
                }
            )
            continue

        c_hash = compute_content_hash(lvl, new_type, new_p_hz, new_p_vi, ans_str)
        if c_hash in existing_hashes or c_hash in batch_hashes:
            stats["drk_rejected_dup"] += 1
            updates.append(
                {
                    "id": str(qid),
                    "reviewStatus": "REJECTED",
                    "reviewNotes": "Bỏ loại: Câu hỏi bị trùng ContentHash với một câu khác đã tồn tại trong ngân hàng.",
                    "type": new_type,
                    "skill": skill,
                    "promptHanzi": new_p_hz,
                    "promptPinyin": new_p_py,
                    "promptVietnamese": new_p_vi,
                    "optionsJson": json.dumps(new_opts, ensure_ascii=False),
                    "correctOptionIndex": new_corr_idx,
                    "correctAnswer": ans_str,
                    "explanation": exp,
                    "contentHash": c_hash,
                    "validationScore": 40.0,
                    "vocabularyId": resolved_vid,
                }
            )
            continue

        batch_hashes.add(c_hash)
        ex_note = ""
        if v_entry and v_entry["examples"]:
            ex0 = v_entry["examples"][0]
            ex_note = f" Ví dụ: \"{ex0['zh']}\" ({ex0['vi']})."

        if new_type == "multiple-choice":
            other_opts = [o for o in new_opts if o != ans_str][:3]
            new_exp = (
                f"Từ '{target_hz}' ({resolved_py}, {resolved_pos}) mang nghĩa \"{ans_str}\".{ex_note} "
                f"Phân biệt: các lựa chọn còn lại ({'; '.join(other_opts)}) tương ứng với từ vựng khác trong HSK {lvl}."
            )
        else:
            dist_descs = [describe_word_brief(o, sources) for o in new_opts if o != ans_str][:3]
            new_exp = (
                f"Đáp án là '{target_hz}' ({resolved_py}, {resolved_pos}) nghĩa là \"{resolved_meaning}\".{ex_note} "
                f"Phân biệt phương án nhiễu: {'; '.join(dist_descs)}."
            )

        stats["drk_validated"] += 1
        updates.append(
            {
                "id": str(qid),
                "reviewStatus": "VALIDATED",
                "reviewNotes": "Phase 2 audit: Đã chuẩn hóa phương án loại trùng, ngữ cảnh hóa câu điền khuyết và nâng cấp giải thích tiếng Việt (chờ duyệt xuất bản).",
                "type": new_type,
                "skill": skill,
                "promptHanzi": new_p_hz,
                "promptPinyin": new_p_py,
                "promptVietnamese": new_p_vi,
                "optionsJson": json.dumps(new_opts, ensure_ascii=False),
                "correctOptionIndex": new_corr_idx,
                "correctAnswer": ans_str,
                "explanation": new_exp,
                "contentHash": c_hash,
                "validationScore": 92.0,
                "vocabularyId": resolved_vid,
            }
        )

    return updates, dict(stats)


def segment_sentence_with_vocab(sentence: str, vocab_set: set[str]) -> list[str]:
    """Segment Chinese sentence cleanly into 3-6 natural semantic chunks for sentence-order."""
    # Strip trailing punctuation cleanly while preserving inner semantic units
    clean = sentence.strip().rstrip("。！？!?.,")
    if not clean or len(clean) < 5:
        return []
    tokens: list[str] = []
    i = 0
    max_len = 5
    while i < len(clean):
        ch = clean[i]
        if ch in "，、；：\"'“”‘’（）() ":
            i += 1
            continue
        matched = None
        for l in range(min(max_len, len(clean) - i), 0, -1):
            sub = clean[i : i + l]
            if sub in vocab_set:
                matched = sub
                break
        tokens.append(matched or ch)
        i += len(matched) if matched else 1

    # Merge overly tiny fragments until we have 3 to 6 clean ordering chunks
    if len(tokens) < 3:
        return []
    while len(tokens) > 6:
        # Merge shortest adjacent pair
        best_idx = 0
        best_len = 999
        for k in range(len(tokens) - 1):
            comb_len = len(tokens[k]) + len(tokens[k + 1])
            if comb_len < best_len:
                best_len = comb_len
                best_idx = k
        tokens[best_idx : best_idx + 2] = [tokens[best_idx] + tokens[best_idx + 1]]
    return tokens if 3 <= len(tokens) <= 6 else []


def build_expansion_candidates(
    conn: pyodbc.Connection,
    sources: dict[str, Any],
    existing_hashes: set[str],
    current_counts_by_hsk: dict[int, int],
) -> dict[int, list[dict[str, Any]]]:
    """Generate diverse, non-repetitive, high-value HSK 1-4 candidates up to target ceiling."""
    vocab_set = set(sources["vocabByHanzi"].keys()) | set(sources["drkLookup"].keys())
    per_level: dict[int, list[dict[str, Any]]] = defaultdict(list)
    seen_hashes = set(existing_hashes)

    def try_add(item: dict[str, Any]) -> bool:
        lvl = item["hskLevel"]
        needed = TARGET_COUNTS[lvl] - current_counts_by_hsk.get(lvl, 0) - len(per_level[lvl])
        if needed <= 0:
            return False
        ch = item["contentHash"]
        if ch in seen_hashes:
            return False
        seen_hashes.add(ch)
        per_level[lvl].append(item)
        return True

    # 1. Contextual Grammar Questions from HSK 2.0 Curated Grammar Points (high priority!)
    vocab_words_by_lvl = {
        lvl: sorted({v["hanzi"] for v in entries}, key=len, reverse=True)
        for lvl, entries in sources["vocabByLevel"].items()
    }
    for gp in sources["grammarPoints"]:
        lvl = gp["hskLevel"]
        for ex in gp["examples"]:
            zh = ex["zh"]
            # Try cloze with grammar keyword from formula/title, or fallback to key HSK word present in the grammar example
            candidates_kw = re.findall(r"[\u4e00-\u9fff]+", gp["formula"] or gp["title"])
            kw = next((k for k in candidates_kw if k in zh and 1 <= len(k) <= 4), None)
            if not kw:
                kw = next((w for w in vocab_words_by_lvl.get(lvl, []) if w in zh and 1 <= len(w) <= 3), None)
            if not kw:
                continue
            same_lvl_words = [
                v["hanzi"]
                for v in sources["vocabByLevel"].get(lvl, [])
                if v["hanzi"] != kw and len(v["hanzi"]) == len(kw)
            ]
            RNG.shuffle(same_lvl_words)
            if len(same_lvl_words) < 3:
                continue
            opts = [kw] + same_lvl_words[:3]
            RNG.shuffle(opts)
            p_hz = zh.replace(kw, "（　）", 1)
            p_vi = f"Điền cấu trúc ngữ pháp phù hợp: \"{ex['vi']}\""
            c_hash = compute_content_hash(lvl, "fill-blank", p_hz, p_vi, kw)
            dist_descs = [describe_word_brief(o, sources) for o in opts if o != kw]
            exp = (
                f"Cần điền '{kw}' theo điểm ngữ pháp '{gp['title']}' ({gp['formula']}). "
                f"{gp['explanation'][:160]} Phân biệt phương án nhiễu: {'; '.join(dist_descs)}."
            )
            try_add(
                {
                    "hskLevel": lvl,
                    "type": "fill-blank",
                    "skill": "grammar",
                    "difficulty": "EASY" if lvl == 1 else ("MEDIUM" if lvl <= 3 else "HARD"),
                    "title": f"HSK {lvl} · Ngữ pháp: {gp['title']}"[:250],
                    "instruction": "Chọn từ hoặc kết cấu ngữ pháp phù hợp điền vào chỗ trống.",
                    "promptHanzi": p_hz,
                    "promptPinyin": ex["pinyin"] or None,
                    "promptVietnamese": p_vi,
                    "options": opts,
                    "correctOptionIndex": opts.index(kw),
                    "correctAnswer": kw,
                    "explanation": exp,
                    "tags": f"hsk{lvl},grammar,{gp['code'].lower()}",
                    "sourceId": "zhongwenhub-grammar-hsk20-v2",
                    "sourceLicense": "INTERNAL_AUTHORED",
                    "contentHash": c_hash,
                    "validationScore": 95.0,
                    "lessonId": gp["lessonId"],
                    "grammarPointId": gp["id"],
                    "vocabularyId": None,
                }
            )
            tokens = segment_sentence_with_vocab(zh, vocab_set)
            if tokens:
                shuffled = list(tokens)
                if len(set(shuffled)) >= 2:
                    RNG.shuffle(shuffled)
                    if "".join(shuffled) == "".join(tokens):
                        shuffled = tokens[1:] + tokens[:1]
                s_p_hz = " ".join(f"[{t}]" for t in shuffled)
                s_p_vi = f"Ngữ pháp '{gp['title']}': \"{ex['vi']}\""
                s_hash = compute_content_hash(lvl, "sentence-order", s_p_hz, s_p_vi, zh.strip())
                s_exp = (
                    f"Câu đúng theo mẫu '{gp['title']}' ({gp['formula']}) là \"{zh.strip()}\" ({ex['pinyin']}) — \"{ex['vi']}\". "
                    f"Thứ tự các cụm từ chuẩn: [{' → '.join(tokens)}]."
                )
                try_add(
                    {
                        "hskLevel": lvl,
                        "type": "sentence-order",
                        "skill": "grammar",
                        "difficulty": "MEDIUM" if lvl <= 2 else "HARD",
                        "title": f"HSK {lvl} · Trật tự ngữ pháp: {gp['title']}"[:250],
                        "instruction": "Sắp xếp các thành phần câu theo đúng điểm ngữ pháp HSK.",
                        "promptHanzi": s_p_hz,
                        "promptPinyin": None,
                        "promptVietnamese": s_p_vi,
                        "options": [],
                        "correctOptionIndex": None,
                        "correctAnswer": zh.strip(),
                        "explanation": s_exp,
                        "tags": f"hsk{lvl},grammar,sentence-order,{gp['code'].lower()}",
                        "sourceId": "zhongwenhub-grammar-hsk20-v2",
                        "sourceLicense": "INTERNAL_AUTHORED",
                        "contentHash": s_hash,
                        "validationScore": 95.0,
                        "lessonId": gp["lessonId"],
                        "grammarPointId": gp["id"],
                        "vocabularyId": None,
                    }
                )

    # 2. Published Lesson Dialogue Comprehension (HSK 1-4)
    for dl in sources["dialogues"]:
        lvl = dl["hskLevel"]
        turns = [t for t in dl["turns"] if isinstance(t, dict) and len((t.get("zh") or t.get("chinese") or t.get("line") or "").strip()) >= 4]
        if len(turns) < 2:
            continue
        same_lvl_lines = []
        for dl2 in sources["dialogues"]:
            if dl2["lessonId"] == dl["lessonId"]:
                continue
            for t in dl2["turns"]:
                if isinstance(t, dict):
                    txt = (t.get("zh") or t.get("chinese") or t.get("line") or "").strip()
                    if 4 <= len(txt) <= 36:
                        same_lvl_lines.append(txt)
        for pair_idx in range(min(3, len(turns) - 1)):
            t0 = turns[pair_idx]
            t1 = turns[pair_idx + 1]
            prompt_line = (t0.get("zh") or t0.get("chinese") or t0.get("line") or "").strip()
            reply_line = (t1.get("zh") or t1.get("chinese") or t1.get("line") or "").strip()
            candidates_dist = [x for x in same_lvl_lines if normalize_answer_text(x) != normalize_answer_text(reply_line)]
            RNG.shuffle(candidates_dist)
            if len(candidates_dist) < 3:
                continue
            opts = [reply_line] + candidates_dist[:3]
            if len(set(normalize_answer_text(o) for o in opts)) < 4:
                continue
            RNG.shuffle(opts)
            p_hz = f"A：{prompt_line}\nB：（　）"
            p_vi = f"Hội thoại Bài {dl['lessonNumber']} ({dl['titleVi'] or dl['titleZh']}): A nói \"{t0.get('vi') or t0.get('translation') or ''}\""
            c_hash = compute_content_hash(lvl, "multiple-choice", p_hz, p_vi, reply_line)
            exp = (
                f"Trong ngữ cảnh hội thoại Bài {dl['lessonNumber']} HSK {lvl}, câu đáp tự nhiên là '{reply_line}' ({t1.get('pinyin','')}) — \"{t1.get('vi') or t1.get('translation') or ''}\". "
                f"Các câu nhiễu thuộc bối cảnh giao tiếp khác nên không khớp mạch hỏi-đáp."
            )
            try_add(
                {
                    "hskLevel": lvl,
                    "type": "multiple-choice",
                    "skill": "reading",
                    "difficulty": "EASY" if lvl == 1 else ("MEDIUM" if lvl <= 3 else "HARD"),
                    "title": f"HSK {lvl} · Hội thoại Bài {dl['lessonNumber']}"[:250],
                    "instruction": "Chọn câu hồi đáp phù hợp với ngữ cảnh hội thoại.",
                    "promptHanzi": p_hz,
                    "promptPinyin": t0.get("pinyin") or None,
                    "promptVietnamese": p_vi,
                    "options": opts,
                    "correctOptionIndex": opts.index(reply_line),
                    "correctAnswer": reply_line,
                    "explanation": exp,
                    "tags": f"hsk{lvl},reading,dialogue,lesson-{dl['lessonNumber']}",
                    "sourceId": "zhongwenhub-dialogue-reading-v2",
                    "sourceLicense": "INTERNAL_AUTHORED",
                    "contentHash": c_hash,
                    "validationScore": 94.0,
                    "lessonId": dl["lessonId"],
                    "grammarPointId": None,
                    "vocabularyId": None,
                }
            )

    # 3. Pass across Vocabulary: (A) Contextual Cloze fill-blank, (B) Hanzi->Vi MC, (C) Vi->Hanzi V2C, (D) Sentence Order
    for lvl in (1, 2, 3, 4):
        entries = list(sources["vocabByLevel"].get(lvl, []))
        # Round 1: Contextual sentence cloze (fill-blank) from real examples
        for v in entries:
            if TARGET_COUNTS[lvl] - current_counts_by_hsk.get(lvl, 0) - len(per_level[lvl]) <= 0:
                break
            for ex in v["examples"]:
                if v["hanzi"] not in ex["zh"]:
                    continue
                dists = pick_distinct_vocab_distractors(v, sources["vocabByLevel"], "hanzi", count=3)
                if len(dists) < 3:
                    continue
                opts = [v["hanzi"]] + [d["hanzi"] for d in dists]
                RNG.shuffle(opts)
                p_hz = ex["zh"].replace(v["hanzi"], "（　）", 1)
                p_vi = f"Điền từ thích hợp ({v['pos']}): \"{ex['vi']}\""
                c_hash = compute_content_hash(lvl, "fill-blank", p_hz, p_vi, v["hanzi"])
                dist_descs = [f"'{d['hanzi']}' ({d['pinyin']}): {d['meaningVi']}" for d in dists]
                exp = (
                    f"Chỗ trống cần '{v['hanzi']}' ({v['pinyin']}, {v['pos']}) nghĩa là \"{v['meaningVi']}\". "
                    f"Câu hoàn chỉnh: \"{ex['zh']}\" ({ex['vi']}). "
                    f"Phân biệt các lựa chọn khác: {'; '.join(dist_descs)}."
                )
                try_add(
                    {
                        "hskLevel": lvl,
                        "type": "fill-blank",
                        "skill": "vocabulary",
                        "difficulty": "EASY" if lvl == 1 else ("MEDIUM" if lvl <= 3 else "HARD"),
                        "title": f"HSK {lvl} · Điền từ ngữ cảnh ({v['pos']})"[:250],
                        "instruction": "Chọn chữ Hán đúng nhất điền vào chỗ trống theo nghĩa câu.",
                        "promptHanzi": p_hz,
                        "promptPinyin": ex["pinyin"] or None,
                        "promptVietnamese": p_vi,
                        "options": opts,
                        "correctOptionIndex": opts.index(v["hanzi"]),
                        "correctAnswer": v["hanzi"],
                        "explanation": exp,
                        "tags": f"hsk{lvl},vocabulary,contextual-cloze",
                        "sourceId": v["sourceId"],
                        "sourceLicense": v["sourceLicense"],
                        "contentHash": c_hash,
                        "validationScore": 96.0,
                        "lessonId": v["lessonId"],
                        "grammarPointId": None,
                        "vocabularyId": v["id"],
                    }
                )
                break  # 1 cloze per vocab first pass

        # Round 2: Hanzi -> Vietnamese meaning recognition (multiple-choice)
        for v in entries:
            if TARGET_COUNTS[lvl] - current_counts_by_hsk.get(lvl, 0) - len(per_level[lvl]) <= 0:
                break
            dists = pick_distinct_vocab_distractors(v, sources["vocabByLevel"], "meaningVi", count=3)
            if len(dists) < 3:
                continue
            opts = [v["meaningVi"]] + [d["meaningVi"] for d in dists]
            RNG.shuffle(opts)
            p_hz = v["hanzi"]
            p_vi = f"Từ loại: {v['pos']}"
            c_hash = compute_content_hash(lvl, "multiple-choice", p_hz, p_vi, v["meaningVi"])
            ex_hint = (
                f" Ví dụ: \"{v['examples'][0]['zh']}\" ({v['examples'][0]['vi']})."
                if v["examples"]
                else ""
            )
            dist_descs = [f"\"{d['meaningVi']}\" là nghĩa của '{d['hanzi']}' ({d['pinyin']})" for d in dists]
            exp = (
                f"Từ '{v['hanzi']}' ({v['pinyin']}, {v['pos']}) mang nghĩa \"{v['meaningVi']}\".{ex_hint} "
                f"Phân biệt: {'; '.join(dist_descs)}."
            )
            try_add(
                {
                    "hskLevel": lvl,
                    "type": "multiple-choice",
                    "skill": "vocabulary",
                    "difficulty": "EASY" if lvl == 1 else ("MEDIUM" if lvl <= 3 else "HARD"),
                    "title": f"HSK {lvl} · Từ vựng: {v['hanzi']}"[:250],
                    "instruction": "Chọn nghĩa tiếng Việt chính xác nhất cho từ vựng sau.",
                    "promptHanzi": p_hz,
                    "promptPinyin": v["pinyin"] or None,
                    "promptVietnamese": p_vi,
                    "options": opts,
                    "correctOptionIndex": opts.index(v["meaningVi"]),
                    "correctAnswer": v["meaningVi"],
                    "explanation": exp,
                    "tags": f"hsk{lvl},vocabulary,meaning-recognition",
                    "sourceId": v["sourceId"],
                    "sourceLicense": v["sourceLicense"],
                    "contentHash": c_hash,
                    "validationScore": 92.0,
                    "lessonId": v["lessonId"],
                    "grammarPointId": None,
                    "vocabularyId": v["id"],
                }
            )

        # Round 3: Vietnamese -> Hanzi recall (vietnamese-to-chinese, PromptHanzi=NULL)
        for v in entries:
            if TARGET_COUNTS[lvl] - current_counts_by_hsk.get(lvl, 0) - len(per_level[lvl]) <= 0:
                break
            dists = pick_distinct_vocab_distractors(v, sources["vocabByLevel"], "hanzi", count=3)
            if len(dists) < 3:
                continue
            opts = [v["hanzi"]] + [d["hanzi"] for d in dists]
            RNG.shuffle(opts)
            p_vi = f"{v['meaningVi']} ({v['pos']})"
            c_hash = compute_content_hash(lvl, "vietnamese-to-chinese", None, p_vi, v["hanzi"])
            ex_hint = (
                f" Ví dụ: \"{v['examples'][0]['zh']}\" ({v['examples'][0]['vi']})."
                if v["examples"]
                else ""
            )
            dist_descs = [f"'{d['hanzi']}' ({d['pinyin']}): {d['meaningVi']}" for d in dists]
            exp = (
                f"Chữ Hán tương ứng với \"{v['meaningVi']}\" là '{v['hanzi']}' ({v['pinyin']}, {v['pos']}).{ex_hint} "
                f"Phân biệt các phương án còn lại: {'; '.join(dist_descs)}."
            )
            try_add(
                {
                    "hskLevel": lvl,
                    "type": "vietnamese-to-chinese",
                    "skill": "vocabulary",
                    "difficulty": "EASY" if lvl == 1 else ("MEDIUM" if lvl <= 3 else "HARD"),
                    "title": f"HSK {lvl} · Phản xạ Việt - Hán"[:250],
                    "instruction": "Chọn chữ Hán tương ứng với nghĩa tiếng Việt và từ loại gợi ý.",
                    "promptHanzi": None,
                    "promptPinyin": None,
                    "promptVietnamese": p_vi,
                    "options": opts,
                    "correctOptionIndex": opts.index(v["hanzi"]),
                    "correctAnswer": v["hanzi"],
                    "explanation": exp,
                    "tags": f"hsk{lvl},vocabulary,active-recall",
                    "sourceId": v["sourceId"],
                    "sourceLicense": v["sourceLicense"],
                    "contentHash": c_hash,
                    "validationScore": 90.0,
                    "lessonId": v["lessonId"],
                    "grammarPointId": None,
                    "vocabularyId": v["id"],
                }
            )

        # Round 4: Natural Sentence Ordering (sentence-order) from curated example sentences
        for v in entries:
            if TARGET_COUNTS[lvl] - current_counts_by_hsk.get(lvl, 0) - len(per_level[lvl]) <= 0:
                break
            for ex in v["examples"]:
                tokens = segment_sentence_with_vocab(ex["zh"], vocab_set)
                if not tokens:
                    continue
                target_sentence = ex["zh"].strip()
                shuffled = list(tokens)
                # Ensure shuffled order differs deterministically from target sequence
                if len(set(shuffled)) >= 2:
                    RNG.shuffle(shuffled)
                    if "".join(shuffled) == "".join(tokens):
                        shuffled = tokens[1:] + tokens[:1]
                p_hz = " ".join(f"[{t}]" for t in shuffled)
                p_vi = f"Nghĩa câu: \"{ex['vi']}\""
                c_hash = compute_content_hash(lvl, "sentence-order", p_hz, p_vi, target_sentence)
                exp = (
                    f"Trật tự câu chuẩn HSK {lvl} là \"{target_sentence}\" ({ex['pinyin']}) — \"{ex['vi']}\". "
                    f"Từ trọng tâm '{v['hanzi']}' ({v['pinyin']}, {v['pos']}) giữ đúng vị trí ngữ pháp trong chuỗi [{' → '.join(tokens)}]."
                )
                if try_add(
                    {
                        "hskLevel": lvl,
                        "type": "sentence-order",
                        "skill": "sentence",
                        "difficulty": "MEDIUM" if lvl <= 2 else "HARD",
                        "title": f"HSK {lvl} · Sắp xếp câu ({v['hanzi']})"[:250],
                        "instruction": "Sắp xếp các mảnh từ thành câu tiếng Trung đúng ngữ pháp.",
                        "promptHanzi": p_hz,
                        "promptPinyin": None,
                        "promptVietnamese": p_vi,
                        "options": [],
                        "correctOptionIndex": None,
                        "correctAnswer": target_sentence,
                        "explanation": exp,
                        "tags": f"hsk{lvl},sentence,syntax-order",
                        "sourceId": v["sourceId"],
                        "sourceLicense": v["sourceLicense"],
                        "contentHash": c_hash,
                        "validationScore": 93.0,
                        "lessonId": v["lessonId"],
                        "grammarPointId": None,
                        "vocabularyId": v["id"],
                    }
                ):
                    break

    return per_level


def run_pipeline(base_dir: str, apply: bool) -> None:
    # Step 1: Compute deterministic updates & expansion plan from primary Dev DB
    dev_conn = connect_db("ZhongWenHub_Dev")
    sources = load_verified_sources(base_dir, dev_conn)

    updates, audit_stats = audit_and_build_updates(dev_conn, sources)

    cur = dev_conn.cursor()
    cur.execute(
        "SELECT ContentHash FROM exercises WHERE ContentHash IS NOT NULL AND ReviewStatus <> 'REJECTED'"
    )
    existing_hashes = {r[0] for r in cur.fetchall() if r[0]}
    for u in updates:
        if u["reviewStatus"] != "REJECTED" and u["contentHash"]:
            existing_hashes.add(u["contentHash"])

    # Compute baseline counts per HSK level excluding REJECTED / ARCHIVED / HSK5-6
    cur.execute(
        """
        SELECT HskLevel, COUNT(*)
        FROM exercises
        WHERE HskLevel BETWEEN 1 AND 4
          AND Status <> 'ARCHIVED'
          AND ReviewStatus IN ('APPROVED', 'VALIDATED', 'NEEDS_ACADEMIC_REVIEW')
        GROUP BY HskLevel
        """
    )
    baseline_by_hsk = defaultdict(int)
    for lvl, cnt in cur.fetchall():
        baseline_by_hsk[int(lvl)] += int(cnt)

    cur.execute(
        "SELECT Id, HskLevel FROM exercises WHERE ReviewStatus = 'PENDING_REVIEW' AND (SourceId LIKE 'InAnskr%' OR SourceId LIKE 'drkameleon%')"
    )
    id_to_hsk = {str(r[0]): int(r[1]) for r in cur.fetchall()}
    for u in updates:
        if u["reviewStatus"] != "REJECTED":
            lvl = id_to_hsk.get(u["id"], 1)
            baseline_by_hsk[lvl] += 1

    expansion_by_hsk = build_expansion_candidates(
        dev_conn, sources, existing_hashes, baseline_by_hsk
    )
    dev_conn.close()

    # Flatten candidates with deterministic fixed UUIDs so Dev and Test mirror identically
    all_new_items: list[dict[str, Any]] = []
    for lvl in (1, 2, 3, 4):
        for item in expansion_by_hsk.get(lvl, []):
            item["id"] = str(uuid.uuid5(uuid.NAMESPACE_URL, f"zwh-qb-p2-{item['contentHash']}"))
            all_new_items.append(item)

    print("=== PHASE 2 AUDIT SUMMARY (existing 570 PENDING_REVIEW) ===")
    for k, v in sorted(audit_stats.items()):
        print(f"  {k}: {v}")
    print("\n=== CONTROLLED EXPANSION PLAN (strictly DRAFT / PENDING_REVIEW) ===")
    for lvl in (1, 2, 3, 4):
        new_cnt = len(expansion_by_hsk.get(lvl, []))
        proj_total = baseline_by_hsk[lvl] + new_cnt
        print(
            f"  HSK {lvl}: active_baseline={baseline_by_hsk[lvl]} + new_generated={new_cnt} -> projected_total={proj_total} (target={TARGET_COUNTS[lvl]})"
        )
    print(f"  TOTAL NEW BATCHES ({BATCH_SIZE}/batch): {len(all_new_items)} items in {(len(all_new_items) + BATCH_SIZE - 1) // BATCH_SIZE} batches")

    if not apply:
        print("\nDry-run complete. Re-run with --apply to persist into ZhongWenHub_Dev and ZhongWenHub_Test.")
        return

    now_utc = datetime.now(timezone.utc)
    for db_name in ("ZhongWenHub_Dev", "ZhongWenHub_Test"):
        conn = connect_db(db_name)
        db_sources = load_verified_sources(base_dir, conn)
        db_updates, db_audit_stats = audit_and_build_updates(conn, db_sources)
        c = conn.cursor()

        c.execute("SELECT CAST(Id AS NVARCHAR(36)) FROM lessons")
        valid_lessons = {r[0].upper() for r in c.fetchall()}
        c.execute("SELECT CAST(Id AS NVARCHAR(36)) FROM grammar_points")
        valid_grammar = {r[0].upper() for r in c.fetchall()}
        c.execute("SELECT CAST(Id AS NVARCHAR(36)) FROM vocabularies")
        valid_vocab = {r[0].upper() for r in c.fetchall()}

        # Build fallback semantic lookup maps from Dev IDs to target DB IDs
        dev_to_target_vocab = {
            v["id"].upper(): db_sources["vocabByHanzi"][hz]["id"]
            for hz, v in sources["vocabByHanzi"].items()
            if hz in db_sources["vocabByHanzi"] and v.get("id") and db_sources["vocabByHanzi"][hz].get("id")
        }
        dev_to_target_grammar = {
            g["id"].upper(): tg["id"]
            for g in sources["grammarPoints"]
            for tg in db_sources["grammarPoints"]
            if g["hskLevel"] == tg["hskLevel"] and g["title"] == tg["title"]
        }
        dev_to_target_lesson = {
            d["lessonId"].upper(): td["lessonId"]
            for d in sources["dialogues"]
            for td in db_sources["dialogues"]
            if d["hskLevel"] == td["hskLevel"] and d["lessonNumber"] == td["lessonNumber"]
        }

        def resolve_fk(raw_id: str | None, valid_set: set[str], fallback_map: dict[str, str]) -> str | None:
            if not raw_id:
                return None
            up = raw_id.upper()
            if up in valid_set:
                return raw_id
            mapped = fallback_map.get(up)
            if mapped and mapped.upper() in valid_set:
                return mapped
            return None

        # 1. Apply Part 1 audit updates
        updated_rows = 0
        for u in db_updates:
            v_fk = resolve_fk(u["vocabularyId"], valid_vocab, dev_to_target_vocab)
            c.execute(
                """
                UPDATE exercises
                SET ReviewStatus = ?, ReviewNotes = ?, Type = ?, Skill = ?,
                    PromptHanzi = ?, PromptPinyin = ?, PromptVietnamese = ?,
                    OptionsJson = ?, CorrectOptionIndex = ?, CorrectAnswer = ?,
                    Explanation = ?, ContentHash = ?, QualityScore = ?,
                    VocabularyId = COALESCE(VocabularyId, TRY_CAST(? AS UNIQUEIDENTIFIER)),
                    Status = 'DRAFT', UpdatedAt = GETUTCDATE()
                WHERE Id = TRY_CAST(? AS UNIQUEIDENTIFIER)
                  AND ReviewStatus = 'PENDING_REVIEW'
                  AND Status <> 'PUBLISHED'
                """,
                (
                    u["reviewStatus"],
                    u["reviewNotes"][:1000],
                    u["type"],
                    u["skill"],
                    u["promptHanzi"],
                    u["promptPinyin"],
                    u["promptVietnamese"],
                    u["optionsJson"],
                    u["correctOptionIndex"],
                    u["correctAnswer"],
                    u["explanation"],
                    u["contentHash"],
                    u["validationScore"],
                    v_fk,
                    u["id"],
                ),
            )
            updated_rows += c.rowcount
        conn.commit()
        print(f"[{db_name}] Updated PENDING_REVIEW rows: {updated_rows} ({db_audit_stats})")

        # 2. Insert Part 2 new candidates in controlled batches of BATCH_SIZE (150)
        c.execute("SELECT ContentHash FROM exercises WHERE ContentHash IS NOT NULL")
        db_existing_hashes = {r[0] for r in c.fetchall() if r[0]}
        inserted_total = 0
        for start in range(0, len(all_new_items), BATCH_SIZE):
            chunk = all_new_items[start : start + BATCH_SIZE]
            batch_inserted = 0
            for item in chunk:
                if item["contentHash"] in db_existing_hashes:
                    continue
                l_fk = resolve_fk(item["lessonId"], valid_lessons, dev_to_target_lesson)
                g_fk = resolve_fk(item["grammarPointId"], valid_grammar, dev_to_target_grammar)
                v_fk = resolve_fk(item["vocabularyId"], valid_vocab, dev_to_target_vocab)
                c.execute(
                    """
                    INSERT INTO exercises (
                        Id, LessonId, GrammarPointId, VocabularyId, HskLevel, Skill, Type,
                        Difficulty, Title, Instruction, PromptHanzi, PromptPinyin, PromptVietnamese,
                        AudioUrl, OptionsJson, CorrectOptionIndex, CorrectAnswer, Explanation,
                        XpReward, Status, ReviewStatus, ReviewNotes, QualityScore,
                        ContentHash, SourceId, SourceLicense, Tags, CreatedAt, UpdatedAt
                    )
                    VALUES (
                        TRY_CAST(? AS UNIQUEIDENTIFIER),
                        TRY_CAST(? AS UNIQUEIDENTIFIER),
                        TRY_CAST(? AS UNIQUEIDENTIFIER),
                        TRY_CAST(? AS UNIQUEIDENTIFIER),
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, 10,
                        'DRAFT', 'PENDING_REVIEW', ?, ?, ?, ?, ?, ?, ?, ?
                    )
                    """,
                    (
                        item["id"],
                        l_fk,
                        g_fk,
                        v_fk,
                        item["hskLevel"],
                        item["skill"],
                        item["type"],
                        item["difficulty"],
                        item["title"],
                        item["instruction"],
                        item["promptHanzi"],
                        item["promptPinyin"],
                        item["promptVietnamese"],
                        json.dumps(item["options"], ensure_ascii=False)
                        if item["options"]
                        else None,
                        item["correctOptionIndex"],
                        item["correctAnswer"],
                        item["explanation"],
                        "Phase 2 expansion: Tự kiểm định thuật toán, giữ DRAFT/PENDING_REVIEW chờ kiểm duyệt.",
                        item["validationScore"],
                        item["contentHash"],
                        item["sourceId"],
                        item["sourceLicense"],
                        item["tags"],
                        now_utc,
                        now_utc,
                    ),
                )
                db_existing_hashes.add(item["contentHash"])
                batch_inserted += 1
            conn.commit()
            inserted_total += batch_inserted
            batch_num = (start // BATCH_SIZE) + 1
            print(f"[{db_name}] Batch {batch_num}: inserted {batch_inserted}/{len(chunk)} rows")

        print(f"[{db_name}] Total new inserted rows: {inserted_total}")
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    run_pipeline(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), apply=args.apply)
