using ZhongWenHub.Business.AITutor.DTOs;

namespace ZhongWenHub.Business.AITutor;

public sealed class VerifiedAITutorContext
{
    public Guid UserId { get; init; }
    public int EffectiveHskLevel { get; init; } = 2;
    public string Source { get; init; } = "general";
    public string LanguagePreference { get; init; } = "Vietnamese";
    public Guid? VerifiedLessonId { get; init; }
    public string? VerifiedLessonTitle { get; init; }
    public string? LessonReadingPreview { get; init; }
    public string? LessonAcademicNote { get; init; }
    public string? CurrentStep { get; init; }
    public string? LearningGoal { get; init; }
    public List<string> GrammarPoints { get; init; } = new();
    public VerifiedGrammarInfo? VerifiedGrammar { get; init; }
    public List<string> LessonVocabularyPreview { get; init; } = new();
    public VerifiedVocabularyInfo? VerifiedVocabulary { get; init; }
    public VerifiedExerciseInfo? VerifiedExercise { get; init; }
    public List<string> Weaknesses { get; init; } = new();
}

public sealed class VerifiedGrammarInfo
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string StructureFormula { get; init; } = string.Empty;
    public string Explanation { get; init; } = string.Empty;
}

public sealed class VerifiedVocabularyInfo
{
    public string Hanzi { get; init; } = string.Empty;
    public string Pinyin { get; init; } = string.Empty;
    public string Meaning { get; init; } = string.Empty;
    public int HskLevel { get; init; }
    public List<string> Examples { get; init; } = new();
    public bool IsDatabaseVerified { get; init; }
}

public sealed class VerifiedExerciseInfo
{
    public string Question { get; init; } = string.Empty;
    public string? PromptHanzi { get; init; }
    public string? PromptPinyin { get; init; }
    public string? PromptVietnamese { get; init; }
    public string? UserAnswer { get; init; }
    public string? CorrectAnswer { get; init; }
    public string? Explanation { get; init; }
    public bool IsDatabaseVerified { get; init; }
}

public interface IAITutorContextVerifier
{
    Task<VerifiedAITutorContext> VerifyAndNormalizeAsync(
        Guid userId,
        AITutorContextDto? requestedContext,
        CancellationToken cancellationToken = default);
}
