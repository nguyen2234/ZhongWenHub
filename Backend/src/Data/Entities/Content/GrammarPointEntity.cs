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

    public Guid? LessonId { get; set; }
    public LessonEntity? Lesson { get; set; }
}

