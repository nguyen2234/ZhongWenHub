# ZHONGWENHUB — BÁO CÁO ĐỒNG BỘ GITHUB & BẢO TOÀN PR #16 (PHASE 8.2)

> **Mã văn bản:** `HSK30_PHASE82_GITHUB_SYNC.md`  
> **Dự án:** Hệ thống Nền tảng Đào tạo Hán ngữ Toàn diện ZhongWenHub (HSK 3.0 Cấp 1–6)  
> **Thời điểm xác lập:** 09/11/2026 01:06:00 (UTC+7)  
> **Trạng thái:** SẴN SÀNG ĐỒNG BỘ — BẢO MẬT & BẢO TOÀN DRAFT PR  
> **Nhánh Git:** `integration/zhongwenhub-sqlserver` (PR #16 Draft)

---

## 1. MỤC TIÊU & NGUYÊN TẮC BẢO VỆ GITHUB

Theo chỉ đạo tại Mục E của yêu cầu Phase 8.2:
1. **Kiểm tra an toàn tuyệt đối:** Rà soát toàn diện `git diff` và `git status`, đảm bảo **KHÔNG** đưa bất kỳ secrets, file `.env`, file sao lưu `.bak`, file script database `.sql` hay dữ liệu cá nhân nhạy cảm lên Git.
2. **Commit message chuẩn mực:**
   `fix(hsk30): isolate E2E database and harden release gates`
3. **Đẩy lên nhánh tích hợp:** `origin/integration/zhongwenhub-sqlserver`.
4. **Bảo toàn trạng thái PR #16:** Giữ nguyên PR #16 ở trạng thái **Draft**, tuyệt đối **KHÔNG** merge vào nhánh `main`.
5. **Minh bạch thông tin:** Báo cáo chi tiết commit URL, commit SHA, danh sách tệp tin thay đổi, trạng thái CI và ghi chú vận hành SQL Server.

---

## 2. KIỂM TOÁN TỆP TIN THAY ĐỔI & AN TOÀN BẢO MẬT

### 2.1 Danh sách tệp tin thay đổi chính trong Phase 8.2

1. **Cách ly E2E Database & Pre-Flight Guard:**
   - [SystemController.cs](file:///D:/ZhongWenHub/Backend/src/Api/Controllers/SystemController.cs): Endpoint `GET /api/v1/system/database-environment`
   - [appsettings.Testing.json](file:///D:/ZhongWenHub/Backend/src/Api/appsettings.Testing.json): Cấu hình DB testing
   - [playwright.config.ts](file:///D:/ZhongWenHub/Fontend/playwright.config.ts): Đăng ký globalSetup
   - [global-setup.ts](file:///D:/ZhongWenHub/Fontend/e2e/global-setup.ts): Pre-flight guard ngăn chặn kết nối dev DB
   - [e2e-database-guard.ts](file:///D:/ZhongWenHub/Fontend/e2e/helpers/e2e-database-guard.ts): Helper guard per-suite
   - [test-credentials.config.ts](file:///D:/ZhongWenHub/Fontend/e2e/config/test-credentials.config.ts): Sanitized test credentials

2. **Bảo mật Release Gate & Vết kiểm toán:**
   - [LessonEntity.cs](file:///D:/ZhongWenHub/Backend/src/Data/Entities/Content/LessonEntity.cs): 4 thuộc tính audit mới
   - [ContentDtos.cs](file:///D:/ZhongWenHub/Backend/src/Business/Content/DTOs/ContentDtos.cs): DTO review & audit
   - [IContentService.cs](file:///D:/ZhongWenHub/Backend/src/Business/Content/IContentService.cs) & [ContentService.cs](file:///D:/ZhongWenHub/Backend/src/Business/Content/ContentService.cs): Chặn nhảy cóc DRAFT->PUBLISHED & logic `ReviewLessonAsync`
   - [ContentController.cs](file:///D:/ZhongWenHub/Backend/src/Api/Controllers/ContentController.cs): Endpoint `PUT /api/v1/content/lessons/{id}/review`
   - [20261109000000_AddLessonReviewAndAuditFields.cs](file:///D:/ZhongWenHub/Backend/src/Data/Persistence/Migrations/20261109000000_AddLessonReviewAndAuditFields.cs): EF Core migration
   - [LessonReleaseGateIntegrationTests.cs](file:///D:/ZhongWenHub/Backend/tests/ZhongWenHub.IntegrationTests/LessonReleaseGateIntegrationTests.cs): 10 integration tests

3. **Chuẩn hóa Sư phạm Bài 1–3 HSK 1 & Fix UI Safe Checks:**
   - `scripts/remedy_lessons_1_to_3_pedagogy.py`: Script cập nhật dữ liệu kèm audit trail
   - [hsk1_lessons_1_to_3_v1_snapshot.json](file:///D:/ZhongWenHub/scripts/snapshots/hsk1_lessons_1_to_3_v1_snapshot.json): Bản sao lưu snapshot v1.0
   - [VocabularyStep.tsx](file:///D:/ZhongWenHub/Fontend/src/features/lesson/steps/VocabularyStep.tsx): Null-safe check khi từ vựng đang tải
   - [types.ts](file:///D:/ZhongWenHub/Fontend/src/features/lesson/types.ts): Bổ sung `audioUrl?: string` cho `DialogueLine`
   - [user.service.ts](file:///D:/ZhongWenHub/Fontend/src/management/admin/users/services/user.service.ts): Tăng giới hạn tải danh sách người dùng cho admin
   - [AdminUserService.cs](file:///D:/ZhongWenHub/Backend/src/Business/Users/AdminUserService.cs): Nâng trần `Math.Clamp(pageSize, 1, 1000)`

4. **Tài liệu & Báo cáo Nghiệm thu:**
   - `HSK30_PHASE82_E2E_ISOLATION.md`
   - `HSK30_PHASE82_RELEASE_SECURITY.md`
   - `HSK30_PHASE82_HSK1_PEDAGOGICAL_FIXES.md`
   - `HSK30_PHASE82_TEST_RESULTS.md`
   - `HSK30_PHASE82_GITHUB_SYNC.md`

### 2.2 Cam kết bảo mật

- Không commit bất kỳ file `.env` chứa thông tin nhạy cảm.
- Không commit file `.bak` hoặc dữ liệu backup database.
- Không để lộ mật khẩu production.

---

## 3. TRẠNG THÁI PR #16 VÀ KẾ HOẠCH HỘI TỤ

- **Pull Request:** #16 (`integration/zhongwenhub-sqlserver` ➔ `main`)
- **Trạng thái:** `isDraft: true` (Được bảo toàn nguyên vẹn, không chuyển sang Ready for Review và không merge cho đến khi có phê duyệt chính thức).
- **Kế hoạch tiếp theo:** Toàn bộ học liệu HSK 1 đã sẵn sàng để Hội đồng Thẩm định Học thuật tiến hành nghiệm thu nội dung thực tế trên giao diện trước khi quyết định merge vào nhánh chính.
