# HƯỚNG DẪN KIẾN TRÚC VÀ ĐIỀU HƯỚNG API CHO AI AGENT (API_GUIDE.md)

**Dự án:** ZhongWenHub – Nền tảng Học tiếng Trung thông minh tích hợp AI  
**Framework:** ASP.NET Core 10 (`net10.0`)  
**Tài liệu OpenAPI / Swagger:** OpenAPI 3.0.1  
**Môi trường kích hoạt Swagger UI:** `Development` (Mặc định bị vô hiệu hóa trên `Production` để bảo mật)

---

## 1. ĐƯỜNG DẪN TÀI LIỆU VÀ TRUY XUẤT OPENAPI SCHEMA

Đối với AI Agent và lập trình viên:

| Tài nguyên | URL Path | Mô tả |
|---|---|---|
| **Swagger UI (Interactive)** | `/swagger` hoặc `/swagger/index.html` | Giao diện kiểm thử trực tiếp kèm nút `Authorize 🔓` |
| **OpenAPI 3.0 Schema (JSON)** | `/swagger/v1/swagger.json` | Toàn bộ schema máy đọc (Paths, Operations, Parameters, RequestBody, Responses, Components/Schemas) |
| **Health Check Endpoint** | `/health` hoặc `/api/v1/system/health` | Kiểm tra trạng thái hoạt động của Backend và kết nối SQL Server |

> **Cách AI Agent phân tích tự động:**  
> AI Agent có thể gửi HTTP `GET /swagger/v1/swagger.json` để phân tích cấu trúc json của bất kỳ endpoint nào, đọc chính xác schema của request body, query parameters, mã HTTP response (200, 400, 401, 403, 404, 500) và các model DTO trong `components.schemas`.

---

## 2. CƠ CHẾ XÁC THỰC (JWT BEARER AUTHENTICATION)

Toàn bộ các endpoint yêu cầu xác thực sử dụng chuẩn **HTTP Bearer JWT**.

### 2.1. Lấy Access Token
Gửi request đăng nhập:
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "usernameOrEmail": "student@zhongwenhub.edu.vn",
  "password": "StudentPassword123!"
}
```
Response trả về:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {
    "id": "guid",
    "roles": ["STUDENT"]
  }
}
```

### 2.2. Gắn Token vào Request
Trong Swagger UI:
1. Nhấn nút **Authorize 🔓** (ở góc trên bên phải).
2. Dán chuỗi `accessToken` vào ô **Value**.
3. Nhấn **Authorize** và **Close**. Swagger UI sẽ tự động gửi kèm header:
   ```http
   Authorization: Bearer <accessToken>
   ```

Khi gọi bằng `curl` hoặc Agent script:
```bash
curl -X GET "http://localhost:5000/api/v1/learning/me/hsk-progress" \
     -H "Authorization: Bearer <accessToken>" \
     -H "Accept: application/json"
```

---

## 3. BẢNG TRA CỨU ĐIỀU HƯỚNG: ENDPOINT ↔ CONTROLLER ↔ SERVICE ↔ DTO ↔ ENTITY

Hệ thống Backend được phân bổ thành 11 nhóm Controller chính tương ứng với 198 endpoints/operations:

### 3.1. Nhóm Xác thực & Người dùng (Auth)
- **Controller:** `Backend/ZhongWenHub/Features/users/Auth/AuthController.cs`
- **Route Prefix:** `/api/v1/auth`
- **Số Endpoint:** 7
- **Business Service:** `Backend/ZhongWenHub/Features/users/Auth/AuthService.cs` (`IAuthService`), `ITokenService`
- **DTOs:** `Backend/ZhongWenHub/Features/users/Auth/` (`LoginRequestDto`, `RegisterRequestDto`, `LoginResponseDto`, `RefreshTokenRequestDto`)
- **Entities:** `ApplicationUser`, `UserRefreshToken`
- **Các Endpoint chính:**
  - `POST /api/v1/auth/login`: Đăng nhập, cấp JWT và refresh token.
  - `POST /api/v1/auth/register`: Đăng ký tài khoản mới (mặc định chuyển thẳng vào Dashboard).
  - `POST /api/v1/auth/refresh-token`: Làm mới JWT token.
  - `POST /api/v1/auth/logout`: Đăng xuất, hủy refresh token.
  - `GET /api/v1/auth/me`: Lấy thông tin tài khoản đang đăng nhập.

---

### 3.2. Nhóm AI Cá nhân hóa & Luyện tập Thích ứng (AILearningEngine)
- **Controller:** `Backend/ZhongWenHub/Features/users/AILearning/AILearningEngineController.cs`
- **Route Prefix:** `/api/v1/ai`
- **Số Endpoint:** 21
- **Business Services:**
  - `Backend/ZhongWenHub/Features/users/AILearning/AIExerciseService.cs` (`IAIExerciseService`)
  - `Backend/ZhongWenHub/Features/users/AILearning/AIErrorAnalysisService.cs` (`IAIErrorAnalysisService`)
  - `Backend/ZhongWenHub/Features/users/AILearning/CompetencyProfileService.cs` (`ICompetencyProfileService`)
  - `Backend/ZhongWenHub/Features/users/AILearning/RecommendationEngineV2.cs` (`IRecommendationEngineV2`)
- **DTOs:** `Backend/ZhongWenHub/Features/users/AILearning/AILearningDtos.cs`
- **Entities:** `AiGeneratedExercise`, `AiExerciseAttempt`, `StudentPracticeAttempt`, `LearningSkillStatistic`, `StudentCompetencyProfile`
- **Các Endpoint chính:**
  - `POST /api/v1/ai/exercises/generate`: Sinh bài tập AI cá nhân hóa theo HSK và kỹ năng.
  - `POST /api/v1/ai/exercises/{exerciseId}/attempts`: Nộp bài tập AI, chấm điểm ground-truth tại Backend, cập nhật hồ sơ năng lực và chống nộp bài trùng lặp bằng transaction nguyên tử.
  - `POST /api/v1/ai/exercises/adaptive/session`: Khởi tạo phiên luyện tập thích ứng bù đắp điểm yếu.
  - `POST /api/v1/ai/error-analysis/explain`: Phân tích sâu nguyên nhân lỗi sai bằng AI (hỗ trợ kiểm tra quyền sở hữu cross-user và caching kết quả).
  - `GET /api/v1/ai/error-analysis`: Báo cáo tổng quan lỗi sai theo 6 kỹ năng (giới hạn cửa sổ 200 lượt gần nhất).
  - `GET /api/v1/ai/recommendations`: Đề xuất lộ trình học tập cá nhân hóa V2.
  - `GET /api/v1/ai/competency-profile`: Xem hồ sơ năng lực Bayesian Knowledge Tracing theo kỹ năng.

---

### 3.3. Nhóm AI Gia sư & Hội thoại (AITutor)
- **Controller:** `Backend/ZhongWenHub/Features/users/AITutor/AITutorController.cs`
- **Route Prefix:** `/api/v1/ai-tutor`
- **Số Endpoint:** 1
- **Business Service:** `Backend/ZhongWenHub/Features/users/AITutor/AITutorService.cs` (`IAITutorService`), `AIProviderFactory`
- **DTOs:** `AITutorChatRequestDto`, `AITutorChatResponseDto`
- **Endpoint chính:**
  - `POST /api/v1/ai-tutor/chat`: Hội thoại tương tác trực tiếp với gia sư ảo tiếng Trung.

---

### 3.4. Nhóm Quản trị Nội dung Học tập (Content)
- **Controller:** `Backend/ZhongWenHub/Features/admin/Content/ContentController.cs`
- **Route Prefix:** `/api/v1/content`
- **Số Endpoint:** 88 (Khối lượng API lớn nhất trong hệ thống)
- **Business Service:** `Backend/ZhongWenHub/Features/admin/Content/ContentService.cs` (`IContentService`)
- **Entities:** `CourseEntity`, `UnitEntity`, `LessonEntity`, `VocabularyEntity`, `GrammarPoint`, `QuestionBankEntity`
- **Các Endpoint chính:**
  - `/api/v1/content/courses`: Quản lý danh sách khóa học HSK 1 - HSK 6.
  - `/api/v1/content/units`: Quản lý các unit theo bài học.
  - `/api/v1/content/lessons`: Quản lý bài học, hội thoại ngữ cảnh (`DialogueJson`), bài đọc.
  - `/api/v1/content/vocabularies`: Ngân hàng từ vựng chuẩn HSK 3.0 (Hanzi, Pinyin, Nghĩa tiếng Việt, ví dụ câu).
  - `/api/v1/content/grammar`: Ngân hàng điểm ngữ pháp HSK, cấu trúc chuẩn và giải thích.

---

### 3.5. Nhóm Tiến độ Học tập & Ôn tập SRS (Learning)
- **Controller:** `Backend/ZhongWenHub/Features/users/Learning/LearningController.cs`
- **Route Prefix:** `/api/v1/learning`
- **Số Endpoint:** 13
- **Business Service:** `Backend/ZhongWenHub/Features/users/Learning/LearningService.cs` (`ILearningService`)
- **Entities:** `StudentLessonProgress`, `StudentVocabularyProgress`, `StudentDailyActivity`, `StudentXpTransaction`
- **Các Endpoint chính:**
  - `GET /api/v1/learning/me/hsk-progress`: Tiến độ tổng thể theo từng cấp HSK của học viên.
  - `GET /api/v1/learning/me/lessons`: Tiến độ hoàn thành bài học.
  - `GET /api/v1/learning/me/vocabulary/srs`: Danh sách từ vựng đến hạn ôn tập theo thuật toán ngắt quãng SRS (Spaced Repetition System).
  - `POST /api/v1/learning/me/vocabulary/{vocabId}/review`: Ghi nhận kết quả ôn từ vựng (cập nhật interval, ease factor).

---

### 3.6. Nhóm Ngân hàng Câu hỏi & Đánh giá Đầu vào (QuestionBank)
- **Controller:** `Backend/ZhongWenHub/Features/users/QuestionBank/QuestionBankController.cs`
- **Route Prefix:** `/api/v1/question-bank`
- **Số Endpoint:** 21
- **Business Service:** `Backend/ZhongWenHub/Features/users/QuestionBank/QuestionBankService.cs`, `DiagnosticAssessmentService.cs`
- **Entities:** `QuestionBankEntity`, `QuestionBankPracticeSessionEntity`
- **Các Endpoint chính:**
  - `POST /api/v1/question-bank/diagnostic/start`: Khởi tạo bài kiểm tra năng lực HSK Placement Test (snapshot xáo trộn đề, ẩn đáp án).
  - `POST /api/v1/question-bank/diagnostic/submit`: Chấm điểm bài kiểm tra đầu vào, cập nhật `EstimatedHskLevel` với khóa chống nộp bài đồng thời.

---

### 3.7. Nhóm Bài thi & Khảo thí (Exams)
- **Controller:** `Backend/ZhongWenHub/Features/users/Exams/ExamsController.cs`
- **Route Prefix:** `/api/v1/exams`
- **Số Endpoint:** 8
- **Business Service:** `Backend/ZhongWenHub/Features/users/Exams/ExamService.cs` (`IExamService`)
- **Entities:** `ExamEntity`, `StudentExamAttempt`
- **Các Endpoint chính:**
  - Danh sách đề thi mô phỏng HSK, bắt đầu làm bài thi và nộp bài thi tính điểm.

---

### 3.8. Nhóm Video Học tập & Cloud Storage (Videos)
- **Controller:** `Backend/ZhongWenHub/Features/users/Videos/VideosController.cs`
- **Route Prefix:** `/api/v1/videos`
- **Số Endpoint:** 14
- **Business Service:** `Backend/ZhongWenHub/Features/users/Videos/LearningVideoService.cs` (`ILearningVideoService`), `IVideoStorageService`
- **Entities:** `LearningVideoEntity`, `VideoStorageCleanupJob`
- **Các Endpoint chính:**
  - Upload video bài giảng lên Cloudflare R2 / S3, đồng bộ trạng thái xử lý video và stream an toàn.

---

### 3.9. Nhóm Quản trị Người dùng & Phân quyền (AdminUsers)
- **Controller:** `Backend/ZhongWenHub/Features/admin/Users/AdminUsersController.cs`
- **Route Prefix:** `/api/v1/admin/users`
- **Số Endpoint:** 15
- **Yêu cầu quyền:** `[Authorize(Roles = "ADMIN")]`
- **Business Service:** `Backend/ZhongWenHub/Features/admin/Users/AdminUserService.cs` (`IAdminUserService`)
- **Các Endpoint chính:**
  - Quản lý danh sách người dùng, phân quyền Role (`STUDENT`, `TEACHER`, `CONTENT_MANAGER`, `ADMIN`), khóa/mở khóa tài khoản, điều chỉnh số dư ví học viên.

---

### 3.10. Nhóm Dashboard Thống kê Quản trị (AdminDashboard)
- **Controller:** `Backend/ZhongWenHub/Features/admin/Dashboard/AdminDashboardController.cs`
- **Route Prefix:** `/api/v1/admin/dashboard`
- **Số Endpoint:** 1
- **Yêu cầu quyền:** `[Authorize(Roles = "ADMIN")]`
- **Endpoint chính:**
  - `GET /api/v1/admin/dashboard/stats`: Thống kê tổng số học viên, doanh thu, lượt học bài và KPIs hệ thống.

---

### 3.11. Nhóm Hệ thống & Giám sát (System)
- **Controller:** `Backend/ZhongWenHub/Features/admin/System/SystemController.cs`
- **Route Prefix:** `/api/v1/system`
- **Số Endpoint:** 9
- **Các Endpoint chính:**
  - Cấu hình hệ thống, kiểm tra kết nối AI Provider, kiểm tra trạng thái dịch vụ lưu trữ.

---

## 4. BÁO CÁO THỰC TRẠNG METADATA & KHUYẾN NGHỊ KHẮC PHỤC

Kết quả quét tự động trên toàn bộ `198` endpoint/operation hiện có:

| Chỉ số | Số lượng | Tỷ lệ | Đánh giá |
|---|---|---|---|
| **Tổng số Operations** | 198 | 100% | Đầy đủ toàn bộ chức năng của hệ sinh thái |
| **Có Summary / Tiêu đề XML** | 14 | 7.1% | Tập trung ở các endpoint mới phát triển (AI Phase 3, Videos) |
| **Thiếu Summary / Description** | 184 | 92.9% | Các Controller kế thừa từ giai đoạn đầu chưa được gắn XML comments |
| **Có khai báo Type Schema trả về** | ~120 | 60.6% | Đã khai báo `[ProducesResponseType(typeof(T), 200)]` |
| **Trả về `IActionResult` không khai báo kiểu** | ~78 | 39.4% | Cần bổ sung Generic type để Swagger UI render cây JSON response |

### Các vấn đề cần cải thiện tiếp theo (Best Practices):
1. **Bổ sung XML Comments trên Controller:** Thêm thẻ `<summary>` trên 184 method trong `ContentController.cs`, `AdminUsersController.cs`, `LearningController.cs` và `QuestionBankController.cs` để hiển thị mô tả tiếng Việt chi tiết trên Swagger UI.
2. **Khai báo `[ProducesResponseType(typeof(T), StatusCodes.Status200OK)]` đồng bộ:** Đối với các endpoint trả về `IActionResult` đơn thuần, khai báo rõ ràng DTO trả về để Swagger UI hiển thị đầy đủ Example Schema cho lập trình viên Frontend và AI Agent.
3. **Khai báo mã lỗi cụ thể:** Bổ sung `[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]`, `Status401Unauthorized`, `Status403Forbidden` để tài liệu phản ánh chính xác các kịch bản ngoại lệ nghiệp vụ.

