# TỔNG MỤC GÓI PHÁT HÀNH HSK 4 (RELEASE PACKAGE MANIFEST)

## I. DANH MỤC THÀNH PHẦN GÓI BÀN GIAO

1. **Mã nguồn Backend**:
   - `Backend/tests/ZhongWenHub.IntegrationTests/Hsk30DataAndSecurityIntegrationTests.cs`: Bổ sung điều kiện kiểm toán số lượng bài tập 490 bài.
2. **Mã nguồn Frontend**:
   - `Fontend/src/features/lesson/data/hsk4ReadingPassages.ts`: Định nghĩa 5 bài đọc hiểu Unit.
   - `Fontend/src/features/lesson/services/hsk-textbook.service.ts`: Tích hợp các bài đọc hiểu HSK 4 vào luồng bài học.
   - `Fontend/src/types/lesson-content.types.ts`: Chuẩn hóa kiểu `LessonReadingPassageDTO`.
   - `Fontend/tsconfig.app.json`: Tối ưu hóa cấu hình build.
3. **Bộ dữ liệu Staging JSON**:
   - `data/hsk30/staging/hsk4_vocabulary_enrichment.json` (1,000 từ vựng).
   - `data/hsk30/staging/hsk4_grammar_qa_manifest.json` (95 điểm ngữ pháp).
   - `data/hsk30/staging/hsk4_exercises.json` (80 bài tập).
   - `data/hsk30/staging/hsk4_reading_passages.json` (5 bài đọc hiểu).
   - `data/hsk30/staging/hsk4_audio_qa_manifest.json` (40 tệp âm thanh).
   - `data/hsk30/staging/hsk4_content_human_review_manifest.json` (Hồ sơ thẩm định tổng hợp).
4. **Kịch bản kiểm thử tự động**:
   - `Fontend/e2e/hsk4-full-curriculum-e2e.spec.ts`: Bộ 10 kịch bản Playwright E2E HSK 4.
5. **Hồ sơ tài liệu kỹ thuật**:
   - 19 tài liệu Markdown chuyên sâu đặt tại `docs/hsk30/phase94/`.
