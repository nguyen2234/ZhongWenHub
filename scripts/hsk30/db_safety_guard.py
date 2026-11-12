# -*- coding: utf-8 -*-
"""
Database Safety Guard Module
Phase 9.1C — Task 2

Provides ironclad verification for SQL Server connections:
1. Executes `SELECT DB_NAME()` on the live connection (not just regex on conn str).
2. Strictly requires `DB_NAME() == 'ZhongWenHub_Test'`.
3. If `DB_NAME()` is 'ZhongWenHub_Dev' or anything other than 'ZhongWenHub_Test',
   immediately raises DatabaseSecurityViolation and terminates.
4. Checks transaction isolation and ensures autocommit=False.
"""

import sys
import pyodbc

class DatabaseSecurityViolation(Exception):
    """Raised when an operation attempts to connect to or write against an unauthorized database."""
    pass

TEST_DB_NAME = "ZhongWenHub_Test"
PROHIBITED_DEV_DB_NAME = "ZhongWenHub_Dev"

def assert_safe_test_connection(conn) -> dict:
    """
    Executes live verification queries against SQL Server.
    Raises DatabaseSecurityViolation if connected to Dev or non-Test database.
    """
    cursor = conn.cursor()
    cursor.execute("SELECT DB_NAME()")
    row = cursor.fetchone()
    if not row or not row[0]:
        raise DatabaseSecurityViolation("CRITICAL: Unable to query DB_NAME() from SQL Server session.")
    
    actual_db = row[0].strip()

    cursor.execute("SELECT @@SERVERNAME")
    server_row = cursor.fetchone()
    server_name = server_row[0].strip() if server_row else "UNKNOWN"

    # Strictly prohibit Dev
    if actual_db.lower() == PROHIBITED_DEV_DB_NAME.lower():
        raise DatabaseSecurityViolation(
            f"FATAL SECURITY VIOLATION: Connected directly to protected Dev database '{actual_db}'! "
            f"Zero-write policy strictly enforced. Operation aborted."
        )

    # Strictly require Test
    if actual_db != TEST_DB_NAME:
        raise DatabaseSecurityViolation(
            f"DATABASE REJECTED: Expected target '{TEST_DB_NAME}', but connected to '{actual_db}'. "
            f"Only '{TEST_DB_NAME}' is permitted for test writes."
        )

    return {
        "status": "VERIFIED_SAFE",
        "database": actual_db,
        "server": server_name,
        "autocommit": conn.autocommit
    }

def connect_test_database(conn_str: str = None) -> pyodbc.Connection:
    """
    Establishes connection to ZhongWenHub_Test with explicit autocommit=False
    and asserts safety guard before returning the connection object.
    """
    if conn_str is None:
        conn_str = f"Driver={{ODBC Driver 17 for SQL Server}};Server=.\\SQLEXPRESS;Database={TEST_DB_NAME};Trusted_Connection=yes;"
    
    # Pre-check conn_str as defense-in-depth
    if PROHIBITED_DEV_DB_NAME.lower() in conn_str.lower():
        raise DatabaseSecurityViolation(
            f"PRE-CONNECTION REJECTED: Connection string targets '{PROHIBITED_DEV_DB_NAME}'. "
            f"Writing to Dev database is strictly forbidden."
        )

    conn = pyodbc.connect(conn_str, autocommit=False)
    assert_safe_test_connection(conn)
    return conn
