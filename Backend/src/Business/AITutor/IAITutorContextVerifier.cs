using ZhongWenHub.Business.AITutor.DTOs;

namespace ZhongWenHub.Business.AITutor;

public sealed class VerifiedAITutorContext
{
    public int EffectiveHskLevel { get; init; } = 2;
    public string Source { get; init; } = "general";
    public string LanguagePreference { get; init; } = "Vietnamese";
    public string? VerifiedLessonTitle { get; init; }
    public string? CurrentStep { get; init; }
    public List<string> GrammarPoints { get; init; } = new();
    public VerifiedVocabularyInfo? VerifiedVocabulary { get; init; }
    public VerifiedExerciseInfo? VerifiedExercise { get; init; }
    public List<string> Weaknesses { get; init; } = new();
}

public sealed class VerifiedVocabularyInfo
{
    public string Hanzi { get; init; } = string.Empty;
    public string Pinyin { get; init; } = string.Empty;
    public string Meaning { get; init; } = string.Empty;
    public int HskLevel { get; init; }
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
