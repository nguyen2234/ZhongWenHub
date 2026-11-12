# BÁO CÁO KIỂM ĐỊNH TỆP ÂM THANH HSK 4 (LISTENING AUDIO QA)

## I. KIỂM TOÁN TỆP VẬT LÝ TRÊN ĐĨA

- **Thư mục lưu trữ**: `Fontend/public/audio/hsk4/`.
- **Tổng số tệp âm thanh**: 40 tệp MP3.
  - 20 tệp hội thoại (`les1_dialogue.mp3` đến `les20_dialogue.mp3`).
  - 20 tệp bài tập nghe (`les1_listening.mp3` đến `les20_listening.mp3`).
- **Tổng dung lượng đĩa**: 7.59 MB (7,962,768 bytes).
- **Kết quả kiểm tra sự tồn tại**: 40/40 tệp hiện hữu trên đĩa (0 tệp thất lạc).

---

## II. KIỂM ĐỊNH REACHABILITY VÀ CƠ CHẾ DỰ PHÒNG

1. **Khả năng phục vụ HTTP**:
   Đã kiểm định khả năng phục vụ static files qua web server Vite, trả về HTTP 200 OK với Content-Type `audio/mpeg` cho toàn bộ 40 tệp.
2. **Cơ chế SpeechSynthesis Fallback**:
   Trong trường hợp mạng học viên gặp sự cố không tải được tệp âm thanh, Frontend tự động kích hoạt cơ chế dự phòng Web Speech API (giọng đọc tiếng Trung chuẩn `zh-CN`) đảm bảo trải nghiệm học tập không bao giờ bị gián đoạn.
