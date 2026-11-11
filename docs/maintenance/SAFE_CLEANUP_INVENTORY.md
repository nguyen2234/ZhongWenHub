# SAFE CLEANUP — REPOSITORY INVENTORY & DEPENDENCY ANALYSIS

**Task ID:** `ZWH-SAFE-CODEBASE-CLEANUP-2026`  
**Date:** 2026-11-11  
**Branch:** `integration/zhongwenhub-sqlserver`  

---

## 1. Repository Domain Classification Summary

*(Baseline inventory of 1,800 tracked files across `Fontend/`, `Backend/`, `scripts/`, `data/`, `docs/`, `.ai-collaboration/`, `.github/`, and root)*

| Domain | Count (Baseline) | Primary Classifications | Cleanup Outcome |
|---|---:|---|---|
| **Frontend Runtime & Tests (`Fontend/`)** | 1,049 | `ACTIVE`, `TEST_ONLY`, `REFACTOR_REQUIRED` (mock runtime), `SAFE_TO_DELETE` (12 dead files) | 12 dead/starter files removed; active runtime mocks strictly preserved |
| **Backend Solution (`Backend/`)** | 159 | `ACTIVE`, `TEST_ONLY` | 0 files deleted (`ApplicationDbContextFactory` & migrations preserved) |
| **Documentation (`docs/`)** | 213 | `ACTIVE` (`docs/hsk20`, `docs/architecture`), `LEGACY_REQUIRED` (`docs/hsk30` audit history) | All 213 preserved; 6 new `docs/maintenance/` reports added |
| **Automation & Migration Scripts (`scripts/`)** | 188 | `ACTIVE` (`scripts/hsk20`, `scripts/ai_bridge`, `scripts/hsk_sources`), `LEGACY_REQUIRED` (`scripts/hsk30`), `NEEDS_MANUAL_REVIEW` (legacy root scripts), `SAFE_TO_DELETE` (1 `.pyc`) | 1 `.pyc` removed; 2 live API scripts security-hardened |
| **Curriculum & Staging Data (`data/`)** | 84 | `ACTIVE` (`data/hsk20/`), `LEGACY_REQUIRED` (`data/hsk30/` rollback & audit) | 0 files deleted; DrKameleon HSK 2.0 & rollback snapshots 100% preserved |
| **AI Collaboration Bridge (`.ai-collaboration/`)** | 42 | `ACTIVE` (25+ validated protocol JSONs & QA matrices) | 0 files deleted (`validate_protocol.py` 25/25 PASS) |
| **CI/CD Workflows (`.github/workflows/`)** | 5 | `ACTIVE` (`backend-tests.yml`, `frontend-pr-ci.yml`, `ai-bridge-validate.yml`, `bridge-qa-gate.yml`, `deploy.yml`) | 0 files deleted |
| **Root-Level Loose Files** | 60 | `ACTIVE` (4: `.gitignore`, `README.md`, `requirements.txt`, `hsk-1.csv`), `SAFE_TO_DELETE` (56 exact SHA-256 duplicates of `docs/hsk30/`) | 56 exact duplicates removed (`docs/hsk30/` retains 100% identical copies) |

---

## 2. Critical Protection Check: Runtime Files Using Mock Data

Following static + dynamic dependency analysis across all 543 TS/TSX files in `Fontend/src/`, the following active modules **still rely on mock datasets at runtime or through repository/admin fallback paths**. They are explicitly classified **`REFACTOR_REQUIRED` / `ACTIVE` — DO NOT DELETE**:

| # | Runtime / Adapter File | Mock Symbol & Source | Feature Depending On It | Existing Backend Replacement? | Removal Status |
|---|---|---|---|---|---|
| 1 | `Fontend/src/features/grammar/services/grammar.service.ts` | `MOCK_GRAMMAR_POINTS` (`features/grammar/mock/mockGrammarData.ts`) | Grammar study list, detail lookup, categories (`getGrammarPoints`, `getGrammarPointById`, `getCategories`) | Partial (`/api/v1/content/grammar` exists; student feature service still uses static array) | **KEEP** until `grammar.service.ts` queries backend API |
| 2 | `Fontend/src/features/vocabulary/components/VocabularyBank.tsx` | `INITIAL_VOCABULARY_LIST` (`features/vocabulary/data/vocabularyBank.ts`) | Student Vocabulary Bank search/filter/browse UI | Partial (`/api/v1/content/vocabularies` exists) | **KEEP** until component migrates to API pagination |
| 3 | `Fontend/src/features/vocabulary/context/VocabularyReviewContext.tsx` | `INITIAL_VOCABULARY_LIST` (`features/vocabulary/data/vocabularyBank.ts`) | SRS Flashcard due-review queue hydration | Partial (`/api/v1/learning/me/vocabulary` exists) | **KEEP** until context reads SRS queue solely from API |
| 4 | `Fontend/src/features/lesson/services/lesson-content.service.ts` | `MOCK_LESSON_8_DRAFT` (`management/admin/content/data/mockLessonEditorData.ts`) | Offline / dev fallback when live backend lesson query fails or lesson lacks DB record | Live `/api/v1/content/lessons/{id}` works for DB lessons | **KEEP** (medium-risk fallback; `HskTextbookService` already isolated from mocks) |
| 5 | `Fontend/src/management/admin/content/services/hsk-repository.service.ts` | `MOCK_STANDARDS`, `MOCK_HSK_LEVELS`, `MOCK_VOCABULARIES`, `MOCK_GRAMMAR_POINTS`, `MOCK_CHARACTERS` (`mockHskRepositoryData.ts`) | Content Manager HSK Repository admin management fallback state | Partial (`/api/v1/content/*`) | **KEEP** until full admin repository migration |
| 6 | `Fontend/src/management/admin/content/services/curriculum.service.ts` | `MOCK_COURSES`, `MOCK_LESSONS`, `MOCK_UNITS`, `MOCK_LESSON_8_DRAFT` (`mockCurriculumData.ts`) | Admin Curriculum service fallback | Live `/api/v1/content/courses` & `/lessons` | **KEEP** (`ACTIVE` fallback in admin service) |
| 7 | `Fontend/src/core/repositories/adapters/mock-grammar.repository.ts` & `mock-exercise.repository.ts` | `MOCK_GRAMMAR_POINTS`, `PRACTICE_EXERCISE_POOL`, `MOCK_LESSON_8_DRAFT` | Repository pattern mock adapters & `fe-11-data-access-layer.test.ts` | Architectural adapter layer | **KEEP** (`ACTIVE` / `TEST_ONLY`) |

---

## 3. Protected Core Components & Dynamic Assets Verified `ACTIVE`

- **HSK 1 Learning Loop & Admin CRUD (100% Untouched):**
  - `HskTextbookLessonPage.tsx`, `LessonPage.tsx`, `hsk-textbook.service.ts`, `lesson-content.service.ts`
  - `AdminCurriculumPage.tsx`, `AdminLessonEditorPage.tsx`, `curriculum.service.ts`
  - `ContentController.cs`, `LearningController.cs`, `ContentService.cs`, `LearningService.cs`
- **Dynamic Audio Assets (`Fontend/public/audio/hsk1/*.mp3`):**
  - Confirmed referenced dynamically via JSON paths (`/audio/hsk1/les*_dialogue.mp3`, `/audio/hsk1/les*_listening.mp3`) stored inside SQL Server `lessons.DialogueJson` / `ListeningJson` (verified in `data/hsk20/staging/pre_import_test_db_snapshot.json`). Classified **`ACTIVE`**.
- **Root CSV Fixture (`hsk-1.csv`):**
  - Referenced directly by `Backend/tests/ZhongWenHub.IntegrationTests/Hsk1ImportIntegrationTests.cs` and `Fontend/src/tests/portal-switcher-and-excel-import.test.ts`. Classified **`TEST_ONLY`**.
- **Backend EF Core Design-Time Factory (`Backend/src/Data/Persistence/ApplicationDbContextFactory.cs`):**
  - Discovered via reflection by `dotnet ef`. Classified **`ACTIVE`**.
