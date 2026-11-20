#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ZhongWenHub AI Collaboration Bridge — Evidence Sanitizer
Filters and redacts secrets, database connection strings, JWTs, API keys,
and sensitive credentials from test outputs, logs, and evidence manifests.
"""

import re
import json
from typing import Any, Union

# Regex patterns for detecting sensitive data
SECRET_PATTERNS = [
    # Database connection strings & passwords
    (re.compile(r'(?i)(Password|pwd|user id|uid)\s*=\s*[^;]+'), r'\1=[REDACTED]'),
    (re.compile(r'(?i)(Server|Data Source)\s*=\s*[^;]+'), r'Server=[REDACTED_SERVER]'),
    (re.compile(r'(?i)Initial Catalog\s*=\s*(ZhongWenHub_Dev|ZhongWenHub_Test)'), r'Initial Catalog=\1'),
    # GitHub Tokens
    (re.compile(r'ghp_[A-Za-z0-9_]{36,255}'), '[REDACTED_GITHUB_PAT]'),
    (re.compile(r'github_pat_[A-Za-z0-9_]{60,255}'), '[REDACTED_GITHUB_PAT]'),
    (re.compile(r'ghs_[A-Za-z0-9_]{36,255}'), '[REDACTED_GITHUB_APP_TOKEN]'),
    # JWT Tokens (ey...)
    (re.compile(r'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'), '[REDACTED_JWT_TOKEN]'),
    # Generic API Keys / Secrets
    (re.compile(r'(?i)(api[_-]?key|secret|authorization|bearer)\s*[:=]\s*["\']?[a-zA-Z0-9_\-\.]{16,}["\']?'), r'\1: "[REDACTED_SECRET]"'),
    # Private Keys
    (re.compile(r'-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]+?-----END [A-Z ]+ PRIVATE KEY-----'), '[REDACTED_PRIVATE_KEY]'),
]


def sanitize_text(text: str) -> str:
    """Sanitizes text by replacing recognized secrets with redaction placeholders."""
    if not isinstance(text, str):
        return text
    sanitized = text
    for pattern, replacement in SECRET_PATTERNS:
        sanitized = pattern.sub(replacement, sanitized)
    return sanitized


def sanitize_data(data: Any) -> Any:
    """Recursively traverses dictionaries, lists, and primitives to sanitize strings."""
    if isinstance(data, str):
        return sanitize_text(data)
    elif isinstance(data, dict):
        return {k: sanitize_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    return data


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            content = f.read()
        print(sanitize_text(content))
    else:
        print("Usage: sanitize_evidence.py <file>")
