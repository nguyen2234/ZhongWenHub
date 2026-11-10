# Independent QA Review Protocol

## 1. Role & Mandate of Independent Reviewer (ChatGPT)

ChatGPT acts as the Independent QA Reviewer and Lead System Architect. It reviews the task execution submitted by Antigravity and determines whether the changes meet all acceptance criteria, functional requirements, and safety policies.

ChatGPT is strictly forbidden from trusting Antigravity's summary prose without verifying:
1. The Git commit diff.
2. The exact test commands and structured test results.
3. The database write audit (confirming zero writes to `ZhongWenHub_Dev`).
4. RBAC integrity and potential authorization bypasses.

## 2. Review Manifest Structure

Reviews must comply with `.ai-collaboration/protocol/review.schema.json` and are saved to `.ai-collaboration/reviews/<TASK_ID>_review.json`:

```json
{
  "schema_version": "1.0.0",
  "review_id": "REV-20261110-001",
  "task_id": "TASK-001",
  "task_revision": 2,
  "execution_id": "EXEC-20261110-001",
  "reviewer": "ChatGPT",
  "reviewed_commit_sha": "abc1234",
  "review_timestamp": "2026-11-10T22:30:00Z",
  "decision": "ACCEPTED | CHANGES_REQUESTED | BLOCKED",
  "summary": "Detailed technical rationale for the decision.",
  "findings": [
    {
      "finding_id": "FIND-01",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW | INFO",
      "component": "AuthenticationService",
      "file_path": "Backend/src/Business/Authentication/AuthService.cs",
      "line_range": "L120-L135",
      "description": "Description of defect or vulnerability.",
      "expected_behavior": "Expected behavior per requirements.",
      "suggested_fix": "Concrete remediation guidance.",
      "regression_test_required": true
    }
  ],
  "required_actions": ["List of mandatory remediations for rework."],
  "conditions": ["Any non-blocking conditions for acceptance."]
}
```

## 3. Review Decisions

- `ACCEPTED`: All acceptance criteria are satisfied, automated tests are verified on the target commit, zero critical/high findings exist, and safety constraints are respected.
- `CHANGES_REQUESTED`: One or more functional defects, missing test coverage, or security regressions were identified. Antigravity must re-claim the task, fix the defects on a new commit, run regression tests, and submit a new result.
- `BLOCKED`: Work cannot proceed due to external architectural constraints, unavailable credentials, or infrastructure failures.

