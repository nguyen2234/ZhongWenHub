# BÁO CÁO KIỂM TOÁN BÀI TẬP & ĐÁP ÁN HSK 1
## EXERCISE QUALITY, DISTRACTOR INTEGRITY & ANSWER KEY AUDIT

- **Cấp độ**: HSK 3.0 Level 1 (15 bài học, 6 Units)
- **Hồ sơ kiểm toán**: `data/hsk30/staging/hsk1_exercise_qa_manifest.json`
- **Tổng số bài tập kiểm toán**: 60 bài tập (28 bài hiện có trên Dev DB + 32 bài staging mới)
- **Phân loại**: Trắc nghiệm lựa chọn (`multiple-choice`), Đọc hiểu (`reading-comprehension`), Phản xạ ngữ pháp

---

## 1. TIÊU CHÍ KIỂM TOÁN CHẤT LƯỢNG BÀI TẬP

1. **Tính chân thực của phương án nhiễu (Meaningful Distractors)**: 
   - Tuyệt đối cấm các phương án giữ chỗ thô sơ như `"Nghĩa khác A"`, `"Nghĩa khác B"`, `"Nghĩa khác C"`, `"Lựa chọn khác"`.
   - Mọi phương án nhiễu phải là từ vựng/ngữ pháp tiếng Trung thực tế thuộc HSK 1 hoặc ngữ cảnh giao tiếp hợp lý.
2. **Tính chuẩn xác của chìa khóa đáp án (Answer Key Accuracy)**:
   - `CorrectOptionIndex` (0..3) phải trỏ chính xác đến phương án đúng.
   - Không có đáp án mơ hồ, gây tranh cãi hoặc có 2 đáp án cùng đúng.
3. **Chất lượng giải thích sư phạm (Pedagogical Explanations)**:
   - Giải thích chi tiết bằng tiếng Việt, phân tích vì sao đáp án đúng và vì sao các phương án khác chưa chính xác.
4. **Phần thưởng kinh nghiệm (XP Reward Compliance)**:
   - Thưởng XP từ 10–20 XP theo mức độ khó của câu hỏi, hỗ trợ tính lũy điểm chuẩn hóa.

---

## 2. KẾT QUẢ KIỂM TOÁN TỔNG HỢP

| Bộ dữ liệu bài tập | Tổng số | Hợp lệ (Valid) | Cảnh báo Placeholder | Tỷ lệ đạt chuẩn |
| :--- | :---: | :---: | :---: | :---: |
| **32 Bài tập Staging Mới (Phase 9.1B/9.1C)** | **32** | **32** | **0** | **100.0%** |
| **28 Bài tập Hiện có trên ZhongWenHub_Dev** | **28** | **14** | **14** | **50.0%** |
| **Tổng cộng 60 bài tập** | **60** | **46** | **14** | **76.7%** |

---

## 3. PHÁT HIỆN VẤN ĐỀ TRÊN DỮ LIỆU HIỆN CÓ CỦA DEV DB

Qua đối soát tự động 28 bài tập hiện tại trên `ZhongWenHub_Dev`, phát hiện **14 bài tập** (chủ yếu là bài tập luyện từ vựng của các bài học cũ) chứa phương án nhiễu giữ chỗ (placeholder distractors):
- **Ví dụ điển hình**: 
  - Bài tập ID `DF94D5E6-83B4-4C62-9E15-8F2D171D4F4A` (Bài 2: 谢谢你)
  - Options: `["Cảm ơn bạn", "Nghĩa khác A", "Nghĩa khác B", "Nghĩa khác C"]`
  - Các bài học khác bị ảnh hưởng: Lesson 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15.

### Kế hoạch khắc phục (Remediation Plan):
1. **Trước mắt**: 32 bài tập staging mới đã được biên soạn hoàn toàn không có placeholder, đáp án chuẩn xác và giải thích sư phạm rõ ràng.
2. **Kế hoạch nâng cấp Dev**: Trước khi xuất bản chính thức các bài học còn lại lên production, 14 bài tập placeholder này sẽ được cập nhật phương án nhiễu thực tế thông qua kịch bản migration có kiểm định.

---

## 4. CHI TIẾT 32 BÀI TẬP STAGING MỚI ĐÃ SẴN SÀNG

- **Dạng thức**: 100% trắc nghiệm 4 lựa chọn có kèm chữ Hán, Pinyin, nghĩa tiếng Việt.
- **Phân bổ**: Mỗi bài học có ít nhất 2 bài tập củng cố tương tác (tổng cộng 4 bài tập/bài học khi kết hợp).
- **Trạng thái**: Đã nạp thành công vào `ZhongWenHub_Test` và kiểm thử với người dùng học tập giả lập, đạt tỷ lệ chính xác đáp án 100%.
