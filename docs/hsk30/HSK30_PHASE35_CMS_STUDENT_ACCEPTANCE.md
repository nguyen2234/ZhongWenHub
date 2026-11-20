# BÁO CÁO NGHIỆM THU CMS VÀ TRẢI NGHIỆM HỌC VIÊN PHASE 3.5
## HSK 3.0 Master Curriculum — CMS & Student Experience Acceptance Report

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Dự án** | ZhongWenHub — Nền tảng Học tiếng Trung & Luyện thi HSK 3.0 |
| **Giai đoạn** | Phase 3.5: Curriculum Quality Assurance & Student Experience |
| **Mã tài liệu** | `HSK30_PHASE35_CMS_STUDENT_ACCEPTANCE` |
| **Hệ thống kiểm định** | CMS Web Console & Cổng Học Viên (React 19 / Vite / ASP.NET Core) |
| **Thời điểm nghiệm thu** | 08/11/2026 |
| **Trạng thái nghiệm thu** | **ĐẠT TIÊU CHUẨN NGHIỆM THU (PASSED WITH TRANSPARENCY)** |

---

## 1. TỔNG QUAN VÀ PHẠM VI NGHIỆM THU

Đợt nghiệm thu Phase 3.5 tập trung đánh giá hai phân hệ tương tác cốt lõi của hệ thống ZhongWenHub:
1. **CMS (Content Management System) & Bàn làm việc Biên tập viên**: Đảm bảo phân quyền RBAC, xem trước, biên tập, quản lý hàng đợi phê duyệt của 140 bài học mà không bao giờ tự động xuất bản (no auto-publish).
2. **Cổng Học Viên (Student Portal)**: Đảm bảo học viên khám phá 6 khóa học HSK, phân biệt rõ bài đã học được với bài đang biên soạn, hiển thị giao diện sư phạm chuẩn (không hiển thị JSON thô), lưu vết tiến độ thật vào SQL Server, không nhận mock data âm thầm và bị chặn truy cập bài nháp qua URL trực tiếp.
3. **Phân loại Minh bạch Phương tiện Nghe (Audio Pipeline)**: Báo cáo trung thực 4 cấp độ phương tiện âm thanh, tuyệt đối không nhận vơ "hoàn chỉnh kỹ năng nghe" khi chưa có file thu âm thực tế.

---

## 2. NGHIỆM THU BÀN LÀM VIỆC CMS & BIÊN TẬP VIÊN

### 2.1. Quản lý Toàn bộ 140 Bài học theo Quyền (RBAC Management)
- **Truy cập Danh mục**:
  - Người dùng đăng nhập bằng tài khoản `admin@zhongwenhub.edu.vn` hoặc `content.manager@zhongwenhub.edu.vn` có quyền xem toàn diện cây giáo trình gồm **6 Khóa học (`courses`), 35 Chương học (`units`) và 140 Bài học (`lessons`)**.
  - Bộ lọc hỗ trợ lọc theo cấp độ (HSK 1 đến HSK 6), lọc theo trạng thái (`PUBLISHED`, `DRAFT`, `PENDING_EDITORIAL_REVIEW`).
- **Mở Chi tiết & Xem trước Nội dung (Detail & Preview Canvas)**:
  - Khi nhấp vào bất kỳ bài học nào, ngăn kéo `LessonDetailDrawer` hoặc trang biên tập `AdminLessonEditorPage` mở ra mượt mà.
  - Giao diện `LessonPreviewCanvas` mô phỏng trực tiếp màn hình học của học viên (Player View) để biên tập viên kiểm tra trực quan hiển thị từ vựng, ngữ pháp, bài khóa và bài tập.
- **Biên tập, Gửi duyệt và Lịch sử**:
  - Biên tập viên có thể chỉnh sửa câu thoại, thêm bớt từ vựng mục tiêu, sửa phiên âm Pinyin và câu dịch tiếng Việt.
  - Hệ thống ghi nhận `UpdatedByUserId`, `ReviewedByUserId`, `ReviewedAt` và `ReviewNotes` trong cơ sở dữ liệu.
- **Nguyên tắc "Không Tự Động Xuất Bản" (No Auto-Publishing Guardrail)**:
  - Nút **Xuất bản bài học (Publish Lesson)** bắt buộc phải có xác nhận hai bước (two-step confirmation) của Quản trị viên cấp cao.
  - Toàn bộ 137 bài học dự thảo được bảo vệ nghiêm ngặt ở trạng thái `DRAFT` / `PENDING_EDITORIAL_REVIEW`, ngăn ngừa mọi hành vi tự động kích hoạt xuất bản hàng loạt.

---

## 3. NGHIỆM THU CỔNG HỌC VIÊN (STUDENT PORTAL EXPERIENCE)

### 3.1. Khám phá 6 Cấp độ HSK & Lộ trình Học tập
- Học viên truy cập `/ZhongWenHub/learning-path?mode=hsk` nhìn thấy đầy đủ thanh điều hướng 6 cấp độ HSK 1 đến HSK 6.
- Khi chọn từng cấp độ, hệ thống hiển thị danh sách bài học kèm nhãn chỉ báo trạng thái rõ ràng:
  - **Bài đã xuất bản (Published)**: Gắn nhãn màu xanh lá, kèm nút "Bắt đầu học" hoặc "Tiếp tục".
  - **Bài đang biên soạn (In Progress / Coming Soon)**: Gắn nhãn màu xám trung tính `"Đang biên soạn"`, nút học bị vô hiệu hóa kèm thông báo: *"Nội dung bài học đang được Ban Chuyên môn Tiếng Trung thẩm định học thuật và thu âm phòng thu"*.

### 3.2. Hiển thị Nội dung Sư phạm Chuẩn (Không Hiển thị JSON Thô)
- Khi học viên vào học Bài 1 (ID: `AAAAAAAA-1111-1111-1111-111111111111`):
  - Tầng chuyển đổi `lesson-player.adapter.ts` phân tích `DialogueJson` và `ListeningJson` thành các ViewModel có kiểu dữ liệu chặt chẽ (`DialogueStep`, `QuizStep`).
  - **Hội thoại**: Hiển thị avatar hai nhân vật (Đại Vệ, Mã Lệ), bong bóng hội thoại, nút bật/tắt Pinyin, nút bật/tắt bản dịch tiếng Việt, và trình đọc giọng máy Web Speech API hỗ trợ luyện phát âm.
  - **Nghe hiểu**: Hiển thị bảng câu hỏi trắc nghiệm ngữ cảnh, 4 lựa chọn tương tác, chỉ báo đúng/sai trực quan và lời giải thích chi tiết.
  - **Tuyệt đối không có bất kỳ chuỗi JSON thô nào bị rò rỉ ra giao diện người dùng**.

### 3.3. Bảo vệ Cách ly Dữ liệu Nháp (Zero Leakage / 404 Protection)
- Thử nghiệm mô phỏng tấn công hoặc truy cập lén: Học viên nhập trực tiếp URL bài học DRAFT (ví dụ: `/ZhongWenHub/lessons/AAAAAAAA-4444-4444-4444-444444444444`):
  - Backend ASP.NET Core kiểm tra quyền: Bài học có `Status != 'PUBLISHED'` và người dùng không có quyền quản trị -> Trả về ngay lập tức mã `HTTP 404 Not Found`.
  - Frontend đón nhận mã 404 và hiển thị màn hình thông báo thân thiện: *"Bài học không tồn tại hoặc chưa được phát hành"*.
  - Không có bất kỳ dữ liệu nháp nào bị rò rỉ qua Network tab hoặc cache của trình duyệt.

### 3.4. Lưu vết Tiến độ Học tập Thật (Real Progress Persistence)
- Học viên thực hiện học bài, hoàn thành các bước từ vựng, ngữ pháp, bài tập -> Trình duyệt gửi request `POST /api/v1/content/lessons/{id}/progress` cập nhật tiến trình vào bảng `student_lesson_progress`.
- Toàn bộ 11 bản ghi tiến độ hiện có trong CSDL được duy trì tính liên tục:
  - Khi học viên `student.an.demo` đăng nhập lại, hệ thống nạp đúng trạng thái đang học ở Bước 6 (`CurrentStepIndex = 6`), không bị reset về 0.
- **Tuyệt đối không dùng Mock Data âm thầm**: Mọi dữ liệu hiển thị đều kết nối trực tiếp đến Web API ASP.NET Core và SQL Server.

---

## 4. BẢNG PHÂN LOẠI MINH BẠCH VỀ PHƯƠNG TIỆN ÂM THANH (AUDIO STATUS)

Nhằm tuân thủ nguyên tắc trung thực tuyệt đối, không đánh dấu "hoàn chỉnh kỹ năng nghe" khi chưa có tệp âm thanh thực tế, hệ thống phân định rõ 4 giai đoạn phát triển:

| Thành phần kiểm định | Số lượng bài | Tỷ lệ hoàn thành | Hiện trạng kỹ thuật thực tế | Đánh giá nghiệm thu |
| :--- | :---: | :---: | :--- | :---: |
| **1. Kịch bản âm thanh (Audio Script)** | 140 / 140 | **100%** | Toàn bộ 140 bài có kịch bản thoại và kịch bản nghe hiểu (văn bản tiếng Trung, Pinyin chuẩn, dịch nghĩa tiếng Việt) trong `DialogueJson` và `ListeningJson`. | **ĐẠT TIÊU CHUẨN** |
| **2. Tệp âm thanh tạo ra (Audio Generated)** | 0 / 140 | **0%** | Chưa có tệp ghi âm giọng đọc bản xứ `.mp3` nào được tải lên máy chủ hoặc CDN. Gắn nhãn trung thực `audioStatus: "SCRIPT_ONLY"`. | **ĐANG CHỜ THU ÂM** |
| **3. Kiểm âm chất lượng (Audio Tested)** | 0 / 140 | **0%** | Chưa tiến hành kiểm âm về âm lượng, tạp âm phòng thu và tốc độ đọc (WPM - Words Per Minute). | **ĐANG CHỜ THU ÂM** |
| **4. Hoạt động nghe thực tế (Listening Activity)** | 0 / 140 | **0% (Audio)**<br>*(100% Text)* | Hoạt động nghe hiện chạy ở chế độ **Đọc kịch bản & Trắc nghiệm đối chiếu ngữ cảnh** (Script-Reading & Comprehension Quiz), chưa phải nghe qua phương tiện âm thanh thật. | **HOẠT ĐỘNG CHẾ ĐỘ KỊCH BẢN** |

---

## 5. KẾT LUẬN NGHIỆM THU PHASE 3.5

1. Không gian CMS và Bàn làm việc Biên tập viên đáp ứng đầy đủ yêu cầu quản trị, xem trước và kiểm soát phê duyệt an toàn.
2. Không gian Cổng Học Viên bảo đảm trải nghiệm sư phạm cao cấp trên các bài học đã phát hành, đồng thời cách ly tuyệt đối 137 bài học dự thảo.
3. Không có tình trạng sử dụng mock data ngầm hoặc rò rỉ JSON thô.
4. Mọi thông số về âm thanh được ghi nhận minh bạch, làm tiền đề chuẩn bị cho giai đoạn thu âm chuyên nghiệp trong Phase 4.
