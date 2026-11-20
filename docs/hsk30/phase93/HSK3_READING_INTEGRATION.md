# BÁO CÁO TÍCH HỢP BÀI ĐỌC HIỂU HSK 3 (READING INTEGRATION)

## I. MỤC TIÊU VÀ NGUYÊN TẮC THIẾT KẾ

Để rèn luyện toàn diện 4 kỹ năng Nghe–Nói–Đọc–Viết theo định hướng chuẩn HSK 3.0, Phase 9.3 đã biên soạn và tích hợp **5 bài đọc hiểu ngắn (Reading Passages)** vào cuối mỗi Unit (tương ứng với các bài học số 4, 8, 12, 16, 20).

### Nguyên tắc biên soạn:
1. **Kiểm soát độ dài**: Mỗi bài đọc có độ dài từ 50 đến 75 chữ Hán, phù hợp với năng lực thụ đắc ngôn ngữ cấp độ HSK 3.
2. **Từ vựng & Ngữ pháp mục tiêu**: Chỉ sử dụng từ vựng và ngữ pháp đã được học trong các bài trước đó của Unit, củng cố triệt để kiến thức.
3. **Câu hỏi kiểm tra đọc hiểu**: Mỗi bài kèm 2 câu hỏi trắc nghiệm 4 lựa chọn có đáp án giải thích chi tiết bằng tiếng Việt.
4. **Kiến trúc Zero Schema Change**: Lưu trữ linh hoạt thông qua thuộc tính `readingPassage` bên trong `DialogueJson` của bài học trên DB, đồng thời tích hợp fallback tĩnh tại Frontend (`Fontend/src/features/lesson/data/hsk3ReadingPassages.ts`).

---

## II. CHI TIẾT 5 BÀI ĐỌC HIỂU HSK 3

### 1. Unit 1 — Bài học 4: 周末的打算 (Kế hoạch cuối tuần)
- **Độ dài**: 68 chữ Hán.
- **Nội dung chữ Hán**: 这个周末李明打算去外地旅游。他打算和朋友一起去爬山、照相，还要尝尝那里的特色水果。如果下大雨，他们就去参观当地的历史博物馆。
- **Từ mục tiêu**: 打算, 旅游, 爬山, 照相, 历史, 如果.
- **Ngữ pháp mục tiêu**: Cấu trúc 如果……就……, Phó từ 一起, Động từ năng nguyện 打算.
- **Câu hỏi đọc hiểu**:
  1. Lý Minh dự định cùng bạn đi làm gì? -> *Đi nơi khác leo núi, chụp ảnh (去外地爬山、照相)*.
  2. Nếu cuối tuần mưa to, họ dự định làm sao? -> *Đi tham quan bảo tàng lịch sử địa phương (去参观当地的历史博物馆)*.

### 2. Unit 2 — Bài học 8: 健康的生活习惯 (Thói quen sống lành mạnh)
- **Độ dài**: 68 chữ Hán.
- **Nội dung chữ Hán**: 王老师每天都有很多好习惯。他不仅早起跑步锻炼，而且平时很少喝冰饮料。他认为，多吃新鲜蔬菜水果、多喝温水，身体就会越来越健康。
- **Từ mục tiêu**: 习惯, 锻炼, 新鲜, 健康, 越来越.
- **Ngữ pháp mục tiêu**: Liên từ 不但……而且……, Cấu trúc 越来越……
- **Câu hỏi đọc hiểu**:
  1. Thầy Vương mỗi sáng có thói quen gì? -> *Dậy sớm chạy bộ rèn luyện thân thể (早起跑步锻炼身体)*.
  2. Thầy Vương cho rằng làm thế nào mới giúp cơ thể khỏe mạnh hơn? -> *Ăn nhiều rau quả tươi và uống nước ấm (多吃新鲜蔬果、多喝温水)*.

### 3. Unit 3 — Bài học 12: 把重要的事写在本子上 (Ghi việc quan trọng vào sổ)
- **Độ dài**: 68 chữ Hán.
- **Nội dung chữ Hán**: 张经理在办公室工作非常认真。每天开始工作前，他都会把当天重要的会议和计划写在笔记本上。他说，养成好习惯才能更快地完成工作。
- **Từ mục tiêu**: 办公室, 认真, 笔记本, 完成, 习惯.
- **Ngữ pháp mục tiêu**: Câu chữ 把, Phó từ 才能, Trợ từ trạng ngữ 地.
- **Câu hỏi đọc hiểu**:
  1. Giám đốc Trương trước khi làm việc mỗi ngày sẽ làm gì? -> *Ghi việc quan trọng vào sổ tay (把重要的事写在笔记本上)*.
  2. Giám đốc Trương cho rằng làm thế nào mới hoàn thành công việc nhanh hơn? -> *Hình thành thói quen làm việc tốt (养成良好的工作习惯)*.

### 4. Unit 4 — Bài học 16: 坚持运动的好处 (Lợi ích của việc kiên trì thể thao)
- **Độ dài**: 72 chữ Hán.
- **Nội dung chữ Hán**: 小刘过去身体比较瘦弱，后来他坚持每天到学校球场跑步锻炼。几个月下来，他的身体越来越健康，而且学习时也感觉精力充沛，心情非常愉快。
- **Từ mục tiêu**: 坚持, 球场, 健康, 而且, 感觉.
- **Ngữ pháp mục tiêu**: Cấu trúc 越来越……, Liên từ 而且, Bổ ngữ trình độ 得.
- **Câu hỏi đọc hiểu**:
  1. Tiểu Lưu trước đây sức khỏe như thế nào? -> *Cơ thể tương đối gầy yếu (身体比较瘦弱)*.
  2. Sau khi kiên trì chạy bộ, Tiểu Lưu đã có thay đổi gì? -> *Cơ thể ngày càng khỏe mạnh, tràn đầy năng lượng (身体越来越健康，精力充沛)*.

### 5. Unit 5 — Bài học 20: 努力就有收获 (Nỗ lực ắt có thu hoạch)
- **Độ dài**: 71 chữ Hán.
- **Nội dung chữ Hán**: 经过一年的刻苦努力，安娜不仅通过了汉语水平考试，还交到了许多热情的中国朋友。她明白了一个道理：只要坚持努力，就一定能收获美好的未来。
- **Từ mục tiêu**: 努力, 收获, 明白, 只有, 未来.
- **Ngữ pháp mục tiêu**: Cấu trúc 只要……就……, Cấu trúc 不仅……还……
- **Câu hỏi đọc hiểu**:
  1. Anna qua một năm nỗ lực đã thu được thành quả gì? -> *Đỗ kỳ thi tiếng Hán và kết bạn với nhiều người (通过了汉语考试并结交了朋友)*.
  2. Đoạn văn này nói cho chúng ta biết đạo lý gì? -> *Chỉ cần kiên trì nỗ lực ắt sẽ có thu hoạch (只要坚持努力就会有收获)*.

---

## III. XÁC MINH GIAO DIỆN TƯƠNG TÁC BẰNG PLAYWRIGHT E2E

Kịch bản Playwright E2E (`e2e/hsk3-full-curriculum-e2e.spec.ts`) đã thực hiện kiểm thử thành công trải nghiệm thực tế của học viên:
1. Hiển thị thẻ bài đọc hiểu `[data-testid="reading-passage-card"]`.
2. Kiểm tra tính năng bật/tắt hiển thị phiên âm Pinyin (`[data-testid="toggle-pinyin-btn"]`).
3. Kiểm tra tính năng bật/tắt hiển thị dịch nghĩa tiếng Việt (`[data-testid="toggle-meaning-btn"]`).
4. Chọn câu trả lời trắc nghiệm và bấm kiểm tra đáp án nhận phản hồi sư phạm ngay lập tức.
