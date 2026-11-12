# BÁO CÁO KIỂM TOÁN DỮ LIỆU CƠ SỞ HSK 3 (READ-ONLY AUDIT)

## I. MỤC TIÊU VÀ PHƯƠNG PHÁP KIỂM TOÁN

Thực hiện kiểm toán trạng thái dữ liệu HSK 3 trong cơ sở dữ liệu `ZhongWenHub_Dev` (kết nối tuyệt đối READ-ONLY với `ApplicationIntent=ReadOnly`).

Mục tiêu:
1. Xác định chính xác cấu trúc khóa học, đơn vị bài học (Units), bài học (Lessons).
2. Kiểm kê số lượng từ vựng, ngữ pháp, bài tập, tệp tin đa phương tiện.
3. Rà soát tính toàn vẹn và phát hiện các bẫy từ vựng/ngữ nghĩa trong dữ liệu thô.

---

## II. KẾT QUẢ KIỂM TOÁN CƠ SỞ DỮ LIỆU DEV

### 1. Cấu trúc Khóa học & Bài học
- **Khóa học**: 1 khóa học HSK 3
  - Id: `33333333-3333-3333-3333-333333333333`
  - Mã: `HSK3`
  - Tiêu đề: `Giáo trình Chuẩn HSK 3`
- **Đơn vị bài học (Units)**: Đúng 5 Units (OrderIndex 1–5):
  - Unit 1: 周末与计划 (Kế hoạch cuối tuần & Du lịch) — 4 bài học
  - Unit 2: 生活与情感 (Đời sống tình cảm & Bạn bè) — 4 bài học
  - Unit 3: 职场与社交 (Công sở & Giao tiếp xã hội) — 4 bài học
  - Unit 4: 健康与习惯 (Sức khỏe & Lối sống) — 4 bài học
  - Unit 5: 环境与未来 (Môi trường sống & Mục tiêu tương lai) — 4 bài học
- **Bài học (Lessons)**: Đúng 20 bài học, tất cả đều đang ở trạng thái `DRAFT`:
  - L01: 周末你有什么打算
  - L02: 他什么时候回来
  - L03: 桌子上放着一杯咖啡
  - L04: 她总是笑着跟客人说话
  - L05: 我最近越来越胖了
  - L06: 怎么突然找不到了
  - L07: 我跟你一起去
  - L08: 你去哪儿我就去哪儿
  - L09: 她的汉语说得跟中国人一样好
  - L10: 数学比历史难多了
  - L11: 别忘了把空调关了
  - L12: 把重要的事写在本子上
  - L13: 走得越快越好
  - L14: 请把护照拿出来
  - L15: 除了看书，他还喜欢运动
  - L16: 我现在累得不想动
  - L17: 谁都有生病的时候
  - L18: 我相信你一定能做好
  - L19: 你没看懂这篇文章吗
  - L20: 只要努力就会有收获

### 2. Từ vựng HSK 3
- Tổng số từ vựng: **500 từ vựng**.
- Phân bố: Chính xác **25 từ/bài** trên tất cả 20 bài học ($20 \times 25 = 500$).
- Số từ mồ côi (chưa gán LessonId): **0 từ**.
- Thực trạng: Trước Phase 9.3, cả 500 từ đều **chưa có `ExamplesJson`** (NULL/rỗng).

### 3. Ngữ pháp HSK 3
- Tổng số điểm ngữ pháp: **96 điểm ngữ pháp**.
- Phân bố:
  - Lessons 1–16: Mỗi bài 5 điểm ngữ pháp ($16 \times 5 = 80$).
  - Lessons 17–20: Mỗi bài 4 điểm ngữ pháp ($4 \times 4 = 16$).
  - Tổng cộng: 96 điểm ngữ pháp.

### 4. Bài tập HSK 3
- Tổng số bài tập trên Dev: **40 bài tập** (mỗi bài 2 câu).
- Nhược điểm phát hiện: Các bài tập cũ dùng placeholder options ("Nghĩa khác A", "Nghĩa khác B"), correctOptionIndex luôn bằng 0.

### 5. Tệp Âm thanh MP3
- Đã có sẵn 40 tệp âm thanh trong `Fontend/public/audio/hsk3/`:
  - 20 tệp hội thoại (`les1_dialogue.mp3` đến `les20_dialogue.mp3`).
  - 20 tệp nghe (`les1_listening.mp3` đến `les20_listening.mp3`).

---

## III. DỮ LIỆU ĐÃ TRÍCH XUẤT AN TOÀN

Toàn bộ dữ liệu thô phục vụ kiểm toán được trích xuất an toàn thành các tệp JSON phục vụ staging:
1. `data/hsk30/staging/dev_hsk3_vocab_raw.json` (500 từ)
2. `data/hsk30/staging/dev_hsk3_grammar_raw.json` (96 điểm)
3. `data/hsk30/staging/dev_hsk3_exercises_raw.json` (40 bài tập)
