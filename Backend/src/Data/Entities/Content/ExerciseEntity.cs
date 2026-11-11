namespace ZhongWenHub.Data.Entities.Content;

public class ExerciseEntity : BaseEntity
{
    public string Type { get; set; } = "multiple-choice";
    public string Skill { get; set; } = "reading";
    public int HskLevel { get; set; } = 1;
    public string Title { get; set; } = string.Empty;
    public string Instruction { get; set; } = string.Empty;
    public string? PromptHanzi { get; set; }
    public string? PromptPinyin { get; set; }
    public string? PromptVietnamese { get; set; }
    public string? AudioUrl { get; set; }
    public string? OptionsJson { get; set; }
    public int? CorrectOptionIndex { get; set; }
    public string? CorrectAnswer { get; set; }
    public string? Explanation { get; set; }
    public int XpReward { get; set; } = 10;
    public string Status { get; set; } = "PUBLISHED";

    public Guid? LessonId { get; set; }
    public LessonEntity? Lesson { get; set; }

    public Guid? GrammarPointId { get; set; }
    public GrammarPointEntity? GrammarPoint { get; set; }

    public Guid? VocabularyId { get; set; }
    public VocabularyEntity? Vocabulary { get; set; }

    // Question Bank metadata, licensing & moderation workflow
    public string Difficulty { get; set; } = "MEDIUM"; // EASY, MEDIUM, HARD
    public string? Tags { get; set; }
    public string? SourceId { get; set; }
    public string? SourceLicense { get; set; }
    public string ReviewStatus { get; set; } = "DRAFT"; // DRAFT, PENDING_REVIEW, APPROVED, REJECTED
    public double? QualityScore { get; set; }
    public string? ContentHash { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNotes { get; set; }

    // Administrative approval metadata (separate from academic ReviewStatus and Status = PUBLISHED)
    public string AdministrativeApprovalStatus { get; set; } = "NONE"; // NONE, APPROVED, REVOKED
    public string? AdministrativeApprovalScope { get; set; }
    public string? AdministrativeApprovalSource { get; set; }
    public string? AdministrativeApprovalNotes { get; set; }
    public DateTime? AdministrativeApprovedAt { get; set; }
    public string HumanAcademicReviewStatus { get; set; } = "NOT_REVIEWED"; // NOT_REVIEWED, PENDING_HUMAN_REVIEW, APPROVED_BASELINE, REJECTED
}

