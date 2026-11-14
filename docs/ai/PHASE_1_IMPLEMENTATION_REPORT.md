# BÁO CÁO KỸ THUẬT TRIỂN KHAI PHASE 1 – COMPETENCY PROFILE & RECOMMENDATION ENGINE V2

**Dự án:** ZhongWenHub – Nền tảng học tiếng Trung tích hợp AI  
**Branch:** `feature/ai-personalization-phase1`  
**Ngày hoàn thành:** 14/11/2026  
**Kiến trúc sư & QA Lead:** Senior Full-stack / AI Engineer

---

## 1. MỤC TIÊU TRIỂN KHAI PHASE 1

Phase 1 hiện thực hóa hai trụ cột nền tảng cho hệ thống cá nhân hóa học tập thông minh:
1. **Hồ sơ năng lực học viên (Competency Profile):**
   - Định lượng độc lập 6 kỹ năng vĩ mô: Từ vựng (Vocabulary), Ngữ pháp (Grammar), Đọc hiểu (Reading), Nghe hiểu (Listening), Chữ Hán & Bộ thủ (Hanzi), Phát âm & Nói (Speaking).
   - Minh bạch sư phạm: Khi học viên mới chưa có đủ dữ liệu câu hỏi thực tế, hệ thống trả về trạng thái `NOT_ASSESSED` (không giả định điểm mặc định hoặc áp đặt HSK 1 là năng lực thực tế).
   - Kỹ năng Nói được đánh dấu rõ ràng `NOT_ASSESSED` với ghi chú minh bạch *"Chưa có dữ liệu âm thanh được chấm điểm; không suy đoán điểm nói"*, loại bỏ hoàn toàn việc sinh điểm phát âm ảo.
2. **Thuật toán Đánh giá Năng lực (Bayesian Knowledge Tracing - BKT):**
   - Lập trình mô hình toán học xác suất chuẩn hóa BKT với 4 tham số có thể cấu hình: $P(L_0)$ (tiên nghiệm), $P(T)$ (xác suất chuyển đổi/học được), $P(G)$ (đoán mò), $P(S)$ (sơ suất/trượt chân).
   - Công thức cập nhật xác suất thành thạo hậu nghiệm:
     $$P(L_t \mid \text{Correct}) = \frac{P(L_{t-1}) \cdot (1 - P(S))}{P(L_{t-1}) \cdot (1 - P(S)) + (1 - P(L_{t-1})) \cdot P(G)}$$
     $$P(L_t \mid \text{Incorrect}) = \frac{P(L_{t-1}) \cdot P(S)}{P(L_{t-1}) \cdot P(S) + (1 - P(L_{t-1})) \cdot (1 - P(G))}$$
     $$P(L_{t+1}) = P(L_t \mid \text{Obs}) + (1 - P(L_t \mid \text{Obs})) \cdot P(T)$$
   - Độ tin cậy thống kê (Confidence Score) tiệm cận tăng dần theo số lượng bài làm thông qua hàm bão hòa $1 - 2^{-n / k}$.
   - Phân cấp thành thạo (Mastery Tier): `NOT_ASSESSED`, `NOVICE` (< 0.40), `EMERGING` (0.40 - 0.69), `COMPETENT` (0.70 - 0.84), `MASTERED` ($\ge 0.85$).
3. **Động cơ Đề xuất Đa yếu tố V2 (Multi-factor Utility Recommendation Engine):**
   - Đánh giá và xếp hạng đề xuất dựa trên điểm hữu dụng (Utility Score) có thể giải thích được:
     - Ưu tiên 1 (chống suy thoái trí nhớ theo đường cong quên lãng Ebbinghaus): Ôn tập từ vựng SRS đến hạn (`srs-due`).
     - Ưu tiên 2: Củng cố điểm yếu vi mô BKT (`weak-skill`) có tỷ lệ sai cao kèm liên kết làm bài tập thích ứng.
     - Ưu tiên 3: Hoàn thành bài học đang dở dang (`resume-lesson`).
     - Ưu tiên 4: Khảo sát nhanh định vị trình độ HSK cho học viên mới (`diagnostic-test`).
     - Ưu tiên 5: Bài học mới kế tiếp theo khung chương trình HSK (`next-lesson`).
   - Tùy chọn cố vấn sư phạm AI (LLM pedagogical coaching explanation) hỗ trợ giải thích rõ ràng mục tiêu học tập.

---

## 2. DANH MỤC THAY ĐỔI MÃ NGUỒN

### A. Backend (.NET 10 Web API & Business Layer)
1. **Mô hình toán học BKT:**
   - `Backend/src/Business/AILearning/Services/Competency/BktParameters.cs`
   - `Backend/src/Business/AILearning/Services/Competency/BktAlgorithm.cs`
2. **DTOs chuẩn hóa:**
   - `Backend/src/Business/AILearning/DTOs/CompetencyDtos.cs`: `CompetencyProfileDto`, `SkillCompetencyDto`, `WeakConceptDto`.
   - `Backend/src/Business/AILearning/DTOs/RecommendationV2Dtos.cs`: `PersonalizedLearningPlanV2Dto`, `RecommendationItemV2Dto`.
3. **Business Services & Dependency Injection:**
   - `Backend/src/Business/AILearning/Services/Competency/ICompetencyProfileService.cs`
   - `Backend/src/Business/AILearning/Services/Competency/CompetencyProfileService.cs`
   - `Backend/src/Business/AILearning/Services/Recommendation/IRecommendationEngineV2.cs`
   - `Backend/src/Business/AILearning/Services/Recommendation/RecommendationEngineV2.cs`
   - `Backend/src/Business/DependencyInjection.cs` (đăng ký `ICompetencyProfileService` và `IRecommendationEngineV2` vào DI container).
4. **API Controller Endpoints:**
   - `Backend/src/Api/Controllers/AILearningEngineController.cs`:
     - `GET /api/v1/ai/competency-profile`
     - `GET /api/v1/ai/recommendations/v2?availableMinutes={minutes}&explain={bool}`

### B. Unit Tests Backend (xUnit)
1. `Backend/tests/ZhongWenHub.UnitTests/AILearning/BktAlgorithmTests.cs` (7 tests kiểm tra tính đơn điệu, xác suất đoán mò, sơ suất, chuyển đổi và phân tầng thành thạo).
2. `Backend/tests/ZhongWenHub.UnitTests/AILearning/CompetencyProfileServiceTests.cs` (4 tests kiểm tra trạng thái unassessed, tính toán dữ liệu thực tế, phát hiện điểm yếu, và an toàn thread).
3. `Backend/tests/ZhongWenHub.UnitTests/AILearning/RecommendationEngineV2Tests.cs` (4 tests kiểm tra xếp hạng utility, ưu tiên SRS, khắc phục điểm yếu và tích hợp cơ sở dữ liệu).

### C. Frontend (React 19 + TypeScript + Bun)
1. **API Contracts & Services:**
   - `Fontend/src/features/ai/services/ai-learning-engine.service.ts`: bổ sung interfaces `CompetencyProfile`, `SkillCompetency`, `WeakConcept`, `RecommendationItemV2`, `PersonalizedLearningPlanV2` và 2 API methods `getCompetencyProfile()`, `getRecommendationsV2()`.
2. **UI Widgets & Dashboard:**
   - `Fontend/src/features/ai/components/CompetencyDashboardWidget.tsx`: Widget toàn diện xử lý đủ 5 trạng thái (Loading, Error, Empty/Not Assessed, Assessed Success, AI Explaining), hiển thị trực quan 6 kỹ năng, thanh tiến độ BKT, huy hiệu tin cậy, thông báo minh bạch kỹ năng Nói, bảng điểm yếu cần củng cố và danh sách thẻ đề xuất V2.
   - `Fontend/src/features/ai/student/pages/StudentAIWorkspacePage.tsx`: Nhúng và tích hợp `CompetencyDashboardWidget`.
3. **Frontend Automated Tests:**
   - `Fontend/src/tests/ai-competency-and-recommendation-v2.test.ts` (3 tests kiểm tra contract API, schema 6 kỹ năng, minh bạch phát âm và xếp hạng utility).

---

## 3. BẰNG CHỨNG KIỂM THỬ THỰC TẾ

### 1. Backend Unit Tests
- **Command:** `dotnet test Backend/tests/ZhongWenHub.UnitTests/ZhongWenHub.UnitTests.csproj`
- **Kết quả:** **219/219 tests PASS (100%)**
  - Thời gian chạy: 2.0s
  - 15/15 tests BKT, Competency Profile và Recommendation Engine V2 vượt qua mọi assertions.

### 2. Frontend TypeScript Compilation
- **Command:** `bunx tsc -b --noEmit`
- **Kết quả:** **Exit code 0, 0 errors**.

### 3. Frontend Static Analysis & Linting
- **Command:** `bunx oxlint --quiet`
- **Kết quả:** **0 errors**.

### 4. Frontend Automated Tests
- **Command:** `bun test src/tests`
- **Kết quả:** **365/365 tests PASS (100%)** trên 46 files (bao gồm bộ test Phase 1 mới `ai-competency-and-recommendation-v2.test.ts`).

### 5. Frontend Production Build
- **Command:** `bun run build`
- **Kết quả:** **Exit code 0, built in 1.91s**, tạo bundle sẵn sàng triển khai.

---

## 4. KẾT LUẬN & TRẠNG THÁI SẴN SÀNG

Phase 1 đã hoàn thành trọn vẹn cả tầng Backend, Frontend, kiểm thử đơn vị, kiểm thử tích hợp và tuân thủ nghiêm ngặt nguyên tắc **Zero-Write** vào cơ sở dữ liệu `ZhongWenHub_Dev`.
Hệ thống sẵn sàng để chuyển sang **Phase 2 – Adaptive Practice Loop & Diagnostic Assessment**.
