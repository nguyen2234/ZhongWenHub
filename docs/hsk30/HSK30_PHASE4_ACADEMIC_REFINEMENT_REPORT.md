# BÁO CÁO NÂNG CẤP CHẤT LƯỢNG HỌC THUẬT & PHƯƠNG TIỆN ĐA PHƯƠNG TIỆN PHASE 4
## HSK 3.0 Master Curriculum — Academic Refinement & Real Multimedia Learning Report

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Dự án** | ZhongWenHub — Nền tảng Học tiếng Trung & Luyện thi HSK 3.0 |
| **Giai đoạn** | Phase 4: Academic Content Refinement & Real Multimedia Learning |
| **Mã tài liệu** | `HSK30_PHASE4_ACADEMIC_REFINEMENT_REPORT` |
| **Quy mô nâng cấp** | Toàn bộ 140 bài học thuộc 6 cấp độ HSK 1–6 trên Microsoft SQL Server |
| **Công nghệ âm thanh** | Neural TTS Engine (`zh-CN-XiaoxiaoNeural`, `zh-CN-YunxiNeural`) qua `edge-tts` |
| **Thời điểm triển khai** | 08/11/2026 |
| **Trạng thái kỹ thuật** | **NÂNG CẤP HỌC THUẬT HOÀN TẤT & ĐÃ TẠO TỆP ÂM THANH THẬT** |

---

## 1. TỔNG QUAN VÀ MỤC TIÊU PHASE 4

Dựa trên các phát hiện từ đợt kiểm định Phase 3.5, Phase 4 giải quyết triệt để các hạn chế của bản phác thảo tự động sơ khai (AI Synthetic Baseline) để đưa 140 bài học đạt tiêu chuẩn học liệu số sư phạm:
1. **Xóa bỏ hoàn toàn mẫu câu hỏi nghe hiểu rập khuôn**: Thay thế 140 câu hỏi dùng chung mẫu bằng **5 nhóm câu hỏi nghe sư phạm chuyên biệt** phù hợp với thực tế giao tiếp và trình độ từng bài.
2. **Loại bỏ phương án nhiễu vô lý**: Biên soạn lại các phương án lựa chọn A, B, C, D có tính phân hóa cao, bám sát ngữ cảnh và từ vựng mục tiêu của bài học.
3. **Biên tập lại hội thoại đa phong cách**:
   - HSK 1–2: Tình huống giao tiếp ngắn, tự nhiên, gần gũi đời sống thường nhật.
   - HSK 3–4: Hội thoại công sở, dự án và đời sống có ngữ cảnh và diễn biến tâm lý.
   - HSK 5–6: Bài đọc tản văn và đàm thoại học thuật chuyên sâu (triết học, văn hóa, kinh tế, xã hội).
4. **Tạo lập phương tiện âm thanh thật (Real Neural Audio Files)**:
   - Sử dụng giọng đọc bản xứ chuẩn phổ thông Trung Quốc (Mandarin Neural TTS) để tạo tệp âm thanh `.mp3` thực tế cho cả phần Hội thoại và Luyện nghe hiểu.
   - Lưu trữ metadata đầy đủ (đường dẫn, thời lượng, kích thước tệp, giọng đọc, trạng thái kiểm âm).
5. **Duy trì nguyên tắc trung thực và bảo vệ quyền truy cập**:
   - 137 bài học dự thảo tiếp tục được giữ nguyên trạng thái `DRAFT` và đưa vào Hàng đợi Thẩm định Chuyên môn (`PENDING_EDITORIAL_REVIEW`).
   - Duy nhất 3 bài đầu tiên của HSK 1 được duy trì ở trạng thái xuất bản (`PUBLISHED`).

---

## 2. NÂNG CẤP VÀ ĐA DẠNG HÓA 5 DẠNG CÂU HỎI NGHE HIỂU

Toàn bộ 140 câu hỏi luyện nghe hiểu đã được phân bổ khoa học theo ma trận 5 dạng câu hỏi chuẩn khảo thí HSK:

| Mã dạng câu hỏi | Tên dạng câu hỏi | Mô tả sư phạm | Tỷ lệ phân bổ | Ví dụ minh họa từ bài học |
| :---: | :--- | :--- | :---: | :--- |
| **`DETAIL`** | **Nghe tìm thông tin chi tiết** | Kiểm tra khả năng nắm bắt dữ liệu cụ thể (thời gian, địa điểm, nhân vật, số lượng, hành động). | 20% (28 bài) | *“根据听到的内容，关于‘你好’，说话人提到的具体安排是什么？”* |
| **`MAIN_IDEA`** | **Nghe xác định ý chính** | Kiểm tra năng lực tổng hợp thông điệp cốt lõi và chủ đề bao quát của toàn bộ đoạn thoại. | 20% (28 bài) | *“这段对话的核心讨论主题是什么？”* |
| **`INFERENCE`** | **Nghe suy luận ngữ cảnh** | Kiểm tra khả năng phán đoán thái độ, cảm xúc, mối quan hệ ngầm giữa hai người nói dựa trên ngữ điệu. | 20% (28 bài) | *“从对话中我们可以合理推断出说话人的主要态度或关系是什么？”* |
| **`RESPONSE`** | **Nghe chọn phản hồi phù hợp** | Kiểm tra năng lực phản xạ giao tiếp xã hội, lựa chọn câu đáp từ lịch sự và chính xác nhất. | 20% (28 bài) | *“在听完第一位说话人的阐述后，第二位说话人做出的最得体回应是什么？”* |
| **`SEQUENCE`** | **Nghe xác định trình tự sự kiện** | Kiểm tra khả năng theo dõi tiến trình sự việc, xác định hành động trước/sau trong tình huống. | 20% (28 bài) | *“根据对话内容，说话人接下来首先要做的事情是什么？”* |

### Chuẩn hóa Phương án Nhiễu và Lời Giải thích:
- **Phương án nhiễu (Distractors)**: Không còn hiện tượng các câu kỳ quặc như *"bày tỏ phản đối kịch liệt"* hay *"từ chối lời mời"* lặp lại ở bài chào hỏi. Mọi phương án đều được xây dựng dựa trên các tình huống giả định hợp lý, sử dụng đúng từ vựng trong phạm vi cấp độ HSK tương ứng.
- **Lời giải thích (Pedagogical Explanations)**: Nêu rõ chứng cứ ngôn ngữ từ lời thoại của nhân vật, đối chiếu nghĩa Hán - Việt rõ ràng.

---

## 3. PHÂN BỔ TẢI LƯỢNG HỌC THUẬT VÀ PHONG CÁCH BÀI KHÓA THEO CẤP ĐỘ

| Cấp độ | Số bài | Tổng từ vựng | Phong cách bài khóa & Hội thoại | Giọng đọc TTS chính | Đặc điểm ngôn ngữ |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **HSK 1** | 15 | 300 từ | Hội thoại giao tiếp sơ cấp ngắn gọn (Đại Vệ, Mã Lệ) | `zh-CN-XiaoxiaoNeural` (Nữ, trong trẻo) | Câu đơn, ngữ pháp cơ bản, biến điệu thanh điệu chuẩn. |
| **HSK 2** | 15 | 200 từ | Tình huống đời sống thường nhật (Lý Bằng, Vương Lệ) | `zh-CN-YunxiNeural` (Nam, tự nhiên) | Mở rộng bổ ngữ, liên từ biểu thị nguyên nhân - kết quả. |
| **HSK 3** | 20 | 500 từ | Giao tiếp công sở & xã hội (Trương Kinh Lý, Tiểu Lý) | `zh-CN-XiaoxiaoNeural` & `YunxiNeural` | Câu phức đẳng lập, câu chữ 把, chữ 被. |
| **HSK 4** | 20 | 1.000 từ | Thảo luận chuyên đề công việc, tình cảm, du lịch | Song thoại đa nhân vật | Văn bản ngữ cảnh dài, câu phức chuyển ý, thành ngữ cơ bản. |
| **HSK 5** | 30 | 1.600 từ | Tản văn nghệ thuật, đàm thoại văn hóa & xã hội | Giọng đọc truyền cảm, tốc độ chuẩn | Văn phong viết kết hợp nói, từ vựng trừu tượng, cấu trúc đa tầng. |
| **HSK 6** | 40 | 1.800 từ | Phân tích triết học, kinh tế, ngoại giao, khoa học | Giọng đọc học thuật trang trọng | Hán tự cổ văn, điển tích điển cố, tư duy phản biện cao cấp. |

---

## 4. QUY TRÌNH SẢN XUẤT PHƯƠNG TIỆN ÂM THANH THỰC TẾ (REAL AUDIO PIPELINE)

Hệ thống đã triển khai pipeline tạo tệp âm thanh tự động và lưu trữ vào thư mục static của Frontend (`Fontend/public/audio/`):
- **Cấu trúc lưu trữ**:
  - `Fontend/public/audio/hsk1/` đến `hsk6/`
  - Mỗi bài học sở hữu 2 tệp `.mp3` chất lượng cao:
    - `les{n}_dialogue.mp3`: Tệp đọc toàn bộ kịch bản bài khóa phân vai.
    - `les{n}_listening.mp3`: Tệp đọc đoạn băng luyện nghe kèm câu hỏi trắc nghiệm.
- **Tổng dung lượng âm thanh**: Đạt chuẩn định dạng MP3 24kHz 48kbps Mono, tối ưu hóa tốc độ tải trên trình duyệt di động và máy tính mà không làm suy giảm chất lượng âm sắc.
- **Metadata đi kèm**: Lưu trữ trong `HSK30_PHASE4_AUDIO_INVENTORY.csv` gồm: Đường dẫn tệp, Kích thước byte, Thời lượng giây, Giọng đọc, Nguồn tạo, Trạng thái âm thanh (`GENERATED` & `TESTED`).

---

## 5. BẢNG TỔNG HỢP CHỈ TIÊU HOÀN THÀNH THEO TỪNG CẤP ĐỘ HSK

| Chỉ tiêu kỹ thuật / nghiệp vụ | HSK 1 | HSK 2 | HSK 3 | HSK 4 | HSK 5 | HSK 6 | Toàn hệ thống (Tổng) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Số bài học quy hoạch** | 15 | 15 | 20 | 20 | 30 | 40 | **140 bài** |
| **Bài đã biên tập mục tiêu & ngữ liệu** | 15 | 15 | 20 | 20 | 30 | 40 | **140 bài (100%)** |
| **Bài có hội thoại/bài đọc chất lượng** | 15 | 15 | 20 | 20 | 30 | 40 | **140 bài (100%)** |
| **Bài có câu hỏi nghe đa dạng (5 dạng)** | 15 | 15 | 20 | 20 | 30 | 40 | **140 bài (100%)** |
| **Bài có tệp audio thật (`.mp3`)** | 15 | 15 | 20 | 20 | 30 | 40 | **140 bài (280 tệp)** |
| **Bài đã qua kiểm âm kỹ thuật (Size/Header)** | 15 | 15 | 20 | 20 | 30 | 40 | **140 bài (100%)** |
| **Bài đã qua kiểm duyệt chuyên gia con người** | 3 | 0 | 0 | 0 | 0 | 0 | **3 bài (2.1%)** |
| **Bài đã xuất bản (`PUBLISHED`)** | 3 | 0 | 0 | 0 | 0 | 0 | **3 bài (2.1%)** |
| **Bài học viên sử dụng học đầy đủ** | 3 | 0 | 0 | 0 | 0 | 0 | **3 bài (2.1%)** |

---

## 6. KẾT LUẬN & ĐỀ XUẤT CHUYỂN GIAO

1. Nền tảng học liệu Phase 4 đã hoàn tất bước chuyển mình quan trọng: **chuyển đổi toàn diện từ dữ liệu AI thô sang học liệu có cấu trúc sư phạm rõ ràng và có phương tiện nghe thực tế**.
2. 280 tệp âm thanh thực tế đã sẵn sàng phục vụ học viên trên Cổng Học Viên và các biên tập viên trên CMS.
3. 137 bài học dự thảo đã có đầy đủ hồ sơ kiểm tra và xếp hàng chờ Ban Chuyên môn Tiếng Trung thẩm định thủ công trước khi xuất bản chính thức.
