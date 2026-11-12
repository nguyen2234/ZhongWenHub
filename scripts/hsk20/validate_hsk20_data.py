"""
HSK 2.0 (HSK 1-4) Data Standard Validator and Read-Only Database Inventory Analyzer.

Validates:
1. JSON Schema structural conformance against data/hsk20/schemas/hsk20-lesson-bundle.schema.json
2. Mandarin Unicode & Pinyin tone/phonotactics (reusing scripts/hsk20/pinyin_validator.py)
3. Referential integrity across Course -> Unit -> Lesson -> Vocabulary/Grammar/Exercise
4. Duplicate detection (IDs, lesson numbers, vocabulary keys)
5. Answer consistency (correctIndex bounds, aligned optionsPinyin/optionsVi lengths)
"""

from __future__ import annotations

import argparse
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

SCHEMA_PATH = REPO_ROOT / "data" / "hsk20" / "schemas" / "hsk20-lesson-bundle.schema.json"
MANIFEST_PATH = REPO_ROOT / "data" / "hsk20" / "staging" / "HSK14_HUMAN_REVIEW_MANIFEST.json"
HANZI_RE = re.compile(r"[\u4e00-\u9fff]")

QUALITY_COMPLETE_VERIFIED = "COMPLETE_VERIFIED"
QUALITY_VALID_UNREVIEWED = "STRUCTURALLY_VALID_UNREVIEWED"
QUALITY_MISSING_CONTENT = "MISSING_CONTENT"
QUALITY_INVALID_DATA = "INVALID_DATA"
QUALITY_SOURCE_UNVERIFIED = "SOURCE_UNVERIFIED"


def contains_hanzi(text: str | None) -> bool:
    return bool(text and HANZI_RE.search(text))


def check_pinyin(text: str | None, label: str, errors: list[str], warnings: list[str]) -> None:
    if not text or not text.strip():
        errors.append(f"Missing Pinyin for {label}")
        return
    cleaned = re.sub(r'[,.!?;:"\'“”‘’()（）—\-…]+', " ", text)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if not cleaned:
        errors.append(f"Missing Pinyin tokens for {label}")
        return
    is_valid, msg = validate_pinyin_string(cleaned)
    if not is_valid:
        warnings.append(f"Pinyin issue in {label}: {msg}")


def validate_schema_bundle(bundle: dict[str, Any], schema: dict[str, Any] | None = None) -> tuple[list[str], list[str]]:
    """
    Validates a canonical HSK 2.0 lesson bundle against the standard schema and semantic rules.
    Returns (errors, warnings).
    """
    errors: list[str] = []
    warnings: list[str] = []

    if schema is None and SCHEMA_PATH.exists():
        schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))

    required_top = (schema or {}).get("required", [
        "schemaVersion", "curriculumStandard", "course", "lesson",
        "vocabularies", "grammars", "dialogue", "exercises", "sourceMetadata",
    ])
    for key in required_top:
        if key not in bundle or bundle[key] is None:
            errors.append(f"Missing required top-level field: {key}")

    if bundle.get("curriculumStandard") != "HSK_2_0":
        errors.append(f"Invalid curriculumStandard: {bundle.get('curriculumStandard')!r} (expected 'HSK_2_0')")

    source_meta = bundle.get("sourceMetadata") or {}
    for req_meta in ("sourceId", "sourceVersion", "curriculumStandard", "reviewStatus", "academicApproved"):
        if req_meta not in source_meta or source_meta[req_meta] is None or source_meta[req_meta] == "":
            errors.append(f"Missing sourceMetadata.{req_meta}")
    if source_meta.get("curriculumStandard") != "HSK_2_0":
        errors.append("sourceMetadata.curriculumStandard must be 'HSK_2_0'")
    if not isinstance(source_meta.get("academicApproved"), bool):
        errors.append("sourceMetadata.academicApproved must be boolean")

    course = bundle.get("course") or {}
    lesson = bundle.get("lesson") or {}
    course_id = str(course.get("id") or "")
    lesson_id = str(lesson.get("id") or "")

    if not course_id or str(lesson.get("courseId") or "") != course_id:
        errors.append("Referential integrity error: lesson.courseId does not match course.id")
    if not contains_hanzi(lesson.get("titleZh")):
        errors.append("lesson.titleZh must contain Unicode Hanzi")

    seen_ids: set[str] = set()
    for entity_name, eid in (("course", course_id), ("lesson", lesson_id)):
        if not eid:
            errors.append(f"Missing {entity_name}.id")
        elif eid in seen_ids:
            errors.append(f"Duplicate ID across bundle: {eid}")
        else:
            seen_ids.add(eid)

    # Vocabularies
    vocabs = bundle.get("vocabularies") or []
    seen_hanzi: set[str] = set()
    for idx, v in enumerate(vocabs):
        vid = str(v.get("id") or "")
        if not vid:
            errors.append(f"vocabularies[{idx}].id missing")
        elif vid in seen_ids:
            errors.append(f"Duplicate vocabulary id: {vid}")
        else:
            seen_ids.add(vid)
        hz = (v.get("hanzi") or "").strip()
        if not contains_hanzi(hz):
            errors.append(f"vocabularies[{idx}].hanzi invalid: {hz!r}")
        elif hz in seen_hanzi:
            warnings.append(f"Duplicate vocabulary hanzi in lesson: {hz}")
        seen_hanzi.add(hz)
        if not (v.get("meaningVi") or "").strip():
            errors.append(f"vocabularies[{idx}].meaningVi missing")
        check_pinyin(v.get("pinyin"), f"vocabularies[{idx}]({hz})", errors, warnings)

    # Grammars
    for idx, g in enumerate(bundle.get("grammars") or []):
        gid = str(g.get("id") or "")
        if not gid:
            errors.append(f"grammars[{idx}].id missing")
        elif gid in seen_ids:
            errors.append(f"Duplicate grammar id: {gid}")
        else:
            seen_ids.add(gid)
        if str(g.get("lessonId") or "") != lesson_id:
            errors.append(f"grammars[{idx}].lessonId mismatch")
        if not (g.get("title") or "").strip() or not (g.get("explanation") or "").strip():
            errors.append(f"grammars[{idx}] missing title or explanation")

    # Dialogue
    dialogue = bundle.get("dialogue")
    if isinstance(dialogue, dict):
        if str(dialogue.get("lessonId") or "").upper() != lesson_id.upper():
            errors.append("dialogue.lessonId does not match lesson.id")
        lines = dialogue.get("lines") or []
        if not lines:
            errors.append("dialogue.lines is empty")
        for idx, line in enumerate(lines):
            if not contains_hanzi(line.get("zh")):
                errors.append(f"dialogue.lines[{idx}].zh missing Hanzi")
            if not (line.get("meaningVi") or "").strip():
                errors.append(f"dialogue.lines[{idx}].meaningVi missing")
            check_pinyin(line.get("pinyin"), f"dialogue.lines[{idx}]", errors, warnings)

    # ReadingPassage
    rp = bundle.get("readingPassage")
    if rp is None:
        warnings.append("readingPassage is missing")
    elif isinstance(rp, dict):
        for req_rp in ("passageZh", "passagePinyin", "passageVi"):
            if not (rp.get(req_rp) or "").strip():
                errors.append(f"readingPassage.{req_rp} is empty")
        sentences = rp.get("sentences")
        if sentences is None:
            warnings.append("readingPassage.sentences[] is missing (stage 3 structured alignment pending)")
        else:
            if not isinstance(sentences, list) or len(sentences) == 0:
                errors.append("readingPassage.sentences must be a non-empty array")
            else:
                for s_idx, sent in enumerate(sentences):
                    if not contains_hanzi(sent.get("zh")) or not (sent.get("vi") or "").strip():
                        errors.append(f"readingPassage.sentences[{s_idx}] missing zh or vi")
                    check_pinyin(sent.get("pinyin"), f"readingPassage.sentences[{s_idx}]", errors, warnings)

        questions = rp.get("comprehensionQuestions") or []
        if not questions:
            errors.append("readingPassage.comprehensionQuestions is empty")
        for q_idx, q in enumerate(questions):
            opts = q.get("options") or []
            c_idx = q.get("correctIndex")
            if len(opts) < 2:
                errors.append(f"comprehensionQuestions[{q_idx}].options has fewer than 2 choices")
            if not isinstance(c_idx, int) or c_idx < 0 or c_idx >= len(opts):
                errors.append(f"comprehensionQuestions[{q_idx}].correctIndex={c_idx!r} out of range [0..{len(opts)-1}]")
            if not (q.get("questionPinyin") or "").strip():
                warnings.append(f"comprehensionQuestions[{q_idx}].questionPinyin missing")
            if q.get("optionsPinyin") is None:
                warnings.append(f"comprehensionQuestions[{q_idx}].optionsPinyin missing")
            elif len(q["optionsPinyin"]) != len(opts):
                errors.append(f"comprehensionQuestions[{q_idx}].optionsPinyin length mismatch")
            if q.get("optionsVi") is None:
                warnings.append(f"comprehensionQuestions[{q_idx}].optionsVi missing")
            elif len(q["optionsVi"]) != len(opts):
                errors.append(f"comprehensionQuestions[{q_idx}].optionsVi length mismatch")

    # Listening
    listening = bundle.get("listening") or []
    if not listening:
        warnings.append("listening[] is empty")
    for l_idx, item in enumerate(listening):
        if str(item.get("lessonId") or "").upper() != lesson_id.upper():
            errors.append(f"listening[{l_idx}].lessonId mismatch")
        opts = item.get("options") or []
        correct_count = sum(1 for o in opts if o.get("isCorrect") is True)
        if len(opts) < 2 or correct_count != 1:
            errors.append(f"listening[{l_idx}].options must have >=2 options and exactly 1 isCorrect=true")
        check_pinyin(item.get("transcriptPinyin"), f"listening[{l_idx}].transcriptPinyin", errors, warnings)

    # Exercises
    for e_idx, ex in enumerate(bundle.get("exercises") or []):
        if str(ex.get("lessonId") or "").upper() != lesson_id.upper():
            errors.append(f"exercises[{e_idx}].lessonId mismatch")
        opts = ex.get("options")
        c_idx = ex.get("correctOptionIndex")
        if isinstance(opts, list) and opts:
            if c_idx is not None and (not isinstance(c_idx, int) or c_idx < 0 or c_idx >= len(opts)):
                errors.append(f"exercises[{e_idx}].correctOptionIndex={c_idx!r} out of bounds")

    return errors, warnings


def analyze_db_export(export_path: Path, manifest_path: Path = MANIFEST_PATH) -> dict[str, Any]:
    """Analyzes read-only SQL Server export JSON for all HSK 1-4 courses and lessons."""
    data = json.loads(export_path.read_text(encoding="utf-8"))
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    ai_review_items = {
        str(item["lessonId"]).upper(): item
        for item in manifest.get("aiGeneratedNeedingAcademicReview", {}).get("items", [])
    }

    courses_by_id = {str(c["Id"]).upper(): c for c in data.get("courses", [])}
    hsk14_courses = [c for c in data.get("courses", []) if 1 <= int(c["HskLevel"]) <= 4]

    # Index child tables by LessonId
    vocabs_by_lesson: dict[str, list[dict[str, Any]]] = {}
    vocab_by_id = {str(v["Id"]).upper(): v for v in data.get("vocabularies", [])}
    for v in data.get("vocabularies", []):
        if v.get("LessonId"):
            vocabs_by_lesson.setdefault(str(v["LessonId"]).upper(), []).append(v)

    # Include lesson_vocabularies many-to-many links
    linked_vocab_ids_by_lesson: dict[str, set[str]] = {}
    for lv in data.get("lessonVocabularies", []):
        lid = str(lv["LessonId"]).upper()
        vid = str(lv["VocabularyId"]).upper()
        linked_vocab_ids_by_lesson.setdefault(lid, set()).add(vid)

    grammars_by_lesson: dict[str, list[dict[str, Any]]] = {}
    for g in data.get("grammarPoints", []):
        if g.get("LessonId"):
            grammars_by_lesson.setdefault(str(g["LessonId"]).upper(), []).append(g)

    exercises_by_lesson: dict[str, list[dict[str, Any]]] = {}
    for ex in data.get("exercises", []):
        if ex.get("LessonId"):
            exercises_by_lesson.setdefault(str(ex["LessonId"]).upper(), []).append(ex)

    # Duplicate checks across HSK 1-4
    seen_lesson_nums: dict[tuple[int, int], str] = {}
    duplicate_lessons: list[str] = []
    vocab_hanzi_by_level: dict[tuple[int, str], list[str]] = {}

    for v in data.get("vocabularies", []):
        lvl = int(v.get("HskLevel") or 0)
        if 1 <= lvl <= 4:
            vocab_hanzi_by_level.setdefault((lvl, (v.get("Hanzi") or "").strip()), []).append(str(v["Id"]).upper())

    duplicate_vocab_keys = [
        {"hskLevel": lvl, "hanzi": hz, "count": len(ids)}
        for (lvl, hz), ids in vocab_hanzi_by_level.items()
        if len(ids) > 1
    ]

    lesson_reports: list[dict[str, Any]] = []
    level_stats: dict[int, dict[str, Any]] = {
        lvl: {
            "hskLevel": lvl,
            "lessonsTotal": 0,
            "vocabCount": 0,
            "grammarCount": 0,
            "exerciseCount": 0,
            "hasDialogue": 0,
            "hasReadingPassage": 0,
            "hasReadingSentences": 0,
            "hasQuestionPinyin": 0,
            "hasOptionsPinyin": 0,
            "hasOptionsVi": 0,
            "hasListening": 0,
            "invalidCount": 0,
            "aiUnreviewedCount": 0,
            "statusBreakdown": {},
        }
        for lvl in (1, 2, 3, 4)
    }

    for l in data.get("lessons", []):
        cid = str(l["CourseId"]).upper()
        course = courses_by_id.get(cid)
        if not course or not (1 <= int(course["HskLevel"]) <= 4):
            continue

        lvl = int(course["HskLevel"])
        lid = str(l["Id"]).upper()
        lnum = int(l["LessonNumber"])
        stats = level_stats[lvl]
        stats["lessonsTotal"] += 1

        if (lvl, lnum) in seen_lesson_nums:
            duplicate_lessons.append(f"HSK {lvl} Lesson {lnum}")
        seen_lesson_nums[(lvl, lnum)] = lid

        # Resolve vocabs via direct LessonId or lesson_vocabularies
        direct_vocabs = vocabs_by_lesson.get(lid, [])
        link_ids = linked_vocab_ids_by_lesson.get(lid, set())
        all_vocab_ids = {str(v["Id"]).upper() for v in direct_vocabs} | link_ids
        lesson_vocabs = [vocab_by_id[vid] for vid in all_vocab_ids if vid in vocab_by_id]

        lesson_grammars = grammars_by_lesson.get(lid, [])
        lesson_exercises = exercises_by_lesson.get(lid, [])

        stats["vocabCount"] += len(lesson_vocabs)
        stats["grammarCount"] += len(lesson_grammars)
        stats["exerciseCount"] += len(lesson_exercises)

        errors: list[str] = []
        missing: list[str] = []
        pinyin_warnings: list[str] = []

        # Parse DialogueJson
        dlg_obj: dict[str, Any] | None = None
        rp_obj: dict[str, Any] | None = None
        if not l.get("DialogueJson"):
            missing.append("DialogueJson")
        else:
            try:
                dlg_obj = json.loads(l["DialogueJson"])
                if not isinstance(dlg_obj, dict) or not dlg_obj.get("lines"):
                    missing.append("dialogue.lines")
                else:
                    stats["hasDialogue"] += 1
                    if str(dlg_obj.get("lessonId") or "").upper() != lid:
                        errors.append("dialogue.lessonId mismatch")
                rp_obj = dlg_obj.get("readingPassage") if isinstance(dlg_obj, dict) else None
                if not isinstance(rp_obj, dict):
                    missing.append("readingPassage")
                else:
                    stats["hasReadingPassage"] += 1
                    if isinstance(rp_obj.get("sentences"), list) and len(rp_obj["sentences"]) > 0:
                        stats["hasReadingSentences"] += 1
                    else:
                        missing.append("readingPassage.sentences[]")

                    qs = rp_obj.get("comprehensionQuestions") or []
                    if not qs:
                        missing.append("readingPassage.comprehensionQuestions")
                    else:
                        all_qp = all(bool((q.get("questionPinyin") or "").strip()) for q in qs)
                        all_op = all(
                            isinstance(q.get("optionsPinyin"), list)
                            and len(q["optionsPinyin"]) == len(q.get("options") or [])
                            for q in qs
                        )
                        all_ov = all(
                            isinstance(q.get("optionsVi"), list)
                            and len(q["optionsVi"]) == len(q.get("options") or [])
                            for q in qs
                        )
                        if all_qp:
                            stats["hasQuestionPinyin"] += 1
                        else:
                            missing.append("comprehensionQuestions.questionPinyin")
                        if all_op:
                            stats["hasOptionsPinyin"] += 1
                        else:
                            missing.append("comprehensionQuestions.optionsPinyin[]")
                        if all_ov:
                            stats["hasOptionsVi"] += 1
                        else:
                            missing.append("comprehensionQuestions.optionsVi[]")

                        for qi, q in enumerate(qs):
                            opts = q.get("options") or []
                            ci = q.get("correctIndex")
                            if not isinstance(ci, int) or ci < 0 or ci >= len(opts):
                                errors.append(f"readingPassage.q[{qi}].correctIndex invalid")
            except Exception as exc:
                errors.append(f"DialogueJson invalid JSON: {exc}")

        # Parse ListeningJson
        list_items: list[dict[str, Any]] = []
        if not l.get("ListeningJson"):
            missing.append("ListeningJson")
        else:
            try:
                parsed_list = json.loads(l["ListeningJson"])
                if not isinstance(parsed_list, list) or len(parsed_list) == 0:
                    missing.append("listening[]")
                else:
                    list_items = parsed_list
                    stats["hasListening"] += 1
                    for li_idx, li in enumerate(list_items):
                        opts = li.get("options") or []
                        if sum(1 for o in opts if o.get("isCorrect") is True) != 1:
                            errors.append(f"listening[{li_idx}] invalid correct option count")
            except Exception as exc:
                errors.append(f"ListeningJson invalid JSON: {exc}")

        # Exercises check
        if not lesson_exercises:
            missing.append("exercises[]")
        for ex in lesson_exercises:
            if ex.get("OptionsJson"):
                try:
                    ex_opts = json.loads(ex["OptionsJson"])
                    ci = ex.get("CorrectOptionIndex")
                    if isinstance(ex_opts, list) and ci is not None and (ci < 0 or ci >= len(ex_opts)):
                        errors.append(f"exercise {ex['Id']} CorrectOptionIndex out of range")
                except Exception:
                    errors.append(f"exercise {ex['Id']} invalid OptionsJson")

        # Grammar ExamplesJson check
        if not lesson_grammars:
            missing.append("grammarPoints[]")
        for gp in lesson_grammars:
            if gp.get("ExamplesJson"):
                try:
                    json.loads(gp["ExamplesJson"])
                except Exception:
                    errors.append(f"grammar {gp['Id']} invalid ExamplesJson")

        # Source & Review status check
        ai_item = ai_review_items.get(lid)
        is_ai_unreviewed = bool(ai_item and ai_item.get("academicApproved") is False)
        if not is_ai_unreviewed and isinstance(dlg_obj, dict):
            if dlg_obj.get("editorialReviewStatus") in ("AI_GENERATED_NEEDS_ACADEMIC_REVIEW", "AI_ASSISTED_UNVERIFIED"):
                is_ai_unreviewed = True

        if is_ai_unreviewed:
            stats["aiUnreviewedCount"] += 1

        if errors:
            quality = QUALITY_INVALID_DATA
            stats["invalidCount"] += 1
        elif missing:
            quality = QUALITY_MISSING_CONTENT
        elif is_ai_unreviewed:
            quality = QUALITY_VALID_UNREVIEWED
        else:
            # Reading passages in HSK 1-4 were not sourced from copyrighted textbook prose
            quality = QUALITY_SOURCE_UNVERIFIED if rp_obj is not None else QUALITY_COMPLETE_VERIFIED

        stats["statusBreakdown"][quality] = stats["statusBreakdown"].get(quality, 0) + 1

        lesson_reports.append({
            "hskLevel": lvl,
            "lessonNumber": lnum,
            "lessonId": lid,
            "titleZh": l["TitleZh"],
            "titleVi": l["TitleVi"],
            "status": l["Status"],
            "vocabCount": len(lesson_vocabs),
            "grammarCount": len(lesson_grammars),
            "exerciseCount": len(lesson_exercises),
            "hasDialogue": isinstance(dlg_obj, dict) and bool(dlg_obj.get("lines")),
            "hasReadingPassage": isinstance(rp_obj, dict),
            "hasReadingSentences": isinstance(rp_obj, dict) and isinstance(rp_obj.get("sentences"), list) and len(rp_obj["sentences"]) > 0,
            "hasListening": len(list_items) > 0,
            "isAiUnreviewed": is_ai_unreviewed,
            "qualityStatus": quality,
            "errors": errors,
            "missing": missing,
            "pinyinWarningsCount": len(pinyin_warnings),
        })

    return {
        "totalCoursesAll": len(data.get("courses", [])),
        "totalCoursesHsk14": len(hsk14_courses),
        "totalLessonsAll": len(data.get("lessons", [])),
        "totalLessonsHsk14": len(lesson_reports),
        "totalVocabulariesAll": len(data.get("vocabularies", [])),
        "totalGrammarPointsAll": len(data.get("grammarPoints", [])),
        "totalExercisesAll": len(data.get("exercises", [])),
        "totalExamsAll": len(data.get("exams", [])),
        "duplicateLessons": duplicate_lessons,
        "duplicateVocabKeysCount": len(duplicate_vocab_keys),
        "duplicateVocabKeysSample": duplicate_vocab_keys[:15],
        "levelStats": level_stats,
        "lessons": sorted(lesson_reports, key=lambda x: (x["hskLevel"], x["lessonNumber"])),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate HSK 2.0 bundles or analyze ZhongWenHub_Dev export.")
    parser.add_argument("--db-export", type=Path, help="Path to read-only DB export JSON")
    parser.add_argument("--bundle", type=Path, help="Path to a single canonical lesson bundle JSON")
    parser.add_argument("--out", type=Path, help="Optional path to write JSON report")
    args = parser.parse_args()

    if args.bundle:
        bundle = json.loads(args.bundle.read_text(encoding="utf-8"))
        errors, warnings = validate_schema_bundle(bundle)
        result = {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if not errors else 1

    if args.db_export:
        report = analyze_db_export(args.db_export)
        if args.out:
            args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps({k: v for k, v in report.items() if k != "lessons"}, ensure_ascii=False, indent=2))
        return 0

    parser.print_help()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
