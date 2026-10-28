# HỆ THỐNG XÁC THỰC BẢO MẬT (JWT & REFRESH TOKEN)

## 1. Cơ Chế Xác Thực Kép (Dual-Token Pattern)

Hệ thống bảo vệ tài nguyên bằng mô hình Access Token ngắn hạn kết hợp Refresh Token xoay vòng (Token Rotation) an toàn cao:

```
[Client] ─── (1) POST /api/v1/auth/login ─────────────► [API Server]
         ◄── (2) 200 OK + AccessToken (Body) ─────────
                 + Set-Cookie: refreshToken (HttpOnly)

[Client] ─── (3) GET /api/v1/auth/me (Bearer Token) ──► [API Server]
         ◄── (4) 200 OK + User Profile ───────────────

[Client] ─── (5) POST /api/v1/auth/refresh (Cookie) ──► [API Server]
         ◄── (6) 200 OK + New AccessToken ────────────
                 + Set-Cookie: newRefreshToken (Rotated)
```

## 2. Thông Số Kỹ Thuật Access Token
- **Thuật toán:** HMAC-SHA256 (`HS256`).
- **Thời hạn (TTL):** 15 phút (mặc định cấu hình qua `JwtSettings:AccessTokenExpirationMinutes`).
- **Nội dung Claims:**
  - `sub`: Định danh người dùng (User UUID).
  - `email`: Địa chỉ email.
  - `name`: Tên hiển thị (`DisplayName`).
  - `username`: Tên đăng nhập.
  - `roles` & `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`: Danh sách vai trò người dùng.
  - `status`: Trạng thái kích hoạt tài khoản (`ACTIVE`).
  - `jti`: UUID ngẫu nhiên định danh phiên bản token.
  - `iss`: `"ZhongWenHub"`.
  - `aud`: `"ZhongWenHub-Client"`.
- **Lưu trữ phía Frontend:** Khuyến nghị lưu trong Javascript memory (không lưu trong `localStorage`).

## 3. Thông Số Kỹ Thuật Refresh Token
- **Tạo sinh:** Bộ sinh số ngẫu nhiên chuẩn mật mã (`RandomNumberGenerator.Create()`) tạo 64-byte payload, mã hóa URL-safe base64.
- **Lưu trữ Database:** **Chỉ lưu chuỗi băm SHA-256** dạng hex (64 ký tự) vào bảng `refresh_tokens`, tuyệt đối không lưu plain text.
- **Thời hạn:**
  - Thông thường: 7 ngày.
  - Khi bật `rememberMe: true`: 30 ngày.
- **Vận chuyển:**
  - Qua `HttpOnly` Cookie nhằm ngăn chặn hoàn toàn tấn công XSS đánh cắp token.
  - Cookie flags: `HttpOnly = true`, `Secure = true` (khi chạy HTTPS), `SameSite = Lax`, `Path = /api/v1/auth`.

## 4. Cơ Chế Xoay Vòng & Phát Hiện Tấn Công Dùng Lại (Token Rotation & Reuse Detection)
1. **Xoay vòng:** Mỗi lần gọi `/api/v1/auth/refresh` thành công:
   - Refresh token cũ lập tức được đánh dấu `RevokedAt = DateTime.UtcNow`, ghi nhận lý do `"Đã xoay vòng token (Rotated)"` và liên kết `ReplacedByTokenHash = newTokenHash`.
   - Một cặp token mới được cấp phát và thay thế cookie phía client.
2. **Phát hiện tái sử dụng (Reuse Detection):**
   - Nếu một refresh token đã bị thu hồi (`IsRevoked == true`) được gửi lên máy chủ:
   - Hệ thống xác định đây là hành vi sao chép / chiếm đoạt token (Replay Attack).
   - **Biện pháp khẩn cấp:** Ngay lập tức thu hồi **toàn bộ** các refresh token đang hoạt động của người dùng đó.
   - Ghi bản ghi kiểm toán bảo mật mức độ cao (`REFRESH_REUSE_DETECTED`).
   - Trả về mã lỗi HTTP 401 Problem Details buộc tất cả các thiết bị phải đăng nhập lại.

## 5. Đăng Xuất (Logout)
- Endpoint: `POST /api/v1/auth/logout`.
- Đánh dấu thu hồi token trong cơ sở dữ liệu (`RevokedAt`, `RevocationReason = "Đăng xuất bởi người dùng"`).
- Xóa cookie `refreshToken` trên trình duyệt bằng cách thiết lập giá trị rỗng và thời gian hết hạn trong quá khứ.
