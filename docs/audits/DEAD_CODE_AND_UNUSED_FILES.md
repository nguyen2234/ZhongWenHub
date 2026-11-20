# KIỂM KÊ MÃ NGUỒN VÀ TỆP TIN DƯ THỪA (DEAD CODE & UNUSED FILES AUDIT)
**Dự án:** ZhongWenHub  
**Thời điểm kiểm kê:** 19/11/2026  
**Mục tiêu:** Rà soát toàn bộ các tệp tin được Git theo dõi để phân loại tệp rác, code mồ côi, mock fixture rò rỉ, script thử nghiệm tạm thời và đề xuất phương án xử lý theo 4 mức: `KEEP`, `MOVE`, `DELETE CANDIDATE`, `UNKNOWN`.

---

## 1. NGUYÊN TẮC KIỂM TOÁN VÀ AN TOÀN
1. **Tuyệt đối KHÔNG xóa:**
   - Các tệp Entity Framework Migrations (`Backend/src/Data/Persistence/Migrations/*.cs`).
   - Dữ liệu giáo trình chuẩn HSK 1–4 trong `data/hsk20/` và `data/hsk30/`.
   - Các script import dữ liệu cốt lõi đang hoạt động (`scripts/hsk20/`).
   - Các tài liệu đồ án, quy ước và hướng dẫn cấu hình hệ thống.
2. **Tiêu chí đánh giá `DELETE CANDIDATE`:**
   - Không có bất kỳ lệnh `import` hoặc `require` nào trong mã nguồn production.
   - Không có tham chiếu trong file cấu hình (DI container, Vite config, package.json).
   - Không có bài kiểm thử (unit test, integration test, E2E) nào gọi tới.
   - Là tệp dữ liệu tạm, tệp dump one-off trong quá trình debug trước đây.

---

## 2. BẢNG KIỂM KÊ CHI TIẾT TỆP TIN VÀ COMPONENT

### 2.1. Frontend Components & Adapters
| Đường dẫn tệp | Kích thước | Vai trò dự kiến | Nơi tham chiếu hiện tại | Kết luận | Mức độ tin cậy | Ghi chú & Đề xuất |
| :--- | :---: | :--- | :--- | :---: | :---: | :--- |
| `Fontend/src/features/videos/components/SpeakingPracticeCard.tsx` | 8.2 KB | Thẻ luyện nói ghi âm câu phụ đề trong video cũ | **Không có bất kỳ file nào import** | **MOVE / DELETE CANDIDATE** | **Cao (99%)** | Mã cũ từ thời điểm video dùng mảng subtitle JSON. Trang học hiện tại đã đổi sang PDF transcript. Đề xuất: Lưu trữ vào `archive/` hoặc xóa. |
| `Fontend/src/features/videos/components/SynchronizedTranscript.tsx` | 14.5 KB | Khung hiển thị phụ đề song ngữ đồng bộ thời gian | **Không có bất kỳ file nào import** | **MOVE / DELETE CANDIDATE** | **Cao (99%)** | Tương tự component trên; không còn sử dụng trong luồng học video mới. |
| `Fontend/src/features/videos/adapters/Html5VideoAdapter.ts` | 4.1 KB | Trình phát video thẻ `<video>` HTML5 | Chỉ có `fe-7-interactive-video.test.ts` | **KEEP (Tạm thời)** | **Trung bình** | Luồng học video production hiện tại dùng YouTube iframe 100%. Giữ lại cho đến khi cập nhật bài test FE-7. |
| `Fontend/src/features/videos/adapters/PreviewVideoAdapter.ts` | 3.2 KB | Trình phát video giả lập đếm giờ | Chỉ có `fe-7-interactive-video.test.ts` | **KEEP (Tạm thời)** | **Trung bình** | Tương tự như trên. |
| `Fontend/src/features/videos/data/demoVideos.ts` | 18.4 KB | Dữ liệu video mẫu hardcode | `VideoDetailPage.tsx` (dòng 19), `fe-7-interactive-video.test.ts` | **MOVE** | **Cao (95%)** | Đang bị rò rỉ vào production component làm fallback. Đề xuất chuyển vào `Fontend/src/tests/fixtures/demoVideos.ts`. |

---

### 2.2. Frontend Services & Types Dư thừa
| Đường dẫn tệp | Kích thước | Vai trò dự kiến | Nơi tham chiếu hiện tại | Kết luận | Mức độ tin cậy | Ghi chú & Đề xuất |
| :--- | :---: | :--- | :--- | :---: | :---: | :--- |
| `Fontend/src/management/content-manager/services/video-management.service.ts` *(phần synchronous mock)* | ~8 KB (dòng 54–262, 628–751) | Mảng `INITIAL_VIDEOS` và các hàm CRUD trên RAM | Một số test cũ | **MOVE** | **Cao (100%)** | Tách phần mock này sang file riêng `tests/fixtures/video-management.mock.ts` để làm sạch production service. |
| `Fontend/src/types/api/video.dto.ts` | 1.8 KB | DTO video kiểu cũ | Trùng lặp với `video.types.ts` | **DELETE CANDIDATE** | **Cao (90%)** | Cần gom về một nguồn chân lý (Single Source of Truth) trong `video.types.ts`. |

---

### 2.3. Scripts Debug & Tệp Dump tạm thời (Root / Scripts)
Trong quá trình nạp và đối chiếu HSK 3.0 ở các giai đoạn trước, một lượng lớn script Python one-off được tạo ra để trích xuất dữ liệu thô:

| Thư mục / Tệp tin | Số lượng tệp | Kích thước ước tính | Vai trò ban đầu | Nơi tham chiếu | Kết luận | Đề xuất xử lý |
| :--- | :---: | :---: | :--- | :--- | :---: | :--- |
| `scripts/hsk30/dump_*.py` (ví dụ: `dump_l11_raw.py`, `dump_lesson_words.py`, `dump_hsk2_dev_vocab.py`) | 12 files | ~60 KB | Script in dữ liệu màn hình terminal để kiểm tra thô | Không có CI/Runtime nào gọi | **DELETE CANDIDATE** | Các script này đã hoàn thành nhiệm vụ lịch sử; có thể dọn dẹp để làm gọn repo. |
| `scripts/hsk30/find_*.py` (`find_traps.py`, `find_test_fail.py`) | 4 files | ~25 KB | Script dò lỗi bài tập kiểm thử HSK 3.0 | Không có | **DELETE CANDIDATE** | Đã khắc phục xong dữ liệu; không còn dùng trong CI. |
| `scripts/snapshots/` (`hsk1_lessons_1_to_3_v1_snapshot.json`) | 1 file | 120 KB | Snapshot sao lưu trạng thái bài học 1–3 giai đoạn đầu | Không có runtime gọi | **MOVE / ARCHIVE** | Chuyển vào thư mục lưu trữ `backups/snapshots/` nếu cần giữ làm bằng chứng đồ án. |
| `scripts/hsk20/` (`import_hsk20_vocab_grammar.py`, `validate_hsk20_data.py`) | 14 files | ~180 KB | Bộ công cụ nạp và kiểm chuẩn giáo trình chuẩn 70 bài học | Được dùng khi cần re-seed dữ liệu | **KEEP** | Giữ nguyên vì đây là công cụ vận hành nạp dữ liệu chuẩn. |

---

### 2.4. Thư mục Hệ thống Hợp tác AI Cũ (`.ai-collaboration/`)
* **Tổng số tệp:** 81 tệp JSON, markdown và schema (`.ai-collaboration/tasks/`, `.ai-collaboration/results/`, `.ai-collaboration/qa/`).
* **Tổng dung lượng:** ~2.4 MB.
* **Nơi tham chiếu:**
  - `.github/workflows/ai-bridge-validate.yml`
  - `.github/workflows/bridge-qa-gate.yml`
* **Đánh giá:** Đây là nhật ký và bằng chứng tương tác của hệ thống AI Bridge ở các sprint trước.
* **Kết luận:** **KEEP**. Không xóa các file này vì đang được các GitHub Actions workflow kiểm tra tính toàn vẹn (schema validation). Nếu muốn dọn dẹp, cần cập nhật CI/CD trước.

---

### 2.5. Tệp Hình ảnh Chưa Tối ưu (Frontend Untracked Images)
* **Vị trí:** `Fontend/public/images/dashboard/`
  - `"Phong cảnh mây núi hoa anh đào pastel-3.png"` (1.8 MB)
  - `"Phong cảnh sơn thủy hoa anh đào mộng mơ-1.png"` (2.1 MB)
  - `"Thung lũng sương mai dưới hoa anh đào-2.png"` (1.9 MB)
* **Hiện trạng:** Các tệp PNG dung lượng lớn với tên tiếng Việt có dấu, sinh ra trong quá trình thiết kế UI. Trong code hiện tại đã chuyển sang dùng bản nén `hero-landscape.webp` và `sidebar-landscape.webp`.
* **Kết luận:** **DELETE CANDIDATE** (không add vào Git để tránh làm phình to lịch sử repository).

---

## 3. TỔNG HỢP VÀ KẾ HOẠCH DỌN DẸP AN TOÀN

1. **Tổng số tệp đề xuất xóa hoặc chuyển vị trí (Wave 4):**
   - 2 Frontend components mồ côi (`SpeakingPracticeCard.tsx`, `SynchronizedTranscript.tsx`).
   - 1 DTO trùng lặp (`video.dto.ts`).
   - ~16 scripts Python debug one-off trong `scripts/hsk30/`.
   - 3 ảnh PNG dung lượng nặng chưa tối ưu trong `Fontend/public/images/dashboard/`.
2. **Quy tắc an toàn:**
   - Việc xóa hoặc di chuyển các tệp trên **chỉ được tiến hành ở Wave 4** sau khi Wave 1 (Bảo mật/P1) và Wave 2 (Chức năng/P2) đã hoàn thành và được kiểm thử hồi quy 100% thành công.
