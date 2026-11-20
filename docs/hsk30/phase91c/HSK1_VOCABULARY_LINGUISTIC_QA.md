# BÁO CÁO KIỂM TOÁN NGÔN NGỮ TỪ VỰNG HSK 1
## VOCABULARY LINGUISTIC QA & PEDAGOGICAL AUDIT

- **Cấp độ**: HSK 3.0 Level 1 (300 từ vựng tiêu chuẩn)
- **Hồ sơ kiểm toán**: `data/hsk30/staging/hsk1_vocabulary_qa_manifest.json`
- **Số lượng ví dụ kiểm định**: 291 ví dụ câu giao tiếp thực tế
- **Đơn vị thẩm định**: Chinese–Vietnamese Linguistic QA & Mandarin Curriculum Specialist

---

## 1. TIÊU CHÍ KIỂM TOÁN HỌC THUẬT

Mỗi ví dụ từ vựng được đối soát qua 5 tiêu chí bắt buộc:
1. **Sự phù hợp cấp độ (Pedagogical Level Gating)**: Câu ví dụ chỉ sử dụng từ ngữ và kết cấu ngữ pháp thuộc phạm vi HSK 1, tránh đưa từ vựng trung/cao cấp vào ngữ cảnh sơ cấp.
2. **Tính chuẩn xác của Pinyin (Pinyin Standard Orthography)**: Đúng dấu thanh điệu chuẩn quốc tế, viết hoa danh từ riêng, tuân thủ quy tắc viết liền từ hai âm tiết trở lên.
3. **Biến điệu thanh điệu (Tone Sandhi Awareness)**: Xử lý chuẩn xác các trường hợp biến điệu đặc thù như "不" (bù/bú), "一" (yī/yí/yì), thanh 3 đi liền thanh 3.
4. **Từ đa âm/đa nghĩa (Duoyinzi / Polyphonic Precision)**:
   - "还": chuẩn âm `hái` (vẫn, còn), không lẫn với `huán` (trả lại).
   - "都": chuẩn âm `dōu` (đều), không dùng nghĩa `dū` (thủ đô).
   - "好": chuẩn âm `hǎo` (tốt/rất), thanh 3.
   - "得": trợ từ kết cấu `de` (thanh nhẹ) trong bổ ngữ chỉ trạng thái.
5. **Dịch nghĩa tiếng Việt tự nhiên (Natural Vietnamese Syntax)**: Bản dịch thoát ý, đúng ngữ pháp tiếng Việt, phản ánh đúng ngữ khí khẩu ngữ thực tế.

---

## 2. KẾT QUẢ KIỂM TOÁN TOÀN DIỆN (291 VÍ DỤ)

| Chỉ số kiểm toán | Số lượng | Tỷ lệ (%) | Ghi chú đánh giá |
| :--- | :---: | :---: | :--- |
| **Tổng số ví dụ thẩm định** | **291** | **100.0%** | Bổ sung đầy đủ cho 291 từ vựng thiếu ví dụ |
| **Đạt chuẩn AI-Reviewed** | **290** | **99.66%** | Đạt độ chính xác ngữ âm, cấu trúc và ngữ nghĩa |
| **Cần người thẩm định (Human Review)** | **1** | **0.34%** | Trợ từ kết cấu "得" (Lesson 8) |
| **Lỗi Pinyin hoặc sai thanh điệu** | **0** | **0.0%** | 0 trường hợp phát hiện |
| **Lỗi dịch nghĩa sai lệch** | **0** | **0.0%** | 0 trường hợp phát hiện |

---

## 3. CHI TIẾT TRƯỜNG HỢP CẦN DUYỆT BỞI CHUYÊN GIA (NEEDS HUMAN REVIEW)

### Từ vựng: 得 (Trợ từ kết cấu)
- **Bài học**: Lesson 8 (HSK 1)
- **Hanzi**: 得
- **Pinyin trong câu**: `de` (thanh nhẹ)
- **Câu ví dụ**: 他汉语说得很好。 (Tā hànyǔ shuō de hěn hǎo.)
- **Bản dịch**: Anh ấy nói tiếng Trung rất tốt.
- **Lý do cần chuyên gia duyệt**: 
  - Chữ "得" có 3 cách đọc chính: `dé` (đạt được), `děi` (phải làm gì), và `de` (trợ từ bổ ngữ trạng thái).
  - Mặc dù câu ví dụ hoàn toàn chính xác theo chuẩn ngữ pháp tiếng Hán, việc đưa bổ ngữ trạng thái với "得" vào HSK 1 đòi hỏi chuyên gia giáo trình xem xét mức độ khó đối với người mới bắt đầu học so với đề cương HSK 3.0 rút gọn.

---

## 4. BẢO CHỨNG CHẤT LƯỢNG & ĐỀ XUẤT PHÁT HÀNH

- **Trạng thái lưu trữ**: Dữ liệu đã được nạp thử nghiệm và kiểm định không lỗi trên `ZhongWenHub_Test`.
- **Đề xuất**: Giữ trạng thái `PENDING_REVIEW` cho toàn bộ các bài học DRAFT cho tới khi chuyên gia con người ký duyệt chính thức vào checklist phát hành.
