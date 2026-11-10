# ZhongWenHub AI Collaboration Bridge — Setup & Operational Guide

## 1. Prerequisites

- Python 3.10+ (Standard library, no pip install required for core bridge; optional `jsonschema` for external validators).
- Git 2.40+ configured with repo access: `nguyen2234/ZhongWenHub`.
- GitHub CLI (`gh`) authenticated with repository scope (`repo`, `read:org`).
- .NET 10 SDK & SQL Server Express (`.\SQLEXPRESS`).
- Bun v1.2+ for frontend builds and tests.

## 2. Directory Layout Initialization

To initialize or verify the `.ai-collaboration/` workspace:

```bash
python scripts/ai_bridge/bridge.py init
```

This verifies the existence of required directories:
- `.ai-collaboration/protocol/` — JSON Schemas and Protocol reference
- `.ai-collaboration/tasks/` — Active and pending task manifests
- `.ai-collaboration/results/` — Execution results and evidence links
- `.ai-collaboration/reviews/` — Independent QA review manifests
- `.ai-collaboration/state/` — Global project state and checkpoints
- `.ai-collaboration/qa/` — Functional test matrix, coverage, release gate
- `.ai-collaboration/examples/` — Reference templates

## 3. CLI Commands Reference

| Command | Description | Example |
| :--- | :--- | :--- |
| `init` | Initializes workspace structure | `python scripts/ai_bridge/bridge.py init` |
| `status` | Summarizes all tasks, revisions, and PR #16 | `python scripts/ai_bridge/bridge.py status` |
| `create-task` | Registers new task from JSON file | `python scripts/ai_bridge/bridge.py create-task --file task.json` |
| `claim-task` | Claims task for execution (sets lock & expiry) | `python scripts/ai_bridge/bridge.py claim-task TASK-001` |
| `checkpoint` | Saves execution progress checkpoint | `python scripts/ai_bridge/bridge.py checkpoint TASK-001 --batch 1 --total 3` |
| `resume` | Resumes task from last saved checkpoint | `python scripts/ai_bridge/bridge.py resume TASK-001` |
| `complete-task` | Submits task execution result | `python scripts/ai_bridge/bridge.py complete-task TASK-001 --commit abc1234` |
| `submit-review` | Submits independent QA decision | `python scripts/ai_bridge/bridge.py submit-review TASK-001 --decision ACCEPTED` |
| `validate` | Validates all tasks and results against schema | `python scripts/ai_bridge/validate_protocol.py all` |
| `sync-github` | Synchronizes pending tasks to GitHub Issues | `python scripts/ai_bridge/bridge.py sync-github` |

## 4. Running Self-Tests

Execute the complete 33-test acceptance test suite locally:

```bash
python -m unittest discover -s scripts/ai_bridge/tests -p "test_*.py"
```

