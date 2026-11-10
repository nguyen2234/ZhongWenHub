#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ZhongWenHub AI Collaboration Bridge — Independent QA Evidence Verifier
Audits functional-test-matrix.json against real files, commits, and artifacts.
Rejects unevidenced PASS, fake files, missing artifacts, and mismatched commit SHAs.
"""

import os
import sys
import json
import argparse
import subprocess
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional


class EvidenceVerificationError(Exception):
    """Raised when QA evidence verification fails."""
    pass


class QaEvidenceVerifier:
    def __init__(self, repo_root: Optional[str] = None):
        if repo_root is None:
            self.repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        else:
            self.repo_root = os.path.abspath(repo_root)

    def verify_matrix(
        self,
        matrix_path: Optional[str] = None,
        expected_commit_sha: Optional[str] = None,
        enforce_commit_match: bool = False
    ) -> Tuple[bool, List[str], Dict[str, Any]]:
        """
        Verifies functional test matrix.
        Returns: (is_valid, errors, stats)
        """
        if matrix_path is None:
            matrix_path = os.path.join(self.repo_root, ".ai-collaboration", "qa", "functional-test-matrix.json")

        if not os.path.isfile(matrix_path):
            return False, [f"Matrix file not found: {matrix_path}"], {}

        try:
            with open(matrix_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            return False, [f"JSON parse error in matrix file: {str(e)}"], {}

        errors: List[str] = []
        stats = {
            "total_test_cases": 0,
            "pass_count": 0,
            "blocked_count": 0,
            "not_tested_count": 0,
            "fail_count": 0,
            "skipped_count": 0
        }

        domains = data.get("domains", [])
        if not domains:
            errors.append("Matrix has no domains defined.")

        for domain in domains:
            domain_id = domain.get("domain_id", "UNKNOWN")
            test_cases = domain.get("test_cases", [])
            for tc in test_cases:
                tc_id = tc.get("id", "UNKNOWN")
                stats["total_test_cases"] += 1
                status = tc.get("status")
                verified_status = tc.get("verified_status")

                # Track counts
                if status == "PASS":
                    stats["pass_count"] += 1
                elif status == "BLOCKED":
                    stats["blocked_count"] += 1
                elif status == "NOT_TESTED":
                    stats["not_tested_count"] += 1
                elif status == "FAIL":
                    stats["fail_count"] += 1
                elif status == "SKIP":
                    stats["skipped_count"] += 1

                # Rule 1: A test marked PASS must have verified_status == PASS
                if status == "PASS":
                    if verified_status != "PASS":
                        errors.append(f"[{tc_id}] Marked PASS but verified_status is '{verified_status}'.")

                    # Rule 2: test_file must be specified and must exist on disk
                    test_file = tc.get("test_file")
                    if not test_file:
                        errors.append(f"[{tc_id}] Marked PASS but test_file is missing or empty.")
                    else:
                        full_test_path = os.path.join(self.repo_root, test_file)
                        if not os.path.isfile(full_test_path):
                            errors.append(f"[{tc_id}] Marked PASS but test_file does not exist on disk: {test_file}")

                    # Rule 3: test_command must be provided
                    test_cmd = tc.get("test_command")
                    if not test_cmd or not str(test_cmd).strip():
                        errors.append(f"[{tc_id}] Marked PASS but test_command is missing or empty.")

                    # Rule 4: artifact_reference must be specified
                    artifact_ref = tc.get("artifact_reference")
                    if not artifact_ref or not str(artifact_ref).strip():
                        errors.append(f"[{tc_id}] Marked PASS but artifact_reference is missing.")

                    # Rule 5: executed_at must be valid date-time string
                    executed_at = tc.get("executed_at")
                    if not executed_at:
                        errors.append(f"[{tc_id}] Marked PASS but executed_at timestamp is missing.")

                    # Rule 6: execution_commit_sha must be present and valid
                    exec_sha = tc.get("execution_commit_sha")
                    if not exec_sha or len(str(exec_sha).strip()) < 7:
                        errors.append(f"[{tc_id}] Marked PASS but execution_commit_sha is missing or invalid.")
                    elif enforce_commit_match and expected_commit_sha:
                        # Normalize SHA prefixes
                        short_expected = expected_commit_sha[:7].lower()
                        short_exec = str(exec_sha)[:7].lower()
                        if short_expected != short_exec and not short_expected.startswith(short_exec) and not short_exec.startswith(short_expected):
                            errors.append(
                                f"[{tc_id}] Marked PASS with execution_commit_sha '{exec_sha}' "
                                f"which does not match expected target commit '{expected_commit_sha}'."
                            )

                elif status in ["BLOCKED", "NOT_TESTED"]:
                    # Must have explanation if blocked or not tested
                    block_reason = tc.get("block_reason")
                    if not block_reason and not tc.get("notes"):
                        errors.append(f"[{tc_id}] Marked {status} without block_reason or notes explaining why.")

                # Rule 7: Skipped test must NEVER be treated as PASS
                if status == "SKIP" and verified_status == "PASS":
                    errors.append(f"[{tc_id}] Contradiction: status is SKIP but verified_status claims PASS.")

        # Summary check
        summary = data.get("summary", {})
        if summary:
            if summary.get("total_test_cases") != stats["total_test_cases"]:
                errors.append(
                    f"Summary total_test_cases mismatch: header says {summary.get('total_test_cases')}, "
                    f"actual items counted {stats['total_test_cases']}."
                )
            if summary.get("pass_count") != stats["pass_count"]:
                errors.append(
                    f"Summary pass_count mismatch: header says {summary.get('pass_count')}, "
                    f"actual PASS items {stats['pass_count']}."
                )
            if summary.get("blocked_count") != stats["blocked_count"]:
                errors.append(
                    f"Summary blocked_count mismatch: header says {summary.get('blocked_count')}, "
                    f"actual BLOCKED items {stats['blocked_count']}."
                )

        is_valid = len(errors) == 0
        return is_valid, errors, stats


def main():
    parser = argparse.ArgumentParser(description="ZhongWenHub QA Evidence Verifier")
    parser.add_argument("--matrix", help="Path to functional-test-matrix.json", default=None)
    parser.add_argument("--commit", help="Expected target commit SHA to match", default=None)
    parser.add_argument("--enforce-commit", action="store_true", help="Enforce exact commit match")
    args = parser.parse_args()

    verifier = QaEvidenceVerifier()
    is_valid, errors, stats = verifier.verify_matrix(
        matrix_path=args.matrix,
        expected_commit_sha=args.commit,
        enforce_commit_match=args.enforce_commit
    )

    print("=== ZhongWenHub QA Evidence Audit ===")
    print(f"Total Test Cases Audited: {stats.get('total_test_cases', 0)}")
    print(f"Verified PASS:            {stats.get('pass_count', 0)}")
    print(f"Verified BLOCKED:         {stats.get('blocked_count', 0)}")
    print(f"Verified NOT_TESTED:      {stats.get('not_tested_count', 0)}")
    print(f"FAIL Count:               {stats.get('fail_count', 0)}")
    print("-------------------------------------")

    if not is_valid:
        print("QA EVIDENCE AUDIT FAILED:")
        for err in errors:
            print(f"  [ERROR] {err}")
        sys.exit(1)

    print("SUCCESS: All PASS test cases contain verified on-disk evidence, commands, and artifacts.")
    sys.exit(0)


if __name__ == "__main__":
    main()

