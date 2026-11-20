# ZHONGWENHUB — BÁO CÁO THU THẬP & XÁC THỰC TÀI LIỆU NGUỒN HSK 2.0
## HSK STANDARD COURSE (HSK 1–4B) SOURCE ACQUISITION & INTEGRITY REPORT

- **Dự án:** ZhongWenHub
- **Nhiệm vụ:** ZWH-HSK20-MIGRATION-AND-SOURCES (Issue #19)
- **Branch:** `integration/zhongwenhub-sqlserver`
- **Commit:** `2fdf52253029cd2319733dd57062b840d080ce9c`
- **Nguồn cung cấp:** Baúl Chino (https://www.baulchino.com/libros-hsk & https://www.baulchino.com/hsk-audios-download)
- **Thư mục lưu trữ nội bộ:** `D:\ZhongWenHub\resources\hsk-standard-course-2.0\`
- **Trạng thái Git:** 100% tài liệu được cấu hình trong `.gitignore` (Không commit tài liệu có bản quyền vào repository)
- **Cơ sở dữ liệu:** Tuyệt đối 0 thao tác ghi (ZhongWenHub_Dev và ZhongWenHub_Test nguyên vẹn)

---

## I. QUYẾT ĐỊNH CHÍNH THỨC & CẤU TRÚC HỌC LIỆU

ZhongWenHub chính thức chuyển định hướng nội dung đào tạo giảng dạy HSK 1–4 sang bộ giáo trình **HSK Standard Course 2.0**.

### Cấu trúc 4 cấp độ chính thức trên toàn hệ thống:
- **HSK 1:** 15 bài học.
- **HSK 2:** 15 bài học.
- **HSK 3:** 20 bài học.
- **HSK 4:** 20 bài học (Tích hợp trọn vẹn cả 2 tập 4A và 4B của nhà xuất bản vào đúng 1 cấp độ duy nhất).
- **HSK 5 & HSK 6:** Giữ trạng thái **Sắp ra mắt (Coming Soon)**, không có bài giảng chính thức.

> [!IMPORTANT]
> **BẢO TOÀN NGUYÊN TẮC KIẾN TRÚC:**
> Tuyệt đối **KHÔNG** tạo cấp độ `HSK 4A` và `HSK 4B` độc lập trên Website, API hay Cơ sở dữ liệu. Việc phân chia 4A và 4B hoàn toàn chỉ là cách đóng quyển của Nhà xuất bản Giáo dục Ngôn ngữ Bắc Kinh. Toàn bộ tài liệu 4A (Bài 1–10) và 4B (Bài 11–20) được lưu trữ tập trung dưới thư mục `HSK4` và ánh xạ thành một khóa học HSK 4 duy nhất gồm 20 bài học liên tục.

---

## II. TỔNG KẾT TÀI LIỆU ĐÃ TẢI VỀ & KIỂM TRA TÍNH TOÀN VẸN

- **Tổng số tài liệu:** 21 / 21 files (100% hoàn thành)
- **Tổng dung lượng:** 1281.63 MB (~1.25 GB)
- **Tỷ lệ hợp lệ:** 21 / 21 files (100% PASS kiểm tra chữ ký Magic-Bytes và cấu trúc lưu trữ ZIP)
- **Tệp thất bại:** 0 files

### Bảng kiểm kê chi tiết 21 tài liệu nguồn:

| Cấp độ | Phân loại | Tên tệp lưu trữ | Tên tệp gốc / URL | Dung lượng | SHA-256 Checksum | Tính toàn vẹn |
|:---:|:---|:---|:---|:---:|:---|:---:|
| **HSK1** | Textbook | `HSK-1-Textbook.pdf` | `HSK-1-Textbook.pdf` | 51.02 MB | `6aa9f346a90042b0ff988fe53fe63b3fc9ccb23a0d3846c40811a023b36cec70` | **PASS** |
| **HSK1** | Workbook | `HSK-1-Workbook.pdf` | `HSK-1-Workbook.pdf` | 28.67 MB | `96a06bfd7d328bf560f9763444b70784b1c6d961d2f0707890b6bc9bad46c251` | **PASS** |
| **HSK1** | Answers | `hsk1-workbook-answers.pdf` | `hsk1-workbook-answers.pdf` | 6.22 MB | `557c7d27630a1de541cb2a009edcdd3c04e7a0c6947e2505fea2b967e03cbfd7` | **PASS** |
| **HSK1** | Audio | `hsk1textbookaudios.zip` | `hsk1textbookaudios.zip` | 29.93 MB | `af009b926ace51be17e41dad93862c780cf5f3665c172bdca50a2da8e4e79387` | **PASS** |
| **HSK1** | Audio | `hsk1workbookaudios.zip` | `hsk1workbookaudios.zip` | 95.27 MB | `fce74d330bb3d327928a0c760e80152348bc7fce3d88bdbbff7751c35ea096b9` | **PASS** |
| **HSK2** | Textbook | `HSK-2-Textbook.pdf` | `HSK-2-Textbook.pdf` | 52.88 MB | `2ab36d8e8a172bdfef6e0f038badcc1ca9a16dc48254e2bb040b43259d43fbbd` | **PASS** |
| **HSK2** | Workbook | `HSK-2-Workbook.pdf` | `HSK-2-Workbook.pdf` | 14.40 MB | `f64019813b1f0d1b45b68692581b7de844ef8a91db761dc02c654bbe873d0e99` | **PASS** |
| **HSK2** | Audio | `hsk2textbookaudios.zip` | `hsk2textbookaudios.zip` | 31.86 MB | `1472f7f2fa5cf25dd8e10528b9caae6d8d65cad867e851ce893483f090945bb4` | **PASS** |
| **HSK2** | Audio | `hsk2workbookaudios.zip` | `hsk2workbookaudios.zip` | 122.19 MB | `e932973d03dd7061599e292f7220bdc56f8c6d118488737207193e28b60c66d9` | **PASS** |
| **HSK3** | Textbook | `HSK-3-Textbook.pdf` | `HSK-3-Textbook.pdf` | 85.11 MB | `bd9e2c0648d38f16675ccc59b424197cc4dccc1e57a0daab088b87e618175f01` | **PASS** |
| **HSK3** | Workbook | `HSK-3-Workbook.pdf` | `HSK-3-Workbook.pdf` | 40.14 MB | `37ea4dcdc389c4c5ceb0ceb44dcb9c36df4b1c8d024ac5fb58d1f85ff77927f1` | **PASS** |
| **HSK3** | Audio | `hsk3textbookaudios.zip` | `hsk3textbookaudios.zip` | 65.56 MB | `9204480eec424ce441f703a997ede0acafcf6c5f24d69805494001985291ccfc` | **PASS** |
| **HSK3** | Audio | `hsk3workbookaudios.zip` | `hsk3workbookaudios.zip` | 220.99 MB | `d13fefaf1e9ce30b27644bbb1199e86aec333c85e5c04ef73d4d10b802bd4766` | **PASS** |
| **HSK4** | Textbook | `HSK4A.pdf` | `HSK-4A-Textbook.pdf` | 72.63 MB | `92b1a4542f05c98883829c403dc8152fe51af216e1cc9ba23a697a78c8599457` | **PASS** |
| **HSK4** | Workbook | `HSK4A.pdf` | `HSK-4A-Workbook.pdf` | 17.73 MB | `84191f7a22184348629be82df4cf817064a1332b073d9d292e9ced36ebe5bef6` | **PASS** |
| **HSK4** | Textbook | `HSK4B.pdf` | `HSK-4B-Textbook.pdf` | 61.87 MB | `253fac2cd3e59465449475ba956e83074dbde53bb363d32b8d0e69e8eec287c0` | **PASS** |
| **HSK4** | Workbook | `HSK4B.pdf` | `HSK-4B-Workbook.pdf` | 34.19 MB | `4a6be72c330949114b3f393170b0c4b022e5776cab84f0edd7be39c4fb0899d6` | **PASS** |
| **HSK4** | Audio | `hsk4Atextbookaudios.zip` | `hsk4Atextbookaudios.zip` | 41.97 MB | `972a627dda0988f5bd4518a36388bfbe455264252531526e9bd61a5f6769c2fe` | **PASS** |
| **HSK4** | Audio | `hsk4Aworkbookaudios.zip` | `hsk4Aworkbookaudios.zip` | 65.36 MB | `c4ff0b4cad9337a1df4f5942702d5e7c6e4599d72aa37b89f985b53bd6ae1c2a` | **PASS** |
| **HSK4** | Audio | `hsk4Btextbookaudios.zip` | `hsk4Btextbookaudios.zip` | 56.13 MB | `f61fc7454f6616f328c04edbcfd2b526507391547f68b56d6fd9b1041bcc9ab3` | **PASS** |
| **HSK4** | Audio | `hsk4Bworkbookaudios.zip` | `hsk4Bworkbookaudios.zip` | 87.52 MB | `cc7b3209ff63bdb7d2c4370d6ee4e450d3f845066fa138a58b2f023e2294e682` | **PASS** |

---

## III. CÔNG CỤ TẢI MỘT CLICK (ONE-CLICK LAUNCHER)

Đã xây dựng bộ công cụ tự động hóa hoàn chỉnh cho môi trường Windows:
1. **`scripts/hsk_sources/Download-HSK-All.bat`:** Tệp Batch cho phép người dùng chỉ cần nhấp đúp chuột để kích hoạt toàn bộ tiến trình tải và kiểm thử.
2. **`scripts/hsk_sources/Download-HSK-All.ps1`:** Script PowerShell thực thi với các tiêu chuẩn kỹ thuật nâng cao:
   - **Pre-flight Manifest Check:** Đọc danh mục và hiển thị bảng kiểm tra trước khi tải.
   - **Single User Confirmation:** Xin xác nhận duy nhất 1 lần trước khi tải hàng loạt.
   - **Concurrency Control:** Điều phối tối đa 3 luồng tải đồng thời.
   - **HTTP Range Resume:** Tự động bắt đầu tải tiếp từ byte đã nhận dở dang nếu kết nối mạng gián đoạn.
   - **Retry & Exponential Backoff:** Tự động thử lại 3 lần với thời gian chờ tăng dần.
   - **Atomic Verification:** Tải vào tệp `.tmp`, kiểm tra chữ ký định dạng (`%PDF-` cho PDF, `PK\x03\x04` & kiểm tra cấu trúc lưu trữ cho ZIP) và chỉ đổi tên sang tệp chính thức khi vượt qua kiểm tra toàn vẹn.
   - **Idempotency:** Kiểm tra tệp đã tồn tại và tính hợp lệ để bỏ qua tải trùng (thời gian quét lại 21 files chỉ mất 7.27 giây).
   - **Audit Logs:** Tự động xuất tệp `download_manifest_executed.json` và `DOWNLOAD_SUMMARY.md` vào thư mục `reports/`.

---

## IV. BẢN QUYỀN & CHÍNH SÁCH BẢO VỆ MÃ NGUỒN

1. **Không commit tài liệu có bản quyền vào Git:**
   - File `.gitignore` đã được cấu hình chặt chẽ để loại trừ hoàn toàn thư mục `resources/` cũng như tất cả các tệp `*.pdf`, `*.zip`, `*.rar`, `*.7z`.
   - Git status xác nhận 100% không có tệp PDF hay ZIP nào bị theo dõi hoặc đẩy lên GitHub.
2. **Phạm vi sử dụng:**
   - Tài liệu tải về chỉ phục vụ cho việc đối chiếu sư phạm, kiểm tra cấu trúc từ vựng, ngữ pháp và chuẩn bị kịch bản ánh xạ dữ liệu nội bộ.
   - Không tự ý công bố hoặc phân phối thương mại nội dung nguyên văn khi chưa có thỏa thuận cấp phép.

---

## V. KẾT LUẬN

- **Hoàn tất 100% việc thu thập và kiểm tra tính toàn vẹn của 21 tệp tài liệu HSK 1–4B.**
- **Công cụ một click đã sẵn sàng, vận hành ổn định và có thể tái sử dụng bất kỳ lúc nào.**
- **Hệ sinh thái ZhongWenHub sẵn sàng cho bước lập kế hoạch chuyển đổi học liệu sang HSK 2.0.**