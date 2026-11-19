using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Business.Authorization;
using ZhongWenHub.Business.Teacher.DTOs;
using ZhongWenHub.Business.Users;
using ZhongWenHub.Data.Entities.Teacher;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.Teacher.Services;

public class StudentHomeworkService : IStudentHomeworkService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<StudentHomeworkService> _logger;

    public StudentHomeworkService(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<StudentHomeworkService> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    private Guid GetCurrentStudentIdOrThrow()
    {
        var id = _currentUserService.UserId;
        if (!id.HasValue)
        {
            throw new UnauthorizedAccessException("Người dùng chưa được xác thực.");
        }
        return id.Value;
    }

    public async Task<IReadOnlyList<StudentHomeworkSummaryDto>> GetMyHomeworkListAsync(
        string? status = null,
        CancellationToken cancellationToken = default)
    {
        var studentId = GetCurrentStudentIdOrThrow();

        // Find classes where student is enrolled
        var enrolledClassIds = await _context.TeachingClassMembers
            .Where(m => m.StudentId == studentId && m.Status == "ACTIVE")
            .Select(m => m.ClassId)
            .ToListAsync(cancellationToken);

        if (enrolledClassIds.Count == 0)
        {
            return Array.Empty<StudentHomeworkSummaryDto>();
        }

        // Find assignment targets for these classes
        var targets = await _context.AssignmentTargets
            .Include(t => t.TeachingClass)
            .Include(t => t.Assignment)
                .ThenInclude(a => a.Questions)
            .Where(t => enrolledClassIds.Contains(t.ClassId) &&
                        (t.Assignment.Status == "PUBLISHED" || t.Assignment.Status == "CLOSED"))
            .ToListAsync(cancellationToken);

        // Fetch student's submissions for these assignments
        var assignmentIds = targets.Select(t => t.AssignmentId).Distinct().ToList();
        var submissions = await _context.StudentAssignmentSubmissions
            .Where(s => s.StudentId == studentId && assignmentIds.Contains(s.AssignmentId))
            .ToListAsync(cancellationToken);

        var list = new List<StudentHomeworkSummaryDto>();

        foreach (var target in targets)
        {
            var assignment = target.Assignment;
            var asgnSubmissions = submissions.Where(s => s.AssignmentId == assignment.Id).ToList();
            var attemptsUsed = asgnSubmissions.Count;
            var maxScore = assignment.Questions.Sum(q => q.Points);

            string st = "NOT_STARTED";
            double? bestScore = null;
            bool? isPassed = null;
            Guid? lastSubId = null;

            if (asgnSubmissions.Count > 0)
            {
                var latest = asgnSubmissions.OrderByDescending(s => s.AttemptNumber).First();
                lastSubId = latest.Id;
                st = latest.Status;

                var gradedOrSubmitted = asgnSubmissions.Where(s => s.Status == "GRADED" || s.Status == "SUBMITTED").ToList();
                if (gradedOrSubmitted.Count > 0)
                {
                    bestScore = gradedOrSubmitted.Max(s => s.Score);
                    isPassed = bestScore >= assignment.PassingPoints;
                }
            }

            if (!string.IsNullOrWhiteSpace(status) && !string.Equals(st, status.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            list.Add(new StudentHomeworkSummaryDto
            {
                AssignmentId = assignment.Id,
                Title = assignment.Title,
                Description = assignment.Description,
                HskLevelId = assignment.HskLevelId,
                ClassId = target.ClassId,
                ClassName = target.TeachingClass?.Name ?? string.Empty,
                DueDate = target.DueDate,
                TimeLimitMinutes = assignment.TimeLimitMinutes,
                MaxAttempts = assignment.MaxAttempts,
                AttemptsUsed = attemptsUsed,
                Status = st,
                BestScore = bestScore,
                MaxScore = maxScore,
                IsPassed = isPassed,
                LastSubmissionId = lastSubId,
            });
        }

        return list.OrderByDescending(h => h.DueDate ?? DateTime.MaxValue).ToList();
    }

    public async Task<StudentAssignmentTakingDto> StartHomeworkAttemptAsync(
        Guid assignmentId,
        CancellationToken cancellationToken = default)
    {
        var studentId = GetCurrentStudentIdOrThrow();

        // 1. Fetch assignment and targets
        var assignment = await _context.TeachingAssignments
            .Include(a => a.Questions)
            .Include(a => a.Targets)
            .FirstOrDefaultAsync(a => a.Id == assignmentId, cancellationToken);

        if (assignment == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy bài tập với mã {assignmentId}");
        }

        if (assignment.Status != "PUBLISHED")
        {
            throw new InvalidOperationException("Bài tập này hiện không mở để làm.");
        }

        // 2. Check student enrollment in target classes
        var targetClassIds = assignment.Targets.Select(t => t.ClassId).ToList();
        var enrolledClassMember = await _context.TeachingClassMembers
            .FirstOrDefaultAsync(m => m.StudentId == studentId && m.Status == "ACTIVE" && targetClassIds.Contains(m.ClassId), cancellationToken);

        if (enrolledClassMember == null)
        {
            throw new UnauthorizedAccessException("Bạn không thuộc lớp học được giao bài tập này.");
        }

        var classId = enrolledClassMember.ClassId;

        // 3. Check existing in-progress submission
        var inProgress = await _context.StudentAssignmentSubmissions
            .FirstOrDefaultAsync(s => s.AssignmentId == assignmentId && s.StudentId == studentId && s.Status == "IN_PROGRESS", cancellationToken);

        if (inProgress != null)
        {
            return MapToTakingDto(assignment, inProgress);
        }

        // 4. Check attempts
        var completedAttempts = await _context.StudentAssignmentSubmissions
            .CountAsync(s => s.AssignmentId == assignmentId && s.StudentId == studentId && s.Status != "IN_PROGRESS", cancellationToken);

        if (completedAttempts >= assignment.MaxAttempts)
        {
            throw new InvalidOperationException($"Bạn đã hoàn thành tối đa {assignment.MaxAttempts} lượt làm bài cho phép.");
        }

        // 5. Create new submission
        var submission = new StudentAssignmentSubmission
        {
            AssignmentId = assignmentId,
            StudentId = studentId,
            ClassId = classId,
            AttemptNumber = completedAttempts + 1,
            StartedAt = DateTime.UtcNow,
            Status = "IN_PROGRESS",
            Score = 0,
            MaxScore = assignment.Questions.Sum(q => q.Points),
            StudentAnswersJson = "[]",
        };

        _context.StudentAssignmentSubmissions.Add(submission);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToTakingDto(assignment, submission);
    }

    public async Task<StudentHomeworkResultDto> SubmitHomeworkAsync(
        Guid submissionId,
        SubmitHomeworkDto dto,
        CancellationToken cancellationToken = default)
    {
        var studentId = GetCurrentStudentIdOrThrow();

        var submission = await _context.StudentAssignmentSubmissions
            .Include(s => s.Assignment)
                .ThenInclude(a => a.Questions)
            .Include(s => s.Assignment)
                .ThenInclude(a => a.Targets)
            .FirstOrDefaultAsync(s => s.Id == submissionId, cancellationToken);

        if (submission == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy phiên làm bài {submissionId}");
        }

        if (submission.StudentId != studentId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền nộp bài này.");
        }

        if (submission.Status != "IN_PROGRESS")
        {
            throw new InvalidOperationException("Bài tập này đã được nộp trước đó.");
        }

        var assignment = submission.Assignment;
        if (assignment.Status != "PUBLISHED")
        {
            throw new InvalidOperationException("Bài tập không còn mở để nộp.");
        }

        var target = assignment.Targets.FirstOrDefault(t => t.ClassId == submission.ClassId);
        if (target == null)
        {
            throw new InvalidOperationException("Lớp học không còn được giao bài tập này.");
        }

        if (assignment.TimeLimitMinutes > 0 &&
            DateTime.UtcNow > submission.StartedAt.AddMinutes(assignment.TimeLimitMinutes))
        {
            throw new InvalidOperationException("Đã hết thời gian làm bài.");
        }

        var submittedAnswers = dto.Answers ?? new List<StudentAnswerItemDto>();
        if (submittedAnswers.GroupBy(a => a.QuestionId).Any(g => g.Count() > 1))
        {
            throw new ArgumentException("Danh sách câu trả lời chứa mã câu hỏi trùng lặp.");
        }

        submission.SubmittedAt = DateTime.UtcNow;
        submission.TimeSpentSeconds = Math.Max(0, dto.TimeSpentSeconds);
        submission.StudentAnswersJson = JsonSerializer.Serialize(dto.Answers ?? new List<StudentAnswerItemDto>());

        // Auto-grade objective questions
        double totalEarned = 0;
        double maxScore = 0;
        bool hasEssay = false;

        var answerMap = submittedAnswers.ToDictionary(a => a.QuestionId, a => a);

        foreach (var q in assignment.Questions)
        {
            maxScore += q.Points;
            answerMap.TryGetValue(q.Id, out var ans);
            var studentAns = ans?.SelectedOption ?? ans?.TextAnswer;

            if (q.QuestionType.Equals("ESSAY", StringComparison.OrdinalIgnoreCase))
            {
                hasEssay = true;
            }
            else
            {
                // Auto-grading for objective questions (case-insensitive trim)
                if (!string.IsNullOrWhiteSpace(studentAns) &&
                    string.Equals(studentAns.Trim(), q.CorrectAnswer.Trim(), StringComparison.OrdinalIgnoreCase))
                {
                    totalEarned += q.Points;
                }
            }
        }

        // Check late penalty
        bool isLate = target?.DueDate.HasValue == true && submission.SubmittedAt.Value > target.DueDate.Value;

        double finalScore = maxScore > 0 ? (totalEarned / maxScore) * 100.0 : 0.0;

        if (isLate)
        {
            if (!assignment.AllowLateSubmission)
            {
                submission.Status = "LATE";
                finalScore = 0;
            }
            else if (assignment.LatePenaltyPercent > 0)
            {
                finalScore = Math.Max(0, finalScore * (100 - assignment.LatePenaltyPercent) / 100.0);
                submission.Status = hasEssay ? "GRADING" : "GRADED";
            }
            else
            {
                submission.Status = hasEssay ? "GRADING" : "GRADED";
            }
        }
        else
        {
            submission.Status = hasEssay ? "GRADING" : "GRADED";
        }

        submission.Score = Math.Round(finalScore, 1);
        submission.MaxScore = 100.0;
        submission.IsPassed = submission.Score >= assignment.PassingPoints;

        // Update student's completed assignments count in class
        var member = await _context.TeachingClassMembers
            .FirstOrDefaultAsync(m => m.ClassId == submission.ClassId && m.StudentId == studentId, cancellationToken);

        if (member != null)
        {
            var completedAssignmentIds = await _context.StudentAssignmentSubmissions
                .Where(s => s.ClassId == submission.ClassId && s.StudentId == studentId &&
                    (s.Status == "SUBMITTED" || s.Status == "GRADED" || s.Status == "GRADING"))
                .Select(s => s.AssignmentId)
                .Distinct()
                .ToListAsync(cancellationToken);
            member.CompletedAssignmentsCount = completedAssignmentIds.Contains(assignment.Id)
                ? completedAssignmentIds.Count
                : completedAssignmentIds.Count + 1;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return await GetHomeworkResultAsync(submissionId, cancellationToken);
    }

    public async Task<StudentHomeworkResultDto> GetHomeworkResultAsync(
        Guid submissionId,
        CancellationToken cancellationToken = default)
    {
        var studentId = GetCurrentStudentIdOrThrow();

        var submission = await _context.StudentAssignmentSubmissions
            .Include(s => s.Assignment)
                .ThenInclude(a => a.Questions)
            .FirstOrDefaultAsync(s => s.Id == submissionId, cancellationToken);

        if (submission == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy bài làm với mã {submissionId}");
        }

        if (submission.StudentId != studentId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xem kết quả bài làm này.");
        }

        var assignment = submission.Assignment;
        var showReview = assignment.ShowCorrectAnswers && (submission.Status == "GRADED" || submission.Status == "SUBMITTED");

        List<QuestionReviewItemDto>? reviewQuestions = null;

        if (showReview)
        {
            List<StudentAnswerItemDto> answers = new();
            try
            {
                answers = JsonSerializer.Deserialize<List<StudentAnswerItemDto>>(submission.StudentAnswersJson) ?? new();
            }
            catch { }

            var answerMap = answers.ToDictionary(a => a.QuestionId, a => a);
            reviewQuestions = new List<QuestionReviewItemDto>();

            foreach (var q in assignment.Questions.OrderBy(q => q.OrderIndex))
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

                reviewQuestions.Add(new QuestionReviewItemDto
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
        }

        return new StudentHomeworkResultDto
        {
            SubmissionId = submission.Id,
            AssignmentId = assignment.Id,
            AssignmentTitle = assignment.Title,
            Score = submission.Score,
            MaxScore = submission.MaxScore,
            IsPassed = submission.IsPassed,
            Status = submission.Status,
            TimeSpentSeconds = submission.TimeSpentSeconds,
            SubmittedAt = submission.SubmittedAt ?? submission.StartedAt,
            FeedbackNote = submission.FeedbackNote,
            ShowReview = showReview,
            ReviewQuestions = reviewQuestions,
        };
    }

    private static StudentAssignmentTakingDto MapToTakingDto(TeachingAssignment assignment, StudentAssignmentSubmission submission)
    {
        var questions = assignment.Questions.OrderBy(q => q.OrderIndex).Select(q =>
        {
            List<string>? opts = null;
            if (!string.IsNullOrWhiteSpace(q.OptionsJson))
            {
                try { opts = JsonSerializer.Deserialize<List<string>>(q.OptionsJson); } catch { }
            }

            return new StudentTakingQuestionDto
            {
                Id = q.Id,
                Prompt = q.Prompt,
                QuestionType = q.QuestionType,
                Options = opts,
                Points = q.Points,
                OrderIndex = q.OrderIndex,
            };
        }).ToList();

        if (assignment.ShuffleQuestions)
        {
            var rng = new Random();
            questions = questions.OrderBy(_ => rng.Next()).ToList();
        }

        return new StudentAssignmentTakingDto
        {
            SubmissionId = submission.Id,
            AssignmentId = assignment.Id,
            Title = assignment.Title,
            Description = assignment.Description,
            TimeLimitMinutes = assignment.TimeLimitMinutes,
            MaxAttempts = assignment.MaxAttempts,
            AttemptNumber = submission.AttemptNumber,
            StartedAt = submission.StartedAt,
            TotalPoints = assignment.Questions.Sum(q => q.Points),
            Questions = questions,
        };
    }
}
