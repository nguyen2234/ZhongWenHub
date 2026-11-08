# QUYẾT ĐỊNH PHÁT HÀNH HỌC LIỆU HSK 3.0 CẤP 1
## HSK30_PHASE7_HSK1_RELEASE_DECISION.md

> **Dự án:** ZhongWenHub — Nền tảng Học Tiếng Trung Trực Tuyến  
> **Cấp độ học liệu:** HSK 3.0 Cấp 1 (Theo chuẩn GF 0025-2021)  
> **Giai đoạn:** Phase 7 — Release Gate Validation & Full HSK 1 Readiness  
> **Cơ sở dữ liệu:** `ZhongWenHub_Dev` (SQL Server Express `localhost\SQLEXPRESS`)  
> **Ngày phê duyệt:** 08/11/2026  
> **Trạng thái hệ thống:** `RELEASE_READY_PENDING_EDITORIAL_REVIEW` (DỪNG TẠI CỔNG KIỂM DUYỆT)  

---

## 1. NGUYÊN TẮC VÀ TUYÊN BỐ TRÁCH NHIỆM

Hội đồng Kỹ thuật và Đảm bảo Chất lượng ZhongWenHub ban hành quyết định phát hành này dựa trên **bằng chứng thực tế 100% từ cơ sở dữ liệu SQL Server, mã nguồn Backend ASP.NET Core, Frontend React 19 và kết quả chạy của 398 bài kiểm thử tự động**. 

Chúng tôi cam kết:
1. **Tuyệt đối không báo cáo khống:** Phản ánh đúng thực trạng nội dung từng bài học.
2. **Không tự động xuất bản (Force Publish):** Các bài học chưa qua rà soát con người được giữ nguyên ở trạng thái `DRAFT` để bảo vệ uy tín nền tảng và trải nghiệm của học viên.
3. **Bảo toàn dữ liệu người dùng:** Giữ nguyên vẹn 33 tài khoản người dùng thực tế, 10 ví tiền, 16 giao dịch, 10 gói dịch vụ và 11 bản ghi tiến độ học tập trên hệ thống.

---

## 2. BẢNG TỔNG HỢP CON SỐ PHÁT HÀNH CHÍNH THỨC

| Chỉ số phát hành | Số liệu chính thức | Tỷ lệ (%) | Ghi chú thẩm định |
|:---|:---:|:---:|:---|
| **Tổng số bài học HSK 1** | **15 bài** | 100% | Phân bổ trong 6 Units (Chương) |
| **Sẵn sàng về mặt Kỹ thuật** | **15 / 15 bài** | **100%** | Đầy đủ Schema CSDL, ID mapping, bài tập và 30 tệp MP3 |
| **Đạt chuẩn Sư phạm để Xuất bản ngay** | **3 / 15 bài** | **20%** | Bài 1, 2, 3 hoàn toàn sạch sẽ, không lỗi rập khuôn máy sinh |
| **Cần Biên tập viên hiệu đính trước khi duyệt** | **12 / 15 bài** | **80%** | Bài 4 đến 15 có 36 điểm câu mẫu bị lọt ký tự Hán thô |
| **Trạng thái thực tế trên Database** | **3 PUBLISHED / 12 DRAFT** | — | Đúng chuẩn an toàn phát hành |
| **Học viên học được ngay hôm nay** | **3 bài** (`les-1`, `les-2`, `les-3`) | — | Trải nghiệm trọn vẹn Flashcard, Ngữ pháp, Hội thoại, Audio, Bài tập, XP |
| **Tổng số Từ vựng chuẩn HSK 3.0** | **300 / 300 từ** | **100%** | Mỗi bài học gắn đúng 20 từ vựng |
| **Tổng số Điểm Ngữ pháp** | **72 / 72 điểm** | **100%** | 70 điểm chuẩn HSK 3.0 + 2 điểm mẫu câu giao tiếp |
| **Tổng số Bài tập tương tác** | **28 bài tập** | **100%** | Đã cấu hình câu hỏi, đáp án, điểm thưởng XP |
| **Tổng số Tệp Âm thanh thực tế trên Disk** | **30 / 30 tệp MP3** | **100%** | Đầy đủ 15 tệp Hội thoại + 15 tệp Luyện nghe |
| **Tỷ lệ kiểm thử tự động PASS** | **398 / 398 tests** | **100%** | Unit, Integration, Bun Frontend, Playwright E2E |

---

## 3. PHÁN QUYẾT PHÁT HÀNH CHO TỪNG BÀI HỌC

### Nhóm A: CHÍNH THỨC PHÁT HÀNH CÔNG KHAI (Trạng thái: `PUBLISHED`)
- **Bài 1 (`les-1`):** 你好 (Xin chào) — Đạt chuẩn xuất sắc. Hội thoại tự nhiên, phát âm chuẩn, bài tập đồng bộ.
- **Bài 2 (`les-2`):** 谢谢你 (Cảm ơn bạn) — Đạt chuẩn xuất sắc. Phản xạ đàm thoại tốt, cấu trúc ngữ pháp rõ ràng.
- **Bài 3 (`les-3`):** 你叫什么名字 (Bạn tên là gì?) — Đạt chuẩn xuất sắc. Hỏi tên và đại từ nghi vấn hoạt động hoàn hảo.

### Nhóm B: TẠM GIỮ TRẠNG THÁI BẢN NHÁP (Trạng thái: `DRAFT`)
- **Bài 4 đến Bài 15 (`les-4` đến `les-15`):** 
  - **Lý do kỹ thuật:** Về hạ tầng (ID, bài tập, audio, CSDL) đã hoàn tất 100%. Tuy nhiên, kết quả kiểm toán phát hiện **36 lỗi rập khuôn do thuật toán sinh chuỗi tự động**, để lọt các từ Hán như `住`, `请`, `呢`, `去`, `在`, `我们`, `老师`, `哥哥`, `面包` vào trường phiên âm Pinyin và bản dịch tiếng Việt.
  - **Phán quyết:** **NGHIÊM CẤM TỰ ĐỘNG BẬT PUBLISHED**. Phải để Biên tập viên có thẩm quyền vào CMS chỉnh sửa các câu thoại này theo quy trình SOP trước khi mở khóa cho học viên.

---

## 4. KẾ HOẠCH BÀN GIAO VÀ HƯỚNG DẪN HIỆU ĐÍNH CHO BIÊN TẬP VIÊN

Đội ngũ Kỹ thuật bàn giao danh sách 36 vị trí cần hiệu đính trên CMS cho bộ phận Quản trị Nội dung (`CONTENT_MANAGER`):
1. **Bài 4:** Sửa 3 câu hội thoại thay thế chữ `住`, `请`, `呢` bằng câu giao tiếp chỉ nơi ở và làm quen bạn bè thực tế.
2. **Bài 5:** Sửa câu dịch tiếng Việt có chữ `去`, `在`, `我们` thành câu tiếng Việt hoàn chỉnh về tuổi tác và gia đình.
3. **Bài 6:** Sửa câu có chữ `老师`, `哥哥` cho tự nhiên.
4. **Bài 7:** Sửa câu có chữ `面包`, `分` cho ngữ cảnh hỏi ngày tháng.
5. **Bài 8 – 15:** Hoàn thiện các câu hội thoại theo danh sách đã lập trong `HSK30_PHASE7_RELEASE_GATE_AUDIT.md`.

Sau khi biên tập viên cập nhật và kiểm tra âm thanh trực tiếp trên CMS, chỉ cần bấm nút **"Phê duyệt & Xuất bản"**, hệ thống sẽ tự động chuyển bài học sang `PUBLISHED` và học viên sẽ học được ngay lập tức mà không cần can thiệp mã nguồn hay khởi động lại máy chủ.

---

## 5. QUY TRÌNH TÁI SỬ DỤNG CHO HSK 2 – HSK 6 (REUSABILITY BLUEPRINT)

Kết quả của Phase 7 đã định hình một **Quy trình Phát hành Chuẩn 5 Bước** sẵn sàng áp dụng cho toàn bộ HSK 2, HSK 3, HSK 4, HSK 5 và HSK 6:

```
    BƯỚC 1: ĐỐI CHIẾU MA TRẬN ĐỀ CƯƠNG (Curriculum Matrix Audit)
    Đối chiếu danh mục từ vựng, ngữ pháp, Hán tự từ Đề cương Phase 2 vào CSDL SQL Server.
       │
       ▼
    BƯỚC 2: TỰ ĐỘNG HÓA KIỂM SOÁT LỖI MÁY SINH (Automated Anti-Artifact Filter)
    Chạy regex phát hiện rò rỉ ký tự Hán trong Pinyin và Tiếng Việt trước khi nạp vào DB.
       │
       ▼
    BƯỚC 3: KIỂM CHỨNG TỆP ÂM THANH VẬT LÝ (Physical Audio Verification)
    Tạo tệp âm thanh Neural TTS MP3 và kiểm tra dung lượng > 0 bytes trên thư mục lưu trữ.
       │
       ▼
    BƯỚC 4: HỒI QUY TOÀN BỘ BỘ TEST TỰ ĐỘNG (Full Regression Suite)
    Đảm bảo 100% Unit, Integration, Bun Frontend và Playwright E2E đều đạt PASS.
       │
       ▼
    BƯỚC 5: PHÊ DUYỆT BỞI BIÊN TẬP VIÊN (Human Editorial Sign-off)
    Biên tập viên xem trước (Preview) trên CMS, nhập Review Notes và ký duyệt phát hành.
```

---

## 6. LỆNH DỪNG THỰC THI (OFFICIAL STOP ORDER)

Nhiệm vụ Phase 7 chính thức hoàn thành toàn diện:
- **Hệ thống được chốt chặn an toàn tại trạng thái:** `RELEASE_READY_PENDING_EDITORIAL_REVIEW`.
- **Không thực hiện git push hay merge PR #16.**
- **Bàn giao toàn quyền quyết định xuất bản 12 bài còn lại cho Chủ dự án và Quản trị viên nội dung.**
