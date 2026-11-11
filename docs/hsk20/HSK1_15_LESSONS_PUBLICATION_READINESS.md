# BÁO CÁO MỨC ĐỘ SẴN SÀNG XUẤT BẢN 15 BÀI HỌC HSK 1 (HSK 2.0)

**Task ID:** `ZWH-HSK1-PUBLISH-15-LESSONS-AND-EXAM-REPOSITORY`  
**Ngày kiểm tra:** `2026-11-11`  
**Phạm vi kiểm tra:** Read-only SQL audit trên `ZhongWenHub_Test`, đối chiếu tham chiếu `ZhongWenHub_Dev`, chuẩn HSK 2.0 (`data/hsk20/staging/hsk20_curriculum_mapping_70_lessons.json`), và live Backend API (`http://localhost:5000`).  
**Quy tắc trung thực:** Không ghi dữ liệu vào database khi chưa có phê duyệt tường minh (`USER_APPROVAL_TOKEN.signed`). Chỉ ghi nhận trạng thái thực tế quan sát được.

---

## 1. Tóm tắt hiện trạng thực tế trên `ZhongWenHub_Test`

| Chỉ số | Giá trị thực tế | Ghi chú |
|---|---:|---|
| Tổng số bài học HSK 1 (`Giáo trình Chuẩn HSK 1`) | **15** | Bài 1 – Bài 15 |
| Bài đang `PUBLISHED` trên Student API | **3** | Bài 1, Bài 2, Bài 3 (`GET /api/v1/content/lessons?hskLevel=1` trả về đúng 3 bài) |
| Bài đạt 100% 5 release gate & đã `PUBLISHED` | **1** | Bài 1 (`你好`, `V=6, G=6, E=3, Dlg=4, Lst=1`) |
| Bài đang `PUBLISHED` nhưng dưới chuẩn từ vựng (`V < 5`) | **2** | Bài 2 (`V=3`) và Bài 3 (`V=3`) |
| Bài đang `DRAFT` và `BLOCKED` | **12** | Bài 4 – Bài 15 (`V=0` liên kết tới bài học) |
| Từ vựng HSK 1 trong bảng `vocabularies` | **303** | **291** từ chưa gắn `LessonId` (`LessonId IS NULL`), chỉ 12 từ đã gắn Bài 1–3 |
| Trạng thái Units 3–6 | **DRAFT** | Unit 1–2 đang `PUBLISHED`, Unit 3–6 đang `DRAFT` |

*(Ghi chú tham chiếu trên `ZhongWenHub_Dev`: Bài 1–3 `PUBLISHED`; Bài 4–15 đang `DRAFT` nhưng đã liên kết 18–23 từ vựng/bài nên thuộc trạng thái `READY_TO_PUBLISH` về mặt học liệu. Tuy nhiên GUID Bài 5–15 giữa `ZhongWenHub_Dev` và `ZhongWenHub_Test` khác nhau và không tự động đồng bộ khi chưa có token phê duyệt.)*

---

## 2. Bảng rà soát chi tiết 15/15 bài HSK 1 (`ZhongWenHub_Test`)

| # | Lesson ID (`ZhongWenHub_Test`) | Tiêu đề (Zh / Vi) | Unit & Status | Trạng thái DB | V | G (`Pub`) | E | Dlg | Lst | Readiness | Lý do chặn / Lưu ý |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|---|---|
| 1 | `AAAAAAAA-1111-1111-1111-111111111111` | 你好 / Chào bạn | U1 (`PUBLISHED`) | `PUBLISHED` | 6 | 6 (`1`) | 3 | 4 | 1 | `PUBLISHED` | Đạt đủ 5 release gate |
| 2 | `AAAAAAAA-2222-2222-2222-222222222222` | 谢谢你 / Cảm ơn bạn | U1 (`PUBLISHED`) | `PUBLISHED` | 3 | 5 (`0`) | 4 | 4 | 1 | `BLOCKED` (Gate warning) | Đã publish trước đó nhưng `VocabCount=3 (< 5)` |
| 3 | `AAAAAAAA-3333-3333-3333-333333333333` | 你叫什么名字 / Bạn tên là gì | U2 (`PUBLISHED`) | `PUBLISHED` | 3 | 6 (`1`) | 3 | 4 | 1 | `BLOCKED` (Gate warning) | Đã publish trước đó nhưng `VocabCount=3 (< 5)` |
| 4 | `AAAAAAAA-4444-4444-4444-444444444444` | 他是我的汉语老师 / ... `(Bản thảo)` | U2 (`PUBLISHED`) | `DRAFT` | 0 | 5 (`0`) | 4 | 4 | 1 | `BLOCKED` | `VocabCount=0 (< 5)`, tiêu đề còn chữ `(Bản thảo)` |
| 5 | `9C981888-67BD-41BB-B5B0-57D0A1268DD6` | 我想喝茶 / Tôi muốn uống trà | U3 (`DRAFT`) | `DRAFT` | 0 | 5 (`0`) | 4 | 4 | 1 | `BLOCKED` | `VocabCount=0 (< 5)`, Unit 3 đang `DRAFT` |
| 6 | `BC8E2F7F-91CD-4014-8BC4-BF4AEE182E41` | 你在做什么呢 / Bạn đang làm gì thế | U3 (`DRAFT`) | `DRAFT` | 0 | 5 (`0`) | 4 | 4 | 1 | `BLOCKED` | `VocabCount=0 (< 5)`, Unit 3 đang `DRAFT` |
| 7 | `F6AC147D-5091-4495-B018-A935385F4B87` | 今天星期几 / Hôm nay là thứ mấy | U3 (`DRAFT`) | `DRAFT` | 0 | 5 (`0`) | 5 | 4 | 1 | `BLOCKED` | `VocabCount=0 (< 5)`, Unit 3 đang `DRAFT` |
| 8 | `778CF4E8-1BDD-4C63-8352-C9DB74CFAA70` | 明天天气怎么样 / Thời tiết ngày mai thế nào | U4 (`DRAFT`) | `DRAFT` | 0 | 5 (`0`) | 4 | 4 | 1 | `BLOCKED` | `VocabCount=0 (< 5)`, Unit 4 đang `DRAFT` |
| 9 | `775BEE30-1000-4623-AC03-50DEC5A6BD58` | 现在几点 / Bây giờ là mấy giờ | U4 (`DRAFT`) | `DRAFT` | 0 | 5 (`0`) | 4 | 4 | 1 | `BLOCKED` | `VocabCount=0 (< 5)`, Unit 4 đang `DRAFT` |
| 10 | `EA11A07D-2642-4D98-B3FD-588CC8CB7BFE` | 我星期一去北京 / Thứ hai tôi đi Bắc Kinh | U4 (`DRAFT`) | `DRAFT` | 0 | 5 (`0`) | 4 | 4 | 1 | `BLOCKED` | `VocabCount=0 (< 5)`, Unit 4 đang `DRAFT` |
| 11 | `64363C63-96DB-4695-8E4E-79A9547F8E71` | 这个苹果多少钱 / Quả táo này bao nhiêu tiền | U5 (`DRAFT`) | `DRAFT` | 0 | 4 (`0`) | 4 | 4 | 1 | `BLOCKED` | `VocabCount=0 (< 5)`, Unit 5 đang `DRAFT` |
| 12 | `5879091F-51C4-4985-B63B-6BDFC004D6E6` | 你去哪儿买东西 / Bạn đi đâu mua đồ | U5 (`DRAFT`) | `DRAFT` | 0 | 4 (`0`) | 4 | 4 | 1 | `BLOCKED` | `VocabCount=0 (< 5)`, Unit 5 đang `DRAFT` |
| 13 | `C1A616F0-FFE9-485D-8E5A-301EE014730A` | 他在学校前面 / Anh ấy ở phía trước trường học | U5 (`DRAFT`) | `DRAFT` | 0 | 4 (`0`) | 4 | 4 | 1 | `BLOCKED` | `VocabCount=0 (< 5)`, Unit 5 đang `DRAFT` |
| 14 | `ACE8837E-E67D-4CF7-9EC3-625A16EC3B8F` | 你会开车吗 / Bạn biết lái xe không | U6 (`DRAFT`) | `DRAFT` | 0 | 4 (`0`) | 4 | 4 | 1 | `BLOCKED` | `VocabCount=0 (< 5)`, Unit 6 đang `DRAFT` |
| 15 | `9F74EEE4-2746-4EFC-A1F2-3402079AB3EF` | 我是坐飞机来的 / Tôi đến bằng máy bay | U6 (`DRAFT`) | `DRAFT` | 0 | 4 (`0`) | 5 | 4 | 1 | `BLOCKED` | `VocabCount=0 (< 5)`, Unit 6 đang `DRAFT` |

---

## 3. Công cụ kiểm duyệt & xuất bản đã bổ sung trong mã nguồn

1. **Backend (`ContentService` & `ContentController`):**
   - Tách logic chuẩn hóa thành static `ContentService.EvaluateLessonReleaseReadiness` & `ContentService.ValidateLessonPublishTransition`.
   - Thêm API `GET /api/v1/content/lessons/readiness?hskLevel={1..6}` (`[Authorize(Policy = PolicyConstants.ContentManagementAccess)]`) trả về `CoursePublicationReadinessDto` đầy đủ thống kê & lý do `BLOCKED` cho từng bài.
   - Thêm API `POST /api/v1/content/lessons/batch-review` để gửi duyệt hoặc phê duyệt hàng loạt, nhưng vẫn chặn tuyệt đối bài `BLOCKED`, bài chưa qua `PENDING_REVIEW`, và hành vi tự duyệt (`UpdatedByUserId == ReviewedByUserId`).
2. **Frontend (`AdminCurriculumPage.tsx` & `curriculum.service.ts`):**
   - Nút **"Kiểm duyệt xuất bản HSK X"** ngay trên trang `Giáo trình`, hiển thị trực quan trạng thái `PUBLISHED`, `READY_TO_PUBLISH`, `PENDING_REVIEW`, `BLOCKED` cùng danh sách `blockerReasons` của từng bài, hỗ trợ gửi duyệt & xuất bản hàng loạt sau khi có dữ liệu hợp lệ.

## 4. Điều kiện cần để xuất bản 15/15 bài HSK 1 trên môi trường DB

1. Có `USER_APPROVAL_TOKEN.signed` cho phép cập nhật dữ liệu trên `ZhongWenHub_Test` theo chuẩn HSK 2.0 đã staging (`data/hsk20/staging/hsk20_vocab_hsk1.json`).
2. Liên kết đủ `>= 5` từ vựng HSK 2.0 đã kiểm nghĩa Việt cho Bài 2, Bài 3 và Bài 4–15 (từ 291 từ vựng HSK 1 hiện chưa gắn `LessonId` hoặc import chuẩn HSK 2.0), gỡ hậu tố `"(Bản thảo)"` ở tiêu đề Bài 4, đồng bộ trạng thái `PUBLISHED` cho Grammar Points và Units 3–6.
3. Thực thi đúng 2 bước bởi 2 tài khoản khác nhau: người biên tập gửi `PENDING_REVIEW` -> người kiểm duyệt khác phê duyệt `PUBLISHED`.
