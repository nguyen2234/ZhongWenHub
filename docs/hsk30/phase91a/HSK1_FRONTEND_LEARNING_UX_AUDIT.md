# BÁO CÁO KIỂM TOÁN TRẢI NGHIỆM HỌC TẬP FRONTEND (REACT / TYPESCRIPT)
## HSK1_FRONTEND_LEARNING_UX_AUDIT.md

**Dự án:** ZhongWenHub  
**Đối tượng kiểm toán:** Mã nguồn React 19 / TypeScript trong `Fontend/src/features/lesson/`  
**Thời điểm thực hiện:** 09/11/2026  

---

## 1. CÁC MÀN HÌNH VÀ THÀNH PHẦN ĐÃ KIỂM TOÁN

Nhóm Frontend QA Engineer đã rà soát toàn bộ các thành phần điều khiển luồng học tập:
1. [`LessonExperience.tsx`](file:///D:/ZhongWenHub/Fontend/src/features/lesson/LessonExperience.tsx): Shell chính quản lý trạng thái bài học, điều hướng các bước học (Step Navigation).
2. [`LessonHeader.tsx`](file:///D:/ZhongWenHub/Fontend/src/features/lesson/components/LessonHeader.tsx) & [`LessonProgress.tsx`](file:///D:/ZhongWenHub/Fontend/src/features/lesson/components/LessonProgress.tsx): Thanh hiển thị tiến trình, nút thoát an toàn và điểm kinh nghiệm (XP).
3. [`LessonTableOfContents.tsx`](file:///D:/ZhongWenHub/Fontend/src/features/lesson/components/LessonTableOfContents.tsx): Mục lục điều hướng nhanh các học phần trong bài.
4. [`lesson-content.service.ts`](file:///D:/ZhongWenHub/Fontend/src/features/lesson/services/lesson-content.service.ts): Tầng kết nối REST API gọi `GET /api/v1/content/lessons/{lessonId}`.
5. [`lesson-player.adapter.ts`](file:///D:/ZhongWenHub/Fontend/src/features/lesson/adapters/lesson-player.adapter.ts): Bộ chuyển đổi dữ liệu DTO từ Backend SQL Server sang định dạng giao diện người dùng.

---

## 2. KẾT QUẢ ĐÁNH GIÁ 10 TIÊU CHÍ TRẢI NGHIỆM (UX/UI CRITERIA)

| Tiêu chí | Kết quả | Chi tiết đánh giá |
| :--- | :---: | :--- |
| **1. Hiển thị dữ liệu backend** | **PASS** | Adapter ánh xạ chính xác `TitleZh`, `TitleVi`, `Pinyin`, `Summary` từ database. |
| **2. Hiển thị Pinyin có dấu** | **PASS** | Phông chữ hỗ trợ Unicode hoàn hảo, hiển thị rõ ràng các thanh điệu (ā, á, ǎ, à, ü). |
| **3. Font chữ Hán (Hanzi)** | **PASS** | CSS khai báo các font chuẩn Hán ngữ (`PingFang SC`, `Microsoft YaHei`, `Noto Sans SC`), không bị lỗi ô vuông tofu. |
| **4. Nút nghe phát âm** | **PASS** | Có nút icon loa tại từng lượt thoại và từng câu trắc nghiệm nghe. |
| **5. Cơ chế phát Audio** | **PASS** | Audio HTML5 phát tốt các tệp MP3 tĩnh từ `/audio/hsk1/...`. |
| **6. Render bài tập trắc nghiệm** | **PASS** | Giao diện hiển thị 4 lựa chọn trực quan, hỗ trợ bấm chọn và phím tắt. |
| **7. Phản hồi đúng/sai** | **PASS** | Có màu sắc phân biệt (xanh lá cây = Đúng, đỏ = Sai) kèm hiển thị ngay lập tức phần giải thích sư phạm (`Explanation`). |
| **8. Xử lý dữ liệu rỗng** | **PASS** | Có màn hình Loading Spinner và Empty State khi bài học không tìm thấy. |
| **9. Xử lý lỗi API (Error Boundary)** | **PASS** | Hiển thị thông báo thân thiện khi gặp lỗi mạng, không làm trắng màn hình. |
| **10. Mức độ thân thiện cho người mới** | **PASS** | Bố cục tối giản, phân chia thành các bước nhỏ (micro-learning) không gây quá tải. |

---

## 3. PHÁT HIỆN KỸ THUẬT VÀ KHUYẾN NGHỊ CHO PHASE 9.1B

1. **Vấn đề fallback mock data:**  
   Trong `lesson-content.service.ts:16-35`, hàm `getLessonDetail` đang có logic fallback về `MOCK_LESSON_8_DRAFT` nếu `lessonId === 'les-8'`. Cần loại bỏ hoàn toàn các chuỗi mock cứng này, đảm bảo 100% bài học truy xuất trực tiếp từ API backend với GUID thực tế.
2. **Xử lý quyền xem bài DRAFT:**  
   Đối với học viên chưa đăng nhập hoặc có role `STUDENT`, Backend chỉ trả về các bài học có trạng thái `PUBLISHED` (hiện tại là Bài 1, 2, 3). Các bài từ 4 đến 15 sẽ trả về 404 cho đến khi được duyệt xuất bản chính thức ở Phase 9.1B/9.2. Đây là hành vi đúng chuẩn của Release Gate.
