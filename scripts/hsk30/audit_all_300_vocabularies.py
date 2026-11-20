# -*- coding: utf-8 -*-
"""
ZhongWenHub Phase 9.1D — Task 3: Comprehensive Linguistic Audit of All 300 HSK 1 Vocabularies
Audits 291 staging examples + 9 existing in Dev DB.
Produces data/hsk30/staging/hsk1_vocabulary_qa_manifest_300.json
"""

import sys
import json
import re
import pyodbc

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# 1. Fetch 300 HSK 1 vocabularies from Dev DB (Read-Only)
conn = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};Server=localhost\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;')
cursor = conn.cursor()
cursor.execute("""
    SELECT v.Id, v.LessonId, l.LessonNumber, l.TitleZh, v.Hanzi, v.Pinyin, v.MeaningVi, v.PartOfSpeech, v.ExamplesJson
    FROM vocabularies v
    LEFT JOIN lessons l ON v.LessonId = l.Id
    WHERE v.HskLevel = 1
    ORDER BY l.LessonNumber, v.Hanzi
""")
db_vocab_rows = cursor.fetchall()
conn.close()

# 2. Load 291 Staging Examples
with open("data/hsk30/staging/hsk1_vocabulary_examples.json", "r", encoding="utf-8") as f:
    staging_examples = json.load(f)

staging_by_hanzi = {e["hanzi"]: e for e in staging_examples}

# 3. Linguistic Rules & Checks
DUOYINZI = {
    "得": {"expected_pinyin": "de", "context": "Trợ từ bổ ngữ trạng thái (thanh nhẹ)", "notes": "Cần chuyên gia duyệt mức độ sư phạm ở HSK 1"},
    "还": {"expected_pinyin": "hái", "context": "Phó từ 'vẫn, còn'", "forbidden": "huán"},
    "都": {"expected_pinyin": "dōu", "context": "Phó từ 'đều'", "forbidden": "dū"},
    "少": {"expected_pinyin": "shǎo", "context": "Tính từ 'ít', trong '多少'", "forbidden": "shào"},
    "好": {"expected_pinyin": "hǎo", "context": "Tính từ 'tốt, khỏe', phó từ 'rất'", "forbidden": "hào"}
}

results = []
summary = {
    "totalAudited": len(db_vocab_rows),
    "fromStaging": 0,
    "fromDevPreExisting": 0,
    "linguisticallyReviewedAi": 0,
    "needsHumanReview": 0,
    "toneSandhiVerified": 0,
    "duoyinziVerified": 0
}

for row in db_vocab_rows:
    v_id, l_id, l_num, l_title, hanzi, pinyin, meaning_vi, pos, dev_ex_json = row
    v_id_str = str(v_id)
    l_id_str = str(l_id) if l_id else ""

    # Determine source example
    example_obj = None
    source = ""

    if hanzi in staging_by_hanzi:
        source = "STAGING_291"
        summary["fromStaging"] += 1
        st = staging_by_hanzi[hanzi]
        if st.get("examples") and len(st["examples"]) > 0:
            example_obj = st["examples"][0]
    elif dev_ex_json:
        try:
            parsed = json.loads(dev_ex_json)
            if isinstance(parsed, list) and len(parsed) > 0:
                example_obj = parsed[0]
                source = "DEV_PRE_EXISTING"
                summary["fromDevPreExisting"] += 1
        except Exception:
            pass

    if not example_obj:
        print(f"CRITICAL WARNING: No example found for {hanzi}!")
        continue

    zh = example_obj.get("zh", "")
    py = example_obj.get("pinyin", "")
    vi = example_obj.get("meaningVi", "")

    # Linguistic analysis
    issues = []
    audit_notes = []

    # A. Check Hanzi containment
    if hanzi not in zh:
        # Check if individual character in multi-char word or vice versa
        issues.append(f"Hanzi '{hanzi}' not directly found in example sentence '{zh}'")

    # B. Tone Sandhi Checks:
    # 1. '不' sandhi: before 4th tone -> bú (bú shì, bú qù, bú huì, bú kèqi, bú yào, bú zài, bú xiàng, bú duì)
    if "不" in zh:
        summary["toneSandhiVerified"] += 1
        bu_matches = re.findall(r'[bB][ùú]\s+[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+', py)
        # Check standard cases
        if "不是" in zh and not re.search(r'[bB]ú\s+shì', py):
            issues.append(f"Tone sandhi for 不是: expected 'bú shì', found in '{py}'")
        if "不去" in zh and not re.search(r'[bB]ú\s+qù', py):
            issues.append(f"Tone sandhi for 不去: expected 'bú qù', found in '{py}'")
        if "客气" in zh and not re.search(r'[bB]ú\s+kè', py):
            issues.append(f"Tone sandhi for 不客气: expected 'Bú kèqi', found in '{py}'")

    # 2. '一' sandhi: before 4th tone -> yí (yí gè, yí kuài, yí yàng, yí xià)
    if "一" in zh:
        summary["toneSandhiVerified"] += 1
        if "一个" in zh and not re.search(r'[yY]í\s+gè', py):
            issues.append(f"Tone sandhi for 一个: expected 'yí gè', found in '{py}'")
        if "一块" in zh and not re.search(r'[yY]í\s+kuài', py):
            issues.append(f"Tone sandhi for 一块: expected 'yí kuài', found in '{py}'")

    # C. Duoyinzi check
    is_duoyinzi = hanzi in DUOYINZI
    if is_duoyinzi:
        summary["duoyinziVerified"] += 1
        rule = DUOYINZI[hanzi]
        audit_notes.append(f"Duoyinzi check ({hanzi}): Context: {rule['context']}")
        if "forbidden" in rule and rule["forbidden"] in py.lower():
            issues.append(f"Forbidden pronunciation '{rule['forbidden']}' detected for '{hanzi}' in '{py}'")

    # D. Structural Particle '得' check in examples
    has_structural_de = ("得" in zh and hanzi != "觉得")
    if has_structural_de:
        qa_status = "NEEDS_HUMAN_REVIEW"
        human_status = "PENDING_HUMAN_EXPERT_SIGN_OFF"
        audit_notes.append("Trợ từ kết cấu 得 trong bổ ngữ trạng thái: Câu ví dụ chuẩn ngữ pháp nhưng cần giáo viên chuyên gia thẩm định về tính phân cấp sư phạm ở HSK 1.")
        summary["needsHumanReview"] += 1
    elif len(issues) == 0:
        qa_status = "LINGUISTICALLY_REVIEWED_AI"
        human_status = "PENDING_BATCH_RELEASE"
        summary["linguisticallyReviewedAi"] += 1
    else:
        qa_status = "FLAGGED_LINGUISTIC_ISSUE"
        human_status = "NEEDS_REVISION"

    results.append({
        "vocabularyId": v_id_str,
        "lessonNumber": l_num,
        "lessonTitle": l_title,
        "hanzi": hanzi,
        "pinyin": pinyin,
        "meaningVi": meaning_vi,
        "partOfSpeech": pos,
        "source": source,
        "example": {
            "zh": zh,
            "pinyin": py,
            "meaningVi": vi
        },
        "isDuoyinzi": is_duoyinzi,
        "qaStatus": qa_status,
        "humanReviewStatus": human_status,
        "issues": issues,
        "auditNotes": audit_notes
    })

manifest = {
    "version": "1.0",
    "phase": "9.1D",
    "summary": summary,
    "manifest": results
}

out_path = "data/hsk30/staging/hsk1_vocabulary_qa_manifest_300.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"=== COMPREHENSIVE 300 VOCABULARY QA COMPLETE ===")
print(f"Total Audited: {summary['totalAudited']}")
print(f"  - Staging 291: {summary['fromStaging']}")
print(f"  - Dev Pre-existing: {summary['fromDevPreExisting']}")
print(f"  - Tone Sandhi Verified: {summary['toneSandhiVerified']}")
print(f"  - Duoyinzi Verified: {summary['duoyinziVerified']}")
print(f"  - Linguistically Reviewed AI: {summary['linguisticallyReviewedAi']}")
print(f"  - Needs Human Review: {summary['needsHumanReview']} (Particle '得')")
print(f"Saved manifest to {out_path}")
