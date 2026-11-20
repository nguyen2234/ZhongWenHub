"""Controlled Bulk Administrative Approval & Rollback utility for ZhongWenHub HSK 1-4 Question Bank.

This script records a project-owner administrative approval decision for unpublished active HSK 1-4
questions WITHOUT auto-publishing them (Status remains DRAFT) and WITHOUT creating or faking
human academic sign-offs (HumanAcademicReviewStatus remains PENDING_HUMAN_REVIEW; ReviewStatus
remains unchanged).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from typing import Any

import pyodbc

SERVER = r".\SQLEXPRESS"
ADMIN_SCOPE = "BULK_HSK14_PROJECT_OWNER_ADMIN_APPROVAL"
BASELINE_SCOPE = "ORIGINAL_PUBLISHED_BASELINE"
ADMIN_SOURCE = "PROJECT_OWNER_BULK_ADMIN_DECISION"
ADMIN_NOTES = (
    "Project owner bulk administrative approval for 4,663 unpublished HSK 1-4 questions. "
    "Status remains DRAFT; human academic review still pending."
)
BASELINE_NOTES = (
    "Original published baseline question already approved and published prior to bulk administrative approval."
)


def connect_db(database: str) -> pyodbc.Connection:
    return pyodbc.connect(
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={SERVER};"
        f"DATABASE={database};"
        f"Trusted_Connection=yes;",
        autocommit=False,
    )


def get_summary(cur: pyodbc.Cursor) -> dict[str, Any]:
    cur.execute(
        """
        SELECT
            COUNT(*) AS active_hsk14,
            SUM(CASE WHEN AdministrativeApprovalStatus = 'APPROVED' THEN 1 ELSE 0 END) AS admin_approved,
            SUM(CASE WHEN AdministrativeApprovalStatus <> 'APPROVED' THEN 1 ELSE 0 END) AS admin_unapproved,
            SUM(CASE WHEN Status = 'PUBLISHED' AND ReviewStatus = 'APPROVED' THEN 1 ELSE 0 END) AS published_approved,
            SUM(CASE WHEN Status = 'PUBLISHED' THEN 1 ELSE 0 END) AS published_any,
            SUM(CASE WHEN Status = 'DRAFT' AND AdministrativeApprovalStatus = 'APPROVED' THEN 1 ELSE 0 END) AS draft_admin_approved,
            SUM(CASE WHEN HumanAcademicReviewStatus = 'PENDING_HUMAN_REVIEW' THEN 1 ELSE 0 END) AS pending_human,
            SUM(CASE WHEN HumanAcademicReviewStatus = 'APPROVED_BASELINE' THEN 1 ELSE 0 END) AS baseline_human
        FROM exercises
        WHERE HskLevel BETWEEN 1 AND 4 AND Status <> 'ARCHIVED' AND ReviewStatus <> 'REJECTED'
        """
    )
    row = cur.fetchone()

    cur.execute(
        """
        SELECT HskLevel, COUNT(*)
        FROM exercises
        WHERE HskLevel BETWEEN 1 AND 4 AND Status <> 'ARCHIVED' AND ReviewStatus <> 'REJECTED'
        GROUP BY HskLevel
        ORDER BY HskLevel
        """
    )
    by_hsk = {int(r[0]): int(r[1]) for r in cur.fetchall()}

    cur.execute(
        """
        SELECT ReviewStatus, COUNT(*)
        FROM exercises
        WHERE HskLevel BETWEEN 1 AND 4 AND Status <> 'ARCHIVED' AND ReviewStatus <> 'REJECTED'
        GROUP BY ReviewStatus
        ORDER BY ReviewStatus
        """
    )
    by_review = {str(r[0]): int(r[1]) for r in cur.fetchall()}

    cur.execute(
        """
        SELECT
            COUNT(*),
            SUM(CASE WHEN AdministrativeApprovalStatus <> 'NONE' THEN 1 ELSE 0 END)
        FROM exercises
        WHERE HskLevel BETWEEN 1 AND 4 AND ReviewStatus = 'REJECTED'
        """
    )
    rej_row = cur.fetchone()

    cur.execute("SELECT COUNT(*) FROM exercises WHERE HskLevel > 4 AND AdministrativeApprovalStatus <> 'NONE'")
    out_of_scope_hsk56 = int(cur.fetchone()[0])

    cur.execute("SELECT COUNT(*) FROM exercises WHERE Status = 'ARCHIVED' AND AdministrativeApprovalStatus <> 'NONE'")
    out_of_scope_archived = int(cur.fetchone()[0])

    cur.execute("SELECT COUNT(*) FROM users")
    users_count = int(cur.fetchone()[0])

    cur.execute("SELECT COUNT(*) FROM student_lesson_progress")
    progress_count = int(cur.fetchone()[0])

    return {
        "active_hsk14": int(row[0] or 0),
        "admin_approved": int(row[1] or 0),
        "admin_unapproved": int(row[2] or 0),
        "published_approved": int(row[3] or 0),
        "published_any": int(row[4] or 0),
        "draft_admin_approved": int(row[5] or 0),
        "pending_human": int(row[6] or 0),
        "baseline_human": int(row[7] or 0),
        "by_hsk": by_hsk,
        "by_review": by_review,
        "rejected_total": int(rej_row[0] or 0),
        "rejected_touched": int(rej_row[1] or 0),
        "out_of_scope_hsk56": out_of_scope_hsk56,
        "out_of_scope_archived": out_of_scope_archived,
        "users_count": users_count,
        "progress_count": progress_count,
    }


def export_snapshot(cur: pyodbc.Cursor, database: str, out_path: str) -> str:
    cur.execute(
        """
        SELECT
            CAST(Id AS VARCHAR(36)),
            HskLevel,
            Status,
            ReviewStatus,
            AdministrativeApprovalStatus,
            AdministrativeApprovalScope,
            AdministrativeApprovalSource,
            AdministrativeApprovalNotes,
            CONVERT(VARCHAR(30), AdministrativeApprovedAt, 127),
            HumanAcademicReviewStatus,
            ContentHash,
            CAST(ReviewedByUserId AS VARCHAR(36)),
            CONVERT(VARCHAR(30), ReviewedAt, 127),
            ReviewNotes
        FROM exercises
        WHERE HskLevel BETWEEN 1 AND 4
        ORDER BY Id
        """
    )
    rows = []
    for r in cur.fetchall():
        rows.append(
            {
                "id": r[0],
                "hskLevel": r[1],
                "status": r[2],
                "reviewStatus": r[3],
                "administrativeApprovalStatus": r[4],
                "administrativeApprovalScope": r[5],
                "administrativeApprovalSource": r[6],
                "administrativeApprovalNotes": r[7],
                "administrativeApprovedAt": r[8],
                "humanAcademicReviewStatus": r[9],
                "contentHash": r[10],
                "reviewedByUserId": r[11],
                "reviewedAt": r[12],
                "reviewNotes": r[13],
            }
        )
    payload = {
        "database": database,
        "capturedAt": datetime.now(timezone.utc).isoformat(),
        "rowCount": len(rows),
        "rows": rows,
    }
    raw = json.dumps(payload, ensure_ascii=False, indent=2)
    sha256 = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(raw)
    return sha256


def apply_bulk_approval(conn: pyodbc.Connection, database: str, dry_run: bool, snapshot_path: str | None) -> dict[str, Any]:
    cur = conn.cursor()
    before = get_summary(cur)
    assert before["active_hsk14"] == 5000, f"[{database}] Expected 5000 active HSK 1-4, got {before['active_hsk14']}"
    assert before["published_any"] == 337 and before["published_approved"] == 337, (
        f"[{database}] Expected exactly 337 PUBLISHED/APPROVED baseline rows, got {before}"
    )
    assert before["rejected_total"] == 19, f"[{database}] Expected 19 REJECTED rows, got {before['rejected_total']}"

    if snapshot_path:
        sha = export_snapshot(cur, database, snapshot_path)
        print(f"[{database}] Pre-update snapshot written to {snapshot_path} (sha256={sha})")

    cur.execute(
        """
        SELECT COUNT(*)
        FROM exercises
        WHERE HskLevel BETWEEN 1 AND 4
          AND Status <> 'ARCHIVED'
          AND Status <> 'PUBLISHED'
          AND ReviewStatus <> 'REJECTED'
          AND AdministrativeApprovalStatus <> 'APPROVED'
        """
    )
    target_draft_count = int(cur.fetchone()[0])

    cur.execute(
        """
        SELECT COUNT(*)
        FROM exercises
        WHERE HskLevel BETWEEN 1 AND 4
          AND Status = 'PUBLISHED'
          AND ReviewStatus = 'APPROVED'
          AND (AdministrativeApprovalStatus <> 'APPROVED' OR HumanAcademicReviewStatus <> 'APPROVED_BASELINE')
        """
    )
    target_baseline_count = int(cur.fetchone()[0])

    if dry_run:
        conn.rollback()
        return {
            "database": database,
            "mode": "dry-run",
            "before": before,
            "would_approve_drafts": target_draft_count,
            "would_mark_baseline_published": target_baseline_count,
        }

    try:
        # 1. Mark all unpublished active HSK 1-4 items as administratively APPROVED, keeping Status = DRAFT
        #    and keeping HumanAcademicReviewStatus = PENDING_HUMAN_REVIEW (0 new human academic sign-offs).
        cur.execute(
            """
            UPDATE exercises
            SET
                AdministrativeApprovalStatus = 'APPROVED',
                AdministrativeApprovalScope = ?,
                AdministrativeApprovalSource = ?,
                AdministrativeApprovalNotes = ?,
                AdministrativeApprovedAt = COALESCE(AdministrativeApprovedAt, SYSUTCDATETIME()),
                HumanAcademicReviewStatus = CASE
                    WHEN HumanAcademicReviewStatus IS NULL OR HumanAcademicReviewStatus = 'NOT_REVIEWED'
                        THEN 'PENDING_HUMAN_REVIEW'
                    ELSE HumanAcademicReviewStatus
                END
            WHERE HskLevel BETWEEN 1 AND 4
              AND Status <> 'ARCHIVED'
              AND Status <> 'PUBLISHED'
              AND ReviewStatus <> 'REJECTED'
              AND AdministrativeApprovalStatus <> 'APPROVED'
            """,
            (ADMIN_SCOPE, ADMIN_SOURCE, ADMIN_NOTES),
        )
        updated_drafts = cur.rowcount

        # 2. Mark the 337 already-PUBLISHED/APPROVED baseline items cleanly with baseline markers.
        cur.execute(
            """
            UPDATE exercises
            SET
                AdministrativeApprovalStatus = 'APPROVED',
                AdministrativeApprovalScope = ?,
                AdministrativeApprovalSource = ?,
                AdministrativeApprovalNotes = ?,
                AdministrativeApprovedAt = COALESCE(AdministrativeApprovedAt, ReviewedAt, SYSUTCDATETIME()),
                HumanAcademicReviewStatus = 'APPROVED_BASELINE'
            WHERE HskLevel BETWEEN 1 AND 4
              AND Status = 'PUBLISHED'
              AND ReviewStatus = 'APPROVED'
              AND (AdministrativeApprovalStatus <> 'APPROVED' OR HumanAcademicReviewStatus <> 'APPROVED_BASELINE')
            """,
            (BASELINE_SCOPE, ADMIN_SOURCE, BASELINE_NOTES),
        )
        updated_baseline = cur.rowcount

        after = get_summary(cur)
        assert after["active_hsk14"] == 5000, f"[{database}] Post-check active_hsk14 != 5000: {after}"
        assert after["admin_approved"] == 5000, f"[{database}] Post-check admin_approved != 5000: {after}"
        assert after["admin_unapproved"] == 0, f"[{database}] Post-check admin_unapproved != 0: {after}"
        assert after["published_any"] == 337, f"[{database}] Auto-publish occurred! {after}"
        assert after["published_approved"] == 337, f"[{database}] Baseline published count drifted! {after}"
        assert after["draft_admin_approved"] == 4663, f"[{database}] Expected 4663 admin-approved DRAFT rows, got {after}"
        assert after["pending_human"] == 4663, f"[{database}] Expected 4663 PENDING_HUMAN_REVIEW rows, got {after}"
        assert after["baseline_human"] == 337, f"[{database}] Expected 337 APPROVED_BASELINE rows, got {after}"
        assert after["rejected_total"] == 19 and after["rejected_touched"] == 0, f"[{database}] REJECTED rows mutated! {after}"
        assert after["out_of_scope_hsk56"] == 0, f"[{database}] HSK 5-6 rows mutated! {after}"
        assert after["out_of_scope_archived"] == 0, f"[{database}] ARCHIVED rows mutated! {after}"
        assert after["by_hsk"] == {1: 500, 2: 900, 3: 1500, 4: 2100}, f"[{database}] HSK breakdown mismatch: {after['by_hsk']}"
        assert after["by_review"] == before["by_review"], f"[{database}] ReviewStatus mutated! {before['by_review']} -> {after['by_review']}"

        conn.commit()
        return {
            "database": database,
            "mode": "apply",
            "updated_drafts": updated_drafts,
            "updated_baseline": updated_baseline,
            "before": before,
            "after": after,
        }
    except Exception:
        conn.rollback()
        raise


def verify_against_snapshot(conn: pyodbc.Connection, database: str, snapshot_path: str | None) -> dict[str, Any]:
    cur = conn.cursor()
    summary = get_summary(cur)
    assert summary["active_hsk14"] == 5000, summary
    assert summary["admin_approved"] == 5000, summary
    assert summary["admin_unapproved"] == 0, summary
    assert summary["published_any"] == 337 and summary["published_approved"] == 337, summary
    assert summary["draft_admin_approved"] == 4663, summary
    assert summary["pending_human"] == 4663, summary
    assert summary["baseline_human"] == 337, summary
    assert summary["rejected_total"] == 19 and summary["rejected_touched"] == 0, summary
    assert summary["out_of_scope_hsk56"] == 0 and summary["out_of_scope_archived"] == 0, summary
    assert summary["by_hsk"] == {1: 500, 2: 900, 3: 1500, 4: 2100}, summary

    immutable_diffs = 0
    checked_rows = 0
    if snapshot_path and os.path.exists(snapshot_path):
        with open(snapshot_path, "r", encoding="utf-8") as f:
            snap = json.load(f)
        snap_map = {r["id"].upper(): r for r in snap["rows"]}
        cur.execute(
            """
            SELECT
                CAST(Id AS VARCHAR(36)),
                Status,
                ReviewStatus,
                ContentHash,
                CAST(ReviewedByUserId AS VARCHAR(36)),
                CONVERT(VARCHAR(30), ReviewedAt, 127),
                ReviewNotes
            FROM exercises
            WHERE HskLevel BETWEEN 1 AND 4
            """
        )
        for row in cur.fetchall():
            checked_rows += 1
            old = snap_map.get(row[0].upper())
            assert old is not None, f"Row {row[0]} missing from pre-update snapshot!"
            cur_tup = (row[1], row[2], row[3], row[4], row[5], row[6])
            old_tup = (
                old["status"],
                old["reviewStatus"],
                old["contentHash"],
                old["reviewedByUserId"],
                old["reviewedAt"],
                old["reviewNotes"],
            )
            if cur_tup != old_tup:
                immutable_diffs += 1
                print(f"[{database}] IMMUTABLE DIFF on {row[0]}: {old_tup} != {cur_tup}", file=sys.stderr)
        assert immutable_diffs == 0, f"[{database}] Found {immutable_diffs} immutable field mutations!"

    return {
        "database": database,
        "mode": "verify",
        "summary": summary,
        "snapshot_checked_rows": checked_rows,
        "immutable_diffs": immutable_diffs,
    }


def rollback_from_snapshot(conn: pyodbc.Connection, database: str, snapshot_path: str) -> dict[str, Any]:
    with open(snapshot_path, "r", encoding="utf-8") as f:
        snap = json.load(f)
    rows = snap["rows"]
    cur = conn.cursor()
    try:
        updated = 0
        for r in rows:
            cur.execute(
                """
                UPDATE exercises
                SET
                    AdministrativeApprovalStatus = ?,
                    AdministrativeApprovalScope = ?,
                    AdministrativeApprovalSource = ?,
                    AdministrativeApprovalNotes = ?,
                    AdministrativeApprovedAt = ?,
                    HumanAcademicReviewStatus = ?
                WHERE Id = ?
                """,
                (
                    r.get("administrativeApprovalStatus") or "NONE",
                    r.get("administrativeApprovalScope"),
                    r.get("administrativeApprovalSource"),
                    r.get("administrativeApprovalNotes"),
                    r.get("administrativeApprovedAt"),
                    r.get("humanAcademicReviewStatus") or "NOT_REVIEWED",
                    r["id"],
                ),
            )
            updated += cur.rowcount
        summary = get_summary(cur)
        conn.commit()
        return {
            "database": database,
            "mode": "rollback",
            "restored_rows": updated,
            "summary": summary,
        }
    except Exception:
        conn.rollback()
        raise


def main() -> int:
    parser = argparse.ArgumentParser(description="ZhongWenHub Bulk Administrative Approval")
    parser.add_argument("--db", choices=["ZhongWenHub_Dev", "ZhongWenHub_Test"], help="Target database")
    parser.add_argument("--all-dbs", action="store_true", help="Run on both ZhongWenHub_Dev and ZhongWenHub_Test")
    parser.add_argument("--apply", action="store_true", help="Apply bulk administrative approval")
    parser.add_argument("--verify", action="store_true", help="Verify post-update invariants")
    parser.add_argument("--rollback", metavar="SNAPSHOT_JSON", help="Rollback administrative approval columns using snapshot")
    parser.add_argument("--snapshot", metavar="SNAPSHOT_JSON", help="Snapshot path for pre-update capture / verify")
    args = parser.parse_args()

    dbs = ["ZhongWenHub_Dev", "ZhongWenHub_Test"] if args.all_dbs else ([args.db] if args.db else [])
    if not dbs:
        parser.error("Specify --db <name> or --all-dbs")

    for db in dbs:
        conn = connect_db(db)
        try:
            snap_file = args.snapshot
            if args.all_dbs and snap_file and "{db}" in snap_file:
                snap_file = snap_file.format(db=db.lower())
            if args.rollback:
                res = rollback_from_snapshot(conn, db, args.rollback)
            elif args.verify:
                res = verify_against_snapshot(conn, db, snap_file)
            else:
                res = apply_bulk_approval(conn, db, dry_run=not args.apply, snapshot_path=snap_file)
            print(json.dumps(res, ensure_ascii=False, indent=2))
        finally:
            conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

