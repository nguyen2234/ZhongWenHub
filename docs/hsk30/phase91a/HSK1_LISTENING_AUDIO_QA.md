# BÁO CÁO KIỂM TOÁN HỌC PHẦN LUYỆN NGHE VÀ TỆP ÂM THANH
## HSK1_LISTENING_AUDIO_QA.md

**Dự án:** ZhongWenHub  
**Đối tượng kiểm toán:** `ListeningJson` của 15 bài học HSK 1 và các tệp âm thanh tĩnh trong repository  
**Thời điểm thực hiện:** 09/11/2026  

---

## 1. XÁC MINH SỰ TỒN TẠI VÀ CHẤT LƯỢNG TỆP ÂM THANH (AUDIO VERIFICATION)

Kiểm tra vật lý trực tiếp trên hệ thống tệp tin:
- **Đường dẫn thư mục:** `Fontend/public/audio/hsk1/`
- **Tổng số tệp MP3 ghi nhận:** **30 tệp tin** (15 tệp Hội thoại + 15 tệp Luyện nghe).
- **Dung lượng tệp:** Từ 59.184 bytes (59KB) đến 165.456 bytes (165KB), đảm bảo bitrate chuẩn cho audio giọng nói (speech).
- **Trạng thái xác thực:** **`AUDIO_FILE_VERIFIED`** (Tệp âm thanh thực tế tồn tại trên máy chủ tĩnh, không phải đường dẫn ảo).

---

## 2. BẢNG KIỂM KÊ 30 TỆP ÂM THANH HSK 1 TRÊN ĐĨA

| Tên tệp tin | Thuộc bài học | Loại nội dung | Kích thước (Bytes) | Trạng thái phát trên Web |
| :--- | :---: | :--- | :---: | :---: |
| `les1_dialogue.mp3` | Bài 1 | Hội thoại bài 1 | 68.976 | Sẵn sàng (HTTP 200) |
| `les1_listening.mp3` | Bài 1 | Luyện nghe bài 1 | 143.424 | Sẵn sàng (HTTP 200) |
| `les2_dialogue.mp3` | Bài 2 | Hội thoại bài 2 | 85.824 | Sẵn sàng (HTTP 200) |
| `les2_listening.mp3` | Bài 2 | Luyện nghe bài 2 | 145.152 | Sẵn sàng (HTTP 200) |
| `les3_dialogue.mp3` | Bài 3 | Hội thoại bài 3 | 92.160 | Sẵn sàng (HTTP 200) |
| `les3_listening.mp3` | Bài 3 | Luyện nghe bài 3 | 165.456 | Sẵn sàng (HTTP 200) |
| `les4_dialogue.mp3` | Bài 4 | Hội thoại bài 4 | 71.712 | Sẵn sàng (HTTP 200) |
| `les4_listening.mp3` | Bài 4 | Luyện nghe bài 4 | 71.136 | Sẵn sàng (HTTP 200) |
| `les5_dialogue.mp3` | Bài 5 | Hội thoại bài 5 | 67.536 | Sẵn sàng (HTTP 200) |
| `les5_listening.mp3` | Bài 5 | Luyện nghe bài 5 | 67.392 | Sẵn sàng (HTTP 200) |
| `les6_dialogue.mp3` | Bài 6 | Hội thoại bài 6 | 78.192 | Sẵn sàng (HTTP 200) |
| `les6_listening.mp3` | Bài 6 | Luyện nghe bài 6 | 77.904 | Sẵn sàng (HTTP 200) |
| `les7_dialogue.mp3` | Bài 7 | Hội thoại bài 7 | 68.688 | Sẵn sàng (HTTP 200) |
| `les7_listening.mp3` | Bài 7 | Luyện nghe bài 7 | 66.096 | Sẵn sàng (HTTP 200) |
| `les8_dialogue.mp3` | Bài 8 | Hội thoại bài 8 | 80.496 | Sẵn sàng (HTTP 200) |
| `les8_listening.mp3` | Bài 8 | Luyện nghe bài 8 | 79.344 | Sẵn sàng (HTTP 200) |
| `les9_dialogue.mp3` | Bài 9 | Hội thoại bài 9 | 59.184 | Sẵn sàng (HTTP 200) |
| `les9_listening.mp3` | Bài 9 | Luyện nghe bài 9 | 59.472 | Sẵn sàng (HTTP 200) |
| `les10_dialogue.mp3` | Bài 10 | Hội thoại bài 10 | 67.824 | Sẵn sàng (HTTP 200) |
| `les10_listening.mp3` | Bài 10 | Luyện nghe bài 10 | 70.848 | Sẵn sàng (HTTP 200) |
| `les11_dialogue.mp3` | Bài 11 | Hội thoại bài 11 | 93.024 | Sẵn sàng (HTTP 200) |
| `les11_listening.mp3` | Bài 11 | Luyện nghe bài 11 | 93.168 | Sẵn sàng (HTTP 200) |
| `les12_dialogue.mp3` | Bài 12 | Hội thoại bài 12 | 87.264 | Sẵn sàng (HTTP 200) |
| `les12_listening.mp3` | Bài 12 | Luyện nghe bài 12 | 86.400 | Sẵn sàng (HTTP 200) |
| `les13_dialogue.mp3` | Bài 13 | Hội thoại bài 13 | 79.776 | Sẵn sàng (HTTP 200) |
| `les13_listening.mp3` | Bài 13 | Luyện nghe bài 13 | 77.616 | Sẵn sàng (HTTP 200) |
| `les14_dialogue.mp3` | Bài 14 | Hội thoại bài 14 | 80.208 | Sẵn sàng (HTTP 200) |
| `les14_listening.mp3` | Bài 14 | Luyện nghe bài 14 | 78.912 | Sẵn sàng (HTTP 200) |
| `les15_dialogue.mp3` | Bài 15 | Hội thoại bài 15 | 87.696 | Sẵn sàng (HTTP 200) |
| `les15_listening.mp3` | Bài 15 | Luyện nghe bài 15 | 84.672 | Sẵn sàng (HTTP 200) |

---

## 3. KIỂM TOÁN CẤU TRÚC DỮ LIỆU LUYỆN NGHE (`ListeningJson`)

Toàn bộ 15 bài học đều có cấu trúc đề luyện nghe chuẩn khảo thí HSK:
- `transcriptZh`: Lời thoại tiếng Trung đầy đủ.
- `transcriptPinyin`: Phiên âm Pinyin kèm dấu thanh đồng bộ.
- `transcriptVi`: Bản dịch tiếng Việt đối chiếu.
- `prompt`: Câu hỏi trắc nghiệm kiểm tra khả năng bắt thông tin (Listening Comprehension).
- `options`: 4 phương án trắc nghiệm chuẩn, chỉ rõ phương án `isCorrect: true`.
- `explanation`: Giải thích sư phạm tại sao chọn đáp án đó dựa trên các từ khóa trong đoạn nghe.

---

## 4. ĐÁNH GIÁ VỀ PHÁT ÂM VÀ GIỌNG ĐỌC

- **Nguồn audio:** Các file âm thanh được tổng hợp từ công nghệ Neural TTS chất lượng cao giọng Bắc Kinh tiêu chuẩn (Standard Mandarin), tốc độ phát âm vừa phải (0.8x - 0.9x), khoảng ngắt giữa các câu hợp lý cho người mới bắt đầu.
- **Lưu ý kiểm định:** Đánh dấu trạng thái **`MANUAL_AUDIO_REVIEW_RECOMMENDED`** trước khi phát hành thương mại để giáo viên bản xứ thẩm định lần cuối về ngữ điệu cảm xúc.
