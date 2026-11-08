import pyodbc
import sys

def apply_migration():
    conn_str = (
        r"Driver={ODBC Driver 17 for SQL Server};"
        r"Server=.\SQLEXPRESS;"
        r"Database=ZhongWenHub_Test;"
        r"Trusted_Connection=yes;"
    )

    print("Connecting to ZhongWenHub_Test...")
    conn = pyodbc.connect(conn_str, autocommit=False)
    cursor = conn.cursor()

    # Double check database name
    cursor.execute("SELECT DB_NAME()")
    db_name = cursor.fetchone()[0]
    print(f"Current connected database: {db_name}")
    if db_name != "ZhongWenHub_Test":
        print(f"ABORT: Unexpected database {db_name}")
        conn.close()
        sys.exit(1)

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
        "IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20261106004600_AddContentReviewAndHanziFields') INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20261106004600_AddContentReviewAndHanziFields', '8.0.11');"
    ]

    try:
        for stmt in ddl_statements:
            print(f"Executing: {stmt[:60]}...")
            cursor.execute(stmt)
            while cursor.nextset():
                pass

        conn.commit()
        print("Migration applied successfully to ZhongWenHub_Test.")

        # Read-back verification
        cursor.execute("SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'vocabularies' AND COLUMN_NAME IN ('UpdatedByUserId', 'ReviewedByUserId', 'ReviewedAt', 'ReviewNotes')")
        print("Vocabularies columns:", cursor.fetchall())

        cursor.execute("SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'grammar_points' AND COLUMN_NAME IN ('UpdatedByUserId', 'ReviewedByUserId', 'ReviewedAt', 'ReviewNotes')")
        print("GrammarPoints columns:", cursor.fetchall())

        cursor.execute("SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'hanzi_characters' AND COLUMN_NAME = 'MeaningVi'")
        print("HanziCharacters columns:", cursor.fetchall())

        cursor.execute("SELECT MigrationId FROM __EFMigrationsHistory ORDER BY MigrationId")
        print("Migrations history in Test:", [r[0] for r in cursor.fetchall()])

    except Exception as e:
        conn.rollback()
        print(f"ERROR: {e}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    apply_migration()
