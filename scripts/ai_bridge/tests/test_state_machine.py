#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import unittest
import sys
import os
import shutil
import tempfile
import json
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from bridge import CollaborationBridge


class TestStateMachine(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.bridge = CollaborationBridge(dry_run=True)
        self.bridge.collab_dir = os.path.join(self.temp_dir, ".ai-collaboration")
        self.bridge.init()

        self.sample_task = {
            "schema_version": "1.0.0",
            "task_id": "STATE-TASK-001",
            "title": "State Machine Transitions Test",
            "description": "Verifies state transitions and optimistic concurrency.",
            "project": "ZhongWenHub",
            "phase": "Test",
            "owner": "ChatGPT",
            "reviewer": "ChatGPT",
            "status": "PENDING",
            "revision": 1,
            "expected_branch": "integration/zhongwenhub-sqlserver",
            "source_commit": "9bfee9b",
            "input_files": [],
            "expected_outputs": [],
            "acceptance_criteria": ["Criteria A"],
            "safety_constraints": ["Constraint A"],
            "created_at": "2026-11-10T20:00:00Z",
            "updated_at": "2026-11-10T20:00:00Z"
        }
        self.bridge.create_task(self.sample_task, sync_gh=False)

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_claim_success(self):
        claimed = self.bridge.claim_task("STATE-TASK-001", executor="Antigravity", timeout_hours=2)
        self.assertEqual(claimed["status"], "CLAIMED")
        self.assertEqual(claimed["executor"], "Antigravity")
        self.assertEqual(claimed["revision"], 2)
        self.assertIsNotNone(claimed.get("claim_expires_at"))

    def test_concurrent_claim_conflict(self):
        self.bridge.claim_task("STATE-TASK-001", executor="AgentA", timeout_hours=2)
        # Attempt claim by AgentB while AgentA's claim is active
        with self.assertRaises(ValueError) as ctx:
            self.bridge.claim_task("STATE-TASK-001", executor="AgentB", timeout_hours=2)
        self.assertIn("already claimed", str(ctx.exception).lower())

    def test_checkpoint_and_resume(self):
        self.bridge.claim_task("STATE-TASK-001", executor="Antigravity")
        cp_path = self.bridge.save_checkpoint(
            task_id="STATE-TASK-001",
            batch_number=1,
            total_batches=3,
            batch_name="Batch 1: Setup",
            completed_steps=["Step 1"],
            remaining_steps=["Step 2", "Step 3"],
            file_hashes={"test.py": "abc123hash"}
        )
        self.assertTrue(os.path.isfile(cp_path))
        task = self.bridge.load_task("STATE-TASK-001")
        self.assertEqual(task["status"], "CHECKPOINT_SAVED")

        # Resume task
        resumed_cp = self.bridge.resume_task("STATE-TASK-001")
        task = self.bridge.load_task("STATE-TASK-001")
        self.assertEqual(task["status"], "RUNNING")
        self.assertEqual(resumed_cp["batch_number"], 1)

    def test_commit_mismatch_on_review_rejected(self):
        self.bridge.claim_task("STATE-TASK-001")
        test_results = [{
            "test_id": "T01",
            "test_name": "Unit Tests",
            "command": "bun test",
            "test_type": "UNIT",
            "environment": "Windows",
            "commit_sha": "aaaaaaa",
            "passed_count": 10,
            "failed_count": 0,
            "skipped_count": 0,
            "status": "PASS",
            "execution_timestamp": "2026-11-10T20:30:00Z"
        }]
        self.bridge.complete_task(
            task_id="STATE-TASK-001",
            commit_sha="aaaaaaa",
            branch="integration/zhongwenhub-sqlserver",
            changed_files=["file1.ts"],
            test_results=test_results
        )

        # Review with different commit SHA must be rejected
        with self.assertRaises(ValueError) as ctx:
            self.bridge.submit_review(
                task_id="STATE-TASK-001",
                decision="ACCEPTED",
                reviewed_commit_sha="bbbbbbb",  # Mismatch!
                summary="Looks good",
                findings=[],
                required_actions=[]
            )
        self.assertIn("mismatch", str(ctx.exception).lower())


if __name__ == "__main__":
    unittest.main()
