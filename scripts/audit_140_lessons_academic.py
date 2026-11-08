import pyodbc
import json
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

conn = pyodbc.connect('Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=ZhongWenHub_Dev;Trusted_Connection=yes;')
cur = conn.cursor()

cur.execute('''
    SELECT l.Id, c.HskLevel, l.LessonNumber, l.TitleZh, l.TitleVi, l.DialogueJson, l.ListeningJson
    FROM lessons l
    JOIN courses c ON l.CourseId = c.Id
    ORDER BY c.HskLevel, l.LessonNumber
''')
rows = cur.fetchall()
print(f"Total lessons fetched: {len(rows)}")

audit_findings = []
mechanical_repetitions = 0
generic_questions = 0
template_explanations = 0

for r in rows:
    lid, lvl, num, tzh, tvi, d_raw, l_raw = r
    d = json.loads(d_raw) if d_raw else {}
    l = json.loads(l_raw) if l_raw else []

    lines = d.get('lines', [])
    # Check dialogue structure
    if len(lines) < 4:
        audit_findings.append({
            'lessonId': lid, 'level': lvl, 'num': num, 'title': tzh,
            'severity': 'HIGH', 'category': 'Dialogue Quantity',
            'issue': f'Số lượt lời thoại ({len(lines)}) dưới chuẩn tối thiểu 4 lượt.',
            'remediation': 'Bổ sung thêm lượt lời mở rộng tình huống giao tiếp.'
        })

    # Check for mechanical pattern repetition across lines
    # e.g. "你好！" in L1 or template phrase "你看过/学过..."
    text_corpus = " ".join([ln.get('zh', '') for ln in lines])
    
    # Check listening item
    if not isinstance(l, list) or len(l) == 0:
        audit_findings.append({
            'lessonId': lid, 'level': lvl, 'num': num, 'title': tzh,
            'severity': 'CRITICAL', 'category': 'Listening Missing',
            'issue': 'Không có dữ liệu bài tập nghe hiểu ListeningJson.',
            'remediation': 'Khởi tạo bài tập nghe hiểu theo schema.'
        })
    else:
        item = l[0]
        prompt = item.get('prompt', '')
        expl = item.get('explanation', '')
        options = item.get('options', [])

        # Check generic listening prompt: "第一位说话人的主要目的是什么？"
        if "第一位说话人的主要目的" in prompt or "主要目的" in prompt:
            generic_questions += 1
            if num > 3: # In higher lessons, questions should be specific to content, not just generic purpose
                audit_findings.append({
                    'lessonId': lid, 'level': lvl, 'num': num, 'title': tzh,
                    'severity': 'MEDIUM', 'category': 'Listening Generic Prompt',
                    'issue': f'Câu hỏi nghe hiểu dùng mẫu khung lặp lại ("第一位说话人的主要目的是什么？") chưa bám sát tình huống cụ thể của bài học "{tzh}".',
                    'evidence': f'Prompt: {prompt[:80]}...',
                    'remediation': f'Thiết kế lại câu hỏi nghe kiểm tra trực tiếp chi tiết sự kiện/thời gian/ý đồ của chủ đề "{tvi}".'
                })

        # Check options quality
        if len(options) != 4:
            audit_findings.append({
                'lessonId': lid, 'level': lvl, 'num': num, 'title': tzh,
                'severity': 'HIGH', 'category': 'Listening Options Count',
                'issue': f'Số lượng phương án trả lời ({len(options)}) không đạt chuẩn 4 phương án HSK.',
                'remediation': 'Chuẩn hóa thành 4 phương án A, B, C, D.'
            })
        else:
            # Check generic distractor options like "拒绝对方的邀请", "表达强烈的反对意见"
            distractor_texts = [opt.get('text', '') for opt in options]
            if any("表达强烈的反对意见" in opt for opt in distractor_texts):
                mechanical_repetitions += 1

        # Check explanation quality
        if "Phương án A là đáp án chính xác nhất" in expl:
            template_explanations += 1

print(f"\nAudit Summary:")
print(f"- Total audit findings: {len(audit_findings)}")
print(f"- Generic prompt occurrences: {generic_questions}/140")
print(f"- Generic distractor occurrences: {mechanical_repetitions}/140")
print(f"- Template explanation occurrences: {template_explanations}/140")

# Group by severity
by_sev = {}
for f in audit_findings:
    by_sev[f['severity']] = by_sev.get(f['severity'], 0) + 1
print(f"By Severity: {by_sev}")

conn.close()
