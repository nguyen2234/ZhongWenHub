import pyodbc

DEV_CONN_STR = (
    r"Driver={ODBC Driver 17 for SQL Server};"
    r"Server=.\SQLEXPRESS;"
    r"Database=ZhongWenHub_Dev;"
    r"Trusted_Connection=yes;"
)

def verify_dev():
    conn = pyodbc.connect(DEV_CONN_STR)
    cur = conn.cursor()
    print("=== ZHONGWENHUB_DEV POST-DEPLOYMENT VERIFICATION ===")

    # 1. Migrations
    cur.execute("SELECT MigrationId FROM __EFMigrationsHistory ORDER BY MigrationId")
    migs = [r[0] for r in cur.fetchall()]
    print(f"\n[1] Migrations in Dev ({len(migs)}):")
    for m in migs:
        print(f"  - {m}")
    assert len(migs) == 10
    assert migs[-1] == "20261106004600_AddContentReviewAndHanziFields"

    # 2. Columns verification
    print("\n[2] Checking newly added columns:")
    cur.execute("""
        SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE (TABLE_NAME = 'vocabularies' AND COLUMN_NAME IN ('UpdatedByUserId', 'ReviewedByUserId', 'ReviewedAt', 'ReviewNotes'))
           OR (TABLE_NAME = 'grammar_points' AND COLUMN_NAME IN ('UpdatedByUserId', 'ReviewedByUserId', 'ReviewedAt', 'ReviewNotes'))
           OR (TABLE_NAME = 'hanzi_characters' AND COLUMN_NAME = 'MeaningVi')
        ORDER BY TABLE_NAME, COLUMN_NAME
    """)
    new_cols = cur.fetchall()
    for c in new_cols:
        print(f"  - {c[0]}.{c[1]}: Type={c[2]}, MaxLen={c[3]}, Nullable={c[4]}")
    assert len(new_cols) == 9, f"Expected 9 new columns, got {len(new_cols)}"

    # 3. Check 300 HSK 1 words
    print("\n[3] Checking 300 HSK 1 words:")
    cur.execute("SELECT COUNT(*) FROM vocabularies WHERE HskLevel = 1")
    hsk1_total = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM vocabularies WHERE HskLevel = 1 AND Status = 'PUBLISHED'")
    hsk1_pub = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM vocabularies WHERE HskLevel = 1 AND Status = 'DRAFT'")
    hsk1_draft = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM vocabularies WHERE HskLevel = 1 AND (MeaningVi IS NULL OR LEN(LTRIM(RTRIM(MeaningVi))) = 0)")
    hsk1_missing_meaning = cur.fetchone()[0]

    print(f"  Total HSK 1: {hsk1_total} (Published: {hsk1_pub}, Draft: {hsk1_draft}, Missing Meaning: {hsk1_missing_meaning})")
    assert hsk1_total == 300
    assert hsk1_pub == 10
    assert hsk1_draft == 290
    assert hsk1_missing_meaning == 0

    # 4. Check 5.100 HSK 2-6 words
    print("\n[4] Checking 5.100 HSK 2-6 words:")
    cur.execute("SELECT COUNT(*) FROM vocabularies WHERE HskLevel >= 2")
    hsk2_6_total = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM vocabularies WHERE HskLevel >= 2 AND Status = 'DRAFT'")
    hsk2_6_draft = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM vocabularies WHERE HskLevel >= 2 AND Status = 'PUBLISHED'")
    hsk2_6_pub = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM vocabularies WHERE HskLevel >= 2 AND (MeaningVi IS NULL OR MeaningVi = '')")
    hsk2_6_empty_meaning = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM vocabularies WHERE HskLevel >= 2 AND SuggestedMeaningVi IS NOT NULL AND LEN(LTRIM(RTRIM(SuggestedMeaningVi))) > 0")
    hsk2_6_sugg = cur.fetchone()[0]

    print(f"  Total HSK 2-6: {hsk2_6_total} (Draft: {hsk2_6_draft}, Published: {hsk2_6_pub}, Empty MeaningVi: {hsk2_6_empty_meaning}, SuggestedMeaningVi: {hsk2_6_sugg})")
    assert hsk2_6_total == 5100
    assert hsk2_6_draft == 5100
    assert hsk2_6_pub == 0
    assert hsk2_6_empty_meaning == 5100
    assert hsk2_6_sugg == 5098

    # 5. Check 461 Grammar Points
    print("\n[5] Checking 461 Grammar Points:")
    cur.execute("SELECT COUNT(*) FROM grammar_points")
    gp_total = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM grammar_points WHERE Status = 'PUBLISHED'")
    gp_pub = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM grammar_points WHERE Status = 'DRAFT'")
    gp_draft = cur.fetchone()[0]
    print(f"  Total Grammar: {gp_total} (Published: {gp_pub}, Draft: {gp_draft})")
    assert gp_total == 461
    assert gp_pub == 2
    assert gp_draft == 459

    # 6. Check Hanzi
    print("\n[6] Checking Hanzi Characters & Requirements:")
    cur.execute("SELECT COUNT(*) FROM hanzi_characters")
    hanzi_cnt = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM hanzi_level_requirements")
    req_cnt = cur.fetchone()[0]
    print(f"  Unique Characters: {hanzi_cnt}, Level Requirements: {req_cnt}")
    assert hanzi_cnt == 1940
    assert req_cnt == 2640

    # 7. Check Core System Tables
    print("\n[7] Checking Core System Tables:")
    tables = [
        ("users", 23),
        ("user_wallets", 10),
        ("wallet_transactions", 16),
        ("user_subscriptions", 10),
        ("courses", 6),
        ("lessons", 4),
        ("student_lesson_progress", 2)
    ]
    for tbl, expected in tables:
        cur.execute(f"SELECT COUNT(*) FROM {tbl}")
        actual = cur.fetchone()[0]
        print(f"  Table '{tbl}': {actual} (Expected: {expected})")
        assert actual == expected, f"Mismatch in {tbl}: actual {actual} != expected {expected}"

    # 8. Check Orphan Foreign Keys & Duplicates
    print("\n[8] Checking Integrity & Constraints:")
    cur.execute("""
        SELECT COUNT(*)
        FROM hanzi_level_requirements r
        LEFT JOIN hanzi_characters c ON r.CharacterId = c.Id
        WHERE c.Id IS NULL
    """)
    orphan_req = cur.fetchone()[0]
    print(f"  Orphan Hanzi Requirements: {orphan_req}")
    assert orphan_req == 0

    cur.execute("""
        SELECT HskLevel, Hanzi, Pinyin, Homograph, COUNT(*)
        FROM vocabularies
        GROUP BY HskLevel, Hanzi, Pinyin, Homograph
        HAVING COUNT(*) > 1
    """)
    dup_voc = cur.fetchall()
    print(f"  Duplicate Vocabularies: {len(dup_voc)}")
    assert len(dup_voc) == 0

    conn.close()
    print("\n>>> ALL VERIFICATION CHECKS PASSED 100%! ZHONGWENHUB_DEV IS HEALTHY AND CERTIFIED! <<<")

if __name__ == "__main__":
    verify_dev()
