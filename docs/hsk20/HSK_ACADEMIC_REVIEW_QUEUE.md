# ZhongWenHub — Hàng đợi Kiểm duyệt Học thuật HSK 1–4

- **Nguyên tắc:** Không tự chuyển `academicApproved` từ `false` sang `true` khi chưa có chuyên gia tiếng Trung đối chiếu.

---

## 1. Các hạng mục cần chuyên gia học thuật duyệt

1. **64/70 bài nội dung AI-generated (`academicApproved = false`):**
   - **HSK 1 (9 bài phần `readingPassage`):** Bài 1, 3, 5, 6, 8, 9, 11, 12, 14.
   - **HSK 2 (15/15 bài):** toàn bộ 15 bài theo [`HSK14_HUMAN_REVIEW_MANIFEST.json`](../../data/hsk20/staging/HSK14_HUMAN_REVIEW_MANIFEST.json).
   - **HSK 3 (20/20 bài):** toàn bộ 20 bài.
   - **HSK 4 (20/20 bài):** toàn bộ 20 bài.
2. **Bản dịch tiếng Việt `optionsVi[]` bổ sung cho 24 câu hỏi HSK 1 (96 đáp án):**
   - Đã khớp ngữ cảnh và Pinyin hợp lệ 100%, chờ chuyên gia duyệt học thuật cuối cùng.
3. **110 câu hỏi đọc hiểu HSK 2–4 chưa có bản tiếng Trung (`questionZh` rỗng, `options` tiếng Việt):**
   - Cần biên soạn `questionZh`, `questionPinyin`, `options[]` tiếng Trung, `optionsPinyin[]`, `optionsVi[]` nếu muốn hiển thị song ngữ Trung–Việt đồng nhất như HSK 1.
4. **2 điểm Pinyin hội thoại cần xử lý trong DB:**
   - **HSK 3 — Bài 17 (`dialogue.lines[0]`):** sửa `Xǐao Lì` → `Xiǎo Lì`.
   - **HSK 4 — Bài 6 (`dialogue.lines[2]`):** xác nhận chuẩn ký hiệu thán từ `嗯` (`Ng` vs `Ńg`/`Ňg`/`Ǹg`).
