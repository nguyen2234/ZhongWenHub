# SAFE CLEANUP — ITEMS PENDING MANUAL APPROVAL (MEDIUM / HIGH RISK)

**Task ID:** `ZWH-SAFE-CODEBASE-CLEANUP-2026`  
**Date:** 2026-11-11  
**Branch:** `integration/zhongwenhub-sqlserver`  

None of the items below were auto-deleted because they carry **MEDIUM** or **HIGH** risk (active mock fallbacks, audit history, legacy scripts, unimplemented contract interfaces, or test screenshots).

---

## 1. Frontend Runtime Mock Modules Requiring Backend Migration First (HIGH Priority)

| File | Current Usage | Why Not Deleted Now | Action Required Before Removal |
|---|---|---|---|
| `Fontend/src/features/grammar/mock/mockGrammarData.ts` | Primary source in `grammar.service.ts` & `mock-grammar.repository.ts` | Deleting breaks Grammar feature & `fe-11` unit tests | Migrate `grammar.service.ts` to live `/api/v1/content/grammar` first |
| `Fontend/src/features/vocabulary/data/vocabularyBank.ts` | Primary source in `VocabularyBank.tsx` & `VocabularyReviewContext.tsx` | Deleting breaks Student Vocabulary Bank & SRS Review | Connect `VocabularyBank` & `VocabularyReviewContext` to live backend APIs |
| `Fontend/src/management/admin/content/data/mockHskRepositoryData.ts` | Used in `hsk-repository.service.ts` | Deleting breaks Admin HSK Repository fallback | Complete admin repository service cutover |
| `Fontend/src/management/admin/content/data/mockCurriculumData.ts` & `mockLessonEditorData.ts` | Used in `curriculum.service.ts`, `lesson-content.service.ts`, `mock-exercise.repository.ts` | Deleting breaks fallback flows & repository adapter | Complete Lesson 8 & Admin fallback removal after DB full seeding |

---

## 2. Tiny Unimplemented API Contract Interfaces & Backend Services (MEDIUM Risk)

| File | Reason Flagged | Evidence |
|---|---|---|
| `Fontend/src/services/api/content-issue.repository.ts` | 0 TypeScript code imports | Still referenced in `Fontend/docs/fe-13-4-final-acceptance.md` as contract design |
| `Fontend/src/services/api/support-ticket.repository.ts` | 0 TypeScript code imports | Still referenced in `Fontend/docs/fe-13-4-final-acceptance.md` & `frontend-backend-integration.md` |
| `Fontend/src/services/api/video.repository.ts` | 0 TypeScript code imports | Still referenced in `Fontend/docs/fe-13-4-final-acceptance.md` |
| `Backend/src/Business/Common/ConsoleEmailService.cs` | 0 direct `.cs` class references found in static scan | Confirm DI registration / `IEmailService` interface binding before removing |
| `Backend/src/Business/Authentication/DTOs/{ChangePasswordRequestDto,ForgotPasswordRequestDto,ResetPasswordRequestDto}.cs` | 0 current controller references | Planned auth endpoint DTO contracts |

---

## 3. Legacy HSK 3.0 One-Off Scripts & Staging Data (MEDIUM Risk)

| Scope | Count | Why Preserved | Recommendation |
|---|---:|---|---|
| Root `scripts/*.py` one-off migration/patching scripts (e.g., `patch_content_controller*.py`, `update_*.py`, `remedy_*.py`, `build_140_lessons_content.py`) | ~52 | Historical audit trail; some document earlier phase fixes (`remedy_lessons_1_to_3_pedagogy.py`, `verify_phase81_content_integrity.py`) | Move one-off patchers to `scripts/archive/legacy/` after stakeholder sign-off |
| `scripts/hsk30/*.py` & `data/hsk30/` | 83 scripts / 80 data files | Required for HSK 3.0 audit history, Phase 9.1–9.4 verification manifests, and pre-import snapshots (`hsk3_pre_import_snapshot.json`, `hsk4_pre_import_snapshot.json`) | Archive `scripts/hsk30/` & `data/hsk30/` only after HSK 2.0 DB import & human sign-off |
| `docs/hsk30/*` | 169 files | Historical phase acceptance trail (root duplicates already cleaned) | Optionally move to `docs/archive/hsk30/` later |

---

## 4. Test Screenshots & Ignorable Generated Outputs (LOW-MEDIUM Risk)

| Scope | Count | Findings | Recommendation |
|---|---:|---|---|
| `Fontend/screenshots/*.png` (specifically 9 unreferenced files: `admin-dashboard-before-*.png`, `fluid-dashboard-*.png`, `fluid-lesson-*.png`) | 9 unreferenced (of 51) | 42 are referenced in `docs/` QA reports; 9 appear orphaned before/viewport captures; `admin-dashboard-after-mobile-390.png` & `admin-mobile-390.png` are duplicate bytes | Approve removal of 9 unreferenced PNGs after checking external PR links |
| `Fontend/e2e/screenshots/*.png` | 7 unreferenced (of 23) | Playwright writes into this folder during E2E runs; 16 files referenced in historical QA docs | Move referenced QA evidence to `docs/` and gitignore runtime `Fontend/e2e/screenshots/` |
| `Fontend/.agents/` | 51 files | Local agent skill reference files tracked in repo | Confirm with team if `.agents/` should stay tracked or be moved to dev tooling |

---

## 5. Security Credentials Rotation (HIGH Priority Operational Action)

- Rotate demo passwords in any shared/staging/production databases because `Demo@***` appeared in historical Git commits and remains as dev fallback in `DbInitializer.cs` and `LearningIntegrationTests.cs`.
- Migrate `Fontend/e2e/content-manager-ui-and-export.spec.ts` (`Content***`), `admin-user-organization-crud.spec.ts`, and `LearningIntegrationTests.cs:321` to centralized environment config in a dedicated test cleanup PR.

