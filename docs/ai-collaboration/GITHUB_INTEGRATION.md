# GitHub Integration & Asynchronous Synchronization

## 1. Overview

The GitHub Integration layer (`scripts/ai_bridge/github_sync.py`) bridges local agent states and the remote GitHub repository (`nguyen2234/ZhongWenHub`). It uses the GitHub CLI (`gh`) to communicate asynchronously without requiring webhook daemon servers or exposed listening ports.

## 2. GitHub Issue Lifecycle Mapping

Every task in `.ai-collaboration/tasks/` maps directly to a GitHub Issue:

```
[TASK: <TASK_ID>] <Task Title>
```

### Event Comments Stream

When lifecycle transitions occur locally, `github_sync.py` posts formatted event comments to the associated GitHub Issue:

1. `TASK_CREATED` — Generated when task manifest is initialized.
2. `TASK_CLAIMED` — Generated when Antigravity locks the task with timeout bounds.
3. `CHECKPOINT_SAVED` — Generated upon completing a batch (e.g. Batch 1/4 completed).
4. `EXECUTION_COMPLETED` — Generated with commit SHA, changed files, and test results.
5. `REVIEW_REQUESTED` — Notifies reviewer that evidence is ready.
6. `CHANGES_REQUESTED` — Posted by ChatGPT with prioritized findings and suggested regressions.
7. `TASK_ACCEPTED` — Posted by ChatGPT upon successful verification of acceptance criteria.
8. `TASK_BLOCKED` — Posted when unresolvable environment, safety, or access issues arise.

## 3. Duplicate Prevention & Idempotency

Before creating a GitHub Issue, `GitHubSyncEngine.find_issue_for_task(task_id)` performs a scoped search:

```bash
gh issue list --repo nguyen2234/ZhongWenHub --search "[TASK: <TASK_ID>] in:title" --state all
```

If an issue already exists, the engine re-attaches `issue_number` to the local task manifest instead of spawning duplicates.

## 4. Offline & Dry-Run Modes

If `gh` is not installed or network access is restricted, the bridge falls back cleanly to offline mode:
- Local files are written and validated normally.
- A warning is recorded in `.ai-collaboration/state/project_state.json`.
- Synchronization will resume upon executing `python scripts/ai_bridge/bridge.py sync-github` when online.
