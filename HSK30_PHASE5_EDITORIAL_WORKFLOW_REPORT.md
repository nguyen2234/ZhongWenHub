# BÁO CÁO QUY TRÌNH BIÊN TẬP & KIỂM DUYỆT CMS PHASE 5
## HSK 3.0 Master Curriculum — Editorial Lifecycle & Content Governance Report

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Dự án** | ZhongWenHub — Nền tảng Học tiếng Trung & Luyện thi HSK 3.0 |
| **Giai đoạn** | Phase 5: Academic Review, CMS Workflow & Real Student Release |
| **Mã tài liệu** | `HSK30_PHASE5_EDITORIAL_WORKFLOW_REPORT` |
| **Phân hệ quản trị** | CMS Web Console (`/admin/content-repository`, `/admin/lesson-editor`) |
| **Vòng đời nội dung** | `DRAFT` $\longrightarrow$ `PENDING_REVIEW` $\longrightarrow$ `PUBLISHED` |
| **Thời điểm nghiệm thu** | 08/11/2026 |
| **Trạng thái quy trình** | **HOÀN THIỆN 100% CÁC CƠ CHẾ KIỂM SOÁT & BẢO VỆ PHÂN QUYỀN** |

---

## 1. VÒNG ĐỜI NỘI DUNG 3 TRẠNG THÁI (3-TIER EDITORIAL LIFECYCLE)

Để ngăn chặn tuyệt đối tình trạng rò rỉ nội dung chưa kiểm duyệt hoặc xuất bản tự động bừa bãi, hệ thống CMS của ZhongWenHub thiết lập quy trình quản trị nội dung nghiêm ngặt qua 3 trạng thái:

```
+-----------------------------------------------------------------------------------+
|                                  VÒNG ĐỜI BÀI HỌC                                 |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   [ 1. DRAFT ]                                                                    |
|   - Biên tập viên soạn thảo bài khóa, từ vựng, ngữ pháp, kịch bản nghe.           |
|   - Hệ thống tự động kiểm tra checklist các mục còn thiếu.                        |
|                                     │                                             |
|                                     ▼  (Action: Submit for Review)                |
|   [ 2. PENDING_REVIEW ]                                                           |
|   - Khóa chỉnh sửa tạm thời đối với tác giả.                                      |
|   - Đưa vào Hàng đợi Thẩm định của Ban Chuyên môn Tiếng Trung.                    |
|   - Giảng viên nghe thử audio, kiểm âm, chấm điểm theo Rubric 5 chiều.            |
|                                     │                                             |
|               ┌─────────────────────┴─────────────────────┐                       |
|               ▼ (Reject with notes)                       ▼ (Approve Content)     |
|         Trở về DRAFT                                 Sẵn sàng xuất bản            |
|                                                           │                       |
|                                                           ▼ (Admin Publish)       |
|   [ 3. PUBLISHED ]                                                                |
|   - Bài học chính thức mở trên Cổng Học Viên.                                     |
|   - API mở quyền truy cập công khai cho học viên.                                 |
+-----------------------------------------------------------------------------------+
```

---

## 2. CÁC TÍNH NĂNG VÀ CÔNG CỤ QUẢN TRỊ TRÊN CMS

### 2.1. Quản lý Danh mục Toàn diện 140 Bài học
- Giao diện Bàn làm việc Quản trị Nội dung (`AdminHskRepositoryPage`) hiển thị đầy đủ 140 bài học thuộc 6 khóa học HSK 1–6.
- Bộ lọc nâng cao hỗ trợ:
  - Lọc theo Cấp độ (`HSK 1` đến `HSK 6`).
  - Lọc theo Chương học (`Unit 1` đến `Unit 8`).
  - Lọc theo Trạng thái Phê duyệt (`DRAFT`, `PENDING_REVIEW`, `PUBLISHED`).
  - Lọc theo Tình trạng Âm thanh (`GENERATED`, `TESTED`, `APPROVED`).

### 2.2. Ngăn kéo Soát lỗi & Danh mục Kiểm tra (Checklist Validator)
Khi mở chi tiết bài học (`AdminLessonEditorPage`), hệ thống tự động kích hoạt bộ kiểm tra `lesson-validation.service.ts`:
- [x] Mục tiêu sư phạm (`Summary`) đã được xác lập cụ thể (không phải placeholder).
- [x] Ngân hàng từ vựng liên kết tối thiểu 10 từ vựng.
- [x] Tối thiểu 1 điểm ngữ pháp trọng tâm có công thức và ví dụ đối chiếu.
- [x] Kịch bản hội thoại có tối thiểu 4 lượt lời kèm Pinyin và dịch nghĩa.
- [x] Bài tập nghe hiểu có đủ 4 phương án lựa chọn và 1 phương án đúng duy nhất.
- [x] Có tệp âm thanh `.mp3` thực tế đã qua kiểm tra kỹ thuật.

### 2.3. Nghe Thử & Xem Trước Đa Phương Tiện (Audio Preview Canvas)
- Biên tập viên có thể nhấp nghe thử trực tiếp từng câu thoại và tệp luyện nghe ngay trên giao diện CMS qua trình phát âm thanh tích hợp:
  - Kiểm tra độ ăn khớp giữa chữ Hán trên màn hình và giọng đọc bản xứ trong tệp `.mp3`.
  - Kiểm tra các lỗi ngắt nghỉ, phát âm sai thanh điệu hoặc ngữ điệu câu hỏi.

### 2.4. Lưu Vết Nhật ký Kiểm duyệt (Audit Trail & Versioning)
Mọi hành động phê duyệt, từ chối hoặc hiệu chỉnh đều được lưu vết thời gian thực vào SQL Server:
- `UpdatedByUserId`: ID của biên tập viên thực hiện chỉnh sửa gần nhất.
- `ReviewedByUserId`: ID của chuyên gia tiến hành thẩm định.
- `ReviewedAt`: Mốc thời gian chính xác (Timestamp) khi thực hiện duyệt.
- `ReviewNotes`: Biên bản phản hồi chi tiết của chuyên gia (lý do từ chối, điểm cần sửa đổi).

---

## 3. CÁC RÀNG BUỘC AN TOÀN VÀ NGUYÊN TẮC QUẢN TRỊ

1. **Tuyệt đối Không Xuất bản Hàng loạt (No Bulk Auto-Publishing)**:
   - Hệ thống không cung cấp nút "Publish All" hoặc tác vụ nền tự động đổi trạng thái sang `PUBLISHED`.
   - Mỗi bài học bắt buộc phải được một tài khoản có vai trò `ADMIN` hoặc `CHIEF_ACADEMIC_OFFICER` kiểm tra độc lập và xác nhận bằng hộp thoại xác thực 2 bước.
2. **Không Đánh đồng Kiểm tra AI với Người Duyệt (Zero Faked Verification)**:
   - Các bài kiểm thử tự động hay kiểm âm kích thước tệp chỉ được xếp vào nhóm `AUTOMATED_QA_PASSED`.
   - Cột `ReviewedByUserId` chỉ được gán giá trị khi người dùng thật đăng nhập và thực hiện thao tác duyệt trên CMS.
3. **Kiểm tra Ràng buộc Học liệu Phụ thuộc (Dependency Check Before Publish)**:
   - Một bài học chỉ được phép bấm nút `Publish` khi tất cả các thực thể liên kết (từ vựng, điểm ngữ pháp, bài tập, tệp audio) đều đã ở trạng thái sẵn sàng và không bị thiếu sót.

---

## 4. MA TRẬN PHÂN PHỔI HIỆN TRẠNG 140 BÀI HỌC TRÊN CMS

| Cấp độ HSK | Số bài quy hoạch | Đang ở trạng thái `DRAFT` | Đang ở trạng thái `PENDING_REVIEW` | Đã xuất bản `PUBLISHED` | Kế hoạch phê duyệt tiếp theo |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **HSK 1** | 15 | 0 | 12 | **3 (Bài 1, 2, 3)** | Ưu tiên thẩm định Đợt 1 (Batch 1: Bài 4–15) |
| **HSK 2** | 15 | 0 | 15 | 0 | Thẩm định Đợt 2 (Batch 2: Bài 1–15) |
| **HSK 3** | 20 | 0 | 20 | 0 | Thẩm định Đợt 3 (Batch 3: Bài 1–20) |
| **HSK 4** | 20 | 0 | 20 | 0 | Thẩm định Đợt 3 (Batch 3: Bài 1–20) |
| **HSK 5** | 30 | 0 | 30 | 0 | Thẩm định Đợt 4 (Batch 4: Bài 1–30) |
| **HSK 6** | 40 | 0 | 40 | 0 | Thẩm định Đợt 4 (Batch 4: Bài 1–40) |
| **TỔNG CỘNG** | **140** | **0** | **137** | **3** | **Minh bạch 100% — Không tự phong hoàn thành** |

---

## 5. KẾT LUẬN NGHIỆM THU QUY TRÌNH CMS

1. Quy trình quản trị học thuật trên CMS đã hoàn thiện đầy đủ các khâu từ Soạn thảo, Soát lỗi, Thẩm định đến Phê duyệt và Xuất bản.
2. Hệ thống kiểm soát phân quyền chặt chẽ, bảo vệ toàn vẹn dữ liệu và đảm bảo mỗi bài học khi đến tay học viên đều đạt chất lượng sư phạm cao nhất.
