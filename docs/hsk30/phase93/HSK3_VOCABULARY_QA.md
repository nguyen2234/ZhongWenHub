# BÁO CÁO KIỂM ĐỊNH CHẤT LƯỢNG TỪ VỰNG HSK 3 (VOCABULARY QA)

## I. TỔNG QUAN KIỂM ĐỊNH

- **Tổng số từ vựng kiểm định**: 500 từ vựng ($20 \times 25 = 500$).
- **Tỷ lệ bao phủ ví dụ câu (`ExamplesJson`)**: Đạt **100.0%** (500/500 từ đều có đầy đủ câu chữ Hán, phiên âm Pinyin chuẩn ngữ lưu, và bản dịch tiếng Việt tự nhiên).
- **Trạng thái phê duyệt**: `PENDING_HUMAN_EXPERT_SIGN_OFF` (Sẵn sàng kỹ thuật, chờ chuyên gia ngôn ngữ học nghiệm thu).

---

## II. DANH SÁCH BẪY TỪ ĐIỂN ĐÃ XỬ LÝ TRIỆT ĐỂ

Trong quá trình trích xuất dữ liệu thô, nhóm QA ngôn ngữ học đã phát hiện và xử lý 14 bẫy từ điển CC-CEDICT/máy dịch tự động:

| STT | Từ vựng | Bài học | Lỗi / Bẫy từ điển thô phát hiện | Hiệu đính chuẩn sư phạm HSK 3 | Tình trạng |
| :---: | :---: | :---: | :--- | :--- | :---: |
| 1 | **故事** | L06 | Máy dịch: "tục lệ cũ" (nghĩa cổ) | Câu chuyện, mẩu chuyện | Đã sửa |
| 2 | **节** | L06 | Máy dịch: "xem 節骨眼 (khớp xương)" | Tiết (học), ngày lễ, đốt | Đã sửa |
| 3 | **越** | L06 | Máy dịch: "tộc người Việt ở phía nam" | Càng, vượt qua (越来越 / 越...越...) | Đã sửa |
| 4 | **页** | L07 | Máy dịch: "đầu" (bộ hiệt) | Trang (sách) | Đã sửa |
| 5 | **加** | L09 | Máy dịch: "Canada (viết tắt 加拿大)" | Thêm, cộng | Đã sửa |
| 6 | **把** | L09 | Máy dịch: "cầm, nắm, đỡ em bé đi vệ sinh" | Cầm, nắm; cái/chiếc (lượng từ); câu chữ 把 | Đã sửa |
| 7 | **沙发** | L10 | Tiếng lóng Internet: "người bóc tem bình luận" | Ghế xô-pha, ghế sa-lông | Đã sửa |
| 8 | **地** | L10 | Pinyin thô: "dì" | Đọc nhẹ "de" khi làm trợ từ trạng ngữ | Đã sửa |
| 9 | **刚** | L14 | Máy dịch: "cứng, vững, mạnh" | Vừa, vừa mới (phó từ thời gian) | Đã sửa |
| 10 | **挺** | L14 | Máy dịch: "chìa ra, ưỡn ra" | Rất, khá (挺……的) | Đã sửa |
| 11 | **鸡** | L18 | Tiếng lóng thô tục: "gái mại dâm" | Con gà, thịt gà | Đã sửa |
| 12 | **东方** | L19 | Bẫy regex họ hai chữ Đông Phương | Hướng đông, phương đông | Đã sửa |
| 13 | **黄色** | L19 | Định nghĩa thô tục: "khiêu dâm, đồi trụy" | Màu vàng | Đã sửa |
| 14 | **脏** | L20 | Bẫy từ đồng âm: 脏 (zàng - phủ tạng) | 脏 (zāng - bẩn thỉu, dơ bẩn) | Đã sửa |

---

## III. QUY CHUẨN BIÊN SOẠN CÂU VÍ DỤ

1. **Độ dài câu**: Mỗi câu từ 10 đến 35 chữ Hán, bảo đảm tính mạch lạc ngữ cảnh và phù hợp trình độ HSK 3.
2. **Quy tắc Pinyin**:
   - Viết hoa chữ cái đầu câu và tên riêng (Běijīng, Chángchéng, Xiāngshān, v.v.).
   - Biến điệu thanh 3 (Tone Sandhi) và biến điệu chữ `不`, `一` được chú thích chính xác theo ngữ lưu.
3. **Bản dịch tiếng Việt**: Diễn đạt văn phong tự nhiên, chuẩn thuần Việt, không dùng từ ngữ tối nghĩa hay văn dịch máy thô sơ.
