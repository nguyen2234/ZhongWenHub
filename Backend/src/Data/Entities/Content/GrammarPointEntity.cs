namespace ZhongWenHub.Data.Entities.Content;

public class GrammarPointEntity : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string PinyinTitle { get; set; } = string.Empty;
    public int HskLevel { get; set; } = 1;
    public string Category { get; set; } = "cơ bản";
    public string StructureFormula { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
    public string Difficulty { get; set; } = "Dễ";
    public string ExamplesJson { get; set; } = "[]";
    public string? PracticeJson { get; set; }
    public string Status { get; set; } = "PUBLISHED";

    // HSK 3.0 Dataset Metadata
    public string? GrammarType { get; set; }
    public string? CategoryType { get; set; }
    public string? RawExplanationCn { get; set; }
    public string? SourceDataset { get; set; }
    public string? SourceEntryId { get; set; }

    // Content Review & Audit
    public Guid? UpdatedByUserId { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNotes { get; set; }

    public Guid? LessonId { get; set; }
    public LessonEntity? Lesson { get; set; }
}

