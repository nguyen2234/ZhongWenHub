#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import unittest
import sys
import os
import shutil
import tempfile
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from bridge import CollaborationBridge, atomic_write_json
from validate_protocol import ProtocolValidator


class TestBridgeCore(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.bridge = CollaborationBridge(dry_run=True)
        # Override collab_dir for isolated testing
        self.bridge.collab_dir = os.path.join(self.temp_dir, ".ai-collaboration")
        self.bridge.init()

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_atomic_write_json(self):
        target = os.path.join(self.temp_dir, "test.json")
        data = {"hello": "world", "num": 42}
        atomic_write_json(target, data)
        self.assertTrue(os.path.isfile(target))
        with open(target, "r", encoding="utf-8") as f:
            read_back = json.load(f)
        self.assertEqual(read_back, data)

    def test_create_valid_task(self):
        task_data = {
            "schema_version": "1.0.0",
            "task_id": "TEST-TASK-001",
            "title": "Setup Integration Test Pipeline",
            "description": "Establish automated test harness for SQL Server integration.",
            "project": "ZhongWenHub",
            "phase": "Phase 9.4",
            "owner": "ChatGPT",
            "reviewer": "ChatGPT",
            "status": "PENDING",
            "revision": 1,
            "expected_branch": "integration/zhongwenhub-sqlserver",
            "source_commit": "9bfee9b",
            "input_files": ["Backend/tests/ZhongWenHub.IntegrationTests"],
            "expected_outputs": [".ai-collaboration/results/TEST-TASK-001_result.json"],
            "acceptance_criteria": ["All integration tests pass", "No dev db writes"],
            "safety_constraints": ["Zero writes to ZhongWenHub_Dev"],
            "created_at": "2026-11-10T20:00:00Z",
            "updated_at": "2026-11-10T20:00:00Z"
        }
        task_id = self.bridge.create_task(task_data, sync_gh=False)
        self.assertEqual(task_id, "TEST-TASK-001")
        self.assertTrue(os.path.isfile(self.bridge.get_task_path("TEST-TASK-001")))

    def test_duplicate_task_rejected(self):
        task_data = {
            "schema_version": "1.0.0",
            "task_id": "DUP-TASK-001",
            "title": "Duplicate Task Test",
            "description": "Ensures bridge rejects duplicate task IDs.",
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
            "acceptance_criteria": ["Criteria 1"],
            "safety_constraints": ["Constraint 1"],
            "created_at": "2026-11-10T20:00:00Z",
            "updated_at": "2026-11-10T20:00:00Z"
        }
        self.bridge.create_task(task_data, sync_gh=False)
        with self.assertRaises(ValueError):
            self.bridge.create_task(task_data, sync_gh=False)

    def test_invalid_task_schema_rejected(self):
        # Missing required title and acceptance_criteria
        bad_task = {
            "task_id": "BAD-TASK-001",
            "description": "Too short",
            "project": "InvalidProject"
        }
        with self.assertRaises(ValueError):
            self.bridge.create_task(bad_task, sync_gh=False)


if __name__ == "__main__":
    unittest.main()
