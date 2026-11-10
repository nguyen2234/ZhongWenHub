# QA Release Gate Policy & Criteria

## 1. Purpose & Scope

The QA Release Gate evaluates whether a build or curriculum release candidate on `integration/zhongwenhub-sqlserver` is technically ready for staging or testing.

It serves as an automated firewall against premature merging or production deployment.

## 2. Gate Decision Taxonomy

- `TECHNICAL_QA_PASSED`: All automated technical checks, security audits, and real E2E tests have passed.
- `TECHNICAL_QA_CONDITIONAL`: Technical criteria met with documented non-blocking conditions (e.g. pending human academic review).
- `QA_FAILED`: One or more required automated checks failed (e.g. broken tests, type errors, or security findings).
- `QA_BLOCKED`: The evaluation could not be completed due to environment or infrastructure blockers.

## 3. Mandatory Release Gate Criteria

| Criterion | Evaluation Target | Threshold |
| :--- | :--- | :--- |
| **Backend Build & Unit Tests** | `dotnet test` | 100% Pass, 0 Failures |
| **Frontend Build & Bun Tests** | `bun test` | 100% Pass, 0 Failures |
| **Playwright Real E2E** | Multi-viewport E2E | 100% Pass on target specs |
| **Zero Dev DB Writes** | SQL Server Audit | 0 writes to `ZhongWenHub_Dev` |
| **Security Scanning** | `security-findings.json` | 0 Critical, 0 High findings |
| **PR #16 Status** | GitHub CLI | State == `OPEN` & `isDraft` == `true` |
| **Curriculum Publication** | Database Content | All new lessons remain `DRAFT` |

> [!IMPORTANT]
> `TECHNICAL_QA_PASSED` does NOT equal production publishing. Academic curriculum approval and Vietnamese-Chinese linguistic review are human-gated steps that cannot be bypassed by automated agents.
