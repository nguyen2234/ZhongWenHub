using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Business.Authorization;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Teacher.DTOs;
using ZhongWenHub.Business.Users;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Entities.Teacher;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.Teacher.Services;

public class TeacherAssignmentService : ITeacherAssignmentService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<TeacherAssignmentService> _logger;

    public TeacherAssignmentService(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<TeacherAssignmentService> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    private Guid GetCurrentUserIdOrThrow()
    {
        var id = _currentUserService.UserId;
        if (!id.HasValue)
        {
            throw new UnauthorizedAccessException("Người dùng chưa được xác thực.");
        }
        return id.Value;
    }

    private async Task<TeachingAssignment> GetAuthorizedAssignmentAsync(Guid assignmentId, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserIdOrThrow();
        var assignment = await _context.TeachingAssignments
            .Include(a => a.Questions)
            .Include(a => a.Targets)
                .ThenInclude(t => t.TeachingClass)
            .Include(a => a.Lesson)
            .FirstOrDefaultAsync(a => a.Id == assignmentId, cancellationToken);

        if (assignment == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy bài tập với mã {assignmentId}");
        }

        var isAdmin = _currentUserService.Roles.Contains(RoleConstants.Admin);
        if (!isAdmin && assignment.TeacherId != currentUserId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền quản lý bài tập này.");
        }

        return assignment;
    }

    public async Task<PagedResponse<AssignmentSummaryDto>> GetAssignmentsAsync(
        AssignmentFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var currentUserId = GetCurrentUserIdOrThrow();
        var isAdmin = _currentUserService.Roles.Contains(RoleConstants.Admin);

        var query = _context.TeachingAssignments
            .Include(a => a.Questions)
            .Include(a => a.Targets)
                .ThenInclude(t => t.TeachingClass)
            .Include(a => a.Submissions)
            .Include(a => a.Lesson)
            .AsNoTracking();

        if (!isAdmin)
        {
            query = query.Where(a => a.TeacherId == currentUserId);
        }

        if (filter.ClassId.HasValue)
        {
            query = query.Where(a => a.Targets.Any(t => t.ClassId == filter.ClassId.Value));
        }

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            var statusUpper = filter.Status.Trim().ToUpperInvariant();
            query = query.Where(a => a.Status == statusUpper);
        }
        else
        {
            query = query.Where(a => a.Status != "ARCHIVED");
        }

        if (!string.IsNullOrWhiteSpace(filter.HskLevelId))
        {
            query = query.Where(a => a.HskLevelId == filter.HskLevelId.Trim());
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(a => a.Title.ToLower().Contains(search) || a.Description.ToLower().Contains(search));
        }

        var totalItems = await query.CountAsync(cancellationToken);
        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var assignments = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var summaries = assignments.Select(MapToSummaryDto).ToList();

        return new PagedResponse<AssignmentSummaryDto>(summaries, totalItems, page, pageSize);
    }

    public async Task<AssignmentDetailDto> GetAssignmentByIdAsync(Guid assignmentId, CancellationToken cancellationToken = default)
    {
        var assignment = await GetAuthorizedAssignmentAsync(assignmentId, cancellationToken);
        return MapToDetailDto(assignment);
    }

    public async Task<AssignmentDetailDto> CreateAssignmentAsync(CreateAssignmentDto dto, CancellationToken cancellationToken = default)
    {
        var currentUserId = GetCurrentUserIdOrThrow();
        var isAdmin = _currentUserService.Roles.Contains(RoleConstants.Admin);

        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            throw new ArgumentException("Tiêu đề bài tập không được để trống.", nameof(dto.Title));
        }

        // Validate target classes belong to this teacher
        var targetClassIds = dto.ClassIds?.Distinct().ToList() ?? new List<Guid>();
        if (targetClassIds.Count > 0)
        {
            var classes = await _context.TeachingClasses
                .Where(c => targetClassIds.Contains(c.Id) && !c.IsArchived)
                .ToListAsync(cancellationToken);

            if (!isAdmin && classes.Any(c => c.TeacherId != currentUserId))
            {
                throw new UnauthorizedAccessException("Bạn chỉ được giao bài tập cho các lớp học do bạn phụ trách.");
            }
        }

        var assignment = new TeachingAssignment
        {
            TeacherId = currentUserId,
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim() ?? string.Empty,
            HskLevelId = string.IsNullOrWhiteSpace(dto.HskLevelId) ? "level-hsk-1" : dto.HskLevelId.Trim(),
            LessonId = dto.LessonId,
            Status = "DRAFT",
            TimeLimitMinutes = Math.Max(0, dto.TimeLimitMinutes),
            MaxAttempts = Math.Max(1, dto.MaxAttempts),
            RetakePolicy = string.IsNullOrWhiteSpace(dto.RetakePolicy) ? "HIGHEST_SCORE" : dto.RetakePolicy.ToUpperInvariant(),
            PassingPoints = Math.Max(0, dto.PassingPoints),
            AllowLateSubmission = dto.AllowLateSubmission,
            LatePenaltyPercent = Math.Clamp(dto.LatePenaltyPercent, 0, 100),
            ShuffleQuestions = dto.ShuffleQuestions,
            ShowCorrectAnswers = dto.ShowCorrectAnswers,
        };

        // Add questions
        if (dto.Questions != null && dto.Questions.Count > 0)
        {
            int order = 0;
            foreach (var q in dto.Questions)
            {
                assignment.Questions.Add(new AssignmentQuestion
                {
                    QuestionBankItemId = q.QuestionBankItemId,
                    Prompt = q.Prompt?.Trim() ?? string.Empty,
                    QuestionType = string.IsNullOrWhiteSpace(q.QuestionType) ? "SINGLE_CHOICE" : q.QuestionType.ToUpperInvariant(),
                    OptionsJson = q.Options != null ? JsonSerializer.Serialize(q.Options) : null,
                    CorrectAnswer = q.CorrectAnswer?.Trim() ?? string.Empty,
                    Explanation = q.Explanation?.Trim(),
                    Points = q.Points > 0 ? q.Points : 10.0,
                    OrderIndex = order++,
                });
            }
        }

        // Add targets
        foreach (var classId in targetClassIds)
        {
            assignment.Targets.Add(new AssignmentTarget
            {
                ClassId = classId,
                DueDate = dto.DueDate,
                AssignedAt = DateTime.UtcNow,
            });
        }

        _context.TeachingAssignments.Add(assignment);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetAssignmentByIdAsync(assignment.Id, cancellationToken);
    }

    public async Task<AssignmentDetailDto> UpdateAssignmentAsync(
        Guid assignmentId,
        UpdateAssignmentDto dto,
        CancellationToken cancellationToken = default)
    {
        var assignment = await GetAuthorizedAssignmentAsync(assignmentId, cancellationToken);
        var currentUserId = GetCurrentUserIdOrThrow();
        var isAdmin = _currentUserService.Roles.Contains(RoleConstants.Admin);

        if (assignment.Status != "DRAFT")
        {
            throw new InvalidOperationException("Chỉ có thể chỉnh sửa bài tập ở trạng thái bản nháp.");
        }

        // Check if assignment already has submissions
        var hasSubmissions = await _context.StudentAssignmentSubmissions
            .AnyAsync(s => s.AssignmentId == assignmentId, cancellationToken);

        assignment.Title = dto.Title.Trim();
        assignment.Description = dto.Description?.Trim() ?? string.Empty;
        assignment.HskLevelId = string.IsNullOrWhiteSpace(dto.HskLevelId) ? "level-hsk-1" : dto.HskLevelId.Trim();
        assignment.LessonId = dto.LessonId;
        assignment.TimeLimitMinutes = Math.Max(0, dto.TimeLimitMinutes);
        assignment.MaxAttempts = Math.Max(1, dto.MaxAttempts);
        assignment.RetakePolicy = string.IsNullOrWhiteSpace(dto.RetakePolicy) ? "HIGHEST_SCORE" : dto.RetakePolicy.ToUpperInvariant();
        assignment.PassingPoints = Math.Max(0, dto.PassingPoints);
        assignment.AllowLateSubmission = dto.AllowLateSubmission;
        assignment.LatePenaltyPercent = Math.Clamp(dto.LatePenaltyPercent, 0, 100);
        assignment.ShuffleQuestions = dto.ShuffleQuestions;
        assignment.ShowCorrectAnswers = dto.ShowCorrectAnswers;

        // If no submissions yet, update questions and targets
        if (!hasSubmissions)
        {
            // Replace questions
            _context.AssignmentQuestions.RemoveRange(assignment.Questions);
            assignment.Questions.Clear();

            if (dto.Questions != null && dto.Questions.Count > 0)
            {
                int order = 0;
                foreach (var q in dto.Questions)
                {
                    assignment.Questions.Add(new AssignmentQuestion
                    {
                        AssignmentId = assignment.Id,
                        QuestionBankItemId = q.QuestionBankItemId,
                        Prompt = q.Prompt?.Trim() ?? string.Empty,
                        QuestionType = string.IsNullOrWhiteSpace(q.QuestionType) ? "SINGLE_CHOICE" : q.QuestionType.ToUpperInvariant(),
                        OptionsJson = q.Options != null ? JsonSerializer.Serialize(q.Options) : null,
                        CorrectAnswer = q.CorrectAnswer?.Trim() ?? string.Empty,
                        Explanation = q.Explanation?.Trim(),
                        Points = q.Points > 0 ? q.Points : 10.0,
                        OrderIndex = order++,
                    });
                }
            }

            // Replace targets
            _context.AssignmentTargets.RemoveRange(assignment.Targets);
            assignment.Targets.Clear();

            var targetClassIds = dto.ClassIds?.Distinct().ToList() ?? new List<Guid>();
            if (targetClassIds.Count > 0)
            {
                var classes = await _context.TeachingClasses
                    .Where(c => targetClassIds.Contains(c.Id) && !c.IsArchived)
                    .ToListAsync(cancellationToken);

                if (!isAdmin && classes.Any(c => c.TeacherId != currentUserId))
                {
                    throw new UnauthorizedAccessException("Bạn chỉ được giao bài tập cho các lớp học do bạn phụ trách.");
                }

                foreach (var classId in targetClassIds)
                {
                    assignment.Targets.Add(new AssignmentTarget
                    {
                        AssignmentId = assignment.Id,
                        ClassId = classId,
                        DueDate = dto.DueDate,
                        AssignedAt = DateTime.UtcNow,
                    });
                }
            }
        }
        else
        {
            // If has submissions, update due date for existing targets only
            if (dto.DueDate.HasValue)
            {
                foreach (var t in assignment.Targets)
                {
                    t.DueDate = dto.DueDate;
                }
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return await GetAssignmentByIdAsync(assignment.Id, cancellationToken);
    }

    public async Task<bool> DeleteAssignmentAsync(Guid assignmentId, CancellationToken cancellationToken = default)
    {
        var assignment = await GetAuthorizedAssignmentAsync(assignmentId, cancellationToken);

        var hasSubmissions = await _context.StudentAssignmentSubmissions
            .AnyAsync(s => s.AssignmentId == assignmentId, cancellationToken);

        if (hasSubmissions || assignment.Status == "PUBLISHED")
        {
            // Safe archive
            assignment.Status = "ARCHIVED";
        }
        else
        {
            _context.TeachingAssignments.Remove(assignment);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<AssignmentDetailDto> PublishAssignmentAsync(Guid assignmentId, CancellationToken cancellationToken = default)
    {
        var assignment = await GetAuthorizedAssignmentAsync(assignmentId, cancellationToken);

        if (assignment.Status != "DRAFT")
        {
            throw new InvalidOperationException("Chỉ có thể xuất bản bài tập ở trạng thái bản nháp.");
        }

        if (assignment.Questions.Count == 0)
        {
            throw new InvalidOperationException("Bài tập phải có ít nhất 1 câu hỏi trước khi xuất bản.");
        }

        if (assignment.Targets.Count == 0)
        {
            throw new InvalidOperationException("Bài tập phải được giao cho ít nhất 1 lớp học trước khi xuất bản.");
        }

        assignment.Status = "PUBLISHED";
        assignment.PublishedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return await GetAssignmentByIdAsync(assignment.Id, cancellationToken);
    }

    public async Task<AssignmentDetailDto> CloseAssignmentAsync(Guid assignmentId, CancellationToken cancellationToken = default)
    {
        var assignment = await GetAuthorizedAssignmentAsync(assignmentId, cancellationToken);

        if (assignment.Status != "PUBLISHED")
        {
            throw new InvalidOperationException("Chỉ có thể đóng bài tập đang được xuất bản.");
        }

        assignment.Status = "CLOSED";
        assignment.ClosedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return await GetAssignmentByIdAsync(assignment.Id, cancellationToken);
    }

    public async Task<IReadOnlyList<TeacherSubmissionItemDto>> GetSubmissionsAsync(
        Guid assignmentId,
        string? status = null,
        CancellationToken cancellationToken = default)
    {
        await GetAuthorizedAssignmentAsync(assignmentId, cancellationToken);

        var query = _context.StudentAssignmentSubmissions
            .Include(s => s.Student)
            .Include(s => s.TeachingClass)
            .Include(s => s.Assignment)
            .Where(s => s.AssignmentId == assignmentId);

        if (!string.IsNullOrWhiteSpace(status))
        {
            var stUpper = status.Trim().ToUpperInvariant();
            query = query.Where(s => s.Status == stUpper);
        }

        var submissions = await query
            .OrderByDescending(s => s.SubmittedAt ?? s.StartedAt)
            .Select(s => new TeacherSubmissionItemDto
            {
                Id = s.Id,
                AssignmentId = s.AssignmentId,
                AssignmentTitle = s.Assignment.Title,
                StudentId = s.StudentId,
                StudentName = s.Student.DisplayName,
                StudentEmail = s.Student.Email ?? string.Empty,
                StudentAvatarUrl = s.Student.AvatarUrl,
                ClassId = s.ClassId,
                ClassName = s.TeachingClass.Name,
                AttemptNumber = s.AttemptNumber,
                StartedAt = s.StartedAt,
                SubmittedAt = s.SubmittedAt,
                Status = s.Status,
                Score = s.Score,
                MaxScore = s.MaxScore,
                IsPassed = s.IsPassed,
                TimeSpentSeconds = s.TimeSpentSeconds,
                FeedbackNote = s.FeedbackNote,
                GradedAt = s.GradedAt,
            })
            .ToListAsync(cancellationToken);

        return submissions;
    }

    public async Task<TeacherSubmissionDetailDto> GetSubmissionDetailAsync(
        Guid submissionId,
        CancellationToken cancellationToken = default)
    {
        var submission = await _context.StudentAssignmentSubmissions
            .Include(s => s.Student)
            .Include(s => s.TeachingClass)
            .Include(s => s.Assignment)
                .ThenInclude(a => a.Questions)
            .FirstOrDefaultAsync(s => s.Id == submissionId, cancellationToken);

        if (submission == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy bài nộp với mã {submissionId}");
        }

        // Authorize teacher ownership
        var currentUserId = GetCurrentUserIdOrThrow();
        var isAdmin = _currentUserService.Roles.Contains(RoleConstants.Admin);
        if (!isAdmin && submission.Assignment.TeacherId != currentUserId && submission.TeachingClass.TeacherId != currentUserId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xem bài nộp này.");
        }

        // Parse student answers
        List<StudentAnswerItemDto> answers = new();
        try
        {
            answers = JsonSerializer.Deserialize<List<StudentAnswerItemDto>>(submission.StudentAnswersJson) ?? new();
        }
        catch
        {
            // fallback
        }

        var answerMap = answers.ToDictionary(a => a.QuestionId, a => a);
        var reviewList = new List<QuestionReviewItemDto>();

        foreach (var q in submission.Assignment.Questions.OrderBy(q => q.OrderIndex))
        {
            answerMap.TryGetValue(q.Id, out var ans);
            var studentAns = ans?.SelectedOption ?? ans?.TextAnswer;
            var isCorrect = !string.IsNullOrWhiteSpace(studentAns) &&
                string.Equals(studentAns.Trim(), q.CorrectAnswer.Trim(), StringComparison.OrdinalIgnoreCase);

            List<string>? opts = null;
            if (!string.IsNullOrWhiteSpace(q.OptionsJson))
            {
                try { opts = JsonSerializer.Deserialize<List<string>>(q.OptionsJson); } catch { }
            }

            reviewList.Add(new QuestionReviewItemDto
            {
                QuestionId = q.Id,
                Prompt = q.Prompt,
                QuestionType = q.QuestionType,
                Options = opts,
                StudentAnswer = studentAns,
                CorrectAnswer = q.CorrectAnswer,
                Explanation = q.Explanation,
                PointsEarned = isCorrect ? q.Points : 0,
                MaxPoints = q.Points,
                IsCorrect = isCorrect,
            });
        }

        return new TeacherSubmissionDetailDto
        {
            Id = submission.Id,
            AssignmentId = submission.AssignmentId,
            AssignmentTitle = submission.Assignment.Title,
            StudentId = submission.StudentId,
            StudentName = submission.Student.DisplayName,
            StudentEmail = submission.Student.Email ?? string.Empty,
            StudentAvatarUrl = submission.Student.AvatarUrl,
            ClassId = submission.ClassId,
            ClassName = submission.TeachingClass.Name,
            AttemptNumber = submission.AttemptNumber,
            StartedAt = submission.StartedAt,
            SubmittedAt = submission.SubmittedAt,
            Status = submission.Status,
            Score = submission.Score,
            MaxScore = submission.MaxScore,
            IsPassed = submission.IsPassed,
            TimeSpentSeconds = submission.TimeSpentSeconds,
            FeedbackNote = submission.FeedbackNote,
            GradedAt = submission.GradedAt,
            Answers = reviewList,
        };
    }

    public async Task<TeacherSubmissionDetailDto> GradeSubmissionAsync(
        Guid submissionId,
        GradeSubmissionDto dto,
        CancellationToken cancellationToken = default)
    {
        var submission = await _context.StudentAssignmentSubmissions
            .Include(s => s.Assignment)
            .Include(s => s.TeachingClass)
            .FirstOrDefaultAsync(s => s.Id == submissionId, cancellationToken);

        if (submission == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy bài nộp với mã {submissionId}");
        }

        var currentUserId = GetCurrentUserIdOrThrow();
        var isAdmin = _currentUserService.Roles.Contains(RoleConstants.Admin);
        if (!isAdmin && submission.Assignment.TeacherId != currentUserId && submission.TeachingClass.TeacherId != currentUserId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền chấm bài nộp này.");
        }

        if (dto.CustomScore.HasValue)
        {
            submission.Score = Math.Clamp(dto.CustomScore.Value, 0, submission.MaxScore);
        }

        submission.FeedbackNote = dto.FeedbackNote?.Trim();
        submission.Status = "GRADED";
        submission.GradedByTeacherId = currentUserId;
        submission.GradedAt = DateTime.UtcNow;
        submission.IsPassed = submission.Score >= submission.Assignment.PassingPoints;

        // Increment CompletedAssignmentsCount on ClassMember
        var member = await _context.TeachingClassMembers
            .FirstOrDefaultAsync(m => m.ClassId == submission.ClassId && m.StudentId == submission.StudentId, cancellationToken);

        if (member != null)
        {
            var completedAssignmentIds = await _context.StudentAssignmentSubmissions
                .Where(s => s.ClassId == submission.ClassId && s.StudentId == submission.StudentId &&
                    (s.Status == "SUBMITTED" || s.Status == "GRADED" || s.Status == "GRADING"))
                .Select(s => s.AssignmentId)
                .Distinct()
                .ToListAsync(cancellationToken);
            member.CompletedAssignmentsCount = completedAssignmentIds.Contains(submission.AssignmentId)
                ? completedAssignmentIds.Count
                : completedAssignmentIds.Count + 1;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return await GetSubmissionDetailAsync(submissionId, cancellationToken);
    }

    private static AssignmentSummaryDto MapToSummaryDto(TeachingAssignment a)
    {
        var totalPoints = a.Questions.Sum(q => q.Points);
        var targetClasses = a.Targets.Select(t => t.TeachingClass?.Name ?? string.Empty).Where(n => !string.IsNullOrEmpty(n)).ToList();
        var targetClassIds = a.Targets.Select(t => t.ClassId).ToList();
        var dueDate = a.Targets.Select(t => t.DueDate).Where(d => d.HasValue).OrderBy(d => d).FirstOrDefault();

        return new AssignmentSummaryDto
        {
            Id = a.Id,
            TeacherId = a.TeacherId,
            Title = a.Title,
            Description = a.Description,
            HskLevelId = a.HskLevelId,
            LessonId = a.LessonId,
            LessonTitle = a.Lesson != null ? (string.IsNullOrWhiteSpace(a.Lesson.TitleVi) ? a.Lesson.TitleZh : $"{a.Lesson.TitleZh} - {a.Lesson.TitleVi}") : null,
            Status = a.Status,
            TimeLimitMinutes = a.TimeLimitMinutes,
            MaxAttempts = a.MaxAttempts,
            RetakePolicy = a.RetakePolicy,
            PassingPoints = a.PassingPoints,
            AllowLateSubmission = a.AllowLateSubmission,
            QuestionsCount = a.Questions.Count,
            TotalPoints = totalPoints,
            AssignedClassNames = targetClasses,
            AssignedClassIds = targetClassIds,
            DueDate = dueDate,
            SubmissionsCount = a.Submissions.Count,
            PendingGradingCount = a.Submissions.Count(s => s.Status == "SUBMITTED" || s.Status == "GRADING"),
            CreatedAt = a.CreatedAt,
            PublishedAt = a.PublishedAt,
        };
    }

    private static AssignmentDetailDto MapToDetailDto(TeachingAssignment a)
    {
        var summary = MapToSummaryDto(a);
        return new AssignmentDetailDto
        {
            Id = summary.Id,
            TeacherId = summary.TeacherId,
            Title = summary.Title,
            Description = summary.Description,
            HskLevelId = summary.HskLevelId,
            LessonId = summary.LessonId,
            LessonTitle = summary.LessonTitle,
            Status = summary.Status,
            TimeLimitMinutes = summary.TimeLimitMinutes,
            MaxAttempts = summary.MaxAttempts,
            RetakePolicy = summary.RetakePolicy,
            PassingPoints = summary.PassingPoints,
            AllowLateSubmission = summary.AllowLateSubmission,
            QuestionsCount = summary.QuestionsCount,
            TotalPoints = summary.TotalPoints,
            AssignedClassNames = summary.AssignedClassNames,
            AssignedClassIds = summary.AssignedClassIds,
            DueDate = summary.DueDate,
            SubmissionsCount = summary.SubmissionsCount,
            PendingGradingCount = summary.PendingGradingCount,
            CreatedAt = summary.CreatedAt,
            PublishedAt = summary.PublishedAt,
            LatePenaltyPercent = a.LatePenaltyPercent,
            ShuffleQuestions = a.ShuffleQuestions,
            ShowCorrectAnswers = a.ShowCorrectAnswers,
            Questions = a.Questions.OrderBy(q => q.OrderIndex).Select(q =>
            {
                List<string>? opts = null;
                if (!string.IsNullOrWhiteSpace(q.OptionsJson))
                {
                    try { opts = JsonSerializer.Deserialize<List<string>>(q.OptionsJson); } catch { }
                }
                return new AssignmentQuestionDto
                {
                    Id = q.Id,
                    AssignmentId = q.AssignmentId,
                    QuestionBankItemId = q.QuestionBankItemId,
                    Prompt = q.Prompt,
                    QuestionType = q.QuestionType,
                    Options = opts,
                    CorrectAnswer = q.CorrectAnswer,
                    Explanation = q.Explanation,
                    Points = q.Points,
                    OrderIndex = q.OrderIndex,
                };
            }).ToList(),
            Targets = a.Targets.Select(t => new AssignmentTargetDto
            {
                Id = t.Id,
                ClassId = t.ClassId,
                ClassName = t.TeachingClass?.Name ?? string.Empty,
                ClassCode = t.TeachingClass?.Code ?? string.Empty,
                DueDate = t.DueDate,
                AssignedAt = t.AssignedAt,
            }).ToList(),
        };
    }
}
