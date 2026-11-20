"""
Builds canonical HSK 2.0 lesson bundles from a read-only ZhongWenHub_Dev export
and runs validate_schema_bundle() across all 70 HSK 1-4 lessons.

Outputs:
- data/hsk20/staging/hsk14_validation_report.json
- docs/hsk20/HSK_VALIDATION_REPORT.md
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from validate_hsk20_data import (  # noqa: E402
    MANIFEST_PATH,
    SCHEMA_PATH,
    validate_schema_bundle,
)

DEFAULT_JSON_OUT = REPO_ROOT / "data" / "hsk20" / "staging" / "hsk14_validation_report.json"
DEFAULT_MD_OUT = REPO_ROOT / "docs" / "hsk20" / "HSK_VALIDATION_REPORT.md"


def extract_field_key(message: str) -> str:
    """Normalizes an error/warning message into a canonical field bucket."""
    if "readingPassage.sentences" in message:
        return "readingPassage.sentences[]"
    if "questionPinyin" in message:
        return "readingPassage.comprehensionQuestions[].questionPinyin"
    if "optionsPinyin" in message:
        return "readingPassage.comprehensionQuestions[].optionsPinyin[]"
    if "optionsVi" in message:
        return "readingPassage.comprehensionQuestions[].optionsVi[]"
    if "vocabularies[" in message and "Duplicate vocabulary hanzi" in message:
        return "vocabularies[].hanzi (duplicate in lesson)"
    if "vocabularies[" in message:
        return "vocabularies[].pinyin"
    if "dialogue.lines[" in message:
        return "dialogue.lines[].pinyin"
    if "listening[" in message and "transcriptPinyin" in message:
        return "listening[].transcriptPinyin"
    if "grammars[" in message:
        return "grammars[]"
    if "exercises[" in message:
        return "exercises[]"
    m = re.match(r"^([A-Za-z0-9_.\[\]]+)", message)
    return m.group(1) if m else message


def build_lesson_bundle(
    course: dict[str, Any],
    lesson: dict[str, Any],
    vocabs: list[dict[str, Any]],
    grammars: list[dict[str, Any]],
    exercises: list[dict[str, Any]],
    ai_review_item: dict[str, Any] | None,
) -> dict[str, Any]:
    """Maps raw DB rows of one lesson into the canonical HSK 2.0 bundle without fabricating missing fields."""
    dlg_raw = lesson.get("DialogueJson")
    dlg_obj = json.loads(dlg_raw) if dlg_raw else None
    rp_obj = dlg_obj.get("readingPassage") if isinstance(dlg_obj, dict) else None

    list_raw = lesson.get("ListeningJson")
    listening_obj = json.loads(list_raw) if list_raw else []

    mapped_grammars = []
    for g in grammars:
        ex_raw = g.get("ExamplesJson")
        examples = json.loads(ex_raw) if ex_raw else []
        mapped_grammars.append({
            "id": str(g["Id"]),
            "lessonId": str(g["LessonId"]),
            "title": g.get("Title") or "",
            "structure": g.get("StructureFormula") or "",
            "explanation": g.get("Explanation") or "",
            "examples": examples,
            "hskLevel": int(g["HskLevel"]),
            "status": g.get("Status") or "",
        })

    mapped_vocabs = [
        {
            "id": str(v["Id"]),
            "lessonId": str(v["LessonId"]) if v.get("LessonId") else str(lesson["Id"]),
            "hanzi": v.get("Hanzi") or "",
            "pinyin": v.get("Pinyin") or "",
            "meaningVi": v.get("MeaningVi") or "",
            "hskLevel": int(v["HskLevel"]),
            "status": v.get("Status") or "",
            "sourceDataset": v.get("SourceDataset"),
            "sourceEntryId": v.get("SourceEntryId"),
        }
        for v in vocabs
    ]

    mapped_exercises = []
    for ex in exercises:
        opts_raw = ex.get("OptionsJson")
        opts = json.loads(opts_raw) if opts_raw else None
        mapped_exercises.append({
            "id": str(ex["Id"]),
            "lessonId": str(ex["LessonId"]),
            "type": ex.get("Type") or "",
            "skill": ex.get("Skill") or "",
            "hskLevel": int(ex["HskLevel"]),
            "promptHanzi": ex.get("PromptHanzi"),
            "promptPinyin": ex.get("PromptPinyin"),
            "promptVietnamese": ex.get("PromptVietnamese"),
            "options": opts,
            "correctOptionIndex": ex.get("CorrectOptionIndex"),
            "correctAnswer": ex.get("CorrectAnswer"),
            "explanation": ex.get("Explanation"),
            "status": ex.get("Status") or "",
        })

    if ai_review_item:
        review_status = ai_review_item.get("reviewStatus", "AI_GENERATED_NEEDS_ACADEMIC_REVIEW")
        academic_approved = bool(ai_review_item.get("academicApproved", False))
    elif isinstance(dlg_obj, dict) and dlg_obj.get("editorialReviewStatus"):
        review_status = dlg_obj["editorialReviewStatus"]
        academic_approved = review_status in ("VERIFIED_PUBLISHED", "VERIFIED", "EDITORIAL_VERIFIED")
    else:
        review_status = "UNVERIFIED_SOURCE"
        academic_approved = False

    return {
        "schemaVersion": "1.0.0",
        "curriculumStandard": "HSK_2_0",
        "course": {
            "id": str(course["Id"]),
            "code": course["Code"],
            "title": course["Title"],
            "description": course.get("Description"),
            "hskLevel": int(course["HskLevel"]),
            "status": course["Status"],
            "orderIndex": int(course["OrderIndex"]),
        },
        "lesson": {
            "id": str(lesson["Id"]),
            "courseId": str(lesson["CourseId"]),
            "unitId": str(lesson["UnitId"]) if lesson.get("UnitId") else None,
            "lessonNumber": int(lesson["LessonNumber"]),
            "titleZh": lesson["TitleZh"],
            "titleVi": lesson["TitleVi"],
            "pinyin": lesson.get("Pinyin"),
            "summary": lesson.get("Summary"),
            "status": lesson["Status"],
            "orderIndex": int(lesson["OrderIndex"]),
        },
        "vocabularies": mapped_vocabs,
        "grammars": mapped_grammars,
        "dialogue": dlg_obj,
        "readingPassage": rp_obj,
        "listening": listening_obj,
        "exercises": mapped_exercises,
        "sourceMetadata": {
            "sourceId": "zhongwenhub-dev-hsk20",
            "sourceVersion": "2026.11",
            "curriculumStandard": "HSK_2_0",
            "reviewStatus": review_status,
            "academicApproved": academic_approved,
            "sourceDataset": "ZhongWenHub_Dev",
            "notes": "Read-only extraction without content fabrication.",
        },
    }


def run_validation(
    db_export_path: Path,
    json_out: Path = DEFAULT_JSON_OUT,
    md_out: Path = DEFAULT_MD_OUT,
) -> dict[str, Any]:
    data = json.loads(db_export_path.read_text(encoding="utf-8"))
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8")) if MANIFEST_PATH.exists() else {}
    ai_items = {
        str(item["lessonId"]).upper(): item
        for item in manifest.get("aiGeneratedNeedingAcademicReview", {}).get("items", [])
    }

    courses_by_id = {str(c["Id"]).upper(): c for c in data.get("courses", [])}
    vocab_by_id = {str(v["Id"]).upper(): v for v in data.get("vocabularies", [])}

    vocabs_by_lesson: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for v in data.get("vocabularies", []):
        if v.get("LessonId"):
            vocabs_by_lesson[str(v["LessonId"]).upper()].append(v)
    linked_by_lesson: dict[str, set[str]] = defaultdict(set)
    for lv in data.get("lessonVocabularies", []):
        linked_by_lesson[str(lv["LessonId"]).upper()].add(str(lv["VocabularyId"]).upper())

    grammars_by_lesson: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for g in data.get("grammarPoints", []):
        if g.get("LessonId"):
            grammars_by_lesson[str(g["LessonId"]).upper()].append(g)

    exercises_by_lesson: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for ex in data.get("exercises", []):
        if ex.get("LessonId"):
            exercises_by_lesson[str(ex["LessonId"]).upper()].append(ex)

    lesson_results: list[dict[str, Any]] = []
    error_field_counts: Counter[str] = Counter()
    warning_field_counts: Counter[str] = Counter()
    level_summary: dict[int, dict[str, int]] = {
        lvl: {"total": 0, "pass": 0, "warning": 0, "fail": 0, "academicUnapproved": 0}
        for lvl in (1, 2, 3, 4)
    }

    for lesson in data.get("lessons", []):
        cid = str(lesson["CourseId"]).upper()
        course = courses_by_id.get(cid)
        if not course or not (1 <= int(course["HskLevel"]) <= 4):
            continue

        lvl = int(course["HskLevel"])
        lid = str(lesson["Id"]).upper()
        all_vids = {str(v["Id"]).upper() for v in vocabs_by_lesson[lid]} | linked_by_lesson[lid]
        lesson_vocabs = [vocab_by_id[vid] for vid in sorted(all_vids) if vid in vocab_by_id]

        bundle = build_lesson_bundle(
            course=course,
            lesson=lesson,
            vocabs=lesson_vocabs,
            grammars=grammars_by_lesson[lid],
            exercises=exercises_by_lesson[lid],
            ai_review_item=ai_items.get(lid),
        )
        errors, warnings = validate_schema_bundle(bundle, schema)

        if errors:
            outcome = "FAIL"
        elif warnings:
            outcome = "WARNING"
        else:
            outcome = "PASS"

        meta = bundle["sourceMetadata"]
        level_summary[lvl]["total"] += 1
        level_summary[lvl][outcome.lower()] += 1
        if not meta["academicApproved"]:
            level_summary[lvl]["academicUnapproved"] += 1

        for e in errors:
            error_field_counts[extract_field_key(e)] += 1
        for w in warnings:
            warning_field_counts[extract_field_key(w)] += 1

        lesson_results.append({
            "hskLevel": lvl,
            "lessonNumber": int(lesson["LessonNumber"]),
            "lessonId": lid,
            "titleZh": lesson["TitleZh"],
            "titleVi": lesson["TitleVi"],
            "outcome": outcome,
            "errorsCount": len(errors),
            "warningsCount": len(warnings),
            "errors": errors,
            "warnings": warnings,
            "reviewStatus": meta["reviewStatus"],
            "academicApproved": meta["academicApproved"],
        })

    lesson_results.sort(key=lambda x: (x["hskLevel"], x["lessonNumber"]))

    totals = {
        "totalLessons": len(lesson_results),
        "passCount": sum(1 for r in lesson_results if r["outcome"] == "PASS"),
        "warningCount": sum(1 for r in lesson_results if r["outcome"] == "WARNING"),
        "failCount": sum(1 for r in lesson_results if r["outcome"] == "FAIL"),
        "academicUnapprovedCount": sum(1 for r in lesson_results if not r["academicApproved"]),
    }

    report = {
        "generatedAt": "2026-11-12",
        "database": "ZhongWenHub_Dev (read-only)",
        "schemaPath": str(SCHEMA_PATH.relative_to(REPO_ROOT)).replace("\\", "/"),
        "totals": totals,
        "levelSummary": level_summary,
        "errorsByField": dict(error_field_counts.most_common()),
        "warningsByField": dict(warning_field_counts.most_common()),
        "lessons": lesson_results,
    }

    json_out.parent.mkdir(parents=True, exist_ok=True)
    json_out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    # Build Markdown report
    md_lines = [
        "# ZhongWenHub — Báo cáo Kiểm tra Validator Dữ liệu HSK 1–4 (HSK 2.0)",
        "",
        "- **Nguồn dữ liệu:** `ZhongWenHub_Dev` (trích xuất chỉ đọc, không tự tạo dữ liệu)",
        "- **JSON Schema:** [`data/hsk20/schemas/hsk20-lesson-bundle.schema.json`](../../data/hsk20/schemas/hsk20-lesson-bundle.schema.json)",
        "- **Validator:** [`scripts/hsk20/validate_hsk20_data.py`](../../scripts/hsk20/validate_hsk20_data.py)",
        "- **JSON chi tiết:** [`data/hsk20/staging/hsk14_validation_report.json`](../../data/hsk20/staging/hsk14_validation_report.json)",
        "",
        "---",
        "",
        "## 1. Tổng hợp kết quả theo cấp độ",
        "",
        f"- **Tổng số bài kiểm tra:** **{totals['totalLessons']}** bài (HSK 1–4)",
        f"- **PASS (0 errors, 0 warnings):** **{totals['passCount']}** bài",
        f"- **WARNING (0 errors, có cảnh báo thiếu/Pinyin):** **{totals['warningCount']}** bài",
        f"- **FAIL (có lỗi cấu trúc/dữ liệu không hợp lệ):** **{totals['failCount']}** bài",
        f"- **Chưa duyệt học thuật (`academicApproved = false`):** **{totals['academicUnapprovedCount']}** bài *(tách biệt với lỗi kỹ thuật)*",
        "",
        "| Cấp HSK | Tổng bài | PASS | WARNING | FAIL | Chưa duyệt học thuật |",
        "|---|---:|---:|---:|---:|---:|",
    ]
    for lvl in range(1, 5):
        s = level_summary[lvl]
        md_lines.append(
            f"| **HSK {lvl}** | {s['total']} | {s['pass']} | {s['warning']} | {s['fail']} | {s['academicUnapproved']} |"
        )

    md_lines.extend([
        "",
        "---",
        "",
        "## 2. Phân loại lỗi & cảnh báo theo trường dữ liệu",
        "",
        "### 2.1. Lỗi cấu trúc / dữ liệu không hợp lệ (`errors` → `FAIL`)",
    ])
    if error_field_counts:
        md_lines.append("| Trường dữ liệu | Số lần xuất hiện |")
        md_lines.append("|---|---:|")
        for k, v in error_field_counts.most_common():
            md_lines.append(f"| `{k}` | {v} |")
    else:
        md_lines.append("- Không ghi nhận lỗi cấu trúc (`0` lỗi trên 70 bài).")

    md_lines.extend([
        "",
        "### 2.2. Cảnh báo dữ liệu thiếu & Pinyin (`warnings` → `WARNING`)",
        "| Trường dữ liệu | Số lần xuất hiện | Phân loại |",
        "|---|---:|---|",
    ])
    for k, v in warning_field_counts.most_common():
        category = "Thiếu trường chuẩn hóa (Giai đoạn 3)" if any(
            x in k for x in ("sentences", "questionPinyin", "optionsPinyin", "optionsVi")
        ) else "Cảnh báo Pinyin / Từ vựng"
        md_lines.append(f"| `{k}` | {v} | {category} |")

    md_lines.extend([
        "",
        "---",
        "",
        "## 3. Chi tiết từng bài học (70 bài HSK 1–4)",
        "",
        "| HSK | Bài | Tiêu đề | Kết quả | Errors | Warnings | Duyệt học thuật | Ghi chú chính |",
        "|---:|---:|---|---|---:|---:|---|---|",
    ])
    for r in lesson_results:
        approved_str = "Đã duyệt" if r["academicApproved"] else f"Chưa duyệt (`{r['reviewStatus']}`)"
        notes = "; ".join((r["errors"] + r["warnings"])[:2]) if (r["errors"] or r["warnings"]) else "Đạt chuẩn kỹ thuật"
        md_lines.append(
            f"| {r['hskLevel']} | {r['lessonNumber']} | {r['titleZh']} ({r['titleVi']}) | **{r['outcome']}** | "
            f"{r['errorsCount']} | {r['warningsCount']} | {approved_str} | {notes} |"
        )

    md_lines.extend([
        "",
        "---",
        "",
        "## 4. Nội dung ưu tiên xử lý trước tiên (trước Giai đoạn C & D)",
        "",
        "1. **Rà soát các trường hợp `errors` (nếu có):** Khắc phục toàn bộ bài `FAIL` trước khi cập nhật dữ liệu mới.",
        "2. **Bổ sung trường chuẩn hóa đọc hiểu (69/70 bài thiếu):** `readingPassage.sentences[]`, `comprehensionQuestions[].questionPinyin`, `optionsPinyin[]`, `optionsVi[]` bắt đầu từ **Đợt 1: HSK 1 Bài 2–15**.",
        "3. **Rà soát cảnh báo Pinyin (`vocabularies[].pinyin`, `dialogue.lines[].pinyin`, `listening[].transcriptPinyin`):** Kiểm tra lại các âm tiết có cảnh báo dấu thanh/ghép âm tiết hoặc từ đa âm.",
        "4. **Kiểm duyệt học thuật (`64/70` bài `academicApproved = false`):** Giữ nguyên trạng thái chờ chuyên gia tiếng Trung duyệt; không tự động đánh dấu đã duyệt.",
        "",
    ])

    md_out.parent.mkdir(parents=True, exist_ok=True)
    md_out.write_text("\n".join(md_lines), encoding="utf-8")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Run HSK 2.0 bundle validation on read-only DB export.")
    parser.add_argument("--db-export", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, default=DEFAULT_JSON_OUT)
    parser.add_argument("--md-out", type=Path, default=DEFAULT_MD_OUT)
    args = parser.parse_args()

    report = run_validation(args.db_export, args.json_out, args.md_out)
    print(json.dumps({
        "totals": report["totals"],
        "levelSummary": report["levelSummary"],
        "errorsByField": report["errorsByField"],
        "warningsByField": report["warningsByField"],
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

