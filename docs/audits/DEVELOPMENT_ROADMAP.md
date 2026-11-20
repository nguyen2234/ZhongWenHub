# LỘ TRÌNH PHÁT TRIỂN & HOÀN THIỆN DỰ ÁN ZHONGWENHUB
**Prioritized Technical Development Roadmap**

> **Tài liệu quy hoạch kỹ thuật & kế hoạch bàn giao**  
> **Dự án:** ZhongWenHub – Nền tảng học tiếng Trung trực tuyến tích hợp AI  
> **Ngày lập:** 14/11/2026  
> **Cơ sở xây dựng:** Kết quả kiểm toán độc lập tại [PROJECT_PROGRESS_AUDIT.md](./PROJECT_PROGRESS_AUDIT.md)

---

## 1. NGUYÊN TẮC PHÂN CẤP ƯU TIÊN (PRIORITIZATION PRINCIPLES)

Lộ trình được phân cấp theo 4 mức độ ưu tiên kỹ thuật:
- **P0 – Critical (Bảo mật & Toàn vẹn Dữ liệu):** Các lỗi, nợ kỹ thuật hoặc migration ảnh hưởng trực tiếp đến tính ổn định của hệ thống đang chạy.
- **P1 – Core Requirements (Yêu cầu Cốt lõi Khóa luận Tốt nghiệp):** Các chức năng bắt buộc phải có để hoàn thành vòng lặp học tập đầy đủ cho sinh viên và bảo vệ đồ án xuất sắc.
- **P2 – Advanced Features (Nâng cao AI & Hoàn thiện Portals):** Nâng cấp trải nghiệm AI từ tĩnh sang động (Streaming, STT), thay thế mock data ở các cổng quản lý.
- **P3 – Optimization & Polish (Tối ưu Hiệu năng & Mở rộng):** Cải thiện tốc độ tải trang, caching, CI/CD tự động và mở rộng thanh toán đa kênh.

---

## 2. BẢNG TỔNG HỢP LỘ TRÌNH (ROADMAP OVERVIEW)

```
[ P0: 1 - 2 NGÀY ] ──► [ P1: 1 - 2 TUẦN ] ──► [ P2: 2 - 3 TUẦN ] ──► [ P3: 1 TUẦN ]
• Chạy Migration       • Đồng bộ Lesson        • Tích hợp AI STT       • Streaming SSE
  Outbox Database        Progress vào DB         (Whisper/Azure)         cho AI Chat
• Đổi mật khẩu cá      • Giai đoạn 3 Video     • Cổng Giáo viên        • Cổng thanh toán
  nhân học viên          (Interactive Quiz)      (Classes, Grading)      VNPAY / Momo
• SMTP Quên mật khẩu   • Thống nhất state      • Cổng Hỗ trợ           • CI/CD Pipeline
                         Frontend/Backend        (Support Tickets)       & Bundle Split
```

---

## 3. CHI TIẾT TỪNG NHIỆM VỤ THEO MỨC ĐỘ ƯU TIÊN

### 3.1 P0 – Critical: Toàn vẹn Dữ liệu & An ninh Hệ thống

#### Task P0-1: Áp dụng Migration Outbox & Upload Asset vào Database Development
- **Phân hệ:** Module D (Video Learning) & Database
- **Mức độ ưu tiên:** **P0**
- **Độ phức tạp:** Thấp (Low)
- **Thời gian ước tính:** 0.5 ngày (4 giờ)
- **Phụ thuộc:** Phê duyệt cập nhật database từ người dùng (tuân thủ quy tắc Zero-Write).
- **Mô tả:** Chạy file script SQL `Backend/src/Data/Persistence/Migrations/AddVideoStorageOutboxAndUploadAssets.sql` để tạo 2 bảng `video_storage_cleanup_jobs` và `video_upload_assets` cùng các chỉ mục tương ứng trên `ZhongWenHub_Dev`.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] `dotnet ef migrations list` hiển thị migration `20261113151257_AddVideoStorageOutboxAndUploadAssets` ở trạng thái **Applied**.
  - [ ] Hai bảng mới tồn tại trong cơ sở dữ liệu `ZhongWenHub_Dev` với khóa ngoại chuẩn.
  - [ ] Bộ dọn dẹp ngầm `VideoStorageCleanupWorker` ghi nhận và giải phóng job trực tiếp từ SQL Server mà không cần fallback bộ nhớ.

#### Task P0-2: Hoàn thiện Tính năng Đổi mật khẩu Tự phục vụ của Học viên
- **Phân hệ:** Module A (Auth & User)
- **Mức độ ưu tiên:** **P0**
- **Độ phức tạp:** Thấp (Low)
- **Thời gian ước tính:** 0.5 ngày (4 giờ)
- **Phụ thuộc:** `AuthController.cs`, `UserService.cs`
- **Mô tả:** Viết endpoint `POST /api/v1/auth/change-password` cho phép học viên đã đăng nhập tự đổi mật khẩu cá nhân (yêu cầu xác thực mật khẩu cũ và băm mật khẩu mới bằng BCrypt).
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Endpoint từ chối nếu mật khẩu hiện tại không khớp.
  - [ ] Sau khi đổi mật khẩu, toàn bộ Refresh Token cũ bị thu hồi, yêu cầu đăng nhập lại.
  - [ ] Unit tests kiểm tra đầy đủ các kịch bản thành công và thất bại.

#### Task P0-3: Tích hợp Dịch vụ Email (SMTP / SendGrid) cho Quên mật khẩu
- **Phân hệ:** Module A (Auth & User)
- **Mức độ ưu tiên:** **P0**
- **Độ phức tạp:** Trung bình (Medium)
- **Thời gian ước tính:** 1 ngày (8 giờ)
- **Phụ thuộc:** Cấu hình SMTP trong `appsettings.json`
- **Mô tả:** Tạo bảng `password_reset_tokens` và hoàn thiện `POST /api/v1/auth/forgot-password`, gửi mã OTP/link đặt lại mật khẩu có thời hạn 15 phút tới email người dùng.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Màn hình `/forgot-password` gửi email thật kèm mã xác nhận hợp lệ.
  - [ ] Token hết hạn sau 15 phút hoặc bị hủy sau khi sử dụng thành công 1 lần.

---

### 3.2 P1 – Core Requirements: Hoàn thiện Vòng lặp Học tập (Bảo vệ Đồ án)

#### Task P1-1: Đồng bộ hóa Toàn diện Tiến độ Học tập (Lesson Progress) vào Database
- **Phân hệ:** Module B (HSK Curriculum) & Module C (SRS)
- **Mức độ ưu tiên:** **P1**
- **Độ phức tạp:** Trung bình (Medium)
- **Thời gian ước tính:** 2 - 3 ngày
- **Phụ thuộc:** `LearningService.cs`, `user_progress` table
- **Mô tả:** Loại bỏ việc lưu trữ tiến độ học tạm thời trong `localStorage` tại Frontend; chuyển toàn bộ luồng hoàn thành bài học, tỷ lệ chính xác bài tập và thời gian học sang gọi API `POST /api/v1/learning/lessons/{id}/progress`.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Học viên đăng nhập ở thiết bị khác vẫn thấy chính xác phần trăm tiến độ bài học.
  - [ ] Dashboard học viên phản ánh số giờ học và số bài hoàn thành được tính từ DB thật.
  - [ ] Không còn sự phụ thuộc vào cache trình duyệt.

#### Task P1-2: Triển khai Video Learning Giai đoạn 3 (In-Video Interactive Quiz)
- **Phân hệ:** Module D (Video Learning)
- **Mức độ ưu tiên:** **P1**
- **Độ phức tạp:** Trung bình (Medium)
- **Thời gian ước tính:** 3 - 4 ngày
- **Phụ thuộc:** Module D Giai đoạn 1 & 2 đã hoàn thành
- **Mô tả:**
  - Thiết kế bảng `video_quiz_segments` lưu timestamp xuất hiện câu hỏi trong video.
  - Liên kết với ngân hàng câu hỏi `questions` trong hệ thống.
  - Khi player YouTube chạy đến timestamp chỉ định, video tự động tạm dừng để học viên trả lời câu hỏi tương tác.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Quản trị viên/Giáo viên có thể gắn câu hỏi vào các mốc thời gian cụ thể của video.
  - [ ] Học viên trả lời đúng mới được tiếp tục xem video hoặc nhận điểm thưởng.
  - [ ] Kết quả kiểm tra được lưu vào lịch sử học tập.

#### Task P1-3: Triển khai Bảng Theo dõi Tiến độ Xem Video (Video Watch Progress)
- **Phân hệ:** Module D (Video Learning)
- **Mức độ ưu tiên:** **P1**
- **Độ phức tạp:** Thấp - Trung bình (Medium)
- **Thời gian ước tính:** 2 ngày
- **Phụ thuộc:** Module D
- **Mô tả:** Tạo bảng `user_video_progress` lưu trữ `LastWatchedSecond`, `IsCompleted`, `TotalSecondsWatched`. Tự động lưu tiến độ sau mỗi 10 giây xem video.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Học viên mở lại video sẽ tự động chuyển tới mốc thời gian đang xem dở.
  - [ ] Đánh dấu hoàn thành video khi người học xem trên 80% thời lượng.

---

### 3.3 P2 – Advanced Features: Trí tuệ Nhân tạo & Cổng Mở rộng

#### Task P2-1: Tích hợp Đánh giá Phát âm AI Thực tế (AI Speaking Assessment)
- **Phân hệ:** Module F (Speaking & Listening)
- **Mức độ ưu tiên:** **P2**
- **Độ phức tạp:** Cao (High)
- **Thời gian ước tính:** 4 - 5 ngày
- **Phụ thuộc:** Tích hợp OpenAI Whisper API / Azure Speech Service
- **Mô tả:** Thay thế đoạn mã giả lập (delay 2.5s điểm 88) tại `SkillSpeakingPage.tsx`. Gửi file âm thanh `.wav`/`.webm` lên Backend API `POST /api/v1/ai/speech/assess` để phân tích độ chính xác thanh điệu (Tones 1–4) và phát âm Pinyin.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Trả về điểm số thực dựa trên đối chiếu văn bản mẫu với giọng thu âm của học viên.
  - [ ] Chỉ ra thanh điệu phát âm sai kèm gợi ý khẩu hình miệng.

#### Task P2-2: Triển khai Cổng Giáo viên Dữ liệu Thật (Teacher Portal CMS)
- **Phân hệ:** Module I (Teacher Portal)
- **Mức độ ưu tiên:** **P2**
- **Độ phức tạp:** Cao (High)
- **Thời gian ước tính:** 5 - 7 ngày
- **Phụ thuộc:** Tạo bảng `classes`, `class_enrollments`, `assignments`, `assignment_submissions`
- **Mô tả:** Thay thế toàn bộ dữ liệu mẫu trong `mockTeacherPortalData.ts` và `assignment.service.ts` bằng các REST API chuẩn mực từ Backend `TeacherController.cs`.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Giáo viên tạo lớp học mới, cấp mã tham gia cho học sinh.
  - [ ] Giáo viên giao bài tập trắc nghiệm và chấm điểm bài tập tự luận có lưu vết DB.

#### Task P2-3: Streaming Phản hồi AI Tutor (Server-Sent Events - SSE)
- **Phân hệ:** Module E (AI Tutor)
- **Mức độ ưu tiên:** **P2**
- **Độ phức tạp:** Trung bình (Medium)
- **Thời gian ước tính:** 2 - 3 ngày
- **Phụ thuộc:** Google Gemini API Streaming
- **Mô tả:** Nâng cấp endpoint `POST /api/v1/ai/conversations/stream` sử dụng Server-Sent Events (SSE). Chữ hiển thị mượt mà từng từ trên giao diện học viên như ChatGPT.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Giảm độ trễ cảm nhận ban đầu (Time to First Token) xuống dưới 800ms.
  - [ ] Giữ nguyên định dạng Markdown và KaTeX khi stream kết thúc.

---

### 3.4 P3 – Optimization & Polish: Tối ưu & Mở rộng

#### Task P3-1: Tích hợp Cổng Thanh toán Trực tuyến (VNPAY / Momo)
- **Phân hệ:** Module I (Billing & Wallet)
- **Mức độ ưu tiên:** **P3**
- **Độ phức tạp:** Trung bình (Medium)
- **Thời gian ước tính:** 3 - 4 ngày
- **Phụ thuộc:** Đăng ký Sandbox Merchant VNPAY
- **Mô tả:** Cho phép học viên tự nạp tiền vào ví hoặc mua gói hội viên qua mã QR VNPAY/Momo, tự động cập nhật số dư qua webhook IPN an toàn với HMAC-SHA512.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Xử lý IPN idempotent, không cộng tiền trùng lặp khi mạng bị chập chờn.
  - [ ] Lịch sử giao dịch lưu chi tiết vào bảng `wallet_transactions`.

#### Task P3-2: Phân tách Gói Frontend & Caching Tối ưu (Bundle Splitting & CDN)
- **Phân hệ:** Frontend Performance
- **Mức độ ưu tiên:** **P3**
- **Độ phức tạp:** Thấp (Low)
- **Thời gian ước tính:** 1 - 2 ngày
- **Phụ thuộc:** Cấu hình Vite Rollup
- **Mô tả:** Phân tách các thư viện nặng (`lucide-react`, `katex`, `xlsx`) thành các chunk riêng biệt; cấu hình Service Worker cache các bài học đã tải để học offline.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Kích thước file bundle chính giảm xuống dưới 250KB gzipped.
  - [ ] Điểm Lighthouse Performance đạt trên 90 điểm.

---

## 4. BẢNG TIẾN ĐỘ THỰC HIỆN DỰ KIẾN (TIMELINE ESTIMATION)

| Giai đoạn | Thời gian | Hạng mục công việc chính | Nhân sự đề xuất | Kết quả bàn giao (Deliverables) |
|---|---|---|---|---|
| **Tuần 1** | Ngày 1 – Ngày 3 | Chạy migration Outbox DB; Hoàn thiện đổi mật khẩu cá nhân; Tích hợp email OTP | Backend + DevOps | 100% Core Auth & Outbox bền vững |
| **Tuần 1** | Ngày 4 – Ngày 7 | Đồng bộ tiến độ bài học DB; Bảng theo dõi tiến độ video | Full-stack | Khép kín 100% dữ liệu học viên |
| **Tuần 2** | Ngày 8 – Ngày 12 | Video Learning Giai đoạn 3 (In-Video Quiz); Streaming AI SSE | Full-stack | Trải nghiệm học video & AI vượt trội |
| **Tuần 3** | Ngày 13 – Ngày 18 | Tích hợp AI Speaking STT; Xây dựng Cổng Giáo viên thật | Full-stack + AI | Thay thế 100% mock data quan trọng |
| **Tuần 4** | Ngày 19 – Ngày 23 | Cổng thanh toán VNPAY; Tối ưu hóa bundle; Đóng gói đồ án | Full-stack + QA | Bản phát hành chính thức `Release 1.0` |
