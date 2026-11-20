# BÁO CÁO HỒ SƠ DUYỆT NỘI DUNG & RELEASE GATE HSK 1
## HSK 1 CONTENT REVIEW MANIFEST & RELEASE GATE WORKFLOW

- **Cấp độ**: HSK 3.0 Level 1 (15 Bài học)
- **Hồ sơ dữ liệu**: `data/hsk30/staging/hsk1_content_review_manifest.json`
- **Phiên bản**: 1.0 (Phase 9.1C)
- **Ranh giới an toàn**: Không tự động chuyển đổi trạng thái `PUBLISHED` cho 12 bài học DRAFT

---

## 1. QUY TRÌNH CHUYỂN ĐỔI TRẠNG THÁI PHÁT HÀNH (RELEASE GATE WORKFLOW)

Hệ thống quản lý nội dung học liệu áp dụng quy trình kiểm định 3 bước nghiêm ngặt:

```
[DRAFT]  --->  [PENDING_REVIEW]  --->  [PUBLISHED]
(Mặc định)    (Đã nạp đủ dữ liệu     (Có phê duyệt học thuật
              & kiểm định kỹ thuật)    của chuyên gia con người)
```

1. **DRAFT**: Trạng thái cơ bản của bài học đang biên soạn hoặc chưa hoàn thiện nội dung. Bài học ẩn hoàn toàn đối với học viên thông thường.
2. **PENDING_REVIEW**: Bài học đã được tích hợp đầy đủ từ vựng (kèm ví dụ), điểm ngữ pháp, bài tập đạt chuẩn không chứa placeholder, file âm thanh MP3 và bài đọc hiểu cuối Unit. Đã vượt qua kiểm định tự động bằng AI.
3. **PUBLISHED**: Bài học đã được hội đồng chuyên môn giáo trình con người thẩm định, ký duyệt và kích hoạt qua Release Gate backend API.

---

## 2. TỔNG HỢP TRẠNG THÁI 15 BÀI HỌC HSK 1

| Bài học | Tiêu đề bài học | Trạng thái Dev | Trạng thái Kỹ thuật | Phân loại Sư phạm | Trạng thái Release Gate |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **Lesson 1** | 你好 *(Xin chào)* | `PUBLISHED` | `READY` | `LINGUISTICALLY_REVIEWED_AI` | **CURRENTLY_PUBLISHED_DEV** |
| **Lesson 2** | 谢谢你 *(Cảm ơn bạn)* | `PUBLISHED` | `READY` | `LINGUISTICALLY_REVIEWED_AI` | **CURRENTLY_PUBLISHED_DEV** |
| **Lesson 3** | 你叫什么名字 *(Bạn tên là gì)* | `PUBLISHED` | `READY` | `LINGUISTICALLY_REVIEWED_AI` | **CURRENTLY_PUBLISHED_DEV** |
| **Lesson 4** | 他是我的汉语老师 *(Thầy ấy là thầy giáo tiếng Trung của tôi)* | `DRAFT` | `READY` | `LINGUISTICALLY_REVIEWED_AI` | **TECHNICALLY_READY_AWAITING_HUMAN_APPROVAL** |
| **Lesson 5** | 她女儿今年二十岁 *(Con gái cô ấy năm nay 20 tuổi)* | `DRAFT` | `READY` | `LINGUISTICALLY_REVIEWED_AI` | **TECHNICALLY_READY_AWAITING_HUMAN_APPROVAL** |
| **Lesson 6** | 我会说汉语 *(Tôi biết nói tiếng Trung)* | `DRAFT` | `READY` | `LINGUISTICALLY_REVIEWED_AI` | **TECHNICALLY_READY_AWAITING_HUMAN_APPROVAL** |
| **Lesson 7** | 今天几号 *(Hôm nay ngày mấy)* | `DRAFT` | `READY` | `LINGUISTICALLY_REVIEWED_AI` | **TECHNICALLY_READY_AWAITING_HUMAN_APPROVAL** |
| **Lesson 8** | 我想喝茶 *(Tôi muốn uống trà)* | `DRAFT` | `READY` | `NEEDS_HUMAN_REVIEW` | **BLOCKED_AWAITING_HUMAN_REVIEW** |
| **Lesson 9** | 你儿子在哪儿工作 *(Con trai bạn làm việc ở đâu)* | `DRAFT` | `READY` | `LINGUISTICALLY_REVIEWED_AI` | **TECHNICALLY_READY_AWAITING_HUMAN_APPROVAL** |
| **Lesson 10** | 我能坐这儿吗 *(Tôi có thể ngồi đây không)* | `DRAFT` | `READY` | `LINGUISTICALLY_REVIEWED_AI` | **TECHNICALLY_READY_AWAITING_HUMAN_APPROVAL** |
| **Lesson 11** | 现在几点 *(Bây giờ mấy giờ)* | `DRAFT` | `READY` | `LINGUISTICALLY_REVIEWED_AI` | **TECHNICALLY_READY_AWAITING_HUMAN_APPROVAL** |
| **Lesson 12** | 明天天资怎么样 *(Ngày mai thời tiết thế nào)* | `DRAFT` | `READY` | `LINGUISTICALLY_REVIEWED_AI` | **TECHNICALLY_READY_AWAITING_HUMAN_APPROVAL** |
| **Lesson 13** | 他在学做中国菜呢 *(Anh ấy đang học nấu món ăn Trung Quốc)* | `DRAFT` | `READY` | `LINGUISTICALLY_REVIEWED_AI` | **TECHNICALLY_READY_AWAITING_HUMAN_APPROVAL** |
| **Lesson 14** | 她买了不少衣服 *(Cô ấy mua không ít quần áo)* | `DRAFT` | `READY` | `LINGUISTICALLY_REVIEWED_AI` | **TECHNICALLY_READY_AWAITING_HUMAN_APPROVAL** |
| **Lesson 15** | 我是坐飞机来的 *(Tôi đi máy bay đến)* | `DRAFT` | `READY` | `LINGUISTICALLY_REVIEWED_AI` | **TECHNICALLY_READY_AWAITING_HUMAN_APPROVAL** |

---

## 3. ĐIỀU KIỆN MỞ KHÓA (UNBLOCKING CRITERIA)

- **Lesson 8 (Chặn phê duyệt chuyên gia)**:
  - Cần chuyên gia ngôn ngữ xem xét và phê duyệt cách giải thích trợ từ kết cấu "得" và bài tập phân biệt trợ từ trước khi chuyển sang `PENDING_REVIEW`.
- **Lessons 4–7, 9–15 (Sẵn sàng kỹ thuật)**:
  - Dữ liệu ví dụ, bài tập và bài đọc hiểu đã được kiểm định trên `ZhongWenHub_Test`.
  - Chờ quyết định chính thức từ Quản lý sản phẩm (Product Manager) và Chuyên gia giáo trình để kích hoạt chuyển đổi trạng thái đồng loạt sang `PUBLISHED`.
