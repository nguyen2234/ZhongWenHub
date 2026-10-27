# CHIẾN LƯỢC TÍCH HỢP FRONTEND - BACKEND (FRONTEND-BACKEND INTEGRATION)
**Dự án:** ZhongWenHub  
**Phiên bản:** v13.3 (FE-13.3 Integration Plan)  
**Kiến trúc:** Port & Adapter Pattern (Repository Pattern), Mock vs. HTTP Adapters, Problem Details Handler.

---

## 1. MÔ HÌNH KIẾN TRÚC KẾT NỐI (REPOSITORY ADAPTER PATTERN)

```text
┌────────────────────────────────────────────────────────┐
│                   React Pages / Hooks                  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │ Typed Service Interfaces  │
              │  (ISupportTicketRepo,     │
              │   IVideoRepo, ...)        │
              └─────────────┬─────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│ Mock Repository       │       │ HTTP Repository       │
│ (Hiện tại - In Memory)│       │ (Tương lai - ASP.NET) │
└───────────────────────┘       └───────────┬───────────┘
                                            │
                                            ▼
                                ┌───────────────────────┐
                                │ ASP.NET Core Web API  │
                                │   /api/v1/*           │
                                └───────────────────────┘
```

---

## 2. LỘ TRÌNH CHUYỂN ĐỔI TỪNG BƯỚC (INCREMENTAL MIGRATION)

### Giai đoạn 1: Chuẩn hóa Hợp đồng DTO & Interface (Hoàn thành ở FE-13.3)
* Tất cả các trường dữ liệu trên giao diện được định kiểu qua DTOs tại `src/types/api/*.dto.ts`.
* Mock services triển khai đúng các chữ ký hàm tương ứng repository interface (`getTickets`, `createVideo`, `escalateToContentManager`, ...).

### Giai đoạn 2: Cấu hình Biến Môi Trường (Environment Configuration)
Khai báo tại `.env` và `.env.production`:
```ini
# Sử dụng mock repository (true) hoặc kết nối HTTP thật (false)
VITE_USE_MOCK_API=true

# Địa chỉ base URL của ASP.NET Core API
VITE_API_BASE_URL=https://api.zhongwenhub.edu.vn/api/v1

# Danh sách trusted origins để đính kèm Token và Anti-CSRF
VITE_API_TRUSTED_ORIGINS=https://api.zhongwenhub.edu.vn,http://localhost:5000
```

### Giai đoạn 3: Triển khai HTTP Client Adapter
Tạo lớp `HttpTicketRepository` kế thừa `ISupportTicketRepository`:
```typescript
export class HttpTicketRepository implements ISupportTicketRepository {
  constructor(private httpClient: HttpClient) {}

  async getTickets(query?: PaginationQuery): Promise<PagedResponse<SupportTicketDto>> {
    const params = new URLSearchParams();
    if (query?.pageNumber) params.set('pageNumber', String(query.pageNumber));
    if (query?.pageSize) params.set('pageSize', String(query.pageSize));
    if (query?.search) params.set('search', query.search);
    return this.httpClient.get<PagedResponse<SupportTicketDto>>(`/support/tickets?${params.toString()}`);
  }
  // ...
}
```

### Giai đoạn 4: Factory Service Injection
Cung cấp repository dựa trên cờ cấu hình môi trường:
```typescript
import { MockTicketRepository } from './mock-ticket.repository';
import { HttpTicketRepository } from './http-ticket.repository';

export const supportTicketRepository = import.meta.env.VITE_USE_MOCK_API === 'true'
  ? new MockTicketRepository()
  : new HttpTicketRepository(apiClient);
```

---

## 3. CƠ CHẾ XỬ LÝ LỖI (PROBLEM DETAILS ADAPTER)

Khi nhận phản hồi HTTP có `Content-Type: application/problem+json`:
1. Parser tự động giải mã cấu trúc `ApiProblemDetails`.
2. Trích xuất thuộc tính `errors` và ánh xạ ngược vào form validation errors tương ứng (`formErrors[field] = errors[Field][0]`).
3. Nếu là lỗi 401: Kích hoạt silent refresh token qua endpoint `/api/v1/auth/refresh-token`. Nếu thất bại, điều hướng người dùng về trang đăng nhập mà không làm crash màn hình.
4. Nếu là lỗi 403: Hiển thị giao diện "Bạn không có quyền truy cập chức năng này" (Evondev Forbidden State).
