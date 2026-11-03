using System;

namespace ZhongWenHub.Data.Entities.Learning;

public class StudentPracticeAttempt : BaseEntity
{
    public Guid UserId { get; set; }
    public string ExerciseId { get; set; } = string.Empty;
    public string? QuestionId { get; set; }
    public string KnowledgePointId { get; set; } = string.Empty;
    public string TopicTitle { get; set; } = string.Empty;
    public string Category { get; set; } = "grammar"; // grammar, vocabulary, listening, reading, sentence
    public int HskLevel { get; set; } = 1;
    public string UserAnswer { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public DateTime AttemptedAt { get; set; } = DateTime.UtcNow;

    public virtual ApplicationUser? User { get; set; }
}
