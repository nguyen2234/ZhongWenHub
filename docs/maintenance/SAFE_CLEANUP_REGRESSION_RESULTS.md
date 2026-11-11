# SAFE CLEANUP — REGRESSION VERIFICATION RESULTS

**Task ID:** `ZWH-SAFE-CODEBASE-CLEANUP-2026`  
**Date:** 2026-11-11  
**Branch:** `integration/zhongwenhub-sqlserver`  
**PR #16:** Open / Draft  

---

## 1. Summary Comparison (Before vs After Cleanup)

| Metric | Before Cleanup (`0372cd5` Baseline) | After Cleanup (Current) | Delta |
|---|---|---|---|
| **Git-tracked files** | 1,800 | 1,737 | **-63 net** (`-69` deleted, `+6` `docs/maintenance/` reports) |
| **Deleted files** | 0 | 69 (`1,311,211` bytes removed) | **-69 unused/duplicate/cache files** |
| **Tracked repository size** | 106,319,248 bytes (101.39 MB) | ~105.05 MB | **-1.24 MB net** (`-1.25 MB` removed) |
| **Mock / sample data TS files** | 24 | 17 (active runtime/test only) | **-7 dead mock files** |
| **Frontend TypeScript + Vite build** | FAIL (6 TS errors) | **PASS** (0 errors, `2,417` modules, `1.15s`) | Fixed (`1956591`) & preserved after cleanup |
| **Frontend unit tests (`bun test`)** | 288 / 288 PASS | **288 / 288 PASS** (0 fail, `4,249` expect calls, `2.08s`) | Zero regression |
| **Frontend lint (`oxlint`)** | 0 errors, 123 warnings | **0 errors, 123 warnings** (`369ms`, 576 files) | Clean |
| **Backend build (Release)** | 0 warnings, 0 errors | **0 warnings, 0 errors** (`12.43s`) | Zero regression |
| **Backend unit tests (`ZhongWenHub.UnitTests`)** | 38 / 38 PASS | **38 / 38 PASS** (0 fail, 0 skipped, `1s`) | Zero regression |
| **AI Bridge protocol validator** | 25 / 25 PASS | **25 / 25 PASS** | Zero regression |
| **HSK 2.0 Data QA suite** | 11 / 11 PASS | **11 / 11 PASS** | Zero regression |
| **Repo secret scanner** | Failing (`Demo@***` in 2 scripts) | **PASS (`ZERO SECRETS FOUND!`)** | P0 remediated (`b051ed9`) |
| **Live Read-Only API E2E (`test_live_api_hsk1.py`)** | Passed (with hardcoded password) | **7 / 7 PASS** (using env vars only) | Verified live against `ZhongWenHub_Test` |

---

## 2. Detailed Verification Commands & Observed Outputs

1. **Frontend Production Build (`cd D:\ZhongWenHub\Fontend && bun run build`):**
   - Outcome: **PASS** (`✓ 2417 modules transformed`, `✓ built in 1.15s`, `dist/index.html 1.76 kB`, `dist/assets/index-DJmN9UPK.css 190.60 kB`, `dist/assets/index-BX23Cj0r.js 2,462.08 kB`).
2. **Frontend Unit Tests (`cd D:\ZhongWenHub\Fontend && bun test src/tests`):**
   - Outcome: **PASS** (`288 pass`, `0 fail`, `4249 expect() calls`, `30 files`, `2.08s`).
3. **Backend Solution Build & Unit Tests (`dotnet build Backend/ZhongWenHub.sln -c Release --no-restore && dotnet test Backend/tests/ZhongWenHub.UnitTests/ZhongWenHub.UnitTests.csproj -c Release --no-build`):**
   - Note: Debug build on local workspace encounters `MSB3027` file lock on `ZhongWenHub.Data.dll` because a live API instance (PID 17644) is actively serving `localhost:5000`; Release build matches `.github/workflows/backend-tests.yml` and succeeded cleanly with **0 Warning(s), 0 Error(s)**.
   - Unit Test Outcome: **PASS** (`Failed: 0, Passed: 38, Skipped: 0, Total: 38, Duration: 1 s`).
4. **AI Bridge, Data QA, Security:**
   - `python scripts/ai_bridge/validate_protocol.py all`: **PASS** (25/25 files validated).
   - `python scripts/hsk20/verify_hsk20_data_quality.py`: **PASS** (11/11 suites passed).
   - `python scripts/ai_bridge/scan_secrets.py`: **PASS** (`SCAN COMPLETED: ZERO SECRETS FOUND!`).
5. **Live API HSK 1 & RBAC Verification (`python scripts/hsk20/test_live_api_hsk1.py`):**
   - Fail-closed test without env vars: **PASS** (exited code 1 with setup instructions before network call).
   - Authenticated live run against `http://localhost:5000` (`ZhongWenHub_Test`, env vars injected in-process from `.env.local`): **7 / 7 PASS** (Student login, CM login, Lesson 1 `PUBLISHED` fetch, Draft Lesson 4 `404` student block, Draft Lesson 4 `200` CM preview, Anonymous completion `401` block, Student progress query).

---

## 3. Environment-Gated / Not Executed Checks (Truthful Status)

- **Database Writes:** `ZhongWenHub_Dev` and `ZhongWenHub_Test` experienced **0 writes** during this cleanup task.
- **`ZhongWenHub.IntegrationTests` & Live Browser Playwright Write Tests:** **NOT RUN / GATED** (`appsettings.Testing.json` targets `ZhongWenHub_Test`, which requires explicit user approval token for mutating test runs). Live read-only API regression was executed instead (`7/7 PASS`).
- **GitHub Actions CI:** Will execute automatically on push to `integration/zhongwenhub-sqlserver`.
