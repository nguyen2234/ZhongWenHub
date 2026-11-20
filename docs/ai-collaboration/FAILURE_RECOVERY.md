# Crash Recovery & Timeout Resilience

## 1. Problem Statement

AI coding agents frequently encounter network timeouts or context window boundaries (e.g. `API error: stream idle timeout (5m0s): context deadline exceeded`).

When this occurs, an agent session abruptly terminates mid-task. Without robust persistence:
- Work-in-progress code can be corrupted.
- Intermediate outputs are lost.
- Successive sessions duplicate completed work or wipe existing state.

## 2. Recovery Architecture

The Collaboration Bridge implements atomic, batch-oriented checkpoints to solve this:

```mermaid
sequenceDiagram
    participant Agent as Antigravity Agent
    participant Bridge as bridge.py
    participant Disk as Local State (.ai-collaboration/)
    
    Agent->>Bridge: claim_task(TASK_ID)
    Bridge->>Disk: status = CLAIMED, rev = 2
    
    rect rgb(240, 248, 255)
        Note over Agent,Disk: Batch 1 Execution
        Agent->>Bridge: save_checkpoint(batch=1, hashes)
        Bridge->>Disk: status = CHECKPOINT_SAVED, checkpoint.json
    end
    
    Note over Agent: STREAM TIMEOUT / CRASH
    
    rect rgb(255, 240, 245)
        Note over Agent,Disk: Recovery Session
        Agent->>Bridge: resume_task(TASK_ID)
        Bridge->>Disk: Reads checkpoint.json, status = RUNNING
        Bridge-->>Agent: Returns completed batches & remaining steps
    end
    
    rect rgb(240, 248, 255)
        Note over Agent,Disk: Batch 2 Execution
        Agent->>Bridge: complete_task(commit_sha)
        Bridge->>Disk: status = WAITING_FOR_REVIEW
    end
```

## 3. Resuming from Checkpoint

When resuming a task:

```bash
python scripts/ai_bridge/bridge.py resume TASK_ID
```

The bridge:
1. Verifies that the task exists and is in `CHECKPOINT_SAVED` or `CLAIMED` status.
2. Reads the latest checkpoint from `.ai-collaboration/state/checkpoints/<TASK_ID>_cp_batch_X.json`.
3. Verifies file hashes of completed deliverables.
4. Transitions task status back to `RUNNING`.
5. Outputs the completed steps and next actionable step to the agent.

