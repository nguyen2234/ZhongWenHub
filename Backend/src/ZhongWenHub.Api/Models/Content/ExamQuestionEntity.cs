namespace ZhongWenHub.Data.Entities.Content;

public class ExamQuestionEntity : BaseEntity
{
    public Guid ExamId { get; set; }
    public ExamEntity? Exam { get; set; }

    public Guid ExerciseId { get; set; }
    public ExerciseEntity? Exercise { get; set; }

    public string SectionName { get; set; } = "Đọc hiểu"; // Nghe hiểu, Đọc hiểu, Viết
    public int OrderIndex { get; set; } = 1;
    public int Points { get; set; } = 10;
}

