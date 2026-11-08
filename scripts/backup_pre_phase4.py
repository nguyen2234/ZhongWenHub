import pyodbc

conn = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=master;Trusted_Connection=yes;', autocommit=True)
cur = conn.cursor()
bak_path = r'D:\ZhongWenHub-Backups\ZhongWenHub_Dev_PrePhase4.bak'
print('Starting backup to:', bak_path)
cur.execute("BACKUP DATABASE [ZhongWenHub_Dev] TO DISK = ? WITH FORMAT, INIT, NAME = N'ZhongWenHub_Dev Phase 4 Pre-Change Backup'", (bak_path,))
print('Backup completed.')

cur.execute("RESTORE VERIFYONLY FROM DISK = ?", (bak_path,))
print('RESTORE VERIFYONLY verified successfully.')
conn.close()
