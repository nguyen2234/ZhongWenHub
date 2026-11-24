using System;
using ZhongWenHub.Models.Users;

namespace ZhongWenHub.Models.AI;

public class AiSpeakingAttempt : BaseEntity
{
    public Guid UserId { get; set; }
    public string PracticeType { get; set; } = "WORD"; // WORD, SENTENCE, SCENARIO
    public int HskLevel { get; set; } = 1;
    public string TargetTextZh { get; set; } = string.Empty;
    public string? TargetPinyin { get; set; }
    public string? TargetMeaningVi { get; set; }
    public string? RecognizedTranscriptZh { get; set; }
    public double TranscriptAccuracyPercent { get; set; }
    public double OverallPronunciationScore { get; set; }
    public string AssessmentMethod { get; set; } = "TRANSCRIPT_ALIGNMENT"; // TRANSCRIPT_ALIGNMENT, ACOUSTIC_MODEL
    public bool HasAcousticToneData { get; set; } = false;
    public string? EvaluationFeedbackVi { get; set; }
    public string? WordBreakdownJson { get; set; } // JSON array of matched/missed details
    public int DurationSeconds { get; set; }
    public string AudioStorageStatus { get; set; } = "PROCESSED_DISCARDED"; // PROCESSED_DISCARDED, PURGED
    public DateTime AttemptedAt { get; set; } = DateTime.UtcNow;

    public virtual ApplicationUser? User { get; set; }
}

