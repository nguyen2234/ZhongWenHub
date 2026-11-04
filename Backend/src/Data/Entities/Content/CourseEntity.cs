namespace ZhongWenHub.Data.Entities.Content;

public class CourseEntity : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int HskLevel { get; set; } = 1;
    public string Status { get; set; } = "PUBLISHED";
    public int OrderIndex { get; set; } = 1;

    public ICollection<LessonEntity> Lessons { get; set; } = new List<LessonEntity>();
}
