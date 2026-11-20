# BÁO CÁO NGHIỆM THU CMS VÀ CỔNG HỌC VIÊN PHASE 4
## HSK 3.0 Master Curriculum — CMS & Student Portal Acceptance Report

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Dự án** | ZhongWenHub — Nền tảng Học tiếng Trung & Luyện thi HSK 3.0 |
| **Giai đoạn** | Phase 4: Academic Content Refinement & Real Multimedia Learning |
| **Mã tài liệu** | `HSK30_PHASE4_CMS_STUDENT_ACCEPTANCE` |
| **Không gian nghiệm thu** | CMS Web Console (`/admin/content-repository`) & Cổng Học Viên (`/learning-path`) |
| **Thời điểm nghiệm thu** | 08/11/2026 |
| **Trạng thái nghiệm thu** | **ĐẠT TIÊU CHUẨN NGHIỆM THU — THÔNG SUỐT ĐA PHƯƠNG TIỆN** |

---

## 1. TỔNG QUAN NGHIỆM THU KHÔNG GIAN CMS

### 1.1. Khả năng Quản trị Toàn diện 140 Bài học
- Biên tập viên và Quản trị viên truy cập vào Bàn làm việc Quản lý Nội dung nhìn thấy đầy đủ cây giáo trình gồm **6 Khóa học, 35 Chương học và 140 Bài học**.
- Dữ liệu hiển thị của mỗi bài học bao gồm:
  - Mã GUID và Thứ tự bài học (`LessonNumber`).
  - Mục tiêu sư phạm chuẩn hóa (`Summary`), không còn placeholder dạng `'Bài học X: [Tên]'`.
  - Cấu trúc hội thoại đa lượt lời kèm liên kết tệp âm thanh `.mp3` thực tế.
  - Câu hỏi nghe hiểu thuộc 1 trong 5 dạng sư phạm chuyên sâu (`DETAIL`, `MAIN_IDEA`, `INFERENCE`, `RESPONSE`, `SEQUENCE`).
  - 4 phương án lựa chọn và lời giải thích đối chiếu ngữ liệu.

### 1.2. Trình Xem trước và Hiệu chỉnh (Preview & Inline Editor)
- Ngăn kéo `AdminLessonEditorPage` và `LessonPreviewCanvas` cho phép:
  - Nghe trực tiếp tệp âm thanh phát qua trình phát tích hợp.
  - Xem trước giao diện người học (Student View) ở chế độ Tập trung (Focus Mode).
  - Tùy chỉnh trực tiếp câu thoại, pinyin, dịch nghĩa, phương án đúng và phương án nhiễu.
- **Cơ chế Phân quyền và Lịch sử Thẩm định**:
  - Ghi nhận đầy đủ thông tin: `UpdatedByUserId`, `ReviewedByUserId`, `ReviewedAt`, `ReviewNotes`.
  - **Không tự động xuất bản (No Auto-Publishing)**: Mọi thao tác lưu dữ liệu đều duy trì trạng thái `DRAFT` / `PENDING_EDITORIAL_REVIEW`. Quyền xuất bản công khai yêu cầu thao tác riêng biệt của Quản trị viên cấp cao.

---

## 2. NGHIỆM THU KHÔNG GIAN CỔNG HỌC VIÊN (STUDENT PORTAL)

### 2.1. Lộ trình Khám phá 6 Cấp độ HSK
- Học viên khám phá toàn bộ 6 cấp độ HSK 1–6 qua thanh điều hướng trực quan.
- Hệ thống phân biệt rõ ràng hai trạng thái bài học:
  1. **Bài học Mẫu Đã Xuất bản (`PUBLISHED`)**: Bao gồm Bài 1, 2, 3 của HSK 1. Học viên có thể nhấp vào học ngay với đầy đủ tính năng: Mục tiêu, Thẻ từ vựng, Ngữ pháp, Hội thoại tương tác, Luyện nghe hiểu và Bài tập củng cố.
  2. **Bài học Đang Biên soạn (`DRAFT`)**: 137 bài còn lại hiển thị nhãn trạng thái `"Đang biên soạn & Thẩm định chuyên môn"`, nút học bị vô hiệu hóa kèm thông điệp rõ ràng, ngăn chặn việc học viên tiếp cận nội dung chưa qua kiểm duyệt.

### 2.2. Tích hợp Trình phát Âm thanh Thực tế (Real Audio Playback Experience)
- Khi học viên vào học Bài 1, 2, 3:
  - **Trình phát Hội thoại**:
    - Nút phát âm thanh hội thoại liên kết trực tiếp đến tệp âm thanh thực tế (`/audio/hsk1/les1_dialogue.mp3`) và từng câu thoại riêng lẻ.
    - Trình phát tích hợp đầy đủ chỉ báo trạng thái: `Đang tải (Loading)` -> `Đang phát (Playing)` -> `Hoàn thành (Ended)`.
    - Có cơ chế dự phòng thông minh (Graceful Fallback): Nếu thiết bị học viên bị chặn phát tệp âm thanh bên ngoài, hệ thống tự động kích hoạt Web Speech API (`SpeechSynthesis`) để phát âm câu thoại mà không gây gián đoạn hay báo lỗi ứng dụng.
  - **Trình phát Luyện nghe hiểu (Listening Comprehension)**:
    - Nút nghe băng liên kết với tệp âm thanh câu hỏi (`/audio/hsk1/les1_listening.mp3`).
    - Học viên nghe đoạn thoại -> Chọn 1 trong 4 phương án -> Hệ thống phản hồi tức thì với chỉ báo Đúng/Sai, lời giải thích chi tiết và hiển thị kịch bản nghe đối chiếu Hán - Việt.

### 2.3. Bảo vệ Cách ly Dữ liệu Nháp & Tuyệt đối Không Dùng Mock Data
- **Chặn truy cập qua URL trực tiếp**: Thử nghiệm gửi request `GET /api/v1/content/lessons/AAAAAAAA-4444-4444-4444-444444444444` (Bài 4 DRAFT) từ vai trò học viên hoặc người dùng chưa đăng nhập đều nhận mã phản hồi `HTTP 404 Not Found`. Không có bất kỳ dữ liệu nháp nào bị rò rỉ.
- **Không dùng Mock Data**: Toàn bộ dữ liệu hiển thị trên giao diện người dùng đều được lấy trực tiếp từ Microsoft SQL Server thông qua ASP.NET Core Web API.
- **Lưu vết Tiến độ Thực**: Mỗi thao tác hoàn thành bước học hoặc bài tập đều được gửi lên máy chủ và lưu trữ vào bảng `student_lesson_progress`. Khi học viên đăng xuất và đăng nhập lại, phiên học được khôi phục chính xác tại bước đang học dở dang.

---

## 3. BẢNG PHÂN ĐỊNH RÕ RÀNG 4 GIAI ĐOẠN PHƯƠNG TIỆN ÂM THANH

| Cấp độ phân định | Số lượng bài | Số lượng tệp | Trạng thái hiện tại | Ý nghĩa nghiệm thu |
| :--- | :---: | :---: | :---: | :--- |
| **`SCRIPT_ONLY` (Chỉ có kịch bản)** | 0 / 140 | 0 | Đã vượt qua | Kịch bản văn bản tiếng Trung, Pinyin và nghĩa dịch đã được số hóa hoàn tất. |
| **`GENERATED` (Đã tạo tệp audio)** | 140 / 140 | **280 tệp `.mp3`** | **HOÀN THÀNH** | Tệp âm thanh đã được tạo bằng Neural TTS chất lượng cao tại thư mục `Fontend/public/audio/`. |
| **`TESTED` (Đã kiểm âm kỹ thuật)** | 140 / 140 | **280 tệp `.mp3`** | **HOÀN THÀNH** | Toàn bộ tệp đã được kiểm tra tính hợp lệ về kích thước đĩa (>1KB) và định dạng header MP3. |
| **`APPROVED` (Chuyên gia duyệt)** | 3 / 140 | 6 tệp | **ĐANG TIẾP TỤC** | 3 bài học HSK 1 đã được chuyên gia nghe duyệt. 137 bài còn lại xếp hàng trong Review Queue. |

---

## 4. KẾT LUẬN NGHIỆM THU

1. Phân hệ CMS và Cổng Học Viên của ZhongWenHub đã đáp ứng toàn diện các tiêu chí nghiệm thu của Phase 4.
2. Giao diện người học đã có phương tiện nghe thực tế, vận hành ổn định trên cả máy tính để bàn và thiết bị di động.
3. Ranh giới giữa nội dung đã xuất bản (`PUBLISHED`) và nội dung dự thảo (`DRAFT`) được thực thi nghiêm ngặt, đảm bảo an toàn tuyệt đối cho người học.
