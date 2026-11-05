namespace ZhongWenHub.Data.Entities.Content;

public class LessonEntity : BaseEntity
{
    public Guid CourseId { get; set; }
    public CourseEntity? Course { get; set; }

    public Guid? UnitId { get; set; }
    public UnitEntity? Unit { get; set; }

    public int LessonNumber { get; set; } = 1;
    public string TitleZh { get; set; } = string.Empty;
    public string TitleVi { get; set; } = string.Empty;
    public string? Pinyin { get; set; }
    public string? Summary { get; set; }
    public int DurationMinutes { get; set; } = 30;
    public int XpReward { get; set; } = 50;
    public int OrderIndex { get; set; } = 1;
    public string Status { get; set; } = "PUBLISHED";

    public string? DialogueJson { get; set; }
    public string? ListeningJson { get; set; }

    public ICollection<VocabularyEntity> Vocabularies { get; set; } = new List<VocabularyEntity>();
    public ICollection<GrammarPointEntity> GrammarPoints { get; set; } = new List<GrammarPointEntity>();
    public ICollection<ExerciseEntity> Exercises { get; set; } = new List<ExerciseEntity>();
}
