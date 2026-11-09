# BÁO CÁO KIỂM TOÁN CHẤT LƯỢNG AUDIO & TTS HSK 1
## HSK 1 AUDIO RECORDINGS & WEB SPEECH TTS FALLBACK AUDIT

- **Cấp độ**: HSK 3.0 Level 1 (15 Bài học)
- **Thư mục lưu trữ**: `Fontend/public/audio/hsk1/`
- **Hồ sơ kiểm toán**: `data/hsk30/staging/hsk1_audio_qa_manifest.json`
- **Tổng số file thẩm định**: 30 file MP3

---

## 1. KẾT QUẢ KIỂM TOÁN 30 FILE AUDIO MP3

Toàn bộ 30 file âm thanh phục vụ hội thoại (`dialogue`) và bài luyện nghe (`listening`) cho 15 bài học HSK 1 đã được kiểm định chi tiết:

| Nhóm file | Số lượng | Dung lượng trung bình | Kiểm tra Header MP3 | Trạng thái kỹ thuật |
| :--- | :---: | :---: | :---: | :---: |
| **Dialogue MP3 (`les{N}_dialogue.mp3`)** | 15 file | 67 KB – 93 KB | 100% Valid Frame Sync / ID3 | **VALID_PRODUCTION_READY** |
| **Listening MP3 (`les{N}_listening.mp3`)** | 15 file | 59 KB – 165 KB | 100% Valid Frame Sync / ID3 | **VALID_PRODUCTION_READY** |
| **Tổng cộng** | **30 file** | **~2.5 MB tổng cộng** | **30 / 30 Hợp lệ** | **PASSED (100%)** |

### Bảng Thống kê Chi tiết 15 Bài học:
- **Lesson 1**: `les1_dialogue.mp3` (68.9 KB), `les1_listening.mp3` (143.4 KB) — Đạt chuẩn
- **Lesson 2**: `les2_dialogue.mp3` (85.8 KB), `les2_listening.mp3` (145.1 KB) — Đạt chuẩn
- **Lesson 3**: `les3_dialogue.mp3` (92.1 KB), `les3_listening.mp3` (165.4 KB) — Đạt chuẩn
- **Lesson 4**: `les4_dialogue.mp3` (71.7 KB), `les4_listening.mp3` (71.1 KB) — Đạt chuẩn
- **Lesson 5**: `les5_dialogue.mp3` (67.5 KB), `les5_listening.mp3` (67.3 KB) — Đạt chuẩn
- **Lesson 6**: `les6_dialogue.mp3` (78.1 KB), `les6_listening.mp3` (77.9 KB) — Đạt chuẩn
- **Lesson 7**: `les7_dialogue.mp3` (68.6 KB), `les7_listening.mp3` (66.0 KB) — Đạt chuẩn
- **Lesson 8**: `les8_dialogue.mp3` (80.4 KB), `les8_listening.mp3` (79.3 KB) — Đạt chuẩn
- **Lesson 9**: `les9_dialogue.mp3` (59.1 KB), `les9_listening.mp3` (59.4 KB) — Đạt chuẩn
- **Lesson 10**: `les10_dialogue.mp3` (67.8 KB), `les10_listening.mp3` (70.8 KB) — Đạt chuẩn
- **Lesson 11**: `les11_dialogue.mp3` (93.0 KB), `les11_listening.mp3` (93.1 KB) — Đạt chuẩn
- **Lesson 12**: `les12_dialogue.mp3` (87.2 KB), `les12_listening.mp3` (86.4 KB) — Đạt chuẩn
- **Lesson 13**: `les13_dialogue.mp3` (79.7 KB), `les13_listening.mp3` (77.6 KB) — Đạt chuẩn
- **Lesson 14**: `les14_dialogue.mp3` (80.2 KB), `les14_listening.mp3` (78.9 KB) — Đạt chuẩn
- **Lesson 15**: `les15_dialogue.mp3` (87.6 KB), `les15_listening.mp3` (84.6 KB) — Đạt chuẩn

---

## 2. CƠ CHẾ DỰ PHÒNG WEB SPEECH API (TTS FALLBACK)

Để đảm bảo trải nghiệm học tập không bao giờ bị gián đoạn (kể cả khi mạng yếu, lỗi tải file MP3 hoặc các từ vựng mới chưa có file thu âm riêng), hệ thống sử dụng cơ chế bảo hộ hai tầng:

### Kiến trúc hoạt động trong `AudioPlayerButton.tsx` & `ReadingPassageCard.tsx`:
1. **Ưu tiên 1 (Direct Audio Playback)**: Hệ thống cố gắng tải và phát file âm thanh tĩnh qua thẻ HTML5 `Audio(resolvedUrl)`.
2. **Ưu tiên 2 (Tự động chuyển tiếp khi có lỗi `audio.onerror`)**:
   - Nếu file MP3 không tồn tại, đường dẫn lỗi hoặc mạng ngắt kết nối, bộ điều khiển tự động kích hoạt `playSpeechFallback()`.
   - Cấu hình TTS:
     - Ngôn ngữ: `zh-CN` (tiếng Quan Thoại chuẩn).
     - Giọng đọc: Tự động phát hiện giọng bản ngữ trong hệ thống người dùng (`v.lang.includes('zh') || v.name.includes('Chinese')`).
     - Tốc độ phát (`rate`): `0.65` cho chế độ phát chậm (luyện nghe cho người mới bắt đầu) và `0.95` cho chế độ phát thông thường.
3. **Ưu tiên 3 (Graceful Fallback)**: Trường hợp trình duyệt người dùng không hỗ trợ SpeechSynthesis, giao diện hiển thị hiệu ứng phát âm thị giác (pulsing icon) mà không ném ra exception làm sập ứng dụng.
