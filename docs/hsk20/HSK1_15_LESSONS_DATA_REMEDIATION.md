# HSK 1 (15 Lessons) Data Remediation Report — `ZWH-HSK1-FINAL-DATA-REMEDIATION-AND-PUBLICATION`

## 1. Scope & Safety Policy
- **Branch:** `integration/zhongwenhub-sqlserver` (Base reference HEAD: `5d2f0b17ac5bd4c11ffb2214c29d9992b67eebed`, PR `#16` kept `OPEN` / `Draft`).
- **Database Protection:** `USER_APPROVAL_TOKEN.signed` is absent in the workspace, so protected databases (`ZhongWenHub_Test`, `ZhongWenHub_Dev`) were never modified.
  - Negative Approval Gate verification: running `python D:\ZhongWenHub\scripts\hsk20\prepare_hsk1_remediation_patch.py --apply --target ZhongWenHub_Test` exited with code `1` (`BLOCKED: USER_APPROVAL_TOKEN.signed is missing. Cannot write to ZhongWenHub_Test without explicit user approval.`).
- **Ephemeral QA Verification:** All SQL remediation writes were executed and verified against an isolated `COPY_ONLY` clone `ZhongWenHub_Ephemeral_QA`, which was subsequently dropped (`DB_ID('ZhongWenHub_Ephemeral_QA') = None`), leaving `ZhongWenHub_Test` and `ZhongWenHub_Dev` untouched (`HSK1 PublishedLessons=3`, `ExamTables=0` verified via `ApplicationIntent=ReadOnly`).

## 2. Remediation Tooling Fix (`scripts/hsk20/prepare_hsk1_remediation_patch.py`)
- Fixed a `pyodbc` multi-statement execution bug in [`prepare_hsk1_remediation_patch.py`](file:///D:/ZhongWenHub/scripts/hsk20/prepare_hsk1_remediation_patch.py#L1095-L1112): previously `autocommit=True` on `cur.execute(bundle["patchSql"])` silently exited without committing all 427 SQL statements.
- Updated apply mode to use explicit transaction control (`autocommit=False`), execute all `427` statements sequentially, and explicitly invoke `conn.commit()`.

## 3. Verified HSK 1 Lesson-by-Lesson Remediation Counts (`ZhongWenHub_Ephemeral_QA`)
On `ZhongWenHub_Ephemeral_QA`, applying the `427`-statement patch produced **150 active vocabularies** (`143` updated + `7` inserted; `160` surplus entries archived), **36 active grammar points** (`6` curated + `30` verified AllSet points; `66` placeholders archived), `6/6` `PUBLISHED` HSK 1 units, and **15/15 HSK 1 lessons** with zero missing sections or placeholder content:

| Lesson | Title (`TitleZh`) | Post-Publish Status (`Ephemeral_QA`) | Active Vocabularies | Active Grammar Points | Active Exercises |
|---|---|---|---:|---:|---:|
| L01 | 你好 | `PUBLISHED` | 10 | 3 | 3 |
| L02 | 谢谢你 | `PUBLISHED` | 9 | 2 | 4 |
| L03 | 你叫什么名字 | `PUBLISHED` | 8 | 3 | 3 |
| L04 | 他是我的汉语老师 | `PUBLISHED` | 14 | 2 | 4 |
| L05 | 我想喝茶 | `PUBLISHED` | 12 | 3 | 4 |
| L06 | 你在做什么呢 | `PUBLISHED` | 12 | 3 | 4 |
| L07 | 今天星期几 | `PUBLISHED` | 12 | 2 | 5 |
| L08 | 明天天气怎么样 | `PUBLISHED` | 13 | 3 | 4 |
| L09 | 现在几点 | `PUBLISHED` | 10 | 2 | 4 |
| L10 | 我星期一去北京 | `PUBLISHED` | 12 | 2 | 4 |
| L11 | 这个苹果多少钱 | `PUBLISHED` | 12 | 2 | 4 |
| L12 | 你去哪儿买东西 | `PUBLISHED` | 6 | 2 | 4 |
| L13 | 他在学校前面 | `PUBLISHED` | 8 | 2 | 4 |
| L14 | 你会开车吗 | `PUBLISHED` | 6 | 3 | 4 |
| L15 | 我是坐飞机来的 | `PUBLISHED` | 6 | 2 | 5 |

## 4. HSK 2–6 Scope Isolation
Observed lesson counts across HSK 2–6 on `ZhongWenHub_Ephemeral_QA` confirmed zero unintended edits or publications:
- HSK 2: `15` lessons (`DRAFT`)
- HSK 3: `20` lessons (`DRAFT`)
- HSK 4: `20` lessons (`DRAFT`)
- HSK 5: `30` lessons (`DRAFT`, Student UI shows Coming Soon / `Sắp ra mắt`)
- HSK 6: `40` lessons (`DRAFT`, Student UI shows Coming Soon / `Sắp ra mắt`)

## 5. Applying to `ZhongWenHub_Test` / `ZhongWenHub_Dev` After Approval
Once `USER_APPROVAL_TOKEN.signed` is explicitly issued by the project owner, the exact `427`-statement bundle can be applied safely to the target database via `scripts/hsk20/prepare_hsk1_remediation_patch.py --apply --target <DB_NAME>`, followed by EF migration `20261111060000_AddExamRepositoryTables` and two-person CMS `PENDING_REVIEW` -> Admin `PUBLISHED` workflow.
