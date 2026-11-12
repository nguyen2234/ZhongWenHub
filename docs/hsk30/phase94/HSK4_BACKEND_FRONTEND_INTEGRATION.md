# BÁO CÁO TÍCH HỢP TOÀN DIỆN BACKEND — FRONTEND HSK 4

## I. ĐỒNG BỘ DTO VÀ CONTRACT GIỮA HAI TẦNG

1. **Mô hình DTO**:
   - Backend ASP.NET Core .NET 10 định nghĩa các DTO chuẩn: `LessonDetailDto`, `LessonVocabularyDto`, `LessonExerciseDto`, `ApiProblemDetailsDto`.
   - Frontend TypeScript (`Fontend/src/types/lesson-content.types.ts`) đồng bộ chuẩn xác kiểu dữ liệu, bao gồm `LessonReadingPassageDTO` hỗ trợ các trường linh hoạt `status` và `integrationStrategy`.
2. **Zero-Schema Reading Passages Integration**:
   - Frontend `hsk-textbook.service.ts` tích hợp module `HSK4_READING_PASSAGES`, tự động kết nối bài đọc hiểu với các bài học kết thúc Unit (L4, L8, L12, L16, L20).
3. **Trình điều khiển Âm thanh**:
   - Hỗ trợ phát đa nguồn: URL tệp âm thanh tĩnh `/audio/hsk4/*.mp3` với bộ lọc lỗi tự động chuyển sang Web Speech API khi gặp sự cố mạng.
