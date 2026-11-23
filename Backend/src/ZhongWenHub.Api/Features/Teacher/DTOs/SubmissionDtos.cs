using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Business.Teacher.DTOs;

public class StudentAnswerItemDto
{
    [Required]
    public Guid QuestionId { get; set; }
    public string? SelectedOption { get; set; }
    public string? TextAnswer { get; set; }
}

public class SubmitHomeworkDto
{
    [Required]
    public List<StudentAnswerItemDto> Answers { get; set; } = new();
    public int TimeSpentSeconds { get; set; }
}

public class StudentHomeworkSummaryDto
{
    public Guid AssignmentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string HskLevelId { get; set; } = "level-hsk-1";
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public int TimeLimitMinutes { get; set; }
    public int MaxAttempts { get; set; }
    public int AttemptsUsed { get; set; }
    public string Status { get; set; } = "NOT_STARTED"; // NOT_STARTED, IN_PROGRESS, SUBMITTED, GRADED, LATE
    public double? BestScore { get; set; }
    public double MaxScore { get; set; }
    public bool? IsPassed { get; set; }
    public Guid? LastSubmissionId { get; set; }
}

public class StudentTakingQuestionDto
{
    public Guid Id { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string QuestionType { get; set; } = "SINGLE_CHOICE";
    public List<string>? Options { get; set; }
    public double Points { get; set; }
    public int OrderIndex { get; set; }
}

public class StudentAssignmentTakingDto
{
    public Guid SubmissionId { get; set; }
    public Guid AssignmentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int TimeLimitMinutes { get; set; }
    public int MaxAttempts { get; set; }
    public int AttemptNumber { get; set; }
    public DateTime StartedAt { get; set; }
    public double TotalPoints { get; set; }
    public List<StudentTakingQuestionDto> Questions { get; set; } = new();
}

public class QuestionReviewItemDto
{
    public Guid QuestionId { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string QuestionType { get; set; } = "SINGLE_CHOICE";
    public List<string>? Options { get; set; }
    public string? StudentAnswer { get; set; }
    public string? CorrectAnswer { get; set; }
    public string? Explanation { get; set; }
    public double PointsEarned { get; set; }
    public double MaxPoints { get; set; }
    public bool IsCorrect { get; set; }
}

public class StudentHomeworkResultDto
{
    public Guid SubmissionId { get; set; }
    public Guid AssignmentId { get; set; }
    public string AssignmentTitle { get; set; } = string.Empty;
    public double Score { get; set; }
    public double MaxScore { get; set; }
    public bool IsPassed { get; set; }
    public string Status { get; set; } = "SUBMITTED";
    public int TimeSpentSeconds { get; set; }
    public DateTime SubmittedAt { get; set; }
    public string? FeedbackNote { get; set; }
    public bool ShowReview { get; set; }
    public List<QuestionReviewItemDto>? ReviewQuestions { get; set; }
}

public class TeacherSubmissionItemDto
{
    public Guid Id { get; set; }
    public Guid AssignmentId { get; set; }
    public string AssignmentTitle { get; set; } = string.Empty;
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string? StudentAvatarUrl { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public int AttemptNumber { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public string Status { get; set; } = "SUBMITTED";
    public double Score { get; set; }
    public double MaxScore { get; set; }
    public bool IsPassed { get; set; }
    public int TimeSpentSeconds { get; set; }
    public string? FeedbackNote { get; set; }
    public DateTime? GradedAt { get; set; }
}

public class TeacherSubmissionDetailDto : TeacherSubmissionItemDto
{
    public List<QuestionReviewItemDto> Answers { get; set; } = new();
}

public class GradeSubmissionDto
{
    public double? CustomScore { get; set; }
    [MaxLength(2000)]
    public string? FeedbackNote { get; set; }
}
