namespace ZhongWenHub.Data.Entities.Content;

public class LessonVocabularyEntity
{
    public Guid LessonId { get; set; }
    public LessonEntity Lesson { get; set; } = null!;

    public Guid VocabularyId { get; set; }
    public VocabularyEntity Vocabulary { get; set; } = null!;

    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

