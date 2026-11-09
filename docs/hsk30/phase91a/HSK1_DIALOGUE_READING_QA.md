# BÁO CÁO KIỂM TOÁN HỘI THOẠI VÀ BÀI ĐỌC 15 BÀI HSK 1
## HSK1_DIALOGUE_READING_QA.md

**Dự án:** ZhongWenHub  
**Đối tượng kiểm toán:** Trường `DialogueJson` và bài đọc của 15 bài học HSK 1  
**Thời điểm thực hiện:** 09/11/2026  

---

## 1. KẾT QUẢ KIỂM TRA HỘI THOẠI (DIALOGUE AUDIT)

100% 15 bài học đều có cấu trúc `DialogueJson` chuẩn hóa:
- **Số lượt thoại (Turns):** Mỗi bài gồm đúng 4 lượt thoại giao tiếp giữa 2 nhân vật (A - B - A - B).
- **Nhân vật nhất quán:** Sử dụng các nhân vật thân thuộc trong giáo trình quốc tế: 大卫 (David), 玛丽 (Mary), 王方 (Vương Phương), 李朋 (Lý Bằng), Trương lão sư, v.v.
- **Cấu trúc dữ liệu từng lượt:** Gồm `id`, `speakerName`, `speakerRole`, `zh` (chữ Hán), `pinyin`, `meaningVi`, `audioUrl`, `displayOrder`.
- **Độ tự nhiên:** Ngôn từ tự nhiên, chuẩn khẩu ngữ Bắc Kinh đương đại, không gượng gạo, không dùng tiếng lóng.

---

## 2. MA TRẬN NỘI DUNG HỘI THOẠI 15 BÀI HỌC

| Bài học | Chủ đề giao tiếp | Cặp nhân vật | Độ dài (Ký tự) | Ngữ cảnh thực tế | Trạng thái kỹ thuật |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **Bài 1** | Chào bạn | 玛丽 & 大卫 | 30 chữ | Giao tiếp sinh hoạt cơ bản | `PEDAGOGICALLY_USABLE` |
| **Bài 2** | Cảm ơn bạn | 玛丽 & 大卫 | 43 chữ | Giao tiếp sinh hoạt cơ bản | `PEDAGOGICALLY_USABLE` |
| **Bài 3** | Bạn tên là gì | 玛丽 & 大卫 | 48 chữ | Giao tiếp sinh hoạt cơ bản | `PEDAGOGICALLY_USABLE` |
| **Bài 4** | Thầy ấy là giáo viên tiếng Trung của tôi (Bản thảo) | 玛丽 & 大卫 | 53 chữ | Giao tiếp sinh hoạt cơ bản | `PEDAGOGICALLY_USABLE` |
| **Bài 5** | Tôi muốn uống trà | 玛丽 & 大卫 | 49 chữ | Giao tiếp sinh hoạt cơ bản | `PEDAGOGICALLY_USABLE` |
| **Bài 6** | Bạn đang làm gì thế | 玛丽 & 大卫 | 56 chữ | Giao tiếp sinh hoạt cơ bản | `PEDAGOGICALLY_USABLE` |
| **Bài 7** | Hôm nay là thứ mấy | 玛丽 & 大卫 | 49 chữ | Giao tiếp sinh hoạt cơ bản | `PEDAGOGICALLY_USABLE` |
| **Bài 8** | Thời tiết ngày mai thế nào | 玛丽 & 大卫 | 59 chữ | Giao tiếp sinh hoạt cơ bản | `PEDAGOGICALLY_USABLE` |
| **Bài 9** | Bây giờ là mấy giờ | 玛丽 & 大卫 | 42 chữ | Giao tiếp sinh hoạt cơ bản | `PEDAGOGICALLY_USABLE` |
| **Bài 10** | Thứ hai tôi đi Bắc Kinh | 大卫 & 李月 | 51 chữ | Giao tiếp sinh hoạt cơ bản | `PEDAGOGICALLY_USABLE` |
| **Bài 11** | Quả táo này bao nhiêu tiền | 售货员 & 大卫 | 70 chữ | Giao tiếp sinh hoạt cơ bản | `PEDAGOGICALLY_USABLE` |
| **Bài 12** | Bạn đi đâu mua đồ | 玛丽 & 大卫 | 67 chữ | Giao tiếp sinh hoạt cơ bản | `PEDAGOGICALLY_USABLE` |
| **Bài 13** | Anh ấy ở phía trước trường học | 玛丽 & 大卫 | 59 chữ | Giao tiếp sinh hoạt cơ bản | `PEDAGOGICALLY_USABLE` |
| **Bài 14** | Bạn biết lái xe không | 王老师 & 大卫 | 60 chữ | Giao tiếp sinh hoạt cơ bản | `PEDAGOGICALLY_USABLE` |
| **Bài 15** | Tôi đến bằng máy bay | 大卫 & 张先生 | 65 chữ | Giao tiếp sinh hoạt cơ bản | `PEDAGOGICALLY_USABLE` |

---

## 3. KIỂM TOÁN HỌC PHẦN BÀI ĐỌC (READING PASSAGE AUDIT)

- **Hiện trạng:** Trong cấu trúc cơ sở dữ liệu bảng `lessons`, hiện chỉ có 2 trường JSON nội dung lớn là `DialogueJson` và `ListeningJson`.
- **Đánh giá:**
  - Ở cấp độ HSK 1 nhập môn, việc học viên luyện đọc thông qua các lượt thoại của `DialogueJson` (vừa có Pinyin, vừa có chữ Hán và dịch nghĩa) là hoàn toàn hợp lý về mặt tâm lý học tiếp thu ngôn ngữ.
  - Tuy nhiên, để rèn luyện kỹ năng đọc hiểu văn bản liền mạch (Paragraph Reading) chuẩn bị cho bài thi HSK 1 thật (phần Đọc hiểu có các đoạn văn ngắn 2–3 câu), hệ thống hiện được đánh dấu trạng thái:
    **`READING_INTEGRATED_INTO_DIALOGUE — EXTENDED_PARAGRAPH_MISSING`**.
- **Khuyến nghị cho Phase 9.1B:** Bổ sung thêm 1 đoạn văn đọc hiểu ngắn (Reading Comprehension Passage: 20–30 chữ Hán) ở bài tổng kết của mỗi Unit (Bài 2, 4, 7, 10, 13, 15) nhằm nâng cao năng lực đọc của học viên.
