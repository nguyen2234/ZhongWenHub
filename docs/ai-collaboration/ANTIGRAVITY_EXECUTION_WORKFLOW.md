# Antigravity Operational Workflow: Developer & Test Executor

## 1. Operating Model

Antigravity executes engineering tasks defined by ChatGPT:
- Claiming tasks with optimistic concurrency locks.
- Writing production code and unit/integration/E2E tests.
- Executing tests on real local runtimes (Bun, .NET, Playwright).
- Generating sanitized QA evidence.
- Committing to Git and pushing to `integration/zhongwenhub-sqlserver`.
- Addressing review feedback.

## 2. Step-by-Step Execution Procedure

### Step 1: Check Active Tasks & Claim
```bash
python scripts/ai_bridge/bridge.py status
python scripts/ai_bridge/bridge.py claim-task <TASK_ID> --executor "Antigravity"
```

### Step 2: Implement in Technical Batches
Divide execution into discrete steps. After each batch, record a checkpoint:
```bash
python scripts/ai_bridge/bridge.py checkpoint <TASK_ID> --batch 1 --total 3 --name "Core Engine"
```

### Step 3: Run Real Automated Tests
- Backend tests:
  ```bash
  dotnet test Backend/ZhongWenHub.sln
  ```
- Frontend tests:
  ```bash
  cd Fontend && bun test src/tests
  ```
- Playwright E2E:
  ```bash
  cd Fontend && bunx playwright test --project=desktop-1440
  ```

### Step 4: Commit & Push Changes
```bash
git add <changed_files>
git commit -m "feat(<scope>): <description>"
git push origin integration/zhongwenhub-sqlserver
```

### Step 5: Complete Task & Request Review
```bash
python scripts/ai_bridge/bridge.py complete-task <TASK_ID> --commit <COMMIT_SHA> --summary "Implemented feature with full test verification."
```
This updates the task status to `WAITING_FOR_REVIEW` and posts an `EXECUTION_COMPLETED` event to the GitHub Issue.
