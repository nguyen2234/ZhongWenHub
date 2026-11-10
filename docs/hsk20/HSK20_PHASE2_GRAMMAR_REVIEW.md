# ZHONGWENHUB — BÁO CÁO RÀ SOÁT VÀ CHUẨN HÓA ĐIỂM NGỮ PHÁP (PHASE 2)
## HSK 2.0 Pedagogical Grammar Standardization & Vietnamese Translation Review

- **Dự án:** ZhongWenHub
- **Mã nhiệm vụ:** `ZWH-HSK20-DATA-QA-REMEDIATION`
- **Bộ dữ liệu:** HSK 2.0 Grammar Syllabus (311 điểm ngữ pháp HSK 1–4)
- **Tập tin chuẩn hóa:** `data/hsk20/staging/hsk20_grammar_standard.json`
- **Script chuẩn hóa:** `scripts/hsk20/remediate_grammar_dataset.py`

---

## 1. TỔNG QUAN PHÂN BỔ ĐIỂM NGỮ PHÁP THEO CẤP ĐỘ

Hệ thống điểm ngữ pháp HSK 2.0 được đối chiếu và xây dựng dựa trên giáo trình chuẩn HSK Standard Course (BLCUP) và khung ngữ pháp HSK 2.0:

| Cấp độ HSK | Số điểm ngữ pháp | Số bài học tương ứng | Bình quân điểm ngữ pháp/bài | Tập tin dữ liệu phân cấp |
| :--- | :--- | :--- | :--- | :--- |
| **HSK 1** | 46 điểm | 15 bài học | ~3.0 điểm/bài | `data/hsk20/staging/hsk1_grammar.json` |
| **HSK 2** | 47 điểm | 15 bài học | ~3.1 điểm/bài | `data/hsk20/staging/hsk2_grammar.json` |
| **HSK 3** | 98 điểm | 20 bài học | ~4.9 điểm/bài | `data/hsk20/staging/hsk3_grammar.json` |
| **HSK 4** | 120 điểm | 20 bài học | ~6.0 điểm/bài | `data/hsk20/staging/hsk4_grammar.json` |
| **TỔNG CỘNG** | **311 điểm** | **70 bài học** | **~4.4 điểm/bài** | `data/hsk20/staging/hsk20_grammar_standard.json` |

---

## 2. KHẮC PHỤC TRIỆT ĐỂ TIÊU ĐỀ NGỮ PHÁP (ELIMINATING RAW PREFIXES)

### 2.1. Vấn đề phát hiện
Trong dữ liệu sơ khai, nhiều điểm ngữ pháp có tiêu đề dạng fallback máy móc: `Ngữ pháp: [Tên tiếng Trung]` hoặc chỉ sao chép nguyên mẫu mẫu câu tiếng Trung mà không có tên gọi sư phạm bằng tiếng Việt, gây khó khăn cho học viên người Việt khi tiếp cận khái niệm ngữ pháp.

### 2.2. Biện pháp chuẩn hóa
Script `remediate_grammar_dataset.py` đã tự động dịch và chuẩn hóa toàn bộ 311 tiêu đề ngữ pháp sang tên gọi ngữ pháp tiếng Việt sư phạm, ví dụ:

| ID điểm ngữ pháp | Cấp độ | Cấu trúc gốc | Tiêu đề cũ | Tiêu đề chuẩn hóa sau khắc phục |
| :--- | :--- | :--- | :--- | :--- |
| `HSK1-G01` | HSK 1 | S + 是 + N | Ngữ pháp: 是字句 | Câu chữ 是 (biểu thị phán đoán, khẳng định) |
| `HSK1-G02` | HSK 1 | S + 不 + V/Adj | Ngữ pháp: 不 | Phó từ phủ định 不 |
| `HSK1-G03` | HSK 1 | S + 没(有) + N/V | Ngữ pháp: 没(有) | Phó từ phủ định 没(有) |
| `HSK2-G05` | HSK 2 | 比 (Câu so sánh) | Ngữ pháp: 比字句 | Câu so sánh chữ 比 (A 比 B + Adj) |
| `HSK2-G12` | HSK 2 | 正在 ... 呢 | Ngữ pháp: 正在 | Cấu trúc biểu thị hành động đang diễn ra (正在) |
| `HSK3-G14` | HSK 3 | 把字句 (Câu chữ 把) | Ngữ pháp: 把 | Câu chữ 把 cơ bản (S + 把 + O + V + Thành phần khác) |
| `HSK3-G25` | HSK 3 | 被字句 (Câu chữ 被) | Ngữ pháp: 被 | Câu bị động chữ 被 (S + 被 + Tác nhân + V) |
| `HSK4-G10` | HSK 4 | 不仅……而且…… | Ngữ pháp: 不仅 | Liên từ tăng tiến: Không những... mà còn... |
| `HSK4-G45` | HSK 4 | 只要……就…… | Ngữ pháp: 只要 | Liên từ điều kiện: Chỉ cần... thì... |
| `HSK4-G78` | HSK 4 | 哪怕……也…… | Ngữ pháp: 哪怕 | Liên từ giả thiết nhượng bộ: Cho dù... cũng... |

Hiện tại: **0/311 điểm ngữ pháp còn bắt đầu bằng tiền tố `Ngữ pháp: `**. 100% điểm ngữ pháp đã có tên gọi sư phạm tiếng Việt rõ ràng.

---

## 3. CẤU TRÚC DỮ LIỆU ĐIỂM NGỮ PHÁP ĐẠT CHUẨN

Mỗi điểm ngữ pháp trong `data/hsk20/staging/hsk20_grammar_standard.json` đều đáp ứng đầy đủ các trường bắt buộc theo schema:

```json
{
  "id": "HSK1-G01",
  "level": 1,
  "title": "Câu chữ 是 (biểu thị phán đoán, khẳng định)",
  "structure": "Chủ ngữ + 是 + Tân ngữ / Danh từ",
  "explanationVi": "Dùng để biểu thị sự phán đoán, xác nhận thân phận, tính chất hoặc quan hệ tương đương giữa chủ ngữ và tân ngữ.",
  "examples": [
    {
      "hanzi": "我是学生。",
      "pinyin": "Wǒ shì xuésheng.",
      "meaningVi": "Tôi là học sinh."
    },
    {
      "hanzi": "他是中国人。",
      "pinyin": "Tā shì zhōngguó rén.",
      "meaningVi": "Anh ấy là người Trung Quốc."
    },
    {
      "hanzi": "这是我的书。",
      "pinyin": "Zhè shì wǒ de shū.",
      "meaningVi": "Đây là sách của tôi."
    }
  ],
  "verificationStatus": "VERIFIED_BY_AUTOMATED_RULES",
  "reviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF"
}
```

Tiêu chuẩn đã được kiểm chứng bởi test suite `POS-1.5`:
- Đầy đủ trường `structure` và `explanationVi`: 311/311 điểm.
- Tối thiểu 3 câu ví dụ có đủ chữ Hán, Pinyin và nghĩa tiếng Việt: 311/311 điểm.
- Tiêu đề dịch chuẩn tiếng Việt: 311/311 điểm.
- Không tồn tại bài học HSK 4A hay HSK 4B riêng rẽ; toàn bộ 120 điểm HSK 4 thuộc về cấp độ HSK 4 duy nhất.

---

## 4. KẾT LUẬN

Tập dữ liệu ngữ pháp HSK 2.0 gồm 311 mục đã được làm sạch, chuẩn hóa sư phạm và hoàn toàn sẵn sàng cho việc ánh xạ vào 70 bài học tương ứng trong hệ thống giảng dạy của ZhongWenHub.
