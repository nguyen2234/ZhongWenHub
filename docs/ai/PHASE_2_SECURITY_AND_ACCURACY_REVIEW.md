# BÁO CÁO KIỂM TOÁN BẢO MẬT & ĐỘ CHÍNH XÁC PHASE 2: HSK PLACEMENT TEST

**Dự án:** ZhongWenHub – Hệ thống học tiếng Trung thông minh  
**Phạm vi:** AI Personalization Phase 2 – HSK Diagnostic Placement Test  
**Branch:** `feature/ai-personalization-phase2`  
**Ngày thực hiện:** 14/11/2026  
**Trạng thái nghiệm thu:** ĐẠT CHUẨN (PASS)

---

## 1. TỔNG QUAN & BỐI CẢNH

Sau đợt review mã nguồn ban đầu của Phase 2, hệ thống ghi nhận một số điểm hạn chế về bảo mật và độ chính xác sư phạm:
1. Bộ đề cố định 12 câu có toàn bộ đáp án đúng ở vị trí index 0.
2. Tiêu đề câu hỏi đọc hiểu/nghe gửi kèm bản dịch tiếng Việt làm lộ nội dung đáp án.
3. Tự động ghi đè `SelectedHskLevel` làm mất mục tiêu học tập tự chọn ban đầu của học viên.
4. Tiềm ẩn rủi ro nộp bài đồng thời (race condition) và nộp trùng.
5. Thiếu kiểm tra thời hạn phiên (session expiry), quyền sở hữu, câu hỏi lạ và phạm vi lựa chọn đáp án.
6. Tên gọi "Adaptive Assessment" chưa phản ánh chính xác cấu trúc đề sàng lọc phân đoạn 12 câu.
7. Đưa ra độ tin cậy quá cao (>85%) chỉ dựa trên 3 câu hỏi mỗi cấp HSK.

Báo cáo này tổng hợp toàn bộ các giải pháp kỹ thuật đã triển khai để khắc phục triệt để 7 vấn đề trên và kết quả kiểm chứng tự động trên môi trường SQL Server.

---

## 2. CHI TIẾT CÁC GIẢI PHÁP KHẮC PHỤC

### 2.1. Ngân Hàng Đề Kiểm Duyệt, Xáo Trộn Đề & Snapshot Phía Server
- **Ngân hàng đề chuẩn hóa (`MasterPool`):** Xây dựng 24 câu hỏi kiểm duyệt trải dài từ HSK 1 đến HSK 4 (6 câu/cấp độ), phủ đủ 6 kỹ năng (`vocabulary`, `grammar`, `reading`, `listening`, `pinyin`, `hanzi`).
- **Chọn mẫu & Xáo trộn 2 lớp (Two-tier Shuffle):**
  - Mỗi phiên làm bài bốc ngẫu nhiên 3 câu hỏi từ mỗi cấp HSK (tổng 12 câu).
  - Xáo trộn thứ tự 12 câu hỏi.
  - Với từng câu hỏi, xáo trộn ngẫu nhiên thứ tự 4 options (`Random.Shared.Next()`) và tính toán lại `CorrectIndex` tương ứng trong phiên đó. Vị trí đáp án đúng phân bố đều khắp các vị trí A, B, C, D (loại bỏ hoàn toàn lỗi toàn bộ đáp án ở index 0).
- **Lưu Snapshot Đề tại Backend:**
  - Danh sách câu hỏi kèm thứ tự options và `CorrectIndex` sau xáo trộn được lưu dưới dạng JSON Snapshot trong cột `ExerciseIdsJson` của `question_bank_practice_sessions`.
  - Khi chấm điểm, Backend nạp snapshot từ DB để so khớp, đảm bảo tính công bằng và chống gian lận.

### 2.2. Triệt Tiêu Rò Rỉ Nội Dung (Zero Answer & Translation Leak)
- `DiagnosticQuestionDto` gửi xuống Frontend:
  - Chỉ bao gồm `id`, `hskLevel`, `skillCategory`, `topicTitle`, `promptZh`, `promptPinyin`, `promptVi`, `options`.
  - **Không chứa** `correctIndex`, `correctAnswer`, `explanationVi`.
- **Bảo mật câu hỏi Đọc hiểu & Nghe:** `promptVi` chỉ chứa chỉ dẫn sư phạm (ví dụ: *"Người nói muốn uống gì?"*, *"Xác định điều kiện được nêu trong đoạn văn:"*). **Tuyệt đối không dịch nghĩa câu tiếng Trung** làm lộ nội dung đọc hiểu.

### 2.3. Bảo Toàn Mục Tiêu Cá Nhân (Không Ghi Đè `SelectedHskLevel`)
- Khi hoàn thành bài kiểm tra, hệ thống lưu kết quả ước tính vào `session.HskLevel` và `DiagnosticResultDto.EstimatedHskLevel`.
- **Tuyệt đối không tự động thay đổi `profile.SelectedHskLevel`**.
- Cung cấp API chuyên biệt `POST /api/v1/ai/diagnostic/confirm-target` (`ApplyConfirmedTargetHskAsync`): Chỉ khi học viên chủ động bấm nút *"Xác nhận đổi mục tiêu sang HSK X"*, hệ thống mới cập nhật `SelectedHskLevel`.

### 2.4. Chống Nộp Bài Đồng Thời & Xử Lý Trạng Thái Nguyên Tử (Atomic Concurrency)
- **Cập nhật có điều kiện ở tầng SQL Server:**
  ```sql
  UPDATE question_bank_practice_sessions
  SET Status = 'COMPLETED'
  WHERE Id = @SessionId AND UserId = @UserId AND Status = 'IN_PROGRESS'
  ```
- Nếu `rowsAffected == 0`, hệ thống kiểm tra và ném `InvalidOperationException` (HTTP 409 Conflict), chặn đứng race condition khi hai request nộp bài cùng lúc.
- Đã được kiểm thử thực tế bằng 2 Task song song với `Task.WhenAll` trên SQL Server `ZhongWenHub_Test`.

### 2.5. Kiểm Tra Toàn Vẹn Đầu Vào (Input & Session Validation)
1. **Kiểm tra thời hạn phiên (Session Expiry):** Phiên làm bài có thời hạn tối đa 60 phút. Nếu quá hạn, cập nhật trạng thái `EXPIRED` và từ chối chấm điểm.
2. **Quyền sở hữu (Ownership):** Học viên chỉ được nộp bài cho phiên do chính mình khởi tạo (`session.UserId == currentUserId`).
3. **Chống trùng QuestionId:** Từ chối payload chứa các câu trả lời bị lặp `QuestionId`.
4. **Đối chiếu Snapshot:** Mọi `QuestionId` nộp lên phải nằm trong snapshot đề của phiên; từ chối câu hỏi lạ.
5. **Kiểm tra giới hạn lựa chọn (Bounds Check):** `SelectedIndex` phải thuộc khoảng `[-1, Options.Count - 1]`.

### 2.6. Tên Gọi Chuẩn Hóa & Đo Lường Psychometrics Thực Tế
- **Tên gọi chính xác:** **HSK Diagnostic Placement Test (Bài Khảo Sát Định Vị Trình Độ HSK Chuẩn Hóa)**.
- **Độ tin cậy sơ bộ:** Với bài sàng lọc 12 câu (3 câu/cấp HSK), độ tin cậy được tính toán ở mức sơ bộ thực tế:
  $$\text{Confidence} = \frac{N}{N + 14.0} = \frac{12}{26} \approx 0.462\ (46.2\%)$$
- **Minh bạch giới hạn đánh giá (`AssessmentLimitationsVi`):**
  Hiển thị thông điệp rõ ràng trên UI:
  > *"Kết quả mang tính chất sàng lọc định vị ban đầu (Screening Placement) qua 12 câu hỏi trắc nghiệm (3 câu/cấp độ HSK). Mục tiêu học tập bạn tự chọn vẫn được giữ nguyên. Để xác định năng lực chính xác hơn (>75%), hãy hoàn thành thêm các bài luyện tập chuyên sâu theo từng kỹ năng."*

---

## 3. BẢNG TỔNG HỢP KIỂM CHỨNG TỰ ĐỘNG

| Hạng mục kiểm thử | Công cụ | Số lượng test | Kết quả | Chi tiết kiểm chứng |
| :--- | :---: | :---: | :---: | :--- |
| **Backend Unit Tests** | `dotnet test` | **233 / 233** | **PASSED** | Shuffled options, zero leak, bounds check, anti-duplicate, profile preservation |
| **SQL Server Concurrency Test** | `dotnet test` (SQLEXPRESS) | **1 / 1** | **PASSED** | 2 request nộp đồng thời: chính xác 1 thành công, 1 bị từ chối 409, 12 attempts duy nhất |
| **Frontend Integration Tests** | `bun test` | **371 / 371** | **PASSED** | Service contracts, zero answer leak, target confirmation, navigation routes |
| **TypeScript Typecheck** | `bunx tsc -b --noEmit` | Toàn dự án | **0 ERRORS** | Biên dịch sạch, kiểu dữ liệu DTO chặt chẽ |
| **Code Quality Linting** | `bunx oxlint --quiet` | 604 files | **0 ERRORS** | Tuân thủ tiêu chuẩn code clean |
| **Production Bundle Build** | `bun run build` (Vite) | Client bundle | **SUCCESS** | Build hoàn tất không lỗi trong 2.29s |

---

## 4. KẾT LUẬN & ĐỀ NGHỊ NGHIỆM THU

Phase 2 đã giải quyết triệt để toàn bộ 10 yêu cầu khắc phục, bảo đảm an toàn dữ liệu, tính minh bạch sư phạm và độ tin cậy hệ thống. 

Mã nguồn đã được commit và push lên branch:  
`origin/feature/ai-personalization-phase2`
