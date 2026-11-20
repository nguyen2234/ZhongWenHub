# BẢNG KIỂM TRA ĐIỀU KIỆN PHÁT HÀNH TOÀN DIỆN HSK 1
## HSK 3.0 LEVEL 1 — FINAL RELEASE GATE CHECKLIST & AUTHORIZATION DOSSIER
**Dự án**: ZhongWenHub — Hệ sinh thái Đào tạo Tiếng Trung Trực tuyến Chuẩn Quốc tế  
**Giai đoạn**: Phase 6 — HSK 1 Full Course Release Readiness  
**Mã tài liệu**: `HSK30_PHASE6_RELEASE_CHECKLIST`  
**Thời điểm lập bảng kiểm**: 22:55:00, ngày 08/11/2026  
**Cơ sở dữ liệu**: Microsoft SQL Server `localhost\SQLEXPRESS` (`ZhongWenHub_Dev` & `ZhongWenHub_Test`)  
**Thẩm quyền quyết định**: Trưởng ban Học thuật (Chief Academic Officer) & Ban Quản trị Hệ thống (Admin)  
**Tình trạng phát hành**: `RELEASE READY — AWAITING FORMAL PUBLISHING SIGN-OFF`

---

## 1. TỔNG HỢP CÁC CHỈ SỐ BÁO CÁO CỐT LÕI (CORE RELEASE METRICS)

Theo đúng yêu cầu của chỉ đạo kỹ thuật và tiêu chuẩn liêm chính học thuật, ZhongWenHub công bố chính xác các chỉ số phát hành thực tế của Khóa học HSK 1:

| Chỉ số phát hành cốt lõi | Số lượng thực tế | Tỷ lệ (%) | Hiện trạng kỹ thuật & Học thuật |
| :--- | :---: | :---: | :--- |
| **1. Tổng số bài học quy hoạch** | **15 bài** | **100%** | 6 Chương (Units), phân bổ từ sơ cấp nhập môn đến tổng kết năng lực HSK 1. |
| **2. Số bài sẵn sàng về mặt kỹ thuật & học liệu** | **15 bài** | **100%** | Đầy đủ 300 từ vựng, 72 điểm ngữ pháp, 28 bài tập, 30 tệp audio MP3 thật, bài khóa & câu hỏi nghe hiểu. |
| **3. Số bài đã được con người (chuyên gia) thẩm định** | **3 bài** | **20.0%** | **Bài 1, Bài 2, Bài 3** đã được Hội đồng Học thuật nghe duyệt thực tế và ký duyệt. |
| **4. Số bài đã chính thức xuất bản (`PUBLISHED`)** | **3 bài** | **20.0%** | **Bài 1, Bài 2, Bài 3** mang cờ `Status = 'PUBLISHED'` trong cơ sở dữ liệu `ZhongWenHub_Dev`. |
| **5. Số bài Học viên thực tế đang học được ngay** | **3 bài** | **20.0%** | Học viên học đầy đủ bài khóa, nghe audio MP3, luyện từ vựng, ngữ pháp, làm trắc nghiệm và lưu XP. |
| **6. Số bài bản thảo đang xếp hàng thẩm định** | **12 bài** | **80.0%** | **Bài 4 đến Bài 15** lưu an toàn ở trạng thái `DRAFT`, hiển thị "Đang biên soạn", chặn API 404 đối với học viên. |

---

## 2. BẢNG KIỂM TRA ĐIỀU KIỆN PHÁT HÀNH CHI TIẾT (RELEASE GATE CHECKLIST)

Bảng đối chiếu 15 bài học HSK 1 qua 7 cổng kiểm định chất lượng:

| Bài | Tên bài học | Tên tiếng Trung | Gate 1<br>Dialogue | Gate 2<br>Listening | Gate 3<br>Neural MP3 | Gate 4<br>Vocab DB | Gate 5<br>Grammar | Gate 6<br>Exercises | Gate 7<br>Human Sign-off | Trạng thái hiện tại |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | Chào bạn | 你好 | ĐẠT (4 câu) | ĐẠT (Response) | ĐẠT (2 tệp) | ĐẠT (23 từ) | ĐẠT (6 điểm) | ĐẠT (1 bài) | **ĐÃ DUYỆT** | **PUBLISHED (Học ngay)** |
| **2** | Cảm ơn bạn | 谢谢你 | ĐẠT (4 câu) | ĐẠT (Sequence) | ĐẠT (2 tệp) | ĐẠT (23 từ) | ĐẠT (5 điểm) | ĐẠT (2 bài) | **ĐÃ DUYỆT** | **PUBLISHED (Học ngay)** |
| **3** | Bạn tên là gì | 你叫什么名字 | ĐẠT (4 câu) | ĐẠT (Detail) | ĐẠT (2 tệp) | ĐẠT (22 từ) | ĐẠT (6 điểm) | ĐẠT (1 bài) | **ĐÃ DUYỆT** | **PUBLISHED (Học ngay)** |
| **4** | Thầy ấy là giáo viên tiếng Trung của tôi | 他是我的汉语老师 | ĐẠT (4 câu) | ĐẠT (Main Idea) | ĐẠT (2 tệp) | ĐẠT (19 từ) | ĐẠT (5 điểm) | ĐẠT (2 bài) | *Chờ thẩm định* | **DRAFT (Sẵn sàng duyệt)** |
| **5** | Tôi muốn uống trà | 我想喝茶 | ĐẠT (4 câu) | ĐẠT (Inference) | ĐẠT (2 tệp) | ĐẠT (19 từ) | ĐẠT (5 điểm) | ĐẠT (2 bài) | *Chờ thẩm định* | **DRAFT (Sẵn sàng duyệt)** |
| **6** | Bạn đang làm gì thế | 你在做什么呢 | ĐẠT (4 câu) | ĐẠT (Response) | ĐẠT (2 tệp) | ĐẠT (20 từ) | ĐẠT (5 điểm) | ĐẠT (2 bài) | *Chờ thẩm định* | **DRAFT (Sẵn sàng duyệt)** |
| **7** | Hôm nay là thứ mấy | 今天星期几 | ĐẠT (4 câu) | ĐẠT (Sequence) | ĐẠT (2 tệp) | ĐẠT (20 từ) | ĐẠT (5 điểm) | ĐẠT (2 bài) | *Chờ thẩm định* | **DRAFT (Sẵn sàng duyệt)** |
| **8** | Thời tiết ngày mai thế nào | 明天天气怎么样 | ĐẠT (4 câu) | ĐẠT (Detail) | ĐẠT (2 tệp) | ĐẠT (20 từ) | ĐẠT (5 điểm) | ĐẠT (2 bài) | *Chờ thẩm định* | **DRAFT (Sẵn sàng duyệt)** |
| **9** | Bây giờ là mấy giờ | 现在几点 | ĐẠT (4 câu) | ĐẠT (Main Idea) | ĐẠT (2 tệp) | ĐẠT (19 từ) | ĐẠT (5 điểm) | ĐẠT (2 bài) | *Chờ thẩm định* | **DRAFT (Sẵn sàng duyệt)** |
| **10** | Thứ hai tôi đi Bắc Kinh | 我星期一去北京 | ĐẠT (4 câu) | ĐẠT (Inference) | ĐẠT (2 tệp) | ĐẠT (18 từ) | ĐẠT (5 điểm) | ĐẠT (2 bài) | *Chờ thẩm định* | **DRAFT (Sẵn sàng duyệt)** |
| **11** | Quả táo này bao nhiêu tiền | 这个苹果多少钱 | ĐẠT (4 câu) | ĐẠT (Response) | ĐẠT (2 tệp) | ĐẠT (19 từ) | ĐẠT (4 điểm) | ĐẠT (2 bài) | *Chờ thẩm định* | **DRAFT (Sẵn sàng duyệt)** |
| **12** | Bạn đi đâu mua đồ | 你去哪儿买东西 | ĐẠT (4 câu) | ĐẠT (Sequence) | ĐẠT (2 tệp) | ĐẠT (20 từ) | ĐẠT (4 điểm) | ĐẠT (2 bài) | *Chờ thẩm định* | **DRAFT (Sẵn sàng duyệt)** |
| **13** | Anh ấy ở phía trước trường học | 他在学校前面 | ĐẠT (4 câu) | ĐẠT (Detail) | ĐẠT (2 tệp) | ĐẠT (20 từ) | ĐẠT (4 điểm) | ĐẠT (2 bài) | *Chờ thẩm định* | **DRAFT (Sẵn sàng duyệt)** |
| **14** | Bạn biết lái xe không | 你会开车吗 | ĐẠT (4 câu) | ĐẠT (Main Idea) | ĐẠT (2 tệp) | ĐẠT (19 từ) | ĐẠT (4 điểm) | ĐẠT (2 bài) | *Chờ thẩm định* | **DRAFT (Sẵn sàng duyệt)** |
| **15** | Tôi đến bằng máy bay | 我是坐飞机来的 | ĐẠT (4 câu) | ĐẠT (Inference) | ĐẠT (2 tệp) | ĐẠT (19 từ) | ĐẠT (4 điểm) | ĐẠT (2 bài) | *Chờ thẩm định* | **DRAFT (Sẵn sàng duyệt)** |

---

## 3. NHỮNG GÌ CÒN THIẾU ĐỂ PHÁT HÀNH TOÀN BỘ 15 BÀI HSK 1

Để đưa toàn bộ 15 bài học của HSK 1 vào trạng thái `PUBLISHED` cho tất cả học viên học tập, hệ thống còn thiếu **duy nhất 01 bước thủ tục học thuật**:

1. **Thẩm định nghe duyệt thực tế của Ban Cố vấn Học thuật (Academic Hearing & Review)**:
   - Chuyên gia tiếng Trung nghe kiểm âm 24 tệp MP3 của 12 bài bản thảo (Bài 4 đến Bài 15).
   - Rà soát câu từ hội thoại đảm bảo tính tự nhiên, gần gũi với người Việt học tiếng Trung.
   - Thao tác phê duyệt trên CMS để hệ thống ghi nhận:
     - `ReviewedByUserId`: Định danh GUID của chuyên gia thẩm định.
     - `ReviewedAt`: Mốc thời gian chính xác của lần duyệt.
     - `ReviewNotes`: Lời nhận xét sư phạm và đánh giá chất lượng.
2. **Kích hoạt phát hành đồng bộ (Batch Publishing Execution)**:
   - Khi chuyên gia hoàn tất ký duyệt 12 bài, thực hiện chuyển trạng thái bài học, từ vựng và ngữ pháp tương ứng sang `PUBLISHED`.

---

## 4. TUYÊN BỐ DỪNG Ở TRẠNG THÁI SẴN SÀNG & CHỜ QUYẾT ĐỊNH CỦA NGƯỜI CÓ THẨM QUYỀN

```
+===================================================================================+
|                      TUYÊN BỐ AN TOÀN VÀ LIÊM CHÍNH HỆ THỐNG                      |
+===================================================================================+
|                                                                                   |
|  Đội ngũ Kỹ thuật và Kiến trúc hệ thống ZhongWenHub:                             |
|                                                                                   |
|  1. XÁC NHẬN: Nền tảng kỹ thuật số, cơ sở dữ liệu, kho âm thanh MP3, bài tập và   |
|     phân quyền bảo mật đã sẵn sàng 100% cho toàn bộ 15 bài học HSK 1.             |
|                                                                                   |
|  2. CAM KẾT: TUYỆT ĐỐI KHÔNG TỰ ĐỘNG XUẤT BẢN 12 BÀI BẢN THẢO (L4–L15).            |
|     Hệ thống dừng chính xác ở trạng thái READY_FOR_EDITORIAL_REVIEW.             |
|                                                                                   |
|  3. CHỜ QUYẾT ĐỊNH: Việc kích hoạt phát hành toàn diện HSK 1 hoàn toàn thuộc về    |
|     quyết định chính thức của TRƯỞNG BAN HỌC THUẬT hoặc NGƯỜI CÓ THẨM QUYỀN       |
|     sau khi hoàn thành nghe duyệt thủ công trên giao diện CMS.                    |
|                                                                                   |
+===================================================================================+
```
