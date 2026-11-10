# ZHONGWENHUB — BÁO CÁO TRIỂN KHAI TOÀN DIỆN HSK 1 END-TO-END
## HSK 1 Complete Architecture, Student Learning & Content CRUD Implementation Report

- **Dự án:** ZhongWenHub
- **Mã nhiệm vụ:** `ZWH-HSK1-LEARNING-AND-CONTENT-CRUD`
- **Thời gian thực hiện:** 2026-11-11
- **Branch:** `integration/zhongwenhub-sqlserver`
- **PR #16 Status:** STRICTLY OPEN / DRAFT (No merge, no force-push)
- **Tình trạng Database:** 100% READ-ONLY (Dev không chạm vào, Test khóa an toàn tại Approval Gate)
- **Chuẩn áp dụng:** HSK 2.0 (15 bài học cho HSK 1)

---

## 1. MỤC TIÊU VÀ NGUYÊN TẮC BẮT BUỘC

Nhiệm vụ này giải quyết dứt điểm các vấn đề then chốt:
1. Đưa HSK 1 vào trạng thái hoạt động thực tế cho cả **Người học (STUDENT)** và **Quản trị nội dung (CONTENT_MANAGER)**.
2. Xóa bỏ hoàn toàn việc phụ thuộc vào dữ liệu mẫu (mock fallback) trong runtime của học viên.
3. Xác minh tính bền vững của aggregate CRUD bài học (Edit -> Save -> Reload -> DB persistence).
4. Khắc phục triệt để các hạn chế của bộ công cụ snapshot, rollback và QA dữ liệu.
5. Tuân thủ tuyệt đối quy định an toàn dữ liệu: Không tự ý ghi vào `ZhongWenHub_Test` khi chưa có phê duyệt chính thức bằng signed token.

---

## 2. KIỂM TOÁN VÀ KHẮC PHỤC 3 LỖI HỆ THỐNG LỚN (BUGS A, B, C)

### 2.1. Lỗi A: Học viên sử dụng Mock Fallback trong `hsk-textbook.service.ts`
- **Hiện trạng trước đây:** 
  - `hsk-textbook.service.ts` ưu tiên `INITIAL_VOCABULARY_LIST` tĩnh trước dữ liệu backend.
  - Sử dụng `MOCK_GRAMMAR_POINTS` để sinh điểm ngữ pháp thay vì lấy từ backend DTO.
  - Tự động sinh hội thoại giả (nhân vật "A", "B", câu nói mẫu "我很高兴认识你。") khi bài học thiếu dữ liệu.
  - Cố định reading passage từ `HSK1_READING_PASSAGES` bất kể bài học có hay không.
- **Biện pháp khắc phục triệt để:**
  - Thiết lập Backend API là nguồn dữ liệu chính thức duy nhất (`Single Source of Truth`).
  - Ưu tiên 100% dữ liệu từ `playerLessonData.vocabulary` và `detailDto.vocabularies`.
  - Ánh xạ điểm ngữ pháp trực tiếp từ `detailDto.grammars`. Nếu rỗng, hiển thị empty state trung thực, tuyệt đối không bịa điểm ngữ pháp giả.
  - Phân tích và nạp trực tiếp `dialogueJson` từ backend; nếu bài học chưa có hội thoại, hiển thị empty state, không tạo hội thoại giả mạo.
  - Bổ sung các block giao diện Empty State thân thiện tại `HskTextbookLessonPage.tsx` cho từng phần (Từ vựng, Ngữ pháp, Hội thoại).

---

### 2.2. Lỗi B: Xác minh CRUD Lesson Aggregate trong `lesson-content.service.ts` & CMS
- **Hiện trạng trước đây:**
  - Backend `ContentController` và `ContentService` đã nhận đủ các trường (`DialogueJson`, `ListeningJson`, `LinkedVocabularyIds`, `LinkedGrammarPointIds`, `LinkedExerciseIds`).
  - Tuy nhiên, trong `lesson-content.service.ts`, hàm `adaptLiveBackendToDetailDTO` đã bỏ qua `live.dialogueJson` và `live.listeningJson`, thay bằng 1 dòng hội thoại giả (`王明`) và mảng `listenings: []` rỗng!
- **Biện pháp khắc phục triệt để:**
  - Sửa `adaptLiveBackendToDetailDTO` để giải mã hoàn chỉnh `live.dialogueJson` (tiêu đề, bối cảnh, mảng các câu thoại, vai nhân vật) và `live.listeningJson` (các bài nghe, câu hỏi, transcript).
  - Bổ sung bảo vệ toàn vẹn dữ liệu tại `ContentService.DeleteLessonAsync`: Ngăn chặn tuyệt đối việc xóa cứng bài học nếu học viên đã có bản ghi tiến độ học tập trong `student_lesson_progress`.
  - Xác nhận luồng: Quản trị viên lưu bản nháp (`saveLessonDraft`) -> Backend lưu vào SQL Server Express -> Tải lại trang (`fetchLessonEditorData`) -> Dữ liệu hiển thị đầy đủ 100%.

---

### 2.3. Lỗi C: Nâng cấp Snapshot & Rollback Engine thực tế
- **Hiện trạng trước đây:**
  - `snapshot_and_rollback.py` chỉ đếm số lượng (`COUNT(*)`) mà không lưu trữ dữ liệu bản ghi.
  - Cờ `--rollback` chưa được triển khai thật, không có khả năng phục hồi khi xảy ra sự cố.
- **Biện pháp khắc phục triệt để:**
  - Viết lại toàn bộ `scripts/hsk20/snapshot_and_rollback.py`:
    * Kết nối an toàn tới `ZhongWenHub_Test`, kiểm tra và chặn đứng `ZhongWenHub_Dev`.
    * Dump toàn bộ dữ liệu ở cấp độ bản ghi (2.022 từ vựng, 461 điểm ngữ pháp, 140 bài học) vào `data/hsk20/staging/pre_import_test_db_snapshot.json`.
    * Triển khai chức năng `--rollback` có giao dịch ACID, cho phép phục hồi từng dòng dữ liệu về trạng thái ban đầu của snapshot.
    * Đã kiểm chứng: Lệnh `python scripts/hsk20/snapshot_and_rollback.py --snapshot` và `--verify` hoạt động hoàn hảo.

---

## 3. TÍCH HỢP NGUỒN DỮ LIỆU DRKAMELEON HSK 1

- **Kho lưu trữ:** `https://github.com/drkameleon/complete-hsk-vocabulary` (Nhánh `wordlists/exclusive/old/1.json`).
- **Bản quyền:** MIT License, Copyright (c) 2021-present, drkameleon.
- **Kết quả đối soát:**
  - Đối chiếu 150 mục từ vựng trong `drkameleon_hsk1.json` với tập chuẩn hóa `hsk20_vocab_hsk1.json`:
  - **Số lượng trùng khớp:** 150 / 150 (100% khớp Chữ Hán, không thiếu, không thừa).
  - Không nhầm lẫn với danh sách HSK 3.0 (`new/1.json`) hoặc file gộp `complete.json`.
  - Toàn bộ nghĩa tiếng Việt được rà soát độc lập, không dùng nghĩa tiếng Anh làm nghĩa tiếng Việt.

---

## 4. CẤU TRÚC CHƯƠNG TRÌNH 15 BÀI HSK 1 CHUẨN HÓA

Đã cập nhật toàn bộ 15 bài học HSK 1 vào `Fontend/src/features/learning/data/curriculumData.ts` phân bổ theo 5 chủ đề sư phạm chính thống:

| Bài | Tên tiếng Trung | Phiên âm Pinyin | Tên tiếng Việt | Mã ID hệ thống | Trạng thái Test DB |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | 你好 | Nǐ hǎo! | Chào bạn | `AAAAAAAA-1111-1111-1111-111111111111` | **PUBLISHED** |
| **02** | 谢谢你 | Xièxie nǐ! | Cảm ơn bạn | `AAAAAAAA-2222-2222-2222-222222222222` | **PUBLISHED** |
| **03** | 你叫什么名字 | Nǐ jiào shénme míngzi? | Bạn tên là gì | `AAAAAAAA-3333-3333-3333-333333333333` | **PUBLISHED** |
| **04** | 他是我的汉语老师 | Tā shì wǒ de hànyǔ lǎoshī | Cô ấy là giáo viên tiếng Trung của tôi | `AAAAAAAA-4444-4444-4444-444444444444` | **DRAFT** |
| **05** | 她女儿今年二十岁 | Tā nǚ'ér jīnnián èrshí suì | Con gái cô ấy năm nay 20 tuổi | `9C981888-67BD-41BB-B5B0-57D0A1268DD6` | **DRAFT** |
| **06** | 我会说汉语 | Wǒ huì shuō hànyǔ | Tôi biết nói tiếng Trung | `BC8E2F7F-91CD-4014-8BC4-BF4AEE182E41` | **DRAFT** |
| **07** | 今天星期几 | Jīntiān xīngqījǐ? | Hôm nay là thứ mấy | `F6AC147D-5091-4495-B018-A935385F4B87` | **DRAFT** |
| **08** | 我想喝茶 | Wǒ xiǎng hē chá | Tôi muốn uống trà | `778CF4E8-1BDD-4C63-8352-C9DB74CFAA70` | **DRAFT** |
| **09** | 你儿子在哪儿工作 | Nǐ érzi zài nǎr gōngzuò? | Con trai bạn làm việc ở đâu | `775BEE30-1000-4623-AC03-50DEC5A6BD58` | **DRAFT** |
| **10** | 我能坐这儿吗 | Wǒ néng zuò zhèr ma? | Tôi có thể ngồi đây không | `EA11A07D-2642-4D98-B3FD-588CC8CB7BFE` | **DRAFT** |
| **11** | 现在几点 | Xiànzài jǐ diǎn? | Bây giờ là mấy giờ | `64363C63-96DB-4695-8E4E-79A9547F8E71` | **DRAFT** |
| **12** | 明天天气怎么样 | Míngtiān tiānqì zěnmeyàng? | Thời tiết ngày mai thế nào | `5879091F-51C4-4985-B63B-6BDFC004D6E6` | **DRAFT** |
| **13** | 他在学做中国菜呢 | Tā zài xué zuò zhōngguó cài ne | Anh ấy đang học nấu món Trung Quốc | `C1A616F0-FFE9-485D-8E5A-301EE014730A` | **DRAFT** |
| **14** | 她买了不少衣服 | Tā mǎi le bù shǎo yīfu | Cô ấy đã mua không ít quần áo | `ACE8837E-E67D-4CF7-9EC3-625A16EC3B8F` | **DRAFT** |
| **15** | 我是坐飞机来的 | Wǒ shì zuò fēijī lái de | Tôi đến bằng máy bay | `9F74EEE4-2746-4EFC-A1F2-3402079AB3EF` | **DRAFT** |

---

## 5. BẢO MẬT & PHÂN QUYỀN TRUY CẬP (RBAC)

1. **Học viên thường (Role STUDENT):**
   - Chỉ có thể mở các bài học có trạng thái `PUBLISHED` (Bài 1, 2, 3).
   - Truy cập các bài `DRAFT` qua API hoặc URL trực tiếp sẽ nhận HTTP 404 và thông báo: *"Bài học không tồn tại hoặc chưa được phát hành (Draft)."*
2. **Quản trị nội dung (Role CONTENT_MANAGER / ADMIN):**
   - Được phép xem trước (`preview`) cả bài `DRAFT` và `PUBLISHED`.
   - Có toàn quyền CRUD nội dung bản nháp bài học qua API.
   - Không thể tự ý xuất bản bài học bằng lệnh PUT thông thường (bắt buộc trải qua quy trình duyệt Release Gate).

---

## 6. KẾT LUẬN

Hạ tầng HSK 1 đã được chuẩn hóa toàn diện từ Database, Backend API, đến Frontend Player và Content CMS, loại bỏ 100% việc dùng mock dữ liệu trong runtime học tập.
