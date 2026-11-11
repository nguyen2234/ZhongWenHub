"""
Database Snapshot and Rollback Utility for ZhongWenHub_Test.
Safeguards:
- Verifies DB_NAME() == 'ZhongWenHub_Test'
- Strictly blocks any connection to ZhongWenHub_Dev
- Captures full row-level pre-import state of vocabularies, grammar_points, and lessons
- Provides actual transactional rollback execution
"""

import os
import sys
import json
import argparse
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STAGING_DIR = os.path.join(BASE_DIR, "data", "hsk20", "staging")
SNAPSHOT_FILE = os.path.join(STAGING_DIR, "pre_import_test_db_snapshot.json")
APPROVAL_TOKEN_FILE = os.path.join(STAGING_DIR, "USER_APPROVAL_TOKEN.signed")

class SecurityException(Exception):
    pass

def validate_target_db_name(target_db):
    if target_db == "ZhongWenHub_Dev":
        raise SecurityException("CRITICAL VIOLATION: 'ZhongWenHub_Dev' is STRICTLY READ-ONLY! Immediate abort.")
    if target_db != "ZhongWenHub_Test" and not target_db.startswith("ZhongWenHub_Ephemeral_"):
        raise SecurityException(
            f"Target DB mismatch: Only 'ZhongWenHub_Test' or 'ZhongWenHub_Ephemeral_*' allowed, got '{target_db}'!"
        )


def connect_to_verified_test_db(target_db="ZhongWenHub_Test"):
    validate_target_db_name(target_db)
    import pyodbc
    conn_str = f"Driver={{ODBC Driver 17 for SQL Server}};Server=.\\SQLEXPRESS;Database={target_db};Trusted_Connection=yes;TrustServerCertificate=yes;Timeout=5;"
    try:
        conn = pyodbc.connect(conn_str, autocommit=False)
    except Exception as e:
        raise ConnectionError(f"Could not connect to {target_db}: {e}")

    cursor = conn.cursor()
    cursor.execute("SELECT DB_NAME()")
    current_db = cursor.fetchone()[0]

    if current_db == "ZhongWenHub_Dev":
        conn.close()
        raise SecurityException("CRITICAL VIOLATION: Connected to read-only 'ZhongWenHub_Dev'! Immediate abort.")

    if current_db != target_db:
        conn.close()
        raise SecurityException(f"Target DB mismatch: Expected '{target_db}', but connected to '{current_db}'!")

    return conn, cursor

def create_snapshot(target_db="ZhongWenHub_Test", snapshot_file=SNAPSHOT_FILE):
    print(f"=== Creating Pre-Import Record-Level Snapshot for {target_db} ===")
    conn, cursor = connect_to_verified_test_db(target_db)
    try:
        print(f"Connected to verified database: {target_db}")

        # 1. Fetch vocabularies
        cursor.execute("SELECT Id, HskLevel, Hanzi, Pinyin, MeaningVi, PartOfSpeech, LessonId, Status FROM vocabularies")
        vocab_rows = []
        for r in cursor.fetchall():
            vocab_rows.append({
                "id": str(r[0]),
                "hskLevel": r[1],
                "hanzi": r[2],
                "pinyin": r[3],
                "meaningVi": r[4],
                "partOfSpeech": r[5],
                "lessonId": str(r[6]) if r[6] else None,
                "status": r[7]
            })

        # 2. Fetch grammar points
        cursor.execute("SELECT Id, Code, Title, HskLevel, StructureFormula, Explanation, LessonId, Status FROM grammar_points")
        grammar_rows = []
        for r in cursor.fetchall():
            grammar_rows.append({
                "id": str(r[0]),
                "code": r[1],
                "title": r[2],
                "hskLevel": r[3],
                "structureFormula": r[4],
                "explanation": r[5],
                "lessonId": str(r[6]) if r[6] else None,
                "status": r[7]
            })

        # 3. Fetch lessons
        cursor.execute("SELECT Id, LessonNumber, TitleZh, TitleVi, Pinyin, Summary, Status, DialogueJson, ListeningJson FROM lessons")
        lesson_rows = []
        for r in cursor.fetchall():
            lesson_rows.append({
                "id": str(r[0]),
                "lessonNumber": r[1],
                "titleZh": r[2],
                "titleVi": r[3],
                "pinyin": r[4],
                "summary": r[5],
                "status": r[6],
                "dialogueJson": r[7],
                "listeningJson": r[8]
            })
    finally:
        conn.close()

    if not vocab_rows or not grammar_rows or not lesson_rows:
        raise RuntimeError(
            f"Refusing incomplete snapshot: vocabularies={len(vocab_rows)}, grammarPoints={len(grammar_rows)}, lessons={len(lesson_rows)}"
        )

    snapshot = {
        "database": target_db,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "LIVE_DB_RECORD_LEVEL_SNAPSHOT",
        "counts": {
            "vocabularies": len(vocab_rows),
            "grammarPoints": len(grammar_rows),
            "lessons": len(lesson_rows)
        },
        "vocabularies": vocab_rows,
        "grammarPoints": grammar_rows,
        "lessons": lesson_rows
    }

    os.makedirs(os.path.dirname(os.path.abspath(snapshot_file)), exist_ok=True)
    with open(snapshot_file, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, indent=2, ensure_ascii=False)
    print(f"Snapshot successfully saved: {snapshot_file}")
    print(f"Captured: {snapshot['counts']['vocabularies']} vocabularies, {snapshot['counts']['grammarPoints']} grammar points, {snapshot['counts']['lessons']} lessons.")

def verify_snapshot_payload(snap):
    if snap.get("status") != "LIVE_DB_RECORD_LEVEL_SNAPSHOT":
        return False
    return (
        len(snap.get("vocabularies", [])) > 0
        and len(snap.get("grammarPoints", [])) > 0
        and len(snap.get("lessons", [])) > 0
    )

def verify_rollback(snapshot_file=SNAPSHOT_FILE):
    print("=== Verifying Rollback Snapshot Integrity ===")
    if not os.path.exists(snapshot_file):
        print(f"[ERROR] Snapshot file does not exist: {snapshot_file}")
        return False
    with open(snapshot_file, "r", encoding="utf-8") as f:
        snap = json.load(f)
    print(f"Snapshot verified: DB={snap.get('database')}, timestamp={snap.get('timestamp')}")
    print(f"Stored counts: {snap.get('counts')}")
    has_records = verify_snapshot_payload(snap)
    print(f"Contains complete recoverable records: {has_records}")
    return has_records

def execute_rollback(target_db="ZhongWenHub_Test", snapshot_file=SNAPSHOT_FILE):
    print(f"=== Executing Rollback on {target_db} ===")
    if not os.path.exists(snapshot_file):
        raise FileNotFoundError(f"Snapshot file not found: {snapshot_file}")

    with open(snapshot_file, "r", encoding="utf-8") as f:
        snap = json.load(f)

    if not verify_snapshot_payload(snap):
        raise ValueError("Snapshot file does not contain recoverable record-level arrays. Aborting rollback.")

    if snap.get("database") != target_db:
        raise SecurityException(f"Snapshot targets '{snap.get('database')}', cannot rollback to '{target_db}'!")

    conn, cursor = connect_to_verified_test_db(target_db)
    try:
        print(f"Restoring {len(snap['vocabularies'])} vocabularies, {len(snap['grammarPoints'])} grammar points, and {len(snap['lessons'])} lessons...")

        for v in snap["vocabularies"]:
            cursor.execute("""
                UPDATE vocabularies
                SET Pinyin = ?, MeaningVi = ?, PartOfSpeech = ?, LessonId = ?, Status = ?
                WHERE Id = ?
            """, (v["pinyin"], v["meaningVi"], v.get("partOfSpeech", ""), v.get("lessonId"), v.get("status", "PUBLISHED"), v["id"]))

        for g in snap["grammarPoints"]:
            cursor.execute("""
                UPDATE grammar_points
                SET Code = ?, Title = ?, StructureFormula = ?, Explanation = ?, LessonId = ?, Status = ?
                WHERE Id = ?
            """, (g["code"], g["title"], g["structureFormula"], g["explanation"], g.get("lessonId"), g.get("status", "PUBLISHED"), g["id"]))

        for l in snap["lessons"]:
            cursor.execute("""
                UPDATE lessons
                SET TitleZh = ?, TitleVi = ?, Pinyin = ?, Summary = ?, Status = ?, DialogueJson = ?, ListeningJson = ?
                WHERE Id = ?
            """, (l["titleZh"], l["titleVi"], l.get("pinyin"), l.get("summary"), l.get("status", "DRAFT"), l.get("dialogueJson"), l.get("listeningJson"), l["id"]))

        conn.commit()
        print("Rollback transaction successfully committed.")
    except Exception as e:
        conn.rollback()
        print(f"Rollback failed and was aborted: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ZhongWenHub DB Snapshot and Rollback")
    parser.add_argument("--snapshot", action="store_true", help="Create full record snapshot")
    parser.add_argument("--verify", action="store_true", help="Verify rollback snapshot integrity")
    parser.add_argument("--rollback", action="store_true", help="Execute rollback to snapshot state")
    parser.add_argument("--target", default="ZhongWenHub_Test", help="Target database (ZhongWenHub_Test or ZhongWenHub_Ephemeral_*)")
    parser.add_argument("--file", default=SNAPSHOT_FILE, help="Snapshot JSON file path")
    args = parser.parse_args()

    if args.rollback:
        execute_rollback(args.target, args.file)
    elif args.verify:
        sys.exit(0 if verify_rollback(args.file) else 1)
    else:
        create_snapshot(args.target, args.file)
