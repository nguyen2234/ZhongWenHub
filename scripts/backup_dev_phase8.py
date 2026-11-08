import pyodbc
import os
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

conn = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=master;Trusted_Connection=yes;', autocommit=True)
cursor = conn.cursor()

backup_path = r"D:\ZhongWenHub-Backups\ZhongWenHub_Dev_PrePhase8.bak"

print(f"Starting backup of ZhongWenHub_Dev to: {backup_path}")
sql_backup = f"BACKUP DATABASE [ZhongWenHub_Dev] TO DISK = N'{backup_path}' WITH FORMAT, INIT, NAME = N'ZhongWenHub_Dev Phase 8 Pre-Remediation Backup'"
cursor.execute(sql_backup)
print("Backup completed successfully.")

print("Running RESTORE VERIFYONLY...")
sql_verify = f"RESTORE VERIFYONLY FROM DISK = N'{backup_path}'"
cursor.execute(sql_verify)
print("RESTORE VERIFYONLY verified successfully: The backup set is valid and verifiable.")

if os.path.exists(backup_path):
    sz = os.path.getsize(backup_path)
    print(f"Verified physical backup file: {backup_path} ({sz:,} bytes)")

conn.close()
