# Báo cáo Nghiệm thu Question Bank Phase 2 – ZhongWenHub (HSK 1–4)

- **Nhánh Git:** `integration/zhongwenhub-sqlserver` (PR #16 Open/Draft, không merge vào `main`, không deploy Production)
- **Commit cơ sở:** `7dd6481`
- **Cơ sở dữ liệu SQL Server:** `ZhongWenHub_Dev` & `ZhongWenHub_Test` (`.\SQLEXPRESS`)
- **Trạng thái kiểm duyệt học thuật bởi giảng viên (Human Sign-Off):** **`0` (chưa có chữ ký phê duyệt học thuật từ giảng viên)** — toàn bộ dữ liệu kiểm toán & mở rộng mới đều được giữ ở trạng thái `DRAFT`, phân tách rõ `VALIDATED`, `NEEDS_ACADEMIC_REVIEW`, `PENDING_REVIEW`, `REJECTED`. Tuyệt đối không tự `APPROVED` hay tự `PUBLISHED`.

---

## 1. Số liệu SQL Server thực tế (Trước & Sau Phase 2)

| Chỉ số | `ZhongWenHub_Dev` | `ZhongWenHub_Test` | Ghi chú |
| --- | ---: | ---: | --- |
| Tổng bản ghi `exercises` (tất cả HSK / trạng thái) | `5,269` | `5,449` | Gồm 110 (Dev) / 290 (Test) `ARCHIVED`, 140 HSK 5–6 `DRAFT`, 19 `REJECTED` |
| **Tổng câu hỏi hiệu lực HSK 1–4** (`ReviewStatus <> 'REJECTED'`, `Status <> 'ARCHIVED'`) | **`5,000`** | **`5,000`** | Đạt đúng mục tiêu từng cấp độ |
| ├─ **HSK 1** | **`500`** | **`500`** | `62` `PUBLISHED/APPROVED` + `80` `VALIDATED` + `358` `PENDING_REVIEW` |
| ├─ **HSK 2** | **`900`** | **`900`** | `75` `PUBLISHED/APPROVED` + `80` `VALIDATED` + `745` `PENDING_REVIEW` |
| ├─ **HSK 3** | **`1,500`** | **`1,500`** | `100` `PUBLISHED/APPROVED` + `80` `VALIDATED` + `1,320` `PENDING_REVIEW` |
| └─ **HSK 4** | **`2,100`** | **`2,100`** | `100` `PUBLISHED/APPROVED` + `80` `VALIDATED` + `231` `NEEDS_ACADEMIC_REVIEW` + `1,689` `PENDING_REVIEW` (+ `19` `REJECTED`) |
| Câu `PUBLISHED / APPROVED` gốc được bảo toàn | **`337`** | **`337`** | Không mất, không ghi đè (`curriculum-seed`) |
| Câu mới tự động `PUBLISHED` hoặc `APPROVED` | **`0`** | **`0`** | Bắt buộc giảng viên / Content Manager duyệt thủ công |
| Câu trùng lặp `ContentHash` (không tính `REJECTED`) | **`0`** | **`0`** | Khớp thuật toán SHA-256 `QuestionValidationHelper.ComputeContentHash` |
| Câu hiệu lực thiếu / sơ sài giải thích (`< 24` ký tự) | **`0`** | **`0`** | 5,000 / 5,000 đạt chuẩn độ dài & nội dung |
| Câu `fill-blank` rỗng ngữ cảnh (`PromptHanzi == '____'`) | **`0`** | **`0`** | Đã ngữ cảnh hóa hoặc chuyển định dạng phù hợp |
| Bảng `users` & `student_lesson_progress` (bảo toàn dữ liệu học viên) | `39` / `14` | `268` / `15` | Không bị sửa đổi hay xóa |

---

## 2. Kết quả Kiểm toán 570 câu `PENDING_REVIEW` hiện hữu

1. **Nhóm `drkameleon/complete-hsk-vocabulary` (`MIT`, 320 câu):**
   - **`320` câu -> `DRAFT / VALIDATED`:**
     - Sửa **`131` câu** bị trùng hoặc giao thoa nghĩa ở phương án nhiễu (ví dụ cặp gần nghĩa giống nhau) bằng từ cùng HSK & từ loại.
     - Ngữ cảnh hóa **`90` câu** `fill-blank` có `PromptHanzi = '____'` bằng câu ví dụ tiếng Trung thật có bản dịch tiếng Việt và phiên âm Pinyin đầy đủ.
     - Chuyển **`14` câu** `fill-blank` chưa có câu ví dụ khớp trực tiếp sang `vietnamese-to-chinese` (`PromptHanzi = NULL`) để hiển thị đúng trên `ExerciseRenderer`.
     - Sửa chuẩn hiển thị cho các câu `vietnamese-to-chinese` cũ (không đặt chữ Việt vào `PromptHanzi`).
     - Nâng cấp giải thích tiếng Việt chi tiết (`>= 70` ký tự: từ Hán, Pinyin, từ loại, nghĩa, ví dụ minh họa và phân biệt phương án nhiễu).
2. **Nhóm `InAnskr/HSK4Level-Test` (`CC-BY-NC-SA-4.0`, 250 câu):**
   - **`19` câu -> `DRAFT / REJECTED`:** Loại bỏ các câu lỗi thực tế gồm phương án giữ chỗ chữ cái `A..F` (`test-07#Q22..Q31`), câu sắp xếp thiếu 3 mệnh đề A/B/C (`test-07#Q32,33,34,37,38`), và câu Đọc/Nghe Đúng–Sai thiếu đoạn văn hoặc âm thanh (`test-04#Q43`, `test-06#Q6`, `test-10#Q3`, `test-11#Q1`).
   - **`231` câu -> `DRAFT / NEEDS_ACADEMIC_REVIEW`:** Giữ nguyên ngữ cảnh Đọc hiểu & sắp xếp câu HSK 4 hợp lệ, nâng cấp giải thích tiếng Việt chi tiết (phân tích từ nối logic, ngữ cảnh đoạn văn, phân biệt từng phương án nhiễu, kèm ghi nguồn `CC BY-NC-SA 4.0`). Không tự xuất bản.

---

## 3. Kiểm định Nguồn dữ liệu & Giấy phép (License Compliance)

| Nguồn | Giấy phép | Trạng thái sử dụng | Số câu hiệu lực |
| --- | --- | --- | ---: |
| `curriculum-seed` + `curriculum-vocab` + `zhongwenhub-grammar-hsk20-v2` + `zhongwenhub-dialogue-reading-v2` | `INTERNAL_AUTHORED` | Đã kiểm chứng từ SQL curriculum (`vocabularies`, `grammar_points` HSK 2.0 loại bỏ mẫu placeholder `"我们经常使用"`, hội thoại `lessons` `PUBLISHED`) & staging examples HSK 1–4 | `4,449` (gồm `337` `PUBLISHED`) |
| `drkameleon/complete-hsk-vocabulary` | `MIT` | Chấp nhận | `320` (`VALIDATED`) |
| `InAnskr/HSK4Level-Test` | `CC-BY-NC-SA-4.0` | Chỉ lấy phần đọc hiểu/sắp xếp hợp lệ có ghi nguồn | `231` (`NEEDS_ACADEMIC_REVIEW`, `+19 REJECTED`) |
| `krmanik/Chinese-Grammar`, `plaktos/hsk_csv`, `InAnskr/MandarinHSK`, `Roxaleen/hsk-annotated-corpus` | `license: null` | **Từ chối tuyệt đối**, không đưa vào pipeline | `0` |

Tất cả `4,112` câu mở rộng mới được nạp qua pipeline `scripts/question_bank_phase2_pipeline.py` theo từng batch `150` câu (`28` batch) vào cả `ZhongWenHub_Dev` và `ZhongWenHub_Test`, trạng thái cố định **`DRAFT / PENDING_REVIEW`**.

---

## 4. Nâng cấp Backend, Adaptive Practice, CMS & Student UI

### Backend (`Backend/src/Business/QuestionBank/` & `Backend/src/Api/Controllers/QuestionBankController.cs`)
- **Kiểm soát chất lượng & Xuất bản ([`QuestionValidationHelper.cs`](../../Backend/src/Business/QuestionBank/Helpers/QuestionValidationHelper.cs)):**
  - Mở rộng `NormalizeReviewStatus` hỗ trợ `DRAFT`, `PENDING_REVIEW`, `VALIDATED`, `NEEDS_ACADEMIC_REVIEW`, `APPROVED`, `REJECTED`.
  - Bổ sung `HasSubstantiveExplanation` (chặn giải thích trống, `< 24` ký tự hoặc câu lặp lại đáp án như `"Đáp án đúng là 'X'..."`) và `IsPublishQualified` bắt buộc đạt chuẩn giải thích + validation mới cho phép xuất bản hoặc `PublishImmediately`.
- **Adaptive Practice & Analytics ([`QuestionBankService.cs`](../../Backend/src/Business/QuestionBank/QuestionBankService.cs)):**
  - **Anti-repeat:** loại trừ/giảm ưu tiên câu đã xuất hiện trong `5` `QuestionBankPracticeSessions` gần nhất của học viên.
  - **Review & Unseen priority:** ưu tiên câu trả lời sai gần nhất, câu đến hạn ôn (SRS/decay theo thời gian chưa gặp lại), kỹ năng/điểm ngữ pháp yếu và câu chưa làm (`UNSEEN_DISCOVERY`), hiệu chỉnh độ khó thích ứng theo độ chính xác gần đây (`ResolveAdaptiveDifficulty`).
  - **Student Analytics:** trả về `SkillStats`, `HskStats` và `GrammarStats` từ dữ liệu làm bài thật. Không rò rỉ đáp án/giải thích trước khi nộp bài; cộng XP idempotent 1 lần mỗi session.
- **Báo lỗi câu hỏi (`POST /api/v1/question-bank/{id}/report`):** Học viên và CMS có thể gắn cờ lỗi câu hỏi; tự động thêm tag `reported-issue` và chuyển `ReviewStatus = NEEDS_ACADEMIC_REVIEW` để kiểm duyệt lại.

### Frontend (`Fontend/src/`)
- **CMS Ngân hàng câu hỏi ([`AdminExerciseBankPage.tsx`](../../Fontend/src/management/admin/content/pages/AdminExerciseBankPage.tsx), [`AdminExerciseDetailDrawer.tsx`](../../Fontend/src/management/admin/content/components/AdminExerciseDetailDrawer.tsx)):**
  - Thống kê trực tiếp số câu đạt giải thích chuẩn (`withSubstantiveExplanation`), câu bị báo lỗi (`reportedCount`, nút lọc nhanh `reported-issue`) và bộ lọc trạng thái kiểm duyệt mở rộng (`VALIDATED`, `NEEDS_ACADEMIC_REVIEW`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`).
  - Drawer chi tiết hỗ trợ xem trước trực tiếp qua `ExerciseRenderer`, kiểm tra badge chất lượng giải thích, nguồn/giấy phép (`SourceId`, `SourceLicense`), nút duyệt (`APPROVED`), chuyển chuyên môn (`NEEDS_ACADEMIC_REVIEW`), từ chối (`REJECTED` bắt buộc nhập lý do) và báo lỗi câu hỏi.
  - Thao tác hàng loạt có kiểm soát (`batchReview` `APPROVED` / `REJECTED` / `Duyệt & Xuất bản`), hiển thị thông báo rõ số câu bị bỏ qua nếu thiếu giải thích đạt chuẩn.
  - Khắc phục lỗi tràn ngang thanh tiêu đề Drawer trên viewport mobile `390px`.
- **Student Practice ([`PracticeCenter.tsx`](../../Fontend/src/features/practice/PracticeCenter.tsx), [`PracticeResult.tsx`](../../Fontend/src/features/practice/components/PracticeResult.tsx)):**
  - Hiển thị biểu đồ độ chính xác theo **Kỹ năng / HSK / Điểm ngữ pháp**.
  - Bổ sung nút **"Báo lỗi câu hỏi"** ngay trên màn hình kết quả chi tiết từng câu hỏi sau khi nộp bài.

---

## 5. Kết quả Kiểm thử Tự động Sau Chỉnh sửa Cuối

| Bộ kiểm thử | Phạm vi & Môi trường | Kết quả thực tế |
| --- | --- | --- |
| **Backend Unit Tests** (`dotnet test`) | `ZhongWenHub.UnitTests` (bao gồm kiểm tra tautology explanation, `VALIDATED`/`NEEDS_ACADEMIC_REVIEW`, `IsPublishQualified`) | **`100 / 100` PASS** (`0` Fail, `0` Skipped, `417 ms`) |
| **Backend Integration Tests** (`dotnet test`) | `ZhongWenHub.IntegrationTests` (bao gồm RBAC, Publish Gate từ chối giải thích sơ sài, Anti-repeat 2 session liên tiếp, Analytics, `POST .../report`, benchmark phân trang/stats/tạo session trên `5,500+` bản ghi cô lập) | **`91 / 91` PASS** (`0` Fail, `0` Skipped, `38 s`, toàn bộ truy vấn/session `< 2500 ms`) |
| **Frontend Build & Lint** | `tsc -b && vite build`, `oxlint` | **`0` lỗi** (`built in 1.77s`) |
| **Frontend Unit Tests** | `bun test src/tests` (`35` files) | **`305 / 305` PASS** (`0` Fail, `4,364 expect()`) |
| **Playwright E2E** (Cô lập `ZhongWenHub_Test`, cổng `5056`/`5175`) | `question-bank-cms-and-practice.spec.ts` + `student-learning-journey.spec.ts` trên `desktop-1440` & `mobile-390` | **`14 / 14` PASS** (`0` Fail, `49.0 s`) |

---

## 6. Việc Còn Mở Chờ Giảng viên / Vận hành

1. **Chưa có người duyệt học thuật (`0` human sign-off):** cần giảng viên tiếng Trung rà soát:
   - **`231`** câu `InAnskr` HSK 4 (`NEEDS_ACADEMIC_REVIEW`, giấy phép `CC-BY-NC-SA-4.0`)
   - **`320`** câu `drkameleon` (`VALIDATED`, giấy phép `MIT`)
   - **`4,112`** câu mở rộng mới (`PENDING_REVIEW`) trước khi bấm duyệt (`APPROVED`) và xuất bản (`PUBLISHED`) cho học viên.
2. **Câu loại bỏ (`19` câu `REJECTED`):** có thể xóa hẳn hoặc giữ lưu vết kiểm định trong CMS tùy quyết định Content Manager.
