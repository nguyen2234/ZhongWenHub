# KIỂM TOÁN DỮ LIỆU CƠ SỞ HSK 2 (HSK 2 BASELINE DATA AUDIT)

> **Mục tiêu:** Kiểm toán hiện trạng cấu trúc học liệu HSK 2 trên cơ sở dữ liệu `ZhongWenHub_Dev` (chế độ Read-Only).  
> **Thời điểm kiểm toán:** Phase 9.2 (10/11/2026)  
> **Nguyên tắc:** READ-ONLY, không thực hiện bất kỳ lệnh ghi/cập nhật nào trên Dev DB.  

---

## 1. TỔNG QUAN CƠ SỞ DỮ LIỆU DEV

Qua truy vấn trực tiếp bằng script an toàn `scripts/hsk30/audit_hsk2_baseline.py` kết nối với chuỗi `ApplicationIntent=ReadOnly`, các chỉ số hiện trạng của giáo trình HSK 2 trên `ZhongWenHub_Dev` được xác lập như sau:

| Đối tượng dữ liệu | Số lượng bản ghi | Nhận xét trạng thái |
| :--- | :--- | :--- |
| **Khóa học (Courses)** | 1 (`HSK2`) | Id: `22222222-2222-2222-2222-222222222222`, Mã: `HSK2`, Tên: `Giáo trình Chuẩn HSK 2` |
| **Học phần (Units)** | 5 Units | Cấu trúc phân nhóm 5 chủ đề lớn theo chuẩn HSK 3.0 |
| **Bài học (Lessons)** | 15 Lessons | 100% ở trạng thái `DRAFT`. Không có bài nào ở trạng thái `PUBLISHED` |
| **Từ vựng (Vocabularies)** | 200 bản ghi | Đã được gán đầy đủ vào 15 bài học (0 từ mồ côi), nhưng `ExamplesJson` rỗng |
| **Điểm ngữ pháp (Grammar)** | 78 bản ghi | Đầy đủ công thức cấu trúc, giải thích và câu ví dụ cơ bản |
| **Bài tập (Exercises)** | 30 bản ghi | Phân bổ 2 bài/bài học, ở dạng khung mẫu giữ chỗ, đáp án đúng luôn là index 0 |
| **Tệp âm thanh (Audio)** | 30 tệp MP3 | Nằm trong `Fontend/public/audio/hsk2/`, đầy đủ hội thoại và bài nghe cho 15 bài học |
| **Tiến độ học viên (Progress)** | 0 bản ghi HSK 2 | Chưa có học viên thực tế thao tác trên các bài học HSK 2 Draft |

---

## 2. CHI TIẾT CẤU TRÚC 5 UNITS VÀ 15 LESSONS

Cấu trúc giáo trình HSK 2 trên database phân bổ đồng đều thành 5 Units, mỗi Unit bao gồm 3 bài học:

### Unit 1: 生活与起居 (Đời sống & Sinh hoạt hàng ngày) — OrderIndex: 1
- **Bài 1:** 九月去北京旅游最好 (Đi du lịch Bắc Kinh vào tháng 9 là tốt nhất)
  - Số từ vựng: 14 từ | Số điểm ngữ pháp: 6 | Số bài tập hiện có: 2
- **Bài 2:** 我每天六点起床 (Mỗi ngày tôi thức dậy lúc sáu giờ)
  - Số từ vựng: 14 từ | Số điểm ngữ pháp: 6 | Số bài tập hiện có: 2
- **Bài 3:** 左边那个红色的是我的 (Cái màu đỏ bên trái là của tôi)
  - Số từ vựng: 14 từ | Số điểm ngữ pháp: 6 | Số bài tập hiện có: 2

### Unit 2: 工作与学习 (Học tập & Công việc) — OrderIndex: 2
- **Bài 4:** 这个工作是他帮我介绍的 (Công việc này là do anh ấy giới thiệu cho tôi)
  - Số từ vựng: 14 từ | Số điểm ngữ pháp: 5 | Số bài tập hiện có: 2
- **Bài 5:** 就买这件吧 (Mua chiếc áo này đi)
  - Số từ vựng: 14 từ | Số điểm ngữ pháp: 5 | Số bài tập hiện có: 2
- **Bài 6:** 你怎么不吃了 (Sao bạn không ăn nữa thế)
  - Số từ vựng: 13 từ | Số điểm ngữ pháp: 5 | Số bài tập hiện có: 2

### Unit 3: 健康与运动 (Sức khỏe & Vận động) — OrderIndex: 3
- **Bài 7:** 你家离公司远吗 (Nhà bạn cách công ty xa không)
  - Số từ vựng: 13 từ | Số điểm ngữ pháp: 5 | Số bài tập hiện có: 2
- **Bài 8:** 让我想想再告诉你 (Để tôi suy nghĩ rồi nói cho bạn biết nhé)
  - Số từ vựng: 13 từ | Số điểm ngữ pháp: 5 | Số bài tập hiện có: 2
- **Bài 9:** 题太多，我没做完 (Đề thi nhiều quá, tôi chưa làm xong)
  - Số từ vựng: 13 từ | Số điểm ngữ pháp: 5 | Số bài tập hiện có: 2

### Unit 4: 交往与娱乐 (Giao lưu & Thư giãn giải trí) — OrderIndex: 4
- **Bài 10:** 别找了，手机在桌子上呢 (Đừng tìm nữa, điện thoại ở trên bàn kìa)
  - Số từ vựng: 13 từ | Số điểm ngữ pháp: 5 | Số bài tập hiện có: 2
- **Bài 11:** 他比我大三岁 (Anh ấy lớn hơn tôi ba tuổi)
  - Số từ vựng: 13 từ | Số điểm ngữ pháp: 5 | Số bài tập hiện có: 2
- **Bài 12:** 你穿得太少了 (Bạn mặc ít áo quá)
  - Số từ vựng: 13 từ | Số điểm ngữ pháp: 5 | Số bài tập hiện có: 2

### Unit 5: 出行与复习 (Đi lại & Ôn tập HSK 2) — OrderIndex: 5
- **Bài 13:** 门开着呢 (Cửa đang mở đấy)
  - Số từ vựng: 13 từ | Số điểm ngữ pháp: 5 | Số bài tập hiện có: 2
- **Bài 14:** 你看过那个电影没有 (Bạn từng xem bộ phim đó chưa)
  - Số từ vựng: 13 từ | Số điểm ngữ pháp: 5 | Số bài tập hiện có: 2
- **Bài 15:** 新年就要到了 (Năm mới sắp đến rồi)
  - Số từ vựng: 13 từ | Số điểm ngữ pháp: 5 | Số bài tập hiện có: 2

---

## 3. CÁC PHÁT HIỆN KIỂM TOÁN QUAN TRỌNG

1. **Khuyết thiếu câu ví dụ từ vựng:** 100% (200/200) từ vựng HSK 2 trên Dev DB có cột `ExamplesJson` rỗng hoặc null, khiến học viên không thể học từ vựng trong ngữ cảnh câu thực tế.
2. **Nghĩa tiếng Việt thô chứa "rác" từ điển:** Dữ liệu trích xuất từ điển cũ chứa một số định nghĩa mang tính chất tiếng lóng, tiếng Nhật hoặc nội dung nhạy cảm (như từ `鸟`, `绿茶`, `本子`, `周`). Cần làm sạch toàn diện để đảm bảo chuẩn mực giáo dục.
3. **Hiện tượng từ đa nghĩa / xuất hiện ở 2 bài học:**
   - Từ `过`: Xuất hiện ở Bài 1 (động từ: đón tết, sinh nhật) và Bài 15 (trợ từ động thái chỉ kinh nghiệm).
   - Từ `花`: Xuất hiện ở Bài 8 (động từ: tiêu, tốn tiền bạc/thời gian) và Bài 9 (danh từ: bông hoa).
   - Cả 2 trường hợp này đều hoàn toàn hợp lý về mặt sư phạm và được phân định rành mạch bằng `devId` và ngữ cảnh bài học riêng biệt.
4. **Bài tập mang tính hình thức:** 30 bài tập hiện có trên Dev DB có cùng mẫu câu trả lời và câu giải thích chung chung, cần được thay thế và mở rộng lên 60 bài tập thực chất.
5. **Thiếu bài đọc hiểu tổng hợp:** Khác với HSK 1 đã được trang bị bài đọc hiểu ở cuối mỗi Unit, HSK 2 chưa có bài đọc hiểu tích hợp trong `DialogueJson`.
