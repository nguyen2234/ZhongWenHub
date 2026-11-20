# -*- coding: utf-8 -*-
import os
import re
import sys

PATTERNS = [
    re.compile(r'Password=[^;\s\"]{4,}'),
    re.compile(r'ghp_[A-Za-z0-9]{30,}'),
    re.compile(r'gho_[A-Za-z0-9]{30,}'),
    re.compile(r'eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}')
]

target_dirs = ['.ai-collaboration', 'scripts/ai_bridge', 'docs/ai-collaboration', '.github/workflows']
clean = True

for d in target_dirs:
    for root, dirs, files in os.walk(d):
        for f in files:
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8', errors='ignore') as fh:
                content = fh.read()
            for pat in PATTERNS:
                matches = [m for m in pat.findall(content) if "[REDACTED]" not in m]
                if matches and not ('test_' in f or 'sample' in f):
                    print(f'POTENTIAL SECRET in {p}: {matches}')
                    clean = False

if clean:
    print('SCAN COMPLETED: ZERO SECRETS FOUND!')
    sys.exit(0)
else:
    sys.exit(1)
