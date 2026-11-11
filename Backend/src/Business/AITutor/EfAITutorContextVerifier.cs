using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ZhongWenHub.Business.AITutor.DTOs;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.AITutor;

public sealed class EfAITutorContextVerifier : IAITutorContextVerifier
{
    private static readonly HashSet<string> AllowedSources = new(StringComparer.OrdinalIgnoreCase)
    {
        "dashboard", "lesson", "vocabulary", "practice", "mistake", "general"
    };

    private readonly ApplicationDbContext _dbContext;

    public EfAITutorContextVerifier(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<VerifiedAITutorContext> VerifyAndNormalizeAsync(
        Guid userId,
        AITutorContextDto? requestedContext,
        CancellationToken cancellationToken = default)
    {
        var userInfo = await _dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.Id, u.Status })
            .FirstOrDefaultAsync(cancellationToken);

        if (userInfo is null || userInfo.Status != UserStatus.ACTIVE)
        {
            throw AITutorException.UnauthorizedUser();
        }

        var profileHskLevel = await _dbContext.StudentLearningProfiles
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .Select(p => (int?)p.SelectedHskLevel)
            .FirstOrDefaultAsync(cancellationToken);

        var requestedLevel = requestedContext?.HskLevel;
        var effectiveHskLevel = requestedLevel is >= 1 and <= 9
            ? requestedLevel.Value
            : (profileHskLevel is >= 1 and <= 9 ? profileHskLevel.Value : 2);

        var source = requestedContext?.Source is not null && AllowedSources.Contains(requestedContext.Source.Trim())
            ? requestedContext.Source.Trim().ToLowerInvariant()
            : "general";

        var languagePreference = string.Equals(requestedContext?.LanguagePreference?.Trim(), "English", StringComparison.OrdinalIgnoreCase)
            ? "English"
            : "Vietnamese";

        var verifiedLessonTitle = await ResolveVerifiedLessonTitleAsync(requestedContext, effectiveHskLevel, cancellationToken);
        var verifiedVocabulary = await ResolveVerifiedVocabularyAsync(requestedContext, effectiveHskLevel, cancellationToken);
        var verifiedExercise = await ResolveVerifiedExerciseAsync(requestedContext?.ExerciseContext, cancellationToken);

        var grammarPoints = SanitizeList(requestedContext?.GrammarPoints, maxItems: 3, maxLength: 80);
        var weaknesses = SanitizeList(requestedContext?.Weaknesses, maxItems: 3, maxLength: 80);

        return new VerifiedAITutorContext
        {
            EffectiveHskLevel = effectiveHskLevel,
            Source = source,
            LanguagePreference = languagePreference,
            VerifiedLessonTitle = verifiedLessonTitle,
            CurrentStep = Truncate(requestedContext?.CurrentStep, 60),
            GrammarPoints = grammarPoints,
            VerifiedVocabulary = verifiedVocabulary,
            VerifiedExercise = verifiedExercise,
            Weaknesses = weaknesses
        };
    }

    private async Task<string?> ResolveVerifiedLessonTitleAsync(
        AITutorContextDto? ctx,
        int hskLevel,
        CancellationToken cancellationToken)
    {
        if (ctx?.LessonId is JsonElement lessonIdEl && lessonIdEl.ValueKind != JsonValueKind.Null && lessonIdEl.ValueKind != JsonValueKind.Undefined)
        {
            if (lessonIdEl.ValueKind == JsonValueKind.String && Guid.TryParse(lessonIdEl.GetString(), out var lessonGuid))
            {
                var dbLesson = await _dbContext.Lessons
                    .AsNoTracking()
                    .Include(l => l.Course)
                    .Where(l => l.Id == lessonGuid && l.Status == "PUBLISHED")
                    .Select(l => new { l.LessonNumber, l.TitleZh, l.TitleVi, CourseHsk = l.Course != null ? l.Course.HskLevel : hskLevel })
                    .FirstOrDefaultAsync(cancellationToken);

                if (dbLesson is not null)
                {
                    return $"HSK {dbLesson.CourseHsk} - Bài {dbLesson.LessonNumber}: {dbLesson.TitleZh} ({dbLesson.TitleVi})";
                }
            }
            else if (TryExtractInt(lessonIdEl, out var lessonNumber) && lessonNumber > 0)
            {
                var dbLesson = await _dbContext.Lessons
                    .AsNoTracking()
                    .Include(l => l.Course)
                    .Where(l => l.LessonNumber == lessonNumber && l.Status == "PUBLISHED" && (l.Course == null || l.Course.HskLevel == hskLevel))
                    .Select(l => new { l.LessonNumber, l.TitleZh, l.TitleVi, CourseHsk = l.Course != null ? l.Course.HskLevel : hskLevel })
                    .FirstOrDefaultAsync(cancellationToken);

                if (dbLesson is not null)
                {
                    return $"HSK {dbLesson.CourseHsk} - Bài {dbLesson.LessonNumber}: {dbLesson.TitleZh} ({dbLesson.TitleVi})";
                }
            }
        }

        return Truncate(ctx?.LessonTitle, 120);
    }

    private async Task<VerifiedVocabularyInfo?> ResolveVerifiedVocabularyAsync(
        AITutorContextDto? ctx,
        int defaultHskLevel,
        CancellationToken cancellationToken)
    {
        // Prefer authoritative database lookup by vocabulary ID or Hanzi when available.
        if (ctx?.VocabularyIds is { Count: > 0 })
        {
            foreach (var idEl in ctx.VocabularyIds.Take(5))
            {
                if (idEl.ValueKind == JsonValueKind.String && Guid.TryParse(idEl.GetString(), out var vocabId))
                {
                    var dbVocab = await _dbContext.Vocabularies
                        .AsNoTracking()
                        .Where(v => v.Id == vocabId && v.Status == "PUBLISHED")
                        .Select(v => new { v.Hanzi, v.Pinyin, v.MeaningVi, v.HskLevel })
                        .FirstOrDefaultAsync(cancellationToken);

                    if (dbVocab is not null)
                    {
                        return new VerifiedVocabularyInfo
                        {
                            Hanzi = dbVocab.Hanzi,
                            Pinyin = dbVocab.Pinyin,
                            Meaning = dbVocab.MeaningVi,
                            HskLevel = dbVocab.HskLevel,
                            IsDatabaseVerified = true
                        };
                    }
                }
            }
        }

        var hanziInput = Truncate(ctx?.VocabularyWord?.Hanzi, 30);
        if (string.IsNullOrWhiteSpace(hanziInput))
        {
            return null;
        }

        var dbWord = await _dbContext.Vocabularies
            .AsNoTracking()
            .Where(v => v.Status == "PUBLISHED" && v.Hanzi == hanziInput)
            .OrderBy(v => v.HskLevel)
            .Select(v => new { v.Hanzi, v.Pinyin, v.MeaningVi, v.HskLevel })
            .FirstOrDefaultAsync(cancellationToken);

        if (dbWord is not null)
        {
            return new VerifiedVocabularyInfo
            {
                Hanzi = dbWord.Hanzi,
                Pinyin = dbWord.Pinyin,
                Meaning = dbWord.MeaningVi,
                HskLevel = dbWord.HskLevel,
                IsDatabaseVerified = true
            };
        }

        return new VerifiedVocabularyInfo
        {
            Hanzi = hanziInput,
            Pinyin = Truncate(ctx?.VocabularyWord?.Pinyin, 60) ?? string.Empty,
            Meaning = Truncate(ctx?.VocabularyWord?.Meaning, 140) ?? string.Empty,
            HskLevel = defaultHskLevel,
            IsDatabaseVerified = false
        };
    }

    private async Task<VerifiedExerciseInfo?> ResolveVerifiedExerciseAsync(
        AITutorExerciseContextDto? ex,
        CancellationToken cancellationToken)
    {
        if (ex is null)
        {
            return null;
        }

        if (ex.ExerciseId is JsonElement exIdEl &&
            exIdEl.ValueKind == JsonValueKind.String &&
            Guid.TryParse(exIdEl.GetString(), out var exerciseGuid))
        {
            var dbEx = await _dbContext.Exercises
                .AsNoTracking()
                .Where(e => e.Id == exerciseGuid && e.Status == "PUBLISHED")
                .Select(e => new
                {
                    e.Instruction,
                    e.PromptHanzi,
                    e.PromptPinyin,
                    e.PromptVietnamese,
                    e.CorrectAnswer,
                    e.Explanation
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (dbEx is not null)
            {
                return new VerifiedExerciseInfo
                {
                    Question = Truncate(dbEx.Instruction, 240) ?? string.Empty,
                    PromptHanzi = Truncate(dbEx.PromptHanzi, 200),
                    PromptPinyin = Truncate(dbEx.PromptPinyin, 240),
                    PromptVietnamese = Truncate(dbEx.PromptVietnamese, 240),
                    UserAnswer = Truncate(ex.UserAnswer, 180),
                    CorrectAnswer = Truncate(dbEx.CorrectAnswer, 180) ?? Truncate(ex.CorrectAnswer, 180),
                    Explanation = Truncate(dbEx.Explanation, 400),
                    IsDatabaseVerified = true
                };
            }
        }

        var question = Truncate(ex.Question, 240);
        if (string.IsNullOrWhiteSpace(question) && string.IsNullOrWhiteSpace(ex.PromptHanzi))
        {
            return null;
        }

        return new VerifiedExerciseInfo
        {
            Question = question ?? string.Empty,
            PromptHanzi = Truncate(ex.PromptHanzi, 200),
            PromptPinyin = Truncate(ex.PromptPinyin, 240),
            PromptVietnamese = Truncate(ex.PromptVietnamese, 240),
            UserAnswer = Truncate(ex.UserAnswer, 180),
            CorrectAnswer = Truncate(ex.CorrectAnswer, 180),
            Explanation = Truncate(ex.Explanation, 400),
            IsDatabaseVerified = false
        };
    }

    private static bool TryExtractInt(JsonElement el, out int value)
    {
        if (el.ValueKind == JsonValueKind.Number && el.TryGetInt32(out value))
        {
            return true;
        }

        if (el.ValueKind == JsonValueKind.String && int.TryParse(el.GetString(), out value))
        {
            return true;
        }

        value = 0;
        return false;
    }

    private static List<string> SanitizeList(IEnumerable<string>? items, int maxItems, int maxLength)
    {
        if (items is null) return new List<string>();
        return items
            .Select(s => Truncate(s, maxLength))
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s!)
            .Take(maxItems)
            .ToList();
    }

    private static string? Truncate(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
    }
}
