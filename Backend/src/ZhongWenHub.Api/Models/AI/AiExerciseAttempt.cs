using System;

namespace ZhongWenHub.Data.Entities.AI;

public class AiExerciseAttempt : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid AiExerciseId { get; set; }
    public string UserAnswer { get; set; } = string.Empty;
    public int? SelectedIndex { get; set; }
    public bool IsCorrect { get; set; }
    public string SkillCategory { get; set; } = "vocabulary"; // vocabulary, grammar, hanzi, pinyin, reading, listening
    public DateTime AttemptedAt { get; set; } = DateTime.UtcNow;

    public virtual AiGeneratedExercise? AiExercise { get; set; }
}
