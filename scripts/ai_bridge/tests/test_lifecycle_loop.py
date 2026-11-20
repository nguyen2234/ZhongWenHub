#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import unittest
import sys
import os
import shutil
import tempfile
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from bridge import CollaborationBridge


class TestLifecycleLoop(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.bridge = CollaborationBridge(dry_run=True)
        self.bridge.collab_dir = os.path.join(self.temp_dir, ".ai-collaboration")
        self.bridge.init()

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_complete_collaboration_round_trip(self):
        task_id = "ROUNDTRIP-001"
        initial_commit = "1111111"
        rework_commit = "2222222"

        # 1. ChatGPT creates task
        task_data = {
            "schema_version": "1.0.0",
            "task_id": task_id,
            "title": "Implement RBAC Route Guard Fix",
            "description": "Fix unauthorized route access for STUDENT on Admin dashboard.",
            "project": "ZhongWenHub",
            "phase": "Security",
            "owner": "ChatGPT",
            "reviewer": "ChatGPT",
            "status": "PENDING",
            "revision": 1,
            "expected_branch": "integration/zhongwenhub-sqlserver",
            "source_commit": initial_commit,
            "input_files": ["Fontend/src/routes/ManagementRouteGuard.tsx"],
            "expected_outputs": [".ai-collaboration/results/ROUNDTRIP-001_result.json"],
            "acceptance_criteria": [
                "Student is redirected to /login with 403 when accessing /admin",
                "Admin can access /admin normally",
                "Unit and E2E tests pass"
            ],
            "safety_constraints": [
                "Do not disable security guards in tests",
                "Zero writes to ZhongWenHub_Dev"
            ],
            "created_at": "2026-11-10T21:00:00Z",
            "updated_at": "2026-11-10T21:00:00Z"
        }
        self.bridge.create_task(task_data, sync_gh=False)
        task = self.bridge.load_task(task_id)
        self.assertEqual(task["status"], "PENDING")

        # 2. Antigravity claims task
        self.bridge.claim_task(task_id, executor="Antigravity", timeout_hours=3)
        task = self.bridge.load_task(task_id)
        self.assertEqual(task["status"], "CLAIMED")
        self.assertEqual(task["revision"], 2)

        # 3. Antigravity saves checkpoint during implementation
        self.bridge.save_checkpoint(
            task_id=task_id,
            batch_number=1,
            total_batches=2,
            batch_name="Route Guard Implementation",
            completed_steps=["Route Guard logic updated"],
            remaining_steps=["E2E Playwright verification"],
            file_hashes={"ManagementRouteGuard.tsx": "hash_v1"}
        )
        task = self.bridge.load_task(task_id)
        self.assertEqual(task["status"], "CHECKPOINT_SAVED")

        # 4. Antigravity completes execution (with initial commit)
        test_results_v1 = [{
            "test_id": "TEST-RBAC-01",
            "test_name": "Student RBAC Route Guard",
            "command": "bun test src/tests/rbac.test.ts",
            "test_type": "UNIT",
            "environment": "Windows Node v24",
            "commit_sha": initial_commit,
            "passed_count": 8,
            "failed_count": 0,
            "skipped_count": 0,
            "status": "PASS",
            "execution_timestamp": "2026-11-10T21:30:00Z"
        }]
        self.bridge.complete_task(
            task_id=task_id,
            commit_sha=initial_commit,
            branch="integration/zhongwenhub-sqlserver",
            changed_files=["Fontend/src/routes/ManagementRouteGuard.tsx"],
            test_results=test_results_v1,
            summary="Updated route guard with role checks."
        )
        task = self.bridge.load_task(task_id)
        self.assertEqual(task["status"], "WAITING_FOR_REVIEW")

        # 5. ChatGPT reviews and finds defect -> CHANGES_REQUESTED
        findings_v1 = [{
            "finding_id": "FIND-01",
            "severity": "HIGH",
            "component": "ManagementRouteGuard",
            "file_path": "Fontend/src/routes/ManagementRouteGuard.tsx",
            "line_range": "L45-L52",
            "description": "Missing null check on user session before evaluating user.roles.",
            "expected_behavior": "Should immediately redirect unauthenticated visitors to /login.",
            "suggested_fix": "Add `if (!user) return <Navigate to='/login' />` before role check.",
            "regression_test_required": True
        }]
        self.bridge.submit_review(
            task_id=task_id,
            decision="CHANGES_REQUESTED",
            reviewed_commit_sha=initial_commit,
            summary="Review found 1 HIGH severity issue: Unauthenticated access throws unhandled TypeError.",
            findings=findings_v1,
            required_actions=["Add null check on user", "Add unauthenticated visitor unit test"]
        )
        task = self.bridge.load_task(task_id)
        self.assertEqual(task["status"], "CHANGES_REQUESTED")

        # 6. Antigravity re-claims task for rework
        self.bridge.claim_task(task_id, executor="Antigravity", timeout_hours=2)
        task = self.bridge.load_task(task_id)
        self.assertEqual(task["status"], "CLAIMED")

        # 7. Antigravity fixes defect, creates new commit, runs updated tests
        test_results_v2 = [
            {
                "test_id": "TEST-RBAC-01",
                "test_name": "Student RBAC Route Guard",
                "command": "bun test src/tests/rbac.test.ts",
                "test_type": "UNIT",
                "environment": "Windows Node v24",
                "commit_sha": rework_commit,
                "passed_count": 8,
                "failed_count": 0,
                "skipped_count": 0,
                "status": "PASS",
                "execution_timestamp": "2026-11-10T21:45:00Z"
            },
            {
                "test_id": "TEST-RBAC-02",
                "test_name": "Unauthenticated Visitor Null Check",
                "command": "bun test src/tests/rbac.test.ts",
                "test_type": "UNIT",
                "environment": "Windows Node v24",
                "commit_sha": rework_commit,
                "passed_count": 2,
                "failed_count": 0,
                "skipped_count": 0,
                "status": "PASS",
                "execution_timestamp": "2026-11-10T21:45:00Z"
            }
        ]
        self.bridge.complete_task(
            task_id=task_id,
            commit_sha=rework_commit,
            branch="integration/zhongwenhub-sqlserver",
            changed_files=[
                "Fontend/src/routes/ManagementRouteGuard.tsx",
                "Fontend/src/tests/rbac.test.ts"
            ],
            test_results=test_results_v2,
            summary="Fixed null check and added visitor regression test."
        )
        task = self.bridge.load_task(task_id)
        self.assertEqual(task["status"], "WAITING_FOR_REVIEW")

        # 8. ChatGPT reviews new commit -> ACCEPTED
        self.bridge.submit_review(
            task_id=task_id,
            decision="ACCEPTED",
            reviewed_commit_sha=rework_commit,
            summary="Verified fix on commit 2222222. All tests pass and null safety verified.",
            findings=[],
            required_actions=[]
        )
        task = self.bridge.load_task(task_id)
        self.assertEqual(task["status"], "ACCEPTED")
        print("Collaboration lifecycle test passed 100%!")


if __name__ == "__main__":
    unittest.main()
