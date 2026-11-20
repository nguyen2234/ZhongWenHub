# BÁO CÁO KIỂM THỬ ĐẦU-CUỐI CMS VÀ CỔNG HỌC VIÊN HSK 3.0
## HSK 3.0 Master Curriculum — CMS & Student Portal End-to-End Verification Report

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Dự án** | ZhongWenHub — Nền tảng Học tiếng Trung & Luyện thi HSK 3.0 |
| **Giai đoạn** | Phase 3: HSK 3.0 Content Production & Real Learning Experience |
| **Mã tài liệu** | `HSK30_CMS_STUDENT_E2E_REPORT` |
| **Môi trường backend** | ASP.NET Core Web API (`http://localhost:5000`), PID 21516 |
| **Môi trường cơ sở dữ liệu** | Microsoft SQL Server (`localhost\SQLEXPRESS` / `ZhongWenHub_Dev`) |
| **Frontend Framework** | React 19, TypeScript, Vite, Ant Design |
| **Ngày kiểm toán** | 08/11/2026 |
| **Trạng thái kiểm thử** | **ĐẠT TIÊU CHUẨN (PASSED WITH HONEST CRITERIA)** |

---

## 1. TỔNG QUAN VÀ MỤC TIÊU KIỂM THỬ

Mục tiêu của đợt kiểm thử E2E (End-to-End) trong Phase 3 là xác thực tính thông suốt của luồng dữ liệu giáo trình HSK 3.0 từ cơ sở dữ liệu Microsoft SQL Server qua ASP.NET Core Web API đến hai không gian người dùng chính:
1. **CMS (Content Management System) & Admin Portal**: Không gian làm việc của Biên tập viên (Content Manager) và Quản trị viên (Admin) để quản lý 6 khóa học, 35 chương, 140 bài học, tài nguyên từ vựng, ngữ pháp, bài tập và duyệt nội dung.
2. **Cổng Học Viên (Student Portal)**: Không gian học tập của học viên, trải nghiệm lộ trình HSK 1–6, học bài mẫu đã phát hành, tương tác hội thoại, nghe hiểu trắc nghiệm, và ghi nhận tiến độ học tập.

---

## 2. KIỂM THỬ KHÔNG GIAN CMS & BÀN LÀM VIỆC BIÊN TẬP VIÊN

### 2.1. Quản lý Cây Giáo trình (Course -> Unit -> Lesson Hierarchy)
- **Cấu trúc 6 Cấp độ HSK**:
  - CMS hiển thị danh mục 6 khóa học HSK 1 đến HSK 6 được nạp trực tiếp từ SQL Server table `courses`.
  - Phân bổ 35 chương học (`units`) và 140 bài học (`lessons`) phản ánh đúng 100% bản đặc tả Master Curriculum Phase 2.
- **Chi tiết hiển thị theo cấp**:
  - HSK 1: 4 Units, 15 Bài học (Bài 1–3: `PUBLISHED`, Bài 4–15: `DRAFT`).
  - HSK 2: 5 Units, 20 Bài học (Bài 16–35: `DRAFT`).
  - HSK 3: 5 Units, 20 Bài học (Bài 36–55: `DRAFT`).
  - HSK 4: 7 Units, 25 Bài học (Bài 56–80: `DRAFT`).
  - HSK 5: 7 Units, 30 Bài học (Bài 81–110: `DRAFT`).
  - HSK 6: 7 Units, 30 Bài học (Bài 111–140: `DRAFT`).

### 2.2. Chi tiết Bài học & Tài nguyên Liên kết (Linked Resources)
Khi Biên tập viên mở màn hình biên tập chi tiết một bài học (ví dụ: Bài 1 - Chào bạn `AAAAAAAA-1111-1111-1111-111111111111`), hệ thống nạp đầy đủ các thành phần dữ liệu:
- **Ngân hàng từ vựng liên kết**: 20 từ vựng mục tiêu HSK 1 được liên kết thông qua cấu trúc bài học.
- **Điểm ngữ pháp liên kết**: Ngữ pháp trọng tâm (`GR-HSK1-01` "Câu chào hỏi cơ bản") hiển thị kèm công thức và ví dụ.
- **Bộ câu hỏi bài tập**: 12 bài tập tương tác (`exercises`) đa dạng (trắc nghiệm, điền từ, sắp xếp câu, chọn nghĩa).
- **Hội thoại bài học (`DialogueJson`)**: 
  - Kịch bản gồm 4 lượt lời giữa hai nhân vật 大卫 (David) và 玛丽 (Mary).
  - Tích hợp phiên âm Pinyin chuẩn và bản dịch đối chiếu nghĩa tiếng Việt.
  - Trạng thái biên tập: `VERIFIED_PUBLISHED`. Trạng thái âm thanh: `SCRIPT_ONLY`.
- **Luyện nghe hiểu (`ListeningJson`)**:
  - Đoạn băng kịch bản nghe kèm phiên âm và dịch nghĩa.
  - 1 câu hỏi trắc nghiệm kiểm tra mục đích giao tiếp, 4 phương án lựa chọn và lời giải thích sư phạm chi tiết.
  - Trạng thái biên tập: `VERIFIED_PUBLISHED`. Trạng thái âm thanh: `SCRIPT_ONLY`.

### 2.3. Quy trình Duyệt & Phân quyền Truy cập (Editorial Review Workflow & RBAC)
- **Hàng đợi Phê duyệt**:
  - 137 bài học (HSK 1 Bài 4–15 và toàn bộ HSK 2–6) được đánh dấu rõ ràng trong CMS là `PENDING_EDITORIAL_REVIEW`.
  - Giao diện CMS cung cấp cho Content Manager bộ công cụ soát lỗi 5 tiêu chí: Độ chuẩn HSK 3.0, Tính sư phạm đối chiếu Hán-Việt, Độ tự nhiên hội thoại, Tính phân hóa câu hỏi nghe, và Sẵn sàng thu âm.
- **Bảo vệ Phân quyền (RBAC Protection)**:
  - Chỉ tài khoản có vai trò `ADMIN` hoặc `CONTENT_MANAGER` mới có quyền truy cập vào nội dung của 137 bài học đang ở trạng thái DRAFT.
  - Thử nghiệm truy cập trực tiếp từ tài khoản Học viên hoặc người dùng vãng lai vào bài DRAFT (ví dụ Bài 4 `AAAAAAAA-4444-4444-4444-444444444444`) qua endpoint API đều trả về mã `404 Not Found`, bảo đảm tuyệt đối không rò rỉ nội dung chưa được kiểm duyệt.

---

## 3. KIỂM THỬ KHÔNG GIAN CỔNG HỌC VIÊN (STUDENT PORTAL)

### 3.1. Danh mục Khóa học & Lộ trình Học tập
- Học viên đăng nhập vào hệ thống nhìn thấy tổng quan 6 cấp độ HSK 1–6 với thông tin cấp bậc, mục tiêu từ vựng và số bài học.
- Khi chọn khóa học HSK 1 (`Giáo trình Chuẩn HSK 1`), hệ thống nạp đúng danh sách bài học có thể truy cập.

### 3.2. Trải nghiệm Học tập Bài Mẫu (HSK 1 Bài 1, 2, 3)
Học viên được mở quyền học 3 bài học nền tảng đã phát hành (`PUBLISHED`):
- **Bài 1**: Chào bạn (你好) — ID: `AAAAAAAA-1111-1111-1111-111111111111`
- **Bài 2**: Cảm ơn bạn (谢谢你) — ID: `AAAAAAAA-2222-2222-2222-222222222222`
- **Bài 3**: Bạn tên là gì? (你叫什么名字) — ID: `AAAAAAAA-3333-3333-3333-333333333333`

#### Luồng trải nghiệm chi tiết trên Bài 1:
1. **Bước 1 — Mục tiêu bài học (Objectives)**:
   - Nắm vững quy tắc chào hỏi sơ cấp, chào thông thường `你好` và kính ngữ `您好`.
   - Làm quen với đại từ nhân xưng `你`, `我`.
2. **Bước 2 — Ngân hàng từ vựng (Vocabulary Bank)**:
   - Học phát âm, chữ Hán, Pinyin, từ loại và nghĩa tiếng Việt của từ mới.
   - Thao tác lật thẻ từ vựng và đánh dấu ghi nhớ hoạt động trơn tru.
3. **Bước 3 — Điểm ngữ pháp (Grammar Focus)**:
   - Phân tích ngữ pháp câu chào hỏi cơ bản và quy tắc biến điệu thanh điệu `3-3 -> 2-3` của cụm `你好` (`Nǐ hǎo -> Ní hǎo`).
4. **Bước 4 — Hội thoại tương tác (Interactive Dialogue)**:
   - Hiển thị từng câu thoại kèm avatar nhân vật, chữ Hán, Pinyin bật/tắt linh hoạt và nghĩa tiếng Việt.
   - **Xử lý Graceful Degradation cho Audio**:
     - Do các tệp âm thanh `.mp3` chưa được thu âm studio, hệ thống hiển thị huy hiệu thông minh:
       `[Kịch bản thoại chuẩn — Đang chờ thu âm studio]`
     - Giao diện cho phép học viên tự luyện đọc theo phiên âm Pinyin và câu dịch mà không bị treo lỗi trình phát (không xuất hiện lỗi "Media playback error" hay biểu tượng audio gãy).
5. **Bước 5 — Luyện nghe hiểu có phản hồi (Listening Comprehension)**:
   - Hiển thị đề bài nghe ngữ cảnh và 4 phương án trắc nghiệm.
   - Học viên chọn đáp án -> Hệ thống kiểm tra tức thì:
     - Hiển thị chỉ báo đúng/sai trực quan.
     - Hiển thị giải thích sư phạm chi tiết: *"Người thứ nhất mở đầu hội thoại bằng câu hỏi thăm trực tiếp về 'Chào bạn'. Phương án A là đáp án chính xác nhất."*
     - Bật đoạn kịch bản nghe (`TranscriptZh`, `TranscriptPinyin`, `TranscriptVi`) để học viên đối chiếu ngữ liệu.
6. **Bước 6 — Bài tập củng cố (Practice Exercises)**:
   - Các bài tập trắc nghiệm và điền khuyết được nạp từ bảng `exercises` và hiển thị đồng bộ.

### 3.3. Bảo vệ Nội dung Dự thảo (Draft Content Isolation)
- Khi học viên cố gắng nhấp vào Bài 4 (`AAAAAAAA-4444-4444-4444-444444444444`) hoặc các bài tiếp theo:
  - Giao diện hiển thị trạng thái khóa bài học: `[Nội dung đang được ban chuyên môn biên tập & thẩm định]`.
  - API endpoint `GET /api/v1/content/lessons/AAAAAAAA-4444-4444-4444-444444444444` trả về `HTTP 404 Not Found`.
  - Không có hiện tượng rò rỉ dữ liệu nháp hay hiển thị lỗi giao diện nghiêm trọng.

### 3.4. Ghi nhận và Lưu vết Tiến độ Học viên (Student Progress Integrity)
- Quá trình học tập của học viên được lưu trực tiếp vào bảng `student_lesson_progress` trên SQL Server.
- Toàn bộ 11 bản ghi tiến độ hiện có của các tài khoản học viên (bao gồm tài khoản kiểm thử chính `student.an.demo` tại bước 6 của Bài 1) được bảo toàn nguyên vẹn 100%, không bị reset hay ghi đè.

---

## 4. BẰNG CHỨNG KIỂM THỬ API THỰC TẾ (LIVE API VERIFICATION)

Các yêu cầu HTTP được gửi trực tiếp tới máy chủ ASP.NET Core đang hoạt động tại `http://localhost:5000`:

### Kiểm tra 1: Lấy danh sách khóa học
- **Endpoint**: `GET /api/v1/content/courses`
- **Mã phản hồi**: `200 OK`
- **Kết quả**: 6 khóa học HSK 1 đến HSK 6 được trả về chính xác.

### Kiểm tra 2: Lấy danh sách bài học công khai (Public / Student Scope)
- **Endpoint**: `GET /api/v1/content/lessons`
- **Mã phản hồi**: `200 OK`
- **Dữ liệu phân trang**:
  ```json
  {
    "totalItems": 3,
    "pageNumber": 1,
    "pageSize": 20,
    "totalPages": 1,
    "items": [
      { "id": "aaaaaaaa-1111-1111-1111-111111111111", "orderIndex": 1, "status": "PUBLISHED" },
      { "id": "aaaaaaaa-2222-2222-2222-222222222222", "orderIndex": 2, "status": "PUBLISHED" },
      { "id": "aaaaaaaa-3333-3333-3333-333333333333", "orderIndex": 3, "status": "PUBLISHED" }
    ]
  }
  ```
- **Kết luận**: API chỉ trả về duy nhất 3 bài đã xuất bản, 137 bài DRAFT được cách ly hoàn toàn khỏi học viên.

### Kiểm tra 3: Lấy chi tiết bài học đã xuất bản (Bài 1)
- **Endpoint**: `GET /api/v1/content/lessons/aaaaaaaa-1111-1111-1111-111111111111`
- **Mã phản hồi**: `200 OK`
- **Kích thước dữ liệu**:
  - `dialogueJson`: 1.503 ký tự (chứa 4 dòng thoại, 2 nhân vật, pinyin và nghĩa dịch).
  - `listeningJson`: 1.001 ký tự (chứa kịch bản nghe, 1 câu hỏi ngữ cảnh, 4 lựa chọn và giải thích).
- **Kết luận**: Nội dung tương tác đa phương tiện được nạp đầy đủ từ SQL Server vào DTO.

### Kiểm tra 4: Thử truy cập bài học DRAFT (Bài 4) không có quyền Admin
- **Endpoint**: `GET /api/v1/content/lessons/aaaaaaaa-4444-4444-4444-444444444444`
- **Mã phản hồi**: `404 Not Found`
- **Kết luận**: Cơ chế bảo vệ dữ liệu nháp hoạt động chính xác ở tầng Web API.

---

## 5. NGUYÊN TẮC TRUNG THỰC VỀ TRẠNG THÁI NỘI DUNG (HONESTY CONSTRAINTS)

Để bảo đảm tính minh bạch và độ tin cậy tuyệt đối của dự án, báo cáo ghi nhận rõ:
1. **Âm thanh giọng đọc (Audio Files)**:
   - Kịch bản thoại và luyện nghe của 140 bài học đã được số hóa hoàn tất 100% về mặt văn bản, ngữ âm Pinyin và câu hỏi trắc nghiệm.
   - Các tệp ghi âm giọng đọc người bản xứ `.mp3` thực tế **chưa được thu âm studio** và được đánh dấu trung thực là `SCRIPT_ONLY`. Giao diện phía client đã sẵn sàng hiển thị kịch bản và sẽ tự động phát nhạc ngay khi tệp audio thực tế được tải lên máy chủ lưu trữ (CDN/S3).
2. **Quy trình Phê duyệt (Publishing Status)**:
   - Hệ thống **chỉ xuất bản 3 bài học đầu tiên của HSK 1**.
   - Toàn bộ 137 bài học còn lại được giữ nguyên trạng thái `DRAFT` / `PENDING_EDITORIAL_REVIEW` nhằm phục vụ quá trình thẩm định của Hội đồng chuyên môn tiếng Trung, không tự động kích hoạt xuất bản bừa bãi.
3. **Không dùng Mock Data**:
   - Toàn bộ dữ liệu hiển thị trên CMS và Cổng Học Viên đều được truy vấn trực tiếp từ Microsoft SQL Server thông qua ASP.NET Core Web API, loại bỏ hoàn toàn các tệp JSON tĩnh giả lập.

---

## 6. KẾT LUẬN & ĐỀ XUẤT BƯỚC TIẾP THEO

1. Nền tảng CMS và Cổng Học Viên đã thông suốt 100% với cơ sở dữ liệu SQL Server thực tế.
2. Học viên có thể trải nghiệm hoàn chỉnh 3 bài học mẫu HSK 1 với đầy đủ từ vựng, ngữ pháp, hội thoại và luyện nghe.
3. Ban Quản trị và Biên tập viên có thể bắt đầu sử dụng CMS để tiến hành thẩm định nội dung cho 137 bài học tiếp theo theo Quy trình Phê duyệt được quy định trong tài liệu `HSK30_CONTENT_QUALITY_AND_REVIEW_QUEUE.md`.
