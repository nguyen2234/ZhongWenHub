# Question Bank GitHub Audit & Import Pipeline Report

Generated: `2026-11-11T15:35:10.549449+00:00`

## 1. GitHub Repository License & Quality Audit

| Repository | Status | License | Decision | Rationale |
|---|---|---|---|---|
| `Roxaleen/hsk-annotated-corpus` | Exists (`main`) | None (`no LICENSE file`) | **REJECTED for import** | Missing explicit open-source license; corpus sentences/corpora cannot be redistributed blindly. |
| `drkameleon/complete-hsk-vocabulary` | Exists (`main`) | `MIT License` | **APPROVED** | Used as verified lexical baseline (already in `vocabularies`); generates validated `DRAFT` / `PENDING_REVIEW` drills linked to `VocabularyId`. |
| `InAnskr/HSK4Level-Test` | Exists (`main`) | `CC BY-NC-SA 4.0` | **APPROVED (Filtered Subset + Attribution)** | Educational non-commercial attribution (`CC-BY-NC-SA-4.0`); filtered strictly to self-contained text Q46–Q85 (`fill_in_blank`, `reading_ordering`, `reading_comprehension`). External `media.mandarinzone.com` audio/listening & picture/writing items skipped. |

## 2. `InAnskr/HSK4Level-Test` Normalization Statistics

- Total raw JSON questions across `test-01.json`..`test-12.json`: `1176`
- Skipped external audio / listening-dependent items: `490`
- Skipped incomplete / picture / ungraded writing items: `431`
- Rejected by validation (empty/duplicate options/bad index): `0`
- Validated pure-text HSK 4 items saved to `data/question-bank/inanskr_hsk4_normalized.json`: `255`

## 3. SQL Server Import Results (Zero Auto-Publish)

### `ZhongWenHub_Dev`
- Backfilled `ContentHash` on existing exercises: `587`
- Inserted `InAnskr/HSK4Level-Test` (DRAFT / PENDING_REVIEW): `250` (duplicates skipped: `5`)
- Inserted `drkameleon` MIT vocab drills (DRAFT / PENDING_REVIEW): `320` (duplicates skipped: `0`)
- Total `exercises` in DB: `1157`
- By HSK Level: `{1: 142, 2: 185, 3: 220, 4: 470, 5: 60, 6: 80}`
- Status / ReviewStatus breakdown:
  - `ARCHIVED` / `DRAFT`: `110`
  - `DRAFT` / `DRAFT`: `140`
  - `DRAFT` / `PENDING_REVIEW`: `570`
  - `PUBLISHED` / `APPROVED`: `337`

### `ZhongWenHub_Test`
- Backfilled `ContentHash` on existing exercises: `767`
- Inserted `InAnskr/HSK4Level-Test` (DRAFT / PENDING_REVIEW): `250` (duplicates skipped: `5`)
- Inserted `drkameleon` MIT vocab drills (DRAFT / PENDING_REVIEW): `320` (duplicates skipped: `0`)
- Total `exercises` in DB: `1337`
- By HSK Level: `{1: 142, 2: 245, 3: 300, 4: 510, 5: 60, 6: 80}`
- Status / ReviewStatus breakdown:
  - `ARCHIVED` / `DRAFT`: `290`
  - `DRAFT` / `DRAFT`: `140`
  - `DRAFT` / `PENDING_REVIEW`: `570`
  - `PUBLISHED` / `APPROVED`: `337`
