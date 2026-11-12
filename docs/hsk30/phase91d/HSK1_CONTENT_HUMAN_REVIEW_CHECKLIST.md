# BẢN KIỂM ĐỊNH NỘI DUNG VÀ DANH MỤC CHỜ KÝ DUYỆT HSK 1 (CONTENT HUMAN REVIEW CHECKLIST)

**Dự án:** ZhongWenHub  
**Cấp độ giáo trình:** HSK 3.0 — Level 1 (Sơ cấp 1)  
**Tập dữ liệu Master Manifest:** `data/hsk30/staging/hsk1_content_human_review_manifest.json` (Mã băm SHA-256: `a0945fed42353c528e85f965bc02019e81d6a92e1c4a4b6b726c92b764e9290d`)  
**Đối tượng bàn giao:** Hội đồng Học thuật, Chuyên gia Giảng dạy Tiếng Trung & Trưởng nhóm Nội dung (Content Lead)  
**Trạng thái hiện tại:** `TECHNICALLY_READY_AWAITING_HUMAN_APPROVAL`  

---

## 1. NGUYÊN TẮC VÀ QUY TRÌNH THẨM ĐỊNH CON NGƯỜI

Hệ thống kỹ thuật của ZhongWenHub tuân thủ nguyên tắc: **Không tự động xuất bản (NO AUTO-PUBLISH)** đối với học liệu khi chưa có chữ ký số hoặc văn bản phê duyệt của chuyên gia con người.

Quy trình thẩm định gồm 4 bước:
1. **Kiểm tra ma trận học liệu:** Đối chiếu số lượng và danh mục học liệu theo tiêu chuẩn GF 0025-2021.
2. **Kiểm tra mẫu sư phạm (Pedagogical Sampling):** Rà soát ngữ nghĩa, tính chuẩn mực của ngữ cảnh hội thoại và câu hỏi đọc hiểu.
3. **Phê duyệt hoặc yêu cầu chỉnh sửa (Sign-off or Revision):** Chuyên gia ghi nhận nhận xét trực tiếp vào file checklist.
4. **Kích hoạt phát hành (Release Gate Unlock):** Sau khi có phê duyệt, bộ phận vận hành tiến hành chạy script phát hành chính thức lên cơ sở dữ liệu Development/Production.

---

## 2. BẢNG DANH MỤC HỌC LIỆU CẦN THẨM ĐỊNH

### A. Từ vựng HSK 1 (300 từ vựng)
- **Tổng số từ vựng:** 300 từ (phân bổ 20 từ/bài trong 15 bài học).
- **Trạng thái AI thẩm định:** 298 từ vựng đạt chất lượng cao (`LINGUISTICALLY_REVIEWED_AI`).
- **2 từ vựng cần lưu ý đặc biệt:**
  1. Từ **唱** (hát) — Câu ví dụ `她唱歌唱得很好听。` có chứa trợ từ `得`.
     * [ ] Phê duyệt giữ nguyên ví dụ (xem như ngữ cố định).
     * [ ] Đổi thành câu đơn giản hơn: `她喜欢唱歌。` (Tā xǐhuan chànggē).
  2. Từ **对** (đúng) — Câu ví dụ `你说得很对。` có chứa trợ từ `得`.
     * [ ] Phê duyệt giữ nguyên ví dụ.
     * [ ] Đổi thành câu: `这个答案是对的。` (Zhège dá'àn shì duì de).

### B. Ngữ pháp HSK 1 (72 điểm ngữ pháp)
- **Tổng số điểm ngữ pháp:** 72 điểm (`GR30-HSK1-001` đến `GR30-HSK1-072`).
- **Nội dung kiểm định:** 
  + 100% có công thức cấu trúc (`StructureFormula`).
  + 100% có giải thích tiếng Việt ngắn gọn, dễ hiểu.
  + 100% có câu ví dụ thực tế.
- **Ý kiến chuyên gia:**
  * [ ] Phê duyệt toàn bộ 72 điểm ngữ pháp.
  * [ ] Đóng góp chỉnh sửa (Ghi chú cụ thể): ________________________________________

### C. Bài tập củng cố (60 bài tập)
- **Phân bổ:** 4 bài tập / bài học $\times$ 15 bài học = 60 bài tập.
  + 14 bài tập cũ đã sửa sạch các phương án placeholder (thay bằng từ vựng HSK 1 chuẩn).
  + 14 bài tập cũ đạt chuẩn.
  + 32 bài tập mới bổ sung nhằm hoàn thiện đủ định ngạch 4 bài/bài học.
- **Ý kiến chuyên gia:**
  * [ ] Phê duyệt danh mục 60 bài tập củng cố.
  * [ ] Đóng góp chỉnh sửa: _____________________________________________________

### D. Bài đọc hiểu đoạn văn (6 bài đọc hiểu)
- **Vị trí xuất hiện:** Cuối mỗi Unit (Bài 2, 4, 7, 10, 13, 15).
- **Nội dung kiểm định:**
  1. Lesson 2: *你好，朋友！* (Chào bạn nhé! — 32 chữ).
  2. Lesson 4: *我的汉语老师* (Thầy giáo tiếng Trung của tôi — 30 chữ).
  3. Lesson 7: *星期天的一天* (Một ngày chủ nhật — 32 chữ).
  4. Lesson 10: *去北京看朋友* (Đi Bắc Kinh thăm bạn — 31 chữ).
  5. Lesson 13: *学校附近* (Khu vực quanh trường học — 33 chữ).
  6. Lesson 15: *坐飞机来中国* (Đi máy bay đến Trung Quốc — 30 chữ).
- **Ý kiến chuyên gia:**
  * [ ] Phê duyệt 6 bài đọc hiểu và hệ thống câu hỏi trắc nghiệm tương ứng.

### E. File âm thanh nghe & hội thoại (30 file MP3)
- **Nội dung:** 15 file hội thoại + 15 file luyện nghe.
- **Chất lượng:** Giọng đọc AI TTS chuẩn âm phổ thông Bắc Kinh, tốc độ 0.85x – 0.95x.
- **Ý kiến chuyên gia:**
  * [ ] Tạm thời sử dụng bộ âm thanh AI TTS để phục vụ phát hành thử nghiệm.
  * [ ] Lên kế hoạch thu âm diễn viên bản xứ trong phiên bản tiếp theo.

---

## 3. PHẦN KÝ DUYỆT BÀN GIAO (SIGN-OFF SECTION)

| Vai trò | Họ và tên | Chữ ký thẩm định | Ngày ký | Kết luận (APPROVED / REJECTED) |
| :--- | :--- | :--- | :--- | :--- |
| **Senior Chinese Curriculum Specialist** | ____________________ | ________________ | ___/___/2026 | [ ] APPROVED &nbsp; [ ] REJECTED |
| **Chinese–Vietnamese Linguistic QA Lead** | ____________________ | ________________ | ___/___/2026 | [ ] APPROVED &nbsp; [ ] REJECTED |
| **Educational Assessment Lead** | ____________________ | ________________ | ___/___/2026 | [ ] APPROVED &nbsp; [ ] REJECTED |
| **Product & Release Manager** | ____________________ | ________________ | ___/___/2026 | [ ] APPROVED &nbsp; [ ] REJECTED |

> [!IMPORTANT]
> Sau khi có ít nhất 2 chữ ký phê duyệt từ Chuyên gia Giáo trình và Trưởng nhóm Ngôn ngữ học, Trưởng nhóm Phát hành mới được phép thực thi lệnh chuyển trạng thái của 12 bài học từ `DRAFT` sang `PUBLISHED` trên database Dev theo [HSK1_DEV_DEPLOYMENT_RUNBOOK.md](file:///d:/ZhongWenHub/docs/hsk30/phase91d/HSK1_DEV_DEPLOYMENT_RUNBOOK.md).
