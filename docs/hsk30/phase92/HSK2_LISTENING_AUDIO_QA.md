# KIỂM ĐỊNH TỆP ÂM THANH VÀ TRÌNH PHÁT BROWSER HSK 2 (HSK 2 AUDIO & LISTENING QA)

> **Mục tiêu:** Kiểm toán tệp âm thanh thực tế, khả năng tiếp cận qua trình duyệt và cơ chế dự phòng TTS cho HSK 2.  
> **Thư mục tài nguyên:** `Fontend/public/audio/hsk2/`  
> **Kết quả kiểm toán:** `30/30 FILES VERIFIED (100% HTTP 200 OK)`  
> **Tệp báo cáo:** `data/hsk30/staging/hsk2_audio_browser_qa_results.json`  

---

## 1. THỐNG KÊ TỆP ÂM THANH HSK 2

Mỗi bài học trong 15 bài học HSK 2 sở hữu đúng 2 tệp âm thanh MP3 thực tế:
1. **Âm thanh Hội thoại bài học (`lesX_dialogue.mp3`):** Độ dài trung bình 135–143 KB, giọng đọc phổ thông chuẩn Bắc Kinh.
2. **Âm thanh Bài luyện nghe (`lesX_listening.mp3`):** Độ dài trung bình 167–210 KB, bao gồm ngữ cảnh và bài tập nghe hiểu.

### Bảng chi tiết 30 tệp MP3:

| STT | Tên tệp tin | Loại âm thanh | Kích thước (bytes) | Trạng thái HTTP | Content-Type | Kết luận |
| :---: | :--- | :--- | :---: | :---: | :--- | :---: |
| 1 | `les1_dialogue.mp3` | Dialogue | 140,976 | 200 OK | audio/mpeg | **PASS** |
| 2 | `les1_listening.mp3` | Listening | 210,528 | 200 OK | audio/mpeg | **PASS** |
| 3 | `les2_dialogue.mp3` | Dialogue | 138,816 | 200 OK | audio/mpeg | **PASS** |
| 4 | `les2_listening.mp3` | Listening | 170,208 | 200 OK | audio/mpeg | **PASS** |
| 5 | `les3_dialogue.mp3` | Dialogue | 142,992 | 200 OK | audio/mpeg | **PASS** |
| 6 | `les3_listening.mp3` | Listening | 207,360 | 200 OK | audio/mpeg | **PASS** |
| 7 | `les4_dialogue.mp3` | Dialogue | 142,272 | 200 OK | audio/mpeg | **PASS** |
| 8 | `les4_listening.mp3` | Listening | 205,488 | 200 OK | audio/mpeg | **PASS** |
| 9 | `les5_dialogue.mp3` | Dialogue | 136,224 | 200 OK | audio/mpeg | **PASS** |
| 10 | `les5_listening.mp3` | Listening | 192,672 | 200 OK | audio/mpeg | **PASS** |
| 11 | `les6_dialogue.mp3` | Dialogue | 135,504 | 200 OK | audio/mpeg | **PASS** |
| 12 | `les6_listening.mp3` | Listening | 200,736 | 200 OK | audio/mpeg | **PASS** |
| 13 | `les7_dialogue.mp3` | Dialogue | 139,536 | 200 OK | audio/mpeg | **PASS** |
| 14 | `les7_listening.mp3` | Listening | 167,904 | 200 OK | audio/mpeg | **PASS** |
| 15 | `les8_dialogue.mp3` | Dialogue | 138,384 | 200 OK | audio/mpeg | **PASS** |
| 16 | `les8_listening.mp3` | Listening | 202,896 | 200 OK | audio/mpeg | **PASS** |
| 17 | `les9_dialogue.mp3` | Dialogue | 139,536 | 200 OK | audio/mpeg | **PASS** |
| 18 | `les9_listening.mp3` | Listening | 204,480 | 200 OK | audio/mpeg | **PASS** |
| 19 | `les10_dialogue.mp3` | Dialogue | 143,280 | 200 OK | audio/mpeg | **PASS** |
| 20 | `les10_listening.mp3` | Listening | 200,304 | 200 OK | audio/mpeg | **PASS** |
| 21 | `les11_dialogue.mp3` | Dialogue | 136,800 | 200 OK | audio/mpeg | **PASS** |
| 22 | `les11_listening.mp3` | Listening | 202,752 | 200 OK | audio/mpeg | **PASS** |
| 23 | `les12_dialogue.mp3` | Dialogue | 139,248 | 200 OK | audio/mpeg | **PASS** |
| 24 | `les12_listening.mp3` | Listening | 169,776 | 200 OK | audio/mpeg | **PASS** |
| 25 | `les13_dialogue.mp3` | Dialogue | 135,072 | 200 OK | audio/mpeg | **PASS** |
| 26 | `les13_listening.mp3` | Listening | 200,880 | 200 OK | audio/mpeg | **PASS** |
| 27 | `les14_dialogue.mp3` | Dialogue | 140,256 | 200 OK | audio/mpeg | **PASS** |
| 28 | `les14_listening.mp3` | Listening | 202,320 | 200 OK | audio/mpeg | **PASS** |
| 29 | `les15_dialogue.mp3` | Dialogue | 138,528 | 200 OK | audio/mpeg | **PASS** |
| 30 | `les15_listening.mp3` | Listening | 195,120 | 200 OK | audio/mpeg | **PASS** |

---

## 2. KIỂM ĐỊNH KHẢ NĂNG TIẾP CẬN TRÌNH DUYỆT (BROWSER REACHABILITY)

Script kiểm định tự động `scripts/hsk30/browser_audio_hsk2_qa.py` đã thực hiện truy vấn HTTP HEAD/GET thực tế tới từng URL:
- **Base URL:** `http://127.0.0.1:5173/ZhongWenHub/audio/hsk2/`
- **Kết quả:** 30/30 tệp trả về HTTP 200 OK, MIME type `audio/mpeg`, không có bất kỳ tệp tin nào bị lỗi 404, dung lượng 0 byte hay hỏng định dạng header MP3.

---

## 3. CƠ CHẾ DỰ PHÒNG GIỌNG ĐỌC AI (TTS FALLBACK ARCHITECTURE)

Trong trường hợp người dùng mất kết nối tải file âm thanh tĩnh hoặc chạy trên môi trường hạn chế:
- **Web Speech API Fallback:** Nền tảng tự động kích hoạt `window.speechSynthesis` với voice `zh-CN` (giọng tiếng Trung đại lục).
- **Graceful Error Handling:** Component `AudioPlayer` và các nút bấm phát âm từ vựng bọc trong khối `try/catch`, không bao giờ làm sập giao diện người dùng nếu trình duyệt không hỗ trợ Web Audio.
- **Xác minh E2E:** Kịch bản Playwright E2E Test 5 đã mô phỏng việc nhấn nút âm thanh và xác nhận giao diện hoạt động mượt mà, không sinh lỗi unhandled exception.
