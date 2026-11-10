# QA Evidence Standard & Sanitization Rules

## 1. Principles of Verifiable Evidence

In multi-agent software engineering, evidence must be verifiable, deterministic, and free of sensitive leaks:
1. **Cryptographic Binding**: All test results and reports must explicitly record the commit SHA on which they ran.
2. **Artifact Preservation**: Test logs, JUnit/TRX test summaries, coverage metrics, and Playwright traces are saved as versioned artifacts.
3. **No Heavy Binaries in Git**: Playwright video recordings, massive trace zips, or raw database backups must not be committed to Git. They are uploaded to GitHub Actions artifacts or temporary storage.

## 2. Automated Sanitization (`sanitize_evidence.py`)

Before any test log, event comment, or task result is persisted or uploaded to GitHub, it passes through `sanitize_evidence.py`:

```python
from sanitize_evidence import sanitize_text, sanitize_data
clean_text = sanitize_text(raw_output)
clean_data = sanitize_data(result_dict)
```

### Redaction Rules

| Sensitive Pattern | Match Pattern | Redacted Form |
| :--- | :--- | :--- |
| **SQL Connection String Password** | `Password=...;` | `Password=[REDACTED];` |
| **SQL Connection String User** | `User Id=...;` | `User Id=[REDACTED];` |
| **GitHub Personal Access Token** | `ghp_[A-Za-z0-9]{36}` | `[REDACTED_GITHUB_PAT]` |
| **GitHub OAuth Token** | `gho_[A-Za-z0-9]{36}` | `[REDACTED_GITHUB_OAUTH]` |
| **JWT Bearer Token** | `eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+` | `[REDACTED_JWT_TOKEN]` |
| **Generic API Key / Secret** | `(api_key\|secret)=\"[^\"]+\"` | `\1=\"[REDACTED]\"` |

## 3. Evidence Schema (`qa-evidence.schema.json`)

Standalone evidence artifacts follow `.ai-collaboration/protocol/qa-evidence.schema.json`, enabling programmatic ingestion into CI dashboards and ChatGPT prompt contexts.


## 4. Evidence-Based QA Hardening (Bridge V1.1)

Static `PASS` entries without cryptographic or file-based verification are strictly rejected by `scripts/ai_bridge/verify_qa_evidence.py`.

### Required Evidence Fields for Every PASS:
1. `test_file`: Path to the actual test file on disk (asserted to exist).
2. `test_command`: Exact command executed to run the test suite.
3. `execution_commit_sha`: Exact commit SHA of the codebase under test.
4. `workflow_run_id`: GitHub Actions workflow run ID or verified local execution tag.
5. `artifact_reference`: Name or path of the resulting TRX/JUnit/HTML test artifact.
6. `executed_at`: ISO 8601 execution timestamp.
7. `verified_status`: Must strictly match `PASS`.

### Environment Boundary Separation:
- **GitHub-Hosted CI Runners**: Run backend unit tests (`dotnet test`) and frontend unit tests (`bun test src/tests`), where no external databases are needed.
- **Local Isolated Verification Runner**: Runs live database-dependent integration tests and Playwright E2E suites against `ZhongWenHub_Test`. When evaluated in CI environments lacking local SQL Server, these tests are recorded as `BLOCKED_ON_GITHUB_RUNNER_NO_LOCAL_SQL_SERVER` to prevent false positives and test run flakiness.
