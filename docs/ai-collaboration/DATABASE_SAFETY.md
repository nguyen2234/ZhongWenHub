# Database Safety Architecture & Zero-Write Dev Policy

## 1. Protected Database: `ZhongWenHub_Dev`

`ZhongWenHub_Dev` is the primary production/development environment containing canonical curriculum data, existing user accounts, and historical progress.

### Absolute Prohibitions on `ZhongWenHub_Dev`
- ❌ NO `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `DROP`
- ❌ NO automatic migrations or EF Core migrations
- ❌ NO automated seeding or database resets
- ❌ NO restore or overwrite operations

## 2. Test Execution Database: `ZhongWenHub_Test`

All tests, migrations, imports, and rollback validations must strictly target `ZhongWenHub_Test`.

### Mandatory Runtime Assertion (`db_safety_guard.py`)

Before any database write script executes, it must execute:

```sql
SELECT DB_NAME()
```

If the returned database name is not strictly `ZhongWenHub_Test`, the script immediately raises an exception and aborts execution.

```python
from scripts.hsk30.db_safety_guard import verify_test_db_or_abort

conn = get_db_connection()
verify_test_db_or_abort(conn) # Asserts DB_NAME() == 'ZhongWenHub_Test'
```

## 3. Multi-Batch Exact Rollback Mechanism

When staging data into `ZhongWenHub_Test`:
1. Every write operation is tracked under a unique `batchId`.
2. A pre-import snapshot is recorded in memory/staging JSON.
3. Every inserted ID and updated record is logged.
4. Rollback deletes strictly the records inserted by that `batchId` and restores pre-import states, avoiding blanket `DELETE WHERE HskLevel = X`.
5. Rollback verification tests prove that pre-import row count == post-rollback row count.
