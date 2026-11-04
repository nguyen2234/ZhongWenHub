namespace ZhongWenHub.Data.Entities.Content;

public class UnitEntity : BaseEntity
{
    public Guid CourseId { get; set; }
    public CourseEntity? Course { get; set; }

    public int UnitNumber { get; set; } = 1;
    public string TitleZh { get; set; } = string.Empty;
    public string TitleVi { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OrderIndex { get; set; } = 1;
    public string Status { get; set; } = "PUBLISHED";

    public ICollection<LessonEntity> Lessons { get; set; } = new List<LessonEntity>();
}

