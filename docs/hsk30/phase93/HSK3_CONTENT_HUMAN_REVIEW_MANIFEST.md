# TÀI LIỆU HƯỚNG DẪN KIỂM DUYỆT HỌC THUẬT (HUMAN REVIEW MANIFEST)

## I. MỤC ĐÍCH & Ý NGHĨA

Tài liệu này và tệp manifest tương ứng (`data/hsk30/staging/hsk3_content_human_review_manifest.json`) được tạo ra nhằm cung cấp cho hội đồng chuyên môn / chuyên gia ngôn ngữ học một bản kiểm kê toàn diện và duy nhất để thực hiện nghiệm thu học thuật trước khi chính thức phát hành HSK 3 lên môi trường Production / Dev.

---

## II. BẢNG TỔNG KẾT CÁC CẤU PHẦN CẦN THẨM ĐỊNH (721 CẤU PHẦN)

| Nhóm cấu phần | Số lượng | Tình trạng kỹ thuật | Trạng thái phê duyệt học thuật |
| :--- | :---: | :---: | :---: |
| **Từ vựng có câu ví dụ** | 500 từ | Đạt (100% có câu ví dụ, Pinyin, nghĩa) | `NEEDS_HUMAN_REVIEW` |
| **Điểm ngữ pháp** | 96 điểm | Đạt (Có công thức, phân loại, giải thích) | `NEEDS_HUMAN_REVIEW` |
| **Bài tập trắc nghiệm** | 80 bài | Đạt (4 lựa chọn, đáp án cân đối, có giải thích) | `NEEDS_HUMAN_REVIEW` |
| **Bài đọc hiểu Unit** | 5 bài | Đạt (50-75 chữ, 2 câu hỏi/bài) | `NEEDS_HUMAN_REVIEW` |
| **Tệp âm thanh MP3** | 40 tệp | Đạt (Hiện hữu trên đĩa, HTTP 200) | `NEEDS_HUMAN_REVIEW` |
| **TỔNG CỘNG** | **721 cấu phần** | **HOÀN THÀNH KỸ THUẬT** | **`PENDING_HUMAN_EXPERT_SIGN_OFF`** |

---

## III. NGUYÊN TẮC MINH BẠCH VỀ CHỮ KÝ VÀ NGHIỆM THU

1. **Tuyệt đối không có chữ ký giả lập**: Hệ thống ghi nhận rõ ràng hiện tại là bước hoàn thiện kỹ thuật và kiểm định tự động (`AI_ASSISTED_VERIFIED`). Chữ ký phê duyệt học thuật chính thức phải do chuyên gia ngôn ngữ con người (Human Chinese Language Specialist) kiểm duyệt độc lập và ký biên bản.
2. **Quy trình ký duyệt**:
   - Chuyên gia tải về tệp `data/hsk30/staging/hsk3_content_human_review_manifest.json`.
   - Đối chiếu ngẫu nhiên tối thiểu 20% cấu phần (hoặc toàn bộ) với chuẩn sư phạm.
   - Khi hoàn tất, chuyên gia cập nhật trường `releaseStatus` thành `APPROVED_FOR_PRODUCTION` kèm chữ ký số / định danh chuyên gia.
