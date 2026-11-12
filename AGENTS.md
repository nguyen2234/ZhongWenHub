# ZhongWenHub Workspace Rules

## 1. Báo cáo & Tạo file Markdown
- **KHÔNG tự động tạo file `.md` báo cáo / tổng kết sau mỗi nhiệm vụ** trong `docs/` hay thư mục gốc, trừ khi người dùng yêu cầu tường minh tạo tài liệu.
- Trình bày kết quả, phân tích và kiểm chứng trực tiếp trong nội dung trả lời chat.

## 2. Tối ưu Ngữ cảnh & Loại trừ Tìm kiếm
- Không quét hoặc đọc hàng loạt các thư mục build, tạm, backup và tài liệu lịch sử khi đang làm việc trên tính năng hiện tại:
  - `node_modules/`, `**/bin/`, `**/obj/`, `Fontend/dist/`, `resources/`, `backups/`, `*.bak`, `*.sql`
  - `Fontend/scratch/`, `Fontend/test-results/`, `Fontend/playwright-report/`, `test-results/`
  - `Fontend/screenshots/`, `Fontend/e2e/screenshots/`
  - `docs/hsk30/`, `scripts/hsk30/`, `data/hsk30/` (chỉ mở khi nhiệm vụ yêu cầu đối chiếu lịch sử HSK 3.0)
- Các file Backend lớn (`ContentService.cs`, `QuestionBankService.cs`, `AdminUserService.cs`, `LearningService.cs`, `ContentController.cs`): luôn tìm vị trí hàm trước và đọc theo `StartLine`/`EndLine` hẹp.
- Chú ý chính tả tên thư mục Frontend trong repo là `Fontend/` (không phải `Frontend/`).

## 3. An toàn Database & Kiểm chứng chuẩn
- `ZhongWenHub_Dev`: chỉ đọc (Zero-Write). Không thay đổi dữ liệu dev/prod khi chưa có phê duyệt.
- Không commit/push khi chưa được người dùng xác nhận.
- Kiểm tra nhanh Frontend: `cd Fontend && bun run lint && bun test src/tests`
- Kiểm tra nhanh Backend: `dotnet test Backend/tests/ZhongWenHub.UnitTests/ZhongWenHub.UnitTests.csproj`

