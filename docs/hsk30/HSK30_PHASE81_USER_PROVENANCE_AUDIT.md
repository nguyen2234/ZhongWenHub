# ZHONGWENHUB — BÁO CÁO ĐIỀU TRA NGUỒN GỐC TÀI KHOẢN NGƯỜI DÙNG (33 → 39 USERS)
**Mã tài liệu:** HSK30_PHASE81_USER_PROVENANCE_AUDIT.md  
**Hệ thống:** ZhongWenHub Language Learning Platform  
**Phiên bản kiểm toán:** Phase 8.1 Final Integrity & Release Security Verification  
**Thời gian thực hiện:** 2026-11-09  
**Cơ sở dữ liệu:** Microsoft SQL Server (`ZhongWenHub_Dev`)

---

## 1. BỐI CẢNH VÀ MỤC TIÊU ĐIỀU TRA

Tại thời điểm kết thúc Phase 7, hệ thống ghi nhận **33 tài khoản người dùng**. Đến Phase 8, số lượng người dùng trong cơ sở dữ liệu `ZhongWenHub_Dev` tăng lên **39 tài khoản** (chênh lệch đúng **+6 tài khoản**).

Mục tiêu điều tra:
- Truy xuất đầy đủ danh tính, vai trò, thời điểm tạo, nguồn gốc phát sinh của 6 tài khoản này.
- Kiểm tra tính liên kết với các thực thể nghiệp vụ nhạy cảm: Ví tiền (`user_wallets`), Giao dịch (`wallet_transactions`), Gói thuê bao (`user_subscriptions`), và Tiến độ học tập (`student_lesson_progress`).
- Xác minh xem quá trình chạy kiểm thử tự động Playwright E2E có tác động trực tiếp vào cơ sở dữ liệu `ZhongWenHub_Dev` hay không.
- Đảm bảo tuân thủ nguyên tắc: **Không tự ý xóa tài khoản, không can thiệp sửa đổi dữ liệu nghiệp vụ khi chưa có phê duyệt chính thức.**

---

## 2. BẢNG TRUY XUẤT ĐỐI CHIẾU 6 TÀI KHOẢN PHÁT SINH

Truy vấn trực tiếp từ bảng `users`, `user_roles`, `roles`, `user_wallets`, `wallet_transactions`, `user_subscriptions`, `student_lesson_progress` trên database `ZhongWenHub_Dev`:

| STT | UserId | Email | Role | CreatedAt (UTC) | Wallets | Transactions | Subscriptions | Lesson Progress |
|:---:|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| 34 | `71DDC874-CC11-4CC9-A322-F21316C7E3F6` | `student_acc_704727@zhongwenhub.edu.vn` | `STUDENT` | 2026-11-08 15:45:04 | 0 | 0 | 0 | 1 |
| 35 | `44E81779-3EE5-4125-A283-2DEE2B07840D` | `teacher_acc_1336@zhongwenhub.edu.vn` | `TEACHER` | 2026-11-08 15:45:21 | 0 | 0 | 0 | 0 |
| 36 | `4DAEFA43-9C2E-459F-830C-94033E373C68` | `student_acc_829934@zhongwenhub.edu.vn` | `STUDENT` | 2026-11-08 16:37:10 | 0 | 0 | 0 | 1 |
| 37 | `34D4239B-696F-43DA-B554-34BEA479CBC2` | `teacher_acc_3507@zhongwenhub.edu.vn` | `TEACHER` | 2026-11-08 16:37:23 | 0 | 0 | 0 | 0 |
| 38 | `967BF487-99FB-4FC6-9F58-2814D53FB781` | `student_acc_002659@zhongwenhub.edu.vn` | `STUDENT` | 2026-11-08 16:40:02 | 0 | 0 | 0 | 1 |
| 39 | `72332F84-12BE-4709-9341-1EC28698A294` | `teacher_acc_8057@zhongwenhub.edu.vn` | `TEACHER` | 2026-11-08 16:40:18 | 0 | 0 | 0 | 0 |

---

## 3. NGUYÊN NHÂN PHÁT SINH VÀ BẰNG CHỨNG MÃ NGUỒN

### 3.1. Truy vết nguồn gốc mã nguồn (Provenance Trace)
Khi phân tích toàn bộ mã nguồn kiểm thử E2E trong thư mục [`Fontend/e2e/`](file:///d:/ZhongWenHub/Fontend/e2e/), tìm thấy đoạn mã tạo tài khoản tự động trong file [`Fontend/e2e/real-admin-acceptance.spec.ts`](file:///d:/ZhongWenHub/Fontend/e2e/real-admin-acceptance.spec.ts):

- **Tạo Student Account (Dòng 47 - 52):**
  ```typescript
  const studentUsername = `student_acc_${uniqueId}`;
  const studentEmail = `student_acc_${uniqueId}@zhongwenhub.edu.vn`;
  const regRes = await request.post('/api/v1/auth/register', {
    data: {
      username: studentUsername,
      email: studentEmail,
      password: 'TestPassword123!',
      displayName: `Student ${uniqueId}`,
      role: 'STUDENT'
    }
  });
  ```
- **Tạo Teacher Account (Dòng 215 - 225):**
  ```typescript
  const createTeacherRes = await request.post('/api/v1/admin/users', {
    headers: adminHeaders,
    data: {
      email: `teacher_acc_${uniqueId}@zhongwenhub.edu.vn`,
      displayName: `Giáo viên ${uniqueId}`,
      role: 'TEACHER',
      status: 'ACTIVE'
    }
  });
  ```

### 3.2. Đối chiếu thời điểm chạy kiểm thử (Execution Timeline)
Mỗi lần chạy kiểm thử `real-admin-acceptance.spec.ts` tương tác với Backend Live API (`http://127.0.0.1:5000`) đang kết nối vào cơ sở dữ liệu `ZhongWenHub_Dev`:
- **Đợt chạy 1 (15:45:04 - 15:45:21):** Tạo cặp tài khoản #34 (`student_acc_704727`) và #35 (`teacher_acc_1336`).
- **Đợt chạy 2 (16:37:10 - 16:37:23):** Tạo cặp tài khoản #36 (`student_acc_829934`) và #37 (`teacher_acc_3507`).
- **Đợt chạy 3 (16:40:02 - 16:40:18):** Tạo cặp tài khoản #38 (`student_acc_002659`) và #39 (`teacher_acc_8057`).

Tổng cộng đúng 3 đợt chạy đã tạo ra chính xác 6 tài khoản người dùng trên `ZhongWenHub_Dev`.

---

## 4. ĐÁNH GIÁ TÁC ĐỘNG NGHIỆP VỤ (BUSINESS IMPACT ANALYSIS)

1. **Ví tiền & Giao dịch tài chính:**
   - Cả 6 tài khoản đều có `user_wallets = 0` và `wallet_transactions = 0`.
   - **Đánh giá:** Hoàn toàn **KHÔNG gây sai lệch số dư ví tiền hay dòng tiền tài chính**.
2. **Gói thuê bao người dùng:**
   - Cả 6 tài khoản đều có `user_subscriptions = 0`.
   - **Đánh giá:** Hoàn toàn **KHÔNG ảnh hưởng đến các gói học viên trả phí**.
3. **Tiến độ học tập:**
   - 3 tài khoản giáo viên có `student_lesson_progress = 0`.
   - 3 tài khoản học viên có đúng `1` bản ghi tiến độ do kịch bản test xác minh tính liên kết khóa học.
   - **Đánh giá:** Không gây ô nhiễm dữ liệu của học viên thật.

---

## 5. KẾT LUẬN VÀ KHUYẾN NGHỊ QUẢN TRỊ DỮ LIỆU

1. **Bảo tồn dữ liệu hiện tại:** Tuân thủ đúng chỉ thị của User, **giữ nguyên 39 tài khoản**, không tự ý xóa bỏ bất kỳ bản ghi nào.
2. **Khuyến nghị cho quy trình kiểm thử E2E tương lai:**
   - Khi chạy E2E tests tự động có tạo dữ liệu (User, Course, Lesson), cần cấu hình Backend API kết nối tới cơ sở dữ liệu kiểm thử riêng biệt (`ZhongWenHub_Test` hoặc cơ sở dữ liệu `TestContainers` tạm thời) thay vì trỏ trực tiếp vào `ZhongWenHub_Dev`.
   - Áp dụng cơ chế dọn dẹp sau bài test (`afterAll` teardown) có bảo vệ khóa ngoại để tự động thu hồi tài khoản thử nghiệm.
