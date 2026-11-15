# ZHONGWENHUB – BÁO CÁO KHẮC PHỤC PHASE 5 FINAL FIX

**Repository:** `nguyen2234/ZhongWenHub`  
**Branch:** `feature/ai-personalization-phase5`  
**Ngày thực hiện:** 16/11/2026  
**Mục tiêu:** Khắc phục triệt để ba vấn đề được phát hiện qua code review trong hệ thống AI Speaking Practice & Conversation Room, bảo đảm tính trung thực sư phạm, độ chính xác của thuật toán và tính toàn vẹn dữ liệu hồ sơ học viên.

---

## 1. TỔNG QUAN CÁC VẤN ĐỀ VÀ PHƯƠNG ÁN KHẮC PHỤC

### 1.1. Vấn đề 1: Phân định ranh giới DirectText và Audio Speaking
- **Thực trạng trước sửa:** Chế độ nhập văn bản trực tiếp (`DirectText`) tạo ra bản ghi `StudentPracticeAttempt` với `Category = "speaking"`, khiến học viên gõ phím vẫn được tính điểm năng lực Nói trong `CompetencyProfileService` và thống kê luyện âm thanh.
- **Giải pháp triển khai:**
  1. Trong `AISpeakingService.SubmitPracticeAsync`: Phân biệt tường minh `isAudioAttempt = audioStream != null && audioStream.Length > 0`.
  2. Khi `!isAudioAttempt` (DirectText):
     - Gắn nhãn `AudioStorageStatus = "DIRECT_TEXT"` và `DurationSeconds = 0`.
     - **Tuyệt đối không tạo `StudentPracticeAttempt` thuộc category `speaking`**.
     - Trả về cờ `IsDirectTextInput = true` kèm ghi chú: `[Thử nghiệm DirectText: Không tính vào điểm năng lực Nói hoặc thống kê âm thanh]`.
  3. Trong `AISpeakingService.GetStatsAsync`: Lọc bỏ toàn bộ bản ghi có `AudioStorageStatus == "DIRECT_TEXT"` hoặc `DurationSeconds == 0`.
  4. Trong `CompetencyProfileService.cs`:
     - Tách bạch truy vấn kỹ năng Nói: Đọc trực tiếp từ `AiSpeakingAttempts` với điều kiện `AudioStorageStatus != "DIRECT_TEXT"` và `DurationSeconds > 0`.
     - Loại trừ toàn bộ các bản ghi `StudentPracticeAttempts` cũ có `Category == "speaking"` để bảo đảm dữ liệu DirectText trong quá khứ không làm sai lệch hồ sơ.
     - Chỉ kích hoạt `HasSpeakingAudioData = true` và tính điểm khi có ít nhất 1 lượt luyện phát âm bằng âm thanh hợp lệ.

### 1.2. Vấn đề 2: Sửa thuật toán đánh giá Transcript (True Forward LCS Alignment)
- **Thực trạng trước sửa:** Thuật toán tính `ComputeLcs` nhưng trong vòng lặp so khớp lại dùng `cleanRecognized.Contains(cleanTarget[i])`. Điều này dẫn đến:
  - Cho phép một ký tự được so khớp nhiều lần (ví dụ: "妈妈" chỉ đọc 1 chữ "妈" vẫn đạt 100%).
  - Bỏ qua trật tự trước sau (ví dụ: "苹果" đọc đảo thành "果苹" vẫn nhận diện đúng 100%).
  - Các thông báo khẳng định quá mức "phát âm chuẩn", "phát âm chính xác" dù chưa có phân tích âm học.
- **Giải pháp triển khai:**
  1. Loại bỏ hoàn toàn `string.Contains()`.
  2. Triển khai thuật toán **Forward LCS Dynamic Programming**:
     - Bảng quy hoạch động `dp[i, j]` duyệt tiến từ đầu câu đến cuối câu.
     - Truy vết thuận (forward backtracking) bảo đảm căn chỉnh từ trái sang phải khớp với quy luật phát âm và đọc chữ.
     - **Bảo đảm tiên quyết:** Mỗi ký tự đích chỉ được ghép với tối đa 1 ký tự nhận diện tương ứng (`1-to-1 mapping`), bảo toàn thứ tự nghiêm ngặt.
  3. Xử lý triệt để các trường hợp biên:
     - **Ký tự lặp:** "妈妈" nói "妈" -> 1 MATCHED, 1 MISSED -> Điểm 50.0%.
     - **Đảo vị trí:** "苹果" nói "果苹" -> 1 MATCHED, 1 MISSED, 1 EXTRA -> Điểm 50.0%.
     - **Ký tự thừa:** "你好" nói "你好啊" -> 2 MATCHED, 1 EXTRA ("啊") -> Điểm chuẩn hóa $2 / \max(2, 3) = 66.7\%$.
     - **Ký tự thiếu:** "今天天气很好" nói "今天很好" -> 4 MATCHED, 2 MISSED -> Điểm 66.7%.
  4. Cập nhật thông điệp sư phạm: Đổi tất cả cụm từ "phát âm chuẩn", "phát âm chính xác" thành **"nội dung nhận diện khớp"** vì hệ thống thực hiện căn chỉnh văn bản từ STT (Transcript Alignment), chưa đo đạc thanh điệu/âm học chuyên sâu.

### 1.3. Vấn đề 3: Loại bỏ Confidence STT giả mạo
- **Thực trạng trước sửa:** `GeminiSpeechRecognitionService.cs` gán cứng `Confidence = 0.95`. Gemini API `generateContent` trả về chuỗi văn bản thuần, không cung cấp độ tin cậy âm học.
- **Giải pháp triển khai:**
  1. Chuyển đổi thuộc tính trong `SpeechRecognitionResult`: `double? Confidence = null` và `ConfidenceStatus = "UNAVAILABLE"`.
  2. Xóa bỏ hoàn toàn giá trị giả `0.95`, không thay thế bằng bất kỳ số ngẫu nhiên nào khác.
  3. Bổ sung `SttConfidence` (nullable) và `SttConfidenceStatus` vào `SpeakingAssessmentResultDto` và TypeScript interface.
  4. Frontend UI hiển thị `Nhà cung cấp không hỗ trợ (N/A)` khi độ tin cậy không có sẵn.

---

## 2. DANH SÁCH FILE THAY ĐỔI

| STT | Tệp tin | Thay đổi chính |
| :--- | :--- | :--- |
| 1 | `Backend/src/Business/AILearning/Services/Speech/ISpeechRecognitionService.cs` | Thêm `double? Confidence`, `ConfidenceStatus = "UNAVAILABLE"`. |
| 2 | `Backend/src/Business/AILearning/Services/Speech/GeminiSpeechRecognitionService.cs` | Xóa `0.95`, trả về `Confidence = null` và `ConfidenceStatus = "UNAVAILABLE"`. |
| 3 | `Backend/src/Business/AILearning/DTOs/AISpeakingDtos.cs` | Thêm `SttConfidence`, `SttConfidenceStatus`, `IsDirectTextInput`, hỗ trợ trạng thái `EXTRA`. |
| 4 | `Backend/src/Business/AILearning/Services/Speech/IAIPronunciationService.cs` | Bổ sung tham số `sttConfidence`, `sttConfidenceStatus`, `isDirectTextInput`. |
| 5 | `Backend/src/Business/AILearning/Services/Speech/AIPronunciationService.cs` | Xóa `Contains()`, triển khai Forward LCS, chuẩn hóa điểm theo $\max(m, n)$, cập nhật từ ngữ "nội dung nhận diện khớp". |
| 6 | `Backend/src/Business/AILearning/Services/Speech/AISpeakingService.cs` | Phân biệt audio/DirectText, chặn ghi attempt `speaking` từ DirectText, lọc thống kê chỉ tính audio. |
| 7 | `Backend/src/Business/AILearning/Services/Competency/CompetencyProfileService.cs` | Đọc Speaking độc lập từ audio `AiSpeakingAttempts`, bảo vệ khỏi dữ liệu DirectText cũ, giữ `NOT_ASSESSED` khi chưa có audio. |
| 8 | `Backend/tests/ZhongWenHub.UnitTests/AIPhase5SpeakingTests.cs` | Thêm 4 regression tests mới: DirectText isolation, duplicate chars, inverted order, extra chars, STT confidence null. |
| 9 | `Fontend/src/features/ai/services/speaking.service.ts` | Bổ sung `isDirectTextInput`, `sttConfidence`, `sttConfidenceStatus`, `EXTRA` status. |
| 10 | `Fontend/src/features/skills/pages/SkillSpeakingPage.tsx` | Hiển thị tag DirectText, hiển thị độ tin cậy STT `(N/A)` khi không có dữ liệu thật. |
| 11 | `Fontend/src/tests/ai-phase5-speaking.test.ts` | Cập nhật hợp đồng kiểm thử Frontend cho DirectText, STT confidence null và word breakdown. |

---

## 3. KẾT QUẢ KIỂM THỬ HỆ THỐNG

### 3.1. Backend Tests
- **Unit Tests (`ZhongWenHub.UnitTests`):**
  - Số lượng: **285 / 285 PASSED** (thêm mới 5 test hồi quy cho Phase 5 Final Fix).
  - Test lọc `AIPhase`: **48 / 48 PASSED** (toàn bộ Phase 3, Phase 4, Phase 5 đều xanh).
- **Integration Tests (`ZhongWenHub.IntegrationTests`):**
  - Số lượng: **109 / 109 PASSED**.

### 3.2. Frontend Tests & Build
- **Unit & Contract Tests:** **388 / 388 PASSED** (4,761 assertions).
- **Lint (`oxlint`):** **0 Error**.
- **Production Build (`bun run build`):** **Thành công** trong 1.48s.

---

## 4. CAM KẾT & TRẠNG THÁI NGHIỆM THU

1. **An toàn cơ sở dữ liệu:** Tuân thủ tuyệt đối nguyên tắc Zero-Write cho `ZhongWenHub_Dev`.
2. **Không merge vào `main`:** Lưu trữ an toàn trên branch `feature/ai-personalization-phase5`.
3. **Không triển khai Phase 6:** Dừng lại tại điểm nghiệm thu để ChatGPT kiểm tra độc lập theo đúng chỉ đạo.
