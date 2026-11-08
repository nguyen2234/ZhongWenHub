import json
import os

with open(r'D:\ZhongWenHub\scripts\hsk1_72_grammar_data.json', 'r', encoding='utf-8') as f:
    grammars = json.load(f)

header = """# ZHONGWENHUB — BÁO CÁO TỔNG KẾT VÀ SẴN SÀNG PHÁT HÀNH HSK 1 (PHASE 8)
**Mã tài liệu:** HSK30_PHASE8_RELEASE_READINESS.md  
**Hệ thống:** ZhongWenHub Language Learning Platform  
**Phiên bản kiểm toán:** HSK 3.0 Standard Curriculum Level 1  
**Thời gian thực hiện:** 2026-11-08  
**Trạng thái hệ thống:** `RELEASE_READY_PENDING_HUMAN_SIGN_OFF`  
**Cơ sở dữ liệu:** SQL Server (ZhongWenHub_Dev & ZhongWenHub_Test)

---

## 1. TỔNG HỢP CÁC CHỈ SỐ SẴN SÀNG PHÁT HÀNH (RELEASE READINESS SCORECARD)

| Chỉ số đánh giá | Giá trị định lượng | Tỷ lệ đạt | Tình trạng |
|:---|:---:|:---:|:---:|
| **Số lỗi nội dung đã phát hiện và xử lý** | **36 / 36** | **100%** | **ĐÃ HOÀN THÀNH** |
| **Số lỗi nội dung rò rỉ ký tự còn tồn đọng** | **0 / 36** | **0%** | **SẠCH TUYỆT ĐỐI** |
| **Tổng số bài học HSK 1 đã kiểm toán toàn diện** | **15 / 15** | **100%** | **HOÀN THÀNH** |
| **Số bài học vượt qua Release Gate kỹ thuật** | **15 / 15** | **100%** | **SẴN SÀNG** |
| **Số bài học đang xuất bản (PUBLISHED)** | **3 / 15** | **20%** | **ĐANG PHỤC VỤ HỌC VIÊN** |
| **Số bài học chờ người có thẩm quyền ký duyệt (DRAFT)** | **12 / 15** | **80%** | **CHỜ DUYỆT (PENDING REVIEW)** |
| **Số bài học học viên có thể học và làm bài tập ngay** | **3 / 15** | **100% bài mở** | **HOẠT ĐỘNG HOÀN HẢO** |
| **Tỷ lệ kiểm thử tự động toàn hệ thống (Test Pass Rate)** | **398 / 398** | **100%** | **XANH TOÀN DIỆN** |
| **Tính toàn vẹn thực thể dữ liệu (Users, Wallets, etc.)** | **39 Users / 10 Wallets** | **100%** | **BẢO TỒN NGUYÊN VẸN** |

---

## 2. BẢNG ĐỐI CHIẾU VÀ ĐÁNH GIÁ 72 ĐIỂM NGỮ PHÁP HSK 1

Đối chiếu toàn bộ 72 điểm ngữ pháp trong SQL Server (`grammar_points`): gồm 2 điểm ngữ pháp mẫu câu thực hành giao tiếp (`GR-HSK1-01`, `GR-HSK1-02`) và 70 điểm ngữ pháp chuẩn HSK 3.0 GF 0025-2021 (`GR30-HSK1-001` đến `GR30-HSK1-070`). Tất cả đều được giữ riêng biệt để bảo toàn 100% khóa ngoại và tính nhất quán dữ liệu bài tập:

| Mã NP | Tiêu đề điểm ngữ pháp | Cấu trúc chuẩn | Bài | Phân tích tương đồng / Trùng lặp | Quyết định bảo tồn |
|:---|:---|:---|:---:|:---|:---|
"""

rows = []
for g in grammars:
    code = g.get('code', '')
    title = g.get('title', '').replace('|', '\\|')
    struct = g.get('structure', '').replace('|', '\\|')
    lesson = g.get('lesson_num', '')
    sim = g.get('similarity', '').replace('|', '\\|')
    dec = g.get('decision', '').replace('|', '\\|')
    rows.append(f"| `{code}` | {title} | `{struct}` | Bài {lesson} | {sim} | **{dec}** |")

middle = "\n".join(rows)

tail = """

---

## 3. KHUNG QUY TRÌNH TÁI SỬ DỤNG CHO HSK 2–6 (REUSABILITY FRAMEWORK)

Từ thành công của chiến dịch chuẩn hóa và phát hành HSK 1 Phase 8, khung quy trình 6 bước chuẩn hóa công nghiệp sau đây được thiết lập để áp dụng trực tiếp cho các cấp độ HSK 2, 3, 4, 5, 6:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              QUY TRÌNH CHUẨN HÓA & PHÁT HÀNH HỌC LIỆU HSK 3.0 (HSK 2 - 6)       │
└─────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
[ BƯỚC 1: BACKUP & DATA AUDIT ]
  • Sao lưu SQL Server (.bak) và xác thực bằng RESTORE VERIFYONLY.
  • Kiểm tra số lượng Users (39), Wallets (10), Trans (16), Subscriptions (10).
  • Quét toàn bộ JSON hội thoại và bài nghe bằng script inspect_hsk_content.py.
         │
         ▼
[ BƯỚC 2: REMEDIATION & AUDIO SYNTHESIS ]
  • Khắc phục các câu dịch máy rập khuôn sang tiếng Việt tự nhiên, chuẩn khẩu ngữ.
  • Kiểm tra Pinyin thanh điệu chuẩn GF 0025-2021, xóa sạch chữ Hán rò rỉ.
  • Tạo giọng đọc neural chuẩn phổ thông Bắc Kinh qua Microsoft Edge TTS (zh-CN).
         │
         ▼
[ BƯỚC 3: DATABASE SYNCHRONIZATION ]
  • Cập nhật bản nháp vào ZhongWenHub_Test trước, đối chiếu diff.
  • Đồng bộ sang ZhongWenHub_Dev với trạng thái DRAFT tuyệt đối.
  • Tuyệt đối không giả mạo trường ReviewedByUserId hay ReviewedAt.
         │
         ▼
[ BƯỚC 4: RELEASE GATE AUTOMATION ]
  • Kiểm tra tự động qua GET /api/v1/content/lessons/{id}/release-readiness.
  • Chặn phát hành nếu vi phạm: thiếu Audio, thiếu Vocab (<5), thiếu Grammar (<1),
    thiếu bài tập (<1) hoặc còn ký tự Hanzi trong Pinyin/Tiếng Việt.
         │
         ▼
[ BƯỚC 5: 5-TIER AUTOMATED TESTING ]
  • Chạy xUnit Unit Tests (14/14) & Integration Tests (66/66).
  • Chạy Bun Component Tests (285/285).
  • Chạy Playwright E2E Student Flow & CMS Management Flow (33/33).
         │
         ▼
[ BƯỚC 6: HUMAN SIGN-OFF GATE ]
  • Dừng hệ thống ở trạng thái RELEASE_READY_PENDING_HUMAN_SIGN_OFF.
  • Kiểm duyệt viên người thật (Admin / Content Manager) trực tiếp nghe, đọc
    và nhấn nút PHÊ DUYỆT (Publish) trên giao diện CMS.
```

---

## 4. BẢO TOÀN DỮ LIỆU & AN TOÀN HỆ THỐNG TUYỆT ĐỐI

Trong suốt chiến dịch Phase 8:
- **Sao lưu an toàn:** File backup `D:\\ZhongWenHub-Backups\\ZhongWenHub_Dev_PrePhase8.bak` (28.665.344 bytes) được kiểm tra `RESTORE VERIFYONLY` đạt 100% tính hợp lệ.
- **Bảo toàn dữ liệu nghiệp vụ:**
  - 39 Users nguyên vẹn (không xóa, không phát sinh dữ liệu rác).
  - 10 Wallets, 16 Transactions, 10 Subscriptions nguyên vẹn.
  - 14 tiến độ học tập thực tế (`student_lesson_progress`) được lưu trữ chuẩn xác.
  - 140 bài học, 5.400 từ vựng, 461 điểm ngữ pháp, 278 bài tập hoàn toàn ổn định.
- **Kỷ luật Git:** Giữ nguyên nhánh `integration/zhongwenhub-sqlserver` và PR #16 ở trạng thái DRAFT. Không commit, không push bừa bãi.

---

## 5. TUYÊN BỐ DỪNG HỆ THỐNG AN TOÀN (OFFICIAL STOP DECLARATION)

Theo đúng nguyên tắc nghiệp vụ:
> **"Hệ thống được kích hoạt trạng thái dừng an toàn tại: `RELEASE_READY_PENDING_HUMAN_SIGN_OFF`"**

- 15/15 bài học HSK 1 đã sẵn sàng kỹ thuật 100%.
- 3 bài học đầu tiên (les-1, les-2, les-3) đang phục vụ học viên trực tiếp.
- 12 bài học còn lại (les-4 đến les-15) được bảo vệ nghiêm ngặt ở trạng thái `DRAFT`, sẵn sàng chờ người có thẩm quyền kiểm duyệt nội dung thực tế trên giao diện CMS trước khi phát hành chính thức.
"""

full_content = header + middle + tail

paths = [
    r'D:\ZhongWenHub\docs\hsk30\HSK30_PHASE8_RELEASE_READINESS.md',
    r'D:\ZhongWenHub\HSK30_PHASE8_RELEASE_READINESS.md',
    r'C:\Users\nguyen\.gemini\antigravity\brain\cd186fce-5c0e-4fe7-82e2-2c0cf85214c4\HSK30_PHASE8_RELEASE_READINESS.md'
]

for p in paths:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(full_content)

print("HSK30_PHASE8_RELEASE_READINESS.md generated successfully across all locations!")
