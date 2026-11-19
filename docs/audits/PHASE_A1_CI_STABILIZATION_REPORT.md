# BÁO CÁO ỔN ĐỊNH HÓA CI & KẾ HOẠCH TRIỂN KHAI PHASE B (PHASE A.1 REPORT)
**Tài liệu:** `docs/audits/PHASE_A1_CI_STABILIZATION_REPORT.md`  
**Ngày thực hiện:** 19/11/2026  
**Nhánh thực hiện:** `fix/phase-a1-ci-stabilization` ➔ Đồng bộ sang `feature/teacher-core-phase1`  
**Commit cơ sở:** `d5656a9ffc64e68b7c7416c52c6dcd8a3809cf74`  
**PR liên quan:** [#20](https://github.com/nguyen2234/ZhongWenHub/pull/20) (`DRAFT`, `MERGEABLE: true`)  
**Người thực hiện:** Senior Full-stack Engineer & QA Automation Engineer  

---

## I. NGUYÊN NHÂN GỐC RỄ LỖI FRONTEND CI (ROOT CAUSE ANALYSIS)

### 1. Triệu chứng tại GitHub Actions Run 44515935020:
```
teacher-portal.service.ts:558 for (const c of data)
TypeError: {} is not iterable
at getMyEnrolledClasses -> getActiveClassIdsForStudentAsync -> getAssignmentsForStudent
406 pass, 0 fail, 1 error; exit 1
```

### 2. Ba nguyên nhân kỹ thuật tương tác gây ra lỗi:
1. **Các file kiểm thử chạy ngoài vòng đời Bun (`runTests()` unmanaged):**
   * Có 4 file kiểm thử (`integration-foundation.test.ts`, `ai-tutor-workspace.test.ts`, `ai-workspace.test.ts`, `student-runner.test.ts`) thực thi hàm async `runTests()` ở phạm vi module root (top-level) thay vì khai báo các ca kiểm thử bằng `describe()` / `it()` / `test()`.
   * Khi Bun quét các file kiểm thử, các promise này chạy song song, không đồng bộ và không được `await`, làm rò rỉ trạng thái xác thực (`authTokenService.setSession(...)`) và mock mạng sang các worker khác.
2. **Ghi đè `globalThis.fetch` không được dọn dẹp sau khi chạy (`Leaked Mock Fetch`):**
   * Trong `video-library-integration.test.ts` (dòng 201), bài test cuối cùng gán `globalThis.fetch = mockFetch` trả về `{ items: [...] }` nhưng file **hoàn toàn thiếu hook `afterEach` hoặc `afterAll` để khôi phục `originalFetch`**.
   * Khi `integration-foundation.test.ts` gọi `studentHomeworkService.getMyAssignments('usr-st-01')`, service gọi `getActiveClassIdsForStudentAsync()`. Do có token rò rỉ, service gọi `getMyEnrolledClasses()` tới endpoint `/teacher/my-enrolled-classes`. Mock fetch rò rỉ trả về object `{ items: [...] }` với HTTP status 200 thay vì một mảng `StudentEnrolledClassDTO[]`.
3. **Thiếu Schema Validation tại API Response:**
   * Trong `teacher-portal.service.ts`, sau khi nhận `res.json()`, code giả định ngay kết quả là mảng có thể lặp (`for (const c of data)`), dẫn tới crash runtime với `TypeError: {} is not iterable`.

---

## II. DANH SÁCH FILE ĐÃ THAY ĐỔI & GIẢI PHÁP SỬA ĐỔI

| File | Giải pháp kỹ thuật đã áp dụng |
|:---|:---|
| `Fontend/src/management/teacher/services/teacher-portal.service.ts` | **Bổ sung Schema Validation:** Kiểm tra `Array.isArray(data)` tại `getMyEnrolledClasses()` và kiểm tra object hợp lệ tại `getMyEnrolledClassById()`. Nếu server hoặc mock trả sai contract, ném `Error` rõ ràng; tuyệt đối không nuốt lỗi hay trả về `[]` giả. |
| `Fontend/src/tests/video-library-integration.test.ts` | **Dọn dẹp mock toàn diện:** Bổ sung `afterEach` và `afterAll` khôi phục `globalThis.fetch = originalFetch`. |
| `Fontend/src/tests/integration-foundation.test.ts` | **Refactor toàn bộ sang Bun Test Suite:** Chuyển toàn bộ 12 ca kiểm thử độc lập thành `describe` / `it`, bổ sung `beforeEach`, `afterEach`, `afterAll` cô lập `authTokenService.clearTokens()`, khôi phục fetch và reset demo student identity. |
| `Fontend/src/tests/student-runner.test.ts` | **Refactor toàn bộ sang Bun Test Suite:** Chuyển 25 assertions thành 7 `it()` blocks có `expect()`, cô lập token và cache lớp học. |
| `Fontend/src/tests/ai-tutor-workspace.test.ts` | **Refactor sang Bun Test Suite:** Chuyển 33 assertions thành 9 `it()` blocks, cô lập token và khôi phục fetch sau bài test sửa câu / giải thích lỗi. |
| `Fontend/src/tests/ai-workspace.test.ts` | **Refactor sang Bun Test Suite:** Chuyển 25 assertions thành 13 `it()` blocks, cô lập token và provider mock. |
| `Fontend/src/management/teacher/data/mockAssignmentData.ts` | Cập nhật `dueDate` của `asgn-002` thành ngày tương lai (`2028-12-31`) để tránh hết hạn làm bài sai lệch trong mock test suite. |
| `Fontend/src/tests/teacher-class-management.test.ts` | Bổ sung ca kiểm thử **Test 26** xác minh: Server trả HTTP 200 nhưng sai schema mảng thì ném lỗi contract fail-closed. |
| `docs/audits/FULL_SYSTEM_FUNCTIONAL_INVENTORY.md` | Hiệu chỉnh phân loại: Tách rõ `RUNTIME_VERIFIED` khỏi `API_WIRED`, loại bỏ nhãn chủ quan. |
| `docs/audits/FE_BE_API_CONTRACT_MATRIX.md` | Cập nhật ma trận đối chiếu 70 routes với tình trạng kiểm thử runtime thực tế. |

---

## III. KẾT QUẢ KIỂM THỬ THỰC TẾ (TEST VERIFICATION RESULTS)

### 1. Bộ kiểm thử Frontend (`bun test src/tests`):
Chạy thành công **3 lần liên tiếp** toàn bộ 51 test files:
* **Lần 1:** 456 pass, 0 fail (4,973 expect calls, thời gian: 9.98s).
* **Lần 2:** 456 pass, 0 fail (4,973 expect calls, thời gian: 6.54s).
* **Lần 3:** 456 pass, 0 fail (4,973 expect calls, thời gian: 6.60s).
* **Kết luận:** 100% deterministic, không còn unhandled rejection, không phụ thuộc thứ tự chạy test file.

### 2. Frontend Linter & Build:
* `bun run lint` (oxlint): **0 errors** (155 warnings được phân tích chi tiết ở Mục IV).
* `tsc -b && vite build`: Thành công trong **1.60s** (0 lỗi TypeScript).

### 3. Bộ kiểm thử Backend (.NET 10 Unit Tests):
* Lệnh: `dotnet test Backend/tests/ZhongWenHub.UnitTests/ZhongWenHub.UnitTests.csproj`
* Kết quả: **Passed: 328, Failed: 0, Skipped: 0, Total: 328 (100% PASS)**.

---

## IV. RÀ SOÁT CÁC CẢNH BÁO (155 OXLINT WARNINGS TRIAGE)

Phân tích chi tiết 155 warnings từ oxlint:
1. **`react(set-state-in-effect)` (85 cảnh báo):**
   * Xảy ra khi gọi `setState` đồng bộ trong `useEffect` (ví dụ `loadData()`, `setError(null)` khi mở modal, hoặc đồng bộ props tìm kiếm vào state nội bộ).
   * *Đánh giá rủi ro runtime:* Thấp. Đây là khuyến cáo tối ưu của React Compiler để tránh re-render xếp tầng (cascading renders). Không gây crash ứng dụng.
2. **`react-hooks(exhaustive-deps)` (29 cảnh báo):**
   * Bổ sung hoặc lược bớt dependency array của `useMemo`/`useCallback`. Đã được kiểm tra an toàn theo ngữ cảnh component.
3. **`react(only-export-components)` (17 cảnh báo):**
   * Quy tắc Fast Refresh của Vite khi export thêm interface/constant cùng file với component. Hoàn toàn an toàn ở production build.
4. **`eslint(no-unused-vars)` (9 cảnh báo):**
   * Tham số hoặc biến chưa dùng trong một số file test và E2E spec.
5. **Khác (15 cảnh báo):**
   * `react(purity)` (7), `react(preserve-manual-memoization)` (3), `react(immutability)` (2), `eslint(no-useless-escape)` (2), `react(refs)` (1).
* **Quyết định:** Giữ nguyên cấu trúc giao diện để tránh gây regressing layout trong đợt này, lên kế hoạch refactor sạch ở Phase E.

---

## V. KẾ HOẠCH TRIỂN KHAI CHI TIẾT PHASE B (ROADMAP)

Triển khai tuần tự theo từng nhóm độc lập, không triển khai đồng loạt:

### B1: Video Learning Fail-Closed & Loại bỏ Mock Fallback
* **Mục tiêu:** Xử lý triệt để lỗi P1 nuốt exception trong `video-learning.service.ts` và loại bỏ `DEMO_VIDEOS` trong `VideoDetailPage.tsx`.
* **API Endpoints:** `GET /api/v1/videos/{id}`, `GET /api/v1/videos`.
* **Thay đổi FE:** Khi API trả 404 hiển thị Empty/NotFound; khi trả 401/403/500 hoặc rớt mạng hiển thị Error State + nút Thử lại (Retry). Chuẩn hóa định dạng thời lượng video `durationFormatted`.
* **Kiểm thử:** Viết regression tests mô phỏng HTTP 500, 404, rớt mạng; xác minh UI không bao giờ render dữ liệu giả lập.

### B2: Student Classes kết nối API thật
* **Mục tiêu:** Xóa bỏ mảng tĩnh `MOCK_ENROLLED_CLASSES` trong `StudentClassesPage.tsx`, kết nối trực tiếp vào `GET /api/v1/teacher/my-enrolled-classes`.
* **Thay đổi FE:** Quản lý Loading, Empty State (học viên chưa ghi danh lớp nào), Error State và hiển thị đúng tên lớp, lịch học, giảng viên từ backend.
* **Kiểm thử:** Contract tests cho học viên có 0 lớp, nhiều lớp, và xử lý token hết hạn 401.

### B3: Teacher Assignment Backend + Frontend (P1)
* **Mục tiêu:** Thay thế hoàn toàn `assignment.service.ts` in-memory (`CURRENT_TEACHER_ID = 'tch-001'`, `assignmentsStore`) bằng cơ sở dữ liệu SQL Server.
* **Backend Entities:**
  * `TeachingAssignment`: `Id`, `TeacherId`, `Title`, `Description`, `HskLevelId`, `Status` (Draft, Published, Closed, Archived), `TimeLimitMinutes`, `MaxAttempts`, `RetakePolicy`, `PassingPoints`, `AllowLateSubmission`, `LatePenaltyPercent`, `ShuffleQuestions`, `ShowCorrectAnswers`, `CreatedAt`, `PublishedAt`.
  * `TeachingAssignmentTarget`: `Id`, `AssignmentId`, `ClassId`, `DueDate`, `CloseDate`.
  * `TeachingAssignmentQuestion`: `Id`, `AssignmentId`, `QuestionBankId`, `OrderIndex`, `Points`, `QuestionSnapshotJson`.
* **Backend Endpoints:**
  * `GET /api/v1/teacher/assignments` (phân trang, lọc theo lớp, trạng thái, HSK).
  * `GET /api/v1/teacher/assignments/{id}`.
  * `POST /api/v1/teacher/assignments` (tạo nháp).
  * `PUT /api/v1/teacher/assignments/{id}` (cập nhật).
  * `POST /api/v1/teacher/assignments/{id}/publish` (phát hành cho các lớp chỉ định).
  * `DELETE /api/v1/teacher/assignments/{id}`.
* **Authorization:** `PolicyConstants.TeacherAccess` + kiểm tra quyền sở hữu bài tập và lớp học (`TeacherId == CurrentUser.Id`).
* **Kiểm thử:** Unit tests & Integration tests với InMemory/Test SQL Server.

### B4: Student Homework, Attempts, Submission & Grading trên SQL Server (P1)
* **Mục tiêu:** Thay thế `student-attempt.service.ts` lưu localStorage thành lưu trữ server-authoritative.
* **Backend Entities:**
  * `StudentAssignmentAttempt`: `Id`, `AssignmentId`, `ClassId`, `StudentId`, `AttemptNumber`, `Status` (InProgress, Submitted, Graded), `Score`, `MaxScore`, `StartedAt`, `SubmittedAt`, `TimeSpentSeconds`, `IsLate`.
  * `StudentAttemptAnswer`: `Id`, `AttemptId`, `QuestionId`, `UserAnswerJson`, `IsCorrect`, `EarnedPoints`, `AnsweredAt`.
* **Backend Endpoints:**
  * `GET /api/v1/student/homework` (danh sách bài tập được giao cho các lớp học viên đã tham gia).
  * `POST /api/v1/student/assignments/{assignmentId}/attempts/start` (bắt đầu làm bài, kiểm tra số lần làm và hạn nộp).
  * `PUT /api/v1/student/attempts/{attemptId}/answers` (lưu nháp tiến độ câu trả lời).
  * `POST /api/v1/student/attempts/{attemptId}/submit` (nộp bài chính thức, chấm điểm server-side, khóa chỉnh sửa).
  * `GET /api/v1/student/attempts/{attemptId}/result` (kết quả và lời giải nếu được phép).
* **Kiểm soát bảo mật:** Ẩn hoàn toàn đáp án trắc nghiệm khi tải câu hỏi runner; chỉ tiết lộ đáp án khi bài tập được cấu hình `ShowCorrectAnswers` và học viên đã nộp bài.

---

## VI. QUYẾT ĐỊNH GO / NO-GO CHO PHASE B

* **Đánh giá CI sau Phase A.1:** **GO** cho việc bắt đầu Phase B.
* **Lý do:** Lỗi crash `TypeError: {} is not iterable` đã được giải quyết triệt để tại gốc rễ; bộ test suite Frontend đã đạt 100% deterministic (456 tests PASS trong 3 lần chạy liên tiếp); Backend 328 tests PASS; báo cáo kiểm kê đã được cập nhật trung thực theo chuẩn Zero-Assumption.
* **Cam kết an toàn:**
  * Không merge vào `main`.
  * Không force push.
  * Không chạy migration lên DB Production / Dev.
  * Đợi ChatGPT / Trưởng dự án phê duyệt kế hoạch trước khi tiến hành code nhóm B1 và B2.
