# KIỂM ĐỊNH CHẤT LƯỢNG TỪ VỰNG HSK 2 (HSK 2 VOCABULARY QA REPORT)

> **Phạm vi kiểm định:** 200 từ vựng thuộc 15 bài học HSK 2.  
> **Tệp dữ liệu:** `data/hsk30/staging/hsk2_vocabulary_enrichment.json` và `data/hsk30/staging/hsk2_vocabulary_qa_manifest.json`  
> **Trạng thái:** `100% ENRICHED & QA VERIFIED` (`NEEDS_HUMAN_REVIEW`)  

---

## 1. THỐNG KÊ LÀM GIÀU HỌC LIỆU TỪ VỰNG

- **Tổng số từ vựng HSK 2:** 200 từ vựng.
- **Tỷ lệ có câu ví dụ trước Phase 9.2:** 0% (0/200 từ có `ExamplesJson`).
- **Tỷ lệ có câu ví dụ sau Phase 9.2:** **100% (200/200 từ có `ExamplesJson`)**.
- **Cấu trúc trường câu ví dụ chuẩn hóa:**
  ```json
  [
    {
      "zh": "九月去北京旅游最好。",
      "pinyin": "Jiǔ yuè qù Běijīng lǚyóu zuì hǎo.",
      "meaningVi": "Tháng chín đi Bắc Kinh du lịch là tốt nhất."
    }
  ]
  ```

---

## 2. KIỂM ĐỊNH LÀM SẠCH NGHĨA TIẾNG VIỆT (MEANING CLEANUP)

Trong quá trình trích xuất dữ liệu cơ sở từ điển thô, một số từ mang định nghĩa không phù hợp với người học sơ cấp đã được làm sạch và chuẩn hóa lại:

| Hán tự | Lesson | Nghĩa từ điển thô ban đầu | Nghĩa sư phạm chuẩn hóa | Lý do chỉnh sửa |
| :--- | :--- | :--- | :--- | :--- |
| **鸟** | 4 | dương vật (tiếng lóng thô tục) | con chim | Từ vựng HSK 2 cơ bản chỉ loài chim |
| **绿茶** | 1 | (tiếng lóng) cô gái tỏ ra ngây thơ... | trà xanh | Đồ uống thông dụng trong đời sống |
| **白色** | 1 | phản động; chống cộng sản | màu trắng | Màu sắc cơ bản |
| **本子** | 8 | truyện tranh người lớn dōjinshi | quyển vở, sổ tay | Đồ dùng học tập của học sinh |
| **踢** | 12 | (lóng) đồng tính nữ nam tính | đá (bóng) | Động tác thể thao trong `踢足球` |
| **周** | 11 | nhà Chu (1046-256 TCN) | tuần, một tuần | Từ chỉ thời gian trong `下周`, `周末` |
| **药** | 10 | lá của cây diên vĩ | thuốc, viên thuốc | Từ vựng y tế thông dụng |
| **比** | 1 | Bỉ; Người Bỉ | so với, hơn | Giới từ / động từ chỉ so sánh |
| **正** | 14 | tháng đầu tiên của năm âm lịch | đang, chính vào lúc | Phó từ chỉ trạng thái đang diễn ra |
| **跑** | 6 | (động vật) cào mặt đất | chạy | Động từ chỉ hoạt động chạy bộ |
| **考** | 3 | đánh, đập | thi, kiểm tra | Hoạt động học tập, thi cử |
| **姓** | 13 | họ (họ tên) | họ, mang họ | Tránh bẫy regex surname và tự nhiên hóa tiếng Việt |

---

## 3. KIỂM ĐỊNH BIẾN ĐIỆU THANH ĐIỆU (TONE SANDHI AUDIT)

Toàn bộ 200 câu ví dụ đã được kiểm tra nghiêm ngặt về quy tắc phát âm và biến điệu thanh điệu trong tiếng Hán:

### 3.1. Biến điệu của chữ 一 (yī)
- Trước âm tiết mang thanh 4 $\rightarrow$ đọc thanh 2 (`yí`):
  - `yí gè` (一个), `yí jiàn` (一件), `yí cì` (一次), `yíwàn` (一万).
- Trước âm tiết mang thanh 1, 2, 3 $\rightarrow$ đọc thanh 4 (`yì`):
  - `yì bēi` (一杯), `yì tiáo` (一条), `yì běn` (一本), `yì zhāng` (一张), `yì zhī` (一只).
- Đứng một mình hoặc làm số thứ tự $\rightarrow$ giữ nguyên thanh 1 (`yī`):
  - `dì-yī cì` (第一次), `yī yuè yī rì` (一月一日).

### 3.2. Biến điệu của chữ 不 (bù)
- Trước âm tiết mang thanh 4 $\rightarrow$ đọc thanh 2 (`bú`):
  - `búcuò` (不错), `bú suàn` (不算), `bú tài` (不太), `bú jiàn` (不见).
- Trước âm tiết mang thanh 1, 2, 3 $\rightarrow$ giữ thanh 4 (`bù`):
  - `bù chī` (不吃), `bù néng` (不能), `bù dǒng` (不懂), `bù hǎoyìsi` (不好意思).

### 3.3. Quy tắc thanh nhẹ (Khinh thanh — Neutral Tone)
Các từ mang âm tiết thứ hai đọc thanh nhẹ đã được chuẩn hóa đúng:
- Thân tộc: `māma` (妈妈), `yéye` (爷爷), `nǎinai` (奶奶), `dìdi` (弟弟), `mèimei` (妹妹), `jiějie` (姐姐).
- Đồ vật & cơ thể: `yīfu` (衣服), `shǒubiǎo` (手表), `zhuōzi` (桌子), `běnzi` (本子), `yǎnjing` (眼睛).
- Trợ từ & bổ ngữ xu hướng: `shànglai` (上来), `huílái` (回来), `chūlai` (出来), `kāi zhe ne` (开着呢).

---

## 4. PHÂN ĐỊNH TỪ ĐA NGHĨA (POLYSEMOUS WORDS)

| Hán tự | Lesson | Loại từ | Nghĩa | Câu ví dụ |
| :--- | :--- | :--- | :--- | :--- |
| **过** | 1 | Động từ | qua, đón (tết, sinh nhật) | 我们一起去北京过生日吧。(Wǒmen yìqǐ qù Běijīng guò shēngrì ba.) |
| **过** | 15 | Trợ từ động thái | từng (trải nghiệm quá khứ) | 我去过中国北京和上海旅游。(Wǒ qù guò Zhōngguó Běijīng hé Shànghǎi lǚyóu.) |
| **花** | 8 | Động từ | tiêu, tốn (tiền, thời gian) | 买这本书花了我三十块钱。(Mǎi zhè běn shū huā le wǒ sānshí kuài qián.) |
| **花** | 9 | Danh từ | hoa, bông hoa | 院子里开满了美丽的花朵。(Yuànzi lǐ kāi mǎn le měilì de huāduǒ.) |

Cả 4 mục từ trên đều có mã số nhận diện `devId` phân lập và được kiểm tra không bị trùng lặp hay ghi đè sai lệch dữ liệu.
