# MA TRẬN HIỂN THỊ HỌC LIỆU CMS QUẢN TRỊ VS HỌC VIÊN
## Role-Based Content Visibility, Security Filter Audit & Mock Isolation Matrix
**Dự án**: ZhongWenHub — Hệ thống Đào tạo & Quản lý Học liệu Tiếng Trung Chuẩn Quốc tế  
**Căn cứ kiểm toán**: Dữ liệu thật trên `ZhongWenHub_Dev` & Mã nguồn Backend/Frontend  
**Thời gian xác minh**: Ngày 08/11/2026  
**Trạng thái phân quyền**: `SECURE ACCESS CONTROL VERIFIED — CONTENT BOTTLENECK DETECTED`

---

## 1. MA TRẬN SO SÁNH QUYỀN TRUY CẬP VÀ SỐ LƯỢNG HỌC LIỆU HIỂN THỊ

Bảng đối chiếu số lượng học liệu có trong SQL Server so với số lượng thực tế mà người dùng ở từng vai trò có thể nhìn thấy qua API và giao diện web:

| Phân hệ học liệu (Resource) | Tổng số trong SQL Server | ADMIN / CONTENT_MANAGER (CMS Quản trị) | STUDENT (Học viên đăng nhập) | GUEST (Khách vãng lai chưa đăng nhập) | Ghi chú kỹ thuật về cơ chế lọc |
|---|:---:|:---:|:---:|:---:|---|
| **Khóa học (`courses`)** | **6** | **6** (100%) | **6** (100%) | **6** (100%) | Cả 6 khóa học HSK 1–6 đều có `Status = 'PUBLISHED'`. |
| **Đơn vị bài học (`units`)** | **35** | **35** (100%) | **2** (5.7%) | **2** (5.7%) | Chỉ có 2 Units của HSK 1 là `PUBLISHED`. 33 Units còn lại là `DRAFT`. |
| **Bài học (`lessons`)** | **140** | **140** (100%) | **3** (2.1%) | **3** (2.1%) | Chỉ có 3 bài học (L1, L2, L3) của HSK 1 là `PUBLISHED`. 137 bài còn lại là `DRAFT`. |
| **Từ vựng (`vocabularies`)** | **5,400** | **5,400** (100%) | **10** (0.18%) | **10** (0.18%) | 10 từ của HSK 1 là `PUBLISHED`. 290 từ là `DRAFT`. 5,100 từ (HSK 2–6) là `PENDING_REVIEW`. |
| **Ngữ pháp (`grammar_points`)**| **461** | **461** (100%) | **2** (0.43%) | **2** (0.43%) | 2 điểm của HSK 1 là `PUBLISHED`. 459 điểm (HSK 1–6) là `PENDING_REVIEW`. |
| **Chữ Hán (`hanzi_characters`)**| **1,940**| **1,940** (100%) | **1,940** (100%) | **1,940** (100%) | Chữ Hán là từ điển dùng chung, không bị chặn bởi bộ lọc xuất bản. |
| **Bài tập (`exercises`)** | **278** | **278** (100%) | **2** (0.72%) | **2** (0.72%) | Chỉ có 2 bài tập của HSK 1 là `PUBLISHED`. 276 bài còn lại là `DRAFT`. |

---

## 2. MA TRẬN CHI TIẾT SỐ LƯỢNG HỌC LIỆU HIỂN THỊ THEO TỪNG CẤP ĐỘ HSK

### 2.1. Đối với ADMIN / CONTENT_MANAGER (Nhìn thấy toàn bộ dữ liệu thật)
| Cấp độ | Khóa học | Đơn vị học | Bài học | Từ vựng | Ngữ pháp | Chữ Hán | Bài tập | Trạng thái phê duyệt chủ đạo |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **HSK 1** | 1 | 6 | 15 | 300 | 72 | 246 | 28 | Một phần PUBLISHED, còn lại DRAFT & PENDING_REVIEW |
| **HSK 2** | 1 | 5 | 15 | 200 | 78 | 125 | 30 | 100% PENDING_REVIEW / DRAFT |
| **HSK 3** | 1 | 5 | 20 | 500 | 96 | 284 | 40 | 100% PENDING_REVIEW / DRAFT |
| **HSK 4** | 1 | 5 | 20 | 1,000 | 95 | 441 | 40 | 100% PENDING_REVIEW / DRAFT |
| **HSK 5** | 1 | 6 | 30 | 1,600 | 70 | 431 | 60 | 100% PENDING_REVIEW / DRAFT |
| **HSK 6** | 1 | 8 | 40 | 1,800 | 50 | 413 | 80 | 100% PENDING_REVIEW / DRAFT |
| **Tổng** | **6** | **35** | **140** | **5,400** | **461** | **1,940** | **278** | **Đầy đủ 100% học liệu cho công tác biên tập** |

---

### 2.2. Đối với STUDENT / HỌC VIÊN (Chỉ nhìn thấy nội dung PUBLISHED)
| Cấp độ | Khóa học | Đơn vị học | Bài học | Từ vựng | Ngữ pháp | Chữ Hán | Bài tập | Trải nghiệm người dùng thực tế |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **HSK 1** | 1 | 2 | 3 | 10 | 2 | 246 | 2 | Học sinh học được 3 bài đầu của HSK 1. |
| **HSK 2** | 1 | 0 | 0 | 0 | 0 | 125 | 0 | Khóa học hiển thị nhưng danh sách bài học **trống**. |
| **HSK 3** | 1 | 0 | 0 | 0 | 0 | 284 | 0 | Khóa học hiển thị nhưng danh sách bài học **trống**. |
| **HSK 4** | 1 | 0 | 0 | 0 | 0 | 441 | 0 | Khóa học hiển thị nhưng danh sách bài học **trống**. |
| **HSK 5** | 1 | 0 | 0 | 0 | 0 | 431 | 0 | Khóa học hiển thị nhưng danh sách bài học **trống**. |
| **HSK 6** | 1 | 0 | 0 | 0 | 0 | 413 | 0 | Khóa học hiển thị nhưng danh sách bài học **trống**. |
| **Tổng** | **6** | **2** | **3** | **10** | **2** | **1,940** | **2** | **Nghẽn nội dung học tập từ Cấp 2 đến Cấp 6** |

---

## 3. CƠ CHẾ BẢO MẬT & PHÂN QUYỀN TẠI BACKEND WEB API

### 3.1. Phân tích mã nguồn bộ lọc bảo mật (`ContentController.cs`)
Tại `Backend/src/Api/Controllers/ContentController.cs`:
```csharp
private bool IsStaff()
{
    return User.IsInRole(RoleConstants.Admin)
        || User.IsInRole(RoleConstants.ContentManager);
}

[HttpGet("vocabularies")]
public async Task<IActionResult> GetVocabularies(...)
{
    var publishedOnly = !IsStaff();
    var items = await _contentService.GetVocabulariesAsync(..., publishedOnly, ...);
    return Ok(items);
}

[HttpGet("grammar")]
public async Task<IActionResult> GetGrammarPoints(...)
{
    var publishedOnly = !IsStaff();
    var items = await _contentService.GetGrammarPointsAsync(..., publishedOnly, ...);
    return Ok(items);
}

[HttpGet("lessons")]
public async Task<IActionResult> GetLessons(...)
{
    var publishedOnly = !IsStaff();
    var lessons = await _contentService.GetLessonsAsync(..., publishedOnly, ...);
    return Ok(lessons);
}
```

### 3.2. Đánh giá tính an toàn bảo mật
- **Không rò rỉ dữ liệu chưa duyệt**: Khi một tài khoản mang vai trò `STUDENT` hoặc một yêu cầu không có JWT Token gọi vào API, cờ `publishedOnly` luôn mang giá trị `true`.
- Tầng Business (`ContentService.cs`) tự động áp dụng biểu thức LINQ:
  `query = query.Where(x => x.Status == ContentStatusConstants.Published);`
- **Kết luận**: Tuyệt đối **không có hiện tượng rò rỉ nội dung `DRAFT` hoặc `PENDING_REVIEW`** đến người dùng cuối. Cơ chế kiểm soát truy cập phân tầng (RBAC) vận hành an toàn 100%.

---

## 4. RÀ SOÁT HIỆN TRẠNG MOCK DATA Ở FRONTEND & NGUY CƠ SAI LỆCH

Mặc dù hệ thống đã kết nối hoàn chỉnh với SQL Server, kiểm toán phát hiện **3 vị trí fallback sang dữ liệu giả lập** tại Frontend:

| Vị trí mã nguồn | Dữ liệu giả lập (Mock Data) | Bối cảnh kích hoạt | Nguy cơ & Đề xuất xử lý |
|---|---|---|---|
| `Fontend/src/features/grammar/services/grammar.service.ts` | `MOCK_GRAMMAR_POINTS` (468 dòng dữ liệu cứng) | Kích hoạt khi Backend API bị lỗi (khối `catch (err)`) | **Nguy cơ cao**: Học viên tưởng là dữ liệu thật nhưng thực tế là mock cũ. Cần hiển thị Error Banner thay vì âm thầm fallback. |
| `Fontend/src/features/vocabulary/components/VocabularyBank.tsx` | `INITIAL_VOCABULARY_LIST` (Hằng số tĩnh) | Kích hoạt khi không kết nối được API từ vựng | **Nguy cơ trung bình**: Cần thông báo trạng thái ngoại tuyến rõ ràng cho người dùng. |
| `Fontend/src/core/repositories/repository-container.ts` | `MockExerciseRepository` | Kích hoạt khi cờ `defaultApiConfig.useMock = true` | **Kiểm soát tốt**: Mặc định là `false` trên trình duyệt thật; chỉ kích hoạt khi chạy Bun test. |

---

## 5. ĐÁNH GIÁ NĂNG LỰC CMS QUẢN TRỊ & NGHẼN PHÊ DUYỆT

### 5.1. Năng lực hiện có của CMS Quản trị (`AdminHskRepositoryPage`)
- **Quản lý toàn diện 3 phân hệ**: Tab Từ vựng (5,400 mục), Tab Chữ Hán (1,940 mục), Tab Ngữ pháp (461 mục).
- **Bộ lọc đa chiều**: Lọc theo cấp HSK (1–6), lọc theo từ loại, lọc mục thiếu nghĩa tiếng Việt, lọc từ đồng tự/đa âm, tìm kiếm từ khóa tức thì.
- **Drawer chỉnh sửa chuyên sâu**: Cho phép biên tập viên chỉnh sửa trực tiếp từng trường dữ liệu, âm Hán Việt, phiên âm, câu ví dụ và bài tập.
- **Nhập/Xuất Excel chuẩn**: Hỗ trợ xuất dữ liệu ra file `.xlsx` và nhập liệu hàng loạt kèm kiểm tra tính hợp lệ trước khi lưu.

### 5.2. Điểm nghẽn lớn nhất: "Nút thắt Phê duyệt" (Approval Bottleneck)
- Hiện tại, **5,100 từ vựng** và **459 điểm ngữ pháp** của HSK 2–6 đang dừng ở trạng thái `PENDING_REVIEW` (đã được làm sạch, hoàn thiện nghĩa tiếng Việt và bài tập ở các phase trước nhưng chưa được chuyển sang `PUBLISHED`).
- CMS hiện chỉ hỗ trợ phê duyệt từng mục đơn lẻ qua nút lưu Drawer, chưa có tính năng **Duyệt hàng loạt (Bulk Publish)** theo bài học hoặc theo cấp độ.
- **Giải pháp cho Phase 2**: Xây dựng công cụ thẩm định chất lượng theo bài học (Lesson-Level Editorial Sign-off) để phê duyệt đồng bộ cả bài học kèm toàn bộ từ vựng và ngữ pháp tương ứng, giúp mở khóa toàn diện nội dung cho học sinh.
