using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Business.Content.DTOs;

public class CourseDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int HskLevel { get; set; }
    public string Status { get; set; } = "PUBLISHED";
    public int OrderIndex { get; set; }
    public int LessonCount { get; set; }
    public int PublishedLessonCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateCourseDto
{
    [Required(ErrorMessage = "Mã khóa học không được để trống.")]
    [StringLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tiêu đề khóa học không được để trống.")]
    [StringLength(150)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Range(1, 6)]
    public int HskLevel { get; set; } = 1;

    public string Status { get; set; } = "PUBLISHED";
    public int OrderIndex { get; set; } = 1;
}

public class UpdateCourseDto
{
    [Required(ErrorMessage = "Tiêu đề khóa học không được để trống.")]
    [StringLength(150)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Range(1, 6)]
    public int HskLevel { get; set; } = 1;

    public string Status { get; set; } = "PUBLISHED";
    public int OrderIndex { get; set; } = 1;
}

public class LessonDto
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public int LessonNumber { get; set; }
    public string TitleZh { get; set; } = string.Empty;
    public string TitleVi { get; set; } = string.Empty;
    public string? Pinyin { get; set; }
    public string? Summary { get; set; }
    public int DurationMinutes { get; set; }
    public int XpReward { get; set; }
    public int OrderIndex { get; set; }
    public string Status { get; set; } = "PUBLISHED";
    public int VocabularyCount { get; set; }
    public int GrammarCount { get; set; }
    public int ExerciseCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class LessonDetailDto : LessonDto
{
    public List<VocabularyDto> Vocabularies { get; set; } = new();
    public List<GrammarPointDto> GrammarPoints { get; set; } = new();
    public List<ExerciseDto> Exercises { get; set; } = new();
}

public class CreateLessonDto
{
    [Required]
    public Guid CourseId { get; set; }

    [Range(1, 100)]
    public int LessonNumber { get; set; } = 1;

    [Required(ErrorMessage = "Tiêu đề tiếng Trung không được để trống.")]
    [StringLength(150)]
    public string TitleZh { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tiêu đề tiếng Việt không được để trống.")]
    [StringLength(150)]
    public string TitleVi { get; set; } = string.Empty;

    public string? Pinyin { get; set; }
    public string? Summary { get; set; }
    public int DurationMinutes { get; set; } = 30;
    public int XpReward { get; set; } = 50;
    public int OrderIndex { get; set; } = 1;
    public string Status { get; set; } = "PUBLISHED";
}

public class UpdateLessonDto
{
    [Range(1, 100)]
    public int LessonNumber { get; set; } = 1;

    [Required(ErrorMessage = "Tiêu đề tiếng Trung không được để trống.")]
    [StringLength(150)]
    public string TitleZh { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tiêu đề tiếng Việt không được để trống.")]
    [StringLength(150)]
    public string TitleVi { get; set; } = string.Empty;

    public string? Pinyin { get; set; }
    public string? Summary { get; set; }
    public int DurationMinutes { get; set; } = 30;
    public int XpReward { get; set; } = 50;
    public int OrderIndex { get; set; } = 1;
    public string Status { get; set; } = "PUBLISHED";
}

public class VocabularyDto
{
    public Guid Id { get; set; }
    public int HskLevel { get; set; }
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
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateVocabularyDto
{
    [Range(1, 6)]
    public int HskLevel { get; set; } = 1;

    [Required(ErrorMessage = "Chữ Hán không được để trống.")]
    [StringLength(50)]
    public string Hanzi { get; set; } = string.Empty;

    public string? Traditional { get; set; }

    [Required(ErrorMessage = "Pinyin không được để trống.")]
    [StringLength(100)]
    public string Pinyin { get; set; } = string.Empty;

    [Required(ErrorMessage = "Nghĩa tiếng Việt không được để trống.")]
    [StringLength(255)]
    public string MeaningVi { get; set; } = string.Empty;

    public string? MeaningEn { get; set; }
    public string? PartOfSpeech { get; set; }
    public string? AudioUrl { get; set; }
    public string? ExamplesJson { get; set; }
    public string Status { get; set; } = "PUBLISHED";
    public Guid? LessonId { get; set; }
}

public class UpdateVocabularyDto : CreateVocabularyDto
{
}

public class GrammarPointDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string PinyinTitle { get; set; } = string.Empty;
    public int HskLevel { get; set; }
    public string Category { get; set; } = "cơ bản";
    public string StructureFormula { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
    public string Difficulty { get; set; } = "Dễ";
    public string ExamplesJson { get; set; } = "[]";
    public string? PracticeJson { get; set; }
    public string Status { get; set; } = "PUBLISHED";
    public Guid? LessonId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateGrammarPointDto
{
    [Required(ErrorMessage = "Mã ngữ pháp không được để trống.")]
    [StringLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tiêu đề không được để trống.")]
    [StringLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Pinyin không được để trống.")]
    [StringLength(150)]
    public string PinyinTitle { get; set; } = string.Empty;

    [Range(1, 6)]
    public int HskLevel { get; set; } = 1;

    [Required]
    public string Category { get; set; } = "cơ bản";

    [Required]
    public string StructureFormula { get; set; } = string.Empty;

    [Required]
    public string Explanation { get; set; } = string.Empty;

    public string Difficulty { get; set; } = "Dễ";
    public string ExamplesJson { get; set; } = "[]";
    public string? PracticeJson { get; set; }
    public string Status { get; set; } = "PUBLISHED";
    public Guid? LessonId { get; set; }
}

public class UpdateGrammarPointDto
{
    [Required(ErrorMessage = "Tiêu đề không được để trống.")]
    [StringLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Pinyin không được để trống.")]
    [StringLength(150)]
    public string PinyinTitle { get; set; } = string.Empty;

    [Range(1, 6)]
    public int HskLevel { get; set; } = 1;

    [Required]
    public string Category { get; set; } = "cơ bản";

    [Required]
    public string StructureFormula { get; set; } = string.Empty;

    [Required]
    public string Explanation { get; set; } = string.Empty;

    public string Difficulty { get; set; } = "Dễ";
    public string ExamplesJson { get; set; } = "[]";
    public string? PracticeJson { get; set; }
    public string Status { get; set; } = "PUBLISHED";
    public Guid? LessonId { get; set; }
}

public class ExerciseDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = "multiple-choice";
    public string Skill { get; set; } = "reading";
    public int HskLevel { get; set; }
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
    public Guid? GrammarPointId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateExerciseDto
{
    [Required]
    public string Type { get; set; } = "multiple-choice";

    [Required]
    public string Skill { get; set; } = "reading";

    [Range(1, 6)]
    public int HskLevel { get; set; } = 1;

    [Required(ErrorMessage = "Tiêu đề bài tập không được để trống.")]
    [StringLength(255)]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Hướng dẫn làm bài không được để trống.")]
    [StringLength(500)]
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
    public Guid? GrammarPointId { get; set; }
}

public class UpdateExerciseDto : CreateExerciseDto
{
}

public class UpdateContentStatusDto
{
    [Required(ErrorMessage = "Trạng thái không được để trống.")]
    public string Status { get; set; } = "PUBLISHED";
}
