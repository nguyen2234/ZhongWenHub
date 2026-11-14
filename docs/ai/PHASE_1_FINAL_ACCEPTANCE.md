# BÁO CÁO NGHIỆM THU CHÍNH THỨC GIAI ĐOẠN 1 (PHASE 1 FINAL ACCEPTANCE)

**Dự án:** ZhongWenHub – Nền tảng học tiếng Trung tích hợp AI  
**Branch:** `feature/ai-personalization-phase1`  
**Ngày nghiệm thu:** 14/11/2026  
**Kiến trúc sư & QA Lead:** Senior Software Architect, AI Engineer & QA Lead  
**Đánh giá tổng thể:** **PASS (ĐẠT CHUẨN NGHIỆM THU)**

---

## 1. TỔNG HỢP CÁC LỖI ĐÃ PHÁT HIỆN VÀ KHẮC PHỤC TRIỆT ĐỂ

1. **Trùng ConceptCode giữa các chủ đề khác nhau:**
   - *Khắc phục:* Xây dựng hàm `GenerateConceptCode(hsk, skill, topicTitle)` sinh mã băm duy nhất, ổn định định dạng `CP-{hsk}-{SKILL}-{SLUG}-{SHORTHASH}`. Hai chủ đề khác nhau (ví dụ: *"Câu chữ 把"* và *"Trợ từ 的"*) cùng cấp HSK 2 Ngữ pháp sinh ra 2 mã hoàn toàn tách biệt: `CP-2-GRAMMAR-CAU-CHU-BA-39E36BC3` và `CP-2-GRAMMAR-TRO-TU-DE-23FB08A1`.
2. **Không tự động nâng/hạ EstimatedHskLevel khi chưa đủ bằng chứng:**
   - *Khắc phục:* Phân tách `SelectedHskLevel` (cấp do học viên chủ động chọn) và `EstimatedHskLevel` (`int?`, nullable). Khi học viên chưa có đủ dữ liệu kiểm chứng đa kỹ năng ($\ge 10$ câu hỏi tại cấp với độ chính xác $\ge 70\%$ và độ tin cậy $\ge 0.60$), `EstimatedHskLevel` giữ nguyên là `null` (chưa xác định), không giả định HSK 1 là năng lực thực tế.
3. **Chuẩn hóa NormalizeSkill & Bảo toàn truy vết dữ liệu:**
   - *Khắc phục:* Không gộp `pinyin`/`tone` vào `hanzi`; tách bạch thành kỹ năng `pinyin` độc lập. Các danh mục lạ không bị ép thành `grammar` mà giữ nguyên `"unclassified:{category}"` và ghi nhận `UnclassifiedEvaluationsCount`.
4. **Tối ưu hóa triệt để truy vấn SQL Server (Database Query Pushdown):**
   - *Khắc phục:* Không tải toàn bộ thực thể `StudentVocabularyProgresses` và `StudentLessonProgresses` vào RAM chỉ để đếm. Đưa toàn bộ `CountAsync`, `Where` và `GroupBy` xuống SQL Server. Tận dụng index `idx_vocabulary_progress_user_vocab` và `idx_student_lesson_progress_user_lesson` để thực thi index seek với thời gian $< 5\text{ms}$.
5. **Giới hạn cửa sổ dữ liệu lớn (History Window Capping):**
   - *Khắc phục:* Đặt giới hạn `const int MaxAttemptsWindow = 200;` tại truy vấn SQL Server (`Take(200)`), loại trừ nguy cơ nghẽn I/O và tràn bộ nhớ khi học viên có lịch sử hàng vạn câu hỏi.
6. **Loại bỏ đề xuất Diagnostic giả:**
   - *Khắc phục:* Xóa bỏ toàn bộ thẻ đề xuất `diagnostic-test` và các liên kết giả lập trong Phase 1. Học viên chưa đánh giá được hướng dẫn bắt đầu học theo lộ trình HSK thực tế.
7. **Chuẩn hóa toàn bộ DestinationRoute theo React Router:**
   - *Khắc phục:* Khớp 100% với React Router (`/srs-review`, `/ai-exercises?hsk={hsk}&source=WEAKNESS`, `/lesson/{lessonId}`).
8. **An toàn Concurrency EF Core & Kiểm thử SQL Server thực tế:**
   - *Khắc phục:* Sử dụng scoped `DbContext` riêng biệt cho từng luồng song song; xây dựng test suite tích hợp chạy trực tiếp trên cơ sở dữ liệu `ZhongWenHub_Test`.

---

## 2. DANH MỤC FILE THAY ĐỔI TRONG PHASE 1

### Backend
- `Backend/src/Business/AILearning/DTOs/CompetencyDtos.cs`: Định nghĩa DTO hồ sơ năng lực 6 kỹ năng vĩ mô, `SelectedHskLevel`, nullable `EstimatedHskLevel`, `UnclassifiedEvaluationsCount`.
- `Backend/src/Business/AILearning/DTOs/RecommendationV2Dtos.cs`: Định nghĩa DTO đề xuất V2, Multi-factor Utility score, và route điều hướng.
- `Backend/src/Business/AILearning/Services/Competency/BktParameters.cs`: 4 tham số xác suất BKT ($P(L_0), P(T), P(G), P(S)$).
- `Backend/src/Business/AILearning/Services/Competency/BktAlgorithm.cs`: Thuật toán xác suất BKT, hàm độ tin cậy tiệm cận $1 - 2^{-n/k}$, và phân tầng `ResolveMasteryTier`.
- `Backend/src/Business/AILearning/Services/Competency/ICompetencyProfileService.cs` & `CompetencyProfileService.cs`: Dịch vụ lượng hóa năng lực, tối ưu SQL Server query pushdown, window capping 200 bản ghi, và sinh `ConceptCode` duy nhất.
- `Backend/src/Business/AILearning/Services/Recommendation/IRecommendationEngineV2.cs` & `RecommendationEngineV2.cs`: Động cơ đề xuất V2 với SQL Server pushdown, ưu tiên SRS due, củng cố điểm yếu, và phân tích sư phạm qua LLM.
- `Backend/src/Business/DependencyInjection.cs`: Đăng ký DI container.
- `Backend/src/Api/Controllers/AILearningEngineController.cs`: 2 endpoints `GET /api/v1/ai/competency-profile` và `GET /api/v1/ai/recommendations/v2`.
- `Backend/tests/ZhongWenHub.UnitTests/AILearning/BktAlgorithmTests.cs`: Unit test BKT (đơn điệu, nhạy cảm theo thứ tự thời gian, dữ liệu biên).
- `Backend/tests/ZhongWenHub.UnitTests/AILearning/CompetencyProfileServiceTests.cs`: Unit test hồ sơ năng lực, EF Core concurrency với scoped DbContext, dữ liệu lệch kỹ năng, chuẩn hóa kỹ năng.
- `Backend/tests/ZhongWenHub.UnitTests/AILearning/RecommendationEngineV2Tests.cs`: Unit test động cơ đề xuất V2 và route React Router.
- `Backend/tests/ZhongWenHub.UnitTests/AILearning/SqlServerPhase1IntegrationTests.cs`: Integration test chạy trực tiếp trên SQL Server `ZhongWenHub_Test` kiểm chứng cô lập dữ liệu 2 học viên và luồng end-to-end.

### Frontend
- `Fontend/src/features/ai/services/ai-learning-engine.service.ts`: TypeScript interfaces và API client methods.
- `Fontend/src/features/ai/components/CompetencyDashboardWidget.tsx`: Widget xử lý 5 trạng thái (Loading, Error, Empty/Not Assessed, Assessed Success, AI Explaining) hiển thị trực quan BKT, minh bạch kỹ năng Nói, điểm yếu, và thẻ đề xuất V2.
- `Fontend/src/features/ai/student/pages/StudentAIWorkspacePage.tsx`: Nhúng `CompetencyDashboardWidget`.
- `Fontend/src/tests/ai-competency-and-recommendation-v2.test.ts`: Automated tests cho frontend contracts.

---

## 3. BẰNG CHỨNG KIỂM THỬ THỰC TẾ

### A. Kiểm thử Tích hợp SQL Server Thực tế (ZhongWenHub_Test)
- **Tài khoản kiểm chứng cô lập:**
  - Học viên 1: `hocvien@gmail.com` (`46e15f31-a780-490c-bfca-fc07113786d6`) – Có bài tập ngữ pháp và 2 từ vựng SRS.
  - Học viên 2: `student.binh.demo@zhongwenhub.edu.vn` (`360f3a1b-edc0-47ec-80b9-ea2eea39de02`) – Chưa làm bài tập (unassessed).
- **Kết quả xác minh:**
  - Học viên 1: Nhận diện đúng 3 câu hỏi đánh giá, `SelectedHskLevel = 1`, `EstimatedHskLevel = null`, `AssessmentStatus = IN_PROGRESS`, đề xuất ưu tiên #1 là `srs-due` trỏ về `/srs-review`.
  - Học viên 2: `TotalEvaluations = 0`, `SelectedHskLevel = 2`, `EstimatedHskLevel = null`, `AssessmentStatus = NOT_ASSESSED`. Tuyệt đối không chứa bất kỳ từ vựng SRS hay dữ liệu bài tập nào của Học viên 1 (**100% Data Isolation**).
  - SQL Server Index Seek hoạt động tối ưu trên `idx_vocabulary_progress_user_vocab` và `idx_student_lesson_progress_user_lesson`.

### B. Kết quả Toàn bộ Test Suite
- **Backend Unit & SQL Server Integration Tests:**
  `dotnet test Backend/tests/ZhongWenHub.UnitTests/ZhongWenHub.UnitTests.csproj`
  $\rightarrow$ **224/224 tests PASS (100%)** trong 3.0s.
- **Frontend TypeScript Compilation:**
  `bunx tsc -b --noEmit` $\rightarrow$ **0 errors (Exit code 0)**.
- **Frontend Linter:**
  `bunx oxlint --quiet` $\rightarrow$ **0 errors**.
- **Frontend Unit Tests:**
  `bun test src/tests` $\rightarrow$ **365/365 tests PASS (100%)** trên 46 files.
- **Frontend Production Build:**
  `bun run build` $\rightarrow$ **0 errors, built in 2.25s**.

---

## 4. CÁC VẤN ĐỀ CÒN TỒN TẠI VÀ CHUYỂN GIAO SANG PHASE 2
- Kỹ năng Nói hiện duy trì trạng thái `NOT_ASSESSED` có chủ đích vì chưa tích hợp mô hình AI chấm phát âm audio trực tiếp.
- Khảo sát định vị trình độ (Adaptive Diagnostic Assessment) đã được tách rời an toàn khỏi Phase 1 và sẵn sàng để xây dựng trọn vẹn trong Phase 2.

---

## 5. KẾT LUẬN NGHIỆM THU
**Phase 1 chính thức ĐẠT (PASS)** toàn bộ tiêu chí kỹ thuật, bảo mật, toán học, hiệu năng cơ sở dữ liệu và giao diện người dùng. Đủ điều kiện chuyển giao sang **Phase 2 – Adaptive HSK Diagnostic Assessment**.
