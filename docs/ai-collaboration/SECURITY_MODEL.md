# Security Architecture & Threat Model

## 1. Threat Vectors & Defense Mechanisms

| Threat Vector | Risk Description | Mitigation |
| :--- | :--- | :--- |
| **Credential Leakage** | Database passwords or PATs leaking into public Git or GitHub Issues | Automated regex redaction in `sanitize_evidence.py` before any file write or comment post. |
| **Database Corruption** | Tests writing to or wiping `ZhongWenHub_Dev` | Hard runtime guard enforcing `SELECT DB_NAME() == 'ZhongWenHub_Test'`. |
| **Command Injection** | Arbitrary shell commands embedded in GitHub Issues or task manifests | `bridge.py` never executes shell commands extracted from tasks or GitHub comments. Only hardcoded, parameter-checked scripts are executed. |
| **Privilege Escalation** | Student accounts accessing admin endpoints or unreleased draft curriculum | Mandatory RBAC route guards on frontend, authorization filters on ASP.NET Core controllers. |
| **Unauthorized Publishing** | Autonomous agents publishing incomplete learning materials | Explicit release gate requiring human review for publishing. |

## 2. GitHub Actions Security

- **Least Privilege**: Actions workflows operate with read-only tokens by default.
- **No `pull_request_target` with untrusted code**: PR workflows run in isolated environments without access to local SQL Server Express instances.
- **No public database exposure**: GitHub runners cannot access local SQL Server instances directly.
