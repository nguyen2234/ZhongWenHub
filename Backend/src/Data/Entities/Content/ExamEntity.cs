namespace ZhongWenHub.Data.Entities.Content;

public class ExamEntity : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int HskLevel { get; set; } = 1;
    public string ExamType { get; set; } = "MOCK"; // MOCK, PRACTICE, PLACEMENT, MIDTERM, FINAL
    public string? Description { get; set; }
    public string? Instructions { get; set; }
    public int DurationMinutes { get; set; } = 40;
    public int PassingScore { get; set; } = 120;
    public int TotalPoints { get; set; } = 0;
    public string Status { get; set; } = "DRAFT"; // DRAFT, PENDING_REVIEW, PUBLISHED, ARCHIVED
    public bool IsDeleted { get; set; } = false;

    public Guid? CreatedByUserId { get; set; }
    public Guid? UpdatedByUserId { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNotes { get; set; }

    public ICollection<ExamQuestionEntity> Questions { get; set; } = new List<ExamQuestionEntity>();
}
