# BÁO CÁO KIỂM TOÁN CHẤT LƯỢNG 300 TỪ VỰNG HSK 1
## HSK1_VOCABULARY_QA.md

**Dự án:** ZhongWenHub  
**Đối tượng kiểm toán:** 300 bản ghi từ vựng HSK 1 trong bảng `vocabularies`  
**Phương pháp:** Kiểm tra tự động bằng Python script kết hợp phân tích đối chiếu ngôn ngữ Hán - Việt  
**Thời điểm thực hiện:** 09/11/2026  

---

## 1. BẢNG PHÂN LOẠI CHỈ SỐ TỪ VỰNG

| Chỉ số kiểm tra | Số lượng | Tỷ lệ (%) | Đánh giá học thuật |
| :--- | :---: | :---: | :--- |
| **Tổng số bản ghi HSK 1** | 300 | 100.0% | Đầy đủ theo phân bổ 15 bài học |
| **Số chữ Hán duy nhất** | 300 | 100.0% | Không có từ trùng lặp trong nội bộ HSK 1 |
| **Pinyin có dấu thanh hợp lệ** | 295 | 98.3% | Chuẩn ngữ âm bính âm quốc tế |
| **Từ mang thanh nhẹ (Neutral tone)** | 5 | 1.7% | 合法 (de, le, ma, ne, ba - đúng quy tắc ngữ âm) |
| **Dịch nghĩa tiếng Việt tự nhiên** | 300 | 100.0% | Sát nghĩa, không dùng nghĩa Hán-Việt cổ lỗ |
| **Phân loại từ loại (PartOfSpeech)** | 300 | 100.0% | Danh từ, Động từ, Tính từ, Phó từ, Đại từ, v.v. |
| **Có câu ví dụ trong DB (`ExamplesJson`)** | 9 | 3.0% | **THIẾU** (291 từ cần bổ sung ở Phase 9.1B) |
| **Có liên kết AudioUrl trực tiếp** | 0 | 0.0% | **THIẾU** (Frontend dùng TTS Runtime) |
| **Đã gán LessonId hợp lệ** | 300 | 100.0% | 18–23 từ / bài học |

---

## 2. PHÂN BỔ TỪ VỰNG THEO 15 BÀI HỌC

| Bài học | Tên bài | Số từ vựng | Danh sách từ vựng tiêu biểu | Trạng thái ví dụ trong DB |
| :---: | :--- | :---: | :--- | :---: |
| **Bài 1** | 你好 | 23 từ | 大家, 还, 吗, 睡觉, 好, 没关系... | 3/23 có ví dụ |
| **Bài 2** | 谢谢你 | 23 từ | 不客气, 对不起, 问, 有的, 时间, 喝... | 3/23 có ví dụ |
| **Bài 3** | 你叫什么名字 | 22 từ | 小学生, 电视, 一些, 不, 明天, 什么... | 3/22 có ví dụ |
| **Bài 4** | 他是我的汉语老师 | 19 từ | 住, 请, 太, 一半, 火车, 本... | 0/19 có ví dụ |
| **Bài 5** | 我想喝茶 | 19 từ | 呢, 去, 事, 冷, 不要, 星期... | 0/19 có ví dụ |
| **Bài 6** | 你在做什么呢 | 20 từ | 在, 我们, 去年, 东西, 给, 几... | 0/20 có ví dụ |
| **Bài 7** | 今天星期几 | 20 từ | 老师, 哥哥, 读书, 你好, 出租车, 口... | 0/20 có ví dụ |
| **Bài 8** | 明天天气怎么样 | 20 từ | 面包, 分, 女朋友, 学生, 昨天, 能... | 0/20 có ví dụ |
| **Bài 9** | 现在几点 | 19 từ | 是, 分钟, 那个, 牛奶, 苹果, 谁... | 0/19 có ví dụ |
| **Bài 10** | 我星期一去北京 | 18 từ | 的, 飞机, 那些, 店, 中国, 晚... | 0/18 có ví dụ |
| **Bài 11** | 这个苹果多少钱 | 19 từ | 看, 猫, 今天, 儿子, 上班, 新... | 0/19 có ví dụ |
| **Bài 12** | 你去哪儿买东西 | 20 từ | 今年, 起床, 开车, 家, 看病, 衣服... | 0/20 có ví dụ |
| **Bài 13** | 他在学校前面 | 20 từ | 汉字, 医生, 早, 中文, 唱, 他... | 0/20 có ví dụ |
| **Bài 14** | 你会开车吗 | 19 từ | 大学, 好玩儿, 下午, 车, 都, 商店... | 0/19 có ví dụ |
| **Bài 15** | 我是坐飞机来的 | 19 từ | 后, 忙, 有些, 里, 喂, 公司... | 0/19 có ví dụ |

---

## 3. PHÂN TÍCH HIỆN TƯỢNG ĐA NGHĨA VÀ TỪ ĐỒNG TỰ (POLYSEMOUS WORDS)

Trong danh mục 300 từ của HSK 1, có các từ xuất hiện ở cấp độ cao hơn với từ loại khác:
1. `会` (huì): HSK 1 dạy nét nghĩa **Động từ năng nguyện: Biết làm gì qua học tập** (ví dụ: *我会开车*). Sang HSK 3 xuất hiện với nét nghĩa Danh từ: Cuộc họp (*开会*).
2. `只`: HSK 1 dạy nét nghĩa **Lượng từ: Con, chiếc** (phát âm `zhī`, ví dụ: *一只猫*). Sang HSK 3 xuất hiện với nét nghĩa Phó từ: Chỉ, chỉ có (phát âm `zhǐ`).
3. `喂`: HSK 1 dạy nét nghĩa **Thán từ nghe điện thoại** (phát âm `wéi` / `wèi`).

> [!NOTE]
> Nhóm QA xác nhận các từ này đã được phân định rạch ròi về từ loại và cách phát âm ngay trong nội dung HSK 1, không gây nhầm lẫn cho người mới học.

---

## 4. DANH MỤC LỖI VÀ ĐỀ XUẤT CHỈNH SỬA CHO PHASE 9.1B

1. **[P1 — High] Bổ sung câu ví dụ cho 291 từ vựng:**
   - Hiện tại chỉ có 9 từ có `ExamplesJson` trong database.
   - Cần bổ sung ví dụ song ngữ (Chữ Hán + Pinyin + Dịch tiếng Việt) có độ dài ngắn gọn (5–8 chữ), dùng chính các từ vựng đã học trong HSK 1.
2. **[P2 — Medium] Chuẩn hóa liên kết phát âm:**
   - Cột `AudioUrl` trong bảng `vocabularies` đang để NULL.
   - Frontend hiện phát âm qua SpeechSynthesis API. Ở Phase 9.1B, nên cấu hình liên kết âm thanh tĩnh hoặc chỉ định rõ nguồn TTS chuẩn giọng Bắc Kinh.
