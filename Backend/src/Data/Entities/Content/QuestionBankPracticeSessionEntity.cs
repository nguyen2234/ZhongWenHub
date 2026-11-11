using ZhongWenHub.Data.Entities;

namespace ZhongWenHub.Data.Entities.Content;

/// <summary>
/// Persists a student's Question Bank practice session so grading, answer privacy,
/// and XP idempotency are enforced server-side.
/// </summary>
public class QuestionBankPracticeSessionEntity : BaseEntity
{
    public Guid UserId { get; set; }
    public ApplicationUser? User { get; set; }

    public int? HskLevel { get; set; }
    public string? Skill { get; set; }
    public string? Difficulty { get; set; }
    public string Mode { get; set; } = "random"; // random, weakness, mistake-review, skill, hsk-filter
    public string Status { get; set; } = "IN_PROGRESS"; // IN_PROGRESS, COMPLETED

    public int TotalQuestions { get; set; }
    public int CorrectCount { get; set; }
    public int XpAwarded { get; set; }
    public double Accuracy { get; set; }
    public int TimeSpentSeconds { get; set; }

    public string ExerciseIdsJson { get; set; } = "[]";
    public string SelectionReasonsJson { get; set; } = "{}";
    public string? AnswersJson { get; set; }

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}

