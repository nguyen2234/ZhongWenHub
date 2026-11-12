#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ZhongWenHub AI Collaboration & Independent QA Bridge — V1 CLI
Central control interface for task creation, atomic claims, checkpoint resumption,
execution completion, independent reviews, schema validation, and GitHub synchronization.
"""

import os
import sys
import uuid
import json
import argparse
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List

# Ensure scripts/ai_bridge is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from validate_protocol import ProtocolValidator
from sanitize_evidence import sanitize_data, sanitize_text
from github_sync import GitHubSyncEngine


def get_base_dir() -> str:
    """Returns absolute path to the root repository directory (D:\\ZhongWenHub)."""
    return os.path.dirname(os.path.dirname(current_dir))


def get_collab_dir() -> str:
    return os.path.join(get_base_dir(), ".ai-collaboration")


def atomic_write_json(file_path: str, data: Any):
    """Writes JSON data atomically via temporary file replacement."""
    os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
    temp_path = f"{file_path}.tmp.{uuid.uuid4().hex}"
    sanitized = sanitize_data(data)
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(sanitized, f, indent=2, ensure_ascii=False)
        f.flush()
        os.fsync(f.fileno())
    os.replace(temp_path, file_path)


class CollaborationBridge:
    def __init__(self, dry_run: bool = False):
        self.base_dir = get_base_dir()
        self.collab_dir = get_collab_dir()
        self.validator = ProtocolValidator()
        self.github = GitHubSyncEngine(dry_run=dry_run)
        self.dry_run = dry_run

    def get_task_path(self, task_id: str) -> str:
        return os.path.join(self.collab_dir, "tasks", f"{task_id}.json")

    def get_result_path(self, task_id: str) -> str:
        return os.path.join(self.collab_dir, "results", f"{task_id}_result.json")

    def get_review_path(self, task_id: str) -> str:
        return os.path.join(self.collab_dir, "reviews", f"{task_id}_review.json")

    def get_checkpoint_path(self, task_id: str) -> str:
        return os.path.join(self.collab_dir, "state", "checkpoints", f"{task_id}.json")

    def load_task(self, task_id: str) -> dict:
        path = self.get_task_path(task_id)
        if not os.path.isfile(path):
            raise FileNotFoundError(f"Task file not found: {path}")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    # 1. INIT
    def init(self):
        """Initializes directories and project_state.json."""
        subdirs = ["protocol", "tasks", "results", "reviews", "state", "state/checkpoints", "qa", "examples", "archive"]
        for sd in subdirs:
            p = os.path.join(self.collab_dir, sd)
            os.makedirs(p, exist_ok=True)

        state_path = os.path.join(self.collab_dir, "state", "project_state.json")
        if not os.path.isfile(state_path):
            initial_state = {
                "schema_version": "1.0.0",
                "project": "ZhongWenHub",
                "repository": "nguyen2234/ZhongWenHub",
                "active_branch": "integration/zhongwenhub-sqlserver",
                "pull_request": {
                    "number": 16,
                    "title": "feat(integration): integrate fullstack with SQL Server, 3-tier architecture & responsive UI",
                    "state": "OPEN",
                    "is_draft": True
                },
                "bridge_status": "INITIALIZED",
                "last_synced_at": datetime.now(timezone.utc).isoformat(),
                "active_task_id": None,
                "completed_tasks_count": 0,
                "pending_tasks_count": 0,
                "blocked_tasks_count": 0,
                "database_safety": {
                    "protected_dev_database": "ZhongWenHub_Dev",
                    "testing_database": "ZhongWenHub_Test",
                    "zero_write_dev_policy": "STRICT_ENFORCED"
                }
            }
            atomic_write_json(state_path, initial_state)
            print(f"Initialized project_state.json at {state_path}")
        else:
            print(f"Project state already initialized at {state_path}")
        print("Collaboration workspace ready.")

    # 2. CREATE TASK
    def create_task(self, task_dict: dict, sync_gh: bool = True) -> str:
        """Creates a new task and writes it atomically."""
        task_id = task_dict.get("task_id")
        if not task_id:
            raise ValueError("Task dictionary must include 'task_id'.")

        path = self.get_task_path(task_id)
        if os.path.isfile(path):
            raise ValueError(f"Task '{task_id}' already exists at {path}.")

        # Enforce defaults and timestamps
        now = datetime.now(timezone.utc).isoformat()
        task_dict.setdefault("schema_version", "1.0.0")
        task_dict.setdefault("project", "ZhongWenHub")
        task_dict.setdefault("status", "PENDING")
        task_dict.setdefault("revision", 1)
        task_dict.setdefault("owner", "ChatGPT")
        task_dict.setdefault("reviewer", "ChatGPT")
        task_dict.setdefault("executor", None)
        task_dict.setdefault("issue_number", None)
        task_dict.setdefault("created_at", now)
        task_dict.setdefault("updated_at", now)

        # Validate against schema
        valid, errors = self.validator.validate("task", task_dict)
        if not valid:
            raise ValueError(f"Task validation failed:\n" + "\n".join(errors))

        # Write task file
        atomic_write_json(path, task_dict)
        print(f"Created task '{task_id}' (Revision {task_dict['revision']}) at {path}")

        # Sync to GitHub
        if sync_gh and self.github.is_available():
            ok, issue_num, msg = self.github.sync_task_issue(task_dict)
            if ok and issue_num:
                task_dict["issue_number"] = issue_num
                atomic_write_json(path, task_dict)
                self.github.post_issue_event(
                    task_id=task_id,
                    issue_number=issue_num,
                    event_name="TASK_CREATED",
                    actor=task_dict["owner"],
                    details={"status": "PENDING", "revision": 1, "summary": task_dict["description"]}
                )
                print(f"Synced task to GitHub: {msg}")

        return task_id

    # 3. CLAIM TASK
    def claim_task(self, task_id: str, executor: str = "Antigravity", timeout_hours: int = 4) -> dict:
        """Claims a task atomically, checking for conflicts."""
        task = self.load_task(task_id)
        current_status = task["status"]

        # Check claim status and active claim conflict
        if current_status == "CLAIMED":
            expires_at_str = task.get("claim_expires_at")
            if expires_at_str:
                expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
                if datetime.now(timezone.utc) < expires_at:
                    raise ValueError(f"Task '{task_id}' is already claimed by '{task.get('executor', 'another agent')}' until {expires_at_str}.")
            else:
                raise ValueError(f"Task '{task_id}' is already claimed by '{task.get('executor', 'another agent')}'.")
        elif current_status not in ["PENDING", "CHANGES_REQUESTED"]:
            raise ValueError(f"Cannot claim task '{task_id}' in state '{current_status}'. Must be PENDING or CHANGES_REQUESTED.")

        now = datetime.now(timezone.utc)
        expires = now + timedelta(hours=timeout_hours)

        task["status"] = "CLAIMED"
        task["executor"] = executor
        task["revision"] += 1
        task["claim_expires_at"] = expires.isoformat()
        task["updated_at"] = now.isoformat()

        valid, errors = self.validator.validate("task", task)
        if not valid:
            raise ValueError(f"Task validation failed after claim update:\n" + "\n".join(errors))

        path = self.get_task_path(task_id)
        atomic_write_json(path, task)
        print(f"Task '{task_id}' claimed by '{executor}'. New revision: {task['revision']}. Expires: {task['claim_expires_at']}")

        # GitHub event
        if self.github.is_available() and task.get("issue_number"):
            self.github.post_issue_event(
                task_id=task_id,
                issue_number=task["issue_number"],
                event_name="TASK_CLAIMED",
                actor=executor,
                details={
                    "status": "CLAIMED",
                    "revision": task["revision"],
                    "summary": f"Claimed by {executor}. Timeout: {timeout_hours}h (until {task['claim_expires_at']})."
                }
            )

        return task

    # 4. CHECKPOINT
    def save_checkpoint(
        self,
        task_id: str,
        batch_number: int,
        total_batches: int,
        batch_name: str,
        completed_steps: List[str],
        remaining_steps: List[str],
        file_hashes: Dict[str, str],
        intermediate_data: Optional[dict] = None
    ) -> str:
        """Saves execution progress checkpoint."""
        task = self.load_task(task_id)
        if task["status"] not in ["CLAIMED", "RUNNING", "CHECKPOINT_SAVED"]:
            raise ValueError(f"Cannot save checkpoint for task in state '{task['status']}'.")

        now = datetime.now(timezone.utc).isoformat()
        checkpoint_id = f"ckpt_{task_id}_b{batch_number}_{uuid.uuid4().hex[:6]}"

        checkpoint_data = {
            "schema_version": "1.0.0",
            "checkpoint_id": checkpoint_id,
            "task_id": task_id,
            "task_revision": task["revision"],
            "execution_id": f"exec_{task_id}",
            "batch_number": batch_number,
            "total_batches": total_batches,
            "batch_name": batch_name,
            "completed_steps": completed_steps,
            "in_progress_step": remaining_steps[0] if remaining_steps else None,
            "remaining_steps": remaining_steps,
            "file_hashes": file_hashes,
            "intermediate_data": intermediate_data or {},
            "can_resume": True,
            "created_at": now
        }

        valid, errors = self.validator.validate("checkpoint", checkpoint_data)
        if not valid:
            raise ValueError(f"Checkpoint schema validation failed:\n" + "\n".join(errors))

        cp_path = self.get_checkpoint_path(task_id)
        atomic_write_json(cp_path, checkpoint_data)

        # Update task state
        task["status"] = "CHECKPOINT_SAVED"
        task["checkpoint_path"] = cp_path
        task["updated_at"] = now
        atomic_write_json(self.get_task_path(task_id), task)

        print(f"Saved Checkpoint {batch_number}/{total_batches} ('{batch_name}') for task '{task_id}'.")

        if self.github.is_available() and task.get("issue_number"):
            self.github.post_issue_event(
                task_id=task_id,
                issue_number=task["issue_number"],
                event_name="CHECKPOINT_SAVED",
                actor=task.get("executor", "Antigravity"),
                details={
                    "status": "CHECKPOINT_SAVED",
                    "revision": task["revision"],
                    "summary": f"Batch {batch_number}/{total_batches} ({batch_name}) completed. Next: {checkpoint_data['in_progress_step']}"
                }
            )

        return cp_path

    # 5. COMPLETE TASK
    def complete_task(
        self,
        task_id: str,
        commit_sha: str,
        branch: str,
        changed_files: List[str],
        test_results: List[dict],
        status: str = "PASS",
        summary: str = "",
        evidence_links: Optional[List[str]] = None,
        warnings: Optional[List[str]] = None,
        blockers: Optional[List[str]] = None
    ) -> dict:
        """Records completed execution and moves task to WAITING_FOR_REVIEW."""
        task = self.load_task(task_id)
        if task["status"] not in ["CLAIMED", "RUNNING", "CHECKPOINT_SAVED"]:
            raise ValueError(f"Cannot complete task '{task_id}' in status '{task['status']}'.")

        now = datetime.now(timezone.utc).isoformat()
        execution_id = f"exec_{task_id}_{uuid.uuid4().hex[:8]}"

        result_data = {
            "schema_version": "1.0.0",
            "task_id": task_id,
            "task_revision": task["revision"],
            "execution_id": execution_id,
            "executor": task.get("executor", "Antigravity"),
            "commit_sha": commit_sha,
            "branch": branch,
            "changed_files": changed_files,
            "started_at": task.get("updated_at", now),
            "finished_at": now,
            "status": status,
            "summary": summary or f"Task execution completed with status {status}.",
            "test_results": test_results,
            "evidence_links": evidence_links or [],
            "warnings": warnings or [],
            "blockers": blockers or [],
            "checkpoint_path": task.get("checkpoint_path")
        }

        valid, errors = self.validator.validate("result", result_data)
        if not valid:
            raise ValueError(f"Result schema validation failed:\n" + "\n".join(errors))

        res_path = self.get_result_path(task_id)
        atomic_write_json(res_path, result_data)

        # Update task status to WAITING_FOR_REVIEW
        task["status"] = "WAITING_FOR_REVIEW"
        task["revision"] += 1
        task["updated_at"] = now
        atomic_write_json(self.get_task_path(task_id), task)

        print(f"Task '{task_id}' execution completed. Saved result to {res_path}. Status: WAITING_FOR_REVIEW (Revision {task['revision']}).")

        if self.github.is_available() and task.get("issue_number"):
            self.github.post_issue_event(
                task_id=task_id,
                issue_number=task["issue_number"],
                event_name="EXECUTION_COMPLETED",
                actor=result_data["executor"],
                commit_sha=commit_sha,
                details={
                    "status": "WAITING_FOR_REVIEW",
                    "revision": task["revision"],
                    "summary": f"{result_data['summary']}\nWaiting for independent review by {task['reviewer']}.",
                    "warnings": warnings,
                    "blockers": blockers
                }
            )

        return result_data

    # 6. SUBMIT REVIEW
    def submit_review(
        self,
        task_id: str,
        decision: str,
        reviewed_commit_sha: str,
        summary: str,
        findings: List[dict],
        required_actions: List[str],
        conditions: Optional[List[str]] = None,
        reviewer: str = "ChatGPT"
    ) -> dict:
        """Submits independent QA review and updates task state accordingly."""
        task = self.load_task(task_id)
        if task["status"] not in ["WAITING_FOR_REVIEW", "REVIEWING"]:
            raise ValueError(f"Cannot review task '{task_id}' in status '{task['status']}'. Must be WAITING_FOR_REVIEW or REVIEWING.")

        result_path = self.get_result_path(task_id)
        if not os.path.isfile(result_path):
            raise FileNotFoundError(f"Cannot review task '{task_id}': Result file missing ({result_path}).")

        with open(result_path, "r", encoding="utf-8") as f:
            result = json.load(f)

        # Validate commit_sha match
        if reviewed_commit_sha != result.get("commit_sha"):
            raise ValueError(
                f"Commit SHA mismatch! Reviewed SHA '{reviewed_commit_sha}' does not match result commit SHA '{result.get('commit_sha')}'."
            )

        now = datetime.now(timezone.utc).isoformat()
        review_id = f"rev_{task_id}_{uuid.uuid4().hex[:8]}"

        review_data = {
            "schema_version": "1.0.0",
            "review_id": review_id,
            "task_id": task_id,
            "task_revision": task["revision"],
            "execution_id": result.get("execution_id", "unknown"),
            "reviewer": reviewer,
            "reviewed_commit_sha": reviewed_commit_sha,
            "review_timestamp": now,
            "decision": decision,
            "summary": summary,
            "findings": findings,
            "required_actions": required_actions,
            "conditions": conditions or []
        }

        valid, errors = self.validator.validate("review", review_data)
        if not valid:
            raise ValueError(f"Review schema validation failed:\n" + "\n".join(errors))

        rev_path = self.get_review_path(task_id)
        atomic_write_json(rev_path, review_data)

        # Transition task state based on review decision
        if decision == "ACCEPTED":
            task["status"] = "ACCEPTED"
        elif decision == "CHANGES_REQUESTED":
            task["status"] = "CHANGES_REQUESTED"
        elif decision == "BLOCKED":
            task["status"] = "BLOCKED"
        else:
            raise ValueError(f"Invalid review decision: {decision}")

        task["revision"] += 1
        task["updated_at"] = now
        atomic_write_json(self.get_task_path(task_id), task)

        print(f"Review submitted for '{task_id}': {decision}. New task status: {task['status']} (Rev {task['revision']}).")

        if self.github.is_available() and task.get("issue_number"):
            event_name = "TASK_ACCEPTED" if decision == "ACCEPTED" else ("CHANGES_REQUESTED" if decision == "CHANGES_REQUESTED" else "TASK_BLOCKED")
            self.github.post_issue_event(
                task_id=task_id,
                issue_number=task["issue_number"],
                event_name=event_name,
                actor=reviewer,
                commit_sha=reviewed_commit_sha,
                details={
                    "status": task["status"],
                    "revision": task["revision"],
                    "summary": f"**Review Decision**: `{decision}`\n\n{summary}"
                }
            )

        return review_data

    # 7. STATUS
    def status(self):
        """Displays status summary table of all bridge tasks and PR #16."""
        tasks_dir = os.path.join(self.collab_dir, "tasks")
        tasks = []
        if os.path.isdir(tasks_dir):
            for fname in os.listdir(tasks_dir):
                if fname.endswith(".json"):
                    try:
                        with open(os.path.join(tasks_dir, fname), "r", encoding="utf-8") as f:
                            tasks.append(json.load(f))
                    except Exception:
                        pass

        print("=" * 80)
        print("ZHONGWENHUB AI COLLABORATION BRIDGE — STATUS OVERVIEW")
        print("=" * 80)
        print(f"Repository: nguyen2234/ZhongWenHub | Branch: integration/zhongwenhub-sqlserver | PR: #16 (DRAFT)")
        print(f"Total Tasks: {len(tasks)}")
        print("-" * 80)
        print(f"{'Task ID':<25} | {'Status':<18} | {'Rev':<4} | {'Issue':<7} | {'Executor':<15}")
        print("-" * 80)
        for t in sorted(tasks, key=lambda x: x.get("created_at", "")):
            issue_str = f"#{t.get('issue_number')}" if t.get('issue_number') else "None"
            exec_str = t.get("executor") or "Unassigned"
            print(f"{t['task_id']:<25} | {t['status']:<18} | {t.get('revision', 1):<4} | {issue_str:<7} | {exec_str:<15}")
        print("=" * 80)

    # 8. VALIDATE ALL
    def validate_all(self) -> bool:
        """Validates all JSON files in .ai-collaboration against schemas."""
        all_passed = True
        schema_dir_map = {
            "task": os.path.join(self.collab_dir, "tasks"),
            "result": os.path.join(self.collab_dir, "results"),
            "review": os.path.join(self.collab_dir, "reviews"),
            "checkpoint": os.path.join(self.collab_dir, "state", "checkpoints"),
        }

        print("Validating collaboration files against Draft-07 Schemas...")
        for schema_type, dir_path in schema_dir_map.items():
            if not os.path.isdir(dir_path):
                continue
            for fname in os.listdir(dir_path):
                if fname.endswith(".json"):
                    full_p = os.path.join(dir_path, fname)
                    with open(full_p, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    valid, errors = self.validator.validate(schema_type, data)
                    if valid:
                        print(f"  ✓ [{schema_type.upper()}] {fname}: VALID")
                    else:
                        print(f"  ✗ [{schema_type.upper()}] {fname}: INVALID")
                        for e in errors:
                            print(f"      - {e}")
                        all_passed = False

        return all_passed

    # 9. RESUME
    def resume_task(self, task_id: str) -> dict:
        """Resumes a task from its latest checkpoint."""
        task = self.load_task(task_id)
        cp_path = self.get_checkpoint_path(task_id)
        if not os.path.isfile(cp_path):
            raise FileNotFoundError(f"No checkpoint found for task '{task_id}'. Cannot resume.")

        with open(cp_path, "r", encoding="utf-8") as f:
            cp = json.load(f)

        if not cp.get("can_resume"):
            raise ValueError(f"Checkpoint for task '{task_id}' indicates it cannot be resumed.")

        task["status"] = "RUNNING"
        task["revision"] += 1
        now = datetime.now(timezone.utc).isoformat()
        task["updated_at"] = now
        atomic_write_json(self.get_task_path(task_id), task)

        print(f"Task '{task_id}' resumed to RUNNING state.")
        print(f"  Completed Batches: {cp['batch_number']}/{cp['total_batches']} ({cp['batch_name']})")
        print(f"  Next step: {cp.get('in_progress_step')}")
        return cp

    # 10. SYNC GITHUB
    def sync_github(self) -> int:
        """Synchronizes all unsynced local tasks to GitHub Issues."""
        tasks_dir = os.path.join(self.collab_dir, "tasks")
        synced_count = 0
        if not os.path.isdir(tasks_dir):
            return 0

        for fname in os.listdir(tasks_dir):
            if fname.endswith(".json"):
                fpath = os.path.join(tasks_dir, fname)
                with open(fpath, "r", encoding="utf-8") as f:
                    task = json.load(f)
                if not task.get("issue_number"):
                    ok, issue_num, msg = self.github.sync_task_issue(task)
                    if ok:
                        atomic_write_json(fpath, task)
                        print(f"Synced '{task['task_id']}' -> {msg}")
                        synced_count += 1
                    else:
                        print(f"Failed to sync '{task['task_id']}': {msg}")
        return synced_count


def main():
    parser = argparse.ArgumentParser(description="ZhongWenHub AI Collaboration Bridge CLI")
    subparsers = parser.add_subparsers(dest="command", help="Bridge commands")

    # init
    subparsers.add_parser("init", help="Initialize collaboration workspace")

    # create-task
    p_create = subparsers.add_parser("create-task", help="Create a new task")
    p_create.add_argument("--file", required=True, help="Path to JSON file with task specification")
    p_create.add_argument("--no-gh", action="store_true", help="Do not sync to GitHub")

    # claim-task
    p_claim = subparsers.add_parser("claim-task", help="Claim a task")
    p_claim.add_argument("task_id", help="Task ID to claim")
    p_claim.add_argument("--executor", default="Antigravity", help="Executor name")
    p_claim.add_argument("--timeout", type=int, default=4, help="Timeout in hours")

    # checkpoint
    p_cp = subparsers.add_parser("checkpoint", help="Save execution checkpoint")
    p_cp.add_argument("task_id", help="Task ID")
    p_cp.add_argument("--batch", type=int, required=True, help="Batch number")
    p_cp.add_argument("--total", type=int, required=True, help="Total batches")
    p_cp.add_argument("--name", default="Execution Batch", help="Batch name")
    p_cp.add_argument("--step", default="Step Completed", help="Completed step summary")

    # complete-task
    p_comp = subparsers.add_parser("complete-task", help="Complete task execution")
    p_comp.add_argument("task_id", help="Task ID")
    p_comp.add_argument("--commit", required=True, help="Commit SHA")
    p_comp.add_argument("--branch", default="integration/zhongwenhub-sqlserver", help="Branch name")
    p_comp.add_argument("--summary", default="Execution completed", help="Summary")

    # submit-review
    p_rev = subparsers.add_parser("submit-review", help="Submit independent QA review")
    p_rev.add_argument("task_id", help="Task ID")
    p_rev.add_argument("--decision", required=True, choices=["ACCEPTED", "CHANGES_REQUESTED", "BLOCKED"], help="Decision")
    p_rev.add_argument("--commit", required=True, help="Reviewed commit SHA")
    p_rev.add_argument("--summary", required=True, help="Review summary")

    # status
    subparsers.add_parser("status", help="Show tasks status overview")

    # validate
    subparsers.add_parser("validate", help="Validate all collaboration files against schemas")

    # sync-github
    subparsers.add_parser("sync-github", help="Synchronize unsynced tasks to GitHub")

    # resume
    p_resume = subparsers.add_parser("resume", help="Resume task from checkpoint")
    p_resume.add_argument("task_id", help="Task ID to resume")

    # dry-run flag
    parser.add_argument("--dry-run", action="store_true", help="Run without mutating GitHub")

    args = parser.parse_args()
    bridge = CollaborationBridge(dry_run=args.dry_run)

    if args.command == "init":
        bridge.init()
    elif args.command == "create-task":
        with open(args.file, "r", encoding="utf-8") as f:
            data = json.load(f)
        bridge.create_task(data, sync_gh=not args.no_gh)
    elif args.command == "claim-task":
        bridge.claim_task(args.task_id, executor=args.executor, timeout_hours=args.timeout)
    elif args.command == "checkpoint":
        bridge.save_checkpoint(
            task_id=args.task_id,
            batch_number=args.batch,
            total_batches=args.total,
            batch_name=args.name,
            completed_steps=[args.step],
            remaining_steps=[],
            file_hashes={}
        )
    elif args.command == "complete-task":
        bridge.complete_task(
            task_id=args.task_id,
            commit_sha=args.commit,
            branch=args.branch,
            changed_files=[],
            test_results=[],
            summary=args.summary
        )
    elif args.command == "submit-review":
        bridge.submit_review(
            task_id=args.task_id,
            decision=args.decision,
            reviewed_commit_sha=args.commit,
            summary=args.summary,
            findings=[],
            required_actions=[]
        )
    elif args.command == "status":
        bridge.status()
    elif args.command == "validate":
        ok = bridge.validate_all()
        sys.exit(0 if ok else 1)
    elif args.command == "sync-github":
        bridge.sync_github()
    elif args.command == "resume":
        bridge.resume_task(args.task_id)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
