# TỔNG MỤC GÓI PHÁT HÀNH HSK 3 (RELEASE PACKAGE MANIFEST)

## I. THÔNG TIN GÓI PHÁT HÀNH

- **Tên gói**: `ZhongWenHub-HSK3-Release-Package-v1.0`
- **Phiên bản chuẩn**: GF 0025-2021 / HSK 3.0 Curriculum Alignment
- **Ngày đóng gói**: 2026-11-10
- **Trạng thái**: `STAGED_READY_FOR_HUMAN_SIGN_OFF`
- **Mã PR liên kết**: PR #16 (Draft)
- **Mã commit chuẩn**: `HEAD`

---

## II. DANH MỤC THÀNH PHẦN GÓI PHÁT HÀNH

### 1. Học liệu Dữ liệu Staging (`data/hsk30/staging/`)
| Tệp dữ liệu | Nội dung | Số lượng bản ghi |
| :--- | :--- | :---: |
| `hsk3_vocabulary_enrichment.json` | 500 từ vựng kèm ví dụ câu, nghĩa, pinyin | 500 từ |
| `hsk3_grammar_qa_manifest.json` | 96 điểm ngữ pháp bám sát 20 bài | 96 điểm |
| `hsk3_exercises.json` | 80 bài tập trắc nghiệm đa kỹ năng | 80 bài |
| `hsk3_reading_passages.json` | 5 bài đọc hiểu cuối Unit kèm câu hỏi | 5 bài đọc |
| `hsk3_audio_qa_manifest.json` | Danh mục kiểm định 40 tệp âm thanh MP3 | 40 tệp |
| `hsk3_content_human_review_manifest.json` | Master Manifest tổng hợp 721 cấu phần | 721 cấu phần |

### 2. Tệp Đa phương tiện (`Fontend/public/audio/hsk3/`)
- 20 tệp hội thoại: `les1_dialogue.mp3` đến `les20_dialogue.mp3`.
- 20 tệp bài nghe: `les1_listening.mp3` đến `les20_listening.mp3`.

### 3. Tệp Mã nguồn Frontend & Backend
- `Fontend/src/features/learning/data/curriculumData.ts`: Cấu trúc 5 Units, 20 Lessons HSK 3.
- `Fontend/src/features/lesson/data/hsk3ReadingPassages.ts`: Dữ liệu bài đọc hiểu HSK 3.
- `Fontend/src/features/lesson/services/hsk-textbook.service.ts`: Dịch vụ tích hợp bài đọc hiểu động.
- `Backend/tests/ZhongWenHub.IntegrationTests/Hsk30DataAndSecurityIntegrationTests.cs`: Kiểm thử hồi quy hệ thống.

### 4. Scripts Tự động hóa & Kiểm toán (`scripts/hsk30/`)
- `db_safety_guard.py`: Bảo vệ an toàn CSDL chống ghi nhầm vào Dev.
- `audit_hsk3_baseline.py`: Kiểm toán dữ liệu cơ sở HSK 3.
- `generate_hsk3_vocabulary_examples.py`: Làm giàu 500 từ vựng.
- `audit_hsk3_grammar.py`: Rà soát 96 điểm ngữ pháp.
- `generate_hsk3_exercises.py`: Sinh 80 bài tập trắc nghiệm.
- `audit_hsk3_audio.py`: Kiểm toán 40 tệp MP3.
- `import_hsk3_staging_to_test.py`: Pipeline nạp dữ liệu vào Test DB và exact rollback.
- `build_hsk3_human_review_manifest.py`: Tạo manifest tổng duyệt học thuật.

### 5. Kịch bản Kiểm thử Tự động E2E
- `Fontend/e2e/hsk3-full-curriculum-e2e.spec.ts`: 10 kịch bản Playwright E2E trình duyệt thật.

---

## III. CHỈ SỐ CHẤT LƯỢNG NGHIỆM THU

- **Tỷ lệ vượt qua Frontend Tests**: 288/288 (100%).
- **Tỷ lệ vượt qua Backend Tests**: 122/122 (100%).
- **Tỷ lệ vượt qua Playwright E2E**: 30/30 (HSK 1, 2, 3) (100%).
- **Mức độ ảnh hưởng CSDL Dev**: 0 dirty writes (100% an toàn).
- **Trạng thái sẵn sàng**: `TECHNICALLY_READY_AWAITING_HUMAN_APPROVAL`.
