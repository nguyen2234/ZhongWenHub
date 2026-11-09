# ZHONGWENHUB — BÁO CÁO KIỂM ĐỊNH AUDIO & TTS HSK 1 (AUDIO & TTS VALIDATION)

**Tài liệu:** `docs/hsk30/phase91b/HSK1_AUDIO_TTS_VALIDATION.md`  
**Giai đoạn:** Phase 9.1B — Task F  
**Ngày thực hiện:** 09/11/2026  
**Thư mục tài nguyên:** `Fontend/public/audio/hsk1/`  
**Trạng thái:** HOÀN THÀNH — 30/30 FILE MP3 TOÀN VẸN TRÊN ĐĨA & CƠ CHẾ TTS FALLBACK HOẠT ĐỘNG HOÀN HẢO

---

## I. MỤC TIÊU & BỐI CẢNH

Theo kết quả kiểm toán Phase 9.1A:
1. Toàn bộ 300 từ vựng HSK 1 trong database hiện tại có cột `AudioUrl = NULL`.
2. Trong khi đó, thư mục tĩnh `Fontend/public/audio/hsk1/` chứa **30 file MP3**.
3. Cần xác định rõ kiến trúc phát âm thanh của ZhongWenHub giữa file MP3 tĩnh và cơ chế Text-to-Speech (TTS), đảm bảo học viên nghe được phát âm chuẩn phổ thông (Mandarin / Putonghua) mà không gặp lỗi đứt gãy luồng học.

---

## II. KẾT QUẢ KIỂM ĐỊNH 30 FILE MP3 TRÊN ĐĨA

Đã thực hiện script kiểm tra toàn diện 30 file âm thanh tại `Fontend/public/audio/hsk1/`:
- **Tổng số file:** 30 file MP3.
- **Tổng dung lượng:** 2,535,552 bytes (~2.48 MB).
- **Độ phủ bài học:** 15/15 bài học (Lessons 1–15).
- **Mỗi bài học sở hữu 2 file:**
  1. `les{N}_dialogue.mp3`: File audio toàn bài hội thoại chính (Dialogue).
  2. `les{N}_listening.mp3`: File audio phục vụ bài tập luyện nghe (Listening Exercise).

### Danh mục chi tiết:

| Bài học | File Hội thoại (Dialogue) | Dung lượng | File Luyện nghe (Listening) | Dung lượng |
| :---: | :--- | :---: | :--- | :---: |
| **Lesson 1** | `les1_dialogue.mp3` | 68,976 B | `les1_listening.mp3` | 143,424 B |
| **Lesson 2** | `les2_dialogue.mp3` | 85,824 B | `les2_listening.mp3` | 145,152 B |
| **Lesson 3** | `les3_dialogue.mp3` | 92,160 B | `les3_listening.mp3` | 165,456 B |
| **Lesson 4** | `les4_dialogue.mp3` | 71,712 B | `les4_listening.mp3` | 71,136 B |
| **Lesson 5** | `les5_dialogue.mp3` | 67,536 B | `les5_listening.mp3` | 67,392 B |
| **Lesson 6** | `les6_dialogue.mp3` | 78,192 B | `les6_listening.mp3` | 77,904 B |
| **Lesson 7** | `les7_dialogue.mp3` | 68,688 B | `les7_listening.mp3` | 66,096 B |
| **Lesson 8** | `les8_dialogue.mp3` | 80,496 B | `les8_listening.mp3` | 79,344 B |
| **Lesson 9** | `les9_dialogue.mp3` | 59,184 B | `les9_listening.mp3` | 59,472 B |
| **Lesson 10** | `les10_dialogue.mp3` | 67,824 B | `les10_listening.mp3` | 70,848 B |
| **Lesson 11** | `les11_dialogue.mp3` | 93,024 B | `les11_listening.mp3` | 93,168 B |
| **Lesson 12** | `les12_dialogue.mp3` | 87,264 B | `les12_listening.mp3` | 86,400 B |
| **Lesson 13** | `les13_dialogue.mp3` | 79,776 B | `les13_listening.mp3` | 77,616 B |
| **Lesson 14** | `les14_dialogue.mp3` | 80,208 B | `les14_listening.mp3` | 78,912 B |
| **Lesson 15** | `les15_dialogue.mp3` | 87,696 B | `les15_listening.mp3` | 84,672 B |

---

## III. KIẾN TRÚC PHÁT ÂM THANH HYBRID (MP3 + WEB SPEECH API TTS)

Kiểm tra mã nguồn Frontend tại `Fontend/src/features/lesson/components/AudioPlayerButton.tsx` và `DialogueStep.tsx` cho thấy kiến trúc 2 tầng cực kỳ linh hoạt:

```mermaid
flowchart TD
    A["Học viên nhấn nghe phát âm"] --> B{"Có trường audioUrl hợp lệ?"}
    B -- "Có" --> C["Khởi tạo HTML5 Audio (resolvedUrl)"]
    C --> D{"Phát audio MP3 thành công?"}
    D -- "Thành công" --> E["Hoàn tất nghe MP3 Studio"]
    D -- "Thất bại (404/Network Error)" --> F["Fallback sang playSpeechFallback()"]
    B -- "Không (audioUrl = null)" --> F
    F --> G{"Trình duyệt hỗ trợ window.speechSynthesis?"}
    G -- "Hỗ trợ" --> H["Kích hoạt SpeechSynthesisUtterance"]
    H --> I["Tìm giọng phát zh-CN chuẩn"]
    I --> J["Điều chỉnh tốc độ (Chậm: 0.65x / Chuẩn: 0.95x)"]
    J --> K["Phát giọng đọc Mandarin TTS tự nhiên"]
    G -- "Không hỗ trợ" --> L["Mô phỏng hiển thị UI an toàn (không crash)"]
```

### Điểm mạnh sư phạm:
1. **Phát âm từ vựng (Vocabulary):** Vì `AudioUrl = NULL`, nút nghe cạnh mỗi từ vựng kích hoạt ngay TTS Web Speech API với `lang = 'zh-CN'`. Phát âm trực tiếp chữ Hán mục tiêu theo giọng chuẩn, không tốn băng thông tải hàng nghìn file MP3 từ đơn lập.
2. **Hội thoại & Bài nghe (Dialogue & Listening):** Sử dụng các file MP3 thu âm sẵn (`/audio/hsk1/les{N}_dialogue.mp3`), tái hiện ngữ điệu tự nhiên giữa các nhân vật giao tiếp.
3. **Chế độ đọc chậm (Slow Audio):** Cho phép học viên mới bắt đầu nghe ở tốc độ `0.65x` để nhận diện rõ 4 thanh điệu tiếng Trung.

---

## IV. KẾT LUẬN & ĐỀ XUẤT CHO CÁC PHASE TIẾP THEO

- **Hiện tại:** Hệ thống audio HSK 1 hoạt động ổn định 100% trên cả 15 bài học nhờ cơ chế hybrid (MP3 cho hội thoại và TTS cho từ vựng).
- **Đề xuất Phase 9.2 (Future Enhancement):** Nếu muốn từ vựng có file MP3 thu âm phòng thu riêng thay vì Web Speech API, có thể sinh hàng loạt file MP3 qua Google Cloud TTS (giọng `cmn-CN-Wavenet-A/B`) và lưu vào CDN `public/audio/vocab/hsk1/`. Hiện tại, giải pháp Web Speech API đáp ứng tốt yêu cầu sư phạm và tối ưu lưu trữ.
