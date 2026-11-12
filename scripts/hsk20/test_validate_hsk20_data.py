import json
import tempfile
import unittest
from pathlib import Path
import sys

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from validate_hsk20_data import (  # noqa: E402
    QUALITY_INVALID_DATA,
    QUALITY_MISSING_CONTENT,
    QUALITY_VALID_UNREVIEWED,
    analyze_db_export,
    validate_schema_bundle,
)


def make_valid_bundle() -> dict:
    return {
        "schemaVersion": "1.0.0",
        "curriculumStandard": "HSK_2_0",
        "course": {
            "id": "11111111-1111-1111-1111-111111111111",
            "code": "HSK1",
            "title": "Giáo trình Chuẩn HSK 1",
            "hskLevel": 1,
            "status": "PUBLISHED",
            "orderIndex": 1,
        },
        "lesson": {
            "id": "AAAAAAAA-1111-1111-1111-111111111111",
            "courseId": "11111111-1111-1111-1111-111111111111",
            "lessonNumber": 1,
            "titleZh": "你好",
            "titleVi": "Chào bạn",
            "pinyin": "Nǐ hǎo",
            "status": "PUBLISHED",
            "orderIndex": 1,
        },
        "vocabularies": [
            {
                "id": "v-1",
                "lessonId": "AAAAAAAA-1111-1111-1111-111111111111",
                "hanzi": "你好",
                "pinyin": "nǐ hǎo",
                "meaningVi": "xin chào",
                "hskLevel": 1,
                "status": "PUBLISHED",
            }
        ],
        "grammars": [
            {
                "id": "g-1",
                "lessonId": "AAAAAAAA-1111-1111-1111-111111111111",
                "title": "Chào hỏi",
                "structure": "你好",
                "explanation": "Lời chào cơ bản",
                "hskLevel": 1,
                "status": "PUBLISHED",
            }
        ],
        "dialogue": {
            "id": "diag-1",
            "lessonId": "AAAAAAAA-1111-1111-1111-111111111111",
            "title": "Bài 1",
            "lines": [
                {
                    "id": "line-1",
                    "speakerName": "大卫",
                    "zh": "你好！",
                    "pinyin": "Nǐ hǎo!",
                    "meaningVi": "Chào bạn!",
                    "displayOrder": 1,
                }
            ],
        },
        "readingPassage": {
            "unitNumber": 1,
            "lessonNumber": 1,
            "titleZh": "你好！",
            "titleVi": "Xin chào!",
            "passageZh": "你好！",
            "passagePinyin": "Nǐ hǎo!",
            "passageVi": "Chào bạn!",
            "sentences": [
                {"zh": "你好！", "pinyin": "Nǐ hǎo!", "vi": "Chào bạn!"}
            ],
            "comprehensionQuestions": [
                {
                    "questionZh": "他说什么？",
                    "questionPinyin": "Tā shuō shénme?",
                    "questionVi": "Anh ấy nói gì?",
                    "options": ["你好！", "再见！"],
                    "optionsPinyin": ["Nǐ hǎo!", "Zàijiàn!"],
                    "optionsVi": ["Chào bạn!", "Tạm biệt!"],
                    "correctIndex": 0,
                    "explanation": "Nói chào.",
                }
            ],
        },
        "listening": [
            {
                "id": "list-1",
                "lessonId": "AAAAAAAA-1111-1111-1111-111111111111",
                "title": "Nghe 1",
                "transcriptZh": "你好！",
                "transcriptPinyin": "Nǐ hǎo!",
                "transcriptVi": "Chào bạn!",
                "prompt": "Chọn câu đúng",
                "options": [
                    {"id": 0, "text": "你好", "isCorrect": True},
                    {"id": 1, "text": "再见", "isCorrect": False},
                ],
                "explanation": "Đáp án A.",
            }
        ],
        "exercises": [
            {
                "id": "ex-1",
                "lessonId": "AAAAAAAA-1111-1111-1111-111111111111",
                "type": "MULTIPLE_CHOICE",
                "skill": "READING",
                "hskLevel": 1,
                "options": ["A", "B"],
                "correctOptionIndex": 0,
                "status": "PUBLISHED",
            }
        ],
        "sourceMetadata": {
            "sourceId": "hsk20-standard",
            "sourceVersion": "2026.11",
            "curriculumStandard": "HSK_2_0",
            "reviewStatus": "AI_GENERATED_NEEDS_ACADEMIC_REVIEW",
            "academicApproved": False,
        },
    }


class ValidateHsk20DataTests(unittest.TestCase):
    def test_valid_bundle_passes(self) -> None:
        errors, warnings = validate_schema_bundle(make_valid_bundle())
        self.assertEqual(errors, [])
        self.assertEqual(warnings, [])

    def test_rejects_hsk30_curriculum_standard(self) -> None:
        bundle = make_valid_bundle()
        bundle["curriculumStandard"] = "HSK_3_0"
        errors, _ = validate_schema_bundle(bundle)
        self.assertTrue(any("curriculumStandard" in e for e in errors))

    def test_rejects_out_of_bounds_correct_index_and_mismatched_options_vi(self) -> None:
        bundle = make_valid_bundle()
        q = bundle["readingPassage"]["comprehensionQuestions"][0]
        q["correctIndex"] = 5
        q["optionsVi"] = ["Chỉ có 1 lựa chọn"]
        errors, _ = validate_schema_bundle(bundle)
        self.assertTrue(any("correctIndex" in e for e in errors))
        self.assertTrue(any("optionsVi length mismatch" in e for e in errors))

    def test_rejects_duplicate_ids_and_referential_mismatch(self) -> None:
        bundle = make_valid_bundle()
        bundle["grammars"][0]["id"] = bundle["vocabularies"][0]["id"]
        bundle["grammars"][0]["lessonId"] = "OTHER-LESSON"
        errors, _ = validate_schema_bundle(bundle)
        self.assertTrue(any("Duplicate grammar id" in e for e in errors))
        self.assertTrue(any("lessonId mismatch" in e for e in errors))

    def test_analyze_db_export_classifies_missing_invalid_and_unreviewed(self) -> None:
        export = {
            "courses": [{"Id": "C1", "HskLevel": 1}],
            "lessons": [
                {
                    "Id": "L1",
                    "CourseId": "C1",
                    "LessonNumber": 1,
                    "TitleZh": "你好",
                    "TitleVi": "Chào bạn",
                    "Status": "PUBLISHED",
                    "DialogueJson": json.dumps({
                        "lessonId": "L1",
                        "editorialReviewStatus": "AI_GENERATED_NEEDS_ACADEMIC_REVIEW",
                        "lines": [{"zh": "你好"}],
                        "readingPassage": {
                            "sentences": [{"zh": "你好", "pinyin": "Nǐ hǎo", "vi": "Chào"}],
                            "comprehensionQuestions": [{
                                "questionPinyin": "Shénme?",
                                "options": ["A", "B"],
                                "optionsPinyin": ["A", "B"],
                                "optionsVi": ["A", "B"],
                                "correctIndex": 0,
                            }],
                        },
                    }),
                    "ListeningJson": json.dumps([{"options": [{"isCorrect": True}, {"isCorrect": False}]}]),
                },
                {
                    "Id": "L2",
                    "CourseId": "C1",
                    "LessonNumber": 2,
                    "TitleZh": "谢谢",
                    "TitleVi": "Cảm ơn",
                    "Status": "PUBLISHED",
                    "DialogueJson": "{invalid-json",
                    "ListeningJson": "[]",
                },
                {
                    "Id": "L3",
                    "CourseId": "C1",
                    "LessonNumber": 3,
                    "TitleZh": "再见",
                    "TitleVi": "Tạm biệt",
                    "Status": "PUBLISHED",
                    "DialogueJson": json.dumps({"lessonId": "L3", "lines": [{"zh": "再见"}]}),
                    "ListeningJson": json.dumps([{"options": [{"isCorrect": True}, {"isCorrect": False}]}]),
                },
            ],
            "vocabularies": [
                {"Id": "V1", "LessonId": "L1", "HskLevel": 1, "Hanzi": "你好"},
                {"Id": "V2", "LessonId": "L2", "HskLevel": 1, "Hanzi": "谢谢"},
                {"Id": "V3", "LessonId": "L3", "HskLevel": 1, "Hanzi": "再见"},
            ],
            "lessonVocabularies": [],
            "grammarPoints": [
                {"Id": "G1", "LessonId": "L1"},
                {"Id": "G2", "LessonId": "L2"},
                {"Id": "G3", "LessonId": "L3"},
            ],
            "exercises": [
                {"Id": "E1", "LessonId": "L1"},
                {"Id": "E2", "LessonId": "L2"},
                {"Id": "E3", "LessonId": "L3"},
            ],
            "exams": [],
        }
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "export.json"
            p.write_text(json.dumps(export), encoding="utf-8")
            report = analyze_db_export(p, manifest_path=Path(tmp) / "missing.json")
            statuses = {item["lessonNumber"]: item["qualityStatus"] for item in report["lessons"]}
            self.assertEqual(statuses[1], QUALITY_VALID_UNREVIEWED)
            self.assertEqual(statuses[2], QUALITY_INVALID_DATA)
            self.assertEqual(statuses[3], QUALITY_MISSING_CONTENT)


class PinyinValidatorMultiSyllableTests(unittest.TestCase):
    def test_valid_compound_and_special_pinyin_pass(self) -> None:
        from pinyin_validator import (
            check_pinyin_matches_hanzi,
            segment_pinyin_token,
            validate_pinyin_string,
        )

        valid_cases = [
            "lǎoshī",
            "gāoxìng",
            "zǎoshang",
            "zhōngwǔ",
            "xuéxiào",
            "jīntiān",
            "péngyou",
            "duìbuqǐ",
            "méiguānxi",
            "yìdiǎnr",
            "nǚ'ér",
            "Xī'ān",
            "lǜsè",
            "Wáng lǎoshī",
        ]
        for py in valid_cases:
            ok, msg = validate_pinyin_string(py)
            self.assertTrue(ok, f"Expected valid for {py!r}, got: {msg}")

        syls, _ = segment_pinyin_token("lǎoshī")
        self.assertEqual(syls, ["lǎo", "shī"])

        matched, match_msg = check_pinyin_matches_hanzi("老师", "lǎoshī")
        self.assertTrue(matched, match_msg)

    def test_invalid_compound_and_malformed_pinyin_fail(self) -> None:
        from pinyin_validator import validate_pinyin_string

        invalid_cases = [
            "lǎoshīx",      # trailing invalid consonant
            "nǐhǎoo",       # dangling single-letter 'o' mid/end-word without apostrophe
            "zhōōng",       # double tone mark in single syllable
            "gūai",         # tone mark on wrong vowel (should be on 'a', not 'u')
            "haǒ",          # tone mark on wrong vowel (should be on 'a', not 'o')
            "asdfghjk",     # gibberish
            "píng guǒ 123", # digits inside pinyin
        ]
        for py in invalid_cases:
            ok, _ = validate_pinyin_string(py)
            self.assertFalse(ok, f"Expected invalid for {py!r}")


if __name__ == "__main__":
    unittest.main()

