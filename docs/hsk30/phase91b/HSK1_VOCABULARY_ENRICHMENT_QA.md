# ZHONGWENHUB — BÁO CÁO BỔ SUNG VÍ DỤ CÂU CHO TỪ VỰNG HSK 1 (VOCABULARY ENRICHMENT QA)

**Tài liệu:** `docs/hsk30/phase91b/HSK1_VOCABULARY_ENRICHMENT_QA.md`  
**Giai đoạn:** Phase 9.1B — Task C  
**Ngày thực hiện:** 09/11/2026  
**File staging sinh ra:** `data/hsk30/staging/hsk1_vocabulary_examples.json`  
**Trạng thái:** HOÀN THÀNH — 100% CÂU MẪU SƯ PHẠM ĐÍCH THỰC (291/291 từ vựng)

---

## I. MỤC TIÊU & BỐI CẢNH

Theo kết quả kiểm toán Phase 9.1A:
- Tổng số từ vựng HSK 1 trong database: **300 từ**.
- Số từ vựng đã có trường `ExamplesJson`: **9 từ** (Lessons 1–3).
- Số từ vựng thiếu hoàn toàn ví dụ câu (`ExamplesJson IS NULL` hoặc rỗng): **291 từ**.
- Việc thiếu câu ví dụ khiến học viên chỉ học nghĩa đơn lập mà không nắm được ngữ cảnh ngữ pháp, lượng từ kết hợp và vị trí cú pháp của từ.

**Mục tiêu Phase 9.1B Task C:**
- Soạn thảo và kiểm tra 291 câu ví dụ chuẩn sư phạm cho toàn bộ 291 từ vựng thiếu.
- Định dạng dữ liệu chuẩn JSON: `[{"zh": "...", "pinyin": "...", "meaningVi": "..."}]`.
- Gắn cờ trạng thái kiểm định: `AI_ASSISTED_UNVERIFIED` theo quy chuẩn biên tập trước khi phê duyệt native.
- Lưu trữ hoàn toàn tại khu vực staging (`data/hsk30/staging/hsk1_vocabulary_examples.json`).
- **Tuân thủ quy tắc an toàn:** Không ghi đè hoặc chỉnh sửa trực tiếp trên cơ sở dữ liệu `ZhongWenHub_Dev`.

---

## II. NGUYÊN TẮC THIẾT KẾ CÂU MẪU CHO TRÌNH ĐỘ HSK 1

1. **Từ vựng & Cấu trúc:**
   - 100% câu mẫu sử dụng cấu trúc ngữ pháp sơ cấp (SVO, câu vị ngữ tính từ, câu chữ 是/有, câu nghi vấn với 吗/什么/哪儿/谁).
   - Tuyệt đối không dùng từ vựng trừu tượng, thành ngữ phức tạp hoặc ngữ pháp cao cấp (HSK 4+).
2. **Phiên âm Pinyin:**
   - Đầy đủ dấu thanh điệu chuẩn quốc tế (ā, á, ǎ, à).
   - Viết hoa chữ cái đầu câu và danh từ riêng (Běijīng, Zhōngguó, Lǐ Míng).
   - Biến điệu 一 (yī/yí/yì) và 不 (bù/bú) được ghi chú chính xác theo ngữ cảnh thanh điệu.
3. **Bản dịch tiếng Việt:**
   - Dịch nghĩa tự nhiên, thuần Việt, đúng ngữ cảnh giao tiếp thực tế hàng ngày, không dịch thô kiểu máy móc.

---

## III. THỐNG KÊ CHI TIẾT DỮ LIỆU STAGING ĐÃ TẠO

| Danh mục | Số lượng | Tỷ lệ | Ghi chú |
| :--- | :---: | :---: | :--- |
| **Tổng số từ vựng HSK 1** | 300 | 100.0% | 15 bài học thuộc 6 Units |
| **Từ vựng đã có ví dụ trước đó** | 9 | 3.0% | Thuộc các bài học 1, 2, 3 |
| **Từ vựng được bổ sung ví dụ mới** | 291 | 97.0% | Đã sinh vào file staging |
| **Câu mẫu viết riêng (Handcrafted)** | 291 | 100.0% | 0 câu dùng fallback mẫu thô |
| **Khớp từ khóa trong câu (Hanzi Match)** | 291/291 | 100.0% | 100% câu chứa chính xác chữ Hán mục tiêu |
| **Độ phủ Pinyin & Dịch nghĩa tiếng Việt** | 291/291 | 100.0% | 100% có pinyin thanh điệu và nghĩa tiếng Việt |
| **Trạng thái phê duyệt (Status)** | 291/291 | 100.0% | `AI_ASSISTED_UNVERIFIED` |

---

## IV. MẪU DỮ LIỆU ĐIỂN HÌNH TRONG STAGING

```json
{
  "vocabularyId": "9870CE23-0346-4FE5-AF39-776C93CDA78D",
  "lessonId": "AAAAAAAA-1111-1111-1111-111111111111",
  "hskLevel": 1,
  "hanzi": "一",
  "pinyin": "yī",
  "meaningVi": "một (số 1)",
  "partOfSpeech": "Số từ",
  "examples": [
    {
      "zh": "我有一个苹果。",
      "pinyin": "Wǒ yǒu yí gè píngguǒ.",
      "meaningVi": "Tôi có một quả táo."
    }
  ],
  "examplesJson": "[{\"zh\": \"我有一个苹果。\", \"pinyin\": \"Wǒ yǒu yí gè píngguǒ.\", \"meaningVi\": \"Tôi có một quả táo.\"}]",
  "status": "AI_ASSISTED_UNVERIFIED",
  "qaNotes": "HSK 1 standard beginner sentence for '一' (yī)"
}
```

---

## V. KIỂM CHỨNG TÍNH TOÀN VẸN CỦA DEV DATABASE

Đã thực hiện script kiểm tra sau khi sinh file staging:
- Cơ sở dữ liệu `ZhongWenHub_Dev` hoàn toàn không phát sinh lệnh UPDATE/INSERT.
- Số lượng từ vựng có ví dụ trên Dev DB giữ nguyên: **9 từ**.
- Số lượng từ vựng thiếu ví dụ trên Dev DB giữ nguyên: **291 từ**.
- Toàn bộ dữ liệu mới nằm an toàn tại `data/hsk30/staging/hsk1_vocabulary_examples.json`.
