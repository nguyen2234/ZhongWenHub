# HỒ SƠ PHÊ DUYỆT HỌC LIỆU HSK 2 CỦA CHUYÊN GIA (MASTER CONTENT HUMAN REVIEW MANIFEST)

> **Mục tiêu:** Bàn giao bộ dữ liệu tập trung toàn bộ thành phần học liệu HSK 2 để Hội đồng Chuyên gia Ngôn ngữ & Sư phạm thẩm định trước khi xuất bản chính thức.  
> **Tệp dữ liệu:** `data/hsk30/staging/hsk2_content_human_review_manifest.json`  
> **Trạng thái thẩm định:** `PENDING_HUMAN_EXPERT_SIGN_OFF`  
> **Chữ ký số kỹ thuật:** `NEEDS_HUMAN_REVIEW` (Tuyệt đối không giả mạo chữ ký người thật)  

---

## 1. THỐNG KÊ DANH MỤC THẨM ĐỊNH

Tệp manifest tổng thể quy tụ đầy đủ **373 thành phần học liệu** của HSK 2:

```json
{
  "curriculum": "HSK 3.0 Standard Curriculum",
  "hskLevel": 2,
  "phase": "9.2",
  "reviewStatus": "PENDING_HUMAN_EXPERT_SIGN_OFF",
  "statistics": {
    "totalUnits": 5,
    "totalLessons": 15,
    "totalVocabularies": 200,
    "vocabulariesWithExamples": 200,
    "totalGrammarPoints": 78,
    "totalExercises": 60,
    "exercisesPerLesson": 4,
    "totalReadingPassages": 5,
    "totalAudioFiles": 30,
    "totalCurriculumComponents": 373
  }
}
```

---

## 2. QUY TRÌNH THẨM ĐỊNH DÀNH CHO CHUYÊN GIA (HUMAN REVIEW GUIDELINES)

Hội đồng thẩm định bao gồm 2 vai trò bắt buộc:
1. **Senior Chinese Linguistic Expert (Chuyên gia Ngôn ngữ Trung Quốc):**
   - Rà soát tính tự nhiên của 200 câu ví dụ từ vựng.
   - Thẩm định độ chuẩn xác của biến điệu thanh điệu (一, 不, khinh thanh) trong trường `pinyin`.
   - Kiểm tra các từ đa nghĩa (`过` trong Bài 1 vs Bài 15; `花` trong Bài 8 vs Bài 9).
   - Đọc thẩm âm 30 file âm thanh MP3 để đảm bảo khẩu âm tiếng Phổ thông tiêu chuẩn.
2. **Chinese-Vietnamese Curriculum Lead (Trưởng bộ môn Giáo trình Trung-Việt):**
   - Đánh giá tính sư phạm của 78 giải thích ngữ pháp.
   - Kiểm duyệt 60 câu hỏi bài tập và tính phân hóa của các phương án gây nhiễu (distractors).
   - Thẩm định 5 bài đọc hiểu và sự tương thích về văn hóa giao tiếp trong đời sống.

---

## 3. BIỂU MẪU KÝ DUYỆT NGHIỆM THU (SIGN-OFF FORM)

> *Biểu mẫu này dành riêng cho chuyên gia con người thực tế điền và ký xác nhận.*

| Vai trò thẩm định | Họ và tên chuyên gia | Cơ quan / Đơn vị | Ngày thẩm định | Ý kiến kết luận | Chữ ký xác nhận |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Chuyên gia Ngôn ngữ Tiếng Trung** | *(Chờ chuyên gia)* | .................... | .../.../2026 | [ ] Phê duyệt<br>[ ] Yêu cầu chỉnh sửa | .................... |
| **Trưởng Bộ môn Giáo trình HSK** | *(Chờ chuyên gia)* | .................... | .../.../2026 | [ ] Phê duyệt<br>[ ] Yêu cầu chỉnh sửa | .................... |
| **Release & Data Architect** | *(Chờ kỹ sư trưởng)* | .................... | .../.../2026 | [ ] Phê duyệt<br>[ ] Yêu cầu chỉnh sửa | .................... |

**Trạng thái hệ thống tự động ghi nhận:**  
`SIGNATURE_STATUS: PENDING_HUMAN_EXPERT_SIGN_OFF`
