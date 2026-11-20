# BÁO CÁO KIỂM ĐỊNH TỆP ÂM THANH MP3 HSK 3 (AUDIO QA)

## I. TỔNG QUAN TỆP ĐA PHƯƠNG TIỆN HSK 3

- **Thư mục lưu trữ**: `Fontend/public/audio/hsk3/`
- **Tổng số tệp âm thanh**: 40 tệp MP3 ($20 \times 2 = 40$).
  - 20 tệp âm thanh hội thoại: `les1_dialogue.mp3` đến `les20_dialogue.mp3`.
  - 20 tệp âm thanh bài tập nghe: `les1_listening.mp3` đến `les20_listening.mp3`.
- **Kết quả kiểm toán trên đĩa (Disk Audit)**: Đạt **40/40 tệp tồn tại hợp lệ** (100%), dung lượng mỗi tệp từ 15 KB đến 150 KB.

---

## II. KẾT QUẢ KIỂM TRA BẰNG TRÌNH DUYỆT & HTTP SERVER

Tất cả 40 tệp âm thanh đều được kiểm tra khả năng phục vụ tĩnh qua Web Server Vite:
- **Mã phản hồi HTTP**: `200 OK` cho 100% tệp.
- **Content-Type**: `audio/mpeg` chuẩn.
- **Cơ chế Fallback thông minh**: Trong trường hợp tệp âm thanh bị lỗi mạng hoặc không tải được, Frontend tích hợp tự động cơ chế Fallback sang Web Speech API (TTS) để bảo đảm trải nghiệm luyện phát âm và nghe của học viên không bị gián đoạn.

---

## III. DỮ LIỆU ĐÃ TẠO

Kết quả kiểm định chi tiết được lưu trong:
`data/hsk30/staging/hsk3_audio_qa_manifest.json`
