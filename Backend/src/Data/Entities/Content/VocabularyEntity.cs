namespace ZhongWenHub.Data.Entities.Content;

public class VocabularyEntity : BaseEntity
{
    public int HskLevel { get; set; } = 1;
    public string Hanzi { get; set; } = string.Empty;
    public string? Traditional { get; set; }
    public string Pinyin { get; set; } = string.Empty;
    public string MeaningVi { get; set; } = string.Empty;
    public string? MeaningEn { get; set; }
    public string? PartOfSpeech { get; set; }
    public string? AudioUrl { get; set; }
    public string? ExamplesJson { get; set; }
    public string Status { get; set; } = "PUBLISHED";

    public Guid? LessonId { get; set; }
    public LessonEntity? Lesson { get; set; }
}
