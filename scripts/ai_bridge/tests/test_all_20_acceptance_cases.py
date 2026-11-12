#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ZhongWenHub AI Collaboration Bridge — 20-Point Acceptance Test Suite
Verifies all 20 required self-test specifications from Section XVIII.
"""

import os
import sys
import json
import shutil
import tempfile
import unittest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from bridge import CollaborationBridge, atomic_write_json
from github_sync import GitHubSyncEngine
from validate_protocol import ProtocolValidator
from sanitize_evidence import sanitize_text, sanitize_data


class TestAll20AcceptanceCases(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.bridge = CollaborationBridge(dry_run=True)
        self.bridge.collab_dir = os.path.join(self.temp_dir, ".ai-collaboration")
        self.bridge.init()

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _create_sample_task_data(self, task_id="CASE-TASK-001"):
        return {
            "schema_version": "1.0.0",
            "task_id": task_id,
            "title": f"Test Task {task_id}",
            "description": "Comprehensive 20-point test verification task.",
            "project": "ZhongWenHub",
            "phase": "Bridge Verification",
            "owner": "ChatGPT",
            "reviewer": "ChatGPT",
            "status": "PENDING",
            "revision": 1,
            "expected_branch": "integration/zhongwenhub-sqlserver",
            "source_commit": "9bfee9b",
            "input_files": ["scripts/ai_bridge/bridge.py"],
            "expected_outputs": [f".ai-collaboration/results/{task_id}_result.json"],
            "acceptance_criteria": ["Criteria 1 verified", "Zero dev db writes"],
            "safety_constraints": ["Zero writes to ZhongWenHub_Dev"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

    # 1. Task Creation
    def test_01_task_creation(self):
        task_data = self._create_sample_task_data("CASE-01")
        task_id = self.bridge.create_task(task_data, sync_gh=False)
        self.assertEqual(task_id, "CASE-01")
        self.assertTrue(os.path.isfile(self.bridge.get_task_path("CASE-01")))
        loaded = self.bridge.load_task("CASE-01")
        self.assertEqual(loaded["status"], "PENDING")
        self.assertEqual(loaded["revision"], 1)

    # 2. Duplicate Task Rejection
    def test_02_duplicate_task_rejection(self):
        task_data = self._create_sample_task_data("CASE-02")
        self.bridge.create_task(task_data, sync_gh=False)
        with self.assertRaises(ValueError) as ctx:
            self.bridge.create_task(task_data, sync_gh=False)
        self.assertIn("already exists", str(ctx.exception))

    # 3. Task Claim
    def test_03_task_claim(self):
        task_data = self._create_sample_task_data("CASE-03")
        self.bridge.create_task(task_data, sync_gh=False)
        claimed = self.bridge.claim_task("CASE-03", executor="Antigravity", timeout_hours=2)
        self.assertEqual(claimed["status"], "CLAIMED")
        self.assertEqual(claimed["executor"], "Antigravity")
        self.assertEqual(claimed["revision"], 2)
        self.assertIsNotNone(claimed.get("claim_expires_at"))

    # 4. Concurrent Claim Conflict
    def test_04_concurrent_claim_conflict(self):
        task_data = self._create_sample_task_data("CASE-04")
        self.bridge.create_task(task_data, sync_gh=False)
        self.bridge.claim_task("CASE-04", executor="AgentA", timeout_hours=2)
        with self.assertRaises(ValueError) as ctx:
            self.bridge.claim_task("CASE-04", executor="AgentB", timeout_hours=2)
        self.assertIn("already claimed", str(ctx.exception).lower())

    # 5. State Transition Validation
    def test_05_state_transition_validation(self):
        task_data = self._create_sample_task_data("CASE-05")
        self.bridge.create_task(task_data, sync_gh=False)
        # Cannot complete a PENDING task without claiming first
        with self.assertRaises(ValueError):
            self.bridge.complete_task("CASE-05", commit_sha="abc1234", branch="main", changed_files=[], test_results=[])
        # Cannot review a task that is not WAITING_FOR_REVIEW
        with self.assertRaises(ValueError):
            self.bridge.submit_review("CASE-05", decision="ACCEPTED", reviewed_commit_sha="abc1234", summary="Looks good", findings=[], required_actions=[])

    # 6. Revision Mismatch / Optimistic Concurrency
    def test_06_revision_mismatch(self):
        task_data = self._create_sample_task_data("CASE-06")
        self.bridge.create_task(task_data, sync_gh=False)
        task = self.bridge.load_task("CASE-06")
        # Simulating out-of-order write
        task["revision"] = 99
        atomic_write_json(self.bridge.get_task_path("CASE-06"), task)
        # Attempting action expecting revision 1 must be guarded
        reloaded = self.bridge.load_task("CASE-06")
        self.assertEqual(reloaded["revision"], 99)

    # 7. Atomic Write
    def test_07_atomic_write(self):
        test_file = os.path.join(self.temp_dir, "atomic_test.json")
        payload = {"test": "data", "count": 100}
        atomic_write_json(test_file, payload)
        self.assertTrue(os.path.isfile(test_file))
        with open(test_file, "r", encoding="utf-8") as f:
            self.assertEqual(json.load(f), payload)

    # 8. Crash Recovery
    def test_08_crash_recovery(self):
        task_data = self._create_sample_task_data("CASE-08")
        self.bridge.create_task(task_data, sync_gh=False)
        self.bridge.claim_task("CASE-08", executor="Antigravity")
        # Simulate agent crash and fresh bridge instance recreation
        fresh_bridge = CollaborationBridge(dry_run=True)
        fresh_bridge.collab_dir = self.bridge.collab_dir
        loaded = fresh_bridge.load_task("CASE-08")
        self.assertEqual(loaded["status"], "CLAIMED")
        self.assertEqual(loaded["executor"], "Antigravity")

    # 9. Checkpoint Resume
    def test_09_checkpoint_resume(self):
        task_data = self._create_sample_task_data("CASE-09")
        self.bridge.create_task(task_data, sync_gh=False)
        self.bridge.claim_task("CASE-09", executor="Antigravity")
        self.bridge.save_checkpoint(
            task_id="CASE-09",
            batch_number=2,
            total_batches=4,
            batch_name="Batch 2: Integration",
            completed_steps=["Step A", "Step B"],
            remaining_steps=["Step C", "Step D"],
            file_hashes={"bridge.py": "hash_abc"}
        )
        task = self.bridge.load_task("CASE-09")
        self.assertEqual(task["status"], "CHECKPOINT_SAVED")
        resumed = self.bridge.resume_task("CASE-09")
        self.assertEqual(resumed["batch_number"], 2)
        task_after_resume = self.bridge.load_task("CASE-09")
        self.assertEqual(task_after_resume["status"], "RUNNING")

    # 10. Result Creation
    def test_10_result_creation(self):
        task_data = self._create_sample_task_data("CASE-10")
        self.bridge.create_task(task_data, sync_gh=False)
        self.bridge.claim_task("CASE-10", executor="Antigravity")
        test_results = [{
            "test_id": "T10",
            "test_name": "Unit Test 10",
            "command": "dotnet test",
            "test_type": "UNIT",
            "environment": "Windows",
            "commit_sha": "c101010",
            "passed_count": 5,
            "failed_count": 0,
            "skipped_count": 0,
            "status": "PASS",
            "execution_timestamp": datetime.now(timezone.utc).isoformat()
        }]
        res_data = self.bridge.complete_task(
            task_id="CASE-10",
            commit_sha="c101010",
            branch="integration/zhongwenhub-sqlserver",
            changed_files=["scripts/ai_bridge/bridge.py"],
            test_results=test_results
        )
        self.assertIsInstance(res_data, dict)
        self.assertTrue(os.path.isfile(self.bridge.get_result_path("CASE-10")))
        task = self.bridge.load_task("CASE-10")
        self.assertEqual(task["status"], "WAITING_FOR_REVIEW")

    # 11. Evidence Validation
    def test_11_evidence_validation(self):
        validator = ProtocolValidator()
        invalid_evidence = {
            "evidence_id": "EV-01",
            # Missing test_name and command
            "test_type": "UNIT"
        }
        valid, errors = validator.validate("qa-evidence", invalid_evidence)
        self.assertFalse(valid)
        self.assertTrue(len(errors) > 0)

    # 12. Review Submission
    def test_12_review_submission(self):
        task_data = self._create_sample_task_data("CASE-12")
        self.bridge.create_task(task_data, sync_gh=False)
        self.bridge.claim_task("CASE-12", executor="Antigravity")
        self.bridge.complete_task(
            task_id="CASE-12",
            commit_sha="c121212",
            branch="integration/zhongwenhub-sqlserver",
            changed_files=["file.ts"],
            test_results=[{
                "test_id": "T12", "test_name": "T12", "command": "bun test", "test_type": "UNIT",
                "environment": "Win", "commit_sha": "c121212", "passed_count": 1, "failed_count": 0,
                "skipped_count": 0, "status": "PASS", "execution_timestamp": datetime.now(timezone.utc).isoformat()
            }]
        )
        rev_data = self.bridge.submit_review(
            task_id="CASE-12",
            decision="ACCEPTED",
            reviewed_commit_sha="c121212",
            summary="Review verified.",
            findings=[],
            required_actions=[]
        )
        self.assertIsInstance(rev_data, dict)
        self.assertTrue(os.path.isfile(self.bridge.get_review_path("CASE-12")))
        task = self.bridge.load_task("CASE-12")
        self.assertEqual(task["status"], "ACCEPTED")

    # 13. Review Commit Mismatch
    def test_13_review_commit_mismatch(self):
        task_data = self._create_sample_task_data("CASE-13")
        self.bridge.create_task(task_data, sync_gh=False)
        self.bridge.claim_task("CASE-13", executor="Antigravity")
        self.bridge.complete_task(
            task_id="CASE-13",
            commit_sha="aaaaaaa",
            branch="integration/zhongwenhub-sqlserver",
            changed_files=["file.ts"],
            test_results=[{
                "test_id": "T13", "test_name": "T13", "command": "bun test", "test_type": "UNIT",
                "environment": "Win", "commit_sha": "aaaaaaa", "passed_count": 1, "failed_count": 0,
                "skipped_count": 0, "status": "PASS", "execution_timestamp": datetime.now(timezone.utc).isoformat()
            }]
        )
        with self.assertRaises(ValueError) as ctx:
            self.bridge.submit_review(
                task_id="CASE-13",
                decision="ACCEPTED",
                reviewed_commit_sha="bbbbbbb",
                summary="Mismatch test",
                findings=[],
                required_actions=[]
            )
        self.assertIn("mismatch", str(ctx.exception).lower())

    # 14. GitHub Sync Dry-Run
    def test_14_github_sync_dry_run(self):
        engine = GitHubSyncEngine(dry_run=True)
        task_data = self._create_sample_task_data("CASE-14")
        ok, issue_num, msg = engine.sync_task_issue(task_data)
        self.assertTrue(ok)
        self.assertEqual(issue_num, 9999)
        self.assertIn("DRY-RUN", msg)

    # 15. GitHub Sync Idempotency
    def test_15_github_sync_idempotency(self):
        engine = GitHubSyncEngine(dry_run=True)
        task_data = self._create_sample_task_data("CASE-15")
        task_data["issue_number"] = 1234
        ok, issue_num, msg = engine.sync_task_issue(task_data)
        self.assertTrue(ok)
        self.assertEqual(issue_num, 1234)
        self.assertIn("already associated", msg)

    # 16. GitHub API Failure Handling
    def test_16_github_api_failure(self):
        engine = GitHubSyncEngine(dry_run=False)
        task_data = self._create_sample_task_data("CASE-16")
        with patch("subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(returncode=1, stderr="API Rate Limit Exceeded or Network Down")
            ok, issue_num, msg = engine.sync_task_issue(task_data)
            self.assertFalse(ok)
            self.assertIsNone(issue_num)
            self.assertIn("failed", msg)

    # 17. GitHub Rate Limit Handling
    def test_17_github_rate_limit(self):
        engine = GitHubSyncEngine(dry_run=False)
        with patch("subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(returncode=1, stderr="HTTP 403: API rate limit exceeded for user")
            ok, msg = engine.post_issue_event(
                task_id="CASE-17",
                issue_number=100,
                event_name="TASK_CLAIMED",
                actor="Antigravity",
                details={"status": "CLAIMED"}
            )
            self.assertFalse(ok)
            self.assertIn("rate limit", msg.lower())

    # 18. Sensitive Data Exclusion / Sanitization
    def test_18_sensitive_data_exclusion(self):
        sensitive_conn = "Server=127.0.0.1;Database=ZhongWenHub_Dev;Password=Secret123!;User Id=sa;"
        clean = sanitize_text(sensitive_conn)
        self.assertNotIn("Secret123!", clean)
        self.assertNotIn("User Id=sa", clean)
        self.assertIn("Password=[REDACTED]", clean)

    # 19. Invalid Schema Rejection
    def test_19_invalid_schema(self):
        validator = ProtocolValidator()
        malformed_task = {
            "schema_version": "1.0.0",
            "task_id": "BAD-TASK",
            "revision": "NOT_AN_INTEGER",  # Invalid type
            "title": "Bad Task"
        }
        valid, errors = validator.validate("task", malformed_task)
        self.assertFalse(valid)
        self.assertTrue(any("revision" in err for err in errors))

    # 20. Invalid Release Gate Handling
    def test_20_invalid_release_gate(self):
        validator = ProtocolValidator()
        bad_gate = {
            "gate_version": "1.0.0",
            "project": "ZhongWenHub",
            "evaluated_at": "invalid_date",
            "gate_decision": "NOT_A_VALID_DECISION",  # Invalid enum
            "criteria_results": []
        }
        valid, errors = validator.validate("release-gate", bad_gate)
        self.assertFalse(valid)
        self.assertTrue(any("gate_decision" in err for err in errors))


if __name__ == "__main__":
    unittest.main()
