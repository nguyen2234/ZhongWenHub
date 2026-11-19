using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Business.Teacher.DTOs;

public class CreateAssignmentQuestionDto
{
    public Guid? QuestionBankItemId { get; set; }

    [Required]
    [MaxLength(4000)]
    public string Prompt { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string QuestionType { get; set; } = "SINGLE_CHOICE";

    public List<string>? Options { get; set; }

    [Required]
    [MaxLength(2000)]
    public string CorrectAnswer { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Explanation { get; set; }

    public double Points { get; set; } = 10.0;

    public int OrderIndex { get; set; } = 0;
}

public class AssignmentQuestionDto
{
    public Guid Id { get; set; }
    public Guid AssignmentId { get; set; }
    public Guid? QuestionBankItemId { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string QuestionType { get; set; } = "SINGLE_CHOICE";
    public List<string>? Options { get; set; }
    public string CorrectAnswer { get; set; } = string.Empty;
    public string? Explanation { get; set; }
    public double Points { get; set; } = 10.0;
    public int OrderIndex { get; set; } = 0;
}

public class CreateAssignmentDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string HskLevelId { get; set; } = "level-hsk-1";

    public Guid? LessonId { get; set; }

    public int TimeLimitMinutes { get; set; } = 0;

    public int MaxAttempts { get; set; } = 1;

    [MaxLength(30)]
    public string RetakePolicy { get; set; } = "HIGHEST_SCORE";

    public double PassingPoints { get; set; } = 60.0;

    public bool AllowLateSubmission { get; set; } = true;

    public int LatePenaltyPercent { get; set; } = 0;

    public bool ShuffleQuestions { get; set; } = false;

    public bool ShowCorrectAnswers { get; set; } = true;

    public List<Guid>? ClassIds { get; set; }

    public DateTime? DueDate { get; set; }

    public List<CreateAssignmentQuestionDto> Questions { get; set; } = new();
}

public class UpdateAssignmentDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string HskLevelId { get; set; } = "level-hsk-1";

    public Guid? LessonId { get; set; }

    public int TimeLimitMinutes { get; set; } = 0;

    public int MaxAttempts { get; set; } = 1;

    [MaxLength(30)]
    public string RetakePolicy { get; set; } = "HIGHEST_SCORE";

    public double PassingPoints { get; set; } = 60.0;

    public bool AllowLateSubmission { get; set; } = true;

    public int LatePenaltyPercent { get; set; } = 0;

    public bool ShuffleQuestions { get; set; } = false;

    public bool ShowCorrectAnswers { get; set; } = true;

    public List<Guid>? ClassIds { get; set; }

    public DateTime? DueDate { get; set; }

    public List<CreateAssignmentQuestionDto> Questions { get; set; } = new();
}

public class AssignmentTargetDto
{
    public Guid Id { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string ClassCode { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public DateTime AssignedAt { get; set; }
}

public class AssignmentSummaryDto
{
    public Guid Id { get; set; }
    public Guid TeacherId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string HskLevelId { get; set; } = "level-hsk-1";
    public Guid? LessonId { get; set; }
    public string? LessonTitle { get; set; }
    public string Status { get; set; } = "DRAFT";
    public int TimeLimitMinutes { get; set; }
    public int MaxAttempts { get; set; }
    public string RetakePolicy { get; set; } = "HIGHEST_SCORE";
    public double PassingPoints { get; set; }
    public bool AllowLateSubmission { get; set; }
    public int QuestionsCount { get; set; }
    public double TotalPoints { get; set; }
    public List<string> AssignedClassNames { get; set; } = new();
    public List<Guid> AssignedClassIds { get; set; } = new();
    public DateTime? DueDate { get; set; }
    public int SubmissionsCount { get; set; }
    public int PendingGradingCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
}

public class AssignmentDetailDto : AssignmentSummaryDto
{
    public int LatePenaltyPercent { get; set; }
    public bool ShuffleQuestions { get; set; }
    public bool ShowCorrectAnswers { get; set; }
    public List<AssignmentQuestionDto> Questions { get; set; } = new();
    public List<AssignmentTargetDto> Targets { get; set; } = new();
}

public class AssignmentFilterDto
{
    public Guid? ClassId { get; set; }
    public string? Status { get; set; }
    public string? HskLevelId { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
