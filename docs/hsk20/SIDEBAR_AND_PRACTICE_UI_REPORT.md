# Báo cáo Cập nhật Sidebar Học viên & Giao diện Trang Bài tập (`/practice`)

- **Workspace:** `D:\ZhongWenHub`
- **Nhánh:** `integration/zhongwenhub-sqlserver` (dựa trên commit `043d048`)
- **Phạm vi:** Sắp xếp lại cấu trúc nhóm Sidebar học viên và xây dựng giao diện trang **Bài tập luyện tiếng Trung** (`/practice`) kết nối dữ liệu thực tế từ Ngân hàng câu hỏi (SQL Server), không sử dụng dữ liệu giả hoặc hardcode cấp độ.

---

## 1. Cập nhật Cấu trúc Sidebar Học viên

### 1.1 Phân nhóm mới (`HANBEEGO_STUDENT_NAV_GROUPS`)

File: `Fontend/src/config/student-navigation.config.ts`

1. **TỔNG QUAN** (`overview`)
   - `Dashboard` → `/dashboard`
2. **KHÓA HỌC** (`courses`)
   - `Lộ trình học tập` → `/learning-path?mode=beginner`
   - `Giáo trình HSK` → `/learning-path?mode=hsk`
   - `Từ vựng HSK 1–6` → `/vocabulary` (chuyển từ nhóm Kho kiến thức cũ lên)
   - `Ngữ pháp HSK 1–6` → `/grammar` (chuyển từ nhóm Kho kiến thức cũ lên)
   - `Học qua video` → `/videos` (chuyển lên Khóa học)
   - `Bài tập` → `/practice` (đặt trong nhóm `KHÓA HỌC`, tuyệt đối không đặt trong `LUYỆN TẬP`)
3. **KỸ NĂNG** (`skills` — đổi tên từ `LUYỆN TẬP` cũ)
   - `Luyện nghe` → `/skills/listening`
   - `Luyện nói` → `/skills/speaking`
   - `Đọc hiểu` → `/skills/reading`
   - `Luyện viết` → `/skills/writing`
4. **LUYỆN TẬP** (`practice-zone` — tạo mới bên dưới `KỸ NĂNG`)
   - `Hội thoại` → `/ai-live` (alias route `/conversation`, trang `AILivePage`)
   - `Viết thư` → `/ai-grading` (alias route `/letter-writing`, trang `AIGradingPage` với thêm nút chọn nhanh mẫu đoạn văn & mẫu viết thư tiếng Trung)
   - `AI Tutor` → `/ai-tutor` (giữ `matchPrefixes: ['/ai-tutor', '/ai-analytics', '/ai-learning']` tách bạch hoàn toàn khỏi `/ai-live` và `/ai-grading` để trạng thái active trên sidebar không bị tô sáng nhầm nhiều mục)

### 1.2 Bảo toàn chức năng & route hiện có

- Xóa nhóm hiển thị `"Kho kiến thức"` và nhóm `"Cá nhân hóa"` khỏi thanh điều hướng `HANBEEGO_STUDENT_NAV_GROUPS`.
- Không xóa dữ liệu hay route cũ trong `Fontend/src/app/router/student.routes.tsx` (`/mock-exams`, `/games`, `/progress`, `/learning-results`, `/achievements`, `/leaderboard`, `/homework`, `/classes`, `/profile`, `/settings`, `/ai-live`, `/ai-grading`, `/ai-analytics`, `/ai-tutor`).
- `StudentSidebar.tsx` cập nhật state `expandedGroups` cho 4 nhóm mới và siết chặt logic `isItemActive` (`pathname === prefix || pathname.startsWith(`${prefix}/`)`).
- `StudentLayout.tsx` và `StudentSearchModal.tsx` cập nhật tiêu đề và mục tìm kiếm tương ứng (`Bài tập luyện tiếng Trung`, `Hội thoại`, `Viết thư`).

---

## 2. Backend & Dữ liệu Ngân hàng Câu hỏi

### 2.1 Mở rộng API `/api/v1/question-bank`

- **`Backend/src/Business/QuestionBank/DTOs/QuestionBankDtos.cs`**
  - Thêm `Type` (`string?`) vào `CreatePracticeSessionRequestDto`.
  - Thêm `PublishedByType`, `AvailableHskLevels`, `AvailableHskLevelsByType` vào `AdaptiveRecommendationsResponseDto`.
- **`Backend/src/Business/QuestionBank/QuestionBankService.cs`**
  - `GetAdaptiveRecommendationsAsync`: tính số lượng câu `PUBLISHED` thật theo từng dạng chuẩn (`ResolveCanonicalPracticeType`) và tập cấp độ HSK có câu hỏi khả dụng (`AvailableHskLevels`, `AvailableHskLevelsByType`).
  - `CreatePracticeSessionAsync`: lọc chính xác theo `dto.Type` (`ExpandPracticeTypeAliases`) bao gồm cả nhánh fallback độ khó; từ chối tạo phiên (`InvalidOperationException` → HTTP `400 BadRequest`) khi dạng bài có 0 câu hỏi xuất bản thay vì trả về câu hỏi sai loại.

### 2.2 Số liệu thực tế từ `Exercises` (`Status = 'PUBLISHED'`)

Trên bộ 337 câu hỏi đã xuất bản hiện hành:
- `sentence-order` (`sentence-ordering`): **59 câu** (HSK 1–4) → **Khả dụng**
- `fill-blank` (`fill-in-the-blank`): **64 câu** (HSK 1–4) → **Khả dụng**
- `listen-fill-blank`: **0 câu** → **Chưa khả dụng**
- `listen-order`: **0 câu** → **Chưa khả dụng**
- `reading-cloze`: **0 câu** (chỉ có 57 câu đọc hiểu đoạn văn trắc nghiệm `reading`, chưa có dạng bài điền nhiều chỗ trống) → **Chưa khả dụng**

---

## 3. Giao diện Trang Bài tập (`/practice`)

Files chính:
- `Fontend/src/features/practice/data/exerciseFormats.ts`
- `Fontend/src/features/practice/PracticeCenter.tsx`
- `Fontend/src/features/practice/practice-center.css`
- `Fontend/src/features/practice/services/practice-question-bank.service.ts`
- `Fontend/src/features/practice/components/HSKFilterSection.tsx`

Chi tiết triển khai:
1. **Giữ nguyên header học viên** của `StudentLayout`.
2. **Thẻ giới thiệu đầu trang** (nền trắng, bo tròn, viền xám nhẹ): tiêu đề **`Bài tập luyện tiếng Trung`**, thông số **Dạng bài** (`2/5 khả dụng · 337 câu đã xuất bản`), **Cấp độ** (hiển thị động từ `availableHskLevels`), **Luyện lại** (đếm số câu sai và nút **`Ôn lại lỗi sai`**).
3. **Bộ chọn cấp độ động** lấy trực tiếp từ `availableHskLevels` trả về bởi backend (gỡ bỏ danh sách HSK cứng `[1, 2, 3, 4]` trong cả `PracticeCenter.tsx` và `HSKFilterSection.tsx`).
4. **Lưới 5 thẻ dạng bài tập** (3 cột desktop, 2 cột tablet, 1 cột mobile), đánh số `01`–`05`:
   - `01` **Sắp xếp từ thành câu hoàn chỉnh** — hiển thị số câu thật, badge HSK khả dụng và nút **`BẮT ĐẦU →`** (cập nhật `?type=sentence-order`, khởi tạo `PracticeSession` chấm điểm trên máy chủ).
   - `02` **Điền từ vào chỗ trống** — hiển thị số câu thật, badge HSK khả dụng và nút **`BẮT ĐẦU →`** (`?type=fill-blank`).
   - `03` **Nghe điền từ còn thiếu** — trạng thái **`Chưa khả dụng`**, nút bị khóa rõ ràng, giải thích trung thực chưa có dữ liệu xuất bản.
   - `04` **Nghe và sắp xếp nội dung theo thứ tự** — trạng thái **`Chưa khả dụng`**.
   - `05` **Đọc hiểu và suy đoán điền từ** — trạng thái **`Chưa khả dụng`** (giữ nguyên bộ lọc Ngân hàng câu hỏi phía dưới để học viên vẫn luyện được các câu Đọc hiểu & Nghe hiện có).
5. **Khối `"Hướng dẫn luyện tập"` ở cuối trang**: thẻ bo tròn nền trắng trình bày quy trình 4 bước từ chọn dạng bài đến chấm điểm máy chủ & ôn lại lỗi sai.

---

## 4. Kết quả Kiểm thử Thực tế Sau Sửa đổi Cuối cùng

- **Backend (`dotnet test Backend\ZhongWenHub.sln`):**
  - `ZhongWenHub.UnitTests`: **110/110 PASS** (`Failed: 0, Skipped: 0`).
  - `ZhongWenHub.IntegrationTests` (SQL Server `ZhongWenHub_Test`, bao gồm test mới `Practice_RecommendationsAndTypeFilter_ReturnRealPublishedCountsAndStrictFormats`): **98/98 PASS** (`Failed: 0, Skipped: 0`).
- **Frontend Build, Lint & Unit Tests (`Fontend`):**
  - `bun run build` (`tsc -b && vite build`): **0 lỗi TypeScript**, build thành công.
  - `bun run lint` (`oxlint`): **exit code 0**.
  - `bun test src/tests`: **314/314 PASS** trên 37 file (bao gồm `sidebar-and-practice-formats.test.ts`, `fe-5-6-centered-layout-sidebar.test.ts`, `fe-13-2-sticky-sidebars.test.ts`).
- **Playwright E2E (`desktop-1440` & `mobile-390` trên database `ZhongWenHub_Test`):**
  - Chạy 3 suite `sidebar-and-practice-redesign.spec.ts`, `question-bank-cms-and-practice.spec.ts`, `student-vocabulary-grammar.spec.ts`: **22/22 PASS** (`0 failed`).
  - Xác minh hiển thị 4 nhóm Sidebar mới (không còn `KHO KIẾN THỨC`, `Bài tập` thuộc `KHÓA HỌC`), active state từng mục, lưới thẻ 3 cột desktop / 2 cột tablet (768px) / 1 cột mobile (390px) không tràn ngang, nút `BẮT ĐẦU` khởi tạo phiên đúng loại câu hỏi trên server, thẻ 03–05 disabled trung thực, deep-link `/practice?type=listen-fill-blank` hiển thị thông báo `Chưa khả dụng`, và không hồi quy Từ vựng / Ngữ pháp / Ngân hàng câu hỏi.
