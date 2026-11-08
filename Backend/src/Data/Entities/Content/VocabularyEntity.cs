namespace ZhongWenHub.Data.Entities.Content;

public class VocabularyEntity : BaseEntity
{
    public int HskLevel { get; set; } = 1;
    public string Hanzi { get; set; } = string.Empty;
    public string? Traditional { get; set; }
    public string Pinyin { get; set; } = string.Empty;
    public string MeaningVi { get; set; } = string.Empty;
    public string? SuggestedMeaningVi { get; set; }
    public string? MeaningEn { get; set; }
    public string? PartOfSpeech { get; set; }
    public string? AudioUrl { get; set; }
    public string? ExamplesJson { get; set; }
    public string Status { get; set; } = "PUBLISHED";

    // HSK 3.0 Dataset Metadata
    public string? SourceDataset { get; set; }
    public string? SourceEntryId { get; set; }
    public string? SourceId { get; set; }
    public string? Entry { get; set; }
    public string? Homograph { get; set; }
    public string? LevelLabel { get; set; }
    public int? SourcePdfPage { get; set; }

    // Content Review & Audit
    public Guid? UpdatedByUserId { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNotes { get; set; }

    public Guid? LessonId { get; set; }
    public LessonEntity? Lesson { get; set; }
}

