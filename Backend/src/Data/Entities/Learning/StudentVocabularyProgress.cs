using System;

namespace ZhongWenHub.Data.Entities.Learning;

public class StudentVocabularyProgress : BaseEntity
{
    public Guid UserId { get; set; }
    public string VocabularyId { get; set; } = string.Empty;
    public string? Hanzi { get; set; }
    public string? Pinyin { get; set; }
    public string Status { get; set; } = "learning"; // new, learning, reviewing, mastered
    public DateTime FirstLearnedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastReviewedAt { get; set; } = DateTime.UtcNow;
    public DateTime NextReviewAt { get; set; } = DateTime.UtcNow;
    public int ReviewCount { get; set; } = 0;
    public int CorrectCount { get; set; } = 0;
    public int SrsStage { get; set; } = 0;
    public double Stability { get; set; } = 1.0;
    public double Difficulty { get; set; } = 5.0;
    public int IntervalDays { get; set; } = 1;
    public int Repetitions { get; set; } = 0;
    public double EaseFactor { get; set; } = 2.5;

    public virtual ApplicationUser? User { get; set; }
}
