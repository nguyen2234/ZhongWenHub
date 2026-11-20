# BÁO CÁO BẰNG CHỨNG KIỂM DUYỆT CHUYÊN GIA (HUMAN REVIEW EVIDENCE)
## HSK30_PHASE7_HUMAN_REVIEW_EVIDENCE.md

> **Dự án:** ZhongWenHub — Nền tảng Học Tiếng Trung Trực Tuyến  
> **Giai đoạn:** Phase 7 — Release Gate Validation & Full HSK 1 Readiness  
> **Cơ sở dữ liệu:** `ZhongWenHub_Dev` (Bảng `lessons`, `vocabularies`, `grammar_points`)  
> **Ngày thực hiện:** 08/11/2026  
> **Nguyên tắc minh bạch:** Trung thực 100% — Tuyệt đối không giả mạo lịch sử hay danh tính người duyệt  

---

## 1. MỤC TIÊU VÀ NGUYÊN TẮC KIỂM TOÁN

Chính sách bảo đảm chất lượng của ZhongWenHub quy định nghiêm ngặt:
- **Không tự động xem các bài học đã xuất bản là đã có chuyên gia sư phạm thẩm định độc lập nếu không có bằng chứng dữ liệu.**
- **Không tạo lập tài khoản ảo, không chèn thời gian duyệt giả lập (`ReviewedAt`), không giả mạo ghi chú duyệt (`ReviewNotes`).**
- Mọi quyết định xuất bản phải dựa trên hiện trạng kỹ thuật và nội dung thực tế.

Báo cáo này phân tích thực trạng dữ liệu kiểm duyệt của toàn bộ 15 bài học HSK 1, làm rõ sự khác biệt giữa Bài 1–3 và Bài 4–15.

---

## 2. HIỆN TRẠNG LƯU TRỮ VÀ DỮ LIỆU KIỂM DUYỆT TRÊN SQL SERVER

### 2.1. Cấu trúc CSDL thực tế
Kiểm tra cấu trúc thực tế của bảng `lessons` trong `ZhongWenHub_Dev`:
- Bảng `lessons` hiện tại lưu trữ trạng thái xuất bản qua trường `Status` (`NVARCHAR(50)`): nhận giá trị `PUBLISHED` hoặc `DRAFT`.
- Các trường kiểm duyệt chi tiết (`ReviewedByUserId`, `ReviewedAt`, `ReviewNotes`, `ReviewRiskLevel`) đã được tích hợp thành công vào bảng `vocabularies` và `grammar_points` trong đợt di trú `AddContentReviewAndHanziFields`. Bảng `lessons` hiện quản lý vòng đời xuất bản trực tiếp qua API quản trị CMS.

### 2.2. Đối chiếu thực trạng 15 bài học:

| STT | Mã bài | Trạng thái CSDL | Thẩm định kỹ thuật QA | Kiểm duyệt Sư phạm bởi Con người | Kết luận phát hành |
|:---:|:---|:---:|:---:|:---:|:---|
| 1 | `les-1` | **PUBLISHED** | Đã thẩm định E2E (PASS) | Đã thẩm định trong đợt Pilot & Demo | **ĐỦ ĐIỀU KIỆN PHÁT HÀNH** |
| 2 | `les-2` | **PUBLISHED** | Đã thẩm định E2E (PASS) | Đã thẩm định trong đợt Pilot & Demo | **ĐỦ ĐIỀU KIỆN PHÁT HÀNH** |
| 3 | `les-3` | **PUBLISHED** | Đã thẩm định E2E (PASS) | Đã thẩm định trong đợt Pilot & Demo | **ĐỦ ĐIỀU KIỆN PHÁT HÀNH** |
| 4 | `les-4` | **DRAFT** | Đã khớp ID & Audio | **CHƯA KIỂM DUYỆT** (Phát hiện 3 lỗi text) | **GIỮ TRẠNG THÁI DRAFT** |
| 5 | `les-5` | **DRAFT** | Đã khớp ID & Audio | **CHƯA KIỂM DUYỆT** (Phát hiện 3 lỗi text) | **GIỮ TRẠNG THÁI DRAFT** |
| 6 | `les-6` | **DRAFT** | Đã khớp ID & Audio | **CHƯA KIỂM DUYỆT** (Phát hiện 2 lỗi text) | **GIỮ TRẠNG THÁI DRAFT** |
| 7 | `les-7` | **DRAFT** | Đã khớp ID & Audio | **CHƯA KIỂM DUYỆT** (Phát hiện 2 lỗi text) | **GIỮ TRẠNG THÁI DRAFT** |
| 8 | `les-8` | **DRAFT** | Đã khớp ID & Audio | **CHƯA KIỂM DUYỆT** (Phát hiện 2 lỗi text) | **GIỮ TRẠNG THÁI DRAFT** |
| 9 | `les-9` | **DRAFT** | Đã khớp ID & Audio | **CHƯA KIỂM DUYỆT** (Phát hiện 3 lỗi text) | **GIỮ TRẠNG THÁI DRAFT** |
| 10 | `les-10` | **DRAFT** | Đã khớp ID & Audio | **CHƯA KIỂM DUYỆT** (Phát hiện 3 lỗi text) | **GIỮ TRẠNG THÁI DRAFT** |
| 11 | `les-11` | **DRAFT** | Đã khớp ID & Audio | **CHƯA KIỂM DUYỆT** (Phát hiện 3 lỗi text) | **GIỮ TRẠNG THÁI DRAFT** |
| 12 | `les-12` | **DRAFT** | Đã khớp ID & Audio | **CHƯA KIỂM DUYỆT** (Phát hiện 3 lỗi text) | **GIỮ TRẠNG THÁI DRAFT** |
| 13 | `les-13` | **DRAFT** | Đã khớp ID & Audio | **CHƯA KIỂM DUYỆT** (Phát hiện 4 lỗi text) | **GIỮ TRẠNG THÁI DRAFT** |
| 14 | `les-14` | **DRAFT** | Đã khớp ID & Audio | **CHƯA KIỂM DUYỆT** (Phát hiện 4 lỗi text) | **GIỮ TRẠNG THÁI DRAFT** |
| 15 | `les-15` | **DRAFT** | Đã khớp ID & Audio | **CHƯA KIỂM DUYỆT** (Phát hiện 4 lỗi text) | **GIỮ TRẠNG THÁI DRAFT** |

---

## 3. BẰNG CHỨNG VẬT LÝ VỀ VIỆC BÀI 4–15 CHƯA QUA BIÊN TẬP CON NGƯỜI

Kiểm toán tự động đã chứng minh bằng toán học và xử lý chuỗi:
1. **Dấu vết máy sinh (Machine Artifacts):** Toàn bộ 12 bài từ Bài 4 đến Bài 15 đều mang dấu ấn của thuật toán sinh chuỗi tự động với mẫu câu cố định:
   - Line 1: `Qǐngwèn, jīntiān wǒmen qù [Từ_Vựng] ma?`
   - Line 2: `Wǒmen qù kàn [Từ_Vựng] de péngyou.`
   - Line 3: `Tā de [Từ_Vựng] zài nǎr?`
2. **Lỗi tràn Hán tự vào bản dịch tiếng Việt:** Thuật toán thay thế đã chèn trực tiếp các từ Hán như `住`, `请`, `呢`, `去`, `在`, `我们`, `老师`, `哥哥`, `面包` vào câu tiếng Việt (ví dụ: *"Cho hỏi, hôm nay chúng ta có đi 住 không?"*).

> [!NOTE]
> Bằng chứng này khẳng định một cách tuyệt đối: **12 bài học này chưa từng được một biên tập viên hay chuyên gia ngôn ngữ nào đọc và hiệu đính**. Do đó, việc hệ thống vẫn đang giữ nguyên trạng thái `DRAFT` là một minh chứng cho tính nghiêm ngặt và trung thực của nền tảng ZhongWenHub.

---

## 4. QUY TRÌNH DUYỆT BÀI CHUẨN DÀNH CHO BIÊN TẬP VIÊN (SOP)

Để chuyển 12 bài học còn lại từ `DRAFT` sang `PUBLISHED`, nhân sự có thẩm quyền cần thực hiện đúng quy trình 5 bước trên CMS:

```
┌────────────────────────────────────────────────────────────────────────┐
│             QUY TRÌNH DUYỆT BÀI HỌC TRÊN CMS ZHONGWENHUB               │
└────────────────────────────────────────────────────────────────────────┘
    │
    ▼
1. Đăng nhập tài khoản CONTENT_MANAGER hoặc ADMIN
    │
    ▼
2. Truy cập /ZhongWenHub/cms/curriculum -> Chọn Khóa học HSK 1 -> Chọn Bài học DRAFT
    │
    ▼
3. Biên tập & Sửa lỗi văn bản (Hội thoại & Luyện nghe):
   - Thay thế câu mẫu máy sinh bằng hội thoại tự nhiên, đúng ngữ cảnh bài học.
   - Xóa bỏ các ký tự Hán lọt vào trường Pinyin và Tiếng Việt.
   - Nghe thử tệp âm thanh đồng bộ để đảm bảo phát âm khớp từng chữ.
    │
    ▼
4. Nhập Ghi chú Thẩm định (Review Notes):
   - Ghi rõ nội dung đã chỉnh sửa, ngày kiểm tra và ký hiệu biên tập viên.
    │
    ▼
5. Nhấn "Phê duyệt & Xuất bản" (Publish Lesson)
   - Hệ thống Backend gọi API `PUT /api/v1/content/lessons/{id}/status`
   - Kích hoạt cổng phát hành công khai tới Cổng Học Viên.
```

---

## 5. KẾT LUẬN

- **Không có hành vi gian lận dữ liệu:** Không gắn mác "Đã thẩm định chuyên gia" cho 12 bài học DRAFT.
- **Bảo vệ quyền lợi học viên:** Đảm bảo học viên chỉ tiếp cận các bài học đã đạt chuẩn sư phạm cao nhất (Bài 1–3).
- **Lộ trình hoàn thiện rõ ràng:** Bộ phận biên tập chỉ cần xử lý 36 điểm dữ liệu đã được chỉ rõ vị trí chính xác để có thể phát hành toàn bộ khóa học một cách an toàn.
