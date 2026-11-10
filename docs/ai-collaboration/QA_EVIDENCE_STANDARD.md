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
