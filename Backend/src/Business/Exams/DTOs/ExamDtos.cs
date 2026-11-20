using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Business.Exams.DTOs;

public class ExamQuestionItemDto
{
    public Guid Id { get; set; }
    public Guid ExamId { get; set; }
    public Guid ExerciseId { get; set; }
    public string SectionName { get; set; } = "Đọc hiểu";
    public int OrderIndex { get; set; }
    public int Points { get; set; }
    public string ExerciseTitle { get; set; } = string.Empty;
    public string ExerciseType { get; set; } = string.Empty;
    public string ExerciseSkill { get; set; } = string.Empty;
    public int HskLevel { get; set; }
    public string? PromptHanzi { get; set; }
    public string? PromptPinyin { get; set; }
    public string? PromptVietnamese { get; set; }
    public string? OptionsJson { get; set; }
    public int? CorrectOptionIndex { get; set; }
    public string? CorrectAnswer { get; set; }
    public string? Explanation { get; set; }
}

public class ExamDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int HskLevel { get; set; }
    public string ExamType { get; set; } = "MOCK";
    public string? Description { get; set; }
    public string? Instructions { get; set; }
    public int DurationMinutes { get; set; }
    public int PassingScore { get; set; }
    public int TotalPoints { get; set; }
    public int QuestionCount { get; set; }
    public int AttemptCount { get; set; }
    public string Status { get; set; } = "DRAFT";
    public Guid? CreatedByUserId { get; set; }
    public Guid? UpdatedByUserId { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNotes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class ExamDetailDto : ExamDto
{
    public List<ExamQuestionItemDto> Questions { get; set; } = new();
}

public class ExamStatsDto
{
    public int Total { get; set; }
    public int Published { get; set; }
    public int Draft { get; set; }
    public int Pending { get; set; }
    public int Archived { get; set; }
    public Dictionary<int, int> ByHsk { get; set; } = new();
}

public class UpsertExamQuestionDto
{
    [Required(ErrorMessage = "ID câu hỏi từ Ngân hàng câu hỏi không được để trống.")]
    public Guid ExerciseId { get; set; }

    [StringLength(64)]
    public string SectionName { get; set; } = "Đọc hiểu";

    [Range(1, 500)]
    public int OrderIndex { get; set; } = 1;

    [Range(1, 100)]
    public int Points { get; set; } = 10;
}

public class CreateExamDto
{
    [Required(ErrorMessage = "Mã đề thi không được để trống.")]
    [StringLength(64)]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tên đề thi không được để trống.")]
    [StringLength(250)]
    public string Title { get; set; } = string.Empty;

    [Range(1, 6, ErrorMessage = "Cấp độ HSK phải nằm trong khoảng từ HSK 1 đến HSK 6.")]
    public int HskLevel { get; set; } = 1;

    [StringLength(32)]
    public string ExamType { get; set; } = "MOCK";

    [StringLength(1000)]
    public string? Description { get; set; }

    public string? Instructions { get; set; }

    [Range(1, 240, ErrorMessage = "Thời gian làm bài phải từ 1 đến 240 phút.")]
    public int DurationMinutes { get; set; } = 40;

    [Range(0, 10000, ErrorMessage = "Điểm đạt phải >= 0.")]
    public int PassingScore { get; set; } = 120;

    public string Status { get; set; } = "DRAFT";

    public List<UpsertExamQuestionDto>? Questions { get; set; }
}

public class UpdateExamDto
{
    [Required(ErrorMessage = "Mã đề thi không được để trống.")]
    [StringLength(64)]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tên đề thi không được để trống.")]
    [StringLength(250)]
    public string Title { get; set; } = string.Empty;

    [Range(1, 6, ErrorMessage = "Cấp độ HSK phải nằm trong khoảng từ HSK 1 đến HSK 6.")]
    public int HskLevel { get; set; } = 1;

    [StringLength(32)]
    public string ExamType { get; set; } = "MOCK";

    [StringLength(1000)]
    public string? Description { get; set; }

    public string? Instructions { get; set; }

    [Range(1, 240, ErrorMessage = "Thời gian làm bài phải từ 1 đến 240 phút.")]
    public int DurationMinutes { get; set; } = 40;

    [Range(0, 10000, ErrorMessage = "Điểm đạt phải >= 0.")]
    public int PassingScore { get; set; } = 120;
}

public class SetExamQuestionsDto
{
    [Required]
    public List<UpsertExamQuestionDto> Questions { get; set; } = new();
}

public class ReviewExamDto
{
    [Required(ErrorMessage = "Trạng thái không được để trống.")]
    public string Status { get; set; } = "PENDING_REVIEW";

    [StringLength(1000)]
    public string? ReviewNotes { get; set; }
}

