#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import unittest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sanitize_evidence import sanitize_text, sanitize_data


class TestEvidenceSanitization(unittest.TestCase):

    def test_sql_connection_string_sanitization(self):
        raw = "Server=127.0.0.1\\SQLEXPRESS;Initial Catalog=ZhongWenHub_Dev;User Id=sa;Password=SuperSecretPass123!;"
        sanitized = sanitize_text(raw)
        self.assertNotIn("SuperSecretPass123!", sanitized)
        self.assertNotIn("User Id=sa", sanitized)
        self.assertIn("Password=[REDACTED]", sanitized)
        self.assertIn("Initial Catalog=ZhongWenHub_Dev", sanitized)

    def test_github_token_sanitization(self):
        raw = "Using token ghp_123456789012345678901234567890123456 to authenticate"
        sanitized = sanitize_text(raw)
        self.assertNotIn("ghp_123456789012345678901234567890123456", sanitized)
        self.assertIn("[REDACTED_GITHUB_PAT]", sanitized)

    def test_jwt_token_sanitization(self):
        raw = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        sanitized = sanitize_text(raw)
        self.assertNotIn("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", sanitized)
        self.assertIn("[REDACTED_JWT_TOKEN]", sanitized)

    def test_recursive_data_sanitization(self):
        data = {
            "task_id": "TASK-001",
            "logs": [
                "Connection failed with Password=SecretPass123",
                "Token: ghp_999999999999999999999999999999999999"
            ],
            "nested": {
                "key": "Password=MyPassword"
            }
        }
        clean = sanitize_data(data)
        self.assertNotIn("SecretPass123", str(clean))
        self.assertNotIn("MyPassword", str(clean))
        self.assertNotIn("ghp_999999999999999999999999999999999999", str(clean))


if __name__ == "__main__":
    unittest.main()
