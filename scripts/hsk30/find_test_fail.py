import sys
log_path = r"C:\Users\nguyen\.gemini\antigravity\brain\cd186fce-5c0e-4fe7-82e2-2c0cf85214c4\.system_generated\tasks\task-11845.log"
with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if "Failed " in l or "Failed:" in l or "FAILED" in l or "[FAIL]" in l:
        print(f"Line {i}: {l.strip()}")
        for sub in lines[max(0, i-4):min(len(lines), i+8)]:
            print("  ", sub.strip())
        print("-" * 50)
