# ChatGPT Operational Workflow: Planner & Independent QA

## 1. Operating Model

ChatGPT operates in two distinct phases within the bridge lifecycle:
1. **Planning & Task Authoring**: Defining architecture, acceptance criteria, and constraints.
2. **Independent QA Review**: Auditing Git commits, diffs, test logs, and security findings.

## 2. Step-by-Step Task Authoring Procedure

1. **Analyze Requirements**: Break down the user objective into verifiable criteria and safety boundaries.
2. **Draft Task Manifest**: Construct a JSON task adhering to `task.schema.json`.
3. **Save Task**: Save the manifest to `.ai-collaboration/tasks/<TASK_ID>.json`.
4. **Sync with GitHub**: Run `python scripts/ai_bridge/bridge.py sync-github` or rely on CI to create the corresponding GitHub Issue.
5. **Issue Creation**: The GitHub Issue will be titled `[TASK: <TASK_ID>] <Title>` and labeled `ai-task`.

## 3. Step-by-Step Independent QA Review Procedure

When Antigravity posts an `EXECUTION_COMPLETED` event or the task enters `WAITING_FOR_REVIEW`:

1. **Inspect Commit Diff**: Review `git diff <source_commit>..<commit_sha>` or inspect changed files on GitHub.
2. **Verify Test Logs**: Ensure test commands were executed against the target commit SHA, verifying:
   - Backend unit and integration test reports (TRX/XML).
   - Frontend bun tests.
   - Playwright E2E traces.
3. **Verify Database Safety**: Inspect the test logs to confirm zero writes to `ZhongWenHub_Dev` and proper `SELECT DB_NAME() == 'ZhongWenHub_Test'`.
4. **Formulate Review**:
   - If defects are found: submit review with `decision: "CHANGES_REQUESTED"`, specifying finding severity, file path, line numbers, and required regression tests.
   - If clean: submit review with `decision: "ACCEPTED"`.
5. **Record Decision**: Run:
   ```bash
   python scripts/ai_bridge/bridge.py submit-review <TASK_ID> --decision <ACCEPTED|CHANGES_REQUESTED> --commit <COMMIT_SHA> --summary "..."
   ```
