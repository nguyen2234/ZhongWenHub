# BÁO CÁO KHẮC PHỤC TRIỆT ĐỂ 14 BÀI TẬP PLACEHOLDER HSK 1

**Dự án:** ZhongWenHub  
**Đối tượng:** 14 bài tập HSK 1 có phương án lựa chọn giữ chỗ (placeholder) hoặc thiếu đáp án  
**Tập dữ liệu khắc phục:** `data/hsk30/staging/hsk1_existing_exercise_fixes.json` (SHA-256: `0a61599da5c86126c20dc7b35d067a799786f1cbcd6d1da407fbf9f8bbff8184`)  
**Script thực thi:** `scripts/hsk30/apply_exercise_fixes_to_test.py`  
**Môi trường áp dụng:** `ZhongWenHub_Test`  
**Trạng thái kiểm tra sau áp dụng:** **100% ĐÃ KHẮC PHỤC (0 placeholder còn lại)**  

---

## 1. BỐI CẢNH VÀ NGUYÊN NHÂN LỖI

Trong đợt kiểm toán học liệu Phase 9.1A và Phase 9.1B, nhóm kiểm định đã phát hiện 14 bài tập trong số 28 bài tập ban đầu của HSK 1 gặp khiếm khuyết sư phạm nghiêm trọng:
1. **13 bài tập trắc nghiệm nghĩa từ vựng** (rải rác từ Lesson 2 đến Lesson 15) sử dụng mẫu phương án giả lập dạng:
   ```json
   ["<Nghĩa đúng>", "Nghĩa khác A", "Nghĩa khác B", "Nghĩa khác C"]
   ```
   Điều này khiến bài tập mất tính phân loại học thuật và không thể đưa vào sử dụng thực tế.
2. **1 bài tập điền từ ở Lesson 3** (`24381C58-31D5-4CB4-8F97-720872CA9534`): Trường `OptionsJson` bị rỗng (`[]`) và `CorrectOptionIndex` bị gán giá trị `null`, khiến hệ thống client không thể dựng câu hỏi và học viên không thể hoàn thành bài tập.

---

## 2. NGUYÊN TẮC THIẾT KẾ PHƯƠNG ÁN NHIỄU (DISTRACTORS)

1. **Chuẩn mực từ vựng HSK 1:** Toàn bộ các đáp án gây nhiễu đều được lấy từ 300 từ vựng tiêu chuẩn HSK 3.0 (GF 0025-2021). Tuyệt đối không đưa từ vựng vượt cấp (HSK 2-6) vào làm học viên mới bắt đầu bị hoang mang.
2. **Tính phân loại sư phạm cao:**
   - Đối với bài tập hỏi nghĩa: Chọn các từ cùng từ loại (danh từ chọn danh từ khác, đại từ chọn đại từ khác) hoặc các từ dễ nhầm lẫn trong giao tiếp cơ bản (ví dụ: `xin chào` đối chiếu với `tạm biệt`, `cảm ơn`, `xin lỗi`).
   - Đối với bài tập điền từ vào chỗ trống: Chọn các đại từ nghi vấn quen thuộc (`gì / shénme`, `ai / shéi`, `ở đâu / nǎr`, `mấy / jǐ`) để học viên rèn luyện tư duy ngữ pháp.
3. **Giải thích chi tiết (Explanation):** Mỗi bài tập đều có câu giải thích bằng tiếng Việt nêu rõ vì sao đáp án đúng, đồng thời chỉ ra nghĩa của các từ phương án khác để hỗ trợ người học ôn tập chéo.

---

## 3. BẢNG CHI TIẾT 14 BÀI TẬP ĐÃ KHẮC PHỤC

| STT | Bài | Tiêu đề bài tập | Đề bài | Phương án mới (Options) | Đúng (Index) | Giải thích sư phạm |
| :---: | :---: | :--- | :--- | :--- | :---: | :--- |
| 1 | 2 | Chọn nghĩa của từ 再见 | Chọn nghĩa đúng của từ 再见 | `["tạm biệt", "xin chào", "cảm ơn", "xin lỗi"]` | 0 | Từ "再见" (zàijiàn) có nghĩa là tạm biệt. "Xin chào" là 你好, "cảm ơn" là 谢谢. |
| 2 | 3 | Điền từ hỏi tên | 你叫______名字？ | `["什么 (gì)", "谁 (ai)", "哪儿 (ở đâu)", "几 (mấy)"]` | 0 | Để hỏi tên người hoặc vật dùng đại từ nghi vấn "什么" (shénme): 你叫什么名字？ |
| 3 | 4 | Chọn nghĩa của từ 老师 | Chọn nghĩa đúng của từ 老师 | `["thầy cô giáo", "học sinh", "bạn bè", "bác sĩ"]` | 0 | "老师" (lǎoshī) nghĩa là giáo viên, thầy cô giáo. "Học sinh" là 学生, "bác sĩ" là 医生. |
| 4 | 5 | Chọn nghĩa của từ 喝 | Chọn nghĩa đúng của từ 喝 | `["uống", "ăn", "nghe", "nhìn"]` | 0 | "喝" (hē) là động từ chỉ hành động uống. "Ăn" là 吃, "nghe" là 听, "nhìn" là 看. |
| 5 | 6 | Chọn nghĩa của từ 做 | Chọn nghĩa đúng của từ 做 | `["làm", "ngồi", "mua", "đi"]` | 0 | "做" (zuò) là động từ có nghĩa là làm, tạo ra. "Ngồi" là 坐, "mua" là 买. |
| 6 | 7 | Chọn nghĩa của từ 星期 | Chọn nghĩa đúng của từ 星期 | `["tuần, thứ", "tháng", "năm", "ngày"]` | 0 | "星期" (xīngqī) nghĩa là tuần hoặc thứ trong tuần. "Tháng" là 月, "năm" là 年. |
| 7 | 8 | Chọn nghĩa của từ 天气 | Chọn nghĩa đúng của từ 天气 | `["thời tiết", "mưa", "nóng", "lạnh"]` | 0 | "天气" (tiānqì) là danh từ chỉ thời tiết tổng quát. "Lạnh" là 冷, "nóng" là 热. |
| 8 | 9 | Chọn nghĩa của từ 几 | Chọn nghĩa đúng của từ 几 | `["mấy (số lượng ít)", "bao nhiêu (lớn)", "cái gì", "ở đâu"]` | 0 | "几" (jǐ) là từ nghi vấn hỏi số lượng thường dưới 10 (mấy). "Bao nhiêu" là 多少. |
| 9 | 10 | Chọn nghĩa của từ 坐 | Chọn nghĩa đúng của từ 坐 | `["ngồi, đi (xe)", "đứng", "chạy", "ngủ"]` | 0 | "坐" (zuò) nghĩa là ngồi hoặc đi bằng một phương tiện (như ngồi xe, ngồi tàu). |
| 10 | 11 | Chọn nghĩa của từ 钱 | Chọn nghĩa đúng của từ 钱 | `["tiền", "sách", "nước", "quần áo"]` | 0 | "钱" (qián) nghĩa là tiền tệ. "Sách" là 书, "quần áo" là 衣服. |
| 11 | 12 | Chọn nghĩa của từ 哪儿 | Chọn nghĩa đúng của từ 哪儿 | `["ở đâu", "cái này", "cái kia", "ở đây"]` | 0 | "哪儿" (nǎr) là đại từ nghi vấn dùng để hỏi địa điểm, phương hướng (ở đâu). |
| 12 | 13 | Chọn nghĩa của từ 前面 | Chọn nghĩa đúng của từ 前面 | `["phía trước", "phía sau", "bên trong", "bên trên"]` | 0 | "前面" (qiánmiàn) là phương vị từ chỉ phía trước. "Phía sau" là 后面, "bên trong" là 里面. |
| 13 | 14 | Chọn nghĩa của từ 会 | Chọn nghĩa đúng của từ 会 | `["biết (qua học hỏi)", "muốn", "thích", "đi"]` | 0 | "会" (huì) là trợ động từ chỉ kỹ năng biết làm việc gì đó qua học tập, rèn luyện. |
| 14 | 15 | Chọn nghĩa của từ 认识 | Chọn nghĩa đúng của từ 认识 | `["quen biết, nhận biết", "học tập", "nói chuyện", "lắng nghe"]` | 0 | "认识" (rènshi) nghĩa là quen biết hoặc nhận biết một người hay một sự vật. |

---

## 4. KẾT QUẢ KIỂM THỬ TRÊN TEST DB

- **Mã băm dữ liệu (Payload SHA-256):** `0a61599da5c86126c20dc7b35d067a799786f1cbcd6d1da407fbf9f8bbff8184`.
- **Kết quả thực thi:** Cập nhật thành công 14/14 bản ghi trên `ZhongWenHub_Test`.
- **Kiểm tra tính lũy đẳng (Idempotency):** Chạy lại lần 2 thông báo `0 exercises updated, 14 already patched`.
- **Truy vấn xác thực SQL:**
  ```sql
  SELECT COUNT(*) FROM exercises 
  WHERE HskLevel = 1 AND OptionsJson LIKE '%Nghĩa khác%';
  -- Trả về: 0
  ```
- **Kết luận:** 100% bài tập trắc nghiệm HSK 1 đã sẵn sàng về mặt sư phạm và nội dung.
