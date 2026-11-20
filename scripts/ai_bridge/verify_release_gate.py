#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ZhongWenHub AI Collaboration Bridge — Release Gate Verifier
Evaluates the release gate based on verifiable evidence, real commit SHAs,
security audit status, test matrix integrity, and database safety invariants.
"""

import os
import sys
import json
import argparse
import subprocess
from typing import Dict, Any, List, Tuple, Optional

# Local imports
bridge_dir = os.path.dirname(os.path.abspath(__file__))
if bridge_dir not in sys.path:
    sys.path.insert(0, bridge_dir)

from validate_protocol import ProtocolValidator
from verify_qa_evidence import QaEvidenceVerifier


class ReleaseGateVerifier:
    def __init__(self, repo_root: Optional[str] = None):
        if repo_root is None:
            self.repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        else:
            self.repo_root = os.path.abspath(repo_root)
        self.validator = ProtocolValidator()
        self.evidence_verifier = QaEvidenceVerifier(repo_root=self.repo_root)

    def evaluate_gate(
        self,
        gate_path: Optional[str] = None,
        matrix_path: Optional[str] = None,
        security_path: Optional[str] = None,
        expected_commit_sha: Optional[str] = None,
        strict_commit: bool = False
    ) -> Tuple[bool, str, List[str]]:
        """
        Evaluates the QA Release Gate.
        Returns: (passed, decision_verdict, failure_reasons)
        """
        if gate_path is None:
            gate_path = os.path.join(self.repo_root, ".ai-collaboration", "qa", "release-gate.json")
        if matrix_path is None:
            matrix_path = os.path.join(self.repo_root, ".ai-collaboration", "qa", "functional-test-matrix.json")
        if security_path is None:
            security_path = os.path.join(self.repo_root, ".ai-collaboration", "qa", "security-findings.json")

        reasons: List[str] = []

        # 1. Check release-gate file existence & schema
        if not os.path.isfile(gate_path):
            return False, "QA_BLOCKED", [f"Release gate file not found: {gate_path}"]

        try:
            with open(gate_path, "r", encoding="utf-8") as f:
                gate_data = json.load(f)
        except Exception as e:
            return False, "QA_BLOCKED", [f"Failed to parse release-gate.json: {str(e)}"]

        val_ok, val_errs = self.validator.validate("release-gate", gate_data)
        if not val_ok:
            reasons.extend([f"Release gate schema error: {err}" for err in val_errs])

        # 2. Check target commit SHA
        target_sha = gate_data.get("target_commit_sha", "")
        if not target_sha:
            reasons.append("Release gate target_commit_sha is missing.")
        elif expected_commit_sha:
            norm_target = target_sha[:7].lower()
            norm_expected = expected_commit_sha[:7].lower()
            matched = (
                norm_target == norm_expected
                or norm_target.startswith(norm_expected)
                or norm_expected.startswith(norm_target)
            )
            if not matched:
                # Check if target_sha is an ancestor of expected_commit_sha on the branch
                is_ancestor = False
                try:
                    res = subprocess.run(
                        ["git", "merge-base", "--is-ancestor", target_sha, expected_commit_sha],
                        cwd=self.repo_root,
                        capture_output=True
                    )
                    is_ancestor = (res.returncode == 0)
                except Exception:
                    is_ancestor = False

                if not is_ancestor:
                    reasons.append(
                        f"Release gate target_commit_sha '{target_sha}' does not match expected "
                        f"'{expected_commit_sha}' and is not an ancestor commit on the PR branch."
                    )

        # 3. Check Overall Status
        overall_status = gate_data.get("overall_status")
        if overall_status not in ["TECHNICAL_QA_PASSED", "TECHNICAL_QA_CONDITIONAL"]:
            reasons.append(f"Release gate overall_status is '{overall_status}' (must be TECHNICAL_QA_PASSED or TECHNICAL_QA_CONDITIONAL).")

        # 4. Check Blockers list
        blockers = gate_data.get("blockers", [])
        if blockers:
            reasons.append(f"Release gate contains active blockers: {'; '.join(blockers)}")

        # 5. Check Invariant Checks
        checks = gate_data.get("checks", {})
        required_true_checks = [
            "build_passed",
            "unit_tests_passed",
            "critical_e2e_passed",
            "no_critical_security_findings",
            "unauthorized_db_writes_zero",
            "rbac_bypass_zero",
            "pr_open_draft_preserved"
        ]
        for c in required_true_checks:
            if not checks.get(c):
                reasons.append(f"Required release gate check '{c}' is False or missing.")

        # 6. Verify Evidence in Functional Test Matrix
        matrix_ok, matrix_errs, stats = self.evidence_verifier.verify_matrix(
            matrix_path=matrix_path,
            expected_commit_sha=target_sha if strict_commit else None,
            enforce_commit_match=strict_commit
        )
        if not matrix_ok:
            reasons.extend([f"Evidence matrix failure: {err}" for err in matrix_errs])

        # 7. Verify Security Findings
        if os.path.isfile(security_path):
            try:
                with open(security_path, "r", encoding="utf-8") as f:
                    sec_data = json.load(f)
                sec_summary = sec_data.get("summary", {})
                crit = sec_summary.get("critical_count", 0)
                high = sec_summary.get("high_count", 0)
                if crit > 0:
                    reasons.append(f"Security audit contains {crit} CRITICAL findings.")
                if high > 0:
                    reasons.append(f"Security audit contains {high} HIGH findings.")
            except Exception as e:
                reasons.append(f"Failed to audit security findings: {str(e)}")
        else:
            reasons.append(f"Security findings file missing: {security_path}")

        passed = len(reasons) == 0
        final_verdict = overall_status if passed else ("QA_BLOCKED" if any("BLOCKED" in r or "missing" in r for r in reasons) else "QA_FAILED")
        return passed, final_verdict, reasons


def main():
    parser = argparse.ArgumentParser(description="ZhongWenHub AI Bridge Release Gate Verifier")
    parser.add_argument("--gate", help="Path to release-gate.json", default=None)
    parser.add_argument("--matrix", help="Path to functional-test-matrix.json", default=None)
    parser.add_argument("--security", help="Path to security-findings.json", default=None)
    parser.add_argument("--commit", help="Target commit SHA to verify against", default=None)
    parser.add_argument("--strict-commit", action="store_true", help="Enforce exact commit match across evidence")
    args = parser.parse_args()

    # If running inside GitHub Actions, check GITHUB_SHA
    commit = args.commit or os.environ.get("GITHUB_SHA")

    verifier = ReleaseGateVerifier()
    passed, verdict, reasons = verifier.evaluate_gate(
        gate_path=args.gate,
        matrix_path=args.matrix,
        security_path=args.security,
        expected_commit_sha=commit,
        strict_commit=args.strict_commit
    )

    print("========================================")
    print("  ZhongWenHub AI Bridge QA Release Gate")
    print("========================================")
    print(f"Final Decision Verdict: {verdict}")
    print(f"Passed:                 {passed}")
    print("----------------------------------------")

    if not passed:
        print("RELEASE GATE BLOCKED / FAILED FOR THE FOLLOWING REASONS:")
        for r in reasons:
            print(f"  [BLOCKER] {r}")
        sys.exit(1)

    print("SUCCESS: Release Gate criteria fully met by verifiable evidence.")
    sys.exit(0)


if __name__ == "__main__":
    main()
