"""
Stage 4 Full HSK 1-4 (HSK 2.0) Data Normalization Generator & Batch Patcher.

Reads from the verified read-only backup (never alters HSK 5-6, user progress,
correctIndex, or academicApproved), validates every updated lesson against the
HSK 2.0 schema & upgraded Pinyin validator, and emits 4 transactional SQL batches.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from pinyin_validator import validate_pinyin_string  # noqa: E402
from run_hsk20_bundle_validation import build_lesson_bundle  # noqa: E402
from validate_hsk20_data import MANIFEST_PATH, SCHEMA_PATH, validate_schema_bundle  # noqa: E402

BACKUP_PATH = REPO_ROOT / "data" / "hsk20" / "patches" / "hsk14_stage4_backup_before_normalization.json"
PATCH_DIR = REPO_ROOT / "data" / "hsk20" / "patches"
EXPORT_PATH = Path(r"C:\Users\nguyen\.gemini\antigravity\brain\cd186fce-5c0e-4fe7-82e2-2c0cf85214c4\scratch\hsk14_db_export.json")
DRYRUN_PATH = Path(r"C:\Users\nguyen\.gemini\antigravity\brain\cd186fce-5c0e-4fe7-82e2-2c0cf85214c4\scratch\hsk14_stage4_dryrun.json")

SENTENCE_RE = re.compile(r'[^。！？.!?]+[。！？.!?]+[”"\'’」』）】]*|[^。！？.!?]+$')

# Verified HSK 1 (Lessons 2-15, 22 questions) Pinyin & Vietnamese enrichment
# Key: (lessonNumber, qIdx)
HSK1_QUESTION_ENRICHMENT: dict[tuple[int, int], dict[str, Any]] = {
    (2, 0): {
        "questionPinyin": "Dàwèi de Zhōngguó péngyou jiào shénme míngzi?",
        "optionsPinyin": ["Lǐ Míng", "Wáng Míng", "Zhāng Sān", "Dàwèi"],
        "optionsVi": ["Lý Minh", "Vương Minh", "Trương Tam", "David (Đại Vệ)"],
    },
    (3, 0): {
        "questionPinyin": "Ānnà shì nǎ guó rén?",
        "optionsPinyin": ["Zhōngguórén", "Měiguórén", "Yīngguórén", "Yuènánrén"],
        "optionsVi": ["Người Trung Quốc", "Người Mỹ", "Người Anh", "Người Việt Nam"],
    },
    (3, 1): {
        "questionPinyin": "Ānnà hé Dàwèi zài nǎlǐ xuéxí Hànyǔ?",
        "optionsPinyin": ["Shànghǎi", "Měiguó", "Běijīng", "Yīyuàn"],
        "optionsVi": ["Thượng Hải", "Nước Mỹ", "Bắc Kinh", "Bệnh viện"],
    },
    (4, 0): {
        "questionPinyin": "Wáng lǎoshī jiāo tāmen shénme?",
        "optionsPinyin": ["Hànyǔ", "Yīngyǔ", "Fǎyǔ", "Huàhuà"],
        "optionsVi": ["Tiếng Hán", "Tiếng Anh", "Tiếng Pháp", "Vẽ tranh"],
    },
    (5, 0): {
        "questionPinyin": "Lǐ lǎoshī jiā yǒu jǐ kǒu rén?",
        "optionsPinyin": ["Liǎng kǒu rén", "Sān kǒu rén", "Sì kǒu rén", "Wǔ kǒu rén"],
        "optionsVi": ["Hai người", "Ba người", "Bốn người", "Năm người"],
    },
    (5, 1): {
        "questionPinyin": "Lǐ lǎoshī de nǚ'ér zuò shénme?",
        "optionsPinyin": ["Lǎoshī", "Yīshēng", "Dàxuéshēng", "Chūzūchē sījī"],
        "optionsVi": ["Giáo viên", "Bác sĩ", "Sinh viên đại học", "Tài xế taxi"],
    },
    (6, 0): {
        "questionPinyin": "Xiǎomíng juéde shénme hěn nán?",
        "optionsPinyin": ["Shuō Hànyǔ", "Zuò Zhōngguó cài", "Xiě Hànzì", "Shuō Yīngyǔ"],
        "optionsVi": ["Nói tiếng Hán", "Nấu món Trung Quốc", "Viết chữ Hán", "Nói tiếng Anh"],
    },
    (6, 1): {
        "questionPinyin": "Shéi huì zuò Zhōngguó cài?",
        "optionsPinyin": ["Xiǎomíng", "Xiǎomíng de māma", "Hànyǔ lǎoshī", "Wǒ"],
        "optionsVi": ["Tiểu Minh", "Mẹ của Tiểu Minh", "Giáo viên tiếng Hán", "Tôi"],
    },
    (7, 0): {
        "questionPinyin": "Tā jīntiān qù bu qù xuéxiào?",
        "optionsPinyin": ["Bú qù xuéxiào", "Qù xuéxiào", "Qù yīyuàn", "Qù shāngdiàn"],
        "optionsVi": ["Không đi học", "Đi học", "Đi bệnh viện", "Đi cửa hàng"],
    },
    (8, 0): {
        "questionPinyin": "Péngyou xiǎng hē shénme?",
        "optionsPinyin": ["Lěng kāfēi", "Rè chá", "Shuǐ", "Niúnǎi"],
        "optionsVi": ["Cà phê đá", "Trà nóng", "Nước lọc", "Sữa bò"],
    },
    (8, 1): {
        "questionPinyin": "Chī wán fàn hòu tāmen qù shāngdiàn mǎi le shénme?",
        "optionsPinyin": ["Zhōngguó cài", "Chá", "Bēizi", "Shū"],
        "optionsVi": ["Món ăn Trung Quốc", "Trà", "Cốc / ly", "Sách"],
    },
    (9, 0): {
        "questionPinyin": "Zhāng xiānsheng de érzi zài nǎr gōngzuò?",
        "optionsPinyin": ["Zài xuéxiào", "Zài shāngdiàn", "Zài yīyuàn", "Zài fàndiàn"],
        "optionsVi": ["Ở trường học", "Ở cửa hàng", "Ở bệnh viện", "Ở nhà hàng"],
    },
    (9, 1): {
        "questionPinyin": "Xiǎo māo zài nǎlǐ shuìjiào?",
        "optionsPinyin": ["Yǐzi xiàmiàn", "Zhuōzi shàng", "Yīyuàn lǐ", "Xuéxiào qiánmiàn"],
        "optionsVi": ["Dưới ghế", "Trên bàn", "Trong bệnh viện", "Trước trường học"],
    },
    (10, 0): {
        "questionPinyin": "Tā shénme shíhou qù Běijīng?",
        "optionsPinyin": ["Xīngqīyī", "Xīngqītiān", "Xīngqīwǔ", "Míngtiān shàngwǔ"],
        "optionsVi": ["Thứ Hai", "Chủ nhật", "Thứ Sáu", "Sáng ngày mai"],
    },
    (11, 0): {
        "questionPinyin": "“Wǒ” jǐ diǎn qù kàn diànyǐng?",
        "optionsPinyin": ["Zǎoshang qī diǎn bàn", "Shàngwǔ shí diǎn", "Xiàwǔ sì diǎn yí kè", "Wǎnshang liù diǎn èrshí"],
        "optionsVi": ["7 giờ 30 sáng", "10 giờ sáng", "4 giờ 15 chiều", "6 giờ 20 tối"],
    },
    (11, 1): {
        "questionPinyin": "Tā wǎnshang jǐ diǎn huí jiā chīfàn?",
        "optionsPinyin": ["Liù diǎn èrshí fēn", "Qī diǎn bàn", "Sì diǎn yí kè", "Shí diǎn"],
        "optionsVi": ["6 giờ 20 phút", "7 giờ rưỡi", "4 giờ 15 phút", "10 giờ"],
    },
    (12, 0): {
        "questionPinyin": "Jīntiān de tiānqì zěnmeyàng?",
        "optionsPinyin": ["Hěn lěng, xiàyǔ", "Tài rè le", "Tài hǎo le, bù lěng yě bú rè", "Xiàxuě le"],
        "optionsVi": ["Rất lạnh, trời mưa", "Nóng quá rồi", "Đẹp quá, không lạnh cũng không nóng", "Tuyết rơi rồi"],
    },
    (12, 1): {
        "questionPinyin": "Tāmen dǎsuàn shénme shíhou qù mǎi dōngxi?",
        "optionsPinyin": ["Zuótiān xiàwǔ", "Jīntiān shàngwǔ", "Míngtiān shàngwǔ", "Míngtiān xiàwǔ"],
        "optionsVi": ["Chiều hôm qua", "Sáng hôm nay", "Sáng ngày mai", "Chiều ngày mai"],
    },
    (13, 0): {
        "questionPinyin": "Xuéxiào qiánmiàn yǒu shénme?",
        "optionsPinyin": ["Yì jiā dà chāoshì", "Yì jiā xiǎo fànguǎn", "Yì jiā yīyuàn", "Yí gè huǒchēzhàn"],
        "optionsVi": ["Một siêu thị lớn", "Một quán ăn nhỏ", "Một bệnh viện", "Một ga tàu hỏa"],
    },
    (14, 0): {
        "questionPinyin": "Wáng xiǎojiě jīntiān qù le nǎlǐ?",
        "optionsPinyin": ["Yīyuàn", "Shāngdiàn", "Fàndiàn", "Xuéxiào"],
        "optionsVi": ["Bệnh viện", "Cửa hàng", "Nhà hàng", "Trường học"],
    },
    (14, 1): {
        "questionPinyin": "Wáng xiǎojiě mǎi le shénme?",
        "optionsPinyin": ["Shū hé bēizi", "Yīfu hé píngguǒ", "Chá hé mǐfàn", "Diànnǎo hé yǐzi"],
        "optionsVi": ["Sách và cốc", "Quần áo và táo", "Trà và cơm", "Máy tính và ghế"],
    },
    (15, 0): {
        "questionPinyin": "Tā shì zěnme lái Zhōngguó de?",
        "optionsPinyin": ["Zuò fēijī", "Zuò huǒchē", "Zuò chūzūchē", "Kāichē"],
        "optionsVi": ["Đi máy bay", "Đi tàu hỏa", "Đi taxi", "Lái ô tô"],
    },
}


def split_sentences(text: str) -> list[str]:
    return [m.group(0).strip() for m in SENTENCE_RE.finditer((text or "").strip()) if m.group(0).strip()]


def clean_pinyin_for_check(text: str) -> str:
    cleaned = re.sub(r'[,.!?;:"\'“”‘’()（）—\-…，。！？：；、《》「」『』]+', " ", text)
    return re.sub(r"\s+", " ", cleaned).strip()


def main() -> int:
    backup = json.loads(BACKUP_PATH.read_text(encoding="utf-8"))
    db_export = json.loads(EXPORT_PATH.read_text(encoding="utf-8"))
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8")) if MANIFEST_PATH.exists() else {}
    ai_items = {
        str(item["lessonId"]).upper(): item
        for item in manifest.get("aiGeneratedNeedingAcademicReview", {}).get("items", [])
    }

    courses_by_id = {str(c["Id"]).upper(): c for c in db_export["courses"]}
    lessons_by_id = {str(l["Id"]).upper(): l for l in db_export["lessons"]}
    vocab_by_id = {str(v["Id"]).upper(): v for v in db_export["vocabularies"]}

    vocabs_by_lesson: dict[str, list[dict[str, Any]]] = {}
    for v in db_export["vocabularies"]:
        if v.get("LessonId"):
            vocabs_by_lesson.setdefault(str(v["LessonId"]).upper(), []).append(v)
    linked_by_lesson: dict[str, set[str]] = {}
    for lv in db_export["lessonVocabularies"]:
        linked_by_lesson.setdefault(str(lv["LessonId"]).upper(), set()).add(str(lv["VocabularyId"]).upper())

    grammars_by_lesson: dict[str, list[dict[str, Any]]] = {}
    for g in db_export["grammarPoints"]:
        if g.get("LessonId"):
            grammars_by_lesson.setdefault(str(g["LessonId"]).upper(), []).append(g)

    exercises_by_lesson: dict[str, list[dict[str, Any]]] = {}
    for ex in db_export["exercises"]:
        if ex.get("LessonId"):
            exercises_by_lesson.setdefault(str(ex["LessonId"]).upper(), []).append(ex)

    batch_sql: dict[int, list[str]] = {lvl: [
        f"-- Stage 4 Normalization Batch for HSK {lvl}",
        "SET XACT_ABORT ON;",
        "BEGIN TRANSACTION;",
        "",
    ] for lvl in (1, 2, 3, 4)}

    dryrun_records: list[dict[str, Any]] = []
    sentences_added_total = 0
    questions_py_added = 0
    options_enriched_questions = 0

    for rec in backup["records"]:
        lid = rec["id"]
        lvl = rec["hskLevel"]
        lnum = rec["lessonNumber"]
        orig_raw = rec["dialogueJson"]
        dlg = json.loads(orig_raw)
        rp = dlg.get("readingPassage") or {}

        changed = False
        added_sentences_here = 0
        added_qpy_here = 0
        added_opt_here = 0

        # 1. Normalize readingPassage.sentences[] for all 69 remaining lessons
        if not (isinstance(rp.get("sentences"), list) and len(rp["sentences"]) > 0):
            zh_s = split_sentences(rp.get("passageZh", ""))
            py_s = split_sentences(rp.get("passagePinyin", ""))
            vi_s = split_sentences(rp.get("passageVi", ""))
            if not (len(zh_s) == len(py_s) == len(vi_s) and len(zh_s) > 0):
                raise ValueError(f"Sentence mismatch on HSK {lvl} L{lnum}")
            rp["sentences"] = [
                {"zh": z, "pinyin": p, "vi": v}
                for z, p, v in zip(zh_s, py_s, vi_s)
            ]
            added_sentences_here = len(rp["sentences"])
            sentences_added_total += added_sentences_here
            changed = True

        # 2. Enrich HSK 1 (Lessons 2-15) comprehensionQuestions
        if lvl == 1 and lnum >= 2:
            qs = rp.get("comprehensionQuestions") or []
            for qi, q in enumerate(qs):
                enr = HSK1_QUESTION_ENRICHMENT.get((lnum, qi))
                if not enr:
                    raise ValueError(f"Missing HSK1 enrichment for L{lnum} Q{qi}")

                # Validate new Pinyin strictly before writing
                ok_qp, msg_qp = validate_pinyin_string(clean_pinyin_for_check(enr["questionPinyin"]))
                if not ok_qp:
                    raise ValueError(f"Invalid questionPinyin L{lnum} Q{qi}: {msg_qp}")
                for opy in enr["optionsPinyin"]:
                    ok_op, msg_op = validate_pinyin_string(clean_pinyin_for_check(opy))
                    if not ok_op:
                        raise ValueError(f"Invalid optionPinyin L{lnum} Q{qi} ({opy}): {msg_op}")

                assert len(enr["optionsPinyin"]) == len(q["options"])
                assert len(enr["optionsVi"]) == len(q["options"])

                if not (q.get("questionPinyin") or "").strip():
                    q["questionPinyin"] = enr["questionPinyin"]
                    added_qpy_here += 1
                    questions_py_added += 1
                    changed = True
                if not q.get("optionsPinyin"):
                    q["optionsPinyin"] = enr["optionsPinyin"]
                    changed = True
                if not q.get("optionsVi"):
                    q["optionsVi"] = enr["optionsVi"]
                    added_opt_here += 1
                    options_enriched_questions += 1
                    changed = True

        new_raw = json.dumps(dlg, ensure_ascii=False, separators=(",", ": ")) if changed else orig_raw
        sha_after = hashlib.sha256(new_raw.encode("utf-8")).hexdigest()

        # Validate updated lesson against JSON Schema bundle validator
        lesson_row = dict(lessons_by_id[lid])
        lesson_row["DialogueJson"] = new_raw
        course_row = courses_by_id[str(lesson_row["CourseId"]).upper()]
        all_vids = {str(v["Id"]).upper() for v in vocabs_by_lesson.get(lid, [])} | linked_by_lesson.get(lid, set())
        lesson_vocabs = [vocab_by_id[vid] for vid in sorted(all_vids) if vid in vocab_by_id]
        bundle = build_lesson_bundle(
            course=course_row,
            lesson=lesson_row,
            vocabs=lesson_vocabs,
            grammars=grammars_by_lesson.get(lid, []),
            exercises=exercises_by_lesson.get(lid, []),
            ai_review_item=ai_items.get(lid),
        )
        b_errors, _ = validate_schema_bundle(bundle, schema)
        if b_errors:
            raise ValueError(f"Schema validation failed on HSK {lvl} L{lnum}: {b_errors}")

        if changed:
            escaped = new_raw.replace("'", "''")
            batch_sql[lvl].append(f"-- HSK {lvl} Lesson {lnum} ({lid})")
            batch_sql[lvl].append(f"UPDATE dbo.lessons SET DialogueJson = N'{escaped}' WHERE Id = '{lid}';")
            batch_sql[lvl].append(f"IF @@ROWCOUNT <> 1 THROW 50001, 'Batch update failed for {lid}', 1;")
            batch_sql[lvl].append(f"IF ISJSON((SELECT DialogueJson FROM dbo.lessons WHERE Id = '{lid}')) <> 1 THROW 50002, 'Invalid JSON for {lid}', 1;")

        dryrun_records.append({
            "hskLevel": lvl,
            "lessonNumber": lnum,
            "lessonId": lid,
            "changed": changed,
            "addedSentences": added_sentences_here,
            "addedQuestionPinyin": added_qpy_here,
            "addedOptionTranslations": added_opt_here,
            "sha256Before": rec["sha256"],
            "sha256After": sha_after,
        })

    for lvl in (1, 2, 3, 4):
        batch_sql[lvl].extend(["", "COMMIT TRANSACTION;", ""])
        sql_path = PATCH_DIR / f"hsk14_stage4_batch{lvl}_hsk{lvl}.sql"
        sql_path.write_text("\n".join(batch_sql[lvl]), encoding="utf-8")

    dryrun_summary = {
        "totalLessons": len(dryrun_records),
        "lessonsToUpdate": sum(1 for r in dryrun_records if r["changed"]),
        "lessonsAlreadyNormalized": sum(1 for r in dryrun_records if not r["changed"]),
        "sentencesAdded": sentences_added_total,
        "questionPinyinAdded": questions_py_added,
        "questionOptionsEnriched": options_enriched_questions,
        "records": dryrun_records,
    }
    DRYRUN_PATH.write_text(json.dumps(dryrun_summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: v for k, v in dryrun_summary.items() if k != "records"}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

