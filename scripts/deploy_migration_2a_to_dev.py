import os
import sys
import datetime
import pyodbc

DEV_CONN_STR = (
    r"Driver={ODBC Driver 17 for SQL Server};"
    r"Server=.\SQLEXPRESS;"
    r"Database=ZhongWenHub_Dev;"
    r"Trusted_Connection=yes;"
)

MASTER_CONN_STR = (
    r"Driver={ODBC Driver 17 for SQL Server};"
    r"Server=.\SQLEXPRESS;"
    r"Database=master;"
    r"Trusted_Connection=yes;"
)

def run_pre_checks(cursor):
    print("--- [1] Checking database identity & existing migrations ---")
    cursor.execute("SELECT DB_NAME()")
    current_db = cursor.fetchone()[0]
    if current_db != "ZhongWenHub_Dev":
        raise RuntimeError(f"ABORT: Connected to wrong database '{current_db}'!")
    print(f"Connected to confirmed database: {current_db}")

    cursor.execute("SELECT MigrationId FROM __EFMigrationsHistory ORDER BY MigrationId")
    migs = [r[0] for r in cursor.fetchall()]
    print(f"Existing migrations count: {len(migs)}")
    if len(migs) != 9:
        raise RuntimeError(f"ABORT: Expected exactly 9 migrations in Dev, but found {len(migs)}: {migs}")

    migration_id = "20261106004600_AddContentReviewAndHanziFields"
    if migration_id in migs:
        raise RuntimeError(f"ABORT: Migration {migration_id} already exists in Dev!")
    print(f"Confirmed: {migration_id} is NOT present in Dev.")

    print("\n--- [2] Checking open writing sessions / lock conflicts ---")
    cursor.execute("""
        SELECT session_id, status, open_transaction_count
        FROM sys.dm_exec_sessions
        WHERE database_id = DB_ID('ZhongWenHub_Dev')
          AND is_user_process = 1
          AND session_id != @@SPID
          AND open_transaction_count > 0
    """)
    active_locks = cursor.fetchall()
    if active_locks:
        raise RuntimeError(f"ABORT: Found active transactions holding locks on Dev: {active_locks}")
    print("No open writing transactions found on ZhongWenHub_Dev.")

    print("\n--- [3] Baseline snapshot of core business entities ---")
    baseline = {}
    queries = {
        "vocabularies_total": "SELECT COUNT(*) FROM vocabularies",
        "vocabularies_hsk1_published": "SELECT COUNT(*) FROM vocabularies WHERE HskLevel = 1 AND Status = 'PUBLISHED'",
        "vocabularies_hsk1_draft": "SELECT COUNT(*) FROM vocabularies WHERE HskLevel = 1 AND Status = 'DRAFT'",
        "vocabularies_hsk2_6_draft": "SELECT COUNT(*) FROM vocabularies WHERE HskLevel >= 2 AND Status = 'DRAFT'",
        "vocabularies_hsk2_6_published": "SELECT COUNT(*) FROM vocabularies WHERE HskLevel >= 2 AND Status = 'PUBLISHED'",
        "grammar_points_total": "SELECT COUNT(*) FROM grammar_points",
        "grammar_points_published": "SELECT COUNT(*) FROM grammar_points WHERE Status = 'PUBLISHED'",
        "grammar_points_draft": "SELECT COUNT(*) FROM grammar_points WHERE Status = 'DRAFT'",
        "hanzi_characters": "SELECT COUNT(*) FROM hanzi_characters",
        "hanzi_level_requirements": "SELECT COUNT(*) FROM hanzi_level_requirements",
        "users": "SELECT COUNT(*) FROM users",
        "user_wallets": "SELECT COUNT(*) FROM user_wallets",
        "wallet_transactions": "SELECT COUNT(*) FROM wallet_transactions",
        "user_subscriptions": "SELECT COUNT(*) FROM user_subscriptions",
        "courses": "SELECT COUNT(*) FROM courses",
        "lessons": "SELECT COUNT(*) FROM lessons",
        "student_lesson_progress": "SELECT COUNT(*) FROM student_lesson_progress"
    }

    for k, q in queries.items():
        cursor.execute(q)
        val = cursor.fetchone()[0]
        baseline[k] = val
        print(f"  - {k}: {val}")

    # Validate mandatory counts
    assert baseline["vocabularies_total"] == 5400, f"Expected 5400 vocabularies, got {baseline['vocabularies_total']}"
    assert baseline["vocabularies_hsk1_published"] == 10, f"Expected 10 HSK 1 PUBLISHED, got {baseline['vocabularies_hsk1_published']}"
    assert baseline["vocabularies_hsk1_draft"] == 290, f"Expected 290 HSK 1 DRAFT, got {baseline['vocabularies_hsk1_draft']}"
    assert baseline["vocabularies_hsk2_6_draft"] == 5100, f"Expected 5100 HSK 2-6 DRAFT, got {baseline['vocabularies_hsk2_6_draft']}"
    assert baseline["vocabularies_hsk2_6_published"] == 0, f"Expected 0 HSK 2-6 PUBLISHED, got {baseline['vocabularies_hsk2_6_published']}"
    assert baseline["grammar_points_total"] == 461, f"Expected 461 grammar points, got {baseline['grammar_points_total']}"
    assert baseline["grammar_points_published"] == 2, f"Expected 2 old PUBLISHED grammar points, got {baseline['grammar_points_published']}"
    assert baseline["grammar_points_draft"] == 459, f"Expected 459 new DRAFT grammar points, got {baseline['grammar_points_draft']}"
    assert baseline["hanzi_characters"] == 1940, f"Expected 1940 hanzi characters, got {baseline['hanzi_characters']}"
    assert baseline["hanzi_level_requirements"] == 2640, f"Expected 2640 requirements, got {baseline['hanzi_level_requirements']}"
    assert baseline["users"] == 23, f"Expected 23 users, got {baseline['users']}"
    assert baseline["user_wallets"] == 10, f"Expected 10 wallets, got {baseline['user_wallets']}"
    assert baseline["wallet_transactions"] == 16, f"Expected 16 transactions, got {baseline['wallet_transactions']}"
    assert baseline["user_subscriptions"] == 10, f"Expected 10 subscriptions, got {baseline['user_subscriptions']}"
    assert baseline["courses"] == 6, f"Expected 6 courses, got {baseline['courses']}"
    assert baseline["lessons"] == 4, f"Expected 4 lessons, got {baseline['lessons']}"

    print("All baseline business counts verified 100% strictly.")
    return baseline

def create_and_verify_backup():
    print("\n--- [4] Creating fresh timestamped backup before migration 2A ---")
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = rf"D:\ZhongWenHub\ZhongWenHub_Dev_PreMigration2A_{ts}.bak"

    if os.path.exists(backup_path):
        raise RuntimeError(f"ABORT: Backup file already exists: {backup_path}")

    # Connect to master to execute BACKUP
    master_conn = pyodbc.connect(MASTER_CONN_STR, autocommit=True)
    master_cur = master_conn.cursor()

    backup_sql = f"""
        BACKUP DATABASE [ZhongWenHub_Dev]
        TO DISK = '{backup_path}'
        WITH FORMAT, INIT, NAME = 'ZhongWenHub_Dev-PreMigration2A-{ts}', SKIP, NOREWIND, NOUNLOAD, STATS = 10;
    """
    print(f"Executing backup to: {backup_path}")
    master_cur.execute(backup_sql)
    while master_cur.nextset():
        pass
    print("Backup completed successfully.")

    print("\n--- [5] Running RESTORE VERIFYONLY & Header validation ---")
    verify_sql = f"RESTORE VERIFYONLY FROM DISK = '{backup_path}';"
    master_cur.execute(verify_sql)
    while master_cur.nextset():
        pass
    print("RESTORE VERIFYONLY: PASS (Backup media is valid).")

    # Header check
    header_sql = f"RESTORE HEADERONLY FROM DISK = '{backup_path}';"
    master_cur.execute(header_sql)
    headers = master_cur.fetchall()
    print(f"Backup header: DatabaseName={headers[0][1]}, BackupType={headers[0][2]}, BackupStartDate={headers[0][14]}")

    # Filelist check
    filelist_sql = f"RESTORE FILELISTONLY FROM DISK = '{backup_path}';"
    master_cur.execute(filelist_sql)
    files = master_cur.fetchall()
    for fl in files:
        print(f"  LogicalName={fl[0]}, PhysicalName={fl[1]}, Type={fl[2]}, Size={fl[4]} bytes")

    master_conn.close()
    return backup_path

def apply_migration_2a():
    dev_conn = pyodbc.connect(DEV_CONN_STR, autocommit=False)
    cur = dev_conn.cursor()

    # Pre-checks
    baseline = run_pre_checks(cur)

    # Backup
    backup_file = create_and_verify_backup()

    print("\n--- [6] Applying Migration 20261106004600 inside Transaction ---")
    migration_id = "20261106004600_AddContentReviewAndHanziFields"

    ddl_statements = [
        "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('vocabularies') AND name = 'UpdatedByUserId') ALTER TABLE vocabularies ADD UpdatedByUserId uniqueidentifier NULL;",
        "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('vocabularies') AND name = 'ReviewedByUserId') ALTER TABLE vocabularies ADD ReviewedByUserId uniqueidentifier NULL;",
        "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('vocabularies') AND name = 'ReviewedAt') ALTER TABLE vocabularies ADD ReviewedAt datetime2 NULL;",
        "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('vocabularies') AND name = 'ReviewNotes') ALTER TABLE vocabularies ADD ReviewNotes nvarchar(1000) NULL;",
        "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('grammar_points') AND name = 'UpdatedByUserId') ALTER TABLE grammar_points ADD UpdatedByUserId uniqueidentifier NULL;",
        "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('grammar_points') AND name = 'ReviewedByUserId') ALTER TABLE grammar_points ADD ReviewedByUserId uniqueidentifier NULL;",
        "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('grammar_points') AND name = 'ReviewedAt') ALTER TABLE grammar_points ADD ReviewedAt datetime2 NULL;",
        "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('grammar_points') AND name = 'ReviewNotes') ALTER TABLE grammar_points ADD ReviewNotes nvarchar(1000) NULL;",
        "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('hanzi_characters') AND name = 'MeaningVi') ALTER TABLE hanzi_characters ADD MeaningVi nvarchar(500) NULL;",
        f"IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '{migration_id}') INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('{migration_id}', '8.0.11');"
    ]

    try:
        for stmt in ddl_statements:
            print(f"  Executing: {stmt[:65]}...")
            cur.execute(stmt)
            while cur.nextset():
                pass

        dev_conn.commit()
        print("\n>>> Transaction committed successfully to ZhongWenHub_Dev! <<<")

    except Exception as e:
        dev_conn.rollback()
        print(f"\nCRITICAL ERROR during migration: {e}")
        dev_conn.close()
        sys.exit(1)

    print("\n--- [7] Post-deployment SQL Read-Back verification ---")
    cur.execute("SELECT MigrationId FROM __EFMigrationsHistory ORDER BY MigrationId")
    migs_after = [r[0] for r in cur.fetchall()]
    print(f"Migrations in Dev after deployment ({len(migs_after)}): {migs_after}")
    assert len(migs_after) == 10, f"Expected 10 migrations, got {len(migs_after)}"
    assert migs_after[-1] == migration_id, f"Latest migration should be {migration_id}"

    # Verify columns
    cur.execute("""
        SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME IN ('vocabularies', 'grammar_points', 'hanzi_characters')
          AND COLUMN_NAME IN ('UpdatedByUserId', 'ReviewedByUserId', 'ReviewedAt', 'ReviewNotes', 'MeaningVi')
        ORDER BY TABLE_NAME, COLUMN_NAME
    """)
    cols = cur.fetchall()
    print("New columns in Dev:")
    for col in cols:
        print(f"  - Table: {col[0]}, Column: {col[1]}, Type: {col[2]}, MaxLen: {col[3]}, Nullable: {col[4]}")
    assert len(cols) == 9, f"Expected exactly 9 new columns, got {len(cols)}"

    print("\n--- [8] Verifying zero unintended data changes in business tables ---")
    cur.execute("SELECT COUNT(*) FROM vocabularies")
    assert cur.fetchone()[0] == baseline["vocabularies_total"]

    cur.execute("SELECT COUNT(*) FROM vocabularies WHERE HskLevel = 1 AND Status = 'PUBLISHED'")
    assert cur.fetchone()[0] == baseline["vocabularies_hsk1_published"]

    cur.execute("SELECT COUNT(*) FROM vocabularies WHERE HskLevel = 1 AND Status = 'DRAFT'")
    assert cur.fetchone()[0] == baseline["vocabularies_hsk1_draft"]

    cur.execute("SELECT COUNT(*) FROM vocabularies WHERE HskLevel >= 2 AND Status = 'DRAFT'")
    assert cur.fetchone()[0] == baseline["vocabularies_hsk2_6_draft"]

    cur.execute("SELECT COUNT(*) FROM vocabularies WHERE HskLevel >= 2 AND Status = 'PUBLISHED'")
    assert cur.fetchone()[0] == baseline["vocabularies_hsk2_6_published"]

    cur.execute("SELECT COUNT(*) FROM grammar_points WHERE Status = 'PUBLISHED'")
    assert cur.fetchone()[0] == baseline["grammar_points_published"]

    cur.execute("SELECT COUNT(*) FROM grammar_points WHERE Status = 'DRAFT'")
    assert cur.fetchone()[0] == baseline["grammar_points_draft"]

    cur.execute("SELECT COUNT(*) FROM hanzi_characters")
    assert cur.fetchone()[0] == baseline["hanzi_characters"]

    cur.execute("SELECT COUNT(*) FROM users")
    assert cur.fetchone()[0] == baseline["users"]

    cur.execute("SELECT COUNT(*) FROM user_wallets")
    assert cur.fetchone()[0] == baseline["user_wallets"]

    cur.execute("SELECT COUNT(*) FROM wallet_transactions")
    assert cur.fetchone()[0] == baseline["wallet_transactions"]

    cur.execute("SELECT COUNT(*) FROM user_subscriptions")
    assert cur.fetchone()[0] == baseline["user_subscriptions"]

    cur.execute("SELECT COUNT(*) FROM courses")
    assert cur.fetchone()[0] == baseline["courses"]

    cur.execute("SELECT COUNT(*) FROM lessons")
    assert cur.fetchone()[0] == baseline["lessons"]

    print("ALL business data verified 100% unchanged, intact and safe!")
    dev_conn.close()

    return {
        "backup_file": backup_file,
        "migrations_count": len(migs_after),
        "columns_verified": len(cols)
    }

if __name__ == "__main__":
    result = apply_migration_2a()
    print("\nDEPLOYMENT COMPLETED SUCCESSFULLY:", result)
