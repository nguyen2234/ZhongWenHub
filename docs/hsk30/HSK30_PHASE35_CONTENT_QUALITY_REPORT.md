# BÁO CÁO KIỂM ĐỊNH CHẤT LƯỢNG HỌC THUẬT & NỘI DUNG GIÁO TRÌNH HSK 3.0
## HSK 3.0 Master Curriculum — Academic Quality Audit & Content Defect Log

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Dự án** | ZhongWenHub — Nền tảng Học tiếng Trung & Luyện thi HSK 3.0 |
| **Giai đoạn** | Phase 3.5: Curriculum Quality Assurance & Student Experience |
| **Mã tài liệu** | `HSK30_PHASE35_CONTENT_QUALITY_REPORT` |
| **Quy mô rà soát** | Toàn bộ 140 bài học (HSK 1 đến HSK 6) trên Microsoft SQL Server |
| **Thời điểm kiểm định** | 08/11/2026 |
| **Trạng thái nội dung** | **DỰ THẢO KHỞI TẠO BẰNG AI (SYNTHETIC BASELINE) — ĐANG CHỜ BAN CHUYÊN MÔN THẨM ĐỊNH** |

---

## 1. TỔNG QUAN KIỂM ĐỊNH HỌC THUẬT

Trong Phase 3, hệ thống đã ứng dụng quy trình tổng hợp tự động (`build_140_lessons_content.py`) để tạo lập cấu trúc `DialogueJson` và `ListeningJson` cho 140 bài học dựa trên ngân hàng 5.400 từ vựng và 461 điểm ngữ pháp HSK 3.0.

Đợt kiểm định Phase 3.5 tiến hành phân tích học thuật độc lập trên toàn bộ 140 bài nhằm:
1. Đánh giá tính tự nhiên, độ chuẩn xác ngữ pháp và phiên âm Pinyin của văn bản hội thoại.
2. Phát hiện các mẫu hội thoại và câu hỏi trắc nghiệm bị lặp cơ học (mechanical repetition).
3. Đánh giá bản dịch ngữ cảnh tiếng Việt và kiểm soát việc từ vựng vượt cấp.
4. Xuất danh mục lỗi (Defect Log) chi tiết theo `LessonId`, mức độ nghiêm trọng và phương án khắc phục.
5. Xác lập ranh giới minh bạch: **Không đánh dấu nội dung AI-generated là đã được chuyên gia phê duyệt**.

---

## 2. PHÂN TÍCH CHUYÊN SÂU CÁC VẤN ĐỀ HỌC THUẬT ĐƯỢC PHÁT HIỆN

### 2.1. Vấn đề 1: Hiện tượng Lặp Mẫu Cơ học trong Bài tập Nghe hiểu (Listening Generic Repetition)
- **Bằng chứng thực tế**:
  Qua kiểm toán 140 bài học trong SQL Server, phát hiện **140/140 bài học (100%)** đều sử dụng chung một khuôn mẫu câu hỏi trắc nghiệm:
  - **Câu hỏi (Prompt)**: `"根据听到的对话内容，第一位说话人的主要目的是什么？ (Mục đích chính của người nói thứ nhất là gì?)"`
  - **Phương án nhiễu (Distractors)**: Cả 140 bài đều dùng chung 3 phương án nhiễu rập khuôn:
    - B: `"拒绝对方的邀请 (Từ chối lời mời của đối phương)"`
    - C: `"表达强烈的反对意见 (Bày tỏ ý kiến phản đối kịch liệt)"`
    - D: `"讨论与主题无关的事情 (Thảo luận việc không liên quan)"`
  - **Lời giải thích (Explanation)**: Cả 140 bài đều có công thức giải thích:
    `"Người thứ nhất mở đầu hội thoại bằng câu hỏi thăm trực tiếp về '[Tên chủ đề]'. Phương án A là đáp án chính xác nhất."`
- **Đánh giá mức độ nghiêm trọng**: **MEDIUM - HIGH** (Lỗi thiết kế sư phạm).
- **Phân tích tác động**: Các câu hỏi mẫu này đạt yêu cầu về cấu trúc JSON hợp lệ và cho phép Frontend render bài tập, nhưng **chưa thực sự kiểm tra được chi tiết ngôn ngữ chuyên sâu** (như thời gian, địa điểm, quan hệ logic, nguyên nhân - kết quả) của từng bài học ở các cấp độ HSK 3–6.

### 2.2. Vấn đề 2: Tính Tự nhiên của Hội thoại ở các Cấp độ Cao (Advanced Dialogue Authenticity)
- **Bằng chứng thực tế**:
  - Ở HSK 1–2, các câu thoại như `"你好！"`, `"谢谢你！"`, `"再见！"` có độ tự nhiên cao và bám sát thực tế giao tiếp.
  - Tuy nhiên, từ HSK 4 đến HSK 6, nhiều lượt thoại được ghép từ vựng mục tiêu theo cấu trúc câu đơn giản hoặc văn phong hơi cứng (ví dụ: việc ghép các thành ngữ hoặc thuật ngữ kinh tế, triết học vào hội thoại đời thường 4 câu thoại khiến ngữ cảnh bị gượng gạo).
- **Đánh giá mức độ nghiêm trọng**: **MEDIUM** (Hạn chế về tính bản ngữ).
- **Phân tích tác động**: Cần biên tập viên người bản xứ (Native Chinese Editor) tinh chỉnh lại để chuyển hóa thành văn bản đọc hiểu (Reading Comprehension) hoặc bài phỏng vấn/thuyết trình chuyên sâu thay vì cố định dạng hội thoại 2 người ngắn ngủi.

### 2.3. Vấn đề 3: Phiên âm Pinyin và Thanh điệu Đối chiếu (Pinyin Tone Integrity)
- **Kết quả kiểm toán**:
  - Hầu hết phiên âm Pinyin của các từ đơn và cụm từ ngắn đều có dấu thanh chuẩn xác (ví dụ: `Nǐ hǎo`, `Xièxie nǐ`, `Duìbuqǐ`).
  - Tuy nhiên, hiện tượng biến điệu thanh điệu (Tone Sandhi) như `一` (yī), `不` (bù) và cụm hai thanh 3 liên tiếp (`3-3 -> 2-3`) hiện đang ghi theo âm gốc từ điển chứ chưa có chú thích biến âm sư phạm trực tiếp trên từng câu thoại.
- **Đánh giá mức độ nghiêm trọng**: **LOW**.

---

## 3. DANH MỤC LỖI VÀ KHIẾM KHUYẾT THEO BÀI HỌC (DEFECT LOG)

Dưới đây là trích đoạn các nhóm lỗi tiêu biểu được tổng hợp theo `LessonId` thực tế trong CSDL:

| LessonId | HSK | Thứ tự | Tên bài học | Mức độ | Bằng chứng lỗi (Evidence) | Phương án khắc phục (Remediation Plan) |
| :--- | :---: | :---: | :--- | :---: | :--- | :--- |
| `AAAAAAAA-1111-1111-1111-111111111111` | 1 | 1 | 你好 (Chào bạn) | LOW | AudioStatus là SCRIPT_ONLY; chưa có file mp3 thật. | Thu âm giọng đọc chuẩn bản xứ cho 4 câu thoại và câu hỏi nghe. |
| `AAAAAAAA-4444-4444-4444-444444444444` | 1 | 4 | 她是我的汉语老师 (Cô ấy là cô giáo tiếng Trung của tôi) | MEDIUM | Prompt nghe dùng mẫu chung: "第一位说话人的主要目的是什么？" | Đổi prompt: "第二位说话人是谁的汉语老师？", tạo 4 phương án ngữ cảnh thật. |
| `A3F16DFB-1B7A-4C1C-AB9A-5B2D05FD80B1` | 3 | 1 | 周末你有什么打算 (Cuối tuần bạn có dự định gì) | MEDIUM | Distractor C và D dùng mẫu "Bày tỏ phản đối kịch liệt" không khớp ngữ cảnh rủ đi chơi. | Viết lại các phương án nhiễu: Đi xem phim, Về quê thăm bà, Ôn thi ở thư viện. |
| `6EB3F7E5-83BB-4BB7-8144-BE8439D4063A` | 4 | 1 | 简单的爱情 (Tình yêu giản dị) | HIGH | Tải lượng 50 từ mới nhưng bài thoại chỉ chứa 4 lượt câu ngắn, chưa bao quát từ vựng. | Tách bài thành 2 bài thoại nhỏ (Part 1 & Part 2) để phân bổ đủ 50 từ vựng. |
| `B50EEB03-324B-4CE7-B0FC-5D0B06C25A6A` | 5 | 1 | 爱的细节 (Những chi tiết của tình yêu thương) | HIGH | Văn bản bài khóa HSK 5 cần dạng tản văn (narrative essay), không nên ép vào hội thoại 4 câu. | Chuyển đổi một phần DialogueJson thành ReadingPassage kèm câu hỏi đọc hiểu. |
| `A2C66A9F-6661-4C47-A055-9612DE848580` | 6 | 1 | 道法自然 (Đạo pháp tự nhiên) | HIGH | Chủ đề triết học cổ đại Đạo Gia; thoại ngắn không thể hiện được chiều sâu tư tưởng. | Soạn bài giảng chuyên đề phân tích ngữ liệu cổ văn kết hợp câu hỏi nghị luận. |

*(Toàn bộ 140 bài học đều có hồ sơ kiểm định chi tiết trong hệ thống CMS).*

---

## 4. PHÂN BỔ TẢI LƯỢNG KIẾN THỨC THEO CẤP ĐỘ (COGNITIVE LOAD ANALYSIS)

Bảng phân tích tải lượng kiến thức thực tế trong SQL Server bảo đảm nguyên tắc sư phạm:

| Cấp độ HSK | Số bài học | Tổng từ vựng | Từ mới / bài | Điểm ngữ pháp / bài | Khuyến nghị thời lượng học | Phân chia phiên học |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **HSK 1** | 15 | 300 | 20 từ | 4.8 điểm | 25 – 30 phút / bài | 1 phiên duy nhất |
| **HSK 2** | 15 | 200 | 13 – 14 từ | 5.2 điểm | 25 – 30 phút / bài | 1 phiên duy nhất |
| **HSK 3** | 20 | 500 | 25 từ | 4.8 điểm | 35 – 45 phút / bài | Chia làm 2 tiểu phiên |
| **HSK 4** | 20 | 1.000 | 50 từ | 4.75 điểm | 60 – 75 phút / bài | Chia làm 2 tiểu phiên |
| **HSK 5** | 30 | 1.600 | 53 – 54 từ | 2.3 điểm | 75 – 90 phút / bài | Chia làm 3 tiểu phiên |
| **HSK 6** | 40 | 1.800 | 45 từ | 1.25 điểm | 80 – 90 phút / bài | Chia làm 3 tiểu phiên |

---

## 5. RANH GIỚI MINH BẠCH VỀ NỘI DUNG VÀ PHÊ DUYỆT

Để đảm bảo tính liêm chính học thuật (Academic Integrity), dự án ZhongWenHub công bố các nguyên tắc:
1. **Ranh giới AI-Generated**: Toàn bộ nội dung hội thoại và nghe hiểu của 137 bài học (HSK 1 Bài 4–15 và toàn bộ HSK 2–6) hiện chỉ là bản phác thảo cấp độ 1-2 (AI Synthetic Baseline). Tuyệt đối **không được báo cáo hoặc quảng bá là đã được chuyên gia thẩm định**.
2. **Trạng thái Duyệt Duy nhất**: Chỉ có **3 bài học đầu tiên của HSK 1 (Bài 1, Bài 2, Bài 3)** là đã được thẩm định học thuật, đối chiếu chuẩn xác với giáo trình và gắn nhãn `VERIFIED_PUBLISHED`.
3. **Quy trình Tiếp theo (Phase 4)**: Toàn bộ 137 bài học còn lại sẽ được đưa vào Hàng đợi Thẩm định (Editorial Review Queue) của Ban Cố vấn Học thuật Tiếng Trung để biên tập thủ công, loại bỏ các mẫu câu hỏi lặp lại và thu âm phòng thu thực tế trước khi xuất bản từng đợt (batch-by-batch).
