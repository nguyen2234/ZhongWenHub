# TÀI LIỆU HỢP ĐỒNG API (ASP.NET CORE WEB API CONTRACT)
**Dự án:** ZhongWenHub  
**Phiên bản:** v1.0 (FE-11 Backend Readiness)  
**Công nghệ Backend mục tiêu:** ASP.NET Core 9/10 Web API, Entity Framework Core, SQL Server, ASP.NET Core Identity.

---

## 1. NGUYÊN TẮC THIẾT KẾ (DESIGN PRINCIPLES)

1. **Chuẩn RESTful tự nhiên (No Envelopes on raw objects):**
   * Endpoint trả về tài nguyên trực tiếp (Ví dụ: `GET /api/v1/grammar/g-hsk1-01` trả về `200 OK` với JSON object của điểm ngữ pháp đó).
   * **Không ép buộc envelope nhân tạo** kiểu `{ success: true, data: { ... } }` cho mọi phản hồi HTTP thành công.
2. **Cấu trúc phân trang chuẩn (PagedResult<T>):**
   * Chỉ các endpoint trả về danh sách có phân trang mới trả về cấu trúc `PagedResult<T>`.
   ```json
   {
     "items": [ ... ],
     "pageNumber": 1,
     "pageSize": 20,
     "totalCount": 42,
     "totalPages": 3,
     "hasPreviousPage": false,
     "hasNextPage": true
   }
   ```
3. **Chuẩn hóa lỗi RFC 7807 (Problem Details & ValidationProblemDetails):**
   * Mọi lỗi 4xx và 5xx tuân thủ chuẩn `application/problem+json` của ASP.NET Core `Microsoft.AspNetCore.Mvc.ProblemDetails`.
   ```json
   {
     "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
     "title": "One or more validation errors occurred.",
     "status": 400,
     "detail": "Dữ liệu gửi lên không vượt qua các kiểm tra tính hợp lệ.",
     "instance": "/api/v1/admin/grammar",
     "errors": {
       "Title": ["Tiêu đề điểm ngữ pháp không được để trống."],
       "HskLevel": ["Cấp độ HSK phải nằm trong khoảng từ 1 đến 6."]
     }
   }
   ```
4. **Bảo mật & Phân quyền (Authentication & Authorization):**
   * JWT Bearer Token trong header `Authorization: Bearer <token>`.
   * Vai trò (Roles): `Student`, `Teacher`, `Admin`, `Support`.
   * Endpoint học viên tuyệt đối không trả về nội dung ở trạng thái `DRAFT` hoặc `ARCHIVED`.

---

## 2. QUY TRÌNH TRẠNG THÁI NỘI DUNG (CONTENT LIFECYCLE)

```text
[DRAFT] ──(Gửi duyệt)──> [PENDING_REVIEW] ──(Phê duyệt)──> [PUBLISHED] ──(Ẩn/Hết hạn)──> [ARCHIVED]
   ▲                                                             │
   └────────────────────(Yêu cầu sửa đổi)────────────────────────┘
```

* **DRAFT (Bản nháp):** Chỉ hiển thị với tác giả và Admin; không xuất hiện trên giao diện học viên.
* **PENDING_REVIEW (Chờ duyệt):** Đang chờ bộ phận học thuật kiểm duyệt.
* **PUBLISHED (Đã xuất bản):** Được đưa vào kho nội dung trực tuyến cho học viên.
* **ARCHIVED (Lưu trữ):** Ẩn khỏi bài học nhưng vẫn giữ dữ liệu cho các báo cáo lịch sử.

---

## 3. CHI TIẾT CÁC ENDPOINT VÀ CONTRACTS

### 3.1. Phân hệ Quản trị Ngữ pháp (Admin Grammar)

#### `GET /api/v1/admin/grammar`
* **Quyền:** `Admin`, `ContentManager`
* **Query Params:**
  * `pageNumber` (int, default: 1)
  * `pageSize` (int, default: 20)
  * `search` (string, optional)
  * `hskLevel` (int 1-6 hoặc null/ALL)
  * `category` (string, optional)
  * `status` (string: DRAFT, PENDING_REVIEW, PUBLISHED, ARCHIVED)
* **Response (200 OK):** `AdminGrammarPoint[]` hoặc `PagedResult<AdminGrammarPoint>`

#### `GET /api/v1/admin/grammar/{id}`
* **Quyền:** `Admin`, `ContentManager`
* **Response (200 OK):** `AdminGrammarPoint`
* **Response (404 Not Found):** `ProblemDetails`

#### `POST /api/v1/admin/grammar`
* **Quyền:** `Admin`, `ContentManager`
* **Body:** `CreateAdminGrammarDTO`
* **Response (201 Created):** `AdminGrammarPoint`
* **Response (400 Bad Request):** `ValidationProblemDetails`

#### `PUT /api/v1/admin/grammar/{id}`
* **Quyền:** `Admin`, `ContentManager`
* **Body:** `UpdateAdminGrammarDTO`
* **Response (200 OK):** `AdminGrammarPoint`

#### `DELETE /api/v1/admin/grammar/{id}`
* **Quyền:** `Admin`
* **Response (204 No Content)**

#### `GET /api/v1/admin/grammar/stats`
* **Quyền:** `Admin`
* **Response (200 OK):**
  ```json
  {
    "total": 15,
    "published": 10,
    "draft": 2,
    "pending": 2,
    "archived": 1,
    "byHsk": { "1": 5, "2": 5, "3": 3, "4": 1, "5": 1, "6": 0 }
  }
  ```

---

### 3.2. Phân hệ Ngân hàng Câu hỏi & Bài tập (Admin Exercise Bank)

#### `GET /api/v1/admin/exercises`
* **Quyền:** `Admin`, `ContentManager`
* **Query Params:** `hskLevel`, `skill`, `type`, `difficulty`, `status`, `grammarPointId`, `lessonId`, `search`
* **Response (200 OK):** `AdminExerciseItem[]`

#### `GET /api/v1/admin/exercises/{id}`
* **Quyền:** `Admin`
* **Response (200 OK):** `AdminExerciseItem`

#### `POST /api/v1/admin/exercises`
* **Quyền:** `Admin`
* **Body:** `CreateAdminExerciseDTO`
* **Response (201 Created):** `AdminExerciseItem`

#### `PUT /api/v1/admin/exercises/{id}`
* **Quyền:** `Admin`
* **Body:** `UpdateAdminExerciseDTO`
* **Response (200 OK):** `AdminExerciseItem`

#### `DELETE /api/v1/admin/exercises/{id}`
* **Quyền:** `Admin`
* **Response (204 No Content)**

#### `GET /api/v1/admin/exercises/stats`
* **Quyền:** `Admin`
* **Response (200 OK):** `AdminExerciseStats`

---

### 3.3. Phân hệ Học viên (Student Endpoints)

#### `GET /api/v1/grammar`
* **Quyền:** Public / Student
* **Mô tả:** Lấy danh sách điểm ngữ pháp đã xuất bản (`PUBLISHED`) phục vụ trang Luyện tập & Thư viện ngữ pháp.

#### `GET /api/v1/grammar/{id}`
* **Quyền:** Public / Student
* **Mô tả:** Chi tiết điểm ngữ pháp, cấu trúc và câu hỏi luyện tập đi kèm.

#### `GET /api/v1/exercises`
* **Quyền:** Student
* **Mô tả:** Lấy bộ câu hỏi theo kỹ năng (`reading`, `listening`, `writing`, `speaking`, `grammar`, `vocabulary`) và cấp độ HSK.

#### `POST /api/v1/exercises/evaluate`
* **Quyền:** Student
* **Body:**
  ```json
  {
    "exerciseId": "ex-p1",
    "userAnswer": "想",
    "timeSpentSeconds": 12
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "isCorrect": true,
    "score": 100,
    "xpEarned": 15,
    "explanation": "想 biểu thị mong muốn, dự định chủ quan.",
    "srsUpdate": {
      "nextReviewDays": 3,
      "interval": 2.5
    }
  }
  ```

---

## 4. TƯƠNG ỨNG MÃ NGUỒN C# (ASP.NET CORE DTOS & ENTITIES)

### C# Domain Model: GrammarPoint.cs
```csharp
namespace ZhongWenHub.Domain.Entities;

public class GrammarPoint : BaseAuditableEntity
{
    public string Id { get; set; } = default!;
    public string Code { get; set; } = default!;
    public string Title { get; set; } = default!;
    public string PinyinTitle { get; set; } = default!;
    public int HskLevel { get; set; } // 1 - 6
    public string Category { get; set; } = default!;
    public string StructureFormula { get; set; } = default!;
    public string Explanation { get; set; } = default!;
    public string Difficulty { get; set; } = "Dễ";
    public ContentStatus Status { get; set; } = ContentStatus.Draft;
    
    // Navigation Properties
    public ICollection<GrammarExample> Examples { get; set; } = new List<GrammarExample>();
    public ICollection<LessonGrammar> LessonLinks { get; set; } = new List<LessonGrammar>();
    public ICollection<ExerciseItem> LinkedExercises { get; set; } = new List<ExerciseItem>();
}
```

### C# DTO: CreateAdminGrammarDTO.cs
```csharp
namespace ZhongWenHub.Application.Features.Grammar.DTOs;

public record CreateAdminGrammarDTO(
    string Code,
    string Title,
    string PinyinTitle,
    int HskLevel,
    string Category,
    string StructureFormula,
    string Explanation,
    string Difficulty,
    string Status,
    List<GrammarExampleDTO> Examples,
    List<string>? LinkedLessonIds
);
```
