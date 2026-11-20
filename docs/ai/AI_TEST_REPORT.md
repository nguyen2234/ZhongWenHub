# ZhongWenHub — AI Learning Engine V1 Test Report (`AI_TEST_REPORT.md`)

- **Ngày kiểm thử:** 2026-11-12
- **Môi trường:** .NET 10, SQL Server (`ZhongWenHub_Dev` & `ZhongWenHub_Test`), Bun + Vite + Playwright

---

## 1. Tổng hợp kết quả kiểm thử

| Hạng mục kiểm thử | Kết quả | Chi tiết |
|---|---|---|
| **Backend Unit Tests** | **PASS (`130/130`)** | `dotnet test Backend/tests/ZhongWenHub.UnitTests/ZhongWenHub.UnitTests.csproj` (bao gồm `8` test mới trong `AILearningEngineTests.cs`: `MockAIProvider`, `ConfigurableAIProvider` no-fallback, `ExtractUsageMetadata`, `PromptSanitizer`, Exercise Validator, Error Analysis, Personalized Learning) |
| **Backend AI Integration Tests** | **PASS (`7/7`)** | `AITutorIntegrationTests` + `AILearningEngineIntegrationTests`: 401 unauthorized, 503 missing key no-fallback, conversation persistence & UserId ownership, prompt injection guard, exercise generation & attempt, error analysis, personalized recommendations, `ai_usage_logs` tracking |
| **Frontend TypeScript (`tsc -b`)** | **PASS (`0` errors)** | Đã khắc phục lỗi `VocabularyDetailDrawer.tsx:275` |
| **Frontend Lint (`oxlint`)** | **PASS (`0` errors)** | Không phát sinh lỗi mới |
| **Frontend Unit Tests (`bun test src/tests`)** | **PASS (`334/334`)** | 41 files test (`4.518` assertions), bao gồm `ai-learning-engine-v1.test.ts` |
| **Frontend Production Build (`vite build`)** | **PASS** | `built in 1.47s` (`dist/` sạch) |
| **Playwright E2E (Desktop 1440px & Mobile 375px)** | **PASS** | `/ai-learning`, `/conversation`, `/ai-exercises`, `/ai-analytics`: `PAGE_ERRORS=0`, `desktopOverflow=false`, `mobileOverflow=false` |
| **Database Migration** | **PASS** | `20261112150501_AddAiLearningEngineTables` áp dụng thành công trên cả `ZhongWenHub_Dev` và `ZhongWenHub_Test` |
| **Secret Scan (`scan_secrets.py`)** | **PASS** | `ZERO SECRETS FOUND` |

---

## 2. Lỗi còn tồn tại / Lưu ý
- `oxlint` còn các cảnh báo (warnings) có sẵn ở các file cũ không thuộc phạm vi thay đổi; `0` lỗi (errors).
- `vite build` có cảnh báo kích thước chunk lớn (>500 kB) có sẵn từ trước.
