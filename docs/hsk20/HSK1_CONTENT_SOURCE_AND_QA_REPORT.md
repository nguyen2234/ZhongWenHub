# ZHONGWENHUB — BÁO CÁO NGUỒN DỮ LIỆU & KIỂM ĐỊNH CHẤT LƯỢNG HSK 1
## HSK 1 Content Provenance, DrKameleon Source Verification & Linguistic QA Report

- **Dự án:** ZhongWenHub
- **Mã nhiệm vụ:** `ZWH-HSK1-LEARNING-AND-CONTENT-CRUD`
- **Bộ dữ liệu chính:** DrKameleon HSK 2.0 Level 1 (`wordlists/exclusive/old/1.json`) & Hanban 2012 Syllabus
- **Tập tin nguồn kiểm chứng:** `data/hsk20/sources/drkameleon_hsk1.json` (SHA256 snapshot)
- **Tập tin chuẩn hóa:** `data/hsk20/staging/hsk20_vocab_hsk1.json` và `data/hsk20/staging/hsk20_grammar_hsk1.json`

---

## 1. NGUỒN DỮ LIỆU DRKAMELEON — XÁC MINH VÀ BẢN QUYỀN

### 1.1. Thông tin kho lưu trữ
- **Repository:** `https://github.com/drkameleon/complete-hsk-vocabulary`
- **Giấy phép:** MIT License (Copyright (c) 2021-present, drkameleon).
- **Phân loại nguồn:**
  - `old-1`: HSK 2.0 Cấp 1 (Chính sách áp dụng của ZhongWenHub).
  - Tuyệt đối không lấy nhầm nhánh `new-1` (thuộc đề cương HSK 3.0 với 500 từ).
  - Không sử dụng file gộp `complete.json` vì chứa dữ liệu hỗn hợp cả 2 phiên bản.

### 1.2. Kết quả đối soát 150 mục từ vựng
- **Số lượng từ vựng trong DrKameleon `old/1.json`:** 150 mục.
- **Số lượng từ vựng trong ZhongWenHub HSK 1 Staging:** 150 mục.
- **Chênh lệch (Diff):** `set() - 0 từ lệch Chữ Hán`.
- **Mẫu dữ liệu nguồn đã kiểm chứng:**
```json
{
  "simplified": "爸爸",
  "radical": "父",
  "pos": ["n"],
  "forms": [
    {
      "traditional": "爸爸",
      "transcriptions": {
        "pinyin": "bà ba",
        "numeric": "ba4 ba5"
      },
      "meanings": [
        "(coll.) father; dad"
      ],
      "classifiers": ["个", "位"]
    }
  ]
}
```

### 1.3. Quy tắc Việt hóa nghĩa
- Nghĩa tiếng Anh chỉ được dùng làm đối chiếu tham khảo ngữ nghĩa học thuật, **tuyệt đối không dùng nghĩa tiếng Anh làm nghĩa tiếng Việt**.
- 100% nghĩa tiếng Việt được rà soát và biên soạn tự nhiên phù hợp ngữ cảnh sư phạm cho người Việt học tiếng Trung.
- Các ghi chú ngữ pháp trong ngoặc đơn được dịch rõ ràng sang tiếng Việt: `(lượng từ sách)`, `(phó từ phủ định)`, `(trợ từ kết cấu)`,...

---

## 2. KIỂM ĐỊNH ÂM VỊ HỌC PINYIN (PHONOTACTICS & DICTIONARY CROSS-CHECK)

Toàn bộ 150 từ vựng HSK 1 đã được kiểm tra nghiêm ngặt qua `scripts/hsk20/pinyin_validator.py`:
1. **Phân tách âm tiết bằng khoảng trắng:** `chū zū chē`, `bà ba`, `diàn yǐng`, `gōng zuò` giúp kiểm tra chính xác từng âm tiết độc lập.
2. **Quy tắc thanh điệu:** Vị trí dấu thanh tuân thủ thứ tự ưu tiên nguyên âm (`a`, `o`, `e`, theo sau là nguyên âm thứ hai trong cặp `iu`/`ui`).
3. **Đối chiếu từ điển `pypinyin`:** Kiểm tra đối chiếu 150 chữ Hán với từ điển âm đọc chuẩn.
- **Kết quả:** **0 lỗi âm vị, 0 lỗi không khớp âm đọc chữ Hán.**

---

## 3. KIỂM ĐỊNH HỆ THỐNG ĐIỂM NGỮ PHÁP HSK 1

- **Tổng số điểm ngữ pháp HSK 1:** 46 điểm (chuẩn hóa theo giáo trình chuẩn HSK Standard Course).
- **Tiêu đề sư phạm:** 100% điểm ngữ pháp đã được dịch sang tên gọi tiếng Việt chuẩn (loại bỏ hoàn toàn tiền tố `Ngữ pháp: `).
- **Cấu trúc trường:** 100% điểm ngữ pháp có đầy đủ công thức `structure`, giải thích `explanationVi` và tối thiểu 3 câu ví dụ minh họa kèm chữ Hán, Pinyin và nghĩa tiếng Việt.

---

## 4. KẾT LUẬN

Bộ dữ liệu HSK 1 (150 từ vựng và 46 điểm ngữ pháp) đạt 100% tiêu chí kiểm định tự động của bài kiểm thử QA. Trạng thái học thuật được ghi nhận minh bạch: `VERIFIED_BY_AUTOMATED_RULES` và `PENDING_HUMAN_EXPERT_SIGN_OFF`.
