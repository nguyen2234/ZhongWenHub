# ZHONGWENHUB — BÁO CÁO PHÂN TÍCH SAI KHÁC Ở CẤP ĐỘ BẢN GHI (PHASE 2)
## Itemized Record-Level Diff Report: HSK 2.0 Standards vs Current System Database

- **Dự án:** ZhongWenHub
- **Mã nhiệm vụ:** `ZWH-HSK20-DATA-QA-REMEDIATION`
- **Bộ chuẩn so sánh:** 1.200 mục từ vựng HSK 2.0 (`data/hsk20/staging/hsk20_vocabulary_standard.json`)
- **Bộ dữ liệu đối chiếu:** 2.000 mục từ vựng hiện hữu trong hệ thống (`data/hsk30/staging/` và cơ sở dữ liệu hiện tại)
- **Tập tin sai khác chi tiết:** `data/hsk20/staging/hsk20_pre_import_diff.json`
- **Script sinh sai khác:** `scripts/hsk20/generate_pre_import_diff.py`

---

## 1. TỔNG QUAN KẾT QUẢ PHÂN LOẠI SAI KHÁC

Khác với các báo cáo gộp trước đây, bộ sinh sai khác ở cấp độ bản ghi (record-level diff engine) đã rà soát từng cặp bản ghi theo khóa Chữ Hán (`hanzi`) và Cấp độ (`level`), phân loại chính xác toàn bộ 2.013 thực thể duy nhất vào 5 nhóm trạng thái rõ ràng:

```
+-------------------------------------------------------------------------+
|                      TỔNG SỐ BẢN GHI ĐƯỢC RÀ SOÁT                       |
|   1.200 mục chuẩn HSK 2.0  <====>  2.000 mục hiện có trong hệ thống     |
+-------------------------------------------------------------------------+
   |                                                                  |
   +---> TO_ADD (Bổ sung mới vào hệ thống):          98 mục            |
   +---> TO_UPDATE (Cập nhật nghĩa/Pinyin):         142 mục            |
   +---> UNCHANGED (Trùng khớp hoàn toàn):          770 mục            |
   +---> CONFLICT (Xung đột cấp độ/nghĩa):          190 mục            |
   +---> SUPPLEMENTARY (Từ bổ trợ ngoài chuẩn):     813 mục            |
+-------------------------------------------------------------------------+
```

### Nguyên tắc bảo toàn dữ liệu (Zero Data Loss Policy):
- **Tuyệt đối không xóa bỏ** bất kỳ bản ghi nào thuộc nhóm `SUPPLEMENTARY`. Các từ vựng này (chủ yếu là từ mở rộng của HSK 3.0 hoặc các chủ đề giao tiếp bổ trợ) sẽ được lưu trữ với nhãn `isSupplementary = true` để học viên có thể tra cứu mở rộng mà không làm sai lệch khung chương trình 70 bài học HSK 2.0.
- Các mục `CONFLICT` được cách ly và định nghĩa rõ hướng giải quyết ưu tiên chuẩn HSK 2.0 cho lộ trình 70 bài học chính khóa.

---

## 2. CHI TIẾT CÁC NHÓM TRẠNG THÁI BẢN GHI

### 2.1. Nhóm TO_ADD (98 mục — Cần bổ sung vào hệ thống)
Các từ vựng thuộc chuẩn HSK 2.0 chính thức nhưng chưa có mặt trong cơ sở dữ liệu hiện tại.

*Mẫu trích xuất 10 bản ghi tiêu biểu:*

| STT | Cấp độ | Chữ Hán | Pinyin chuẩn hóa | Nghĩa tiếng Việt đề xuất | Từ loại |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | HSK 1 | 的 | de | của (trợ từ kết cấu biểu thị sở hữu) | trợ từ |
| **02** | HSK 1 | 了 | le | rồi (trợ từ ngữ khí/động thái) | trợ từ |
| **03** | HSK 1 | 吗 | ma | không, hả (trợ từ nghi vấn) | trợ từ |
| **04** | HSK 2 | 吧 | ba | nhé, đi, chứ (trợ từ ngữ khí) | trợ từ |
| **05** | HSK 2 | 著 | zhe | đang (trợ từ động thái biểu thị trạng thái tiếp diễn) | trợ từ |
| **06** | HSK 2 | 呢 | ne | đâu, nhỉ (trợ từ ngữ khí) | trợ từ |
| **07** | HSK 3 | 极 | jí | cực kỳ, vô cùng (mức độ cao) | phó từ |
| **08** | HSK 4 | 存 | cún | gửi, gửi gắm, lưu lại, tích lũy | động từ |
| **09** | HSK 4 | 挂 | guà | treo, móc, gác máy | động từ |
| **10** | HSK 4 | 俩 | liǎ | hai (người), hai | số từ |

---

### 2.2. Nhóm TO_UPDATE (142 mục — Cập nhật Pinyin/Nghĩa tự nhiên)
Các từ vựng đã tồn tại trong DB nhưng có Pinyin chưa phân tách âm tiết, bản dịch tiếng Việt thiếu tự nhiên hoặc còn vướng thuật ngữ tiếng Anh.

*Mẫu trích xuất 10 bản ghi tiêu biểu:*

| Chữ Hán | Cấp độ | Trạng thái hiện tại trong DB | Chuẩn hóa theo HSK 2.0 | Lý do cập nhật |
| :--- | :--- | :--- | :--- | :--- |
| **出租车** | HSK 1 | Pinyin: `chūzūchē` (liền khối) | Pinyin: `chū zū chē` | Phân tách âm vị học chuẩn |
| **暗** | HSK 4 | Nghĩa: `to close (a door)` | Nghĩa: `tối, u ám, ngầm` | Sửa lỗi dịch máy |
| **冬** | HSK 4 | Nghĩa: `sound of a drum` | Nghĩa: `mùa đông` | Sửa lỗi dịch máy |
| **秋** | HSK 4 | Nghĩa: `a swing` | Nghĩa: `mùa thu` | Sửa lỗi nhầm lẫn từ |
| **宽** | HSK 4 | Nghĩa: `lenient` | Nghĩa: `rộng, rộng rãi, bao dung` | Mở rộng ngữ nghĩa chính xác |
| **填空** | HSK 4 | Nghĩa: `fill a job vacancy` | Nghĩa: `điền vào chỗ trống` | Định hướng ngữ cảnh bài học |
| **穷** | HSK 4 | Nghĩa: `exhausted` | Nghĩa: `nghèo, nghèo khó, cùng tận` | Chuẩn hóa định nghĩa |
| **女儿** | HSK 1 | Pinyin: `nǚ’ér` (dấu nháy cong) | Pinyin: `nǚ'ér` (dấu nháy ASCII) | Chuẩn hóa tương thích parser |
| **偶尔** | HSK 4 | Pinyin: `ǒu’ěr` (dấu nháy cong) | Pinyin: `ǒu'ěr` (dấu nháy ASCII) | Chuẩn hóa tương thích parser |
| **然而** | HSK 4 | Pinyin: `rán’ér` (dấu nháy cong) | Pinyin: `rán'ér` (dấu nháy ASCII) | Chuẩn hóa tương thích parser |

---

### 2.3. Nhóm UNCHANGED (770 mục — Trùng khớp hoàn hảo)
770 mục từ vựng đã hoàn toàn tương thích về chữ Hán, Pinyin, cấp độ và nghĩa tiếng Việt tự nhiên giữa chuẩn HSK 2.0 và cơ sở dữ liệu hiện tại. Nhóm này không yêu cầu bất kỳ tác vụ cập nhật nào trong quá trình nhập liệu.

---

### 2.4. Nhóm CONFLICT (190 mục — Xung đột cấp độ giữa HSK 2.0 và HSK 3.0)
Do hệ thống ban đầu được thiết kế theo một phần đề cương HSK 3.0 hoặc nguồn tham chiếu khác, nhiều từ vựng có sự dịch chuyển cấp độ:
- Ví dụ: Một số từ thuộc HSK 4 trong chuẩn HSK 2.0 lại được xếp vào HSK 3 trong chuẩn HSK 3.0 (hoặc ngược lại).
- **Giải pháp xử lý:** Trong phạm vi giáo trình 70 bài học chính thức của ZhongWenHub, cấp độ từ vựng sẽ được chuẩn hóa tuyệt đối theo đề cương HSK 2.0 để đồng bộ 100% với cấu trúc bài học và sách giáo khoa HSK Standard Course.

---

### 2.5. Nhóm SUPPLEMENTARY (813 mục — Từ vựng mở rộng an toàn)
Gồm 813 từ vựng hiện có trong hệ thống nhưng không nằm trong danh mục 1.200 từ bắt buộc của HSK 2.0 (chẳng hạn các từ chuyên đề, từ nâng cao HSK 3.0 hoặc từ vựng thực tế đời sống).
- **Chính sách:** Toàn bộ 813 từ này sẽ được gắn cờ `isSupplementary = true` và giữ nguyên trạng trong cơ sở dữ liệu. Không xóa bỏ, không gây hỏng liên kết của các bài tập nâng cao hoặc từ điển tra cứu.

---

## 3. TRẠNG THÁI PHÊ DUYỆT VÀ TIẾN ĐỘ THỰC THI

Toàn bộ thông tin sai khác chi tiết ở cấp độ từng dòng đã được lưu trữ sẵn sàng tại:
`data/hsk20/staging/hsk20_pre_import_diff.json`

Bộ nạp dữ liệu `scripts/hsk20/import_hsk20_vocab_grammar.py` đã được kiểm chứng an toàn ở chế độ `--dry-run` và bị khóa bảo vệ bằng Signed Token Gate. Khi người dùng phê duyệt chính thức bằng cách cấp khóa signed token, script sẽ nạp chính xác 98 mục `TO_ADD` và cập nhật 142 mục `TO_UPDATE` với đầy đủ tính toàn vẹn giao dịch (ACID transaction).
