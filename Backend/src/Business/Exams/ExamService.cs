using Microsoft.EntityFrameworkCore;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Exams.DTOs;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.Exams;

public class ExamService : IExamService
{
    private static readonly HashSet<string> ValidExamTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "MOCK", "PRACTICE", "PLACEMENT", "MIDTERM", "FINAL"
    };

    private static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED"
    };

    private static readonly HashSet<string> ValidSections = new(StringComparer.OrdinalIgnoreCase)
    {
        "Nghe hiểu", "Đọc hiểu", "Viết"
    };

    private readonly ApplicationDbContext _dbContext;

    public ExamService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResponse<ExamDto>> GetExamsAsync(
        int? hskLevel,
        string? examType,
        string? status,
        string? search,
        int page,
        int pageSize,
        bool publishedOnly,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Exams.AsNoTracking().Where(e => !e.IsDeleted);

        if (publishedOnly)
        {
            query = query.Where(e => e.Status == "PUBLISHED");
        }
        else if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var normalizedStatus = status.Trim().ToUpperInvariant();
            query = query.Where(e => e.Status == normalizedStatus);
        }

        if (hskLevel.HasValue && hskLevel.Value > 0)
        {
            query = query.Where(e => e.HskLevel == hskLevel.Value);
        }

        if (!string.IsNullOrWhiteSpace(examType) && !examType.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            var normalizedType = examType.Trim().ToUpperInvariant();
            query = query.Where(e => e.ExamType == normalizedType);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();
            query = query.Where(e =>
                e.Code.Contains(keyword) ||
                e.Title.Contains(keyword) ||
                (e.Description != null && e.Description.Contains(keyword)));
        }

        var safePage = Math.Max(1, page);
        var safeSize = Math.Clamp(pageSize, 1, 100);
        var totalCount = await query.CountAsync(cancellationToken);

        var pageExams = await query
            .OrderBy(e => e.HskLevel)
            .ThenByDescending(e => e.UpdatedAt ?? e.CreatedAt)
            .Skip((safePage - 1) * safeSize)
            .Take(safeSize)
            .Select(e => new
            {
                Exam = e,
                QuestionCount = e.Questions.Count,
            })
            .ToListAsync(cancellationToken);

        var examIds = pageExams.Select(x => x.Exam.Id).ToList();
        var attemptCounts = examIds.Count == 0
            ? new Dictionary<Guid, int>()
            : await _dbContext.StudentExamAttempts
                .AsNoTracking()
                .Where(a => examIds.Contains(a.ExamId))
                .GroupBy(a => a.ExamId)
                .Select(g => new { g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count, cancellationToken);

        var items = pageExams.Select(x => MapToSummaryDto(
            x.Exam,
            x.QuestionCount,
            attemptCounts.GetValueOrDefault(x.Exam.Id, 0))).ToList();

        return new PagedResponse<ExamDto>(items, totalCount, safePage, safeSize);
    }

    public async Task<ExamStatsDto> GetExamStatsAsync(CancellationToken cancellationToken = default)
    {
        var activeExams = await _dbContext.Exams
            .AsNoTracking()
            .Where(e => !e.IsDeleted)
            .Select(e => new { e.Status, e.HskLevel })
            .ToListAsync(cancellationToken);

        var byHsk = Enumerable.Range(1, 6).ToDictionary(lvl => lvl, _ => 0);
        foreach (var e in activeExams)
        {
            if (byHsk.ContainsKey(e.HskLevel))
            {
                byHsk[e.HskLevel]++;
            }
        }

        return new ExamStatsDto
        {
            Total = activeExams.Count,
            Published = activeExams.Count(e => e.Status == "PUBLISHED"),
            Draft = activeExams.Count(e => e.Status == "DRAFT"),
            Pending = activeExams.Count(e => e.Status == "PENDING_REVIEW"),
            Archived = activeExams.Count(e => e.Status == "ARCHIVED"),
            ByHsk = byHsk,
        };
    }

    public async Task<ExamDetailDto?> GetExamByIdAsync(Guid id, bool publishedOnly, CancellationToken cancellationToken = default)
    {
        var exam = await _dbContext.Exams
            .AsNoTracking()
            .Where(e => e.Id == id && !e.IsDeleted && (!publishedOnly || e.Status == "PUBLISHED"))
            .Include(e => e.Questions.OrderBy(q => q.OrderIndex))
            .ThenInclude(q => q.Exercise)
            .FirstOrDefaultAsync(cancellationToken);

        if (exam == null) return null;

        var attemptCount = await _dbContext.StudentExamAttempts
            .AsNoTracking()
            .CountAsync(a => a.ExamId == id, cancellationToken);

        return MapToDetailDto(exam, attemptCount);
    }

    public async Task<ExamDetailDto> CreateExamAsync(CreateExamDto dto, Guid? currentUserId, CancellationToken cancellationToken = default)
    {
        ValidateExamMetadata(dto.Code, dto.Title, dto.HskLevel, dto.ExamType, dto.DurationMinutes, dto.PassingScore);

        var normalizedCode = dto.Code.Trim().ToUpperInvariant();
        var duplicateCode = await _dbContext.Exams
            .AnyAsync(e => !e.IsDeleted && e.Code == normalizedCode, cancellationToken);
        if (duplicateCode)
        {
            throw new InvalidOperationException($"Mã đề thi '{normalizedCode}' đã tồn tại trong Kho đề thi.");
        }

        var initialStatus = NormalizeStatus(dto.Status);
        if (initialStatus == "PUBLISHED")
        {
            throw new InvalidOperationException("Không thể tạo đề thi trực tiếp ở trạng thái PUBLISHED. Vui lòng tạo DRAFT và gửi kiểm duyệt.");
        }

        var questionInputs = dto.Questions ?? new List<UpsertExamQuestionDto>();
        await ValidateExercisesExistAsync(questionInputs, cancellationToken);

        var exam = new ExamEntity
        {
            Code = normalizedCode,
            Title = dto.Title.Trim(),
            HskLevel = dto.HskLevel,
            ExamType = dto.ExamType.Trim().ToUpperInvariant(),
            Description = dto.Description?.Trim(),
            Instructions = dto.Instructions?.Trim(),
            DurationMinutes = dto.DurationMinutes,
            PassingScore = dto.PassingScore,
            TotalPoints = questionInputs.Sum(q => q.Points),
            Status = initialStatus == "PENDING_REVIEW" ? "PENDING_REVIEW" : "DRAFT",
            CreatedByUserId = currentUserId,
            UpdatedByUserId = currentUserId,
        };

        var orderCounter = 1;
        foreach (var q in questionInputs.OrderBy(x => x.OrderIndex))
        {
            exam.Questions.Add(new ExamQuestionEntity
            {
                ExamId = exam.Id,
                ExerciseId = q.ExerciseId,
                SectionName = NormalizeSectionName(q.SectionName),
                OrderIndex = orderCounter++,
                Points = q.Points > 0 ? q.Points : 10,
            });
        }

        exam.TotalPoints = exam.Questions.Sum(q => q.Points);

        _dbContext.Exams.Add(exam);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return (await GetExamByIdAsync(exam.Id, publishedOnly: false, cancellationToken))!;
    }

    public async Task<ExamDetailDto?> UpdateExamAsync(Guid id, UpdateExamDto dto, Guid? currentUserId, CancellationToken cancellationToken = default)
    {
        ValidateExamMetadata(dto.Code, dto.Title, dto.HskLevel, dto.ExamType, dto.DurationMinutes, dto.PassingScore);

        var exam = await _dbContext.Exams
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, cancellationToken);
        if (exam == null) return null;

        var normalizedCode = dto.Code.Trim().ToUpperInvariant();
        var duplicateCode = await _dbContext.Exams
            .AnyAsync(e => e.Id != id && !e.IsDeleted && e.Code == normalizedCode, cancellationToken);
        if (duplicateCode)
        {
            throw new InvalidOperationException($"Mã đề thi '{normalizedCode}' đã được sử dụng cho đề thi khác.");
        }

        exam.Code = normalizedCode;
        exam.Title = dto.Title.Trim();
        exam.HskLevel = dto.HskLevel;
        exam.ExamType = dto.ExamType.Trim().ToUpperInvariant();
        exam.Description = dto.Description?.Trim();
        exam.Instructions = dto.Instructions?.Trim();
        exam.DurationMinutes = dto.DurationMinutes;
        exam.PassingScore = dto.PassingScore;
        exam.UpdatedByUserId = currentUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetExamByIdAsync(exam.Id, publishedOnly: false, cancellationToken);
    }

    public async Task<ExamDetailDto?> SetExamQuestionsAsync(Guid id, SetExamQuestionsDto dto, Guid? currentUserId, CancellationToken cancellationToken = default)
    {
        var exam = await _dbContext.Exams
            .Include(e => e.Questions)
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, cancellationToken);
        if (exam == null) return null;

        var inputs = dto.Questions ?? new List<UpsertExamQuestionDto>();
        await ValidateExercisesExistAsync(inputs, cancellationToken);

        if (exam.Questions.Count > 0)
        {
            _dbContext.ExamQuestions.RemoveRange(exam.Questions);
            exam.Questions.Clear();
        }

        var orderCounter = 1;
        foreach (var q in inputs.OrderBy(x => x.OrderIndex))
        {
            var questionEntity = new ExamQuestionEntity
            {
                ExamId = exam.Id,
                ExerciseId = q.ExerciseId,
                SectionName = NormalizeSectionName(q.SectionName),
                OrderIndex = orderCounter++,
                Points = q.Points > 0 ? q.Points : 10,
            };
            _dbContext.ExamQuestions.Add(questionEntity);
            exam.Questions.Add(questionEntity);
        }

        exam.TotalPoints = exam.Questions.Sum(q => q.Points);
        exam.UpdatedByUserId = currentUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetExamByIdAsync(exam.Id, publishedOnly: false, cancellationToken);
    }

    public async Task<ExamDetailDto?> ReviewExamAsync(Guid id, ReviewExamDto dto, Guid? currentUserId, CancellationToken cancellationToken = default)
    {
        var targetStatus = NormalizeStatus(dto.Status);
        var exam = await _dbContext.Exams
            .Include(e => e.Questions)
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, cancellationToken);

        if (exam == null) return null;

        if (targetStatus == "PUBLISHED")
        {
            ValidateCanPublishExam(exam.Status, exam.UpdatedByUserId, currentUserId, exam.Questions.Count);

            exam.Status = "PUBLISHED";
            exam.ReviewedByUserId = currentUserId;
            exam.ReviewedAt = DateTime.UtcNow;
            exam.ReviewNotes = dto.ReviewNotes?.Trim();
        }
        else if (targetStatus == "PENDING_REVIEW")
        {
            if (exam.Questions.Count == 0)
            {
                throw new InvalidOperationException("Đề thi cần có ít nhất 1 câu hỏi trước khi gửi kiểm duyệt.");
            }

            exam.Status = "PENDING_REVIEW";
            exam.UpdatedByUserId = currentUserId;
            exam.ReviewNotes = dto.ReviewNotes?.Trim();
        }
        else if (targetStatus == "ARCHIVED" || targetStatus == "DRAFT")
        {
            exam.Status = targetStatus;
            exam.ReviewNotes = dto.ReviewNotes?.Trim();
            exam.ReviewedByUserId = currentUserId;
            exam.ReviewedAt = DateTime.UtcNow;
        }
        else
        {
            throw new ArgumentException($"Trạng thái đề thi '{targetStatus}' không hợp lệ.");
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetExamByIdAsync(exam.Id, publishedOnly: false, cancellationToken);
    }

    public async Task<bool> DeleteExamAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var exam = await _dbContext.Exams
            .Include(e => e.Questions)
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, cancellationToken);

        if (exam == null) return false;

        var hasAttempts = await _dbContext.StudentExamAttempts
            .AnyAsync(a => a.ExamId == id, cancellationToken);

        ValidateDeleteAllowed(exam.Status, hasAttempts);

        if (exam.Questions.Count > 0)
        {
            _dbContext.ExamQuestions.RemoveRange(exam.Questions);
        }

        _dbContext.Exams.Remove(exam);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task ValidateExercisesExistAsync(List<UpsertExamQuestionDto> questionInputs, CancellationToken cancellationToken)
    {
        if (questionInputs.Count == 0) return;

        var requestedIds = questionInputs.Select(q => q.ExerciseId).ToList();
        if (requestedIds.Distinct().Count() != requestedIds.Count)
        {
            throw new ArgumentException("Danh sách câu hỏi trong đề thi không được chứa câu hỏi trùng lặp.");
        }

        var existingCount = await _dbContext.Exercises
            .CountAsync(e => requestedIds.Contains(e.Id), cancellationToken);
        if (existingCount != requestedIds.Count)
        {
            throw new ArgumentException("Một hoặc nhiều câu hỏi được chọn không tồn tại trong Ngân hàng câu hỏi.");
        }
    }

    public static void ValidateCanPublishExam(string currentStatus, Guid? updatedByUserId, Guid? reviewerUserId, int questionCount)
    {
        if (currentStatus != "PENDING_REVIEW")
        {
            throw new InvalidOperationException("Đề thi phải ở trạng thái PENDING_REVIEW trước khi xuất bản (PUBLISHED).");
        }

        if (reviewerUserId == null)
        {
            throw new InvalidOperationException("Yêu cầu danh tính người kiểm duyệt hợp lệ để xuất bản đề thi.");
        }

        if (updatedByUserId.HasValue && updatedByUserId.Value == reviewerUserId.Value)
        {
            throw new InvalidOperationException("Vi phạm phân tách nhiệm vụ: người biên tập cuối cùng không thể tự xuất bản đề thi này.");
        }

        if (questionCount <= 0)
        {
            throw new InvalidOperationException("Không thể xuất bản đề thi chưa có câu hỏi nào từ Ngân hàng câu hỏi.");
        }
    }

    public static void ValidateDeleteAllowed(string currentStatus, bool hasAttempts)
    {
        if (hasAttempts)
        {
            throw new InvalidOperationException("Không thể xóa vĩnh viễn đề thi đã có lịch sử làm bài của học viên. Vui lòng chuyển sang trạng thái ARCHIVED.");
        }

        if (currentStatus == "PUBLISHED")
        {
            throw new InvalidOperationException("Không thể xóa trực tiếp đề thi đang ở trạng thái PUBLISHED. Vui lòng lưu trữ (ARCHIVED) trước.");
        }
    }

    public static void ValidateExamMetadata(string code, string title, int hskLevel, string examType, int durationMinutes, int passingScore)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Mã đề thi không được để trống.");

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Tên đề thi không được để trống.");

        if (hskLevel < 1 || hskLevel > 6)
            throw new ArgumentException("Hệ thống chỉ hỗ trợ cấp độ HSK 2.0 từ HSK 1 đến HSK 6.");

        var normalizedType = (examType ?? string.Empty).Trim().ToUpperInvariant();
        if (!ValidExamTypes.Contains(normalizedType))
            throw new ArgumentException($"Loại đề thi '{examType}' không hợp lệ.");

        if (durationMinutes < 1 || durationMinutes > 240)
            throw new ArgumentException("Thời gian làm bài phải từ 1 đến 240 phút.");

        if (passingScore < 0)
            throw new ArgumentException("Điểm đạt không thể âm.");
    }

    private static string NormalizeStatus(string? status)
    {
        var normalized = (status ?? "DRAFT").Trim().ToUpperInvariant();
        if (!ValidStatuses.Contains(normalized))
        {
            throw new ArgumentException($"Trạng thái '{status}' không hợp lệ. Chỉ chấp nhận: DRAFT, PENDING_REVIEW, PUBLISHED, ARCHIVED.");
        }
        return normalized;
    }

    private static string NormalizeSectionName(string? sectionName)
    {
        if (string.IsNullOrWhiteSpace(sectionName)) return "Đọc hiểu";
        var trimmed = sectionName.Trim();
        var match = ValidSections.FirstOrDefault(s => s.Equals(trimmed, StringComparison.OrdinalIgnoreCase));
        return match ?? trimmed;
    }

    private static ExamDto MapToSummaryDto(ExamEntity e, int questionCount, int attemptCount)
    {
        return new ExamDto
        {
            Id = e.Id,
            Code = e.Code,
            Title = e.Title,
            HskLevel = e.HskLevel,
            ExamType = e.ExamType,
            Description = e.Description,
            Instructions = e.Instructions,
            DurationMinutes = e.DurationMinutes,
            PassingScore = e.PassingScore,
            TotalPoints = e.TotalPoints,
            QuestionCount = questionCount,
            AttemptCount = attemptCount,
            Status = e.Status,
            CreatedByUserId = e.CreatedByUserId,
            UpdatedByUserId = e.UpdatedByUserId,
            ReviewedByUserId = e.ReviewedByUserId,
            ReviewedAt = e.ReviewedAt,
            ReviewNotes = e.ReviewNotes,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt,
        };
    }

    private static ExamDetailDto MapToDetailDto(ExamEntity e, int attemptCount)
    {
        var orderedQuestions = e.Questions
            .OrderBy(q => q.OrderIndex)
            .Select(q => new ExamQuestionItemDto
            {
                Id = q.Id,
                ExamId = q.ExamId,
                ExerciseId = q.ExerciseId,
                SectionName = q.SectionName,
                OrderIndex = q.OrderIndex,
                Points = q.Points,
                ExerciseTitle = q.Exercise?.Title ?? string.Empty,
                ExerciseType = q.Exercise?.Type ?? string.Empty,
                ExerciseSkill = q.Exercise?.Skill ?? string.Empty,
                HskLevel = q.Exercise?.HskLevel ?? e.HskLevel,
                PromptHanzi = q.Exercise?.PromptHanzi,
                PromptPinyin = q.Exercise?.PromptPinyin,
                PromptVietnamese = q.Exercise?.PromptVietnamese,
                OptionsJson = q.Exercise?.OptionsJson,
                CorrectOptionIndex = q.Exercise?.CorrectOptionIndex,
                CorrectAnswer = q.Exercise?.CorrectAnswer,
                Explanation = q.Exercise?.Explanation,
            })
            .ToList();

        return new ExamDetailDto
        {
            Id = e.Id,
            Code = e.Code,
            Title = e.Title,
            HskLevel = e.HskLevel,
            ExamType = e.ExamType,
            Description = e.Description,
            Instructions = e.Instructions,
            DurationMinutes = e.DurationMinutes,
            PassingScore = e.PassingScore,
            TotalPoints = e.TotalPoints,
            QuestionCount = orderedQuestions.Count,
            AttemptCount = attemptCount,
            Status = e.Status,
            CreatedByUserId = e.CreatedByUserId,
            UpdatedByUserId = e.UpdatedByUserId,
            ReviewedByUserId = e.ReviewedByUserId,
            ReviewedAt = e.ReviewedAt,
            ReviewNotes = e.ReviewNotes,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt,
            Questions = orderedQuestions,
        };
    }
}
