# DANH MỤC KIỂM TRA ĐIỀU KIỆN PHÁT HÀNH HSK 2 (HSK 2 RELEASE READINESS CHECKLIST)

> **Mục tiêu:** Rà soát toàn bộ các điều kiện tiên quyết trước khi phát hành chính thức giáo trình HSK 2 ra môi trường Production.  
> **Trạng thái kỹ thuật:** `TECHNICALLY_READY`  
> **Trạng thái học thuật:** `AWAITING_HUMAN_APPROVAL`  

---

## 1. BẢNG KIỂM TRA ĐIỀU KIỆN KỸ THUẬT (TECHNICAL GATE)

| STT | Điều kiện kiểm tra | Kết quả đạt được | Xác nhận |
| :---: | :--- | :--- | :---: |
| 1 | **Database Dev an toàn tuyệt đối** | ZhongWenHub_Dev giữ nguyên 100%, không bị ô nhiễm dữ liệu | [x] ĐẠT |
| 2 | **Khóa học & Bài học đầy đủ** | 1 Khóa học (HSK2), 5 Units, 15 Lessons trên SQL Server | [x] ĐẠT |
| 3 | **Từ vựng & Ví dụ ngữ cảnh** | 200/200 từ vựng có ví dụ hoàn chỉnh, pinyin chuẩn biến điệu | [x] ĐẠT |
| 4 | **Ngữ pháp chuẩn hóa** | 78/78 điểm ngữ pháp có công thức, giải thích, ví dụ | [x] ĐẠT |
| 5 | **Bài tập đạt chuẩn** | 60 bài tập (4 bài/lesson), 0 placeholder, đáp án phân bổ đều | [x] ĐẠT |
| 6 | **Bài đọc hiểu tích hợp** | 5 bài đọc hiểu cuối 5 Unit nhúng Zero-Schema vào `DialogueJson` | [x] ĐẠT |
| 7 | **Tài nguyên âm thanh** | 30/30 file MP3 HTTP 200 OK, MIME `audio/mpeg`, TTS fallback sẵn sàng | [x] ĐẠT |
| 8 | **Đồng bộ Frontend** | `curriculumData.ts` & `hsk-textbook.service.ts` chuẩn 5 Units/15 Lessons | [x] ĐẠT |
| 9 | **Kiểm thử đơn vị Frontend** | 288/288 bun tests PASS | [x] ĐẠT |
| 10 | **Kiểm thử đơn vị Backend** | 38/38 unit tests PASS (.NET 10) | [x] ĐẠT |
| 11 | **Kiểm thử tích hợp Backend** | 84/84 integration tests PASS | [x] ĐẠT |
| 12 | **Kiểm thử E2E trình duyệt thật** | 5/5 Desktop PASS, 5/5 Mobile PASS | [x] ĐẠT |
| 13 | **Không hồi quy HSK 1** | 5/5 HSK 1 Playwright E2E PASS | [x] ĐẠT |
| 14 | **Bảo mật Release Gate** | 15 bài học giữ nguyên DRAFT, học viên không thể xem bài Draft | [x] ĐẠT |
| 15 | **Đường ống nạp dữ liệu Staging** | Đã thử nghiệm thành công cả 3 mode: dry-run, commit, rollback | [x] ĐẠT |

---

## 2. BẢNG KIỂM TRA ĐIỀU KIỆN HỌC THUẬT (PEDAGOGICAL & HUMAN GATE)

| STT | Điều kiện kiểm tra | Trạng thái hiện tại | Kế hoạch tiếp theo |
| :---: | :--- | :--- | :--- |
| 1 | **Chữ ký Chuyên gia Ngôn ngữ Trung Quốc** | `PENDING_HUMAN_EXPERT_SIGN_OFF` | Trình Hội đồng thẩm định hồ sơ manifest |
| 2 | **Chữ ký Trưởng bộ môn Giáo trình** | `PENDING_HUMAN_EXPERT_SIGN_OFF` | Trình Hội đồng thẩm định hồ sơ manifest |
| 3 | **Chữ ký Release Architect** | `PENDING_HUMAN_EXPERT_SIGN_OFF` | Ký sau khi Chuyên gia Sư phạm hoàn tất |
| 4 | **Trạng thái xuất bản bài học** | `DRAFT` (15/15 bài học) | Chỉ chuyển `PUBLISHED` khi có phê duyệt |
| 5 | **Trạng thái GitHub Draft PR #16** | Giữ nguyên Draft PR (Open & Draft) | Tiếp tục duy trì Draft PR |

---

## 3. KẾT LUẬN CUỐI CÙNG

Toàn bộ hệ thống kỹ thuật, mã nguồn, cơ sở dữ liệu thử nghiệm và tài nguyên học liệu của HSK 2 đã hoàn thiện 100%. Giai đoạn Phase 9.2 kết thúc an toàn và minh bạch với trạng thái:
`TECHNICALLY_READY_AWAITING_HUMAN_APPROVAL`
