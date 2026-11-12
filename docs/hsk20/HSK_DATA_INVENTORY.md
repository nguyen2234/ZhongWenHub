# ZhongWenHub — Báo cáo Kiểm kê Dữ liệu HSK 1–4 (HSK 2.0)

- **Ngày kiểm kê:** 2026-11-12
- **Cơ sở dữ liệu:** `ZhongWenHub_Dev` (chỉ đọc, chưa ghi thay đổi Giai đoạn C/D)
- **Chuẩn kiểm tra:** [`docs/hsk20/HSK_DATA_STANDARD.md`](./HSK_DATA_STANDARD.md) & [`scripts/hsk20/validate_hsk20_data.py`](../../scripts/hsk20/validate_hsk20_data.py)

---

## 1. Tổng quan toàn bộ Database (`ZhongWenHub_Dev`)

| Hạng mục | Toàn bộ DB (HSK 1–6) | Phạm vi HSK 1–4 (HSK 2.0) | Ghi chú |
|---|---:|---:|---|
| Khóa học (`dbo.courses`) | 6 | 4 | HSK 1–4 `PUBLISHED`; HSK 5–6 `DRAFT` |
| Bài học (`dbo.lessons`) | 140 | 70 | HSK 1 (15), HSK 2 (15), HSK 3 (20), HSK 4 (20) |
| Từ vựng (`dbo.vocabularies`) | 5688 | 1199 | Đã bao gồm liên kết `dbo.lesson_vocabularies` |
| Ngữ pháp (`dbo.grammar_points`) | 601 | 146 | Đều có `ExamplesJson` hợp lệ |
| Hội thoại (`DialogueJson.lines`) | — | 70 / 70 | 100% bài HSK 1–4 có hội thoại |
| Bài đọc (`DialogueJson.readingPassage`) | — | 70 / 70 | 100% có `readingPassage`, nhưng mới 1/70 có `sentences[]` |
| Bài nghe (`ListeningJson`) | — | 70 / 70 | 100% có bài nghe và transcript |
| Bài tập (`dbo.exercises`) | 5269 | 3003 | 100% `OptionsJson` & `CorrectOptionIndex` hợp lệ |
| Đề thi (`dbo.exams`) | 0 | 0 | Bảng `dbo.exams` hiện chưa có bản ghi |

---

## 2. Tỷ lệ hoàn thiện theo từng cấp HSK (1–4)

| Cấp HSK | Số bài | Từ vựng | Ngữ pháp | Bài tập | `Dialogue` | `ReadingPassage` | `sentences[]` | `questionPinyin` | `optionsPinyin[]` | `optionsVi[]` | `Listening` | Lỗi dữ liệu | Chưa duyệt học thuật |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **HSK 1** | 15 | 150 | 36 | 425 | 15/15 | 15/15 | 1/15 | 7/15 | 1/15 | 1/15 | 15/15 | 0 | 9/15 |
| **HSK 2** | 15 | 150 | 30 | 579 | 15/15 | 15/15 | 0/15 | 0/15 | 0/15 | 0/15 | 15/15 | 0 | 15/15 |
| **HSK 3** | 20 | 298 | 40 | 907 | 20/20 | 20/20 | 0/20 | 0/20 | 0/20 | 0/20 | 20/20 | 0 | 20/20 |
| **HSK 4** | 20 | 601 | 40 | 1092 | 20/20 | 20/20 | 0/20 | 0/20 | 0/20 | 0/20 | 20/20 | 0 | 20/20 |
| **Tổng HSK 1–4** | **70** | **1199** | **146** | **3003** | **70/70 (100%)** | **70/70 (100%)** | **1/70 (1.4%)** | **7/70 (10.0%)** | **1/70 (1.4%)** | **1/70 (1.4%)** | **70/70 (100%)** | **0** | **64/70 (91.4%)** |

---

## 3. Phân tích các nhóm vấn đề

### 3.1. Nội dung thiếu (so với chuẩn Giai đoạn 3)
- `readingPassage.sentences[]`: thiếu ở **69/70** bài (mới hoàn thiện HSK 1 Bài 1).
- `comprehensionQuestions[].questionPinyin`: thiếu ở **63/70** bài (HSK 1 đã có ở 7/15 bài; HSK 2–4 chưa có ở 55/55 bài).
- `comprehensionQuestions[].optionsPinyin[]`: thiếu ở **69/70** bài.
- `comprehensionQuestions[].optionsVi[]`: thiếu ở **69/70** bài.
- `dbo.exams`: hiện có `0` bản ghi.

### 3.2. Nội dung trùng lặp
- Trùng `LessonNumber` trong cùng khóa HSK 1–4: **0**.
- Trùng `(HskLevel, Hanzi)` trong `dbo.vocabularies` (đa âm/đa nghĩa): **9** cặp:
  - HSK 2: `花` (2 bản ghi)
  - HSK 4: `等` (2 bản ghi)
  - HSK 4: `空` (2 bản ghi)
  - HSK 2: `过` (2 bản ghi)
  - HSK 4: `重` (2 bản ghi)
  - HSK 4: `对` (2 bản ghi)
  - HSK 3: `得` (2 bản ghi)
  - HSK 4: `生` (2 bản ghi)
  - HSK 4: `过` (2 bản ghi)

### 3.3. Dữ liệu không hợp lệ
- JSON hỏng (`DialogueJson`, `ListeningJson`, `OptionsJson`, `ExamplesJson`): **0/70 bài**.
- `correctIndex` / `CorrectOptionIndex` ngoài phạm vi hoặc sai `lessonId`: **0/70 bài**.

### 3.4. Nguồn đối chiếu & Dữ liệu AI-generated chưa duyệt học thuật
- **Nguồn có đối chiếu trong repo (`data/hsk20/sources/source_verification_manifest.json`):** 12 nguồn từ vựng (`plaktos`, `drkameleon`) và ngữ pháp (`allset_grammar`) đều ở trạng thái `VERIFIED`.
- **Nội dung chưa có nguồn giáo trình gốc trong repo để đối chiếu:** các đoạn đọc hiểu (`readingPassage`), hội thoại mở rộng và bài nghe bổ sung cho ứng dụng không nằm trong bộ file nguồn CSV/JSON mã nguồn mở nói trên.
- **Dữ liệu AI-generated cần kiểm duyệt học thuật (`academicApproved = false`):** **64/70 bài** theo `data/hsk20/staging/HSK14_HUMAN_REVIEW_MANIFEST.json` (HSK 1: 9 bài phần `readingPassage`; HSK 2: 15 bài; HSK 3: 20 bài; HSK 4: 20 bài).

---

## 4. Báo cáo chất lượng từng bài (70 bài HSK 1–4)

| HSK | Bài | LessonId | Tiêu đề | Vocab | Grammar | Exercise | `sentences[]` | AI Unreviewed | Trạng thái chất lượng | Thiếu chính |
|---:|---:|---|---|---:|---:|---:|:---:|:---:|---|---|
| 1 | 1 | `AAAAAAAA-1111-1111-1111-111111111111` | 你好 (Chào bạn) | 10 | 3 | 28 | Có | Có | `STRUCTURALLY_VALID_UNREVIEWED` | — |
| 1 | 2 | `AAAAAAAA-2222-2222-2222-222222222222` | 谢谢你 (Cảm ơn bạn) | 9 | 2 | 28 | Thiếu | Không | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 1 | 3 | `AAAAAAAA-3333-3333-3333-333333333333` | 你叫什么名字 (Bạn tên là gì) | 8 | 3 | 30 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 1 | 4 | `AAAAAAAA-4444-4444-4444-444444444444` | 他是我的汉语老师 (Thầy ấy là giáo viên tiếng Trung của tôi) | 14 | 2 | 35 | Thiếu | Không | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 1 | 5 | `AEF87F0A-6E86-4C8F-9DC5-D1D810944443` | 我想喝茶 (Tôi muốn uống trà) | 12 | 3 | 30 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 1 | 6 | `500CD93C-8E0E-460A-8DEA-B6C5EDBB3ACF` | 你在做什么呢 (Bạn đang làm gì thế) | 12 | 3 | 25 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 1 | 7 | `4EE4EDB7-7F40-4484-9C27-D69DB03F0358` | 今天星期几 (Hôm nay là thứ mấy) | 12 | 2 | 36 | Thiếu | Không | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 1 | 8 | `9493A5D5-A5E6-4254-975E-2519B46E010C` | 明天天气怎么样 (Thời tiết ngày mai thế nào) | 13 | 3 | 31 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 1 | 9 | `9E5E372F-1364-4B71-A77F-B88ED7941C4C` | 现在几点 (Bây giờ là mấy giờ) | 10 | 2 | 26 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 1 | 10 | `F16768F3-EB8F-4954-BB67-A9BEA0B74DB0` | 我星期一去北京 (Thứ hai tôi đi Bắc Kinh) | 12 | 2 | 29 | Thiếu | Không | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 1 | 11 | `33CE9B58-BC67-475C-A655-F70C3CF3580C` | 这个苹果多少钱 (Quả táo này bao nhiêu tiền) | 12 | 2 | 28 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 1 | 12 | `8AE4343A-2121-40B2-B9B5-9DC3566C0100` | 你去哪儿买东西 (Bạn đi đâu mua đồ) | 6 | 2 | 20 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 1 | 13 | `B24B8ED2-34D9-468A-8560-778F5640828E` | 他在学校前面 (Anh ấy ở phía trước trường học) | 8 | 2 | 28 | Thiếu | Không | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 1 | 14 | `A08E673D-438F-48AB-9214-EF9D75C421BB` | 你会开车吗 (Bạn biết lái xe không) | 6 | 3 | 29 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 1 | 15 | `E41DF40E-B099-4EA1-A42F-1D41B916AEB3` | 我是坐飞机来的 (Tôi đến bằng máy bay) | 6 | 2 | 22 | Thiếu | Không | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 2 | 1 | `2B2E8F9F-5A36-4D48-93F7-D3B4B7721A20` | 九月去北京旅游最好 (Đi du lịch Bắc Kinh vào tháng 9 là tốt nhất) | 10 | 2 | 45 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 2 | 2 | `EE4D51D3-970D-49CE-A5CE-71838476A0AA` | 我每天六点起床 (Mỗi ngày tôi thức dậy lúc 6 giờ) | 10 | 2 | 42 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 2 | 3 | `DA05939E-2EB8-4FB5-8BF0-C56F94BA1D49` | 左边那个红色的是我的 (Cái màu đỏ bên trái là của tôi) | 10 | 2 | 36 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 2 | 4 | `4C1994F7-8C8E-44DA-B44F-220B99220E2C` | 这个工作是他帮我介绍的 (Công việc này là anh ấy giới thiệu cho tôi) | 10 | 2 | 30 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 2 | 5 | `67A524EB-567B-432F-A20E-51CC45295315` | 就买这件吧 (Mua chiếc áo này đi) | 10 | 2 | 39 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 2 | 6 | `2B47764A-970D-4644-8B15-1A2023E8EBD7` | 你怎么不吃了 (Sao bạn không ăn nữa) | 10 | 2 | 40 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 2 | 7 | `90125803-4D98-4AA9-B8A7-6D0E449D5CEA` | 你家离公司远吗 (Nhà bạn cách công ty xa không) | 10 | 2 | 44 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 2 | 8 | `7EE75472-A9EA-4FC9-82D2-4943DE5F092C` | 让我想想再告诉你 (Để tôi suy nghĩ rồi nói cho bạn biết nhé) | 10 | 2 | 38 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 2 | 9 | `896C5922-ACD0-46A0-A8C6-FF0084FDA3E0` | 题太多，我没做完 (Đề thi nhiều quá, tôi chưa làm xong) | 10 | 2 | 34 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 2 | 10 | `F80EF720-0B1D-4929-BB38-C4DE81790E97` | 别找了，手机在桌子上呢 (Đừng tìm nữa, điện thoại ở trên bàn kìa) | 10 | 2 | 40 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 2 | 11 | `9125E361-621A-46AD-B478-EDAD86D09781` | 他比我大三岁 (Anh ấy lớn hơn tôi ba tuổi) | 10 | 2 | 35 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 2 | 12 | `C2FA623D-7D28-4133-A720-5F8311ACAC79` | 你穿得太少了 (Bạn mặc ít áo quá) | 10 | 2 | 38 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 2 | 13 | `D3847A02-6793-40FA-9242-EF5CFC0289A5` | 门开着呢 (Cửa đang mở đấy) | 10 | 2 | 44 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 2 | 14 | `FB061E7A-1BC0-4B58-8C8A-EE22CC9492BE` | 你看过那个电影没有 (Bạn từng xem bộ phim đó chưa) | 10 | 2 | 37 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 2 | 15 | `44A558F0-28F7-4841-9227-F5A0BD877B19` | 新年就要到了 (Năm mới sắp đến rồi) | 10 | 2 | 37 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 1 | `A3F16DFB-1B7A-4C1C-AB9A-5B2D05FD80B1` | 周末你有什么打算 (Cuối tuần bạn có dự định gì) | 15 | 2 | 39 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 2 | `C97575AC-F25A-499C-8601-EBD6747FF52D` | 他什么时候回来 (Khi nào anh ấy quay lại) | 15 | 2 | 49 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 3 | `0FEFE9CA-245E-45F3-8FA9-5053B331C998` | 桌子上放着一杯咖啡 (Trên bàn có đặt một tách cà phê) | 15 | 2 | 46 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 4 | `0E6CA629-E92F-4D96-9D74-D450E930B58B` | 她总是笑着跟客人说话 (Cô ấy luôn mỉm cười khi nói chuyện với khách) | 15 | 2 | 46 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 5 | `650FC23F-5311-45D4-BDE0-8059DAD8C251` | 我最近越来越胖了 (Dạo này tôi ngày càng béo lên rồi) | 15 | 2 | 47 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 6 | `9F423EFA-5D3A-4D09-B5DE-0AC145203A45` | 怎么突然找不到了 (Sao đột nhiên lại không tìm thấy) | 15 | 2 | 51 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 7 | `D73CB505-4FD0-4D1A-81D3-02E88D5AA2D0` | 我跟你一起去 (Tôi đi cùng với bạn) | 15 | 2 | 33 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 8 | `DEC92502-ED16-4F88-9F80-8B2E356DC993` | 你去哪儿我就去哪儿 (Bạn đi đâu tôi đi đó) | 15 | 2 | 43 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 9 | `DAD49A30-84B6-4641-8929-C8D525B9175A` | 她的汉语说得跟中国人一样好 (Tiếng Trung của cô ấy nói hay như người Trung Quốc) | 15 | 2 | 49 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 10 | `CF2E45C7-84E2-4129-83AF-4A2A6615FD80` | 数学比历史难多了 (Môn toán khó hơn môn lịch sử nhiều) | 15 | 2 | 46 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 11 | `73FDDAFC-5F89-4A80-B4A7-B9BF1AD102A4` | 别忘了把空调关了 (Đừng quên tắt máy điều hòa) | 15 | 2 | 41 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 12 | `6FBA74E0-A94D-4D3C-A987-75A1432BB55B` | 把重要的事写在本子上 (Hãy ghi những việc quan trọng vào sổ tay) | 15 | 2 | 43 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 13 | `DD5CAC43-AE95-4226-A296-7777C8A785FA` | 走得越快越好 (Đi càng nhanh càng tốt) | 15 | 2 | 48 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 14 | `951A4D76-DCCD-4C06-A2DF-ACBE3615E877` | 请把护照拿出来 (Xin hãy lấy hộ chiếu ra) | 15 | 2 | 48 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 15 | `9F8751E1-D310-4D9A-9E9C-FF0C34DE8D53` | 除了看书，他还喜欢运动 (Ngoài đọc sách ra, anh ấy còn thích thể thao) | 15 | 2 | 45 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 16 | `BDA80E0F-D05A-4594-97B2-C5F4B272747D` | 我现在累得不想动 (Bây giờ tôi mệt đến mức không muốn cử động) | 15 | 2 | 43 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 17 | `C02A7F9B-8B7F-471F-9E73-247BE5D6E8EC` | 谁都有生病的时候 (Ai cũng có lúc bị ốm) | 15 | 2 | 47 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 18 | `17ACC96F-D768-4F27-81D8-5DC1493A3A06` | 我相信你一定能做好 (Tôi tin bạn nhất định có thể làm tốt) | 15 | 2 | 54 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 19 | `684A70C9-FA02-4FA3-B99C-821A87D67185` | 你没看懂这篇文章吗 (Bạn chưa đọc hiểu bài viết này sao) | 14 | 2 | 43 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 3 | 20 | `69803450-EBF3-4691-82B9-F86BC73E30B9` | 只要努力就会有收获 (Chỉ cần nỗ lực thì sẽ gặt hái thành quả) | 14 | 2 | 46 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 1 | `6EB3F7E5-83BB-4BB7-8144-BE8439D4063A` | 简单的爱情 (Tình yêu giản dị) | 31 | 2 | 61 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 2 | `EBE10962-BF17-4930-8166-289289DD65B2` | 真正的朋友 (Người bạn chân chính) | 30 | 2 | 50 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 3 | `F6B22A4E-3BD1-4F9F-A890-B5A7C0D3A08A` | 一买即合 (Vừa nhìn là muốn mua ngay) | 30 | 2 | 54 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 4 | `B7B0CFA2-A68D-4B84-99B5-8F833AA28C4C` | 不要太在乎得失 (Đừng quá để tâm đến được mất) | 30 | 2 | 48 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 5 | `3776EC99-2EA7-4005-91D4-F514BCE86710` | 只买对的，不买贵的 (Chỉ mua đồ đúng, không mua đồ đắt) | 30 | 2 | 53 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 6 | `0A86DCF9-A894-4431-8F29-191D6A93DD52` | 一分钱一分货 (Tiền nào của nấy) | 30 | 2 | 49 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 7 | `340A8F19-A310-425B-AB52-0C6877F17B6C` | 最佳面试者 (Ứng viên phỏng vấn xuất sắc nhất) | 30 | 2 | 59 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 8 | `4B70B341-23F2-42A9-838A-2086FFE689A5` | 成功的秘密 (Bí quyết của sự thành công) | 30 | 2 | 54 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 9 | `83690C68-15DF-4A9D-875A-97CA23FDD850` | 阳光总在风雨后 (Ánh dương luôn rạng rỡ sau cơn mưa) | 30 | 2 | 51 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 10 | `A9E75E2D-6469-4472-B774-4A3ED6CB5121` | 幸福的标准 (Tiêu chuẩn của hạnh phúc) | 30 | 2 | 57 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 11 | `D1A9907E-4734-49C2-9F8A-4E2DBD286FE7` | 读书好，读好书 (Đọc sách tốt, đọc sách hay) | 30 | 2 | 55 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 12 | `8BA251C3-784B-4235-AFA3-B8B41D28B70F` | 用心发现美 (Dùng trái tim khám phá vẻ đẹp) | 30 | 2 | 63 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 13 | `227AFDAF-DA5C-431E-A82D-30FD5451E3DF` | 喝着茶看京剧 (Vừa uống trà vừa thưởng thức Kinh kịch) | 30 | 2 | 54 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 14 | `9BCE8F39-E483-4846-874B-A5A4F9A136F5` | 保护地球母亲 (Bảo vệ mẹ Trái Đất) | 30 | 2 | 48 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 15 | `CAD1FFDF-76A1-46E3-B3D9-35084C5BA139` | 教育孩子的艺术 (Nghệ thuật giáo dục con trẻ) | 30 | 2 | 48 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 16 | `DCCB7E43-12FA-4FCD-BE98-C11A21D006B6` | 文化交流的桥梁 (Nhịp cầu giao lưu văn hóa) | 30 | 2 | 53 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 17 | `54B43ADC-9959-4839-B6D1-CA9460D34655` | 科技改变生活 (Khoa học công nghệ thay đổi đời sống) | 30 | 2 | 67 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 18 | `DFC9EF62-0C15-4B46-9BC2-19DC2C0C5404` | 人与自然和谐相处 (Con người sống hài hòa với thiên nhiên) | 30 | 2 | 59 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 19 | `538114D5-65FA-4154-B9A9-87FB6940F0CB` | 旅行的真正意义 (Ý nghĩa thực sự của những chuyến đi) | 30 | 2 | 51 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |
| 4 | 20 | `2FADFA73-1A0F-4C8B-A556-30539D2A9B40` | 展望未来的世界 (Hướng tới thế giới tương lai) | 30 | 2 | 58 | Thiếu | Có | `MISSING_CONTENT` | readingPassage.sentences[], comprehensionQuestions.questionPinyin, comprehensionQuestions.optionsPinyin[], comprehensionQuestions.optionsVi[] |

---

## 5. Phương án cập nhật SQL Server theo từng đợt (dự kiến cho Giai đoạn C & D)

- **Đợt 1:** HSK 1 — Bài 2–15 (`14` bài) — bổ sung `sentences[]`, `questionPinyin`, `optionsPinyin[]`, `optionsVi[]` từ chính nội dung hiện có.
- **Đợt 2:** HSK 2 — Bài 1–15 (`15` bài).
- **Đợt 3:** HSK 3 — Bài 1–20 (`20` bài).
- **Đợt 4:** HSK 4 — Bài 1–20 (`20` bài).
- **Nguyên tắc mỗi đợt:** sao lưu `DialogueJson` nguyên trạng → sinh SQL `UPDATE` trong transaction có `ISJSON` & `@@ROWCOUNT` → chuẩn bị script rollback tương ứng → không đặt `academicApproved = true` khi chưa có chuyên gia duyệt → chạy validator + API integration + Playwright E2E nghiệm thu sau từng đợt.
