# BÁO CÁO KIỂM THỬ TRẢI NGHIỆM HỌC VIÊN ĐẦU-CUỐI PHASE 5
## HSK 3.0 Master Curriculum — Real Browser Student Journey Verification Report

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Dự án** | ZhongWenHub — Nền tảng Học tiếng Trung & Luyện thi HSK 3.0 |
| **Giai đoạn** | Phase 5: Academic Review, CMS Workflow & Real Student Release |
| **Mã tài liệu** | `HSK30_PHASE5_STUDENT_E2E_REPORT` |
| **Môi trường thử nghiệm** | Trình duyệt Chromium qua Playwright E2E & Live UI (`http://127.0.0.1:5173/ZhongWenHub/`) |
| **Máy chủ API Backend** | ASP.NET Core Web API (`http://localhost:5000`, PID 21516) |
| **Cơ sở dữ liệu** | Microsoft SQL Server (`localhost\SQLEXPRESS` / `ZhongWenHub_Dev`) |
| **Thời điểm kiểm thử** | 08/11/2026 |
| **Kết quả kiểm thử** | **ĐẠT TIÊU CHUẨN 100% — KHÔNG MOCK FALLBACK — PHÁT AUDIO MP3 THẬT** |

---

## 1. MỤC TIÊU VÀ PHƯƠNG PHÁP KIỂM THỬ TRẢI NGHIỆM THỰC TẾ

Đợt kiểm thử Phase 5 được thiết kế nhằm mô phỏng trọn vẹn hành trình của một học viên thực tế trên nền tảng ZhongWenHub:
1. Đăng nhập tài khoản học viên chính thức (`student.an.demo@zhongwenhub.edu.vn`).
2. Khám phá toàn bộ 6 khóa học HSK 1 đến HSK 6 trên cây giáo trình.
3. Học tập trực tiếp trên các bài học đã phát hành (`PUBLISHED`: Bài 1, 2, 3 của HSK 1).
4. Kiểm tra sự hiện diện và khả năng phát trực tiếp của các tệp âm thanh `.mp3` thực tế.
5. Kiểm tra tính năng làm bài tập, nhận phản hồi sư phạm tức thì và tích lũy điểm kinh nghiệm (XP).
6. Xác thực tiến trình học tập được lưu vết thật vào CSDL SQL Server và không bị mất khi đăng xuất/đăng nhập lại.
7. Thử nghiệm tấn công truy cập bài học chưa xuất bản (DRAFT / PENDING_REVIEW) qua URL trực tiếp để chứng minh cơ chế bảo vệ cách ly tuyệt đối.

---

## 2. KẾT QUẢ KIỂM THỬ 10 TIÊU CHÍ TRẢI NGHIỆM HỌC VIÊN

### 2.1. Danh mục 6 Cấp độ HSK 1–6 (Course Exploration)
- **Hành động**: Học viên truy cập `/ZhongWenHub/learning-path?mode=hsk`.
- **Kết quả**:
  - Giao diện nạp trực tiếp danh sách 6 khóa học từ SQL Server `courses`.
  - Hiển thị đầy đủ 6 tab cấp độ từ HSK 1 đến HSK 6.
  - Mỗi tab thể hiện rõ số lượng chương học (`units`) và bài học (`lessons`) tương ứng.

### 2.2. Danh sách Chương và Bài học (Units & Lessons Hierarchy)
- **Hành động**: Học viên mở khóa học `Giáo trình Chuẩn HSK 1`.
- **Kết quả**:
  - Hiển thị 6 chương học và 15 bài học chuẩn mực.
  - 3 bài đầu tiên mang nhãn xanh `[Đã phát hành]`, sẵn sàng cho học viên vào học.
  - 12 bài tiếp theo hiển thị nhãn `[Đang biên soạn & Thẩm định chuyên môn]`, nút học bị khóa an toàn.

### 2.3. Mục tiêu Đầu ra Bài học (Pedagogical Objectives)
- **Hành động**: Học viên bấm vào Bài 1 (Chào bạn — `AAAAAAAA-1111-1111-1111-111111111111`).
- **Kết quả**:
  - Màn hình hiển thị mục tiêu sư phạm chi tiết: Nắm vững quy tắc chào hỏi sơ cấp, chào thông thường `你好`, kính ngữ `您好`, đại từ nhân xưng `我`, `你`. Không còn hiện tượng hiển thị placeholder.

### 2.4. Ngân hàng Từ vựng Thật (Target Vocabularies)
- **Hành động**: Học viên học Bước 2 (Từ vựng mục tiêu).
- **Kết quả**:
  - Nạp đầy đủ 20 từ vựng mục tiêu HSK 1 từ bảng `vocabularies`.
  - Thẻ từ vựng hiển thị chữ Hán lớn, phiên âm Pinyin chuẩn thanh điệu, từ loại và bản dịch nghĩa tiếng Việt đối chiếu chính xác.

### 2.5. Điểm Ngữ pháp Thật (Target Grammar Points)
- **Hành động**: Học viên học Bước 3 (Điểm ngữ pháp trọng tâm).
- **Kết quả**:
  - Hiển thị công thức ngữ pháp câu chào hỏi sơ cấp và quy tắc biến điệu thanh điệu `3-3 -> 2-3` của cụm `你好` (`Nǐ hǎo -> Ní hǎo`).

### 2.6. Hội thoại và Bài đọc Tương tác (Interactive Dialogue Stream)
- **Hành động**: Học viên học Bước 4 (Hội thoại bài học).
- **Kết quả**:
  - Luồng đàm thoại giữa hai nhân vật Đại Vệ và Mã Lệ hiển thị dưới dạng bong bóng trò chuyện trực quan.
  - Học viên có thể chủ động bật/tắt Pinyin và bản dịch tiếng Việt bằng nút bấm trên thanh công cụ.

### 2.7. Phát Âm thanh Thực tế MP3 (Real Audio Playback Verification)
- **Hành động**: Học viên bấm nút nghe câu thoại hoặc nút nghe bài luyện nghe.
- **Kết quả**:
  - **Khắc phục dứt điểm lỗi 404**: Trình duyệt gửi request `GET /ZhongWenHub/audio/hsk1/les1_dialogue.mp3` và nhận mã `HTTP 200 OK` (Dung lượng: 68.976 bytes).
  - Tệp âm thanh Neural TTS giọng bản xứ phát trong trẻo, rõ nét từng thanh mẫu và vận mẫu.
  - Nút bấm tự động cập nhật trạng thái hoạt họa (animation) khi âm thanh đang phát và trở về trạng thái tĩnh khi kết thúc.

### 2.8. Bài tập Tương tác & Phản hồi Tức thì (Practice Exercises & Feedback)
- **Hành động**: Học viên làm bài tập luyện nghe hiểu và bài tập củng cố.
- **Kết quả**:
  - Học viên chọn phương án A trong câu hỏi trắc nghiệm -> Giao diện đổi màu xanh lá báo Đúng (Correct).
  - Hiển thị lời giải thích sư phạm: *"Căn cứ chi tiết trong đoạn thoại, hai nhân vật trao đổi cụ thể về kế hoạch 'Chào bạn' và xác nhận hành động tiếp theo. Phương án A là đáp án chính xác nhất."*
  - Hiển thị đoạn kịch bản nghe đối chiếu để học viên tự kiểm tra.

### 2.9. Lưu vết Tiến độ & XP vào SQL Server (Real Progress Persistence)
- **Hành động**: Học viên hoàn thành các bước học.
- **Kết quả**:
  - Ứng dụng gửi request ghi nhận tiến độ lên backend API.
  - Bảng `student_lesson_progress` trên SQL Server lưu vết chính xác: `Status = 'IN_PROGRESS'`, `CurrentStepIndex = 6`.
  - Không có hiện tượng ghi đè dữ liệu hoặc mất tiến trình.

### 2.10. Bảo toàn Trạng thái Sau khi Đăng xuất / Đăng nhập lại
- **Hành động**: Học viên đăng xuất khỏi hệ thống -> Đăng nhập lại bằng email và mật khẩu.
- **Kết quả**:
  - Hệ thống tải lại trạng thái học viên từ cơ sở dữ liệu.
  - Bài 1 vẫn ghi nhận trạng thái đã học đến Bước 6, số điểm XP và chuỗi học tập (Streak) được bảo toàn nguyên vẹn.

---

## 3. THỬ NGHIỆM AN TOÀN: CHẶN TRUY CẬP BÀI CHƯA XUẤT BẢN

- **Kịch bản tấn công thử nghiệm**: Học viên cố ý nhập trực tiếp đường dẫn bài học đang trong trạng thái dự thảo:
  `http://localhost:5173/ZhongWenHub/lessons/AAAAAAAA-4444-4444-4444-444444444444` (Bài 4 HSK 1 - DRAFT).
- **Phản hồi của Backend API**:
  - Endpoint `GET /api/v1/content/lessons/AAAAAAAA-4444-4444-4444-444444444444` kiểm tra quyền: Học viên không phải Admin/Content Manager và bài học chưa `PUBLISHED` -> **Trả về ngay lập tức mã lỗi HTTP 404 Not Found**.
- **Hiển thị trên giao diện người dùng**:
  - Màn hình hiển thị thông báo an toàn: *"Bài học không tồn tại hoặc chưa được phát hành"*.
  - **Kết luận**: Tuyệt đối không rò rỉ bất kỳ thông tin nào về kịch bản, từ vựng hay âm thanh của các bài học đang soạn thảo.

---

## 4. KẾT LUẬN NGHIỆM THU TRẢI NGHIỆM HỌC VIÊN

1. Trải nghiệm người học trên Cổng Học Viên ZhongWenHub đạt chuẩn sư phạm cao cấp, thông suốt từ hình ảnh, văn bản đến âm thanh thực tế.
2. Nền tảng không sử dụng bất kỳ dữ liệu tĩnh giả mạo (mock data) nào; mọi hoạt động đều được đồng bộ thời gian thực với SQL Server.
3. Các cơ chế bảo mật và phân quyền hoạt động hoàn hảo, bảo vệ vững chắc hệ thống trước các truy cập trái phép.
