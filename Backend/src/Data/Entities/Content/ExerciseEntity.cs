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
}

