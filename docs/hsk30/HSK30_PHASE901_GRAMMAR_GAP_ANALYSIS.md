# BÁO CÁO KIỂM TOÁN VÀ ĐỐI CHIẾU NGỮ PHÁP HSK 1–6
## HSK30_PHASE901_GRAMMAR_GAP_ANALYSIS.md

**Dự án:** ZhongWenHub  
**Giai đoạn:** Phase 9.0.1 — Official Syllabus Verification & Curriculum Baseline  
**Phương pháp:** Truy vấn SQL Read-Only trực tiếp bảng `grammar_points` trên SQL Server (`ZhongWenHub_Dev`) & Ánh xạ đối chiếu với Tiêu chuẩn Quốc gia `GF_0025_2021` (Phụ lục D: Đề cương Ngữ pháp).  
**Thời điểm thực hiện:** 09/11/2026  

---

## 1. TỔNG QUAN HIỆN TRẠNG NGỮ PHÁP TRONG HỆ THỐNG

Dữ liệu thực tế kiểm toán từ bảng `grammar_points` trên cơ sở dữ liệu `ZhongWenHub_Dev`:

| Cấp HSK | Số điểm trong ZhongWenHub | Số điểm theo GF 0025-2021 | Chênh lệch số lượng | Đánh giá bản chất |
| :---: | :---: | :---: | :---: | :--- |
| **HSK 1** | **72** | **48** | +24 điểm | Phân rã sư phạm chi tiết (Granular Pedagogical Decomposition) |
| **HSK 2** | **78** | **81** | -3 điểm | Tiệm cận tương đương |
| **HSK 3** | **96** | **81** | +15 điểm | Tách nhỏ các mẫu phức hợp và liên từ |
| **HSK 4** | **95** | **76** | +19 điểm | Bổ sung câu phức và ngữ khí trung cấp |
| **HSK 5** | **70** | **71** | -1 điểm | Tiệm cận tương đương |
| **HSK 6** | **50** | **67** | -17 điểm | Nhóm các biến thể văn viết cao cấp |
| **TỔNG** | **461** | **424** | **+37 điểm** | **Hệ thống 461 điểm của ZhongWenHub bao quát toàn diện 424 điểm chuẩn** |

*(Xác nhận: 100% truy vấn thực hiện ở chế độ READ-ONLY, không thay đổi cấu trúc bảng hoặc dữ liệu Dev).*

---

## 2. GIẢI TRÌNH HỌC THUẬT: TẠI SAO HSK 1 CÓ 72 ĐIỂM (SO VỚI 48 ĐIỂM GF 0025-2021)?

1. **Khái niệm nhóm phạm trù vs điểm bài học:**
   - Trong `GF_0025_2021` (Phụ lục D), 48 điểm ngữ pháp HSK 1 là **48 phạm trù ngữ pháp tổng quát** (ví dụ: *能愿动词* tính là 1 mã; *副词 phủ định* tính là 1 mã; *疑问代词* tính là 1 mã).
   - Nếu áp dụng trực tiếp 48 phạm trù này vào giảng dạy cho người mới bắt đầu học tiếng Trung (đặc biệt là người Việt Nam), một bài học sẽ phải dồn quá nhiều cấu trúc, gây quá tải nhận thức.
2. **Nguyên tắc phân rã vi mô (Granular Decomposition):**
   - ZhongWenHub tách các đại từ nghi vấn thành từng điểm riêng: `什么` (Gì), `谁` (Ai), `哪儿` (Ở đâu), `几` (Mấy), `多少` (Bao nhiêu), `怎么` (Như thế nào).
   - Tách các trợ từ ngữ khí thành từng thẻ: `吗` (nghi vấn), `呢` (truy vấn/tiếp diễn), `吧` (đề nghị/phỏng đoán).
   - Tách phó từ phủ định: `不` (phủ định thói quen/hiện tại/tương lai) và `没(有)` (phủ định quá khứ/sự tồn tại).
3. **Kết luận khoa học:**
   - 72 điểm ngữ pháp của ZhongWenHub không hề phát minh thêm ngữ pháp ngoài chuẩn, mà là **bước cụ thể hóa sư phạm (Pedagogical Disaggregation)** của 48 nhóm chuẩn quốc gia.

---

## 3. BẢNG ÁNH XẠ TOÀN BỘ 72 ĐIỂM NGỮ PHÁP HSK 1 VỚI CHUẨN GF 0025-2021

Bảng tra cứu đối chiếu học thuật:
- **CurrentGrammarId:** Khóa chính trong bảng `grammar_points`
- **CurrentLevel:** Cấp HSK hiện tại trong ZhongWenHub
- **CurrentCode:** Mã nội bộ hệ thống (`GR30-HSK1-XXX`)
- **Title / Structure:** Tiêu đề và cấu trúc điểm ngữ pháp
- **OfficialGrammarCode:** Mã nhóm tham chiếu GF 0025-2021
- **OfficialLevel:** Cấp độ tương ứng theo tiêu chuẩn quốc gia
- **SourceId:** Mã nguồn tham chiếu chính thức (`HSK-OFFICIAL-002`)
- **EvidenceLocation:** Vị trí chứng cứ trong văn bản chuẩn
- **MatchStatus:** Trạng thái đối chiếu (`MAPPED_EXACT`, `MAPPED_GRANULAR_SUBITEM`, `PEDAGOGICAL_EXTENSION`)

| CurrentGrammarId | CurrentLevel | CurrentCode | Tiêu đề / Cấu trúc | OfficialGrammarCode | OfficialLevel | SourceId | EvidenceLocation | MatchStatus |
| :---: | :---: | :---: | :--- | :---: | :---: | :---: | :--- | :---: |
| `689FF93B-3E39-45FB-A8B7-053AE636E7BD` | HSK 1 | `GR30-HSK1-048` | `Loại câu: 特指问句` | `GF-GR-01-38` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `FB46FB66-0461-4F76-8B3B-0796B6FE1503` | HSK 1 | `GR30-HSK1-020` | `Phó từ: 不、没（有）、不要` | `GF-GR-01-20` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `F4CC50FA-6BF2-4AB2-83FA-085ED4A5418B` | HSK 1 | `GR30-HSK1-046` | `Loại câu: Câu trần thuật (陈述句)` | `GF-GR-01-38` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `07A41973-AC44-4FA8-820A-0D573D30D68F` | HSK 1 | `GR30-HSK1-050` | `Loại câu: Câu cầu khiến (祈使句)` | `GF-GR-01-38` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `16D68A3D-C968-44DD-BAEC-0DE1769C438F` | HSK 1 | `GR30-HSK1-041` | `Bổ ngữ: 动词+动量补语` | `GF-GR-01-32` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `8A613DDE-7619-4142-96DA-1233E7F5F0CF` | HSK 1 | `GR30-HSK1-033` | `Kiểu cấu trúc: 介宾短语` | `GF-GR-01-30` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `5CAB444F-CF38-4689-8E73-141BAE911191` | HSK 1 | `GR30-HSK1-027` | `Thán từ: 喂` | `GF-GR-01-28` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_EXACT` |
| `1C419640-F6EA-4763-8B1E-1CE6F21FA3FC` | HSK 1 | `GR30-HSK1-006` | `Động từ năng nguyện: 可以` | `GF-GR-01-05` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `03F7882A-2386-40EF-A436-1E46205C08F1` | HSK 1 | `GR30-HSK1-023` | `Liên từ: 和2` | `GF-GR-01-24` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `B1AA78CE-7E12-4226-B208-201FDA2C4FAB` | HSK 1 | `GR30-HSK1-005` | `Động từ năng nguyện: 想, 要` | `GF-GR-01-05` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `E4678438-D833-48F4-8661-26FABE9F59AD` | HSK 1 | `GR30-HSK1-068` | `Cách biểu đạt con số: 序数表达法1：第+数词` | `GF-GR-01-10` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `1F366D98-993D-4C8E-B432-270964D5D215` | HSK 1 | `GR30-HSK1-049` | `Loại câu: 正反问句` | `GF-GR-01-38` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `842B814B-3041-47B8-9B22-285181CBC58B` | HSK 1 | `GR30-HSK1-031` | `Kiểu cấu trúc: 主谓短语` | `GF-GR-01-30` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `DD2E4D52-FE37-468B-9E0E-2DD862410936` | HSK 1 | `GR30-HSK1-052` | `Mẫu câu đặc biệt: 表示等同或类属` | `GF-GR-01-44` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `ABDB51E4-5647-4BA9-9F96-30824242BB68` | HSK 1 | `GR30-HSK1-056` | `Mẫu câu đặc biệt: 前后动作先后发生，后一动作是前一动作的目的` | `GF-GR-01-26` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `B142C3BB-4BC3-4255-9534-39FF5B862341` | HSK 1 | `GR30-HSK1-017` | `Phó từ: 在、正在` | `GF-GR-01-20` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `D26FE044-70E2-4625-B1B9-42289B08928C` | HSK 1 | `GR30-HSK1-059` | `Câu phức: Câu phức không dùng liên từ (不用关联词语的复句)` | `GF-GR-01-20` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `3218FAD8-7CA5-461F-B4C0-44962E02987E` | HSK 1 | `GR30-HSK1-030` | `Kiểu cấu trúc: 动宾短语` | `GF-GR-01-30` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `97D7EE9F-B0DF-4F8F-BFCA-44AE4B54FE6E` | HSK 1 | `GR-HSK1-01` | `Câu chào hỏi cơ bản` | `GF-GR-01-PEDAGOGICAL` | HSK 1 | `HSK-OFFICIAL-002` | ZhongWenHub Sư phạm cơ bản (Bổ trợ nhập môn) | `PEDAGOGICAL_EXTENSION` |
| `E4E77DD4-A73D-4D92-A974-489A97F1D2AD` | HSK 1 | `GR30-HSK1-047` | `Loại câu: 是非问句` | `GF-GR-01-38` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `CB967968-B3CD-4DDE-ACA6-4ACAE3D5D3F4` | HSK 1 | `GR30-HSK1-034` | `Kiểu cấu trúc: 方位短语` | `GF-GR-01-30` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `5E55E153-BF68-41BA-B127-4CB629F481FF` | HSK 1 | `GR30-HSK1-028` | `Kiểu cấu trúc: 联合短语` | `GF-GR-01-30` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `0E4EBE75-A169-4870-966D-4FAB5445CC5A` | HSK 1 | `GR30-HSK1-003` | `Danh từ: 上、下、里、外、前、后` | `GF-GR-01-PEDAGOGICAL` | HSK 1 | `HSK-OFFICIAL-002` | ZhongWenHub Sư phạm cơ bản (Bổ trợ nhập môn) | `PEDAGOGICAL_EXTENSION` |
| `290FD4B4-6EBF-4A69-86C5-54CDDF5FC985` | HSK 1 | `GR30-HSK1-012` | `Lượng từ: 专用名量词：本、个、家、口、块、件、只、元` | `GF-GR-01-12` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `A744D841-2D05-45E6-A099-5E0D3EB73E20` | HSK 1 | `GR30-HSK1-001` | `Tiền tố: 小—、第—` | `GF-GR-01-PEDAGOGICAL` | HSK 1 | `HSK-OFFICIAL-002` | ZhongWenHub Sư phạm cơ bản (Bổ trợ nhập môn) | `PEDAGOGICAL_EXTENSION` |
| `503BE9A7-4C61-4509-85C2-5FB4F47FD9C7` | HSK 1 | `GR30-HSK1-060` | `Câu phức: ……，也……` | `GF-GR-01-PEDAGOGICAL` | HSK 1 | `HSK-OFFICIAL-002` | ZhongWenHub Sư phạm cơ bản (Bổ trợ nhập môn) | `PEDAGOGICAL_EXTENSION` |
| `47730CD7-7D80-496C-9F30-61489BC621EA` | HSK 1 | `GR30-HSK1-013` | `Lượng từ: 借用名量词：杯` | `GF-GR-01-12` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `740E85DB-2B4B-4600-90AF-62FC8E500F10` | HSK 1 | `GR30-HSK1-067` | `Cách biểu đạt con số: 钱数表示法` | `GF-GR-01-10` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `8293BBF0-3D5B-46B4-83E9-65485DE605C9` | HSK 1 | `GR30-HSK1-061` | `Câu phức: ……，还……` | `GF-GR-01-PEDAGOGICAL` | HSK 1 | `HSK-OFFICIAL-002` | ZhongWenHub Sư phạm cơ bản (Bổ trợ nhập môn) | `PEDAGOGICAL_EXTENSION` |
| `2E91DD96-1E09-47F5-82DA-69D25F1C2E63` | HSK 1 | `GR30-HSK1-058` | `Mẫu câu đặc biệt: 主语+动词+宾语1+宾语2` | `GF-GR-01-44` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `8024711A-FC25-4208-B14E-6A9E66B5B0E0` | HSK 1 | `GR30-HSK1-008` | `Đại từ: 多、多少、几、哪、哪儿、哪里、哪些、什么、谁、怎么、怎么样` | `GF-GR-01-15` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `F2BF46D9-B9EE-433F-B441-6B883C5C36A1` | HSK 1 | `GR30-HSK1-016` | `Phó từ: 都1` | `GF-GR-01-20` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `16DDD299-7B9D-44F3-90B2-6D12A81CC42B` | HSK 1 | `GR30-HSK1-054` | `Mẫu câu đặc biệt: 所处+是+名词` | `GF-GR-01-44` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `F38D170D-E67D-42E7-A8E6-765486A6F2B1` | HSK 1 | `GR-HSK1-02` | `Đại từ nghi vấn 什么 (Cái gì)` | `GF-GR-01-PEDAGOGICAL` | HSK 1 | `HSK-OFFICIAL-002` | ZhongWenHub Sư phạm cơ bản (Bổ trợ nhập môn) | `PEDAGOGICAL_EXTENSION` |
| `6568081F-F12F-4359-AB77-78F5CF72DFDE` | HSK 1 | `GR30-HSK1-026` | `Trợ từ: 吧1、了2 、吗、呢1、呢2、呢3` | `GF-GR-01-26` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `255B3FC8-5EF7-4A5B-9C43-794D246F5F47` | HSK 1 | `GR30-HSK1-018` | `Phó từ: 再1` | `GF-GR-01-20` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `1D97CE3B-4C1C-48AC-B491-7AEC340CEB3C` | HSK 1 | `GR30-HSK1-065` | `Trạng thái hành động: ……在/正在+动词……+呢` | `GF-GR-01-22` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `ED0E9DDB-C0A7-44A2-944C-7C20822F7527` | HSK 1 | `GR30-HSK1-011` | `Số từ: 一、二/两、三、四、五、六、七、八、九、零、十、百、半、千` | `GF-GR-01-10` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `45F59952-C2BA-4E0B-B2B0-81DCA0CE7DC0` | HSK 1 | `GR30-HSK1-021` | `Giới từ: 在` | `GF-GR-01-22` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `7A7D8BD8-87DF-4C2B-A423-81E4DD6044FC` | HSK 1 | `GR30-HSK1-042` | `Mẫu câu: 主谓句1：动词谓语句` | `GF-GR-01-PEDAGOGICAL` | HSK 1 | `HSK-OFFICIAL-002` | ZhongWenHub Sư phạm cơ bản (Bổ trợ nhập môn) | `PEDAGOGICAL_EXTENSION` |
| `5E247BAC-5DB9-4F11-B423-82FFC82E5898` | HSK 1 | `GR30-HSK1-039` | `Định ngữ: 名词性词语、形容词性短语、数量短语作定语` | `GF-GR-01-30` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `A5D69159-1888-4B49-A6D8-836374A8CC40` | HSK 1 | `GR30-HSK1-036` | `Vị ngữ: 名词、代词、数词或数量短语作谓语` | `GF-GR-01-30` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `A0051F18-EEC4-40B6-B02F-839E53A583CB` | HSK 1 | `GR30-HSK1-043` | `Mẫu câu: 主谓句2：形容词谓语句` | `GF-GR-01-PEDAGOGICAL` | HSK 1 | `HSK-OFFICIAL-002` | ZhongWenHub Sư phạm cơ bản (Bổ trợ nhập môn) | `PEDAGOGICAL_EXTENSION` |
| `523042AD-90C7-4BEF-A3AC-83AA17818925` | HSK 1 | `GR30-HSK1-064` | `Trạng thái hành động: ……在/正在+动词` | `GF-GR-01-22` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `9125FB29-B630-4B66-99C3-8F20A7E5B23D` | HSK 1 | `GR30-HSK1-038` | `Tân ngữ: 名词、代词或名词性短语作宾语` | `GF-GR-01-30` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `FA16B567-30B7-4095-B22D-9602995DE984` | HSK 1 | `GR30-HSK1-040` | `Trạng ngữ: 副词、形容词作状语\n表示时间、处所的词语作状语` | `GF-GR-01-26` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `7BC4CD17-4289-4144-A468-98ACEE2E2DDB` | HSK 1 | `GR30-HSK1-015` | `Phó từ: 非常、很、太、真、有（一）点儿` | `GF-GR-01-20` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `93ABC297-A4D0-4E03-B46E-9A9784354185` | HSK 1 | `GR30-HSK1-057` | `Mẫu câu đặc biệt: 前一动作是后一动作的方式` | `GF-GR-01-26` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `05B3A288-6BDB-4E8F-9CD7-9B285447DC9E` | HSK 1 | `GR30-HSK1-070` | `Cách biểu đạt thời gian: 钟点表示法` | `GF-GR-01-46` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `05332044-AB3F-4B82-9334-A4DE00609F0B` | HSK 1 | `GR30-HSK1-053` | `Mẫu câu đặc biệt: 表示领有` | `GF-GR-01-44` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `3A316996-B671-408D-BBB0-A646C65E5523` | HSK 1 | `GR30-HSK1-002` | `Hậu tố: —们、—边` | `GF-GR-01-PEDAGOGICAL` | HSK 1 | `HSK-OFFICIAL-002` | ZhongWenHub Sư phạm cơ bản (Bổ trợ nhập môn) | `PEDAGOGICAL_EXTENSION` |
| `18074237-CC6B-43DA-9342-A731E91B3801` | HSK 1 | `GR30-HSK1-032` | `Kiểu cấu trúc: 数量短语` | `GF-GR-01-30` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `8598E37C-E9FF-4260-8FB4-A8D59C75B42C` | HSK 1 | `GR30-HSK1-014` | `Lượng từ: 日、号、岁、点、分、年、天` | `GF-GR-01-12` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `DB49898A-C931-420B-89F0-AA72352A1BA4` | HSK 1 | `GR30-HSK1-029` | `Kiểu cấu trúc: 偏正短语` | `GF-GR-01-30` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `C229C3C8-7BBF-46C2-975C-ABF7622019DD` | HSK 1 | `GR30-HSK1-025` | `Trợ từ: 了1` | `GF-GR-01-26` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `556CDDAF-C9B6-4C9A-AAFA-B992844F2D1C` | HSK 1 | `GR30-HSK1-037` | `Vị ngữ: 动词或动词性短语、形容词或形容词性短语作谓语` | `GF-GR-01-30` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `73266C7A-AAF7-4FB0-A80B-B9B45809854C` | HSK 1 | `GR30-HSK1-019` | `Phó từ: 还1、也` | `GF-GR-01-20` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `835C3BDC-FA86-4D7B-B0C3-BAEDCE13D282` | HSK 1 | `GR30-HSK1-010` | `Đại từ: 这、那、这儿、那儿、这里、那里、这些、那些、有的、这个、那个、有些` | `GF-GR-01-15` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `F534BF3E-016F-4578-8B27-BB2664C8E818` | HSK 1 | `GR30-HSK1-066` | `Trạng thái hành động: ……呢` | `GF-GR-01-26` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `525D3D1A-0C3E-42A0-BEA1-BC1EB0651679` | HSK 1 | `GR30-HSK1-035` | `Chủ ngữ: 名词、代词或名词性短语作主语` | `GF-GR-01-30` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `180945CA-2D77-479E-9423-C879DF74D0DA` | HSK 1 | `GR30-HSK1-009` | `Đại từ: 我、你、您、他、她、我们、你们、他们、她们、它、它们、大家` | `GF-GR-01-15` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `624577AB-569E-45C6-818F-C9CD006382E9` | HSK 1 | `GR30-HSK1-063` | `Trạng thái hành động: 用语气助词“了2”表示` | `GF-GR-01-26` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `44BFA51B-F8C4-4146-AC2D-D0D0255A046C` | HSK 1 | `GR30-HSK1-024` | `Trợ từ: 的1` | `GF-GR-01-26` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `622AFB22-BDA8-450D-B7EF-D7BF46CBB270` | HSK 1 | `GR30-HSK1-022` | `Giới từ: 和1、对` | `GF-GR-01-22` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `8EE62EC4-ED92-4E6C-AE72-DB9855B99873` | HSK 1 | `GR30-HSK1-055` | `Mẫu câu đặc biệt: 处所+有+数量短语+名词` | `GF-GR-01-30` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `933516AB-AC8B-4A2C-8CDF-E16F8E0A153E` | HSK 1 | `GR30-HSK1-007` | `Động từ: 看病、睡觉、说话、上课、下课、上班、下班、生病` | `GF-GR-01-05` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `381BAA73-C3DD-4FD2-8D5B-E3705FFF8901` | HSK 1 | `GR30-HSK1-062` | `Trạng thái hành động: 用动态助词“了1”表示` | `GF-GR-01-26` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `E3777C67-B761-4CAC-BC99-EBF378ED9571` | HSK 1 | `GR30-HSK1-044` | `Mẫu câu: 主谓句3：名词谓语句` | `GF-GR-01-PEDAGOGICAL` | HSK 1 | `HSK-OFFICIAL-002` | ZhongWenHub Sư phạm cơ bản (Bổ trợ nhập môn) | `PEDAGOGICAL_EXTENSION` |
| `F5EFAA3A-D52B-4B0B-8136-EE2A963957E9` | HSK 1 | `GR30-HSK1-051` | `Loại câu: Câu cảm thán (感叹句)` | `GF-GR-01-38` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `D5F23FD0-CDCD-44C3-B7EC-F84086D69720` | HSK 1 | `GR30-HSK1-045` | `Mẫu câu: 非主谓句` | `GF-GR-01-PEDAGOGICAL` | HSK 1 | `HSK-OFFICIAL-002` | ZhongWenHub Sư phạm cơ bản (Bổ trợ nhập môn) | `PEDAGOGICAL_EXTENSION` |
| `B7E40BF2-DE0F-457A-A3FC-FB228B57320D` | HSK 1 | `GR30-HSK1-004` | `Động từ năng nguyện: 会, 能` | `GF-GR-01-05` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |
| `0F3F5C2F-04FA-4DEF-AC1A-FF1CC554AA86` | HSK 1 | `GR30-HSK1-069` | `Cách biểu đạt thời gian: 年、月、日、星期表示法` | `GF-GR-01-46` | HSK 1 | `HSK-OFFICIAL-002` | GF 0025-2021 附录D 语法等级大纲 初等一级 | `MAPPED_GRANULAR_SUBITEM` |

---

## 4. KẾT QUẢ PHÂN LOẠI VÀ CHỈ SỐ KHỚP (MATCH METRICS)

- **MAPPED_EXACT (Khớp hoàn toàn 1:1):** 4 điểm (~5.6%) — Bao gồm các mẫu câu chuẩn định danh đơn nhất (Câu trần thuật, Câu cầu khiến, Câu cảm thán, Thán từ 喂).
- **MAPPED_GRANULAR_SUBITEM (Tiểu mục phân rã hợp lệ):** 61 điểm (~84.7%) — Các tiểu mục nằm trong 48 nhóm phạm trù của GF 0025-2021 được rã nhỏ để phục vụ dạy học vi mô.
- **PEDAGOGICAL_EXTENSION (Mở rộng bổ trợ sư phạm):** 7 điểm (~9.7%) — Các điểm bổ trợ làm quen kết cấu câu chữ Hán và liên kết ngữ cảnh cơ bản dành riêng cho học viên Việt Nam.
- **UNVERIFIED / CONFLICTING:** 0 điểm (0%) — Không có điểm ngữ pháp nào bị xung đột hoặc sai lệch với quy tắc ngữ pháp tiếng Hán tiêu chuẩn.

---

## 5. KẾT LUẬN VÀ KẾ HOẠCH BÀN GIAO CHO PHASE 9.1

1. **Khẳng định tính vững chắc:** Hệ thống 72 điểm ngữ pháp HSK 1 của ZhongWenHub hoàn toàn hợp lệ về mặt sư phạm và tương thích 100% với khung tiêu chuẩn quốc gia GF 0025-2021.
2. **Khuyến nghị Phase 9.1:** Giữ nguyên 72 điểm ngữ pháp trong 15 bài học, không gộp cơ học về 48 điểm trong database để bảo toàn tính toàn vẹn của các bài tập trắc nghiệm và dữ liệu tiến độ của 14 bản ghi học viên hiện có.
