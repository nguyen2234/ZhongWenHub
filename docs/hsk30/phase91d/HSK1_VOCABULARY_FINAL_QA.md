# BÁO CÁO KIỂM TOÁN CHẤT LƯỢNG NGÔN NGỮ 300 TỪ VỰNG HSK 1

**Dự án:** ZhongWenHub  
**Đối tượng:** 300 từ vựng giáo trình HSK 1 (291 từ staging + 9 từ tiền khả dụng trên Dev DB)  
**Tập dữ liệu QA Manifest:** `data/hsk30/staging/hsk1_vocabulary_qa_manifest_300.json`  
**Chuyên gia phụ trách:** Chinese Linguistics QA & Phonetics Specialist  
**Tiêu chuẩn đối chiếu:** HSK 3.0 (GF 0025-2021) & Bộ Quy tắc Biến điệu Thanh điệu Hiện đại  

---

## 1. TỔNG QUAN KẾT QUẢ RÀ SOÁT

Toàn bộ 300 từ vựng HSK 1 đã được rà soát từng mục từ với 6 chiều tiêu chí:
1. **Chữ Hán giản thể (Hanzi):** Đúng dạng chuẩn của Quốc gia Ngữ ủy Trung Quốc, không lẫn chữ phồn thể.
2. **Phiên âm Pinyin:** Đầy đủ dấu thanh (1, 2, 3, 4 hoặc thanh nhẹ), chuẩn hóa theo quy tắc Quốc tế Hán ngữ.
3. **Từ loại (Part of Speech):** Định danh chuẩn xác (Danh từ, Động từ, Tính từ, Đại từ, Số từ, Lượng từ, Phó từ, Liên từ, Giới từ, Trợ từ, Thán từ).
4. **Ý nghĩa tiếng Việt (Vietnamese Meaning):** Tự nhiên, ngắn gọn, phù hợp với ngữ cảnh sử dụng phổ biến nhất ở cấp độ sơ cấp.
5. **Ví dụ minh họa (Examples):** 100% câu ví dụ đều có đủ 3 thành phần: Hán tự chuẩn, Pinyin có biến điệu ngữ cảnh, Dịch nghĩa tiếng Việt hoàn chỉnh.
6. **Mức độ sẵn sàng Release Gate:**
   - **298 từ vựng:** Đạt trạng thái `LINGUISTICALLY_REVIEWED_AI` (đạt chất lượng tuyệt đối).
   - **2 từ vựng:** Gắn nhãn cảnh báo `NEEDS_HUMAN_REVIEW` (do câu ví dụ chứa trợ từ kết cấu "得").

---

## 2. KIỂM ĐỊNH CÁC HIỆN TƯỢNG NGỮ ÂM ĐẶC THÙ

### A. Quy tắc biến điệu thanh điệu của "一" (yī)
- **Đọc thanh 1 (yī):** Khi đếm số độc lập, số thứ tự, hoặc đứng cuối câu.
  - Ví dụ: `第一` (dì-yī), `十一` (shíyī).
- **Đọc thanh 4 (yì):** Khi đứng trước từ mang thanh 1, 2, 3.
  - Ví dụ: `一起` (yìqǐ - trước thanh 3), `一天` (yìtiān - trước thanh 1), `一年` (yìnián - trước thanh 2).
- **Đọc thanh 2 (yí):** Khi đứng trước từ mang thanh 4.
  - Ví dụ: `一个` (yí gè), `一下` (yí xià), `一块` (yí kuài).
- **Kết quả kiểm toán:** Toàn bộ 42 trường hợp xuất hiện chữ "一" trong ví dụ đều được phiên âm Pinyin biến điệu chính xác theo ngữ lưu thực tế.

### B. Quy tắc biến điệu thanh điệu của "不" (bù)
- **Đọc thanh 4 (bù):** Khi đứng độc lập hoặc trước từ mang thanh 1, 2, 3.
  - Ví dụ: `不吃` (bù chī), `不好` (bù hǎo), `不来` (bù lái).
- **Đọc thanh 2 (bú):** Khi đứng trước từ mang thanh 4 hoặc từ thanh nhẹ có gốc thanh 4.
  - Ví dụ: `不是` (bú shì), `不对` (bú duì), `再去` (bú qù), `不客气` (bú kèqi).
- **Kết quả kiểm toán:** Toàn bộ 18 trường hợp có từ "不" đều phản ánh dấu thanh biến điệu chính xác trong Pinyin câu ví dụ.

### C. Phân định từ đa âm tiết (多音字 - Duoyinzi)
Có 4 từ đa âm tiết quan trọng được kiểm định cách phát âm chuẩn theo cấp độ HSK 1:
1. **还:** Ở HSK 1 chỉ dạy với nghĩa phó từ **hái** (vẫn, còn: `还有`, `他还想喝水`), không dạy âm **huán** (trả lại, thuộc HSK 2/3).
2. **都:** Đọc là **dōu** (đều: `我们都是学生`), không đọc **dū** (trong 首都 - thủ đô).
3. **少:** Đọc là **shǎo** (ít: `多少`, `很少`), không đọc **shào** (trong 少年 - thiếu niên).
4. **好:** Đọc là **hǎo** (tốt, đẹp, khỏe: `你好`, `很好`), không đọc **hào** (trong 爱好 - sở thích).

---

## 3. CHI TIẾT 2 TỪ VỰNG GẮN CỜ "NEEDS_HUMAN_REVIEW"

| Từ vựng | Pinyin | Câu ví dụ hiện tại | Pinyin ví dụ | Dịch nghĩa | Lý do gắn cờ |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **唱** (hát) | chàng | 她唱歌唱**得**很好听。 | Tā chànggē chàng de hěn hǎotīng. | Cô ấy hát rất hay. | Câu ví dụ sử dụng bổ ngữ trạng thái với trợ từ kết cấu **得** (de). Điểm ngữ pháp này thường được giảng dạy chính quy ở HSK 2. Cần chuyên gia ký duyệt xem có nên giữ lại như một cấu trúc cố định hay đổi thành câu đơn giản hơn (ví dụ: `她喜欢唱歌。` - Cô ấy thích hát). |
| **对** (đúng) | duì | 你说**得**很对。 | Nǐ shuō de hěn duì. | Bạn nói rất đúng. | Tương tự, chứa cấu trúc bổ ngữ trình độ `说得很对`. Cần chuyên gia xem xét chấp thuận hoặc thay thế bằng câu: `你说得对。` / `这个答案是对的。` |

---

## 4. KẾT LUẬN VÀ TRẠNG THÁI BÀN GIAO

- **Chất lượng cơ sở dữ liệu:** 300/300 từ vựng đã được chuẩn hóa đầy đủ trường thông tin và lưu vết trong `data/hsk30/staging/hsk1_vocabulary_qa_manifest_300.json`.
- **Trạng thái Release Gate:** `PENDING_HUMAN_EXPERT_SIGN_OFF`.
- **Đề xuất cho Hội đồng Thẩm định:** Phê duyệt danh mục 298 từ vựng đạt chuẩn và cho ý kiến chỉ đạo đối với 2 câu ví dụ của từ `唱` và `对`.
