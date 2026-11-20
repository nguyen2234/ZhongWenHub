# ANTIGRAVITY DIRECT HANDOFF — CURRENT M1
Updated 2026-11-20. The original P00-first instructions were HISTORICAL; P00 PR #28 has already merged and post-merge FE/BE CI passed. This handoff supersedes the older sequence here.

**READ FIRST AND EXECUTE, DO NOT MERELY SUMMARIZE:**
1. `AGENTS.md`
2. `docs/implementation/2026-11-20-M1-FULLSTACK-RECOVERY-PLAN.md`
3. `docs/implementation/2026-11-20-ANTIGRAVITY-MASTER-EXECUTION-PROMPT.md` (FULL executable prompt)
4. GitHub Issue #27 (product scope), Issue #22 (ownership), PR #29 (F01 Draft) and open PRs #21/#23/#24/#25 (unmerged work)

**OWNER'S INSTRUCTION:** ONE BIG M1 FE↔BE↔SQL functional recovery phase, complete real end-to-end functions for all 5 roles; work continuously through internal batches without dozens of mini handoffs. Reports, Admin CRUD/API providers, basic+AI weak practice and dashboard, Teacher classes/homework/grading, Content HSK/moderation, all remaining menus and cohesive UI.

**GIT:** inspect local status before fetch/branch changes, preserve reported 11 uncommitted F01 files. P00 complete; PR #29 remains DRAFT (latest reviewed head `fde4c6c5a5ab3cadf42512ac590589d7fcdabe32`; refresh). Coordinate overlap via Issue #22. Never overwrite agent work or assume unmerged PR code is in main.

**SAFETY:** `ZhongWenHub_Dev` READ-ONLY. Tests use isolated `ZhongWenHub_Test`. No mock data in production, no fake passes, no unsafe API secrets. Browser/SQL E2E BLOCKED unless executed. `AGENTS.md` requires explicit approval before any app code commit/push; never auto-merge/main writes.

**ACTION:** Run git-first inventory and implement actual code in batch order defined by MASTER PROMPT. Do not stop after minor findings; self-debug and advance within M1. Report complete feature trace and QA evidence at macro boundaries. A saved prompt is NOT an executed code change.