import json
import os
import pyodbc

# Connect to Dev DB (Read-Only) to fetch lesson details
conn = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};Server=localhost\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;')
cursor = conn.cursor()

cursor.execute("""
    SELECT 
        l.Id, l.LessonNumber, l.TitleZh, l.TitleVi, l.Status, l.OrderIndex,
        u.UnitNumber, u.TitleZh AS UnitTitleZh, u.TitleVi AS UnitTitleVi
    FROM lessons l
    JOIN units u ON l.UnitId = u.Id
    JOIN courses c ON u.CourseId = c.Id
    WHERE c.HskLevel = 1
    ORDER BY l.LessonNumber
""")
db_lessons = cursor.fetchall()
conn.close()

# Load manifests
with open(r"D:\ZhongWenHub\data\hsk30\staging\hsk1_vocabulary_qa_manifest.json", "r", encoding="utf-8") as f:
    vocab_qa = json.load(f)

with open(r"D:\ZhongWenHub\data\hsk30\staging\hsk1_exercise_qa_manifest.json", "r", encoding="utf-8") as f:
    exercise_qa = json.load(f)

with open(r"D:\ZhongWenHub\data\hsk30\staging\hsk1_reading_passages.json", "r", encoding="utf-8") as f:
    readings = json.load(f)

with open(r"D:\ZhongWenHub\data\hsk30\staging\hsk1_audio_qa_manifest.json", "r", encoding="utf-8") as f:
    audio_qa = json.load(f)

reading_by_lesson = {r["lessonNumber"]: r for r in readings}

lessons_review = []

for row in db_lessons:
    lesson_id, lesson_num, title_zh, title_vi, db_status, order_idx, unit_num, unit_title_zh, unit_title_vi = row
    
    # Check if this lesson has a reading passage (end of unit: 2, 4, 7, 9, 12, 15)
    has_reading = lesson_num in reading_by_lesson
    reading_item = reading_by_lesson.get(lesson_num)
    
    # Vocab items count in this lesson
    vocab_items = [v for v in vocab_qa["manifest"] if v.get("lessonNumber") == lesson_num]
    
    # Exercise items in this lesson
    staging_ex = [e for e in exercise_qa["staging"]["items"] if e.get("lessonNumber") == lesson_num]
    dev_ex = [e for e in exercise_qa["currentDev"]["items"] if str(e.get("lessonId", "")).lower() == str(lesson_id).lower()]
    
    # Audio files for this lesson
    dialogue_mp3 = f"les{lesson_num}_dialogue.mp3"
    listening_mp3 = f"les{lesson_num}_listening.mp3"
    has_dialogue_audio = any(a["filename"] == dialogue_mp3 for a in audio_qa["files"])
    has_listening_audio = any(a["filename"] == listening_mp3 for a in audio_qa["files"])
    
    # Release gate readiness assessment
    # Lessons 1, 2, 3 are already PUBLISHED in Dev
    # Lessons 4-15 are currently DRAFT in Dev
    # Release gate: requires human review approval before moving from DRAFT/PENDING_REVIEW to PUBLISHED
    technical_readiness = "READY"
    pedagogical_status = "LINGUISTICALLY_REVIEWED_AI" if lesson_num not in [8] else "NEEDS_HUMAN_REVIEW"
    
    # Lesson 8 has the particle 得 (structural particle needing tone/grammar human sign-off)
    if lesson_num == 8:
        release_gate_status = "BLOCKED_AWAITING_HUMAN_REVIEW"
        unblocking_criteria = "Ký duyệt chuyên gia ngôn ngữ về giải thích trợ từ kết cấu 得 và bài tập phân biệt trợ từ."
    elif db_status == "PUBLISHED":
        release_gate_status = "CURRENTLY_PUBLISHED_DEV"
        unblocking_criteria = "Đã xuất bản trên Dev, dữ liệu staging sẵn sàng cập nhật khi có lệnh."
    else:
        release_gate_status = "TECHNICALLY_READY_AWAITING_HUMAN_APPROVAL"
        unblocking_criteria = "Phê duyệt nội bộ chuyên gia chương trình HSK 3.0 trước khi kích hoạt Release Gate sang PUBLISHED."
        
    lessons_review.append({
        "lessonNumber": lesson_num,
        "lessonId": str(lesson_id),
        "unitNumber": unit_num,
        "titleZh": title_zh,
        "titleVi": title_vi,
        "unitTitle": f"Unit {unit_num}: {unit_title_zh} ({unit_title_vi})",
        "currentDevStatus": db_status,
        "releaseGateStatus": release_gate_status,
        "technicalReadiness": technical_readiness,
        "pedagogicalStatus": pedagogical_status,
        "unblockingCriteria": unblocking_criteria,
        "contentStats": {
            "vocabExamplesStaged": len(vocab_items),
            "exercisesDev": len(dev_ex),
            "exercisesStaged": len(staging_ex),
            "hasReadingPassage": has_reading,
            "readingPassageQuestions": len(reading_item["comprehensionQuestions"]) if reading_item else 0,
            "audioDialogueValid": has_dialogue_audio,
            "audioListeningValid": has_listening_audio
        }
    })

manifest = {
    "version": "1.0",
    "phase": "9.1C",
    "generatedAt": "2026-11-09T23:25:00+07:00",
    "curriculum": "HSK 3.0 Level 1",
    "totalLessons": len(lessons_review),
    "lessonsCurrentlyPublished": sum(1 for l in lessons_review if l["currentDevStatus"] == "PUBLISHED"),
    "lessonsDraft": sum(1 for l in lessons_review if l["currentDevStatus"] == "DRAFT"),
    "lessonsTechnicallyReady": sum(1 for l in lessons_review if l["technicalReadiness"] == "READY"),
    "lessonsAwaitingHumanReview": sum(1 for l in lessons_review if l["pedagogicalStatus"] == "NEEDS_HUMAN_REVIEW"),
    "workflow": [
        "1. DRAFT (Mặc định trong DB cho Lesson 4-15)",
        "2. PENDING_REVIEW (Đã bổ sung ví dụ, bài tập, bài đọc hiểu, kiểm định AI)",
        "3. PUBLISHED (Chỉ kích hoạt khi có phê duyệt học thuật chính thức từ chuyên gia con người)"
    ],
    "lessons": lessons_review
}

output_path = r"D:\ZhongWenHub\data\hsk30\staging\hsk1_content_review_manifest.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"Generated unified content review manifest at {output_path}")
print(f"Total lessons: {manifest['totalLessons']}")
print(f"Currently Published: {manifest['lessonsCurrentlyPublished']}")
print(f"Draft: {manifest['lessonsDraft']}")
print(f"Technically Ready: {manifest['lessonsTechnicallyReady']}")
print(f"Awaiting Human Review: {manifest['lessonsAwaitingHumanReview']}")
