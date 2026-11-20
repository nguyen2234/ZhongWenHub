# BÁO CÁO KIỂM THỬ KHẢ NĂNG TRUY CẬP VÀ PHÁT ÂM THANH BÀI HỌC (AUDIO & TTS QA)

**Dự án:** ZhongWenHub  
**Đối tượng kiểm thử:** 30 file âm thanh MP3 giáo trình HSK 1 (15 file hội thoại + 15 file luyện nghe)  
**Địa chỉ gốc (Base URL):** `http://127.0.0.1:5173/ZhongWenHub/audio/hsk1/`  
**Script tự động hóa:** `scripts/hsk30/browser_audio_qa.py`  
**Tập dữ liệu kết quả:** `data/hsk30/staging/hsk1_audio_browser_qa_results.json`  

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM THỬ HTTP

Toàn bộ 30 file âm thanh MP3 phục vụ 15 bài học HSK 1 đã được gửi yêu cầu kiểm tra trực tiếp qua web dev server của Vite:
- **Tổng số file được kiểm tra:** 30/30 file MP3.
- **Tỷ lệ phản hồi HTTP 200 OK:** **30 / 30 (100%)**.
- **Content-Type hợp lệ:** 100% trả về định dạng chuẩn `audio/mpeg`.
- **Dung lượng file hợp lệ:** Dao động từ 59,184 bytes (Bài 9) đến 165,456 bytes (Bài 3), không có file 0 byte hay file hỏng.

---

## 2. BẢNG CHI TIẾT 30 FILE ÂM THANH HSK 1

| Bài | Tên file | Loại bài | HTTP Status | Content-Type | Dung lượng (Bytes) | Đánh giá |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| 1 | `les1_dialogue.mp3` | Hội thoại bài 1 | 200 | audio/mpeg | 68,976 B | Hợp lệ |
| 1 | `les1_listening.mp3` | Luyện nghe bài 1 | 200 | audio/mpeg | 143,424 B | Hợp lệ |
| 2 | `les2_dialogue.mp3` | Hội thoại bài 2 | 200 | audio/mpeg | 85,824 B | Hợp lệ |
| 2 | `les2_listening.mp3` | Luyện nghe bài 2 | 200 | audio/mpeg | 145,152 B | Hợp lệ |
| 3 | `les3_dialogue.mp3` | Hội thoại bài 3 | 200 | audio/mpeg | 92,160 B | Hợp lệ |
| 3 | `les3_listening.mp3` | Luyện nghe bài 3 | 200 | audio/mpeg | 165,456 B | Hợp lệ |
| 4 | `les4_dialogue.mp3` | Hội thoại bài 4 | 200 | audio/mpeg | 71,712 B | Hợp lệ |
| 4 | `les4_listening.mp3` | Luyện nghe bài 4 | 200 | audio/mpeg | 71,136 B | Hợp lệ |
| 5 | `les5_dialogue.mp3` | Hội thoại bài 5 | 200 | audio/mpeg | 67,536 B | Hợp lệ |
| 5 | `les5_listening.mp3` | Luyện nghe bài 5 | 200 | audio/mpeg | 67,392 B | Hợp lệ |
| 6 | `les6_dialogue.mp3` | Hội thoại bài 6 | 200 | audio/mpeg | 78,192 B | Hợp lệ |
| 6 | `les6_listening.mp3` | Luyện nghe bài 6 | 200 | audio/mpeg | 77,904 B | Hợp lệ |
| 7 | `les7_dialogue.mp3` | Hội thoại bài 7 | 200 | audio/mpeg | 68,688 B | Hợp lệ |
| 7 | `les7_listening.mp3` | Luyện nghe bài 7 | 200 | audio/mpeg | 66,096 B | Hợp lệ |
| 8 | `les8_dialogue.mp3` | Hội thoại bài 8 | 200 | audio/mpeg | 80,496 B | Hợp lệ |
| 8 | `les8_listening.mp3` | Luyện nghe bài 8 | 200 | audio/mpeg | 79,344 B | Hợp lệ |
| 9 | `les9_dialogue.mp3` | Hội thoại bài 9 | 200 | audio/mpeg | 59,184 B | Hợp lệ |
| 9 | `les9_listening.mp3` | Luyện nghe bài 9 | 200 | audio/mpeg | 59,472 B | Hợp lệ |
| 10 | `les10_dialogue.mp3` | Hội thoại bài 10 | 200 | audio/mpeg | 67,824 B | Hợp lệ |
| 10 | `les10_listening.mp3` | Luyện nghe bài 10 | 200 | audio/mpeg | 70,848 B | Hợp lệ |
| 11 | `les11_dialogue.mp3` | Hội thoại bài 11 | 200 | audio/mpeg | 93,024 B | Hợp lệ |
| 11 | `les11_listening.mp3` | Luyện nghe bài 11 | 200 | audio/mpeg | 93,168 B | Hợp lệ |
| 12 | `les12_dialogue.mp3` | Hội thoại bài 12 | 200 | audio/mpeg | 87,264 B | Hợp lệ |
| 12 | `les12_listening.mp3` | Luyện nghe bài 12 | 200 | audio/mpeg | 86,400 B | Hợp lệ |
| 13 | `les13_dialogue.mp3` | Hội thoại bài 13 | 200 | audio/mpeg | 79,776 B | Hợp lệ |
| 13 | `les13_listening.mp3` | Luyện nghe bài 13 | 200 | audio/mpeg | 77,616 B | Hợp lệ |
| 14 | `les14_dialogue.mp3` | Hội thoại bài 14 | 200 | audio/mpeg | 80,208 B | Hợp lệ |
| 14 | `les14_listening.mp3` | Luyện nghe bài 14 | 200 | audio/mpeg | 78,912 B | Hợp lệ |
| 15 | `les15_dialogue.mp3` | Hội thoại bài 15 | 200 | audio/mpeg | 87,696 B | Hợp lệ |
| 15 | `les15_listening.mp3` | Luyện nghe bài 15 | 200 | audio/mpeg | 84,672 B | Hợp lệ |

---

## 3. CƠ CHẾ DỰ PHÒNG TỔNG HỢP GIỌNG NÓI (WEB SPEECH API FALLBACK)

Nhằm bảo đảm học viên luôn có âm thanh nghe phát âm chuẩn trong mọi điều kiện (ngay cả khi mạng chậm, file tĩnh bị lỗi hoặc học ngoại tuyến), hệ thống đã xây dựng tầng fallback đa lớp trong `HskTextbookLessonPage.tsx`:
```typescript
const playChineseTTS = (text: string, audioUrl?: string) => {
  if (audioUrl) {
    const resolvedUrl = audioUrl.startsWith('http')
      ? audioUrl
      : `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${audioUrl.replace(/^\//, '')}`;
    const audio = new Audio(resolvedUrl);
    audio.play().catch(() => playSpeechFallback(text));
    return;
  }
  playSpeechFallback(text);
};

function playSpeechFallback(text: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }
}
```

- **Kiểm thử E2E:** Kịch bản kiểm thử `5. Audio Fallback & Web Speech API` đã xác nhận hệ thống bắt lỗi êm dịu, chuyển sang `SpeechSynthesisUtterance` thành công mà không gây gián đoạn phiên học.

---

## 4. KẾT LUẬN VÀ ĐỀ XUẤT NÂNG CẤP

1. **Giai đoạn hiện tại (Phase 9.1D):** Đạt 100% yêu cầu kỹ thuật phục vụ thẩm định và thử nghiệm học tập.
2. **Kế hoạch tương lai:** Bộ file hiện tại là âm thanh tổng hợp giọng đọc AI chất lượng cao (`AI_GENERATED_TTS`). Khuyến nghị trong các phiên bản phát hành thương mại lớn có thể thu âm bổ sung bởi diễn viên lồng tiếng bản xứ (Human Voice Actors) để tăng tính biểu cảm tự nhiên.
