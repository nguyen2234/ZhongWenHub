# BẢNG KÊ GÓI DỮ LIỆU BÀN GIAO PHÁT HÀNH HSK 1 (RELEASE PACKAGE MANIFEST)

**Dự án:** ZhongWenHub  
**Phiên bản gói phát hành:** `v1.0.0-hsk1-phase91d`  
**Giai đoạn:** Phase 9.1D  
**Thời điểm đóng gói:** 10/11/2026 00:35 UTC+7  
**Mục tiêu bàn giao:** Cung cấp toàn bộ dữ liệu staging, kịch bản di chuyển (migration scripts), test suite và tài liệu kỹ thuật đi kèm mã băm SHA-256 để bảo đảm tính toàn vẹn dữ liệu.  

---

## 1. DANH MỤC CÁC TỆP DỮ LIỆU STAGING & MÃ BĂM SHA-256

| STT | Đường dẫn tệp | Loại dữ liệu | Số bản ghi | Mã băm SHA-256 |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `data/hsk30/staging/hsk1_content_human_review_manifest.json` | Master Review Manifest | 300 V, 72 G, 60 E, 6 R, 30 A | `a0945fed42353c528e85f965bc02019e81d6a92e1c4a4b6b726c92b764e9290d` |
| 2 | `data/hsk30/staging/hsk1_existing_exercise_fixes.json` | 14 Bài tập sửa placeholder | 14 bài tập | `0a61599da5c86126c20dc7b35d067a799786f1cbcd6d1da407fbf9f8bbff8184` |
| 3 | `data/hsk30/staging/hsk1_vocabulary_qa_manifest_300.json` | Rà soát 300 từ vựng | 300 từ vựng | `12ae3544eb1c28cbe98c2ca8ff3221b2ad18c7bc77f4e929f6004b9015c7e1ef` |
| 4 | `data/hsk30/staging/hsk1_vocabulary_examples.json` | 291 Câu ví dụ từ vựng mới | 291 ví dụ | `a7ff2128a8d115b7e923e218c50fa3a95bfcfb65b6ec9a6d0cfa5a27eb672951` |
| 5 | `data/hsk30/staging/hsk1_exercises.json` | 32 Bài tập củng cố mới | 32 bài tập | `89dbe718476a666991310fc22fc5ee87796078e3451ff200922485fa626b1f52` |
| 6 | `data/hsk30/staging/hsk1_reading_passages.json` | 6 Bài đọc hiểu đoạn văn | 6 bài đọc | `51c4a01c448bb5e0ee37f1966da3128b965eef7253503f83ceb98ef1f22cb7c6` |
| 7 | `data/hsk30/staging/hsk1_audio_browser_qa_results.json` | Kết quả QA 30 file MP3 | 30 kết quả | `c0d75471cffcbb1816bc89178ad697920401bcf577cfa2bfb73ce96fecf9ecb6` |

---

## 2. DANH MỤC CÁC KỊCH BẢN THỰC THI (SCRIPTS)

| STT | Đường dẫn script | Chức năng | Cơ chế an toàn |
| :---: | :--- | :--- | :--- |
| 1 | `scripts/hsk30/db_safety_guard.py` | Kiểm tra live database connection | Ngắt kết nối ngay nếu không phải `ZhongWenHub_Test` |
| 2 | `scripts/hsk30/apply_exercise_fixes_to_test.py` | Áp dụng 14 bài tập sửa lỗi | Kiểm tra SHA-256, chế độ Dry-run và Commit |
| 3 | `scripts/hsk30/browser_audio_qa.py` | Kiểm tra kết nối 30 file audio qua HTTP | Kiểm tra HTTP 200, Content-Type và dung lượng |
| 4 | `scripts/hsk30/import_staging_to_test.py` | Pipeline import và rollback | Hỗ trợ `--mode dry-run`, `--mode rollback`, `--mode commit` |
| 5 | `scripts/hsk30/build_human_review_manifest.py` | Tổng hợp Master Review Manifest | Gom 5 nhóm học liệu và tính mã băm SHA-256 |

---

## 3. DANH MỤC TỆP GIAO DIỆN & DỮ LIỆU FRONTEND

| STT | Tệp tin | Vai trò |
| :---: | :--- | :--- |
| 1 | `Fontend/src/features/lesson/components/ReadingPassageCard.tsx` | Component hiển thị bài đọc hiểu tương tác |
| 2 | `Fontend/src/features/lesson/data/hsk1ReadingPassages.ts` | Dữ liệu tĩnh 6 bài đọc hiểu HSK 1 |
| 3 | `Fontend/src/features/lesson/services/hsk-textbook.service.ts` | Tích hợp trường `readingPassage` vào `HskTextbookData` |
| 4 | `Fontend/src/features/lesson/pages/HskTextbookLessonPage.tsx` | Trang sách giáo khoa hiển thị `ReadingPassageCard` |
| 5 | `Fontend/e2e/hsk1-full-curriculum-e2e.spec.ts` | Test suite Playwright E2E toàn diện HSK 1 |
| 6 | `Fontend/public/audio/hsk1/*.mp3` | 30 file MP3 âm thanh bài học |

---

## 4. CAM KẾT VỀ MÃ NGUỒN VÀ DRAFT PR #16

1. **Trạng thái PR #16:** Giữ nguyên trạng thái **Open & Draft** (Không hợp nhất vào nhánh `main`).
2. **Quy tắc bảo vệ Dev DB:** Không áp dụng bất kỳ thay đổi nào lên `ZhongWenHub_Dev` trong Phase 9.1D.
3. **Quy tắc Release Gate:** 12 bài học (Lesson 4 đến Lesson 15) tiếp tục duy trì trạng thái `DRAFT` cho đến khi có chữ ký thẩm định con người.
