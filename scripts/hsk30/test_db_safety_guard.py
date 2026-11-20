# -*- coding: utf-8 -*-
"""
Automated Test for Database Safety Guard
Phase 9.1C — Task 2
"""

import sys
import pyodbc
from db_safety_guard import (
    assert_safe_test_connection,
    connect_test_database,
    DatabaseSecurityViolation,
    TEST_DB_NAME,
    PROHIBITED_DEV_DB_NAME
)

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def test_guard_with_test_db():
    print("[TEST 1] Testing valid connection to ZhongWenHub_Test...")
    conn = connect_test_database()
    info = assert_safe_test_connection(conn)
    assert info["database"] == TEST_DB_NAME
    assert info["status"] == "VERIFIED_SAFE"
    assert conn.autocommit is False
    conn.close()
    print("  -> PASSED: Verified connection to ZhongWenHub_Test with autocommit=False.")

def test_guard_rejects_dev_connection_string():
    print("[TEST 2] Testing rejection of Dev connection string...")
    dev_conn_str = f"Driver={{ODBC Driver 17 for SQL Server}};Server=.\\SQLEXPRESS;Database={PROHIBITED_DEV_DB_NAME};Trusted_Connection=yes;"
    try:
        connect_test_database(dev_conn_str)
        assert False, "Should have thrown DatabaseSecurityViolation!"
    except DatabaseSecurityViolation as e:
        print(f"  -> PASSED: Successfully rejected Dev connection string ({e})")

def test_guard_live_query_verification_rejects_dev():
    print("[TEST 3] Testing live query DB_NAME() rejection if connected to Dev...")
    # Open raw read-only connection to Dev to test that assert_safe_test_connection catches it live
    raw_dev_conn = pyodbc.connect(
        f"Driver={{ODBC Driver 17 for SQL Server}};Server=.\\SQLEXPRESS;Database={PROHIBITED_DEV_DB_NAME};Trusted_Connection=yes;",
        autocommit=False
    )
    try:
        assert_safe_test_connection(raw_dev_conn)
        assert False, "Should have caught DB_NAME() == ZhongWenHub_Dev!"
    except DatabaseSecurityViolation as e:
        print(f"  -> PASSED: Live DB_NAME() check strictly rejected Dev session ({e})")
    finally:
        raw_dev_conn.close()

if __name__ == "__main__":
    try:
        test_guard_with_test_db()
        test_guard_rejects_dev_connection_string()
        test_guard_live_query_verification_rejects_dev()
        print("\nALL 3 DATABASE SAFETY GUARD TESTS PASSED (100%)!")
        sys.exit(0)
    except Exception as ex:
        print(f"\nTEST FAILED: {ex}")
        sys.exit(1)
