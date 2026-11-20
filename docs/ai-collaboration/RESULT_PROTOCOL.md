# Result Protocol & QA Evidence Standard

## 1. Overview

When Antigravity completes execution of a task, it must produce a structured result manifest complying with `.ai-collaboration/protocol/result.schema.json`.

Results are permanently stored in `.ai-collaboration/results/<TASK_ID>_result.json`.

## 2. Required Fields

- `task_id`: Matching task identifier.
- `task_revision`: Revision number of task at completion time.
- `execution_id`: Unique execution identifier (e.g. `EXEC-20261110-001`).
- `executor`: Name of the executing AI agent (e.g. `Antigravity`).
- `commit_sha`: Exact Git commit SHA containing the changes.
- `branch`: Git branch where commit was pushed.
- `changed_files`: List of files modified or added in the commit.
- `started_at` & `finished_at`: Execution timing in ISO 8601.
- `status`: Execution outcome: `PASS`, `FAIL`, `BLOCKED`, or `PARTIAL`.
- `test_results`: Array of individual test suite results.
- `evidence_links`: URLs or file paths to logs, traces, or commit diffs.
- `warnings` & `blockers`: Explicit callouts of any residual warnings or blockers.

## 3. Test Result Object Specification

Each entry in `test_results` must include:
- `test_id`: Identifier for the test suite (e.g. `TEST-BACKEND-01`).
- `test_name`: Human-readable test name.
- `command`: Exact command executed (e.g. `dotnet test ...` or `bun test ...`).
- `test_type`: One of `UNIT`, `INTEGRATION`, `E2E`, `LINT`, `BUILD`, `SECURITY`, `PROTOCOL`.
- `environment`: Runtime environment (e.g. `Windows x64 / .NET 10 / SQL Express`).
- `commit_sha`: Git commit on which the test was executed.
- `passed_count`, `failed_count`, `skipped_count`: Integer metrics.
- `status`: One of `PASS`, `FAIL`, `SKIP`, `NOT_TESTED`, `BLOCKED`.
- `execution_timestamp`: Exact ISO timestamp of test execution.

## 4. Evidence Integrity Rules

1. **Commit SHA Verification**: The `commit_sha` recorded in `test_results` must match the result's root `commit_sha`.
2. **No Mocking as Real E2E**: Tests claiming to be `E2E` cannot mock backend APIs. If mocked, they must be classified as `UNIT` or `INTEGRATION`.
3. **No Skipped Masking**: A test that was skipped or could not run cannot be counted as `PASS`. It must be marked `SKIP` or `BLOCKED`.

