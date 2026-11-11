# CLEANUP BASELINE REPORT

**Task ID:** `ZWH-SAFE-CODEBASE-CLEANUP-2026`  
**Date:** 2026-11-11  
**Branch:** `integration/zhongwenhub-sqlserver`  
**PR #16:** Open / Draft (strictly preserved)

---

## 1. Git Baseline State

- **Initial Baseline SHA (before cleanup session):** `0372cd5` (`test(hsk1): add live api e2e verification script for rbac and student loop`)
- **Workspace Recovery HEAD (after interrupted swarm worker `ts-fixer`):** `19565918762be9b0d5bbda06ba962a7beb59bb28` (`fix(frontend): remove dead mock imports and unreachable MOCK status comparison`)
- **Database Safety:**
  - `ZhongWenHub_Dev`: Strictly READ-ONLY (0 writes).
  - `ZhongWenHub_Test`: Approval Gate active (0 writes performed by cleanup).

---

## 2. Repository Size & File Count Baseline

*(Measured on Git tracked tree before safe file removal)*

| Metric | Value |
|---|---:|
| Total Git-tracked files | 1,800 |
| Untracked files at session start | 0 |
| Tracked repository byte size | 106,319,248 bytes (101.39 MB) |
| Source code files (`.ts`, `.tsx`, `.cs`, `.py`, `.css`, `.html`, `.ps1`, `.bat`, `.sh`) | 919 |
| Frontend TypeScript/TSX files (`Fontend/src/`) | 543 |
| Backend C# files (`Backend/src/`) | 116 |
| Mock / sample data TS files (`Fontend/src/`) | 24 |
| Exact byte-for-byte duplicate groups | 60 groups (including 56 root-level duplicate reports/CSVs) |

---

## 3. Build, Lint & Test Baseline

### Before `ts-fixer` (`0372cd5`)
- **Backend Build (`dotnet build Backend/src/Api/ZhongWenHub.Api.csproj --no-restore`):** PASS (0 warnings, 0 errors, 1.49s)
- **Backend Unit Tests (`dotnet test Backend/tests/ZhongWenHub.UnitTests/ZhongWenHub.UnitTests.csproj --no-build`):** PASS (38/38 passed, 0 failed, 0 skipped, ~1s)
- **Frontend Unit Tests (`bun test src/tests`):** PASS (288/288 passed across 30 files, 4,249 expect() calls, 3.41s)
- **Frontend Production Build (`bun run build` = `tsc -b && vite build`):** FAIL (6 TypeScript errors in `Fontend/src/features/lesson/services/hsk-textbook.service.ts`: 5 unused mock imports `TS6133` + 1 unreachable `'MOCK'` status comparison `TS2367`)

### After TypeScript Fix (`1956591`) at Workspace Recovery
- **Frontend Production Build (`bun run build`):** PASS (`✓ 2417 modules transformed`, `✓ built in 1.23s`, 0 TypeScript errors)
- **Frontend Lint (`bun run lint` = `oxlint`):** 0 errors, 123 warnings (across 576 files, 369ms)
- **Repo Secret Scanner (`python scripts/ai_bridge/scan_secrets.py`):** PASS (`ZERO SECRETS FOUND` after script credential fixes)

### Pre-existing Issues Noted (Not Introduced by Cleanup)
1. **Hardcoded Demo Credentials (P0/P1 Security):** Present in `scripts/hsk20/test_live_api_hsk1.py`, `scripts/e2e_live_api_acceptance.py`, and two Playwright E2E spec locations (`student-learning-journey.spec.ts:131`, `real-content-manager.spec.ts:8`).
2. **Root-level Duplicate Documentation:** 56 files (`HSK30_*` and `DOTNET10_FULL_MIGRATION_REPORT.md`) duplicated verbatim at root despite existing inside `docs/hsk30/`.
3. **Bytecode Artifact Committed:** `scripts/__pycache__/build_hsk_vocab_meanings.cpython-312.pyc` committed despite `.gitignore` rule.
4. **Live Browser Playwright E2E:** Not run in automated CI without an active UI server + user-approved test DB run; backend unit tests (38/38) and frontend unit tests (288/288) are verified directly.
