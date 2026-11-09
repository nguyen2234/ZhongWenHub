import pyodbc
import json

def run_read_only_audit():
    conn = pyodbc.connect(
        'Driver={ODBC Driver 18 for SQL Server};Server=.\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;TrustServerCertificate=yes;',
        readonly=True
    )
    cursor = conn.cursor()

    report = {}

    # 1. Courses
    cursor.execute("SELECT Id, HskLevel, Code, Title, Description, Status, OrderIndex FROM courses ORDER BY HskLevel")
    courses = []
    for r in cursor.fetchall():
        courses.append({
            "id": str(r[0]),
            "hskLevel": r[1],
            "code": r[2],
            "title": r[3],
            "description": r[4],
            "status": r[5],
            "orderIndex": r[6]
        })
    report["courses"] = courses

    # 2. Units
    cursor.execute("SELECT c.HskLevel, COUNT(u.Id) as UnitCount, SUM(CASE WHEN u.Status='PUBLISHED' THEN 1 ELSE 0 END) as PubCount FROM courses c LEFT JOIN units u ON u.CourseId = c.Id GROUP BY c.HskLevel ORDER BY c.HskLevel")
    units_by_hsk = []
    for r in cursor.fetchall():
        units_by_hsk.append({
            "hskLevel": r[0],
            "unitCount": r[1],
            "publishedCount": r[2]
        })
    report["unitsByHsk"] = units_by_hsk

    cursor.execute("SELECT COUNT(*) as Total, SUM(CASE WHEN Status='PUBLISHED' THEN 1 ELSE 0 END) as Pub, SUM(CASE WHEN Status='DRAFT' THEN 1 ELSE 0 END) as Draft FROM units")
    r = cursor.fetchone()
    report["unitsTotal"] = {"total": r[0], "published": r[1], "draft": r[2]}

    # 3. Lessons
    cursor.execute("""
    SELECT c.HskLevel, 
           COUNT(l.Id) as TotalLessons, 
           SUM(CASE WHEN l.Status='PUBLISHED' THEN 1 ELSE 0 END) as PubLessons,
           SUM(CASE WHEN l.Status='DRAFT' THEN 1 ELSE 0 END) as DraftLessons,
           SUM(CASE WHEN l.Status='PENDING_REVIEW' THEN 1 ELSE 0 END) as PendingLessons
    FROM courses c
    LEFT JOIN lessons l ON l.CourseId = c.Id
    GROUP BY c.HskLevel
    ORDER BY c.HskLevel
    """)
    lessons_by_hsk = []
    for r in cursor.fetchall():
        lessons_by_hsk.append({
            "hskLevel": r[0],
            "total": r[1],
            "published": r[2],
            "draft": r[3],
            "pending": r[4]
        })
    report["lessonsByHsk"] = lessons_by_hsk

    cursor.execute("""
    SELECT 
        COUNT(*) as Total,
        SUM(CASE WHEN Status='PUBLISHED' THEN 1 ELSE 0 END) as Published,
        SUM(CASE WHEN Status='DRAFT' THEN 1 ELSE 0 END) as Draft,
        SUM(CASE WHEN Status='PENDING_REVIEW' THEN 1 ELSE 0 END) as PendingReview,
        SUM(CASE WHEN DialogueJson IS NULL OR LEN(LTRIM(RTRIM(DialogueJson))) < 10 THEN 1 ELSE 0 END) as MissingDialogue,
        SUM(CASE WHEN ListeningJson IS NULL OR LEN(LTRIM(RTRIM(ListeningJson))) < 10 THEN 1 ELSE 0 END) as MissingListening,
        SUM(CASE WHEN ReviewedByUserId IS NOT NULL THEN 1 ELSE 0 END) as HumanReviewedCount
    FROM lessons
    """)
    r = cursor.fetchone()
    report["lessonsAggregate"] = {
        "total": r[0],
        "published": r[1],
        "draft": r[2],
        "pendingReview": r[3],
        "missingDialogue": r[4],
        "missingListening": r[5],
        "humanReviewedCount": r[6]
    }

    # Lessons with 0 exercises
    cursor.execute("SELECT COUNT(*) FROM lessons l WHERE NOT EXISTS (SELECT 1 FROM exercises e WHERE e.LessonId = l.Id)")
    report["lessonsWithoutExercises"] = cursor.fetchone()[0]

    # 4. Vocabularies
    cursor.execute("SELECT COUNT(*) as Total, SUM(CASE WHEN Status='PUBLISHED' THEN 1 ELSE 0 END) as Pub, SUM(CASE WHEN Status='DRAFT' THEN 1 ELSE 0 END) as Draft FROM vocabularies")
    r = cursor.fetchone()
    report["vocabTotal"] = {"total": r[0], "published": r[1], "draft": r[2]}

    cursor.execute("SELECT HskLevel, COUNT(*) as Total, SUM(CASE WHEN Status='PUBLISHED' THEN 1 ELSE 0 END) as Pub FROM vocabularies GROUP BY HskLevel ORDER BY HskLevel")
    vocab_by_hsk = []
    for r in cursor.fetchall():
        vocab_by_hsk.append({
            "hskLevel": r[0],
            "total": r[1],
            "published": r[2]
        })
    report["vocabByHsk"] = vocab_by_hsk

    cursor.execute("SELECT ISNULL(SourceId, 'NULL') as SrcId, ISNULL(SourceDataset, 'NULL') as SrcDs, COUNT(*) as Cnt FROM vocabularies GROUP BY SourceId, SourceDataset ORDER BY Cnt DESC")
    vocab_sources = []
    for r in cursor.fetchall():
        vocab_sources.append({
            "sourceId": r[0],
            "sourceDataset": r[1],
            "count": r[2]
        })
    report["vocabSources"] = vocab_sources

    # Check missing Vietnamese meaning
    cursor.execute("SELECT COUNT(*) FROM vocabularies WHERE MeaningVi IS NULL OR LEN(LTRIM(RTRIM(MeaningVi))) = 0")
    report["vocabMissingMeaningVi"] = cursor.fetchone()[0]

    # Check missing Pinyin
    cursor.execute("SELECT COUNT(*) FROM vocabularies WHERE Pinyin IS NULL OR LEN(LTRIM(RTRIM(Pinyin))) = 0")
    report["vocabMissingPinyin"] = cursor.fetchone()[0]

    # 5. Grammar Points
    cursor.execute("SELECT COUNT(*) as Total, SUM(CASE WHEN Status='PUBLISHED' THEN 1 ELSE 0 END) as Pub, SUM(CASE WHEN Status='DRAFT' THEN 1 ELSE 0 END) as Draft FROM grammar_points")
    r = cursor.fetchone()
    report["grammarTotal"] = {"total": r[0], "published": r[1], "draft": r[2]}

    cursor.execute("SELECT HskLevel, COUNT(*) as Total, SUM(CASE WHEN Status='PUBLISHED' THEN 1 ELSE 0 END) as Pub FROM grammar_points GROUP BY HskLevel ORDER BY HskLevel")
    grammar_by_hsk = []
    for r in cursor.fetchall():
        grammar_by_hsk.append({
            "hskLevel": r[0],
            "total": r[1],
            "published": r[2]
        })
    report["grammarByHsk"] = grammar_by_hsk

    # Check grammar sources
    cursor.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='grammar_points'")
    g_cols = [c[0] for c in cursor.fetchall()]
    report["grammarColumns"] = g_cols

    cursor.execute("SELECT COUNT(*) FROM grammar_points WHERE Explanation IS NULL OR LEN(LTRIM(RTRIM(Explanation))) = 0")
    report["grammarMissingExplanation"] = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM grammar_points WHERE StructureFormula IS NULL OR LEN(LTRIM(RTRIM(StructureFormula))) = 0")
    report["grammarMissingStructureFormula"] = cursor.fetchone()[0]

    # 6. Hanzi Characters & Level Requirements
    cursor.execute("SELECT COUNT(*) FROM hanzi_characters")
    report["hanziCharactersTotal"] = cursor.fetchone()[0]

    cursor.execute("SELECT FirstHskLevel, COUNT(*) FROM hanzi_characters GROUP BY FirstHskLevel ORDER BY FirstHskLevel")
    hanzi_by_hsk = []
    for r in cursor.fetchall():
        hanzi_by_hsk.append({
            "firstHskLevel": r[0],
            "count": r[1]
        })
    report["hanziByHsk"] = hanzi_by_hsk

    cursor.execute("SELECT COUNT(*) FROM hanzi_level_requirements")
    report["hanziLevelRequirementsTotal"] = cursor.fetchone()[0]

    cursor.execute("SELECT HskLevel, COUNT(*), ISNULL(SourceDataset, 'NULL') FROM hanzi_level_requirements GROUP BY HskLevel, SourceDataset ORDER BY HskLevel")
    hanzi_reqs = []
    for r in cursor.fetchall():
        hanzi_reqs.append({
            "hskLevel": r[0],
            "count": r[1],
            "sourceDataset": r[2]
        })
    report["hanziLevelRequirements"] = hanzi_reqs

    # 7. Exercises
    cursor.execute("SELECT COUNT(*) as Total, SUM(CASE WHEN Status='PUBLISHED' THEN 1 ELSE 0 END) as Pub, SUM(CASE WHEN Status='DRAFT' THEN 1 ELSE 0 END) as Draft FROM exercises")
    r = cursor.fetchone()
    report["exercisesTotal"] = {"total": r[0], "published": r[1], "draft": r[2]}

    cursor.execute("SELECT HskLevel, COUNT(*) as Total, SUM(CASE WHEN Status='PUBLISHED' THEN 1 ELSE 0 END) as Pub FROM exercises GROUP BY HskLevel ORDER BY HskLevel")
    ex_by_hsk = []
    for r in cursor.fetchall():
        ex_by_hsk.append({
            "hskLevel": r[0],
            "total": r[1],
            "published": r[2]
        })
    report["exercisesByHsk"] = ex_by_hsk

    cursor.execute("SELECT Skill, COUNT(*) FROM exercises GROUP BY Skill ORDER BY COUNT(*) DESC")
    ex_by_skill = []
    for r in cursor.fetchall():
        ex_by_skill.append({
            "skill": r[0],
            "count": r[1]
        })
    report["exercisesBySkill"] = ex_by_skill

    # 8. Check Users (integrity check - should be exactly 39)
    cursor.execute("SELECT COUNT(*) FROM users")
    report["usersCount"] = cursor.fetchone()[0]

    with open('data/hsk30/reference/current_db_inventory.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print("AUDIT COMPLETE. Saved to data/hsk30/reference/current_db_inventory.json")

if __name__ == '__main__':
    run_read_only_audit()
