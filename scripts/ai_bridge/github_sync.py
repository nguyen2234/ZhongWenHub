#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ZhongWenHub AI Collaboration Bridge — GitHub Synchronization Engine
Interacts safely with GitHub Issues, PR #16, and Workflow runs via GitHub CLI (gh).
Features idempotent issue creation, duplicate prevention, structured comment posting,
and fail-safe offline/dry-run modes.
"""

import os
import re
import json
import subprocess
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple, List

from sanitize_evidence import sanitize_text


class GitHubSyncEngine:
    """Manages GitHub issue creation and synchronization for the bridge."""

    def __init__(self, repo: str = "nguyen2234/ZhongWenHub", dry_run: bool = False):
        self.repo = repo
        self.dry_run = dry_run
        self._gh_available = self._check_gh_cli()

    def _check_gh_cli(self) -> bool:
        """Verifies if gh CLI is installed and responsive."""
        if self.dry_run:
            return True
        try:
            res = subprocess.run(["gh", "--version"], capture_output=True, text=True, timeout=5)
            return res.returncode == 0
        except Exception:
            return False

    def is_available(self) -> bool:
        return self._gh_available

    def find_issue_for_task(self, task_id: str) -> Optional[int]:
        """Searches GitHub for an existing issue matching the task ID to prevent duplicates."""
        if self.dry_run or not self._gh_available:
            return None

        search_query = f"[TASK: {task_id}] in:title"
        cmd = [
            "gh", "issue", "list",
            "--repo", self.repo,
            "--search", search_query,
            "--state", "all",
            "--json", "number,title",
            "--limit", "5"
        ]
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            if res.returncode == 0 and res.stdout.strip():
                issues = json.loads(res.stdout)
                for issue in issues:
                    if f"[TASK: {task_id}]" in issue.get("title", ""):
                        return issue.get("number")
        except Exception:
            pass
        return None

    def sync_task_issue(self, task: dict) -> Tuple[bool, Optional[int], str]:
        """
        Creates or updates a GitHub Issue corresponding to a task.
        Idempotent: Reuses existing issue number if found.
        """
        task_id = task["task_id"]
        title = f"[TASK: {task_id}] {task['title']}"

        # Check if already has issue_number
        if task.get("issue_number"):
            return True, task["issue_number"], f"Issue #{task['issue_number']} already associated."

        # Search GitHub to avoid duplicate
        existing_number = self.find_issue_for_task(task_id)
        if existing_number:
            task["issue_number"] = existing_number
            return True, existing_number, f"Found existing GitHub Issue #{existing_number}."

        body_lines = [
            f"# Task: {task['title']}",
            f"- **Task ID**: `{task_id}`",
            f"- **Project**: `{task.get('project', 'ZhongWenHub')}`",
            f"- **Phase**: `{task.get('phase', 'N/A')}`",
            f"- **Owner**: `{task.get('owner', 'ChatGPT')}`",
            f"- **Reviewer**: `{task.get('reviewer', 'ChatGPT')}`",
            f"- **Status**: `{task.get('status', 'PENDING')}`",
            f"- **Revision**: `{task.get('revision', 1)}`",
            f"- **Expected Branch**: `{task.get('expected_branch', 'integration/zhongwenhub-sqlserver')}`",
            f"- **Source Commit**: `{task.get('source_commit', 'N/A')}`",
            "",
            "## Description",
            task.get("description", ""),
            "",
            "## Acceptance Criteria",
        ]
        for idx, ac in enumerate(task.get("acceptance_criteria", []), 1):
            body_lines.append(f"{idx}. {ac}")

        body_lines.append("")
        body_lines.append("## Safety Constraints")
        for sc in task.get("safety_constraints", []):
            body_lines.append(f"- ⚠️ {sc}")

        body = sanitize_text("\n".join(body_lines))

        if self.dry_run:
            print(f"[DRY-RUN] Would create GitHub Issue in {self.repo}: {title}")
            return True, 9999, "[DRY-RUN] Issue #9999 simulated."

        if not self._gh_available:
            return False, None, "gh CLI is not available in environment."

        cmd = [
            "gh", "issue", "create",
            "--repo", self.repo,
            "--title", title,
            "--body", body,
            "--label", "ai-task"
        ]

        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            if res.returncode != 0 and "label" in res.stderr.lower():
                # Retry without label if label does not exist on target repository
                cmd_no_label = ["gh", "issue", "create", "--repo", self.repo, "--title", title, "--body", body]
                res = subprocess.run(cmd_no_label, capture_output=True, text=True, timeout=15)

            if res.returncode == 0:
                match = re.search(r'/issues/(\d+)', res.stdout)
                if match:
                    number = int(match.group(1))
                    task["issue_number"] = number
                    return True, number, f"Created GitHub Issue #{number}"
                return True, None, f"Issue created: {res.stdout.strip()}"
            else:
                return False, None, f"gh issue create failed: {res.stderr.strip()}"
        except Exception as e:
            return False, None, f"Error calling gh CLI: {str(e)}"

    def post_issue_event(
        self,
        task_id: str,
        issue_number: Optional[int],
        event_name: str,
        actor: str,
        details: Dict[str, Any],
        commit_sha: Optional[str] = None
    ) -> Tuple[bool, str]:
        """Posts a structured event comment on the GitHub Issue."""
        now_iso = datetime.now(timezone.utc).isoformat()
        lines = [
            f"### 🤖 AI Collaboration Event: `{event_name}`",
            f"- **Task ID**: `{task_id}`",
            f"- **Actor**: `{actor}`",
            f"- **Timestamp**: `{now_iso}`",
            f"- **Commit SHA**: `{commit_sha or 'N/A'}`",
            f"- **Status**: `{details.get('status', 'N/A')}`",
            f"- **Revision**: `{details.get('revision', 'N/A')}`",
            "",
            details.get("summary", ""),
        ]

        if "warnings" in details and details["warnings"]:
            lines.append("\n**⚠️ Warnings:**")
            for w in details["warnings"]:
                lines.append(f"- {w}")

        if "blockers" in details and details["blockers"]:
            lines.append("\n**🛑 Blockers:**")
            for b in details["blockers"]:
                lines.append(f"- {b}")

        comment_body = sanitize_text("\n".join(lines))

        if self.dry_run:
            print(f"[DRY-RUN] Would post comment to Issue #{issue_number or 'UNKNOWN'}: {event_name}")
            return True, "[DRY-RUN] Comment simulated."

        if not issue_number:
            return False, "Cannot post comment: No issue_number associated with task."

        if not self._gh_available:
            return False, "gh CLI is not available."

        cmd = [
            "gh", "issue", "comment", str(issue_number),
            "--repo", self.repo,
            "--body", comment_body
        ]

        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            if res.returncode == 0:
                return True, f"Posted event {event_name} to Issue #{issue_number}"
            else:
                return False, f"Failed to comment on Issue #{issue_number}: {res.stderr.strip()}"
        except Exception as e:
            return False, f"Error posting issue comment: {str(e)}"


if __name__ == "__main__":
    engine = GitHubSyncEngine(dry_run=True)
    print("GitHubSyncEngine loaded. Available:", engine.is_available())
