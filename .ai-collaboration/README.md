# ZhongWenHub AI Collaboration & Independent QA Bridge — V1

Hệ thống phối hợp kỹ thuật và kiểm thử độc lập giữa **ChatGPT** (Planner & Independent QA Reviewer) và **Antigravity** (Development & Test Execution Agent) thông qua **GitHub**.

## Cấu trúc thư mục

```
.ai-collaboration/
├── protocol/               # JSON Schemas và quy ước giao thức
│   ├── PROTOCOL.md
│   ├── task.schema.json
│   ├── result.schema.json
│   ├── review.schema.json
│   ├── checkpoint.schema.json
│   ├── qa-evidence.schema.json
│   └── release-gate.schema.json
├── tasks/                  # Danh sách nhiệm vụ kỹ thuật
├── results/                # Kết quả thực thi và bằng chứng test
├── reviews/                # Đánh giá độc lập từ ChatGPT
├── state/                  # Trạng thái tổng thể dự án
│   └── project_state.json
├── qa/                     # Ma trận kiểm thử chức năng & release gate
│   ├── functional-test-matrix.json
│   ├── coverage-summary.json
│   ├── security-findings.json
│   └── release-gate.json
├── examples/               # Mẫu task, result, review chuẩn
└── archive/                # Nhiệm vụ đã nghiệm thu hoặc lưu trữ
```

## Vai trò & Phân quyền

1. **ChatGPT (Planner & Independent Reviewer)**:
   - Tạo nhiệm vụ (`tasks/*.json`) với Acceptance Criteria và Safety Constraints rõ ràng.
   - Review mã nguồn, git diff, kết quả CI và test evidence độc lập.
   - Ban hành quyết định review: `ACCEPTED`, `CHANGES_REQUESTED`, hoặc `BLOCKED`.
   - **Không tự tin vào báo cáo tự khai** mà dựa trên commit SHA, CI artifacts và evidence file.

2. **Antigravity (Execution & Verification Agent)**:
   - Nhận (`claim-task`), thực thi code và chạy test thật.
   - Lưu checkpoint định kỳ để chống timeout hoặc crash.
   - Tạo bằng chứng kiểm thử sanitized (`results/*.json`), commit, push và kích hoạt CI.
   - Chuyển trạng thái sang `WAITING_FOR_REVIEW`.
   - Tiếp nhận `CHANGES_REQUESTED` để khắc phục lỗi và tạo commit mới.

3. **GitHub (Platform of Record & Verification)**:
   - Lưu trữ mã nguồn, Pull Request #16, GitHub Issues và Issue Comments.
   - Chạy GitHub Actions workflows tự động trên runner cô lập.
   - Đảm bảo tính minh bạch, lịch sử audit không thể làm giả.
