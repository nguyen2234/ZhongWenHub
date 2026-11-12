# ZHONGWENHUB — BÁO CÁO TRIỂN KHAI TOÀN DIỆN HSK 1 END-TO-END
## HSK 1 Complete Architecture, Student Learning & Content CRUD Implementation Report

- **Dự án:** ZhongWenHub
- **Mã nhiệm vụ:** `ZWH-HSK1-LEARNING-AND-CONTENT-CRUD`
- **Thời gian thực hiện:** 2026-11-11
- **Branch:** `integration/zhongwenhub-sqlserver`
- **PR #16 Status:** STRICTLY OPEN / DRAFT (No merge, no force-push)
- **Tình trạng Database:** `ZhongWenHub_Dev` 100% READ-ONLY (`3/15 PUBLISHED`); `ZhongWenHub_Test` khóa an toàn tại Approval Gate (`3/15 PUBLISHED`, `12/15 DRAFT`, `v=0` từ B4–B15); toàn bộ E2E đầy đủ 15/15 bài và kiểm thử rollback thực tế chạy trên bản sao cô lập `ZhongWenHub_Ephemeral_QA` rồi dọn sạch.
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

### 2.1. Lỗi A: Học viên sử dụng Mock Fallback trong `hsk-textbook.service.ts` và `lesson-content.service.ts`
- **Hiện trạng trước đây:** 
  - `hsk-textbook.service.ts` ưu tiên `INITIAL_VOCABULARY_LIST` tĩnh trước dữ liệu backend, dùng `MOCK_GRAMMAR_POINTS`, tự sinh hội thoại giả và gán cứng reading passage.
  - `lesson-content.service.ts` fallback ngầm về `MOCK_LESSON_8_DRAFT` / `lesson8Data` khi API gặp lỗi không phải 404, đồng thời trả metadata `HSK_3_0` / `'3.0'`.
- **Biện pháp khắc phục triệt để:**
  - Thiết lập Backend API là nguồn dữ liệu chính thức duy nhất (`Single Source of Truth`).
  - Trong `lesson-content.service.ts`: Thêm `isIsolatedTestRuntime()` — chỉ cho phép fallback trong test runner (`NODE_ENV === 'test'` / `Bun`); ở browser runtime, mọi lỗi API đều throw lỗi tiếng Việt rõ ràng để hiển thị Error State trung thực. Chuẩn hóa metadata sang `'HSK_2_0'` / `'2.0'` và bảo toàn `live.unitId` / `live.unitNumber`.
  - Ánh xạ từ vựng, điểm ngữ pháp (`detailDto.grammars`), `dialogueJson` trực tiếp từ Backend; nếu rỗng thì hiển thị Empty State trung thực tại `HskTextbookLessonPage.tsx`.

---

### 2.2. Lỗi B: Xác minh CRUD Lesson Aggregate, Chặn DRAFT & Chống Spoof XP
- **Hiện trạng trước đây:**
  - `adaptLiveBackendToDetailDTO` trong `lesson-content.service.ts` bỏ qua `live.dialogueJson` và `live.listeningJson`.
  - `LearningService` chưa chặn cập nhật tiến độ/hoàn thành trên bài `DRAFT` và tin tưởng `dto.XpEarned` / `dto.SessionXp` từ client.
  - `ContentService.DeleteLessonAsync` cần chuẩn hóa kiểm tra case-insensitive `LessonId`.
- **Biện pháp khắc phục triệt để:**
  - Giải mã hoàn chỉnh `live.dialogueJson` và `live.listeningJson` trong `adaptLiveBackendToDetailDTO`.
  - `ContentService.DeleteLessonAsync`: Kiểm tra `p.LessonId.ToLower() == idLower` (kể cả alias `les-1`), ngăn chặn xóa cứng bài học đã có tiến độ học viên trong `StudentLessonProgress`.
  - `LearningService.cs`: Bổ sung `EnsureLessonPublishedOrThrow`, `ResolveServerLessonXp`, `ResolvePracticeSessionXp`, `ResolveSrsSessionXp`; `ResolveAndValidateLessonIdAsync` yêu cầu `Lesson.Status == "PUBLISHED"` (ném `KeyNotFoundException` -> HTTP `404` cho `DRAFT`/`ARCHIVED`); `CompleteLessonAsync`, `RecordPracticeSessionAsync`, `CompleteSrsSessionAsync` bỏ qua mọi XP do client gửi lên và tính XP hoàn toàn phía server.
  - Xác nhận luồng: Quản trị viên lưu bản nháp (`saveLessonDraft`) -> Backend lưu vào SQL Server Express -> Tải lại trang (`fetchLessonEditorData`) -> Dữ liệu hiển thị đầy đủ 100%.

---

### 2.3. Lỗi C: Nâng cấp Snapshot & Rollback Engine Fail-Closed
- **Hiện trạng trước đây:**
  - `snapshot_and_rollback.py` bản cũ chỉ đếm `COUNT(*)`, không phục hồi `lessons`, và tồn tại đường dẫn dự phòng rỗng `FALLBACK_SCHEMA_SNAPSHOT` âm thầm vượt qua `--verify`.
- **Biện pháp khắc phục triệt để:**
  - Viết lại toàn bộ `scripts/hsk20/snapshot_and_rollback.py`:
    * Kết nối an toàn tới target DB (`validate_target_db_name`), chặn cứng `ZhongWenHub_Dev`.
    * Loại bỏ hoàn toàn `FALLBACK_SCHEMA_SNAPSHOT` (fail-closed); `verify_snapshot_payload` bắt buộc các mảng `vocabularies` (2.022), `grammarPoints` (461), `lessons` (140) đều khác rỗng.
    * Triển khai `--rollback` có giao dịch ACID phục hồi cả 3 bảng `lessons`, `vocabularies`, `grammar_points` (hỗ trợ `--target` và `--file`).
    * Bổ sung negative test `NEG-2.5` trong `verify_hsk20_data_quality.py` (`12/12` suites PASS) và chứng minh rollback round-trip thực tế trên `ZhongWenHub_Ephemeral_QA` (`'Chào bạn' -> 'TEMP_CORRUPTED_TITLE' -> 'Chào bạn'`).

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

## 4. CẤU TRÚC CHƯƠNG TRÌNH 15 BÀI HSK 1 ĐỐI SOÁT `ZhongWenHub_Test`

Đã đồng bộ tiêu đề, pinyin và mapping GUID của toàn bộ 15 bài HSK 1 trong `Fontend/src/features/learning/data/curriculumData.ts` khớp 1:1 với 15 bài HSK 2.0 thực tế trên `ZhongWenHub_Test` (Unit 1–Unit 6):

| Unit | Bài | Chữ Hán | Phiên âm Pinyin | Mã ID hệ thống | Trạng thái `ZhongWenHub_Test` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U1 | **01** | 你好 | Nǐ hǎo | `AAAAAAAA-1111-1111-1111-111111111111` | **PUBLISHED** (`v=6, g=6, e=3`) |
| U1 | **02** | 谢谢你 | Xièxie nǐ | `AAAAAAAA-2222-2222-2222-222222222222` | **PUBLISHED** (`v=3, g=5, e=4`) |
| U2 | **03** | 你叫什么名字 | Nǐ jiào shénme míngzi | `AAAAAAAA-3333-3333-3333-333333333333` | **PUBLISHED** (`v=3, g=6, e=3`) |
| U2 | **04** | 他是我的汉语老师 | Tā shì wǒ de hànyǔ lǎoshī | `AAAAAAAA-4444-4444-4444-444444444444` | **DRAFT** (`v=0, g=5, e=4`) |
| U3 | **05** | 我想喝茶 | Wǒ xiǎng hē chá | `9C981888-67BD-41BB-B5B0-57D0A1268DD6` | **DRAFT** (`v=0, g=5, e=4`) |
| U3 | **06** | 你在做什么呢 | Nǐ zài zuò shénme ne | `BC8E2F7F-91CD-4014-8BC4-BF4AEE182E41` | **DRAFT** (`v=0, g=5, e=4`) |
| U3 | **07** | 今天星期几 | Jīntiān xīngqī jǐ | `F6AC147D-5091-4495-B018-A935385F4B87` | **DRAFT** (`v=0, g=5, e=5`) |
| U4 | **08** | 明天天气怎么样 | Míngtiān tiānqì zěnmeyàng | `778CF4E8-1BDD-4C63-8352-C9DB74CFAA70` | **DRAFT** (`v=0, g=5, e=4`) |
| U4 | **09** | 现在几点 | Xiànzài jǐ diǎn | `775BEE30-1000-4623-AC03-50DEC5A6BD58` | **DRAFT** (`v=0, g=5, e=4`) |
| U4 | **10** | 我星期一去北京 | Wǒ xīngqīyī qù Běijīng | `EA11A07D-2642-4D98-B3FD-588CC8CB7BFE` | **DRAFT** (`v=0, g=5, e=4`) |
| U5 | **11** | 这个苹果多少钱 | Zhè ge píngguǒ duōshao qián | `64363C63-96DB-4695-8E4E-79A9547F8E71` | **DRAFT** (`v=0, g=4, e=4`) |
| U5 | **12** | 你去哪儿买东西 | Nǐ qù nǎr mǎi dōngxi | `5879091F-51C4-4985-B63B-6BDFC004D6E6` | **DRAFT** (`v=0, g=4, e=4`) |
| U5 | **13** | 他在学校前面 | Tā zài xuéxiào qiánmiàn | `C1A616F0-FFE9-485D-8E5A-301EE014730A` | **DRAFT** (`v=0, g=4, e=4`) |
| U6 | **14** | 你会开车吗 | Nǐ huì kāi chē ma | `ACE8837E-E67D-4CF7-9EC3-625A16EC3B8F` | **DRAFT** (`v=0, g=4, e=4`) |
| U6 | **15** | 我是坐飞机来的 | Wǒ shì zuò fēijī lái de | `9F74EEE4-2746-4EFC-A1F2-3402079AB3EF` | **DRAFT** (`v=0, g=4, e=5`) |

---

## 5. BẢO MẬT & PHÂN QUYỀN TRUY CẬP (RBAC)

1. **Học viên thường (Role STUDENT):**
   - Chỉ có thể đọc và ghi tiến độ trên các bài học có trạng thái `PUBLISHED`.
   - Truy cập `GET /api/v1/content/lessons/{id}`, `PUT .../progress`, hoặc `POST .../complete` trên bài `DRAFT` (như Bài 4) nhận HTTP **404** từ Backend.
   - Giá trị `xpEarned` / `sessionXp` gửi từ client bị server bỏ qua hoàn toàn; chỉ dùng tính toán server-side trong `LearningService`.
   - Gọi API quản trị (`POST /api/v1/content/lessons`) nhận HTTP **403 Forbidden**.
2. **Quản trị nội dung (Role CONTENT_MANAGER / ADMIN):**
   - Được phép xem trước (`preview`) cả bài `DRAFT` và `PUBLISHED`.
   - Có toàn quyền CRUD nội dung bản nháp bài học qua API; bị chặn xóa cứng bài đã có tiến độ học viên (`DeleteLessonAsync`).

---

## 6. KẾT LUẬN & TRẠNG THÁI NGHIỆM THU (`CONDITIONAL`)

- Toàn bộ mã nguồn Backend/Frontend, security guards, snapshot/rollback fail-closed, 70 .NET unit tests, 293 Bun tests, 12 QA suites, kiểm chứng rollback thực tế và 3 Playwright E2E tests trên `ZhongWenHub_Ephemeral_QA` đều đã **PASS**.
- **Trạng thái hợp đồng:** **`CONDITIONAL`** (Bị khóa an toàn tại cổng phê duyệt DB vì `USER_APPROVAL_TOKEN.signed` chưa tồn tại, nên `ZhongWenHub_Test` và `ZhongWenHub_Dev` vẫn giữ nguyên `3/15 PUBLISHED` và `12/15 DRAFT` với 0 thao tác ghi).

