# SECURITY CLEANUP REPORT

**Task ID:** `ZWH-SAFE-CODEBASE-CLEANUP-2026` (Phase 2 / Phase G)  
**Date:** 2026-11-11  
**Branch:** `integration/zhongwenhub-sqlserver`  

> **Policy Note:** Plaintext credential values are intentionally redacted (`***`) in this report per security reporting rules. No Git history rewrite or force-push was performed.

---

## 1. Executive Summary

- Audited all scripts, Frontend E2E specs, Backend integration tests, configuration files, and `.github/workflows/`.
- Remediated **4 files** containing hardcoded demo credentials by migrating them to environment variables / `testCredentials` config helpers with fail-closed validation.
- Executed `scripts/ai_bridge/scan_secrets.py` (`ZERO SECRETS FOUND!`) and full-tree `git grep` verification across all tracked files.
- Flagged legacy test/seed references tied to seeded local test databases (`DbInitializer.cs`, `LearningIntegrationTests.cs`, `content-manager-ui-and-export.spec.ts`) for manual credential rotation & test-factory cleanup without breaking existing test suites.

---

## 2. Remediated Files (Hardcoded Credentials Removed)

| File | Previous Issue | Remediation Applied |
|---|---|---|
| `scripts/hsk20/test_live_api_hsk1.py` | Hardcoded student & content-manager demo password (`Demo@***`) | Replaced with `E2E_STUDENT_PASSWORD`, `E2E_CONTENT_MANAGER_PASSWORD`, optional email/URL vars, and fail-closed `sys.exit(1)` guard before network calls. |
| `scripts/e2e_live_api_acceptance.py` | Hardcoded Admin (`adm***`) & 3 role demo passwords (`Demo@***`) | Replaced with `E2E_ADMIN_PASSWORD`, `E2E_CONTENT_MANAGER_PASSWORD`, `E2E_TEACHER_PASSWORD`, `E2E_STUDENT_PASSWORD`, plus fail-closed `sys.exit(1)` validation. |
| `Fontend/e2e/student-learning-journey.spec.ts` | Test 5 (line 130–131) hardcoded email and `Demo@***` instead of `testCredentials` | Updated lines 130–131 to use `testCredentials.student.email` and `testCredentials.student.password()`. |
| `Fontend/e2e/real-content-manager.spec.ts` | `loginViaUi` default parameters used literal `Demo@***` | Updated default `email` to `testCredentials.contentManager.email` and resolved omitted `password` lazily via `testCredentials.contentManager.password()`. |

---

## 3. Reviewed & Verified Secure (No Change Needed)

| File / Path | Assessment | Category |
|---|---|---|
| `Fontend/e2e/config/test-credentials.config.ts` | Reads from `process.env`; throws `[SECURITY ERROR]` if unset | Active Security Helper |
| `Fontend/e2e/real-admin-acceptance.spec.ts` | Uses `testCredentials.*` strictly | Secure E2E Spec |
| `Fontend/e2e/hsk1-full-curriculum-e2e.spec.ts` | Uses `testCredentials.*` strictly | Secure E2E Spec |
| `Backend/.env.example`, `Fontend/.env.example` | Placeholder values only (`your_secure_...`, `REPLACE_WITH_...`) | Secure Template |
| `Backend/src/Api/appsettings.json` | Empty `"Secret": ""`; Integrated Windows Auth local dev SQL Express | Safe Config Template |
| `Backend/src/Api/appsettings.Testing.json` | Local testing-only JWT test key (`ZhongWenHub_IntegrationTest_...`) | Test Fixture Config |
| `.github/workflows/*.yml` | Uses GitHub Secrets / CI variables only; no literal credentials | Secure CI |
| `Fontend/.env.local` | Untracked & properly excluded by `.gitignore` | Local Dev Secret File (Ignored) |

---

## 4. Flagged for Manual Review & Credential Rotation (MEDIUM Risk — Preserved to Avoid Breaking Seed/Tests)

| File | Finding | Classification | Recommended Action |
|---|---|---|---|
| `Backend/src/Data/Persistence/DbInitializer.cs` | Fallback `DEV_DEMO_PASSWORD ?? "Demo@***"` (line 56) & `DEV_ADMIN_PASSWORD ?? "adm***"` (line 579) for local seed accounts | Seed Default / Demo Fallback | Restrict fallback strictly to `IsDevelopment()` or require explicit env vars; rotate demo passwords in shared staging/dev DBs. |
| `Backend/tests/ZhongWenHub.IntegrationTests/LearningIntegrationTests.cs` | Line 321 authenticates seeded user `student.binh.demo@...` using literal `Demo@***` | Test Fixture Dependency | Align with `CustomWebApplicationFactory` helper reading `DEV_DEMO_PASSWORD` env var in a backend test refactor. |
| `Backend/tests/verify_be2.ps1` | Legacy manual PowerShell check uses local synthetic test credentials (`ExamplePassword123!`, `AdminPassword123!`) | Legacy Manual Script | Convert to env vars or retire if superseded by xUnit integration tests. |
| `Fontend/e2e/content-manager-ui-and-export.spec.ts` | `loginViaUi` default uses `contentmanager@zhongwenhub.edu.vn` / `Content***` test seed account | Test Fixture Spec | Migrate into `testCredentials` or environment variables. |
| `Fontend/e2e/admin-user-organization-crud.spec.ts` | Local helper default uses `admin@gmail.com` + ephemeral `StudentPassword123!` | Test Fixture Spec | Route admin credentials through `testCredentials.admin`. |
| **Git Commit History** | Earlier commits contained plaintext `Demo@***` test credentials | Historical Exposure | **Rotate all demo/test account passwords** across any staging or deployed databases (do NOT rewrite shared branch history). |
