using System;

namespace ZhongWenHub.Data.Entities.AI;

public class AiGeneratedExercise : BaseEntity
{
    public Guid UserId { get; set; }
    public int HskLevel { get; set; } = 1;
    public Guid? LessonId { get; set; }
    public string SourceType { get; set; } = "VOCABULARY"; // VOCABULARY, GRAMMAR, READING, WEAKNESS
    public string ExerciseType { get; set; } = "multiple-choice"; // multiple-choice, fill-blank, sentence-order, meaning-match, pinyin-match, error-correction
    public string OriginTag { get; set; } = "AI_GENERATED";
    public string AcademicStatus { get; set; } = "UNAPPROVED_EXPERIMENTAL";
    public string? SourceReviewNote { get; set; }
    public string PromptZh { get; set; } = string.Empty;
    public string? PromptPinyin { get; set; }
    public string? PromptVi { get; set; }
    public string? OptionsJson { get; set; }
    public int? CorrectIndex { get; set; }
    public string? CorrectAnswer { get; set; }
    public string ExplanationVi { get; set; } = string.Empty;
    public string? MetadataJson { get; set; }

    public virtual ApplicationUser? User { get; set; }
}
