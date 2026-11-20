# ZhongWenHub — AI Learning Engine V1 Deployment Guide (`AI_DEPLOYMENT_GUIDE.md`)

## 1. Cấu hình Backend (API Key & Provider)
- **Không bao giờ** lưu API key trong `appsettings.json`, `appsettings.Development.json` hoặc mã nguồn Frontend.
- Cấu hình qua `.NET User Secrets` (Development) hoặc biến môi trường (Production/Staging):
  - `Gemini__Provider`: `"Gemini"` (mặc định gọi Gemini API) hoặc `"Mock"` (chỉ dùng cho kiểm thử offline). Hệ thống **không tự động fallback** sang nhà cung cấp khác nếu chưa cấu hình.
  - `Gemini__ApiKey` hoặc `GEMINI_API_KEY`: API key Gemini hợp lệ.
  - `Gemini__Model`: ví dụ `gemini-3.5-flash-lite` hoặc `gemini-2.5-flash`.
  - `Gemini__TimeoutSeconds`: mặc định `30` (giới hạn `5..120`).
  - `Gemini__MaxRetries`: mặc định `2` (exponential backoff + jitter cho HTTP 429/502/503/504).
  - `Gemini__MaxInputLength`: mặc định `1500` ký tự.
  - `Gemini__MaxOutputTokens`: mặc định `4096` tokens.
  - `Gemini__DailyTokenBudgetPerUser`: mặc định `60000` tokens/ngày/người dùng.
  - `Gemini__RateLimitPermitPerMinute`: mặc định `20` requests/phút/người dùng (`30` ở Development).

---

## 2. Database Migration & Rollback (`ZhongWenHub_Dev`)
- **Migration mới:** `20261112150501_AddAiLearningEngineTables` (`Backend/src/Data/Persistence/Migrations/`).
- **Áp dụng migration:**
  ```bash
  dotnet ef database update --project Backend/src/Data/ZhongWenHub.Data.csproj --startup-project Backend/src/Api/ZhongWenHub.Api.csproj
  ```
- **Rollback về trước khi triển khai AI Learning Engine V1:**
  ```bash
  dotnet ef database update 20261103165910_AddStudentLearningProgressTables --project Backend/src/Data/ZhongWenHub.Data.csproj --startup-project Backend/src/Api/ZhongWenHub.Api.csproj
  ```

---

## 3. Chi phí Token dự kiến & Giới hạn sử dụng
- **AI Tutor:** ~400–900 tokens/lượt (tùy ngữ cảnh bài học và lịch sử tối đa 8 lượt).
- **AI Conversation:** ~350–700 tokens/lượt.
- **AI Exercise Generator (3 câu):** ~700–1.300 tokens/lần tạo.
- **Personalized Learning:** `0` tokens cho chế độ mặc định (`explain=false`); ~250–450 tokens khi người học bấm `"Giải thích lộ trình bằng AI"`.
- **Ngân sách an toàn:** Với `DailyTokenBudgetPerUser = 60000`, mỗi học viên được giới hạn tối đa ~60–100 tương tác AI/ngày, giúp kiểm soát chi phí vận hành.
