# ZHONGWENHUB — BÁO CÁO BỔ SUNG BÀI TẬP LUYỆN TẬP HSK 1 (EXERCISE ENRICHMENT QA)

**Tài liệu:** `docs/hsk30/phase91b/HSK1_EXERCISE_ENRICHMENT_QA.md`  
**Giai đoạn:** Phase 9.1B — Task D  
**Ngày thực hiện:** 09/11/2026  
**File staging sinh ra:** `data/hsk30/staging/hsk1_exercises.json`  
**Trạng thái:** HOÀN THÀNH — 32/32 BÀI TẬP ĐƯỢC THIẾT KẾ & KIỂM ĐỊNH CHẶT CHẼ

---

## I. MỤC TIÊU & BỐI CẢNH

Theo kết quả kiểm toán Phase 9.1A:
- Tổng số bài tập HSK 1 trong database hiện tại: **28 bài tập** trên toàn bộ 15 bài học (trung bình chỉ 1–2 bài/bài học).
- Nhiều bài tập cũ có chất lượng sư phạm chưa cao, chứa các lựa chọn gây nhiễu mang tính placeholder ("Nghĩa khác A", "Nghĩa khác B", "Nghĩa khác C").
- Mật độ bài tập quá thưa khiến học viên không có cơ hội củng cố ngữ pháp và rèn luyện kỹ năng đọc hiểu sau mỗi bài học.

**Mục tiêu Phase 9.1B Task D:**
- Thiết kế **32 bài tập mới** chuẩn sư phạm HSK 1:
  - 2 bài tập chuyên sâu cho mỗi bài trong số 15 bài học (30 bài tập).
  - 2 bài tập ôn tập tổng hợp (Ôn tập Units 1–3 và Ôn tập Toàn diện Units 4–6).
- Nâng tổng số bài tập HSK 1 từ 28 lên **60 bài tập** (đạt mật độ chuẩn 4 bài tập/bài học).
- Đảm bảo 100% tính đơn nghĩa, phương án nhiễu có cơ sở ngôn ngữ học, có giải thích ngữ pháp chi tiết.
- Lưu toàn bộ tại `data/hsk30/staging/hsk1_exercises.json`.
- **Tuyệt đối an toàn:** Không chạy lệnh INSERT vào cơ sở dữ liệu `ZhongWenHub_Dev`.

---

## II. NGUYÊN TẮC THIẾT KẾ SƯ PHẠM

1. **Đa dạng dạng bài:**
   - **Trắc nghiệm đọc hiểu (Multiple Choice - Reading):** Kiểm tra khả năng hiểu nghĩa câu, phản xạ hội thoại giao tiếp.
   - **Điền từ vào chỗ trống (Fill-in-the-blank):** Kiểm tra khả năng sử dụng trợ từ ngữ khí (吗, 呢), động từ năng nguyện (想, 会), phó từ chỉ mức độ (很, 太...了) và phương vị từ (上, 下, 前, 后).
   - **Sắp xếp trật tự từ (Sentence Ordering):** Củng cố trật tự từ cốt lõi của tiếng Hán (Chủ ngữ + Thời gian + Địa điểm + Động từ + Tân ngữ; Câu chữ 是; Cấu trúc 是...的; Câu liên động).
2. **Loại bỏ hoàn toàn tính mơ hồ (Zero Ambiguity):**
   - Mỗi câu hỏi chỉ có duy nhất 1 đáp án chính xác.
   - Các phương án nhiễu (distractors) được xây dựng dựa trên các lỗi sai ngữ pháp điển hình của người Việt Nam khi học tiếng Trung (ví dụ: đặt trạng ngữ chỉ thời gian ở cuối câu như tiếng Việt, nhầm lẫn giữa 不客气 và 没关系, nhầm lẫn giữa 几 và 多少).
3. **Giải thích chi tiết (Explanation Vi):**
   - 100% bài tập có phần giải thích ngữ pháp tiếng Việt rõ ràng, giải thích cặn kẽ tại sao đáp án đó đúng và cấu trúc ngữ pháp tương ứng là gì.

---

## III. BẢNG PHÂN BỔ 32 BÀI TẬP THEO BÀI HỌC

| STT | Bài học | Tiêu đề bài học | Dạng bài tập 1 | Dạng bài tập 2 |
| :---: | :---: | :--- | :--- | :--- |
| 1 | Lesson 1 | 你好 (Chào bạn) | Multiple Choice (Chào hỏi) | Fill-in-the-blank (Trợ từ 吗) |
| 2 | Lesson 2 | 谢谢你 (Cảm ơn bạn) | Multiple Choice (Đáp lại cảm ơn) | Multiple Choice (Đáp lại xin lỗi) |
| 3 | Lesson 3 | 你叫什么名字 (Bạn tên là gì) | Sentence Ordering (Hỏi tên) | Fill-in-the-blank (Động từ 叫) |
| 4 | Lesson 4 | 他是我的汉语老师 (Thầy giáo của tôi) | Multiple Choice (Trợ từ sở hữu 的) | Multiple Choice (Đại từ nghi vấn 谁) |
| 5 | Lesson 5 | 我想喝茶 (Tôi muốn uống trà) | Fill-in-the-blank (Năng nguyện 想) | Multiple Choice (Từ vựng đồ uống) |
| 6 | Lesson 6 | 你在做什么呢 (Bạn đang làm gì thế) | Multiple Choice (Tiếp diễn 在...呢) | Sentence Ordering (Cấu trúc tiếp diễn) |
| 7 | Lesson 7 | 今天星期几 (Hôm nay thứ mấy) | Multiple Choice (Hỏi thứ trong tuần) | Fill-in-the-blank (Quy tắc Năm-Tháng-Ngày) |
| 8 | Lesson 8 | 明天天气怎么样 (Thời tiết thế nào) | Multiple Choice (Nghi vấn 怎么样) | Multiple Choice (Mức độ 太...了) |
| 9 | Lesson 9 | 现在几点 (Bây giờ mấy giờ) | Multiple Choice (Đọc giờ & phút) | Fill-in-the-blank (Nghi vấn số lượng 几) |
| 10 | Lesson 10 | 我星期一去北京 (Thứ hai tôi đi Bắc Kinh) | Multiple Choice (Vị trí trạng ngữ thời gian) | Fill-in-the-blank (Động từ chuyển dịch 去) |
| 11 | Lesson 11 | 这个苹果多少钱 (Quả táo bao nhiêu tiền) | Multiple Choice (Hỏi giá cả 多少钱) | Fill-in-the-blank (Đơn vị tiền tệ 块) |
| 12 | Lesson 12 | 你去哪儿买东西 (Bạn đi đâu mua đồ) | Multiple Choice (Nơi chốn 哪儿) | Sentence Ordering (Câu liên động Đi đâu làm gì) |
| 13 | Lesson 13 | 他在学校前面 (Anh ấy ở trước trường) | Multiple Choice (Phương vị từ 前面) | Fill-in-the-blank (Vị trí 上边 vs 下边) |
| 14 | Lesson 14 | 你会开车吗 (Bạn biết lái xe không) | Multiple Choice (Năng nguyện 会 qua học tập) | Fill-in-the-blank (Phủ định 不会) |
| 15 | Lesson 15 | 我是坐飞机来的 (Tôi đến bằng máy bay) | Multiple Choice (Cấu trúc nhấn mạnh 是...的) | Sentence Ordering (Sắp xếp câu 是...的) |
| 16 | Review 1 | Ôn tập Units 1–3 (Lessons 1–7) | Multiple Choice (Đọc hiểu đối thoại giao tiếp tổng hợp) | — |
| 17 | Review 2 | Ôn tập Units 4–6 (Lessons 8–15) | Multiple Choice (Đọc hiểu đoạn văn thời gian, phương tiện, chi tiêu) | — |

---

## IV. ĐỐI CHIẾU DỮ LIỆU & AN TOÀN HỆ THỐNG

- Số lượng bài tập sinh trong staging: **32 bài tập**.
- Số lượng bài tập hiện có trên Dev database: **28 bài tập (nguyên vẹn)**.
- Khi triển khai chính thức (sau khi được duyệt), tổng số bài tập sẽ là $28 + 32 = 60$ bài tập, trung bình đúng 4 bài tập/bài học, giải quyết dứt điểm cảnh báo về mật độ luyện tập của Phase 9.1A.
