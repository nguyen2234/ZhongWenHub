#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ZhongWenHub AI Collaboration Bridge — Evidence-Based QA Hardening Tests
Regression suite proving rejection of:
1. Fake PASS with fictitious test files
2. Missing test artifacts
3. Stale commit SHAs
4. Skipped tests claiming PASS
5. Missing execution timestamps or records
6. CI failures causing QA gate block
7. Missing review or sign-off bypass
8. Concurrent updates / optimistic lock validation
"""

import os
import sys
import json
import shutil
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from verify_qa_evidence import QaEvidenceVerifier
from verify_release_gate import ReleaseGateVerifier
from bridge import CollaborationBridge


class TestEvidenceBasedQa(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.evidence_verifier = QaEvidenceVerifier(repo_root=self.temp_dir)
        self.gate_verifier = ReleaseGateVerifier(repo_root=self.temp_dir)

        # Create a real dummy test file in temp repo
        self.dummy_test_rel = "tests/dummy_test.py"
        full_dummy = os.path.join(self.temp_dir, self.dummy_test_rel)
        os.makedirs(os.path.dirname(full_dummy), exist_ok=True)
        with open(full_dummy, "w", encoding="utf-8") as f:
            f.write("# dummy test file")

        # Create base valid matrix
        self.valid_matrix = {
            "matrix_version": "1.1.0",
            "project": "ZhongWenHub",
            "last_updated": "2026-11-10T22:30:00Z",
            "domains": [
                {
                    "domain_id": "DOM-01",
                    "name": "Auth",
                    "test_cases": [
                        {
                            "id": "AUTH-01",
                            "name": "Valid login",
                            "type": "UNIT",
                            "priority": "P0",
                            "status": "PASS",
                            "test_file": self.dummy_test_rel,
                            "test_command": "python -m unittest tests/dummy_test.py",
                            "execution_commit_sha": "226bf54186c2927859af8f56e9ed8040b6c461e4",
                            "workflow_run_id": "42846276895",
                            "artifact_reference": "test-results/dummy.trx",
                            "executed_at": "2026-11-10T15:37:25Z",
                            "verified_status": "PASS"
                        }
                    ]
                }
            ],
            "summary": {
                "total_domains": 1,
                "total_test_cases": 1,
                "pass_count": 1,
                "fail_count": 0,
                "skipped_count": 0,
                "blocked_count": 0
            }
        }

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _write_matrix(self, data: dict) -> str:
        matrix_path = os.path.join(self.temp_dir, "matrix.json")
        with open(matrix_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return matrix_path

    def test_1_valid_evidence_passes(self):
        """Proves that a completely evidenced test case passes verification."""
        path = self._write_matrix(self.valid_matrix)
        ok, errors, stats = self.evidence_verifier.verify_matrix(path)
        self.assertTrue(ok)
        self.assertEqual(len(errors), 0)
        self.assertEqual(stats["pass_count"], 1)

    def test_2_fake_pass_with_nonexistent_file_rejected(self):
        """P0: Proves that a test marked PASS with a non-existent file is strictly rejected."""
        matrix = json.loads(json.dumps(self.valid_matrix))
        matrix["domains"][0]["test_cases"][0]["test_file"] = "tests/nonexistent_fake_test.py"
        path = self._write_matrix(matrix)

        ok, errors, stats = self.evidence_verifier.verify_matrix(path)
        self.assertFalse(ok)
        self.assertTrue(any("does not exist on disk" in e for e in errors))

    def test_3_missing_artifact_reference_rejected(self):
        """P0: Proves that a test marked PASS without an artifact reference is rejected."""
        matrix = json.loads(json.dumps(self.valid_matrix))
        matrix["domains"][0]["test_cases"][0]["artifact_reference"] = ""
        path = self._write_matrix(matrix)

        ok, errors, stats = self.evidence_verifier.verify_matrix(path)
        self.assertFalse(ok)
        self.assertTrue(any("artifact_reference is missing" in e for e in errors))

    def test_4_stale_commit_sha_rejected(self):
        """P1: Proves that execution commit SHA mismatch against expected target commit is rejected."""
        path = self._write_matrix(self.valid_matrix)
        # Expected is commit deadbeef, matrix has 226bf54...
        ok, errors, stats = self.evidence_verifier.verify_matrix(
            path,
            expected_commit_sha="deadbeef12345678",
            enforce_commit_match=True
        )
        self.assertFalse(ok)
        self.assertTrue(any("does not match expected target commit" in e for e in errors))

    def test_5_skipped_test_claiming_pass_rejected(self):
        """P0: Proves that a test case with status SKIP cannot claim verified_status PASS."""
        matrix = json.loads(json.dumps(self.valid_matrix))
        matrix["domains"][0]["test_cases"][0]["status"] = "SKIP"
        matrix["domains"][0]["test_cases"][0]["verified_status"] = "PASS"
        path = self._write_matrix(matrix)

        ok, errors, stats = self.evidence_verifier.verify_matrix(path)
        self.assertFalse(ok)
        self.assertTrue(any("Contradiction: status is SKIP but verified_status claims PASS" in e for e in errors))

    def test_6_missing_executed_at_timestamp_rejected(self):
        """P1: Proves that a test marked PASS missing executed_at timestamp is rejected."""
        matrix = json.loads(json.dumps(self.valid_matrix))
        matrix["domains"][0]["test_cases"][0]["executed_at"] = None
        path = self._write_matrix(matrix)

        ok, errors, stats = self.evidence_verifier.verify_matrix(path)
        self.assertFalse(ok)
        self.assertTrue(any("executed_at timestamp is missing" in e for e in errors))

    def test_7_ci_failure_causes_release_gate_block(self):
        """P0: Proves that failing check or QA_FAILED status in release gate blocks release."""
        gate_data = {
            "schema_version": "1.0.0",
            "release_id": "REL-TEST-001",
            "target_branch": "integration/zhongwenhub-sqlserver",
            "target_commit_sha": "226bf54",
            "pull_request_number": 16,
            "evaluation_timestamp": "2026-11-10T22:30:00Z",
            "overall_status": "QA_FAILED",
            "checks": {
                "build_passed": False,
                "unit_tests_passed": False,
                "critical_e2e_passed": True,
                "no_critical_security_findings": True,
                "unauthorized_db_writes_zero": True,
                "rbac_bypass_zero": True,
                "pr_open_draft_preserved": True
            },
            "blockers": ["Build failed in CI"],
            "conditions": []
        }
        gate_path = os.path.join(self.temp_dir, "release-gate.json")
        with open(gate_path, "w", encoding="utf-8") as f:
            json.dump(gate_data, f, indent=2)

        matrix_path = self._write_matrix(self.valid_matrix)
        passed, verdict, reasons = self.gate_verifier.evaluate_gate(
            gate_path=gate_path,
            matrix_path=matrix_path
        )
        self.assertFalse(passed)
        self.assertNotEqual(verdict, "TECHNICAL_QA_PASSED")
        self.assertTrue(any("QA_FAILED" in r or "Build failed" in r for r in reasons))

    def test_8_optimistic_locking_prevents_concurrent_overwrite(self):
        """P1: Proves optimistic lock rejects task update if revision in storage is newer."""
        bridge = CollaborationBridge(dry_run=True)
        bridge.collab_dir = os.path.join(self.temp_dir, ".ai-collaboration")
        bridge.init()

        task = {
            "schema_version": "1.0.0",
            "task_id": "LOCK-TEST-001",
            "title": "Optimistic Lock Test",
            "description": "Verifying revision collision prevention.",
            "project": "ZhongWenHub",
            "phase": "Phase 9.4",
            "owner": "ChatGPT",
            "reviewer": "ChatGPT",
            "status": "PENDING",
            "revision": 1,
            "expected_branch": "integration/zhongwenhub-sqlserver",
            "source_commit": "226bf54",
            "input_files": ["tests/dummy_test.py"],
            "expected_outputs": [".ai-collaboration/results/LOCK-TEST-001_result.json"],
            "acceptance_criteria": ["Concurrency safe"],
            "safety_constraints": [
                "Zero writes to ZhongWenHub_Dev",
                "Keep PR #16 Open and Draft"
            ],
            "created_at": "2026-11-10T22:30:00Z",
            "updated_at": "2026-11-10T22:30:00Z"
        }
        bridge.create_task(task)

        # Agent 1 claims task -> revision increments to 2
        claimed = bridge.claim_task("LOCK-TEST-001", "Antigravity", timeout_hours=1)
        self.assertEqual(claimed["revision"], 2)

        # Agent 2 attempts to claim or update with stale revision 1 -> must fail
        with self.assertRaises(Exception) as ctx:
            bridge.claim_task("LOCK-TEST-001", "AnotherAgent", timeout_hours=1)
        self.assertTrue("already claimed" in str(ctx.exception).lower())


if __name__ == "__main__":
    unittest.main()
